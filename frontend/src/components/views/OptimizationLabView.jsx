import { useState, useEffect, useMemo } from 'react'
import GlassCard from '../ui/GlassCard'
import { SpinnerGradient } from '../ui/Spinner'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Color scale for heatmap (red -> yellow -> green)
function getHeatmapColor(value, min, max) {
  const normalized = (value - min) / (max - min)
  
  if (normalized < 0.5) {
    // Red to Yellow
    const r = 239
    const g = Math.round(68 + (normalized * 2) * (234 - 68))
    const b = 68
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Yellow to Green
    const r = Math.round(234 - ((normalized - 0.5) * 2) * (234 - 34))
    const g = Math.round(234 - ((normalized - 0.5) * 2) * (234 - 197))
    const b = Math.round(68 + ((normalized - 0.5) * 2) * (94 - 68))
    return `rgb(${r}, ${g}, ${b})`
  }
}

// Heatmap Component
function SharpeHeatmap({ data, bestParams }) {
  const { grid, sentimentValues, volatilityValues, min, max } = useMemo(() => {
    if (!data || data.length === 0) return { grid: [], sentimentValues: [], volatilityValues: [], min: 0, max: 1 }
    
    // Extract unique values
    const sentiments = [...new Set(data.map(d => d.sentiment_threshold))].sort((a, b) => a - b)
    const volatilities = [...new Set(data.map(d => d.volatility_percentile))].sort((a, b) => a - b)
    
    // Create lookup map
    const lookup = {}
    data.forEach(d => {
      lookup[`${d.sentiment_threshold}_${d.volatility_percentile}`] = d.sharpe_ratio
    })
    
    // Build grid
    const gridData = volatilities.map(vol => 
      sentiments.map(sent => lookup[`${sent}_${vol}`] || 0)
    )
    
    const allValues = data.map(d => d.sharpe_ratio)
    
    return {
      grid: gridData,
      sentimentValues: sentiments,
      volatilityValues: volatilities,
      min: Math.min(...allValues),
      max: Math.max(...allValues),
    }
  }, [data])

  if (grid.length === 0) return null

  const cellSize = 50
  const labelWidth = 60
  const labelHeight = 40

  return (
    <div className="overflow-x-auto">
      <div className="inline-block">
        {/* Column labels (sentiment threshold) */}
        <div className="flex" style={{ marginLeft: labelWidth }}>
          {sentimentValues.map(sent => (
            <div
              key={sent}
              className="text-xs text-gray-400 text-center font-mono"
              style={{ width: cellSize }}
            >
              {sent.toFixed(1)}
            </div>
          ))}
        </div>
        
        {/* Grid rows */}
        {grid.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center">
            {/* Row label (volatility percentile) */}
            <div 
              className="text-xs text-gray-400 text-right pr-2 font-mono"
              style={{ width: labelWidth }}
            >
              {volatilityValues[rowIndex]}%
            </div>
            
            {/* Cells */}
            {row.map((value, colIndex) => {
              const isBest = bestParams && 
                sentimentValues[colIndex] === bestParams.sentiment_threshold &&
                volatilityValues[rowIndex] === bestParams.volatility_percentile
              
              return (
                <div
                  key={colIndex}
                  className={`
                    relative flex items-center justify-center text-xs font-mono font-semibold
                    transition-all duration-200 cursor-pointer
                    ${isBest ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 z-10 scale-110' : 'hover:scale-105'}
                  `}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: getHeatmapColor(value, min, max),
                    color: value > (min + max) / 2 ? '#000' : '#fff',
                  }}
                  title={`Sentiment: ${sentimentValues[colIndex]}, Vol: ${volatilityValues[rowIndex]}%, Sharpe: ${value.toFixed(3)}`}
                >
                  {value.toFixed(2)}
                  {isBest && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px]">
                      ⭐
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        
        {/* Axis labels */}
        <div className="flex items-center justify-center mt-4" style={{ marginLeft: labelWidth }}>
          <span className="text-xs text-gray-500">Sentiment Threshold →</span>
        </div>
        <div 
          className="absolute text-xs text-gray-500"
          style={{ 
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            left: -20,
            top: '50%'
          }}
        >
          Volatility Percentile →
        </div>
      </div>
      
      {/* Color scale legend */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <span className="text-xs text-gray-500">Low Sharpe</span>
        <div className="flex h-4 rounded overflow-hidden">
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <div
              key={t}
              className="w-10 h-full"
              style={{ backgroundColor: getHeatmapColor(min + t * (max - min), min, max) }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-500">High Sharpe</span>
      </div>
    </div>
  )
}

// Top 10 Table Component
function TopParametersTable({ data, bestParams }) {
  if (!data || data.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Rank</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Sentiment</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Volatility</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Sharpe</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Return</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Drawdown</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Trades</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, index) => {
            const isBest = index === 0
            return (
              <tr 
                key={index}
                className={`
                  border-b border-gray-800/50 transition-colors
                  ${isBest ? 'bg-green-500/10' : 'hover:bg-gray-800/30'}
                `}
              >
                <td className="py-3 px-4">
                  <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                    ${isBest ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-gray-300'}
                  `}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-white">
                  {row.sentiment_threshold.toFixed(1)}
                </td>
                <td className="py-3 px-4 font-mono text-white">
                  {row.volatility_percentile}%
                </td>
                <td className={`py-3 px-4 font-mono text-right font-semibold ${
                  row.sharpe_ratio > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {row.sharpe_ratio.toFixed(3)}
                </td>
                <td className={`py-3 px-4 font-mono text-right ${
                  row.total_return_pct > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {row.total_return_pct > 0 ? '+' : ''}{row.total_return_pct.toFixed(1)}%
                </td>
                <td className="py-3 px-4 font-mono text-right text-red-400">
                  {row.max_drawdown_pct?.toFixed(1) || 'N/A'}%
                </td>
                <td className="py-3 px-4 font-mono text-right text-gray-400">
                  {row.num_trades}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Parameter Sensitivity Chart
function SensitivityChart({ data, paramName, label }) {
  if (!data || data.length === 0) return null

  const chartHeight = 160
  const chartWidth = 400
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }

  const values = data.map(d => d.avg_sharpe)
  const minVal = Math.min(...values, 0) - 0.1
  const maxVal = Math.max(...values) + 0.1

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + (1 - (d.avg_sharpe - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
    return { x, y, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  
  // Error bars (using std)
  const errorBars = points.map((p, i) => {
    const stdPixels = (data[i].std_sharpe / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
    return {
      x: p.x,
      y1: Math.max(padding.top, p.y - stdPixels),
      y2: Math.min(chartHeight - padding.bottom, p.y + stdPixels),
    }
  })

  // Zero line
  const zeroY = padding.top + (1 - (0 - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        {label}
      </h4>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-40">
        {/* Zero line */}
        <line
          x1={padding.left}
          x2={chartWidth - padding.right}
          y1={zeroY}
          y2={zeroY}
          stroke="#6b7280"
          strokeDasharray="4,4"
          opacity="0.5"
        />
        
        {/* Error bars */}
        {errorBars.map((bar, i) => (
          <g key={i}>
            <line
              x1={bar.x}
              x2={bar.x}
              y1={bar.y1}
              y2={bar.y2}
              stroke="#8b5cf6"
              strokeWidth="2"
              opacity="0.3"
            />
            <line x1={bar.x - 4} x2={bar.x + 4} y1={bar.y1} y2={bar.y1} stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
            <line x1={bar.x - 4} x2={bar.x + 4} y1={bar.y2} y2={bar.y2} stroke="#8b5cf6" strokeWidth="2" opacity="0.3" />
          </g>
        ))}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#8b5cf6"
            className="hover:r-6 transition-all cursor-pointer"
          />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={chartHeight - 10}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="10"
          >
            {data[i].value}
          </text>
        ))}

        {/* Y-axis labels */}
        {[minVal, (minVal + maxVal) / 2, maxVal].map((val, i) => {
          const y = padding.top + (1 - (val - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
          return (
            <text
              key={i}
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#6b7280"
              fontSize="10"
            >
              {val.toFixed(2)}
            </text>
          )
        })}
      </svg>
      <p className="text-xs text-gray-600 text-center mt-2">
        Error bars show ±1 std deviation across other parameter values
      </p>
    </div>
  )
}

// Stable Regions Component
function StableRegions({ regions }) {
  if (!regions || regions.length === 0) return null

  return (
    <div className="space-y-3">
      {regions.slice(0, 5).map((region, index) => (
        <div
          key={index}
          className={`
            p-4 rounded-xl border transition-all
            ${index === 0 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600/50'
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${index === 0 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}
              `}>
                {index + 1}
              </span>
              <span className="text-sm font-medium text-white">
                Sent: {region.sentiment_threshold} / Vol: {region.volatility_percentile}%
              </span>
            </div>
            <span className={`text-sm font-mono font-semibold ${
              region.sharpe_ratio > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {region.sharpe_ratio.toFixed(3)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Stability</span>
              <div className="font-mono text-blue-400">{region.stability_score.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-gray-500">Neighborhood</span>
              <div className="font-mono text-purple-400">{region.avg_neighborhood_sharpe.toFixed(3)}</div>
            </div>
            <div>
              <span className="text-gray-500">Std Dev</span>
              <div className="font-mono text-gray-400">±{region.neighborhood_std.toFixed(3)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Best Parameters Card
function BestParametersCard({ params, sharpe, totalReturn, drawdown }) {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-cyan-500/20 border border-green-500/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-2xl">
          🏆
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Optimal Parameters</h3>
          <p className="text-xs text-gray-400">Best risk-adjusted performance</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 rounded-xl bg-black/20">
          <div className="text-xs text-gray-400 mb-1">Sentiment Threshold</div>
          <div className="text-2xl font-bold font-mono text-white">
            {params?.sentiment_threshold?.toFixed(1)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-black/20">
          <div className="text-xs text-gray-400 mb-1">Volatility Filter</div>
          <div className="text-2xl font-bold font-mono text-white">
            {params?.volatility_percentile}%
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-black/20">
          <div className="text-xs text-gray-500">Sharpe</div>
          <div className="text-lg font-bold text-green-400">{sharpe?.toFixed(3)}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-black/20">
          <div className="text-xs text-gray-500">Return</div>
          <div className="text-lg font-bold text-green-400">+{totalReturn?.toFixed(1)}%</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-black/20">
          <div className="text-xs text-gray-500">Drawdown</div>
          <div className="text-lg font-bold text-red-400">{drawdown?.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}

function OptimizationLabView({ ticker }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ticker) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE}/optimize?ticker=${ticker}`)
        if (!response.ok) throw new Error('Failed to fetch optimization data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [ticker])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <SpinnerGradient size="w-16 h-16" />
        <p className="mt-4 text-gray-400">Running parameter optimization...</p>
        <p className="text-xs text-gray-600 mt-2">Testing {11 * 7} parameter combinations</p>
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
          🔬
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">Optimization Lab</h2>
        <p className="text-gray-500 text-center max-w-md text-sm">
          Run analysis on a stock to optimize strategy parameters.
        </p>
      </div>
    )
  }

  const { 
    best_parameters, 
    best_sharpe, 
    best_total_return_pct, 
    best_max_drawdown_pct,
    top_10, 
    stable_regions, 
    parameter_sensitivity, 
    full_results,
    total_combinations 
  } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🔬</span>
            Strategy Optimization Lab
          </h1>
          <p className="text-gray-500 mt-1">
            Grid search across {total_combinations} parameter combinations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-xs text-green-400">
            Best Sharpe: {best_sharpe?.toFixed(3)}
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            {ticker}
          </span>
        </div>
      </div>

      {/* Top Row - Best Parameters & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Best Parameters Card */}
        <div className="lg:col-span-1">
          <BestParametersCard
            params={best_parameters}
            sharpe={best_sharpe}
            totalReturn={best_total_return_pct}
            drawdown={best_max_drawdown_pct}
          />
          
          {/* Stable Regions */}
          <GlassCard className="p-5 mt-6" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Stable Parameter Regions
            </h3>
            <StableRegions regions={stable_regions} />
          </GlassCard>
        </div>

        {/* Heatmap */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Sharpe Ratio Heatmap
            </h3>
            <SharpeHeatmap data={full_results} bestParams={best_parameters} />
          </GlassCard>
        </div>
      </div>

      {/* Middle Row - Top 10 Table */}
      <GlassCard className="p-6" glow>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Top 10 Parameter Combinations
        </h3>
        <TopParametersTable data={top_10} bestParams={best_parameters} />
      </GlassCard>

      {/* Bottom Row - Sensitivity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Parameter Sensitivity Analysis
          </h3>
          <SensitivityChart
            data={parameter_sensitivity?.sentiment_threshold}
            paramName="sentiment_threshold"
            label="Sentiment Threshold Impact"
          />
        </GlassCard>

        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Parameter Sensitivity Analysis
          </h3>
          <SensitivityChart
            data={parameter_sensitivity?.volatility_percentile}
            paramName="volatility_percentile"
            label="Volatility Percentile Impact"
          />
        </GlassCard>
      </div>

      {/* Summary Stats */}
      <GlassCard className="p-6" glow>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Optimization Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500 mb-1">Combinations Tested</div>
            <div className="text-2xl font-bold text-white">{total_combinations}</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500 mb-1">Positive Sharpe</div>
            <div className="text-2xl font-bold text-green-400">
              {full_results?.filter(r => r.sharpe_ratio > 0).length || 0}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500 mb-1">Avg Sharpe</div>
            <div className="text-2xl font-bold text-blue-400">
              {(full_results?.reduce((a, b) => a + b.sharpe_ratio, 0) / (full_results?.length || 1)).toFixed(3)}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
            <div className="text-xs text-gray-500 mb-1">Sharpe Spread</div>
            <div className="text-2xl font-bold text-purple-400">
              {((Math.max(...(full_results?.map(r => r.sharpe_ratio) || [0])) - 
                Math.min(...(full_results?.map(r => r.sharpe_ratio) || [0]))).toFixed(3))}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

export default OptimizationLabView
