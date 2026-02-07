"""
Frame Extractor
Extracts frames from video files for feature extraction
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Optional, Tuple, Dict
from tqdm import tqdm


class FrameExtractor:
    """Extract frames from video files"""
    
    def __init__(self, target_fps: int = 5, resize: Optional[Tuple[int, int]] = None):
        """
        Initialize frame extractor
        
        Args:
            target_fps: Target frames per second to extract
            resize: Optional (width, height) to resize frames
        """
        self.target_fps = target_fps
        self.resize = resize
    
    def extract_frames(self, video_path: str, output_dir: Optional[str] = None,
                      save_frames: bool = False) -> List[np.ndarray]:
        """
        Extract frames from video
        
        Args:
            video_path: Path to video file
            output_dir: Directory to save frames (if save_frames=True)
            save_frames: Whether to save frames to disk
            
        Returns:
            List of frame arrays
        """
        video_path = Path(video_path)
        
        if not video_path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")
        
        # Open video
        cap = cv2.VideoCapture(str(video_path))
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        # Get video properties
        original_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Calculate frame skip interval
        if original_fps > 0:
            frame_interval = max(1, int(original_fps / self.target_fps))
        else:
            frame_interval = 1
        
        frames = []
        frame_count = 0
        extracted_count = 0
        
        # Create output directory if saving
        if save_frames and output_dir:
            output_path = Path(output_dir)
            output_path.mkdir(parents=True, exist_ok=True)
        
        # Extract frames
        with tqdm(total=total_frames, desc=f"Extracting from {video_path.name}") as pbar:
            while True:
                ret, frame = cap.read()
                
                if not ret:
                    break
                
                # Extract frame at intervals
                if frame_count % frame_interval == 0:
                    # Resize if specified
                    if self.resize:
                        frame = cv2.resize(frame, self.resize)
                    
                    frames.append(frame)
                    
                    # Save frame if requested
                    if save_frames and output_dir:
                        frame_filename = output_path / f"frame_{extracted_count:04d}.jpg"
                        cv2.imwrite(str(frame_filename), frame)
                    
                    extracted_count += 1
                
                frame_count += 1
                pbar.update(1)
        
        cap.release()
        
        print(f"Extracted {extracted_count} frames from {video_path.name}")
        
        return frames
    
    def extract_frames_batch(self, video_paths: List[str], output_base_dir: str,
                            save_frames: bool = True) -> Dict[str, List[np.ndarray]]:
        """
        Extract frames from multiple videos
        
        Args:
            video_paths: List of video file paths
            output_base_dir: Base directory for saving frames
            save_frames: Whether to save frames to disk
            
        Returns:
            Dictionary mapping video names to frame lists
        """
        all_frames = {}
        
        for video_path in video_paths:
            video_path = Path(video_path)
            
            # Create output directory for this video
            if save_frames:
                output_dir = Path(output_base_dir) / video_path.stem
            else:
                output_dir = None
            
            try:
                frames = self.extract_frames(
                    str(video_path),
                    str(output_dir) if output_dir else None,
                    save_frames
                )
                all_frames[video_path.stem] = frames
            except Exception as e:
                print(f"Error extracting frames from {video_path}: {e}")
        
        return all_frames
    
    @staticmethod
    def get_video_info(video_path: str) -> Dict:
        """
        Get video metadata
        
        Args:
            video_path: Path to video file
            
        Returns:
            Dictionary with video information
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        info = {
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'duration_seconds': cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        }
        
        cap.release()
        
        return info


if __name__ == "__main__":
    # Test frame extraction
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python frame_extractor.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # Get video info
    print("Video Information:")
    info = FrameExtractor.get_video_info(video_path)
    for key, value in info.items():
        print(f"  {key}: {value}")
    
    # Extract frames
    print("\nExtracting frames...")
    extractor = FrameExtractor(target_fps=5, resize=(640, 480))
    frames = extractor.extract_frames(video_path, output_dir="test_frames", save_frames=True)
    
    print(f"\nExtracted {len(frames)} frames")
    print(f"Frame shape: {frames[0].shape if frames else 'N/A'}")
