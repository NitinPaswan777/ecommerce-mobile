import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Database...')

  // 1. Create Categories
  const dresses = await prisma.category.upsert({
    where: { slug: 'dresses' },
    update: {},
    create: {
      name: 'DRESSES',
      slug: 'dresses',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop',
      isFeatured: true
    }
  })

  const tops = await prisma.category.upsert({
    where: { slug: 'tops' },
    update: {},
    create: {
      name: 'TOPS',
      slug: 'tops',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop',
      isFeatured: true
    }
  })

  const skirts = await prisma.category.upsert({
    where: { slug: 'skirts' },
    update: {},
    create: {
      name: 'SKIRTS',
      slug: 'skirts',
      image: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?q=80&w=400&auto=format&fit=crop',
      isFeatured: true
    }
  })

  // 2. Create Products
  const p1 = await prisma.product.upsert({
    where: { slug: 'a-line-dress' },
    update: {},
    create: {
      name: 'A-Line Dress',
      slug: 'a-line-dress',
      price: 1042,
      originalPrice: 1390,
      fastDelivery: true,
      categoryId: dresses.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=400&auto=format&fit=crop', isPrimary: true }
        ]
      },
      colors: {
        create: [
          { name: 'Blue', hexCode: '#AEC6CF' },
          { name: 'Pink', hexCode: '#FFB6C1' },
          { name: 'Beige', hexCode: '#F5DEB3' }
        ]
      },
      sizes: {
        create: [{ name: 'S' }, { name: 'M' }, { name: 'L' }]
      }
    }
  })

  const p2 = await prisma.product.upsert({
    where: { slug: 'silky-draped-top' },
    update: {},
    create: {
      name: 'Silky Draped Top',
      slug: 'silky-draped-top',
      price: 690,
      fastDelivery: false,
      tag: 'Trendy',
      videoUrl: 'https://video101.mfrcdn.com/invoice-file/1973422_324192_IN_3cbabf595a8b0b1519dc58f2de743b85_vql.mp4_r540_crf30_h264.mp4',
      categoryId: tops.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop', isPrimary: true }
        ]
      }
    }
  })

  const p3 = await prisma.product.upsert({
    where: { slug: 'pocket-placket-blouse' },
    update: {},
    create: {
      name: 'Pocket Placket Blouse',
      slug: 'pocket-placket-blouse',
      price: 990,
      fastDelivery: true,
      categoryId: tops.id,
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1550639525-c97d455acf70?q=80&w=400&auto=format&fit=crop', isPrimary: true }
        ]
      }
    }
  })

  // 3. Create Home Banners
  await prisma.banner.deleteMany()
  await prisma.banner.createMany({
    data: [
      {
        title: 'Pastel Dreams',
        subtitle: 'Soft shades, light moods, and outfits that feel easy all day',
        buttonText: 'Shop Pastels',
        link: '/category',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
        position: 'HERO_1'
      }
    ]
  })

  // 4. Create Special Offers
  await prisma.specialOffer.deleteMany() // Reset
  await prisma.specialOffer.createMany({
    data: [
      {
        title: 'Accessories',
        priceText: '90',
        badgeText: 'Starts at',
        link: '/category',
        imageUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=400&auto=format&fit=crop'
      },
      {
        title: 'Iconic Tops',
        priceText: '590',
        badgeText: 'Under',
        link: '/category',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400&auto=format&fit=crop'
      }
    ]
  })

  // 5. Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@instalook.in'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { 
      password: adminPassword,
      role: 'ADMIN'
    },
    create: {
      name: 'Admin User',
      email: adminEmail,
      password: adminPassword,
      role: 'ADMIN'
    }
  })
  console.log(`Admin user created/updated: ${adminEmail} / ${adminPassword}`)

  console.log('Seeding Completed Succesfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
