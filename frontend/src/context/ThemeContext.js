import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
  light: {
    name: 'light',
    // Background
    bgPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bgSecondary: 'rgba(245, 247, 250, 0.9)',
    bgPage: '#f0f2f5',
    
    // Glass effect
    glassBg: 'rgba(255, 255, 255, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.3)',
    glassShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
    glassBlur: 'blur(10px)',
    
    // Navbar glass
    navbarBg: 'rgba(255, 255, 255, 0.8)',
    navbarBorder: 'rgba(255, 255, 255, 0.5)',
    
    // Card glass
    cardBg: 'rgba(255, 255, 255, 0.65)',
    cardBorder: 'rgba(255, 255, 255, 0.4)',
    cardShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
    
    // Text
    textPrimary: '#1a1a2e',
    textSecondary: '#4a4a6a',
    textMuted: '#666680',
    textLight: '#ffffff',
    
    // Accents
    accent: '#667eea',
    accentGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentLight: 'rgba(102, 126, 234, 0.15)',
    
    // Status colors
    successBg: 'rgba(209, 250, 229, 0.8)',
    successText: '#059669',
    errorBg: 'rgba(254, 226, 226, 0.8)',
    errorText: '#dc2626',
    warningBg: 'rgba(254, 243, 199, 0.8)',
    warningText: '#d97706',
    infoBg: 'rgba(224, 231, 255, 0.8)',
    infoText: '#4f46e5',
    
    // Input
    inputBg: 'rgba(255, 255, 255, 0.6)',
    inputBorder: 'rgba(200, 200, 220, 0.5)',
    inputFocusBorder: '#667eea',
    
    // Misc
    divider: 'rgba(200, 200, 220, 0.3)',
    scrollbarTrack: 'rgba(200, 200, 220, 0.2)',
    scrollbarThumb: 'rgba(102, 126, 234, 0.4)',
  },
  dark: {
    name: 'dark',
    // Background
    bgPrimary: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    bgSecondary: 'rgba(30, 30, 50, 0.9)',
    bgPage: '#0a0a14',
    
    // Glass effect
    glassBg: 'rgba(30, 30, 50, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    glassBlur: 'blur(10px)',
    
    // Navbar glass
    navbarBg: 'rgba(30, 30, 50, 0.7)',
    navbarBorder: 'rgba(255, 255, 255, 0.1)',
    
    // Card glass
    cardBg: 'rgba(40, 40, 70, 0.5)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    
    // Text
    textPrimary: '#ffffff',
    textSecondary: '#b8b8d0',
    textMuted: '#8888a8',
    textLight: '#ffffff',
    
    // Accents
    accent: '#818cf8',
    accentGradient: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
    accentLight: 'rgba(129, 140, 248, 0.2)',
    
    // Status colors
    successBg: 'rgba(6, 78, 59, 0.5)',
    successText: '#34d399',
    errorBg: 'rgba(127, 29, 29, 0.5)',
    errorText: '#f87171',
    warningBg: 'rgba(120, 53, 15, 0.5)',
    warningText: '#fbbf24',
    infoBg: 'rgba(67, 56, 202, 0.3)',
    infoText: '#a5b4fc',
    
    // Input
    inputBg: 'rgba(50, 50, 80, 0.5)',
    inputBorder: 'rgba(100, 100, 140, 0.3)',
    inputFocusBorder: '#818cf8',
    
    // Misc
    divider: 'rgba(100, 100, 140, 0.2)',
    scrollbarTrack: 'rgba(50, 50, 80, 0.3)',
    scrollbarThumb: 'rgba(129, 140, 248, 0.4)',
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.style.background = themes[theme].bgPage;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    currentTheme: themes[theme],
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
