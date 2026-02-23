"""
Sentiment analysis functions for AltAlpha Lab.
"""

import numpy as np
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from data import get_price_data


# Initialize VADER sentiment analyzer
analyzer = SentimentIntensityAnalyzer()


def get_mock_sentiment_series(ticker: str) -> pd.DataFrame:
    """
    Generate mock daily sentiment scores aligned with price data dates.

    For demonstration purposes, generates random sentiment values.
    In production, this would analyze actual news/social media data.

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')

    Returns:
        DataFrame with columns: date, sentiment (-1 to 1)
    """
    # Get price data to align dates
    price_data = get_price_data(ticker)

    if not price_data:
        return pd.DataFrame(columns=["date", "sentiment"])

    # Extract dates from price data
    dates = [entry["date"] for entry in price_data]

    # Generate mock sentiment values between -1 and 1
    # Using a random walk with mean reversion for more realistic patterns
    np.random.seed(hash(ticker) % (2**32))  # Reproducible per ticker
    n = len(dates)

    # Generate base random values
    raw_sentiment = np.random.randn(n) * 0.3

    # Apply smoothing for more realistic time series
    smoothed = pd.Series(raw_sentiment).rolling(window=5, min_periods=1).mean()

    # Clip to [-1, 1] range
    sentiment_values = np.clip(smoothed.values, -1, 1)

    # Create DataFrame
    df = pd.DataFrame({
        "date": dates,
        "sentiment": np.round(sentiment_values, 4),
    })

    return df
