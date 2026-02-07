"""
XGBoost Engagement Classifier
Multi-output classifier for student engagement prediction
"""

import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import json


class EngagementClassifier:
    """
    XGBoost classifier for predicting student engagement levels
    Predicts: Boredom, Engagement, Confusion, Frustration (each on 0-3 scale)
    """
    
    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize classifier
        
        Args:
            config: Model configuration dictionary
        """
        self.config = config or self._default_config()
        
        # Initialize models (one for each affective state)
        self.models = {
            'boredom': None,
            'engagement': None,
            'confusion': None,
            'frustration': None
        }
        
        self.scaler = StandardScaler()
        self.feature_names = None
        self.is_trained = False
    
    def _default_config(self) -> Dict:
        """Default model configuration"""
        return {
            'objective': 'reg:squarederror',  # Regression for 0-3 scale
            'max_depth': 8,
            'learning_rate': 0.05,
            'n_estimators': 300,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'tree_method': 'hist',  # Use 'gpu_hist' if GPU available
            'eval_metric': 'rmse',
            'early_stopping_rounds': 20,
            'random_state': 42
        }
    
    def train(self, X: np.ndarray, y: Dict[str, np.ndarray], 
              validation_split: float = 0.2) -> Dict:
        """
        Train the classifier
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Dictionary with labels for each affective state
               {'boredom': array, 'engagement': array, ...}
            validation_split: Fraction of data for validation
            
        Returns:
            Training history dictionary
        """
        print("Training XGBoost models...")
        
        # Store feature names
        if isinstance(X, pd.DataFrame):
            self.feature_names = X.columns.tolist()
            X = X.values
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        history = {}
        
        # Train a separate model for each affective state
        for state in ['boredom', 'engagement', 'confusion', 'frustration']:
            print(f"\nTraining {state} model...")
            
            if state not in y:
                print(f"  ⚠️  Warning: No labels for {state}, skipping")
                continue
            
            y_state = y[state]
            
            # Split data
            X_train, X_val, y_train, y_val = train_test_split(
                X_scaled, y_state, 
                test_size=validation_split,
                random_state=42
            )
            
            # Create DMatrix for XGBoost
            dtrain = xgb.DMatrix(X_train, label=y_train)
            dval = xgb.DMatrix(X_val, label=y_val)
            
            # Train model
            evals = [(dtrain, 'train'), (dval, 'val')]
            evals_result = {}
            
            self.models[state] = xgb.train(
                self.config,
                dtrain,
                num_boost_round=self.config['n_estimators'],
                evals=evals,
                evals_result=evals_result,
                early_stopping_rounds=self.config.get('early_stopping_rounds', 20),
                verbose_eval=50
            )
            
            # Store training history
            history[state] = evals_result
            
            # Evaluate on validation set
            y_pred = self.models[state].predict(dval)
            rmse = np.sqrt(mean_squared_error(y_val, y_pred))
            
            print(f"  ✅ {state.capitalize()} model trained - Validation RMSE: {rmse:.4f}")
        
        self.is_trained = True
        print("\n✅ All models trained successfully!")
        
        return history
    
    def predict(self, X: np.ndarray) -> Dict[str, np.ndarray]:
        """
        Predict engagement levels
        
        Args:
            X: Feature matrix (n_samples, n_features)
            
        Returns:
            Dictionary with predictions for each affective state
        """
        if not self.is_trained:
            raise ValueError("Model not trained. Call train() first.")
        
        # Handle DataFrame input
        if isinstance(X, pd.DataFrame):
            X = X.values
        
        # Normalize features
        X_scaled = self.scaler.transform(X)
        
        # Create DMatrix
        dmatrix = xgb.DMatrix(X_scaled)
        
        # Predict for each state
        predictions = {}
        for state, model in self.models.items():
            if model is not None:
                pred = model.predict(dmatrix)
                # Clip predictions to valid range [0, 3]
                predictions[state] = np.clip(pred, 0, 3)
        
        return predictions
    
    def predict_single(self, features: np.ndarray) -> Dict[str, float]:
        """
        Predict for a single sample
        
        Args:
            features: Feature vector (n_features,)
            
        Returns:
            Dictionary with predictions
        """
        if features.ndim == 1:
            features = features.reshape(1, -1)
        
        predictions = self.predict(features)
        
        # Convert to single values
        return {state: float(pred[0]) for state, pred in predictions.items()}
    
    def get_engagement_score(self, predictions: Dict[str, float]) -> float:
        """
        Calculate overall engagement score from predictions
        
        Args:
            predictions: Dictionary with affective state predictions
            
        Returns:
            Overall engagement score (0-1, higher is better)
        """
        # Engagement score formula:
        # High engagement + Low boredom + Low confusion + Low frustration = Good
        engagement = predictions.get('engagement', 0) / 3.0
        boredom = 1 - (predictions.get('boredom', 0) / 3.0)
        confusion = 1 - (predictions.get('confusion', 0) / 3.0)
        frustration = 1 - (predictions.get('frustration', 0) / 3.0)
        
        # Weighted average (engagement weighted more heavily)
        score = (
            0.4 * engagement +
            0.3 * boredom +
            0.15 * confusion +
            0.15 * frustration
        )
        
        return float(score)
    
    def get_feature_importance(self, state: str = 'engagement') -> Dict[str, float]:
        """
        Get feature importance for a specific model
        
        Args:
            state: Affective state ('boredom', 'engagement', etc.)
            
        Returns:
            Dictionary mapping feature names to importance scores
        """
        if state not in self.models or self.models[state] is None:
            raise ValueError(f"No model trained for {state}")
        
        importance = self.models[state].get_score(importance_type='gain')
        
        # Map feature indices to names if available
        if self.feature_names:
            importance = {
                self.feature_names[int(k.replace('f', ''))]: v
                for k, v in importance.items()
            }
        
        # Sort by importance
        importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
        
        return importance
    
    def save(self, save_dir: str):
        """
        Save models and scaler
        
        Args:
            save_dir: Directory to save models
        """
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save each model
        for state, model in self.models.items():
            if model is not None:
                model_file = save_path / f'{state}_model.json'
                model.save_model(str(model_file))
        
        # Save scaler
        scaler_file = save_path / 'scaler.pkl'
        joblib.dump(self.scaler, str(scaler_file))
        
        # Save metadata
        metadata = {
            'feature_names': self.feature_names,
            'config': self.config,
            'is_trained': self.is_trained
        }
        metadata_file = save_path / 'metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Models saved to {save_path}")
    
    def load(self, load_dir: str):
        """
        Load models and scaler
        
        Args:
            load_dir: Directory containing saved models
        """
        load_path = Path(load_dir)
        
        if not load_path.exists():
            raise FileNotFoundError(f"Model directory not found: {load_path}")
        
        # Load metadata
        metadata_file = load_path / 'metadata.json'
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        self.feature_names = metadata['feature_names']
        self.config = metadata['config']
        self.is_trained = metadata['is_trained']
        
        # Load scaler
        scaler_file = load_path / 'scaler.pkl'
        self.scaler = joblib.load(str(scaler_file))
        
        # Load each model
        for state in ['boredom', 'engagement', 'confusion', 'frustration']:
            model_file = load_path / f'{state}_model.json'
            if model_file.exists():
                self.models[state] = xgb.Booster()
                self.models[state].load_model(str(model_file))
        
        print(f"✅ Models loaded from {load_path}")


if __name__ == "__main__":
    # Test classifier with dummy data
    print("Testing Engagement Classifier with dummy data...\n")
    
    # Generate dummy data
    np.random.seed(42)
    n_samples = 1000
    n_features = 50
    
    X = np.random.randn(n_samples, n_features)
    y = {
        'boredom': np.random.randint(0, 4, n_samples),
        'engagement': np.random.randint(0, 4, n_samples),
        'confusion': np.random.randint(0, 4, n_samples),
        'frustration': np.random.randint(0, 4, n_samples)
    }
    
    # Initialize and train
    classifier = EngagementClassifier()
    history = classifier.train(X, y, validation_split=0.2)
    
    # Test prediction
    X_test = np.random.randn(5, n_features)
    predictions = classifier.predict(X_test)
    
    print("\nSample predictions:")
    for i in range(5):
        pred = {state: preds[i] for state, preds in predictions.items()}
        score = classifier.get_engagement_score(pred)
        print(f"  Sample {i+1}: {pred}")
        print(f"    Engagement Score: {score:.3f}")
    
    # Feature importance
    print("\nTop 10 important features for engagement:")
    importance = classifier.get_feature_importance('engagement')
    for i, (feature, score) in enumerate(list(importance.items())[:10]):
        print(f"  {i+1}. {feature}: {score:.2f}")
    
    # Save model
    classifier.save('models/trained')
    print("\n✅ Test complete!")
