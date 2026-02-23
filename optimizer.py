"""
Strategy Optimization Engine for AltAlpha Lab.

Finds optimal trading parameters via grid search.
"""

import numpy as np
import pandas as pd

from features import merge_price_and_sentiment


def _compute_sharpe_ratio(
    returns: np.ndarray,
    risk_free_rate: float = 0.0,
    trading_days: int = 252,
) -> float:
    """
    Compute annualized Sharpe ratio from returns array.

    Args:
        returns: Array of daily returns
        risk_free_rate: Annual risk-free rate (default: 0)
        trading_days: Trading days per year (default: 252)

    Returns:
        Sharpe ratio (float)
    """
    if len(returns) == 0:
        return 0.0

    n_periods = len(returns)
    total_return = np.prod(1 + returns) - 1
    annualized_return = (1 + total_return) ** (trading_days / n_periods) - 1

    daily_volatility = np.std(returns, ddof=1)
    annualized_volatility = daily_volatility * np.sqrt(trading_days)

    if annualized_volatility > 0:
        return (annualized_return - risk_free_rate) / annualized_volatility
    return 0.0


def _compute_max_drawdown(cumulative_returns: np.ndarray) -> float:
    """
    Compute maximum drawdown from cumulative returns.

    Args:
        cumulative_returns: Array of cumulative return values

    Returns:
        Maximum drawdown as a negative percentage
    """
    if len(cumulative_returns) == 0:
        return 0.0

    peak = cumulative_returns[0]
    max_dd = 0.0

    for value in cumulative_returns:
        if value > peak:
            peak = value
        drawdown = (value - peak) / peak if peak > 0 else 0
        if drawdown < max_dd:
            max_dd = drawdown

    return max_dd


def _run_strategy_backtest(
    df: pd.DataFrame,
    sentiment_threshold: float,
    volatility_percentile: float,
    transaction_cost: float = 0.001,
) -> dict:
    """
    Run strategy and backtest on preloaded data.

    Efficient version that avoids reloading data.

    Args:
        df: Preloaded feature dataframe with sentiment_avg_5d, volatility_5d, returns
        sentiment_threshold: Sentiment threshold for signals
        volatility_percentile: Volatility percentile filter
        transaction_cost: Transaction cost fraction

    Returns:
        Dictionary with sharpe_ratio and other metrics
    """
    # Calculate volatility threshold based on percentile
    volatility_threshold = np.percentile(
        df["volatility_5d"].dropna(), volatility_percentile
    )

    # Generate trading signals
    long_condition = (df["sentiment_avg_5d"] > sentiment_threshold) & (
        df["volatility_5d"] < volatility_threshold
    )
    short_condition = df["sentiment_avg_5d"] < -sentiment_threshold

    position = np.where(long_condition, 1, np.where(short_condition, -1, 0))

    # Shift position by 1 day to prevent look-ahead bias
    position = np.concatenate([[0], position[:-1]])

    # Calculate strategy returns
    returns = df["returns"].fillna(0).values
    strategy_returns = position * returns

    # Apply transaction costs on position changes
    position_changes = np.abs(np.diff(position, prepend=0))
    transaction_costs = np.where(position_changes > 0, transaction_cost, 0.0)
    strategy_returns = strategy_returns - transaction_costs

    # Calculate Sharpe ratio
    sharpe = _compute_sharpe_ratio(strategy_returns)

    # Calculate total return
    total_return = np.prod(1 + strategy_returns) - 1

    # Calculate cumulative returns for drawdown
    cumulative_returns = np.cumprod(1 + strategy_returns)
    max_drawdown = _compute_max_drawdown(cumulative_returns)

    # Calculate annualized volatility
    daily_vol = np.std(strategy_returns, ddof=1)
    annual_vol = daily_vol * np.sqrt(252)

    # Count trades (position changes)
    num_trades = int(np.sum(position_changes > 0))

    return {
        "sentiment_threshold": sentiment_threshold,
        "volatility_percentile": volatility_percentile,
        "sharpe_ratio": round(sharpe, 4),
        "total_return_pct": round(total_return * 100, 2),
        "max_drawdown_pct": round(max_drawdown * 100, 2),
        "annual_volatility_pct": round(annual_vol * 100, 2),
        "num_trades": num_trades,
    }


def _compute_parameter_sensitivity(results_df: pd.DataFrame) -> dict:
    """
    Compute parameter sensitivity analysis.

    Calculates average Sharpe ratio for each parameter value.

    Args:
        results_df: DataFrame with optimization results

    Returns:
        Dictionary with sensitivity analysis for each parameter
    """
    # Sensitivity for sentiment_threshold
    sentiment_sensitivity = (
        results_df.groupby("sentiment_threshold")["sharpe_ratio"]
        .agg(["mean", "std", "min", "max"])
        .round(4)
    )
    sentiment_sensitivity = sentiment_sensitivity.reset_index()
    sentiment_sensitivity.columns = [
        "value", "avg_sharpe", "std_sharpe", "min_sharpe", "max_sharpe"
    ]

    # Sensitivity for volatility_percentile
    volatility_sensitivity = (
        results_df.groupby("volatility_percentile")["sharpe_ratio"]
        .agg(["mean", "std", "min", "max"])
        .round(4)
    )
    volatility_sensitivity = volatility_sensitivity.reset_index()
    volatility_sensitivity.columns = [
        "value", "avg_sharpe", "std_sharpe", "min_sharpe", "max_sharpe"
    ]
    volatility_sensitivity["value"] = volatility_sensitivity["value"].astype(int)

    return {
        "sentiment_threshold": sentiment_sensitivity.to_dict(orient="records"),
        "volatility_percentile": volatility_sensitivity.to_dict(orient="records"),
    }


def _find_stable_regions(
    results_df: pd.DataFrame,
    sentiment_step: float,
    volatility_step: float,
    top_n: int = 10,
) -> list:
    """
    Find stable parameter regions where neighboring parameters also perform well.

    Stability is measured by averaging performance of a parameter set
    with its immediate neighbors.

    Args:
        results_df: DataFrame with optimization results
        sentiment_step: Step size for sentiment threshold
        volatility_step: Step size for volatility percentile
        top_n: Number of top stable regions to return

    Returns:
        List of dictionaries with stable parameter regions
    """
    # Create lookup dictionary for fast neighbor access
    results_lookup = {}
    for _, row in results_df.iterrows():
        key = (round(row["sentiment_threshold"], 2), int(row["volatility_percentile"]))
        results_lookup[key] = row["sharpe_ratio"]

    stable_regions = []

    for _, row in results_df.iterrows():
        sent = round(row["sentiment_threshold"], 2)
        vol = int(row["volatility_percentile"])

        # Get neighboring parameter values
        neighbors = [
            (sent - sentiment_step, vol),
            (sent + sentiment_step, vol),
            (sent, vol - volatility_step),
            (sent, vol + volatility_step),
            (sent - sentiment_step, vol - volatility_step),
            (sent + sentiment_step, vol + volatility_step),
            (sent - sentiment_step, vol + volatility_step),
            (sent + sentiment_step, vol - volatility_step),
        ]

        # Collect Sharpe ratios for this point and valid neighbors
        sharpe_values = [row["sharpe_ratio"]]
        valid_neighbors = 0

        for neighbor in neighbors:
            neighbor_key = (round(neighbor[0], 2), int(neighbor[1]))
            if neighbor_key in results_lookup:
                sharpe_values.append(results_lookup[neighbor_key])
                valid_neighbors += 1

        # Calculate stability metrics
        avg_neighborhood_sharpe = np.mean(sharpe_values)
        std_neighborhood_sharpe = np.std(sharpe_values) if len(sharpe_values) > 1 else 0

        # Stability score: high average + low variance (penalize high variance)
        stability_score = avg_neighborhood_sharpe - 0.5 * std_neighborhood_sharpe

        stable_regions.append({
            "sentiment_threshold": sent,
            "volatility_percentile": vol,
            "sharpe_ratio": row["sharpe_ratio"],
            "avg_neighborhood_sharpe": round(avg_neighborhood_sharpe, 4),
            "neighborhood_std": round(std_neighborhood_sharpe, 4),
            "stability_score": round(stability_score, 4),
            "valid_neighbors": valid_neighbors,
        })

    # Sort by stability score and return top N
    stable_regions = sorted(
        stable_regions,
        key=lambda x: x["stability_score"],
        reverse=True,
    )

    return stable_regions[:top_n]


def optimize_strategy(
    ticker: str,
    sentiment_range: tuple = (-0.5, 0.5, 0.1),
    volatility_range: tuple = (20, 80, 10),
    transaction_cost: float = 0.001,
) -> dict:
    """
    Find optimal trading parameters via grid search.

    Tests all combinations of sentiment threshold and volatility percentile,
    ranks by Sharpe ratio, and analyzes parameter stability and sensitivity.

    Args:
        ticker: Stock ticker symbol
        sentiment_range: Tuple of (start, stop, step) for sentiment threshold
        volatility_range: Tuple of (start, stop, step) for volatility percentile
        transaction_cost: Transaction cost fraction (default: 0.001)

    Returns:
        Dictionary with:
            - ticker: Stock symbol
            - best_parameters: Best parameter set
            - best_sharpe: Highest Sharpe ratio
            - top_10: Top 10 configurations by Sharpe
            - stable_regions: Top 10 stable parameter regions
            - parameter_sensitivity: Average Sharpe across parameter values
            - full_results: Complete optimization grid results
            - total_combinations: Number of combinations tested
    """
    # Load data once (optimization: avoid repeated data loading)
    df = merge_price_and_sentiment(ticker)
    if df.empty:
        return {}

    # Generate parameter grid
    sentiment_step = sentiment_range[2]
    volatility_step = volatility_range[2]

    sentiment_values = np.arange(
        sentiment_range[0],
        sentiment_range[1] + sentiment_step / 2,  # Include endpoint
        sentiment_step,
    )
    volatility_values = np.arange(
        volatility_range[0],
        volatility_range[1] + volatility_step / 2,  # Include endpoint
        volatility_step,
    )

    # Round to avoid floating point issues
    sentiment_values = np.round(sentiment_values, 2)
    volatility_values = np.round(volatility_values, 0).astype(int)

    # Run grid search
    results = []
    for sent_thresh in sentiment_values:
        for vol_pct in volatility_values:
            result = _run_strategy_backtest(
                df,
                sentiment_threshold=float(sent_thresh),
                volatility_percentile=float(vol_pct),
                transaction_cost=transaction_cost,
            )
            results.append(result)

    # Convert to DataFrame and sort by Sharpe ratio
    results_df = pd.DataFrame(results)
    results_df_sorted = results_df.sort_values("sharpe_ratio", ascending=False)

    # Get best parameters
    best_row = results_df_sorted.iloc[0]
    best_parameters = {
        "sentiment_threshold": best_row["sentiment_threshold"],
        "volatility_percentile": int(best_row["volatility_percentile"]),
    }

    # Get top 10 configurations by Sharpe
    top_10 = results_df_sorted.head(10).to_dict(orient="records")
    for config in top_10:
        config["volatility_percentile"] = int(config["volatility_percentile"])

    # Find stable parameter regions
    stable_regions = _find_stable_regions(
        results_df,
        sentiment_step=sentiment_step,
        volatility_step=volatility_step,
        top_n=10,
    )

    # Compute parameter sensitivity
    parameter_sensitivity = _compute_parameter_sensitivity(results_df)

    # Format full results for output
    full_results = results_df_sorted.to_dict(orient="records")
    for row in full_results:
        row["volatility_percentile"] = int(row["volatility_percentile"])

    return {
        "ticker": ticker.upper(),
        "best_parameters": best_parameters,
        "best_sharpe": best_row["sharpe_ratio"],
        "best_total_return_pct": best_row["total_return_pct"],
        "best_max_drawdown_pct": best_row["max_drawdown_pct"],
        "top_10": top_10,
        "stable_regions": stable_regions,
        "parameter_sensitivity": parameter_sensitivity,
        "full_results": full_results,
        "total_combinations": len(results),
    }
