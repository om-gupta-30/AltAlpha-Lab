import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// Custom tooltip
function SharpeTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const sharpe = data?.sharpe
    
    if (sharpe === null || sharpe === undefined) return null
    
    const isGood = sharpe >= 1
    const isOk = sharpe >= 0 && sharpe < 1
    const isBad = sharpe < 0
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl min-w-[180px]">
        <p className="text-gray-400 text-xs mb-3">{label}</p>
        
        {/* Sharpe Value */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-sm">Sharpe Ratio</span>
          <span className={`font-bold text-xl font-mono ${
            isGood ? 'text-green-400' : isOk ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {sharpe.toFixed(3)}
          </span>
        </div>
        
        {/* Rating */}
        <div className={`px-3 py-2 rounded-lg ${
          isGood ? 'bg-green-500/20 border border-green-500/30' :
          isOk ? 'bg-yellow-500/20 border border-yellow-500/30' :
          'bg-red-500/20 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {isGood ? '🟢' : isOk ? '🟡' : '🔴'}
            </span>
            <div>
              <p className={`text-sm font-medium ${
                isGood ? 'text-green-400' : isOk ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {isGood ? 'Excellent' : isOk ? 'Acceptable' : 'Poor'}
              </p>
              <p className="text-xs text-gray-400">
                {isGood ? 'Strong risk-adjusted returns' : 
                 isOk ? 'Positive but modest returns' : 
                 'Negative risk-adjusted returns'}
              </p>
            </div>
          </div>
        </div>

        {/* Period Info */}
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
          Rolling 30-day window
        </div>
      </div>
    )
  }
  return null
}

/**
 * RollingSharpeChart - Rolling 30-day Sharpe ratio over time
 * @param {Array} data - Array with strategy_returns
 * @param {string} title - Chart title
 * @param {number} window - Rolling window size (default 30)
 */
function RollingSharpeChart({ data, title = 'Rolling Risk-Adjusted Performance', window = 30 }) {
  // Calculate rolling Sharpe
  const chartData = useMemo(() => {
    if (!data || data.length < window) return []
    
    const result = []
    
    for (let i = window - 1; i < data.length; i++) {
      const windowData = data.slice(i - window + 1, i + 1)
      const returns = windowData.map(d => d.strategy_returns || 0)
      
      // Calculate mean return
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length
      
      // Calculate standard deviation
      const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length
      const stdDev = Math.sqrt(variance)
      
      // Annualized Sharpe (assuming 252 trading days)
      const annualizedMean = mean * 252
      const annualizedStdDev = stdDev * Math.sqrt(252)
      const sharpe = annualizedStdDev > 0 ? annualizedMean / annualizedStdDev : 0
      
      result.push({
        date: data[i].date,
        sharpe: Math.round(sharpe * 1000) / 1000,
        positive: sharpe >= 0 ? sharpe : null,
        negative: sharpe < 0 ? sharpe : null,
      })
    }
    
    // Sample for performance
    const sampleRate = Math.max(1, Math.floor(result.length / 300))
    return result.filter((_, i) => i % sampleRate === 0)
  }, [data, window])

  // Calculate stats
  const stats = useMemo(() => {
    if (!chartData.length) return null
    
    const sharpes = chartData.map(d => d.sharpe)
    const current = sharpes[sharpes.length - 1]
    const avg = sharpes.reduce((a, b) => a + b, 0) / sharpes.length
    const max = Math.max(...sharpes)
    const min = Math.min(...sharpes)
    
    // Time with positive Sharpe
    const positiveCount = sharpes.filter(s => s >= 0).length
    const positivePct = (positiveCount / sharpes.length) * 100
    
    // Time with good Sharpe (> 1)
    const goodCount = sharpes.filter(s => s >= 1).length
    const goodPct = (goodCount / sharpes.length) * 100
    
    return { current, avg, max, min, positivePct, goodPct }
  }, [chartData])

  if (!data || data.length < window) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Insufficient data (need {window}+ days)
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {stats && (
            <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${
              stats.current >= 1 ? 'bg-green-500/20 text-green-400' :
              stats.current >= 0 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {stats.current.toFixed(2)}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {window}-day rolling window
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="sharpePositiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sharpeNegativeGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
            
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
              }}
              tickMargin={10}
            />
            
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              domain={['auto', 'auto']}
              tickMargin={10}
            />
            
            <Tooltip content={<SharpeTooltip />} />
            
            {/* Zero reference line */}
            <ReferenceLine
              y={0}
              stroke="#6b7280"
              strokeWidth={2}
            />
            
            {/* Good Sharpe reference (1.0) */}
            <ReferenceLine
              y={1}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
            />
            
            {/* Positive area (green) */}
            <Area
              type="monotone"
              dataKey="positive"
              stroke="transparent"
              fill="url(#sharpePositiveGradient)"
              connectNulls={false}
            />
            
            {/* Negative area (red) */}
            <Area
              type="monotone"
              dataKey="negative"
              stroke="transparent"
              fill="url(#sharpeNegativeGradient)"
              connectNulls={false}
            />
            
            {/* Main Sharpe line */}
            <Line
              type="monotone"
              dataKey="sharpe"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#a855f7',
                stroke: '#1f2937',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="text-gray-400">Positive (≥0)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <span className="text-gray-400">Negative (&lt;0)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-green-500/50" />
          <span className="text-gray-400">Excellent (≥1)</span>
        </div>
      </div>

      {/* Footer Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className={`text-sm font-bold font-mono ${
              stats.current >= 1 ? 'text-green-400' :
              stats.current >= 0 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {stats.current.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Average</p>
            <p className={`text-sm font-bold font-mono ${
              stats.avg >= 0 ? 'text-purple-400' : 'text-red-400'
            }`}>
              {stats.avg.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Best</p>
            <p className="text-sm font-bold font-mono text-green-400">
              {stats.max.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Worst</p>
            <p className="text-sm font-bold font-mono text-red-400">
              {stats.min.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">% Positive</p>
            <p className="text-sm font-bold font-mono text-cyan-400">
              {stats.positivePct.toFixed(0)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RollingSharpeChart
