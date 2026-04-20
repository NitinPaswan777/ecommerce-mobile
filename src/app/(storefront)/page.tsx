"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Truck, RefreshCw, ArrowRight, Heart, Sparkles, ShoppingBag, Star } from "lucide-react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";

const FashionPlaceholder = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop";

export default function Home() {
  const [feedData, setFeedData] = useState<any>({
    banners: [],
    flashSales: [],
    hotCategories: [],
    specialOffers: [],
    discoverProducts: [],
    curatedSections: [],
    config: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/feed/home`);
        if (res.ok) {
          let data = await res.json();
          if (!data.hotCategories || data.hotCategories.length === 0) {
            const catRes = await fetch(`${backendUrl}/api/categories`);
            if (catRes.ok) data.hotCategories = await catRes.json();
          }
          setFeedData(data);
        }
      } catch (error) {
        console.error("Failed to fetch backend data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-white" />;

  const { config, banners, hotCategories, discoverProducts, curatedSections } = feedData;
  const heroBanner = banners.find((b: any) => b.position === 'HERO_1') || (banners.length > 0 ? banners[0] : null);

  const renderSection = (section: any, idx: number) => {
    if (!section.products || section.products.length === 0) return null;
    const variant = idx % 5;

    const header = (
      <div className="flex items-end justify-between mt-12 mb-6 px-2">
        <div className="flex flex-col ">
          <p className="text-red-500 text-[10px] font-black tracking-[0.3em] uppercase mb-1">
            {variant === 0 ? "Trending" : variant === 1 ? "New In" : variant === 2 ? "Editor's Choice" : variant === 3 ? "Bestsellers" : "Must Have"}
          </p>
          <h2 className="text-[2rem] font-black uppercase text-black tracking-tighter leading-none ">{section.title}</h2>
        </div>
        <Link href="/category" className="bg-black text-white px-5 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-lg">Shop All</Link>
      </div>
    );

    // STYLE 0: ASYMMETRIC TRIO RAIL (NEW DESIGN)
    if (variant === 0) {
      // Group products into chunks of 3 for the layout
      const chunks = [];
      for (let i = 0; i < section.products.length; i += 3) {
        chunks.push(section.products.slice(i, i + 3));
      }

      return (
        <div key={idx} className="overflow-hidden">
          <div className="px-6">{header}</div>
          <div className="flex overflow-x-auto gap-10 px-6 pb-12 hide-scrollbar snap-x">
            {chunks.map((chunk, cIdx) => (
              <div key={cIdx} className="flex gap-4 shrink-0 snap-start">
                {/* Feature Card */}
                {chunk[0] && (
                  <Link href={`/product?id=${chunk[0].id}`} style={{ width: '220px', flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '160%', backgroundColor: '#F8F8F8', borderRadius: '3rem', overflow: 'hidden' }}>
                      <Image src={chunk[0].images?.[0]?.url || FashionPlaceholder} alt={chunk[0].name} fill className="object-cover" unoptimized />
                      <div className="absolute bottom-6 left-6 right-6">
                        <div className="bg-black text-white p-4 rounded-2xl shadow-2xl">
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">{chunk[0].name}</p>
                          <p className="text-[14px] font-black">₹{chunk[0].price}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                )}

                {/* Stacked Small Cards */}
                <div className="flex flex-col gap-4">
                  {chunk.slice(1, 3).map((product, pIdx) => (
                    <Link href={`/product?id=${product.id}`} key={pIdx} style={{ width: '160px', flexShrink: 0 }}>
                      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#F8F8F8', borderRadius: '2rem', overflow: 'hidden' }}>
                        <Image src={product.images?.[0]?.url || FashionPlaceholder} alt={product.name} fill className="object-cover" unoptimized />
                        <div className="absolute top-4 right-4 bg-white text-black px-3 py-1.5 rounded-full font-black text-[10px] shadow-lg">₹{product.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // STYLE 1: 2-COLUMN GRID
    if (variant === 1) {
      return (
        <div key={idx} className="mt-20 mb-24 px-4 bg-gray-50 py-12 rounded-[3.5rem] border border-gray-100 mx-2">
          {header}
          <div className="grid grid-cols-2 gap-3">
            {section.products.slice(0, 4).map((product: any, pIdx: number) => (
              <Link href={`/product?id=${product.id}`} key={pIdx} className="flex flex-col bg-white p-2 rounded-[2rem] shadow-sm">
                <div style={{ position: 'relative', width: '100%', paddingBottom: '120%', borderRadius: '1.5rem', overflow: 'hidden' }}>
                  <Image src={product.images?.[0]?.url || FashionPlaceholder} alt={product.name} fill className="object-cover" unoptimized />
                </div>
                <div className="p-2 pt-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase truncate">{product.name}</p>
                  <p className="text-sm font-black text-black">₹{product.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    // STYLE 2: LARGE FEATURE + SCROLL
    if (variant === 2) {
      const feature = section.products[0];
      const others = section.products.slice(1);
      return (
        <div key={idx} className="mt-20 mb-24 px-4">
          {header}
          <div className="flex flex-col gap-4">
            <Link href={`/product?id=${feature.id}`} style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', borderRadius: '2.5rem', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
              <Image src={feature.images?.[0]?.url || FashionPlaceholder} alt={feature.name} fill className="object-cover" unoptimized />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Spotlight</p>
                <h3 className="text-white text-xl font-black uppercase truncate">{feature.name}</h3>
              </div>
            </Link>
            <div className="flex overflow-x-auto gap-4 py-2 hide-scrollbar">
              {others.map((product: any, pIdx: number) => (
                <Link href={`/product?id=${product.id}`} key={pIdx} className="min-w-[140px] w-[140px] flex flex-col gap-2">
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', borderRadius: '1.2rem', overflow: 'hidden', border: '1px solid #eee' }}>
                    <Image src={product.images?.[0]?.url || FashionPlaceholder} alt={product.name} fill className="object-cover" unoptimized />
                  </div>
                  <p className="text-[12px] font-black text-black">₹{product.price}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // STYLE 3: CIRCULAR ICONS STYLE (Pastel Background)
    if (variant === 3) {
      return (
        <div key={idx} className="mt-20 mb-24 py-12 px-6" style={{ background: 'linear-gradient(to right, #FFF5F7, #FFFBF0)', borderRadius: '4rem' }}>
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Iconic Pieces</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-black">{section.title}</h2>
          </div>
          <div className="flex overflow-x-auto gap-8 pb-6 hide-scrollbar">
            {section.products.slice(0, 5).map((product: any, pIdx: number) => (
              <Link href={`/product?id=${product.id}`} key={pIdx} className="flex flex-col items-center gap-4 shrink-0">
                <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                  <Image src={product.images?.[0]?.url || FashionPlaceholder} alt={product.name} fill className="object-cover" unoptimized />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-black text-black">₹{product.price}</p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate w-24">Shop Now</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    // STYLE 4: MINIMALIST TILES
    if (variant === 4) {
      return (
        <div key={idx} className="mt-20 mb-24 px-4">
          <div className="flex flex-col items-center mb-10 text-center">
            <h2 className="text-4xl font-black uppercase tracking-[-0.05em] text-black italic">{section.title}</h2>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-[1.5rem] overflow-hidden">
            {section.products.slice(0, 4).map((product: any, pIdx: number) => (
              <div key={pIdx} style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: 'white' }}>
                <Link href={`/product?id=${product.id}`}>
                  <Image src={product.images?.[0]?.url || FashionPlaceholder} alt={product.name} fill className="object-cover" unoptimized />
                  <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-black px-2 py-1 rounded">₹{product.price}</div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col w-full pb-20 overflow-x-hidden bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker-fixed { display: flex; white-space: nowrap; width: max-content; animation: marquee 30s linear infinite; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Ticker */}
      <div className="bg-black text-white py-2.5 overflow-hidden w-full relative">
        <div className="animate-ticker-fixed">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex flex-nowrap items-center shrink-0">
              <span className="mx-6 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">✨ Free Shipping on orders over ₹990 ✨</span>
              <span className="mx-6 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-1.5"><Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> UP TO 70% OFF FLASH SALE</span>
              <span className="mx-6 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">✨ New Arrivals every Friday ✨</span>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Thumbnail Scroll (FIXED 200px HEIGHT) */}
      <div
        style={{ width: '100%', height: '200px', display: 'flex', overflowX: 'auto', backgroundColor: '#f1f5f9' }}
        className="snap-x snap-mandatory hide-scrollbar"
      >
        {banners && banners.length > 0 ? (
          banners.map((banner: any, bIdx: number) => (
            <div key={bIdx} style={{ minWidth: '100%', height: '100%', position: 'relative' }} className="snap-start group">
              <Link href={banner.link || "/category"} className="absolute inset-0 z-10" />
              <Image
                src={banner.imageUrl || FashionPlaceholder}
                alt={banner.title || `Banner ${bIdx}`}
                fill
                className="object-cover"
                priority={bIdx === 0}
                unoptimized
              />
              {banner.showOverlay !== false && (
                <div className="absolute inset-x-0 bottom-0 top-0 bg-black/40 flex flex-col justify-center px-10 pointer-events-none">
                  <h2 className="text-[2rem] font-black text-white uppercase tracking-tighter leading-tight drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: (banner.title || (config?.siteName + " Collection")) }} />
                  {banner.subtitle && <p className="text-white/90 text-[11px] font-black uppercase tracking-[0.2em] mt-1">{banner.subtitle}</p>}
                  <div className="mt-5 w-fit bg-white text-black px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                    Shop Now
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Visuals...</div>
          </div>
        )}
      </div>

      {/* Hot Categories (Circular) */}
      {hotCategories && hotCategories.length > 0 && (
        <div className="mt-6 mb-16">
          <div className="flex items-center justify-between px-6 mt-1">
            <h3 className="text-[1.8rem] font-black uppercase text-black tracking-tighter">Hot Picks</h3>
            <Link href="/category" className="text-[10px] font-black uppercase border-b-2 border-black pb-0.5">Explore</Link>
          </div>
          <div className="flex overflow-x-auto gap-5 px-6 pb-6 hide-scrollbar flex-nowrap">
            {hotCategories.map((cat: any, i: number) => (
              <Link href={`/category?slug=${cat.slug}`} key={i} className="flex flex-col items-center gap-3 shrink-0 group">
                <div style={{ width: '85px', height: '85px', position: 'relative', borderRadius: '50%', overflow: 'hidden', background: '#f8fafc', border: '1.5px solid #f1f5f9', boxShadow: '0 8px 16px rgba(0,0,0,0.04)' }}>
                  <Image src={cat.image || FashionPlaceholder} alt={cat.name} fill className="object-cover" unoptimized />
                </div>
                <span className="text-[10px] font-black text-gray-800 uppercase tracking-tighter text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC CURATED SECTIONS */}
      {curatedSections && curatedSections.map((section: any, idx: number) => renderSection(section, idx))}

      {/* Discovery Feed */}
      <div className="mt-20 px-4">
        <div className="text-left ">
          <h2 className="text-[2.6rem] font-black tracking-tighter uppercase text-black leading-none mt-12 mb-3">You might also like...</h2>
        </div>
        <InfiniteProductGrid initialProducts={discoverProducts} />
      </div>
    </div>
  );
}
