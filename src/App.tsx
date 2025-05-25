import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Brain } from 'lucide-react';
import './App.css';
import CaseViewer from './components/CaseViewer';
import Dashboard from './components/Dashboard';
import CaseForm from './components/CaseForm';
import { Auth } from './components/Auth';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {user && (
        <header className="bg-blue-600 text-white p-4 shadow-md">
          <div className="w-full max-w-none px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center">
              <Brain className="mr-2" /> RadSim
            </h1>
          </div>
        </header>
      )}

      <main className="w-full max-w-none px-4 mt-4 flex-grow">
        <Routes>
          <Route path="/auth" element={<Auth />} />
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