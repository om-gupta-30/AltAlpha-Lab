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

// Custom tooltip
function ComparisonTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    const marketReturn = data?.marketCumulative || 0
    const strategyReturn = data?.strategyCumulative || 0
    const alpha = strategyReturn - marketReturn
    
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-xl min-w-[200px]">
        <p className="text-gray-400 text-xs mb-3 pb-2 border-b border-gray-700">{label}</p>
        
        {/* Market Return */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-gray-400 text-sm">Market</span>
          </div>
          <span className={`font-bold font-mono ${marketReturn >= 0 ? 'text-gray-300' : 'text-gray-400'}`}>
            {marketReturn >= 0 ? '+' : ''}{marketReturn.toFixed(2)}%
          </span>
        </div>
        
        {/* Strategy Return */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-gray-400 text-sm">Strategy</span>
          </div>
          <span className={`font-bold font-mono ${strategyReturn >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            {strategyReturn >= 0 ? '+' : ''}{strategyReturn.toFixed(2)}%
          </span>
        </div>
        
        {/* Alpha */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Alpha</span>
            <span className={`font-bold font-mono ${
              alpha > 0 ? 'text-green-400' : alpha < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {alpha > 0 ? '+' : ''}{alpha.toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                alpha > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ 
                width: `${Math.min(100, Math.abs(alpha) * 2)}%`,
                marginLeft: alpha < 0 ? 'auto' : 0,
              }}
            />
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Custom legend
function CustomLegend({ marketReturn, strategyReturn }) {
  const alpha = strategyReturn - marketReturn
  
  return (
    <div className="flex items-center justify-center gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-gray-400 rounded" />
        <span className="text-xs text-gray-400">Market (Buy & Hold)</span>
        <span className={`text-xs font-mono font-medium ${marketReturn >= 0 ? 'text-gray-300' : 'text-red-400'}`}>
          {marketReturn >= 0 ? '+' : ''}{marketReturn.toFixed(1)}%
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5 bg-cyan-400 rounded" />
        <span className="text-xs text-gray-400">Strategy</span>
        <span className={`text-xs font-mono font-medium ${strategyReturn >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
          {strategyReturn >= 0 ? '+' : ''}{strategyReturn.toFixed(1)}%
        </span>
      </div>
      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
        alpha > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        α: {alpha > 0 ? '+' : ''}{alpha.toFixed(1)}%
      </div>
    </div>
  )
}

/**
 * ComparisonChart - Compare market vs strategy cumulative returns
 * @param {Array} data - Array with market_returns and strategy_returns
 * @param {string} title - Optional chart title
 */
function ComparisonChart({ data, title = 'Performance Comparison' }) {
  // Compute cumulative returns
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const sampleRate = Math.max(1, Math.floor(data.length / 300))
    const sampled = data.filter((_, i) => i % sampleRate === 0)
    
    let marketCumulative = 0
    let strategyCumulative = 0
    
    return sampled.map((item) => {
      const marketReturn = item.market_returns || 0
      const strategyReturn = item.strategy_returns || 0
      
      // Cumulative return: (1 + r1) * (1 + r2) - 1
      marketCumulative = (1 + marketCumulative / 100) * (1 + marketReturn) * 100 - 100
      strategyCumulative = (1 + strategyCumulative / 100) * (1 + strategyReturn) * 100 - 100
      
      return {
        date: item.date,
        marketCumulative: Math.round(marketCumulative * 100) / 100,
        strategyCumulative: Math.round(strategyCumulative * 100) / 100,
      }
    })
  }, [data])

  // Get final returns
  const finalReturns = useMemo(() => {
    if (!chartData.length) return { market: 0, strategy: 0 }
    const last = chartData[chartData.length - 1]
    return {
      market: last.marketCumulative,
      strategy: last.strategyCumulative,
    }
  }, [chartData])

  // Calculate stats
  const stats = useMemo(() => {
    if (!chartData.length) return null
    
    const alpha = finalReturns.strategy - finalReturns.market
    
    // Periods where strategy outperformed
    let outperformCount = 0
    chartData.forEach((d) => {
      if (d.strategyCumulative > d.marketCumulative) outperformCount++
    })
    const outperformPct = (outperformCount / chartData.length) * 100
    
    // Max outperformance/underperformance
    const alphas = chartData.map(d => d.strategyCumulative - d.marketCumulative)
    const maxOutperform = Math.max(...alphas)
    const maxUnderperform = Math.min(...alphas)
    
    return {
      alpha,
      outperformPct,
      maxOutperform,
      maxUnderperform,
    }
  }, [chartData, finalReturns])

  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-72 flex items-center justify-center text-gray-500">
          No comparison data available
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
              stats.alpha > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {stats.alpha > 0 ? 'Outperforming' : 'Underperforming'}
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="marketLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#6b7280" />
              </linearGradient>
              <linearGradient id="strategyLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#06b6d4" />
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
              domain={['auto', 'auto']}
              tickMargin={10}
            />
            
            <Tooltip content={<ComparisonTooltip />} />
            
            {/* Zero reference line */}
            <ReferenceLine
              y={0}
              stroke="#4b5563"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            
            {/* Market line */}
            <Line
              type="monotone"
              dataKey="marketCumulative"
              stroke="url(#marketLine)"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 5,
                fill: '#9ca3af',
                stroke: '#1f2937',
                strokeWidth: 2,
              }}
              name="Market"
            />
            
            {/* Strategy line */}
            <Line
              type="monotone"
              dataKey="strategyCumulative"
              stroke="url(#strategyLine)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: '#22d3ee',
                stroke: '#1f2937',
                strokeWidth: 2,
              }}
              name="Strategy"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <CustomLegend 
        marketReturn={finalReturns.market} 
        strategyReturn={finalReturns.strategy} 
      />

      {/* Footer Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Total Alpha</p>
            <p className={`text-sm font-bold ${stats.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats.alpha >= 0 ? '+' : ''}{stats.alpha.toFixed(2)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Outperform Rate</p>
            <p className="text-sm font-bold text-cyan-400">{stats.outperformPct.toFixed(0)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Best Alpha</p>
            <p className="text-sm font-bold text-green-400">+{stats.maxOutperform.toFixed(2)}%</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Worst Alpha</p>
            <p className="text-sm font-bold text-red-400">{stats.maxUnderperform.toFixed(2)}%</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparisonChart
