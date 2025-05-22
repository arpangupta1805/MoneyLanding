import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AuthPage } from './components/auth/AuthPage';
import { DashboardPage } from './components/pages/DashboardPage';
import { LentPage } from './components/pages/LentPage';
import { BorrowedPage } from './components/pages/BorrowedPage';
import { OverduePage } from './components/pages/OverduePage';
import { SettledPage } from './components/pages/SettledPage';
import { TransactionDetail } from './components/transactions/TransactionDetail';
import { TransactionForm } from './components/transactions/TransactionForm';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Protect routes that require authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Redirect to dashboard if already authenticated
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TransactionProvider>
          <Router>
            <Layout>
              <Routes>
                <Route 
                  path="auth" 
                  element={
                    <PublicRoute>
                      <AuthPage />
                    </PublicRoute>
                  } 
                />
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="lent" 
                  element={
                    <ProtectedRoute>
                      <LentPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="borrowed" 
                  element={
                    <ProtectedRoute>
                      <BorrowedPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="overdue" 
                  element={
                    <ProtectedRoute>
                      <OverduePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="settled" 
                  element={
                    <ProtectedRoute>
                      <SettledPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="transaction/:id" 
                  element={
                    <ProtectedRoute>
                      <TransactionDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="new-transaction" 
                  element={
                    <ProtectedRoute>
                      <TransactionForm />
                    </ProtectedRoute>
                  } 
                />
                <Route path="" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
          </Router>
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
