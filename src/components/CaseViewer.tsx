import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Award, MessageSquare, ArrowLeft, Loader2, Eye, RefreshCw, CheckCircle, Circle, Lock, Clock, Calendar, User } from 'lucide-react';
import { fetchCaseById, fetchCases, markCaseAsCompleted } from '../services/caseService';
import { cases as defaultCases } from '../data/cases';
import { generateFeedback } from '../services/openRouterService';

function CaseViewer() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  
  const [currentCase, setCurrentCase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [allCases, setAllCases] = useState(defaultCases);
  
  // State for attempts
  const [firstAttempt, setFirstAttempt] = useState('');
  const [firstAttemptFeedback, setFirstAttemptFeedback] = useState<string | null>(null);
  const [secondAttempt, setSecondAttempt] = useState('');
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1);
  
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showExpectedImpression, setShowExpectedImpression] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [showTeachingPoints, setShowTeachingPoints] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [completionUpdating, setCompletionUpdating] = useState(false);

  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    setApiKeyMissing(!apiKey);
    
    // Reset state when case changes
    setFirstAttempt('');
    setFirstAttemptFeedback(null);
    setSecondAttempt('');
    setCurrentAttemptNumber(1);
    setFeedback(null);
    setShowExpectedImpression(false);
    setScore(null);
    setShowTeachingPoints(false);
    setGaveUp(false);
    
    const loadCase = async () => {
      try {
        setLoading(true);
        const caseData = await fetchCaseById(caseId!);
        
        if (caseData) {
          setCurrentCase(caseData);
          
          const allCasesData = await fetchCases();
          setAllCases(allCasesData);
          const index = allCasesData.findIndex(c => c.id === caseId);
          if (index !== -1) {
            setCurrentCaseIndex(index);
          }
        } else {
          setError('Case not found');
        }
      } catch (err: any) {
        console.error('Error loading case:', err);
        setError('Failed to load case data');
      } finally {
        setLoading(false);
      }
    };
    
    loadCase();
  }, [caseId]);

  const handleSubmitImpression = async () => {
    const currentAttemptText = currentAttemptNumber === 1 ? firstAttempt : secondAttempt;
    
    if (!currentAttemptText.trim()) {
      alert('Please enter your impression before submitting.');
      return;
    }
    
    if (apiKeyMissing) {
      alert('OpenRouter API key is missing. Please add your API key to continue.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await generateFeedback({
        userImpression: currentAttemptText,
        expectedFindings: currentCase?.expectedFindings || [],
        caseTitle: currentCase?.title || '',
        clinicalInfo: currentCase?.clinical_info || '',
        summaryOfPathology: currentCase?.summary_of_pathology || ''
      });
      
      if (currentAttemptNumber === 1) {
        setFirstAttemptFeedback(result.feedback);
        setCurrentAttemptNumber(2);
      } else {
        setFeedback(result.feedback);
        setScore(result.score);
        setShowExpectedImpression(result.score === 100);
        setShowTeachingPoints(result.score === 100);
      }
    } catch (error: any) {
      console.error('Error submitting impression:', error);
      setFeedback(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCompleted = async () => {
    try {
      setCompletionUpdating(true);
      const newCompletedStatus = !(currentCase?.completed || false);
      await markCaseAsCompleted(caseId!, newCompletedStatus);
      setCurrentCase({
        ...currentCase,
        completed: newCompletedStatus
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update case status');
    } finally {
      setCompletionUpdating(false);
    }
  };

  const handleGiveUp = () => {
    setGaveUp(true);
    setShowExpectedImpression(true);
    setShowTeachingPoints(true);
    setScore(0);
  };

  const resetCase = () => {
    setFirstAttempt('');
    setFirstAttemptFeedback(null);
    setSecondAttempt('');
    setCurrentAttemptNumber(1);
    setFeedback(null);
    setShowExpectedImpression(false);
    setScore(null);
    setShowTeachingPoints(false);
    setGaveUp(false);
  };

  const nextCase = () => {
    if (currentCaseIndex < allCases.length - 1) {
      navigate(`/case/${allCases[currentCaseIndex + 1].id}`);
    }
  };

  const prevCase = () => {
    if (currentCaseIndex > 0) {
      navigate(`/case/${allCases[currentCaseIndex - 1].id}`);
    }
  };

  if (loading) {
    return (
      <div className="p-6 mb-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading case...</p>
        </div>
      </div>
    );
  }

  if (error || !currentCase) {
    return (
      <div className="p-6 mb-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error || 'Case not found'}</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold">Case: {currentCase?.title}</h2>
          
          {currentCase?.completed && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle size={12} className="mr-1" /> Completed
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button 
            onClick={handleToggleCompleted}
            disabled={completionUpdating}
            className={`px-3 py-1.5 rounded-md flex items-center ${
              completionUpdating 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : currentCase?.completed 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {completionUpdating ? (
              <Loader2 size={16} className="mr-1.5 animate-spin" />
            ) : currentCase?.completed ? (
              <Circle size={16} className="mr-1.5" />
            ) : (
              <CheckCircle size={16} className="mr-1.5" />
            )}
            {currentCase?.completed ? 'Mark as Incomplete' : 'Mark as Completed'}
          </button>
          
          <button 
            onClick={prevCase}
            disabled={currentCaseIndex === 0}
            className={`p-2 rounded ${currentCaseIndex === 0 ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextCase}
            disabled={currentCaseIndex === allCases.length - 1}
            className={`p-2 rounded ${currentCaseIndex === allCases.length - 1 ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {apiKeyMissing && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          <p className="font-medium">OpenRouter API Key Missing</p>
          <p className="text-sm">Please add your OpenRouter API key to the .env file as VITE_OPENROUTER_API_KEY to enable AI feedback.</p>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-medium text-gray-700 mb-2">Clinical Information:</h3>
        <p className="bg-gray-50 p-3 rounded">{currentCase?.clinicalInfo || currentCase?.clinical_info}</p>
      </div>

      <div className="w-full max-w-2xl mx-auto">
        {/* First Attempt (if completed) */}
        {firstAttemptFeedback && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">First Attempt:</h3>
            <div className="bg-gray-50 p-3 rounded mb-2">
              <p className="italic">{firstAttempt}</p>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex">
                <MessageSquare className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
                <p className="whitespace-pre-line">{firstAttemptFeedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Attempt Input */}
        {!gaveUp && currentAttemptNumber <= 2 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">
              {currentAttemptNumber === 1 ? 'Your Impression:' : 'Second Attempt:'}
            </h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={6}
              value={currentAttemptNumber === 1 ? firstAttempt : secondAttempt}
              onChange={(e) => currentAttemptNumber === 1 
                ? setFirstAttempt(e.target.value) 
                : setSecondAttempt(e.target.value)
              }
              placeholder="Enter your diagnostic impression here..."
              disabled={isLoading}
            ></textarea>
            <button
              onClick={handleSubmitImpression}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Processing...
                </>
              ) : (
                'Submit Impression'
              )}
            </button>
          </div>
        )}

        {/* Final Feedback */}
        {feedback && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Final Feedback:</h3>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex">
                <MessageSquare className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
                <p className="whitespace-pre-line">{feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expected Findings */}
        {showExpectedImpression && currentCase?.expectedFindings && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Expected Findings:</h3>
            <div className="bg-gray-50 p-3 rounded">
              <ul className="list-disc pl-5 space-y-1">
                {currentCase.expectedFindings.map((finding: string, index: number) => (
                  <li key={index}>{finding}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Teaching Points */}
        {showTeachingPoints && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Teaching Points:</h3>
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <h4 className="font-medium mb-2">Summary of Pathology:</h4>
              <p>{currentCase?.summaryOfPathology || currentCase?.summary_of_pathology}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {!gaveUp && currentAttemptNumber <= 2 && !showTeachingPoints && (
            <button
              onClick={handleGiveUp}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 flex items-center"
            >
              <Eye className="mr-2" size={18} />
              Show Answer
            </button>
          )}
          
          <button
            onClick={resetCase}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reset Case
          </button>
          
          <button
            onClick={handleToggleCompleted}
            disabled={completionUpdating}
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 flex items-center ${
              completionUpdating 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                : currentCase?.completed 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500' 
                  : 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
            }`}
          >
            {completionUpdating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={18} />
                Updating...
              </>
            ) : currentCase?.completed ? (
              <>
                <Circle className="mr-2" size={18} />
                Mark as Incomplete
              </>
            ) : (
              <>
                <CheckCircle className="mr-2" size={18} />
                Mark as Completed
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CaseViewer;