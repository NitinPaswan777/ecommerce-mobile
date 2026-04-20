"use client";

import Link from "next/link";
import { Menu, Search, User, Heart, ShoppingBag } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SearchAutocomplete from "./SearchAutocomplete";
import { useSiteSettings } from "./SiteSettingsProvider";
import { useCartWishlist } from "@/context/CartWishlistContext";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { config } = useSiteSettings();
  const { cartCount, wishlistCount } = useCartWishlist();

  // Hide the global Navbar on account sub-pages as they have their own specialized back-headers
  if (pathname.startsWith('/account')) return null;

  return (
    <>
      <SearchAutocomplete isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <header className="fixed top-0 z-50 w-full max-w-[480px] bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Link href="/category" className="p-1 -ml-1 text-gray-800 hover:text-black transition-colors block">
              <Menu className="w-6 h-6" />
            </Link>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1 text-gray-800 hover:text-black transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center h-10 w-32 overflow-hidden">
            {config?.logoUrl ? (
              <img src={config.logoUrl} alt={config.siteName} className="h-full w-full object-contain" />
            ) : (
              <h1 className="text-[1.75rem] font-black tracking-[-0.08em] text-black lowercase leading-none" style={{ fontFamily: "cursive" }}>
                {config?.siteName || "instalook"}
              </h1>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <Link href={session ? "/account" : "/auth"} className="p-1 text-gray-800 hover:text-black transition-colors block">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </Link>
            <Link href="/wishlist" className="relative p-1 text-gray-800 hover:text-black transition-colors block">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4D6D] rounded-full border border-white"></span>
              )}
            </Link>
            <Link href="/cart" className="relative p-1 text-gray-800 hover:text-black transition-colors cursor-pointer block">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF4D6D] rounded-full border border-white"></span>
              )}
            </Link>
          </div>
        </div>
      </header>
      <div className="h-14 w-full shrink-0 relative"></div>
    </>
  );
}
