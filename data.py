"""
Market data functions for AltAlpha Lab.
"""

from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd
import yfinance as yf


def get_price_data(
    ticker: str,
    start_date: str = "2020-01-01",
    end_date: Optional[str] = None,
) -> list[dict]:
    """
    Download historical price data and compute daily returns.

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format (defaults to today)

    Returns:
        List of dictionaries containing date, close price, and daily returns
    """
    if end_date is None:
        end_date = datetime.now().strftime("%Y-%m-%d")

    # Download data from Yahoo Finance
    stock = yf.Ticker(ticker)
    df = stock.history(start=start_date, end=end_date)

    if df.empty:
        return []

    # Reset index to get date as a column
    df = df.reset_index()

    # Compute daily returns
    df["returns"] = df["Close"].pct_change()

    # Prepare output data
    result = []
    for _, row in df.iterrows():
        result.append({
            "date": row["Date"].strftime("%Y-%m-%d"),
            "close": round(row["Close"], 2),
            "returns": round(row["returns"], 6) if not np.isnan(row["returns"]) else None,
        })

    return result
