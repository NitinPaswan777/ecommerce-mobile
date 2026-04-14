"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Box, Truck, CheckCircle2, Package, Clock, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: any[];
  awbCode?: string;
  shiprocketOrderId?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isTrackLoading, setIsTrackLoading] = useState(false);
  const [selectedTrackOrder, setSelectedTrackOrder] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'TRACKING' | 'DETAILS' | null>(null);

  const fetchOrders = async () => {
    const token = localStorage.getItem('savana_token');
    try {
      // For now, if no orders API exists, we'll show a premium empty state or mock data
      const res = await fetch('http://localhost:5000/api/user/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchTracking = async (orderId: string) => {
    setSelectedTrackOrder(orderId);
    setIsTrackLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/shiprocket/track/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTrackLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED': return 'text-green-600 bg-green-50';
      case 'SHIPPED': return 'text-blue-600 bg-blue-50';
      case 'PENDING': return 'text-orange-600 bg-orange-50';
      case 'CANCELLED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'DELIVERED': return <CheckCircle2 className="w-4 h-4" />;
      case 'SHIPPED': return <Truck className="w-4 h-4" />;
      case 'CANCELLED': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    const token = localStorage.getItem('savana_token');
    try {
      const res = await fetch(`http://localhost:5000/api/user/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Order cancelled successfully");
        fetchOrders();
        setSelectedTrackOrder(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col">
      {/* Header */}
      <div className="bg-white px-4 h-16 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-black tracking-tight uppercase">My Orders</h1>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-bold text-gray-400">TRACKING YOUR PACKAGES...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-gray-50 relative">
               <Package className="w-10 h-10 text-gray-200" />
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                 className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-full"
               />
            </div>
            <div className="px-10">
              <p className="text-xl font-black text-gray-900 leading-tight">No active orders yet.</p>
              <p className="text-sm text-gray-400 font-medium mt-2">Looks like you haven't shopped with us recently. Your amazing finds will appear here!</p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="mt-4 bg-black text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:scale-105 active:scale-95 transition-all"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col gap-4"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order #{order.id.slice(-8)}</span>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)} {order.status}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center shrink-0">
                  {order.items[0]?.product?.images?.[0]?.url ? (
                    <img src={order.items[0].product.images[0].url} alt="product" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-gray-200" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-[13px] font-black text-gray-900 uppercase tracking-tight">
                    {order.items.length === 1 ? order.items[0].product.name : `${order.items.length} items ordered`}
                  </h4>
                  <p className="text-[11px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="text-[16px] font-black text-gray-900 mt-2">₹{order.totalAmount.toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                 <button 
                  onClick={() => { setSelectedTrackOrder(order.id); setModalMode('DETAILS'); }}
                  className="text-[11px] font-black text-gray-900 uppercase tracking-widest hover:underline"
                 >
                   View Details
                 </button>
                 <button 
                  onClick={() => router.push(`/account/orders/${order.id}/track`)}
                  className="bg-black text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/10 active:scale-95 transition-all text-center"
                 >
                   Track Order
                 </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                 <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest font-bold">Secure Order Verified</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {selectedTrackOrder && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedTrackOrder(null); setTrackingData(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              className="relative w-full max-w-sm bg-white rounded-t-[40px] sm:rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="px-8 pb-8 pt-4 overflow-y-auto max-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 leading-tight">
                      {modalMode === 'TRACKING' ? 'Shipment Journey' : 'Order Summary'}
                    </h3>
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mt-1">ID: #{selectedTrackOrder}</p>
                  </div>
                  <button onClick={() => { setSelectedTrackOrder(null); setTrackingData(null); setModalMode(null); }} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {modalMode === 'DETAILS' ? (
                  <div className="flex flex-col gap-8">
                     {/* Detailed Item List for "View Details" */}
                     <div className="flex flex-col gap-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Items Purchased</h4>
                        {orders.find(o => o.id === selectedTrackOrder)?.items.map((item, idx) => (
                           <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                              <div className="w-16 h-20 bg-white rounded-xl overflow-hidden shrink-0 border border-gray-100 italic">
                                 {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1">
                                 <p className="text-[13px] font-black text-gray-900 leading-tight">{item.product.name}</p>
                                 <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">Qty: {item.qty} • Size: {item.size} • Color: {item.color}</p>
                                 <p className="text-[12px] font-black text-gray-900 mt-2">₹{item.price.toLocaleString()} per unit</p>
                              </div>
                           </div>
                        ))}
                     </div>

                     {/* Price Summary */}
                     <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl shadow-black/30">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Subtotal</span>
                           <span className="text-[14px] font-bold">₹{orders.find(o => o.id === selectedTrackOrder)?.totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                           <span className="text-[12px] font-black uppercase tracking-[0.2em]">Total Paid</span>
                           <span className="text-[20px] font-black">₹{orders.find(o => o.id === selectedTrackOrder)?.totalAmount.toLocaleString()}</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => { setModalMode('TRACKING'); fetchTracking(selectedTrackOrder!); }}
                          className="w-full h-14 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest"
                        >
                          Track Shipment
                        </button>
                        {['PENDING', 'PAID'].includes(orders.find(o => o.id === selectedTrackOrder)?.status || '') && (
                          <button 
                            onClick={() => handleCancelOrder(selectedTrackOrder!)}
                            className="w-full h-14 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-[11px] font-black uppercase tracking-widest"
                          >
                            Request Cancellation
                          </button>
                        )}
                     </div>
                  </div>
                ) : (
                  // TRACKING MODE
                  isTrackLoading ? (
                    <div className="py-20 text-center">
                      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-8">
                       {/* Tracking Timeline */}
                       {trackingData?.tracking_data?.track_status === 0 ? (
                        <div className="bg-orange-50 p-6 rounded-[30px] border border-orange-100/50 flex flex-col gap-2">
                           <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-orange-400" />
                              <h4 className="text-[12px] font-black text-orange-600 uppercase tracking-widest">Processing</h4>
                           </div>
                           <p className="text-[11px] font-medium text-orange-900/60 leading-relaxed">We are currently preparing your items for handover to our courier partner.</p>
                        </div>
                      ) : trackingData?.tracking_data?.shipment_track?.[0] ? (
                        <div className="flex flex-col gap-6">
                           <div className="bg-[#FF4D6D] text-white p-6 rounded-[30px] shadow-xl shadow-[#FF4D6D]/20">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Truck className="w-6 h-6 text-white" />
                                 </div>
                                 <div>
                                   <p className="text-[10px] font-black tracking-widest opacity-60 uppercase">Current Status</p>
                                   <h4 className="text-lg font-black leading-tight uppercase">{trackingData.tracking_data.shipment_track[0].current_status}</h4>
                                 </div>
                              </div>
                           </div>

                           <div className="flex flex-col gap-8 ml-4 border-l-2 border-gray-100 pl-8 relative py-4">
                             {trackingData.tracking_data.shipment_track[0].scans.map((scan: any, i: number) => (
                               <div key={i} className="relative">
                                 <div className={`absolute -left-[41px] top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${i === 0 ? 'bg-[#FF4D6D]' : 'bg-gray-300'}`} />
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{scan.date}</p>
                                 <h5 className="text-[13px] font-bold text-gray-900 mt-1">{scan.location}</h5>
                                 <p className="text-[11px] text-gray-500 font-medium mt-1 uppercase tracking-tighter">{scan.activity}</p>
                               </div>
                             ))}
                           </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                           <Package className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest italic">{trackingData?.message || "Tracking info not available yet"}</p>
                        </div>
                      )}

                      <button 
                        onClick={() => setModalMode('DETAILS')}
                        className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest"
                      >
                         Back to Order Details
                      </button>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
