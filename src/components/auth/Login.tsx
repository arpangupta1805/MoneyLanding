import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

interface LoginProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
}

export const Login = ({ onToggleForm, onForgotPassword }: LoginProps) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Debug function to check if users exist in localStorage
  const checkUsers = () => {
    const users = localStorage.getItem('users');
    if (users) {
      const parsedUsers = JSON.parse(users);
      console.log('Users in localStorage:', parsedUsers);
      return parsedUsers.length > 0;
    }
    return false;
  };
  
  useEffect(() => {
    // Check if users exist in localStorage on component mount
    const hasUsers = checkUsers();
    if (!hasUsers) {
      console.warn('No users found in localStorage');
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!username || !password) {
      setError('Please fill all required fields');
      toast.error('Please fill all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Attempting login with:', { username });
      const success = login(username, password);

      if (!success) {
        console.error('Login failed for username:', username);
        setError('Invalid username or password');
        
        // Debug: Check if the user exists
        const users = localStorage.getItem('users');
        if (users) {
          const parsedUsers = JSON.parse(users);
          const userExists = parsedUsers.some((u: any) => u.username === username);
          console.log('User exists in localStorage:', userExists);
          
          if (!userExists) {
            setError('Username not found. Please register first.');
          }
        } else {
          console.error('No users found in localStorage');
          setError('No users found. Please register first.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Log In
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label 
            htmlFor="username" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            placeholder="Enter your username"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-6">
          <label 
            htmlFor="password" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Enter your password"
            disabled={isSubmitting}
          />
          <div className="mt-1 text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Forgot Password?
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full btn-primary mb-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
        
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleForm}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  );
}; 