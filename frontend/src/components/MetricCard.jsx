/**
 * MetricCard - Individual metric display card
 * @param {string} title - Metric name
 * @param {number|string} value - Metric value
 * @param {string} unit - Optional unit (%, x, etc.)
 * @param {string} icon - Icon emoji or component
 * @param {string} description - Optional description
 * @param {boolean} inverseColors - If true, negative is good (like drawdown)
 */
function MetricCard({ 
  title, 
  value, 
  unit = '', 
  icon,
  description,
  inverseColors = false,
}) {
  const isNegative = typeof value === 'number' && value < 0
  
  // Determine color based on value
  const getValueColor = () => {
    if (typeof value !== 'number') return 'text-white'
    
    if (inverseColors) {
      // For metrics like drawdown where more negative is worse
      if (value <= -20) return 'text-red-400'
      if (value <= -10) return 'text-orange-400'
      return 'text-yellow-400'
    }
    
    if (value > 0) return 'text-green-400'
    if (value < 0) return 'text-red-400'
    return 'text-gray-300'
  }

  const formatValue = (val) => {
    if (typeof val !== 'number') return val
    if (Math.abs(val) >= 1000) {
      return val.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-black/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <span className="text-lg opacity-60">{icon}</span>
        )}
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-1">
        <p className={`text-2xl font-bold ${getValueColor()}`}>
          {isNegative && !inverseColors ? '' : ''}{formatValue(value)}
        </p>
        {unit && (
          <span className={`text-sm font-medium ${getValueColor()} opacity-80`}>
            {unit}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-500 text-xs mt-2">
          {description}
        </p>
      )}

      {/* Indicator bar */}
      <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            typeof value === 'number' && value > 0 
              ? 'bg-green-500' 
              : typeof value === 'number' && value < 0 
                ? 'bg-red-500' 
                : 'bg-gray-500'
          }`}
          style={{ 
            width: `${Math.min(100, Math.abs(typeof value === 'number' ? value : 0) * 2)}%` 
          }}
        />
      </div>
    </div>
  )
}

export default MetricCard
