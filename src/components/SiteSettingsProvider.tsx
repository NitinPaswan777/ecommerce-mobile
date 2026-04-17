"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SiteConfig {
  siteName: string;
  logoUrl?: string;
  bannerUrl?: string;
  bannerType?: string;
}

const SiteSettingsContext = createContext<{ config: SiteConfig }>({
  config: { siteName: "Savana Style" }
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>({ siteName: "Savana Style" });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (error) {
        console.error("Failed to fetch site settings", error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider value={{ config }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export const useSiteSettings = () => useContext(SiteSettingsContext);
