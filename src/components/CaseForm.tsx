import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Save, ArrowLeft } from 'lucide-react';
import { createCase, updateCase, fetchCaseById, CaseFormData } from '../services/caseService';
import { useAuth } from '../contexts/AuthContext';

const CaseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    clinicalInfo: '',
    expectedFindings: [''],
    additionalFindings: [''],
    summaryOfPathology: '',
    imageUrl: '',
    surveyUrl: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }

    if (isEditMode) {
      loadCase();
    }
  }, [id, isEditMode, user, navigate]);
  
  const loadCase = async () => {
    try {
      setLoading(true);
      const caseData = await fetchCaseById(id!);
      
      if (!caseData) {
        setError('Case not found');
        return;
      }
      
      setFormData({
        title: caseData.title,
        clinicalInfo: caseData.clinical_info,
        expectedFindings: caseData.expected_findings.length ? caseData.expected_findings : [''],
        additionalFindings: caseData.additional_findings.length ? caseData.additional_findings : [''],
        summaryOfPathology: caseData.summary_of_pathology,
        imageUrl: caseData.images?.[0] || '',
        surveyUrl: caseData.survey_url || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleArrayItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    field: 'expectedFindings' | 'additionalFindings'
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };
  
  const addArrayItem = (field: 'expectedFindings' | 'additionalFindings') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };
  
  const removeArrayItem = (index: number, field: 'expectedFindings' | 'additionalFindings') => {
    if (formData[field].length <= 1) {
      return;
    }
    
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.clinicalInfo.trim()) {
      setError('Clinical information is required');
      return;
    }
    
    if (!formData.expectedFindings.some(f => f.trim())) {
      setError('At least one expected finding is required');
      return;
    }
    
    if (!formData.summaryOfPathology.trim()) {
      setError('Summary of pathology is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (isEditMode) {
        await updateCase(id!, formData);
      } else {
        await createCase(formData);
      }
      
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Form submission error:', err);
      setError(err.message || 'Failed to save case');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 mb-6">
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/')}
          className="mr-4 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Case' : 'New Case'}</h2>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 flex items-start">
          <AlertTriangle className="text-red-500 mr-2 flex-shrink-0 mt-1" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">
            {isEditMode ? 'Loading case data...' : 'Creating case...'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="text-left space-y-6">
          <div>
            <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
              Case Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter case title"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="clinicalInfo">
              Clinical Information
            </label>
            <textarea
              id="clinicalInfo"
              name="clinicalInfo"
              value={formData.clinicalInfo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
              placeholder="Enter clinical information"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="imageUrl" className="block text-gray-700 font-medium mb-2">
                Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter image URL"
              />
            </div>

            <div>
              <label htmlFor="surveyUrl" className="block text-gray-700 font-medium mb-2">
                Survey URL
              </label>
              <input
                type="url"
                id="surveyUrl"
                name="surveyUrl"
                value={formData.surveyUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter survey URL"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Expected Findings
            </label>
            {formData.expectedFindings.map((finding, index) => (
              <div key={`finding-${index}`} className="flex mb-2">
                <input
                  type="text"
                  value={finding}
                  onChange={(e) => handleArrayItemChange(e, index, 'expectedFindings')}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter an expected finding"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'expectedFindings')}
                  className="ml-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  disabled={formData.expectedFindings.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('expectedFindings')}
              className="mt-1 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              Add Finding
            </button>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Additional Findings (Optional)
            </label>
            {formData.additionalFindings.map((finding, index) => (
              <div key={`additional-${index}`} className="flex mb-2">
                <input
                  type="text"
                  value={finding}
                  onChange={(e) => handleArrayItemChange(e, index, 'additionalFindings')}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter an additional finding"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(index, 'additionalFindings')}
                  className="ml-2 p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  disabled={formData.additionalFindings.length <= 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('additionalFindings')}
              className="mt-1 px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              Add Additional Finding
            </button>
          </div>
          
          <div>
            <label htmlFor="summaryOfPathology" className="block text-gray-700 font-medium mb-2">
              Summary of Pathology
            </label>
            <textarea
              id="summaryOfPathology"
              name="summaryOfPathology"
              value={formData.summaryOfPathology}
              onChange={handleChange}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              placeholder="Enter summary of pathology"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save size={18} className="mr-1" />
              {loading ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CaseForm;