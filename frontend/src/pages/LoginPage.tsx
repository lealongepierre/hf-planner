import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { authUtils } from '../utils/auth';
import type { AxiosError } from 'axios';

interface ValidationError {
  loc?: (string | number)[];
  msg?: string;
}

interface ApiErrorResponse {
  detail?: string | ValidationError[];
}

export function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        await authApi.signup({ username, password, access_code: accessCode || undefined });
        // After signup, automatically sign in
        const tokenResponse = await authApi.signin({ username, password });
        authUtils.setToken(tokenResponse.access_token);
        navigate('/concerts');
      } else {
        const tokenResponse = await authApi.signin({ username, password });
        authUtils.setToken(tokenResponse.access_token);
        navigate('/concerts');
      }
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      console.error('Login error:', err);
      console.error('Error response:', axiosError.response);

      // Handle different error formats
      let errorMessage = 'Authentication failed';

      if (axiosError.response?.data?.detail) {
        const detail = axiosError.response.data.detail;

        // Check if detail is an array (validation errors)
        if (Array.isArray(detail)) {
          // Extract validation error messages with field names
          errorMessage = detail.map((validationErr: ValidationError) => {
            const field = validationErr.loc?.[validationErr.loc.length - 1] || 'field';
            const msg = validationErr.msg || 'Invalid value';
            // Capitalize field name and replace "String" with field name in message
            const capitalizedField = String(field).charAt(0).toUpperCase() + String(field).slice(1);
            return msg.replace(/String/g, capitalizedField);
          }).join(', ');
        } else if (typeof detail === 'string') {
          // String error from custom exceptions
          errorMessage = detail;
        }
      } else if (axiosError.message) {
        errorMessage = axiosError.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          🔥 Hellfest Planner 🔥
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignup ? 'Create your account' : 'Sign in to your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                  Access Code
                </label>
                <div className="mt-1">
                  <input
                    id="accessCode"
                    name="accessCode"
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter the shared access code"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Loading...' : (isSignup ? 'Sign up' : 'Sign in')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              onClick={() => { setIsSignup(!isSignup); setAccessCode(''); }}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
