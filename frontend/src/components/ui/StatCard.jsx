import GlassCard from './GlassCard'

function StatCard({ label, value, unit = '', icon, trend, trendValue, color = 'blue' }) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    red: 'from-red-500 to-orange-500',
    purple: 'from-purple-500 to-pink-500',
    yellow: 'from-yellow-500 to-orange-500',
  }

  const isPositive = trend === 'up' || (typeof value === 'number' && value > 0)
  const isNegative = trend === 'down' || (typeof value === 'number' && value < 0)

  return (
    <GlassCard className="p-5" glow>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-white text-sm opacity-80`}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-white'
        }`}>
          {typeof value === 'number' ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500">{unit}</span>
        )}
      </div>

      {trendValue !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${
          isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
        }`}>
          <span>{isPositive ? '↑' : isNegative ? '↓' : '→'}</span>
          <span>{trendValue}</span>
        </div>
      )}

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${colorClasses[color]} opacity-50`} />
    </GlassCard>
  )
}

export default StatCard
