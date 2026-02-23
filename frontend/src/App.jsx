import Dashboard from './components/Dashboard'
import { CurrencyProvider } from './context/CurrencyContext'

function App() {
  return (
    <CurrencyProvider>
      <Dashboard />
    </CurrencyProvider>
  )
}

export default App
