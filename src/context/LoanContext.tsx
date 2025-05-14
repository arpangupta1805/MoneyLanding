import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Loan, Transaction, User } from '../types/index';
import { LoanStatus } from '../types/index';
import { useAuth } from './AuthContext';
import { addDays, addMonths, isBefore, parseISO, isAfter } from 'date-fns';

interface LoanContextType {
  loans: Loan[];
  lentLoans: Loan[];
  borrowedLoans: Loan[];
  overdueLoans: Loan[];
  settledLoans: Loan[];
  addLoan: (
    borrowerUsername: string,
    amount: number,
    interestRate: number,
    durationMonths: number,
    purpose?: string,
    notes?: string
  ) => Promise<boolean>;
  updateLoan: (loanId: string, updatedData: Partial<Loan>) => void;
  getLoanById: (loanId: string) => Loan | undefined;
  addTransaction: (
    loanId: string,
    amount: number,
    type: 'repayment' | 'additional-loan',
    notes?: string
  ) => void;
  recalculateInterest: (loanId: string) => void;
}

const LoanContext = createContext<LoanContextType | undefined>(undefined);

export const useLoan = () => {
  const context = useContext(LoanContext);
  if (!context) {
    throw new Error('useLoan must be used within a LoanProvider');
  }
  return context;
};

interface LoanProviderProps {
  children: ReactNode;
}

export const LoanProvider = ({ children }: LoanProviderProps) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const { currentUser } = useAuth();

  // Load loans from localStorage on initial render
  useEffect(() => {
    const storedLoans = localStorage.getItem('loans');
    if (storedLoans) {
      try {
        const parsedLoans = JSON.parse(storedLoans);
        setLoans(parsedLoans);
      } catch (error) {
        console.error('Failed to parse stored loans', error);
      }
    }
  }, []);

  // Save loans to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('loans', JSON.stringify(loans));
  }, [loans]);

  // Update loan statuses periodically
  useEffect(() => {
    const updateLoanStatuses = () => {
      const today = new Date();
      
      setLoans(prevLoans => 
        prevLoans.map(loan => {
          // Skip if already completed
          if (loan.status === LoanStatus.COMPLETED) {
            return loan;
          }
          
          // Check if loan is overdue
          const endDate = parseISO(loan.endDate);
          if (isAfter(today, endDate) && loan.currentAmount > 0) {
            return { ...loan, status: LoanStatus.OVERDUE };
          }
          
          // Check if loan is partially paid
          if (loan.currentAmount < loan.initialAmount && loan.currentAmount > 0) {
            return { ...loan, status: LoanStatus.PARTIALLY_PAID };
          }
          
          // Check if loan is completed
          if (loan.currentAmount <= 0) {
            return { ...loan, status: LoanStatus.COMPLETED };
          }
          
          return loan;
        })
      );
    };

    // Update on initial render and every hour after that
    updateLoanStatuses();
    const interval = setInterval(updateLoanStatuses, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Filter loans by type
  const lentLoans = loans.filter(
    (loan) => currentUser && loan.lenderId === currentUser.id
  );
  
  const borrowedLoans = loans.filter(
    (loan) => currentUser && loan.borrowerId === currentUser.id
  );
  
  const overdueLoans = loans.filter(
    (loan) => 
      loan.status === LoanStatus.OVERDUE && 
      ((currentUser && loan.lenderId === currentUser.id) || 
       (currentUser && loan.borrowerId === currentUser.id))
  );
  
  const settledLoans = loans.filter(
    (loan) => 
      loan.status === LoanStatus.COMPLETED && 
      ((currentUser && loan.lenderId === currentUser.id) || 
       (currentUser && loan.borrowerId === currentUser.id))
  );

  const getLoanById = (loanId: string) => {
    return loans.find((loan) => loan.id === loanId);
  };

  const addLoan = async (
    borrowerUsername: string,
    amount: number,
    interestRate: number,
    durationMonths: number,
    purpose?: string,
    notes?: string
  ): Promise<boolean> => {
    if (!currentUser) return false;

    // Find borrower in users
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) return false;

    try {
      const users: User[] = JSON.parse(storedUsers);
      const borrower = users.find((user) => user.username === borrowerUsername);

      if (!borrower) return false;

      const today = new Date();
      const endDate = addMonths(today, durationMonths);

      const newLoan: Loan = {
        id: Date.now().toString(),
        lenderId: currentUser.id,
        borrowerId: borrower.id,
        borrowerUsername: borrower.username,
        borrowerName: borrower.name,
        initialAmount: amount,
        currentAmount: amount,
        interestRate,
        durationMonths,
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        status: LoanStatus.ACTIVE,
        transactions: [],
        purpose,
        notes,
      };

      setLoans((prevLoans) => [...prevLoans, newLoan]);
      return true;
    } catch (error) {
      console.error('Error adding loan', error);
      return false;
    }
  };

  const updateLoan = (loanId: string, updatedData: Partial<Loan>) => {
    setLoans((prevLoans) =>
      prevLoans.map((loan) =>
        loan.id === loanId ? { ...loan, ...updatedData } : loan
      )
    );
  };

  const addTransaction = (
    loanId: string,
    amount: number,
    type: 'repayment' | 'additional-loan',
    notes?: string
  ) => {
    const loan = getLoanById(loanId);
    if (!loan) return;

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      lenderId: loan.lenderId,
      borrowerId: loan.borrowerId,
      borrowerUsername: loan.borrowerUsername,
      borrowerName: loan.borrowerName,
      amount: amount,
      interestRate: loan.interestRate,
      duration: loan.durationMonths,
      startDate: new Date().toISOString(),
      endDate: loan.endDate,
      status: loan.status,
      remainingBalance: type === 'repayment' ? loan.currentAmount - amount : loan.currentAmount + amount,
      initialAmount: loan.initialAmount,
    };

    updateLoan(loanId, {
      transactions: [...loan.transactions, newTransaction],
      currentAmount: type === 'repayment' ? loan.currentAmount - amount : loan.currentAmount + amount,
      status: getNewStatus(loan, type, amount),
    });
  };

  const getNewStatus = (loan: Loan, transactionType: 'repayment' | 'additional-loan', amount: number): LoanStatus => {
    const newAmount = transactionType === 'repayment' ? loan.currentAmount - amount : loan.currentAmount + amount;
    
    if (newAmount <= 0) {
      return LoanStatus.COMPLETED;
    }
    
    if (newAmount < loan.initialAmount) {
      return LoanStatus.PARTIALLY_PAID;
    }
    
    const today = new Date();
    const endDate = parseISO(loan.endDate);
    if (isAfter(today, endDate) && newAmount > 0) {
      return LoanStatus.OVERDUE;
    }
    
    return LoanStatus.ACTIVE;
  };

  const recalculateInterest = (loanId: string) => {
    const loan = getLoanById(loanId);
    if (!loan) return;

    // Simple interest calculation
    const principal = loan.initialAmount;
    const rate = loan.interestRate / 100;
    const timeInYears = loan.durationMonths / 12;
    
    const interest = principal * rate * timeInYears;
    const totalAmount = principal + interest;
    
    updateLoan(loanId, {
      currentAmount: totalAmount,
    });
  };

  return (
    <LoanContext.Provider
      value={{
        loans,
        lentLoans,
        borrowedLoans,
        overdueLoans,
        settledLoans,
        addLoan,
        updateLoan,
        getLoanById,
        addTransaction,
        recalculateInterest,
      }}
    >
      {children}
    </LoanContext.Provider>
  );
}; 