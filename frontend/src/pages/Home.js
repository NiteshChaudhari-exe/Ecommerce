import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Rating,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Search,
  LocalShipping,
  Shield,
  ThumbUp,
} from '@mui/icons-material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { isInWishlist, toggleWishlist } from '../utils/wishlist';
import { useToast } from '../components/ToastProvider';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PromoCarousel from '../components/PromoCarousel';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [categories, setCategories] = useState([]);
  const [wlVersion, setWlVersion] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const showToast = useToast();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      setFilteredProducts(response.data);

      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map((p) => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Price filter
    filtered = filtered.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, sortBy, priceRange]);

  // Auto-rotate featured products every 10 seconds
  useEffect(() => {
    const featuredProducts = [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 14);
    
    if (featuredProducts.length > 0) {
      const interval = setInterval(() => {
        setFeaturedIndex((prevIndex) => (prevIndex + 1) % featuredProducts.length);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [products]);

  const handleAddToCart = (product) => {
    const doAdd = () => {
      // Get existing cart
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Check if product already in cart
      const existingItem = cart.find((item) => item.id === product._id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({
          id: product._id,
          name: product.name,
          price: product.price,
          image: product.imageUrl,
          quantity: 1,
          stock: product.stock,
        });
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      showToast(`${product.name} added to cart!`, 'success');
    };

    if (user) {
      doAdd();
    } else if (window && typeof window.requireLogin === 'function') {
      window.requireLogin(doAdd);
    } else {
      navigate('/auth');
    }
  };

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Compute featured set (latest 14 products) for the carousel
  const allFeaturedProducts = products && products.length
    ? [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 14)
    : [];

  // Get the current visible products for the carousel (rotating view - show 4 items at a time)
  const visibleFeaturedProducts = allFeaturedProducts.length > 0
    ? [
        allFeaturedProducts[featuredIndex % allFeaturedProducts.length],
        allFeaturedProducts[(featuredIndex + 1) % allFeaturedProducts.length],
        allFeaturedProducts[(featuredIndex + 2) % allFeaturedProducts.length],
        allFeaturedProducts[(featuredIndex + 3) % allFeaturedProducts.length],
      ]
    : [];

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
          mb: 4,
        }}
      >
        <Container>
          <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 2 }}>
            Welcome to Premium Store
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Discover amazing products with best prices and quality
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              sx={{ bgcolor: 'white', color: '#667eea', fontWeight: 'bold' }}
              onClick={() => document.getElementById('products-section').scrollIntoView()}
            >
              Shop Now
            </Button>
            <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }} onClick={() => navigate('/premium')}>
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Promotional Carousel */}
      <Container>
        <PromoCarousel height={320} />
      </Container>

      {/* Trust Section */}
      {/* Featured Products Carousel */}
      <Box sx={{ py: 4, mb: 4 }}>
        <Container>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Featured Products
          </Typography>

          {visibleFeaturedProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" sx={{ color: '#999' }}>
                No featured products yet.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mb: 2, transition: 'transform 0.5s ease' }}>
              {visibleFeaturedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', bgcolor: '#f0f0f0' }}>
                      <Box sx={{ position: 'absolute', left: 8, top: 8, zIndex: 5 }}>
                        <Button
                          onClick={async () => {
                            // if user logged in, sync with server
                            const token = localStorage.getItem('token');
                            if (token) {
                              try {
                                const currently = isInWishlist(product._id);
                                if (!currently) {
                                  await axios.post(`${API_URL}/users/wishlist`, { items: [product._id] }, { headers: { Authorization: `Bearer ${token}` } });
                                  showToast('Added to wishlist', 'info');
                                } else {
                                  await axios.delete(`${API_URL}/users/wishlist/${product._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                  showToast('Removed from wishlist', 'info');
                                }
                                setWlVersion((v) => v + 1);
                              } catch (err) {
                                console.error('Wishlist sync error', err?.response?.data || err.message);
                                showToast('Could not update wishlist', 'error');
                              }
                            } else {
                              const toggled = toggleWishlist({ id: product._id, name: product.name, price: product.price, image: product.imageUrl, stock: product.stock });
                              setWlVersion((v) => v + 1);
                              showToast(toggled ? 'Added to wishlist' : 'Removed from wishlist', 'info');
                            }
                          }}
                          variant="contained"
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.9)', minWidth: 36, height: 36, p: 0 }}
                        >
                          <FavoriteIcon sx={{ color: isInWishlist(product._id) ? 'error.main' : 'rgba(0,0,0,0.6)' }} />
                        </Button>
                      </Box>
                      <CardMedia
                        component="img"
                        image={product.imageUrl || 'https://via.placeholder.com/300x300?text=Product'}
                        alt={product.name}
                        sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="subtitle1" sx={{ fontWeight: 'bold' }} noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }} noWrap>
                        {product.description}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" variant="outlined" onClick={() => handleProductClick(product)}>
                        View
                      </Button>
                      <Button size="small" variant="contained" onClick={() => handleAddToCart(product)} sx={{ bgcolor: '#667eea', '&:hover': { bgcolor: '#764ba2' } }}>
                        Add to Cart
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      <Box sx={{ bgcolor: 'white', py: 4, mb: 4, overflow: 'hidden' }}>
        <Container>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              animation: 'scroll 15s linear infinite',
              width: 'max-content',
              '@keyframes scroll': {
                '0%': {
                  transform: 'translateX(0)',
                },
                '100%': {
                  transform: 'translateX(calc(-33.33% - 8px))',
                },
              },
            }}
          >
            {[
              { icon: LocalShipping, title: 'Free Shipping', desc: 'On orders above $50' },
              { icon: Shield, title: 'Secure Checkout', desc: '100% Safe payments' },
              { icon: ThumbUp, title: 'Quality Guaranteed', desc: 'Best products' },
              { icon: LocalShipping, title: 'Free Shipping', desc: 'On orders above $50' },
              { icon: Shield, title: 'Secure Checkout', desc: '100% Safe payments' },
              { icon: ThumbUp, title: 'Quality Guaranteed', desc: 'Best products' },
              { icon: LocalShipping, title: 'Free Shipping', desc: 'On orders above $50' },
              { icon: Shield, title: 'Secure Checkout', desc: '100% Safe payments' },
              { icon: ThumbUp, title: 'Quality Guaranteed', desc: 'Best products' },
            ].map((item, idx) => (
              <Box
                key={idx}
                display="flex"
                alignItems="center"
                gap={1.5}
                sx={{
                  minWidth: 'calc(33.33% - 5.33px)',
                  flexShrink: 0,
                  p: 2,
                  bgcolor: '#f9f9f9',
                  borderRadius: 1.5,
                  border: '1px solid #eee',
                }}
              >
                <Box sx={{ color: '#667eea', fontSize: 32, minWidth: 32 }}>
                  <item.icon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#666', fontSize: '0.75rem' }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Filters & Products Section */}
      <Container id="products-section">
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Sidebar Filters */}
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Filters
              </Typography>

              {/* Search */}
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: '#999' }} />,
                  }}
                />
              </Box>

              {/* Category Filter */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Price Range */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Price Range
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    type="number"
                    size="small"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([Number(e.target.value), priceRange[1]])
                    }
                    placeholder="Min"
                  />
                  <TextField
                    type="number"
                    size="small"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], Number(e.target.value)])
                    }
                    placeholder="Max"
                  />
                </Box>
              </Box>

              {/* Sort */}
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="newest">Newest</MenuItem>
                    <MenuItem value="price-low">Price: Low to High</MenuItem>
                    <MenuItem value="price-high">Price: High to Low</MenuItem>
                    <MenuItem value="name">Name: A to Z</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button fullWidth variant="outlined" onClick={fetchProducts}>
                Reset Filters
              </Button>
            </Card>
          </Grid>

          {/* Products Grid */}
          <Grid item xs={12} md={9}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6">
                {filteredProducts.length} Products Found
              </Typography>
            </Box>

            {filteredProducts.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ color: '#999' }}>
                  No products found. Try adjusting your filters.
                </Typography>
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 2,
                  maxHeight: 'calc(3 * 400px)',
                  overflowY: 'auto',
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    bgcolor: '#f1f1f1',
                    borderRadius: '10px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: '#888',
                    borderRadius: '10px',
                    '&:hover': {
                      bgcolor: '#555',
                    },
                  },
                }}
              >
                {filteredProducts.slice(0, 27).map((product) => (
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.3s, box-shadow 0.3s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          paddingTop: '100%',
                          overflow: 'hidden',
                          bgcolor: '#f0f0f0',
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={
                            product.imageUrl ||
                            'https://via.placeholder.com/300x300?text=Product'
                          }
                          alt={product.name}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />

                        {/* Stock Badge */}
                        <Chip
                          label={
                            product.stock > 0
                              ? `In Stock (${product.stock})`
                              : 'Out of Stock'
                          }
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            bgcolor:
                              product.stock > 0
                                ? 'success.main'
                                : 'error.main',
                            color: 'white',
                          }}
                        />
                      </Box>

                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          gutterBottom
                          variant="subtitle1"
                          sx={{ fontWeight: 'bold', overflow: 'hidden' }}
                          noWrap
                        >
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#666',
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {product.description}
                        </Typography>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                            <Typography
                            variant="h6"
                            sx={{ color: '#667eea', fontWeight: 'bold' }}
                          >
                            {'$' + product.price.toFixed(2)}
                          </Typography>
                          <Rating value={4} readOnly size="small" />
                        </Box>
                      </CardContent>

                      <CardActions sx={{ gap: 1 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          size="small"
                          onClick={() => handleProductClick(product)}
                        >
                          View Details
                        </Button>
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          startIcon={<ShoppingCart />}
                          disabled={product.stock === 0}
                          onClick={() => handleAddToCart(product)}
                          sx={{
                            bgcolor: '#667eea',
                            '&:hover': { bgcolor: '#764ba2' },
                          }}
                        >
                          Add to Cart
                        </Button>
                      </CardActions>
                    </Card>
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* About Us CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8,
          mb: 4,
          borderRadius: 2,
        }}
      >
        <Container>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                Learn More About Our Story
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.95, mb: 3, lineHeight: 1.8 }}>
                Discover how we're committed to bringing you the best quality products and exceptional customer service. Explore our mission, values, and the team behind your favorite store.
              </Typography>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': { bgcolor: '#f0f0f0' },
                }}
                onClick={() => navigate('/about')}
              >
                Read Our Full Story
              </Button>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  p: 3,
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Why Choose Premium Store?
                </Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {[
                    '120k+ Happy Customers',
                    '5000+ Quality Products',
                    '1M+ Orders Processed',
                    '4.9/5 Average Rating',
                  ].map((item, idx) => (
                    <Typography
                      key={idx}
                      component="li"
                      sx={{ mb: 1, opacity: 0.95 }}
                    >
                      ✓ {item}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: '#333', color: 'white', py: 4, mt: 4 }}>
        <Container>
          <Grid container spacing={3}>
            {[
              {
                title: 'About Us',
                items: ['Company', 'Our Story', 'Careers', 'Press'],
              },
              {
                title: 'Customer Service',
                items: ['Contact Us', 'FAQ', 'Shipping Info', 'Returns'],
              },
              {
                title: 'Policies',
                items: ['Privacy Policy', 'Terms of Service', 'Cookies', 'Security'],
              },
            ].map((section, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  {section.title}
                </Typography>
                <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                  {section.items.map((item, i) => (
                    <Typography
                      key={i}
                      component="li"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': { color: '#667eea' },
                      }}
                    >
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Newsletter
              </Typography>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  placeholder="Your email"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                    },
                  }}
                />
                <Button variant="contained" sx={{ bgcolor: '#667eea' }}>
                  Subscribe
                </Button>
              </Box>
            </Grid>
          </Grid>
          <Box
            sx={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              mt: 3,
              pt: 2,
              textAlign: 'center',
            }}
          >
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
