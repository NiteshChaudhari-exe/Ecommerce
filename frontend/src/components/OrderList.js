import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function OrderList({ token, role }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setOrders(res.data))
      .catch(() => setOrders([]));
  }, [token]);

  if (!token || (role !== 'admin' && role !== 'manager')) return null;

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {orders.map(order => (
        <Grid item xs={12} key={order._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">Order #{order._id}</Typography>
              <Typography variant="body2">User: {order.user?.username || order.user?.email}</Typography>
              <Typography variant="body2">Status: {order.status}</Typography>
              <Typography variant="body2">Total: {'$' + (order.total || 0)}</Typography>
              {/* TODO: Add order details, status update */}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
