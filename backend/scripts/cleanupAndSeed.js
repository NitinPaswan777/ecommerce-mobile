
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 1: Cleaning Database ---');
  await prisma.homeSectionProduct.deleteMany({});
  await prisma.specialOffer.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.wishlistItem.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.color.deleteMany({});
  await prisma.size.deleteMany({});
  await prisma.flashSale.deleteMany({});
  await prisma.notificationRequest.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  // Keeping: HomeSection, Banner, SiteConfig, Order, Address, etc. for structural integrity

  console.log('--- Phase 2: Fetching Current Home Sections ---');
  const homeSections = await prisma.homeSection.findMany();
  const sectionTitles = homeSections.map(s => s.title);
  console.log(`Found ${sectionTitles.length} active sections: ${sectionTitles.join(', ')}`);

  console.log('--- Phase 3: Seeding Categories ---');
  const catData = [
    { name: "Men's Clothing", slug: "mens-clothing", imgId: "1490114538077-0a7f8cb49891", type: "mens_cloth" },
    { name: "Women's Clothing", slug: "womens-clothing", imgId: "1525507119028-ed4c629a60a3", type: "womens_cloth" },
    { name: "Kids' Wear", slug: "kids-wear", imgId: "1519706347247-ca7113f51a02", type: "kids_wear" },
    { name: "Men's Shoes", slug: "mens-shoes", imgId: "1549298916-b41d501d3772", type: "men_shoes" },
    { name: "Women's Shoes", slug: "womens-shoes", imgId: "1543163521-1bf539c55dd2", type: "women_shoes" }
  ];

  const categories = [];
  for (const c of catData) {
    const created = await prisma.category.create({
      data: {
        name: c.name,
        slug: c.slug,
        isFeatured: true,
        image: `https://images.unsplash.com/photo-${c.imgId}?q=80&w=800&auto=format&fit=crop`
      }
    });
    categories.push({ ...created, type: c.type });
  }

  console.log('--- Phase 4: Generating 500+ Products with Variants & Grouping ---');
  
  const imgIds = [
    "1515886657613-9f3515b0c78f", "1525507119028-ed4c629a60a3", "1492707892479-7bc8d5a4ee93",
    "1494726161322-5360d4ad0ee1", "1583743814966-8936f5b7be1a", "1549298916-b41d501d3772",
    "1543163521-1bf539c55dd2", "1460353581641-37b00224268b", "1512374382149-18152271ce75",
    "1496747611176-843222e1e57c", "1581044777550-4cfa60707c03", "1585487000160-6ebcfceb0d03",
    "1591195853828-11db59a44f6b", "1506152983158-b4a74a03bcb3", "1544441892731-25376595503b"
  ];

  const adjectives = ["Premium", "Urban", "Classic", "Arctic", "Essential", "Modern", "Luxury", "Minimal", "Vintage", "Sleek"];
  const nouns = ["Blazer", "Denim", "Sneakers", "Watch", "Tee", "Dress", "Boots", "Coat", "Bag", "Loafers"];

  const sectionCounter = {};
  sectionTitles.forEach(t => sectionCounter[t] = 0);

  for (let i = 1; i <= 500; i++) {
    const adj = adjectives[i % adjectives.length];
    const noun = nouns[i % nouns.length];
    const name = `${adj} ${noun} ${i}`;
    const slug = `${adj.toLowerCase()}-${noun.toLowerCase()}-${i}`;
    
    const cat = categories[i % categories.length];
    const img1 = `https://images.unsplash.com/photo-${imgIds[i % imgIds.length]}?q=80&w=800&auto=format&fit=crop`;
    const img2 = `https://images.unsplash.com/photo-${imgIds[(i + 1) % imgIds.length]}?q=80&w=800&auto=format&fit=crop`;

    // Assign to a section if quota not met
    let tag = null;
    for (const title of sectionTitles) {
      if (sectionCounter[title] < 45) {
        tag = title;
        sectionCounter[title]++;
        break;
      }
    }

    const price = 1500 + (Math.random() * 8000);
    const colors = ["Red", "Blue", "Black"];
    const sizes = ["S", "M", "L"];

    await prisma.product.create({
      data: {
        name,
        slug,
        description: `Experience the peak of contemporary design with this ${name}. Crafted for the style-conscious individual.`,
        price: price,
        originalPrice: price * 1.5,
        categoryId: cat.id,
        listedFor: cat.type,
        inventory: 1000, // Total inventory
        tag: tag,
        fastDelivery: i % 3 === 0,
        images: {
          create: [{ url: img1, isPrimary: true }, { url: img2, isPrimary: false }]
        },
        colors: {
           create: colors.map(c => ({ name: c, hexCode: c === 'Red' ? '#ff0000' : c === 'Blue' ? '#0000ff' : '#000000' }))
        },
        sizes: {
           create: sizes.map(s => ({ name: s }))
        },
        variants: {
          create: colors.flatMap(color => sizes.map(size => ({
            color,
            size,
            sku: `${slug}-${color.toUpperCase()}-${size}`,
            price: price,
            inventory: 50,
            images: color === 'Red' ? img1 : img2 // Simulate color specific images
          })))
        }
      }
    });

    if (i % 50 === 0) console.log(`Created ${i} products...`);
  }

  console.log('--- Final Tagging Quotas ---');
  console.log(sectionCounter);
  console.log('--- Seeding Complete ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
