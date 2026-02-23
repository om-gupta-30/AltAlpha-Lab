"""
Machine Learning Prediction Module for AltAlpha Lab.

Predicts next-day market direction using RandomForest classification.
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    roc_auc_score,
    confusion_matrix,
)

from features import merge_price_and_sentiment


def prepare_ml_features(ticker: str) -> pd.DataFrame:
    """
    Prepare feature dataset for ML model.

    Features:
        - returns: daily returns
        - rolling_sentiment_5d: 5-day rolling sentiment average
        - volatility_5d: 5-day return volatility
        - sentiment: daily sentiment score
        - returns_avg_5d: 5-day rolling mean of returns

    Target:
        - target: 1 if next day return > 0, else 0

    Args:
        ticker: Stock ticker symbol

    Returns:
        DataFrame with features and target, NaN rows dropped
    """
    df = merge_price_and_sentiment(ticker)
    if df.empty:
        return pd.DataFrame()

    # Rename for clarity
    df = df.rename(columns={"sentiment_avg_5d": "rolling_sentiment_5d"})

    # Add 5-day rolling mean of returns
    df["returns_avg_5d"] = (
        df["returns"]
        .rolling(window=5, min_periods=1)
        .mean()
        .round(6)
    )

    # Create target: next day return direction
    # Shift returns by -1 to get next day's return
    df["next_day_return"] = df["returns"].shift(-1)
    df["target"] = (df["next_day_return"] > 0).astype(int)

    # Drop rows with NaN (last row has no next day return)
    df = df.dropna()

    return df


def get_feature_columns() -> list:
    """Return list of feature column names."""
    return [
        "returns",
        "rolling_sentiment_5d",
        "volatility_5d",
        "sentiment",
        "returns_avg_5d",
    ]


def train_test_split_time_based(
    df: pd.DataFrame,
    train_ratio: float = 0.8,
) -> tuple:
    """
    Perform time-based train/test split.

    Avoids data leakage by using chronological ordering.

    Args:
        df: DataFrame with features and target (sorted by date)
        train_ratio: Fraction of data for training (default: 0.8)

    Returns:
        Tuple of (X_train, X_test, y_train, y_test)
    """
    feature_cols = get_feature_columns()

    # Time-based split (no shuffle to avoid leakage)
    split_idx = int(len(df) * train_ratio)

    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    X_train = train_df[feature_cols]
    X_test = test_df[feature_cols]
    y_train = train_df["target"]
    y_test = test_df["target"]

    return X_train, X_test, y_train, y_test


def train_model(X_train: pd.DataFrame, y_train: pd.Series) -> RandomForestClassifier:
    """
    Train RandomForest classifier.

    Args:
        X_train: Training features
        y_train: Training target

    Returns:
        Trained RandomForestClassifier
    """
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=5,
        min_samples_split=10,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    return model


def evaluate_model(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    """
    Evaluate model performance with comprehensive metrics.

    Args:
        model: Trained classifier
        X_test: Test features
        y_test: Test target

    Returns:
        Dictionary with accuracy, precision, recall, ROC AUC, and confusion matrix
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]  # Probability of "up" class

    # Confusion matrix: [[TN, FP], [FN, TP]]
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # ROC AUC score
    try:
        roc_auc = roc_auc_score(y_test, y_prob)
    except ValueError:
        # Handle case where only one class is present
        roc_auc = 0.5

    return {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc, 4),
        "up_prediction": {
            "precision": round(precision_score(y_test, y_pred, zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, zero_division=0), 4),
        },
        "down_prediction": {
            "precision": round(precision_score(y_test, y_pred, pos_label=0, zero_division=0), 4),
            "recall": round(recall_score(y_test, y_pred, pos_label=0, zero_division=0), 4),
        },
        "confusion_matrix": {
            "true_negative": int(tn),
            "false_positive": int(fp),
            "false_negative": int(fn),
            "true_positive": int(tp),
        },
    }


def calculate_rolling_accuracy(
    y_test: pd.Series,
    y_pred: np.ndarray,
    test_dates: pd.Series,
    window: int = 30,
) -> list:
    """
    Calculate rolling prediction accuracy over time.

    Args:
        y_test: Actual test labels
        y_pred: Predicted labels
        test_dates: Dates corresponding to test predictions
        window: Rolling window size in days (default: 30)

    Returns:
        List of dictionaries with date and rolling accuracy
    """
    # Create DataFrame for rolling calculation
    results_df = pd.DataFrame({
        "date": test_dates.values,
        "actual": y_test.values,
        "predicted": y_pred,
    })

    # Calculate correct predictions
    results_df["correct"] = (results_df["actual"] == results_df["predicted"]).astype(int)

    # Calculate rolling accuracy
    results_df["rolling_accuracy"] = (
        results_df["correct"]
        .rolling(window=window, min_periods=1)
        .mean()
        .round(4)
    )

    # Return as list of records (skip first few rows for cleaner output)
    output = results_df[["date", "rolling_accuracy"]].iloc[window - 1:]
    return output.to_dict(orient="records")


def generate_prediction_confidence(
    model: RandomForestClassifier,
    X_test: pd.DataFrame,
    test_dates: pd.Series,
) -> list:
    """
    Generate prediction confidence scores for each test prediction.

    Args:
        model: Trained classifier
        X_test: Test features
        test_dates: Dates corresponding to test data

    Returns:
        List of dictionaries with date, prediction, and confidence
    """
    y_prob = model.predict_proba(X_test)
    y_pred = model.predict(X_test)

    predictions = []
    for i in range(len(X_test)):
        prob_down, prob_up = y_prob[i]
        prediction = int(y_pred[i])
        confidence = prob_up if prediction == 1 else prob_down

        predictions.append({
            "date": test_dates.iloc[i],
            "prediction": "up" if prediction == 1 else "down",
            "confidence": round(float(confidence), 4),
            "prob_up": round(float(prob_up), 4),
            "prob_down": round(float(prob_down), 4),
        })

    return predictions


def get_feature_importance(
    model: RandomForestClassifier,
    feature_cols: list,
) -> list:
    """
    Get ranked feature importance from trained model.

    Args:
        model: Trained RandomForest classifier
        feature_cols: List of feature column names

    Returns:
        List of dictionaries with feature name, importance, and rank
    """
    importance = model.feature_importances_

    # Sort by importance descending
    sorted_features = sorted(
        zip(feature_cols, importance),
        key=lambda x: x[1],
        reverse=True,
    )

    return [
        {
            "rank": rank + 1,
            "feature": col,
            "importance": round(float(imp), 4),
        }
        for rank, (col, imp) in enumerate(sorted_features)
    ]


def predict_next_day(ticker: str) -> dict:
    """
    Run full ML pipeline to predict next day market direction.

    Steps:
        1. Load and prepare feature dataset
        2. Time-based train/test split (80/20)
        3. Train RandomForest classifier
        4. Evaluate on test set with comprehensive metrics
        5. Generate prediction confidence scores
        6. Calculate rolling accuracy
        7. Generate prediction for latest data point

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dictionary with:
            - ticker: Stock symbol
            - evaluation_metrics: Accuracy, ROC AUC, confusion matrix, precision/recall
            - latest_prediction: Prediction for most recent data with confidence
            - feature_importance: Ranked list of feature importances
            - rolling_accuracy: 30-day rolling accuracy series
            - prediction_confidence: Confidence scores for test predictions
            - train_size: Number of training samples
            - test_size: Number of test samples
    """
    # Prepare features
    df = prepare_ml_features(ticker)
    if df.empty or len(df) < 20:
        return {}

    # Store dates for later use
    df = df.reset_index(drop=True)

    # Time-based split
    feature_cols = get_feature_columns()
    split_idx = int(len(df) * 0.8)

    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    X_train = train_df[feature_cols]
    X_test = test_df[feature_cols]
    y_train = train_df["target"]
    y_test = test_df["target"]
    test_dates = test_df["date"]

    if len(X_train) < 10 or len(X_test) < 5:
        return {}

    # Train model
    model = train_model(X_train, y_train)

    # Get predictions for test set
    y_pred = model.predict(X_test)

    # Comprehensive evaluation metrics
    evaluation_metrics = evaluate_model(model, X_test, y_test)

    # Feature importance (ranked)
    importance = get_feature_importance(model, feature_cols)

    # Rolling accuracy (30-day window)
    rolling_accuracy = calculate_rolling_accuracy(y_test, y_pred, test_dates, window=30)

    # Prediction confidence for test set (last 20 predictions for API response)
    prediction_confidence = generate_prediction_confidence(model, X_test, test_dates)
    recent_predictions = prediction_confidence[-20:]  # Last 20 for response brevity

    # Predict for the most recent data point
    latest_features = df[feature_cols].iloc[[-1]]
    latest_probs = model.predict_proba(latest_features)[0]
    latest_pred = model.predict(latest_features)[0]

    latest_prediction = {
        "date": df["date"].iloc[-1],
        "prediction": "up" if latest_pred == 1 else "down",
        "confidence": round(float(latest_probs[latest_pred]), 4),
        "prob_up": round(float(latest_probs[1]), 4),
        "prob_down": round(float(latest_probs[0]), 4),
    }

    return {
        "ticker": ticker.upper(),
        "evaluation_metrics": evaluation_metrics,
        "latest_prediction": latest_prediction,
        "feature_importance": importance,
        "rolling_accuracy": rolling_accuracy,
        "recent_predictions": recent_predictions,
        "data_info": {
            "train_size": len(X_train),
            "test_size": len(X_test),
            "train_period": {
                "start": train_df["date"].iloc[0],
                "end": train_df["date"].iloc[-1],
            },
            "test_period": {
                "start": test_df["date"].iloc[0],
                "end": test_df["date"].iloc[-1],
            },
        },
    }
