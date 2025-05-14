import { useState } from 'react';
import { TransactionList } from '../transactions/TransactionList';
import { useTransactions } from '../../context/TransactionContext';
import { TransactionForm } from '../transactions/TransactionForm';

export const LentPage = () => {
  const { getLentTransactions } = useTransactions();
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  
  const lentTransactions = getLentTransactions();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Money Lent</h1>
        <button
          onClick={() => setShowNewTransactionForm(true)}
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
      
      <TransactionList 
        transactions={lentTransactions}
        title="Lent Transactions"
        emptyMessage="You haven't lent any money yet. Start by creating a new transaction."
      />
      
      {showNewTransactionForm && (
        <TransactionForm onClose={() => setShowNewTransactionForm(false)} />
      )}
    </div>
  );
}; 