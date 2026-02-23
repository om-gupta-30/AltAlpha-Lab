import { useMemo } from 'react'
import GlassCard from '../ui/GlassCard'

// Insight generators based on metrics
function generateInsights(metrics, backtest) {
  if (!metrics || !backtest) return []

  const insights = []
  
  // 1. Overall Performance vs Market
  const totalReturn = parseFloat(metrics.total_return) || 0
  const marketReturn = calculateMarketReturn(backtest.data)
  const alpha = totalReturn - marketReturn
  
  if (alpha > 10) {
    insights.push({
      type: 'success',
      icon: '🚀',
      title: 'Strong Outperformance',
      text: `Strategy outperformed the market by ${alpha.toFixed(1)}%. Exceptional alpha generation.`,
      highlight: `+${alpha.toFixed(1)}% Alpha`
    })
  } else if (alpha > 5) {
    insights.push({
      type: 'success',
      icon: '📈',
      title: 'Market Outperformance',
      text: `Strategy beat the market by ${alpha.toFixed(1)}%. Solid relative performance.`,
      highlight: `+${alpha.toFixed(1)}% Alpha`
    })
  } else if (alpha > 0) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      title: 'Slight Outperformance',
      text: `Strategy marginally outperformed the market by ${alpha.toFixed(1)}%.`,
      highlight: `+${alpha.toFixed(1)}% Alpha`
    })
  } else if (alpha > -5) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Slight Underperformance',
      text: `Strategy underperformed the market by ${Math.abs(alpha).toFixed(1)}%. Consider parameter adjustments.`,
      highlight: `${alpha.toFixed(1)}% Alpha`
    })
  } else {
    insights.push({
      type: 'danger',
      icon: '🔴',
      title: 'Significant Underperformance',
      text: `Strategy lagged the market by ${Math.abs(alpha).toFixed(1)}%. Strategy review recommended.`,
      highlight: `${alpha.toFixed(1)}% Alpha`
    })
  }

  // 2. Sharpe Ratio Analysis
  const sharpe = parseFloat(metrics.sharpe_ratio) || 0
  
  if (sharpe >= 2) {
    insights.push({
      type: 'success',
      icon: '⚖️',
      title: 'Excellent Risk-Adjusted Returns',
      text: `Sharpe ratio of ${sharpe.toFixed(2)} indicates exceptional risk-adjusted performance. Top-tier strategy.`,
      highlight: `Sharpe ${sharpe.toFixed(2)}`
    })
  } else if (sharpe >= 1) {
    insights.push({
      type: 'success',
      icon: '✅',
      title: 'Strong Risk-Adjusted Returns',
      text: `Sharpe ratio of ${sharpe.toFixed(2)} shows good risk-adjusted returns. Strategy is compensating well for risk taken.`,
      highlight: `Sharpe ${sharpe.toFixed(2)}`
    })
  } else if (sharpe >= 0.5) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      title: 'Moderate Risk-Adjusted Returns',
      text: `Sharpe ratio of ${sharpe.toFixed(2)} is acceptable but could be improved with better risk management.`,
      highlight: `Sharpe ${sharpe.toFixed(2)}`
    })
  } else if (sharpe >= 0) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Weak Risk-Adjusted Returns',
      text: `Sharpe ratio of ${sharpe.toFixed(2)} suggests returns barely compensate for risk. Consider reducing position sizes.`,
      highlight: `Sharpe ${sharpe.toFixed(2)}`
    })
  } else {
    insights.push({
      type: 'danger',
      icon: '🚨',
      title: 'Negative Risk-Adjusted Returns',
      text: `Negative Sharpe ratio indicates strategy is destroying value on a risk-adjusted basis.`,
      highlight: `Sharpe ${sharpe.toFixed(2)}`
    })
  }

  // 3. Drawdown Analysis
  const maxDD = Math.abs(parseFloat(metrics.max_drawdown)) || 0
  
  if (maxDD < 10) {
    insights.push({
      type: 'success',
      icon: '🛡️',
      title: 'Low Maximum Drawdown',
      text: `Peak drawdown of ${maxDD.toFixed(1)}% shows excellent capital preservation. Risk management is effective.`,
      highlight: `${maxDD.toFixed(1)}% Max DD`
    })
  } else if (maxDD < 20) {
    insights.push({
      type: 'neutral',
      icon: '📉',
      title: 'Moderate Drawdown',
      text: `Maximum drawdown of ${maxDD.toFixed(1)}% is within acceptable range for most strategies.`,
      highlight: `${maxDD.toFixed(1)}% Max DD`
    })
  } else if (maxDD < 30) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: 'Elevated Drawdown',
      text: `Drawdown of ${maxDD.toFixed(1)}% may be uncomfortable for risk-averse investors. Consider tighter stops.`,
      highlight: `${maxDD.toFixed(1)}% Max DD`
    })
  } else {
    insights.push({
      type: 'danger',
      icon: '🔻',
      title: 'High Drawdown Risk',
      text: `Severe drawdown of ${maxDD.toFixed(1)}% indicates significant capital at risk. Strategy needs risk controls.`,
      highlight: `${maxDD.toFixed(1)}% Max DD`
    })
  }

  // 4. Volatility Analysis
  const volatility = parseFloat(metrics.annualized_volatility) || 0
  
  if (volatility < 15) {
    insights.push({
      type: 'success',
      icon: '😌',
      title: 'Low Volatility Profile',
      text: `Annualized volatility of ${volatility.toFixed(1)}% suggests a smoother equity curve with fewer large swings.`,
      highlight: `${volatility.toFixed(1)}% Vol`
    })
  } else if (volatility < 25) {
    insights.push({
      type: 'neutral',
      icon: '📊',
      title: 'Moderate Volatility',
      text: `Volatility of ${volatility.toFixed(1)}% is typical for equity-based strategies.`,
      highlight: `${volatility.toFixed(1)}% Vol`
    })
  } else if (volatility < 40) {
    insights.push({
      type: 'warning',
      icon: '🎢',
      title: 'High Volatility',
      text: `Volatility of ${volatility.toFixed(1)}% means expect significant daily swings. Not suitable for low-risk portfolios.`,
      highlight: `${volatility.toFixed(1)}% Vol`
    })
  } else {
    insights.push({
      type: 'danger',
      icon: '⚡',
      title: 'Extreme Volatility',
      text: `Very high volatility of ${volatility.toFixed(1)}% indicates aggressive strategy. Size positions carefully.`,
      highlight: `${volatility.toFixed(1)}% Vol`
    })
  }

  // 5. Consistency Analysis (based on return patterns)
  const consistency = analyzeConsistency(backtest.data)
  
  if (consistency.winRate > 55) {
    insights.push({
      type: 'success',
      icon: '🎯',
      title: 'Consistent Performance',
      text: `Strategy shows ${consistency.winRate.toFixed(0)}% positive days. Reliable and consistent pattern.`,
      highlight: `${consistency.winRate.toFixed(0)}% Win Rate`
    })
  } else if (consistency.winRate > 48) {
    insights.push({
      type: 'neutral',
      icon: '📅',
      title: 'Average Consistency',
      text: `Win rate of ${consistency.winRate.toFixed(0)}% is near market average. Performance driven by win magnitude.`,
      highlight: `${consistency.winRate.toFixed(0)}% Win Rate`
    })
  } else {
    insights.push({
      type: 'warning',
      icon: '🎲',
      title: 'Lower Consistency',
      text: `Win rate of ${consistency.winRate.toFixed(0)}% relies on large winners to offset frequent small losses.`,
      highlight: `${consistency.winRate.toFixed(0)}% Win Rate`
    })
  }

  // 6. Overall Summary
  const successCount = insights.filter(i => i.type === 'success').length
  const dangerCount = insights.filter(i => i.type === 'danger').length
  
  let overallSummary
  if (successCount >= 4) {
    overallSummary = {
      type: 'success',
      icon: '🏆',
      title: 'Strategy Assessment: Strong',
      text: 'Overall, this strategy demonstrates strong characteristics across multiple dimensions. Well-suited for live deployment.',
      highlight: 'Strong'
    }
  } else if (successCount >= 2 && dangerCount === 0) {
    overallSummary = {
      type: 'neutral',
      icon: '👍',
      title: 'Strategy Assessment: Acceptable',
      text: 'Strategy shows decent performance with room for improvement. Consider parameter optimization.',
      highlight: 'Acceptable'
    }
  } else if (dangerCount >= 2) {
    overallSummary = {
      type: 'danger',
      icon: '⛔',
      title: 'Strategy Assessment: Needs Work',
      text: 'Multiple risk factors detected. Strategy requires significant improvements before deployment.',
      highlight: 'Needs Work'
    }
  } else {
    overallSummary = {
      type: 'warning',
      icon: '🔍',
      title: 'Strategy Assessment: Mixed',
      text: 'Strategy shows mixed signals. Further analysis and testing recommended.',
      highlight: 'Mixed'
    }
  }
  
  insights.unshift(overallSummary)

  return insights
}

// Helper: Calculate market buy-and-hold return
function calculateMarketReturn(data) {
  if (!data || data.length < 2) return 0
  
  let cumReturn = 0
  data.forEach(d => {
    cumReturn = (1 + cumReturn / 100) * (1 + (d.market_returns || 0)) * 100 - 100
  })
  
  return cumReturn
}

// Helper: Analyze consistency
function analyzeConsistency(data) {
  if (!data || data.length === 0) return { winRate: 50 }
  
  const positivedays = data.filter(d => (d.strategy_returns || 0) > 0).length
  const winRate = (positivedays / data.length) * 100
  
  return { winRate }
}

// Insight Card Component
function InsightCard({ insight, index }) {
  const typeStyles = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      highlight: 'bg-green-500/20 text-green-400',
      glow: 'shadow-green-500/10',
    },
    neutral: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      highlight: 'bg-blue-500/20 text-blue-400',
      glow: 'shadow-blue-500/10',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      highlight: 'bg-yellow-500/20 text-yellow-400',
      glow: 'shadow-yellow-500/10',
    },
    danger: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      highlight: 'bg-red-500/20 text-red-400',
      glow: 'shadow-red-500/10',
    },
  }

  const style = typeStyles[insight.type] || typeStyles.neutral

  return (
    <div
      className={`
        p-4 rounded-xl border transition-all duration-300
        ${style.bg} ${style.border}
        hover:shadow-lg ${style.glow}
        animate-fadeIn
      `}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold text-white text-sm">{insight.title}</h4>
            {insight.highlight && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${style.highlight}`}>
                {insight.highlight}
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{insight.text}</p>
        </div>
      </div>
    </div>
  )
}

// Main AI Insight Panel
function AIInsightPanel({ metrics, backtest }) {
  const insights = useMemo(() => {
    return generateInsights(metrics, backtest)
  }, [metrics, backtest])

  if (!metrics || !backtest) {
    return (
      <GlassCard className="p-6" glow>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Insights</h3>
            <p className="text-xs text-gray-500">Automated strategy analysis</p>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>Run analysis to generate insights</p>
        </div>
      </GlassCard>
    )
  }

  // Summary stats
  const successCount = insights.filter(i => i.type === 'success').length
  const warningCount = insights.filter(i => i.type === 'warning').length
  const dangerCount = insights.filter(i => i.type === 'danger').length

  return (
    <GlassCard className="p-6" glow>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl animate-pulse">
            🤖
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">AI Insights</h3>
            <p className="text-xs text-gray-500">Automated strategy analysis</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-2">
          {successCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-400 text-xs font-medium">
              {successCount} ✓
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-medium">
              {warningCount} ⚠
            </span>
          )}
          {dangerCount > 0 && (
            <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium">
              {dangerCount} ✗
            </span>
          )}
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <InsightCard key={index} insight={insight} index={index} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-800/50 flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Generated from {backtest?.count?.toLocaleString() || 0} data points
        </span>
        <span className="text-xs text-gray-600">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </GlassCard>
  )
}

export default AIInsightPanel
