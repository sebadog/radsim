import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { createCase, updateCase, fetchCaseById, CaseFormData } from '../services/caseService';
import { X, Upload, Plus, AlertTriangle, Save, ArrowLeft, Lock } from 'lucide-react';

const CaseForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    clinicalInfo: '',
    expectedFindings: [''],
    additionalFindings: [''],
    summaryOfPathology: '',
    images: []
  });
  
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  useEffect(() => {
    if (isEditMode) {
      loadCase();
    }
  }, [id, isEditMode]);
  
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
        clinicalInfo: caseData.clinicalInfo,
        expectedFindings: caseData.expectedFindings.length ? caseData.expectedFindings : [''],
        additionalFindings: caseData.additionalFindings.length ? caseData.additionalFindings : [''],
        summaryOfPathology: caseData.summaryOfPathology,
        images: []
      });
      
      setExistingImages(caseData.images || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    onDrop: (acceptedFiles) => {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...acceptedFiles]
      }));
      
      // Create preview URLs for the new images
      const newPreviewUrls = acceptedFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  });
  
  const imageUrl = formData.images.length > 0 ? URL.createObjectURL(formData.images[0]) : '#';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name === 'clinicalInfo' ? 'clinicalInfo' : name]: value
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
  
  const removeImage = (index: number) => {
    const newImages = [...formData.images];
    const removedFile = newImages.splice(index, 1)[0];
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    // Find and revoke the preview URL for the removed file
    const fileUrl = URL.createObjectURL(removedFile);
    URL.revokeObjectURL(fileUrl);
    
    // Remove the preview URL
    const newPreviewUrls = [...previewUrls];
    newPreviewUrls.splice(index, 1);
    setPreviewUrls(newPreviewUrls);
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
    
    // Filter out empty array items
    const cleanedFormData = {
      ...formData,
      expectedFindings: formData.expectedFindings.filter(f => f.trim()),
      additionalFindings: formData.additionalFindings.filter(f => f.trim())
    };
    
    try {
      setLoading(true);
      setError(null);
      
      const cleanedFormData = {
        ...formData,
        expectedFindings: formData.expectedFindings.filter(f => f.trim()),
        additionalFindings: formData.additionalFindings.filter(f => f.trim())
      };
      
      if (isEditMode) {
        await updateCase(id!, formData);
      } else {
        await createCase(formData);
      }
      
      navigate('/');
    } catch (err) {
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
      
      {loading && !isEditMode ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Creating case...</p>
        </div>
      ) : loading && isEditMode ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading case data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-4">
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
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="clinicalInfo">
              Clinical Information
            </label>
            <textarea
              id="clinicalInfo"
              name="clinicalInfo"
              value={formData.clinicalInfo || ''}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows={4}
              required
            />
          </div>
          
          <div className="mb-4">
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
                  <X size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('expectedFindings')}
              className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} className="mr-1" /> Add Finding
            </button>
          </div>
          
          <div className="mb-4">
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
                  <X size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('additionalFindings')}
              className="mt-1 flex items-center text-blue-600 hover:text-blue-800"
            >
              <Plus size={16} className="mr-1" /> Add Additional Finding
            </button>
          </div>
          
          <div className="mb-4">
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