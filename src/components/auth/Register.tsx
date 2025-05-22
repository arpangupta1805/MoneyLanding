import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import type { PasswordValidation } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterProps {
  onToggleForm: () => void;
  onVerifyEmail?: () => void;
}

type FormStep = 'account' | 'personal' | 'security';

export const Register = ({ onToggleForm, onVerifyEmail }: RegisterProps) => {
  const { register, checkUsername, validatePassword } = useAuth();
  const [currentStep, setCurrentStep] = useState<FormStep>('account');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [village, setVillage] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Validation states
  const [error, setError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Check username availability when username changes
  useEffect(() => {
    if (username.length > 2) {
      const checkAvailability = async () => {
        const available = await checkUsername(username);
        setUsernameAvailable(available);
      };
      checkAvailability();
    } else {
      setUsernameAvailable(null);
    }
  }, [username, checkUsername]);

  // Validate password as user types
  useEffect(() => {
    if (password) {
      const validatePass = async () => {
        const validation = await validatePassword(password);
        setPasswordValidation(validation);
      };
      validatePass();
    }
  }, [password, validatePassword]);

  const nextStep = () => {
    setError(null);
    
    if (currentStep === 'account') {
      if (!username || !email) {
        setError('Please fill all required fields');
        toast.error('Please fill all required fields');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }
      
      if (usernameAvailable === false) {
        setError('Username is already taken');
        toast.error('Username is already taken');
        return;
      }
      
      setCurrentStep('personal');
    } else if (currentStep === 'personal') {
      if (!fullName || !phoneNumber || !village) {
        setError('Please fill all required fields');
        toast.error('Please fill all required fields');
        return;
      }
      
      setCurrentStep('security');
    }
  };

  const prevStep = () => {
    setError(null);
    
    if (currentStep === 'personal') {
      setCurrentStep('account');
    } else if (currentStep === 'security') {
      setCurrentStep('personal');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please fill all required fields');
      toast.error('Please fill all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    // Check if all password validations pass
    const isStrongPassword = Object.values(passwordValidation).every(Boolean);
    if (!isStrongPassword) {
      setError('Password does not meet strength requirements');
      toast.error('Please use a stronger password');
      return;
    }

    try {
      const success = await register({
        username,
        fullName,
        email,
        fatherName,
        password,
        phoneNumber,
        village,
        address
      });

      if (success && onVerifyEmail) {
        // No need to call onVerifyEmail as the AuthContext will set verificationState
        // which will automatically trigger the verification page to show
        toast.success('Registration successful! Please verify your email.');
      }
    } catch (error) {
      setError('Registration failed. Username or email may already be taken.');
      toast.error('Registration failed. Please try again.');
    }
  };

  const getPasswordStrength = (): { text: string; color: string } => {
    const validCount = Object.values(passwordValidation).filter(Boolean).length;
    
    if (validCount === 0) return { text: 'Very Weak', color: 'text-red-600' };
    if (validCount <= 2) return { text: 'Weak', color: 'text-red-600' };
    if (validCount <= 4) return { text: 'Medium', color: 'text-yellow-500' };
    return { text: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength();

  const renderStepIndicator = () => {
    return (
      <div className="flex justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === 'account' 
                ? 'border-primary-600 bg-primary-100 text-primary-600' 
                : 'border-green-500 bg-green-100 text-green-500'
            }`}
          >
            {currentStep === 'account' ? '1' : '✓'}
          </div>
          <div className={`w-16 h-1 ${currentStep === 'account' ? 'bg-gray-300' : 'bg-green-500'}`}></div>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === 'personal' 
                ? 'border-primary-600 bg-primary-100 text-primary-600' 
                : currentStep === 'security' 
                  ? 'border-green-500 bg-green-100 text-green-500' 
                  : 'border-gray-300 bg-gray-100 text-gray-500'
            }`}
          >
            {currentStep === 'personal' ? '2' : currentStep === 'security' ? '✓' : '2'}
          </div>
          <div className={`w-16 h-1 ${currentStep === 'security' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === 'security' 
                ? 'border-primary-600 bg-primary-100 text-primary-600' 
                : 'border-gray-300 bg-gray-100 text-gray-500'
            }`}
          >
            3
          </div>
        </div>
      </div>
    );
  };

  const renderStepTitle = () => {
    switch (currentStep) {
      case 'account':
        return 'Account Information';
      case 'personal':
        return 'Personal Details';
      case 'security':
        return 'Security Setup';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white text-center">
        Create Account
      </h2>
      
      {renderStepIndicator()}
      
      <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200 text-center">
        {renderStepTitle()}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={currentStep === 'security' ? handleSubmit : (e) => e.preventDefault()}>
        <AnimatePresence mode="wait">
          {currentStep === 'account' && (
            <motion.div 
              key="account"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label 
                  htmlFor="username" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Username*
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`input ${
                    usernameAvailable === true ? 'border-green-500' : 
                    usernameAvailable === false ? 'border-red-500' : ''
                  }`}
                  placeholder="Choose a username"
                />
                {username.length > 2 && (
                  <p className={`mt-1 text-xs ${
                    usernameAvailable ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {usernameAvailable ? 'Username is available' : 'Username is already taken'}
                  </p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email*
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email"
                />
              </div>
            </motion.div>
          )}
          
          {currentStep === 'personal' && (
            <motion.div 
              key="personal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label 
                  htmlFor="fullName" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Full Name*
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label 
                  htmlFor="fatherName" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Father's Name (Optional)
                </label>
                <input
                  id="fatherName"
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="input"
                  placeholder="Enter your father's name"
                />
              </div>

              <div>
                <label 
                  htmlFor="phoneNumber" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone Number*
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label 
                  htmlFor="village" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Village Name*
                </label>
                <input
                  id="village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="input"
                  placeholder="Enter your village name"
                />
              </div>

              <div>
                <label 
                  htmlFor="address" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address (Optional)
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  placeholder="Enter your address"
                />
              </div>
            </motion.div>
          )}
          
          {currentStep === 'security' && (
            <motion.div 
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Password*
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Create a password"
                />
                {password && (
                  <div className="mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs">Password Strength:</span>
                      <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1 mt-1">
                      <li className={passwordValidation.minLength ? 'text-green-600' : 'text-red-600'}>
                        ✓ At least 8 characters
                      </li>
                      <li className={passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}>
                        ✓ At least one uppercase letter
                      </li>
                      <li className={passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}>
                        ✓ At least one lowercase letter
                      </li>
                      <li className={passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}>
                        ✓ At least one number
                      </li>
                      <li className={passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-red-600'}>
                        ✓ At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Confirm Password*
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="Confirm your password"
                />
                {password && confirmPassword && (
                  <p className={`mt-1 text-xs ${
                    password === confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-between mt-6">
          {currentStep !== 'account' ? (
            <button 
              type="button" 
              onClick={prevStep}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Previous
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggleForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Back to Login
            </button>
          )}
          
          {currentStep !== 'security' ? (
            <button 
              type="button" 
              onClick={nextStep}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Next
            </button>
          ) : (
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Sign Up
            </button>
          )}
        </div>
      </form>
    </div>
  );
}; 