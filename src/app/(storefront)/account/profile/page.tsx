"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, User, Phone, Save, CheckCircle2, Calendar, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// --- Wheel Picker Component ---
const WheelPicker = ({ options, value, onChange }: { options: any[], value: any, onChange: (val: any) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const idx = options.indexOf(value);
    if (scrollRef.current && idx !== -1) {
      scrollRef.current.scrollTop = idx * 40;
    }
  }, [value, options]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const idx = Math.round(scrollRef.current.scrollTop / 40);
    if (options[idx] !== value) {
      onChange(options[idx]);
    }
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-[200px] overflow-y-scroll snap-y snap-mandatory scrollbar-hide w-full"
    >
      <div className="h-[80px]" /> {/* Top padding */}
      {options.map((opt) => (
        <div 
          key={opt}
          className={`h-[40px] flex items-center justify-center snap-center text-lg font-bold transition-all ${opt === value ? 'text-black scale-110' : 'text-gray-300 scale-90'}`}
        >
          {opt}
        </div>
      ))}
      <div className="h-[80px]" /> {/* Bottom padding */}
    </div>
  );
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Custom Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState({ year: 1990, month: 1, day: 1 });

  const years = Array.from({ length: 100 }, (_, i) => 2024 - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: '',
    dob: ''
  });

  const fetchProfile = async () => {
    const token = localStorage.getItem('savana_token');
    try {
      const res = await fetch('http://localhost:5000/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        const dobStr = data.dob ? new Date(data.dob).toISOString().split('T')[0] : '';
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          dob: dobStr
        });
        
        if (dobStr) {
          const d = new Date(dobStr);
          setTempDate({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const token = localStorage.getItem('savana_token');
    try {
      await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      fetchProfile();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDate = () => {
    const dateStr = `${tempDate.year}-${tempDate.month.toString().padStart(2, '0')}-${tempDate.day.toString().padStart(2, '0')}`;
    setFormData({ ...formData, dob: dateStr });
    setShowDatePicker(false);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white px-4 h-16 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-lg font-black tracking-tight uppercase">My Profile</h1>
        </div>
      </div>

      <div className="p-6 flex flex-col items-center pb-32">
        <div className="relative mb-8">
           <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-white text-3xl font-black shadow-2xl relative overflow-hidden group">
              {profile?.image ? <img src={profile.image} className="w-full h-full object-cover" alt="Profile" /> : 'S'}
           </div>
           <div className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-100 flex items-center justify-center shadow-md">
              <UserRound className="w-4 h-4 text-gray-400" />
           </div>
        </div>

        <form onSubmit={handleUpdate} className="w-full flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">*Name</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-12 border-b border-gray-100 focus:border-black outline-none transition-colors font-bold text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-1.5" onClick={() => setShowDatePicker(true)}>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Birthday</label>
              <div className="w-full h-12 border-b border-gray-100 flex items-center justify-between font-bold text-gray-800 cursor-pointer">
                <span>{formData.dob || 'Birthday'}</span>
                <Calendar className="w-5 h-5 text-gray-300" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gender</label>
              <div className="flex gap-6">
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.gender === g ? 'border-orange-500' : 'border-gray-200 group-hover:border-gray-400'}`}>
                      {formData.gender === g && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                    </div>
                    <input type="radio" name="gender" className="hidden" onChange={() => setFormData({...formData, gender: g})} />
                    <span className={`text-[15px] font-medium ${formData.gender === g ? 'text-black font-bold' : 'text-gray-400'}`}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="mt-4 w-full h-14 bg-black text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl"
          >
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>

      {/* --- APP-STYLE DATE PICKER MODAL --- */}
      <AnimatePresence>
        {showDatePicker && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDatePicker(false)}
              className="fixed inset-0 bg-black/40 z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white z-[70] rounded-t-[30px] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <button onClick={() => setShowDatePicker(false)} className="text-gray-900 font-medium text-lg">Cancel</button>
                <h3 className="text-gray-900 font-bold text-lg">Select Date</h3>
                <button onClick={confirmDate} className="text-orange-500 font-bold text-lg">Confirm</button>
              </div>

              {/* Wheels */}
              <div className="relative px-6 py-4 flex gap-2">
                {/* Highlight/Selection Area */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[40px] border-y border-gray-100 pointer-events-none" />
                
                <WheelPicker options={years} value={tempDate.year} onChange={(v) => setTempDate({...tempDate, year: v})} />
                <WheelPicker options={months} value={tempDate.month} onChange={(v) => setTempDate({...tempDate, month: v})} />
                <WheelPicker options={days} value={tempDate.day} onChange={(v) => setTempDate({...tempDate, day: v})} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
