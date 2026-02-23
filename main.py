"""
AltAlpha Lab - Quantitative Trading Research Platform API
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from ai_analyst import generate_ai_report, generate_comprehensive_report
from backtest import run_backtest
from data import get_price_data
from features import merge_price_and_sentiment
from live_simulator import run_live_simulation
from metrics import calculate_performance_metrics
from ml_model import predict_next_day
from optimizer import optimize_strategy
from sentiment import get_mock_sentiment_series
from strategy import generate_sentiment_strategy

app = FastAPI(
    title="AltAlpha Lab",
    description="Quantitative Trading Research Platform API",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    """Root endpoint to check API status."""
    return {"message": "AltAlpha Lab API running"}


@app.get("/price-data")
async def price_data(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
) -> dict:
    """
    Get historical price data with daily returns for a given ticker.

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON with ticker info and price data including date, close, and returns
    """
    ticker = ticker.upper()

    try:
        data = get_price_data(ticker)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching data for {ticker}: {str(e)}",
        )

    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for ticker: {ticker}",
        )

    return {
        "ticker": ticker,
        "count": len(data),
        "data": data,
    }


@app.get("/sentiment")
async def sentiment(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
) -> dict:
    """
    Get sentiment time series for a given ticker.

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON with ticker info and sentiment data including date and sentiment score
    """
    ticker = ticker.upper()

    try:
        df = get_mock_sentiment_series(ticker)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating sentiment for {ticker}: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No sentiment data for ticker: {ticker}",
        )

    data = df.to_dict(orient="records")

    return {
        "ticker": ticker,
        "count": len(data),
        "data": data,
    }


@app.get("/features")
async def features(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
) -> dict:
    """
    Get merged price and sentiment data with computed features.

    Features include:
        - 5-day rolling sentiment average
        - 5-day return volatility

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON with merged dataset including all features
    """
    ticker = ticker.upper()

    try:
        df = merge_price_and_sentiment(ticker)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error computing features for {ticker}: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No feature data for ticker: {ticker}",
        )

    data = df.to_dict(orient="records")

    return {
        "ticker": ticker,
        "count": len(data),
        "data": data,
    }


@app.get("/strategy")
async def strategy(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Get trading signals based on sentiment strategy.

    Signal Rules:
        - Long (1): sentiment_avg_5d > threshold AND volatility < percentile
        - Short (-1): sentiment_avg_5d < -threshold
        - Flat (0): otherwise

    Args:
        ticker: Stock ticker symbol
        sentiment_threshold: Threshold for sentiment signal (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        JSON with strategy dataset including position signals
    """
    ticker = ticker.upper()

    try:
        df = generate_sentiment_strategy(
            ticker,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating strategy for {ticker}: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No strategy data for ticker: {ticker}",
        )

    data = df.to_dict(orient="records")

    return {
        "ticker": ticker,
        "sentiment_threshold": sentiment_threshold,
        "volatility_percentile": volatility_percentile,
        "count": len(data),
        "data": data,
    }


@app.get("/backtest")
async def backtest(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    initial_capital: float = Query(10000.0, description="Starting capital"),
    transaction_cost: float = Query(0.001, description="Transaction cost as fraction (0.001 = 0.1%)"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Run backtest on sentiment strategy.

    Computes strategy returns with transaction costs and portfolio value over time.

    Args:
        ticker: Stock ticker symbol
        initial_capital: Starting capital (default: 10000)
        transaction_cost: Cost per trade as fraction (default: 0.001)
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        JSON with backtest results including portfolio value
    """
    ticker = ticker.upper()

    try:
        df = run_backtest(
            ticker,
            initial_capital=initial_capital,
            transaction_cost=transaction_cost,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running backtest for {ticker}: {str(e)}",
        )

    if df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No backtest data for ticker: {ticker}",
        )

    data = df.to_dict(orient="records")

    # Calculate summary statistics
    final_value = data[-1]["portfolio_value"]
    total_return = (final_value - initial_capital) / initial_capital * 100

    return {
        "ticker": ticker,
        "initial_capital": initial_capital,
        "final_value": final_value,
        "total_return_pct": round(total_return, 2),
        "count": len(data),
        "data": data,
    }


@app.get("/metrics")
async def metrics(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    initial_capital: float = Query(10000.0, description="Starting capital"),
    transaction_cost: float = Query(0.001, description="Transaction cost as fraction (0.001 = 0.1%)"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Get performance metrics for the sentiment strategy.

    Metrics include:
        - Total return (%)
        - Annualized return (%)
        - Annualized volatility (%)
        - Sharpe ratio
        - Maximum drawdown (%)

    Args:
        ticker: Stock ticker symbol
        initial_capital: Starting capital (default: 10000)
        transaction_cost: Cost per trade as fraction (default: 0.001)
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        JSON with performance metrics summary
    """
    ticker = ticker.upper()

    try:
        result = calculate_performance_metrics(
            ticker,
            initial_capital=initial_capital,
            transaction_cost=transaction_cost,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating metrics for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No metrics data for ticker: {ticker}",
        )

    return result


@app.get("/ai-report")
async def ai_report(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Generate AI research analyst report for a strategy.

    Produces professional natural language analysis based on:
        - Sharpe ratio assessment
        - Return analysis vs market
        - Risk evaluation (drawdown)
        - Volatility context
        - Investment recommendation

    Args:
        ticker: Stock ticker symbol
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        JSON with:
            - metrics: Performance metrics
            - analysis: AI-generated research summary (5-6 sentences)
    """
    ticker = ticker.upper()

    try:
        result = generate_ai_report(
            ticker,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating AI report for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient data for AI report for ticker: {ticker}",
        )

    return result


@app.get("/ai-report/comprehensive")
async def ai_report_comprehensive(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Generate comprehensive AI research report with full analysis.

    Includes:
        - Executive summary with rating
        - Performance summary with key metrics
        - Risk pattern analysis (drawdowns, Sharpe stability)
        - ML model performance trends
        - Volatility regime analysis (high vs low volatility)
        - Strategic recommendations

    Args:
        ticker: Stock ticker symbol
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        Professional research report with structured insights
    """
    ticker = ticker.upper()

    try:
        result = generate_comprehensive_report(
            ticker,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating comprehensive report for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient data for comprehensive report for ticker: {ticker}",
        )

    return result


@app.get("/optimize")
async def optimize(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
) -> dict:
    """
    Find optimal trading strategy parameters via grid search.

    Tests combinations of:
        - sentiment_threshold: -0.5 to 0.5 (step 0.1)
        - volatility_percentile: 20 to 80 (step 10)

    For each combination:
        1. Run strategy
        2. Run backtest
        3. Calculate Sharpe ratio

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON with:
            - best_parameters: Optimal parameter set
            - best_sharpe: Highest Sharpe ratio achieved
            - top_10: Top 10 parameter configurations ranked by Sharpe
            - total_combinations: Number of combinations tested
    """
    ticker = ticker.upper()

    try:
        result = optimize_strategy(ticker)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error optimizing strategy for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient data for optimization for ticker: {ticker}",
        )

    return result


@app.get("/live-sim")
async def live_sim(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
    initial_capital: float = Query(10000.0, description="Starting capital"),
    sentiment_threshold: float = Query(0.2, description="Sentiment threshold for signals"),
    volatility_percentile: float = Query(50.0, description="Volatility percentile filter"),
) -> dict:
    """
    Run live trading simulation.

    Simulates real-time strategy execution by iterating through
    historical data day by day:
        1. Generate signal based on available data
        2. Update position
        3. Track portfolio value

    Args:
        ticker: Stock ticker symbol
        initial_capital: Starting capital (default: 10000)
        sentiment_threshold: Sentiment threshold for signals (default: 0.2)
        volatility_percentile: Volatility percentile filter (default: 50)

    Returns:
        JSON with:
            - portfolio_history: Time series of daily portfolio values
            - trade_log: List of executed trades
            - final_capital: Ending portfolio value
            - summary: Simulation statistics
    """
    ticker = ticker.upper()

    try:
        result = run_live_simulation(
            ticker,
            initial_capital=initial_capital,
            sentiment_threshold=sentiment_threshold,
            volatility_percentile=volatility_percentile,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running live simulation for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient data for simulation for ticker: {ticker}",
        )

    return result


@app.get("/ml-predict")
async def ml_predict(
    ticker: str = Query(..., description="Stock ticker symbol (e.g., AAPL)"),
) -> dict:
    """
    Get ML prediction for next day market direction.

    Uses RandomForest classifier trained on:
        - returns
        - rolling_sentiment_5d
        - volatility_5d
        - sentiment
        - returns_avg_5d

    Target: next day return direction (1 = up, 0 = down)

    Model uses time-based 80/20 train/test split to avoid data leakage.

    Args:
        ticker: Stock ticker symbol

    Returns:
        JSON with:
            - accuracy: Model accuracy on test set
            - precision: Model precision on test set
            - recall: Model recall on test set
            - prediction_probabilities: Probabilities for up/down movement
            - feature_importance: Ranked feature importance scores
    """
    ticker = ticker.upper()

    try:
        result = predict_next_day(ticker)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating ML prediction for {ticker}: {str(e)}",
        )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient data for ML prediction for ticker: {ticker}",
        )

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
