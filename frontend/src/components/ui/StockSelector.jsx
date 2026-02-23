import { useState, useRef, useEffect, useCallback } from 'react'

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
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', type: 'Equity' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', type: 'ETF' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CCC', type: 'Crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CCC', type: 'Crypto' },
]

// Type badge colors
const TYPE_COLORS = {
  Equity: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ETF: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Crypto: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Index: 'bg-green-500/20 text-green-400 border-green-500/30',
  Fund: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Future: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Currency: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

function StockSelector({ value, onChange, onSelect, disabled }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const [results, setResults] = useState(POPULAR_STOCKS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update search when value changes externally
  useEffect(() => {
    setSearch(value || '')
  }, [value])

  // Search Yahoo Finance
  const searchStocks = useCallback(async (query) => {
    if (!query || query.length < 1) {
      setResults(POPULAR_STOCKS)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Using Yahoo Finance autocomplete API via a CORS proxy
      // In production, you'd want your own backend proxy
      const response = await fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=20&newsCount=0&listsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      
      if (data.quotes && data.quotes.length > 0) {
        const stocks = data.quotes.map(quote => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname || quote.symbol,
          exchange: quote.exchange || quote.exchDisp || 'Unknown',
          type: quote.quoteType || 'Equity',
        }))
        setResults(stocks)
      } else {
        // If no results, show a "custom ticker" option
        setResults([{
          symbol: query.toUpperCase(),
          name: 'Use custom ticker',
          exchange: 'Custom',
          type: 'Custom',
        }])
      }
    } catch (err) {
      console.log('Yahoo search error, using local filter:', err.message)
      // Fallback to filtering popular stocks locally
      const filtered = POPULAR_STOCKS.filter(
        s => s.symbol.toLowerCase().includes(query.toLowerCase()) ||
             s.name.toLowerCase().includes(query.toLowerCase())
      )
      if (filtered.length > 0) {
        setResults(filtered)
      } else {
        // Allow custom ticker
        setResults([{
          symbol: query.toUpperCase(),
          name: 'Use custom ticker',
          exchange: 'Custom',
          type: 'Custom',
        }])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  const handleSearchChange = (e) => {
    const query = e.target.value.toUpperCase()
    setSearch(query)
    onChange?.(query)

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      searchStocks(query)
    }, 300)
  }

  // Handle selection
  const handleSelect = (stock) => {
    setSearch(stock.symbol)
    onChange?.(stock.symbol)
    onSelect?.(stock)
    setIsOpen(false)
  }

  // Handle key navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && search) {
      // Select first result or use custom ticker
      if (results.length > 0) {
        handleSelect(results[0])
      } else {
        handleSelect({ symbol: search, name: 'Custom', exchange: 'Custom', type: 'Custom' })
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search stocks..."
          disabled={disabled}
          className="w-48 md:w-64 px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-medium placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {/* Search Icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 md:w-96 max-h-[60vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800/50 bg-gray-800/30">
            <p className="text-xs text-gray-400">
              {search ? `Results for "${search}"` : 'Popular Stocks'}
            </p>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 text-sm">No results found</p>
                <p className="text-gray-600 text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((stock, index) => (
                  <button
                    key={`${stock.symbol}-${index}`}
                    onClick={() => handleSelect(stock)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors duration-150 text-left"
                  >
                    {/* Symbol Badge */}
                    <div className="min-w-[70px]">
                      <span className="font-mono font-bold text-blue-400">
                        {stock.symbol}
                      </span>
                    </div>
                    
                    {/* Name & Exchange */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{stock.name}</p>
                      <p className="text-xs text-gray-500">{stock.exchange}</p>
                    </div>
                    
                    {/* Type Badge */}
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${TYPE_COLORS[stock.type] || TYPE_COLORS.Equity}`}>
                      {stock.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-800/50 bg-gray-800/30">
            <p className="text-[10px] text-gray-500 text-center">
              Search any ticker from Yahoo Finance - stocks, ETFs, indices, crypto, forex & more
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockSelector
