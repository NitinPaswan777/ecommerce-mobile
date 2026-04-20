"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface CartWishlistContextType {
  cartCount: number;
  wishlistCount: number;
  refreshCounts: () => Promise<void>;
}

const CartWishlistContext = createContext<CartWishlistContextType>({
  cartCount: 0,
  wishlistCount: 0,
  refreshCounts: async () => { },
});

export function CartWishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchCounts = async () => {
    // Only fetch if session is stable or we have a guestId
    const token = (session as any)?.backendToken || localStorage.getItem('instalook_token');
    const guestId = localStorage.getItem('instalook_guest_id');
    const userJson = localStorage.getItem('instalook_user');
    const user = userJson ? JSON.parse(userJson) : null;

    try {
      // Fetch Cart Count
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const cartUrl = new URL(`${backendUrl}/api/cart`);
      if (user?.id) cartUrl.searchParams.append('userId', user.id);
      if (guestId) cartUrl.searchParams.append('guestId', guestId);

      const cartRes = await fetch(cartUrl.toString());
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartCount(cartData.items?.length || 0);
      }

      // Fetch Wishlist Count (needs token)
      if (token) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const wishlistRes = await fetch(`${backendUrl}/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (wishlistRes.ok) {
          const wishlistData = await wishlistRes.json();
          setWishlistCount(wishlistData.length || 0);
        }
      } else {
        setWishlistCount(0);
      }
    } catch (err) {
      console.error("Failed to fetch counts", err);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchCounts();
    }
  }, [session, status]);

  // Listen for local storage changes (if other tabs update cart)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'instalook_cart_updated' || e.key === 'instalook_wishlist_updated') {
        fetchCounts();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <CartWishlistContext.Provider value={{ cartCount, wishlistCount, refreshCounts: fetchCounts }}>
      {children}
    </CartWishlistContext.Provider>
  );
}

export const useCartWishlist = () => useContext(CartWishlistContext);
