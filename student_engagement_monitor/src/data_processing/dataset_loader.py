"""
DAiSEE Dataset Loader
Loads video clips and labels from the DAiSEE dataset
"""

import os
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np


class DAiSEEDataLoader:
    """
    Loader for DAiSEE (Dataset for Affective States in E-Environments)
    
    Dataset structure:
    - Train/Test/Validation folders
    - Each contains subject folders
    - Each subject folder contains video folders
    - Each video folder contains a video clip
    """
    
    def __init__(self, dataset_root: str, split: str = 'Train'):
        """
        Initialize dataset loader
        
        Args:
            dataset_root: Root directory of DAiSEE dataset
            split: Dataset split ('Train', 'Test', or 'Validation')
        """
        self.dataset_root = Path(dataset_root)
        self.split = split
        self.split_path = self.dataset_root / split
        
        if not self.split_path.exists():
            raise ValueError(f"Split directory not found: {self.split_path}")
        
        self.video_list = []
        self.labels_df = None
        
        # Load video list and labels
        self._load_video_list()
        self._load_labels()
    
    def _load_video_list(self):
        """Load list of all video files in the split"""
        print(f"Loading {self.split} video list...")
        
        # Find all video files
        # Structure: Split/SubjectID/ClipID/ClipID.avi
        
        for subject_dir in self.split_path.iterdir():
            if not subject_dir.is_dir():
                continue
            
            # Iterate through clip folders
            for clip_dir in subject_dir.iterdir():
                if not clip_dir.is_dir():
                    continue
                
                # Look for video file in clip directory
                # It usually has the same name as the clip directory + extension
                video_files = list(clip_dir.glob('*.avi')) + list(clip_dir.glob('*.mp4')) + list(clip_dir.glob('*.mov'))
                
                if video_files:
                    video_path = video_files[0]
                    
                    # Extract metadata
                    subject_id = subject_dir.name
                    clip_id = video_path.name  # Use filename as clip_id (e.g., 1100011002.avi)
                    
                    self.video_list.append({
                        'path': video_path,
                        'subject_id': subject_id,
                        'video_id': clip_dir.name,
                        'clip_id': clip_id
                    })

        print(f"Found {len(self.video_list)} videos in {self.split} split")
    
    def _load_labels(self):
        """Load labels from Labels folder"""
        labels_dir = self.dataset_root.parent / 'Labels'
        
        if not labels_dir.exists():
            # Try alternative location
            labels_dir = self.dataset_root / 'Labels'
        
        if not labels_dir.exists():
            print(f"⚠️  Warning: Labels directory not found. Expected at {labels_dir}")
            return
        
        # Look for label files
        label_file = labels_dir / f'{self.split}Labels.csv'
        
        if not label_file.exists():
            # Try alternative naming
            label_file = labels_dir / f'{self.split.lower()}.csv'
        
        if label_file.exists():
            print(f"Loading labels from {label_file}")
            self.labels_df = pd.read_csv(label_file)
            print(f"Loaded {len(self.labels_df)} label entries")
        else:
            print(f"⚠️  Warning: Label file not found: {label_file}")
    
    def get_video_paths(self) -> List[Path]:
        """Get list of all video file paths"""
        return [item['path'] for item in self.video_list]
    
    def get_video_info(self, index: int) -> Dict:
        """Get information about a specific video"""
        if index < 0 or index >= len(self.video_list):
            raise IndexError(f"Index {index} out of range")
        
        return self.video_list[index]
    
    def get_labels(self, clip_id: str) -> Optional[Dict]:
        """
        Get labels for a specific clip
        
        Args:
            clip_id: Clip identifier (format: subjectID_videoID)
            
        Returns:
            Dictionary with labels or None if not found
        """
        if self.labels_df is None:
            return None
        
        # DAiSEE labels format: ClipID, Boredom, Engagement, Confusion, Frustration
        # Each on a scale of 0-3
        
        # Try to find the clip in labels
        # The ClipID format might vary, so we'll try different formats
        possible_ids = [
            clip_id,
            clip_id.replace('_', ''),
            clip_id.split('_')[0] + clip_id.split('_')[1] if '_' in clip_id else clip_id
        ]
        
        for pid in possible_ids:
            matches = self.labels_df[self.labels_df['ClipID'] == pid]
            if not matches.empty:
                row = matches.iloc[0]
                return {
                    'boredom': int(row.get('Boredom', 0)),
                    'engagement': int(row.get('Engagement', 0)),
                    'confusion': int(row.get('Confusion', 0)),
                    'frustration': int(row.get('Frustration', 0))
                }
        
        return None
    
    def __len__(self) -> int:
        """Get number of videos in dataset"""
        return len(self.video_list)
    
    def __getitem__(self, index: int) -> Tuple[Path, Optional[Dict]]:
        """
        Get video path and labels by index
        
        Args:
            index: Video index
            
        Returns:
            Tuple of (video_path, labels_dict)
        """
        video_info = self.get_video_info(index)
        video_path = video_info['path']
        clip_id = video_info['clip_id']
        labels = self.get_labels(clip_id)
        
        return video_path, labels
    
    def get_statistics(self) -> Dict:
        """Get dataset statistics"""
        stats = {
            'total_videos': len(self.video_list),
            'total_subjects': len(set(item['subject_id'] for item in self.video_list))
        }
        
        if self.labels_df is not None:
            stats['labeled_videos'] = len(self.labels_df)
            
            # Calculate label distributions
            for label in ['Boredom', 'Engagement', 'Confusion', 'Frustration']:
                if label in self.labels_df.columns:
                    stats[f'{label.lower()}_mean'] = self.labels_df[label].mean()
                    stats[f'{label.lower()}_std'] = self.labels_df[label].std()
        
        return stats


def load_all_splits(dataset_root: str) -> Dict[str, DAiSEEDataLoader]:
    """
    Load all dataset splits
    
    Args:
        dataset_root: Root directory of DAiSEE dataset
        
    Returns:
        Dictionary with train, test, and validation loaders
    """
    loaders = {}
    
    for split in ['Train', 'Test', 'Validation']:
        try:
            loaders[split.lower()] = DAiSEEDataLoader(dataset_root, split)
        except ValueError as e:
            print(f"Warning: Could not load {split} split: {e}")
    
    return loaders


if __name__ == "__main__":
    # Test the loader
    import sys
    
    if len(sys.argv) > 1:
        dataset_path = sys.argv[1]
    else:
        dataset_path = "data/raw/DAiSEE"
    
    print(f"Testing DAiSEE loader with dataset: {dataset_path}\n")
    
    # Load all splits
    loaders = load_all_splits(dataset_path)
    
    # Print statistics
    for split_name, loader in loaders.items():
        print(f"\n{split_name.upper()} Split:")
        print("-" * 40)
        stats = loader.get_statistics()
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        # Show first video example
        if len(loader) > 0:
            video_path, labels = loader[0]
            print(f"\n  Example video: {video_path.name}")
            if labels:
                print(f"  Labels: {labels}")
