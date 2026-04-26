import { useState, useEffect } from 'react';
import { concertsApi, favoritesApi } from '../api';
import type { Concert } from '../types';
import { useUser } from '../contexts/UserContext';
import { PushSettings } from '../components/PushSettings';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRatingId, setEditingRatingId] = useState<number | null>(null);
  const [ratingInput, setRatingInput] = useState('');
  const [raterUsername, setRaterUsername] = useState('');
  const { isPublic, toggleVisibility, username } = useUser();
  const isRater = username !== '' && username === raterUsername;

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    concertsApi.getRaterUsername().then(setRaterUsername).catch(() => {});
    loadFavorites();
  }, []);

  const handleSaveRating = async (concertId: number) => {
    const parsed = ratingInput === '' ? null : parseInt(ratingInput, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 20)) return;
    try {
      const updated = await concertsApi.updateRating(concertId, parsed);
      setFavorites(prev => prev.map(c => c.id === concertId ? { ...c, rating: updated.rating } : c));
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to save rating');
    } finally {
      setEditingRatingId(null);
    }
  };

  const handleRemoveFavorite = async (concertId: number) => {
    try {
      await favoritesApi.removeFavorite(concertId);
      setFavorites(favorites.filter(f => f.id !== concertId));
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to remove favorite');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="mt-2 text-sm text-gray-700">
            Your favorite concerts for the festival
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={toggleVisibility}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isPublic ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
          >
            {isPublic ? '🔓 Public' : '🔒 Private'}
          </button>
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
            {favorites.length > 0 ? (
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
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        {raterUsername ? `${raterUsername}'s rating` : 'Rating'}
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {favorites.map((concert) => (
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {isRater && editingRatingId === concert.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={20}
                                value={ratingInput}
                                onChange={(e) => setRatingInput(e.target.value)}
                                onBlur={() => handleSaveRating(concert.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRating(concert.id);
                                  if (e.key === 'Escape') setEditingRatingId(null);
                                }}
                                className="w-14 border border-gray-300 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                autoFocus
                              />
                              <span className="text-gray-400">/20</span>
                            </div>
                          ) : (
                            <span
                              className={isRater ? 'cursor-pointer hover:text-indigo-600' : ''}
                              onClick={isRater ? () => { setEditingRatingId(concert.id); setRatingInput(concert.rating !== null ? String(concert.rating) : ''); } : undefined}
                              title={isRater ? 'Click to edit rating' : undefined}
                            >
                              {concert.rating !== null ? `${concert.rating}/20` : <span className="text-gray-300">—/20</span>}
                            </span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => handleRemoveFavorite(concert.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No favorites yet</p>
                <p className="text-gray-400 text-sm mt-2">Browse concerts and add some to your favorites!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <PushSettings />
      </div>
    </div>
  );
}
