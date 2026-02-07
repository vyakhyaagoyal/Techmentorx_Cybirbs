"""
Engagement Processor
Processes CCTV footage and analyzes student engagement
"""

import cv2
import numpy as np
from typing import Dict, List, Optional
from pathlib import Path
import sys
from collections import defaultdict

sys.path.append(str(Path(__file__).parent.parent))

from feature_extraction.feature_aggregator import FeatureAggregator
from models.engagement_classifier import EngagementClassifier
from cctv_pipeline.student_detector import StudentDetector
from utils import load_config


class EngagementProcessor:
    """
    Process CCTV footage and analyze student engagement
    Supports both real-time and batch processing modes
    """
    
    def __init__(self, config_path: str = 'configs/config.yaml',
                 model_dir: str = 'models/trained'):
        """
        Initialize engagement processor
        
        Args:
            config_path: Path to configuration file
            model_dir: Directory containing trained models
        """
        print("Initializing Engagement Processor...")
        
        # Load configuration
        self.config = load_config(config_path)
        
        # Initialize components
        self.student_detector = StudentDetector(
            confidence_threshold=self.config['cctv']['person_detection']['confidence_threshold'],
            max_students=self.config['cctv']['person_detection']['max_students']
        )
        
        self.feature_aggregator = FeatureAggregator(self.config)
        
        # Load trained classifier
        self.classifier = EngagementClassifier()
        if Path(model_dir).exists():
            self.classifier.load(model_dir)
            print(f"  ✅ Loaded trained model from {model_dir}")
        else:
            print(f"  ⚠️  Warning: No trained model found at {model_dir}")
            print("     Processor will extract features but not make predictions")
        
        # Processing state
        self.student_engagement_history = defaultdict(list)
        self.student_frame_buffer = defaultdict(list)  # Buffer frames for temporal aggregation
        self.buffer_size = 10  # Number of frames to buffer for aggregation
        self.frame_count = 0
        
        print("✅ Engagement Processor initialized!")
    
    def process_frame(self, frame: np.ndarray) -> Dict:
        """
        Process a single frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with engagement analysis results
        """
        self.frame_count += 1
        
        # Detect students
        students = self.student_detector.detect_students(frame)
        
        # Assign seat positions
        seat_assignments = self.student_detector.assign_seat_positions(
            students,
            grid_rows=self.config['cctv']['seat_mapping']['grid_rows'],
            grid_cols=self.config['cctv']['seat_mapping']['grid_cols']
        )
        
        # Analyze each student
        student_results = []
        
        for student in students:
            student_id = student['id']
            roi = student['roi']
            
            if roi.size == 0:
                continue
            
            # Buffer frames for this student
            self.student_frame_buffer[student_id].append(roi)
            
            # Keep only last N frames
            if len(self.student_frame_buffer[student_id]) > self.buffer_size:
                self.student_frame_buffer[student_id].pop(0)
            
            # Extract features with temporal aggregation
            buffered_frames = self.student_frame_buffer[student_id]
            
            if len(buffered_frames) >= 5:  # Need at least 5 frames for meaningful aggregation
                # Use extract_video_features with aggregation (same as training)
                features = self.feature_aggregator.extract_video_features(buffered_frames, aggregate=True)
            else:
                # Not enough frames yet, use single frame features
                # Pad with zeros to match expected 92 features
                frame_features = self.feature_aggregator.extract_frame_features(roi)
                feature_names = self.feature_aggregator.get_feature_names(frame_features)
                feature_vector = self.feature_aggregator.features_to_vector(frame_features, feature_names)
                
                # Skip prediction until we have enough frames
                predictions = None
                engagement_score = 0.0
                
                student_result = {
                    'id': student_id,
                    'bbox': student['bbox'],
                    'seat': seat_assignments.get(student_id, {}),
                    'predictions': predictions,
                    'engagement_score': engagement_score,
                    'features': frame_features
                }
                student_results.append(student_result)
                continue
            
            # Predict engagement if model is trained
            if self.classifier.is_trained:
                # Convert features to vector
                feature_names = self.feature_aggregator.get_feature_names(features)
                feature_vector = self.feature_aggregator.features_to_vector(features, feature_names)
                
                # Predict
                predictions = self.classifier.predict_single(feature_vector)
                engagement_score = self.classifier.get_engagement_score(predictions)
                
                # Store in history
                self.student_engagement_history[student_id].append({
                    'frame': self.frame_count,
                    'predictions': predictions,
                    'engagement_score': engagement_score
                })
            else:
                predictions = None
                engagement_score = 0.0
            
            # Compile student result
            student_result = {
                'id': student_id,
                'bbox': student['bbox'],
                'seat': seat_assignments.get(student_id, {}),
                'predictions': predictions,
                'engagement_score': engagement_score,
                'features': features
            }
            
            student_results.append(student_result)
        
        # Calculate class-wide metrics
        if student_results:
            engagement_scores = [s['engagement_score'] for s in student_results]
            class_engagement = np.mean(engagement_scores)
            
            # Count engagement levels
            highly_engaged = sum(1 for s in engagement_scores if s > 0.7)
            moderately_engaged = sum(1 for s in engagement_scores if 0.4 <= s <= 0.7)
            disengaged = sum(1 for s in engagement_scores if s < 0.4)
        else:
            class_engagement = 0.0
            highly_engaged = 0
            moderately_engaged = 0
            disengaged = 0
        
        results = {
            'frame_number': self.frame_count,
            'total_students': len(students),
            'student_results': student_results,
            'class_engagement': class_engagement,
            'highly_engaged': highly_engaged,
            'moderately_engaged': moderately_engaged,
            'disengaged': disengaged
        }
        
        return results
    
    def process_video(self, video_path: str, skip_frames: int = 1) -> List[Dict]:
        """
        Process entire video file
        
        Args:
            video_path: Path to video file
            skip_frames: Process every Nth frame
            
        Returns:
            List of frame results
        """
        print(f"\nProcessing video: {video_path}")
        
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {video_path}")
        
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print(f"  Total frames: {total_frames}")
        print(f"  FPS: {fps}")
        print(f"  Processing every {skip_frames} frame(s)")
        
        all_results = []
        frame_idx = 0
        
        from tqdm import tqdm
        pbar = tqdm(total=total_frames, desc="Processing")
        
        while cap.isOpened():
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Process frame at intervals
            if frame_idx % skip_frames == 0:
                results = self.process_frame(frame)
                all_results.append(results)
            
            frame_idx += 1
            pbar.update(1)
        
        pbar.close()
        cap.release()
        
        print(f"\n✅ Processed {len(all_results)} frames")
        
        return all_results
    
    def visualize_results(self, frame: np.ndarray, results: Dict) -> np.ndarray:
        """
        Visualize engagement analysis on frame
        
        Args:
            frame: Input frame
            results: Results from process_frame()
            
        Returns:
            Frame with visualizations
        """
        vis_frame = frame.copy()
        
        # Draw each student
        for student in results['student_results']:
            x1, y1, x2, y2 = student['bbox']
            engagement_score = student['engagement_score']
            
            # Color based on engagement (red = low, yellow = medium, green = high)
            if engagement_score > 0.7:
                color = (0, 255, 0)  # Green
            elif engagement_score > 0.4:
                color = (0, 255, 255)  # Yellow
            else:
                color = (0, 0, 255)  # Red
            
            # Draw bounding box
            cv2.rectangle(vis_frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            seat_info = student['seat']
            if seat_info:
                label = f"Seat {seat_info['seat_number']}: {engagement_score:.2f}"
            else:
                label = f"ID {student['id']}: {engagement_score:.2f}"
            
            cv2.putText(vis_frame, label, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw class-wide metrics
        h, w = vis_frame.shape[:2]
        
        # Semi-transparent overlay for stats
        overlay = vis_frame.copy()
        cv2.rectangle(overlay, (10, 10), (400, 150), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.6, vis_frame, 0.4, 0, vis_frame)
        
        # Draw stats
        y_offset = 35
        cv2.putText(vis_frame, f"Total Students: {results['total_students']}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        y_offset += 30
        cv2.putText(vis_frame, f"Class Engagement: {results['class_engagement']:.2f}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        y_offset += 30
        cv2.putText(vis_frame, f"Highly Engaged: {results['highly_engaged']}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        y_offset += 25
        cv2.putText(vis_frame, f"Moderately Engaged: {results['moderately_engaged']}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)
        
        y_offset += 25
        cv2.putText(vis_frame, f"Disengaged: {results['disengaged']}", (20, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
        
        return vis_frame
    
    def reset(self):
        """Reset processor state"""
        self.student_detector.reset_tracking()
        self.student_engagement_history.clear()
        self.student_frame_buffer.clear()
        self.frame_count = 0


if __name__ == "__main__":
    # Test engagement processor
    import argparse
    
    parser = argparse.ArgumentParser(description='Test engagement processor')
    parser.add_argument('input', type=str, help='Video file or webcam index')
    parser.add_argument('--config', type=str, default='configs/config.yaml')
    parser.add_argument('--model-dir', type=str, default='models/trained')
    parser.add_argument('--skip-frames', type=int, default=3)
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = EngagementProcessor(args.config, args.model_dir)
    
    # Determine input type
    if args.input.isdigit():
        # Webcam
        cap = cv2.VideoCapture(int(args.input))
        
        print("Press 'q' to quit")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process frame
            results = processor.process_frame(frame)
            
            # Visualize
            vis_frame = processor.visualize_results(frame, results)
            
            cv2.imshow('Engagement Analysis', vis_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
    
    else:
        # Video file
        all_results = processor.process_video(args.input, skip_frames=args.skip_frames)
        
        print(f"\nProcessed {len(all_results)} frames")
        print(f"Average class engagement: {np.mean([r['class_engagement'] for r in all_results]):.3f}")
