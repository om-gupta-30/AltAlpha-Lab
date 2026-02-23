import { useMemo } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Area,
} from 'recharts'

// Custom tooltip component
function PriceTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const hasSignal = data?.signal
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl min-w-[180px]">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-sm">Price</span>
          <span className="text-white font-bold text-lg">${data?.close?.toFixed(2)}</span>
        </div>
        
        {/* Signal Badge */}
        {hasSignal && (
          <div className={`mt-3 pt-3 border-t border-gray-700`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              data.signal === 'BUY' 
                ? 'bg-green-500/20 border border-green-500/30' 
                : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <span className="text-lg">{data.signal === 'BUY' ? '🟢' : '🔴'}</span>
              <div>
                <p className={`text-sm font-bold ${data.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                  {data.signal} SIGNAL
                </p>
                <p className="text-xs text-gray-400">
                  {data.signal === 'BUY' ? 'Enter Long Position' : data.signal === 'SELL' ? 'Enter Short Position' : 'Close Position'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Position Info */}
        {data?.position !== undefined && (
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-gray-500">Position</span>
            <span className={`font-mono font-medium ${
              data.position === 1 ? 'text-green-400' : 
              data.position === -1 ? 'text-red-400' : 
              'text-gray-400'
            }`}>
              {data.position === 1 ? 'LONG' : data.position === -1 ? 'SHORT' : 'FLAT'}
            </span>
          </div>
        )}
      </div>
    )
  }
  return null
}

// Custom marker component for signals
function SignalMarker({ cx, cy, signal }) {
  if (!signal) return null
  
  const isBuy = signal === 'BUY'
  
  return (
    <g>
      {/* Glow effect */}
      <circle
        cx={cx}
        cy={cy}
        r={12}
        fill={isBuy ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
      />
      {/* Arrow */}
      <path
        d={isBuy 
          ? `M ${cx} ${cy + 6} L ${cx - 5} ${cy - 2} L ${cx - 2} ${cy - 2} L ${cx - 2} ${cy - 8} L ${cx + 2} ${cy - 8} L ${cx + 2} ${cy - 2} L ${cx + 5} ${cy - 2} Z`
          : `M ${cx} ${cy - 6} L ${cx - 5} ${cy + 2} L ${cx - 2} ${cy + 2} L ${cx - 2} ${cy + 8} L ${cx + 2} ${cy + 8} L ${cx + 2} ${cy + 2} L ${cx + 5} ${cy + 2} Z`
        }
        fill={isBuy ? '#22c55e' : '#ef4444'}
        stroke={isBuy ? '#16a34a' : '#dc2626'}
        strokeWidth={1}
      />
    </g>
  )
}

/**
 * PriceChart - Professional trading chart with buy/sell signals
 * @param {Array} data - Array of objects with { date, close }
 * @param {Array} strategyData - Array with position data for signals
 * @param {string} title - Optional chart title
 */
function PriceChart({ data, strategyData, title = 'Price Chart' }) {
  // Process data to add signals
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const sampleRate = Math.max(1, Math.floor(data.length / 300))
    const sampled = data.filter((_, i) => i % sampleRate === 0)
    
    // If we have strategy data, merge it and detect signals
    if (strategyData && strategyData.length > 0) {
      const strategyMap = new Map(strategyData.map(d => [d.date, d]))
      
      return sampled.map((item, index, arr) => {
        const stratItem = strategyMap.get(item.date)
        const prevItem = index > 0 ? strategyMap.get(arr[index - 1]?.date) : null
        
        let signal = null
        if (stratItem && prevItem) {
          const posChange = stratItem.position - (prevItem?.position || 0)
          if (posChange > 0 && stratItem.position === 1) {
            signal = 'BUY'
          } else if (posChange < 0 && stratItem.position === -1) {
            signal = 'SELL'
          } else if (stratItem.position === 0 && prevItem?.position !== 0) {
            signal = 'CLOSE'
          }
        }
        
        return {
          ...item,
          position: stratItem?.position,
          signal,
        }
      })
    }
    
    return sampled
  }, [data, strategyData])

  // Get signal points for markers
  const signalPoints = useMemo(() => {
    return chartData.filter(d => d.signal === 'BUY' || d.signal === 'SELL')
  }, [chartData])

  // Stats
  const stats = useMemo(() => {
    if (!chartData.length) return null
    const prices = chartData.map(d => d.close).filter(Boolean)
    const buySignals = signalPoints.filter(d => d.signal === 'BUY').length
    const sellSignals = signalPoints.filter(d => d.signal === 'SELL').length
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
      buySignals,
      sellSignals,
    }
  }, [chartData, signalPoints])

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-gray-500">
          No price data available
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {stats && (
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-gray-400">Buy: {stats.buySignals}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-400">Sell: {stats.sellSignals}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
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
              tickFormatter={(value) => `$${value.toFixed(0)}`}
              domain={['auto', 'auto']}
              tickMargin={10}
            />
            
            <Tooltip content={<PriceTooltip />} />
            
            {/* Price area fill */}
            <Area
              type="monotone"
              dataKey="close"
              stroke="transparent"
              fill="url(#priceAreaGradient)"
            />
            
            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#3b82f6',
                stroke: '#1e3a5f',
                strokeWidth: 2,
              }}
            />
            
            {/* Buy Signal Markers */}
            {signalPoints.filter(d => d.signal === 'BUY').map((point, i) => (
              <ReferenceDot
                key={`buy-${i}`}
                x={point.date}
                y={point.close}
                r={0}
                shape={(props) => <SignalMarker {...props} signal="BUY" />}
              />
            ))}
            
            {/* Sell Signal Markers */}
            {signalPoints.filter(d => d.signal === 'SELL').map((point, i) => (
              <ReferenceDot
                key={`sell-${i}`}
                x={point.date}
                y={point.close}
                r={0}
                shape={(props) => <SignalMarker {...props} signal="SELL" />}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      {stats && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700/50 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-500">High: </span>
              <span className="text-green-400 font-mono">${stats.high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Low: </span>
              <span className="text-red-400 font-mono">${stats.low.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-gray-500">
            {signalPoints.length} total signals
          </div>
        </div>
      )}
    </div>
  )
}

export default PriceChart
