"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, CreditCard, Wallet, ShieldCheck, Plus, ArrowRight, Lock, CheckCircle2, Smartphone, Mail, Key, Check, X, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import Script from "next/script";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [realCartId, setRealCartId] = useState("");
  
  // Shiprocket Guest States
  const [isPinChecking, setIsPinChecking] = useState(false);
  const [isPinValid, setIsPinValid] = useState(false);
  const [pinError, setPinError] = useState("");
  const [deliveryEtd, setDeliveryEtd] = useState("");
  const [config, setConfig] = useState({ codCharge: 0, freeCodThreshold: 0 });
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Guest Verification States
  const [guestFormData, setGuestFormData] = useState({
    name: "", phone: "", email: "", pincode: "", city: "", state: "", flatNo: "", street: ""
  });
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [showPhoneOtp, setShowPhoneOtp] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const token = session?.backendToken || (typeof window !== 'undefined' ? localStorage.getItem('savana_token') : null);
  const user = session?.user || (token && typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('savana_user') || '{}') : null);

  const fetchData = async () => {
    const guestId = localStorage.getItem('savana_guest_id');
    const savedCoupon = localStorage.getItem('savana_coupon');
    if (savedCoupon) {
      const { discount } = JSON.parse(savedCoupon);
      setCouponDiscount(discount);
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const configRes = await fetch(`${backendUrl}/api/config`);
      if (configRes.ok) setConfig(await configRes.json());

      const cartUrl = new URL(`${backendUrl}/api/cart`);
      if (user?.id) cartUrl.searchParams.append('userId', user.id);
      if (guestId) cartUrl.searchParams.append('guestId', guestId);

      const cartRes = await fetch(cartUrl.toString());
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setTotalAmount(cartData.total);
        setRealCartId(cartData.cartId);
        if (cartData.items.length === 0) router.push('/cart');
      }

      if (token) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const addrRes = await fetch(`${backendUrl}/api/user/addresses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (addrRes.ok) {
          const data = await addrRes.json();
          setAddresses(data);
          if (data.length > 0) setSelectedAddressId(data[0].id);
          // If logged in, we trust they are verified ONLY IF the data exists
          setIsEmailVerified(!!user?.email);
          setIsPhoneVerified(!!user?.phone);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Fill from user session if available
    if (user) {
      setGuestFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
      setIsEmailVerified(!!user.email);
      setIsPhoneVerified(!!user.phone);
    } else {
      // Only load guest info if not logged in
      const savedInfo = localStorage.getItem('savana_guest_info');
      if (savedInfo) {
        const { data, emailV, phoneV } = JSON.parse(savedInfo);
        setGuestFormData(data);
        setIsEmailVerified(emailV);
        setIsPhoneVerified(phoneV);
      }
    }
  }, [status, user]);

  // Save guest info on change
  useEffect(() => {
    if (!token) {
      localStorage.setItem('savana_guest_info', JSON.stringify({
        data: guestFormData,
        emailV: isEmailVerified,
        phoneV: isPhoneVerified
      }));
    }
  }, [guestFormData, isEmailVerified, isPhoneVerified, token]);

  const sendOtp = async (type: 'email' | 'phone') => {
    const identifier = type === 'email' ? guestFormData.email : guestFormData.phone;
    if (!identifier) return;

    setIsSendingOtp(true);
    try {
      if (type === 'phone') {
        // Simulation for now
        setShowPhoneOtp(true);
        setPhoneOtp("123456"); // Simulated auto-fill
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/auth/send-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.simulatedOtp) setEmailOtp(data.simulatedOtp);
          setShowEmailOtp(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const validatePincode = async (pin: string) => {
    if (pin.length !== 6) {
      setIsPinValid(false);
      setDeliveryEtd("");
      return;
    }

    setIsPinChecking(true);
    setPinError("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/shiprocket/serviceability?pincode=${pin}`);
      if (res.ok) {
        const data = await res.json();
        setIsPinValid(true);
        setDeliveryEtd(data.etd);
      } else {
        setIsPinValid(false);
        setPinError("Delivery not available here");
        setDeliveryEtd("");
      }
    } catch (e) {
      setPinError("Error validating pin");
    } finally {
      setIsPinChecking(false);
    }
  };

  useEffect(() => {
    // Fetch ETD for selected saved address
    if (selectedAddressId && addresses.length > 0) {
      const selected = addresses.find(a => a.id === selectedAddressId);
      if (selected?.pincode) {
        validatePincode(selected.pincode);
      }
    }
  }, [selectedAddressId, addresses]);

  const verifyOtp = async (type: 'email' | 'phone') => {
    const identifier = type === 'email' ? guestFormData.email : guestFormData.phone;
    const code = type === 'email' ? emailOtp : phoneOtp;

    if (type === 'phone') {
      setIsPhoneVerified(true);
      setShowPhoneOtp(false);
    } else {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code, guestOnly: true })
      });
      if (res.ok) {
        const data = await res.json();
        setIsEmailVerified(true);
        setShowEmailOtp(false);

        // TRIGGER REAL SILENT LOGIN
        if (data.user?.id) {
          await signIn('silent-login', {
            userId: data.user.id,
            redirect: false
          });
        }
      }
    }
  };

  const isAddressValid = token
    ? (selectedAddressId !== "" || (guestFormData.name && guestFormData.pincode && guestFormData.city && guestFormData.flatNo && guestFormData.street))
    : (guestFormData.name && isEmailVerified && isPhoneVerified && guestFormData.pincode && guestFormData.city && guestFormData.flatNo && guestFormData.street);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddressValid) return;
    setIsPlacingOrder(true);

    // 1. If Online Payment, Handle Razorpay Flow
    if (paymentMethod === 'RAZORPAY') {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const resOrder = await fetch(`${backendUrl}/api/payment/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: totalAmount - couponDiscount })
        });
        if (!resOrder.ok) throw new Error("Payment order creation failed");
        const rzpOrder = await resOrder.json();

        const selectedAddress = addresses.find(a => a.id === selectedAddressId);

        const options = {
          key: "rzp_test_Sd8PCYXaf5yNfQ", // THIS IS A PLACEHOLDER - IT USES KEY ON BACKEND FOR VERANCE
          amount: rzpOrder.amount,
          currency: "INR",
          name: "Savana E-Commerce",
          description: "Premium Fashion Order",
          order_id: rzpOrder.id,
          handler: async function (response: any) {
            // On Success, Verify and Place actual order
            await finalizeOrder(response);
          },
          prefill: {
            name: guestFormData.name || selectedAddress?.name || user?.name || "",
            email: guestFormData.email || user?.email || "",
            contact: guestFormData.phone || selectedAddress?.phone || user?.phone || ""
          },
          theme: { color: "#000000" }
        };

        const rzp1 = new (window as any).Razorpay(options);
        
        // Handle closure/failure to reset loading state
        rzp1.on('payment.failed', () => setIsPlacingOrder(false));
        
        rzp1.open();
        // Note: Keep setIsPlacingOrder(true) here!
        return;
      } catch (err) {
        console.error(err);
        setIsPlacingOrder(false);
        return;
      }
    }

    // 2. Handle COD or already verified online payment
    await finalizeOrder();
  };

  const finalizeOrder = async (razorpayDetails?: any) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('savana_user') || '{}');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/checkout/place-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || currentUser?.id,
          cartId: realCartId,
          totalAmount: totalAmount - couponDiscount + (paymentMethod === 'COD' && (totalAmount - couponDiscount) < config.freeCodThreshold ? config.codCharge : 0),
          paymentMethod,
          addressId: selectedAddressId,
          guestAddress: !selectedAddressId ? guestFormData : null,
          guestEmail: guestFormData.email,
          guestPhone: guestFormData.phone,
          razorpayDetails
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/checkout/success?orderId=${data.orderId || ''}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const currentCodFee = (paymentMethod === 'COD' && (totalAmount - couponDiscount) < config.freeCodThreshold) ? config.codCharge : 0;
  const isFreeCodEligible = paymentMethod === 'COD' && (totalAmount - couponDiscount) >= config.freeCodThreshold;

  // Decision logic: should we show the selection list or the input form?
  const showAddressSelection = token && addresses.length > 0;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FDFDFD] pb-32">
      <div className="bg-white px-4 h-14 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100/50">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-800"><ChevronLeft className="w-5 h-5" /></button>
        <span className="text-[13px] font-bold uppercase tracking-[0.1em] text-gray-900">Checkout</span>
        <div className="w-8"></div>
      </div>

      <form onSubmit={handlePlaceOrder} className="p-5 flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Shipping Address</h2>
            {showAddressSelection && <button type="button" onClick={() => router.push('/account/addresses')} className="text-[10px] font-bold text-[#FF4D6D] uppercase tracking-wider">Change</button>}
          </div>

          {showAddressSelection ? (
            <div className="flex flex-col gap-3">
              {addresses.filter(a => a.id === selectedAddressId || !selectedAddressId).slice(0, 1).map((addr) => (
                <div key={addr.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{addr.name}</p>
                      <p className="text-[12px] text-gray-400 font-medium leading-relaxed mt-1">{addr.flatNo}, {addr.street}, {addr.city}, {addr.pincode}</p>
                      
                      {deliveryEtd && selectedAddressId === addr.id && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="mt-3 py-2 px-3 bg-green-50 rounded-xl border border-green-100/50 flex items-center gap-2"
                        >
                          <Truck className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-[10px] font-black text-green-700 uppercase tracking-tighter">
                            Estimated delivery by {new Date(deliveryEtd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                <input required type="text" value={guestFormData.name} onChange={(e) => setGuestFormData({ ...guestFormData, name: e.target.value })} className="h-9 border-b border-gray-100 focus:border-black outline-none text-[13px] font-medium text-gray-800 transition-all" />
              </div>

              {/* Phone Input + Verification */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Phone Number</label>
                <div className="flex items-center gap-3">
                  <input
                    required disabled={isPhoneVerified}
                    type="tel" value={guestFormData.phone} onChange={(e) => setGuestFormData({ ...guestFormData, phone: e.target.value })}
                    className="flex-1 h-9 border-b border-gray-100 focus:border-black outline-none text-[13px] font-medium text-gray-800 disabled:opacity-50"
                  />
                  {!isPhoneVerified && !showPhoneOtp && (
                    <button
                      type="button"
                      onClick={() => sendOtp('phone')}
                      disabled={isSendingOtp}
                      className="text-[10px] font-bold text-[#FF4D6D] uppercase flex items-center gap-2"
                    >
                      {isSendingOtp ? <div className="w-3 h-3 border-2 border-[#FF4D6D] border-t-transparent rounded-full animate-spin" /> : "Verify"}
                    </button>
                  )}
                  {isPhoneVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                {showPhoneOtp && (
                  <div className="mt-2 flex gap-2">
                    <input placeholder="Code" className="flex-1 h-10 bg-gray-50 rounded px-3 text-sm font-bold" value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)} />
                    <button type="button" onClick={() => verifyOtp('phone')} className="bg-black text-white px-4 rounded text-[10px] font-bold uppercase transition-all hover:scale-105">Confirm</button>
                  </div>
                )}
              </div>

              {/* Email Input + Verification */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="flex items-center gap-3">
                  <input
                    required disabled={isEmailVerified}
                    type="email" value={guestFormData.email} onChange={(e) => setGuestFormData({ ...guestFormData, email: e.target.value })}
                    className="flex-1 h-9 border-b border-gray-100 focus:border-black outline-none text-[13px] font-medium text-gray-800 disabled:opacity-50"
                  />
                  {!isEmailVerified && !showEmailOtp && (
                    <button
                      type="button"
                      onClick={() => sendOtp('email')}
                      disabled={isSendingOtp}
                      className="text-[10px] font-bold text-[#FF4D6D] uppercase flex items-center gap-2"
                    >
                      {isSendingOtp ? <div className="w-3 h-3 border-2 border-[#FF4D6D] border-t-transparent rounded-full animate-spin" /> : "Verify"}
                    </button>
                  )}
                  {isEmailVerified && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
                {showEmailOtp && (
                  <div className="mt-2 flex gap-2">
                    <input placeholder="Code" className="flex-1 h-10 bg-gray-50 rounded px-3 text-sm font-bold" value={emailOtp} onChange={e => setEmailOtp(e.target.value)} />
                    <button type="button" onClick={() => verifyOtp('email')} className="bg-black text-white px-4 rounded text-[10px] font-bold uppercase">Confirm</button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">House/Flat No.</label>
                  <input required type="text" value={guestFormData.flatNo} onChange={(e) => setGuestFormData({ ...guestFormData, flatNo: e.target.value })} className="h-9 border-b border-gray-100 outline-none text-[13px] font-medium" />
                </div>
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Pincode</label>
                  <div className="relative">
                    <input 
                      required 
                      type="tel" 
                      maxLength={6}
                      value={guestFormData.pincode} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setGuestFormData({ ...guestFormData, pincode: val });
                        validatePincode(val);
                      }} 
                      className={`w-full h-9 border-b outline-none text-[13px] font-medium transition-all ${
                        isPinValid ? 'border-green-500' : pinError ? 'border-red-500' : 'border-gray-100'
                      }`} 
                    />
                    <div className="absolute right-0 bottom-2 flex items-center gap-1.5">
                      {isPinChecking && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                      {isPinValid && <Check className="w-4 h-4 text-green-500" strokeWidth={3} />}
                      {pinError && <X className="w-4 h-4 text-red-500" strokeWidth={3} />}
                    </div>
                  </div>
                  {pinError && <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter absolute -bottom-3.5">{pinError}</span>}
                  
                  {isPinValid && deliveryEtd && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute left-0 -bottom-10 w-full bg-green-50 px-3 py-1.5 rounded-lg border border-green-100/50 flex items-center gap-2 z-10"
                    >
                      <Truck className="w-3 h-3 text-green-600" />
                      <span className="text-[9px] font-bold text-green-700 uppercase tracking-tighter">
                        Delivery by {new Date(deliveryEtd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })}
                      </span>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Street/Area</label>
                <input required type="text" value={guestFormData.street} onChange={(e) => setGuestFormData({ ...guestFormData, street: e.target.value })} className="h-9 border-b border-gray-100 outline-none text-[13px] font-medium" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">City</label>
                <input required type="text" value={guestFormData.city} onChange={(e) => setGuestFormData({ ...guestFormData, city: e.target.value })} className="h-9 border-b border-gray-100 outline-none text-[13px] font-medium" />
              </div>
            </div>
          )}
        </section>

        {/* Payment Method Selector */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Payment Method</h2>
          <div className="flex flex-col gap-3">
            {[
              { id: 'COD', label: 'Cash on Delivery', desc: (totalAmount - couponDiscount) < config.freeCodThreshold ? `+₹${config.codCharge} handling fee` : 'Free handling' },
              { id: 'RAZORPAY', label: 'Online Payment', desc: 'Secure payment via Razorpay' }
            ].map((pm) => (
              <label key={pm.id} className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === pm.id ? 'border-black bg-gray-50/20' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === pm.id ? 'border-black' : 'border-gray-100'}`}>
                    {paymentMethod === pm.id && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900">{pm.label}</p>
                    <p className="text-[10px] text-gray-400 font-medium tracking-wide">{pm.desc}</p>
                  </div>
                </div>
                <input type="radio" className="hidden" checked={paymentMethod === pm.id} onChange={() => setPaymentMethod(pm.id)} />
              </label>
            ))}
          </div>
        </section>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-center text-[12px] font-medium text-gray-500">
            <span>Order Subtotal</span>
            <span className="text-gray-900 font-bold">₹{totalAmount.toLocaleString()}</span>
          </div>
          {couponDiscount > 0 && <div className="flex justify-between items-center text-[12px] font-medium text-green-600"><span>Promo Discount</span><span className="font-bold">-₹{couponDiscount.toLocaleString()}</span></div>}
          {paymentMethod === 'COD' && (
            <div className="flex justify-between items-center text-[12px] font-medium text-gray-500">
              <span>COD Handling Fee</span>
              {isFreeCodEligible ? <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Free</span> : <span className="text-gray-900 font-bold">₹{config.codCharge}</span>}
            </div>
          )}
          <div className="h-px bg-gray-50 w-full my-1" />
          <div className="flex justify-between items-center"><span className="text-[14px] font-bold text-gray-900">Total Amount</span><span className="text-2xl font-black text-gray-900">₹{(totalAmount - couponDiscount + currentCodFee).toLocaleString()}</span></div>
        </div>

        <div className="flex items-center justify-center gap-2 py-4 bg-gray-50 rounded-2xl border border-gray-100/50">
          <Lock className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Secure 256-bit SSL Encrypted</p>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-5 bg-white border-t border-gray-100/50 z-50 flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</span>
          <span className="text-[20px] font-bold text-gray-900 leading-tight">₹{(totalAmount - couponDiscount + currentCodFee).toLocaleString()}</span>
        </div>
        <button
          disabled={isPlacingOrder}
          onClick={(e) => {
            if (!isAddressValid) {
              alert("Please fill all details and verify your email/phone.");
              return;
            }
            if (!token && !isPinValid) {
              alert("Please enter a serviceable pincode.");
              return;
            }
            handlePlaceOrder(e);
          }}
          className="flex-1 h-14 bg-black text-white font-bold text-[12px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-black/10 hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale"
        >
          {isPlacingOrder ? 'Processing...' : (paymentMethod === 'COD' ? 'Place Order' : 'Pay Now')}
        </button>
      </div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Full Screen Premium Loader */}
      <AnimatePresence>
        {isPlacingOrder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative">
              <div className="w-20 h-20 border-2 border-gray-100 rounded-full" />
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-20 h-20 border-2 border-black border-t-transparent rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]"
              />
            </div>
            
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col gap-2"
            >
              <h3 className="text-[14px] font-bold uppercase tracking-[0.2em] text-gray-900">Securing Transaction</h3>
              <p className="text-[11px] font-medium text-gray-400 max-w-[200px] leading-relaxed">Please do not refresh or close this window while we process your request.</p>
            </motion.div>
            
            {/* Elegant Shimmer Line */}
            <div className="mt-8 w-40 h-[2px] bg-gray-50 rounded-full overflow-hidden relative">
              <motion.div 
                animate={{ left: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-black to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
