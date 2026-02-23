import { useState, useRef, useEffect, useCallback } from 'react'
import GlassCard from '../ui/GlassCard'

const TICKER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Popular stocks to show by default
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Equity' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'ETF' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CCC', type: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CCC', type: 'Crypto' },
]

function TickerSelector({ selectedTickers, setSelectedTickers, onCompare, loading }) {
  const [searchValue, setSearchValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [searchResults, setSearchResults] = useState(POPULAR_STOCKS)
  const [searching, setSearching] = useState(false)
  const dropdownRef = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search Yahoo Finance
  const searchStocks = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setSearchResults(POPULAR_STOCKS.filter(s => !selectedTickers.includes(s.symbol)))
      return
    }

    setSearching(true)
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=15&newsCount=0`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.quotes?.length > 0) {
          const stocks = data.quotes.map(q => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            exchange: q.exchange || q.exchDisp || 'Unknown',
            type: q.quoteType || 'Equity',
          })).filter(s => !selectedTickers.includes(s.symbol))
          setSearchResults(stocks)
        } else {
          setSearchResults([{ symbol: query.toUpperCase(), name: 'Custom ticker', exchange: 'Custom', type: 'Custom' }])
        }
      }
    } catch {
      // Fallback to local filter
      const filtered = POPULAR_STOCKS.filter(s => 
        !selectedTickers.includes(s.symbol) &&
        (s.symbol.toLowerCase().includes(query.toLowerCase()) || s.name.toLowerCase().includes(query.toLowerCase()))
      )
      setSearchResults(filtered.length > 0 ? filtered : [{ symbol: query.toUpperCase(), name: 'Custom ticker', exchange: 'Custom', type: 'Custom' }])
    } finally {
      setSearching(false)
    }
  }, [selectedTickers])

  // Debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value.toUpperCase()
    setSearchValue(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchStocks(query), 300)
  }

  const addTicker = (stock) => {
    if (selectedTickers.length < 8 && !selectedTickers.includes(stock.symbol)) {
      setSelectedTickers([...selectedTickers, stock.symbol])
    }
    setSearchValue('')
    setIsOpen(false)
    setSearchResults(POPULAR_STOCKS.filter(s => !selectedTickers.includes(s.symbol) && s.symbol !== stock.symbol))
  }

  const removeTicker = (ticker) => {
    setSelectedTickers(selectedTickers.filter(t => t !== ticker))
  }

  return (
    <GlassCard className="p-6" glow>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
          ⚖️
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Asset Selection</h3>
          <p className="text-xs text-gray-500">Select up to 8 tickers to compare</p>
        </div>
      </div>

      {/* Search Dropdown */}
      <div className="relative mb-4" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Search stocks, ETFs, crypto..."
            className="w-full px-4 py-2.5 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            disabled={selectedTickers.length >= 8}
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Dropdown Results */}
        {isOpen && selectedTickers.length < 8 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-64 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-gray-800/50 bg-gray-800/30">
              <p className="text-[10px] text-gray-500">{searchValue ? `Results for "${searchValue}"` : 'Popular Stocks'}</p>
            </div>
            <div className="overflow-y-auto max-h-48 scrollbar-thin scrollbar-thumb-gray-700">
              {searchResults.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No results found</p>
              ) : (
                searchResults.map((stock, i) => (
                  <button
                    key={`${stock.symbol}-${i}`}
                    onClick={() => addTicker(stock)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 transition-colors text-left"
                  >
                    <span className="font-mono font-bold text-blue-400 min-w-[60px]">{stock.symbol}</span>
                    <span className="text-xs text-gray-400 truncate flex-1">{stock.name}</span>
                    <span className="text-[10px] text-gray-600">{stock.type}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tickers */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2">Selected ({selectedTickers.length}/8)</p>
        <div className="flex flex-wrap gap-2">
          {selectedTickers.map((ticker, index) => (
            <div
              key={ticker}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
              style={{
                backgroundColor: `${TICKER_COLORS[index]}15`,
                borderColor: `${TICKER_COLORS[index]}40`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: TICKER_COLORS[index] }}
              />
              <span className="text-sm font-mono font-medium text-white">{ticker}</span>
              <button
                onClick={() => removeTicker(ticker)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          {selectedTickers.length === 0 && (
            <span className="text-sm text-gray-500">No tickers selected</span>
          )}
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={onCompare}
        disabled={selectedTickers.length < 2 || loading}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Comparing...
          </>
        ) : (
          <>
            <span>📊</span>
            Compare Assets
          </>
        )}
      </button>

      {selectedTickers.length < 2 && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Select at least 2 tickers to compare
        </p>
      )}
    </GlassCard>
  )
}

export { TICKER_COLORS }
export default TickerSelector
