import { TransactionList } from '../transactions/TransactionList';
import { useTransactions } from '../../context/TransactionContext';

export const SettledPage = () => {
  const { getCompletedTransactions } = useTransactions();
  const completedTransactions = getCompletedTransactions();

  return (
    <div>
      <TransactionList 
        transactions={completedTransactions}
        title="Settled Transactions"
        emptyMessage="You don't have any settled transactions yet."
      />
    </div>
  );
}; 