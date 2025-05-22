import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { LoanProvider } from './LoanContext';

// Define the shape of our context
interface AppContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Create the context with a default value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Props for the provider component
interface AppProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app
export const AppProvider = ({ children }: AppProviderProps) => {
  // State for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode) {
      setIsDarkMode(storedDarkMode === 'true');
    } else {
      // Check if user prefers dark mode at the OS level
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDarkMode);
    }
  }, []);

  // Save dark mode preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
    // Apply dark mode class to body
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  // Value object that will be provided to consumers
  const value = {
    isDarkMode,
    toggleDarkMode
  };

  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <LoanProvider>
          <AppContext.Provider value={value}>
            {children}
            <ToastContainer position="bottom-right" />
          </AppContext.Provider>
        </LoanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}; 