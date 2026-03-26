import { useState, useEffect } from 'react';
import { concertsApi, favoritesApi } from '../api';
import type { Concert } from '../types';
import { useUser } from '../contexts/UserContext';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

export function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dayFilter, setDayFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [favoriteConcertIds, setFavoriteConcertIds] = useState<Set<number>>(new Set());
  const [editingRatingId, setEditingRatingId] = useState<number | null>(null);
  const [ratingInput, setRatingInput] = useState('');
  const { username } = useUser();
  const isWesker = username === 'lea';

  const loadConcerts = async () => {
    setLoading(true);
    setError('');
    try {
      const params: { day?: string; stage?: string } = {};
      if (dayFilter) params.day = dayFilter;
      if (stageFilter) params.stage = stageFilter;
      const data = await concertsApi.getConcerts(params);
      setConcerts(data);
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      setError(axiosError.response?.data?.detail || 'Failed to load concerts');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favorites = await favoritesApi.getFavorites();
      setFavoriteConcertIds(new Set(favorites.map(concert => concert.id)));
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  useEffect(() => {
    loadConcerts();
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayFilter, stageFilter]);

  const handleAddFavorite = async (concertId: number) => {
    try {
      await favoritesApi.addFavorite({ concert_id: concertId });
      setFavoriteConcertIds(prev => new Set([...prev, concertId]));
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to add favorite');
    }
  };

  const handleRemoveFavorite = async (concertId: number) => {
    try {
      await favoritesApi.removeFavorite(concertId);
      setFavoriteConcertIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(concertId);
        return newSet;
      });
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to remove favorite');
    }
  };

  const handleSaveRating = async (concertId: number) => {
    const parsed = ratingInput === '' ? null : parseInt(ratingInput, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 20)) return;
    try {
      const updated = await concertsApi.updateRating(concertId, parsed);
      setConcerts(prev => prev.map(c => c.id === concertId ? { ...c, rating: updated.rating } : c));
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to save rating');
    } finally {
      setEditingRatingId(null);
    }
  };

  // Get unique days and stages for filters
  const days = [...new Set(concerts.map(c => c.festival_day || c.day))].sort();
  const stages = [...new Set(concerts.map(c => c.stage))].sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading concerts...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Concerts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse all concerts and add them to your favorites
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex gap-4">
        <div>
          <label htmlFor="day-filter" className="block text-sm font-medium text-gray-700">
            Filter by Day
          </label>
          <select
            id="day-filter"
            value={dayFilter}
            onChange={(e) => setDayFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Days</option>
            {days.map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="stage-filter" className="block text-sm font-medium text-gray-700">
            Filter by Stage
          </label>
          <select
            id="stage-filter"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Concerts List */}
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
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
                      Wesker's rating
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
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
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {isWesker && editingRatingId === concert.id ? (
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
                            className={isWesker ? 'cursor-pointer hover:text-indigo-600' : ''}
                            onClick={isWesker ? () => { setEditingRatingId(concert.id); setRatingInput(concert.rating !== null ? String(concert.rating) : ''); } : undefined}
                            title={isWesker ? 'Click to edit rating' : undefined}
                          >
                            {concert.rating !== null ? `${concert.rating}/20` : <span className="text-gray-300">—/20</span>}
                          </span>
                        )}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {favoriteConcertIds.has(concert.id) ? (
                          <button
                            onClick={() => handleRemoveFavorite(concert.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove from Favorites
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddFavorite(concert.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Add to Favorites
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {concerts.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No concerts found</p>
      )}
    </div>
  );
}
