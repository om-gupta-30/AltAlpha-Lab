"""
Feature engineering module for AltAlpha Lab.
"""

import pandas as pd

from data import get_price_data
from sentiment import get_mock_sentiment_series


def merge_price_and_sentiment(ticker: str) -> pd.DataFrame:
    """
    Merge price and sentiment data with computed features.

    Steps:
        1. Load price data
        2. Load sentiment data
        3. Merge on date
        4. Compute rolling features:
           - 5-day rolling sentiment average
           - 5-day return volatility
        5. Return combined dataframe

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')

    Returns:
        DataFrame with columns: date, close, returns, sentiment,
        sentiment_avg_5d, volatility_5d
    """
    # Load price data
    price_data = get_price_data(ticker)
    if not price_data:
        return pd.DataFrame()

    price_df = pd.DataFrame(price_data)

    # Load sentiment data
    sentiment_df = get_mock_sentiment_series(ticker)
    if sentiment_df.empty:
        return pd.DataFrame()

    # Merge on date
    df = pd.merge(price_df, sentiment_df, on="date", how="inner")

    # Compute 5-day rolling sentiment average
    df["sentiment_avg_5d"] = (
        df["sentiment"]
        .rolling(window=5, min_periods=1)
        .mean()
        .round(4)
    )

    # Compute 5-day return volatility (standard deviation of returns)
    df["volatility_5d"] = (
        df["returns"]
        .rolling(window=5, min_periods=1)
        .std()
        .round(6)
    )

    return df
