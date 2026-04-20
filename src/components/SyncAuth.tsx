"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function SyncAuth() {
  const { data: session }: any = useSession();

  useEffect(() => {
    if (session?.backendToken) {
      localStorage.setItem('instalook_token', session.backendToken);
      localStorage.setItem('instalook_user', JSON.stringify(session.user));

      const guestId = localStorage.getItem('instalook_guest_id');
      if (guestId && session.user?.id) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        fetch(`${backendUrl}/api/cart/merge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: session.user.id, guestId })
        }).then(() => localStorage.removeItem('instalook_guest_id'));
      }
    } else if (session === null) {
      // CLEAR EVERYTHING IF LOGGED OUT
      localStorage.removeItem('instalook_token');
      localStorage.removeItem('instalook_user');
      localStorage.removeItem('instalook_coupon');
    }
  }, [session]);

  return null;
}
