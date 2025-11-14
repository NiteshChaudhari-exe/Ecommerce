import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardContent, CardActions, Button, Box, CircularProgress } from '@mui/material';
import { getWishlist, removeFromWishlist } from '../utils/wishlist';
import axios from 'axios';
import { useToast } from '../components/ToastProvider';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
import { ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const load = async () => {
      setLoading(true);
      if (token) {
        try {
          const resp = await axios.get(`${API_URL}/users/wishlist`, { headers: { Authorization: `Bearer ${token}` } });
          const list = (resp.data.wishlist || []).map((p) => ({ id: p._id || p.id, name: p.name, price: p.price, image: p.imageUrl || p.image, stock: p.stock }));
          setItems(list);
          setLoading(false);
          return;
        } catch (err) {
          // fallback to local
          console.error('Could not fetch server wishlist', err?.response?.data || err.message);
        }
      }
      setItems(getWishlist());
      setLoading(false);
    };
    load();
  }, []);

  const handleRemove = (id) => {
    const token = localStorage.getItem('token');
    // Optimistic update: remove locally first
    const prev = items;
    setItems((prevList) => prevList.filter((p) => p.id !== id));
    if (!token) {
      removeFromWishlist(id);
      showToast('Removed from wishlist', 'info');
      return;
    }

    // attempt server delete
    axios
      .delete(`${API_URL}/users/wishlist/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Removed from wishlist', 'info');
      })
      .catch((err) => {
        // rollback local state
        console.error('Failed to remove from server wishlist', err?.response?.data || err?.message);
        setItems(prev);
        showToast('Could not remove from wishlist (server error). Please try again.', 'error');
      });
  };

  const handleMoveToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((c) => c.id === item.id);
    if (existing) existing.quantity += 1;
    else cart.push({ id: item.id, name: item.name, price: item.price, image: item.image, quantity: 1, stock: item.stock || 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    // Optimistic: remove from wishlist locally first
    const prev = items;
    setItems((prevList) => prevList.filter((p) => p.id !== item.id));
    const token = localStorage.getItem('token');
    if (!token) {
      removeFromWishlist(item.id);
      showToast('Moved to cart', 'success');
      navigate('/cart');
      return;
    }

    axios
      .delete(`${API_URL}/users/wishlist/${item.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        showToast('Moved to cart', 'success');
        navigate('/cart');
      })
      .catch((err) => {
        // rollback wishlist removal but keep item in cart
        console.error('Failed to remove from server wishlist', err?.response?.data || err?.message);
        setItems(prev);
        showToast('Moved to cart, but failed to update server wishlist. Please try again.', 'warning');
        navigate('/cart');
      });
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!items.length) {
    return (
      <Container sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>Your Wishlist</Typography>
          <Box sx={{ fontSize: 80, mb: 2 }}>💖</Box>
          <Typography variant="body2" sx={{ color: '#666' }}>Your wishlist is empty. Add some favorites to see them here.</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Your Wishlist</Typography>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card>
              <CardContent>
                <Box component="img" src={item.image || 'https://via.placeholder.com/300'} alt={item.name} sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>{item.name}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>{'$' + (item.price?.toFixed(2) || '0.00')}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" variant="outlined" onClick={() => handleRemove(item.id)}>Remove</Button>
                <Button size="small" variant="contained" startIcon={<ShoppingCart />} onClick={() => handleMoveToCart(item)}>Move to Cart</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Wishlist;
