import { useState, useCallback } from 'react'
import GlassCard from '../ui/GlassCard'
import TickerSelector from '../comparison/TickerSelector'
import PerformanceComparisonChart from '../comparison/PerformanceComparisonChart'
import CorrelationHeatmap from '../comparison/CorrelationHeatmap'
import VolatilityBars from '../comparison/VolatilityBars'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function AssetComparisonView() {
  const [selectedTickers, setSelectedTickers] = useState(['AAPL', 'MSFT'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [comparisonData, setComparisonData] = useState(null)

  const runComparison = useCallback(async () => {
    if (selectedTickers.length < 2) return

    setLoading(true)
    setError(null)

    try {
      // Fetch price data for all selected tickers
      const promises = selectedTickers.map(ticker =>
        fetch(`${API_BASE}/price-data?ticker=${ticker}`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to fetch ${ticker}`)
            return res.json()
          })
          .then(data => ({ ticker, data }))
      )

      const results = await Promise.all(promises)
      
      // Convert to map
      const dataMap = {}
      results.forEach(({ ticker, data }) => {
        dataMap[ticker] = data
      })

      setComparisonData(dataMap)
    } catch (err) {
      setError(err.message || 'Failed to fetch comparison data')
      setComparisonData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedTickers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Asset Comparison</h1>
          <p className="text-gray-500 text-sm mt-1">Compare performance across multiple assets</p>
        </div>
        {comparisonData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400">
              {selectedTickers.length} assets loaded
            </span>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Sidebar - Ticker Selector */}
        <div className="xl:col-span-1">
          <div className="sticky top-24">
            <TickerSelector
              selectedTickers={selectedTickers}
              setSelectedTickers={setSelectedTickers}
              onCompare={runComparison}
              loading={loading}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-3 space-y-6">
          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <GlassCard className="p-12" glow>
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-gray-800 rounded-full" />
                  <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                </div>
                <p className="mt-4 text-gray-400">Loading comparison data...</p>
              </div>
            </GlassCard>
          )}

          {/* Results */}
          {comparisonData && !loading && (
            <>
              {/* Performance Chart */}
              <GlassCard className="p-0 overflow-hidden" glow>
                <PerformanceComparisonChart
                  data={comparisonData}
                  tickers={selectedTickers}
                  title="Cumulative Returns Comparison"
                />
              </GlassCard>

              {/* Correlation & Volatility Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-0 overflow-hidden" glow>
                  <CorrelationHeatmap
                    data={comparisonData}
                    tickers={selectedTickers}
                    title="Return Correlation Matrix"
                  />
                </GlassCard>

                <GlassCard className="p-0 overflow-hidden" glow>
                  <VolatilityBars
                    data={comparisonData}
                    tickers={selectedTickers}
                    title="Annualized Volatility"
                  />
                </GlassCard>
              </div>

              {/* Summary Table */}
              <GlassCard className="p-6" glow>
                <h3 className="text-lg font-semibold text-white mb-4">Summary Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-xs text-gray-500 font-medium">Ticker</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Data Points</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">First Date</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Last Date</th>
                        <th className="text-right py-3 px-4 text-xs text-gray-500 font-medium">Last Close</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTickers.map((ticker, index) => {
                        const tickerData = comparisonData[ticker]?.data || []
                        const first = tickerData[0]
                        const last = tickerData[tickerData.length - 1]
                        
                        return (
                          <tr key={ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-white">{ticker}</span>
                            </td>
                            <td className="py-3 px-4 text-right text-gray-300 font-mono">
                              {tickerData.length.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-sm">
                              {first?.date || '-'}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400 text-sm">
                              {last?.date || '-'}
                            </td>
                            <td className="py-3 px-4 text-right text-green-400 font-mono font-medium">
                              ${last?.close?.toFixed(2) || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </>
          )}

          {/* Empty State */}
          {!comparisonData && !loading && !error && (
            <GlassCard className="p-12" glow>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-4xl">
                  ⚖️
                </div>
                <h2 className="text-xl font-bold text-gray-300 mb-2">Ready to Compare</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  Select at least 2 tickers from the panel on the left and click "Compare Assets" to analyze their relative performance.
                </p>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssetComparisonView
