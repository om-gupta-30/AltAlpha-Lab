import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

function MainLayout({ children, ticker, setTicker, loading, activeView, setActiveView, onReset, resetKey, stockConfirmed, setStockConfirmed }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen dark">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onReset={onReset}
        stockConfirmed={stockConfirmed}
      />

      {/* Header */}
      <Header
        key={resetKey}
        ticker={ticker}
        setTicker={setTicker}
        loading={loading}
        sidebarCollapsed={sidebarCollapsed}
        activeView={activeView}
        onReset={onReset}
        stockConfirmed={stockConfirmed}
        setStockConfirmed={setStockConfirmed}
      />

      {/* Main Content */}
      <main
        className={`relative pt-16 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'pl-16' : 'pl-56'
        }`}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}

export default MainLayout
