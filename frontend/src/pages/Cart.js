import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import { Delete as DeleteIcon, Add, Remove, ShoppingCartCheckout } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cart = ({ user }) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedCart = cartItems.map((item) =>
      item.id === itemId
        ? { ...item, quantity: Math.min(newQuantity, item.stock) }
        : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const removeItem = (itemId) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const applyPromoCode = () => {
    // Simple promo code logic
    const promoCodes = {
      SAVE10: 0.1,
      SAVE20: 0.2,
      WELCOME5: 0.05,
    };

    if (promoCodes[promoCode.toUpperCase()]) {
      setDiscount(promoCodes[promoCode.toUpperCase()]);
      alert('Promo code applied successfully!');
    } else {
      alert('Invalid promo code');
      setDiscount(0);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = subtotal * discount;
  const tax = (subtotal - discountAmount) * 0.1;
  const total = subtotal - discountAmount + tax;

  const handleCheckout = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/checkout', { state: { cartItems, subtotal, discount, tax, total } });
  };

  if (cartItems.length === 0) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 2, color: '#999' }}>
            Your cart is empty
          </Typography>
          <Button
            variant="contained"
            sx={{ bgcolor: '#667eea' }}
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Shopping Cart ({cartItems.length} items)
      </Typography>

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Price
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Quantity
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Total
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#f9f9f9' } }}>
                    <TableCell>
                      <Box display="flex" gap={2} alignItems="center">
                        <Box
                          component="img"
                          src={item.image || 'https://via.placeholder.com/80x80'}
                          sx={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                        <Box>
                          <Typography sx={{ fontWeight: 'bold' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#999' }}>
                            Stock: {item.stock}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold', color: '#667eea' }}>
                        {'$' + item.price.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Remove sx={{ fontSize: 18 }} />
                        </IconButton>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, Number(e.target.value))
                          }
                          inputProps={{ min: 1, max: item.stock, style: { width: 50 } }}
                          size="small"
                        />
                        <IconButton
                          size="small"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Add sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 'bold' }}>
                        {'$' + (item.price * item.quantity).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => removeItem(item.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </Button>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Promo Code */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Promo Code
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button variant="outlined" onClick={applyPromoCode}>
                    Apply
                  </Button>
                </Box>
                {discount > 0 && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    {discount * 100}% discount applied!
                  </Alert>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Pricing Details */}
              <Box sx={{ mb: 1 }}>
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{'$' + subtotal.toFixed(2)}</Typography>
                </Box>

                {discount > 0 && (
                  <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                      Discount:
                    </Typography>
                    <Typography sx={{ color: 'green', fontWeight: 'bold' }}>
                      {'-$' + discountAmount.toFixed(2)}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography>Tax (10%):</Typography>
                  <Typography>{'$' + tax.toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box display="flex" justifyContent="space-between" sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 'bold', fontSize: 18 }}>
                    Total:
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      fontSize: 18,
                      color: '#667eea',
                    }}
                  >
                    {'$' + (total?.toFixed(2) || '0.00')}
                  </Typography>
                </Box>
              </Box>

              <Button
                fullWidth
                variant="contained"
                endIcon={<ShoppingCartCheckout />}
                onClick={handleCheckout}
                sx={{
                  bgcolor: '#667eea',
                  py: 1.5,
                  fontSize: 16,
                  fontWeight: 'bold',
                  '&:hover': { bgcolor: '#764ba2' },
                }}
              >
                Proceed to Checkout
              </Button>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: '#999' }}>
                  🔒 Secure Checkout
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Shipping Info */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✓ Free shipping on orders over $50
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✓ 30-day money-back guarantee
              </Typography>
              <Typography variant="body2">
                ✓ Secure checkout with SSL encryption
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Cart;
