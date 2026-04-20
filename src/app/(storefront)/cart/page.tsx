"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Trash2, Plus, Minus, Tag, ShoppingBag as BagIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  color?: string;
  size?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cartId, setCartId] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [coupon, setCoupon] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  const fetchCart = async () => {
    const token = localStorage.getItem('instalook_token');
    const guestId = localStorage.getItem('instalook_guest_id');
    const user = token ? JSON.parse(localStorage.getItem('instalook_user') || '{}') : null;

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const url = new URL(`${backendUrl}/api/cart`);
      if (user?.id) url.searchParams.append('userId', user.id);
      if (guestId) url.searchParams.append('guestId', guestId);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
        setTotal(data.total);
        setCartId(data.cartId);

        // If guest cart just got a real ID from backend, save it
        if (!user?.id && data.cartId && !guestId) {
          localStorage.setItem('instalook_guest_id', data.cartId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Use local removal with instant feedback + server sync
  const handleRemove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const newItems = items.filter(i => i.id !== id);
    setTotal(newItems.reduce((acc, i) => acc + (i.price * i.qty), 0));

    // Server Sync
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${backendUrl}/api/cart/remove/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error("Failed to sync removal", e);
    }
  };

  const updateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;

    // Instant UI update
    const newItems = items.map(item => item.id === id ? { ...item, qty: newQty } : item);
    setItems(newItems);
    setTotal(newItems.reduce((acc, i) => acc + (i.price * i.qty), 0));

    // Server Sync
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${backendUrl}/api/cart/update-qty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, qty: newQty })
      });
    } catch (e) {
      console.error("Failed to sync quantity", e);
    }
  };

  const [couponMsg, setCouponMsg] = useState("");
  const [couponDiscountVal, setCouponDiscountVal] = useState(0);

  const handleApplyCoupon = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: coupon, cartTotal: total })
      });
      const data = await res.json();
      if (res.ok) {
        setIsCouponApplied(true);
        setCouponMsg(data.message);
        const disc = data.discountType === 'PERCENT' ? (total * data.value / 100) : data.value;
        setCouponDiscountVal(disc);
        localStorage.setItem('instalook_coupon', JSON.stringify({ code: coupon, discount: disc }));
      } else {
        alert(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deliveryFee = total > 0 && total < 990 ? 50 : 0;
  const finalAmount = total - couponDiscountVal + deliveryFee;

  if (isLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 px-4 h-16 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="font-black text-lg uppercase tracking-tight">Shopping Bag ({items.length})</h1>
        <div className="w-8"></div>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-100">
            <BagIcon className="w-10 h-10 text-gray-200" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">Your bag is empty</h2>
            <p className="text-sm text-gray-400 font-medium mt-2 leading-relaxed px-6">Your shopping bag is waiting to be filled with the latest trends!</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 transition-all hover:scale-105 active:scale-95"
          >
            Go Explore
          </button>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-4">
          {/* Items */}
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <motion.div
                layout
                key={item.id}
                className="bg-white rounded-3xl p-3 flex gap-4 shadow-sm border border-transparent hover:border-black/5 transition-all"
              >
                <div className="w-24 h-32 relative rounded-2xl overflow-hidden shrink-0 bg-gray-100 shadow-inner">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex flex-col flex-1 py-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-[15px] font-bold text-gray-800 line-clamp-2 leading-tight pr-4">{item.name}</h3>
                    <button onClick={() => handleRemove(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-0.5 rounded uppercase tracking-widest border border-gray-100">SIZE {item.size}</span>
                    <span className="text-[10px] font-black bg-gray-50 text-gray-500 px-2 py-0.5 rounded uppercase tracking-widest border border-gray-100">{item.color}</span>
                  </div>

                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-lg font-black text-gray-900">₹{item.price}</span>
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button
                        disabled={item.qty <= 1}
                        onClick={() => updateQuantity(item.id, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 disabled:opacity-20"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-black">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-900"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-tight">Apply Promo Code</h4>
                <p className="text-[11px] text-gray-400 font-medium">Extra 10% OFF with instalook10</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                disabled={isCouponApplied}
                placeholder="Enter code"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                className="flex-1 h-12 bg-gray-50 rounded-xl px-4 text-sm font-bold uppercase outline-none focus:ring-1 ring-black transition-all disabled:opacity-50"
              />
              <button
                onClick={isCouponApplied ? () => { setIsCouponApplied(false); setCouponDiscountVal(0); setCoupon(""); } : handleApplyCoupon}
                className={`px-6 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${isCouponApplied ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:scale-105'}`}
              >
                {isCouponApplied ? 'Remove' : 'Apply'}
              </button>
            </div>

            {isCouponApplied && (
              <motion.p
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-bold text-green-600 bg-green-50 p-2 rounded-lg flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {couponMsg}
              </motion.p>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Order Summary</h3>

            <div className="flex justify-between items-center text-[15px] font-medium text-gray-500">
              <span>Subtotal</span>
              <span className="text-gray-900 font-bold">₹{total.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center text-[15px] font-medium text-gray-500">
              <span>Taxes & Charges</span>
              <span className="text-gray-900 font-bold">₹0</span>
            </div>

            <div className="flex justify-between items-center text-[15px] font-medium text-gray-500">
              <span>Delivery Fee</span>
              <span className={deliveryFee === 0 ? "text-green-600 font-bold" : "text-gray-900 font-bold"}>
                {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
              </span>
            </div>

            <div className="h-px bg-gray-50 w-full my-2"></div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-black text-gray-900">Grand Total</span>
              <span className="text-2xl font-black text-[#FF4D6D]">₹{finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 rounded-t-[32px] shadow-2xl"
          >
            <button
              onClick={() => router.push('/checkout')}
              className="w-full h-16 bg-black text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-black/10 hover:bg-gray-900 transition-all active:scale-95"
            >
              PROCEED TO CHECKOUT <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
