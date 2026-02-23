import { useMemo, useState, useEffect } from 'react'
import { useCurrency } from '../../context/CurrencyContext'
import GlassCard from '../ui/GlassCard'
import MetricCard from '../ui/MetricCard'
import PriceChart from '../PriceChart'
import SentimentChart from '../SentimentChart'
import PortfolioChart from '../PortfolioChart'
import DrawdownChart from '../DrawdownChart'
import ComparisonChart from '../ComparisonChart'
import RollingSharpeChart from '../RollingSharpeChart'
import ChartCard from '../ChartCard'
import AIInsightPanel from '../insights/AIInsightPanel'
import { SkeletonMetricCard, SkeletonChart, SkeletonInsightPanel } from '../ui/Skeleton'
import { SpinnerGradient, SpinnerDots } from '../ui/Spinner'

function DashboardView({ backtest, metrics, features, strategy, loading, params }) {
  // Currency formatting
  const { format: formatCurrency } = useCurrency()

  // Generate sparkline data from backtest results
  const sparklineData = useMemo(() => {
    if (!backtest?.data) return {}
    
    const data = backtest.data
    const sampleRate = Math.max(1, Math.floor(data.length / 30))
    
    // Portfolio values for return sparkline
    const portfolioValues = data
      .filter((_, i) => i % sampleRate === 0)
      .map(d => d.portfolio_value)
    
    // Strategy returns for sharpe sparkline
    const strategyReturns = data
      .filter((_, i) => i % sampleRate === 0)
      .map(d => d.strategy_returns || 0)
    
    // Cumulative returns for total return sparkline
    let cumReturn = 0
    const cumReturns = data
      .filter((_, i) => i % sampleRate === 0)
      .map(d => {
        cumReturn += (d.strategy_returns || 0)
        return cumReturn
      })
    
    // Calculate rolling volatility for vol sparkline
    const volatilities = []
    for (let i = 0; i < strategyReturns.length; i++) {
      const window = strategyReturns.slice(Math.max(0, i - 10), i + 1)
      const mean = window.reduce((a, b) => a + b, 0) / window.length
      const variance = window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / window.length
      volatilities.push(Math.sqrt(variance) * Math.sqrt(252) * 100)
    }
    
    // Calculate drawdowns for max dd sparkline
    let peak = portfolioValues[0] || 0
    const drawdowns = portfolioValues.map(val => {
      peak = Math.max(peak, val)
      return ((peak - val) / peak) * 100
    })
    
    return {
      totalReturn: cumReturns,
      annualReturn: cumReturns,
      volatility: volatilities,
      sharpe: strategyReturns.map((r, i) => {
        const slice = strategyReturns.slice(Math.max(0, i - 10), i + 1)
        const mean = slice.reduce((a, b) => a + b, 0) / slice.length
        const std = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length)
        return std > 0 ? (mean / std) * Math.sqrt(252) : 0
      }),
      maxDrawdown: drawdowns,
    }
  }, [backtest])
  if (loading) {
    return <LoadingState />
  }

  if (!metrics || !backtest || !features) {
    return <EmptyState />
  }

  return (
    <div className="space-y-6">
      {/* Top Stats Row - Enhanced Metric Cards with staggered fade in */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Return", value: metrics.total_return, unit: "%", icon: "📈", 
            isGood: metrics.total_return >= 0, sparkline: sparklineData.totalReturn,
            description: "Cumulative P&L", prefix: metrics.total_return >= 0 ? '+' : '' },
          { label: "Annual Return", value: metrics.annualized_return, unit: "%", icon: "📅",
            isGood: metrics.annualized_return >= 0, sparkline: sparklineData.annualReturn,
            description: "Annualized (252 days)", prefix: metrics.annualized_return >= 0 ? '+' : '' },
          { label: "Volatility", value: metrics.annualized_volatility, unit: "%", icon: "📊",
            isGood: metrics.annualized_volatility < 25, sparkline: sparklineData.volatility,
            description: "Risk measure", prefix: '' },
          { label: "Sharpe Ratio", value: metrics.sharpe_ratio, unit: "", icon: "⚖️",
            isGood: metrics.sharpe_ratio >= 0, sparkline: sparklineData.sharpe,
            description: "Risk-adjusted", prefix: '', decimals: 3 },
          { label: "Max Drawdown", value: Math.abs(metrics.max_drawdown), unit: "%", icon: "📉",
            isGood: Math.abs(metrics.max_drawdown) < 15, sparkline: sparklineData.maxDrawdown,
            description: "Peak to trough", prefix: '-' },
        ].map((card, i) => (
          <div 
            key={card.label} 
            className="animate-fadeInUp"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <MetricCard
              label={card.label}
              value={card.value}
              unit={card.unit}
              icon={card.icon}
              isGood={card.isGood}
              sparklineData={card.sparkline}
              description={card.description}
              prefix={card.prefix}
              decimals={card.decimals || 2}
            />
          </div>
        ))}
      </div>

      {/* AI Insights Panel - Fade in */}
      <div className="animate-fadeInUp" style={{ animationDelay: '400ms' }}>
        <AIInsightPanel metrics={metrics} backtest={backtest} />
      </div>

      {/* Main Charts Grid - Staggered fade in */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-scaleFadeIn" style={{ animationDelay: '500ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <PriceChart 
              title="Price & Signals" 
              data={features?.data} 
              strategyData={strategy?.data}
            />
          </GlassCard>
        </div>

        <div className="animate-scaleFadeIn" style={{ animationDelay: '600ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <PortfolioChart
              title="Equity Curve"
              data={backtest?.data}
              initialCapital={backtest?.initial_capital}
            />
          </GlassCard>
        </div>

        <div className="animate-scaleFadeIn" style={{ animationDelay: '700ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <SentimentChart title="Market Sentiment" data={features?.data} />
          </GlassCard>
        </div>

        <div className="animate-scaleFadeIn" style={{ animationDelay: '800ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <ChartCard
              title="Strategy Returns"
              data={backtest?.data}
              dataKey="strategy_returns"
              color="#8b5cf6"
              showZeroLine
            />
          </GlassCard>
        </div>

        {/* Comparison Chart - Full Width */}
        <div className="lg:col-span-2 animate-scaleFadeIn" style={{ animationDelay: '900ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <ComparisonChart
              title="Strategy vs Market"
              data={backtest?.data}
            />
          </GlassCard>
        </div>

        {/* Drawdown Chart */}
        <div className="animate-scaleFadeIn" style={{ animationDelay: '1000ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <DrawdownChart
              title="Portfolio Drawdown"
              data={backtest?.data}
            />
          </GlassCard>
        </div>

        {/* Rolling Sharpe Chart */}
        <div className="animate-scaleFadeIn" style={{ animationDelay: '1100ms' }}>
          <GlassCard className="p-0 overflow-hidden" glow>
            <RollingSharpeChart
              title="Rolling Sharpe Ratio"
              data={backtest?.data}
              window={30}
            />
          </GlassCard>
        </div>
      </div>

      {/* Bottom Summary */}
      <div className="animate-fadeInUp" style={{ animationDelay: '1200ms' }}>
      <GlassCard className="p-6" glow>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Portfolio Summary</h3>
          <div className="flex items-center gap-3">
            {params && (
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-medium">
                Threshold: {params.sentimentThreshold}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
              {backtest?.count?.toLocaleString()} data points
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <SummaryItem
            icon="💵"
            label="Initial Capital"
            value={formatCurrency(backtest?.initial_capital || 0)}
          />
          <SummaryItem
            icon="🏦"
            label="Final Value"
            value={formatCurrency(backtest?.final_value || 0)}
            positive={backtest?.final_value >= backtest?.initial_capital}
          />
          <SummaryItem
            icon={backtest?.total_return_pct >= 0 ? '📈' : '📉'}
            label="P&L"
            value={`${backtest?.total_return_pct >= 0 ? '+' : ''}${backtest?.total_return_pct}%`}
            positive={backtest?.total_return_pct >= 0}
          />
          <SummaryItem
            icon="📅"
            label="Trading Days"
            value={metrics?.trading_days?.toLocaleString()}
            neutral
          />
        </div>

        {/* P&L Progress Bar */}
        <div className="mt-6 pt-6 border-t border-gray-800/50">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-500">Performance</span>
            <span className={`font-semibold ${backtest?.total_return_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {backtest?.total_return_pct >= 0 ? '+' : ''}
              {formatCurrency((backtest?.final_value || 0) - (backtest?.initial_capital || 0))}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                backtest?.total_return_pct >= 0
                  ? 'bg-gradient-to-r from-green-600 to-emerald-400'
                  : 'bg-gradient-to-r from-red-600 to-orange-400'
              }`}
              style={{ width: `${Math.min(100, Math.abs(backtest?.total_return_pct || 0) * 2)}%` }}
            />
          </div>
        </div>
      </GlassCard>
      </div>
    </div>
  )
}

function SummaryItem({ icon, label, value, positive, neutral }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-xl">
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${
        neutral ? 'text-blue-400' : positive ? 'text-green-400' : positive === false ? 'text-red-400' : 'text-white'
      }`}>
        {value}
      </p>
    </div>
  )
}

function LoadingState() {
  const [loadingText, setLoadingText] = useState('Fetching market data')
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const texts = [
      'Fetching market data',
      'Calculating returns',
      'Analyzing sentiment',
      'Computing metrics',
      'Generating insights'
    ]
    let index = 0
    const interval = setInterval(() => {
      index = (index + 1) % texts.length
      setLoadingText(texts[index])
      setProgress(prev => Math.min(prev + 20, 95))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Loading Header */}
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <SpinnerGradient size="w-16 h-16" />
          </div>
          <p className="text-lg font-medium text-white mb-2">{loadingText}...</p>
          <div className="flex items-center justify-center gap-2">
            <SpinnerDots color="bg-blue-500" />
          </div>
          {/* Progress bar */}
          <div className="mt-4 w-48 mx-auto">
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ animationDelay: `${i * 100}ms` }} className="animate-fadeIn">
            <SkeletonMetricCard />
          </div>
        ))}
      </div>

      {/* Skeleton AI Insights */}
      <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
        <SkeletonInsightPanel />
      </div>

      {/* Skeleton Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ animationDelay: `${400 + i * 100}ms` }} className="animate-fadeIn">
            <SkeletonChart />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-20 h-20 rounded-2xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center text-4xl mb-6">
        🔬
      </div>
      <h2 className="text-xl font-bold text-gray-300 mb-2">Ready to Analyze</h2>
      <p className="text-gray-500 text-center max-w-md mb-4 text-sm">
        Select a stock from the sidebar or enter any ticker symbol and click Run.
      </p>
      <p className="text-gray-600 text-center max-w-lg text-xs">
        Supports all stocks, ETFs, indices, and crypto available on Yahoo Finance - 
        including NYSE, NASDAQ, LSE, TSX, ASX, NSE, BSE, and 50+ global exchanges.
      </p>
    </div>
  )
}

export default DashboardView
