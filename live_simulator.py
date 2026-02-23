"""
Live Trading Simulation Engine for AltAlpha Lab.

Simulates real-time strategy execution by iterating through historical data day by day.
"""

import numpy as np
import pandas as pd

from features import merge_price_and_sentiment


def _generate_signal(
    sentiment_avg_5d: float,
    volatility_5d: float,
    volatility_threshold: float,
    sentiment_threshold: float,
) -> int:
    """
    Generate trading signal for a single day.

    Signal Rules:
        - Long (1): sentiment_avg_5d > threshold AND volatility_5d < volatility_threshold
        - Short (-1): sentiment_avg_5d < -threshold
        - Flat (0): otherwise

    Args:
        sentiment_avg_5d: 5-day rolling sentiment average
        volatility_5d: 5-day volatility
        volatility_threshold: Volatility threshold for filtering
        sentiment_threshold: Sentiment threshold for signals

    Returns:
        Signal: 1 (long), -1 (short), or 0 (flat)
    """
    if pd.isna(sentiment_avg_5d) or pd.isna(volatility_5d):
        return 0

    if sentiment_avg_5d > sentiment_threshold and volatility_5d < volatility_threshold:
        return 1
    elif sentiment_avg_5d < -sentiment_threshold:
        return -1
    return 0


def run_live_simulation(
    ticker: str,
    initial_capital: float = 10000.0,
    transaction_cost: float = 0.001,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> dict:
    """
    Simulate real-time strategy execution.

    Iterates through historical data day by day, simulating:
        1. Signal generation based on available data
        2. Position updates with entry/exit tracking
        3. Portfolio value and drawdown tracking
        4. Daily PnL calculation
        5. Complete simulation state for UI playback

    Args:
        ticker: Stock ticker symbol
        initial_capital: Starting capital (default: 10000)
        transaction_cost: Cost per trade as fraction (default: 0.001)
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        Dictionary with:
            - ticker: Stock symbol
            - initial_capital: Starting capital
            - final_capital: Ending portfolio value
            - total_return_pct: Total return percentage
            - simulation_states: Day-by-day state for UI playback
            - completed_trades: Trades with entry/exit details and P&L
            - daily_pnl: Daily profit/loss series
            - position_history: Position tracking over time
            - summary: Simulation summary statistics
    """
    # Load feature data
    df = merge_price_and_sentiment(ticker)
    if df.empty:
        return {}

    # Calculate volatility threshold (use full dataset for percentile)
    volatility_threshold = np.percentile(
        df["volatility_5d"].dropna(), volatility_percentile
    )

    # Initialize simulation state
    cash = initial_capital
    position = 0  # Current position: 1, -1, or 0
    shares = 0.0  # Number of shares held (can be fractional)
    prev_portfolio_value = initial_capital
    peak_value = initial_capital

    # Track open trade for entry/exit matching
    open_trade = None

    # Tracking lists
    simulation_states = []
    completed_trades = []
    daily_pnl = []
    position_history = []

    # Iterate through each day
    for idx, row in df.iterrows():
        date = row["date"]
        close_price = row["close"]
        sentiment_avg = row["sentiment_avg_5d"]
        volatility = row["volatility_5d"]

        # Calculate current portfolio value before any trades
        if position != 0 and shares > 0:
            portfolio_value = cash + shares * close_price
        else:
            portfolio_value = cash

        # Update peak and calculate current drawdown
        if portfolio_value > peak_value:
            peak_value = portfolio_value
        current_drawdown = (peak_value - portfolio_value) / peak_value if peak_value > 0 else 0

        # Calculate daily PnL
        day_pnl = portfolio_value - prev_portfolio_value
        day_pnl_pct = (day_pnl / prev_portfolio_value * 100) if prev_portfolio_value > 0 else 0

        # Generate signal for NEXT day (to prevent look-ahead bias)
        new_signal = _generate_signal(
            sentiment_avg,
            volatility,
            volatility_threshold,
            sentiment_threshold,
        )

        # Track trade actions for this day
        trade_action = None
        trade_details = None

        # Execute position change if signal differs from current position
        if new_signal != position:
            # Close existing position
            if position != 0 and shares > 0:
                # Sell all shares
                proceeds = shares * close_price
                cost = proceeds * transaction_cost
                cash = proceeds - cost

                # Complete the trade record
                if open_trade is not None:
                    trade_pnl = proceeds - cost - open_trade["entry_value"]
                    trade_pnl_pct = (trade_pnl / open_trade["entry_value"] * 100) if open_trade["entry_value"] > 0 else 0
                    holding_days = len([s for s in simulation_states if s["date"] >= open_trade["entry_date"]])

                    completed_trade = {
                        "trade_id": len(completed_trades) + 1,
                        "type": "LONG" if open_trade["position"] == 1 else "SHORT",
                        "entry_date": open_trade["entry_date"],
                        "entry_price": open_trade["entry_price"],
                        "entry_value": open_trade["entry_value"],
                        "exit_date": date,
                        "exit_price": round(close_price, 2),
                        "exit_value": round(proceeds - cost, 2),
                        "shares": round(shares, 4),
                        "profit_loss": round(trade_pnl, 2),
                        "profit_loss_pct": round(trade_pnl_pct, 2),
                        "holding_days": holding_days,
                        "transaction_costs": round(open_trade["entry_cost"] + cost, 2),
                    }
                    completed_trades.append(completed_trade)

                trade_action = "CLOSE"
                trade_details = {
                    "action": "CLOSE",
                    "price": round(close_price, 2),
                    "shares": round(shares, 4),
                    "proceeds": round(proceeds - cost, 2),
                }

                shares = 0.0
                open_trade = None

            # Open new position
            if new_signal != 0:
                # Calculate shares to buy/short with available cash
                trade_value = cash * (1 - transaction_cost)
                cost = cash * transaction_cost
                shares = trade_value / close_price

                # Record open trade for later matching
                open_trade = {
                    "entry_date": date,
                    "entry_price": round(close_price, 2),
                    "entry_value": round(trade_value, 2),
                    "entry_cost": round(cost, 2),
                    "shares": shares,
                    "position": new_signal,
                }

                trade_action = "LONG" if new_signal == 1 else "SHORT"
                trade_details = {
                    "action": trade_action,
                    "price": round(close_price, 2),
                    "shares": round(shares, 4),
                    "value": round(trade_value, 2),
                }

                cash = 0.0

            position = new_signal

        # Calculate end-of-day portfolio value after trades
        if position != 0 and shares > 0:
            portfolio_value = cash + shares * close_price
        else:
            portfolio_value = cash

        # Calculate unrealized P&L for open position
        unrealized_pnl = 0.0
        unrealized_pnl_pct = 0.0
        if open_trade is not None and shares > 0:
            current_value = shares * close_price
            unrealized_pnl = current_value - open_trade["entry_value"]
            unrealized_pnl_pct = (unrealized_pnl / open_trade["entry_value"] * 100) if open_trade["entry_value"] > 0 else 0

        # Record daily PnL
        daily_pnl.append({
            "date": date,
            "pnl": round(day_pnl, 2),
            "pnl_pct": round(day_pnl_pct, 2),
            "cumulative_pnl": round(portfolio_value - initial_capital, 2),
            "cumulative_pnl_pct": round((portfolio_value - initial_capital) / initial_capital * 100, 2),
        })

        # Record position history
        position_history.append({
            "date": date,
            "position": position,
            "position_type": "LONG" if position == 1 else ("SHORT" if position == -1 else "FLAT"),
            "shares": round(shares, 4),
            "market_value": round(shares * close_price, 2) if shares > 0 else 0,
        })

        # Record full simulation state for UI playback
        simulation_states.append({
            "step": len(simulation_states) + 1,
            "date": date,
            "market_data": {
                "close": round(close_price, 2),
                "sentiment_avg_5d": round(sentiment_avg, 4) if not pd.isna(sentiment_avg) else None,
                "volatility_5d": round(volatility, 6) if not pd.isna(volatility) else None,
            },
            "signal": new_signal,
            "signal_type": "LONG" if new_signal == 1 else ("SHORT" if new_signal == -1 else "FLAT"),
            "position": {
                "current": position,
                "type": "LONG" if position == 1 else ("SHORT" if position == -1 else "FLAT"),
                "shares": round(shares, 4),
                "entry_price": open_trade["entry_price"] if open_trade else None,
                "entry_date": open_trade["entry_date"] if open_trade else None,
                "unrealized_pnl": round(unrealized_pnl, 2),
                "unrealized_pnl_pct": round(unrealized_pnl_pct, 2),
            },
            "portfolio": {
                "cash": round(cash, 2),
                "market_value": round(shares * close_price, 2) if shares > 0 else 0,
                "total_value": round(portfolio_value, 2),
                "daily_pnl": round(day_pnl, 2),
                "daily_pnl_pct": round(day_pnl_pct, 2),
                "total_return_pct": round((portfolio_value - initial_capital) / initial_capital * 100, 2),
            },
            "risk": {
                "peak_value": round(peak_value, 2),
                "current_drawdown_pct": round(current_drawdown * 100, 2),
            },
            "trade": trade_details,
        })

        prev_portfolio_value = portfolio_value

    # Final calculations
    final_value = simulation_states[-1]["portfolio"]["total_value"] if simulation_states else initial_capital
    total_return = (final_value - initial_capital) / initial_capital * 100

    # Find max drawdown
    max_drawdown = max(s["risk"]["current_drawdown_pct"] for s in simulation_states) if simulation_states else 0

    # Trade statistics
    winning_trades = [t for t in completed_trades if t["profit_loss"] > 0]
    losing_trades = [t for t in completed_trades if t["profit_loss"] <= 0]

    avg_win = np.mean([t["profit_loss"] for t in winning_trades]) if winning_trades else 0
    avg_loss = np.mean([t["profit_loss"] for t in losing_trades]) if losing_trades else 0
    win_rate = len(winning_trades) / len(completed_trades) * 100 if completed_trades else 0

    total_profit = sum(t["profit_loss"] for t in winning_trades)
    total_loss = sum(t["profit_loss"] for t in losing_trades)
    profit_factor = abs(total_profit / total_loss) if total_loss != 0 else float('inf') if total_profit > 0 else 0

    summary = {
        "trading_days": len(simulation_states),
        "total_trades": len(completed_trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate_pct": round(win_rate, 2),
        "avg_win": round(avg_win, 2),
        "avg_loss": round(avg_loss, 2),
        "profit_factor": round(profit_factor, 2) if profit_factor != float('inf') else "inf",
        "total_profit": round(total_profit, 2),
        "total_loss": round(total_loss, 2),
        "max_drawdown_pct": round(max_drawdown, 2),
        "best_trade": max(completed_trades, key=lambda x: x["profit_loss"])["profit_loss"] if completed_trades else 0,
        "worst_trade": min(completed_trades, key=lambda x: x["profit_loss"])["profit_loss"] if completed_trades else 0,
    }

    return {
        "ticker": ticker.upper(),
        "initial_capital": initial_capital,
        "final_capital": round(final_value, 2),
        "total_return_pct": round(total_return, 2),
        "simulation_states": simulation_states,
        "completed_trades": completed_trades,
        "daily_pnl": daily_pnl,
        "position_history": position_history,
        "summary": summary,
    }
