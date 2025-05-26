import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.svg';
import { Eye, EyeOff, Check, X, GraduationCap, BookOpen, Award } from 'lucide-react';

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);
  
  const { setUser, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const requirements = [
    { text: 'At least 6 characters', met: password.length >= 6 },
    { text: 'Contains a number', met: /\d/.test(password) },
    { text: 'Contains a letter', met: /[a-zA-Z]/.test(password) },
  ];

  const allRequirementsMet = requirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp && !allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      const user = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);
      
      setUser(user);
      navigate('/');
    } catch (err: any) {
      if (err.message.includes('already registered')) {
        setError('This email is already registered. Please sign in instead.');
        setIsSignUp(false);
      } else if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Platform information */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:p-12 bg-white text-gray-800">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-8">
            <img 
              src={logo}
              alt="RadSim Logo" 
              className="h-24 mb-4"
            />
          </div>
          
          <h2 className="text-2xl font-semibold mb-6">
            Welcome to the Future of Radiology Training
          </h2>
          
          <p className="text-lg mb-8 text-blue-100">
            RadSim is an innovative platform designed to enhance radiology education through interactive case studies and real-time feedback.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <GraduationCap className="h-6 w-6 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-gray-900">Interactive Learning</h3>
                <p className="text-gray-600">Practice with real clinical cases and receive immediate, personalized feedback on your interpretations.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <BookOpen className="h-6 w-6 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-gray-900">Comprehensive Cases</h3>
                <p className="text-gray-600">Access a growing library of carefully curated cases covering various radiological findings and pathologies.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Award className="h-6 w-6 mr-4 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1 text-gray-900">Track Your Progress</h3>
                <p className="text-gray-600">Monitor your learning journey with detailed performance analytics and improvement metrics.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="lg:hidden text-center mb-8">
            <img 
              src={logo}
              alt="RadSim Logo"
              className="h-16 mx-auto mb-4"
            />
            <p className="text-gray-600">
              Welcome to the future of radiology training
            </p>
          </div>

          <div className="bg-gray-50 p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-gray-600 mb-6">
              {isSignUp 
                ? 'Start your learning journey today'
                : 'Sign in to continue your training'
              }
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex">
                  <X className="h-5 w-5 text-red-500" />
                  <p className="ml-3 text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {isSignUp && (passwordFocus || password.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Password requirements:</h4>
                  <ul className="space-y-1">
                    {requirements.map((req, index) => (
                      <li key={index} className="flex items-center text-sm">
                        {req.met ? (
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={req.met ? 'text-green-700' : 'text-red-700'}>
                          {req.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (isSignUp && !allRequirementsMet)}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading || (isSignUp && !allRequirementsMet)
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  isSignUp ? 'Create account' : 'Sign in'
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setPassword('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}