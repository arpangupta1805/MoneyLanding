import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '../types/index';

// Mock user data - in a real app, this would come from a database
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'johndoe',
    name: 'John Doe',
    password: 'password123',
  },
  {
    id: '2',
    username: 'janedoe',
    name: 'Jane Doe',
    password: 'password123',
  },
];

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  register: (username: string, name: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = users.find(
      (user) => user.username === username && user.password === password
    );
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    
    return false;
  };

  const register = (username: string, name: string, password: string): boolean => {
    // Check if username already exists
    if (users.some((user) => user.username === username)) {
      return false;
    }

    const newUser: User = {
      id: String(users.length + 1),
      username,
      name,
      password,
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        register,
        logout,
        isAuthenticated: !!currentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 