"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, SlidersHorizontal, Grid, List, Zap, X } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // States for filters
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const url = new URL(`${backendUrl}/api/search/full`);
      url.searchParams.append("q", query);
      if (minPrice) url.searchParams.append("minPrice", minPrice);
      if (maxPrice) url.searchParams.append("maxPrice", maxPrice);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [query, minPrice, maxPrice]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 h-14">
            <Link href="/" className="p-1 -ml-1 text-gray-900">
                <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF4D6D]">Search Results</p>
                <h1 className="text-sm font-bold text-gray-900 truncate">"{query}"</h1>
            </div>
            <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-black text-white' : 'bg-gray-50 text-gray-800'}`}
            >
                <SlidersHorizontal className="w-5 h-5" />
            </button>
        </div>

        {/* Filter Drawer simulation */}
        {showFilters && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-gray-400">Price:</span>
                    <input 
                        type="number" 
                        placeholder="Min" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-20 h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                    <span className="text-gray-300">-</span>
                    <input 
                        type="number" 
                        placeholder="Max" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-20 h-8 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold"
                    />
                </div>
                {(minPrice || maxPrice) && (
                    <button 
                        onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#FF4D6D] uppercase"
                    >
                        <X className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Results Count */}
      <div className="px-4 py-3 border-b border-gray-50 bg-white">
          <p className="text-xs font-medium text-gray-500">
            {isLoading ? "Searching..." : `${results.length} styles found`}
          </p>
      </div>

      {/* Main Grid */}
      <div className="flex-1 bg-white p-4">
        {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex flex-col animate-pulse">
                    <div className="aspect-[3/4] bg-gray-100 rounded-2xl mb-3" />
                    <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                    <div className="h-3 w-1/2 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
        ) : results.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 pb-10">
                {results.map((item: any, i: number) => {
                    const displayImg = item.images?.[0]?.url || '/placeholder.jpg';
                    return (
                        <Link href={`/product?id=${item.id}`} key={i} className="flex flex-col group">
                            <div className="relative aspect-[3/4] bg-gray-50 w-full overflow-hidden mb-3 rounded-2xl border border-gray-100 shadow-sm">
                                <Image src={displayImg} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                
                                {item.fastDelivery && (
                                    <div className="absolute top-2 left-0 bg-white/95 backdrop-blur-sm text-[#111111] text-[9px] font-bold tracking-widest px-2 py-0.5 flex items-center shadow-sm rounded-r z-10">
                                        <Zap className="w-2.5 h-2.5 fill-black mr-0.5" /> FAST
                                    </div>
                                )}
                                
                                <WishlistButton 
                                    productId={item.id} 
                                    className="absolute bottom-2 right-2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 transition-all z-10"
                                    iconClassName="w-4 h-4"
                                />
                            </div>

                            <div className="flex flex-col px-1">
                                <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 mb-1">{item.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[15px] font-bold text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                                    {item.originalPrice && (
                                        <span className="text-[11px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                                    )}
                                </div>
                                {item.tag && (
                                    <div className="text-[9px] font-black uppercase tracking-widest text-[#8C6B0D] mt-2 px-1.5 py-0.5 bg-[#FFF8E7] w-fit rounded">
                                        {item.tag}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">No results for "{query}"</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-[200px]">We couldn't find anything matching your search. Try different keywords.</p>
                <Link href="/category" className="mt-8 px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] rounded-full">Explore Categories</Link>
            </div>
        )}
      </div>
    </div>
  );
}

const Search = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><p className="text-sm font-bold uppercase tracking-widest text-gray-400">Loading styles...</p></div>}>
      <SearchResultsContent />
    </Suspense>
  );
}
