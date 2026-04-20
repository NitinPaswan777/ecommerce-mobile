"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ShoppingBag, Heart, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    const token = (session as any)?.backendToken || localStorage.getItem('instalook_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') fetchWishlist();
  }, [session, status]);

  const removeFromWishlist = async (productId: string) => {
    const token = (session as any)?.backendToken || localStorage.getItem('instalook_token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.productId !== productId));
        toast.success("Removed from wishlist", { icon: '💔' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (status === 'loading' || isLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Heart className="w-10 h-10 text-gray-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Login to see your wishlist</h2>
      <p className="text-sm text-gray-500 mb-8 max-w-[240px]">Save items you love and access them anytime, anywhere.</p>
      <Link href="/auth" className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all">
        Login / Sign Up
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <div className="h-14 border-b border-gray-100 flex items-center px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="flex-1 text-center mr-8 text-[17px] font-bold text-gray-900 tracking-tight">Wishlist ({items.length})</h1>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 bg-[#FFF0F3] rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Heart className="w-12 h-12 text-[#FF4D6D] fill-[#FF4D6D]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-[260px]">Find something you love from our latest collection and keep it here!</p>
          <Link href="/" className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className="flex flex-col group"
              >
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 mb-3 shadow-sm border border-gray-100">
                  <Link href={`/product?id=${item.productId}`}>
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <button
                    onClick={() => removeFromWishlist(item.productId)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-md text-gray-800 hover:text-[#FF4D6D] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {item.originalPrice && (
                    <div className="absolute top-2 left-2 bg-[#FF4D6D] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                    </div>
                  )}
                </div>

                <Link href={`/product?id=${item.productId}`} className="px-1">
                  <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 mb-0.5">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                    {item.originalPrice && (
                      <span className="text-[11px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => router.push(`/product?id=${item.productId}`)}
                  className="mt-3 w-full border border-gray-200 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  View Product
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
