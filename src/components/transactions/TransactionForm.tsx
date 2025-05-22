import { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { transactionAPI } from '../../services/api';

export const TransactionForm = () => {
  const navigate = useNavigate();
  const { addTransaction, getBorrowerProfileByPhone, saveBorrowerProfile } = useTransactions();
  const { currentUser } = useAuth();
  
  const [borrowerUsername, setBorrowerUsername] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerFatherName, setBorrowerFatherName] = useState('');
  const [address, setAddress] = useState('');
  const [village, setVillage] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10)); // Format: YYYY-MM-DD
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedEmi, setCalculatedEmi] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [totalInterest, setTotalInterest] = useState<number | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Calculate EMI when amount, interest rate, and duration change
  useEffect(() => {
    const amountNum = parseFloat(amount);
    const interestNum = parseFloat(interestRate);
    const durationNum = parseFloat(duration);

    if (!isNaN(amountNum) && !isNaN(interestNum) && !isNaN(durationNum) && durationNum > 0) {
      // Convert duration from months to years for interest calculation
      const durationYears = durationNum / 12;
      
      // Calculate interest using simple interest formula: P * R * T
      const totalInterestAmount = amountNum * (interestNum / 100) * durationYears;
      const totalPayable = amountNum + totalInterestAmount;
      
      // Monthly EMI = Total amount / number of months
      const emi = totalPayable / durationNum;
      
      setCalculatedEmi(emi);
      setTotalAmount(totalPayable);
      setTotalInterest(totalInterestAmount);
    } else {
      setCalculatedEmi(null);
      setTotalAmount(null);
      setTotalInterest(null);
    }
  }, [amount, interestRate, duration]);

  // Function to handle phone number change and autofill if profile exists
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phoneValue = e.target.value.trim();
    setPhone(phoneValue);

    if (phoneValue.length === 10) {
      // Start searching - show loader
      setIsSearchingUser(true);
      
      try {
        // Step 1: Try to find existing borrower profile in local storage first
        const profile = getBorrowerProfileByPhone(phoneValue);
        
        if (profile) {
          // Local profile found - use it to autofill
          setBorrowerUsername(profile.borrowerUsername || '');
          setBorrowerName(profile.borrowerName || '');
          setBorrowerFatherName(profile.borrowerFatherName || '');
          setAddress(profile.address || '');
          setVillage(profile.village || '');
          
          // Show success toast
          toast.success('Found existing borrower! Form has been pre-filled.', {
            position: "bottom-right",
            autoClose: 3000
          });
          
          setIsSearchingUser(false);
          return;
        }
        
        // Step 2: If not found locally, try to find from user database
        const response = await transactionAPI.checkPhoneNumber(phoneValue);
        
        if (response.success && response.exists) {
          // User found in database - use it to autofill
          const userData = response.user;
          
          setBorrowerUsername(userData.username || '');
          setBorrowerName(userData.fullName || '');
          setBorrowerFatherName(userData.fatherName || '');
          setAddress(userData.address || '');
          setVillage(userData.village || '');
          
          // Also save this user to local borrower profiles for future use
          saveBorrowerProfile({
            phone: phoneValue,
            borrowerName: userData.fullName,
            borrowerFatherName: userData.fatherName || '',
            borrowerUsername: userData.username,
            address: userData.address || '',
            village: userData.village
          });
          
          // Show success toast
          toast.info('Found user in database! Form has been pre-filled.', {
            position: "bottom-right",
            autoClose: 3000
          });
        } else {
          // No user found with this phone number
          toast.info('No existing user found with this phone number.', {
            position: "bottom-right",
            autoClose: 3000
          });
        }
      } catch (error) {
        console.error('Error looking up user:', error);
        toast.error('Error searching for user. Please try again.', {
          position: "bottom-right",
          autoClose: 3000
        });
      } finally {
        // End searching - hide loader
        setIsSearchingUser(false);
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!borrowerUsername) newErrors.borrowerUsername = 'Username is required';
    if (!borrowerName) newErrors.borrowerName = 'Name is required';
    if (!borrowerFatherName) newErrors.borrowerFatherName = 'Father\'s name is required';
    
    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!interestRate) {
      newErrors.interestRate = 'Interest rate is required';
    } else if (isNaN(parseFloat(interestRate)) || parseFloat(interestRate) < 0) {
      newErrors.interestRate = 'Interest rate must be a non-negative number';
    }
    
    if (!duration) {
      newErrors.duration = 'Duration is required';
    } else if (isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      newErrors.duration = 'Duration must be a positive integer';
    }

    if (!address) {
      newErrors.address = 'Address is required';
    }

    if (!village) {
      newErrors.village = 'Village is required';
    }

    if (!phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phone.match(/^\d{10}$/)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) return;
    
    // Parse start date and calculate end date based on duration
    const parsedStartDate = new Date(startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(parsedStartDate.getMonth() + parseInt(duration));
    
    addTransaction({
      lenderId: currentUser.id,
      borrowerId: 'user_' + borrowerUsername, // This is a placeholder; in a real app we'd look up the user ID
      borrowerUsername,
      borrowerName,
      borrowerFatherName,
      address,
      village,
      phone,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      duration: parseInt(duration),
      startDate: parsedStartDate.toISOString(),
      endDate: endDate.toISOString(),
      initialAmount: parseFloat(amount),
      monthlyEmi: calculatedEmi || 0,
      totalPayable: totalAmount || 0,
      totalInterest: totalInterest || 0,
    });
    
    navigate('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Transaction</h1>
        <div className="w-24"></div> {/* Spacer for alignment */}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Borrower Information</h2>
              
              <div>
                <label 
                  htmlFor="borrowerUsername" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Borrower Username
                </label>
                <input
                  id="borrowerUsername"
                  type="text"
                  value={borrowerUsername}
                  onChange={(e) => setBorrowerUsername(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.borrowerUsername ? 'border-red-500' : ''}`}
                  placeholder="Enter borrower's username"
                />
                {errors.borrowerUsername && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.borrowerUsername}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="borrowerName" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Borrower Name
                </label>
                <input
                  id="borrowerName"
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.borrowerName ? 'border-red-500' : ''}`}
                  placeholder="Enter borrower's name"
                />
                {errors.borrowerName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.borrowerName}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="borrowerFatherName" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Borrower Father's Name
                </label>
                <input
                  id="borrowerFatherName"
                  type="text"
                  value={borrowerFatherName}
                  onChange={(e) => setBorrowerFatherName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.borrowerFatherName ? 'border-red-500' : ''}`}
                  placeholder="Enter borrower's father's name"
                />
                {errors.borrowerFatherName && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.borrowerFatherName}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="address" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Enter borrower's address"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="village" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Village Name
                </label>
                <input
                  id="village"
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.village ? 'border-red-500' : ''}`}
                  placeholder="Enter borrower's Village Name"
                />
                {errors.village && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.village}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="phone" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    id="phone"
                    type="text"
                    value={phone}
                    onChange={handlePhoneChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="Enter borrower's Phone Number"
                  />
                  {isSearchingUser && (
                    <div className="absolute right-2 top-2 flex items-center">
                      <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent mr-2"></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Searching...</span>
                    </div>
                  )}
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Details</h2>
              
              <div>
                <label 
                  htmlFor="amount" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Amount
                </label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="interestRate" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Interest Rate (% per annum)
                </label>
                <input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.interestRate ? 'border-red-500' : ''}`}
                  placeholder="Enter interest rate"
                />
                {errors.interestRate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.interestRate}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="duration" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Duration (months)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.duration ? 'border-red-500' : ''}`}
                  placeholder="Enter duration in months"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
                )}
              </div>
              
              <div>
                <label 
                  htmlFor="startDate" 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${errors.startDate ? 'border-red-500' : ''}`}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.startDate}</p>
                )}
              </div>
              
              {calculatedEmi && totalAmount && totalInterest && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Loan Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Principal Amount:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(parseFloat(amount))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Monthly EMI:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(calculatedEmi)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(totalInterest)}</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Total Payable:</span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
            >
              Create Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 