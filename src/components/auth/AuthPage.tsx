import { useState, useEffect } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { VerifyEmail } from './VerifyEmail';
import { ResetPassword } from './ResetPassword';
import { useAuth } from '../../context/AuthContext';

// Define the auth views
type AuthView = 'login' | 'register' | 'forgotPassword' | 'resetPassword' | 'verifyEmail';

interface ResetPasswordState {
  userId: string;
  email: string;
}

export const AuthPage = () => {
  const { verificationState } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const [resetPasswordState, setResetPasswordState] = useState<ResetPasswordState | null>(null);

  const handleToggleForm = () => {
    setCurrentView(currentView === 'login' ? 'register' : 'login');
  };

  const handleForgotPassword = () => {
    setCurrentView('forgotPassword');
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    setResetPasswordState(null);
  };

  const handleResetPassword = (userId: string, email: string) => {
    setResetPasswordState({ userId, email });
    setCurrentView('resetPassword');
  };
  
  const handleVerifyEmail = () => {
    setCurrentView('verifyEmail');
  };

  const renderAuthComponent = () => {
    switch (currentView) {
      case 'login':
        return <Login onToggleForm={handleToggleForm} onForgotPassword={handleForgotPassword} />;
      case 'register':
        return <Register onToggleForm={handleToggleForm} onVerifyEmail={handleVerifyEmail} />;
      case 'forgotPassword':
        return <ForgotPassword onBack={handleBackToLogin} onResetPassword={handleResetPassword} />;
      case 'resetPassword':
        if (resetPasswordState) {
          return (
            <ResetPassword 
              userId={resetPasswordState.userId} 
              email={resetPasswordState.email}
              onBack={handleBackToLogin} 
              onSuccess={handleBackToLogin} 
            />
          );
        } else {
          // Fallback if we somehow got here without proper state
          return (
            <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
                Reset Password Error
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                There was an error starting the password reset process. Please try again.
              </p>
              <button
                onClick={handleBackToLogin}
                className="w-full btn-primary"
              >
                Back to Login
              </button>
            </div>
          );
        }
      case 'verifyEmail':
        return <VerifyEmail onBack={handleBackToLogin} />;
      default:
        return <Login onToggleForm={handleToggleForm} onForgotPassword={handleForgotPassword} />;
    }
  };

  // Automatically show verification page if verification state exists
  // This ensures that after registration, the user is redirected to verification
  useEffect(() => {
    if (verificationState && currentView !== 'verifyEmail') {
      setCurrentView('verifyEmail');
    }
  }, [verificationState, currentView]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Money Lending App
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your loans and borrowings effortlessly
          </p>
        </div>
        
        <div className="transition-all duration-300 ease-in-out">
          {renderAuthComponent()}
        </div>
      </div>
    </div>
  );
}; 