import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

// Custom tooltip
function DrawdownTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const drawdown = data?.drawdown || 0
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500 text-sm">Drawdown</span>
            <span className={`font-bold text-lg ${
              drawdown < -10 ? 'text-red-400' : 
              drawdown < -5 ? 'text-orange-400' : 
              'text-yellow-400'
            }`}>
              {drawdown.toFixed(2)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500 text-sm">Peak</span>
            <span className="text-green-400 font-mono text-sm">
              ${data?.peak?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-500 text-sm">Current</span>
            <span className="text-white font-mono text-sm">
              ${data?.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Severity indicator */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              drawdown < -15 ? 'bg-red-500' : 
              drawdown < -10 ? 'bg-orange-500' : 
              drawdown < -5 ? 'bg-yellow-500' : 
              'bg-green-500'
            }`} />
            <span className="text-xs text-gray-400">
              {drawdown < -15 ? 'Severe Drawdown' : 
               drawdown < -10 ? 'Significant Drawdown' : 
               drawdown < -5 ? 'Moderate Drawdown' : 
               'Minor Drawdown'}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

/**
 * DrawdownChart - Displays portfolio drawdown over time
 * @param {Array} data - Array of objects with { date, portfolio_value }
 * @param {string} title - Optional chart title
 */
function DrawdownChart({ data, title = 'Portfolio Drawdown' }) {
  // Compute drawdown data
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const sampleRate = Math.max(1, Math.floor(data.length / 300))
    const sampled = data.filter((_, i) => i % sampleRate === 0)
    
    let peak = sampled[0]?.portfolio_value || 0
    
    return sampled.map((item) => {
      const value = item.portfolio_value
      if (value > peak) peak = value
      
      const drawdown = ((value - peak) / peak) * 100
      
      return {
        date: item.date,
        drawdown: Math.round(drawdown * 100) / 100,
        value,
        peak,
      }
    })
  }, [data])

  // Calculate stats
  const stats = useMemo(() => {
    if (!chartData.length) return null
    
    const drawdowns = chartData.map(d => d.drawdown)
    const maxDrawdown = Math.min(...drawdowns)
    const avgDrawdown = drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
    const currentDrawdown = drawdowns[drawdowns.length - 1]
    
    // Calculate time underwater (% of time in drawdown)
    const underwaterPeriods = drawdowns.filter(d => d < -1).length
    const underwaterPct = (underwaterPeriods / drawdowns.length) * 100
    
    return {
      maxDrawdown,
      avgDrawdown,
      currentDrawdown,
      underwaterPct,
    }
  }, [chartData])

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No drawdown data available
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
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              stats.currentDrawdown < -10 ? 'bg-red-500/20 text-red-400' :
              stats.currentDrawdown < -5 ? 'bg-orange-500/20 text-orange-400' :
              stats.currentDrawdown < 0 ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              {stats.currentDrawdown.toFixed(1)}%
            </span>
          )}
        </div>
        {stats && (
          <div className="text-xs text-gray-500">
            Max: <span className="text-red-400 font-mono">{stats.maxDrawdown.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
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
              tickFormatter={(value) => `${value}%`}
              domain={['auto', 0]}
              tickMargin={10}
            />
            
            <Tooltip content={<DrawdownTooltip />} />
            
            {/* Zero reference line */}
            <ReferenceLine
              y={0}
              stroke="#4b5563"
              strokeWidth={2}
            />
            
            {/* Max drawdown reference line */}
            {stats && (
              <ReferenceLine
                y={stats.maxDrawdown}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeOpacity={0.5}
              />
            )}
            
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#drawdownGradient)"
              dot={false}
              activeDot={{
                r: 5,
                fill: '#ef4444',
                stroke: '#1f2937',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Max Drawdown</p>
            <p className="text-sm font-bold text-red-400">{stats.maxDrawdown.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Avg Drawdown</p>
            <p className="text-sm font-bold text-orange-400">{stats.avgDrawdown.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Current</p>
            <p className={`text-sm font-bold ${
              stats.currentDrawdown < -5 ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {stats.currentDrawdown.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Time Underwater</p>
            <p className="text-sm font-bold text-gray-300">{stats.underwaterPct.toFixed(0)}%</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DrawdownChart
