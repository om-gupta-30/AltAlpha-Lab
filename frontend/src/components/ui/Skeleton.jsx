// Skeleton Components for Loading States

// Base skeleton with shimmer animation
function SkeletonBase({ className = '', children }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      {children}
    </div>
  )
}

// Text line skeleton
function SkeletonText({ width = 'w-full', height = 'h-4' }) {
  return (
    <SkeletonBase className={`${width} ${height} rounded bg-gray-800/50`} />
  )
}

// Circle skeleton (for avatars, icons)
function SkeletonCircle({ size = 'w-10 h-10' }) {
  return (
    <SkeletonBase className={`${size} rounded-full bg-gray-800/50`} />
  )
}

// Card skeleton
function SkeletonCard({ className = '' }) {
  return (
    <div className={`p-5 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <SkeletonText width="w-20" height="h-3" />
          <SkeletonText width="w-12" height="h-2" />
        </div>
        <SkeletonBase className="w-9 h-9 rounded-xl bg-gray-800/50" />
      </div>
      <SkeletonText width="w-24" height="h-8" />
      <div className="mt-4">
        <SkeletonBase className="w-20 h-6 rounded bg-gray-800/50" />
      </div>
    </div>
  )
}

// Metric card skeleton
function SkeletonMetricCard() {
  return (
    <div className="p-5 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1.5">
          <SkeletonBase className="w-20 h-3 rounded bg-gray-800/60" />
          <SkeletonBase className="w-16 h-2 rounded bg-gray-800/40" />
        </div>
        <SkeletonBase className="w-9 h-9 rounded-xl bg-gray-800/60" />
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <SkeletonBase className="w-20 h-8 rounded bg-gray-800/60" />
        <SkeletonBase className="w-6 h-4 rounded bg-gray-800/40" />
      </div>
      <SkeletonBase className="w-20 h-6 rounded bg-gray-800/50" />
    </div>
  )
}

// Chart skeleton
function SkeletonChart({ height = 'h-80' }) {
  return (
    <div className={`p-6 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 ${height}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <SkeletonText width="w-32" height="h-5" />
        <SkeletonText width="w-20" height="h-4" />
      </div>
      
      {/* Chart area */}
      <div className="relative h-[calc(100%-3rem)] flex items-end gap-1">
        {/* Fake bars/lines */}
        {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 55].map((h, i) => (
          <SkeletonBase
            key={i}
            className="flex-1 rounded-t bg-gray-800/50"
            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

// Insight panel skeleton
function SkeletonInsightPanel() {
  return (
    <div className="p-6 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <SkeletonBase className="w-10 h-10 rounded-xl bg-gray-800/60" />
        <div className="space-y-2">
          <SkeletonText width="w-24" height="h-5" />
          <SkeletonText width="w-32" height="h-3" />
        </div>
      </div>
      
      {/* Insight cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/30"
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="flex items-start gap-3">
              <SkeletonBase className="w-8 h-8 rounded-lg bg-gray-800/50" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <SkeletonText width="w-32" height="h-4" />
                  <SkeletonBase className="w-16 h-5 rounded-full bg-gray-800/50" />
                </div>
                <SkeletonText width="w-full" height="h-3" />
                <SkeletonText width="w-3/4" height="h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Table skeleton
function SkeletonTable({ rows = 5 }) {
  return (
    <div className="p-6 rounded-2xl bg-gray-900/40 backdrop-blur-xl border border-gray-800/50">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-gray-800/50 mb-4">
        <SkeletonText width="w-24" height="h-4" />
        <SkeletonText width="w-20" height="h-4" />
        <SkeletonText width="w-28" height="h-4" />
        <SkeletonText width="w-20" height="h-4" />
      </div>
      
      {/* Rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 py-2" style={{ animationDelay: `${i * 100}ms` }}>
            <SkeletonText width="w-24" height="h-4" />
            <SkeletonText width="w-20" height="h-4" />
            <SkeletonText width="w-28" height="h-4" />
            <SkeletonText width="w-20" height="h-4" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Full dashboard skeleton
function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* AI Insights */}
      <SkeletonInsightPanel />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}

export {
  SkeletonBase,
  SkeletonText,
  SkeletonCircle,
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonChart,
  SkeletonInsightPanel,
  SkeletonTable,
  SkeletonDashboard,
}
