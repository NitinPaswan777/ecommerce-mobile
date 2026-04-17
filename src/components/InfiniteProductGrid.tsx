"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap, RefreshCw } from "lucide-react";
import WishlistButton from "./WishlistButton";
import { motion } from "framer-motion";

interface InfiniteProductGridProps {
    initialProducts: any[];
}

export default function InfiniteProductGrid({ initialProducts }: InfiniteProductGridProps) {
    const [products, setProducts] = useState(initialProducts);
    const [page, setPage] = useState(2); // Since page 1 is initialProducts
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    const fetchMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
            const res = await fetch(`${backendUrl}/api/products?page=${page}&limit=6`);
            if (res.ok) {
                const newProducts = await res.json();
                if (newProducts.length < 6) {
                    setHasMore(false);
                }
                
                // Filter out duplicates in case of overlap
                setProducts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const uniqueNew = newProducts.filter((p: any) => !existingIds.has(p.id));
                    return [...prev, ...uniqueNew];
                });
                setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    fetchMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [page, hasMore, loading]);

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 w-full">
                {products.map((item: any, i: number) => {
                    const displayImg = item.images?.[0]?.url || '/placeholder.jpg';
                    return (
                        <Link href={`/product?id=${item.id}`} key={`${item.id}-${i}`} className="flex flex-col group block">
                            <div className="relative aspect-[3/4] bg-gray-100 w-full overflow-hidden mb-2 rounded-md">
                                <Image src={displayImg} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                                
                                {item.fastDelivery && (
                                    <div className="absolute bottom-2 left-0 bg-white/95 backdrop-blur-sm text-[#111111] text-[11px] font-medium px-2 py-1 flex items-center gap-1 shadow-sm rounded-r-md z-10">
                                        <Zap className="w-3 h-3 fill-black text-black" /> Fast delivery
                                    </div>
                                )}
                                
                                <WishlistButton 
                                    productId={item.id} 
                                    className="absolute bottom-2 right-2 w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-all z-10"
                                    iconClassName="w-4 h-4"
                                />
                            </div>

                            <div className="flex flex-col px-0.5 max-w-full">
                                <h3 className="text-sm text-[#111111] tracking-wide truncate mb-1 pr-1 font-medium">{item.name}</h3>
                                
                                <div className="flex items-baseline gap-1.5 mb-1.5 overflow-hidden">
                                    <span className={`text-[15px] font-bold ${item.originalPrice ? 'text-[#FF4D6D]' : 'text-[#111111]'}`}>
                                        ₹{item.price.toLocaleString('en-IN')}
                                    </span>
                                    {item.originalPrice && (
                                        <span className="text-xs text-gray-400 line-through">
                                            ₹{item.originalPrice.toLocaleString('en-IN')}
                                        </span>
                                    )}
                                </div>

                                {item.getItForText && (
                                    <div className="text-[11px] font-semibold text-[#00A86B] mb-1.5">
                                        {item.getItForText}
                                    </div>
                                )}

                                {item.colors?.length > 0 && (
                                    <div className="flex gap-1.5 mb-1.5">
                                        {item.colors.map((color: any, idx: number) => (
                                            <div key={idx} className={`w-3.5 h-3.5 rounded-[2px] shadow-inner border border-gray-200`} style={{ backgroundColor: color.hexCode }}></div>
                                        ))}
                                    </div>
                                )}

                                {item.tag && (
                                    <div className="text-[10px] font-bold bg-[#FFF8E7] text-[#8C6B0D] px-1.5 py-0.5 w-fit rounded mt-0.5 tracking-wide uppercase">
                                        {item.tag}
                                    </div>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Observer Element / Loading Spinner */}
            <div ref={observerTarget} className="flex flex-col items-center justify-center mt-12 gap-2 pb-10 min-h-[100px]">
                {hasMore ? (
                    <div className="flex flex-col items-center gap-3">
                        <motion.svg
                            viewBox="0 0 100 60"
                            className="w-8 h-auto text-gray-400"
                            initial={{ rotate: -10 }}
                            animate={{ rotate: 10 }}
                            transition={{
                                repeat: Infinity,
                                repeatType: "mirror",
                                duration: 1,
                                ease: "easeInOut",
                            }}
                        >
                            <path d="M50 5 Q55 5, 55 10 Q55 15, 50 15 Q45 15, 45 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                            <path d="M50 15 L5 45 L95 45 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                            <line x1="5" y1="45" x2="95" y2="45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        </motion.svg>
                        <span className="text-[9px] font-black tracking-[0.2em] uppercase text-gray-400">Loading More...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-1 bg-gray-100 rounded-full"></div>
                         <span className="text-[10px] font-bold tracking-widest uppercase text-gray-300">End of Collection</span>
                    </div>
                )}
            </div>
        </div>
    );
}
