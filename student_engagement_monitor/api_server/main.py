"""
FastAPI Server for Student Engagement Monitor
Exposes engagement analysis as REST APIs for offline integration
"""

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, List, Optional
import sys
from pathlib import Path
import uuid
import json
from datetime import datetime
import cv2
import numpy as np

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from cctv_pipeline.engagement_processor import EngagementProcessor
from utils import load_config

app = FastAPI(title="Student Engagement Monitor API", version="1.0.0")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processor
config_path = str(Path(__file__).parent.parent / 'configs' / 'config.yaml')
model_dir = str(Path(__file__).parent.parent / 'models' / 'trained')
processor = EngagementProcessor(config_path, model_dir)

# Storage directories
VIDEOS_DIR = Path(__file__).parent.parent / 'data' / 'videos'
REPORTS_DIR = Path(__file__).parent.parent / 'outputs' / 'reports'
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# In-memory cache for processed results (replace with database in production)
results_cache: Dict[str, dict] = {}


# Request/Response Models
class ProcessVideoRequest(BaseModel):
    lecture_id: str
    subject: Optional[str] = None
    topic: Optional[str] = None


class EngagementResult(BaseModel):
    lecture_id: str
    total_frames_processed: int
    total_students_detected: int
    average_class_engagement: float
    average_highly_engaged: float
    average_disengaged: float
    timeline: List[dict]


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Student Engagement Monitor API",
        "version": "1.0.0"
    }


@app.post("/api/process-video")
async def process_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    lecture_id: str = None,
    subject: str = None,
    topic: str = None
):
    """
    Upload and process a lecture video
    
    Args:
        file: Video file (MP4, AVI, MOV)
        lecture_id: Unique identifier for the lecture
        subject: Subject name (optional)
        topic: Topic name (optional)
    
    Returns:
        Processing job ID and status
    """
    try:
        # Generate lecture ID if not provided
        if not lecture_id:
            lecture_id = str(uuid.uuid4())
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('video'):
            raise HTTPException(status_code=400, detail="File must be a video")
        
        # Save uploaded file
        video_path = VIDEOS_DIR / f"{lecture_id}.{file.filename.split('.')[-1]}"
        
        with open(video_path, 'wb') as f:
            content = await file.read()
            f.write(content)
        
        # Add background processing task
        background_tasks.add_task(
            process_video_background,
            str(video_path),
            lecture_id,
            subject,
            topic
        )
        
        return JSONResponse(content={
            "success": True,
            "lecture_id": lecture_id,
            "message": "Video uploaded successfully. Processing started.",
            "status": "processing"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def process_video_background(
    video_path: str,
    lecture_id: str,
    subject: Optional[str],
    topic: Optional[str]
):
    """Background task to process video"""
    try:
        print(f"🎬 Processing video: {lecture_id}")
        
        # Reset processor state
        processor.reset()
        
        # Open video
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Could not open video: {video_path}")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        all_results = []
        frame_idx = 0
        skip_frames = 3  # Process every 3rd frame
        
        print(f"  Total frames: {total_frames}, FPS: {fps}")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame at intervals
            if frame_idx % skip_frames == 0:
                results = processor.process_frame(frame)
                all_results.append(results)
            
            frame_idx += 1
        
        cap.release()
        
        # Generate summary
        if all_results:
            total_students_detected = max([r['total_students'] for r in all_results])
            avg_class_engagement = np.mean([r['class_engagement'] for r in all_results])
            avg_highly_engaged = np.mean([r['highly_engaged'] for r in all_results])
            avg_disengaged = np.mean([r['disengaged'] for r in all_results])
            
            # Create timeline
            engagement_timeline = [
                {
                    'frame': r['frame_number'],
                    'engagement': r['class_engagement'],
                    'students': r['total_students'],
                    'highly_engaged': r['highly_engaged'],
                    'disengaged': r['disengaged']
                }
                for r in all_results
            ]
            
            # Compile report
            report = {
                'lecture_id': lecture_id,
                'subject': subject,
                'topic': topic,
                'timestamp': datetime.now().isoformat(),
                'video_path': video_path,
                'total_frames_processed': len(all_results),
                'fps': fps,
                'duration_seconds': total_frames / fps if fps > 0 else 0,
                'summary': {
                    'total_students_detected': int(total_students_detected),
                    'average_class_engagement': float(avg_class_engagement),
                    'average_highly_engaged': float(avg_highly_engaged),
                    'average_disengaged': float(avg_disengaged)
                },
                'timeline': engagement_timeline,
                'status': 'completed'
            }
            
            # Save report
            report_file = REPORTS_DIR / f'{lecture_id}_report.json'
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            
            # Cache results
            results_cache[lecture_id] = report
            
            print(f"✅ Processing complete: {lecture_id}")
            print(f"  Processed {len(all_results)} frames")
            print(f"  Average engagement: {avg_class_engagement:.3f}")
        
    except Exception as e:
        print(f"❌ Error processing video {lecture_id}: {e}")
        results_cache[lecture_id] = {
            'lecture_id': lecture_id,
            'status': 'error',
            'error': str(e)
        }


@app.get("/api/engagement/{lecture_id}")
async def get_engagement(lecture_id: str):
    """
    Get engagement data for a specific lecture
    
    Args:
        lecture_id: Lecture identifier
    
    Returns:
        Engagement analysis results
    """
    # Check cache first
    if lecture_id in results_cache:
        return results_cache[lecture_id]
    
    # Check if report file exists
    report_file = REPORTS_DIR / f'{lecture_id}_report.json'
    if report_file.exists():
        with open(report_file, 'r') as f:
            data = json.load(f)
            results_cache[lecture_id] = data
            return data
    
    raise HTTPException(status_code=404, detail="Lecture not found")


@app.get("/api/lectures")
async def list_lectures():
    """
    List all processed lectures
    
    Returns:
        List of lecture IDs and summaries
    """
    lectures = []
    
    for report_file in REPORTS_DIR.glob('*_report.json'):
        with open(report_file, 'r') as f:
            data = json.load(f)
            lectures.append({
                'lecture_id': data['lecture_id'],
                'subject': data.get('subject'),
                'topic': data.get('topic'),
                'timestamp': data.get('timestamp'),
                'status': data.get('status'),
                'avg_engagement': data.get('summary', {}).get('average_class_engagement')
            })
    
    return {'lectures': lectures, 'total': len(lectures)}


@app.delete("/api/engagement/{lecture_id}")
async def delete_lecture(lecture_id: str):
    """Delete lecture data"""
    # Remove from cache
    if lecture_id in results_cache:
        del results_cache[lecture_id]
    
    # Remove report file
    report_file = REPORTS_DIR / f'{lecture_id}_report.json'
    if report_file.exists():
        report_file.unlink()
    
    # Remove video file
    for ext in ['mp4', 'avi', 'mov']:
        video_file = VIDEOS_DIR / f'{lecture_id}.{ext}'
        if video_file.exists():
            video_file.unlink()
    
    return {'success': True, 'message': 'Lecture deleted'}


if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("Student Engagement Monitor - FastAPI Server")
    print("=" * 70)
    print(f"Config: {config_path}")
    print(f"Models: {model_dir}")
    print(f"Videos: {VIDEOS_DIR}")
    print(f"Reports: {REPORTS_DIR}")
    print("=" * 70)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
