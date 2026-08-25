import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrandingSettings } from '../types';
import { 
  subscribeToBrandingSettings, 
  updateBrandingSettings, 
  DEFAULT_BRANDING_LOGO, 
  DEFAULT_BRANDING_FAVICON 
} from '../lib/firebase/firestore';

interface BrandingContextType {
  logoUrl: string;
  faviconUrl: string;
  updatedAt: number;
  isLoading: boolean;
  updateLogo: (url: string) => Promise<{ success: boolean; message?: string }>;
  updateFavicon: (url: string) => Promise<{ success: boolean; message?: string }>;
  resetLogo: () => Promise<{ success: boolean; message?: string }>;
  resetFavicon: () => Promise<{ success: boolean; message?: string }>;
  getBustedLogoUrl: () => string;
  getBustedFaviconUrl: () => string;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingSettings>({
    logoUrl: DEFAULT_BRANDING_LOGO,
    faviconUrl: DEFAULT_BRANDING_FAVICON,
    updatedAt: Date.now()
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to append cache busting param cleanly without query string duplication
  const getBustedUrl = (rawUrl?: string, timestamp?: any) => {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('data:')) return rawUrl;
    const v = timestamp || Date.now();
    try {
      if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
        const dummyUrl = new URL(rawUrl, 'http://localhost');
        dummyUrl.searchParams.set('v', String(v));
        return `${dummyUrl.pathname}?${dummyUrl.searchParams.toString()}`;
      } else if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
        const parsed = new URL(rawUrl);
        parsed.searchParams.set('v', String(v));
        return parsed.toString();
      } else {
        const clean = rawUrl.split('?')[0];
        return `${clean}?v=${v}`;
      }
    } catch {
      const clean = rawUrl.split('?')[0];
      return `${clean}?v=${v}`;
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToBrandingSettings((settings) => {
      setBranding({
        logoUrl: settings.logoUrl || DEFAULT_BRANDING_LOGO,
        faviconUrl: settings.faviconUrl || DEFAULT_BRANDING_FAVICON,
        updatedAt: settings.updatedAt || Date.now()
      });
      setIsLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Update dynamic favicon in document head
  useEffect(() => {
    const favUrl = branding.faviconUrl || DEFAULT_BRANDING_FAVICON;
    const versionedFavicon = getBustedUrl(favUrl, branding.updatedAt);

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = versionedFavicon;

    // Also update apple touch icon if present
    let appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
    if (appleLink) {
      appleLink.href = versionedFavicon;
    }
  }, [branding.faviconUrl, branding.updatedAt]);

  const updateLogo = async (newUrl: string) => {
    const res = await updateBrandingSettings({
      logoUrl: newUrl,
      updatedAt: Date.now()
    });
    return res;
  };

  const updateFavicon = async (newUrl: string) => {
    const res = await updateBrandingSettings({
      faviconUrl: newUrl,
      updatedAt: Date.now()
    });
    return res;
  };

  const resetLogo = async () => {
    const res = await updateBrandingSettings({
      logoUrl: DEFAULT_BRANDING_LOGO,
      updatedAt: Date.now()
    });
    return res;
  };

  const resetFavicon = async () => {
    const res = await updateBrandingSettings({
      faviconUrl: DEFAULT_BRANDING_FAVICON,
      updatedAt: Date.now()
    });
    return res;
  };

  const getBustedLogoUrl = () => {
    return getBustedUrl(branding.logoUrl, branding.updatedAt);
  };

  const getBustedFaviconUrl = () => {
    return getBustedUrl(branding.faviconUrl, branding.updatedAt);
  };

  return (
    <BrandingContext.Provider
      value={{
        logoUrl: branding.logoUrl || DEFAULT_BRANDING_LOGO,
        faviconUrl: branding.faviconUrl || DEFAULT_BRANDING_FAVICON,
        updatedAt: typeof branding.updatedAt === 'number' ? branding.updatedAt : Date.now(),
        isLoading,
        updateLogo,
        updateFavicon,
        resetLogo,
        resetFavicon,
        getBustedLogoUrl,
        getBustedFaviconUrl
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    // Fallback safe values if used outside provider
    return {
      logoUrl: DEFAULT_BRANDING_LOGO,
      faviconUrl: DEFAULT_BRANDING_FAVICON,
      updatedAt: Date.now(),
      isLoading: false,
      updateLogo: async () => ({ success: false, message: 'No Branding Provider' }),
      updateFavicon: async () => ({ success: false, message: 'No Branding Provider' }),
      resetLogo: async () => ({ success: false, message: 'No Branding Provider' }),
      resetFavicon: async () => ({ success: false, message: 'No Branding Provider' }),
      getBustedLogoUrl: () => DEFAULT_BRANDING_LOGO,
      getBustedFaviconUrl: () => DEFAULT_BRANDING_FAVICON,
    };
  }
  return context;
}
