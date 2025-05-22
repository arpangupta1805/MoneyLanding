import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface ResetPasswordProps {
  userId: string;
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

export const ResetPassword = ({ userId, email, onBack, onSuccess }: ResetPasswordProps) => {
  const { resetPassword, validatePassword, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(true);

  // Set a timeout to simulate OTP sending process
  useEffect(() => {
    const timer = setTimeout(() => {
      setOtpSending(false);
    }, 2000); // Show loading state for 2 seconds
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!otp) {
      setError('Please enter the verification code.');
      return;
    }
    
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const success = await resetPassword(userId, otp, password);
      
      if (success) {
        onSuccess();
      } else {
        setError('Failed to reset password. Please check your code and try again.');
        setSubmitting(false);
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      setSubmitting(false);
    }
  };

  // Show loading state while OTP is being sent
  if (otpSending) {
    return (
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
          Sending Reset Code
        </h2>
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Sending password reset code to <strong>{email}</strong>
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
        Reset Password
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-center text-blue-800 dark:text-blue-200">
          <strong>Password Reset</strong>
        </p>
        <p className="text-center text-blue-600 dark:text-blue-300 text-sm mt-1">
          We've sent a reset code to <strong>{email}</strong>
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
        <div className="mb-4">
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
            disabled={submitting || isLoading}
          />
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Create a new password"
            disabled={submitting || isLoading}
          />
          {password && (
            <PasswordStrengthIndicator password={password} />
          )}
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="confirmPassword" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="Confirm your password"
            disabled={submitting || isLoading}
          />
          {password && confirmPassword && (
            <p className={`mt-1 text-xs ${
              password === confirmPassword ? 'text-green-600' : 'text-red-600'
            }`}>
              {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
            </p>
          )}
        </div>
        
        <button 
          type="submit" 
          className="w-full btn-primary mb-4"
          disabled={submitting || isLoading}
        >
          {submitting || isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            disabled={submitting || isLoading}
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

// Password strength indicator component
interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const [validations, setValidations] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  
  useEffect(() => {
    const validate = async () => {
      // Client-side validation as fallback
      const newValidations = {
        minLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      };
      
      setValidations(newValidations);
    };
    
    validate();
  }, [password]);
  
  const getStrength = () => {
    const validCount = Object.values(validations).filter(Boolean).length;
    
    if (validCount === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (validCount <= 2) return { text: 'Weak', color: 'text-red-600' };
    if (validCount <= 4) return { text: 'Medium', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-600' };
  };
  
  const strength = getStrength();
  
  return (
    <div className="mt-2">
      <div className="flex justify-between mb-1">
        <span className="text-xs">Password Strength:</span>
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.text}
        </span>
      </div>
      <ul className="text-xs space-y-1 mt-1">
        <li className={validations.minLength ? 'text-green-600' : 'text-red-600'}>
          ✓ At least 8 characters
        </li>
        <li className={validations.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
          ✓ At least one uppercase letter
        </li>
        <li className={validations.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
          ✓ At least one lowercase letter
        </li>
        <li className={validations.hasNumber ? 'text-green-600' : 'text-red-600'}>
          ✓ At least one number
        </li>
        <li className={validations.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
          ✓ At least one special character
        </li>
      </ul>
    </div>
  );
}; 