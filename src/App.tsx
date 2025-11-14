import { useState } from 'react'
import { InventoryManager } from './components/InventoryManager'
import { Dashboard } from './components/Dashboard'
import './styles/App.css'
import './styles/Navigation.css'

function App() {
  const [currentView, setCurrentView] = useState<'inventory' | 'dashboard'>('inventory')

  return (
    <div className="app">
      <nav className="navigation">
        <div className="navigation__brand">
          <h1>Inventory System</h1>
        </div>
        <div className="navigation__menu">
          <button
            className={`navigation__item ${currentView === 'inventory' ? 'navigation__item--active' : ''}`}
            onClick={() => setCurrentView('inventory')}
          >
            📦 Inventory
          </button>
          <button
            className={`navigation__item ${currentView === 'dashboard' ? 'navigation__item--active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'inventory' ? <InventoryManager /> : <Dashboard />}
      </main>
    </div>
  )
}

export default App
