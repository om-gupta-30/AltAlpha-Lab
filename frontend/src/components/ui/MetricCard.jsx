import { useState, useEffect, useRef, useMemo, useId } from 'react'

// Animated counter hook - fixed version
function useAnimatedCounter(targetValue, duration = 1500, decimals = 2) {
  const target = parseFloat(targetValue) || 0
  const [displayValue, setDisplayValue] = useState(target)
  const frameRef = useRef(null)
  const previousValueRef = useRef(target)

  useEffect(() => {
    const currentTarget = parseFloat(targetValue) || 0
    const startValue = previousValueRef.current
    
    // Cancel any ongoing animation
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }

    // Skip animation if no significant change - just update ref
    if (Math.abs(currentTarget - startValue) < 0.0001) {
      previousValueRef.current = currentTarget
      return
    }

    const startTime = performance.now()

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      const current = startValue + (currentTarget - startValue) * eased
      setDisplayValue(current)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        // Animation complete - store final value
        previousValueRef.current = currentTarget
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [targetValue, duration])

  // Update previous value when target changes
  useEffect(() => {
    return () => {
      previousValueRef.current = parseFloat(targetValue) || 0
    }
  }, [targetValue])

  return displayValue.toFixed(decimals)
}

// Mini sparkline component
function Sparkline({ data, color = '#3b82f6', positive = true }) {
  const uniqueId = useId()
  
  const points = useMemo(() => {
    if (!data || data.length < 2) return ''
    
    const values = data.slice(-30) // Last 30 points
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    const width = 80
    const height = 24
    const padding = 2
    
    return values.map((val, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2)
      const y = height - padding - ((val - min) / range) * (height - padding * 2)
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
    }).join(' ')
  }, [data])

  if (!points) return null

  const gradientId = `sparkline-${uniqueId}`
  const strokeColor = positive ? '#22c55e' : '#ef4444'

  return (
    <svg width="80" height="24" className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path
        d={`${points} L 78 24 L 2 24 Z`}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <path
        d={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      {/* End dot */}
      <circle
        cx="78"
        cy={points.split(' ').slice(-1)[0]}
        r="2"
        fill={strokeColor}
        className="animate-pulse"
      />
    </svg>
  )
}

// Main MetricCard component
function MetricCard({ 
  label, 
  value, 
  unit = '', 
  icon, 
  sparklineData,
  isGood,
  description,
  decimals = 2,
  prefix = '',
  animate = true
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Determine if value is positive/negative
  const numValue = parseFloat(value) || 0
  const isPositive = isGood !== undefined ? isGood : numValue >= 0
  
  // Animated value
  const animatedValue = useAnimatedCounter(
    animate ? numValue : null, 
    1500, 
    decimals
  )
  const displayValue = animate ? animatedValue : numValue.toFixed(decimals)

  // Color scheme based on good/bad
  const colorScheme = isPositive 
    ? {
        glow: 'shadow-green-500/20',
        border: 'border-green-500/30',
        gradient: 'from-green-500 to-emerald-500',
        text: 'text-green-400',
        bg: 'bg-green-500/10',
        icon: 'from-green-600 to-emerald-500',
      }
    : {
        glow: 'shadow-red-500/20',
        border: 'border-red-500/30',
        gradient: 'from-red-500 to-orange-500',
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        icon: 'from-red-600 to-orange-500',
      }

  return (
    <div
      className={`
        relative p-5 rounded-2xl transition-all duration-300 cursor-default
        bg-gray-900/40 backdrop-blur-xl border
        ${isHovered 
          ? `shadow-lg ${colorScheme.glow} ${colorScheme.border} scale-[1.02]` 
          : 'border-gray-800/50 shadow-none scale-100'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <div 
        className={`
          absolute inset-0 rounded-2xl transition-opacity duration-300
          bg-gradient-to-br ${colorScheme.gradient} opacity-0
          ${isHovered ? 'opacity-[0.03]' : ''}
        `}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex-1">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {label}
          </span>
          {description && (
            <p className="text-[10px] text-gray-600 mt-0.5">{description}</p>
          )}
        </div>
        {icon && (
          <div 
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center text-white text-base
              bg-gradient-to-br ${colorScheme.icon}
              transition-all duration-300
              ${isHovered ? 'scale-110 shadow-lg' : 'opacity-80'}
            `}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value display with animation */}
      <div className="flex items-baseline gap-2 relative mb-3">
        <span className={`text-3xl font-bold tracking-tight transition-colors duration-300 ${colorScheme.text}`}>
          {prefix}{displayValue}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 font-medium">{unit}</span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="relative">
          <Sparkline data={sparklineData} positive={isPositive} />
        </div>
      )}

      {/* Status indicator */}
      <div className={`
        absolute top-3 right-3 w-2 h-2 rounded-full
        ${isPositive ? 'bg-green-500' : 'bg-red-500'}
        ${isHovered ? 'animate-pulse' : ''}
      `} />

      {/* Bottom accent line */}
      <div 
        className={`
          absolute bottom-0 left-4 right-4 h-0.5 rounded-full 
          bg-gradient-to-r ${colorScheme.gradient}
          transition-opacity duration-300
          ${isHovered ? 'opacity-80' : 'opacity-30'}
        `} 
      />
    </div>
  )
}

export default MetricCard
