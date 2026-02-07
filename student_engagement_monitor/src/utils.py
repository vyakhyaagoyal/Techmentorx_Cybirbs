"""
Utility functions for loading configuration files
"""

import yaml
from pathlib import Path
from typing import Dict, Any


def load_config(config_path: str = 'configs/config.yaml') -> Dict[str, Any]:
    """
    Load configuration from YAML file
    
    Args:
        config_path: Path to configuration file
        
    Returns:
        Dictionary containing configuration
    """
    config_file = Path(config_path)
    
    if not config_file.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_file, 'r') as f:
        config = yaml.safe_load(f)
    
    return config


def get_dataset_paths(config: Dict[str, Any]) -> Dict[str, Path]:
    """
    Get dataset paths from configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Dictionary with dataset paths
    """
    dataset_config = config.get('dataset', {})
    
    return {
        'raw': Path(dataset_config.get('raw_path', 'data/raw/DAiSEE')),
        'processed': Path(dataset_config.get('processed_path', 'data/processed')),
        'labels': Path(dataset_config.get('labels_path', 'data/labels')),
        'train': Path(dataset_config.get('raw_path', 'data/raw/DAiSEE')) / dataset_config.get('train_split', 'Train'),
        'test': Path(dataset_config.get('raw_path', 'data/raw/DAiSEE')) / dataset_config.get('test_split', 'Test'),
        'validation': Path(dataset_config.get('raw_path', 'data/raw/DAiSEE')) / dataset_config.get('validation_split', 'Validation')
    }


def get_model_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get model configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Model configuration dictionary
    """
    return config.get('model', {})


def get_feature_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get feature extraction configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Feature configuration dictionary
    """
    return config.get('features', {})


def get_cctv_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get CCTV processing configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        CCTV configuration dictionary
    """
    return config.get('cctv', {})


def get_privacy_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get privacy settings configuration
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Privacy configuration dictionary
    """
    return config.get('privacy', {})
