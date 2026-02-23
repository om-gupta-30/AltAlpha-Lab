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
import { useCurrency } from '../context/CurrencyContext'

// Custom tooltip component
function PortfolioTooltip({ active, payload, label, initialCapital = 10000, formatCurrency }) {
  if (active && payload && payload.length) {
    const value = payload[0]?.value
    const pnl = value - initialCapital
    const pnlPct = ((value - initialCapital) / initialCapital) * 100
    const isProfitable = pnl >= 0

    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
        <p className="text-gray-400 text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-white font-bold text-xl">
            {formatCurrency(value)}
          </p>
          <div className={`text-sm ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
            <span>{isProfitable ? '+' : ''}{formatCurrency(pnl)}</span>
            <span className="ml-2">({isProfitable ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

/**
 * PortfolioChart - Professional equity curve visualization
 * @param {Array} data - Array of objects with { date, portfolio_value }
 * @param {string} title - Optional chart title
 * @param {number} initialCapital - Starting capital for reference line
 */
function PortfolioChart({ data, title = 'Portfolio Value', initialCapital = 10000 }) {
  const { format: formatCurrency, getCurrencyInfo } = useCurrency()
  const currencyInfo = getCurrencyInfo()

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-gray-500">
          No portfolio data available
        </div>
      </div>
    )
  }

  // Sample data for performance
  const sampleRate = Math.max(1, Math.floor(data.length / 250))
  const chartData = data.filter((_, i) => i % sampleRate === 0)

  // Calculate stats
  const finalValue = chartData[chartData.length - 1]?.portfolio_value || initialCapital
  const minValue = Math.min(...chartData.map((d) => d.portfolio_value))
  const maxValue = Math.max(...chartData.map((d) => d.portfolio_value))
  const isProfit = finalValue >= initialCapital

  // Dynamic color based on profit/loss
  const primaryColor = isProfit ? '#10b981' : '#ef4444'
  const gradientId = isProfit ? 'profitGradient' : 'lossGradient'

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-right">
          <p className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(finalValue)}
          </p>
          <p className={`text-sm ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
            {isProfit ? '▲' : '▼'} {((finalValue - initialCapital) / initialCapital * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="lossGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15} />
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
              tickFormatter={(value) => formatCurrency(value, { compact: true, decimals: 0 })}
              domain={[minValue * 0.95, maxValue * 1.05]}
              tickMargin={10}
            />
            <Tooltip content={<PortfolioTooltip initialCapital={initialCapital} formatCurrency={formatCurrency} />} />
            {/* Initial capital reference line */}
            <ReferenceLine
              y={initialCapital}
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="6 4"
              label={{
                value: 'Initial',
                position: 'right',
                fill: '#6b7280',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="portfolio_value"
              stroke={primaryColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 6,
                fill: primaryColor,
                stroke: '#1f2937',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide">High</p>
          <p className="text-green-400 font-semibold">
            {formatCurrency(maxValue, { decimals: 0 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Low</p>
          <p className="text-red-400 font-semibold">
            {formatCurrency(minValue, { decimals: 0 })}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Start</p>
          <p className="text-gray-300 font-semibold">
            {formatCurrency(initialCapital, { decimals: 0 })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default PortfolioChart
