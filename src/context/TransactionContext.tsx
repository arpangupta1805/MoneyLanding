import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Transaction, PaymentEntry, TransactionStatus, UserStats } from '../types/index';
import { useAuth } from './AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  payments: PaymentEntry[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'status' | 'remainingBalance'>) => void;
  addPayment: (payment: Omit<PaymentEntry, 'id'>) => void;
  addAdditionalBorrowing: (transactionId: string, amount: number, notes?: string) => void;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => void;
  getTransactionById: (id: string) => Transaction | undefined;
  getPaymentsByTransactionId: (transactionId: string) => PaymentEntry[];
  getUserStats: () => UserStats;
  getLentTransactions: () => Transaction[];
  getBorrowedTransactions: () => Transaction[];
  getOverdueTransactions: () => Transaction[];
  getCompletedTransactions: () => Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<PaymentEntry[]>([]);

  // Load data from localStorage on initial render
  useEffect(() => {
    const storedTransactions = localStorage.getItem('transactions');
    const storedPayments = localStorage.getItem('payments');

    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }

    if (storedPayments) {
      setPayments(JSON.parse(storedPayments));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('payments', JSON.stringify(payments));
  }, [payments]);

  const addTransaction = (
    transaction: Omit<Transaction, 'id' | 'status' | 'remainingBalance'>
  ) => {
    if (!currentUser) return;

    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      status: 'active',
      remainingBalance: transaction.amount,
    };

    setTransactions([...transactions, newTransaction]);
  };

  const addPayment = (payment: Omit<PaymentEntry, 'id'>) => {
    if (!currentUser) return;

    const newPayment: PaymentEntry = {
      ...payment,
      id: Date.now().toString(),
    };

    setPayments([...payments, newPayment]);

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
          } else if (newRemainingBalance < t.amount) {
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
    }
  };

  const addAdditionalBorrowing = (transactionId: string, amount: number, notes?: string) => {
    if (!currentUser) return;

    // Add a payment entry with type 'additional_borrowing'
    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      transactionId,
      amount,
      date: new Date().toISOString(),
      type: 'additional_borrowing',
      notes,
    };

    setPayments([...payments, newPayment]);

    // Update transaction remaining balance
    setTransactions(
      transactions.map((t) => {
        if (t.id === transactionId) {
          return {
            ...t,
            remainingBalance: t.remainingBalance + amount,
            amount: t.amount + amount,
            status: 'active', // Reset to active when additional money is borrowed
          };
        }
        return t;
      })
    );
  };

  const updateTransactionStatus = (transactionId: string, status: TransactionStatus) => {
    setTransactions(
      transactions.map((t) => {
        if (t.id === transactionId) {
          return { ...t, status };
        }
        return t;
      })
    );
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

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        payments,
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