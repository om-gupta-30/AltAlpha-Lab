import { useMemo } from 'react'

function CorrelationHeatmap({ data, tickers, title = 'Correlation Matrix' }) {
  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    if (!data || tickers.length < 2) return null
    
    // Get returns arrays for each ticker
    const returnsMap = {}
    tickers.forEach(ticker => {
      if (data[ticker]?.data) {
        returnsMap[ticker] = data[ticker].data.map(d => d.returns || 0)
      }
    })
    
    // Calculate correlations
    const matrix = {}
    tickers.forEach(ticker1 => {
      matrix[ticker1] = {}
      tickers.forEach(ticker2 => {
        if (ticker1 === ticker2) {
          matrix[ticker1][ticker2] = 1
        } else {
          const returns1 = returnsMap[ticker1]
          const returns2 = returnsMap[ticker2]
          
          if (returns1 && returns2) {
            // Calculate Pearson correlation
            const n = Math.min(returns1.length, returns2.length)
            const mean1 = returns1.slice(0, n).reduce((a, b) => a + b, 0) / n
            const mean2 = returns2.slice(0, n).reduce((a, b) => a + b, 0) / n
            
            let numerator = 0
            let denom1 = 0
            let denom2 = 0
            
            for (let i = 0; i < n; i++) {
              const diff1 = returns1[i] - mean1
              const diff2 = returns2[i] - mean2
              numerator += diff1 * diff2
              denom1 += diff1 * diff1
              denom2 += diff2 * diff2
            }
            
            const correlation = numerator / (Math.sqrt(denom1) * Math.sqrt(denom2))
            matrix[ticker1][ticker2] = isNaN(correlation) ? 0 : correlation
          } else {
            matrix[ticker1][ticker2] = 0
          }
        }
      })
    })
    
    return matrix
  }, [data, tickers])

  // Get color for correlation value
  const getColor = (value) => {
    if (value >= 0.8) return { bg: 'bg-green-500', text: 'text-white' }
    if (value >= 0.5) return { bg: 'bg-green-600/60', text: 'text-white' }
    if (value >= 0.2) return { bg: 'bg-green-700/40', text: 'text-green-300' }
    if (value >= -0.2) return { bg: 'bg-gray-700/50', text: 'text-gray-300' }
    if (value >= -0.5) return { bg: 'bg-red-700/40', text: 'text-red-300' }
    if (value >= -0.8) return { bg: 'bg-red-600/60', text: 'text-white' }
    return { bg: 'bg-red-500', text: 'text-white' }
  }

  if (!correlationMatrix || tickers.length < 2) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Select at least 2 tickers
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 rounded bg-red-500/30">-1</span>
          <span>to</span>
          <span className="px-2 py-0.5 rounded bg-green-500/30">+1</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2"></th>
              {tickers.map(ticker => (
                <th key={ticker} className="p-2 text-xs font-mono text-gray-400 font-medium">
                  {ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((ticker1, i) => (
              <tr key={ticker1}>
                <td className="p-2 text-xs font-mono text-gray-400 font-medium text-right">
                  {ticker1}
                </td>
                {tickers.map((ticker2, j) => {
                  const value = correlationMatrix[ticker1][ticker2]
                  const { bg, text } = getColor(value)
                  const isDiagonal = i === j
                  
                  return (
                    <td key={ticker2} className="p-1">
                      <div
                        className={`
                          w-16 h-12 rounded-lg flex items-center justify-center
                          ${bg} ${text}
                          ${isDiagonal ? 'ring-2 ring-white/20' : ''}
                          transition-all hover:scale-105 cursor-default
                        `}
                        title={`${ticker1} vs ${ticker2}: ${value.toFixed(3)}`}
                      >
                        <span className="text-sm font-mono font-bold">
                          {value.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span className="text-gray-400">Strong Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-700" />
          <span className="text-gray-400">Uncorrelated</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500" />
          <span className="text-gray-400">Strong Negative</span>
        </div>
      </div>
    </div>
  )
}

export default CorrelationHeatmap
