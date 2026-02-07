"""
Facial Expression Detector
Detects facial expressions and calculates engagement-related metrics using MediaPipe
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Optional, Tuple


class FacialExpressionDetector:
    """
    Detect facial expressions and calculate engagement metrics
    Uses MediaPipe Face Mesh for landmark detection
    """
    
    def __init__(self):
        """Initialize MediaPipe Face Mesh"""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmark indices (MediaPipe Face Mesh)
        self.LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
        self.RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
        
        # Mouth landmark indices
        self.MOUTH_INDICES = [61, 291, 0, 17, 84, 181, 78, 82]
        
        # Eyebrow indices
        self.LEFT_EYEBROW_INDICES = [70, 63, 105, 66, 107]
        self.RIGHT_EYEBROW_INDICES = [336, 296, 334, 293, 300]
    
    def calculate_ear(self, eye_landmarks: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for drowsiness detection
        
        Args:
            eye_landmarks: Array of eye landmark coordinates
            
        Returns:
            EAR value (lower values indicate closed eyes)
        """
        # Vertical distances
        v1 = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        v2 = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        
        # Horizontal distance
        h = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        
        # EAR formula
        ear = (v1 + v2) / (2.0 * h)
        
        return ear
    
    def calculate_mar(self, mouth_landmarks: np.ndarray) -> float:
        """
        Calculate Mouth Aspect Ratio (MAR) for yawning detection
        
        Args:
            mouth_landmarks: Array of mouth landmark coordinates
            
        Returns:
            MAR value (higher values indicate open mouth)
        """
        # Vertical distances
        v1 = np.linalg.norm(mouth_landmarks[1] - mouth_landmarks[7])
        v2 = np.linalg.norm(mouth_landmarks[2] - mouth_landmarks[6])
        v3 = np.linalg.norm(mouth_landmarks[3] - mouth_landmarks[5])
        
        # Horizontal distance
        h = np.linalg.norm(mouth_landmarks[0] - mouth_landmarks[4])
        
        # MAR formula
        mar = (v1 + v2 + v3) / (3.0 * h)
        
        return mar
    
    def extract_features(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Extract facial features from a frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with facial features or None if no face detected
        """
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process frame
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
        
        # Get first face landmarks
        face_landmarks = results.multi_face_landmarks[0]
        
        # Convert landmarks to numpy array
        h, w = frame.shape[:2]
        landmarks = np.array([
            [lm.x * w, lm.y * h, lm.z * w]
            for lm in face_landmarks.landmark
        ])
        
        # Extract eye landmarks
        left_eye = landmarks[self.LEFT_EYE_INDICES]
        right_eye = landmarks[self.RIGHT_EYE_INDICES]
        
        # Calculate EAR for both eyes
        left_ear = self.calculate_ear(left_eye)
        right_ear = self.calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
        
        # Extract mouth landmarks
        mouth = landmarks[self.MOUTH_INDICES]
        mar = self.calculate_mar(mouth)
        
        # Extract eyebrow landmarks
        left_eyebrow = landmarks[self.LEFT_EYEBROW_INDICES]
        right_eyebrow = landmarks[self.RIGHT_EYEBROW_INDICES]
        
        # Calculate eyebrow height (relative to eye)
        left_eyebrow_height = np.mean(left_eyebrow[:, 1]) - np.mean(left_eye[:, 1])
        right_eyebrow_height = np.mean(right_eyebrow[:, 1]) - np.mean(right_eye[:, 1])
        avg_eyebrow_height = (left_eyebrow_height + right_eyebrow_height) / 2.0
        
        # Compile features
        features = {
            'ear_left': float(left_ear),
            'ear_right': float(right_ear),
            'ear_avg': float(avg_ear),
            'mar': float(mar),
            'eyebrow_height': float(avg_eyebrow_height),
            'is_drowsy': avg_ear < 0.2,  # Threshold for drowsiness
            'is_yawning': mar > 0.6,  # Threshold for yawning
            'face_detected': True
        }
        
        # Add landmark statistics
        features['landmark_mean_x'] = float(np.mean(landmarks[:, 0]))
        features['landmark_mean_y'] = float(np.mean(landmarks[:, 1]))
        features['landmark_std_x'] = float(np.std(landmarks[:, 0]))
        features['landmark_std_y'] = float(np.std(landmarks[:, 1]))
        
        return features
    
    def extract_features_batch(self, frames: List[np.ndarray]) -> List[Optional[Dict]]:
        """
        Extract features from multiple frames
        
        Args:
            frames: List of frames
            
        Returns:
            List of feature dictionaries
        """
        return [self.extract_features(frame) for frame in frames]
    
    def visualize_landmarks(self, frame: np.ndarray) -> np.ndarray:
        """
        Visualize facial landmarks on frame
        
        Args:
            frame: Input frame
            
        Returns:
            Frame with landmarks drawn
        """
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if results.multi_face_landmarks:
            mp_drawing = mp.solutions.drawing_utils
            mp_drawing_styles = mp.solutions.drawing_styles
            
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    image=frame,
                    landmark_list=face_landmarks,
                    connections=self.mp_face_mesh.FACEMESH_TESSELATION,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_tesselation_style()
                )
        
        return frame
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()


if __name__ == "__main__":
    # Test facial expression detector
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python facial_expression_detector.py <image_or_video_path>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    detector = FacialExpressionDetector()
    
    # Test with image
    if input_path.lower().endswith(('.jpg', '.jpeg', '.png')):
        frame = cv2.imread(input_path)
        features = detector.extract_features(frame)
        
        print("Facial Features:")
        if features:
            for key, value in features.items():
                print(f"  {key}: {value}")
            
            # Visualize
            vis_frame = detector.visualize_landmarks(frame.copy())
            cv2.imshow('Facial Landmarks', vis_frame)
            cv2.waitKey(0)
        else:
            print("  No face detected")
    
    # Test with video
    elif input_path.lower().endswith(('.mp4', '.avi', '.mov')):
        cap = cv2.VideoCapture(input_path)
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            features = detector.extract_features(frame)
            vis_frame = detector.visualize_landmarks(frame.copy())
            
            if features:
                # Display metrics on frame
                cv2.putText(vis_frame, f"EAR: {features['ear_avg']:.3f}", (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                cv2.putText(vis_frame, f"MAR: {features['mar']:.3f}", (10, 60),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                if features['is_drowsy']:
                    cv2.putText(vis_frame, "DROWSY!", (10, 90),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                if features['is_yawning']:
                    cv2.putText(vis_frame, "YAWNING!", (10, 120),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            cv2.imshow('Facial Expression Detection', vis_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        
        cap.release()
        cv2.destroyAllWindows()
