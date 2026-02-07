"""
Hand Movement Detector
Detects hand activities: writing, hand-raising, resting, fidgeting
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Optional
from collections import deque


class HandMovementDetector:
    """
    Detect hand movements and classify activities
    Uses MediaPipe Hands for hand landmark detection
    """
    
    def __init__(self, history_size: int = 10):
        """
        Initialize MediaPipe Hands
        
        Args:
            history_size: Number of frames to keep for movement analysis
        """
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # History for tracking movement
        self.history_size = history_size
        self.left_hand_history = deque(maxlen=history_size)
        self.right_hand_history = deque(maxlen=history_size)
        
        # Thresholds
        self.WRITING_VELOCITY_THRESHOLD = 0.02  # Consistent small movements
        self.RAISING_HEIGHT_THRESHOLD = 0.3  # Hand above certain height
        self.FIDGETING_VELOCITY_THRESHOLD = 0.05  # Erratic movements
    
    def extract_features(self, frame: np.ndarray) -> Dict:
        """
        Extract hand movement features from frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with hand features
        """
        # Convert to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process frame
        results = self.hands.process(rgb_frame)
        
        features = {
            'hands_detected': 0,
            'left_hand_detected': False,
            'right_hand_detected': False,
            'is_writing': False,
            'is_hand_raised': False,
            'is_fidgeting': False,
            'is_resting': False,
            'movement_velocity': 0.0,
            'hand_height': 0.0
        }
        
        if not results.multi_hand_landmarks:
            # No hands detected - likely resting
            features['is_resting'] = True
            return features
        
        h, w = frame.shape[:2]
        
        # Process each detected hand
        for idx, (hand_landmarks, handedness) in enumerate(
            zip(results.multi_hand_landmarks, results.multi_handedness)
        ):
            # Determine if left or right hand
            hand_label = handedness.classification[0].label  # "Left" or "Right"
            is_left = hand_label == "Left"
            
            # Extract landmarks
            landmarks = np.array([
                [lm.x, lm.y, lm.z]
                for lm in hand_landmarks.landmark
            ])
            
            # Calculate hand center
            hand_center = np.mean(landmarks[:, :2], axis=0)
            
            # Update history
            if is_left:
                self.left_hand_history.append(hand_center)
                features['left_hand_detected'] = True
            else:
                self.right_hand_history.append(hand_center)
                features['right_hand_detected'] = True
            
            features['hands_detected'] += 1
            
            # Calculate movement velocity
            history = self.left_hand_history if is_left else self.right_hand_history
            if len(history) >= 2:
                velocities = [
                    np.linalg.norm(history[i] - history[i-1])
                    for i in range(1, len(history))
                ]
                avg_velocity = np.mean(velocities)
                features['movement_velocity'] = max(features['movement_velocity'], float(avg_velocity))
            
            # Hand height (y-coordinate, lower value = higher in frame)
            hand_height = 1.0 - hand_center[1]  # Invert so higher = higher value
            features['hand_height'] = max(features['hand_height'], float(hand_height))
            
            # Classify activity
            # Hand raised: hand is high in frame
            if hand_height > self.RAISING_HEIGHT_THRESHOLD:
                features['is_hand_raised'] = True
            
            # Writing: consistent small movements
            if len(history) >= 5:
                recent_velocities = velocities[-5:]
                if (np.mean(recent_velocities) > self.WRITING_VELOCITY_THRESHOLD and
                    np.std(recent_velocities) < 0.01):  # Consistent movement
                    features['is_writing'] = True
            
            # Fidgeting: erratic, larger movements
            if len(history) >= 5:
                if (np.mean(recent_velocities) > self.FIDGETING_VELOCITY_THRESHOLD and
                    np.std(recent_velocities) > 0.02):  # Inconsistent movement
                    features['is_fidgeting'] = True
        
        # Resting: hands detected but minimal movement
        if features['hands_detected'] > 0 and features['movement_velocity'] < 0.01:
            features['is_resting'] = True
        
        return features
    
    def visualize_hands(self, frame: np.ndarray, features: Dict) -> np.ndarray:
        """
        Visualize hand detection and activity on frame
        
        Args:
            frame: Input frame
            features: Hand features from extract_features()
            
        Returns:
            Frame with visualization
        """
        # Process frame for visualization
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb_frame)
        
        if results.multi_hand_landmarks:
            mp_drawing = mp.solutions.drawing_utils
            mp_drawing_styles = mp.solutions.drawing_styles
            
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    hand_landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )
        
        # Display activity
        y_offset = 30
        cv2.putText(frame, f"Hands: {features['hands_detected']}", (10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        y_offset += 30
        if features['is_writing']:
            cv2.putText(frame, "Activity: WRITING", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        elif features['is_hand_raised']:
            cv2.putText(frame, "Activity: HAND RAISED", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        elif features['is_fidgeting']:
            cv2.putText(frame, "Activity: FIDGETING", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 165, 0), 2)
        elif features['is_resting']:
            cv2.putText(frame, "Activity: RESTING", (10, y_offset),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        y_offset += 30
        cv2.putText(frame, f"Velocity: {features['movement_velocity']:.4f}", (10, y_offset),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return frame
    
    def reset_history(self):
        """Reset movement history"""
        self.left_hand_history.clear()
        self.right_hand_history.clear()
    
    def __del__(self):
        """Cleanup"""
        if hasattr(self, 'hands'):
            self.hands.close()


if __name__ == "__main__":
    # Test hand movement detector
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python hand_movement_detector.py <video_or_webcam_index>")
        sys.exit(1)
    
    input_source = sys.argv[1]
    
    # Determine if input is webcam or video file
    if input_source.isdigit():
        cap = cv2.VideoCapture(int(input_source))
    else:
        cap = cv2.VideoCapture(input_source)
    
    detector = HandMovementDetector()
    
    print("Press 'q' to quit, 'r' to reset history")
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Extract features
        features = detector.extract_features(frame)
        
        # Visualize
        frame = detector.visualize_hands(frame, features)
        
        cv2.imshow('Hand Movement Detection', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('r'):
            detector.reset_history()
            print("History reset")
    
    cap.release()
    cv2.destroyAllWindows()
