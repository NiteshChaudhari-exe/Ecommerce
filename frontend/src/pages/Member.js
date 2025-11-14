import React from 'react';
import { Box, Container, Grid, Typography, Card, CardContent, Button } from '@mui/material';

export default function Member() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f8ff', py: 8 }}>
      <Container>
        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>Member Area</Typography>
        <Typography variant="body1" sx={{ color: '#666', mb: 4 }}>Exclusive perks, subscription management, and early access to drops.</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Your Subscription</Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Manage your monthly membership, billing, and benefits.</Typography>
                <Button sx={{ mt: 2 }} variant="contained">Manage Subscription</Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Exclusive Deals</Typography>
                <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>Access curated deals and early-release products only for members.</Typography>
                <Button sx={{ mt: 2 }} variant="outlined">View Deals</Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
