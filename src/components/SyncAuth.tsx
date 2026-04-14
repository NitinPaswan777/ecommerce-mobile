"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SyncAuth() {
  const { data: session }: any = useSession();

  useEffect(() => {
    if (session?.backendToken) {
      localStorage.setItem('savana_token', session.backendToken);
      localStorage.setItem('savana_user', JSON.stringify(session.user));
      
      const guestId = localStorage.getItem('savana_guest_id');
      if (guestId && session.user?.id) {
         fetch('http://localhost:5000/api/cart/merge', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userId: session.user.id, guestId })
         }).then(() => localStorage.removeItem('savana_guest_id'));
      }
    } else if (session === null) {
      // CLEAR EVERYTHING IF LOGGED OUT
      localStorage.removeItem('savana_token');
      localStorage.removeItem('savana_user');
      localStorage.removeItem('savana_coupon');
    }
  }, [session]);

  return null;
}
