import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit, Trash2, CheckCircle, Circle, Lock } from 'lucide-react';
import { fetchCases, deleteCase, markCaseAsCompleted } from '../services/caseService';
import { Case } from '../types/case';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [actionAfterAuth, setActionAfterAuth] = useState<{type: 'edit' | 'delete', id: string} | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const loadCases = async () => {
      try {
        setLoading(true);
        const casesData = await fetchCases();
        setCases(casesData);
      } catch (err: any) {
        console.error('Error loading cases:', err);
        setError('Failed to load cases');
      } finally {
        setLoading(false);
      }
    };

    loadCases();
  }, []);

  const handleDeleteCase = async (id: string) => {
    if (!isAdmin) return;
    
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      await deleteCase(id);
      setCases(cases.filter(c => c.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete case');
    }
  };

  const handleEditCase = (id: string) => {
    if (!isAdmin) return;
    navigate(`/cases/edit/${id}`);
  };

  const handleAddNewCase = () => {
    if (!isAdmin) return;
    navigate('/cases/new');
  };

  const handleToggleCompleted = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await markCaseAsCompleted(id, !currentStatus);
      setCases(cases.map(c => c.id === id ? { ...c, completed: !currentStatus } : c));
    } catch (err: any) {
      setError(err.message || 'Failed to update case status');
    }
  };

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'completed') return c.completed;
    if (filter === 'incomplete') return !c.completed;
    return true;
  });

  return (
    <div className="p-6 mb-6 w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold">Cases</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-2 rounded-l ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('completed')} 
              className={`px-3 py-2 ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Completed
            </button>
            <button 
              onClick={() => setFilter('incomplete')} 
              className={`px-3 py-2 rounded-r ${filter === 'incomplete' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Incomplete
            </button>
          </div>
          {isAdmin && (
            <button 
              onClick={handleAddNewCase}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="mr-1" size={18} /> Add New Case
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading cases...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">
            {filter === 'all' 
              ? 'No cases found' 
              : filter === 'completed' 
                ? 'No completed cases found' 
                : 'No incomplete cases found'}
          </p>
          {isAdmin && filter === 'all' && (
            <button 
              onClick={handleAddNewCase}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus size={18} className="mr-1" /> Create your first case
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCases.map((caseItem) => (
            <div 
              key={caseItem.id} 
              className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border ${
                caseItem.completed ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              <div className={`p-4 flex justify-between items-center ${caseItem.completed ? 'bg-green-100' : 'bg-white'}`}>
                <h3 className="font-semibold text-lg text-gray-800">
                  {caseItem.title}
                </h3>
                <button
                  onClick={(e) => handleToggleCompleted(e, caseItem.id, caseItem.completed || false)}
                  className={`p-2 rounded-full transition-colors duration-200 ${
                    caseItem.completed 
                      ? 'bg-green-200 text-green-700 hover:bg-green-300' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                  title={caseItem.completed ? "Mark as Incomplete" : "Mark as Completed"}
                >
                  {caseItem.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
              </div>
              
              <div className="p-4 bg-white">
                <div className="mb-3 text-sm text-gray-700 line-clamp-2 h-10">
                  {caseItem.clinical_info}
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <Link 
                    to={`/case/${caseItem.id}`} 
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <FileText size={16} className="mr-1.5" /> View Case
                  </Link>
                  
                  {isAdmin && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditCase(caseItem.id)}
                        className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCase(caseItem.id)}
                        className={`p-1.5 rounded transition-colors ${
                          deleteConfirm === caseItem.id
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        title={deleteConfirm === caseItem.id ? 'Click again to confirm delete' : 'Delete'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {caseItem.completed && (
                <div className="py-2 px-4 bg-green-100 text-green-800 text-sm font-medium flex items-center justify-center">
                  <CheckCircle className="mr-1.5" size={16} />
                  Completed
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;