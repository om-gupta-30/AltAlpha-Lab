import { useState, useEffect, useMemo } from 'react'
import GlassCard from '../ui/GlassCard'
import { SpinnerGradient } from '../ui/Spinner'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Confidence Gauge Component
function ConfidenceGauge({ probability, prediction }) {
  const percentage = Math.round(probability * 100)
  const isUp = prediction === 'up'
  
  // Calculate rotation for needle (-90 to 90 degrees)
  const rotation = -90 + (percentage * 1.8)
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-28 overflow-hidden">
        {/* Gauge background arc */}
        <svg className="absolute inset-0" viewBox="0 0 200 110">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          {/* Background track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#1f2937"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            className="opacity-80"
          />
        </svg>
        
        {/* Needle */}
        <div 
          className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-1000 ease-out"
          style={{ 
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            height: '70px',
            width: '4px',
          }}
        >
          <div className={`w-full h-full rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'} shadow-lg`} />
        </div>
        
        {/* Center dot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-600" />
      </div>
      
      {/* Labels */}
      <div className="w-full flex justify-between text-xs text-gray-500 px-2 -mt-2">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
      
      {/* Prediction Display */}
      <div className="mt-4 text-center">
        <div className={`text-4xl font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {percentage}%
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`text-2xl ${isUp ? '' : 'rotate-180'}`}>
            {isUp ? '📈' : '📉'}
          </span>
          <span className={`text-lg font-semibold uppercase ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {prediction}
          </span>
        </div>
      </div>
    </div>
  )
}

// Feature Importance Bar Chart
function FeatureImportanceChart({ features }) {
  if (!features || features.length === 0) return null
  
  const maxImportance = Math.max(...features.map(f => f.importance))
  
  return (
    <div className="space-y-3">
      {features.map((feature, index) => (
        <div key={feature.feature} className="group">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-400 font-medium">
              {feature.feature.replace(/_/g, ' ')}
            </span>
            <span className="text-sm font-mono text-blue-400">
              {(feature.importance * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-blue-600 to-cyan-500"
              style={{ 
                width: `${(feature.importance / maxImportance) * 100}%`,
                transitionDelay: `${index * 100}ms`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Rolling Accuracy Chart
function RollingAccuracyChart({ data }) {
  if (!data || data.length === 0) return null
  
  const chartHeight = 200
  const chartWidth = 600
  const padding = { top: 20, right: 20, bottom: 30, left: 50 }
  
  const values = data.map(d => d.rolling_accuracy)
  const minVal = Math.min(...values) - 0.05
  const maxVal = Math.max(...values) + 0.05
  
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * (chartWidth - padding.left - padding.right)
    const y = padding.top + (1 - (d.rolling_accuracy - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
    return { x, y, ...d }
  })
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - padding.bottom} L ${padding.left} ${chartHeight - padding.bottom} Z`
  
  // 50% line position
  const fiftyPercent = padding.top + (1 - (0.5 - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
  
  return (
    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-64">
      <defs>
        <linearGradient id="accuracyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Grid lines */}
      {[0.3, 0.4, 0.5, 0.6, 0.7].map(val => {
        const y = padding.top + (1 - (val - minVal) / (maxVal - minVal)) * (chartHeight - padding.top - padding.bottom)
        return (
          <g key={val}>
            <line
              x1={padding.left}
              x2={chartWidth - padding.right}
              y1={y}
              y2={y}
              stroke="#374151"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 10}
              y={y}
              textAnchor="end"
              alignmentBaseline="middle"
              fill="#6b7280"
              fontSize="11"
            >
              {(val * 100).toFixed(0)}%
            </text>
          </g>
        )
      })}
      
      {/* 50% reference line */}
      <line
        x1={padding.left}
        x2={chartWidth - padding.right}
        y1={fiftyPercent}
        y2={fiftyPercent}
        stroke="#ef4444"
        strokeWidth="1"
        strokeDasharray="6,4"
        opacity="0.5"
      />
      
      {/* Area fill */}
      <path d={areaPath} fill="url(#accuracyGradient)" />
      
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* End point */}
      <circle
        cx={points[points.length - 1]?.x}
        cy={points[points.length - 1]?.y}
        r="4"
        fill="#8b5cf6"
        className="animate-pulse"
      />
      
      {/* X-axis label */}
      <text
        x={chartWidth / 2}
        y={chartHeight - 5}
        textAnchor="middle"
        fill="#6b7280"
        fontSize="11"
      >
        Time →
      </text>
    </svg>
  )
}

// Confusion Matrix Component
function ConfusionMatrix({ matrix }) {
  if (!matrix) return null
  
  const { true_negative, false_positive, false_negative, true_positive } = matrix
  const total = true_negative + false_positive + false_negative + true_positive
  
  const cells = [
    { label: 'TN', value: true_negative, color: 'bg-green-500/20 border-green-500/30', textColor: 'text-green-400' },
    { label: 'FP', value: false_positive, color: 'bg-red-500/20 border-red-500/30', textColor: 'text-red-400' },
    { label: 'FN', value: false_negative, color: 'bg-red-500/20 border-red-500/30', textColor: 'text-red-400' },
    { label: 'TP', value: true_positive, color: 'bg-green-500/20 border-green-500/30', textColor: 'text-green-400' },
  ]
  
  return (
    <div className="grid grid-cols-2 gap-2">
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className={`p-4 rounded-xl border ${cell.color} text-center`}
        >
          <div className="text-xs text-gray-500 mb-1">{cell.label}</div>
          <div className={`text-2xl font-bold ${cell.textColor}`}>{cell.value}</div>
          <div className="text-xs text-gray-600">{((cell.value / total) * 100).toFixed(1)}%</div>
        </div>
      ))}
    </div>
  )
}

// Metric Box Component
function MetricBox({ label, value, description, isGood, icon }) {
  const colorClass = isGood ? 'text-green-400' : isGood === false ? 'text-red-400' : 'text-blue-400'
  const bgClass = isGood ? 'bg-green-500/10 border-green-500/20' : isGood === false ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'
  
  return (
    <div className={`p-4 rounded-xl border ${bgClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {typeof value === 'number' ? value.toFixed(4) : value}
      </div>
      {description && (
        <div className="text-xs text-gray-600 mt-1">{description}</div>
      )}
    </div>
  )
}

function MLPredictionsView({ ticker }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ticker) return
    
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`${API_BASE}/ml-predict?ticker=${ticker}`)
        if (!response.ok) throw new Error('Failed to fetch ML predictions')
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
        <p className="mt-4 text-gray-400">Loading ML predictions...</p>
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
          🤖
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">ML Predictions</h2>
        <p className="text-gray-500 text-center max-w-md text-sm">
          Run analysis on a stock to see ML model predictions.
        </p>
      </div>
    )
  }

  const { evaluation_metrics, latest_prediction, feature_importance, rolling_accuracy, data_info } = data
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            ML Prediction Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            RandomForest classifier trained on {data_info?.train_size?.toLocaleString()} samples
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400">
            Test: {data_info?.test_size?.toLocaleString()} samples
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            {ticker}
          </span>
        </div>
      </div>

      {/* Top Row - Prediction Confidence & Model Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prediction Confidence Gauge */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Next Day Prediction
            </h3>
            <ConfidenceGauge 
              probability={latest_prediction?.prob_up || 0.5}
              prediction={latest_prediction?.prediction || 'unknown'}
            />
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="text-white font-mono">{latest_prediction?.date}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Confidence</span>
                <span className={`font-mono ${latest_prediction?.confidence > 0.6 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {((latest_prediction?.confidence || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Evaluation Metrics Grid */}
        <div className="lg:col-span-2">
          <GlassCard className="p-6" glow>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Model Evaluation Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricBox
                label="Accuracy"
                value={evaluation_metrics?.accuracy}
                description="Overall correct predictions"
                isGood={evaluation_metrics?.accuracy > 0.55}
                icon="🎯"
              />
              <MetricBox
                label="ROC AUC"
                value={evaluation_metrics?.roc_auc}
                description="Discrimination ability"
                isGood={evaluation_metrics?.roc_auc > 0.55}
                icon="📊"
              />
              <MetricBox
                label="Precision (Up)"
                value={evaluation_metrics?.up_prediction?.precision}
                description="True positive rate"
                isGood={evaluation_metrics?.up_prediction?.precision > 0.55}
                icon="✅"
              />
              <MetricBox
                label="Recall (Up)"
                value={evaluation_metrics?.up_prediction?.recall}
                description="Sensitivity"
                isGood={evaluation_metrics?.up_prediction?.recall > 0.55}
                icon="🔍"
              />
            </div>
            
            {/* Confusion Matrix */}
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Confusion Matrix
              </h4>
              <div className="max-w-xs">
                <ConfusionMatrix matrix={evaluation_metrics?.confusion_matrix} />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Middle Row - Rolling Accuracy Chart */}
      <GlassCard className="p-6" glow>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            30-Day Rolling Prediction Accuracy
          </h3>
          <span className="text-xs text-gray-600">
            Current: {((rolling_accuracy?.[rolling_accuracy.length - 1]?.rolling_accuracy || 0) * 100).toFixed(1)}%
          </span>
        </div>
        <RollingAccuracyChart data={rolling_accuracy} />
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500 rounded" />
            <span className="text-gray-500">Rolling Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500 rounded opacity-50" style={{ borderStyle: 'dashed' }} />
            <span className="text-gray-500">50% Baseline</span>
          </div>
        </div>
      </GlassCard>

      {/* Bottom Row - Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Feature Importance Ranking
          </h3>
          <FeatureImportanceChart features={feature_importance} />
        </GlassCard>

        {/* Model Info & Recent Predictions */}
        <GlassCard className="p-6" glow>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Model Information
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-2">Training Period</div>
              <div className="text-sm text-white font-mono">
                {data_info?.train_period?.start} → {data_info?.train_period?.end}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-2">Test Period</div>
              <div className="text-sm text-white font-mono">
                {data_info?.test_period?.start} → {data_info?.test_period?.end}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
              <div className="text-xs text-gray-500 mb-2">Model Type</div>
              <div className="text-sm text-white">
                RandomForest Classifier
              </div>
              <div className="text-xs text-gray-600 mt-1">
                100 estimators, max_depth=5
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-xs text-gray-500">Train Size</div>
                <div className="text-lg font-bold text-blue-400">{data_info?.train_size?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-xs text-gray-500">Test Size</div>
                <div className="text-lg font-bold text-purple-400">{data_info?.test_size?.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}

export default MLPredictionsView
