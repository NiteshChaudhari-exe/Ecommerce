import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { LocalShipping, Person, Settings, Logout } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CustomerProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
  });

  useEffect(() => {
    if (activeTab === 0) {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5">Please log in to view your profile</Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        My Account
      </Typography>

      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: '#667eea',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 36,
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {user?.username}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                {user?.email}
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<Logout />}
                onClick={onLogout}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card>
            <Box>
              <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                <Tab label="My Orders" icon={<LocalShipping />} iconPosition="start" />
                <Tab label="Account Settings" icon={<Person />} iconPosition="start" />
              </Tabs>
            </Box>

            <CardContent>
              {/* Orders Tab */}
              {activeTab === 0 && (
                <Box>
                  {loading ? (
                    <Box display="flex" justifyContent="center" sy={{ py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : orders.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" sx={{ color: '#999' }}>
                        You haven't placed any orders yet.
                      </Typography>
                      <Button
                        variant="contained"
                        sx={{ mt: 2, bgcolor: '#667eea' }}
                        onClick={() => navigate('/')}
                      >
                        Start Shopping
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orders.map((order) => (
                            <TableRow key={order._id}>
                              <TableCell>{order._id.slice(-8)}</TableCell>
                              <TableCell>
                                {new Date(order.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: '#667eea' }}>
                                {'$' + order.total.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={order.status}
                                  color={getStatusColor(order.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleOrderClick(order)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Settings Tab */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Account Information
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={profileData.username}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        type="email"
                        value={profileData.email}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone"
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                      />
                    </Grid>
                  </Grid>

                  <Button variant="contained" sx={{ bgcolor: '#667eea', mr: 2 }}>
                    Save Changes
                  </Button>
                  <Button variant="outlined">Cancel</Button>

                  <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'error' }}>
                      Danger Zone
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => alert('Account deletion not implemented yet')}
                    >
                      Delete Account
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Order ID: {selectedOrder._id.slice(-8)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
                {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </Typography>

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Status:
              </Typography>
              <Chip
                label={selectedOrder.status}
                color={getStatusColor(selectedOrder.status)}
                sx={{ mb: 2 }}
              />

              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Items:
              </Typography>
              {selectedOrder.products?.map((product, idx) => (
                <Box key={idx} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Product ID: {product.product}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    Quantity: {product.quantity}
                  </Typography>
                </Box>
              ))}

              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #ddd' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                  Total: {'$' + selectedOrder.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button variant="contained" sx={{ bgcolor: '#667eea' }}>
            Track Order
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerProfile;
