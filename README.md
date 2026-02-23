# AltAlpha Lab

A quantitative trading research platform that combines sentiment analysis, machine learning predictions, and strategy optimization to help analyze and backtest trading strategies.

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

### Dashboard & Analytics
- **Interactive Dashboard** - Portfolio charts, key metrics, and real-time analysis
- **Multi-Currency Support** - USD, EUR, GBP, JPY, INR conversion

### Trading Strategy
- **Sentiment-Based Signals** - Trading signals based on sentiment analysis
- **Backtesting Engine** - Full strategy backtest with transaction costs
- **Performance Metrics** - Sharpe ratio, max drawdown, annualized returns
- **Strategy Optimizer** - Grid search to find optimal parameters

### Machine Learning
- **ML Predictions** - RandomForest classifier for next-day direction
- **Feature Importance** - Understand what drives predictions
- **Rolling Accuracy** - Track model performance over time

### Advanced Analysis
- **Live Simulation** - Day-by-day trading simulation with trade logs
- **AI Research Reports** - Comprehensive analysis with ratings and recommendations
- **Asset Comparison** - Compare multiple tickers with correlation analysis
- **Volatility Regime Analysis** - Performance in high vs low volatility periods

## Quick Start

### Using Makefile (Recommended)

```bash
# Install all dependencies (Python + npm)
make install

# Run both backend and frontend
make dev
```

The backend will be available at `http://localhost:8000` and frontend at `http://localhost:5173`.

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies (backend + frontend) |
| `make dev` | Run both backend and frontend concurrently |
| `make dev-backend` | Run backend only (FastAPI on port 8000) |
| `make dev-frontend` | Run frontend only (Vite on port 5173) |
| `make build` | Build frontend for production |
| `make lint` | Lint frontend code |
| `make clean` | Remove venv, node_modules, and cache files |
| `make help` | Show all available commands |

## Project Structure

```
AltAlpha Lab/
├── main.py                 # FastAPI application entry point
├── data.py                 # Price data fetching (yfinance)
├── sentiment.py            # Sentiment analysis module
├── features.py             # Feature engineering
├── strategy.py             # Trading signal generation
├── backtest.py             # Backtesting engine
├── metrics.py              # Performance metrics calculation
├── ml_model.py             # ML prediction module
├── optimizer.py            # Strategy parameter optimization
├── live_simulator.py       # Live trading simulation
├── ai_analyst.py           # AI research report generation
├── requirements.txt        # Python dependencies
├── Makefile                # Build and run commands
├── .gitignore              # Git ignore patterns
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── views/          # Main view components
    │   │   ├── layout/         # Layout components (Sidebar, Header)
    │   │   ├── ui/             # Reusable UI components
    │   │   ├── controls/       # Strategy control panel
    │   │   ├── comparison/     # Asset comparison components
    │   │   └── insights/       # AI insight panels
    │   ├── context/            # React context (Currency)
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env.example            # Environment variables template
    ├── package.json
    ├── vite.config.js
    └── tailwind.config.js
```

## Manual Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Backend Setup

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment template (optional, for production)
cp .env.example .env.local
```

## Running the Application

### Development Mode

```bash
# Option 1: Using Makefile (recommended)
make dev

# Option 2: Manual
# Terminal 1 - Backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build

# The built files will be in frontend/dist/
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API health check |
| `/price-data` | GET | Historical price data with returns |
| `/sentiment` | GET | Sentiment time series |
| `/features` | GET | Merged price/sentiment with features |
| `/strategy` | GET | Trading signals based on sentiment |
| `/backtest` | GET | Run strategy backtest |
| `/metrics` | GET | Performance metrics (Sharpe, drawdown, etc.) |
| `/ml-predict` | GET | ML prediction for next day direction |
| `/optimize` | GET | Find optimal strategy parameters |
| `/live-sim` | GET | Run live trading simulation |
| `/ai-report` | GET | Generate AI research report |
| `/ai-report/comprehensive` | GET | Full AI analysis with recommendations |

### Example API Calls

```bash
# Get price data
curl "http://localhost:8000/price-data?ticker=AAPL"

# Run backtest with custom parameters
curl "http://localhost:8000/backtest?ticker=AAPL&initial_capital=10000&sentiment_threshold=0.2"

# Get ML predictions
curl "http://localhost:8000/ml-predict?ticker=AAPL"

# Optimize strategy
curl "http://localhost:8000/optimize?ticker=AAPL"

# Generate AI report
curl "http://localhost:8000/ai-report/comprehensive?ticker=AAPL"
```

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

For production deployment, set `VITE_API_URL` to your deployed backend URL.

## Configuration

### Strategy Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `sentiment_threshold` | 0.2 | Threshold for sentiment signals (-0.5 to 0.5) |
| `volatility_percentile` | 50 | Volatility filter percentile (20 to 80) |
| `initial_capital` | 10000 | Starting capital for backtests |
| `transaction_cost` | 0.001 | Transaction cost fraction (0.1%) |

### ML Model

- **Algorithm**: RandomForest Classifier
- **Features**: returns, rolling_sentiment_5d, volatility_5d, sentiment, returns_avg_5d
- **Train/Test Split**: 80/20 time-based split (no data leakage)
- **Metrics**: Accuracy, Precision, Recall, ROC AUC

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Pandas** - Data manipulation and analysis
- **NumPy** - Numerical computing
- **yfinance** - Yahoo Finance market data (no API key required)
- **scikit-learn** - Machine learning (RandomForest)
- **VADER Sentiment** - Sentiment analysis

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Charting library
- **jsPDF** - PDF report generation

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
4. Deploy

### Google Cloud Platform (Backend)

1. Create a Cloud Run service
2. Deploy the Python backend
3. Update CORS origins in `main.py` to include your frontend URL

### Railway / Render

Both platforms support Python + Node.js deployments. See their documentation for specific instructions.

## Security Notes

- No API keys are required - all data sources are free
- No sensitive data is stored or transmitted
- Environment files (`.env`, `.env.local`) are gitignored
- CORS is configured for localhost by default; update for production

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [yfinance](https://github.com/ranaroussi/yfinance) for market data
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [Recharts](https://recharts.org/) for React charting
- [VADER Sentiment](https://github.com/cjhutto/vaderSentiment) for sentiment analysis

---

Built with ❤️ by the AltAlpha Lab team
