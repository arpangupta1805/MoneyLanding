export type User = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  fatherName?: string;
  password: string; // In a real app, we wouldn't store plain passwords
  phoneNumber: string;
  village: string;
  address?: string;
};

export type TransactionStatus = 'active' | 'partially_paid' | 'completed' | 'overdue';

export type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  borrowerUsername: string;
  borrowerName: string;
  borrowerFatherName: string;
  address: string;
  village: string;
  phone: string;
  amount: number;
  interestRate: number;
  duration: number; // in months
  startDate: string;
  endDate: string;
  status: TransactionStatus;
  remainingBalance: number;
  initialAmount: number;
  monthlyEmi: number;
  totalPayable: number;
  totalInterest: number;
};

export type PaymentEntry = {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  type: 'payment' | 'additional_borrowing';
  notes?: string;
  interestRate?: number; // Optional interest rate for additional borrowing
};

export type UserStats = {
  totalLent: number;
  totalBorrowed: number;
  totalRepaid: number;
  upcomingDues: number;
  overdueLent: number;
  overdueBorrowed: number;
};

export enum LoanStatus {
  ACTIVE = 'active',
  PARTIALLY_PAID = 'partially_paid',
  COMPLETED = 'completed',
  OVERDUE = 'overdue'
}

export interface Loan {
  id: string;
  lenderId: string;
  borrowerId: string;
  borrowerUsername: string;
  borrowerName: string;
  initialAmount: number;
  currentAmount: number;
  interestRate: number;
  durationMonths: number;
  startDate: string;
  endDate: string;
  status: LoanStatus;
  transactions: Transaction[];
  purpose?: string;
  notes?: string;
}

export type DashboardStats = {
  totalLent: number;
  totalBorrowed: number;
  totalRepaid: number;
  upcomingDues: number;
  overdueDues: number;
}

// New type for storing borrower profile data for autofill
export type BorrowerProfile = {
  id: string;
  phone: string;
  borrowerName: string;
  borrowerFatherName: string;
  borrowerUsername: string; 
  address: string;
  village: string;
  lastUpdated: string; // ISO date string to track when this profile was last updated
}; 