"""
Trading strategy module for AltAlpha Lab.
"""

import numpy as np
import pandas as pd

from features import merge_price_and_sentiment


def generate_sentiment_strategy(
    ticker: str,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> pd.DataFrame:
    """
    Generate trading signals based on sentiment and volatility.

    Signal Rules:
        - Long (1): sentiment_avg_5d > threshold AND volatility_5d < percentile
        - Short (-1): sentiment_avg_5d < -threshold
        - Flat (0): otherwise

    Position is shifted by 1 day to prevent look-ahead bias.

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        sentiment_threshold: Threshold for sentiment signal (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50 = median)

    Returns:
        DataFrame with columns: date, close, returns, sentiment, position
    """
    # Load merged feature dataset
    df = merge_price_and_sentiment(ticker)

    if df.empty:
        return pd.DataFrame()

    # Calculate volatility threshold based on percentile
    volatility_threshold = np.percentile(df["volatility_5d"].dropna(), volatility_percentile)

    # Generate trading signals
    conditions = [
        # Long: positive sentiment and low volatility
        (df["sentiment_avg_5d"] > sentiment_threshold) & (df["volatility_5d"] < volatility_threshold),
        # Short: negative sentiment
        (df["sentiment_avg_5d"] < -sentiment_threshold),
    ]
    choices = [1, -1]

    df["position"] = np.select(conditions, choices, default=0)

    # Shift position by 1 day to prevent look-ahead bias
    df["position"] = df["position"].shift(1).fillna(0).astype(int)

    # Select output columns
    output_columns = ["date", "close", "returns", "sentiment", "position"]
    result = df[output_columns].copy()

    return result
