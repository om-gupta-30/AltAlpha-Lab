const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'ml-predictions', label: 'ML Predictions', icon: '🤖' },
  { id: 'optimization', label: 'Optimization Lab', icon: '🔬' },
  { id: 'live-sim', label: 'Live Simulation', icon: '⏱️' },
  { id: 'ai-insights', label: 'AI Insights', icon: '🧠' },
  { id: 'comparison', label: 'Compare Assets', icon: '⚖️' },
]

// Pages accessible without stock confirmation
const UNLOCKED_PAGES = ['dashboard', 'comparison']

function Sidebar({ activeView, setActiveView, collapsed, setCollapsed, onReset, stockConfirmed }) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900/80 backdrop-blur-xl border-r border-gray-800/50 z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Logo - Click to reset */}
      <button
        onClick={onReset}
        className="w-full h-16 flex items-center justify-center border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors duration-200 group"
        title="Reset & Go Home"
      >
        <div className={`flex items-center gap-2 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform duration-200">
            A
          </div>
          {!collapsed && (
            <span className="font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors duration-200">AltAlpha</span>
          )}
        </div>
      </button>

      {/* Navigation */}
      <nav className="py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isLocked = !stockConfirmed && !UNLOCKED_PAGES.includes(item.id)
            const isActive = activeView === item.id
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => !isLocked && setActiveView(item.id)}
                  disabled={isLocked}
                  title={isLocked ? 'Confirm stock & currency first' : item.label}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    isLocked
                      ? 'text-gray-600 cursor-not-allowed opacity-50'
                      : isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-white border border-blue-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <span className={`text-xl ${!isLocked && (isActive ? 'scale-110' : 'group-hover:scale-110')} transition-transform ${isLocked ? 'grayscale' : ''}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                  {isLocked && !collapsed && (
                    <span className="ml-auto text-xs">🔒</span>
                  )}
                  {isActive && !collapsed && !isLocked && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all duration-200 flex items-center justify-center"
      >
        {collapsed ? '→' : '←'}
      </button>
    </aside>
  )
}

export default Sidebar
