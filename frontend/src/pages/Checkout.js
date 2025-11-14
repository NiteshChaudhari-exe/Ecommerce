import React, { useState } from 'react';
import {
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { CreditCard, Package, MapPin, CheckCircle } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Checkout = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    cartItems = [], 
    subtotal = 0, 
    discount = 0, 
    tax = 0, 
    total = 0 
  } = location.state || {};

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });

  // payment & shipping method state (defaults)
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('esewa');

  const shippingCost = shippingMethod === 'express' ? 25 : subtotal > 50 ? 0 : 10;

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [name]: value }));
  };

  const validateShipping = () => {
    if (
      !shippingInfo.firstName ||
      !shippingInfo.lastName ||
      !shippingInfo.email ||
      !shippingInfo.address ||
      !shippingInfo.city ||
      !shippingInfo.zipCode
    ) {
      alert('Please fill in all required fields');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    // Create order first in backend, then handle payment via Stripe Elements
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = user?.id;

      const orderData = {
        user: userId,
        products: cartItems.map((item) => ({
          product: item.id,
          quantity: item.quantity,
        })),
        total: total + shippingCost,
        shippingInfo: shippingInfo,
        shippingMethod: shippingMethod,
        shippingCost: shippingCost,
        discount: discount,
        status: 'pending',
      };

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const createdOrderId = response.data._id;
      setOrderId(createdOrderId);

      // If using eSewa, initiate redirect flow now
      if (paymentMethod === 'esewa') {
        try {
          const resp = await axios.post(`${API_URL}/payment/create-intent`, {
            orderId: createdOrderId,
            amount: total + shippingCost,
            provider: 'esewa'
          }, { headers: { Authorization: `Bearer ${token}` } });

          const result = resp.data.result;
          const paymentUrl = result.paymentUrl;
          const params = result.params || {};

          // Build success/failure URLs pointing to backend callback which will verify and
          // then redirect to frontend. SERVER_BASE derived from API_URL.
          const serverBase = (process.env.REACT_APP_SERVER_BASE || API_URL.replace('/api', ''));
          const su = `${serverBase}/api/payment/esewa/callback`;
          const fu = `${serverBase}/payment/esewa/failure`;

          // Create form and submit to eSewa
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentUrl;

          // append params
          Object.keys(params).forEach((k) => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = params[k];
            form.appendChild(input);
          });

          // append callback urls
          const suInput = document.createElement('input');
          suInput.type = 'hidden';
          suInput.name = 'su';
          suInput.value = su;
          form.appendChild(suInput);

          const fuInput = document.createElement('input');
          fuInput.type = 'hidden';
          fuInput.name = 'fu';
          fuInput.value = fu;
          form.appendChild(fuInput);

          document.body.appendChild(form);
          form.submit();
          return; // submission will navigate away
        } catch (err) {
          console.error('eSewa initiation failed', err);
          alert('Failed to start eSewa payment. Please try again.');
          setLoading(false);
          return;
        }
      }

      // If using Khalti, initiate widget/redirect flow now
      if (paymentMethod === 'khalti') {
        try {
          const resp = await axios.post(`${API_URL}/payment/create-intent`, {
            orderId: createdOrderId,
            amount: total + shippingCost,
            provider: 'khalti'
          }, { headers: { Authorization: `Bearer ${token}` } });

          const result = resp.data.result;
          // For now, show a message that Khalti will be integrated soon
          alert('Khalti integration in progress. Coming soon!');
          setLoading(false);
          return;
        } catch (err) {
          console.error('Khalti initiation failed', err);
          alert('Failed to start Khalti payment. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Move to payment step and let StripePaymentForm handle confirmation
      setActiveStep(2);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ color: '#999' }}>
          No items in cart. Please add items before checkout.
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2, bgcolor: '#667eea' }}
          onClick={() => navigate('/')}
        >
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Checkout
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Shipping</StepLabel>
        </Step>
        <Step>
          <StepLabel>Shipping Method</StepLabel>
        </Step>
        <Step>
          <StepLabel>Payment</StepLabel>
        </Step>
        <Step>
          <StepLabel>Confirmation</StepLabel>
        </Step>
      </Stepper>

      <Grid container spacing={3}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Step 1: Shipping Information */}
          {activeStep === 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Shipping Address
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={shippingInfo.firstName}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={shippingInfo.lastName}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      name="email"
                      value={shippingInfo.email}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="City"
                      name="city"
                      value={shippingInfo.city}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="State"
                      name="state"
                      value={shippingInfo.state}
                      onChange={handleShippingChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="ZIP Code"
                      name="zipCode"
                      value={shippingInfo.zipCode}
                      onChange={handleShippingChange}
                      required
                    />
                  </Grid>
                </Grid>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{ bgcolor: '#667eea' }}
                  onClick={() => {
                    if (validateShipping()) {
                      setActiveStep(1);
                    }
                  }}
                >
                  Continue to Shipping Method
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Shipping Method */}
          {activeStep === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Shipping Method
                </Typography>

                <RadioGroup
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      mb: 2,
                      border:
                        shippingMethod === 'standard'
                          ? '2px solid #667eea'
                          : '1px solid #ddd',
                    }}
                  >
                    <CardContent>
                      <FormControlLabel
                        value="standard"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 'bold' }}>
                              Standard Shipping (5-7 business days)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              {subtotal > 50 ? 'FREE' : '$10.00'}
                            </Typography>
                          </Box>
                        }
                      />
                    </CardContent>
                  </Card>

                  <Card
                    variant="outlined"
                    sx={{
                      mb: 2,
                      border:
                        shippingMethod === 'express'
                          ? '2px solid #667eea'
                          : '1px solid #ddd',
                    }}
                  >
                    <CardContent>
                      <FormControlLabel
                        value="express"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography sx={{ fontWeight: 'bold' }}>
                              Express Shipping (2-3 business days)
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              $25.00
                            </Typography>
                          </Box>
                        }
                      />
                    </CardContent>
                  </Card>
                </RadioGroup>

                <Box display="flex" gap={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: '#667eea' }}
                    onClick={() => setActiveStep(2)}
                  >
                    Continue to Payment
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {activeStep === 2 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Payment Information
                </Typography>

                <RadioGroup
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  sx={{ mb: 3 }}
                >
                  <FormControlLabel
                    value="esewa"
                    control={<Radio />}
                    label="eSewa (Nepal)"
                  />
                  <FormControlLabel
                    value="khalti"
                    control={<Radio />}
                    label="Khalti (Nepal)"
                  />
                </RadioGroup>

                {paymentMethod === 'esewa' && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      You will be redirected to eSewa to complete your payment securely.
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Click "Complete Payment" to proceed to eSewa payment gateway.
                    </Alert>
                  </Box>
                )}

                {paymentMethod === 'khalti' && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                      You will be redirected to Khalti to complete your payment securely.
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Click "Complete Payment" to proceed to Khalti payment gateway.
                    </Alert>
                  </Box>
                )}

                <Box display="flex" gap={2} sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: '#667eea' }}
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Complete Payment'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {activeStep === 3 && orderPlaced && (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Box sx={{ color: '#4caf50', fontSize: 60, mb: 2 }}>
                  <CheckCircle sx={{ fontSize: 60 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Order Placed Successfully!
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  Your order ID: <strong>{orderId}</strong>
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  A confirmation email has been sent to {shippingInfo.email}
                </Typography>

                <Box sx={{ my: 4, bgcolor: '#f9f9f9', p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Estimated Delivery: {shippingMethod === 'express' ? '2-3' : '5-7'} business days
                  </Typography>
                </Box>

                <Box display="flex" gap={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/orders')}
                  >
                    View My Orders
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: '#667eea' }}
                    onClick={() => navigate('/')}
                  >
                    Continue Shopping
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Order Summary Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Items */}
              {cartItems.map((item) => (
                <Box key={item.id} display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    {item.name} x {item.quantity}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {'$' + (item.price * item.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              {/* Pricing */}
              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">{'$' + subtotal.toFixed(2)}</Typography>
              </Box>

              {discount > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'green' }}>
                    Discount:
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'green' }}>
                    {'-$' + (subtotal * discount).toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2">Shipping:</Typography>
                <Typography variant="body2">
                  {shippingCost === 0 ? 'FREE' : ('$' + shippingCost.toFixed(2))}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="body2">Tax (10%):</Typography>
                <Typography variant="body2">{'$' + tax.toFixed(2)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
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
                  {'$' + (total + shippingCost).toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Checkout;
