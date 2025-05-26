import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { resetPassword, updatePassword } from '../services/authService';
import { Brain, X, Check } from 'lucide-react';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're in the update password phase
  const isUpdatePhase = location.pathname.includes('/update');

  useEffect(() => {
    // Check for recovery token in URL
    const fragment = window.location.hash;
    if (fragment.includes('type=recovery')) {
      navigate('/reset-password/update', { replace: true });
    }
  }, [navigate]);

  const requirements = [
    { text: 'At least 6 characters', met: newPassword.length >= 6 },
    { text: 'Contains a number', met: /\d/.test(newPassword) },
    { text: 'Contains a letter', met: /[a-zA-Z]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isUpdatePhase) {
        if (!allRequirementsMet) {
          setError('Please meet all password requirements');
          return;
        }
        await updatePassword(newPassword);
        setSuccess(true);
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        await resetPassword(email);
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Brain className="h-12 w-12 text-white mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white">
            {isUpdatePhase ? 'Set New Password' : 'Reset Password'}
          </h2>
          <p className="mt-2 text-blue-100">
            {isUpdatePhase
              ? 'Please enter your new password'
              : 'Enter your email to receive a password reset link'}
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <X className="h-5 w-5 text-red-500" />
                <p className="ml-3 text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {isUpdatePhase ? 'Password Updated!' : 'Check Your Email'}
              </h3>
              <p className="text-blue-100">
                {isUpdatePhase
                  ? 'Your password has been successfully updated. Redirecting to login...'
                  : 'We have sent a password reset link to your email address.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {isUpdatePhase ? (
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-white">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your new password"
                    required
                  />
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-white">Password requirements:</h4>
                    <ul className="space-y-1">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm">
                          {req.met ? (
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <X className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className={req.met ? 'text-green-400' : 'text-red-400'}>
                            {req.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading || (isUpdatePhase && !allRequirementsMet)}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white transition-all duration-200 ${
                    loading || (isUpdatePhase && !allRequirementsMet)
                      ? 'bg-green-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
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
                    isUpdatePhase ? 'Update Password' : 'Send Reset Link'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="mt-4 w-full text-center text-sm text-white hover:text-blue-200"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}