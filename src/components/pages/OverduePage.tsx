import { TransactionList } from '../transactions/TransactionList';
import { useTransactions } from '../../context/TransactionContext';

export const OverduePage = () => {
  const { getOverdueTransactions } = useTransactions();
  const overdueTransactions = getOverdueTransactions();

  return (
    <div>
      <TransactionList 
        transactions={overdueTransactions}
        title="Overdue Transactions"
        emptyMessage="You don't have any overdue transactions. Great job staying on top of things!"
      />
    </div>
  );
}; 