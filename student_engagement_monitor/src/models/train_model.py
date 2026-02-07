"""
Training Pipeline
End-to-end training pipeline for the engagement classifier
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional, Tuple
import sys
from tqdm import tqdm
import yaml

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from data_processing.dataset_loader import DAiSEEDataLoader
from data_processing.frame_extractor import FrameExtractor
from feature_extraction.feature_aggregator import FeatureAggregator
from models.engagement_classifier import EngagementClassifier
from utils import load_config


class TrainingPipeline:
    """
    Complete training pipeline for engagement classifier
    """
    
    def __init__(self, config_path: str = 'configs/config.yaml'):
        """
        Initialize training pipeline
        
        Args:
            config_path: Path to configuration file
        """
        print("=" * 60)
        print("Student Engagement Classifier - Training Pipeline")
        print("=" * 60)
        
        # Load configuration
        self.config = load_config(config_path)
        
        # Initialize components
        self.dataset_loader = None
        self.frame_extractor = FrameExtractor(
            target_fps=self.config['video']['fps_extraction'],
            resize=(self.config['video']['frame_width'], 
                   self.config['video']['frame_height'])
        )
        self.feature_aggregator = FeatureAggregator(self.config)
        self.classifier = EngagementClassifier(self.config.get('model'))
    
    def load_dataset(self, split: str = 'Train'):
        """
        Load dataset split
        
        Args:
            split: Dataset split ('Train', 'Test', or 'Validation')
        """
        print(f"\nLoading {split} dataset...")
        
        dataset_root = self.config['dataset']['raw_path']
        self.dataset_loader = DAiSEEDataLoader(dataset_root, split)
        
        print(f"  ✅ Loaded {len(self.dataset_loader)} videos")
    
    def extract_features_from_dataset(self, max_videos: Optional[int] = None,
                                     save_features: bool = True) -> Tuple[np.ndarray, Dict]:
        """
        Extract features from all videos in dataset
        
        Args:
            max_videos: Maximum number of videos to process (None = all)
            save_features: Whether to save extracted features
            
        Returns:
            Tuple of (feature_matrix, labels_dict)
        """
        if self.dataset_loader is None:
            raise ValueError("Dataset not loaded. Call load_dataset() first.")
        
        print("\nExtracting features from videos...")
        
        num_videos = min(len(self.dataset_loader), max_videos) if max_videos else len(self.dataset_loader)
        
        all_features = []
        all_labels = {
            'boredom': [],
            'engagement': [],
            'confusion': [],
            'frustration': []
        }
        
        processed_count = 0
        skipped_count = 0
        
        for i in tqdm(range(num_videos), desc="Processing videos"):
            try:
                # Get video and labels
                video_path, labels = self.dataset_loader[i]
                
                if labels is None:
                    skipped_count += 1
                    continue
                
                # Extract frames
                frames = self.frame_extractor.extract_frames(str(video_path))
                
                if len(frames) == 0:
                    skipped_count += 1
                    continue
                
                # Extract features
                features = self.feature_aggregator.extract_video_features(frames, aggregate=True)
                
                # Store features and labels
                all_features.append(features)
                all_labels['boredom'].append(labels['boredom'])
                all_labels['engagement'].append(labels['engagement'])
                all_labels['confusion'].append(labels['confusion'])
                all_labels['frustration'].append(labels['frustration'])
                
                processed_count += 1
                
                # Reset detector history for next video
                self.feature_aggregator.reset()
                
            except Exception as e:
                print(f"\n  ⚠️  Error processing video {i} ({video_path}): {e}")
                import traceback
                traceback.print_exc()
                skipped_count += 1
                continue
        
        print(f"\n✅ Processed {processed_count} videos, skipped {skipped_count}")
        
        # Convert to DataFrame and arrays
        features_df = pd.DataFrame(all_features)
        
        # Fill NaN values with 0
        features_df = features_df.fillna(0)
        
        # Convert labels to arrays
        labels_arrays = {
            state: np.array(values)
            for state, values in all_labels.items()
        }
        
        # Save features if requested
        if save_features:
            output_dir = Path(self.config['dataset']['processed_path'])
            output_dir.mkdir(parents=True, exist_ok=True)
            
            features_file = output_dir / f"{self.dataset_loader.split.lower()}_features.csv"
            labels_file = output_dir / f"{self.dataset_loader.split.lower()}_labels.csv"
            
            features_df.to_csv(features_file, index=False)
            pd.DataFrame(labels_arrays).to_csv(labels_file, index=False)
            
            print(f"  💾 Features saved to {features_file}")
            print(f"  💾 Labels saved to {labels_file}")
        
        return features_df, labels_arrays
    
    def train_model(self, X: pd.DataFrame, y: Dict[str, np.ndarray]):
        """
        Train the classifier
        
        Args:
            X: Feature DataFrame
            y: Labels dictionary
        """
        print("\nTraining classifier...")
        
        history = self.classifier.train(X, y, validation_split=0.2)
        
        return history
    
    def save_model(self):
        """Save trained model"""
        save_dir = self.config['model']['save_path']
        save_dir = str(Path(save_dir).parent)
        
        self.classifier.save(save_dir)
    
    def run_full_pipeline(self, split: str = 'Train', max_videos: Optional[int] = None):
        """
        Run complete training pipeline
        
        Args:
            split: Dataset split to use
            max_videos: Maximum videos to process (None = all)
        """
        # Load dataset
        self.load_dataset(split)
        
        # Extract features
        X, y = self.extract_features_from_dataset(max_videos=max_videos)
        
        # Train model
        self.train_model(X, y)
        
        # Save model
        self.save_model()
        
        print("\n" + "=" * 60)
        print("✅ Training pipeline complete!")
        print("=" * 60)


def main():
    """Main training script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train engagement classifier')
    parser.add_argument('--config', type=str, default='configs/config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--split', type=str, default='Train',
                       choices=['Train', 'Test', 'Validation'],
                       help='Dataset split to use')
    parser.add_argument('--max-videos', type=int, default=None,
                       help='Maximum number of videos to process (for testing)')
    parser.add_argument('--load-features', action='store_true',
                       help='Load pre-extracted features instead of extracting')
    
    args = parser.parse_args()
    
    # Initialize pipeline
    pipeline = TrainingPipeline(args.config)
    
    if args.load_features:
        # Load pre-extracted features
        print("Loading pre-extracted features...")
        
        processed_path = Path(pipeline.config['dataset']['processed_path'])
        features_file = processed_path / f"{args.split.lower()}_features.csv"
        labels_file = processed_path / f"{args.split.lower()}_labels.csv"
        
        if not features_file.exists() or not labels_file.exists():
            print(f"❌ Features not found. Please extract features first.")
            return
        
        X = pd.read_csv(features_file)
        y_df = pd.read_csv(labels_file)
        y = {col: y_df[col].values for col in y_df.columns}
        
        print(f"  ✅ Loaded {len(X)} samples")
        
        # Train model
        pipeline.train_model(X, y)
        pipeline.save_model()
        
    else:
        # Run full pipeline
        pipeline.run_full_pipeline(split=args.split, max_videos=args.max_videos)


if __name__ == "__main__":
    main()
