"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Key, Smartphone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AuthPage() {
  const router = useRouter();
  const [method, setMethod] = useState<'MOBILE' | 'EMAIL'>('MOBILE');
  const [step, setStep] = useState<'INPUT' | 'VERIFY'>('INPUT');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || identifier.length < 5) return setError("Please enter a valid identifier");

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
      });

      if (!res.ok) throw new Error("Failed to send OTP");

      const data = await res.json();
      // On development, we auto-fill the simulated OTP for demonstration
      if (data.simulatedOtp) {
        setOtp(data.simulatedOtp.split(''));
      }
      setStep('VERIFY');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return setError("Please enter full 6-digit code");

    setIsLoading(true);
    setError('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      // Store JWT token securely
      localStorage.setItem('instalook_token', data.token);
      localStorage.setItem('instalook_user', JSON.stringify(data.user));

      // Redirect into the application securely
      router.push('/cart');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col px-6 pt-10">
        <h2 className="text-2xl font-light text-gray-900 tracking-tight leading-tight">
          {step === 'INPUT' ? 'Welcome back! Login seamlessly.' : 'Secure Code'}
        </h2>
        <p className="text-[13px] text-gray-500 mt-2 font-medium">
          {step === 'INPUT'
            ? 'Enter your mobile number or email to receive a secure login code.'
            : `We have dispatched a 6-digit verification code to ${identifier}`
          }
        </p>

        {/* Mode Toggles */}
        {step === 'INPUT' && (
          <div className="flex mt-8 bg-gray-50 rounded p-1 shadow-inner border border-gray-100">
            <button
              onClick={() => setMethod('MOBILE')}
              className={`flex-1 py-2 text-[13px] font-bold rounded flex justify-center items-center gap-2 transition-all ${method === 'MOBILE' ? 'bg-white shadow-sm border border-gray-100/50 text-black' : 'text-gray-400'}`}
            >
              <Smartphone className="w-4 h-4" /> MOBILE
            </button>
            <button
              onClick={() => setMethod('EMAIL')}
              className={`flex-1 py-2 text-[13px] font-bold rounded flex justify-center items-center gap-2 transition-all ${method === 'EMAIL' ? 'bg-white shadow-sm border border-gray-100/50 text-black' : 'text-gray-400'}`}
            >
              <Mail className="w-4 h-4" /> EMAIL
            </button>
          </div>
        )}

        {/* Form Area */}
        {step === 'INPUT' ? (
          <form onSubmit={handleSendOtp} className="mt-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold tracking-widest text-gray-400 uppercase">
                {method === 'MOBILE' ? 'Mobile Number' : 'Email Address'}
              </label>
              <div className="relative">
                {method === 'MOBILE' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 border-r border-gray-200 h-full">
                    <span className="text-[13px] font-bold text-gray-700">+91</span>
                  </div>
                )}
                <input
                  type={method === 'MOBILE' ? 'tel' : 'email'}
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className={`w-full bg-white border-b-2 border-gray-200 outline-none h-12 text-[15px] font-medium text-gray-900 focus:border-black transition-colors ${method === 'MOBILE' ? 'pl-16' : 'pl-0'}`}
                  placeholder={method === 'MOBILE' ? "9876543210" : "name@example.com"}
                />
              </div>
            </div>

            {error && <span className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{error}</span>}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full h-[52px] bg-black text-white font-bold text-[14px] flex justify-between items-center px-6 shadow-xl shadow-black/10 hover:bg-gray-900 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? 'GENERATING...' : 'SEND OTP'} <ArrowRight className="w-5 h-5" />
            </button>

            <div className="relative flex items-center justify-center mt-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
              <span className="relative bg-white px-4 text-xs font-bold tracking-widest text-gray-300">OR</span>
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/' })}
              className="w-full h-12 border-2 border-gray-100 rounded flex justify-center items-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <Image src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
              <span className="text-[13px] font-bold text-gray-700">CONTINUE WITH GOOGLE</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-8 flex flex-col gap-8">
            <div className="flex justify-between px-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      const newOtp = [...otp];
                      newOtp[i] = val;
                      setOtp(newOtp);

                      // Auto focus next
                      if (val !== '' && i < 5) {
                        document.getElementById(`otp-${i + 1}`)?.focus();
                      }
                    }
                  }}
                  onPaste={(e) => {
                    const data = e.clipboardData.getData('text').trim();
                    if (/^\d{6}$/.test(data)) {
                      setOtp(data.split(''));
                      document.getElementById(`otp-5`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && otp[i] === '' && i > 0) {
                      document.getElementById(`otp-${i - 1}`)?.focus();
                    }
                  }}
                  className="w-[48px] h-[56px] border border-gray-200 rounded text-center text-xl font-black bg-gray-50 focus:bg-white focus:border-black outline-none shadow-inner"
                />
              ))}
            </div>

            {error && <span className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded">{error}</span>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] bg-[#FF4D6D] text-white font-bold text-[14px] flex justify-between items-center px-6 shadow-xl shadow-[#FF4D6D]/20 hover:bg-[#e03f5c] transition-colors rounded disabled:opacity-70 disabled:cursor-wait"
            >
              {isLoading ? 'VERIFYING ROW...' : 'SECURE VERIFY'} <Key className="w-5 h-5 fill-white/20" />
            </button>

            <p className="text-xs text-center text-gray-500 font-medium">
              Didn't receive code? <button type="button" onClick={handleSendOtp} className="text-black font-bold ml-1 hover:underline">Resend OTP</button>
            </p>
          </form>
        )}

        <div className="mt-auto pb-10 text-center flex flex-col items-center">
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#FF4D6D]/50 mb-2">SECURED BY instalook</p>
          <p className="text-[10px] text-gray-400 font-medium px-10">By signing in, you agree to our Terms of Use and Privacy Policy regarding data encryption.</p>
        </div>
      </div>
    </div>
  );
}
