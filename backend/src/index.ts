import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { syncSearchIndex, searchSuggestions, searchFull } from './services/search.service';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Initial Search Sync
syncSearchIndex();

// Security and parser middleware - MUST BE AT THE TOP
app.use(cors({
  origin: 'http://localhost:3000', // Only allow Next.js app to access securely
  credentials: true
}));
app.use(express.json());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// ----------------------------------------------------
// SHIPROCKET INTEGRATION
// ----------------------------------------------------
let shiprocketToken = "";
let tokenExpiry = 0;

const getShiprocketToken = async () => {
  if (shiprocketToken && Date.now() < tokenExpiry) return shiprocketToken;

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD
      })
    });
    if (res.ok) {
      const data = await res.json();
      shiprocketToken = data.token;
      tokenExpiry = Date.now() + 1000 * 60 * 60 * 24; // Valid for 24h
      return shiprocketToken;
    }
  } catch (e) {
    console.error("Shiprocket Auth Failed:", e);
  }
  return null;
};

app.get('/api/shiprocket/serviceability', async (req, res) => {
  try {
    const { pincode, weight = 0.5 } = req.query;
    if (!pincode) return res.status(400).json({ error: "Pincode is required" });

    const token = await getShiprocketToken();
    if (!token) return res.status(500).json({ error: "Shiprocket Authentication Failed" });

    // Check Serviceability
    const url = new URL('https://apiv2.shiprocket.in/v1/external/courier/serviceability/');
    url.searchParams.append('pickup_postcode', process.env.PICKUP_POSTCODE || '110001'); // Default pickup
    url.searchParams.append('delivery_postcode', String(pincode));
    url.searchParams.append('weight', String(weight));
    url.searchParams.append('cod', '1');

    const shipRes = await fetch(url.toString(), {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (shipRes.ok) {
      const data = await shipRes.json();
      if (data.status === 200 && data.data.available_courier_companies.length > 0) {
        // Find the fastest courier
        const fastest = data.data.available_courier_companies.reduce((prev: any, curr: any) => {
          return (new Date(prev.etd) < new Date(curr.etd)) ? prev : curr;
        });
        return res.json({ 
          success: true, 
          etd: fastest.etd, 
          courier: fastest.courier_name,
          pincode 
        });
      }
      return res.status(404).json({ success: false, message: "Delivery not available for this location" });
    }
    res.status(500).json({ error: "Shiprocket Serviceability Call Failed" });
  } catch (error) {
    res.status(500).json({ error: "Backend error during serviceability check" });
  }
});

app.get('/api/shiprocket/track/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const token = await getShiprocketToken();
    if (!token) return res.status(500).json({ error: "Shiprocket Auth Failed" });

    let trackUrl = "";
    if (order.awbCode) {
      trackUrl = `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${order.awbCode}`;
    } else if (order.shiprocketOrderId) {
      trackUrl = `https://apiv2.shiprocket.in/v1/external/courier/track/order/${order.shiprocketOrderId}`;
    } else {
      return res.json({ status: order.status, message: "Tracking not yet available for this order." });
    }

    const shipRes = await fetch(trackUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (shipRes.ok) {
      const data = await shipRes.json();
      
      // Shiprocket keyed response fix: unwrap if keyed by ID
      let finalData = data;
      if (order.shiprocketOrderId && data[order.shiprocketOrderId]) {
        finalData = data[order.shiprocketOrderId];
      } else if (order.awbCode && data[order.awbCode]) {
        finalData = data[order.awbCode];
      }

      return res.json(finalData);
    }
    res.status(500).json({ error: "Failed to fetch tracking info" });
  } catch (error) {
    res.status(500).json({ error: "Tracking API error" });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { 
        address: true,
        items: { include: { product: { include: { images: true } } } }
      }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

const createShiprocketOrder = async (order: any, items: any[]) => {
  const token = await getShiprocketToken();
  if (!token) {
    console.error("❌ Shiprocket Token missing");
    return null;
  }

  try {
    // 1. Resolve full shipping details
    let shippingDetails = {
      name: order.guestName || "Customer",
      email: order.guestEmail || "customer@example.com",
      phone: order.guestPhone || "9999999999",
      address: "",
      address2: "",
      city: "City",
      state: "State",
      pincode: "110001"
    };

    if (order.addressId) {
      const dbAddr = await prisma.address.findUnique({ where: { id: order.addressId } });
      if (dbAddr) {
        shippingDetails = {
          name: dbAddr.name,
          email: order.guestEmail || "customer@example.com",
          phone: dbAddr.phone,
          address: dbAddr.flatNo,
          address2: dbAddr.street,
          city: dbAddr.city,
          state: dbAddr.state || "Delhi",
          pincode: dbAddr.pincode
        };
      }
    } else if (order.guestAddress) {
       const parts = order.guestAddress.split(', ');
       shippingDetails.address = parts[0] || "";
       shippingDetails.address2 = parts[1] || "";
       shippingDetails.city = parts[parts.length - 2]?.trim() || "City";
       shippingDetails.pincode = parts[parts.length - 1]?.trim() || "110001";
       shippingDetails.state = "Delhi"; // Default to a valid state if not found
    }

    const nameParts = shippingDetails.name.trim().split(' ');
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(' ') || ".";

    const payload = {
      order_id: order.id,
      order_date: new Date().toISOString().split('T')[0],
      pickup_location: "Home", 
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shippingDetails.address,
      billing_address_2: shippingDetails.address2,
      billing_city: shippingDetails.city,
      billing_pincode: shippingDetails.pincode,
      billing_state: shippingDetails.state,
      billing_country: "India",
      billing_email: shippingDetails.email,
      billing_phone: shippingDetails.phone.replace(/\D/g, '').slice(-10),
      shipping_is_billing: true,
      order_items: items.map(item => ({
        name: item.product?.name || "Product",
        sku: item.productId,
        units: item.qty,
        selling_price: item.price || item.product?.price || 0
      })),
      payment_method: order.paymentMethod === 'RAZORPAY' ? 'Prepaid' : 'COD',
      sub_total: order.totalAmount,
      length: 10, breadth: 10, height: 10, weight: 0.5
    };

    console.log("📤 Sending to Shiprocket:", JSON.stringify(payload, null, 2));

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && data.order_id) {
      console.log("✅ Shiprocket Order Created Success:", data.order_id);
      return data;
    } else {
      console.error("❌ Shiprocket Error Response:", JSON.stringify(data));
      return null;
    }
  } catch (e) {
    console.error("❌ Shiprocket Order Creation Exception:", e);
    return null;
  }
};

// Edge caching simulator middleware
const cache = new Map();
const cacheMiddleware = (durationInSeconds: number) => (req: any, res: any, next: any) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);
  
  if (cachedResponse && (Date.now() - cachedResponse.timestamp) < durationInSeconds * 1000) {
    return res.json(cachedResponse.data);
  }
  
  res.sendResponse = res.json;
  res.json = (body: any) => {
    cache.set(key, { data: body, timestamp: Date.now() });
    res.sendResponse(body);
  };
  next();
};

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: "Secure Node.js Backend is deeply integrated and active." });
});

app.get('/api/config', (req, res) => {
  res.json({
    codCharge: 50, // This can be moved to DB settings later
    freeDeliveryThreshold: 990,
    freeCodThreshold: 2000,
    deliveryFee: 50
  });
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, cartTotal } = req.body;
  const c = code.toUpperCase();

  if (c === 'SAVANA10') {
    return res.json({ valid: true, discountType: 'PERCENT', value: 10, message: '10% OFF Applied!' });
  }
  if (c === 'HELLO50') {
    return res.json({ valid: true, discountType: 'FLAT', value: 50, message: '₹50 OFF Applied!' });
  }

  res.status(400).json({ valid: false, message: 'Invalid or Expired Coupon' });
});
// ----------------------------------------------------
// NATURAL LANGUAGE SEARCH APIs (FlexSearch powered)
// ----------------------------------------------------
app.get('/api/search/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    const suggestions = await searchSuggestions(String(q || ''));
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: "Suggestion engine error" });
  }
});

app.get('/api/search/full', async (req, res) => {
  try {
    const { q, minPrice, maxPrice, colors, sizes } = req.query;
    const filters = {
       minPrice: minPrice ? Number(minPrice) : undefined,
       maxPrice: maxPrice ? Number(maxPrice) : undefined,
       colors: colors ? (Array.isArray(colors) ? colors : [String(colors)]) : undefined,
       sizes: sizes ? (Array.isArray(sizes) ? sizes : [String(sizes)]) : undefined
    } as any;
    
    const results = await searchFull(String(q || ''), filters);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Search execution error" });
  }
});


// ----------------------------------------------------
// FULLY DYNAMIC: Home Page Feed with Cached Mechanism
// ----------------------------------------------------
app.get('/api/feed/home', cacheMiddleware(60), async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({ where: { isActive: true } });
    const flashSales = await prisma.flashSale.findMany({
      where: { isActive: true },
      include: { product: { include: { images: true } } }
    });
    const hotCategories = await prisma.category.findMany({ where: { isFeatured: true } });
    const specialOffers = await prisma.specialOffer.findMany({ where: { isActive: true } });

    // "You might also like" infinite feed data
    const discoverProducts = await prisma.product.findMany({
      take: 6,
      include: { images: true, colors: true, sizes: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      banners,
      flashSales,
      hotCategories,
      specialOffers,
      discoverProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Secure Database Fetch Failed via Prisma/MySQL." });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// ----------------------------------------------------
// DYNAMIC CATEGORY & PRODUCT APIs
// ----------------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const { categorySlug, page = 1, limit = 6 } = req.query;
    
    let whereClause = {};
    if (categorySlug) {
      whereClause = { category: { slug: String(categorySlug) } };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      include: { images: true, colors: true, sizes: true },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch products securely." });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: String(id) },
      include: { images: true, colors: true, sizes: true }
    });
    
    if (!product) return res.status(404).json({ error: "Product not found" });
    
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch single product" });
  }
});

// ----------------------------------------------------
// SECURE OTP / LOGIN MECHANISMS
// ----------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_savana_jwt_key_2026';

import nodemailer from 'nodemailer';

// Nodemailer Transporter Configuration (Using Environment Variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: "Identifier is required." });

    // Generate real random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationToken.deleteMany({
      where: { identifier: identifier }
    });

    await prisma.verificationToken.create({
      data: {
        identifier: identifier,
        token: otp,
        expires: new Date(Date.now() + 1000 * 60 * 10) 
      }
    });

    // If identifier is an email and SMTP is configured, send the mail
    if (identifier.includes('@') && process.env.SMTP_USER) {
      await transporter.sendMail({
        from: `"Savana Auth" <${process.env.SMTP_USER}>`,
        to: identifier,
        subject: "Your Savana Verification Code",
        text: `Your secure login code is: ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #111; tracking-tight: -0.05em;">savana</h2>
            <p style="font-size: 14px; color: #555;">Use the code below to sign in securely to your Savana account.</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #999;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      return res.status(200).json({ message: "OTP sent successfully to your email!" });
    }

    // Fallback for mobile or missing SMTP (simulated for dev)
    return res.status(200).json({ 
      message: "OTP generated successfully!", 
      simulatedOtp: (process.env.NODE_ENV !== 'production' || !process.env.SMTP_USER) ? otp : undefined 
    });
  } catch (error) {
    console.error("OTP Error:", error);
    return res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.post('/api/auth/verify', async (req, res) => {
  try {
    const { identifier, code } = req.body;
    if (!identifier || !code) return res.status(400).json({ error: "Identifier and OTP required." });

    const record = await prisma.verificationToken.findFirst({
      where: { identifier: identifier, token: code }
    });

    if (!record || new Date() > record.expires) {
      return res.status(401).json({ error: "Invalid or expired OTP." });
    }

    // Check if user exists then login, if not then create account without asking details
    const isEmail = identifier.includes('@');
    
    let user = await prisma.user.findFirst({ 
      where: isEmail ? { email: identifier } : { phone: identifier } 
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          name: 'Savana Member',
          cart: { create: {} },
          wishlist: { create: {} }
        }
      });
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: identifier }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    return res.status(200).json({ 
      message: "Login successful", 
      token,
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role }
    });
  } catch(error) {
    console.error("Verify Error:", error);
    return res.status(500).json({ error: "Failed to verify OTP" });
  }
});
// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// ----------------------------------------------------
const requireAuth = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "Access denied. Token missing." });
    
    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

// ----------------------------------------------------
// USER PROFILE & ADDRESS APIs
// ----------------------------------------------------
app.get('/api/user/profile', requireAuth, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, phone: true, image: true, gender: true, dob: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.put('/api/user/profile', requireAuth, async (req: any, res) => {
  try {
    const { name, phone, gender, dob } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, phone, gender, dob: dob ? new Date(dob) : null }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.get('/api/user/addresses', requireAuth, async (req: any, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.userId },
      orderBy: { isDefault: 'desc' }
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});

app.post('/api/user/addresses', requireAuth, async (req: any, res) => {
  try {
    const { name, phone, pincode, city, state, flatNo, street, isDefault } = req.body;
    
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.userId },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: req.user.userId,
        name, phone, pincode, city, state, flatNo, street,
        isDefault: isDefault || false
      }
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: "Failed to create address" });
  }
});

app.delete('/api/user/addresses/:id', requireAuth, async (req: any, res) => {
  try {
    await prisma.address.delete({
      where: { id: req.params.id, userId: req.user.userId }
    });
    res.json({ message: "Address deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete address" });
  }
});

app.put('/api/user/addresses/:id/default', requireAuth, async (req: any, res) => {
  try {
    await prisma.address.updateMany({
      where: { userId: req.user.userId },
      data: { isDefault: false }
    });

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: { isDefault: true }
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: "Failed to set default address" });
  }
});

app.get('/api/user/orders', requireAuth, async (req: any, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.userId },
      include: { items: { include: { product: { include: { images: true } } } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post('/api/user/orders/:id/cancel', requireAuth, async (req: any, res) => {
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.userId !== req.user.userId) return res.status(403).json({ error: "Unauthorized" });
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      return res.status(400).json({ error: "Cannot cancel a shipped or delivered order" });
    }

    await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    res.json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel order" });
  }
});



// ----------------------------------------------------
// SMART CART APIs (User & Guest)
// ----------------------------------------------------
app.get('/api/cart', async (req: any, res) => {
  try {
    const { userId, guestId } = req.query;
    if (!userId && !guestId) return res.json({ items: [], total: 0 });

    const cart = await prisma.cart.findFirst({
      where: userId ? { userId: String(userId) } : { id: String(guestId) },
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (!cart) return res.json({ items: [], total: 0 });

    const items = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images.find(img => img.isPrimary)?.url || item.product.images[0]?.url,
      qty: item.qty,
      color: item.color,
      size: item.size
    }));

    const total = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    res.json({ cartId: cart.id, items, total });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post('/api/cart/add', async (req, res) => {
  try {
    const { userId, guestId, productId, qty, color, size } = req.body;
    
    let cartId = '';
    
    // Find or Create Cart
    if (userId) {
      const uCart = await prisma.cart.findUnique({ where: { userId } });
      cartId = uCart?.id || (await prisma.cart.create({ data: { userId } })).id;
    } else if (guestId) {
      const gCart = await prisma.cart.findUnique({ where: { id: guestId } });
      cartId = gCart?.id || (await prisma.cart.create({ data: {} })).id;
    } else {
      const newCart = await prisma.cart.create({ data: {} });
      cartId = newCart.id;
    }

    // 4. Add or Update Item
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId, productId, color, size }
    });

    if (existingItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: existingItem.qty + (qty || 1) }
      });
      res.json({ cartId, cartItem: updated });
    } else {
      const cartItem = await prisma.cartItem.create({
        data: { cartId, productId, qty: qty || 1, color, size }
      });
      res.json({ cartId, cartItem });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

app.post('/api/cart/merge', async (req, res) => {
  try {
    const { userId, guestId } = req.body;
    if (!userId || !guestId) return res.status(400).json({ error: "Missing IDs" });

    // 1. Get Guest Cart
    const guestCart = await prisma.cart.findUnique({
      where: { id: guestId },
      include: { items: true }
    });

    if (!guestCart || guestCart.items.length === 0) return res.json({ success: true, message: "No items to merge" });

    // 2. Get or Create User Cart
    let userCart = await prisma.cart.findUnique({ where: { userId } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId } });
    }

    // 3. Move items
    for (const item of guestCart.items) {
       // Check if item already exists in user cart
       const existing = await prisma.cartItem.findFirst({
         where: { cartId: userCart.id, productId: item.productId, color: item.color, size: item.size }
       });
       
       if (existing) {
         await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: existing.qty + item.qty } });
       } else {
         await prisma.cartItem.create({
           data: { cartId: userCart.id, productId: item.productId, qty: item.qty, color: item.color, size: item.size }
         });
       }
    }

    // 4. Delete guest cart
    await prisma.cart.delete({ where: { id: guestId } });

    res.json({ success: true, cartId: userCart.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to merge carts" });
  }
});

app.post('/api/cart/update-qty', async (req, res) => {
  try {
     const { itemId, qty } = req.body;
     await prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
     res.json({ success: true });
  } catch (error) {
     res.status(500).json({ error: "Failed to update quantity" });
  }
});

app.delete('/api/cart/remove/:id', async (req, res) => {
  try {
     await prisma.cartItem.delete({ where: { id: req.params.id } });
     res.json({ success: true });
  } catch (error) {
     res.status(500).json({ error: "Failed to remove item" });
  }
});

// ----------------------------------------------------
// WISHLIST APIs
// ----------------------------------------------------
app.get('/api/wishlist', requireAuth, async (req: any, res) => {
  try {
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.userId },
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: req.user.userId },
        include: { items: { include: { product: { include: { images: true } } } } }
      });
    }

    const items = wishlist.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      image: item.product.images.find(img => img.isPrimary)?.url || item.product.images[0]?.url,
      slug: item.product.slug
    }));

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch wishlist" });
  }
});

app.post('/api/wishlist/toggle', requireAuth, async (req: any, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "Product ID required" });

    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: req.user.userId }
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: req.user.userId }
      });
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId }
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      res.json({ success: true, added: false });
    } else {
      await prisma.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId }
      });
      res.json({ success: true, added: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle wishlist" });
  }
});

app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Error:", error);
    res.status(500).json({ error: error.description || "Failed to create payment order", details: error });
  }
});

// ----------------------------------------------------
// CHECKOUT & ORDERS (Guest / User)
// ----------------------------------------------------
app.post('/api/checkout/place-order', async (req, res) => {
  try {
    const { userId, guestEmail, guestPhone, cartId, totalAmount, paymentMethod, addressId, guestAddress, razorpayDetails } = req.body;

    // 0. Verify Razorpay Payment if Online
    if (paymentMethod === 'RAZORPAY') {
       if (!razorpayDetails) return res.status(400).json({ error: "Payment details missing" });
       const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpayDetails;
       const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || '');
       shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
       const digest = shasum.digest("hex");
       if (digest !== razorpay_signature) return res.status(400).json({ error: "Transaction not legitimate!" });
    }

    // 1. Get Cart Items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: { product: true } } }
    });
    
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    // 2. Handle Address Logic (Silent Converted Guest / User)
    let finalAddressId = addressId;
    if (userId && guestAddress) {
       // Update User Name if it was default
       const usr = await prisma.user.findUnique({ where: { id: userId } });
       if (usr?.name === 'Savana Member' && guestAddress.name) {
          await prisma.user.update({ where: { id: userId }, data: { name: guestAddress.name } });
       }

       const existingAddresses = await prisma.address.findMany({ where: { userId } });
       const match = existingAddresses.find(a => 
          a.flatNo === guestAddress.flatNo && 
          a.street === guestAddress.street && 
          a.pincode === guestAddress.pincode &&
          a.city === guestAddress.city
       );

       if (match) {
          finalAddressId = match.id;
       } else {
          const newAddr = await prisma.address.create({
            data: {
              userId,
              name: guestAddress.name,
              phone: guestAddress.phone,
              pincode: guestAddress.pincode,
              city: guestAddress.city,
              state: guestAddress.state || '',
              flatNo: guestAddress.flatNo,
              street: guestAddress.street,
            }
          });
          finalAddressId = newAddr.id;
       }
    }

    // 3. Create Order Data Object Dynamically
    const orderNo = `ORD${Math.floor(Date.now() / 1000)}${Math.floor(Math.random() * 900) + 100}`;
    const orderStatus = paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING';

    const orderData: any = {
      id: orderNo,
      guestEmail,
      guestPhone,
      guestName: guestAddress?.name,
      guestAddress: guestAddress ? `${guestAddress.flatNo}, ${guestAddress.street}, ${guestAddress.city}, ${guestAddress.pincode}` : null,
      totalAmount,
      paymentMethod,
      status: orderStatus,
      items: {
        create: cart.items.map(item => ({
          productId: item.productId,
          qty: item.qty,
          price: item.product.price,
          color: item.color,
          size: item.size
        }))
      }
    };

    if (userId) orderData.userId = userId;
    if (finalAddressId) orderData.addressId = finalAddressId;

    const order = await prisma.order.create({ data: orderData });

    // 4. Clear Cart
    await prisma.cartItem.deleteMany({ where: { cartId } });

    // 5. Sync with Shiprocket (Async)
    const srOrder = await createShiprocketOrder(order, cart.items);
    if (srOrder) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shiprocketOrderId: String(srOrder.order_id),
          shiprocketShipmentId: String(srOrder.shipment_id)
        }
      });
    }

    res.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Checkout failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 Secure Node.js Backend Started!`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`======================================\n`);
});
