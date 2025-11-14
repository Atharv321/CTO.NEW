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
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { InventoryManager } from './components/InventoryManager';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/inventory"
              element={
                <ProtectedRoute>
                  <InventoryManager />
                </ProtectedRoute>
              }
            />
            
            {/* Admin only routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <p>Admin functionality would go here</p>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Manager routes */}
            <Route
              path="/manager/*"
              element={
                <ProtectedRoute requiredRole="manager">
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Manager Panel</h1>
                    <p>Manager functionality would go here</p>
                  </div>
                </ProtectedRoute>
              }
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;