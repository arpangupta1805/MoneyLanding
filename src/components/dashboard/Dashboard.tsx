import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../context/TransactionContext';
import { useAuth } from '../../context/AuthContext';
import type { Transaction } from '../../types/index';

interface DashboardProps {
  onNewTransaction?: () => void;
}

export const Dashboard = ({ onNewTransaction }: DashboardProps) => {
  const { currentUser } = useAuth();
  const { 
    transactions, 
    getUserStats, 
    getLentTransactions, 
    getBorrowedTransactions 
  } = useTransactions();
  
  const stats = getUserStats();
  
  // Get recent transactions (last 5)
  const recentTransactions = [...transactions]
    .filter(t => t.lenderId === currentUser?.id || t.borrowerId === currentUser?.id)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusClass = (status: Transaction['status']) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={onNewTransaction}
          className="btn-primary flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Transaction
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Money Lent</h3>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalLent)}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-indigo-500 to-indigo-700 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Money Borrowed</h3>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalBorrowed)}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Repaid</h3>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.totalRepaid)}</p>
        </div>
        
        <div className="card bg-gradient-to-br from-red-500 to-red-700 text-white">
          <h3 className="text-sm font-medium opacity-90">Upcoming Dues (30 days)</h3>
          <p className="text-2xl font-bold mt-2">{formatCurrency(stats.upcomingDues)}</p>
        </div>
      </div>

      {/* Alert for overdue */}
      {stats.overdueLent > 0 || stats.overdueBorrowed > 0 ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded dark:bg-red-900 dark:text-red-300">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">
                {stats.overdueLent > 0 && (
                  <span>You have {formatCurrency(stats.overdueLent)} in overdue loans to collect. </span>
                )}
                {stats.overdueBorrowed > 0 && (
                  <span>You owe {formatCurrency(stats.overdueBorrowed)} in overdue loans. </span>
                )}
                <Link to="/overdue" className="font-medium underline hover:text-red-600">
                  View all overdue
                </Link>
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent Transactions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h2>
        
        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
              <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left">Type</th>
                  <th className="py-3 px-4 text-left">Person</th>
                  <th className="py-3 px-4 text-left">Amount</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="py-3 px-4">
                      {transaction.lenderId === currentUser?.id ? 'Lent' : 'Borrowed'}
                    </td>
                    <td className="py-3 px-4">
                      {transaction.lenderId === currentUser?.id
                        ? transaction.borrowerName
                        : transaction.lenderId /* We should store lender name too */}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(transaction.status)}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(transaction.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/transaction/${transaction.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No transactions yet.</p>
            <button
              onClick={onNewTransaction}
              className="mt-4 text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              Create your first transaction
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Money You Lent</h3>
          {getLentTransactions().length > 0 ? (
            <div className="space-y-3">
              {getLentTransactions()
                .slice(0, 3)
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {transaction.borrowerName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Remaining: {formatCurrency(transaction.remainingBalance)}
                      </p>
                    </div>
                  </div>
                ))}
              {getLentTransactions().length > 3 && (
                <Link
                  to="/lent"
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-3"
                >
                  View all ({getLentTransactions().length})
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No money lent yet.</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Money You Borrowed</h3>
          {getBorrowedTransactions().length > 0 ? (
            <div className="space-y-3">
              {getBorrowedTransactions()
                .slice(0, 3)
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-750 rounded"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        From: {transaction.lenderId} {/* We should store lender name */}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(transaction.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Remaining: {formatCurrency(transaction.remainingBalance)}
                      </p>
                    </div>
                  </div>
                ))}
              {getBorrowedTransactions().length > 3 && (
                <Link
                  to="/borrowed"
                  className="block text-center text-sm text-primary-600 dark:text-primary-400 hover:underline mt-3"
                >
                  View all ({getBorrowedTransactions().length})
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No money borrowed yet.</p>
          )}
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={onNewTransaction}
          className="h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center focus:outline-none hover:bg-primary-700 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}; 