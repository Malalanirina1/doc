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

  // Déterminer la base URL selon l'environnement
  const basename = import.meta.env.MODE === 'production' ? '/docfront' : '';
  
  // Log pour debug
  console.log('🔧 Mode:', import.meta.env.MODE, '| Basename:', basename);
  
  // Fonction de déconnexion
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <ToastProvider>
      <Router basename={basename}>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/assistant'} replace /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/assistant'} replace /> : <Login setUser={setUser} />} />
            <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/assistant'} replace /> : <Register />} />
            
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
                  <DashboardAssistant user={user} setUser={setUser} onLogout={handleLogout} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ToastProvider>
  );
}

export default App;
