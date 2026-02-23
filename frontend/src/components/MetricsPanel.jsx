import MetricCard from './MetricCard'

/**
 * MetricsPanel - Grid of performance metric cards
 * @param {Object} metrics - Performance metrics object
 */
function MetricsPanel({ metrics }) {
  if (!metrics) {
    return null
  }

  const metricConfigs = [
    {
      title: 'Total Return',
      value: metrics.total_return,
      unit: '%',
      icon: '📈',
      description: 'Cumulative strategy return',
    },
    {
      title: 'Annual Return',
      value: metrics.annualized_return,
      unit: '%',
      icon: '📅',
      description: 'Annualized (252 days)',
    },
    {
      title: 'Volatility',
      value: metrics.annualized_volatility,
      unit: '%',
      icon: '📊',
      description: 'Annualized std deviation',
    },
    {
      title: 'Sharpe Ratio',
      value: metrics.sharpe_ratio,
      unit: '',
      icon: '⚖️',
      description: 'Risk-adjusted return',
    },
    {
      title: 'Max Drawdown',
      value: metrics.max_drawdown,
      unit: '%',
      icon: '📉',
      description: 'Largest peak-to-trough',
      inverseColors: true,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metricConfigs.map((config) => (
          <MetricCard
            key={config.title}
            title={config.title}
            value={config.value}
            unit={config.unit}
            icon={config.icon}
            description={config.description}
            inverseColors={config.inverseColors}
          />
        ))}
      </div>

      {/* Summary Bar */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Trading Days:</span>
            <span className="text-blue-400 font-semibold">{metrics.trading_days?.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Risk-Free Rate:</span>
            <span className="text-gray-300 font-semibold">0%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Strategy:</span>
            <span className="text-purple-400 font-semibold">Sentiment-Based</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetricsPanel
