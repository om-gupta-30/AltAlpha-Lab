import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import MainLayout from './layout/MainLayout'
import StrategyControlPanel from './controls/StrategyControlPanel'
import GlassCard from './ui/GlassCard'
import { useCurrency } from '../context/CurrencyContext'

// Lazy load heavy views for better performance
const DashboardView = lazy(() => import('./views/DashboardView'))
const AssetComparisonView = lazy(() => import('./views/AssetComparisonView'))
const MLPredictionsView = lazy(() => import('./views/MLPredictionsView'))
const OptimizationLabView = lazy(() => import('./views/OptimizationLabView'))
const LiveSimulationView = lazy(() => import('./views/LiveSimulationView'))
const AIInsightsView = lazy(() => import('./views/AIInsightsView'))

// Helper to check if Indian market is open
function isIndianMarketOpen() {
  const now = new Date()
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const day = istTime.getDay()
  const currentMinutes = hours * 60 + minutes
  const marketOpen = 9 * 60 + 15  // 9:15 AM
  const marketClose = 15 * 60 + 30 // 3:30 PM
  
  const isWeekday = day >= 1 && day <= 5
  const isDuringHours = currentMinutes >= marketOpen && currentMinutes < marketClose
  return isWeekday && isDuringHours
}

// Loading fallback component
function ViewLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-800 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  )
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AUTO_REFRESH_MINUTES = 5 // Refresh every 5 minutes during market hours

const DEFAULT_PARAMS = {
  sentimentThreshold: 0.2,
  volatilityFilter: 50,
  transactionCost: 10,
  initialCapital: 10000,
}

function Dashboard() {
  const [ticker, setTicker] = useState('AAPL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [results, setResults] = useState({
    backtest: null,
    metrics: null,
    features: null,
    strategy: null,
  })
  const [params, setParams] = useState(DEFAULT_PARAMS)
  const [stockConfirmed, setStockConfirmed] = useState(false) // Must confirm stock & currency before running
  const [resetKey, setResetKey] = useState(0) // Used to force re-mount components on reset
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [nextRefresh, setNextRefresh] = useState(null)
  const autoRefreshInterval = useRef(null)
  
  // Currency conversion for backend calls
  const { convertToUSD } = useCurrency()

  const runAnalysis = useCallback(async (customParams = params) => {
    if (!ticker.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Convert initial capital from selected currency to USD for backend
      const initialCapitalUSD = convertToUSD(customParams.initialCapital)
      
      // Build query params with all strategy parameters
      const strategyParams = new URLSearchParams({
        ticker,
        initial_capital: initialCapitalUSD,
        transaction_cost: customParams.transactionCost / 10000, // Convert basis points to fraction
        sentiment_threshold: customParams.sentimentThreshold,
        volatility_percentile: customParams.volatilityFilter,
      })

      const [backtestRes, metricsRes, featuresRes, strategyRes] = await Promise.all([
        fetch(`${API_BASE}/backtest?${strategyParams}`),
        fetch(`${API_BASE}/metrics?${strategyParams}`),
        fetch(`${API_BASE}/features?ticker=${ticker}`),
        fetch(`${API_BASE}/strategy?${strategyParams}`),
      ])

      if (!backtestRes.ok || !metricsRes.ok || !featuresRes.ok || !strategyRes.ok) {
        throw new Error('Failed to fetch data. Please check the ticker symbol.')
      }

      const [backtest, metrics, features, strategy] = await Promise.all([
        backtestRes.json(),
        metricsRes.json(),
        featuresRes.json(),
        strategyRes.json(),
      ])

      setResults({ backtest, metrics, features, strategy })
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.message)
      setResults({ backtest: null, metrics: null, features: null, strategy: null })
    } finally {
      setLoading(false)
    }
  }, [ticker, params, convertToUSD])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && stockConfirmed && results.backtest) {
      // Clear any existing interval
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current)
      }

      // Calculate next refresh time
      const updateNextRefresh = () => {
        const next = new Date(Date.now() + AUTO_REFRESH_MINUTES * 60 * 1000)
        setNextRefresh(next)
      }
      updateNextRefresh()

      // Set up auto-refresh
      autoRefreshInterval.current = setInterval(() => {
        if (isIndianMarketOpen()) {
          runAnalysis(params)
        }
        updateNextRefresh()
      }, AUTO_REFRESH_MINUTES * 60 * 1000)

      return () => {
        if (autoRefreshInterval.current) {
          clearInterval(autoRefreshInterval.current)
        }
      }
    } else {
      // Clear interval when auto-refresh is disabled
      if (autoRefreshInterval.current) {
        clearInterval(autoRefreshInterval.current)
        autoRefreshInterval.current = null
      }
      setNextRefresh(null)
    }
  }, [autoRefresh, stockConfirmed, results.backtest, params, runAnalysis])

  // Destructure results early so callbacks can reference them
  const { backtest, metrics, features, strategy } = results

  // Reset everything and go home
  const handleReset = useCallback(() => {
    setTicker('AAPL')
    setParams(DEFAULT_PARAMS)
    setResults({ backtest: null, metrics: null, features: null, strategy: null })
    setError(null)
    setStockConfirmed(false)
    setActiveView('dashboard')
    setResetKey(k => k + 1) // Force re-mount of components to reset their local state
  }, [])

  // Render the appropriate view with lazy loading
  const renderView = () => {
    switch (activeView) {
      case 'comparison':
        return (
          <Suspense fallback={<ViewLoader />}>
            <AssetComparisonView />
          </Suspense>
        )
      
      case 'ml-predictions':
        return (
          <Suspense fallback={<ViewLoader />}>
            <MLPredictionsView ticker={ticker} />
          </Suspense>
        )
      
      case 'optimization':
        return (
          <Suspense fallback={<ViewLoader />}>
            <OptimizationLabView ticker={ticker} />
          </Suspense>
        )
      
      case 'live-sim':
        return (
          <Suspense fallback={<ViewLoader />}>
            <LiveSimulationView ticker={ticker} />
          </Suspense>
        )
      
      case 'ai-insights':
        return (
          <Suspense fallback={<ViewLoader />}>
            <AIInsightsView ticker={ticker} />
          </Suspense>
        )
      
      case 'dashboard':
      default:
        return (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                <p className="text-red-400">{error}</p>
                <button
                  onClick={() => runAnalysis(params)}
                  className="mt-2 px-4 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-300 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Control Panel - Left Side */}
              <div className="xl:col-span-1">
                <div className="sticky top-24">
                  <StrategyControlPanel
                    key={resetKey}
                    params={params}
                    setParams={setParams}
                    onConfirm={runAnalysis}
                    loading={loading}
                    ticker={ticker}
                    stockConfirmed={stockConfirmed}
                  />

                  {/* Quick Stats */}
                  {metrics && (
                    <GlassCard className="p-4 mt-4" glow>
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Quick Stats</h4>
                      <div className="space-y-2">
                        <QuickStat label="Ticker" value={metrics.ticker} />
                        <QuickStat label="Data Points" value={metrics.trading_days?.toLocaleString()} />
                        <QuickStat 
                          label="Return" 
                          value={`${metrics.total_return >= 0 ? '+' : ''}${metrics.total_return}%`}
                          positive={metrics.total_return >= 0}
                        />
                        <QuickStat 
                          label="Sharpe" 
                          value={metrics.sharpe_ratio?.toFixed(3)}
                          positive={metrics.sharpe_ratio >= 0}
                        />
                      </div>
                    </GlassCard>
                  )}

                  {/* Auto Refresh Panel */}
                  {stockConfirmed && results.backtest && (
                    <GlassCard className="p-4 mt-4" glow>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-400">Auto Refresh</h4>
                        <button
                          onClick={() => setAutoRefresh(!autoRefresh)}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                            autoRefresh ? 'bg-green-500' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${
                              autoRefresh ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {autoRefresh && (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-green-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>Refreshing every {AUTO_REFRESH_MINUTES} min</span>
                          </div>
                          {!isIndianMarketOpen() && (
                            <p className="text-yellow-400 text-[10px]">
                              ⚠️ Market closed - will refresh when market opens
                            </p>
                          )}
                        </div>
                      )}
                      
                      {lastRefresh && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Last refresh:</span>
                            <span className="text-gray-400 font-mono">
                              {lastRefresh.toLocaleTimeString(undefined, { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                          {autoRefresh && nextRefresh && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">Next refresh:</span>
                              <span className="text-cyan-400 font-mono">
                                {nextRefresh.toLocaleTimeString(undefined, { 
                                  hour: '2-digit', 
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Manual Refresh Button */}
                      <button
                        onClick={() => runAnalysis(params)}
                        disabled={loading}
                        className="w-full mt-3 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span className={loading ? 'animate-spin' : ''}>🔄</span>
                        {loading ? 'Refreshing...' : 'Refresh Now'}
                      </button>
                    </GlassCard>
                  )}
                </div>
              </div>

              {/* Main Content - Right Side */}
              <div className="xl:col-span-3">
                <Suspense fallback={<ViewLoader />}>
                  <DashboardView
                    backtest={backtest}
                    metrics={metrics}
                    features={features}
                    strategy={strategy}
                    loading={loading}
                    params={params}
                  />
                </Suspense>
              </div>
            </div>
          </>
        )
    }
  }

  return (
    <MainLayout
      ticker={ticker}
      setTicker={setTicker}
      loading={loading}
      activeView={activeView}
      setActiveView={setActiveView}
      onReset={handleReset}
      resetKey={resetKey}
      stockConfirmed={stockConfirmed}
      setStockConfirmed={setStockConfirmed}
    >
      {renderView()}
    </MainLayout>
  )
}

function QuickStat({ label, value, positive }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-mono font-medium ${
        positive === true ? 'text-green-400' : 
        positive === false ? 'text-red-400' : 
        'text-white'
      }`}>
        {value}
      </span>
    </div>
  )
}

export default Dashboard
