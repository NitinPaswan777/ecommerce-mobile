"use client";

import { ChevronLeft, User, ShoppingBag, HelpCircle, ChevronRight, MapPin, Headphones, Box, Truck, Info, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const sections = [
    {
      title: "My Account",
      items: [
        { label: "My Orders", icon: <Box className="w-5 h-5" />, href: "/account/orders" },
        { label: "My Profile", icon: <User className="w-5 h-5" />, href: "/account/profile" },
        { label: "Saved Address", icon: <MapPin className="w-5 h-5" />, href: "/account/addresses" },
      ]
    },
    {
      title: "Help Center",
      items: [
        { label: "Customer Service", icon: <Headphones className="w-5 h-5" />, href: "/help/customer-service" },
        { label: "Return Policy", icon: <Box className="w-5 h-5" />, href: "/help/returns" },
        { label: "Shipping & Delivery", icon: <Truck className="w-5 h-5" />, href: "/help/shipping" },
        { label: "About", icon: <Info className="w-5 h-5" />, href: "/help/about" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto shadow-2xl shadow-black/5">
      {/* Header */}
      <div className="bg-white px-4 h-16 flex items-center justify-between sticky top-0 z-50 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/account/profile')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <User className="w-6 h-6 text-gray-800" />
          </button>
          <button onClick={() => router.push('/cart')} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ShoppingBag className="w-6 h-6 text-gray-800" />
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <HelpCircle className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>

      {/* User Quick Info */}
      <div className="bg-white p-6 mb-2 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white text-xl font-bold">
            {session?.user?.name?.[0] || session?.user?.email?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{session?.user?.name || 'Savana User'}</h1>
            <p className="text-sm text-gray-500 font-medium">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-6">
        {sections.map((section, sIndex) => (
          <motion.div 
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sIndex * 0.1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
          >
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-[13px] font-black uppercase tracking-widest text-[#FF4D6D]">{section.title}</h2>
            </div>
            <div className="flex flex-col">
              {section.items.map((item, iIndex) => (
                <Link 
                  href={item.href} 
                  key={item.label}
                  className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-all active:scale-[0.98] ${iIndex !== section.items.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-50 rounded-xl text-gray-600">
                      {item.icon}
                    </div>
                    <span className="text-[15px] font-bold text-gray-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Logout Button */}
        <button 
          onClick={() => signOut({ callbackUrl: '/auth' })}
          className="mt-4 mb-10 w-full h-[56px] bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 font-bold text-[15px] hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" /> LOG OUT
        </button>
      </div>

      {/* Footer Branding */}
      <div className="py-10 text-center">
         <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-300">Savana Global Edition v1.0</p>
      </div>
    </div>
  );
}
