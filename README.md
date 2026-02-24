# AltAlpha Lab

A quantitative trading research platform that combines sentiment analysis, machine learning predictions, and strategy optimization to help analyze and backtest trading strategies.

![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-green.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

### Dashboard & Analytics
- **Interactive Dashboard** — Portfolio charts, key metrics, and real-time analysis
- **Multi-Currency Support** — USD, EUR, GBP, JPY, INR conversion

### Trading Strategy
- **Sentiment-Based Signals** — Trading signals derived from sentiment analysis
- **Backtesting Engine** — Full strategy backtest with transaction costs
- **Performance Metrics** — Sharpe ratio, max drawdown, annualized returns
- **Strategy Optimizer** — Grid search to find optimal parameters

### Machine Learning
- **ML Predictions** — RandomForest classifier for next-day direction
- **Feature Importance** — Understand what drives predictions
- **Rolling Accuracy** — Track model performance over time

### Advanced Analysis
- **Live Simulation** — Day-by-day trading simulation with trade logs
- **AI Research Reports** — Comprehensive analysis with ratings and recommendations
- **Asset Comparison** — Compare multiple tickers with correlation analysis
- **Volatility Regime Analysis** — Performance in high vs low volatility periods

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm

### Using Makefile (Recommended)

```bash
# First-time setup (install deps + create env files)
make setup

# Run both backend and frontend
make dev
```

The backend will be at `http://localhost:8000` (API docs at `/docs`) and frontend at `http://localhost:5173`.

### Available Make Commands

| Command | Description |
|---------|-------------|
| `make setup` | First-time setup (install + create env files) |
| `make install` | Install all dependencies (backend + frontend) |
| `make dev` | Run backend and frontend concurrently |
| `make dev-backend` | Run backend only (FastAPI on port 8000) |
| `make dev-frontend` | Run frontend only (Vite on port 5173) |
| `make build` | Build frontend for production |
| `make lint` | Lint frontend code |
| `make preview` | Preview production build |
| `make check` | Check if backend and frontend are running |
| `make freeze` | Freeze Python deps to requirements.txt |
| `make clean` | Remove venv, node_modules, and cache files |

## Project Structure

```
AltAlpha Lab/
├── main.py                 # FastAPI application & routes
├── data.py                 # Price data fetching (yfinance)
├── sentiment.py            # Sentiment analysis
├── features.py             # Feature engineering
├── strategy.py             # Trading signal generation
├── backtest.py             # Backtesting engine
├── metrics.py              # Performance metrics
├── ml_model.py             # ML prediction (RandomForest)
├── optimizer.py            # Strategy parameter optimization
├── live_simulator.py       # Live trading simulation
├── ai_analyst.py           # AI research report generation
├── requirements.txt        # Python dependencies
├── Makefile                # Build & run commands
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml          # CI pipeline (lint, build, test)
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── eslint.config.js
    ├── .env.example         # Environment variables template
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── CurrencyContext.jsx
        └── components/
            ├── Dashboard.jsx
            ├── ChartCard.jsx
            ├── PriceChart.jsx
            ├── SentimentChart.jsx
            ├── PortfolioChart.jsx
            ├── DrawdownChart.jsx
            ├── ComparisonChart.jsx
            ├── RollingSharpeChart.jsx
            ├── views/           # Page-level views
            ├── layout/          # Sidebar, Header, MainLayout
            ├── ui/              # Reusable UI primitives
            ├── controls/        # Strategy control panel
            ├── comparison/      # Asset comparison widgets
            └── insights/        # AI insight panels
```

## Manual Installation

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # then edit if needed
```

## Running

```bash
# Option 1 — Makefile (recommended)
make dev

# Option 2 — Manual
# Terminal 1: Backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

## API Endpoints

All endpoints accept a `ticker` query parameter (e.g. `?ticker=AAPL`).

| Endpoint | Description |
|----------|-------------|
| `GET /` | Health check |
| `GET /price-data` | Historical price data with returns |
| `GET /sentiment` | Sentiment time series |
| `GET /features` | Merged price/sentiment with engineered features |
| `GET /strategy` | Trading signals (configurable threshold & volatility) |
| `GET /backtest` | Run strategy backtest with transaction costs |
| `GET /metrics` | Performance metrics (Sharpe, drawdown, etc.) |
| `GET /ml-predict` | ML prediction for next-day direction |
| `GET /optimize` | Grid-search optimal strategy parameters |
| `GET /live-sim` | Day-by-day live trading simulation |
| `GET /ai-report` | AI research analyst report |
| `GET /ai-report/comprehensive` | Full AI analysis with recommendations |

Interactive API docs are available at `http://localhost:8000/docs` when the backend is running.

### Example Requests

```bash
curl "http://localhost:8000/price-data?ticker=AAPL"
curl "http://localhost:8000/backtest?ticker=AAPL&initial_capital=10000&sentiment_threshold=0.2"
curl "http://localhost:8000/ml-predict?ticker=AAPL"
curl "http://localhost:8000/optimize?ticker=AAPL"
curl "http://localhost:8000/ai-report/comprehensive?ticker=AAPL"
```

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

Create this file from the template:

```bash
cp frontend/.env.example frontend/.env.local
```

For production, set `VITE_API_URL` to your deployed backend URL. This is the **only** environment variable needed — no API keys are required.

## CI/CD

GitHub Actions runs automatically on every push to `main` and on pull requests:

- **Backend** — Installs Python deps, verifies all module imports, starts the API and runs a health check
- **Frontend** — Installs npm deps, runs ESLint, builds for production

> After pushing to GitHub, replace `<OWNER>/<REPO>` in the CI badge URL at the top of this README with your actual GitHub username and repository name.

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend-url.com`
4. Deploy

### Google Cloud Platform (Backend)

1. Create a Cloud Run service
2. Deploy the Python backend with `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Update CORS origins in `main.py` to include your frontend URL

### Railway / Render

Both platforms support Python + Node.js. Point the backend to the root directory and frontend to `frontend/`.

## Configuration

### Strategy Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `sentiment_threshold` | 0.2 | -0.5 to 0.5 | Threshold for sentiment signals |
| `volatility_percentile` | 50 | 20 to 80 | Volatility filter percentile |
| `initial_capital` | 10,000 | — | Starting capital for backtests |
| `transaction_cost` | 0.001 | — | Transaction cost fraction (0.1%) |

### ML Model

- **Algorithm**: RandomForest Classifier
- **Features**: returns, rolling_sentiment_5d, volatility_5d, sentiment, returns_avg_5d
- **Split**: 80/20 time-based (no data leakage)
- **Metrics**: Accuracy, Precision, Recall, ROC AUC

## Tech Stack

### Backend
- **FastAPI** — Python web framework
- **Pandas / NumPy** — Data manipulation
- **yfinance** — Market data (no API key required)
- **scikit-learn** — Machine learning
- **VADER Sentiment** — Sentiment scoring

### Frontend
- **React 18** — UI library
- **Vite** — Build tool & dev server
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Charts
- **jsPDF + html2canvas** — PDF report export

## Security

- **No API keys required** — all data sources (yfinance, exchange rates) are free and keyless
- **No secrets stored** — the app has zero server-side secrets
- **Env files gitignored** — `.env`, `.env.local`, `*.env` are all in `.gitignore`
- **Credentials gitignored** — `*.pem`, `*.key`, `credentials.json`, `service-account*.json`
- **CORS locked down** — only `localhost:5173` by default; update `main.py` for production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request — CI will run automatically

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [yfinance](https://github.com/ranaroussi/yfinance) for market data
- [FastAPI](https://fastapi.tiangolo.com/) for the web framework
- [Recharts](https://recharts.org/) for React charting
- [VADER Sentiment](https://github.com/cjhutto/vaderSentiment) for sentiment analysis
