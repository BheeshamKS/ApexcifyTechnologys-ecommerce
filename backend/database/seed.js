import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

import User from '../src/models/User.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';
import VendorProfile from '../src/models/VendorProfile.js';
import Review from '../src/models/Review.js';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'shophub';

// ─── CATEGORIES ──────────────────────────────────────────────
const categoriesData = [
  { name: 'Electronics',    slug: 'electronics',   description: 'Gadgets, devices and tech accessories',    image_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', sort_order: 1 },
  { name: 'Fashion',        slug: 'fashion',       description: 'Clothing, shoes and accessories',          image_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', sort_order: 2 },
  { name: 'Home & Garden',  slug: 'home-garden',   description: 'Furniture, decor and garden supplies',     image_url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', sort_order: 3 },
  { name: 'Sports',         slug: 'sports',        description: 'Sporting goods and fitness equipment',     image_url: 'https://images.unsplash.com/photo-1461896836934-ber91080df02?w=400', sort_order: 4 },
  { name: 'Books',          slug: 'books',         description: 'Books, e-books and educational materials', image_url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400', sort_order: 5 },
  { name: 'Beauty',         slug: 'beauty',        description: 'Skincare, makeup and personal care',       image_url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', sort_order: 6 },
  { name: 'Toys',           slug: 'toys',          description: 'Toys, games and children accessories',     image_url: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400', sort_order: 7 },
  { name: 'Automotive',     slug: 'automotive',    description: 'Car parts, accessories and tools',         image_url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400', sort_order: 8 },
];

// ─── USERS ───────────────────────────────────────────────────
const usersData = [
  // Admin
  { email: 'admin@shophub.com',       password: 'Admin@123456',   full_name: 'Admin User',       role: 'admin' },
  // Vendors
  { email: 'techstore@shophub.com',   password: 'Vendor@123456',  full_name: 'Rajesh Kumar',     role: 'vendor' },
  { email: 'fashionhub@shophub.com',  password: 'Vendor@123456',  full_name: 'Priya Sharma',     role: 'vendor' },
  { email: 'homemart@shophub.com',    password: 'Vendor@123456',  full_name: 'Amit Patel',       role: 'vendor' },
  { email: 'sportzone@shophub.com',   password: 'Vendor@123456',  full_name: 'Sarah Johnson',    role: 'vendor' },
  // Customers
  { email: 'customer1@shophub.com',   password: 'Customer@123',   full_name: 'Ali Hassan',       role: 'customer' },
  { email: 'customer2@shophub.com',   password: 'Customer@123',   full_name: 'Maria Garcia',     role: 'customer' },
  { email: 'customer3@shophub.com',   password: 'Customer@123',   full_name: 'John Smith',       role: 'customer' },
];

const vendorProfilesData = [
  { business_name: 'TechStore Pro',     business_description: 'Premium electronics and gadgets at best prices',     business_email: 'techstore@shophub.com',  business_phone: '+92-300-1234567', is_approved: true },
  { business_name: 'Fashion Hub',       business_description: 'Trendy clothing and accessories for everyone',       business_email: 'fashionhub@shophub.com', business_phone: '+92-301-2345678', is_approved: true },
  { business_name: 'HomeMart',          business_description: 'Quality home essentials and garden supplies',         business_email: 'homemart@shophub.com',   business_phone: '+92-302-3456789', is_approved: true },
  { business_name: 'SportZone',         business_description: 'Top sporting goods and fitness equipment',            business_email: 'sportzone@shophub.com',  business_phone: '+92-303-4567890', is_approved: true },
];

// ─── PRODUCTS ────────────────────────────────────────────────
// vendor index: 0=TechStore, 1=FashionHub, 2=HomeMart, 3=SportZone
const productsData = [
  // ── Electronics (TechStore Pro) ─────────────────────────
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones',
    description: 'Premium noise-cancelling wireless headphones with 40-hour battery life. Features deep bass, crystal-clear treble, and ultra-comfortable ear cushions. Perfect for music, calls, and gaming.',
    price: 79.99, compare_price: 129.99, stock: 150, sku: 'TECH-HP-001',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'],
    tags: ['headphones', 'bluetooth', 'wireless', 'audio'], is_featured: true, avg_rating: 4.5, review_count: 24,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Smart Watch Ultra', slug: 'smart-watch-ultra',
    description: 'Advanced smartwatch with health monitoring, GPS tracking, sleep analysis, and 7-day battery life. Water-resistant up to 50 meters. Compatible with iOS and Android.',
    price: 199.99, compare_price: 299.99, stock: 85, sku: 'TECH-SW-001',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600'],
    tags: ['smartwatch', 'fitness', 'health', 'wearable'], is_featured: true, avg_rating: 4.7, review_count: 56,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Portable Bluetooth Speaker', slug: 'portable-bluetooth-speaker',
    description: 'Waterproof portable speaker with 360° surround sound. 20-hour playtime, built-in microphone, and rugged design for outdoor adventures.',
    price: 49.99, compare_price: 79.99, stock: 200, sku: 'TECH-SP-001',
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600'],
    tags: ['speaker', 'bluetooth', 'portable', 'waterproof'], is_featured: false, avg_rating: 4.3, review_count: 18,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Mechanical Gaming Keyboard', slug: 'mechanical-gaming-keyboard',
    description: 'RGB backlit mechanical keyboard with Cherry MX switches. Anti-ghosting, programmable macros, and detachable wrist rest. Built for competitive gaming.',
    price: 89.99, compare_price: 119.99, stock: 120, sku: 'TECH-KB-001',
    images: ['https://images.unsplash.com/photo-1541140532154-b024d1b2ce26?w=600'],
    tags: ['keyboard', 'gaming', 'mechanical', 'rgb'], is_featured: true, avg_rating: 4.6, review_count: 32,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'USB-C Fast Charging Cable (3-Pack)', slug: 'usb-c-fast-charging-cable-3pack',
    description: 'Braided nylon USB-C cables in 3ft, 6ft, and 10ft lengths. Supports 100W fast charging and 480Mbps data transfer. Compatible with all USB-C devices.',
    price: 14.99, compare_price: 24.99, stock: 500, sku: 'TECH-CB-001',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    tags: ['cable', 'usb-c', 'charging', 'accessories'], is_featured: false, avg_rating: 4.4, review_count: 89,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: '4K Ultra HD Webcam', slug: '4k-ultra-hd-webcam',
    description: '4K webcam with auto-focus, built-in ring light, and noise-cancelling dual microphone. Perfect for streaming, video calls, and content creation.',
    price: 69.99, compare_price: 99.99, stock: 75, sku: 'TECH-WC-001',
    images: ['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600'],
    tags: ['webcam', '4k', 'streaming', 'video'], is_featured: false, avg_rating: 4.2, review_count: 15,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Wireless Charging Pad', slug: 'wireless-charging-pad',
    description: 'Slim 15W wireless charger compatible with all Qi-enabled devices. LED indicator, anti-slip surface, and overheat protection.',
    price: 24.99, compare_price: 39.99, stock: 300, sku: 'TECH-CH-001',
    images: ['https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600'],
    tags: ['charger', 'wireless', 'qi', 'accessories'], is_featured: false, avg_rating: 4.1, review_count: 42,
  },
  {
    vendorIdx: 0, categorySlug: 'electronics',
    name: 'Noise Cancelling Earbuds', slug: 'noise-cancelling-earbuds',
    description: 'True wireless earbuds with active noise cancellation, transparency mode, and 32-hour total battery life. IPX5 water-resistant.',
    price: 59.99, compare_price: 89.99, stock: 180, sku: 'TECH-EB-001',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600'],
    tags: ['earbuds', 'wireless', 'noise-cancelling', 'audio'], is_featured: true, avg_rating: 4.4, review_count: 67,
  },

  // ── Fashion (Fashion Hub) ──────────────────────────────
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Classic Leather Jacket', slug: 'classic-leather-jacket',
    description: 'Genuine leather jacket with quilted lining. Timeless design with multiple pockets, adjustable waist belt, and premium YKK zippers. Available in Black and Brown.',
    price: 149.99, compare_price: 249.99, stock: 45, sku: 'FASH-JK-001',
    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600', 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=600'],
    tags: ['jacket', 'leather', 'men', 'outerwear'], is_featured: true, avg_rating: 4.8, review_count: 38,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Premium Cotton T-Shirt', slug: 'premium-cotton-tshirt',
    description: '100% organic cotton crew-neck t-shirt. Pre-shrunk, breathable fabric with reinforced stitching. Available in 12 colors.',
    price: 24.99, compare_price: 34.99, stock: 500, sku: 'FASH-TS-001',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'],
    tags: ['tshirt', 'cotton', 'basics', 'unisex'], is_featured: false, avg_rating: 4.3, review_count: 120,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Slim Fit Chino Pants', slug: 'slim-fit-chino-pants',
    description: 'Stretch cotton chino pants with a modern slim fit. Comfortable waistband, deep pockets, and wrinkle-resistant fabric. Perfect for work or casual wear.',
    price: 44.99, compare_price: 64.99, stock: 200, sku: 'FASH-CH-001',
    images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'],
    tags: ['pants', 'chinos', 'men', 'casual'], is_featured: false, avg_rating: 4.1, review_count: 55,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Floral Summer Dress', slug: 'floral-summer-dress',
    description: 'Lightweight floral maxi dress with adjustable spaghetti straps. Flowing fabric, side pockets, and flattering A-line silhouette. Perfect for beach or brunch.',
    price: 39.99, compare_price: 59.99, stock: 150, sku: 'FASH-DR-001',
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600'],
    tags: ['dress', 'summer', 'women', 'floral'], is_featured: true, avg_rating: 4.6, review_count: 73,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Canvas Sneakers', slug: 'canvas-sneakers',
    description: 'Classic canvas low-top sneakers with vulcanized rubber sole. Breathable cotton lining and cushioned insole for all-day comfort.',
    price: 34.99, compare_price: 49.99, stock: 250, sku: 'FASH-SN-001',
    images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600'],
    tags: ['sneakers', 'shoes', 'canvas', 'unisex'], is_featured: false, avg_rating: 4.2, review_count: 91,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Aviator Sunglasses', slug: 'aviator-sunglasses',
    description: 'Polarized aviator sunglasses with UV400 protection. Metal frame with spring hinges and gradient lenses. Includes hard case and microfiber cloth.',
    price: 29.99, compare_price: 49.99, stock: 180, sku: 'FASH-SG-001',
    images: ['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'],
    tags: ['sunglasses', 'aviator', 'accessories', 'unisex'], is_featured: true, avg_rating: 4.5, review_count: 44,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Wool Blend Scarf', slug: 'wool-blend-scarf',
    description: 'Luxuriously soft wool-cashmere blend scarf. Generous size for multiple styling options. Classic plaid pattern in warm autumn tones.',
    price: 27.99, compare_price: 44.99, stock: 130, sku: 'FASH-SC-001',
    images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600'],
    tags: ['scarf', 'wool', 'winter', 'accessories'], is_featured: false, avg_rating: 4.4, review_count: 28,
  },
  {
    vendorIdx: 1, categorySlug: 'fashion',
    name: 'Minimalist Leather Watch', slug: 'minimalist-leather-watch',
    description: 'Elegant watch with genuine leather strap and sapphire crystal glass. Japanese quartz movement, 40mm case, and 3ATM water resistance.',
    price: 64.99, compare_price: 99.99, stock: 90, sku: 'FASH-WT-001',
    images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'],
    tags: ['watch', 'leather', 'minimalist', 'accessories'], is_featured: true, avg_rating: 4.7, review_count: 36,
  },

  // ── Home & Garden (HomeMart) ───────────────────────────
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Ceramic Plant Pot Set (3-Pack)', slug: 'ceramic-plant-pot-set',
    description: 'Hand-glazed ceramic pots in small, medium, and large sizes. Drainage holes with bamboo saucers. Modern matte finish in white, gray, and terracotta.',
    price: 34.99, compare_price: 54.99, stock: 100, sku: 'HOME-PT-001',
    images: ['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600'],
    tags: ['plants', 'pots', 'ceramic', 'decor'], is_featured: true, avg_rating: 4.6, review_count: 52,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Scented Soy Candle Collection', slug: 'scented-soy-candle-collection',
    description: 'Set of 4 hand-poured soy candles in Lavender, Vanilla, Cedar, and Ocean Breeze. 45-hour burn time each. Made with essential oils and cotton wicks.',
    price: 28.99, compare_price: 42.99, stock: 200, sku: 'HOME-CN-001',
    images: ['https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600'],
    tags: ['candles', 'soy', 'aromatherapy', 'home-decor'], is_featured: false, avg_rating: 4.5, review_count: 68,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Bamboo Cutting Board Set', slug: 'bamboo-cutting-board-set',
    description: 'Set of 3 organic bamboo cutting boards with juice grooves. Antimicrobial, knife-friendly, and easy to clean. Includes small, medium, and large sizes.',
    price: 22.99, compare_price: 34.99, stock: 160, sku: 'HOME-CB-001',
    images: ['https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=600'],
    tags: ['kitchen', 'bamboo', 'cutting-board', 'cooking'], is_featured: false, avg_rating: 4.3, review_count: 41,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Memory Foam Pillow (2-Pack)', slug: 'memory-foam-pillow-2pack',
    description: 'Gel-infused memory foam pillows with cooling technology. Adjustable loft, hypoallergenic bamboo cover, and CertiPUR-US certified foam.',
    price: 39.99, compare_price: 59.99, stock: 140, sku: 'HOME-PL-001',
    images: ['https://images.unsplash.com/photo-1592789705501-f9ae4287c4b9?w=600'],
    tags: ['pillow', 'memory-foam', 'bedroom', 'sleep'], is_featured: true, avg_rating: 4.4, review_count: 93,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Stainless Steel Kitchen Utensil Set', slug: 'stainless-steel-kitchen-utensil-set',
    description: '15-piece premium kitchen utensil set with rotating holder. Heat-resistant silicone heads on stainless steel handles. Dishwasher safe.',
    price: 44.99, compare_price: 69.99, stock: 95, sku: 'HOME-UT-001',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
    tags: ['kitchen', 'utensils', 'stainless-steel', 'cooking'], is_featured: false, avg_rating: 4.5, review_count: 37,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'LED Desk Lamp with Wireless Charger', slug: 'led-desk-lamp-wireless-charger',
    description: 'Adjustable LED desk lamp with 5 brightness levels and 3 color temperatures. Built-in 10W wireless charging pad and USB port. Touch controls.',
    price: 54.99, compare_price: 79.99, stock: 70, sku: 'HOME-LP-001',
    images: ['https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600'],
    tags: ['lamp', 'desk', 'led', 'wireless-charger'], is_featured: true, avg_rating: 4.6, review_count: 29,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Microfiber Bed Sheet Set (Queen)', slug: 'microfiber-bed-sheet-set-queen',
    description: '1800 thread count brushed microfiber sheet set. Includes flat sheet, fitted sheet, and 2 pillowcases. Deep pockets, wrinkle & fade resistant.',
    price: 29.99, compare_price: 49.99, stock: 220, sku: 'HOME-BS-001',
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'],
    tags: ['bedding', 'sheets', 'microfiber', 'bedroom'], is_featured: false, avg_rating: 4.2, review_count: 114,
  },
  {
    vendorIdx: 2, categorySlug: 'home-garden',
    name: 'Indoor Herb Garden Kit', slug: 'indoor-herb-garden-kit',
    description: 'Complete kit to grow basil, cilantro, parsley, and mint indoors. Includes self-watering pots, organic soil, seeds, and plant markers.',
    price: 24.99, compare_price: 39.99, stock: 110, sku: 'HOME-HG-001',
    images: ['https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600'],
    tags: ['garden', 'herbs', 'indoor', 'organic'], is_featured: false, avg_rating: 4.3, review_count: 47,
  },

  // ── Sports (SportZone) ────────────────────────────────
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Yoga Mat Premium (6mm)', slug: 'yoga-mat-premium-6mm',
    description: 'Non-slip TPE yoga mat with alignment lines. 6mm thick for joint comfort, lightweight and foldable. Comes with carrying strap. Eco-friendly material.',
    price: 29.99, compare_price: 49.99, stock: 180, sku: 'SPRT-YM-001',
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600'],
    tags: ['yoga', 'mat', 'fitness', 'exercise'], is_featured: true, avg_rating: 4.5, review_count: 87,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Adjustable Dumbbell Set (5-25 lbs)', slug: 'adjustable-dumbbell-set',
    description: 'Quick-adjust dumbbells that replace 5 sets of weights. Turn the dial to select weight from 5 to 25 lbs. Space-saving design with durable coating.',
    price: 149.99, compare_price: 219.99, stock: 50, sku: 'SPRT-DB-001',
    images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'],
    tags: ['dumbbells', 'weights', 'strength', 'home-gym'], is_featured: true, avg_rating: 4.7, review_count: 43,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Resistance Bands Set (5 Levels)', slug: 'resistance-bands-set',
    description: 'Set of 5 natural latex resistance bands from light to extra-heavy. Includes door anchor, handles, ankle straps, and workout guide.',
    price: 19.99, compare_price: 34.99, stock: 300, sku: 'SPRT-RB-001',
    images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600'],
    tags: ['resistance-bands', 'workout', 'home-gym', 'stretching'], is_featured: false, avg_rating: 4.3, review_count: 156,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Insulated Water Bottle (32oz)', slug: 'insulated-water-bottle-32oz',
    description: 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold 24 hours or hot 12 hours. Leak-proof lid, BPA-free, wide mouth.',
    price: 24.99, compare_price: 34.99, stock: 250, sku: 'SPRT-WB-001',
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600'],
    tags: ['water-bottle', 'insulated', 'gym', 'hydration'], is_featured: false, avg_rating: 4.6, review_count: 204,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Running Shoes - UltraFlex', slug: 'running-shoes-ultraflex',
    description: 'Lightweight running shoes with responsive foam cushioning and breathable mesh upper. Rubber outsole for superior grip. Great for road running and gym.',
    price: 74.99, compare_price: 109.99, stock: 120, sku: 'SPRT-RS-001',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600'],
    tags: ['shoes', 'running', 'fitness', 'athletic'], is_featured: true, avg_rating: 4.4, review_count: 78,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Foam Roller (18-inch)', slug: 'foam-roller-18inch',
    description: 'High-density EVA foam roller for muscle recovery and deep tissue massage. Textured surface for trigger point therapy. Lightweight and portable.',
    price: 18.99, compare_price: 29.99, stock: 200, sku: 'SPRT-FR-001',
    images: ['https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=600'],
    tags: ['foam-roller', 'recovery', 'massage', 'stretching'], is_featured: false, avg_rating: 4.2, review_count: 62,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Jump Rope - Speed Pro', slug: 'jump-rope-speed-pro',
    description: 'Weighted speed jump rope with ball-bearing system for smooth rotation. Adjustable steel cable with foam grip handles. Great for cardio and crossfit.',
    price: 14.99, compare_price: 24.99, stock: 350, sku: 'SPRT-JR-001',
    images: ['https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=600'],
    tags: ['jump-rope', 'cardio', 'crossfit', 'workout'], is_featured: false, avg_rating: 4.5, review_count: 95,
  },
  {
    vendorIdx: 3, categorySlug: 'sports',
    name: 'Gym Duffle Bag', slug: 'gym-duffle-bag',
    description: 'Large capacity gym bag with separate shoe compartment and wet pocket. Water-resistant fabric, adjustable shoulder strap, and multiple organizer pockets.',
    price: 34.99, compare_price: 54.99, stock: 130, sku: 'SPRT-BG-001',
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'],
    tags: ['bag', 'gym', 'duffle', 'travel'], is_featured: false, avg_rating: 4.3, review_count: 51,
  },

  // ── Books (TechStore Pro - diversifying) ───────────────
  {
    vendorIdx: 0, categorySlug: 'books',
    name: 'JavaScript: The Definitive Guide', slug: 'javascript-definitive-guide',
    description: 'Comprehensive guide to JavaScript covering ES2020+ features, Node.js, and modern web APIs. 700+ pages of in-depth reference for developers.',
    price: 39.99, compare_price: 59.99, stock: 80, sku: 'BOOK-JS-001',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'],
    tags: ['javascript', 'programming', 'web-development', 'reference'], is_featured: false, avg_rating: 4.8, review_count: 142,
  },
  {
    vendorIdx: 0, categorySlug: 'books',
    name: 'The Design of Everyday Things', slug: 'design-of-everyday-things',
    description: 'Don Norman\'s classic on human-centered design. Explores psychology behind good and bad design with real-world examples. Essential for UX designers.',
    price: 16.99, compare_price: 24.99, stock: 120, sku: 'BOOK-DG-001',
    images: ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=600'],
    tags: ['design', 'ux', 'psychology', 'non-fiction'], is_featured: true, avg_rating: 4.6, review_count: 98,
  },

  // ── Beauty (Fashion Hub - expanding) ───────────────────
  {
    vendorIdx: 1, categorySlug: 'beauty',
    name: 'Vitamin C Serum (30ml)', slug: 'vitamin-c-serum-30ml',
    description: '20% Vitamin C serum with hyaluronic acid and vitamin E. Brightens skin, reduces dark spots, and boosts collagen. Suitable for all skin types.',
    price: 19.99, compare_price: 34.99, stock: 200, sku: 'BEAU-VC-001',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'],
    tags: ['skincare', 'serum', 'vitamin-c', 'anti-aging'], is_featured: true, avg_rating: 4.5, review_count: 187,
  },
  {
    vendorIdx: 1, categorySlug: 'beauty',
    name: 'Natural Lip Balm Set (5-Pack)', slug: 'natural-lip-balm-set',
    description: 'Organic lip balms in 5 flavors: Honey, Coconut, Strawberry, Mint, and Vanilla. Made with beeswax, shea butter, and essential oils. Cruelty-free.',
    price: 12.99, compare_price: 19.99, stock: 350, sku: 'BEAU-LB-001',
    images: ['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600'],
    tags: ['lip-balm', 'organic', 'natural', 'skincare'], is_featured: false, avg_rating: 4.4, review_count: 73,
  },

  // ── Toys (HomeMart - expanding) ────────────────────────
  {
    vendorIdx: 2, categorySlug: 'toys',
    name: 'Wooden Building Blocks (100 pcs)', slug: 'wooden-building-blocks-100pcs',
    description: 'Natural wooden building blocks in various shapes and colors. Non-toxic water-based paint, smooth edges, and includes storage bag. Ages 3+.',
    price: 29.99, compare_price: 44.99, stock: 90, sku: 'TOYS-WB-001',
    images: ['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600'],
    tags: ['blocks', 'wooden', 'educational', 'kids'], is_featured: true, avg_rating: 4.7, review_count: 64,
  },
  {
    vendorIdx: 2, categorySlug: 'toys',
    name: 'Remote Control Racing Car', slug: 'rc-racing-car',
    description: '2.4GHz remote control car with 20km/h top speed. All-terrain tires, rechargeable battery, and 80-minute run time. Great for kids and adults.',
    price: 34.99, compare_price: 49.99, stock: 75, sku: 'TOYS-RC-001',
    images: ['https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=600'],
    tags: ['rc-car', 'remote-control', 'racing', 'kids'], is_featured: false, avg_rating: 4.3, review_count: 39,
  },

  // ── Automotive (SportZone - expanding) ─────────────────
  {
    vendorIdx: 3, categorySlug: 'automotive',
    name: 'Car Phone Mount (Magnetic)', slug: 'car-phone-mount-magnetic',
    description: 'Ultra-strong magnetic car phone mount with dashboard and air vent clips. 360° rotation, one-hand operation. Compatible with all smartphones.',
    price: 15.99, compare_price: 24.99, stock: 250, sku: 'AUTO-PM-001',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    tags: ['car', 'phone-mount', 'magnetic', 'accessories'], is_featured: false, avg_rating: 4.2, review_count: 118,
  },
  {
    vendorIdx: 3, categorySlug: 'automotive',
    name: 'Portable Car Vacuum Cleaner', slug: 'portable-car-vacuum-cleaner',
    description: '120W cordless handheld vacuum with HEPA filter. Includes crevice tool, brush nozzle, and extension hose. USB-C rechargeable, 30-min runtime.',
    price: 39.99, compare_price: 59.99, stock: 85, sku: 'AUTO-VC-001',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600'],
    tags: ['car', 'vacuum', 'cordless', 'cleaning'], is_featured: true, avg_rating: 4.4, review_count: 56,
  },
];

// ─── REVIEW TEMPLATES ────────────────────────────────────────
const reviewTemplates = [
  { rating: 5, title: 'Absolutely love it!',       comment: 'Exceeded my expectations. Build quality is excellent and works exactly as described. Would definitely buy again!' },
  { rating: 5, title: 'Best purchase this year',    comment: 'Amazing quality for the price. Fast shipping too. My friends are jealous and want to get one themselves.' },
  { rating: 4, title: 'Great product, minor issues', comment: 'Overall very happy with my purchase. Solid build and works well. Only wish the packaging was a bit better.' },
  { rating: 4, title: 'Very good, recommend!',      comment: 'Good value for money. Does exactly what it says. The color is slightly different from the photos but still looks great.' },
  { rating: 4, title: 'Solid quality',              comment: 'Well-made product that feels premium. Have been using it daily for two weeks without any issues.' },
  { rating: 3, title: 'Decent but expected more',   comment: 'It\'s okay for the price but I expected a bit more based on the description. Still usable and functional though.' },
  { rating: 5, title: 'Perfect gift!',              comment: 'Bought this as a gift and the recipient absolutely loved it. Great packaging and fast delivery. Will order more.' },
  { rating: 4, title: 'Happy customer',             comment: 'Solid product overall. Arrived on time and well-packaged. Performs as expected. Good customer support too.' },
];

// ─── MAIN SEED FUNCTION ─────────────────────────────────────
async function seed() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
    console.log(`✅ Connected to ${MONGODB_DB}`);

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      VendorProfile.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log('✅ Cleared all collections');

    // 1. Create categories
    console.log('📁 Creating categories...');
    const categories = await Category.insertMany(categoriesData);
    const catMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));
    console.log(`✅ Created ${categories.length} categories`);

    // 2. Create users
    console.log('👤 Creating users...');
    const users = [];
    for (const userData of usersData) {
      const user = await User.create(userData); // one-by-one to trigger pre-save password hash
      users.push(user);
    }
    console.log(`✅ Created ${users.length} users`);

    // Separate vendors & customers
    const vendors = users.filter((u) => u.role === 'vendor');
    const customers = users.filter((u) => u.role === 'customer');

    // 3. Create vendor profiles
    console.log('🏪 Creating vendor profiles...');
    const vendorProfiles = [];
    for (let i = 0; i < vendors.length; i++) {
      const vp = await VendorProfile.create({
        ...vendorProfilesData[i],
        user_id: vendors[i]._id,
      });
      vendorProfiles.push(vp);
    }
    console.log(`✅ Created ${vendorProfiles.length} vendor profiles`);

    // 4. Create products
    console.log('📦 Creating products...');
    const products = [];
    for (const pData of productsData) {
      const { vendorIdx, categorySlug, ...productFields } = pData;
      const product = await Product.create({
        ...productFields,
        vendor_id: vendors[vendorIdx]._id,
        category_id: catMap[categorySlug],
      });
      products.push(product);
    }
    console.log(`✅ Created ${products.length} products`);

    // 5. Create reviews
    console.log('⭐ Creating reviews...');
    let reviewCount = 0;
    for (const product of products) {
      // Each product gets 2-4 reviews from random customers
      const numReviews = 2 + Math.floor(Math.random() * 3);
      const shuffledCustomers = [...customers].sort(() => Math.random() - 0.5);

      for (let i = 0; i < Math.min(numReviews, shuffledCustomers.length); i++) {
        const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)];
        try {
          await Review.create({
            product_id: product._id,
            customer_id: shuffledCustomers[i]._id,
            rating: template.rating,
            title: template.title,
            comment: template.comment,
            is_verified_purchase: Math.random() > 0.3,
            is_approved: true,
          });
          reviewCount++;
        } catch (err) {
          // Skip duplicate reviews
        }
      }
    }
    console.log(`✅ Created ${reviewCount} reviews`);

    // 6. Summary
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 SEED COMPLETE!');
    console.log('═'.repeat(50));
    console.log(`
📊 Summary:
   Categories:      ${categories.length}
   Users:           ${users.length} (1 admin, ${vendors.length} vendors, ${customers.length} customers)
   Vendor Profiles: ${vendorProfiles.length}
   Products:        ${products.length}
   Reviews:         ${reviewCount}

🔑 Login Credentials:
   ┌────────────────────────────┬──────────────────┬──────────┐
   │ Email                      │ Password         │ Role     │
   ├────────────────────────────┼──────────────────┼──────────┤
   │ admin@shophub.com          │ Admin@123456     │ admin    │
   │ techstore@shophub.com      │ Vendor@123456    │ vendor   │
   │ fashionhub@shophub.com     │ Vendor@123456    │ vendor   │
   │ homemart@shophub.com       │ Vendor@123456    │ vendor   │
   │ sportzone@shophub.com      │ Vendor@123456    │ vendor   │
   │ customer1@shophub.com      │ Customer@123     │ customer │
   │ customer2@shophub.com      │ Customer@123     │ customer │
   │ customer3@shophub.com      │ Customer@123     │ customer │
   └────────────────────────────┴──────────────────┴──────────┘
`);

  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();