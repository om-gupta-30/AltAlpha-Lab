import { useState, useEffect } from 'react'
import GlassCard from '../ui/GlassCard'
import { SpinnerGradient } from '../ui/Spinner'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Icon indicators
const SignalIcon = ({ type }) => {
  const icons = {
    positive: { icon: '↗', bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' },
    negative: { icon: '↘', bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' },
    warning: { icon: '⚠', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    neutral: { icon: '→', bg: 'bg-gray-500/20', border: 'border-gray-500/30', text: 'text-gray-400' },
    info: { icon: 'ℹ', bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    success: { icon: '✓', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  }
  const style = icons[type] || icons.neutral
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${style.bg} border ${style.border} ${style.text} text-xs font-bold`}>
      {style.icon}
    </span>
  )
}

// Rating Badge
const RatingBadge = ({ rating }) => {
  const ratingStyles = {
    'STRONG BUY': { bg: 'bg-emerald-500', text: 'text-white', glow: 'shadow-emerald-500/50' },
    'BUY': { bg: 'bg-green-500', text: 'text-white', glow: 'shadow-green-500/50' },
    'HOLD': { bg: 'bg-yellow-500', text: 'text-black', glow: 'shadow-yellow-500/50' },
    'UNDERWEIGHT': { bg: 'bg-orange-500', text: 'text-white', glow: 'shadow-orange-500/50' },
    'AVOID': { bg: 'bg-red-500', text: 'text-white', glow: 'shadow-red-500/50' },
  }
  const style = ratingStyles[rating] || ratingStyles['HOLD']

  return (
    <span className={`px-4 py-2 rounded-lg ${style.bg} ${style.text} font-bold text-sm shadow-lg ${style.glow}`}>
      {rating}
    </span>
  )
}

// Determine signal type from text
const getSignalType = (text) => {
  if (!text || typeof text !== 'string') return 'neutral'
  const lower = text.toLowerCase()
  if (lower.includes('strong') && (lower.includes('performance') || lower.includes('positive') || lower.includes('alpha'))) return 'positive'
  if (lower.includes('outperform') || lower.includes('alpha') || lower.includes('above')) return 'positive'
  if (lower.includes('excellent') || lower.includes('high accuracy') || lower.includes('improving')) return 'positive'
  if (lower.includes('stable') && !lower.includes('unstable')) return 'success'
  if (lower.includes('risk') || lower.includes('drawdown') || lower.includes('volatil')) return 'warning'
  if (lower.includes('underperform') || lower.includes('below') || lower.includes('poor')) return 'negative'
  if (lower.includes('caution') || lower.includes('warning') || lower.includes('concern')) return 'warning'
  if (lower.includes('consider') || lower.includes('recommend') || lower.includes('suggest')) return 'info'
  return 'neutral'
}

// Executive Summary Section
function ExecutiveSummary({ summary, rating }) {
  return (
    <div className="relative">
      {/* Premium Header */}
      <div className="absolute -top-3 left-6">
        <span className="px-3 py-1 bg-gradient-to-r from-amber-600 to-yellow-500 text-black text-xs font-bold rounded-full shadow-lg">
          QUANT RESEARCH NOTE
        </span>
      </div>
      
      <div className="p-8 rounded-2xl bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-amber-500/20 shadow-xl">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Executive Summary
            </h2>
            <p className="text-gray-300 leading-relaxed text-base">
              {summary}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Rating</span>
            <RatingBadge rating={rating} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Section Card Component
function InsightSection({ title, icon, items, accentColor = 'purple' }) {
  const accentStyles = {
    purple: 'from-purple-500/20 to-transparent border-purple-500/30',
    green: 'from-green-500/20 to-transparent border-green-500/30',
    red: 'from-red-500/20 to-transparent border-red-500/30',
    blue: 'from-blue-500/20 to-transparent border-blue-500/30',
    amber: 'from-amber-500/20 to-transparent border-amber-500/30',
  }

  return (
    <div className={`p-6 rounded-xl bg-gradient-to-br ${accentStyles[accentColor]} border backdrop-blur-sm`}>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      <ul className="space-y-3">
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-300 text-sm leading-relaxed">
              <SignalIcon type={getSignalType(item)} />
              <span className="flex-1">{item}</span>
            </li>
          ))
        ) : (
          <li className="text-gray-500 text-sm italic">No insights available</li>
        )}
      </ul>
    </div>
  )
}

// Key Metrics Grid
function KeyMetrics({ performance }) {
  if (!performance) return null

  const metrics = [
    { label: 'Sharpe Ratio', value: performance.sharpe_ratio?.toFixed(2) || 'N/A', positive: performance.sharpe_ratio > 1 },
    { label: 'Total Return', value: `${performance.total_return_pct?.toFixed(1) || 0}%`, positive: performance.total_return_pct > 0 },
    { label: 'Max Drawdown', value: `-${performance.max_drawdown_pct?.toFixed(1) || 0}%`, positive: performance.max_drawdown_pct < 15 },
    { label: 'Win Rate', value: `${performance.win_rate?.toFixed(1) || 0}%`, positive: performance.win_rate > 50 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <div key={index} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{metric.label}</div>
          <div className={`text-2xl font-bold ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
            {metric.value}
          </div>
        </div>
      ))}
    </div>
  )
}

// Volatility Regime Analysis
function VolatilityAnalysis({ analysis }) {
  if (!analysis) return null

  const { high_volatility, low_volatility, insight } = analysis

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">📈</span>
        Volatility Regime Analysis
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <div className="text-xs text-orange-400 uppercase tracking-wider mb-2">High Volatility</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Sharpe</span>
              <span className={`font-mono ${high_volatility?.estimated_sharpe > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {high_volatility?.estimated_sharpe?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Days</span>
              <span className="font-mono text-gray-300">{high_volatility?.days || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Volatility</span>
              <span className="font-mono text-orange-400">{(high_volatility?.avg_volatility * 100)?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="text-xs text-blue-400 uppercase tracking-wider mb-2">Low Volatility</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Est. Sharpe</span>
              <span className={`font-mono ${low_volatility?.estimated_sharpe > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {low_volatility?.estimated_sharpe?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Days</span>
              <span className="font-mono text-gray-300">{low_volatility?.days || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Avg Volatility</span>
              <span className="font-mono text-blue-400">{(low_volatility?.avg_volatility * 100)?.toFixed(1) || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
        <SignalIcon type={getSignalType(insight || '')} />
        <span className="text-sm text-gray-300">{insight || 'Analysis not available'}</span>
      </div>
    </div>
  )
}

// Strategy Analysis Section
function StrategyAnalysis({ analysis }) {
  if (!analysis) return null

  return (
    <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
        <span className="text-2xl">⚙️</span>
        Optimal Strategy Configuration
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-xs text-gray-500 mb-1">Sentiment Threshold</div>
          <div className="text-lg font-bold text-indigo-400 font-mono">
            {analysis.optimal_parameters?.sentiment_threshold?.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-xs text-gray-500 mb-1">Volatility Filter</div>
          <div className="text-lg font-bold text-indigo-400 font-mono">
            {analysis.optimal_parameters?.volatility_filter || 'N/A'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-xs text-gray-500 mb-1">Best Sharpe</div>
          <div className="text-lg font-bold text-green-400 font-mono">
            {analysis.optimal_sharpe?.toFixed(2) || 'N/A'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 text-center">
          <div className="text-xs text-gray-500 mb-1">Stable Regions</div>
          <div className="text-lg font-bold text-amber-400 font-mono">
            {analysis.stable_regions_count || 0}
          </div>
        </div>
      </div>

      {analysis.insights && analysis.insights.length > 0 && (
        <ul className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-gray-300">
              <SignalIcon type={getSignalType(insight)} />
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Report Footer
function ReportFooter({ ticker, generatedAt }) {
  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-black font-bold text-sm">
          AA
        </div>
        <div>
          <div className="text-sm font-semibold text-white">AltAlpha Lab</div>
          <div className="text-xs text-gray-500">Quantitative Research Division</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs text-gray-500">Report for {ticker}</div>
        <div className="text-xs text-gray-600">
          Generated: {new Date(generatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function AIInsightsView({ ticker }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ticker) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE}/ai-report/comprehensive?ticker=${ticker}`)
        if (!response.ok) throw new Error('Failed to fetch AI report')
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
        <p className="mt-4 text-gray-400">Generating AI research report...</p>
        <p className="text-xs text-gray-600 mt-2">Analyzing performance, risk, and model metrics</p>
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
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/20 border border-amber-500/30 flex items-center justify-center text-4xl mb-6">
          🧠
        </div>
        <h2 className="text-xl font-bold text-gray-300 mb-2">AI Quant Insights</h2>
        <p className="text-gray-500 text-center max-w-md text-sm">
          Run analysis on a stock to generate a comprehensive AI research report.
        </p>
      </div>
    )
  }

  const {
    executive_summary,
    performance_summary,
    risk_insights,
    model_insights,
    volatility_regime_analysis,
    strategy_analysis,
    recommendations,
  } = data

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            AI Quant Insights
          </h1>
          <p className="text-gray-500 mt-1">
            AI-generated quantitative research report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
            Premium Research
          </span>
          <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
            {ticker}
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <ExecutiveSummary 
        summary={executive_summary} 
        rating={performance_summary?.rating || 'HOLD'} 
      />

      {/* Key Metrics */}
      <KeyMetrics performance={performance_summary} />

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Summary */}
        <InsightSection
          title="Performance Summary"
          icon="📊"
          items={performance_summary?.insights || []}
          accentColor="green"
        />

        {/* Risk Insights */}
        <InsightSection
          title="Risk Insights"
          icon="⚠️"
          items={risk_insights?.insights || []}
          accentColor="red"
        />

        {/* Model Insights */}
        <InsightSection
          title="Model Insights"
          icon="🤖"
          items={model_insights?.insights || []}
          accentColor="blue"
        />

        {/* Strategy Recommendations */}
        <InsightSection
          title="Strategy Recommendations"
          icon="💡"
          items={recommendations || []}
          accentColor="amber"
        />
      </div>

      {/* Volatility Analysis */}
      <VolatilityAnalysis analysis={volatility_regime_analysis} />

      {/* Strategy Analysis */}
      <StrategyAnalysis analysis={strategy_analysis} />

      {/* Report Footer */}
      <GlassCard className="p-6">
        <ReportFooter ticker={ticker} generatedAt={data.generated_at} />
      </GlassCard>
    </div>
  )
}

export default AIInsightsView
