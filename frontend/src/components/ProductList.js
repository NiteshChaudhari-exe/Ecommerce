import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Grid, Button } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function ProductList({ token }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/products`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => setProducts(res.data))
      .catch(() => setProducts([]));
  }, [token]);

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {products.map(product => (
        <Grid item xs={12} sm={6} md={4} key={product._id}>
          <Card>
            <CardContent>
              <Typography variant="h6">{product.name}</Typography>
              <Typography variant="body2">{product.description}</Typography>
              <Typography variant="subtitle1">Stock: {product.stock}</Typography>
              <Typography variant="subtitle2">{'$' + (product.price || 0)}</Typography>
              {/* TODO: Add order button, edit/delete for managers/admins */}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
