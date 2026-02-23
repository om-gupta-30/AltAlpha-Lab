import { useState, useRef, useEffect } from 'react'
import { useCurrency } from '../../context/CurrencyContext'

// Flag component using flagcdn.com
function Flag({ country, size = 20 }) {
  // Handle crypto and special cases
  if (country === 'btc') {
    return (
      <div className="flex items-center justify-center rounded-sm bg-orange-500" style={{ width: size, height: size * 0.75 }}>
        <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>B</span>
      </div>
    )
  }
  if (country === 'eth') {
    return (
      <div className="flex items-center justify-center rounded-sm bg-indigo-500" style={{ width: size, height: size * 0.75 }}>
        <span className="text-white font-bold" style={{ fontSize: size * 0.5 }}>E</span>
      </div>
    )
  }
  
  return (
    <img
      src={`https://flagcdn.com/w40/${country}.png`}
      srcSet={`https://flagcdn.com/w80/${country}.png 2x`}
      alt={country}
      className="rounded-sm object-cover"
      style={{ width: size, height: size * 0.75 }}
      loading="lazy"
    />
  )
}

function CurrencySelector({ disabled = false }) {
  const { currency, setCurrency, rates, currencyGroups, loading } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter currencies based on search
  const filteredCurrencies = search
    ? Object.keys(rates).filter(code => 
        code.toLowerCase().includes(search.toLowerCase()) ||
        rates[code].name.toLowerCase().includes(search.toLowerCase())
      )
    : null

  const currentCurrency = rates[currency]

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-xl text-sm transition-all duration-200 ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-600'
        }`}
      >
        <Flag country={currentCurrency?.country} size={20} />
        <span className="font-medium text-white">{currency}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {loading && (
          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-800/50">
            <input
              type="text"
              placeholder="Search currencies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              autoFocus
            />
          </div>

          {/* Currency List */}
          <div className="overflow-y-auto max-h-[50vh] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {filteredCurrencies ? (
              // Search Results
              <div className="p-2">
                {filteredCurrencies.length === 0 ? (
                  <p className="text-center text-gray-500 py-4 text-sm">No currencies found</p>
                ) : (
                  filteredCurrencies.map(code => (
                    <CurrencyItem
                      key={code}
                      code={code}
                      data={rates[code]}
                      isSelected={currency === code}
                      onSelect={() => {
                        setCurrency(code)
                        setIsOpen(false)
                        setSearch('')
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              // Grouped View
              Object.entries(currencyGroups).map(([group, codes]) => (
                <div key={group}>
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-800/30 sticky top-0">
                    {group}
                  </div>
                  <div className="p-2">
                    {codes.map(code => rates[code] && (
                      <CurrencyItem
                        key={code}
                        code={code}
                        data={rates[code]}
                        isSelected={currency === code}
                        onSelect={() => {
                          setCurrency(code)
                          setIsOpen(false)
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800/50 bg-gray-800/30">
            <p className="text-[10px] text-gray-500 text-center">
              {Object.keys(rates).length} currencies available
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function CurrencyItem({ code, data, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
        isSelected
          ? 'bg-blue-500/20 border border-blue-500/30'
          : 'hover:bg-gray-800/50 border border-transparent'
      }`}
    >
      <Flag country={data.country} size={24} />
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className={`font-mono font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>
            {code}
          </span>
          <span className="text-xs text-gray-600">{data.symbol}</span>
          {isSelected && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          )}
        </div>
        <span className="text-xs text-gray-500 block truncate">{data.name}</span>
      </div>
      <span className="text-xs text-gray-600 font-mono">
        {data.rate < 1 ? data.rate.toFixed(4) : data.rate.toFixed(2)}
      </span>
    </button>
  )
}

export default CurrencySelector
