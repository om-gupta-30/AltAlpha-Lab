import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { TICKER_COLORS } from './TickerSelector'

// Custom tooltip
function VolatilityTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-mono font-bold text-white">{data.ticker}</span>
        </div>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Volatility</span>
            <span className="text-yellow-400 font-mono font-bold">{data.volatility.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Daily Avg</span>
            <span className="text-gray-300 font-mono">{(data.volatility / Math.sqrt(252)).toFixed(3)}%</span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className={`text-xs ${
            data.volatility < 15 ? 'text-green-400' :
            data.volatility < 25 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {data.volatility < 15 ? '🟢 Low Risk' :
             data.volatility < 25 ? '🟡 Medium Risk' :
             '🔴 High Risk'}
          </div>
        </div>
      </div>
    )
  }
  return null
}

function VolatilityBars({ data, tickers, title = 'Volatility Comparison' }) {
  // Calculate volatility for each ticker
  const volatilityData = useMemo(() => {
    if (!data || tickers.length === 0) return []
    
    return tickers.map((ticker, index) => {
      if (!data[ticker]?.data) {
        return { ticker, volatility: 0, color: TICKER_COLORS[index] }
      }
      
      const returns = data[ticker].data.map(d => d.returns || 0)
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length
      const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length
      const dailyVol = Math.sqrt(variance)
      const annualizedVol = dailyVol * Math.sqrt(252) * 100
      
      return {
        ticker,
        volatility: Math.round(annualizedVol * 100) / 100,
        color: TICKER_COLORS[index],
      }
    }).sort((a, b) => b.volatility - a.volatility)
  }, [data, tickers])

  // Stats
  const stats = useMemo(() => {
    if (!volatilityData.length) return null
    
    const vols = volatilityData.map(d => d.volatility)
    return {
      avg: vols.reduce((a, b) => a + b, 0) / vols.length,
      min: Math.min(...vols),
      max: Math.max(...vols),
      minTicker: volatilityData[volatilityData.length - 1]?.ticker,
      maxTicker: volatilityData[0]?.ticker,
    }
  }, [volatilityData])

  if (!data || tickers.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {stats && (
          <span className="text-xs text-gray-500">
            Avg: <span className="text-yellow-400 font-mono">{stats.avg.toFixed(1)}%</span>
          </span>
        )}
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={volatilityData}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            
            <XAxis
              type="number"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${value}%`}
            />
            
            <YAxis
              type="category"
              dataKey="ticker"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              width={50}
            />
            
            <Tooltip content={<VolatilityTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            
            <Bar
              dataKey="volatility"
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            >
              {volatilityData.map((entry, index) => (
                <Cell
                  key={entry.ticker}
                  fill={entry.color}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Lowest Risk</p>
            <p className="text-sm font-mono font-medium text-green-400">
              {stats.minTicker} ({stats.min.toFixed(1)}%)
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Average</p>
            <p className="text-sm font-mono font-medium text-yellow-400">
              {stats.avg.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Highest Risk</p>
            <p className="text-sm font-mono font-medium text-red-400">
              {stats.maxTicker} ({stats.max.toFixed(1)}%)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default VolatilityBars
