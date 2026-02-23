function GlassCard({ children, className = '', glow = false, hover = true }) {
  return (
    <div
      className={`
        relative bg-gray-900/40 backdrop-blur-xl rounded-2xl 
        border border-gray-800/50 
        ${hover ? 'hover:border-gray-700/50 hover:bg-gray-900/50 transition-all duration-300' : ''}
        ${glow ? 'shadow-lg shadow-blue-500/5' : ''}
        ${className}
      `}
    >
      {/* Inner glow effect */}
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
      )}
      <div className="relative">{children}</div>
    </div>
  )
}

export default GlassCard
