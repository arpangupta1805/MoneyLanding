import { TransactionList } from '../transactions/TransactionList';
import { useTransactions } from '../../context/TransactionContext';

export const BorrowedPage = () => {
  const { getBorrowedTransactions } = useTransactions();
  const borrowedTransactions = getBorrowedTransactions();

  return (
    <div>
      <TransactionList 
        transactions={borrowedTransactions}
        title="Money Borrowed"
        emptyMessage="You haven't borrowed any money yet."
      />
    </div>
  );
}; 