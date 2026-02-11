import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api';
import type { Concert } from '../types';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

export function UserFavoritesPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUserFavorites = async () => {
      if (!username) return;

      setLoading(true);
      setError('');
      try {
        const data = await usersApi.getUserFavorites(username);
        setConcerts(data);
      } catch (err) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        setError(axiosError.response?.data?.detail || 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    };

    loadUserFavorites();
  }, [username]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <button
            onClick={() => navigate('/users')}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium mb-4"
          >
            ← Back to Users
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{username}'s Favorites</h1>
          <p className="mt-2 text-sm text-gray-700">
            Concerts {username} is planning to attend
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Favorites List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            {concerts.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Band
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Day
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Time
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Stage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {concerts.map((concert) => (
                      <tr key={concert.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {concert.band_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {concert.festival_day || concert.day}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {concert.stage}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No favorites yet</p>
                <p className="text-gray-400 text-sm mt-2">{username} hasn't added any favorites</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
