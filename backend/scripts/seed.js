const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';

// Array of image URLs from public/Images folder
// Updated to match the actual filenames present in frontend/public/Images (Banner (1).png ... Banner (27).png)
const images = [
  '/Images/Banner (1).png',
  '/Images/Banner (2).png',
  '/Images/Banner (3).png',
  '/Images/Banner (4).png',
  '/Images/Banner (5).png',
  '/Images/Banner (6).png',
  '/Images/Banner (7).png',
  '/Images/Banner (8).png',
  '/Images/Banner (9).png',
  '/Images/Banner (10).png',
  '/Images/Banner (11).png',
  '/Images/Banner (12).png',
  '/Images/Banner (13).png',
  '/Images/Banner (14).png',
  '/Images/Banner (15).png',
  '/Images/Banner (16).png',
  '/Images/Banner (17).png',
  '/Images/Banner (18).png',
  '/Images/Banner (19).png',
  '/Images/Banner (20).png',
  '/Images/Banner (21).png',
  '/Images/Banner (22).png',
  '/Images/Banner (23).png',
  '/Images/Banner (24).png',
  '/Images/Banner (25).png',
  '/Images/Banner (26).png',
  '/Images/Banner (27).png',
];

// Realistic product catalog focused on clothing-only categories
const productCatalog = [
  // ===== TOPS (8) =====
  { name: 'Essential Cotton Tee', description: 'Soft 100% cotton tee, regular fit. Available in multiple colors.', price: 19.99, stock: 120, category: 'Tops', imageUrl: images[0], reorderLevel: 20 },
  { name: 'Slim Fit Polo', description: 'Breathable pique polo, slim tailored fit.', price: 29.99, stock: 80, category: 'Tops', imageUrl: images[1], reorderLevel: 15 },
  { name: 'Lightweight Linen Shirt', description: 'Casual linen shirt, perfect for warm weather.', price: 39.99, stock: 60, category: 'Tops', imageUrl: images[2], reorderLevel: 10 },
  { name: 'Waffle Knit Long Sleeve', description: 'Cozy waffle knit top, relaxed fit.', price: 34.99, stock: 70, category: 'Tops', imageUrl: images[3], reorderLevel: 12 },
  { name: 'Graphic Tee - Vintage', description: 'Vintage-style graphic tee with soft hand feel.', price: 22.99, stock: 90, category: 'Tops', imageUrl: images[4], reorderLevel: 18 },
  { name: 'Performance Henley', description: 'Moisture-wicking henley for active days.', price: 27.99, stock: 65, category: 'Tops', imageUrl: images[5], reorderLevel: 14 },
  { name: 'Silk Blend Blouse', description: 'Elegant silk blend blouse for a dressy look.', price: 54.99, stock: 40, category: 'Tops', imageUrl: images[6], reorderLevel: 8 },
  { name: 'Ribbed Tank Top', description: 'Stretch ribbed tank for layering.', price: 14.99, stock: 150, category: 'Tops', imageUrl: images[7], reorderLevel: 30 },

  // ===== BOTTOMS (8) =====
  { name: 'Classic Straight Jeans', description: 'Mid-rise straight leg jeans, comfortable stretch.', price: 59.99, stock: 85, category: 'Bottoms', imageUrl: images[8], reorderLevel: 20 },
  { name: 'Chino Pants Slim', description: 'Versatile slim chinos, smart-casual staple.', price: 44.99, stock: 90, category: 'Bottoms', imageUrl: images[9], reorderLevel: 18 },
  { name: 'Comfort Joggers', description: 'Soft fleece joggers with tapered ankle.', price: 34.99, stock: 110, category: 'Bottoms', imageUrl: images[10], reorderLevel: 25 },
  { name: 'High-Waist Leggings', description: 'Compression leggings for workouts and everyday wear.', price: 29.99, stock: 130, category: 'Bottoms', imageUrl: images[11], reorderLevel: 30 },
  { name: 'Tailored Shorts', description: 'Smart tailored shorts for summer.', price: 24.99, stock: 75, category: 'Bottoms', imageUrl: images[12], reorderLevel: 15 },
  { name: 'Culotte Wide-Leg Pants', description: 'Breathable wide-leg culottes, flowy fit.', price: 49.99, stock: 50, category: 'Bottoms', imageUrl: images[13], reorderLevel: 10 },
  { name: 'Denim Skirt', description: 'Classic A-line denim skirt, mid-thigh length.', price: 39.99, stock: 70, category: 'Bottoms', imageUrl: images[14], reorderLevel: 16 },
  { name: 'Corduroy Trousers', description: 'Warm corduroy trousers, fall-ready.', price: 54.99, stock: 45, category: 'Bottoms', imageUrl: images[15], reorderLevel: 12 },

  // ===== OUTERWEAR (6) =====
  { name: 'Classic Denim Jacket', description: 'Durable denim jacket with vintage wash.', price: 79.99, stock: 60, category: 'Outerwear', imageUrl: images[16], reorderLevel: 10 },
  { name: 'Puffer Coat', description: 'Warm insulated puffer coat with hood.', price: 129.99, stock: 40, category: 'Outerwear', imageUrl: images[17], reorderLevel: 8 },
  { name: 'Trench Coat', description: 'Water-resistant trench coat with belt.', price: 149.99, stock: 30, category: 'Outerwear', imageUrl: images[18], reorderLevel: 6 },
  { name: 'Wool Blend Overcoat', description: 'Smart wool blend overcoat for formal wear.', price: 199.99, stock: 25, category: 'Outerwear', imageUrl: images[19], reorderLevel: 5 },
  { name: 'Hooded Rain Jacket', description: 'Lightweight rain jacket with packable hood.', price: 69.99, stock: 80, category: 'Outerwear', imageUrl: images[20], reorderLevel: 20 },
  { name: 'Faux Fur Lined Coat', description: 'Cozy faux-fur lined coat with luxe finish.', price: 159.99, stock: 20, category: 'Outerwear', imageUrl: images[21], reorderLevel: 5 },

  // ===== FOOTWEAR (8) =====
  { name: 'Classic White Sneakers', description: 'Minimalist leather-look sneakers for everyday.', price: 69.99, stock: 95, category: 'Footwear', imageUrl: images[22], reorderLevel: 20 },
  { name: 'Chelsea Boots', description: 'Timeless leather Chelsea boots with elastic sides.', price: 119.99, stock: 40, category: 'Footwear', imageUrl: images[23], reorderLevel: 8 },
  { name: 'Trail Running Shoes', description: 'Durable trail shoes with grippy outsole.', price: 89.99, stock: 55, category: 'Footwear', imageUrl: images[24], reorderLevel: 12 },
  { name: 'Slip-On Loafers', description: 'Comfort slip-on loafers for work and casual.', price: 59.99, stock: 60, category: 'Footwear', imageUrl: images[25], reorderLevel: 15 },
  { name: 'Sandals Cork Footbed', description: 'Comfort sandals with supportive cork footbed.', price: 49.99, stock: 70, category: 'Footwear', imageUrl: images[26], reorderLevel: 18 },
  { name: 'Platform Sneakers', description: 'Retro platform sneakers for a statement look.', price: 79.99, stock: 45, category: 'Footwear', imageUrl: images[0], reorderLevel: 10 },
  { name: 'Ankle Strap Heels', description: 'Elegant ankle strap heels for evening wear.', price: 89.99, stock: 35, category: 'Footwear', imageUrl: images[1], reorderLevel: 8 },
  { name: 'Athletic Trainers', description: 'Multi-purpose trainers for gym and running.', price: 99.99, stock: 50, category: 'Footwear', imageUrl: images[2], reorderLevel: 12 },

  // ===== ACCESSORIES (6) =====
  { name: 'Leather Belt', description: 'Genuine leather belt with metal buckle.', price: 29.99, stock: 120, category: 'Accessories', imageUrl: images[3], reorderLevel: 30 },
  { name: 'Wool Scarf', description: 'Soft wool scarf, warm and comfortable.', price: 24.99, stock: 80, category: 'Accessories', imageUrl: images[4], reorderLevel: 20 },
  { name: 'Beanie Hat', description: 'Knitted beanie for cold days.', price: 14.99, stock: 140, category: 'Accessories', imageUrl: images[5], reorderLevel: 35 },
  { name: 'Classic Sunglasses', description: 'UV-protective sunglasses with modern frame.', price: 39.99, stock: 70, category: 'Accessories', imageUrl: images[6], reorderLevel: 15 },
  { name: 'Canvas Tote Bag', description: 'Durable canvas tote for everyday carry.', price: 19.99, stock: 95, category: 'Accessories', imageUrl: images[7], reorderLevel: 25 },
  { name: 'Silk Pocket Square', description: 'Premium silk pocket square for suit jackets.', price: 19.99, stock: 60, category: 'Accessories', imageUrl: images[8], reorderLevel: 10 },

  // ===== ACTIVEWEAR (6) =====
  { name: 'Running Shorts', description: 'Lightweight running shorts with mesh lining.', price: 24.99, stock: 110, category: 'Activewear', imageUrl: images[9], reorderLevel: 30 },
  { name: 'Zip-Up Hoodie', description: 'Technical zip-up hoodie for warm-ups.', price: 49.99, stock: 85, category: 'Activewear', imageUrl: images[10], reorderLevel: 20 },
  { name: 'Sports Bra', description: 'High-support sports bra for high-intensity workouts.', price: 34.99, stock: 90, category: 'Activewear', imageUrl: images[11], reorderLevel: 25 },
  { name: 'Compression Shorts', description: 'Compression shorts for performance and recovery.', price: 29.99, stock: 70, category: 'Activewear', imageUrl: images[12], reorderLevel: 15 },
  { name: 'Windbreaker', description: 'Lightweight windbreaker for outdoor runs.', price: 59.99, stock: 60, category: 'Activewear', imageUrl: images[13], reorderLevel: 12 },
  { name: 'Training Pullover', description: 'Breathable pullover for layered training.', price: 44.99, stock: 75, category: 'Activewear', imageUrl: images[14], reorderLevel: 18 },

  // ===== UNDERGARMENTS & SLEEP (4) =====
  { name: 'Everyday Briefs Pack', description: '3-pack of soft stretch briefs.', price: 19.99, stock: 200, category: 'Underwear', imageUrl: images[15], reorderLevel: 50 },
  { name: 'Seamless Boxer Briefs', description: 'Comfort stretch boxer briefs with no-ride fit.', price: 24.99, stock: 180, category: 'Underwear', imageUrl: images[16], reorderLevel: 40 },
  { name: 'Cotton Pajama Set', description: 'Two-piece cotton pajama set for cozy nights.', price: 34.99, stock: 90, category: 'Underwear', imageUrl: images[17], reorderLevel: 20 },
  { name: 'Sleep Mask & Socks Set', description: 'Comfort sleep mask with soft socks, great for travel.', price: 14.99, stock: 150, category: 'Underwear', imageUrl: images[18], reorderLevel: 30 },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    const deletedCount = await Product.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing products`);

    // Insert new products
    const inserted = await Product.insertMany(productCatalog);
    console.log(`\n✨ Successfully inserted ${inserted.length} products:\n`);

    // Group by category and display
    const categories = {};
    inserted.forEach((p) => {
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    });

    Object.keys(categories)
      .sort()
      .forEach((cat) => {
        console.log(`📦 ${cat} (${categories[cat].length} items):`);
        categories[cat].forEach((p) => {
          console.log(`   • ${p.name} — $${p.price} (Stock: ${p.stock}) — Image: ${p.imageUrl}`);
        });
        console.log();
      });

    await mongoose.connection.close();
    console.log('🎉 Seed complete!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
