
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import {
  Box,
  Typography,
} from '@mui/material';

// Components
import NavBar from './components/NavBar';
import Auth from './components/Auth';
import AdminDashboard from './components/AdminDashboard';

// Pages
import Home from './pages/Home';
import Premium from './pages/Premium';
import About from './pages/About';
import Member from './pages/Member';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import CustomerProfile from './pages/CustomerProfile';
import Wishlist from './pages/Wishlist';
import { ToastProvider } from './components/ToastProvider';

function App() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    updateCartCount();

    // Listen for cart updates from Cart component
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const handleLogin = (userData, token, options = {}) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    // If caller requests no redirect (modal login), skip navigating
    if (options.redirect === false) return;
    navigate(userData.role === 'admin' ? '/admin' : '/');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Enhanced NavBar with role-based routing */}
      <NavBar 
        user={user} 
        onLogout={handleLogout} 
        onAuth={handleLogin}
        cartCount={cartCount}
      />

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/auth"
            element={<Auth onAuth={handleLogin} />}
          />
          <Route path="/premium" element={<Premium user={user} />} />
          <Route path="/about" element={<About />} />
          <Route path="/member" element={<Member />} />
          <Route path="/wishlist" element={<Wishlist />} />

          {/* Customer Routes */}
          {user && user.role !== 'admin' ? (
            <>
              <Route path="/" element={<Home user={user} />} />
              <Route path="/cart" element={<Cart user={user} onCartChange={updateCartCount} />} />
              <Route path="/product/:id" element={<ProductDetail user={user} />} />
              <Route
                path="/checkout"
                element={<Checkout user={user} />}
              />
              <Route
                path="/profile"
                element={
                  <CustomerProfile user={user} onLogout={handleLogout} />
                }
              />
            </>
          ) : user && user.role === 'admin' ? (
            <>
              <Route path="/admin" element={<AdminDashboard token={localStorage.getItem('token')} />} />
              <Route path="/" element={<Home user={user} />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Home user={null} />} />
              <Route path="/auth" element={<Auth onAuth={handleLogin} />} />
            </>
          )}
        </Routes>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          bgcolor: '#333',
          color: 'white',
          py: 4,
          mt: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2025 Premium Store. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Router>
  );
}
