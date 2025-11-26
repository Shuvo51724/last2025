import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppCustomization } from '@shared/schema';

interface CustomizationContextType {
  customization: AppCustomization;
  updateCustomization: (updates: Partial<AppCustomization>) => void;
  resetToDefaults: () => void;
}

const defaultCustomization: AppCustomization = {
  appName: "DOB Performance Tracker",
  logoUrl: "",
  faviconUrl: "",
  theme: {
    primary: "#e91e63",
    secondary: "#9c27b0",
    background: "#ffffff",
    foreground: "#0a0a0a",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
  },
  loginPage: {
    logoUrl: "",
    backgroundImageUrl: "",
    welcomeText: "Enter your credentials to access the dashboard",
    showDeveloperCredit: true,
  },
};

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [customization, setCustomization] = useState<AppCustomization>(defaultCustomization);

  useEffect(() => {
    const stored = localStorage.getItem('dob_customization');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomization({ ...defaultCustomization, ...parsed });
      } catch (error) {
        console.error('Failed to load customization settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    applyCustomization(customization);
  }, [customization]);

  const updateCustomization = (updates: Partial<AppCustomization>) => {
    setCustomization(prev => {
      const updated = { ...prev, ...updates };
      if (updates.theme) {
        updated.theme = { ...prev.theme, ...updates.theme };
      }
      if (updates.loginPage) {
        updated.loginPage = { ...prev.loginPage, ...updates.loginPage };
      }
      localStorage.setItem('dob_customization', JSON.stringify(updated));
      return updated;
    });
  };

  const resetToDefaults = () => {
    setCustomization(defaultCustomization);
    localStorage.removeItem('dob_customization');
  };

  return (
    <CustomizationContext.Provider value={{ customization, updateCustomization, resetToDefaults }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within CustomizationProvider');
  }
  return context;
}

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

function applyCustomization(customization: AppCustomization) {
  const root = document.documentElement;
  
  root.style.setProperty('--primary', hexToHSL(customization.theme.primary));
  root.style.setProperty('--secondary', hexToHSL(customization.theme.secondary));
  root.style.setProperty('--background', hexToHSL(customization.theme.background));
  root.style.setProperty('--foreground', hexToHSL(customization.theme.foreground));
  if (customization.theme.muted) {
    root.style.setProperty('--muted', hexToHSL(customization.theme.muted));
  }
  if (customization.theme.mutedForeground) {
    root.style.setProperty('--muted-foreground', hexToHSL(customization.theme.mutedForeground));
  }
  
  document.title = customization.appName;
  
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (customization.faviconUrl) {
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = customization.faviconUrl;
  } else {
    if (link) {
      link.href = '/favicon.ico';
    }
  }
}
