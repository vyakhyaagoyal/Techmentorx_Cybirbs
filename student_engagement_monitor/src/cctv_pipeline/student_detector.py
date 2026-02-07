"""
Student Detector
Detects and tracks multiple students in classroom CCTV footage
"""

import cv2
import numpy as np
from typing import List, Dict, Tuple, Optional
from pathlib import Path
from collections import defaultdict


class StudentDetector:
    """
    Detect and track students in classroom video
    Uses YOLO for person detection and tracking algorithm
    """
    
    def __init__(self, model_path: str = 'yolov8n.pt', 
                 confidence_threshold: float = 0.6,
                 max_students: int = 60):
        """
        Initialize student detector
        
        Args:
            model_path: Path to YOLO model
            confidence_threshold: Minimum confidence for detection
            max_students: Maximum number of students to track
        """
        self.confidence_threshold = confidence_threshold
        self.max_students = max_students
        self.model = None
        self.model_loaded = False
        
        # Tracking
        self.next_student_id = 1
        self.tracked_students = {}  # {track_id: student_info}
        
        try:
            from ultralytics import YOLO
            
            # Load YOLO model
            if not Path(model_path).exists():
                print(f"Downloading YOLO model...")
                self.model = YOLO('yolov8n.pt')
            else:
                self.model = YOLO(model_path)
            
            self.model_loaded = True
            print("✅ Student detector initialized")
            
        except ImportError:
            print("⚠️  Warning: ultralytics not installed. Student detection disabled.")
        except Exception as e:
            print(f"⚠️  Warning: Could not load YOLO model: {e}")
    
    def detect_students(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect students in frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            List of detected students with bounding boxes and IDs
        """
        if not self.model_loaded:
            return []
        
        students = []
        
        try:
            # Run detection with tracking
            results = self.model.track(
                frame,
                persist=True,
                conf=self.confidence_threshold,
                classes=[0],  # Person class in COCO
                verbose=False
            )
            
            for result in results:
                boxes = result.boxes
                
                if boxes is None or len(boxes) == 0:
                    continue
                
                for box in boxes:
                    # Get class (should be person)
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    
                    if class_name != 'person':
                        continue
                    
                    # Get bounding box
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    bbox = (int(x1), int(y1), int(x2), int(y2))
                    
                    # Get tracking ID
                    if box.id is not None:
                        track_id = int(box.id[0])
                    else:
                        track_id = self.next_student_id
                        self.next_student_id += 1
                    
                    # Get confidence
                    confidence = float(box.conf[0])
                    
                    # Calculate center point
                    center_x = int((x1 + x2) / 2)
                    center_y = int((y1 + y2) / 2)
                    
                    student_info = {
                        'id': track_id,
                        'bbox': bbox,
                        'center': (center_x, center_y),
                        'confidence': confidence,
                        'roi': frame[int(y1):int(y2), int(x1):int(x2)]
                    }
                    
                    students.append(student_info)
                    
                    # Update tracked students
                    self.tracked_students[track_id] = student_info
            
            # Limit to max students
            if len(students) > self.max_students:
                # Keep students with highest confidence
                students = sorted(students, key=lambda x: x['confidence'], reverse=True)
                students = students[:self.max_students]
        
        except Exception as e:
            print(f"Error in student detection: {e}")
        
        return students
    
    def assign_seat_positions(self, students: List[Dict], 
                             grid_rows: int = 5, grid_cols: int = 10) -> Dict:
        """
        Assign seat positions to detected students based on spatial location
        
        Args:
            students: List of detected students
            grid_rows: Number of rows in classroom grid
            grid_cols: Number of columns in classroom grid
            
        Returns:
            Dictionary mapping student IDs to seat positions
        """
        if not students:
            return {}
        
        seat_assignments = {}
        
        # Get frame dimensions (assuming all students from same frame)
        # We'll use normalized positions
        
        for student in students:
            center_x, center_y = student['center']
            
            # Normalize to 0-1 range (assuming typical frame size)
            # In practice, you'd get actual frame dimensions
            norm_x = center_x / 1920  # Assuming 1080p
            norm_y = center_y / 1080
            
            # Map to grid position
            col = int(norm_x * grid_cols)
            row = int(norm_y * grid_rows)
            
            # Clamp to valid range
            col = max(0, min(col, grid_cols - 1))
            row = max(0, min(row, grid_rows - 1))
            
            # Calculate seat number (row-major order)
            seat_number = row * grid_cols + col + 1
            
            seat_assignments[student['id']] = {
                'seat_number': seat_number,
                'row': row,
                'col': col,
                'position': (norm_x, norm_y)
            }
        
        return seat_assignments
    
    def visualize_detections(self, frame: np.ndarray, students: List[Dict],
                            seat_assignments: Optional[Dict] = None) -> np.ndarray:
        """
        Visualize detected students on frame
        
        Args:
            frame: Input frame
            students: List of detected students
            seat_assignments: Optional seat assignment dictionary
            
        Returns:
            Frame with visualizations
        """
        vis_frame = frame.copy()
        
        for student in students:
            student_id = student['id']
            x1, y1, x2, y2 = student['bbox']
            confidence = student['confidence']
            
            # Draw bounding box
            cv2.rectangle(vis_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Prepare label
            if seat_assignments and student_id in seat_assignments:
                seat_num = seat_assignments[student_id]['seat_number']
                label = f"Seat {seat_num}"
            else:
                label = f"Student {student_id}"
            
            label += f" ({confidence:.2f})"
            
            # Draw label background
            (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(vis_frame, (x1, y1 - label_h - 10), (x1 + label_w, y1), (0, 255, 0), -1)
            
            # Draw label text
            cv2.putText(vis_frame, label, (x1, y1 - 5),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
        
        # Draw student count
        cv2.putText(vis_frame, f"Students: {len(students)}", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        
        return vis_frame
    
    def reset_tracking(self):
        """Reset tracking state"""
        self.tracked_students.clear()
        self.next_student_id = 1


if __name__ == "__main__":
    # Test student detector
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python student_detector.py <video_or_webcam_index>")
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    # Determine if input is webcam or video file
    if input_source.isdigit():
        cap = cv2.VideoCapture(int(input_source))
    else:
        cap = cv2.VideoCapture(input_source)
    
    detector = StudentDetector()
    
    print("Press 'q' to quit, 'r' to reset tracking")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Detect students
        students = detector.detect_students(frame)
        
        # Assign seats
        seat_assignments = detector.assign_seat_positions(students)
        
        # Visualize
        vis_frame = detector.visualize_detections(frame, students, seat_assignments)
        
        cv2.imshow('Student Detection', vis_frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            detector.reset_tracking()
            print("Tracking reset")
    
    cap.release()
    cv2.destroyAllWindows()
