"use client";

import Navbar from "@/components/Navbar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex justify-center text-[#111111]">
        <div className="w-full max-w-[480px] bg-white min-h-screen shadow-[0_0_40px_rgba(0,0,0,0.05)] relative overflow-x-hidden flex flex-col">
          <Navbar />
          <main className="flex-1 pb-10">
            {children}
          </main>
        </div>
    </div>
  );
}
