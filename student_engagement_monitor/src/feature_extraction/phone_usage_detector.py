"""
Phone Usage Detector
Detects mobile phone usage using object detection
"""

import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from pathlib import Path


class PhoneUsageDetector:
    """
    Detect mobile phone usage in video frames
    Uses YOLOv8 for object detection
    """
    
    def __init__(self, model_path: str = 'models/yolov8n.pt', confidence_threshold: float = 0.5):
        """
        Initialize phone detector
        
        Args:
            model_path: Path to YOLO model
            confidence_threshold: Minimum confidence for detection
        """
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.model_loaded = False
        
        try:
            from ultralytics import YOLO
            
            # Check if model exists, otherwise download
            model_file = Path(model_path)
            if not model_file.exists():
                print(f"Model not found at {model_path}, downloading YOLOv8n...")
                self.model = YOLO('yolov8n.pt')  # Will auto-download
            else:
                self.model = YOLO(model_path)
            
            self.model_loaded = True
            print("✅ YOLO model loaded successfully")
            
        except ImportError:
            print("⚠️  Warning: ultralytics not installed. Phone detection will be disabled.")
            print("   Install with: pip install ultralytics")
        except Exception as e:
            print(f"⚠️  Warning: Could not load YOLO model: {e}")
    
    def detect_phone(self, frame: np.ndarray) -> Dict:
        """
        Detect phone in frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with phone detection features
        """
        features = {
            'phone_detected': False,
            'phone_confidence': 0.0,
            'phone_count': 0,
            'phone_bbox': None,
            'phone_area_ratio': 0.0
        }
        
        if not self.model_loaded:
            return features
        
        try:
            # Run inference
            results = self.model(frame, verbose=False)
            
            # Process detections
            for result in results:
                boxes = result.boxes
                
                for box in boxes:
                    # Get class name
                    class_id = int(box.cls[0])
                    class_name = result.names[class_id]
                    confidence = float(box.conf[0])
                    
                    # Check if it's a cell phone (class 67 in COCO dataset)
                    if class_name == 'cell phone' and confidence >= self.confidence_threshold:
                        features['phone_detected'] = True
                        features['phone_count'] += 1
                        features['phone_confidence'] = max(features['phone_confidence'], confidence)
                        
                        # Get bounding box
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        bbox = (int(x1), int(y1), int(x2), int(y2))
                        features['phone_bbox'] = bbox
                        
                        # Calculate area ratio (phone area / frame area)
                        phone_area = (x2 - x1) * (y2 - y1)
                        frame_area = frame.shape[0] * frame.shape[1]
                        features['phone_area_ratio'] = float(phone_area / frame_area)
        
        except Exception as e:
            print(f"Error in phone detection: {e}")
        
        return features
    
    def visualize_detection(self, frame: np.ndarray, features: Dict) -> np.ndarray:
        """
        Visualize phone detection on frame
        
        Args:
            frame: Input frame
            features: Detection features from detect_phone()
            
        Returns:
            Frame with visualization
        """
        if features['phone_detected'] and features['phone_bbox']:
            x1, y1, x2, y2 = features['phone_bbox']
            
            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Draw label
            label = f"Phone: {features['phone_confidence']:.2f}"
            cv2.putText(frame, label, (x1, y1 - 10),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            
            # Warning text
            cv2.putText(frame, "⚠ PHONE USAGE DETECTED", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        else:
            cv2.putText(frame, "No phone detected", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return frame


class SimplePhoneDetector:
    """
    Simplified phone detector using color and shape heuristics
    Fallback when YOLO is not available
    """
    
    def __init__(self):
        """Initialize simple detector"""
        print("Using simple phone detector (heuristic-based)")
    
    def detect_phone(self, frame: np.ndarray) -> Dict:
        """
        Detect phone using simple heuristics
        
        Args:
            frame: Input frame
            
        Returns:
            Dictionary with detection features
        """
        features = {
            'phone_detected': False,
            'phone_confidence': 0.0,
            'phone_count': 0,
            'phone_bbox': None,
            'phone_area_ratio': 0.0
        }
        
        # This is a placeholder - in practice, you'd implement:
        # 1. Hand-to-face proximity detection
        # 2. Rectangular object detection near face
        # 3. Color-based detection (black rectangles)
        
        # For now, return no detection
        return features
    
    def visualize_detection(self, frame: np.ndarray, features: Dict) -> np.ndarray:
        """Visualize detection"""
        cv2.putText(frame, "Simple detector (limited accuracy)", (10, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (128, 128, 128), 1)
        return frame


def create_phone_detector(use_yolo: bool = True, **kwargs) -> object:
    """
    Factory function to create appropriate phone detector
    
    Args:
        use_yolo: Whether to use YOLO-based detector
        **kwargs: Additional arguments for detector
        
    Returns:
        Phone detector instance
    """
    if use_yolo:
        detector = PhoneUsageDetector(**kwargs)
        if not detector.model_loaded:
            print("Falling back to simple detector")
            return SimplePhoneDetector()
        return detector
    else:
        return SimplePhoneDetector()


if __name__ == "__main__":
    # Test phone detector
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python phone_usage_detector.py <video_or_webcam_index>")
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    # Determine if input is webcam or video file
    if input_source.isdigit():
        cap = cv2.VideoCapture(int(input_source))
    else:
        cap = cv2.VideoCapture(input_source)
    
    detector = create_phone_detector(use_yolo=True)
    
    print("Press 'q' to quit")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Detect phone
        features = detector.detect_phone(frame)
        
        # Visualize
        frame = detector.visualize_detection(frame, features)
        
        cv2.imshow('Phone Usage Detection', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
