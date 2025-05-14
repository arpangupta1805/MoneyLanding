import { useState } from 'react';
import { Dashboard } from '../dashboard/Dashboard';
import { TransactionForm } from '../transactions/TransactionForm';

export const DashboardPage = () => {
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);

  return (
    <div>
      <Dashboard onNewTransaction={() => setShowNewTransactionForm(true)} />
      
      {showNewTransactionForm && (
        <TransactionForm onClose={() => setShowNewTransactionForm(false)} />
      )}
    </div>
  );
}; 