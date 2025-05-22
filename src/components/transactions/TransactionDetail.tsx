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
    updateTransactionStatus,
    calculateEarlyPayoff,
    completeTransaction
  } = useTransactions();

  const transaction = getTransactionById(id as string);
  const payments = getPaymentsByTransactionId(id as string);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [additionalAmount, setAdditionalAmount] = useState('');
  const [additionalInterestRate, setAdditionalInterestRate] = useState('');
  const [notes, setNotes] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBorrowingForm, setShowBorrowingForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'summary'>('details');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [earlyPayoffData, setEarlyPayoffData] = useState<{
    remainingBalance: number;
    totalInterest: number;
    savedInterest: number;
  } | null>(null);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
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

    if (additionalInterestRate && (isNaN(parseFloat(additionalInterestRate)) || parseFloat(additionalInterestRate) < 0)) {
      newErrors.additionalInterestRate = 'Interest rate must be a non-negative number';
    }
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    const interestRate = additionalInterestRate 
      ? parseFloat(additionalInterestRate) 
      : transaction.interestRate;
      
    addAdditionalBorrowing(
      transaction.id,
      parseFloat(additionalAmount),
      notes || undefined,
      interestRate
    );
    
    setAdditionalAmount('');
    setAdditionalInterestRate('');
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
          {isLender && (
            <>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="btn-success"
                disabled={transaction.status === 'completed'}
                title={transaction.status === 'completed' ? "Loan is already completed" : "Record a payment"}
              >
                Record Payment
              </button>
              
              <button
                onClick={() => setShowBorrowingForm(true)}
                className="btn-warning"
                disabled={transaction.status === 'completed'}
                title={transaction.status === 'completed' ? "Loan is already completed" : "Add additional borrowing"}
              >
                Add Borrowing
              </button>
              
              <button
                onClick={() => setShowCompleteForm(true)}
                className="btn-primary"
                disabled={transaction.status === 'completed'}
                title={transaction.status === 'completed' ? "Loan is already completed" : "Close loan early"}
              >
                Close Early
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Loan to {transaction.borrowerName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {transaction.borrowerUsername}
              </p>
              {transaction.borrowerFatherName && (
                <p className="text-gray-600 dark:text-gray-400">
                  Father's Name: {transaction.borrowerFatherName}
                </p>
              )}
            </div>
            
            <div className="flex flex-col items-end">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(transaction.status)}`}>
                {transaction.status === 'active' && 'Active'}
                {transaction.status === 'partially_paid' && 'Partially Paid'}
                {transaction.status === 'completed' && 'Completed'}
                {transaction.status === 'overdue' && 'Overdue'}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ID: {transaction.id.substring(0, 8)}
              </span>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button 
              className={`py-2 px-4 font-medium ${activeTab === 'details' ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`py-2 px-4 font-medium ${activeTab === 'timeline' ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button 
              className={`py-2 px-4 font-medium ${activeTab === 'summary' ? 'text-primary-600 border-b-2 border-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              onClick={() => setActiveTab('summary')}
            >
              Summary
            </button>
          </div>
          
          {/* Tab content */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Borrower Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.borrowerName}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.borrowerUsername}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.borrowerFatherName || 'Not provided'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.address}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Village</p>
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.village}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone Number</p>
                  <p className="font-medium text-gray-900 dark:text-white">{transaction.phone}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Principal Amount</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.initialAmount)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.remainingBalance)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Interest Rate</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.interestRate}% per annum</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.duration} months</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(transaction.startDate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">End Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(transaction.endDate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Monthly EMI</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.monthlyEmi)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Interest</p>
                    <p className="font-medium text-green-600 dark:text-green-400">{formatCurrency(transaction.totalInterest)}</p>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Payable</p>
                    <p className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(transaction.totalPayable)}</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Payment Progress</p>
                  <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-primary-600 dark:bg-primary-500"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {calculateProgress()}% paid
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'timeline' && (
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
          
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Loan Summary</h3>
              
              <div className="bg-gray-700 p-4 rounded-lg space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Principal Amount:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.initialAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{transaction.interestRate}% per annum</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Loan Duration:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{transaction.duration} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly EMI:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.monthlyEmi)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Interest:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(transaction.totalInterest)}</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Total Payable:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(transaction.totalPayable)}</span>
                  </div>
                </div>
              </div>
              
              {/* Additional Borrowing Summary if any */}
              {payments.some(p => p.type === 'additional_borrowing') && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg space-y-4 border-l-4 border-yellow-500">
                  <h4 className="text-md font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Additional Lending Details</h4>
                  
                  {payments
                    .filter(p => p.type === 'additional_borrowing')
                    .map((payment, index) => {
                      // Calculate months until end date for additional borrowings
                      const paymentDate = new Date(payment.date);
                      const endDate = new Date(transaction.endDate);
                      const monthsUntilEnd = Math.max(0, Math.ceil(
                        (endDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                      ));
                      const yearFraction = monthsUntilEnd / 12;
                      const interestRate = payment.interestRate || transaction.interestRate;
                      const interestAmount = payment.amount * (interestRate / 100) * yearFraction;
                      const totalPayable = payment.amount + interestAmount;
                      
                      return (
                        <div key={payment.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Additional Amount {index + 1}:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Interest Rate:</span>
                            <span className={`font-medium ${payment.interestRate !== transaction.interestRate && payment.interestRate ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                              {interestRate}% per annum {payment.interestRate !== transaction.interestRate && payment.interestRate ? '(Different from original)' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Time Period:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {monthsUntilEnd} months
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Interest Amount:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(interestAmount)}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Total Payable:</span>
                            <span className="font-bold text-primary-600 dark:text-primary-400">
                              {formatCurrency(totalPayable)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Date:</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {new Date(payment.date).toLocaleDateString()}
                            </span>
                          </div>
                          {payment.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-t pt-1">{payment.notes}</p>
                          )}
                        </div>
                      );
                    })
                  }
                  
                  {/* Calculate combined total values correctly */}
                  <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800 mt-2">
                    <div className="flex justify-between">
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium">Total Additional Principal:</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'additional_borrowing')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium">Total Additional Interest:</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'additional_borrowing')
                            .reduce((sum, p) => {
                              const paymentDate = new Date(p.date);
                              const endDate = new Date(transaction.endDate);
                              const monthsUntilEnd = Math.max(0, Math.ceil(
                                (endDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                              ));
                              const yearFraction = monthsUntilEnd / 12;
                              const interestRate = p.interestRate || transaction.interestRate;
                              const interestAmount = p.amount * (interestRate / 100) * yearFraction;
                              return sum + interestAmount;
                            }, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-yellow-700 dark:text-yellow-300 font-medium">Total Additional Payable:</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'additional_borrowing')
                            .reduce((sum, p) => {
                              const paymentDate = new Date(p.date);
                              const endDate = new Date(transaction.endDate);
                              const monthsUntilEnd = Math.max(0, Math.ceil(
                                (endDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                              ));
                              const yearFraction = monthsUntilEnd / 12;
                              const interestRate = p.interestRate || transaction.interestRate;
                              const interestAmount = p.amount * (interestRate / 100) * yearFraction;
                              return sum + p.amount + interestAmount;
                            }, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-750 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Payment Progress</h4>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Paid So Far:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(transaction.totalPayable - transaction.remainingBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Balance:</span>
                    <span className={`font-medium ${transaction.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {transaction.status === 'completed' 
                        ? 'Fully Paid (₹0.00)' 
                        : formatCurrency(transaction.remainingBalance)
                      }
                    </span>
                  </div>
                  
                  {/* Time calculations based on original loan terms */}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original Loan Duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {transaction.duration} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Elapsed Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.floor((new Date().getTime() - new Date(transaction.startDate).getTime()) / 
                        (1000 * 60 * 60 * 24 * 30))} months
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Remaining Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(() => {
                        const elapsedMonths = Math.floor(
                          (new Date().getTime() - new Date(transaction.startDate).getTime()) / 
                          (1000 * 60 * 60 * 24 * 30)
                        );
                        return Math.max(0, transaction.duration - elapsedMonths);
                      })()} months
                    </span>
                  </div>
                  
                  {/* Repayment Percentage */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Repayment Progress</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {Math.round((transaction.totalPayable - transaction.remainingBalance) / transaction.totalPayable * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.round((transaction.totalPayable - transaction.remainingBalance) / transaction.totalPayable * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {transaction.status !== 'completed' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-md">
                  <h4 className="text-md font-semibold text-blue-700 dark:text-blue-300 mb-2">Early Payoff Options</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                    Paying off your loan early could save you on interest. Click the "Close Early" 
                    button to see your early payoff amount.
                  </p>
                  {isLender && (
                    <button
                      onClick={() => {
                        const data = calculateEarlyPayoff(transaction.id);
                        setEarlyPayoffData(data);
                        setShowCompleteForm(true);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                    >
                      Calculate Early Payoff
                    </button>
                  )}
                </div>
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
                    htmlFor="additionalInterestRate" 
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Interest Rate (% per annum)
                  </label>
                  <input
                    id="additionalInterestRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={additionalInterestRate}
                    onChange={(e) => setAdditionalInterestRate(e.target.value)}
                    className={`mt-1 input ${errors.additionalInterestRate ? 'border-red-500' : ''}`}
                    placeholder={`Default: ${transaction.interestRate}%`}
                  />
                  {errors.additionalInterestRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.additionalInterestRate}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Leave empty to use original rate ({transaction.interestRate}%)
                  </p>
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
      
      {/* Complete Transaction Modal */}
      {showCompleteForm && earlyPayoffData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Complete Transaction</h3>
              <button
                onClick={() => setShowCompleteForm(false)}
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
            
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border-l-4 border-green-500">
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Early Payoff Benefits</h4>
                <p className="text-sm text-green-700 dark:text-green-400">
                  By completing the transaction now, the borrower will save {formatCurrency(earlyPayoffData.savedInterest)} in interest!
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Original Principal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.initialAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Original Total Payable:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.totalPayable)}</span>
                </div>
                
                {/* Show additional borrowing info if any */}
                {payments.some(p => p.type === 'additional_borrowing') && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Additional Principal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'additional_borrowing')
                            .reduce((sum, p) => sum + p.amount, 0)
                        )}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Additional Interest:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'additional_borrowing')
                            .reduce((sum, p) => {
                              const paymentDate = new Date(p.date);
                              const endDate = new Date(transaction.endDate);
                              const monthsUntilEnd = Math.max(0, Math.ceil(
                                (endDate.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
                              ));
                              const yearFraction = monthsUntilEnd / 12;
                              const interestRate = p.interestRate || transaction.interestRate;
                              const interestAmount = p.amount * (interestRate / 100) * yearFraction;
                              return sum + interestAmount;
                            }, 0)
                        )}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Amount Already Paid:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(transaction.totalPayable - transaction.remainingBalance)}
                  </span>
                </div>
                
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Final Payoff Amount:</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(earlyPayoffData.remainingBalance)}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Interest Loss:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(earlyPayoffData.savedInterest)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCompleteForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    completeTransaction(transaction.id);
                    setShowCompleteForm(false);
                  }}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Complete Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 