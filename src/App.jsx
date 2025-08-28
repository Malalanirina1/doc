import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardAssistant from './pages/DashboardAssistant';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un utilisateur est déjà connecté
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erreur de parsing utilisateur:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Protection des routes
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="App w-full h-full">
          <Routes>
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to={user.role === 'admin' ? '/admin' : '/assistant'} replace />
                ) : (
                  <Login setUser={setUser} />
                )
              } 
            />
            
            <Route 
              path="/register" 
              element={<Register />} 
            />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <DashboardAdmin user={user} setUser={setUser} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/assistant" 
              element={
                <ProtectedRoute requiredRole="assistant">
                  <DashboardAssistant user={user} setUser={setUser} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to={user.role === 'admin' ? '/admin' : '/assistant'} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* Route pour toutes les autres URLs */}
            <Route 
              path="*" 
              element={
                <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/assistant') : '/login'} replace />
              } 
            />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
