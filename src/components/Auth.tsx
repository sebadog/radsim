import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Check, X, GraduationCap, BookOpen, Award, Brain, Stethoscope, LineChart } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Header for mobile */}
        <div className="lg:hidden bg-white shadow-sm p-6">
          <div className="max-w-sm mx-auto">
            <img 
              src="https://i.imgur.com/e4dcEWm.png" 
              alt="RadSim Logo" 
              className="h-20 mx-auto"
            />
          </div>
        </div>

        {/* Left side - Platform information */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-8 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col justify-center h-full">
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-12 transform hover:scale-105 transition-transform duration-300">
              <img 
                src="https://i.imgur.com/e4dcEWm.png" 
                alt="RadSim Logo" 
                className="h-32 mx-auto"
              />
            </div>

            <h1 className="text-4xl font-bold text-white mb-6">
              Transform Your Radiology Training
            </h1>
            
            <p className="text-xl text-blue-100 mb-12">
              Experience the next generation of interactive learning with real cases, instant feedback, and comprehensive analytics.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-500 bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-blue-400 border-opacity-20">
                <Brain className="h-8 w-8 text-blue-200 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Learning</h3>
                <p className="text-blue-100">Advanced algorithms provide personalized feedback and adaptive learning paths.</p>
              </div>
              
              <div className="bg-blue-500 bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-blue-400 border-opacity-20">
                <Stethoscope className="h-8 w-8 text-blue-200 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Clinical Focus</h3>
                <p className="text-blue-100">Real-world cases curated by experienced radiologists for practical learning.</p>
              </div>
              
              <div className="bg-blue-500 bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-blue-400 border-opacity-20">
                <LineChart className="h-8 w-8 text-blue-200 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Progress Tracking</h3>
                <p className="text-blue-100">Detailed analytics and insights to monitor your learning journey.</p>
              </div>
              
              <div className="bg-blue-500 bg-opacity-20 backdrop-blur-lg rounded-xl p-6 border border-blue-400 border-opacity-20">
                <Award className="h-8 w-8 text-blue-200 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Certification Ready</h3>
                <p className="text-blue-100">Structured learning paths aligned with certification requirements.</p>
              </div>
            </div>
          </div>
          
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" style={{ opacity: 0.9 }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
        </div>

        {/* Right side - Auth form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
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
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors duration-200"
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
                      className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10 transition-colors duration-200"
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
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white transition-all duration-200 ${
                    loading || (isSignUp && !allRequirementsMet)
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:-translate-y-0.5`}
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
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </div>
            
            <p className="mt-8 text-center text-sm text-gray-500">
              By signing {isSignUp ? 'up' : 'in'}, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Terms of Service</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}