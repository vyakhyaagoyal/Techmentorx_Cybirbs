"""
Kaggle Dataset Downloader for DAiSEE
Downloads and extracts the DAiSEE dataset from Kaggle
"""

import os
import sys
import zipfile
from pathlib import Path
import subprocess


def check_kaggle_credentials():
    """Check if Kaggle API credentials are configured"""
    kaggle_dir = Path.home() / '.kaggle'
    kaggle_json = kaggle_dir / 'kaggle.json'
    
    if not kaggle_json.exists():
        print("❌ Kaggle API credentials not found!")
        print("\n📋 Setup Instructions:")
        print("1. Go to https://www.kaggle.com/settings")
        print("2. Scroll to 'API' section")
        print("3. Click 'Create New API Token'")
        print("4. Save the downloaded kaggle.json to:")
        print(f"   {kaggle_dir}")
        print("\n5. On Windows, run:")
        print(f"   mkdir {kaggle_dir}")
        print(f"   move kaggle.json {kaggle_dir}")
        return False
    
    print("✅ Kaggle credentials found")
    return True


def download_daisee_dataset(output_dir='data/raw'):
    """Download DAiSEE dataset from Kaggle"""
    
    # Check credentials first
    if not check_kaggle_credentials():
        sys.exit(1)
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print("\n📥 Downloading DAiSEE dataset from Kaggle...")
    print("⚠️  This is a large dataset (~15.3 GB). Download may take a while.")
    
    try:
        # Download using Kaggle API
        cmd = [
            'kaggle', 'datasets', 'download',
            '-d', 'olgaparfenova/daisee',
            '-p', str(output_path),
            '--unzip'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dataset downloaded successfully!")
            
            # Check if files exist
            daisee_path = output_path / 'DAiSEE'
            if not daisee_path.exists():
                # Files might be directly in output_path
                print(f"\n📁 Dataset location: {output_path}")
            else:
                print(f"\n📁 Dataset location: {daisee_path}")
            
            # Display directory structure
            print("\n📂 Dataset structure:")
            display_structure(output_path)
            
            return True
        else:
            print(f"❌ Error downloading dataset: {result.stderr}")
            return False
            
    except FileNotFoundError:
        print("❌ Kaggle CLI not found. Installing...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'kaggle'])
        print("✅ Kaggle installed. Please run this script again.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def display_structure(path, max_depth=2, current_depth=0, prefix=""):
    """Display directory structure"""
    if current_depth >= max_depth:
        return
    
    try:
        items = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name))
        for i, item in enumerate(items[:10]):  # Show first 10 items
            is_last = i == len(items) - 1
            current_prefix = "└── " if is_last else "├── "
            print(f"{prefix}{current_prefix}{item.name}")
            
            if item.is_dir() and current_depth < max_depth - 1:
                next_prefix = prefix + ("    " if is_last else "│   ")
                display_structure(item, max_depth, current_depth + 1, next_prefix)
        
        if len(items) > 10:
            print(f"{prefix}... and {len(items) - 10} more items")
    except PermissionError:
        pass


def verify_dataset(data_dir='data/raw'):
    """Verify that the dataset was downloaded correctly"""
    data_path = Path(data_dir)
    
    # Look for expected directories
    expected_dirs = ['Train', 'Test', 'Validation']
    
    print("\n🔍 Verifying dataset...")
    
    # Check if DAiSEE folder exists
    daisee_path = data_path / 'DAiSEE'
    if daisee_path.exists():
        base_path = daisee_path
    else:
        base_path = data_path
    
    found_dirs = []
    for dir_name in expected_dirs:
        dir_path = base_path / dir_name
        if dir_path.exists():
            found_dirs.append(dir_name)
            # Count videos
            video_count = sum(1 for _ in dir_path.rglob('*.avi')) + \
                         sum(1 for _ in dir_path.rglob('*.mp4'))
            print(f"  ✅ {dir_name}: {video_count} videos found")
        else:
            print(f"  ❌ {dir_name}: Not found")
    
    if len(found_dirs) == len(expected_dirs):
        print("\n✅ Dataset verification successful!")
        return True
    else:
        print(f"\n⚠️  Warning: Only found {len(found_dirs)}/{len(expected_dirs)} expected directories")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("DAiSEE Dataset Downloader")
    print("=" * 60)
    
    # Download dataset
    success = download_daisee_dataset()
    
    if success:
        # Verify dataset
        verify_dataset()
        
        print("\n" + "=" * 60)
        print("✅ Setup Complete!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Run: python scripts/preprocess_all.py")
        print("2. Run: python src/models/train_model.py")
        print("3. Run: streamlit run src/dashboard/dashboard_app.py")
    else:
        print("\n❌ Download failed. Please check the error messages above.")
