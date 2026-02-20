import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

// Use empty string for relative URLs when running in Docker (nginx proxy handles /api)
// Use localhost:8000 for local development
const API_URL = process.env.REACT_APP_API_URL || (window.location.port === '3000' ? '' : 'http://localhost:8000');

// Add global styles for glassmorphism
const globalStyles = document.createElement('style');
globalStyles.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    transition: background 0.3s ease;
  }
  
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(200, 200, 220, 0.1);
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(102, 126, 234, 0.3);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(102, 126, 234, 0.5);
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(globalStyles);

function App() {
  const [merchant, setMerchant] = React.useState(() => {
    const saved = localStorage.getItem('merchant');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (merchantData) => {
    setMerchant(merchantData);
    localStorage.setItem('merchant', JSON.stringify(merchantData));
  };

  const handleLogout = () => {
    setMerchant(null);
    localStorage.removeItem('merchant');
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              merchant ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} apiUrl={API_URL} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              merchant ? <Dashboard merchant={merchant} onLogout={handleLogout} apiUrl={API_URL} /> : <Navigate to="/login" />
            } 
          />
          <Route 
            path="/dashboard/transactions" 
            element={
              merchant ? <Transactions merchant={merchant} onLogout={handleLogout} apiUrl={API_URL} /> : <Navigate to="/login" />
            } 
          />
          <Route path="*" element={<Navigate to={merchant ? "/dashboard" : "/login"} />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
