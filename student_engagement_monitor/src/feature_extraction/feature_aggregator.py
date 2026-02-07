"""
Feature Aggregator
Combines all feature extraction modules and creates unified feature vectors
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from pathlib import Path

# Import feature extractors
try:
    from .facial_expression_detector import FacialExpressionDetector
    from .head_pose_estimator import HeadPoseEstimator
    from .hand_movement_detector import HandMovementDetector
    from .phone_usage_detector import create_phone_detector
except ImportError:
    # For standalone execution
    import sys
    sys.path.append(str(Path(__file__).parent))
    from facial_expression_detector import FacialExpressionDetector
    from head_pose_estimator import HeadPoseEstimator
    from hand_movement_detector import HandMovementDetector
    from phone_usage_detector import create_phone_detector


class FeatureAggregator:
    """
    Aggregates features from all detection modules
    Creates unified feature vectors for XGBoost training/inference
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize all feature extractors
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Initialize feature extractors
        print("Initializing feature extractors...")
        
        self.facial_detector = FacialExpressionDetector()
        print("  ✅ Facial expression detector")
        
        self.pose_estimator = HeadPoseEstimator()
        print("  ✅ Head pose estimator")
        
        self.hand_detector = HandMovementDetector()
        print("  ✅ Hand movement detector")
        
        self.phone_detector = create_phone_detector(use_yolo=True)
        print("  ✅ Phone usage detector")
        
        print("All feature extractors initialized!")
    
    def extract_frame_features(self, frame: np.ndarray) -> Dict:
        """
        Extract all features from a single frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            Dictionary with all features
        """
        features = {}
        
        # Facial features
        facial_features = self.facial_detector.extract_features(frame)
        if facial_features:
            features.update({f'facial_{k}': v for k, v in facial_features.items()})
        else:
            # Fill with default values if no face detected
            features.update({
                'facial_face_detected': False,
                'facial_ear_avg': 0.0,
                'facial_mar': 0.0,
                'facial_is_drowsy': False,
                'facial_is_yawning': False
            })
        
        # Head pose features
        pose_features = self.pose_estimator.estimate_pose(frame)
        if pose_features:
            features.update({f'pose_{k}': v for k, v in pose_features.items() 
                           if k not in ['rotation_vector', 'translation_vector']})
        else:
            features.update({
                'pose_pitch': 0.0,
                'pose_yaw': 0.0,
                'pose_roll': 0.0,
                'pose_is_engaged': False,
                'pose_attention_score': 0.0
            })
        
        # Hand movement features
        hand_features = self.hand_detector.extract_features(frame)
        features.update({f'hand_{k}': v for k, v in hand_features.items()})
        
        # Phone detection features
        phone_features = self.phone_detector.detect_phone(frame)
        features.update({f'phone_{k}': v for k, v in phone_features.items() 
                        if k != 'phone_bbox'})
        
        return features
    
    def extract_video_features(self, frames: List[np.ndarray], 
                              aggregate: bool = True) -> Dict:
        """
        Extract features from multiple frames (video clip)
        
        Args:
            frames: List of frames
            aggregate: Whether to aggregate temporal statistics
            
        Returns:
            Dictionary with aggregated features
        """
        # Extract features from each frame
        frame_features = [self.extract_frame_features(frame) for frame in frames]
        
        if not aggregate:
            return frame_features
        
        # Aggregate temporal statistics
        aggregated = self._aggregate_temporal_features(frame_features)
        
        return aggregated
    
    def _aggregate_temporal_features(self, frame_features: List[Dict]) -> Dict:
        """
        Aggregate features across time (mean, std, max, min)
        
        Args:
            frame_features: List of feature dictionaries from each frame
            
        Returns:
            Aggregated feature dictionary
        """
        if not frame_features:
            return {}
        
        # Convert to DataFrame for easy aggregation
        df = pd.DataFrame(frame_features)
        
        aggregated = {}
        
        # Aggregate numerical features
        numerical_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in numerical_cols:
            aggregated[f'{col}_mean'] = float(df[col].mean())
            aggregated[f'{col}_std'] = float(df[col].std())
            aggregated[f'{col}_max'] = float(df[col].max())
            aggregated[f'{col}_min'] = float(df[col].min())
        
        # Aggregate boolean features (percentage of frames where True)
        boolean_cols = df.select_dtypes(include=[bool]).columns
        
        for col in boolean_cols:
            aggregated[f'{col}_ratio'] = float(df[col].sum() / len(df))
        
        # Add frame count
        aggregated['frame_count'] = len(frame_features)
        
        return aggregated
    
    def features_to_vector(self, features: Dict, feature_names: Optional[List[str]] = None) -> np.ndarray:
        """
        Convert feature dictionary to numpy vector
        
        Args:
            features: Feature dictionary
            feature_names: Ordered list of feature names (for consistency)
            
        Returns:
            Feature vector
        """
        if feature_names is None:
            # Use all numerical features in sorted order
            feature_names = sorted([k for k, v in features.items() 
                                  if isinstance(v, (int, float, bool))])
        
        # Extract values in order
        vector = np.array([
            float(features.get(name, 0.0))
            for name in feature_names
        ])
        
        return vector
    
    def get_feature_names(self, sample_features: Dict) -> List[str]:
        """
        Get ordered list of feature names from sample features
        
        Args:
            sample_features: Sample feature dictionary
            
        Returns:
            Ordered list of feature names
        """
        return sorted([k for k, v in sample_features.items() 
                      if isinstance(v, (int, float, bool))])
    
    def reset(self):
        """Reset all detectors (clear history)"""
        self.hand_detector.reset_history()


if __name__ == "__main__":
    # Test feature aggregator
    import cv2
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python feature_aggregator.py <video_path>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    # Initialize aggregator
    aggregator = FeatureAggregator()
    
    # Load video
    cap = cv2.VideoCapture(video_path)
    
    frames = []
    frame_count = 0
    max_frames = 50  # Process first 50 frames
    
    print(f"\nProcessing video: {video_path}")
    
    while cap.isOpened() and frame_count < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        
        frames.append(frame)
        frame_count += 1
    
    cap.release()
    
    print(f"Loaded {len(frames)} frames")
    
    # Extract features
    print("\nExtracting features...")
    aggregated_features = aggregator.extract_video_features(frames, aggregate=True)
    
    print(f"\nExtracted {len(aggregated_features)} aggregated features:")
    print("\nSample features:")
    for i, (key, value) in enumerate(list(aggregated_features.items())[:20]):
        print(f"  {key}: {value}")
    
    if len(aggregated_features) > 20:
        print(f"  ... and {len(aggregated_features) - 20} more features")
    
    # Convert to vector
    feature_names = aggregator.get_feature_names(aggregated_features)
    feature_vector = aggregator.features_to_vector(aggregated_features, feature_names)
    
    print(f"\nFeature vector shape: {feature_vector.shape}")
    print(f"Feature vector (first 10 values): {feature_vector[:10]}")
