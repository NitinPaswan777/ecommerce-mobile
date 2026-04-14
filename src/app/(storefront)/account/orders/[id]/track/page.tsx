"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Box, Truck, CheckCircle2, Package, Clock, ShieldCheck, MapPin } from "lucide-react";
import { motion } from "framer-motion";

interface OrderScan {
  date: string;
  location: string;
  activity: string;
  status?: string;
}

export default function TrackOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const [oRes, tRes] = await Promise.all([
          fetch(`${backendUrl}/api/orders/${id}`),
          fetch(`${backendUrl}/api/shiprocket/track/${id}`)
        ]);
        if (oRes.ok) setOrder(await oRes.json());
        if (tRes.ok) setTracking(await tRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (isLoading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const trackingData = tracking?.tracking_data || {};
  const scans = trackingData.shipment_track?.[0]?.scans || trackingData.shipment_track_activities || [];
  
  const deliveryStart = order?.createdAt ? new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const deliveryEnd = order?.createdAt ? new Date(new Date(order.createdAt).getTime() + 10 * 24 * 60 * 60 * 1000) : null;
  const dateRange = deliveryStart && deliveryEnd 
    ? `${deliveryStart.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} - ${deliveryEnd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
    : "Tue, 21 Apr - Fri, 24 Apr";

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto flex flex-col font-sans">
      {/* Premium Header */}
      <div className="h-14 border-b border-gray-100 flex items-center px-4 sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <h1 className="flex-1 text-center mr-8 text-[17px] font-bold text-gray-900 tracking-tight">Tracking Info</h1>
      </div>

      {/* Meta Info Section */}
      <div className="p-6 bg-[#FDFDFD] border-b border-gray-100">
        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
                <span className="text-[14px] text-gray-500 font-medium min-w-[120px]">Order ID:</span>
                <span className="text-[14px] text-gray-900 font-bold tracking-tight uppercase">{id}</span>
            </div>
            <div className="flex gap-2">
                <span className="text-[14px] text-gray-500 font-medium min-w-[120px]">Delivery Method:</span>
                <span className="text-[14px] text-gray-900 font-bold tracking-tight">Standard Delivery</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-[14px] text-gray-500 font-medium">Initial estimated delivery date:</span>
                <span className="text-[14px] text-gray-900 font-bold tracking-tight">{dateRange}</span>
            </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="flex-1 p-8">
        <div className="relative flex flex-col gap-12">
            {/* The Vertical Continuous Line */}
            <div className="absolute left-[20px] top-5 bottom-5 w-0.5 bg-black" />

            {/* If scans exist, map them. Otherwise show simplified placeholder */}
            {scans.length > 0 ? (
                scans.map((scan: OrderScan, idx: number) => (
                    <div key={idx} className="relative pl-14 flex flex-col gap-1.5">
                        <div className="absolute left-0 top-0 w-[42px] h-[42px] bg-black rounded-full flex items-center justify-center z-10 border-[6px] border-white ring-1 ring-gray-100 shadow-sm">
                            {idx === 0 ? <Truck className="w-5 h-5 text-white" /> : <Box className="w-4 h-4 text-white" />}
                        </div>
                        <h3 className={`text-[15px] font-bold ${idx === 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                            {scan.activity}
                        </h3>
                        <p className="text-[13px] text-gray-400 font-medium leading-snug">
                            {scan.location || "Process initiated."}
                        </p>
                        <p className="text-[12px] text-gray-400 font-medium mt-1 italic">
                            {scan.date}
                        </p>
                    </div>
                ))
            ) : (
                <>
                    {/* Placeholder Milestone 1: Tracking Info Soon */}
                    <div className="relative pl-14 flex flex-col gap-1.5">
                        <div className="absolute left-0 top-0 w-[42px] h-[42px] bg-gray-50 rounded-full flex items-center justify-center z-10 border-[6px] border-white">
                            <Clock className="w-4 h-4 text-gray-400" />
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-400 uppercase tracking-tight">Tracking info show soon</h3>
                        <p className="text-[13px] text-gray-400 font-medium leading-snug">
                            Your order is being prepared for shipment. Detailed tracking will appear once handed over to the courier.
                        </p>
                    </div>

                    {/* Placeholder Milestone 2: Order Placed */}
                    <div className="relative pl-14 flex flex-col gap-1.5">
                        <div className="absolute left-0 top-0 w-[42px] h-[42px] bg-black rounded-full flex items-center justify-center z-10 border-[6px] border-white">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-[15px] font-bold text-gray-900 uppercase tracking-tight">Order Confirmed</h3>
                        <p className="text-[13px] text-gray-400 font-medium leading-relaxed">
                            Congrats! Your order is confirmed and is currently being processed by our warehouse team.
                        </p>
                        <p className="text-[12px] text-gray-400 font-medium mt-1">
                            {order?.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Support Footer */}
      <div className="p-8 border-t border-gray-50 bg-[#FAFAFA]">
          <div className="flex items-center gap-4 text-gray-900">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                <MapPin className="w-6 h-6" />
             </div>
             <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">Shipment Destination</p>
                <p className="text-[13px] font-black mt-0.5">{order?.address?.city || 'New Delhi'}, {order?.address?.pincode || '110001'}</p>
             </div>
          </div>
      </div>
    </div>
  );
}
