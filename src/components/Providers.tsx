"use client";

import { SessionProvider } from "next-auth/react";
import { SiteSettingsProvider } from "./SiteSettingsProvider";
import { CartWishlistProvider } from "@/context/CartWishlistContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartWishlistProvider>
        <SiteSettingsProvider>
          {children}
        </SiteSettingsProvider>
      </CartWishlistProvider>
    </SessionProvider>
  );
}
