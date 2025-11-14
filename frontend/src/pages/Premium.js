import React from 'react';
import { Container, Box, Typography, Button, Grid, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Premium = ({ user }) => {
  const navigate = useNavigate();

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
          Become a Premium Member
        </Typography>
        <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
          Enjoy free shipping, early access to new products, exclusive deals, and premium support.
        </Typography>
        <Button variant="contained" sx={{ bgcolor: '#667eea' }} onClick={() => alert('Subscription flow not implemented (placeholder)')}>
          Subscribe Now
        </Button>
      </Box>

      <Grid container spacing={3}>
        {[
          { title: 'Free Shipping', desc: 'On all orders for Premium members' },
          { title: 'Early Access', desc: 'Get new products 24 hours before public release' },
          { title: 'Exclusive Deals', desc: 'Special pricing and member-only bundles' },
        ].map((card, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{card.title}</Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>{card.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
          Not ready to subscribe? <span style={{ cursor: 'pointer', color: '#667eea' }} onClick={() => navigate('/')}>Continue shopping</span>
        </Typography>
      </Box>
    </Container>
  );
};

export default Premium;
