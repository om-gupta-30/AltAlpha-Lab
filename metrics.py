"""
Performance analytics module for AltAlpha Lab.
"""

import numpy as np
import pandas as pd

from backtest import run_backtest


def calculate_performance_metrics(
    ticker: str,
    risk_free_rate: float = 0.0,
    trading_days: int = 252,
    initial_capital: float = 10000.0,
    transaction_cost: float = 0.001,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> dict:
    """
    Calculate performance metrics from backtest results.

    Metrics:
        - Total return
        - Annualized return
        - Annualized volatility
        - Sharpe ratio
        - Maximum drawdown

    Args:
        ticker: Stock ticker symbol (e.g., 'AAPL')
        risk_free_rate: Annual risk-free rate (default: 0)
        trading_days: Trading days per year (default: 252)
        initial_capital: Starting capital (default: 10000)
        transaction_cost: Cost per trade as fraction (default: 0.001)
        sentiment_threshold: Threshold for sentiment signal (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        Dictionary containing performance metrics
    """
    # Run backtest to get results with all parameters
    df = run_backtest(
        ticker,
        initial_capital=initial_capital,
        transaction_cost=transaction_cost,
        sentiment_threshold=sentiment_threshold,
        volatility_percentile=volatility_percentile,
    )

    if df.empty:
        return {}

    # Extract strategy returns
    strategy_returns = df["strategy_returns"].values
    portfolio_values = df["portfolio_value"].values

    # Total return
    total_return = (portfolio_values[-1] / portfolio_values[0]) - 1

    # Number of periods
    n_periods = len(strategy_returns)

    # Annualized return
    # (1 + total_return)^(252/n) - 1
    annualized_return = (1 + total_return) ** (trading_days / n_periods) - 1

    # Annualized volatility
    # Daily volatility * sqrt(252)
    daily_volatility = np.std(strategy_returns, ddof=1)
    annualized_volatility = daily_volatility * np.sqrt(trading_days)

    # Sharpe ratio
    # (Annualized return - risk-free rate) / Annualized volatility
    if annualized_volatility > 0:
        sharpe_ratio = (annualized_return - risk_free_rate) / annualized_volatility
    else:
        sharpe_ratio = 0.0

    # Maximum drawdown
    # Peak to trough decline
    cumulative_max = pd.Series(portfolio_values).cummax()
    drawdown = (pd.Series(portfolio_values) - cumulative_max) / cumulative_max
    max_drawdown = drawdown.min()

    # Build metrics dictionary
    metrics = {
        "ticker": ticker,
        "total_return": round(total_return * 100, 2),
        "annualized_return": round(annualized_return * 100, 2),
        "annualized_volatility": round(annualized_volatility * 100, 2),
        "sharpe_ratio": round(sharpe_ratio, 3),
        "max_drawdown": round(max_drawdown * 100, 2),
        "trading_days": n_periods,
    }

    return metrics
