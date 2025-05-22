import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface EmailChangeVerificationProps {
  onClose: () => void;
}

export const EmailChangeVerification = ({ onClose }: EmailChangeVerificationProps) => {
  const { verificationState, verifyEmailChange, setVerificationState, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  
  // Focus on OTP input when component mounts
  useEffect(() => {
    const otpInput = document.getElementById('email-change-otp');
    if (otpInput) {
      otpInput.focus();
    }
  }, []);

  // Check if we have valid verification state for email change
  if (!verificationState || verificationState.verifyType !== 'email-change' || !verificationState.newEmail) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
            Verification Error
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            No email change verification in progress. Please try again.
          </p>
          <button
            onClick={onClose}
            className="w-full btn-primary"
          >
            Close
          </button>
        </div>
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
      const success = await verifyEmailChange(otp);

      if (success) {
        toast.success('Email changed successfully!');
        onClose();
      } else {
        setError('Invalid or expired verification code');
      }
    } catch (err) {
      console.error('Error during verification:', err);
      setError('An error occurred during verification');
    }
  };

  const handleCancel = () => {
    // Clear verification state
    setVerificationState(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
          Verify Email Change
        </h2>
        
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-center text-blue-800 dark:text-blue-200">
            <strong>Email Change Verification</strong>
          </p>
          <p className="text-center text-blue-600 dark:text-blue-300 text-sm mt-1">
            We've sent a verification code to <strong>{verificationState.newEmail}</strong>
          </p>
          <p className="text-center text-blue-600 dark:text-blue-300 text-xs mt-1">
            Please check your inbox and enter the 6-digit code below to confirm your new email
          </p>
          <div className="mt-3 flex justify-center">
            <div className="px-3 py-1 bg-blue-100 dark:bg-blue-800 rounded-full text-xs">
              <span className="mr-1">ℹ️</span>
              <span className="text-blue-700 dark:text-blue-200">Your email will remain <strong>{verificationState.email}</strong> until verified</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label 
              htmlFor="email-change-otp" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Verification Code
            </label>
            <input
              id="email-change-otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-center text-xl tracking-widest"
              placeholder="Enter 6-digit code"
              maxLength={6}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={handleCancel}
              className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="flex-1 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 shadow-sm"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 