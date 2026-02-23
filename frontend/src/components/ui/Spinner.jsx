// Animated Spinner Components

// Classic spinning circle
function SpinnerCircle({ size = 'w-8 h-8', color = 'border-blue-500' }) {
  return (
    <div className={`${size} relative`}>
      <div className={`absolute inset-0 rounded-full border-2 border-gray-800`} />
      <div className={`absolute inset-0 rounded-full border-2 ${color} border-t-transparent animate-spin`} />
    </div>
  )
}

// Double ring spinner
function SpinnerRings({ size = 'w-10 h-10' }) {
  return (
    <div className={`${size} relative`}>
      <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      <div 
        className="absolute inset-1 rounded-full border-2 border-cyan-500/30 border-b-cyan-500 animate-spin" 
        style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
      />
    </div>
  )
}

// Pulsing dots
function SpinnerDots({ color = 'bg-blue-500' }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${color} animate-bounce`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

// Bars spinner
function SpinnerBars({ color = 'bg-blue-500' }) {
  return (
    <div className="flex items-end gap-1 h-6">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 ${color} rounded-full animate-pulse`}
          style={{ 
            height: `${60 + Math.sin(i) * 40}%`,
            animationDelay: `${i * 100}ms`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  )
}

// Gradient ring spinner
function SpinnerGradient({ size = 'w-12 h-12' }) {
  return (
    <div className={`${size} relative`}>
      <svg className="animate-spin" viewBox="0 0 50 50">
        <defs>
          <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#spinner-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="80 200"
        />
      </svg>
    </div>
  )
}

// Orbit spinner
function SpinnerOrbit({ size = 'w-10 h-10' }) {
  return (
    <div className={`${size} relative`}>
      <div className="absolute inset-0 rounded-full border border-gray-700" />
      <div 
        className="absolute w-2 h-2 bg-blue-500 rounded-full animate-orbit"
        style={{ top: '-4px', left: '50%', marginLeft: '-4px' }}
      />
      <div 
        className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full animate-orbit"
        style={{ top: '-3px', left: '50%', marginLeft: '-3px', animationDelay: '0.5s', animationDuration: '1.5s' }}
      />
    </div>
  )
}

// Data loading indicator
function SpinnerData() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 rounded-lg border-2 border-gray-700" />
        <div className="absolute inset-0 rounded-lg border-2 border-blue-500 border-t-transparent animate-spin" />
        <div className="absolute inset-2 rounded bg-blue-500/20 animate-pulse" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 bg-blue-500 rounded-full animate-pulse"
              style={{ 
                height: `${8 + i * 4}px`,
                animationDelay: `${i * 100}ms` 
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Full-page loading overlay
function LoadingOverlay({ message = 'Loading...', submessage = '' }) {
  return (
    <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <SpinnerGradient size="w-16 h-16" />
        <p className="mt-6 text-white font-medium text-lg">{message}</p>
        {submessage && (
          <p className="mt-2 text-gray-400 text-sm">{submessage}</p>
        )}
      </div>
    </div>
  )
}

// Inline loading state
function LoadingInline({ text = 'Loading' }) {
  return (
    <div className="flex items-center gap-3 text-gray-400">
      <SpinnerCircle size="w-5 h-5" color="border-gray-400" />
      <span className="text-sm">{text}</span>
    </div>
  )
}

// Button loading state
function LoadingButton({ size = 'w-5 h-5' }) {
  return (
    <svg className={`animate-spin ${size}`} viewBox="0 0 24 24" fill="none">
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4" 
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
      />
    </svg>
  )
}

export {
  SpinnerCircle,
  SpinnerRings,
  SpinnerDots,
  SpinnerBars,
  SpinnerGradient,
  SpinnerOrbit,
  SpinnerData,
  LoadingOverlay,
  LoadingInline,
  LoadingButton,
}
