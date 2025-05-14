import { useState, useEffect } from 'react';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';

interface TransactionFormProps {
  onClose: () => void;
}

export const TransactionForm = ({ onClose }: TransactionFormProps) => {
  const { addTransaction } = useTransactions();
  const { currentUser } = useAuth();
  
  const [borrowerUsername, setBorrowerUsername] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedEmi, setCalculatedEmi] = useState<number | null>(null);

  // Calculate EMI when amount, interest rate, and duration change
  useEffect(() => {
    const amountNum = parseFloat(amount);
    const interestNum = parseFloat(interestRate);
    const durationNum = parseFloat(duration);

    if (!isNaN(amountNum) && !isNaN(interestNum) && !isNaN(durationNum) && durationNum > 0) {
      // Monthly interest rate
      const monthlyRate = interestNum / 100 / 12;
      
      // EMI calculation formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const emi = 
        (amountNum * monthlyRate * Math.pow(1 + monthlyRate, durationNum)) / 
        (Math.pow(1 + monthlyRate, durationNum) - 1);
      
      setCalculatedEmi(emi);
    } else {
      setCalculatedEmi(null);
    }
  }, [amount, interestRate, duration]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!borrowerUsername) newErrors.borrowerUsername = 'Username is required';
    if (!borrowerName) newErrors.borrowerName = 'Name is required';
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentUser) return;
    
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + parseInt(duration));
    
    addTransaction({
      lenderId: currentUser.id,
      borrowerId: 'user_' + borrowerUsername, // This is a placeholder; in a real app we'd look up the user ID
      borrowerUsername,
      borrowerName,
      amount: parseFloat(amount),
      interestRate: parseFloat(interestRate),
      duration: parseInt(duration),
      startDate: today.toISOString(),
      endDate: endDate.toISOString(),
      initialAmount: parseFloat(amount),
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            New Transaction
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
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
                className={`input ${errors.borrowerUsername ? 'border-red-500' : ''}`}
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
                className={`input ${errors.borrowerName ? 'border-red-500' : ''}`}
                placeholder="Enter borrower's name"
              />
              {errors.borrowerName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.borrowerName}</p>
              )}
            </div>
            
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
                className={`input ${errors.amount ? 'border-red-500' : ''}`}
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
                className={`input ${errors.interestRate ? 'border-red-500' : ''}`}
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
                className={`input ${errors.duration ? 'border-red-500' : ''}`}
                placeholder="Enter duration in months"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.duration}</p>
              )}
            </div>
            
            {calculatedEmi && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Monthly EMI (Estimated)</h3>
                <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ${calculatedEmi.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total: ${(calculatedEmi * parseInt(duration)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 