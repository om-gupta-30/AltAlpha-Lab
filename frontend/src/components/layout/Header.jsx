import { useState, useEffect } from 'react'
import CurrencySelector from '../ui/CurrencySelector'
import StockSelector from '../ui/StockSelector'

// Live Clock Component with auto-detected timezone
function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-detect user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const timezoneAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop()
  
  // Format date in user's locale
  const dateStr = time.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  
  // Format day
  const dayStr = time.toLocaleDateString(undefined, {
    weekday: 'long',
  })
  
  // Format time in user's locale
  const timeStr = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  // Check if NSE/BSE market is open (9:15 AM - 3:30 PM IST, Mon-Fri)
  // Always check against IST for Indian market status
  const istTime = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = istTime.getHours()
  const minutes = istTime.getMinutes()
  const day = istTime.getDay()
  const currentMinutes = hours * 60 + minutes
  const marketOpen = 9 * 60 + 15  // 9:15 AM IST
  const marketClose = 15 * 60 + 30 // 3:30 PM IST
  
  const isWeekday = day >= 1 && day <= 5
  const isDuringHours = currentMinutes >= marketOpen && currentMinutes < marketClose
  const isMarketOpen = isWeekday && isDuringHours

  // Pre-market and after-market status (in IST)
  const isPreMarket = isWeekday && currentMinutes >= (8 * 60) && currentMinutes < marketOpen
  const isAfterMarket = isWeekday && currentMinutes >= marketClose && currentMinutes < (18 * 60)

  // Get friendly timezone name (e.g., "Asia/Kolkata" -> "India", "America/New_York" -> "New York")
  const getShortLocation = (tz) => {
    const parts = tz.split('/')
    const city = parts[parts.length - 1].replace(/_/g, ' ')
    return city
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {/* Date */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
        <span className="text-gray-500">📅</span>
        <span className="text-gray-300 font-medium">{dateStr}</span>
        <span className="text-gray-500">•</span>
        <span className="text-gray-400">{dayStr}</span>
      </div>
      
      {/* Time */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
        <span className="text-gray-500">🕐</span>
        <span className="text-cyan-400 font-mono font-medium tabular-nums">{timeStr}</span>
        <span className="text-gray-500 text-[10px]">{timezoneAbbr}</span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700/30">
        <span className="text-gray-500">📍</span>
        <span className="text-gray-400">{getShortLocation(userTimezone)}</span>
      </div>
      
      {/* NSE/BSE Market Status */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
        isMarketOpen 
          ? 'bg-green-500/10 border-green-500/30' 
          : isPreMarket
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : isAfterMarket
              ? 'bg-orange-500/10 border-orange-500/30'
              : 'bg-gray-800/50 border-gray-700/30'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${
          isMarketOpen 
            ? 'bg-green-500 animate-pulse' 
            : isPreMarket
              ? 'bg-yellow-500 animate-pulse'
              : isAfterMarket
                ? 'bg-orange-500'
                : 'bg-gray-500'
        }`} />
        <span className={`font-medium ${
          isMarketOpen 
            ? 'text-green-400' 
            : isPreMarket
              ? 'text-yellow-400'
              : isAfterMarket
                ? 'text-orange-400'
                : 'text-gray-400'
        }`}>
          {isMarketOpen 
            ? 'NSE Open' 
            : isPreMarket
              ? 'NSE Pre-Market'
              : isAfterMarket
                ? 'NSE After Hours'
                : 'NSE Closed'}
        </span>
      </div>
    </div>
  )
}

function Header({ ticker, setTicker, loading, sidebarCollapsed, activeView, onReset, stockConfirmed, setStockConfirmed }) {
  // Hide controls on comparison page (it has its own stock selection)
  const showControls = activeView !== 'comparison'
  
  // Use stockConfirmed from parent - when confirmed, editing is disabled
  const isEditing = !stockConfirmed

  const handleConfirm = () => {
    if (!ticker?.trim()) return
    setStockConfirmed(true)
  }

  const handleEdit = () => {
    // Reset everything when editing - user wants to start fresh
    onReset?.()
  }

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/50 z-30 transition-all duration-300 ${
        sidebarCollapsed ? 'left-16' : 'left-56'
      }`}
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left: Live Clock */}
        <LiveClock />

        {/* Center/Right: Stock Selector, Currency & Confirm/Edit Button - Only on Dashboard */}
        {showControls ? (
          <div className="flex items-center gap-3">
            <StockSelector
              value={ticker}
              onChange={setTicker}
              onSelect={(stock) => setTicker(stock.symbol)}
              disabled={loading || !isEditing}
            />

            <CurrencySelector disabled={!isEditing} />

            {/* Confirm / Edit Button */}
            <button
              onClick={isEditing ? handleConfirm : handleEdit}
              disabled={loading || (isEditing && !ticker?.trim())}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                isEditing
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed'
                  : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600'
              }`}
            >
              {isEditing ? (
                <>
                  <span>✓</span>
                  <span>Confirm</span>
                </>
              ) : (
                <>
                  <span>✏️</span>
                  <span>Edit</span>
                </>
              )}
            </button>

            {/* Locked indicator */}
            {!isEditing && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs text-green-400">Locked</span>
              </div>
            )}
          </div>
        ) : (
          <div /> /* Empty div to maintain layout when controls are hidden */
        )}
      </div>
    </header>
  )
}

export default Header
