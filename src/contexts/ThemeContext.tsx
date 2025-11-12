import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'nether' | 'end' | 'overworld';

interface ThemeColors {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  gradient: string;
  glow: string;
}

const THEMES: Record<ThemeType, ThemeColors> = {
  nether: {
    primary: '#dc2626', // red-600
    primaryHover: '#991b1b', // red-800
    secondary: '#ea580c', // orange-600
    accent: '#f59e0b', // amber-500
    gradient: 'from-red-600 via-orange-600 to-red-600',
    glow: 'rgba(220, 38, 38, 0.15)',
  },
  end: {
    primary: '#9333ea', // purple-600
    primaryHover: '#7e22ce', // purple-700
    secondary: '#ec4899', // pink-500
    accent: '#c084fc', // purple-400
    gradient: 'from-purple-600 via-pink-600 to-purple-600',
    glow: 'rgba(147, 51, 234, 0.15)',
  },
  overworld: {
    primary: '#16a34a', // green-600
    primaryHover: '#15803d', // green-700
    secondary: '#0891b2', // cyan-600
    accent: '#3b82f6', // blue-500
    gradient: 'from-green-600 via-cyan-600 to-blue-600',
    glow: 'rgba(22, 163, 74, 0.15)',
  },
};

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('end'); // Default: End (purple/pink)

  useEffect(() => {
    // Charger le thème depuis localStorage
    const savedTheme = localStorage.getItem('nether-client-theme') as ThemeType;
    if (savedTheme && THEMES[savedTheme]) {
      setThemeState(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Appliquer les couleurs CSS personnalisées
    const colors = THEMES[theme];
    document.documentElement.style.setProperty('--color-primary', colors.primary);
    document.documentElement.style.setProperty('--color-primary-hover', colors.primaryHover);
    document.documentElement.style.setProperty('--color-secondary', colors.secondary);
    document.documentElement.style.setProperty('--color-accent', colors.accent);
    document.documentElement.style.setProperty('--color-glow', colors.glow);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('nether-client-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Hook pour obtenir les classes Tailwind basées sur le thème actuel
export const useThemeClasses = () => {
  const { theme } = useTheme();
  
  const getButtonClass = () => {
    switch (theme) {
      case 'nether':
        return 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700';
      case 'end':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700';
      case 'overworld':
        return 'bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-700 hover:to-cyan-700';
      default:
        return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700';
    }
  };

  const getBorderClass = () => {
    switch (theme) {
      case 'nether':
        return 'border-red-500/40';
      case 'end':
        return 'border-purple-500/40';
      case 'overworld':
        return 'border-green-500/40';
      default:
        return 'border-purple-500/40';
    }
  };

  const getGlowClass = () => {
    switch (theme) {
      case 'nether':
        return 'shadow-[0_0_20px_rgba(220,38,38,0.15)]';
      case 'end':
        return 'shadow-[0_0_20px_rgba(168,85,247,0.15)]';
      case 'overworld':
        return 'shadow-[0_0_20px_rgba(22,163,74,0.15)]';
      default:
        return 'shadow-[0_0_20px_rgba(168,85,247,0.15)]';
    }
  };

  const getAccentClass = () => {
    switch (theme) {
      case 'nether':
        return 'text-orange-400';
      case 'end':
        return 'text-purple-400';
      case 'overworld':
        return 'text-cyan-400';
      default:
        return 'text-purple-400';
    }
  };

  const getBackgroundGradient = () => {
    switch (theme) {
      case 'nether':
        return 'from-[#1a0b0b] via-[#1f0d0d] to-[#1a0b0b]';
      case 'end':
        return 'from-[#1a0b2e] via-[#1f0d35] to-[#1a0b2e]';
      case 'overworld':
        return 'from-[#0b1a0b] via-[#0d1f0d] to-[#0b1a0b]';
      default:
        return 'from-[#1a0b2e] via-[#1f0d35] to-[#1a0b2e]';
    }
  };

  return {
    buttonClass: getButtonClass(),
    borderClass: getBorderClass(),
    glowClass: getGlowClass(),
    accentClass: getAccentClass(),
    backgroundGradient: getBackgroundGradient(),
  };
};

