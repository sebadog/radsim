import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LogOut, User } from 'lucide-react';
import './App.css';
import CaseViewer from './components/CaseViewer';
import Dashboard from './components/Dashboard';
import CaseForm from './components/CaseForm';
import { Auth } from './components/Auth';
import { ResetPassword } from './components/ResetPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { signOut } from './services/authService';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/reset-password')) {
      navigate('/auth', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {user && (
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="w-full max-w-none px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              RadSim
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm">
                <User size={16} className="mr-2" />
                <span>{user.email}</span>
                {user.role === 'admin' && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-500 rounded-full text-xs">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-1 bg-blue-500 rounded hover:bg-blue-400 transition-colors"
              >
                <LogOut size={16} className="mr-1" />
                Sign Out
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="w-full max-w-none px-4 mt-4 flex-grow">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password/*" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/case/:caseId"
            element={
              <PrivateRoute>
                <CaseViewer />
              </PrivateRoute>
            }
          />
          <Route
            path="/cases/new"
            element={
              <PrivateRoute adminOnly>
                <CaseForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/cases/edit/:id"
            element={
              <PrivateRoute adminOnly>
                <CaseForm />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>

      {user && (
        <footer className="bg-gray-800 text-white p-4 mt-auto">
          <div className="w-full max-w-none px-4 text-center">
            <p>© 2025 RadSim - Radiology Simulation Application</p>
          </div>
        </footer>
      )}
    </div>
  );
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithAuth;