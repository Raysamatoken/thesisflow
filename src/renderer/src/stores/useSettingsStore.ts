import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

interface SettingsState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsState>(set => ({
  theme: (localStorage.getItem('thesisflow-theme') as ThemeMode) || 'light',
  setTheme: (theme: ThemeMode) => {
    localStorage.setItem('thesisflow-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark' || theme === 'high-contrast') {
      document.body.setAttribute('data-theme', theme);
    } else {
      document.body.removeAttribute('data-theme');
    }
    set({ theme });
  },
}));

// Initialize theme on load
const savedTheme = (localStorage.getItem('thesisflow-theme') as ThemeMode) || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);