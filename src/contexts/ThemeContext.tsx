import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
    theme: Theme;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_KEY = 'gf-theme';

function getInitialTheme(): Theme {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
