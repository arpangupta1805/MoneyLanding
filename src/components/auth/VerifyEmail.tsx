import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface VerifyEmailProps {
  onBack: () => void;
}

export const VerifyEmail = ({ onBack }: VerifyEmailProps) => {
  const { verificationState, verifyEmail, resendVerification, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showMockInfo, setShowMockInfo] = useState(false);
  const [otpSending, setOtpSending] = useState(true);
  
  // Focus on OTP input when component mounts
  useEffect(() => {
    const otpInput = document.getElementById('otp');
    if (otpInput) {
      otpInput.focus();
    }
    
    // Set a timeout to simulate OTP sending process
    const timer = setTimeout(() => {
      setOtpSending(false);
    }, 2000); // Show loading state for 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  if (!verificationState) {
    return (
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
          Verification Error
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          No verification in progress. Please go back and try again.
        </p>
        <button
          onClick={onBack}
          className="w-full btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otp) {
      setError('Please enter the verification code');
      toast.error('Please enter the verification code');
      return;
    }

    try {
      const success = await verifyEmail(verificationState.userId, otp);

      if (!success) {
        setError('Invalid or expired verification code');
      }
    } catch (err) {
      console.error('Error during verification:', err);
      setError('An error occurred during verification');
    }
  };

  const handleResend = async () => {
    setOtpSending(true);
    try {
      await resendVerification(verificationState.userId);
      toast.info(`Verification code sent to ${verificationState.email}`);
      setTimeout(() => setOtpSending(false), 2000);
    } catch (err) {
      console.error('Error resending verification:', err);
      toast.error('Failed to resend verification code');
      setOtpSending(false);
    }
  };

  // Show loading state while OTP is being sent
  if (otpSending) {
    return (
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
          Sending Verification Code
        </h2>
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Sending verification code to <strong>{verificationState.email}</strong>
          </p>
          <p className="text-center text-gray-500 dark:text-gray-500 text-sm mt-2">
            This will only take a moment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Verify Your Email
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-center text-blue-800 dark:text-blue-200">
          <strong>Email Verification</strong>
        </p>
        <p className="text-center text-blue-600 dark:text-blue-300 text-sm mt-1">
          We've sent a verification code to <strong>{verificationState.email}</strong>
        </p>
        <p className="text-center text-blue-600 dark:text-blue-300 text-xs mt-1">
          Please check your inbox and enter the 6-digit code below
        </p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label 
            htmlFor="otp" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Verification Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="input text-center text-xl tracking-widest"
            placeholder="Enter 6-digit code"
            maxLength={6}
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full btn-primary mb-4"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
        
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            disabled={isLoading}
          >
            Back to Login
          </button>
          
          <button
            type="button"
            onClick={handleResend}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            disabled={isLoading}
          >
            Resend Code
          </button>
        </div>
      </form>
    </div>
  );
}; 