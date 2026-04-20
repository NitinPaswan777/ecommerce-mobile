import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { syncSearchIndex, searchSuggestions, searchFull } from './services/search.service';


dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Initial Search Sync
syncSearchIndex();

// Security and parser middleware - MUST BE AT THE TOP
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4000',
    'http://localhost:5173',
    'http://api.instalook.in',
    'https://api.instalook.in',
    'http://instalook.in',
    'https://instalook.in',
    'http://www.instalook.in',
    'https://www.instalook.in',
    'http://admin.instalook.in',
    'https://admin.instalook.in'
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));
app.get('/api/very-unique-test', (req, res) => res.json({ message: 'working' }));

// ----------------------------------------------------
// ADMIN APIs (Dashboard & Management)
// ----------------------------------------------------
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalRevenue = await prisma.order.aggregate({
      where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      _sum: { totalAmount: true }
    });

    const totalOrders = await prisma.order.count();
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const lowStockCount = await prisma.product.count({ where: { inventory: { lt: 10 } } });

    res.json({
      revenue: totalRevenue._sum.totalAmount || 0,
      orders: totalOrders,
      users: totalUsers,
      lowStock: lowStockCount,
      growth: 15.4 // Simulated growth for UI
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

app.get('/api/admin/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, images: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin products" });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin orders" });
  }
});

app.post('/api/admin/products', async (req, res) => {
  try {
    const {
      name, description, price, originalPrice,
      sku, inventory, categoryId, tag, videoUrl,
      images, colors, sizes, fastDelivery, listedFor, variants
    } = req.body;

    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 10000);

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        sku,
        listedFor,
        inventory: parseInt(inventory),
        tag,
        videoUrl,
        fastDelivery: !!fastDelivery,
        categoryId,
        images: {
          create: images.map((url: string) => ({ url }))
        },
        colors: {
          create: colors.map((c: any) => ({ name: c.name, hexCode: c.hexCode }))
        },
        sizes: {
          create: sizes.map((s: any) => ({ name: typeof s === 'string' ? s : s.name }))
        },
        variants: {
          create: (variants || []).map((v: any) => ({
            color: v.color,
            size: v.size,
            sku: v.sku,
            price: v.price ? parseFloat(v.price) : null,
            inventory: parseInt(v.inventory || '0'),
            images: Array.isArray(v.images) ? v.images.join(',') : (v.images || '')
          }))
        }
      }
    });

    res.status(201).json(product);
  } catch (error: any) {
    console.error("PRODUCT CREATE ERROR:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'field';
      return res.status(400).json({ error: `A product or variant already exists with this ${target}. Please ensure SKUs are unique.` });
    }
    res.status(500).json({ error: "Failed to create product", details: error.message });
  }
});

app.put('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, price, originalPrice, sku, inventory,
      categoryId, tag, videoUrl, images, colors, sizes, fastDelivery,
      listedFor, variants
    } = req.body;

    // Delete existing relations to "overwrite" them
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.color.deleteMany({ where: { productId: id } });
    await prisma.size.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        sku,
        listedFor,
        inventory: parseInt(inventory),
        tag,
        videoUrl,
        fastDelivery: !!fastDelivery,
        categoryId,
        images: {
          create: images.map((url: string) => ({ url }))
        },
        colors: {
          create: colors.map((c: any) => ({ name: c.name, hexCode: c.hexCode }))
        },
        sizes: {
          create: sizes.map((s: any) => ({ name: typeof s === 'string' ? s : s.name }))
        },
        variants: {
          create: (variants || []).map((v: any) => ({
            color: v.color,
            size: v.size,
            sku: v.sku,
            price: v.price ? parseFloat(v.price) : null,
            inventory: parseInt(v.inventory || '0'),
            images: Array.isArray(v.images) ? v.images.join(',') : (v.images || '')
          }))
        }
      }
    });

    res.json(product);
  } catch (error: any) {
    console.error("UPDATE ERROR:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'field';
      return res.status(400).json({ error: `A product or variant already exists with this ${target}. Please ensure SKUs are unique.` });
    }
    res.status(500).json({ error: "Failed to update product", details: error.message });
  }
});


app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Cascading delete manually if not set in DB
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.color.deleteMany({ where: { productId: id } });
    await prisma.size.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: id } });

    await prisma.product.delete({
      where: { id }
    });

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Bulk Upload Setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/admin/products/bulk', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results = [];
    for (const row of data as any[]) {
      try {
        const {
          name, description, price, originalPrice, sku, inventory,
          categoryName, tag, videoUrl, images, colors, sizes, fastDelivery,
          listedFor
        } = row;

        if (!name || !price || !categoryName) continue;

        let category = await prisma.category.findFirst({
          where: { name: categoryName }
        });

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/ /g, '-')
            }
          });
        }

        const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 10000);
        const finalSku = sku || `SKU-${Math.floor(Math.random() * 100000)}`;

        // Check if SKU already exists to avoid unique constraint crash
        const existingProduct = await prisma.product.findUnique({ where: { sku: finalSku } });
        if (existingProduct) {
          console.log(`Skipping existing SKU: ${finalSku}`);
          continue;
        }

        const product = await prisma.product.create({
          data: {
            name,
            slug,
            description: description || "",
            price: parseFloat(price),
            originalPrice: originalPrice ? parseFloat(originalPrice) : null,
            sku: finalSku,
            inventory: parseInt(inventory || "0"),
            tag,
            listedFor: listedFor || "mens_cloth",
            videoUrl,
            fastDelivery: String(fastDelivery).toLowerCase() === 'true',
            categoryId: category.id,
            images: {
              create: images ? images.split(',').map((url: string) => ({ url: url.trim() })) : []
            },
            colors: {
              create: colors ? colors.split(',').map((c: string) => {
                const [cName, hex] = c.split('|');
                return { name: cName.trim(), hexCode: (hex || '#000000').trim() };
              }) : []
            },
            sizes: {
              create: sizes ? String(sizes).split(',').map((s: string) => ({ name: s.trim() })) : []
            }
          }
        });
        results.push(product.id);
      } catch (err) {
        console.error("Bulk Item Error:", err);
      }
    }

    res.json({ success: true, count: results.length });
  } catch (error) {
    console.error("Bulk Upload Error:", error);
    res.status(500).json({ error: "Failed to process bulk upload" });
  }
});



app.post('/api/notifications/request', async (req, res) => {
  try {
    const { email, productId } = req.body;
    if (!email || !productId) return res.status(400).json({ error: "Missing required fields" });

    // Check if already exists
    const existing = await prisma.notificationRequest.findFirst({
      where: { email, productId, status: "PENDING" }
    });

    if (existing) {
      return res.status(200).json({ message: "Already subscribed!" });
    }

    const request = await prisma.notificationRequest.create({
      data: { email, productId }
    });

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create notification request" });
  }
});

app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});



app.get('/api/settings', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'global' } });
    res.json(config || { siteName: "instalook Style" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// ----------------------------------------------------
// WEBSITE CONFIGURATION APIs
// ----------------------------------------------------
app.get('/api/admin/site-config', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'global' }
    });
    if (!config) {
      const defaultConfig = await prisma.siteConfig.create({
        data: { id: 'global', siteName: 'instalook Style' }
      });
      return res.json(defaultConfig);
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch site configuration" });
  }
});

app.post('/api/admin/site-config', async (req, res) => {
  try {
    const { logoUrl, bannerUrl, bannerType, siteName } = req.body;
    const config = await prisma.siteConfig.upsert({
      where: { id: 'global' },
      update: { logoUrl, bannerUrl, bannerType, siteName },
      create: { id: 'global', logoUrl, bannerUrl, bannerType, siteName }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to update site configuration" });
  }
});

// Generic File Upload for Admin
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const dir = './public/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});
const diskUpload = multer({ storage: diskStorage });

app.post('/api/admin/upload', diskUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const url = `${backendUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

// ----------------------------------------------------
// HOME SECTION APIs
// ----------------------------------------------------
app.get('/api/admin/sections', async (req, res) => {
  try {
    const sections = await prisma.homeSection.findMany({
      include: { products: { include: { images: true } } },
      orderBy: { position: 'asc' }
    });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sections" });
  }
});

app.post('/api/admin/sections', async (req, res) => {
  try {
    const { title, position } = req.body;
    const section = await prisma.homeSection.create({
      data: { title, position: parseInt(position || '0') }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: "Failed to create section" });
  }
});

app.post('/api/admin/sections/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;
    const section = await prisma.homeSection.update({
      where: { id },
      data: {
        products: { connect: { id: productId } }
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: "Failed to add product to section" });
  }
});

app.delete('/api/admin/sections/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;
    const section = await prisma.homeSection.update({
      where: { id },
      data: {
        products: { disconnect: { id: productId } }
      }
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: "Failed to remove product from section" });
  }
});

app.delete('/api/admin/sections/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.homeSection.delete({ where: { id } });
    res.json({ message: "Section deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete section" });
  }
});


// ----------------------------------------------------
// BANNER APIs
// ----------------------------------------------------
app.get('/api/admin/banners', async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
});

app.post('/api/admin/banners', async (req, res) => {
  try {
    const { title, subtitle, link, imageUrl, position, isActive, showOverlay } = req.body;
    const banner = await prisma.banner.create({
      data: {
        title: title || "",
        subtitle: subtitle || "",
        link: link || "/",
        imageUrl,
        position: position || "HERO",
        isActive: isActive !== undefined ? !!isActive : true,
        showOverlay: showOverlay !== undefined ? !!showOverlay : true
      }
    });
    res.json(banner);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create banner" });
  }
});

app.put('/api/admin/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, link, imageUrl, position, isActive, showOverlay } = req.body;
    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title,
        subtitle,
        link,
        imageUrl,
        position,
        isActive: !!isActive,
        showOverlay: !!showOverlay
      }
    });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: "Failed to update banner" });
  }
});

app.delete('/api/admin/banners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.json({ message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete banner" });
  }
});

// ----------------------------------------------------
// CATEGORY APIs
// ----------------------------------------------------
app.get('/api/admin/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name, image, isFeatured } = req.body;
    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const category = await prisma.category.create({
      data: { name, slug, image, isFeatured: !!isFeatured }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

app.put('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, isFeatured } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        image,
        isFeatured: isFeatured !== undefined ? !!isFeatured : undefined
      }
    });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: "Failed to update category" });
  }
});

app.delete('/api/admin/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.json({ message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category" });
  }
});

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

app.get('/api/settings', async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'global' } });
    res.json(config || { siteName: "instalook Style" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.post('/api/coupons/validate', (req, res) => {
  const { code, cartTotal } = req.body;
  const c = code.toUpperCase();

  if (c === 'instalook10') {
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
app.get('/api/feed/home', cacheMiddleware(0), async (req, res) => {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { id: 'global' } });
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

    // Home Sections (Curated + Auto Tag-based)
    const curatedSectionsData = await prisma.homeSection.findMany({
      where: { isActive: true },
      include: {
        products: {
          take: 12,
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    });

    const curatedSections = await Promise.all(curatedSectionsData.map(async (section) => {
      // Find products that have a matching tag
      const taggedProducts = await prisma.product.findMany({
        where: { tag: section.title },
        take: 12,
        include: { images: true }
      });

      // Extract actual products from the join table
      const manualProducts = section.products.map(hp => hp.product);
      
      // Merge and remove duplicates (by ID)
      const existingIds = new Set(manualProducts.map(p => p.id));
      const newProducts = taggedProducts.filter(p => !existingIds.has(p.id));

      return {
        ...section,
        products: [...manualProducts, ...newProducts].slice(0, 12)
      };
    }));


    res.status(200).json({
      config,
      banners,
      flashSales,
      hotCategories,
      specialOffers,
      discoverProducts,
      tagSections: [],
      curatedSections
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
    const p = Math.max(1, Number(page) || 1);
    const l = Math.max(1, Number(limit) || 6);

    let whereClause = {};
    if (categorySlug) {
      whereClause = { category: { slug: String(categorySlug) } };
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: l,
      skip: (p - 1) * l,
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
      include: { images: true, colors: true, sizes: true, variants: true }
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

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_instalook_jwt_key_2026';

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
        from: `"instalook Auth" <${process.env.SMTP_USER}>`,
        to: identifier,
        subject: "Your instalook Verification Code",
        text: `Your secure login code is: ${otp}. It expires in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 400px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #111; tracking-tight: -0.05em;">instalook</h2>
            <p style="font-size: 14px; color: #555;">Use the code below to sign in securely to your instalook account.</p>
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
          name: 'instalook Member',
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
  } catch (error) {
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
      // Check if user exists first to prevent foreign key errors after DB reset
      const userExists = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!userExists) return res.status(401).json({ error: "User no longer exists. Please logout and login again." });

      wishlist = await prisma.wishlist.create({
        data: { userId: req.user.userId },
        include: { items: { include: { product: { include: { images: true } } } } }
      });
    }

    const items = (wishlist?.items || [])
      .filter(item => item.product) // Safety against broken relations
      .map(item => ({
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
    console.error("WISHLIST_FETCH_ERROR:", error);
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
      const userExists = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (!userExists) return res.status(401).json({ error: "User no longer exists. Please logout and login again." });

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
      if (usr?.name === 'instalook Member' && guestAddress.name) {
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
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`\n======================================`);
  console.log(`🚀 Secure Node.js Backend Started!`);
  console.log(`📡 URL: ${backendUrl}`);
  console.log(`📡 PORT: ${PORT}`);
  console.log(`======================================\n`);
});
