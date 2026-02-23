"""
AI Research Analyst Module for AltAlpha Lab.

Generates comprehensive natural language strategy analysis, 
ML model insights, and professional research reports.
"""

import numpy as np
import pandas as pd

from features import merge_price_and_sentiment
from metrics import calculate_performance_metrics
from ml_model import predict_next_day
from live_simulator import run_live_simulation
from optimizer import optimize_strategy


def _analyze_volatility_regimes(ticker: str) -> dict:
    """
    Analyze strategy performance in high vs low volatility periods.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Dictionary with volatility regime analysis
    """
    df = merge_price_and_sentiment(ticker)
    if df.empty:
        return {}

    # Define volatility regimes using median split
    vol_median = df["volatility_5d"].median()
    df["vol_regime"] = np.where(
        df["volatility_5d"] > vol_median, "high_volatility", "low_volatility"
    )

    # Calculate returns in each regime
    high_vol_returns = df[df["vol_regime"] == "high_volatility"]["returns"].dropna()
    low_vol_returns = df[df["vol_regime"] == "low_volatility"]["returns"].dropna()

    high_vol_sharpe = 0.0
    low_vol_sharpe = 0.0

    if len(high_vol_returns) > 0:
        high_vol_mean = high_vol_returns.mean() * 252
        high_vol_std = high_vol_returns.std() * np.sqrt(252)
        high_vol_sharpe = high_vol_mean / high_vol_std if high_vol_std > 0 else 0

    if len(low_vol_returns) > 0:
        low_vol_mean = low_vol_returns.mean() * 252
        low_vol_std = low_vol_returns.std() * np.sqrt(252)
        low_vol_sharpe = low_vol_mean / low_vol_std if low_vol_std > 0 else 0

    # Determine which regime is better
    if high_vol_sharpe > low_vol_sharpe + 0.1:
        preferred_regime = "high_volatility"
        regime_insight = "Strategy performs better during high volatility periods."
    elif low_vol_sharpe > high_vol_sharpe + 0.1:
        preferred_regime = "low_volatility"
        regime_insight = "Strategy performs better during low volatility periods."
    else:
        preferred_regime = "neutral"
        regime_insight = "Strategy shows similar performance across volatility regimes."

    return {
        "high_volatility": {
            "days": int(len(high_vol_returns)),
            "avg_daily_return_pct": round(float(high_vol_returns.mean() * 100), 4) if len(high_vol_returns) > 0 else 0,
            "volatility_pct": round(float(high_vol_returns.std() * 100), 4) if len(high_vol_returns) > 0 else 0,
            "sharpe_estimate": round(float(high_vol_sharpe), 3),
        },
        "low_volatility": {
            "days": int(len(low_vol_returns)),
            "avg_daily_return_pct": round(float(low_vol_returns.mean() * 100), 4) if len(low_vol_returns) > 0 else 0,
            "volatility_pct": round(float(low_vol_returns.std() * 100), 4) if len(low_vol_returns) > 0 else 0,
            "sharpe_estimate": round(float(low_vol_sharpe), 3),
        },
        "preferred_regime": preferred_regime,
        "insight": regime_insight,
    }


def _analyze_risk_patterns(simulation_data: dict) -> dict:
    """
    Identify risk patterns including frequent drawdowns and Sharpe instability.

    Args:
        simulation_data: Output from run_live_simulation

    Returns:
        Dictionary with risk pattern analysis
    """
    if not simulation_data or "simulation_states" not in simulation_data:
        return {}

    states = simulation_data["simulation_states"]
    if len(states) < 30:
        return {}

    # Extract drawdown series
    drawdowns = [s["risk"]["current_drawdown_pct"] for s in states]
    portfolio_values = [s["portfolio"]["total_value"] for s in states]

    # Count drawdown events (drawdown > 5%)
    drawdown_events = []
    in_drawdown = False
    event_start = None

    for i, dd in enumerate(drawdowns):
        if dd > 5 and not in_drawdown:
            in_drawdown = True
            event_start = i
        elif dd < 2 and in_drawdown:
            in_drawdown = False
            drawdown_events.append({
                "start_idx": event_start,
                "end_idx": i,
                "duration": i - event_start,
                "max_drawdown": max(drawdowns[event_start:i + 1]),
            })

    # Calculate rolling Sharpe (60-day window)
    returns = []
    for i in range(1, len(portfolio_values)):
        ret = (portfolio_values[i] - portfolio_values[i - 1]) / portfolio_values[i - 1]
        returns.append(ret)

    rolling_sharpes = []
    window = 60
    for i in range(window, len(returns)):
        window_returns = returns[i - window:i]
        mean_ret = np.mean(window_returns) * 252
        std_ret = np.std(window_returns) * np.sqrt(252)
        sharpe = mean_ret / std_ret if std_ret > 0 else 0
        rolling_sharpes.append(sharpe)

    # Analyze Sharpe stability
    sharpe_std = np.std(rolling_sharpes) if rolling_sharpes else 0
    sharpe_range = max(rolling_sharpes) - min(rolling_sharpes) if rolling_sharpes else 0

    # Risk pattern insights
    risk_insights = []

    if len(drawdown_events) > 5:
        risk_insights.append(f"Frequent drawdown events detected ({len(drawdown_events)} significant drawdowns).")
    elif len(drawdown_events) > 2:
        risk_insights.append(f"Moderate drawdown frequency ({len(drawdown_events)} significant drawdowns).")
    else:
        risk_insights.append("Low drawdown frequency indicates stable capital preservation.")

    if sharpe_std > 1.0:
        risk_insights.append("High Sharpe ratio instability suggests inconsistent risk-adjusted returns.")
    elif sharpe_std > 0.5:
        risk_insights.append("Moderate Sharpe variability indicates some performance inconsistency.")
    else:
        risk_insights.append("Stable Sharpe ratio over time demonstrates consistent risk-adjusted performance.")

    avg_drawdown_duration = np.mean([e["duration"] for e in drawdown_events]) if drawdown_events else 0
    if avg_drawdown_duration > 30:
        risk_insights.append("Extended drawdown recovery periods may strain investor patience.")
    elif avg_drawdown_duration > 15:
        risk_insights.append("Moderate drawdown recovery times are within acceptable ranges.")

    return {
        "drawdown_events": len(drawdown_events),
        "avg_drawdown_duration_days": round(float(avg_drawdown_duration), 1),
        "max_drawdown_event_pct": round(float(max([e["max_drawdown"] for e in drawdown_events])), 2) if drawdown_events else 0,
        "sharpe_stability": {
            "std_deviation": round(float(sharpe_std), 3),
            "range": round(float(sharpe_range), 3),
            "is_stable": bool(sharpe_std < 0.5),
        },
        "risk_level": "HIGH" if len(drawdown_events) > 5 or sharpe_std > 1.0 else ("MODERATE" if len(drawdown_events) > 2 or sharpe_std > 0.5 else "LOW"),
        "insights": risk_insights,
    }


def _analyze_ml_performance(ml_data: dict) -> dict:
    """
    Analyze ML model performance trends.

    Args:
        ml_data: Output from predict_next_day

    Returns:
        Dictionary with ML performance analysis
    """
    if not ml_data or "rolling_accuracy" not in ml_data:
        return {}

    rolling_acc = ml_data["rolling_accuracy"]
    eval_metrics = ml_data.get("evaluation_metrics", {})

    # Extract accuracy values
    accuracies = [r["rolling_accuracy"] for r in rolling_acc]

    if len(accuracies) < 10:
        return {}

    # Analyze accuracy trend
    first_half = accuracies[:len(accuracies) // 2]
    second_half = accuracies[len(accuracies) // 2:]

    first_avg = np.mean(first_half)
    second_avg = np.mean(second_half)

    if second_avg > first_avg + 0.03:
        trend = "improving"
        trend_insight = "Model accuracy shows improvement over time, suggesting adaptive learning."
    elif second_avg < first_avg - 0.03:
        trend = "degrading"
        trend_insight = "Model accuracy is degrading over time, indicating potential concept drift."
    else:
        trend = "stable"
        trend_insight = "Model accuracy remains stable over time."

    # Analyze prediction quality
    roc_auc = eval_metrics.get("roc_auc", 0.5)
    accuracy = eval_metrics.get("accuracy", 0.5)
    up_precision = eval_metrics.get("up_prediction", {}).get("precision", 0.5)
    up_recall = eval_metrics.get("up_prediction", {}).get("recall", 0.5)

    # Model quality assessment
    model_insights = []

    if roc_auc > 0.6:
        model_insights.append("ROC AUC indicates meaningful predictive power.")
    elif roc_auc > 0.55:
        model_insights.append("ROC AUC suggests marginal predictive ability.")
    else:
        model_insights.append("ROC AUC near 0.5 indicates limited predictive power.")

    if up_precision > 0.55 and up_recall > 0.55:
        model_insights.append("Balanced precision and recall for 'up' predictions.")
    elif up_precision > up_recall + 0.1:
        model_insights.append("Model prioritizes precision over recall for 'up' predictions (conservative).")
    elif up_recall > up_precision + 0.1:
        model_insights.append("Model prioritizes recall over precision for 'up' predictions (aggressive).")

    # Accuracy volatility
    acc_std = np.std(accuracies)
    if acc_std > 0.1:
        model_insights.append("High accuracy volatility suggests inconsistent predictions.")
    elif acc_std > 0.05:
        model_insights.append("Moderate accuracy volatility is within acceptable bounds.")
    else:
        model_insights.append("Low accuracy volatility indicates consistent predictions.")

    return {
        "accuracy_trend": trend,
        "first_period_avg_accuracy": round(float(first_avg), 4),
        "second_period_avg_accuracy": round(float(second_avg), 4),
        "accuracy_std": round(float(acc_std), 4),
        "roc_auc": float(roc_auc) if roc_auc else 0.5,
        "model_quality": "GOOD" if roc_auc > 0.6 and accuracy > 0.55 else ("FAIR" if roc_auc > 0.55 else "POOR"),
        "trend_insight": trend_insight,
        "insights": model_insights,
    }


def _generate_performance_summary(metrics: dict, simulation: dict) -> dict:
    """
    Generate performance summary section.

    Args:
        metrics: Performance metrics
        simulation: Simulation data

    Returns:
        Performance summary dictionary
    """
    ticker = metrics.get("ticker", "N/A")
    sharpe = metrics.get("sharpe_ratio", 0)
    total_return = metrics.get("total_return", 0)
    annual_return = metrics.get("annualized_return", 0)
    annual_vol = metrics.get("annualized_volatility", 0)
    max_dd = abs(metrics.get("max_drawdown", 0))

    # Rating
    if sharpe > 1 and max_dd < 15:
        rating = "STRONG BUY"
        rating_rationale = "Exceptional risk-adjusted returns with controlled drawdowns."
    elif sharpe > 0.7 and max_dd < 20:
        rating = "BUY"
        rating_rationale = "Solid performance with acceptable risk levels."
    elif sharpe > 0.3 and max_dd < 25:
        rating = "HOLD"
        rating_rationale = "Moderate performance requires monitoring."
    elif sharpe > 0:
        rating = "UNDERWEIGHT"
        rating_rationale = "Marginal returns do not justify risk exposure."
    else:
        rating = "AVOID"
        rating_rationale = "Negative risk-adjusted returns warrant strategy revision."

    summary_text = (
        f"The {ticker} sentiment strategy delivered {total_return:.1f}% total return "
        f"({annual_return:.1f}% annualized) with a Sharpe ratio of {sharpe:.2f}. "
        f"Maximum drawdown reached {max_dd:.1f}% with {annual_vol:.1f}% annualized volatility."
    )

    # Trade statistics from simulation
    trade_stats = {}
    if simulation and "summary" in simulation:
        sim_summary = simulation["summary"]
        trade_stats = {
            "total_trades": sim_summary.get("total_trades", 0),
            "win_rate_pct": sim_summary.get("win_rate_pct", 0),
            "profit_factor": sim_summary.get("profit_factor", 0),
            "avg_win": sim_summary.get("avg_win", 0),
            "avg_loss": sim_summary.get("avg_loss", 0),
        }

    return {
        "rating": rating,
        "rating_rationale": rating_rationale,
        "summary": summary_text,
        "key_metrics": {
            "sharpe_ratio": sharpe,
            "total_return_pct": total_return,
            "annualized_return_pct": annual_return,
            "annualized_volatility_pct": annual_vol,
            "max_drawdown_pct": max_dd,
        },
        "trade_statistics": trade_stats,
    }


def _generate_recommendations(
    metrics: dict,
    risk_analysis: dict,
    ml_analysis: dict,
    volatility_analysis: dict,
    optimization: dict,
) -> list:
    """
    Generate strategic recommendations.

    Returns:
        List of recommendation strings for display
    """
    recommendations = []

    sharpe = metrics.get("sharpe_ratio", 0)
    max_dd = abs(metrics.get("max_drawdown", 0))

    # Risk-based recommendations
    if risk_analysis.get("risk_level") == "HIGH":
        recommendations.append(
            "Implement tighter stop-loss controls to limit drawdown severity. "
            "Frequent or severe drawdowns erode capital and investor confidence."
        )

    if risk_analysis.get("sharpe_stability", {}).get("is_stable") is False:
        recommendations.append(
            "Consider regime-adaptive position sizing to stabilize returns. "
            "Unstable Sharpe ratio indicates inconsistent risk-adjusted performance."
        )

    # ML-based recommendations
    if ml_analysis.get("accuracy_trend") == "degrading":
        recommendations.append(
            "Retrain ML model with recent data to address concept drift. "
            "Degrading accuracy suggests the model is becoming stale."
        )

    if ml_analysis.get("model_quality") == "POOR":
        recommendations.append(
            "Explore additional features or alternative ML algorithms. "
            "Current model shows limited predictive power."
        )

    # Volatility regime recommendations
    preferred_regime = volatility_analysis.get("preferred_regime", "neutral")
    if preferred_regime == "high_volatility":
        recommendations.append(
            "Increase position sizes during high volatility periods. "
            "Strategy shows stronger performance in volatile markets."
        )
    elif preferred_regime == "low_volatility":
        recommendations.append(
            "Reduce exposure during high volatility periods. "
            "Strategy underperforms in volatile conditions."
        )

    # Optimization recommendations
    if optimization and "best_parameters" in optimization:
        best_params = optimization["best_parameters"]
        best_sharpe = optimization.get("best_sharpe", 0)
        recommendations.append(
            f"Consider optimized parameters: sentiment_threshold={best_params.get('sentiment_threshold')}, "
            f"volatility_percentile={best_params.get('volatility_percentile')}. "
            f"Optimized parameters achieved Sharpe ratio of {best_sharpe:.2f}."
        )

    # General recommendations based on performance
    if sharpe < 0.3:
        recommendations.append(
            "Fundamental strategy review required before live deployment. "
            "Current risk-adjusted returns are insufficient for institutional allocation."
        )
    elif max_dd > 25:
        recommendations.append(
            "Implement maximum drawdown circuit breakers at 15-20%. "
            "Large drawdowns significantly impact long-term compounding."
        )

    # Add positive recommendations if strategy is performing well
    if sharpe > 0.7 and max_dd < 20:
        recommendations.append(
            "Strategy shows strong risk-adjusted performance. "
            "Consider gradually increasing position sizes while maintaining risk controls."
        )

    if not recommendations:
        recommendations.append(
            "Continue monitoring strategy performance and market conditions. "
            "No immediate changes recommended at this time."
        )

    return recommendations


def generate_strategy_insight(metrics: dict) -> str:
    """
    Generate natural language analysis from strategy metrics.

    Analysis criteria:
        - Sharpe > 1: Strong risk-adjusted performance
        - Sharpe 0.5-1: Moderate risk-adjusted performance
        - Sharpe < 0.5: Weak risk-adjusted performance
        - Drawdown > 20%: High risk
        - Drawdown 10-20%: Moderate risk
        - Drawdown < 10%: Low risk
        - Annual return > 10%: Alpha generating
        - Annual return 0-10%: Modest returns
        - Annual return < 0%: Underperforming

    Args:
        metrics: Dictionary containing performance metrics from backtest

    Returns:
        Professional research summary (5-6 sentences)
    """
    ticker = metrics.get("ticker", "N/A")
    sharpe = metrics.get("sharpe_ratio", 0)
    total_return = metrics.get("total_return", 0)
    annual_return = metrics.get("annualized_return", 0)
    annual_vol = metrics.get("annualized_volatility", 0)
    max_dd = abs(metrics.get("max_drawdown", 0))
    trading_days = metrics.get("trading_days", 0)

    # Build analysis components
    sentences = []

    # Opening sentence with overall assessment
    if sharpe > 1:
        overall = "exhibits strong risk-adjusted performance"
    elif sharpe > 0.5:
        overall = "demonstrates moderate risk-adjusted returns"
    elif sharpe > 0:
        overall = "shows marginal positive risk-adjusted performance"
    else:
        overall = "underperforms on a risk-adjusted basis"

    sentences.append(
        f"The sentiment-based trading strategy for {ticker} {overall} "
        f"over the {trading_days}-day evaluation period."
    )

    # Sharpe ratio analysis
    if sharpe > 1.5:
        sharpe_analysis = (
            f"The Sharpe ratio of {sharpe:.2f} indicates exceptional "
            f"risk-adjusted returns, significantly outperforming typical benchmarks."
        )
    elif sharpe > 1:
        sharpe_analysis = (
            f"With a Sharpe ratio of {sharpe:.2f}, the strategy delivers "
            f"strong compensation for volatility exposure."
        )
    elif sharpe > 0.5:
        sharpe_analysis = (
            f"The Sharpe ratio of {sharpe:.2f} suggests acceptable but not "
            f"outstanding risk-adjusted performance."
        )
    else:
        sharpe_analysis = (
            f"A Sharpe ratio of {sharpe:.2f} indicates the strategy does not "
            f"adequately compensate investors for the risk undertaken."
        )
    sentences.append(sharpe_analysis)

    # Return analysis
    if annual_return > 15:
        return_analysis = (
            f"Annualized returns of {annual_return:.1f}% demonstrate significant "
            f"alpha generation, substantially exceeding typical market returns."
        )
    elif annual_return > 10:
        return_analysis = (
            f"The strategy generates {annual_return:.1f}% annualized returns, "
            f"indicating positive alpha relative to passive benchmarks."
        )
    elif annual_return > 0:
        return_analysis = (
            f"Annualized returns of {annual_return:.1f}% represent modest gains, "
            f"though may lag broader market performance in bull markets."
        )
    else:
        return_analysis = (
            f"The negative annualized return of {annual_return:.1f}% suggests "
            f"the strategy has struggled to generate positive performance."
        )
    sentences.append(return_analysis)

    # Risk assessment
    if max_dd > 25:
        risk_analysis = (
            f"Maximum drawdown of {max_dd:.1f}% represents substantial downside risk, "
            f"requiring significant capital reserves and risk tolerance."
        )
    elif max_dd > 20:
        risk_analysis = (
            f"The {max_dd:.1f}% maximum drawdown indicates elevated risk exposure, "
            f"warranting careful position sizing and risk management."
        )
    elif max_dd > 10:
        risk_analysis = (
            f"A maximum drawdown of {max_dd:.1f}% reflects moderate risk levels "
            f"consistent with active trading strategies."
        )
    else:
        risk_analysis = (
            f"The contained maximum drawdown of {max_dd:.1f}% demonstrates "
            f"effective downside protection and risk control."
        )
    sentences.append(risk_analysis)

    # Volatility context
    if annual_vol > 25:
        vol_context = (
            f"Annualized volatility of {annual_vol:.1f}% is elevated, "
            f"suggesting suitability primarily for risk-tolerant investors."
        )
    elif annual_vol > 15:
        vol_context = (
            f"Strategy volatility of {annual_vol:.1f}% annualized falls within "
            f"typical ranges for equity-based systematic strategies."
        )
    else:
        vol_context = (
            f"The relatively low {annual_vol:.1f}% annualized volatility "
            f"provides a smoother return profile for conservative allocations."
        )
    sentences.append(vol_context)

    # Concluding recommendation
    if sharpe > 1 and max_dd < 20:
        conclusion = (
            "Overall, the strategy presents an attractive risk-return profile "
            "suitable for allocation within a diversified portfolio."
        )
    elif sharpe > 0.5 and max_dd < 25:
        conclusion = (
            "The strategy may warrant consideration as a tactical allocation, "
            "though investors should monitor drawdown exposure carefully."
        )
    elif sharpe > 0:
        conclusion = (
            "Given the marginal risk-adjusted returns, investors should carefully "
            "weigh this strategy against lower-cost passive alternatives."
        )
    else:
        conclusion = (
            "Based on current performance metrics, the strategy requires "
            "further optimization before deployment in a live portfolio."
        )
    sentences.append(conclusion)

    return " ".join(sentences)


def generate_ai_report(
    ticker: str,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> dict:
    """
    Generate full AI research report for a ticker.

    Args:
        ticker: Stock ticker symbol
        sentiment_threshold: Sentiment threshold for strategy (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        Dictionary with metrics and AI-generated analysis
    """
    # Get performance metrics
    metrics = calculate_performance_metrics(
        ticker,
        sentiment_threshold=sentiment_threshold,
        volatility_percentile=volatility_percentile,
    )

    if not metrics:
        return {}

    # Generate natural language insight
    insight = generate_strategy_insight(metrics)

    return {
        "ticker": ticker.upper(),
        "metrics": metrics,
        "analysis": insight,
        "parameters": {
            "sentiment_threshold": sentiment_threshold,
            "volatility_percentile": volatility_percentile,
        },
    }


def generate_comprehensive_report(
    ticker: str,
    sentiment_threshold: float = 0.2,
    volatility_percentile: float = 50.0,
) -> dict:
    """
    Generate comprehensive AI research report with full analysis.

    Includes:
        - Performance summary with rating
        - Risk pattern analysis
        - ML model performance trends
        - Volatility regime analysis
        - Strategic recommendations

    Args:
        ticker: Stock ticker symbol
        sentiment_threshold: Sentiment threshold for strategy (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        Professional research report dictionary
    """
    ticker = ticker.upper()

    # Gather all data
    metrics = calculate_performance_metrics(
        ticker,
        sentiment_threshold=sentiment_threshold,
        volatility_percentile=volatility_percentile,
    )

    if not metrics:
        return {}

    # Run simulation for trade analysis
    simulation = run_live_simulation(
        ticker,
        sentiment_threshold=sentiment_threshold,
        volatility_percentile=volatility_percentile,
    )

    # Get ML predictions
    ml_data = predict_next_day(ticker)

    # Run optimization
    optimization = optimize_strategy(ticker)

    # Perform analyses
    volatility_analysis = _analyze_volatility_regimes(ticker)
    risk_analysis = _analyze_risk_patterns(simulation)
    ml_analysis = _analyze_ml_performance(ml_data)

    # Generate performance summary
    performance_summary = _generate_performance_summary(metrics, simulation)

    # Generate recommendations
    recommendations = _generate_recommendations(
        metrics, risk_analysis, ml_analysis, volatility_analysis, optimization
    )

    # Generate narrative sections
    executive_summary = _generate_executive_summary(
        ticker, metrics, risk_analysis, ml_analysis
    )

    risk_narrative = _generate_risk_narrative(risk_analysis, volatility_analysis)
    ml_narrative = _generate_ml_narrative(ml_analysis)
    strategy_narrative = generate_strategy_insight(metrics)

    # Flatten performance_summary for frontend compatibility
    perf_key_metrics = performance_summary.get("key_metrics", {})
    trade_stats = performance_summary.get("trade_statistics", {})
    perf_insights = []
    if performance_summary.get("summary"):
        perf_insights.append(performance_summary["summary"])
    if performance_summary.get("rating_rationale"):
        perf_insights.append(performance_summary["rating_rationale"])

    # Restructure volatility analysis for frontend (rename keys)
    vol_high = volatility_analysis.get("high_volatility", {})
    vol_low = volatility_analysis.get("low_volatility", {})
    volatility_frontend = {
        "high_volatility": {
            "days": vol_high.get("days", 0),
            "avg_daily_return_pct": vol_high.get("avg_daily_return_pct", 0),
            "estimated_sharpe": vol_high.get("sharpe_estimate", 0),
            "avg_volatility": vol_high.get("volatility_pct", 0) / 100 if vol_high.get("volatility_pct") else 0,
        },
        "low_volatility": {
            "days": vol_low.get("days", 0),
            "avg_daily_return_pct": vol_low.get("avg_daily_return_pct", 0),
            "estimated_sharpe": vol_low.get("sharpe_estimate", 0),
            "avg_volatility": vol_low.get("volatility_pct", 0) / 100 if vol_low.get("volatility_pct") else 0,
        },
        "preferred_regime": volatility_analysis.get("preferred_regime", "neutral"),
        "insight": volatility_analysis.get("insight", ""),
    }

    # Restructure strategy analysis for frontend
    best_params = optimization.get("best_parameters", {})
    strategy_insights = []
    if strategy_narrative:
        strategy_insights.append(strategy_narrative)
    stable_regions = optimization.get("stable_regions", [])

    return {
        "ticker": ticker,
        "report_type": "COMPREHENSIVE_RESEARCH_REPORT",
        "generated_at": pd.Timestamp.now().isoformat(),
        "parameters": {
            "sentiment_threshold": sentiment_threshold,
            "volatility_percentile": volatility_percentile,
        },
        "executive_summary": executive_summary,
        "performance_summary": {
            "rating": performance_summary.get("rating", "HOLD"),
            "rating_rationale": performance_summary.get("rating_rationale", ""),
            "sharpe_ratio": perf_key_metrics.get("sharpe_ratio", 0),
            "total_return_pct": perf_key_metrics.get("total_return_pct", 0),
            "annualized_return_pct": perf_key_metrics.get("annualized_return_pct", 0),
            "annualized_volatility_pct": perf_key_metrics.get("annualized_volatility_pct", 0),
            "max_drawdown_pct": perf_key_metrics.get("max_drawdown_pct", 0),
            "win_rate": trade_stats.get("win_rate_pct", 0),
            "total_trades": trade_stats.get("total_trades", 0),
            "profit_factor": trade_stats.get("profit_factor", 0),
            "insights": perf_insights,
        },
        "risk_insights": {
            "risk_level": risk_analysis.get("risk_level", "UNKNOWN"),
            "drawdown_events": risk_analysis.get("drawdown_events", 0),
            "sharpe_stability": risk_analysis.get("sharpe_stability", {}),
            "narrative": risk_narrative,
            "insights": risk_analysis.get("insights", []),
        },
        "model_insights": {
            "model_quality": ml_analysis.get("model_quality", "UNKNOWN"),
            "accuracy_trend": ml_analysis.get("accuracy_trend", "stable"),
            "roc_auc": ml_analysis.get("roc_auc", 0.5),
            "narrative": ml_narrative,
            "latest_prediction": ml_data.get("latest_prediction", {}),
            "insights": ml_analysis.get("insights", []),
        },
        "volatility_regime_analysis": volatility_frontend,
        "strategy_analysis": {
            "narrative": strategy_narrative,
            "optimal_parameters": {
                "sentiment_threshold": best_params.get("sentiment_threshold", 0.2),
                "volatility_filter": best_params.get("volatility_filter", 50),
            },
            "optimal_sharpe": optimization.get("best_sharpe", 0),
            "stable_regions_count": len(stable_regions),
            "insights": strategy_insights,
        },
        "recommendations": recommendations,
    }


def _generate_executive_summary(
    ticker: str,
    metrics: dict,
    risk_analysis: dict,
    ml_analysis: dict,
) -> str:
    """Generate executive summary paragraph."""
    sharpe = metrics.get("sharpe_ratio", 0)
    annual_return = metrics.get("annualized_return", 0)
    max_dd = abs(metrics.get("max_drawdown", 0))

    risk_level = risk_analysis.get("risk_level", "UNKNOWN")
    model_quality = ml_analysis.get("model_quality", "UNKNOWN")
    accuracy_trend = ml_analysis.get("accuracy_trend", "stable")

    # Build executive summary
    if sharpe > 0.7 and risk_level != "HIGH":
        outlook = "favorable"
        stance = "warrants consideration for tactical allocation"
    elif sharpe > 0.3:
        outlook = "cautiously optimistic"
        stance = "requires ongoing monitoring and risk management"
    else:
        outlook = "challenging"
        stance = "requires significant optimization before deployment"

    summary = (
        f"This research report presents a comprehensive analysis of the {ticker} "
        f"sentiment-based trading strategy. The strategy has generated {annual_return:.1f}% "
        f"annualized returns with a Sharpe ratio of {sharpe:.2f} and maximum drawdown of "
        f"{max_dd:.1f}%. Risk assessment indicates {risk_level} risk levels, while the "
        f"predictive model demonstrates {model_quality} quality with {accuracy_trend} "
        f"accuracy trends. Overall market outlook is {outlook}, and the strategy {stance}."
    )

    return summary


def _generate_risk_narrative(risk_analysis: dict, volatility_analysis: dict) -> str:
    """Generate risk analysis narrative."""
    if not risk_analysis:
        return "Insufficient data for risk analysis."

    risk_level = risk_analysis.get("risk_level", "UNKNOWN")
    drawdown_events = risk_analysis.get("drawdown_events", 0)
    sharpe_stable = risk_analysis.get("sharpe_stability", {}).get("is_stable", True)
    insights = risk_analysis.get("insights", [])

    vol_insight = volatility_analysis.get("insight", "")

    narrative_parts = []

    # Risk level assessment
    if risk_level == "HIGH":
        narrative_parts.append(
            "Risk assessment reveals elevated concerns that warrant immediate attention."
        )
    elif risk_level == "MODERATE":
        narrative_parts.append(
            "Risk levels are moderate and manageable with appropriate controls."
        )
    else:
        narrative_parts.append(
            "Risk profile is favorable with well-contained downside exposure."
        )

    # Drawdown analysis
    if drawdown_events > 5:
        narrative_parts.append(
            f"The strategy experienced {drawdown_events} significant drawdown events, "
            "indicating potential vulnerability to adverse market conditions."
        )
    elif drawdown_events > 0:
        narrative_parts.append(
            f"A total of {drawdown_events} drawdown events were recorded, "
            "within acceptable bounds for active strategies."
        )

    # Sharpe stability
    if not sharpe_stable:
        narrative_parts.append(
            "Sharpe ratio instability suggests performance may vary significantly "
            "across different market regimes."
        )

    # Volatility regime
    if vol_insight:
        narrative_parts.append(vol_insight)

    return " ".join(narrative_parts)


def _generate_ml_narrative(ml_analysis: dict) -> str:
    """Generate ML model analysis narrative."""
    if not ml_analysis:
        return "Insufficient data for ML model analysis."

    model_quality = ml_analysis.get("model_quality", "UNKNOWN")
    accuracy_trend = ml_analysis.get("accuracy_trend", "stable")
    roc_auc = ml_analysis.get("roc_auc", 0.5)
    trend_insight = ml_analysis.get("trend_insight", "")
    insights = ml_analysis.get("insights", [])

    narrative_parts = []

    # Model quality
    if model_quality == "GOOD":
        narrative_parts.append(
            f"The machine learning model demonstrates good predictive capability "
            f"with ROC AUC of {roc_auc:.3f}."
        )
    elif model_quality == "FAIR":
        narrative_parts.append(
            f"The ML model shows fair predictive ability with ROC AUC of {roc_auc:.3f}, "
            "suggesting room for improvement."
        )
    else:
        narrative_parts.append(
            f"Model performance is limited with ROC AUC of {roc_auc:.3f}, "
            "indicating predictions offer marginal edge over random guessing."
        )

    # Trend analysis
    if trend_insight:
        narrative_parts.append(trend_insight)

    # Additional insights
    for insight in insights[:2]:
        narrative_parts.append(insight)

    return " ".join(narrative_parts)
