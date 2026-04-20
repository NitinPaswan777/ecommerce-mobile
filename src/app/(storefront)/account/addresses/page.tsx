"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Plus, MapPin, Trash2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface Address {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  city: string;
  state: string;
  flatNo: string;
  street: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pincode: '',
    city: '',
    state: '',
    flatNo: '',
    street: '',
    isDefault: false
  });

  const [isPinChecking, setIsPinChecking] = useState(false);
  const [isPinValid, setIsPinValid] = useState(false);
  const [pinError, setPinError] = useState("");

  const fetchAddresses = async () => {
    const token = localStorage.getItem('savana_token');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/user/addresses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const validatePincode = async (pin: string) => {
    if (pin.length !== 6) {
      setIsPinValid(false);
      return;
    }

    setIsPinChecking(true);
    setPinError("");
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/shiprocket/serviceability?pincode=${pin}`);
      if (res.ok) {
        setIsPinValid(true);
      } else {
        setIsPinValid(false);
        setPinError("Delivery not available here");
      }
    } catch (e) {
      setPinError("Error validating pin");
    } finally {
      setIsPinChecking(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPinValid) {
      alert("Please provide a serviceable pincode");
      return;
    }
    const token = localStorage.getItem('savana_token');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/user/addresses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsAdding(false);
        setFormData({ name: '', phone: '', pincode: '', city: '', state: '', flatNo: '', street: '', isDefault: false });
        fetchAddresses();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem('savana_token');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${backendUrl}/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAddresses();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSetDefault = async (id: string) => {
    const token = localStorage.getItem('savana_token');
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${backendUrl}/api/user/addresses/${id}/default`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchAddresses();
    } catch (error) {
      console.error(error);
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
          <h1 className="text-lg font-black tracking-tight uppercase">Saved Addresses</h1>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="p-2 bg-black text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/20"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 p-4 pb-20">
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.form 
              key="add-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreate}
              className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col gap-5"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-black text-gray-900">New Address</h2>
                <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-black">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {[
                { name: 'name', label: 'Full Name', type: 'text' },
                { name: 'phone', label: 'Mobile Number', type: 'tel' },
                { name: 'pincode', label: 'Pincode', type: 'tel' },
                { name: 'flatNo', label: 'Flat / House No', type: 'text' },
                { name: 'street', label: 'Street / Area', type: 'text' },
                { name: 'city', label: 'City', type: 'text' },
                { name: 'state', label: 'State', type: 'text' },
              ].map((field) => (
                <div key={field.name} className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">{field.label}</label>
                  <input 
                    type={field.type}
                    required
                    maxLength={field.name === 'pincode' ? 6 : undefined}
                    value={(formData as any)[field.name]}
                    onChange={(e) => {
                      const val = field.name === 'pincode' ? e.target.value.replace(/\D/g, '') : e.target.value;
                      setFormData({ ...formData, [field.name]: val });
                      if (field.name === 'pincode') validatePincode(val);
                    }}
                    className={`h-10 border-b-2 bg-transparent focus:border-black outline-none transition-colors font-bold text-gray-800 ${
                      field.name === 'pincode' && isPinValid ? 'border-green-500' : 
                      field.name === 'pincode' && pinError ? 'border-red-500' : 'border-gray-100'
                    }`}
                  />
                  {field.name === 'pincode' && (
                    <div className="absolute right-0 bottom-2 flex items-center gap-1.5">
                      {isPinChecking && <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />}
                      {isPinValid && <Check className="w-4 h-4 text-green-500" strokeWidth={3} />}
                      {pinError && <X className="w-4 h-4 text-red-500" strokeWidth={3} />}
                    </div>
                  )}
                  {field.name === 'pincode' && pinError && (
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter absolute -bottom-4">{pinError}</span>
                  )}
                </div>
              ))}

              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-5 h-5 accent-black"
                />
                <span className="text-sm font-bold text-gray-700">Set as default address</span>
              </label>

              <button 
                type="submit"
                className="w-full h-14 bg-black text-white font-black rounded-2xl mt-4 hover:bg-gray-900 transition-colors shadow-xl shadow-black/10"
              >
                SAVE ADDRESS
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-4"
            >
              {isLoading ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm font-bold text-gray-400">LOADING ADDRESSES...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-lg font-black text-gray-400">No addresses saved yet.</p>
                  <button onClick={() => setIsAdding(true)} className="text-[#FF4D6D] font-black text-sm uppercase tracking-widest hover:underline">Add one now</button>
                </div>
              ) : (
                addresses.map((addr, idx) => (
                  <motion.div 
                    key={addr.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white p-5 rounded-3xl border-2 transition-all ${addr.isDefault ? 'border-black shadow-lg' : 'border-gray-100 shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight">{addr.name}</h3>
                        {addr.isDefault && (
                          <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded-full uppercase">DEFAULT</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr.id)} className="p-2 text-gray-400 hover:text-green-500 transition-colors">
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(addr.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-2 font-medium leading-relaxed">
                      {addr.flatNo}, {addr.street}<br />
                      {addr.city}, {addr.state} - {addr.pincode}<br />
                      <span className="text-gray-900 font-bold block mt-1">Phone: {addr.phone}</span>
                    </p>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
