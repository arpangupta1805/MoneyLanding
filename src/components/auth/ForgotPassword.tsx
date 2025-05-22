import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface ForgotPasswordProps {
  onBack: () => void;
  onResetPassword: (userId: string, email: string) => void;
}

export const ForgotPassword = ({ onBack, onResetPassword }: ForgotPasswordProps) => {
  const { forgotPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!email) {
      setError('Please enter your email address');
      toast.error('Please enter your email address');
      setSubmitting(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      toast.error('Please enter a valid email address');
      setSubmitting(false);
      return;
    }

    try {
      const success = await forgotPassword(email);
      
      if (success && success.userId) {
        // Success! Pass the userId and email to the reset password form
        onResetPassword(success.userId, email);
      } else {
        setError('Failed to send reset code. Please try again.');
        setSubmitting(false);
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Forgot Password
      </h2>
      
      <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
        Enter your email address and we'll send you a code to reset your password.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="Enter your email address"
            disabled={submitting || isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full btn-primary mb-4"
          disabled={submitting || isLoading}
        >
          {submitting || isLoading ? 'Sending...' : 'Send Reset Code'}
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