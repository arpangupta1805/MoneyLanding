import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'react-toastify';
import type { User } from '../types/index';
import { authAPI } from '../services/api';

export type PasswordValidation = {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
};

export type VerificationState = {
  userId: string;
  email: string;
  fullName: string;
};

interface AuthContextType {
  currentUser: User | null;
  verificationState: VerificationState | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id'>) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  checkUsername: (username: string) => Promise<boolean>;
  validatePassword: (password: string) => Promise<PasswordValidation>;
  verifyEmail: (userId: string, otp: string) => Promise<boolean>;
  resendVerification: (userId: string) => Promise<void>;
  setVerificationState: (state: VerificationState | null) => void;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (userId: string, otp: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [verificationState, setVerificationState] = useState<VerificationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Check for saved session on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      
      // Verify token validity with backend
      authAPI.getProfile()
        .then(response => {
          if (response.success) {
            setCurrentUser(response.user);
          } else {
            // Token invalid, clear session
            logout();
          }
        })
        .catch(() => {
          // Error checking token, clear session
          logout();
        });
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login(username, password);
      
      // If login requires verification (email not verified)
      if (response.requiresVerification) {
        // Get user details from the response or make an additional API call if needed
        const userEmail = response.email || username; // Fallback to username if email not provided
        const userFullName = response.fullName || 'User'; // Fallback to 'User' if fullName not provided
        
        setVerificationState({
          userId: response.userId,
          email: userEmail,
          fullName: userFullName
        });
        
        toast.info('Please verify your email to continue');
        setIsLoading(false);
        return true;
      }
      
      // Normal login success
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setCurrentUser(response.user);
        toast.success('Login successful!');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Login failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id'>): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        // Set verification state for email verification
        setVerificationState({
          userId: response.userId,
          email: userData.email,
          fullName: userData.fullName
        });
        
        toast.success(response.message || 'Registration successful! Please verify your email.');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Registration failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      setIsLoading(false);
      return false;
    }
  };

  const verifyEmail = async (userId: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.verifyEmail(userId, otp);
      
      if (response.success) {
        // Store user data and token
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setCurrentUser(response.user);
        setVerificationState(null);
        
        toast.success(response.message || 'Email verified successfully!');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Verification failed');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error(error.message || 'Verification failed');
      setIsLoading(false);
      return false;
    }
  };

  const resendVerification = async (userId: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.resendVerification(userId);
      
      if (response.success) {
        toast.success(response.message || 'Verification code resent to your email');
      } else {
        toast.error(response.message || 'Failed to resend verification code');
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(error.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<any> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.forgotPassword(email);
      
      if (response.success) {
        toast.success(response.message || 'Password reset instructions sent to your email');
        setIsLoading(false);
        return {
          success: true,
          userId: response.userId
        };
      } else {
        toast.error(response.message || 'Failed to process password reset');
        setIsLoading(false);
        return {
          success: false
        };
      }
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.message || 'Failed to process password reset');
      setIsLoading(false);
      return {
        success: false
      };
    }
  };

  const resetPassword = async (userId: string, otp: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.resetPassword(userId, otp, newPassword);
      
      if (response.success) {
        toast.success(response.message || 'Password reset successful');
        setIsLoading(false);
        return true;
      } else {
        toast.error(response.message || 'Failed to reset password');
        setIsLoading(false);
        return false;
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.message || 'Failed to reset password');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info('You have been logged out');
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const response = await authAPI.checkUsername(username);
      return response.available;
    } catch (error) {
      console.error('Check username error:', error);
      return false;
    }
  };

  const validatePassword = async (password: string): Promise<PasswordValidation> => {
    try {
      const response = await authAPI.validatePassword(password);
      return response.validations;
    } catch (error) {
      // Fallback to client-side validation if API call fails
      return {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        verificationState,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
        checkUsername,
        validatePassword,
        verifyEmail,
        resendVerification,
        setVerificationState,
        forgotPassword,
        resetPassword,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 