import { useState, useEffect } from 'react'
import GlassCard from '../ui/GlassCard'
import { useCurrency } from '../../context/CurrencyContext'

function StrategyControlPanel({ params, setParams, onConfirm, loading, ticker, stockConfirmed }) {
  const [localParams, setLocalParams] = useState(params)
  const [isEditing, setIsEditing] = useState(true) // Start in editing mode
  const { currency, getCurrencyInfo } = useCurrency()
  
  // Get current currency info
  const currencyInfo = getCurrencyInfo()

  // Sync with parent params when they change externally (e.g., reset)
  useEffect(() => {
    setLocalParams(params)
  }, [params])

  const handleChange = (key, value) => {
    if (!isEditing) return // Prevent changes when not editing
    setLocalParams(prev => ({ ...prev, [key]: value }))
  }

  const handleConfirm = () => {
    if (!ticker?.trim()) return
    setParams(localParams)
    setIsEditing(false)
    onConfirm?.(localParams)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleReset = () => {
    const defaults = {
      sentimentThreshold: 0.2,
      volatilityFilter: 50,
      transactionCost: 10,
      initialCapital: 10000,
    }
    setLocalParams(defaults)
    setParams(defaults)
  }

  return (
    <GlassCard className="p-6" glow>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
            ⚙️
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Strategy Controls</h3>
            <p className="text-xs text-gray-500">
              {isEditing ? 'Adjust parameters, then confirm' : 'Click Edit to modify'}
            </p>
          </div>
        </div>
        {loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-xs text-blue-400">Analyzing...</span>
          </div>
        )}
        {!isEditing && !loading && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Locked</span>
          </div>
        )}
      </div>

      <div className={`space-y-6 ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}>
        {/* Sentiment Threshold */}
        <ControlSlider
          label="Sentiment Threshold"
          description="Signal triggers above this level"
          value={localParams.sentimentThreshold}
          onChange={(v) => handleChange('sentimentThreshold', v)}
          min={-1}
          max={1}
          step={0.05}
          format={(v) => v.toFixed(2)}
          gradient="from-red-500 via-gray-500 to-green-500"
          showZero
          disabled={!isEditing}
        />

        {/* Volatility Filter */}
        <ControlSlider
          label="Volatility Filter"
          description="Max volatility for long signals"
          value={localParams.volatilityFilter}
          onChange={(v) => handleChange('volatilityFilter', v)}
          min={0}
          max={100}
          step={1}
          format={(v) => `${v}%`}
          gradient="from-green-500 to-red-500"
          disabled={!isEditing}
        />

        {/* Transaction Cost */}
        <ControlInput
          label="Transaction Cost"
          description="Cost per trade (basis points)"
          value={localParams.transactionCost}
          onChange={(v) => handleChange('transactionCost', v)}
          min={0}
          max={100}
          step={1}
          unit="bps"
          icon="💸"
          disabled={!isEditing}
        />

        {/* Initial Capital */}
        <ControlInput
          label="Initial Capital"
          description={`Starting portfolio value (${currency})`}
          value={localParams.initialCapital}
          onChange={(v) => handleChange('initialCapital', v)}
          min={1000}
          max={100000000}
          step={1000}
          unit={currency}
          icon="💰"
          prefix={currencyInfo.symbol}
          disabled={!isEditing}
        />
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-4">
          <ParamBadge label="Long Signal" value={`Sentiment > ${localParams.sentimentThreshold.toFixed(2)}`} color="green" />
          <ParamBadge label="Short Signal" value={`Sentiment < -0.20`} color="red" />
          <ParamBadge label="Vol Filter" value={`< ${localParams.volatilityFilter}%`} color="yellow" />
          <ParamBadge label="Cost/Trade" value={`${localParams.transactionCost} bps`} color="purple" />
        </div>
      </div>

      {/* Confirm / Edit Button */}
      <button
        onClick={isEditing ? handleConfirm : handleEdit}
        disabled={loading || (isEditing && (!ticker?.trim() || !stockConfirmed))}
        className={`mt-4 w-full py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
          isEditing
            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 disabled:from-gray-600 disabled:to-gray-600 disabled:shadow-none disabled:cursor-not-allowed'
            : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white hover:border-gray-600'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Analyzing...</span>
          </>
        ) : isEditing ? (
          <>
            <span>▶</span>
            <span>Confirm & Run</span>
          </>
        ) : (
          <>
            <span>✏️</span>
            <span>Edit Parameters</span>
          </>
        )}
      </button>

      {/* Hint when stock not confirmed */}
      {isEditing && !stockConfirmed && (
        <p className="mt-2 text-xs text-center text-amber-400/80">
          Please confirm stock & currency in the header first
        </p>
      )}

      {/* Reset Button - Only show when editing */}
      {isEditing && (
        <button
          onClick={handleReset}
          className="mt-2 w-full py-2 rounded-xl bg-gray-800/30 border border-gray-700/30 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all text-sm"
        >
          Reset to Defaults
        </button>
      )}
    </GlassCard>
  )
}

function ControlSlider({ label, description, value, onChange, min, max, step, format, gradient, showZero, disabled }) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={disabled ? 'cursor-not-allowed' : ''}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-lg font-bold text-white font-mono">{format(value)}</span>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full bg-gray-700/50 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${gradient || 'from-blue-500 to-cyan-500'} transition-all duration-150`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showZero && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-500"
            style={{ left: `${((0 - min) / (max - min)) * 100}%` }}
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className={`absolute inset-0 w-full h-full opacity-0 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-black/20 border-2 border-gray-300 pointer-events-none transition-all duration-150"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-600">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function ControlInput({ label, description, value, onChange, min, max, step, unit, icon, prefix, disabled }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-sm font-medium text-white">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="relative">
        <div className="flex items-center gap-2">
          {prefix && (
            <span className="text-gray-500 font-medium">{prefix}</span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            disabled={disabled}
            className={`flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white font-mono text-right focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all ${disabled ? 'cursor-not-allowed' : ''}`}
          />
          <span className="text-sm text-gray-500 w-12">{unit}</span>
        </div>
      </div>
    </div>
  )
}

function ParamBadge({ label, value, color }) {
  const colors = {
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }

  return (
    <div className={`px-3 py-2 rounded-lg border ${colors[color]}`}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-mono font-medium">{value}</p>
    </div>
  )
}

export default StrategyControlPanel
