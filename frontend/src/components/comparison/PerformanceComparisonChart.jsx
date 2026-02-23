import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts'
import { TICKER_COLORS } from './TickerSelector'

// Custom tooltip
function ComparisonTooltip({ active, payload, label, tickers }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl">
        <p className="text-gray-400 text-xs mb-3 pb-2 border-b border-gray-700">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-400 text-sm">{entry.dataKey}</span>
              </div>
              <span
                className="font-bold font-mono"
                style={{ color: entry.value >= 0 ? '#22c55e' : '#ef4444' }}
              >
                {entry.value >= 0 ? '+' : ''}{entry.value?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

function PerformanceComparisonChart({ data, tickers, title = 'Performance Comparison' }) {
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data || Object.keys(data).length === 0) return []
    
    // Get all dates from first ticker
    const firstTicker = Object.keys(data)[0]
    if (!data[firstTicker]?.data) return []
    
    const dates = data[firstTicker].data.map(d => d.date)
    
    // Sample for performance
    const sampleRate = Math.max(1, Math.floor(dates.length / 200))
    
    return dates
      .filter((_, i) => i % sampleRate === 0)
      .map((date, idx) => {
        const point = { date }
        
        tickers.forEach(ticker => {
          if (data[ticker]?.data) {
            // Find the data point for this date
            const tickerData = data[ticker].data
            const actualIdx = idx * sampleRate
            if (actualIdx < tickerData.length) {
              // Calculate cumulative return
              const returns = tickerData.slice(0, actualIdx + 1).map(d => d.returns || 0)
              let cumReturn = 0
              returns.forEach(r => {
                cumReturn = (1 + cumReturn / 100) * (1 + r) * 100 - 100
              })
              point[ticker] = Math.round(cumReturn * 100) / 100
            }
          }
        })
        
        return point
      })
  }, [data, tickers])

  // Get final returns for legend
  const finalReturns = useMemo(() => {
    if (!chartData.length) return {}
    const last = chartData[chartData.length - 1]
    const returns = {}
    tickers.forEach(t => {
      returns[t] = last[t] || 0
    })
    return returns
  }, [chartData, tickers])

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            
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
            />
            
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => `${value}%`}
            />
            
            <Tooltip content={<ComparisonTooltip tickers={tickers} />} />
            
            <ReferenceLine y={0} stroke="#4b5563" strokeDasharray="4 4" />
            
            {tickers.map((ticker, index) => (
              <Line
                key={ticker}
                type="monotone"
                dataKey={ticker}
                stroke={TICKER_COLORS[index]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: TICKER_COLORS[index], stroke: '#1f2937', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {tickers.map((ticker, index) => (
          <div key={ticker} className="flex items-center gap-2">
            <div
              className="w-8 h-0.5 rounded"
              style={{ backgroundColor: TICKER_COLORS[index] }}
            />
            <span className="text-xs text-gray-400">{ticker}</span>
            <span
              className="text-xs font-mono font-medium"
              style={{ color: finalReturns[ticker] >= 0 ? '#22c55e' : '#ef4444' }}
            >
              {finalReturns[ticker] >= 0 ? '+' : ''}{finalReturns[ticker]?.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PerformanceComparisonChart
