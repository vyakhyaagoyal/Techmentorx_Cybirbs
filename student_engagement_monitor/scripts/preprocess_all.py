"""
Complete preprocessing script
Extracts features from entire DAiSEE dataset
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent / 'src'))

from models.train_model import TrainingPipeline


def main():
    """
    Preprocess all dataset splits
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Preprocess DAiSEE dataset')
    parser.add_argument('--config', type=str, default='configs/config.yaml',
                       help='Path to configuration file')
    parser.add_argument('--splits', nargs='+', 
                       default=['Train', 'Validation', 'Test'],
                       help='Dataset splits to process')
    parser.add_argument('--max-videos', type=int, default=None,
                       help='Maximum videos per split (for testing)')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("DAiSEE Dataset Preprocessing")
    print("=" * 70)
    
    for split in args.splits:
        print(f"\n{'='*70}")
        print(f"Processing {split} split")
        print(f"{'='*70}")
        
        try:
            # Initialize pipeline
            pipeline = TrainingPipeline(args.config)
            
            # Load dataset
            pipeline.load_dataset(split)
            
            # Extract and save features
            pipeline.extract_features_from_dataset(
                max_videos=args.max_videos,
                save_features=True
            )
            
            print(f"\n✅ {split} split preprocessing complete!")
            
        except Exception as e:
            print(f"\n❌ Error processing {split} split: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    print("\n" + "=" * 70)
    print("✅ All preprocessing complete!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Train model: python src/models/train_model.py --load-features")
    print("2. Evaluate model: python src/models/evaluate_model.py")


if __name__ == "__main__":
    main()
