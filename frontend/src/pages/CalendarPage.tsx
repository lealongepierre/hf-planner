import { useState, useEffect } from 'react';
import { concertsApi, favoritesApi } from '../api';
import type { Concert } from '../types';

export function CalendarPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [favoriteConcertIds, setFavoriteConcertIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadConcerts();
    loadFavorites();
  }, []);

  const loadConcerts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await concertsApi.getConcerts({});
      setConcerts(data);
      if (data.length > 0 && !selectedDay) {
        const firstDay = data[0].festival_day || data[0].day;
        setSelectedDay(firstDay);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load concerts');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favorites = await favoritesApi.getFavorites();
      setFavoriteConcertIds(new Set(favorites.map(concert => concert.id)));
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, concertId: number) => {
    e.stopPropagation();
    try {
      if (favoriteConcertIds.has(concertId)) {
        await favoritesApi.removeFavorite(concertId);
        setFavoriteConcertIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(concertId);
          return newSet;
        });
      } else {
        await favoritesApi.addFavorite({ concert_id: concertId });
        setFavoriteConcertIds(prev => new Set([...prev, concertId]));
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update favorite');
    }
  };

  const days = [...new Set(concerts.map(c => c.festival_day || c.day))].sort();
  const filteredConcerts = concerts.filter(c => (c.festival_day || c.day) === selectedDay);

  const stageOrder = ['Mainstage 1', 'Mainstage 2', 'Warzone', 'Valley', 'Altar', 'Temple'];
  const allStages = [...new Set(filteredConcerts.map(c => c.stage))];
  const stages = stageOrder.filter(stage => allStages.includes(stage)).concat(
    allStages.filter(stage => !stageOrder.includes(stage))
  );

  const getTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 12; hour <= 27; hour++) {
      const displayHour = hour > 23 ? hour - 24 : hour;
      slots.push(`${displayHour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  const getConcertPosition = (concert: Concert) => {
    const [startHour, startMin] = concert.start_time.split(':').map(Number);
    const [endHour, endMin] = concert.end_time.split(':').map(Number);

    const adjustedStartHour = startHour < 12 ? startHour + 24 : startHour;
    const adjustedEndHour = endHour < 12 ? endHour + 24 : endHour;

    const startMinutes = (adjustedStartHour - 12) * 60 + startMin;
    const endMinutes = (adjustedEndHour - 12) * 60 + endMin;
    const duration = endMinutes - startMinutes;

    return {
      top: `${(startMinutes / 60) * 80}px`,
      height: `${(duration / 60) * 80}px`,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Loading calendar...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Concert Calendar</h1>
          <p className="mt-2 text-sm text-gray-700">
            View concerts by day and stage
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Day
        </label>
        <select
          id="day-select"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          {days.map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      {selectedDay && (
        <div className="mt-8 overflow-auto" style={{ maxHeight: '80vh' }}>
          <div className="inline-block align-middle" style={{ maxWidth: '100%' }}>
            <div className="relative" style={{ minHeight: '1200px', maxWidth: '1200px' }}>
              <div className="flex">
                <div className="w-16 flex-shrink-0 sticky left-0 z-10 bg-white">
                  <div className="sticky top-0 bg-white z-30 h-12 border-b border-gray-300 flex items-center justify-center font-semibold text-sm">
                    Time
                  </div>
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-20 border-b border-gray-200 flex items-start justify-end pr-2 text-xs text-gray-500 bg-white"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                <div className="flex-1 flex relative">
                  {stages.map((stage) => (
                    <div
                      key={stage}
                      className="flex-1 border-l border-gray-300"
                      style={{ position: 'relative', minWidth: '150px', maxWidth: '200px' }}
                    >
                      <div className="sticky top-0 bg-gray-50 z-20 h-12 border-b border-gray-300 flex items-center justify-center font-semibold text-sm px-2">
                        {stage}
                      </div>

                      <div className="relative" style={{ height: `${timeSlots.length * 80}px` }}>
                        {timeSlots.map((_, idx) => (
                          <div
                            key={idx}
                            className="absolute w-full h-20 border-b border-gray-100"
                            style={{ top: `${idx * 80}px` }}
                          />
                        ))}

                        {filteredConcerts
                          .filter(c => c.stage === stage)
                          .map((concert) => {
                            const position = getConcertPosition(concert);
                            const isFavorite = favoriteConcertIds.has(concert.id);
                            return (
                              <div
                                key={concert.id}
                                className="absolute w-full px-1"
                                style={{ top: position.top }}
                              >
                                <div
                                  className={`${
                                    isFavorite
                                      ? 'bg-indigo-500 border-l-4 border-indigo-700'
                                      : 'bg-indigo-100 border-l-4 border-indigo-600'
                                  } p-2 rounded shadow-sm hover:opacity-90 transition-all cursor-pointer overflow-hidden relative`}
                                  style={{ height: position.height, minHeight: '40px' }}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`font-semibold text-sm ${isFavorite ? 'text-white' : 'text-gray-900'} truncate`}
                                        title={concert.band_name}
                                      >
                                        {concert.band_name}
                                      </div>
                                      <div className={`text-xs ${isFavorite ? 'text-indigo-100' : 'text-gray-600'} mt-1`}>
                                        {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => handleToggleFavorite(e, concert.id)}
                                      className="flex-shrink-0 text-lg hover:scale-125 transition-transform"
                                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                      {isFavorite ? '⭐' : '☆'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {concerts.length === 0 && !loading && (
        <p className="mt-8 text-center text-gray-500">No concerts found</p>
      )}
    </div>
  );
}
