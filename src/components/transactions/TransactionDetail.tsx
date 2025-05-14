import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import type { PaymentEntry, Transaction as TransactionType } from '../../types/index';

export const TransactionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    getTransactionById, 
    getPaymentsByTransactionId, 
    addPayment,
    addAdditionalBorrowing,
    updateTransactionStatus
  } = useTransactions();

  const transaction = getTransactionById(id as string);
  const payments = getPaymentsByTransactionId(id as string);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBorrowingForm, setShowBorrowingForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline'>('details');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!transaction || !currentUser) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Transaction not found
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="btn-primary"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isLender = transaction.lenderId === currentUser.id;
  const isBorrower = transaction.borrowerId === currentUser.id;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!paymentAmount) {
      newErrors.paymentAmount = 'Payment amount is required';
    } else if (isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
      newErrors.paymentAmount = 'Payment amount must be a positive number';
    } else if (parseFloat(paymentAmount) > transaction.remainingBalance) {
      newErrors.paymentAmount = `Payment cannot exceed the remaining balance of ${formatCurrency(transaction.remainingBalance)}`;
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    addPayment({
      transactionId: transaction.id,
      amount: parseFloat(paymentAmount),
      date: new Date().toISOString(),
      type: 'payment',
      notes: notes || undefined,
    });
    
    setPaymentAmount('');
    setNotes('');
    setShowPaymentForm(false);
  };

  const handleAdditionalBorrowing = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!additionalAmount) {
      newErrors.additionalAmount = 'Amount is required';
    } else if (isNaN(parseFloat(additionalAmount)) || parseFloat(additionalAmount) <= 0) {
      newErrors.additionalAmount = 'Amount must be a positive number';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    addAdditionalBorrowing(
      transaction.id,
      parseFloat(additionalAmount),
      notes || undefined
    );
    
    setAdditionalAmount('');
    setNotes('');
    setShowBorrowingForm(false);
  };
  
  const getStatusClass = (status: TransactionType['status']) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPaymentClass = (type: PaymentEntry['type']) => {
    return type === 'payment' 
      ? 'bg-green-50 border-green-500 dark:bg-green-900/20' 
      : 'bg-red-50 border-red-500 dark:bg-red-900/20';
  };

  const handleStatusUpdate = (status: TransactionType['status']) => {
    updateTransactionStatus(transaction.id, status);
  };

  const calculateProgress = () => {
    if (transaction.initialAmount === 0) return 0;
    const paid = transaction.initialAmount - transaction.remainingBalance;
    return Math.min(100, Math.round((paid / transaction.initialAmount) * 100));
  };

  // Sort payments by date, most recent first
  const sortedPayments = [...payments].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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
        
        <div className="flex space-x-2">
          {isLender && transaction.status !== 'completed' && (
            <button
              onClick={() => setShowPaymentForm(true)}
              className="btn-success"
            >
              Record Payment
            </button>
          )}
          
          {isLender && transaction.status !== 'completed' && (
            <button
              onClick={() => setShowBorrowingForm(true)}
              className="btn-warning"
            >
              Additional Lending
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLender ? 'Money Lent to' : 'Money Borrowed from'} {isLender ? transaction.borrowerName : transaction.lenderId}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Transaction ID: {transaction.id}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-end">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                  {formatCurrency(transaction.amount)}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusClass(transaction.status)}`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).replace('_', ' ')}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {formatCurrency(transaction.remainingBalance)} remaining
              </p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Repayment Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'details'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'timeline'
                  ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Initial Amount</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.initialAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Amount</span>
                      <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Interest Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">{transaction.interestRate}% per annum</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration</span>
                      <span className="font-medium text-gray-900 dark:text-white">{transaction.duration} months</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(transaction.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">End Date</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(transaction.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status</span>
                      <div>
                        {isLender && transaction.status !== 'completed' && (
                          <select
                            value={transaction.status}
                            onChange={(e) => handleStatusUpdate(e.target.value as TransactionType['status'])}
                            className="ml-2 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                          >
                            <option value="active">Active</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        )}
                        {(!isLender || transaction.status === 'completed') && (
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow border-l-4 border-primary-500">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</h4>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(transaction.amount)}</p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow border-l-4 border-green-500">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount Paid</h4>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {formatCurrency(transaction.amount - transaction.remainingBalance)}
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-750 p-4 rounded-lg shadow border-l-4 border-red-500">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Remaining</h4>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {formatCurrency(transaction.remainingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
              
              {sortedPayments.length > 0 ? (
                <div className="space-y-4">
                  {sortedPayments.map((payment) => (
                    <div 
                      key={payment.id} 
                      className={`border-l-4 p-4 rounded-md ${getPaymentClass(payment.type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {payment.type === 'payment' ? 'Payment Received' : 'Additional Amount Lent'}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(payment.date).toLocaleString()}
                          </p>
                          {payment.notes && (
                            <p className="mt-2 text-gray-600 dark:text-gray-300">{payment.notes}</p>
                          )}
                        </div>
                        <div className={`font-bold ${payment.type === 'payment' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {payment.type === 'payment' ? '-' : '+'}{formatCurrency(payment.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No payment history yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Record Payment</h3>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit}>
              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="paymentAmount" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Payment Amount
                  </label>
                  <input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={transaction.remainingBalance}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className={`mt-1 input ${errors.paymentAmount ? 'border-red-500' : ''}`}
                    placeholder={`Amount (max: ${formatCurrency(transaction.remainingBalance)})`}
                  />
                  {errors.paymentAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentAmount}</p>
                  )}
                </div>
                
                <div>
                  <label 
                    htmlFor="notes" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 input"
                    rows={3}
                    placeholder="Add any notes about this payment"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-success"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Additional Borrowing Form Modal */}
      {showBorrowingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Additional Lending</h3>
              <button
                onClick={() => setShowBorrowingForm(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAdditionalBorrowing}>
              <div className="space-y-4">
                <div>
                  <label 
                    htmlFor="additionalAmount" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Additional Amount
                  </label>
                  <input
                    id="additionalAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalAmount}
                    onChange={(e) => setAdditionalAmount(e.target.value)}
                    className={`mt-1 input ${errors.additionalAmount ? 'border-red-500' : ''}`}
                    placeholder="Enter additional amount"
                  />
                  {errors.additionalAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.additionalAmount}</p>
                  )}
                </div>
                
                <div>
                  <label 
                    htmlFor="notes" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Notes (optional)
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1 input"
                    rows={3}
                    placeholder="Add any notes about this additional lending"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBorrowingForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-warning"
                >
                  Add Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 