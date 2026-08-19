'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorMode } from '../types';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_MAP: Record<ColorMode, { primary: string; hover: string; lightBg: string; ring: string }> = {
  black: { primary: '#18181B', hover: '#27272A', lightBg: '#F4F4F5', ring: '#71717A' },
  blue: { primary: '#2563EB', hover: '#1D4ED8', lightBg: '#EFF6FF', ring: '#93C5FD' },
  amber: { primary: '#D97706', hover: '#B45309', lightBg: '#FFFBEB', ring: '#FCD34D' },
  emerald: { primary: '#059669', hover: '#047857', lightBg: '#ECFDF5', ring: '#6EE7B7' },
  rose: { primary: '#E11D48', hover: '#BE123C', lightBg: '#FFF1F2', ring: '#FDA4AF' },
  pink: { primary: '#DB2777', hover: '#BE185D', lightBg: '#FDF2F8', ring: '#F472B6' },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [colorMode, setColorModeState] = useState<ColorMode>('black');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('kanban_theme') as Theme | null;
    const savedColor = localStorage.getItem('kanban_colormode') as ColorMode | null;

    const initialTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'light';
    const initialColor = savedColor && COLOR_MAP[savedColor] ? savedColor : 'black';

    setThemeState(initialTheme);
    setColorModeState(initialColor);
    applyTheme(initialTheme);
    applyColorMode(initialColor);
  }, []);

  const applyTheme = (t: Theme) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const applyColorMode = (c: ColorMode) => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const config = COLOR_MAP[c] || COLOR_MAP.black;
      root.style.setProperty('--primary-color', config.primary);
      root.style.setProperty('--primary-hover', config.hover);
      root.style.setProperty('--primary-light', config.lightBg);
      root.style.setProperty('--primary-ring', config.ring);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('kanban_theme', newTheme);
    applyTheme(newTheme);
  };

  const setColorMode = (newMode: ColorMode) => {
    setColorModeState(newMode);
    localStorage.setItem('kanban_colormode', newMode);
    applyColorMode(newMode);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        colorMode,
        setColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
