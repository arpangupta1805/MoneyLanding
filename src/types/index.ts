export type User = {
  id: string;
  username: string;
  name: string;
  password: string; // In a real app, we wouldn't store plain passwords
};

export type TransactionStatus = 'active' | 'partially_paid' | 'completed' | 'overdue';

export type Transaction = {
  id: string;
  lenderId: string;
  borrowerId: string;
  borrowerUsername: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  duration: number; // in months
  startDate: string;
  endDate: string;
  status: TransactionStatus;
  remainingBalance: number;
  initialAmount: number;
};

export type PaymentEntry = {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  type: 'payment' | 'additional_borrowing';
  notes?: string;
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

export interface DashboardStats {
  totalLent: number;
  totalBorrowed: number;
  totalRepaid: number;
  upcomingDues: number;
  overdueDues: number;
} 