"""
Head Pose Estimator
Estimates head orientation (pitch, yaw, roll) to determine if student is looking at board/screen
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, Optional, Tuple


class HeadPoseEstimator:
    """
    Estimate head pose using facial landmarks
    Determines if student is paying attention based on head orientation
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
        
        # 3D model points (generic face model)
        self.model_points = np.array([
            (0.0, 0.0, 0.0),             # Nose tip
            (0.0, -330.0, -65.0),        # Chin
            (-225.0, 170.0, -135.0),     # Left eye left corner
            (225.0, 170.0, -135.0),      # Right eye right corner
            (-150.0, -150.0, -125.0),    # Left mouth corner
            (150.0, -150.0, -125.0)      # Right mouth corner
        ], dtype=np.float64)
        
        # Landmark indices for pose estimation
        self.POSE_LANDMARKS = [1, 152, 33, 263, 61, 291]  # Nose, Chin, Left eye, Right eye, Left mouth, Right mouth
        
        # Engagement thresholds (degrees)
        self.YAW_THRESHOLD = 20  # Left-right head turn
        self.PITCH_THRESHOLD = 15  # Up-down head tilt
    
    def estimate_pose(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Estimate head pose from frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with pose angles and engagement status, or None if no face detected
        """
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process frame
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
        
        # Get frame dimensions
        h, w = frame.shape[:2]
        
        # Get first face landmarks
        face_landmarks = results.multi_face_landmarks[0]
        
        # Extract 2D image points
        image_points = np.array([
            [face_landmarks.landmark[idx].x * w, face_landmarks.landmark[idx].y * h]
            for idx in self.POSE_LANDMARKS
        ], dtype=np.float64)
        
        # Camera internals (assuming generic webcam)
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # Assuming no lens distortion
        dist_coeffs = np.zeros((4, 1))
        
        # Solve PnP
        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.model_points,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return None
        
        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Calculate Euler angles
        pitch, yaw, roll = self._rotation_matrix_to_euler_angles(rotation_matrix)
        
        # Convert to degrees
        pitch_deg = np.degrees(pitch)
        yaw_deg = np.degrees(yaw)
        roll_deg = np.degrees(roll)
        
        # Determine if student is engaged (looking at board/screen)
        is_engaged = (
            abs(yaw_deg) <= self.YAW_THRESHOLD and
            abs(pitch_deg) <= self.PITCH_THRESHOLD
        )
        
        # Calculate attention score (0-1)
        yaw_score = max(0, 1 - abs(yaw_deg) / 90)
        pitch_score = max(0, 1 - abs(pitch_deg) / 90)
        attention_score = (yaw_score + pitch_score) / 2
        
        features = {
            'pitch': float(pitch_deg),
            'yaw': float(yaw_deg),
            'roll': float(roll_deg),
            'is_engaged': bool(is_engaged),
            'attention_score': float(attention_score),
            'looking_left': yaw_deg < -self.YAW_THRESHOLD,
            'looking_right': yaw_deg > self.YAW_THRESHOLD,
            'looking_up': pitch_deg < -self.PITCH_THRESHOLD,
            'looking_down': pitch_deg > self.PITCH_THRESHOLD,
            'rotation_vector': rotation_vector.flatten().tolist(),
            'translation_vector': translation_vector.flatten().tolist()
        }
        
        return features
    
    def _rotation_matrix_to_euler_angles(self, R: np.ndarray) -> Tuple[float, float, float]:
        """
        Convert rotation matrix to Euler angles
        
        Args:
            R: 3x3 rotation matrix
            
        Returns:
            Tuple of (pitch, yaw, roll) in radians
        """
        sy = np.sqrt(R[0, 0] * R[0, 0] + R[1, 0] * R[1, 0])
        
        singular = sy < 1e-6
        
        if not singular:
            x = np.arctan2(R[2, 1], R[2, 2])
            y = np.arctan2(-R[2, 0], sy)
            z = np.arctan2(R[1, 0], R[0, 0])
        else:
            x = np.arctan2(-R[1, 2], R[1, 1])
            y = np.arctan2(-R[2, 0], sy)
            z = 0
        
        return x, y, z
    
    def visualize_pose(self, frame: np.ndarray, features: Dict) -> np.ndarray:
        """
        Visualize head pose on frame
        
        Args:
            frame: Input frame
            features: Pose features from estimate_pose()
            
        Returns:
            Frame with pose visualization
        """
        if features is None:
            return frame
        
        # Draw pose angles
        h, w = frame.shape[:2]
        
        text_y = 30
        cv2.putText(frame, f"Pitch: {features['pitch']:.1f}°", (10, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        text_y += 30
        cv2.putText(frame, f"Yaw: {features['yaw']:.1f}°", (10, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        text_y += 30
        cv2.putText(frame, f"Roll: {features['roll']:.1f}°", (10, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        text_y += 30
        engagement_color = (0, 255, 0) if features['is_engaged'] else (0, 0, 255)
        engagement_text = "ENGAGED" if features['is_engaged'] else "DISTRACTED"
        cv2.putText(frame, engagement_text, (10, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, engagement_color, 2)
        
        text_y += 30
        cv2.putText(frame, f"Attention: {features['attention_score']:.2f}", (10, text_y),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        # Draw direction indicators
        if features['looking_left']:
            cv2.putText(frame, "← LEFT", (w - 150, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        elif features['looking_right']:
            cv2.putText(frame, "RIGHT →", (w - 150, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        
        if features['looking_up']:
            cv2.putText(frame, "↑ UP", (w - 150, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        elif features['looking_down']:
            cv2.putText(frame, "↓ DOWN", (w - 150, 60),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
        
        return frame
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'face_mesh'):
            self.face_mesh.close()


if __name__ == "__main__":
    # Test head pose estimator
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python head_pose_estimator.py <video_or_webcam_index>")
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    # Determine if input is webcam or video file
    if input_source.isdigit():
        cap = cv2.VideoCapture(int(input_source))
    else:
        cap = cv2.VideoCapture(input_source)
    
    estimator = HeadPoseEstimator()
    
    print("Press 'q' to quit")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Estimate pose
        features = estimator.estimate_pose(frame)
        
        # Visualize
        if features:
            frame = estimator.visualize_pose(frame, features)
        else:
            cv2.putText(frame, "No face detected", (10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        cv2.imshow('Head Pose Estimation', frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()
