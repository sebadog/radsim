import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Brain } from 'lucide-react';
import './App.css';
import CaseViewer from './components/CaseViewer';
import Dashboard from './components/Dashboard';
import CaseForm from './components/CaseForm';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [openRouterApiKey, setOpenRouterApiKey] = useState(import.meta.env.VITE_OPENROUTER_API_KEY || '');
  const [showUpload, setShowUpload] = useState(false);

  const handleFileUpload = async (acceptedFiles: File[]) => {
    // ... existing code ...
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="w-full max-w-none px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <Brain className="mr-2" /> RadSim
          </h1>
          <div className="flex items-center space-x-4">
            {/* Upload button removed */}
          </div>
        </div>
      </header>

      <main className="w-full max-w-none px-4 mt-4 flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/case/:caseId" element={<CaseViewer />} />
          <Route path="/cases/new" element={<CaseForm />} />
          <Route path="/cases/edit/:id" element={<CaseForm />} />
        </Routes>
      </main>

      <footer className="bg-gray-800 text-white p-4 mt-auto">
        <div className="w-full max-w-none px-4 text-center">
          <p>© 2025 RadSim - Radiology Simulation Application</p>
        </div>
      </footer>
    </div>
  );
}

export default App;