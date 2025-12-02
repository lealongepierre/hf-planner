import { useState, useEffect } from 'react';
import { favoritesApi, usersApi } from '../api';
import type { Concert } from '../types';
import { useUser } from '../contexts/UserContext';

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isPublic, setIsPublic } = useUser();

  const loadFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await favoritesApi.getFavorites();
      setFavorites(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleRemoveFavorite = async (concertId: number) => {
    try {
      await favoritesApi.removeFavorite(concertId);
      setFavorites(favorites.filter(f => f.id !== concertId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to remove favorite');
    }
  };

  const handleToggleVisibility = async () => {
    try {
      await usersApi.updateFavoritesVisibility({ public: !isPublic });
      setIsPublic(!isPublic);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update visibility');
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
            onClick={handleToggleVisibility}
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
    </div>
  );
}
