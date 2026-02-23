import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

function ChartCard({ title, data, dataKey, color = '#10b981', yAxisDomain, showZeroLine = false }) {
  if (!data || data.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  // Sample data for performance (show every nth point)
  const sampleRate = Math.max(1, Math.floor(data.length / 200))
  const sampledData = data.filter((_, i) => i % sampleRate === 0)

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sampledData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`
              }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickLine={{ stroke: '#4b5563' }}
              axisLine={{ stroke: '#4b5563' }}
              domain={yAxisDomain || ['auto', 'auto']}
              tickFormatter={(value) => 
                typeof value === 'number' 
                  ? value >= 1000 
                    ? `${(value / 1000).toFixed(1)}k` 
                    : value.toFixed(4)
                  : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(55, 65, 81, 0.5)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: color }}
            />
            {showZeroLine && (
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
            )}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: color, stroke: '#1f2937', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartCard
