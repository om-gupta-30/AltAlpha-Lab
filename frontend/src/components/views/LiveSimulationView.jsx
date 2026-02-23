import { useState, useEffect, useRef, useMemo } from 'react'
import GlassCard from '../ui/GlassCard'
import { SpinnerGradient } from '../ui/Spinner'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Portfolio Value Chart
function PortfolioChart({ data, currentStep }) {
  if (!data || data.length === 0) return null

  const chartHeight = 200
  const chartWidth = 800
  const padding = { top: 20, right: 20, bottom: 30, left: 60 }

  const visibleData = data.slice(0, currentStep + 1)
  const values = visibleData.map(d => d.portfolio.total_value)
  const minVal = Math.min(...data.map(d => d.portfolio.total_value)) * 0.98
  const maxVal = Math.max(...data.map(d => d.portfolio.total_value)) * 1.02

  const points = visibleData.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + (1 - (d.portfolio.total_value - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1]?.x || 0} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`

  // Initial capital line
  const initialY = padding.top + (1 - (data[0]?.portfolio.total_value - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)

  const currentValue = visibleData[visibleData.length - 1]?.portfolio.total_value || 0
  const initialValue = data[0]?.portfolio.total_value || 0
  const isProfit = currentValue >= initialValue

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-56">
      <defs>
        <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
          <stop offset="100%" stopColor={isProfit ? "#22c55e" : "#ef4444"} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = padding.top + t * (chartHeight - padding.top - padding.bottom)
        const val = maxVal - t * (maxVal - minVal)
        return (
          <g key={t}>
            <line x1={padding.left} x2={chartWidth - padding.right} y1={y} y2={y} stroke="#374151" strokeDasharray="4,4" />
            <text x={padding.left - 10} y={y} textAnchor="end" alignmentBaseline="middle" fill="#6b7280" fontSize="10">
              ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </text>
          </g>
        )
      })}

      {/* Initial capital line */}
      <line
        x1={padding.left}
        x2={chartWidth - padding.right}
        y1={initialY}
        y2={initialY}
        stroke="#6b7280"
        strokeDasharray="6,4"
        opacity="0.5"
      />

      {/* Area fill */}
      <path d={areaPath} fill="url(#portfolioGradient)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={isProfit ? "#22c55e" : "#ef4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Current point */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill={isProfit ? "#22c55e" : "#ef4444"}
          className="animate-pulse"
        />
      )}

      {/* Future area (greyed out) */}
      <rect
        x={points[points.length - 1]?.x || padding.left}
        y={padding.top}
        width={chartWidth - padding.right - (points[points.length - 1]?.x || padding.left)}
        height={chartHeight - padding.top - padding.bottom}
        fill="#1f2937"
        opacity="0.5"
      />
    </svg>
  )
}

// Position Timeline Chart
function PositionTimeline({ data, currentStep }) {
  if (!data || data.length === 0) return null

  const chartHeight = 80
  const chartWidth = 800
  const padding = { top: 10, right: 20, bottom: 20, left: 60 }

  const visibleData = data.slice(0, currentStep + 1)

  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-20">
      {/* Background */}
      <rect x={padding.left} y={padding.top} width={chartWidth - padding.left - padding.right} height={chartHeight - padding.top - padding.bottom} fill="#1f2937" rx="4" />

      {/* Position bars */}
      {visibleData.map((d, i) => {
        const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right)
        const width = Math.max(2, (chartWidth - padding.left - padding.right) / data.length)
        const position = d.position.current

        let color = '#4b5563' // Flat
        if (position === 1) color = '#22c55e' // Long
        if (position === -1) color = '#ef4444' // Short

        return (
          <rect
            key={i}
            x={x - width / 2}
            y={padding.top}
            width={width}
            height={chartHeight - padding.top - padding.bottom}
            fill={color}
            opacity="0.8"
          />
        )
      })}

      {/* Labels */}
      <text x={padding.left - 10} y={chartHeight / 2} textAnchor="end" alignmentBaseline="middle" fill="#6b7280" fontSize="10">
        Position
      </text>

      {/* Legend */}
      <g transform={`translate(${chartWidth - 150}, ${chartHeight - 15})`}>
        <rect x="0" y="0" width="12" height="8" fill="#22c55e" rx="2" />
        <text x="16" y="7" fill="#6b7280" fontSize="9">Long</text>
        <rect x="50" y="0" width="12" height="8" fill="#ef4444" rx="2" />
        <text x="66" y="7" fill="#6b7280" fontSize="9">Short</text>
        <rect x="105" y="0" width="12" height="8" fill="#4b5563" rx="2" />
        <text x="121" y="7" fill="#6b7280" fontSize="9">Flat</text>
      </g>
    </svg>
  )
}

// Drawdown Indicator
function DrawdownIndicator({ currentDrawdown, maxDrawdown }) {
  const percentage = Math.min(currentDrawdown, 30) / 30 * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Current Drawdown</span>
        <span className={`font-mono font-semibold ${currentDrawdown > 10 ? 'text-red-400' : currentDrawdown > 5 ? 'text-yellow-400' : 'text-green-400'}`}>
          -{currentDrawdown.toFixed(2)}%
        </span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            currentDrawdown > 15 ? 'bg-red-500' : currentDrawdown > 10 ? 'bg-orange-500' : currentDrawdown > 5 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>0%</span>
        <span>Max: -{maxDrawdown.toFixed(1)}%</span>
        <span>30%</span>
      </div>
    </div>
  )
}

// Trade Log Table
function TradeLogTable({ trades, currentStep, allStates }) {
  if (!trades || trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No completed trades yet
      </div>
    )
  }

  // Filter trades up to current step
  const currentDate = allStates?.[currentStep]?.date
  const visibleTrades = trades.filter(t => t.exit_date <= currentDate)

  if (visibleTrades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No completed trades yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto max-h-64 overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-900">
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">#</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Type</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Entry</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Exit</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Entry $</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Exit $</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">P&L</th>
            <th className="text-right py-2 px-3 text-gray-400 font-medium">Days</th>
          </tr>
        </thead>
        <tbody>
          {visibleTrades.map((trade, index) => (
            <tr key={trade.trade_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
              <td className="py-2 px-3 text-gray-500">{trade.trade_id}</td>
              <td className="py-2 px-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  trade.type === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {trade.type}
                </span>
              </td>
              <td className="py-2 px-3 font-mono text-xs text-gray-300">{trade.entry_date}</td>
              <td className="py-2 px-3 font-mono text-xs text-gray-300">{trade.exit_date}</td>
              <td className="py-2 px-3 font-mono text-right text-gray-400">${trade.entry_price.toFixed(2)}</td>
              <td className="py-2 px-3 font-mono text-right text-gray-400">${trade.exit_price.toFixed(2)}</td>
              <td className={`py-2 px-3 font-mono text-right font-semibold ${
                trade.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {trade.profit_loss >= 0 ? '+' : ''}${trade.profit_loss.toFixed(2)}
              </td>
              <td className="py-2 px-3 font-mono text-right text-gray-500">{trade.holding_days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Live Stats Panel
function LiveStatsPanel({ state, initialCapital }) {
  if (!state) return null

  const { portfolio, position, risk, market_data } = state
  const pnl = portfolio.total_value - initialCapital
  const pnlPct = (pnl / initialCapital) * 100

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
        <div className="text-xs text-gray-500 mb-1">Portfolio Value</div>
        <div className={`text-xl font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          ${portfolio.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-xs ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
        <div className="text-xs text-gray-500 mb-1">Position</div>
        <div className={`text-xl font-bold ${
          position.current === 1 ? 'text-green-400' : position.current === -1 ? 'text-red-400' : 'text-gray-400'
        }`}>
          {position.type}
        </div>
        <div className="text-xs text-gray-500">
          {position.shares > 0 ? `${position.shares.toFixed(2)} shares` : 'No position'}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
        <div className="text-xs text-gray-500 mb-1">Daily P&L</div>
        <div className={`text-xl font-bold ${portfolio.daily_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {portfolio.daily_pnl >= 0 ? '+' : ''}${portfolio.daily_pnl.toFixed(2)}
        </div>
        <div className={`text-xs ${portfolio.daily_pnl_pct >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {portfolio.daily_pnl_pct >= 0 ? '+' : ''}{portfolio.daily_pnl_pct.toFixed(2)}%
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
        <div className="text-xs text-gray-500 mb-1">Market Price</div>
        <div className="text-xl font-bold text-white">
          ${market_data.close.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">
          {state.date}
        </div>
      </div>
    </div>
  )
}

// Playback Controls
function PlaybackControls({ currentStep, maxStep, setCurrentStep, isPlaying, setIsPlaying, speed, setSpeed }) {
  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max={maxStep}
          value={currentStep}
          onChange={(e) => setCurrentStep(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${(currentStep / maxStep) * 100}%, #374151 ${(currentStep / maxStep) * 100}%, #374151 100%)`
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isPlaying ? '⏸' : '▶️'}
          </button>

          {/* Step controls */}
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm"
            disabled={currentStep === 0}
          >
            ⏮
          </button>
          <button
            onClick={() => setCurrentStep(Math.min(maxStep, currentStep + 1))}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm"
            disabled={currentStep === maxStep}
          >
            ⏭
          </button>

          {/* Reset */}
          <button
            onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
            className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-sm"
          >
            ⏹
          </button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed:</span>
          {[1, 5, 10, 25].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                speed === s 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Progress indicator */}
        <div className="text-sm text-gray-400 font-mono">
          Day {currentStep + 1} / {maxStep + 1}
        </div>
      </div>
    </div>
  )
}

function LiveSimulationView({ ticker }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(5)
  const intervalRef = useRef(null)

  // Fetch simulation data
  useEffect(() => {
    if (!ticker) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE}/live-sim?ticker=${ticker}`)
        if (!response.ok) throw new Error('Failed to fetch simulation data')
        const result = await response.json()
        setData(result)
        setCurrentStep(0)
        setIsPlaying(false)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [ticker])

  // Playback timer
  useEffect(() => {
    if (isPlaying && data) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= data.simulation_states.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1000 / speed)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, speed, data])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <SpinnerGradient size="w-16 h-16" />
        <p className="mt-4 text-gray-400">Running live simulation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-4xl mb-6">
          ⏱️
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Live Simulation</h2>
        <p className="text-gray-500 text-center max-w-md text-sm">
          Run analysis on a stock to simulate live trading.
        </p>
      </div>
    )
  }

  const { simulation_states, completed_trades, summary, initial_capital } = data
  const currentState = simulation_states[currentStep]
  const maxStep = simulation_states.length - 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">⏱️</span>
            Live Trading Simulation
          </h1>
          <p className="text-gray-500 mt-1">
            Day-by-day strategy execution simulation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            isPlaying ? 'bg-green-500/20 border border-green-500/30 text-green-400 animate-pulse' : 'bg-gray-500/20 border border-gray-500/30 text-gray-400'
          }`}>
            {isPlaying ? '● LIVE' : '○ PAUSED'}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            {ticker}
          </span>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="text-center">
        <div className="inline-block px-6 py-3 rounded-2xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-xs text-gray-500 mb-1">Simulation Date</div>
          <div className="text-2xl font-bold font-mono text-white">{currentState?.date}</div>
        </div>
      </div>

      {/* Live Stats */}
      <LiveStatsPanel state={currentState} initialCapital={initial_capital} />

      {/* Playback Controls */}
      <GlassCard className="p-6" glow>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Simulation Playback
        </h3>
        <PlaybackControls
          currentStep={currentStep}
          maxStep={maxStep}
          setCurrentStep={setCurrentStep}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
        />
      </GlassCard>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Portfolio Value Over Time
            </h3>
            <PortfolioChart data={simulation_states} currentStep={currentStep} />
          </GlassCard>
        </div>

        {/* Drawdown Indicator */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 h-full" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Drawdown Monitor
            </h3>
            <DrawdownIndicator
              currentDrawdown={currentState?.risk.current_drawdown_pct || 0}
              maxDrawdown={summary.max_drawdown_pct}
            />

            {/* Additional Stats */}
            <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Peak Value</span>
                <span className="font-mono text-white">${currentState?.risk.peak_value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unrealized P&L</span>
                <span className={`font-mono ${currentState?.position.unrealized_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {currentState?.position.unrealized_pnl >= 0 ? '+' : ''}${currentState?.position.unrealized_pnl?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cash</span>
                <span className="font-mono text-gray-300">${currentState?.portfolio.cash.toLocaleString()}</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Position Timeline */}
      <GlassCard className="p-6" glow>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Position Exposure Timeline
        </h3>
        <PositionTimeline data={simulation_states} currentStep={currentStep} />
      </GlassCard>

      {/* Trade Log */}
      <GlassCard className="p-6" glow>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Completed Trades
          </h3>
          <span className="text-xs text-gray-600">
            {completed_trades?.filter(t => t.exit_date <= currentState?.date).length || 0} of {summary.total_trades} trades
          </span>
        </div>
        <TradeLogTable trades={completed_trades} currentStep={currentStep} allStates={simulation_states} />
      </GlassCard>

      {/* Summary Stats */}
      <GlassCard className="p-6" glow>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Simulation Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500">Total Trades</div>
            <div className="text-xl font-bold text-white">{summary.total_trades}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500">Win Rate</div>
            <div className={`text-xl font-bold ${summary.win_rate_pct >= 50 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.win_rate_pct}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500">Profit Factor</div>
            <div className={`text-xl font-bold ${summary.profit_factor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.profit_factor === 'inf' ? '∞' : summary.profit_factor}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-xs text-gray-500">Best Trade</div>
            <div className="text-xl font-bold text-green-400">+${summary.best_trade}</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-xs text-gray-500">Worst Trade</div>
            <div className="text-xl font-bold text-red-400">${summary.worst_trade}</div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export default LiveSimulationView
