"""
Model Evaluation
Evaluate trained engagement classifier on test set
"""

import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Optional
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import confusion_matrix, classification_report
import sys

sys.path.append(str(Path(__file__).parent.parent))

from models.engagement_classifier import EngagementClassifier
from utils import load_config


class ModelEvaluator:
    """
    Evaluate engagement classifier performance
    """
    
    def __init__(self, model_dir: str):
        """
        Initialize evaluator
        
        Args:
            model_dir: Directory containing trained models
        """
        self.classifier = EngagementClassifier()
        self.classifier.load(model_dir)
        
        print(f"✅ Model loaded from {model_dir}")
    
    def evaluate(self, X: pd.DataFrame, y: Dict[str, np.ndarray]) -> Dict:
        """
        Evaluate model on test data
        
        Args:
            X: Feature DataFrame
            y: True labels dictionary
            
        Returns:
            Dictionary with evaluation metrics
        """
        print("\nEvaluating model...")
        
        # Get predictions
        predictions = self.classifier.predict(X)
        
        metrics = {}
        
        # Evaluate each affective state
        for state in ['boredom', 'engagement', 'confusion', 'frustration']:
            if state not in y or state not in predictions:
                continue
            
            y_true = y[state]
            y_pred = predictions[state]
            
            # Regression metrics
            rmse = np.sqrt(mean_squared_error(y_true, y_pred))
            mae = mean_absolute_error(y_true, y_pred)
            r2 = r2_score(y_true, y_pred)
            
            # Classification metrics (round to nearest integer)
            y_true_class = np.round(y_true).astype(int)
            y_pred_class = np.round(y_pred).astype(int)
            
            accuracy = np.mean(y_true_class == y_pred_class)
            
            metrics[state] = {
                'rmse': float(rmse),
                'mae': float(mae),
                'r2': float(r2),
                'accuracy': float(accuracy)
            }
            
            print(f"\n{state.upper()}:")
            print(f"  RMSE: {rmse:.4f}")
            print(f"  MAE: {mae:.4f}")
            print(f"  R²: {r2:.4f}")
            print(f"  Accuracy: {accuracy:.4f}")
        
        # Overall accuracy
        all_accuracies = [m['accuracy'] for m in metrics.values()]
        overall_accuracy = np.mean(all_accuracies)
        metrics['overall_accuracy'] = float(overall_accuracy)
        
        print(f"\n{'='*40}")
        print(f"OVERALL ACCURACY: {overall_accuracy:.4f} ({overall_accuracy*100:.2f}%)")
        print(f"{'='*40}")
        
        return metrics
    
    def plot_confusion_matrices(self, X: pd.DataFrame, y: Dict[str, np.ndarray],
                               save_path: Optional[str] = None):
        """
        Plot confusion matrices for each affective state
        
        Args:
            X: Feature DataFrame
            y: True labels dictionary
            save_path: Path to save plot
        """
        predictions = self.classifier.predict(X)
        
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        axes = axes.flatten()
        
        for idx, state in enumerate(['boredom', 'engagement', 'confusion', 'frustration']):
            if state not in y or state not in predictions:
                continue
            
            y_true = np.round(y[state]).astype(int)
            y_pred = np.round(predictions[state]).astype(int)
            
            # Compute confusion matrix
            cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3])
            
            # Plot
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[idx],
                       xticklabels=[0, 1, 2, 3], yticklabels=[0, 1, 2, 3])
            axes[idx].set_title(f'{state.capitalize()} Confusion Matrix')
            axes[idx].set_ylabel('True Label')
            axes[idx].set_xlabel('Predicted Label')
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  💾 Confusion matrices saved to {save_path}")
        
        plt.show()
    
    def plot_predictions_vs_actual(self, X: pd.DataFrame, y: Dict[str, np.ndarray],
                                   save_path: Optional[str] = None):
        """
        Plot predicted vs actual values
        
        Args:
            X: Feature DataFrame
            y: True labels dictionary
            save_path: Path to save plot
        """
        predictions = self.classifier.predict(X)
        
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        axes = axes.flatten()
        
        for idx, state in enumerate(['boredom', 'engagement', 'confusion', 'frustration']):
            if state not in y or state not in predictions:
                continue
            
            y_true = y[state]
            y_pred = predictions[state]
            
            # Scatter plot
            axes[idx].scatter(y_true, y_pred, alpha=0.5, s=20)
            axes[idx].plot([0, 3], [0, 3], 'r--', lw=2, label='Perfect Prediction')
            axes[idx].set_xlim(-0.5, 3.5)
            axes[idx].set_ylim(-0.5, 3.5)
            axes[idx].set_xlabel('True Value')
            axes[idx].set_ylabel('Predicted Value')
            axes[idx].set_title(f'{state.capitalize()}')
            axes[idx].legend()
            axes[idx].grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            print(f"  💾 Prediction plot saved to {save_path}")
        
        plt.show()
    
    def generate_report(self, X: pd.DataFrame, y: Dict[str, np.ndarray],
                       output_dir: str = 'outputs/reports'):
        """
        Generate comprehensive evaluation report
        
        Args:
            X: Feature DataFrame
            y: True labels dictionary
            output_dir: Directory to save report
        """
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        print("\nGenerating evaluation report...")
        
        # Evaluate
        metrics = self.evaluate(X, y)
        
        # Save metrics to JSON
        import json
        metrics_file = output_path / 'evaluation_metrics.json'
        with open(metrics_file, 'w') as f:
            json.dump(metrics, f, indent=2)
        print(f"  💾 Metrics saved to {metrics_file}")
        
        # Plot confusion matrices
        cm_file = output_path / 'confusion_matrices.png'
        self.plot_confusion_matrices(X, y, save_path=str(cm_file))
        
        # Plot predictions vs actual
        pred_file = output_path / 'predictions_vs_actual.png'
        self.plot_predictions_vs_actual(X, y, save_path=str(pred_file))
        
        print("\n✅ Evaluation report generated!")


def main():
    """Main evaluation script"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Evaluate engagement classifier')
    parser.add_argument('--model-dir', type=str, default='models/trained',
                       help='Directory containing trained models')
    parser.add_argument('--test-features', type=str, 
                       default='data/processed/test_features.csv',
                       help='Path to test features CSV')
    parser.add_argument('--test-labels', type=str,
                       default='data/processed/test_labels.csv',
                       help='Path to test labels CSV')
    parser.add_argument('--output-dir', type=str, default='outputs/reports',
                       help='Directory to save evaluation report')
    
    args = parser.parse_args()
    
    # Check if test data exists
    if not Path(args.test_features).exists():
        print(f"❌ Test features not found: {args.test_features}")
        print("Please extract features from test set first:")
        print("  python src/models/train_model.py --split Test --max-videos 100")
        return
    
    # Load test data
    print("Loading test data...")
    X = pd.read_csv(args.test_features)
    y_df = pd.read_csv(args.test_labels)
    y = {col: y_df[col].values for col in y_df.columns}
    
    print(f"  ✅ Loaded {len(X)} test samples")
    
    # Initialize evaluator
    evaluator = ModelEvaluator(args.model_dir)
    
    # Generate report
    evaluator.generate_report(X, y, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
