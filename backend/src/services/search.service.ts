import { Index, Document } from "flexsearch";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create a high-performance document index
const productIndex = new Document({
  document: {
    id: "id",
    index: ["name", "description", "category", "tags", "colors"],
    store: ["id", "name", "price", "image", "slug"]
  },
  tokenize: "full", // Supports partial matches for autocomplete
  context: true,
  cache: true
});

/**
 * Syncs the database products into the FlexSearch index
 */
export async function syncSearchIndex() {
  console.log("🔍 Syncing Search Index...");
  const products = await prisma.product.findMany({
    include: {
      category: true,
      images: true,
      colors: true,
      sizes: true
    }
  });

  products.forEach((p) => {
    productIndex.add({
      id: p.id,
      name: p.name,
      description: p.description || "",
      category: p.category.name,
      tags: p.tag || "",
      colors: p.colors.map(c => c.name).join(" "),
      // Store fields for instant UI feedback without DB lookup
      image: p.images.find(img => img.isPrimary)?.url || p.images[0]?.url,
      price: p.price,
      slug: p.slug
    });
  });

  console.log(`✅ Index Synced: ${products.length} products`);
}

/**
 * Instant autocomplete suggestions
 */
export async function searchSuggestions(query: string) {
  if (!query) return [];
  
  // Split query into individual words for broader matching
  const words = query.trim().split(/\s+/);
  
  // Collect results for each word
  const allDocs: any[] = [];
  const seenIds = new Set();

  for (const word of words) {
     if (word.length < 2) continue;
     
     const results = await productIndex.search(word, {
        limit: 10,
        enrich: true,
        suggest: true
     });

     results.forEach(fieldResult => {
        fieldResult.result.forEach((item: any) => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            allDocs.push(item.doc);
          }
        });
     });
  }

  // If no multi-word match, try the whole query as a fallback
  if (allDocs.length === 0) {
     const results = await productIndex.search(query, { limit: 10, enrich: true, suggest: true });
     results.forEach(fr => fr.result.forEach((it: any) => {
        if (!seenIds.has(it.id)) {
            seenIds.add(it.id);
            allDocs.push(it.doc);
        }
     }));
  }

  return allDocs.slice(0, 6);
}

/**
 * Full page search results with filtering
 */
export async function searchFull(query: string, filters?: { minPrice?: number, maxPrice?: number, sizes?: string[], colors?: string[] }) {
    console.log(`🔎 Full Search: "${query}"`);
    const words = query.trim().split(/\s+/);
    const idsSet = new Set<string>();

    for (const word of words) {
        if (word.length < 2) continue;
        const wordResults = await productIndex.search(word, { limit: 20, enrich: true });
        wordResults.forEach(fr => {
            fr.result.forEach((it: any) => {
                idsSet.add(it.id as string);
            });
        });
    }

    // Fallback: search entire phrase if no words matched (unlikely but safe)
    if (idsSet.size === 0) {
        const fullResults = await productIndex.search(query, { limit: 20, enrich: true });
        fullResults.forEach(fr => fr.result.forEach((it: any) => idsSet.add(it.id as string)));
    }

    const ids = Array.from(idsSet);
    console.log(`🎯 Found Unique IDs: ${ids.length} [${ids.join(', ')}]`);
    if (ids.length === 0) return [];

    // 2. Fetch from DB with filters
    const products = await prisma.product.findMany({
        where: {
            id: { in: ids },
            ...(filters?.minPrice || filters?.maxPrice ? {
                price: {
                    gte: Number(filters.minPrice) || 0,
                    lte: Number(filters.maxPrice) || 1000000
                }
            } : {}),
            ...(filters?.colors?.length ? {
                colors: { some: { name: { in: filters.colors } } }
            } : {}),
            ...(filters?.sizes?.length ? {
                sizes: { some: { name: { in: filters.sizes } } }
            } : {})
        },
        include: { images: true, colors: true, sizes: true }
    });

    console.log(`📦 DB results: ${products.length}`);
    // 3. Sort by search relevance
    return products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}
