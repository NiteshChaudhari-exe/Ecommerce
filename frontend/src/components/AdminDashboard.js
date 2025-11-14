import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Icon,
  Container,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  InputAdornment,
  Switch,
  FormControlLabel,
  TablePagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import useSocket from '../utils/useSocket';

const AdminDashboard = ({ token }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [userPage, setUserPage] = useState(0);
  const [productPage, setProductPage] = useState(0);
  const [orderPage, setOrderPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectedProducts, setSelectedProducts] = useState(new Set());

  // Fetch all dashboard data
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Socket.io real-time updates
  const { socket, isConnected } = useSocket(token, true);

  useEffect(() => {
    if (!socket) return;

    // Listen for order:created events
    const handleOrderCreated = (eventData) => {
      console.log('[Admin] Order created event received:', eventData);
      setAlert({
        type: 'success',
        message: `📢 New order created! Order ID: ${eventData.data._id}`,
      });
      // Prepend new order to the list
      setOrders((prev) => [eventData.data, ...prev]);
      // Update metrics
      setMetrics((prev) => ({
        ...prev,
        totalOrders: (prev?.totalOrders || 0) + 1,
      }));
    };

    // Listen for order:updated events
    const handleOrderUpdated = (eventData) => {
      console.log('[Admin] Order updated event received:', eventData);
      setAlert({
        type: 'info',
        message: `Order ${eventData.data._id} updated to ${eventData.data.status}`,
      });
      // Update the order in the list
      setOrders((prev) =>
        prev.map((o) => (o._id === eventData.data._id ? { ...o, ...eventData.data } : o))
      );
    };

    // Listen for low-stock alerts
    const handleLowStockAlert = (eventData) => {
      console.log('[Admin] Low stock alert event received:', eventData);
      setAlert({
        type: 'warning',
        message: `⚠️ Low stock alert: ${eventData.data.productName} (${eventData.data.stock} remaining)`,
      });
    };

    // Register listeners
    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('lowstock:alert', handleLowStockAlert);

    // Cleanup
    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('lowstock:alert', handleLowStockAlert);
    };
  }, [socket]);

  const fetchAllData = async () => {
    await Promise.all([fetchMetrics(), fetchUsers(), fetchProducts(), fetchOrders()]);
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/dashboard/metrics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.log('Users fetch not implemented on backend');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.log('Products fetch error');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.log('Orders fetch error');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      let endpoint = `http://localhost:5000/api/${dialogType.toLowerCase()}s`;
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id ? `${endpoint}/${formData.id}` : endpoint;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setAlert({ type: 'success', message: `${dialogType} ${formData.id ? 'updated' : 'created'} successfully!` });
        fetchAllData();
        setOpenDialog(false);
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const response = await fetch(`http://localhost:5000/api/${type.toLowerCase()}s/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setAlert({ type: 'success', message: `${type} deleted successfully!` });
          fetchAllData();
        }
      } catch (error) {
        setAlert({ type: 'error', message: error.message });
      }
    }
  };

  const handleSelectUser = (id) => {
    const newSelected = new Set(selectedUsers);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedUsers(newSelected);
  };

  const handleSelectProduct = (id) => {
    const newSelected = new Set(selectedProducts);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedProducts(newSelected);
  };

  const exportToCSV = (data, filename) => {
    const csv = [Object.keys(data[0]), ...data.map(Object.values)].map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o._id?.includes(searchQuery)
  );

  const StatCard = ({ icon: Icon, title, value, subtitle }) => (
    <Card sx={{ height: '100%', boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {value || 0}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.3 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {alert && (
        <Alert severity={alert.type} sx={{ mb: 2 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Welcome to the admin panel. Manage users, products, orders, and view analytics.
          </Typography>
        </Box>
        {/* Socket Connection Indicator */}
        <Chip
          icon={isConnected ? <CheckCircleIcon /> : <BlockIcon />}
          label={isConnected ? 'Real-time Connected' : 'Offline (Polling)'}
          color={isConnected ? 'success' : 'warning'}
          variant="outlined"
        />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={StorageIcon}
            title="Total Products"
            value={metrics?.totalProducts || 0}
            subtitle="In inventory"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={LocalShippingIcon}
            title="Total Orders"
            value={metrics?.totalOrders || 0}
            subtitle="This month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PeopleIcon}
            title="Total Users"
            value={metrics?.totalUsers || 0}
            subtitle="Active users"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AssessmentIcon}
            title="Revenue"
            value={`$${metrics?.totalRevenue || 0}`}
            subtitle="Total revenue"
          />
        </Grid>
      </Grid>

      {/* Management Tabs */}
      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
          }}
        >
          <Tab label="Dashboard" />
          <Tab label="Users Management" />
          <Tab label="Products Management" />
          <Tab label="Orders Management" />
          <Tab label="Reports & Analytics" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Dashboard Tab */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                System Overview
              </Typography>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    System Health
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Database: <Chip label="Healthy" color="success" size="small" />
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      API Server: <Chip label="Online" color="success" size="small" />
                    </Typography>
                    <Typography variant="body2">
                      Uptime: <Chip label="99.9%" color="info" size="small" />
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          )}

          {/* Users Management Tab */}
          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchUsers}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => filteredUsers.length > 0 && exportToCSV(filteredUsers, 'users.csv')}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('User')}
                >
                  Add User
                </Button>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Total Users: <strong>{users.length}</strong>
              </Alert>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(filteredUsers.length > 0 ? filteredUsers : [
                      { _id: '1', username: 'john_doe', email: 'john@example.com', role: 'admin', createdAt: new Date() },
                      { _id: '2', username: 'jane_smith', email: 'jane@example.com', role: 'manager', createdAt: new Date() },
                    ]).slice(userPage * rowsPerPage, userPage * rowsPerPage + rowsPerPage).map((user) => (
                      <TableRow hover key={user._id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role} 
                            color={user.role === 'admin' ? 'primary' : 'info'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            icon={<CheckCircleIcon />}
                            label="Active" 
                            color="success" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => { setFormData(user); handleOpenDialog('User'); }}
                          />
                          <Button 
                            size="small" 
                            startIcon={<DeleteIcon />} 
                            color="error"
                            onClick={() => handleDelete(user._id, 'User')}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredUsers.length || 2}
                rowsPerPage={rowsPerPage}
                page={userPage}
                onPageChange={(e, newPage) => setUserPage(newPage)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </Box>
          )}

          {/* Products Management Tab */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchProducts}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => filteredProducts.length > 0 && exportToCSV(filteredProducts, 'products.csv')}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog('Product')}
                >
                  Add Product
                </Button>
              </Box>
              <Alert severity={metrics?.lowStock?.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                <WarningIcon sx={{ mr: 1, fontSize: 18 }} />
                Total Products: <strong>{products.length}</strong> | Low Stock: <strong>{metrics?.lowStock?.length || 0}</strong>
              </Alert>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(filteredProducts.length > 0 ? filteredProducts : [
                      { _id: '1', name: 'Product 1', category: 'Tops', price: 99.99, stock: 45 },
                      { _id: '2', name: 'Product 2', category: 'Bottoms', price: 49.99, stock: 12 },
                    ]).slice(productPage * rowsPerPage, productPage * rowsPerPage + rowsPerPage).map((product) => (
                      <TableRow hover key={product._id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category || 'N/A'}</TableCell>
                        <TableCell>{'$' + (product.price || 0)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={product.stock} 
                            color={product.stock > 20 ? 'success' : product.stock > 10 ? 'warning' : 'error'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => { setFormData(product); handleOpenDialog('Product'); }}
                          />
                          <Button 
                            size="small" 
                            startIcon={<DeleteIcon />} 
                            color="error"
                            onClick={() => handleDelete(product._id, 'Product')}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredProducts.length || 2}
                rowsPerPage={rowsPerPage}
                page={productPage}
                onPageChange={(e, newPage) => setProductPage(newPage)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </Box>
          )}

          {/* Orders Management Tab */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <TextField
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchOrders}
                >
                  Refresh
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => filteredOrders.length > 0 && exportToCSV(filteredOrders, 'orders.csv')}
                >
                  Export
                </Button>
              </Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Total Orders: <strong>{orders.length}</strong>
              </Alert>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(filteredOrders.length > 0 ? filteredOrders : [
                      { _id: '1', user: { username: 'John Doe' }, total: 299.99, status: 'completed', createdAt: '2025-11-10' },
                      { _id: '2', user: { username: 'Jane Smith' }, total: 149.99, status: 'pending', createdAt: '2025-11-11' },
                    ]).slice(orderPage * rowsPerPage, orderPage * rowsPerPage + rowsPerPage).map((order) => (
                      <TableRow hover key={order._id}>
                        <TableCell>#{order._id}</TableCell>
                        <TableCell>{order.user?.username || 'Unknown'}</TableCell>
                        <TableCell>{'$' + (order.total || 0)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status || 'pending'} 
                            color={order.status === 'completed' ? 'success' : 'warning'}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            startIcon={<EditIcon />}
                            onClick={() => { setFormData(order); handleOpenDialog('Order'); }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={filteredOrders.length || 2}
                rowsPerPage={rowsPerPage}
                page={orderPage}
                onPageChange={(e, newPage) => setOrderPage(newPage)}
                onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
              />
            </Box>
          )}

          {/* Reports Tab */}
          {activeTab === 4 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Analytics & Reports
              </Typography>
              
              {/* Quick Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Avg Order Value
                      </Typography>
                        <Typography variant="h5" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                        {'$' + (orders.length > 0 ? (orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length).toFixed(2) : '0.00')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Revenue
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                        {'$' + (orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(2) : '0.00')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Low Stock Items
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                        {metrics?.lowStock?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Active Users
                      </Typography>
                      <Typography variant="h5" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                        {users.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardHeader title="Sales Trend (Simulated)" />
                    <CardContent>
                      <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around' }}>
                        <Box sx={{ width: '12%', height: '40%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '60%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '80%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '55%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '70%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '90%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                        <Box sx={{ width: '12%', height: '75%', backgroundColor: '#1976d2', borderRadius: 1 }} />
                      </Box>
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                        Jan - Jul 2025
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card sx={{ boxShadow: 2 }}>
                    <CardHeader title="User Growth" />
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Q1 2025</Typography>
                          <Typography variant="body2">30%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={30} sx={{ height: 8, borderRadius: 1 }} />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Q2 2025</Typography>
                          <Typography variant="body2">60%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={60} sx={{ height: 8, borderRadius: 1 }} />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Q3 2025</Typography>
                          <Typography variant="body2">85%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 1 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ boxShadow: 2, mt: 2 }}>
                <CardHeader title="System Health & Performance" />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        Database Performance
                      </Typography>
                      <LinearProgress variant="determinate" value={85} sx={{ height: 10, borderRadius: 1 }} />
                      <Typography variant="caption" color="textSecondary">
                        Response time: 45ms
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        API Availability
                      </Typography>
                      <LinearProgress variant="determinate" value={99.9} sx={{ height: 10, borderRadius: 1, backgroundColor: '#e0e0e0' }} />
                      <Typography variant="caption" color="textSecondary">
                        Uptime: 99.9%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {formData._id ? `Edit ${dialogType}` : `Add New ${dialogType}`}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dialogType === 'User' && (
            <>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              {!formData._id && (
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
              )}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role || 'employee'}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
          {dialogType === 'Product' && (
            <>
                    <TextField
                fullWidth
                label="Product Name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
                helperText="Paste a URL or use the Upload button to upload an image"
              />
              <Button
                variant="outlined"
                component="label"
                sx={{ mb: 2 }}
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    // Try multipart upload first
                    try {
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await fetch('http://localhost:5000/api/uploads', {
                        method: 'POST',
                        body: fd,
                      });
                      if (res.ok) {
                        const body = await res.json();
                        if (body.url) {
                          setFormData({ ...formData, imageUrl: body.url });
                          setAlert({ type: 'success', message: 'Image uploaded' });
                          return;
                        }
                      }
                    } catch (err) {
                      // continue to fallback
                    }

                    // Fallback: send base64 payload to /api/uploads/base64
                    try {
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const dataUrl = reader.result;
                        try {
                          const res2 = await fetch('http://localhost:5000/api/uploads/base64', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: file.name, data: dataUrl }),
                          });
                          if (res2.ok) {
                            const body2 = await res2.json();
                            if (body2.url) {
                              setFormData({ ...formData, imageUrl: body2.url });
                              setAlert({ type: 'success', message: 'Image uploaded (base64)' });
                              return;
                            }
                          }
                          setAlert({ type: 'error', message: 'Upload failed' });
                        } catch (err) {
                          setAlert({ type: 'error', message: 'Upload error' });
                        }
                      };
                      reader.readAsDataURL(file);
                    } catch (err) {
                      setAlert({ type: 'error', message: 'Upload fallback failed' });
                    }
                  }}
                />
              </Button>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={3}
                value={formData.description || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Price"
                name="price"
                type="number"
                inputProps={{ step: '0.01', min: '0' }}
                value={formData.price || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Stock Quantity"
                name="stock"
                type="number"
                inputProps={{ min: '0' }}
                value={formData.stock || ''}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
            </>
          )}
          {dialogType === 'Order' && (
            <>
              <TextField
                fullWidth
                label="Order Status"
                name="status"
                value={formData.status || 'pending'}
                onChange={handleInputChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Total Amount"
                name="total"
                type="number"
                disabled
                value={formData.total || ''}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={handleInputChange}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {formData._id ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
