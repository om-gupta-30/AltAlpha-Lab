"""
Backtesting engine for AltAlpha Lab.
"""

import numpy as np
import pandas as pd

from strategy import generate_sentiment_strategy


def run_backtest(
    ticker: str,
    initial_capital: float = 10000.0,
    transaction_cost: float = 0.001,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> pd.DataFrame:
    """
    Run backtest on sentiment strategy.

    Steps:
        1. Load strategy dataframe
        2. Compute strategy returns (position * daily returns)
        3. Apply transaction costs when position changes
        4. Compute cumulative returns
        5. Compute portfolio value

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        initial_capital: Starting capital (default: 10000)
        transaction_cost: Cost per trade as fraction (default: 0.001 = 0.1%)
        sentiment_threshold: Threshold for sentiment signal (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        DataFrame with columns: date, market_returns, strategy_returns, portfolio_value
    """
    # Load strategy dataframe with parameters
    df = generate_sentiment_strategy(
        ticker,
        sentiment_threshold=sentiment_threshold,
        volatility_percentile=volatility_percentile,
    )

    if df.empty:
        return pd.DataFrame()

    # Create a copy to avoid modifying original
    df = df.copy()

    # Fill NaN returns with 0 for calculations
    df["returns"] = df["returns"].fillna(0)

    # Market returns (buy and hold)
    df["market_returns"] = df["returns"]

    # Strategy returns = position * daily returns
    df["strategy_returns"] = df["position"] * df["returns"]

    # Detect position changes for transaction costs
    df["position_change"] = df["position"].diff().fillna(0).abs()

    # Apply transaction cost when position changes
    # Cost is applied as a fraction of portfolio value
    df["transaction_costs"] = np.where(
        df["position_change"] > 0,
        transaction_cost,
        0.0,
    )

    # Net strategy returns after transaction costs
    df["strategy_returns"] = df["strategy_returns"] - df["transaction_costs"]

    # Compute cumulative returns (1 + r1) * (1 + r2) * ... - 1
    df["cumulative_market"] = (1 + df["market_returns"]).cumprod()
    df["cumulative_strategy"] = (1 + df["strategy_returns"]).cumprod()

    # Compute portfolio value
    df["portfolio_value"] = initial_capital * df["cumulative_strategy"]

    # Round for cleaner output
    df["market_returns"] = df["market_returns"].round(6)
    df["strategy_returns"] = df["strategy_returns"].round(6)
    df["portfolio_value"] = df["portfolio_value"].round(2)

    # Select output columns
    output_columns = ["date", "market_returns", "strategy_returns", "portfolio_value"]
    result = df[output_columns].copy()

    return result
