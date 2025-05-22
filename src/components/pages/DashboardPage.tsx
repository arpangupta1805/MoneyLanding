import { useNavigate } from 'react-router-dom';
import { Dashboard } from '../dashboard/Dashboard';

export const DashboardPage = () => {
  const navigate = useNavigate();

  const handleNewTransaction = () => {
    navigate('/new-transaction');
  };

  return <Dashboard onNewTransaction={handleNewTransaction} />;
}; 