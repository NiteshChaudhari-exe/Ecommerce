import React from 'react';
import { Box, Container, Typography, Grid, Card, CardContent, Avatar, Button, Divider } from '@mui/material';
import { Star, People, Business, RocketLaunch } from '@mui/icons-material';

const Stat = ({ icon, value, label }) => (
  <Card sx={{ textAlign: 'center', py: 3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
    <CardContent>
      <Avatar sx={{ bgcolor: '#667eea', width: 56, height: 56, mb: 1 }}>{icon}</Avatar>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: '#666' }}>{label}</Typography>
    </CardContent>
  </Card>
);

export default function About() {
  return (
    <Box sx={{ bgcolor: '#f7f9ff', minHeight: '100vh', pb: 8 }}>
      <Box sx={{ background: 'linear-gradient(90deg,#667eea 0%,#764ba2 100%)', color: 'white', py: 12 }}>
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>We make shopping feel incredible</Typography>
              <Typography variant="h6" sx={{ opacity: 0.95, mb: 3 }}>At Premium Store we blend design, trust, and delight — so every purchase is a moment you remember.</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" sx={{ bgcolor: 'white', color: '#667eea', fontWeight: 'bold' }}>Shop Now</Button>
                <Button variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>Learn Our Story</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.08)', p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Our Promise</Typography>
                <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>We source responsibly, pack lovingly, and stand behind every product with a smile and a warranty.</Typography>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 2 }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>Trusted by thousands. Delivering joy every day.</Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container sx={{ mt: -8 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}><Stat icon={<Star />} value="4.9/5" label="Average Rating" /></Grid>
          <Grid item xs={12} md={3}><Stat icon={<People />} value="120k+" label="Happy Customers" /></Grid>
          <Grid item xs={12} md={3}><Stat icon={<Business />} value="5000+" label="Products Curated" /></Grid>
          <Grid item xs={12} md={3}><Stat icon={<RocketLaunch />} value="1M+" label="Orders Processed" /></Grid>
        </Grid>

        <Box sx={{ mt: 6 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Our Mission</Typography>
                  <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.8 }}>We believe shopping should be easy, trustworthy, and joyful. We obsess over product quality, delight in packing, and invest in rapid customer support that treats you like a person, not a ticket number.</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ p: 3, height: '100%' }}>
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>How We Work</Typography>
                  <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.8 }}>From ethical sourcing to smart packaging and real human support — our operations are built to minimize waste and maximize smiles. We partner with vetted artisans and eco-friendly suppliers.</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Our Values</Typography>
                  <ul>
                    <li>Customers first</li>
                    <li>Quality over shortcuts</li>
                    <li>Sustainability matters</li>
                    <li>Be kind, be curious</li>
                  </ul>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Meet the Team</Typography>
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {["Asha R.", "Raj K.", "Maya P.", "Sam T."].map((name, i) => (
                      <Grid item xs={6} md={3} key={i}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Avatar sx={{ bgcolor: '#667eea', width: 64, height: 64, mx: 'auto', mb: 1 }}>{name.split(' ').map(n=>n[0]).join('')}</Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>Team</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Ready to be delighted?</Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>Join thousands who shop with confidence — discover products you'll love.</Typography>
            <Button variant="contained" sx={{ bgcolor: '#667eea', px: 6, py: 1.5 }}>Explore Collection</Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
