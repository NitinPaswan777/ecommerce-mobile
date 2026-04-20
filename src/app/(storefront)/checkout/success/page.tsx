"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Package, ArrowRight, ShoppingBag, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [etd, setEtd] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup on Success
    localStorage.removeItem('savana_coupon');
    localStorage.removeItem('savana_guest_id'); 
    localStorage.removeItem('savana_guest_info');
    
    const fetchOrderEtd = async () => {
      if (!orderId) return;
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          
          // Pincode fetch
          const pincode = data.address?.pincode || data.guestAddress?.split(',').pop()?.trim();
          if (pincode) {
             const srRes = await fetch(`${backendUrl}/api/shiprocket/serviceability?pincode=${pincode}`);
             if (srRes.ok) {
               const srData = await srRes.json();
               setEtd(srData.etd);
             }
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrderEtd();
  }, [orderId]);

  return (
    <div className="flex flex-col w-full min-h-screen bg-white items-center justify-center p-6 text-center">
      {/* Celebration Animation Area */}
      <div className="relative mb-8">
         <motion.div 
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           transition={{ type: "spring", damping: 12, stiffness: 200 }}
           className="w-24 h-24 bg-black rounded-full flex items-center justify-center shadow-2xl relative z-10"
         >
            <Check className="w-12 h-12 text-white stroke-[3px]" />
         </motion.div>
         
         {/* Decorative Rings */}
         <motion.div 
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1.5, opacity: 0 }}
           transition={{ duration: 1.5, repeat: Infinity }}
           className="absolute inset-0 border-2 border-black rounded-full pointer-events-none"
         />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Order Confirmed!</h1>
        <p className="text-sm font-medium text-gray-500 mt-2 px-8 leading-relaxed">
          Your style is on its way. We&apos;ve sent a confirmation message to your contact details.
        </p>
      </motion.div>

      {/* Order Info Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 w-full max-w-[320px] bg-gray-50 rounded-[32px] p-6 border border-gray-100 flex flex-col gap-4"
      >
         <div className="flex items-center justify-between border-b border-gray-200/50 pb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order ID</span>
            <span className="text-[12px] font-bold text-gray-900">#{orderId || '721-SX90'}</span>
         </div>
         
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
               <Package className="w-5 h-5 text-gray-900" />
            </div>
            <div className="text-left">
               <p className="text-[11px] font-black uppercase tracking-tight text-gray-900">Delivery Status</p>
               {etd ? (
                 <p className="text-[11px] font-bold text-green-600 uppercase tracking-tighter">
                   Arriving by {new Date(etd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                 </p>
               ) : (
                 <p className="text-[11px] font-medium text-gray-400">Arriving in 3-5 Working Days</p>
               )}
            </div>
         </div>
      </motion.div>

      <div className="mt-12 w-full flex flex-col gap-4 px-4">
        <Link 
          href="/account/orders"
          className="w-full h-14 bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-black/10 hover:scale-[1.02] transition-all"
        >
          Track My Order <ArrowRight className="w-4 h-4" />
        </Link>
        <Link 
          href="/"
          className="w-full h-14 bg-white text-gray-400 font-bold text-[11px] uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-2 hover:text-black transition-all"
        >
          <Home className="w-4 h-4" /> Go to Home
        </Link>
      </div>

      {/* Savana Branded Footer */}
      <div className="mt-auto pb-8">
         <p className="text-[10px] font-black tracking-[0.5em] text-gray-200 uppercase">Savana Originals</p>
      </div>
    </div>
  );
}
