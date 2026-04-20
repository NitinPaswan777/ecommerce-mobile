"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface WishlistButtonProps {
    productId: string;
    initialStatus?: boolean;
    className?: string;
    iconClassName?: string;
}

export default function WishlistButton({ productId, initialStatus = false, className, iconClassName }: WishlistButtonProps) {
    const { data: session } = useSession();
    const [isInWishlist, setIsInWishlist] = useState(initialStatus);
    const [isLoading, setIsLoading] = useState(false);

    // If initialStatus is not provided, we might want to check it, 
    // but on feed pages it's better to just assume false or let the parent pass it if they already fetched the wishlist.
    // For now, we'll just toggle and let the backend handle the state.

    useEffect(() => {
        // Optional: Only check if session exists and we don't have initial status
        const checkStatus = async () => {
            const token = localStorage.getItem('instalook_token');
            if (token && !initialStatus) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const items = await res.json();
                        setIsInWishlist(items.some((it: any) => it.productId === productId));
                    }
                } catch (e) { }
            }
        };
        checkStatus();
    }, [productId, initialStatus, session]);

    const toggleWishlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('instalook_token');
        if (!token) {
            toast.error("Please login to use wishlist", {
                style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
            });
            return;
        }

        if (isLoading) return;
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });

            if (res.ok) {
                const data = await res.json();
                setIsInWishlist(data.added);
                toast.success(data.added ? "Added to Wishlist" : "Removed from Wishlist", {
                    icon: data.added ? '❤️' : '💔',
                    duration: 1500,
                    style: { borderRadius: '10px', background: '#333', color: '#fff', fontSize: '13px', fontWeight: 'bold' }
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={toggleWishlist}
            disabled={isLoading}
            className={className || "w-8 h-8 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-800 shadow-sm border border-gray-100 transition-all z-20"}
        >
            <Heart
                className={`${iconClassName || 'w-4 h-4'} ${isInWishlist ? 'fill-[#FF4D6D] text-[#FF4D6D]' : 'text-gray-800'}`}
            />
        </button>
    );
}
