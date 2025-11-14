/**
 * Enhanced Navigation Bar Component
 * 
 * Features:
 * - Role-based menu (employee, manager, admin, guest)
 * - Responsive desktop/mobile layouts
 * - User profile indicator
 * - Cart badge
 * - Quick action buttons
 * - Breadcrumb-style navigation hints
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Dialog,
  DialogContent,
} from '@mui/material';
import {
  ShoppingCart,
  Home as HomeIcon,
  Info as InfoIcon,
  Dashboard,
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Favorite as FavoriteIcon,
  ShoppingBag as ShoppingBagIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';

import Auth from './Auth';

const NavBar = ({ user, onLogout, onAuth, cartCount = 0 }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const pendingLoginCallback = useRef(null);

  // Expose a small global helper so other parts of the app can request login UI
  // If a component wants to require login before an action it can call
  // `window.requireLogin(fn)` or `window.showLoginModal()` to navigate to /auth
  useEffect(() => {
    // Open the in-place login modal
    window.showLoginModal = () => {
      setLoginModalOpen(true);
    };

    // Require login: if logged in, run callback; otherwise open modal and queue callback
    window.requireLogin = (callback) => {
      const hasUser = Boolean(localStorage.getItem('token') || (window && window.__APP_USER__));
      if (hasUser) {
        if (typeof callback === 'function') callback();
      } else {
        pendingLoginCallback.current = typeof callback === 'function' ? callback : null;
        setLoginModalOpen(true);
      }
    };

    // reflect current user for other scripts
    if (user) {
      window.__APP_USER__ = true;
    } else {
      try {
        delete window.__APP_USER__;
      } catch (e) {}
    }

    return () => {
      try {
        delete window.showLoginModal;
        delete window.requireLogin;
        delete window.__APP_USER__;
      } catch (e) {
        // ignore
      }
    };
  }, [navigate, user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (e) => {
    setProfileMenuAnchor(e.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNavClick = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    onLogout();
  };

  const handleModalAuth = (userData, token) => {
    // propagate to parent App
    if (typeof onAuth === 'function') onAuth(userData, token, { redirect: false });
    setLoginModalOpen(false);
    // run any queued callback (e.g., add-to-cart)
    if (pendingLoginCallback.current) {
      try {
        pendingLoginCallback.current();
      } catch (e) {
        // ignore callback errors
      }
      pendingLoginCallback.current = null;
    }
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    // Always include About in the center nav
    const baseItems = [
      { label: 'Home', icon: HomeIcon, path: '/' },
      { label: 'Member', icon: ShoppingBagIcon, path: '/member' },
      { label: 'About', icon: InfoIcon, path: '/about' },
    ];

    if (!user) {
      return baseItems;
    }

    if (user.role === 'employee' || user.role === 'customer') {
      return [
        ...baseItems,
        { label: 'Wishlist', icon: FavoriteIcon, path: '/wishlist' },
      ];
    }

    if (user.role === 'manager') {
      return [
        ...baseItems,
        { label: 'Orders', icon: ShoppingBagIcon, path: '/orders' },
        { label: 'Reports', icon: BarChartIcon, path: '/reporting' },
      ];
    }

    if (user.role === 'admin') {
      return [
        { label: 'Dashboard', icon: Dashboard, path: '/admin' },
        { label: 'Products', icon: InventoryIcon, path: '/products' },
        { label: 'Orders', icon: ShoppingBagIcon, path: '/orders' },
        { label: 'Reports', icon: BarChartIcon, path: '/reporting' },
        { label: 'Settings', icon: SettingsIcon, path: '/settings' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  // Desktop menu
  const desktopNav = (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center' }}>
      {navItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          startIcon={<item.icon />}
          onClick={() => handleNavClick(item.path)}
          sx={{
            textTransform: 'none',
            fontSize: '0.95rem',
            backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );

  // Mobile drawer menu
  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      sx={{ width: 280 }}
    >
      <Box
        sx={{
          width: 280,
          pt: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            🛍️ Menu
          </Typography>
          <IconButton onClick={handleDrawerToggle} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        {user && (
          <>
            <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32 }}>
                {user.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {user.username}
                </Typography>
                <Chip
                  label={user.role}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </Box>
            <Divider />
          </>
        )}

        <List sx={{ flex: 1 }}>
          {navItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                selected={location.pathname === item.path}
                sx={{
                  backgroundColor: location.pathname === item.path ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                }}
              >
                <ListItemIcon sx={{ color: '#667eea' }}>
                  <item.icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider />

        {user ? (
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ color: '#667eea', borderColor: '#667eea' }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setLoginModalOpen(true)}
              >
                Login
              </Button>
            </Box>
        )}
      </Box>
    </Drawer>
  );

  return (
    <AppBar
      position="sticky"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Toolbar>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '1.25rem' }}>
            🛍️ Premium Store
          </Typography>
        </Link>

        {/* Desktop Navigation - Centered */}
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          {desktopNav}
        </Box>

        {/* Right Side Actions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {/* Cart Icon (visible only for logged-in non-admin users) */}
          {user && user.role !== 'admin' ? (
            <Tooltip title="Shopping Cart">
              <IconButton
                color="inherit"
                onClick={() => navigate('/cart')}
                sx={{ display: { xs: 'flex', md: 'flex' } }}
              >
                <Badge badgeContent={cartCount} color="error">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            </Tooltip>
          ) : null}

          {/* User Profile Menu */}
          {user ? (
            <>
              <Tooltip title={user.username}>
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{
                    p: 0,
                    display: { xs: 'none', sm: 'flex' },
                    ml: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#f0f0f0',
                      color: '#667eea',
                      fontWeight: 'bold',
                    }}
                  >
                    {user.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem disabled sx={{ pointerEvents: 'none' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {user.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'gray' }}>
                      {user.email}
                    </Typography>
                  </Box>
                </MenuItem>

                <Divider />

                {user.role !== 'admin' && (
                  <MenuItem
                    onClick={() => {
                      handleNavClick('/profile');
                      handleProfileMenuClose();
                    }}
                  >
                    <PersonIcon sx={{ mr: 1 }} />
                    My Profile
                  </MenuItem>
                )}

                {user.role === 'admin' && (
                  <>
                    <MenuItem
                      onClick={() => {
                        handleNavClick('/admin');
                        handleProfileMenuClose();
                      }}
                    >
                      <Dashboard sx={{ mr: 1 }} />
                      Admin Dashboard
                    </MenuItem>
                    <Divider />
                  </>
                )}

                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
            ) : (
              <Button
                color="inherit"
                variant="text"
                onClick={() => setLoginModalOpen(true)}
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              >
                Login
              </Button>
            )}

          {/* Mobile Menu Toggle */}
          <IconButton
            color="inherit"
            onClick={handleDrawerToggle}
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

          {/* Mobile Drawer */}
          {mobileDrawer}

          {/* Login Modal (in-place) */}
          <Dialog open={loginModalOpen} onClose={() => setLoginModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogContent sx={{ p: 0 }}>
              {/* Reuse Auth component inside modal; onAuth will be handled via handleModalAuth */}
              <Auth onAuth={handleModalAuth} />
            </DialogContent>
          </Dialog>
    </AppBar>
  );
};

export default NavBar;
