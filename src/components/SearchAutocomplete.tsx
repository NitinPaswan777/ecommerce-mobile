"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ArrowRight, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchAutocomplete({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const savedHistory = localStorage.getItem('savana_search_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/search/suggest?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setSuggestions(await res.json());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    // Save to history
    const newHistory = [searchTerm, ...history.filter(h => h !== searchTerm)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('savana_search_history', JSON.stringify(newHistory));
    
    onClose();
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-white flex flex-col pt-2"
        >
          {/* Header Search Bar */}
          <div className="px-4 flex items-center gap-3 h-14 border-b border-gray-100">
            <div className="flex-1 relative flex items-center bg-gray-50 rounded-xl px-3 h-11 border border-gray-100 focus-within:border-black transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input 
                ref={inputRef}
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Search for styles, trends..." 
                className="flex-1 bg-transparent border-none outline-none px-3 text-sm font-medium placeholder:text-gray-400"
              />
              {query && (
                <button onClick={() => setQuery("")} className="p-1 rounded-full bg-gray-200 text-gray-500">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button onClick={onClose} className="text-sm font-bold text-gray-900 uppercase tracking-widest px-1">Cancel</button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
            {/* Quick Suggestions / History */}
            {query.length < 2 ? (
              <div className="px-4 pt-6">
                {history.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Recent Searches</h3>
                      <button onClick={() => { setHistory([]); localStorage.removeItem('savana_search_history'); }} className="text-[10px] font-bold text-gray-400 uppercase">Clear</button>
                    </div>
                    <div className="flex flex-col gap-4">
                      {history.map((item, i) => (
                        <button key={i} onClick={() => handleSearch(item)} className="flex items-center gap-3 text-[13px] font-medium text-gray-800">
                          <Clock className="w-4 h-4 text-gray-300" /> {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                     <TrendingUp className="w-3.5 h-3.5 text-[#FF4D6D]" /> Trending Now
                   </h3>
                   <div className="flex flex-wrap gap-2">
                     {['Y2K Tops', 'Floral Summer', 'Denim Skirts', 'Gothic Black', 'Corset Tops'].map((tag, i) => (
                       <button key={i} onClick={() => handleSearch(tag)} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-bold text-gray-700 transition-colors">
                         {tag}
                       </button>
                     ))}
                   </div>
                </div>
              </div>
            ) : (
              /* Search Suggestions Results */
              <div className="flex flex-col">
                <div className="px-4 py-4">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3">Suggested Results</h3>
                  
                  {isLoading && suggestions.length === 0 ? (
                    <div className="flex items-center gap-3 py-2 animate-pulse">
                      <div className="w-12 h-16 bg-gray-100 rounded-lg" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="h-3 w-48 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {suggestions.map((item: any) => (
                        <Link 
                          href={`/product?id=${item.id}`} 
                          key={item.id} 
                          onClick={onClose}
                          className="flex items-center gap-4 group"
                        >
                          <div className="w-14 h-[75px] bg-gray-100 rounded-xl relative overflow-hidden shrink-0 border border-gray-100">
                             <Image src={item.image} alt={item.name} fill className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-[13px] font-bold text-gray-900 line-clamp-1">{item.name}</p>
                             <p className="text-[12px] font-black text-[#FF4D6D] mt-0.5">₹{item.price.toLocaleString('en-IN')}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-black transition-colors shrink-0" />
                        </Link>
                      ))}
                      <button 
                        onClick={() => handleSearch(query)}
                        className="mt-2 py-3 border-t border-gray-100 text-left flex items-center justify-between group"
                      >
                         <span className="text-xs font-bold text-gray-900">See all results for "{query}"</span>
                         <ArrowRight className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  ) : !isLoading && (
                    <div className="py-10 text-center">
                       <p className="text-sm font-medium text-gray-400">No matching styles found.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
