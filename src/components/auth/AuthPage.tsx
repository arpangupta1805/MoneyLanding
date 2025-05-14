import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Money Lending App
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track your loans and borrowings effortlessly
          </p>
        </div>
        
        {isLogin ? (
          <Login onToggleForm={toggleForm} />
        ) : (
          <Register onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
}; 