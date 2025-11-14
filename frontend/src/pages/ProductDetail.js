import React, { useState } from 'react';
import {
  Container,
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  Rating,
  Tabs,
  Tab,
  TextField,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite as FavoriteIcon,
  Share,
  LocalShipping,
  Shield,
  Replay,
  CheckCircle,
} from '@mui/icons-material';
import { isInWishlist, toggleWishlist } from '../utils/wishlist';
import { useLocation, useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ProductDetail = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const product = location.state?.product || {};
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState(0);
  const showToast = useToast();
  const [reviews] = useState([
    { user: 'John Doe', rating: 5, comment: 'Great product!' },
    { user: 'Jane Smith', rating: 4, comment: 'Very good quality' },
  ]);

  const handleAddToCart = () => {
    const doAdd = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItem = cart.find((item) => item.id === product._id);
      if (existingItem) existingItem.quantity += quantity;
      else
        cart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          quantity,
          stock: product.stock,
        });
      localStorage.setItem('cart', JSON.stringify(cart));
      showToast(`${quantity} ${product.name}(s) added to cart!`, 'success');
      navigate('/cart');
    };

    if (user) {
      doAdd();
    } else if (window && typeof window.requireLogin === 'function') {
      window.requireLogin(doAdd);
    } else {
      navigate('/auth');
    }
  };

  const [inWishlist, setInWishlist] = useState(isInWishlist(product._id));

  const handleToggleWishlist = () => {
    const toggled = toggleWishlist({ id: product._id, name: product.name, price: product.price, image: product.imageUrl, stock: product.stock });
    setInWishlist(toggled);
    // If logged in, sync with backend
    const token = localStorage.getItem('token');
    if (token) {
      (async () => {
        try {
          if (toggled) {
            await axios.post(`${API_URL}/users/wishlist`, { items: [product._id] }, { headers: { Authorization: `Bearer ${token}` } });
          } else {
            await axios.delete(`${API_URL}/users/wishlist/${product._id}`, { headers: { Authorization: `Bearer ${token}` } });
          }
        } catch (err) {
          console.error('Wishlist sync error', err?.response?.data || err.message);
        }
      })();
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  const averageRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>Home</span>
        {' / '}
        {product.category || 'Products'}{' / '}
        {product.name}
      </Typography>

      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Box component="img" src={product.imageUrl || 'https://via.placeholder.com/400x400'} alt={product.name} sx={{ width: '100%', height: 'auto', borderRadius: 1 }} />
              <Box display="flex" gap={1} sx={{ mt: 2 }}>
                <Button variant={inWishlist ? 'contained' : 'outlined'} startIcon={<FavoriteIcon color={inWishlist ? 'error' : 'inherit'} />} onClick={handleToggleWishlist}>{inWishlist ? 'In Wishlist' : 'Wishlist'}</Button>
                <Button variant="outlined" startIcon={<Share />} onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Product link copied to clipboard', 'info'); }}>Share</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{product.name}</Typography>
          <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
            <Rating value={Number(averageRating)} readOnly />
            <Typography variant="body2" sx={{ color: '#666' }}>{reviews.length} reviews</Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Box display="flex" alignItems="baseline" gap={2}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>{'$' + (product.price?.toFixed(2) || '0.00')}</Typography>
              <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#999' }}>{'$' + ((product.price || 0) * 1.2).toFixed(2)}</Typography>
              <Chip label="20% OFF" color="error" />
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            {product.stock > 0 ? (
              <Chip icon={<CheckCircle />} label={`In Stock (${product.stock} available)`} color="success" variant="outlined" />
            ) : (
              <Chip label="Out of Stock" color="error" variant="outlined" />
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Description</Typography>
          <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>{product.description}</Typography>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Quantity</Typography>
            <Box display="flex" gap={2} alignItems="center" sx={{ mb: 3 }}>
              <Button onClick={() => setQuantity(Math.max(1, quantity - 1))} sx={{ color: '#667eea' }}>−</Button>
              <TextField type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} inputProps={{ min: 1, max: product.stock, style: { textAlign: 'center', width: 60 } }} variant="standard" />
              <Button onClick={() => setQuantity(Math.min(product.stock || 100, quantity + 1))} sx={{ color: '#667eea' }}>+</Button>
            </Box>

            <Box display="flex" gap={2}>
              <Button fullWidth variant="contained" size="large" startIcon={<ShoppingCart />} disabled={product.stock === 0} onClick={handleAddToCart} sx={{ bgcolor: '#667eea', py: 1.5, '&:hover': { bgcolor: '#764ba2' } }}>Add to Cart</Button>
              <Button fullWidth variant="outlined" size="large" onClick={handleBuyNow} disabled={product.stock === 0}>Buy Now</Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Why Choose This Product?</Typography>
            <List dense>
              {[
                { icon: LocalShipping, text: 'Free shipping on orders over $50' },
                { icon: Replay, text: '30-day money-back guarantee' },
                { icon: Shield, text: 'Secure checkout with SSL encryption' },
              ].map((item, idx) => (
                <ListItem key={idx} disableGutters>
                  <ListItemIcon sx={{ minWidth: 32 }}><item.icon sx={{ fontSize: 20, color: '#667eea' }} /></ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ variant: 'body2' }} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3 }}>
          <Tab label="Product Details" />
          <Tab label="Specifications" />
          <Tab label="Customer Reviews" />
        </Tabs>

        {tab === 0 && (
          <Box sx={{ bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ lineHeight: 2 }}>{product.description}</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Key Features:</Typography>
              <ul>
                <li>Premium quality materials</li>
                <li>Eco-friendly production</li>
                <li>Warranty included</li>
                <li>Fast shipping available</li>
              </ul>
            </Box>
          </Box>
        )}

        {tab === 1 && (
          <Box sx={{ bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              {[{ label: 'Category', value: product.category }, { label: 'Stock', value: product.stock }, { label: 'Price', value: `$${product.price}` }].map((spec, idx) => (
                <Grid item xs={12} sm={6} key={idx}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{spec.label}</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>{spec.value}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tab === 2 && (
          <Box sx={{ bgcolor: '#f9f9f9', p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Customer Reviews ({reviews.length})</Typography>
            {reviews.map((review, idx) => (
              <Card key={idx} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{review.user}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                  </Box>
                  <Typography variant="body2">{review.comment}</Typography>
                </CardContent>
              </Card>
            ))}

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Write a Review</Typography>
                <TextField fullWidth multiline rows={4} placeholder="Share your experience with this product..." sx={{ mb: 2 }} />
                <Button variant="contained" sx={{ bgcolor: '#667eea' }}>Submit Review</Button>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ProductDetail;
