import { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  Transaction, 
  PaymentEntry, 
  TransactionStatus, 
  UserStats, 
  BorrowerProfile,
  User
} from '../types/index';
import { useAuth } from './AuthContext';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

interface TransactionContextType {
  transactions: Transaction[];
  payments: PaymentEntry[];
  borrowerProfiles: BorrowerProfile[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'remainingBalance'>) => void;
  addPayment: (payment: Omit<PaymentEntry, 'id'>) => void;
  addAdditionalBorrowing: (transactionId: string, amount: number, notes?: string, interestRate?: number) => void;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getPaymentsByTransactionId: (transactionId: string) => PaymentEntry[];
  getUserStats: () => UserStats;
  getLentTransactions: () => Transaction[];
  getBorrowedTransactions: () => Transaction[];
  getOverdueTransactions: () => Transaction[];
  getCompletedTransactions: () => Transaction[];
  calculateEarlyPayoff: (transactionId: string, paymentDate?: Date) => {
    remainingBalance: number;
    totalInterest: number;
    savedInterest: number;
  };
  completeTransaction: (transactionId: string) => void;
  // New functions for borrower profiles
  saveBorrowerProfile: (borrowerData: Omit<BorrowerProfile, 'id' | 'lastUpdated'>) => void;
  getBorrowerProfileByPhone: (phone: string) => BorrowerProfile | undefined;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [borrowerProfiles, setBorrowerProfiles] = useState<BorrowerProfile[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadDataFromStorage = () => {
      try {
        const storedTransactions = localStorage.getItem('transactions');
        const storedPayments = localStorage.getItem('payments');
        const storedBorrowerProfiles = localStorage.getItem('borrowerProfiles');
  
        if (storedTransactions) {
          const parsedTransactions = JSON.parse(storedTransactions);
          setTransactions(parsedTransactions);
          console.log('Loaded transactions from localStorage:', parsedTransactions.length);
        }
  
        if (storedPayments) {
          const parsedPayments = JSON.parse(storedPayments);
          setPayments(parsedPayments);
          console.log('Loaded payments from localStorage:', parsedPayments.length);
        }

        if (storedBorrowerProfiles) {
          const parsedProfiles = JSON.parse(storedBorrowerProfiles);
          setBorrowerProfiles(parsedProfiles);
          console.log('Loaded borrower profiles from localStorage:', parsedProfiles.length);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
        // Fallback to empty arrays if localStorage data is corrupted
        setTransactions([]);
        setPayments([]);
        setBorrowerProfiles([]);
      }
    };

    loadDataFromStorage();
  }, []);

  // Helper function to save data to localStorage
  const saveDataToStorage = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  const addTransaction = (
    transaction: Omit<Transaction, 'id' | 'status' | 'remainingBalance'>
  ) => {
    // Remove the currentUser check to allow transactions to be created 
    // based on borrower profiles from any user
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      status: 'active',
      remainingBalance: transaction.totalPayable,
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    // Immediately save to localStorage
    saveDataToStorage('transactions', updatedTransactions);

    // Save borrower profile for future auto-fill
    saveBorrowerProfile({
      phone: transaction.phone,
      borrowerName: transaction.borrowerName,
      borrowerFatherName: transaction.borrowerFatherName,
      borrowerUsername: transaction.borrowerUsername,
      address: transaction.address,
      village: transaction.village
    });
    
    // Try to create/update user in the database if they're not already registered
    // This is done asynchronously and doesn't affect the transaction creation
    tryRegisterBorrower({
      username: transaction.borrowerUsername,
      fullName: transaction.borrowerName,
      fatherName: transaction.borrowerFatherName,
      phoneNumber: transaction.phone,
      address: transaction.address,
      village: transaction.village
    });
  };

  // Helper function to attempt registering a borrower in the database
  const tryRegisterBorrower = async (userData: {
    username: string;
    fullName: string;
    fatherName: string;
    phoneNumber: string;
    village: string;
    address: string;
  }) => {
    try {
      // Generate a temporary email based on phone number
      const tempEmail = `${userData.phoneNumber}@temp-email.com`;
      // Generate a random password
      const tempPassword = Math.random().toString(36).slice(-8);
      
      const response = await authAPI.register({
        username: userData.username,
        fullName: userData.fullName,
        email: tempEmail,
        password: tempPassword,
        phoneNumber: userData.phoneNumber,
        village: userData.village,
        fatherName: userData.fatherName,
        address: userData.address
      } as Omit<User, 'id'>);
      
      if (response.success) {
        console.log('Borrower registered as user');
      }
    } catch (error) {
      // Silently handle errors - user might already exist or there could be other validation issues
      console.log('Could not register borrower as user:', error);
    }
  };

  const addPayment = (payment: Omit<PaymentEntry, 'id'>) => {
    // Remove the currentUser check to allow payments to be recorded for any transaction
    
    const newPayment: PaymentEntry = {
      ...payment,
      id: Date.now().toString(),
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    // Immediately save to localStorage
    saveDataToStorage('payments', updatedPayments);

    // Update transaction remaining balance
    const transaction = transactions.find((t) => t.id === payment.transactionId);
    if (transaction) {
      const updatedTransactions = transactions.map((t) => {
        if (t.id === payment.transactionId) {
          const newRemainingBalance = t.remainingBalance - payment.amount;
          let newStatus: TransactionStatus = t.status;

          // Update status based on remaining balance
          if (newRemainingBalance <= 0) {
            newStatus = 'completed';
          } else if (newRemainingBalance < t.totalPayable) {
            newStatus = 'partially_paid';
          }

          return {
            ...t,
            remainingBalance: newRemainingBalance,
            status: newStatus,
          };
        }
        return t;
      });

      setTransactions(updatedTransactions);
      // Immediately save to localStorage
      saveDataToStorage('transactions', updatedTransactions);
    }
  };

  const addAdditionalBorrowing = (transactionId: string, amount: number, notes?: string, interestRate?: number) => {
    // Remove the currentUser check to allow additional borrowings for any transaction
    
    // Add a payment entry with type 'additional_borrowing'
    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      transactionId,
      amount,
      date: new Date().toISOString(),
      type: 'additional_borrowing',
      notes,
      interestRate,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    // Immediately save to localStorage to prevent data loss
    saveDataToStorage('payments', updatedPayments);

    // Get the transaction
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Calculate interest for the additional amount
    const endDate = new Date(transaction.endDate);
    const today = new Date();
    const monthsUntilEnd = Math.max(0, Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
    ));
    const yearFraction = monthsUntilEnd / 12;
    const rate = interestRate || transaction.interestRate;
    const additionalInterest = amount * (rate / 100) * yearFraction;
    const additionalPayable = amount + additionalInterest;

    // Update transaction remaining balance and amounts
    const updatedTransactions = transactions.map((t) => {
      if (t.id === transactionId) {
        // Only add the principal to amount, but add principal + interest to totalPayable
        const newAmount = t.amount + amount;
        const newTotalPayable = t.totalPayable + additionalPayable;
        
        // Add principal + interest to the remaining balance
        return {
          ...t,
          remainingBalance: t.remainingBalance + additionalPayable,
          amount: newAmount,
          totalPayable: newTotalPayable,
          status: 'active' as TransactionStatus, // Reset to active when additional money is borrowed
          // Important: Do NOT change the duration or end date
        };
      }
      return t;
    });
    
    setTransactions(updatedTransactions);
    // Immediately save to localStorage to prevent data loss
    saveDataToStorage('transactions', updatedTransactions);
  };

  const updateTransactionStatus = (transactionId: string, status: TransactionStatus) => {
    const updatedTransactions = transactions.map((t) => {
      if (t.id === transactionId) {
        return { ...t, status };
      }
      return t;
    });
    
    setTransactions(updatedTransactions);
    // Immediately save to localStorage
    saveDataToStorage('transactions', updatedTransactions);
  };

  const getTransactionById = (id: string) => {
    return transactions.find((t) => t.id === id);
  };

  const getPaymentsByTransactionId = (transactionId: string) => {
    return payments.filter((p) => p.transactionId === transactionId);
  };

  const getUserStats = (): UserStats => {
    if (!currentUser) {
      return {
        totalLent: 0,
        totalBorrowed: 0,
        totalRepaid: 0,
        upcomingDues: 0,
        overdueLent: 0,
        overdueBorrowed: 0,
      };
    }

    const lentTransactions = transactions.filter((t) => t.lenderId === currentUser.id);
    const borrowedTransactions = transactions.filter((t) => t.borrowerId === currentUser.id);

    const totalLent = lentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalBorrowed = borrowedTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate total repaid
    const totalRepaid = payments
      .filter((p) => p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0);

    // Calculate upcoming dues (loans due in the next 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const upcomingDues = transactions
      .filter((t) => {
        const endDate = new Date(t.endDate);
        return (
          t.status !== 'completed' &&
          endDate >= today &&
          endDate <= thirtyDaysFromNow
        );
      })
      .reduce((sum, t) => sum + t.remainingBalance, 0);

    // Calculate overdue amounts
    const overdueLent = lentTransactions
      .filter((t) => t.status === 'overdue')
      .reduce((sum, t) => sum + t.remainingBalance, 0);

    const overdueBorrowed = borrowedTransactions
      .filter((t) => t.status === 'overdue')
      .reduce((sum, t) => sum + t.remainingBalance, 0);

    return {
      totalLent,
      totalBorrowed,
      totalRepaid,
      upcomingDues,
      overdueLent,
      overdueBorrowed,
    };
  };

  const getLentTransactions = () => {
    if (!currentUser) return [];
    return transactions.filter((t) => t.lenderId === currentUser.id);
  };

  const getBorrowedTransactions = () => {
    if (!currentUser) return [];
    return transactions.filter((t) => t.borrowerId === currentUser.id);
  };

  const getOverdueTransactions = () => {
    if (!currentUser) return [];
    return transactions.filter(
      (t) => t.status === 'overdue' && 
      (t.lenderId === currentUser.id || t.borrowerId === currentUser.id)
    );
  };

  const getCompletedTransactions = () => {
    if (!currentUser) return [];
    return transactions.filter(
      (t) => t.status === 'completed' && 
      (t.lenderId === currentUser.id || t.borrowerId === currentUser.id)
    );
  };

  // Calculate remaining balance if a borrower wants to pay off early
  const calculateEarlyPayoff = (transactionId: string, paymentDate: Date = new Date()) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return { remainingBalance: 0, totalInterest: 0, savedInterest: 0 };

    const startDate = new Date(transaction.startDate);
    const endDate = new Date(transaction.endDate);
    const originalDurationMonths = transaction.duration;
    
    // Calculate completed months (partial months are counted as full)
    const completedMonths = Math.ceil(
      (paymentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    
    // Limit to maximum duration
    const effectiveDuration = Math.min(completedMonths, originalDurationMonths);
    
    // Calculate interest for the actual duration for the initial loan
    const monthlyRate = transaction.interestRate / 100 / 12;
    const originalTotalPayable = transaction.totalPayable;
    
    // Calculate what would have been paid with the actual duration for initial amount
    // Use simple interest formula: P * R * T (where T is in years)
    const yearFraction = effectiveDuration / 12; // Convert months to years
    const actualInterest = transaction.initialAmount * (transaction.interestRate / 100) * yearFraction;
    const actualTotalPayable = transaction.initialAmount + actualInterest;
    
    // Get additional borrowings with their interest rates
    const additionalBorrowingEntries = payments
      .filter(p => p.transactionId === transactionId && p.type === 'additional_borrowing');
    
    // Calculate interest for each additional borrowing with respective interest rates and durations
    let additionalInterest = 0;
    for (const borrowing of additionalBorrowingEntries) {
      const borrowingDate = new Date(borrowing.date);
      
      // Calculate months elapsed for this additional borrowing
      const borrowingMonths = Math.ceil(
        (paymentDate.getTime() - borrowingDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      
      // Interest rate for this borrowing (use transaction rate if not specified)
      const borrowingRate = borrowing.interestRate || transaction.interestRate;
      
      // Calculate interest using simple interest formula: P * R * T (where T is in years)
      const borrowingYearFraction = borrowingMonths / 12; // Convert months to years
      additionalInterest += borrowing.amount * (borrowingRate / 100) * borrowingYearFraction;
    }
    
    // Total additional amount borrowed
    const totalAdditionalAmount = additionalBorrowingEntries.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate the saved interest (original estimated vs. actual)
    const totalActualInterest = actualInterest + additionalInterest;
    const savedInterest = transaction.totalInterest - totalActualInterest;
    
    // Get total payments made so far
    const paymentsMade = payments
      .filter(p => p.transactionId === transactionId && p.type === 'payment')
      .reduce((sum, p) => sum + p.amount, 0);
      
    // Calculate remaining balance for early payoff
    const remainingBalance = transaction.initialAmount + totalAdditionalAmount + totalActualInterest - paymentsMade;
    
    return {
      remainingBalance: Math.max(0, remainingBalance),
      totalInterest: totalActualInterest,
      savedInterest: Math.max(0, savedInterest)
    };
  };

  // Complete a transaction with early payoff
  const completeTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const today = new Date();
    const { remainingBalance } = calculateEarlyPayoff(transactionId, today);
    
    // Record final payment
    if (remainingBalance > 0) {
      const newPayment: PaymentEntry = {
        id: Date.now().toString(),
        transactionId,
        amount: remainingBalance,
        date: today.toISOString(),
        type: 'payment',
        notes: 'Final payment - loan completed',
      };
      
      const updatedPayments = [...payments, newPayment];
      setPayments(updatedPayments);
      // Immediately save to localStorage
      saveDataToStorage('payments', updatedPayments);
    }
    
    // Update transaction status
    const updatedTransactions = transactions.map(t => {
      if (t.id === transactionId) {
        return { 
          ...t, 
          status: 'completed' as TransactionStatus,
          remainingBalance: 0
        };
      }
      return t;
    });
    
    setTransactions(updatedTransactions);
    // Immediately save to localStorage
    saveDataToStorage('transactions', updatedTransactions);
  };

  // New functions for borrower profiles
  const saveBorrowerProfile = (borrowerData: Omit<BorrowerProfile, 'id' | 'lastUpdated'>) => {
    // Remove the currentUser check to allow profiles to be shared across users
    
    // Check if profile already exists by phone number
    const existingProfileIndex = borrowerProfiles.findIndex(
      profile => profile.phone === borrowerData.phone
    );

    let updatedProfiles: BorrowerProfile[];

    if (existingProfileIndex >= 0) {
      // Update existing profile
      updatedProfiles = [...borrowerProfiles];
      updatedProfiles[existingProfileIndex] = {
        ...updatedProfiles[existingProfileIndex],
        ...borrowerData,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Create new profile
      const newProfile: BorrowerProfile = {
        ...borrowerData,
        id: Date.now().toString(),
        lastUpdated: new Date().toISOString()
      };
      updatedProfiles = [...borrowerProfiles, newProfile];
    }

    // Save updated profiles to state and localStorage
    setBorrowerProfiles(updatedProfiles);
    saveDataToStorage('borrowerProfiles', updatedProfiles);
  };

  const getBorrowerProfileByPhone = (phone: string): BorrowerProfile | undefined => {
    // Return any profile matching the phone number, regardless of user
    return borrowerProfiles.find(profile => profile.phone === phone);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        payments,
        borrowerProfiles,
        addTransaction,
        addPayment,
        addAdditionalBorrowing,
        updateTransactionStatus,
        getTransactionById,
        getPaymentsByTransactionId,
        getUserStats,
        getLentTransactions,
        getBorrowedTransactions,
        getOverdueTransactions,
        getCompletedTransactions,
        calculateEarlyPayoff,
        completeTransaction,
        saveBorrowerProfile,
        getBorrowerProfileByPhone
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}; 