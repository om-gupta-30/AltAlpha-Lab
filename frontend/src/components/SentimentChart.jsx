import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'

// Custom tooltip component (defined outside to prevent re-creation on render)
function SentimentTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const sentiment = payload[0]?.payload?.sentiment
    const isPositive = sentiment >= 0
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-gray-400 text-sm">{label}</p>
        <p className={`font-semibold text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {sentiment?.toFixed(4)}
        </p>
        <p className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? 'Bullish' : 'Bearish'}
        </p>
      </div>
    )
  }
  return null
}

/**
 * SentimentChart - Displays sentiment over time with color coding
 * Green for positive, Red for negative
 * @param {Array} data - Array of objects with { date, sentiment }
 * @param {string} title - Optional chart title
 */
function SentimentChart({ data, title = 'Sentiment Analysis' }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-gray-500">
          No sentiment data available
        </div>
      </div>
    )
  }

  // Sample data for performance
  const sampleRate = Math.max(1, Math.floor(data.length / 250))
  const chartData = data
    .filter((_, i) => i % sampleRate === 0)
    .map((item) => ({
      ...item,
      positive: item.sentiment >= 0 ? item.sentiment : null,
      negative: item.sentiment < 0 ? item.sentiment : null,
    }))

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
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
              tick={{ fill: '#9ca3af', fontSize: 11 }}
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
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              domain={[-1, 1]}
              ticks={[-1, -0.5, 0, 0.5, 1]}
              tickMargin={10}
            />
            <Tooltip content={<SentimentTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            {/* Positive sentiment area */}
            <Area
              type="monotone"
              dataKey="positive"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#positiveGradient)"
              connectNulls={false}
            />
            {/* Negative sentiment area */}
            <Area
              type="monotone"
              dataKey="negative"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#negativeGradient)"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="text-xs text-gray-400">Bullish</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="text-xs text-gray-400">Bearish</span>
        </div>
      </div>
    </div>
  )
}

export default SentimentChart
