import { ReactNode } from 'react';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { LoanProvider } from './LoanContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <LoanProvider>
          {children}
          <ToastContainer position="bottom-right" />
        </LoanProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}; 