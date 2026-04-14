import Link from "next/link";
import { RefreshCw, Zap, Truck, ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";
import InfiniteProductGrid from "@/components/InfiniteProductGrid";

export default async function Home() {
  let feedData = {
    banners: [],
    flashSales: [],
    hotCategories: [],
    specialOffers: [],
    discoverProducts: []
  };

  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/feed/home`, { 
      next: { revalidate: 60 } 
    });
    if (res.ok) {
      feedData = await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch backend data", error);
  }

  const { banners, flashSales, hotCategories, specialOffers, discoverProducts } = feedData;
  const heroBanner = banners.find((b: any) => b.position === 'HERO_1') || null;

  return (
    <div className="flex flex-col w-full pb-20 overflow-x-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes custom-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-custom {
          animation: custom-marquee 15s linear infinite;
          will-change: transform;
        }
      `}} />

      {/* Marquee Ticker */}
      <div className="bg-[#111111] text-white py-2.5 overflow-hidden flex w-full relative whitespace-nowrap">
        <div className="animate-marquee-custom shrink-0 flex items-center">
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase">✨ Free Shipping on orders over ₹990 ✨</span>
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#FFD700] fill-[#FFD700]"/> UP TO 70% OFF FLASH SALE</span>
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase">✨ New Arrivals every Friday ✨</span>
        </div>
        <div className="animate-marquee-custom shrink-0 flex items-center">
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase">✨ Free Shipping on orders over ₹990 ✨</span>
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5"><Zap className="w-3 h-3 text-[#FFD700] fill-[#FFD700]"/> UP TO 70% OFF FLASH SALE</span>
          <span className="mx-4 text-[10px] font-bold tracking-widest uppercase">✨ New Arrivals every Friday ✨</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-gray-50 overflow-x-auto gap-4 hide-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          <RefreshCw className="w-5 h-5 text-gray-700" />
          <div className="text-xs">
            <p className="font-semibold text-gray-900 leading-none mb-0.5">Easy returns</p>
            <p className="text-gray-500 text-[10px] leading-none">Free pick up</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Zap className="w-5 h-5 text-gray-700" />
          <div className="text-xs">
            <p className="font-semibold text-gray-900 leading-none mb-0.5">Fast delivery</p>
            <p className="text-gray-500 text-[10px] leading-none">4000+ styles</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Truck className="w-5 h-5 text-gray-700" />
          <div className="text-xs">
            <p className="font-semibold text-gray-900 leading-none mb-0.5">Free shipping</p>
            <p className="text-gray-500 text-[10px] leading-none">For orders 990+</p>
          </div>
        </div>
      </div>

      {/* Main Banner (Dynamic) */}
      {heroBanner && (
        <div className="w-full relative aspect-[4/5] bg-gray-100 overflow-hidden">
          <Image 
            src={heroBanner.imageUrl}
            alt={heroBanner.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent flex flex-col justify-end p-6 pointer-events-none"></div>
          
          <div className="absolute bottom-12 left-5 z-10 flex flex-col items-start w-[85%]">
            <h2 className="text-[3.4rem] leading-[1.05] font-medium text-[#FFF4D2] tracking-tighter custom-serif mb-4 drop-shadow-md" dangerouslySetInnerHTML={{ __html: heroBanner.title.replace(' Dreams', '<br/>Dreams') }} />
            <p className="text-[#F8F8F8] text-[15px] leading-snug font-medium mb-6 drop-shadow" dangerouslySetInnerHTML={{ __html: heroBanner.subtitle?.replace(', and', ', and<br/>') || "" }} />
            
            <Link href={heroBanner.link} className="text-[#FFF4D2] text-[15px] font-medium border-b border-[#FFF4D2] pb-0.5 tracking-wide drop-shadow-sm hover:opacity-80 transition-opacity">
              {heroBanner.buttonText}
            </Link>
          </div>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            <div className="w-4 h-[2.5px] bg-white/40 rounded-full"></div>
            <div className="w-4 h-[2.5px] bg-white/40 rounded-full"></div>
            <div className="w-4 h-[2.5px] bg-white/40 rounded-full"></div>
            <div className="w-4 h-[2.5px] bg-white/40 rounded-full"></div>
            <div className="w-8 h-[2.5px] bg-white rounded-full shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
          </div>
        </div>
      )}

      {/* Hot Categories (Dynamic) */}
      {hotCategories.length > 0 && (
        <div className="mt-8 px-4">
          <h2 className="text-2xl font-black tracking-tight mb-4 uppercase text-[#111111] text-center">Hot Categories</h2>
          <div className="flex overflow-x-auto gap-3 pb-4 hide-scrollbar">
            {hotCategories.map((cat: any, i: number) => (
              <Link href={`/category?slug=${cat.slug}`} key={i} className="flex flex-col items-center gap-2 shrink-0 group">
                <div className="w-20 h-24 rounded-t-full rounded-b-xl relative overflow-hidden bg-gradient-to-b from-[#eaf6ff] to-[#f4fcff] shadow-sm group-hover:shadow-md transition-all border border-sky-100 p-1">
                  <div className="w-full h-full relative rounded-t-full rounded-b-lg overflow-hidden">
                    <Image src={cat.image || '/placeholder.jpg'} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#111111] tracking-wider uppercase">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Flash Sale Section (Dynamic) */}
      {flashSales.length > 0 && (
        <div className="mt-4 px-4">
          <div className="bg-[#FFF8E7] rounded-xl p-4 flex flex-col relative overflow-hidden border border-[#FFE9A6] shadow-sm">
            <div className="flex justify-between items-center mb-4 relative z-10">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-[#B58500] uppercase">Ends in</p>
                <div className="flex items-baseline gap-1 mt-0.5 text-[#8C6B0D]">
                  <span className="text-xl font-bold font-mono">19</span><span className="text-xs font-medium">h</span>
                  <span className="text-xl font-bold font-mono">:52</span><span className="text-xs font-medium">m</span>
                  <span className="text-xl font-bold font-mono">:31</span><span className="text-xs font-medium">s</span>
                </div>
              </div>
              <Link href="/category" className="flex items-center text-xs font-bold text-[#8C6B0D] hover:text-[#6D4C00] transition-colors gap-1">
                DON'T MISS OUT <ArrowRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
            
            <div className="w-full text-center py-2 mb-4 relative z-10 bg-white/40 backdrop-blur-sm rounded-lg border border-[#FFE9A6]">
              <h3 className="text-xl font-serif italic text-[#6D4C00]">— Up to 70% off —</h3>
            </div>

            <div className="flex gap-2 overflow-x-auto hide-scrollbar relative z-10">
              {flashSales.map((fs: any, i: number) => {
                const imgUrl = fs.product?.images?.[0]?.url;
                if (!imgUrl) return null;
                return (
                  <Link href={`/product?id=${fs.product.id}`} key={i} className="min-w-[80px] aspect-[3/4] bg-white rounded-lg shadow-sm border border-[#FFE9A6] flex items-center justify-center p-1 relative overflow-hidden group hover:border-[#F2C94C] transition-colors shrink-0">
                    <div className="w-full h-full bg-gray-50 rounded group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                      <Image src={imgUrl} alt="Flash Sale Product" fill className="object-cover" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Special Offers grid (Dynamic) */}
      {specialOffers.length > 0 && (
        <div className="mt-8 px-4 text-center">
          <h2 className="text-2xl font-black tracking-tight mb-4 uppercase text-[#111111]">Special Offers</h2>
          <div className="grid grid-cols-2 gap-3">
            {specialOffers.map((offer: any, idx: number) => (
              <Link key={idx} href={offer.link} className={`aspect-[4/5] ${idx === 0 ? 'bg-sky-100 border-sky-200' : 'bg-[#FFECF0] border-pink-200'} rounded-xl relative overflow-hidden group p-4 flex flex-col items-center justify-start border hover:shadow-lg transition-shadow`}>
                <Image src={offer.imageUrl} alt={offer.title} fill className="object-cover opacity-60 mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                <div className="relative z-10 w-full h-full flex flex-col items-center">
                    <p className={`text-xs font-bold ${idx === 0 ? 'text-sky-800' : 'text-[#FF4D6D]'} uppercase tracking-widest mt-2 bg-white/70 px-3 py-1 rounded-full backdrop-blur-md`}>
                      {offer.badgeText}
                    </p>
                    <p className={`text-5xl font-black ${idx === 0 ? 'text-sky-900' : 'text-[#e03f5c]'} mt-3 drop-shadow-md`}>
                      ₹{offer.priceText}
                    </p>
                    <p className={`text-sm font-semibold ${idx === 0 ? 'text-sky-900' : 'text-[#e03f5c]'} mt-auto bg-white/60 w-full py-2 rounded-lg backdrop-blur-sm`}>
                      {offer.title}
                    </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* You Might Also Like (Infinite Scroll Section - Dynamic) */}
      <div className="mt-12 px-3 pb-10 flex flex-col items-center border-t border-gray-100 pt-8 bg-white">
        <div className="flex items-center gap-4 w-full mb-6 px-1">
          <div className="h-[1px] bg-gray-200 flex-1"></div>
          <h2 className="text-lg font-black tracking-widest uppercase text-[#111111]">You Might Also Like</h2>
          <div className="h-[1px] bg-gray-200 flex-1"></div>
        </div>

        <InfiniteProductGrid initialProducts={discoverProducts} />
      </div>
      
    </div>
  );
}
