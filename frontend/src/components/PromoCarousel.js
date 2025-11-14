import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const slides = [
  {
    id: 1,
    title: 'Spring Sale — Up to 40% off',
    subtitle: 'Limited time only on selected categories',
    image: 'https://via.placeholder.com/1200x400?text=Spring+Sale',
    cta: '/products',
  },
  {
    id: 2,
    title: 'Free Shipping Week',
    subtitle: 'Free shipping for orders over $25',
    image: 'https://via.placeholder.com/1200x400?text=Free+Shipping',
    cta: '/shipping-info',
  },
  {
    id: 3,
    title: 'Members get more',
    subtitle: 'Join Premium for exclusive discounts',
    image: 'https://via.placeholder.com/1200x400?text=Premium+Perks',
    cta: '/premium',
  },
];

const PromoCarousel = ({ height = 320 }) => {
  return (
    <Box
      sx={{
        position: 'relative',
        mb: 4,
        // ensure nav buttons and pagination are visible above slide content
        '& .swiper-button-next, & .swiper-button-prev': {
          color: 'white',
          zIndex: 6,
          bgcolor: 'rgba(0,0,0,0.35)',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        '& .swiper-pagination': {
          zIndex: 6,
          bottom: 12,
          left: 0,
          right: 0,
          textAlign: 'center',
        },
      }}
    >
  <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        navigation={true}
        pagination={{ clickable: true }}
        effect="fade"
        style={{ width: '100%', height }}
        grabCursor={true}
        preloadImages={false}
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: { xs: 180, sm: height },
                overflow: 'hidden',
                borderRadius: 2,
              }}
            >
              {/* use background-image to avoid any rendered alt/fallback text */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'block',
                }}
                role="img"
                aria-label={slide.title}
              />

              {/* subtle gradient to improve text readability and avoid overlap */}
              <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none', zIndex: 3 }} />
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Single overlay for promo text to avoid duplicates from cloned slides when loop=true */}
      <OverlayContent height={height} />
    </Box>
  );
};

const OverlayContent = ({ height = 320 }) => {
  // Controlled via DOM query of active slide class to determine index
  // Use a small state that reads Swiper's active slide by class to avoid wiring events across components.
  const [active, setActive] = useState(0);

  React.useEffect(() => {
    const update = () => {
      try {
        const activeEl = document.querySelector('.swiper-slide.swiper-slide-active');
        if (!activeEl) return;
        const indexAttr = activeEl.getAttribute('data-swiper-slide-index');
        const idx = indexAttr ? Number(indexAttr) : 0;
        setActive(idx);
      } catch (e) {
        // ignore
      }
    };

    update();
    // listen for Swiper class changes via mutation observer
    const root = document.querySelector('.swiper');
    if (!root) return;
    const mo = new MutationObserver(() => update());
    mo.observe(root, { attributes: true, subtree: true, attributeFilter: ['class'] });
    // Also poll occasionally in case classes change without attribute mutation
    const t = setInterval(update, 250);
    return () => {
      mo.disconnect();
      clearInterval(t);
    };
  }, []);

  const slide = slides[active] || slides[0];

  return (
    <Box sx={{ position: 'absolute', left: { xs: 12, sm: 24 }, bottom: { xs: 12, sm: 24 }, color: 'white', zIndex: 8, pointerEvents: 'auto', maxWidth: { xs: '80%', sm: '45%' } }}>
      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
        {slide.title}
      </Typography>
      <Typography variant="body2" sx={{ opacity: 0.95, mb: 1, fontSize: { xs: '0.8rem', sm: '0.95rem' } }}>
        {slide.subtitle}
      </Typography>
      <Button variant="contained" href={slide.cta} sx={{ bgcolor: 'primary.main' }}>
        Learn More
      </Button>
    </Box>
  );
};

export default PromoCarousel;
