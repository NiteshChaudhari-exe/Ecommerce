import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { Lock, Mail, Person, Visibility, VisibilityOff } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getWishlist, saveWishlist } from '../utils/wishlist';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Auth({ onAuth }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
  });

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // include local wishlist item ids (guest wishlist) to merge on server
      const localWishlist = getWishlist().map((p) => p.id);
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: loginForm.email,
        password: loginForm.password,
        wishlist: localWishlist,
      });

      const { token, user } = response.data;
      // if server returned merged wishlist (array of products), persist locally
      if (response.data.wishlist && Array.isArray(response.data.wishlist)) {
        // map server product objects to local wishlist snapshots
        const snapshots = response.data.wishlist.map((p) => ({ id: p._id || p.id, name: p.name, price: p.price, image: p.imageUrl || p.image, stock: p.stock }));
        saveWishlist(snapshots);
      }
      onAuth(user, token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (registerForm.password !== registerForm.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (registerForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await axios.post(`${API_URL}/auth/register`, {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        role: registerForm.role,
      });

      setSuccess('Registration successful! Please log in.');
      setRegisterForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'employee',
      });

      // Switch to login tab after a short delay
      setTimeout(() => {
        setTab(0);
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Grid container spacing={3}>
          {/* Left side - Info */}
          <Grid item xs={12} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ color: 'white', mb: 4 }}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 'bold', mb: 2, color: 'white' }}
              >
                Premium Store
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Join millions of satisfied customers
              </Typography>
            </Box>
          </Grid>

          {/* Auth Card */}
          <Grid item xs={12}>
            <Paper sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
              {/* Tabs Header */}
              <Box sx={{ bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                <Tabs
                  value={tab}
                  onChange={(_, newValue) => {
                    setTab(newValue);
                    setError('');
                    setSuccess('');
                  }}
                  variant="fullWidth"
                  sx={{
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#667eea',
                      height: 4,
                    },
                  }}
                >
                  <Tab label="Login" icon={<Lock />} iconPosition="start" />
                  <Tab label="Register" icon={<Person />} iconPosition="start" />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ p: 4 }}>
                {/* Login Tab */}
                {tab === 0 && (
                  <form onSubmit={handleLogin}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}
                    >
                      Welcome Back
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#999', mb: 3, textAlign: 'center' }}
                    >
                      Sign in to your account
                    </Typography>

                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      margin="normal"
                      placeholder="your@email.com"
                      InputProps={{
                        startAdornment: (
                          <Mail sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      margin="normal"
                      placeholder="••••••••"
                      InputProps={{
                        startAdornment: (
                          <Lock sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                        endAdornment: (
                          <Button
                            size="small"
                            onClick={() => setShowPassword(!showPassword)}
                            sx={{ color: '#667eea' }}
                          >
                            {showPassword ? <Visibility /> : <VisibilityOff />}
                          </Button>
                        ),
                      }}
                      required
                    />

                    <Box
                      display="flex"
                      justifyContent="space-between"
                      sx={{ my: 2 }}
                    >
                      <Typography variant="body2">
                        <Button
                          size="small"
                          sx={{
                            textTransform: 'none',
                            color: '#667eea',
                            p: 0,
                          }}
                        >
                          Forgot Password?
                        </Button>
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      sx={{
                        bgcolor: '#667eea',
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: 16,
                        '&:hover': { bgcolor: '#764ba2' },
                        mb: 2,
                      }}
                      endIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>

                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                      Don't have an account?{' '}
                      <Button
                        size="small"
                        sx={{
                          textTransform: 'none',
                          color: '#667eea',
                          fontWeight: 'bold',
                        }}
                        onClick={() => setTab(1)}
                      >
                        Sign Up
                      </Button>
                    </Typography>
                  </form>
                )}

                {/* Register Tab */}
                {tab === 1 && (
                  <form onSubmit={handleRegister}>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}
                    >
                      Create Account
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: '#999', mb: 3, textAlign: 'center' }}
                    >
                      Join us and start shopping
                    </Typography>

                    {error && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                      </Alert>
                    )}

                    {success && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={registerForm.username}
                      onChange={handleRegisterChange}
                      margin="normal"
                      placeholder="your username"
                      InputProps={{
                        startAdornment: (
                          <Person sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      margin="normal"
                      placeholder="your@email.com"
                      InputProps={{
                        startAdornment: (
                          <Mail sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      margin="normal"
                      placeholder="••••••••"
                      InputProps={{
                        startAdornment: (
                          <Lock sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      margin="normal"
                      placeholder="••••••••"
                      InputProps={{
                        startAdornment: (
                          <Lock sx={{ mr: 1, color: '#999' }} fontSize="small" />
                        ),
                      }}
                      required
                    />

                    <FormControl fullWidth margin="normal">
                      <InputLabel>Account Type</InputLabel>
                      <Select
                        name="role"
                        value={registerForm.role}
                        onChange={handleRegisterChange}
                        label="Account Type"
                      >
                        <MenuItem value="employee">Customer</MenuItem>
                        <MenuItem value="manager">Manager</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 1 }}>
                      ✓ At least 6 characters
                    </Typography>

                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      sx={{
                        bgcolor: '#667eea',
                        py: 1.5,
                        fontWeight: 'bold',
                        fontSize: 16,
                        '&:hover': { bgcolor: '#764ba2' },
                        my: 2,
                      }}
                      endIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>

                    <Typography variant="body2" sx={{ textAlign: 'center' }}>
                      Already have an account?{' '}
                      <Button
                        size="small"
                        sx={{
                          textTransform: 'none',
                          color: '#667eea',
                          fontWeight: 'bold',
                        }}
                        onClick={() => setTab(0)}
                      >
                        Sign In
                      </Button>
                    </Typography>
                  </form>
                )}
              </Box>
            </Paper>

            {/* Trust Badges */}
            <Box
              sx={{
                mt: 4,
                textAlign: 'center',
                color: 'white',
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                🔒 Secure Login | 🛡️ Your data is protected | ✅ Trusted by thousands
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
