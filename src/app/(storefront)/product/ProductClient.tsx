"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, ChevronRight, Share, Heart, ShoppingBag, Play, X, MessageSquare, Truck, MapPin, Zap, Bell } from "lucide-react";
import Link from "next/link";
import WishlistButton from "@/components/WishlistButton";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ProductClient({ product }: { product: any }) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<any>(null);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isPipVisible, setIsPipVisible] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const selectionRef = useRef<HTMLDivElement>(null);
  
  // Delivery States
  const [pincode, setPincode] = useState("");
  const [deliveryData, setDeliveryData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [showInput, setShowInput] = useState(false);
  
  const { data: session, status } = useSession();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = product?.images?.length > 0 
    ? product.images.map((img: any) => img.url) 
    : [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop"
      ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveImageIndex(index);
    }
  };

  const scrollToIndex = (index: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

      
  const videoUrl = product?.videoUrl;

  let discountPercentage = 0;
  if (product.originalPrice && product.originalPrice > product.price) {
    discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  const addToBag = async () => {
    if (!selectedColor || !selectedSize) {
      toast.error("Please select both color and size", {
        style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
      });
      selectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    
    setIsAdding(true);
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const token = localStorage.getItem('savana_token');
    const guestId = localStorage.getItem('savana_guest_id');
    
    try {
      const res = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          userId: token ? JSON.parse(localStorage.getItem('savana_user') || '{}').id : null,
          guestId: guestId,
          productId: product.id,
          qty: 1,
          color: selectedColor?.name,
          size: selectedSize?.name
        })
      });

      if (!res.ok) throw new Error("Failed to add to bag");
      
      const data = await res.json();
      
      if (!token && data.cartId) {
        localStorage.setItem('savana_guest_id', data.cartId);
      }
      
      setIsAdded(true);
      // No redirect
    } catch (err) {
      console.error(err);
      alert("Error adding to bag. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const checkDelivery = async (inputPincode?: string) => {
    const code = inputPincode || pincode;
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setIsChecking(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/shiprocket/serviceability?pincode=${code}`);
      if (res.ok) {
        setDeliveryData(await res.json());
      } else {
        const err = await res.json();
        setError(err.message || "Delivery not available for this location");
        setDeliveryData(null);
      }
    } catch (e) {
      setError("Failed to check delivery");
    } finally {
      setIsChecking(false);
    }
  };
  useEffect(() => {
    const fetchInitialStatus = async () => {
      const token = (session as any)?.backendToken || localStorage.getItem('savana_token');
      if (token) {
        try {
          // Fetch wishlist
          const wRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (wRes.ok) {
            const items = await wRes.json();
            setIsInWishlist(items.some((it: any) => it.productId === product.id));
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Fetch related products (always)
      try {
        const rRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/products?categorySlug=${product.category?.slug || ''}`);
        if (rRes.ok) {
          const prods = await rRes.json();
          // Filter out current product and take 4
          setRelatedProducts(prods.filter((p: any) => p.id !== product.id).slice(0, 4));
        }
      } catch (e) { console.error(e); }

      // Fetch address
      if (token) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/user/addresses`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const addresses = await res.json();
            const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
            if (defaultAddr?.pincode) {
              setPincode(defaultAddr.pincode);
              checkDelivery(defaultAddr.pincode);
              setShowInput(false);
            } else {
              setShowInput(true);
            }
          }
        } catch (e) {
          console.error(e);
          setShowInput(true);
        }
      } else if (status === 'unauthenticated' || (status !== 'loading' && !token)) {
        setShowInput(true);
      }
    };
    if (status !== 'loading') fetchInitialStatus();
  }, [session, status]);

  const toggleWishlist = async () => {
    const token = (session as any)?.backendToken || localStorage.getItem('savana_token');
    if (!token) {
        toast.error("Please login to use wishlist", {
            style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
        });
        return;
    }

    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: product.id })
        });
        if (res.ok) {
            const data = await res.json();
            setIsInWishlist(data.added);
            toast.success(data.added ? "Added to Wishlist" : "Removed from Wishlist", {
                icon: data.added ? '❤️' : '💔',
                style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
            });
        }
    } catch (e) {
        console.error(e);
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white relative pb-24">
      {/* We removed the negative margin so it no longer clips underneath the fixed Navbar spacing block */}
      
      {/* Image Gallery (Snap Scroll) */}
      <div className="w-full relative bg-gray-100 overflow-hidden">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((url: string, i: number) => (
            <div key={i} className="w-full shrink-0 snap-center relative aspect-[3/4]">
              <Image src={url} alt={product.name} fill className="object-cover" priority={i === 0} />
              
              {/* Badges on first image */}
              {i === 0 && (
                <div className="absolute bottom-6 left-4 flex gap-1 z-10">
                  {product.tag && (
                    <span className="bg-[#FFF8E7] text-[#8C6B0D] text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      {product.tag}
                    </span>
                  )}
                  <span className="bg-[#FF4D6D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    Flash Sale
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Carousel Indicators */}
        <div className="flex gap-1.5 items-center absolute bottom-3 left-1/2 -translate-x-1/2 mb-1 z-10">
          {images.map((_: any, i: number) => (
            <div 
              key={i} 
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === activeImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
            ></div>
          ))}
        </div>

        {/* Desktop Navigation Arrows (Visible only if multiple images) */}
        {images.length > 1 && (
          <div className="hidden md:block">
            <button 
              onClick={() => scrollToIndex(activeImageIndex - 1)}
              disabled={activeImageIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-black disabled:hidden z-20"
            >
              <ChevronRight className="rotate-180" />
            </button>
            <button 
              onClick={() => scrollToIndex(activeImageIndex + 1)}
              disabled={activeImageIndex === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-black disabled:hidden z-20"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail Strip (Thumb Scrolling) */}
      {images.length > 1 && (
        <div className="px-4 mt-2">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
                {images.map((url: string, i: number) => (
                    <button 
                        key={i}
                        onClick={() => scrollToIndex(i)}
                        className={`w-14 h-18 rounded-md overflow-hidden shrink-0 transition-all duration-300 border-2 ${i === activeImageIndex ? 'border-black scale-105' : 'border-transparent opacity-60'}`}
                    >
                        <Image src={url} alt={`thumb-${i}`} width={56} height={72} className="w-full h-full object-cover" />
                    </button>
                ))}
            </div>
        </div>
      )}

        {/* Floating Draggable Video Banner */}
        {videoUrl && !isVideoOpen && isPipVisible && (
          <motion.div 
            drag
            dragConstraints={{ left: -200, right: 0, top: 0, bottom: 300 }}
            className="absolute right-4 top-4 w-24 aspect-[9/16] bg-black rounded-xl shadow-2xl z-30 cursor-grab active:cursor-grabbing border-2 border-white overflow-hidden group"
          >
            <video 
              src={videoUrl} 
              className="w-full h-full object-cover opacity-90"
              autoPlay 
              loop 
              muted 
              playsInline 
            />
            {/* Play Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors"
              onClick={() => setIsVideoOpen(true)}
            >
              <Play className="w-8 h-8 fill-white/70 text-white/50 drop-shadow-md" />
            </div>
            {/* Small X button to purely hide it if we wanted */}
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPipVisible(false); }}
              className="absolute top-1 right-1 w-5 h-5 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white cursor-pointer z-40 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}


      {/* Flash Sale Banner */}
      <div className="bg-gradient-to-r from-[#FFC107] to-[#FF9800] text-black flex justify-between items-center px-4 py-2 relative overflow-hidden">
        <h3 className="font-extrabold tracking-wide text-sm z-10">FLASH SALE</h3>
        
        <div className="flex items-center gap-1 font-bold text-sm tracking-widest z-10">
          <span>05h</span> : <span>59m</span> : <span>31s</span>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <h1 className="text-[17px] text-gray-800 tracking-tight font-medium leading-tight">{product.name}</h1>
          {product.inventory <= 0 && (
            <span className="bg-red-50 text-[#FF3B30] text-[10px] font-bold px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest">Out of Stock</span>
          )}
        </div>

        
        <div className="flex items-end gap-2 mt-1">
          <span className="text-2xl font-bold text-[#FF3B30]">₹{product.price.toLocaleString('en-IN')}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-gray-400 line-through mb-1">MRP ₹{product.originalPrice.toLocaleString('en-IN')}</span>
              <div className="bg-[#FF4D6D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm mb-1 align-middle tracking-wider shadow-sm">
                {discountPercentage}%OFF
              </div>
            </>
          )}
        </div>
        <p className="text-[11px] text-gray-400 font-medium">Inclusive of all taxes</p>
      </div>

      <div ref={selectionRef}>
        {/* Selectable Colors */}
        {product.colors && product.colors.length > 0 && (
        <div className="px-4 mt-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-black">COLOR:</span>
            <span className="text-xs font-medium text-gray-700 capitalize">{selectedColor?.name || 'Please select'}</span>
          </div>
          <div className="flex gap-3">
            {product.colors.map((color: any, idx: number) => {
              const isActive = selectedColor?.name === color.name;
              return (
                <button 
                  key={idx} 
                  onClick={() => {
                    setSelectedColor(color);
                  }}
                  className={`w-12 h-16 rounded overflow-hidden relative cursor-pointer outline-offset-2 transition-all ${isActive ? 'outline outline-1 outline-black shadow-md' : 'border border-gray-200 opacity-60'}`}
                >
                   <div className="w-full h-full" style={{ backgroundColor: color.hexCode }}></div>
                   <div className="absolute inset-0 border border-black/5 mix-blend-overlay"></div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Selectable Sizes */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="px-4 mt-6">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-black">SIZE:</span>
            <span className="text-xs font-medium text-gray-700 uppercase">{selectedSize?.name || 'Please select'}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {product.sizes.map((size: any, idx: number) => {
              const isActive = selectedSize?.name === size.name;
              return (
                <button 
                  key={idx} 
                  onClick={() => {
                    setSelectedSize(size);
                  }}
                  className={`min-w-[48px] h-10 border flex items-center justify-center rounded-lg text-xs font-bold transition-all ${isActive ? 'bg-black text-white border-black shadow-md scale-105' : 'bg-white text-gray-800 border-gray-200'}`}
                >
                  {size.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      </div>

      {/* Delivery Check Section */}
      <div className="px-4 mt-6 border-t border-gray-50 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-gray-800" />
          <span className="text-xs font-bold uppercase tracking-widest text-black">Delivery Details</span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
          {!showInput && deliveryData ? (
             <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Deliver to</p>
                    <p className="text-[13px] font-bold text-gray-900">{pincode}</p>
                  </div>
                </div>
                <button onClick={() => setShowInput(true)} className="text-[10px] font-black uppercase text-[#FF4D6D] tracking-wider py-2 px-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-all active:scale-95">Change</button>
             </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input 
                  type="tel" 
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Pincode"
                  className="w-full bg-white border border-gray-200 rounded-xl h-12 px-4 text-sm font-bold focus:border-black outline-none transition-all"
                />
                <button 
                  onClick={() => {
                    checkDelivery();
                    if (pincode.length === 6) setShowInput(false);
                  }}
                  disabled={isChecking || pincode.length !== 6}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-lg disabled:opacity-30 transition-all hover:bg-gray-800"
                >
                  {isChecking ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Check"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-[10px] font-bold text-[#FF3B30] mt-3 ml-1 uppercase tracking-wider">{error}</p>}

          {deliveryData && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-start gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-gray-900">Get it by {new Date(deliveryData.etd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}</p>
                  <span className="text-[9px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">Fastest</span>
                </div>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">Free Shipping • {deliveryData.courier} Delivery</p>
              </div>
            </motion.div>
          )}

          {!deliveryData && !error && !isChecking && (
            <p className="text-[10px] text-gray-400 font-medium mt-3 ml-1">Enter pincode to check delivery date & availability</p>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-4 py-3 flex gap-4 z-40 items-center shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <button 
            onClick={toggleWishlist}
            className={`transition-colors p-1 ${isInWishlist ? 'text-[#FF4D6D]' : 'text-gray-700 hover:text-[#FF4D6D]'}`}
        >
          <Heart className={`w-7 h-7 stroke-[1.5] ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
        <button className="text-gray-700 hover:text-black transition-colors p-1 relative">
          <MessageSquare className="w-7 h-7 stroke-[1.5]" />
          <div className="absolute top-1 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
        </button>
        {(product.inventory !== undefined && product.inventory !== null && product.inventory > 0) ? (
          isAdded ? (
            <Link 
              href="/cart"
              className="flex-1 bg-black text-white rounded h-[46px] flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-all shadow active:scale-95"
            >
              ADDED (GO TO CART)
            </Link>
          ) : (
            <button 
              onClick={addToBag}
              disabled={isAdding}
              className="flex-1 bg-[#FFB300] hover:bg-[#FFA000] text-black rounded h-[46px] flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-colors shadow disabled:opacity-70 disabled:cursor-wait"
            >
               {isAdding ? 'ADDING...' : 'ADD TO BAG'}
            </button>
          )
        ) : (
          <button 
            onClick={async () => {
              const userEmail = session?.user?.email;
              const emailToUse = userEmail || window.prompt("Enter your email to get notified when back in stock:", "");
              
              if (emailToUse && emailToUse.includes('@')) {
                const loadingToast = toast.loading("Submitting request...", {
                  style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
                });

                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/notifications/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailToUse, productId: product.id })
                  });

                  if (res.ok) {
                    toast.success("We'll notify you soon!", {
                      id: loadingToast,
                      icon: '🔔',
                      style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
                    });
                  } else {
                    throw new Error();
                  }
                } catch (e) {
                  toast.error("Failed to submit. Please try again.", {
                    id: loadingToast,
                    style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
                  });
                }
              }
            }}
            className="flex-1 bg-white hover:bg-gray-50 text-black border-2 border-black rounded h-[46px] flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-all active:scale-95 shadow-sm"
          >
             <Bell className="w-4 h-4" />
             NOTIFY ME
          </button>
        )}

      </div>

      {/* You May Also Like Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 px-4 pb-12 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-lg font-black tracking-widest uppercase text-gray-900 shrink-0">You May Also Like</h2>
            <div className="h-[1px] bg-gray-100 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {relatedProducts.map((item: any, i: number) => {
              const displayImg = item.images?.[0]?.url || item.images[0]?.url;
              return (
                <Link href={`/product?id=${item.id}`} key={i} className="flex flex-col group">
                  <div className="relative aspect-[3/4] bg-gray-100 w-full overflow-hidden mb-2 rounded-xl border border-gray-50">
                    <Image src={displayImg} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    
                    {item.fastDelivery && (
                      <div className="absolute bottom-2 left-0 bg-white/95 backdrop-blur-sm text-[#111111] text-[9px] font-bold tracking-widest px-1.5 py-0.5 flex items-center shadow-sm rounded-r z-10">
                        <Zap className="w-2.5 h-2.5 fill-black mr-0.5" /> FAST
                      </div>
                    )}
                    
                    <WishlistButton 
                      productId={item.id} 
                      className="absolute bottom-2 right-2 w-7 h-7 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 transition-all z-10"
                      iconClassName="w-3.5 h-3.5"
                    />
                  </div>

                  <div className="flex flex-col px-0.5">
                    <h3 className="text-[12px] font-medium text-gray-800 line-clamp-1 mb-0.5">{item.name}</h3>
                    <div className="flex items-baseline gap-1.5 mb-1.5">
                      <span className="text-[14px] font-bold text-[#FF3B30]">₹{item.price.toLocaleString('en-IN')}</span>
                      {item.originalPrice && (
                        <span className="text-[10px] text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Fullscreen Video Overlay */}
      {isVideoOpen && (
        <FullscreenVideoPlayer 
           videoUrl={videoUrl} 
           onClose={() => setIsVideoOpen(false)} 
        />
      )}
    </div>
  );
}

function FullscreenVideoPlayer({ videoUrl, onClose }: { videoUrl: string, onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Force play on mount to bypass browser autoPlay stringency in portals
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.warn("Autoplay was blocked by browser", e);
        setIsPlaying(false);
      });
    }
  }, []);

  const togglePlay = (e?: any) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const manualChange = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration / 100) * manualChange;
      setProgress(manualChange);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
      {/* Top Bar Area */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Video Surface Area - Tap to toggle play */}
      <div 
        className="flex-1 w-full h-full relative flex items-center justify-center bg-black cursor-pointer"
        onClick={togglePlay}
      >
         <video 
           ref={videoRef}
           src={videoUrl}
           className="w-full max-h-[100vh] object-contain"
           autoPlay 
           loop 
           playsInline
           onTimeUpdate={handleTimeUpdate}
           onPlay={() => setIsPlaying(true)}
           onPause={() => setIsPlaying(false)}
         ></video>

         {/* Visual Play/Pause feedback overlay */}
         {!isPlaying && (
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
             <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/10">
                <Play className="w-10 h-10 fill-white text-white drop-shadow-md ml-1" />
             </div>
           </div>
         )}
      </div>

      {/* Progress Seek Bar */}
      <div className="absolute bottom-10 left-0 w-full px-6 z-50">
         <div className="w-full h-2 bg-white/20 rounded-full relative group">
           {/* Filled Progress inside */}
           <div className="absolute top-0 left-0 h-full bg-[#FF4D6D] transition-all rounded-l-full" style={{ width: `${progress}%` }}></div>
           
           {/* Scrubber thumb simulation */}
           <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md shadow-black/20" style={{ left: `calc(${progress}% - 8px)` }}></div>

           {/* Invisible Range Slider */}
           <input 
             type="range" 
             min="0" 
             max="100" 
             step="0.1"
             value={progress || 0} 
             onChange={handleSeek}
             onClick={(e) => e.stopPropagation()} 
             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
           />
         </div>
      </div>
    </div>
  );
}
