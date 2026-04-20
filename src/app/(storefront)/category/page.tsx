import Link from "next/link";
import { Search, ChevronLeft, Zap, Heart } from "lucide-react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";

export default async function Category(props: { searchParams: Promise<{ slug?: string }> }) {
  const searchParams = await props.searchParams;
  const currentSlug = searchParams?.slug?.toLowerCase() || '';

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  let categories = [];
  let products = [];
  
  try {
    // Fetch Categories for Sidebar
    const catsRes = await fetch(`${backendUrl}/api/categories`, { next: { revalidate: 3600 } });
    if (catsRes.ok) categories = await catsRes.json();
  } catch(e) { console.error(e) }

  try {
    // Fetch Products based on selected category
    const productsUrl = currentSlug 
      ? `${backendUrl}/api/products?categorySlug=${currentSlug}` 
      : `${backendUrl}/api/products`;
      
    const prodsRes = await fetch(productsUrl, { cache: 'no-store' });
    if (prodsRes.ok) products = await prodsRes.json();
  } catch(e) { console.error(e) }

  const displayTitle = currentSlug ? currentSlug.toUpperCase() : "ALL STYLES";

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-56px)] bg-[#F8F8F8]">
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-56px)]">
        {/* Left Sidebar Menu */}
        <div className="w-[30%] bg-[#F0F0F0]/50 overflow-y-auto no-scrollbar shrink-0">
          <Link href="/category" className={`py-4 px-3 text-sm tracking-wide font-medium relative cursor-pointer block ${!currentSlug ? 'text-[#FF4D6D] bg-white font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
            {!currentSlug && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-black rounded-r-md"></div>}
            SALE !!
          </Link>
          
          {categories.map((cat: any, i: number) => {
            const isActive = currentSlug === cat.slug;
            return (
              <Link 
                href={`/category?slug=${cat.slug}`}
                key={i} 
                className={`py-4 px-3 tracking-wide relative cursor-pointer block truncate ${isActive ? 'text-[#FF4D6D] bg-white text-sm font-bold shadow-sm' : 'text-[13px] font-medium text-gray-700 hover:bg-gray-50'}`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-black rounded-r-md"></div>
                )}
                {cat.name}
              </Link>
            )
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-white overflow-y-auto p-4 no-scrollbar">
          <div className="flex justify-between items-end mb-4">
             <h2 className="text-xl font-light text-gray-900 tracking-tight">{displayTitle}</h2>
          </div>

          {products.length === 0 ? (
            <div className="w-full py-10 flex flex-col justify-center items-center opacity-60">
               <span className="text-sm font-medium text-gray-500">No products found in this category.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-24">
               {products.map((item: any, i: number) => {
                 const displayImg = item.images?.[0]?.url || '/placeholder.jpg';
                 return (
                   <Link href={`/product?id=${item.id}`} key={i} className="flex flex-col group cursor-pointer">
                     <div className="w-full aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center p-1 rounded-sm border border-transparent group-hover:border-gray-200 transition-all mb-1">
                        <Image src={displayImg} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500 mix-blend-multiply opacity-95" />
                        
                        {item.fastDelivery && (
                          <div className="absolute top-1 left-0 bg-white/95 backdrop-blur-sm text-[#111111] text-[9px] font-bold tracking-widest px-1.5 py-0.5 flex items-center shadow-sm rounded-r z-10">
                            <Zap className="w-2.5 h-2.5 fill-black mr-0.5" /> FAST
                          </div>
                        )}
                        
                        <WishlistButton 
                            productId={item.id} 
                            className="absolute bottom-1 right-1 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 transition-all z-10"
                            iconClassName="w-3 h-3"
                        />
                     </div>
                     <span className="text-xs font-semibold text-[#111111] line-clamp-1 leading-tight">{item.name}</span>
                     
                     <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-[13px] font-black text-[#FF4D6D]">₹{item.price.toLocaleString('en-IN')}</span>
                        {item.originalPrice && (
                           <span className="text-[10px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                     </div>
                   </Link>
                 )
               })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
