import { useState, useEffect } from 'react';
import { concertsApi, favoritesApi, usersApi } from '../api';
import type { Concert, UserListResponse } from '../types';

type CalendarView = 'by-stage' | 'favorites';

export function CalendarPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [favoriteConcertIds, setFavoriteConcertIds] = useState<Set<number>>(new Set());
  const [friendsFavorites, setFriendsFavorites] = useState<Map<string, Set<number>>>(new Map());
  const [view, setView] = useState<CalendarView>('by-stage');
  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [selectedFriendUsernames, setSelectedFriendUsernames] = useState<Set<string>>(new Set());
  const [currentUsername, setCurrentUsername] = useState<string>('');

  useEffect(() => {
    loadConcerts();
    loadFavorites();
    loadUsers();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    loadAllSelectedFriendsFavorites();
  }, [selectedFriendUsernames]);

  const loadCurrentUser = async () => {
    try {
      const user = await usersApi.getCurrentUser();
      setCurrentUsername(user.username);
    } catch (err: any) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    }
  };

  const loadAllSelectedFriendsFavorites = async () => {
    const newFriendsFavorites = new Map<string, Set<number>>();

    for (const username of selectedFriendUsernames) {
      try {
        const favorites = await usersApi.getUserFavorites(username);
        newFriendsFavorites.set(username, new Set(favorites.map(concert => concert.id)));
      } catch (err: any) {
        console.error(`Failed to load favorites for ${username}:`, err);
      }
    }

    setFriendsFavorites(newFriendsFavorites);
  };

  const handleToggleFriendSelection = (username: string) => {
    setSelectedFriendUsernames(prev => {
      const newSet = new Set(prev);
      if (newSet.has(username)) {
        newSet.delete(username);
      } else {
        newSet.add(username);
      }
      return newSet;
    });
  };

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

  // Sort days in correct order (Thursday, Friday, Saturday, Sunday)
  const dayOrder = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = [...new Set(concerts.map(c => c.festival_day || c.day))].sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });
  const filteredConcerts = concerts.filter(c => (c.festival_day || c.day) === selectedDay);

  // Color mapping for each day
  const dayColors = [
    { bg: 'bg-indigo-500', border: 'border-l-4 border-l-indigo-700', text: 'text-indigo-100' },
    { bg: 'bg-emerald-500', border: 'border-l-4 border-l-emerald-700', text: 'text-emerald-100' },
    { bg: 'bg-purple-500', border: 'border-l-4 border-l-purple-700', text: 'text-purple-100' },
    { bg: 'bg-blue-500', border: 'border-l-4 border-l-blue-700', text: 'text-blue-100' },
    { bg: 'bg-red-500', border: 'border-l-4 border-l-red-700', text: 'text-red-100' },
    { bg: 'bg-orange-500', border: 'border-l-4 border-l-orange-700', text: 'text-orange-100' },
    { bg: 'bg-amber-500', border: 'border-l-4 border-l-amber-700', text: 'text-amber-100' },
    { bg: 'bg-pink-500', border: 'border-l-4 border-l-pink-700', text: 'text-pink-100' },
  ];

  const getDayColor = (day: string) => {
    const dayIndex = days.indexOf(day);
    return dayColors[dayIndex % dayColors.length];
  };

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

  // Helper to calculate overlapping concerts and their columns (Google Calendar style)
  const calculateOverlaps = (concerts: Concert[]) => {
    if (concerts.length === 0) return new Map();

    const sorted = [...concerts].sort((a, b) => {
      const [aHour, aMin] = a.start_time.split(':').map(Number);
      const [bHour, bMin] = b.start_time.split(':').map(Number);
      const aAdjusted = (aHour < 12 ? aHour + 24 : aHour) * 60 + aMin;
      const bAdjusted = (bHour < 12 ? bHour + 24 : bHour) * 60 + bMin;
      return aAdjusted - bAdjusted;
    });

    // Helper to get time in minutes
    const getMinutes = (time: string) => {
      const [hour, min] = time.split(':').map(Number);
      return (hour < 12 ? hour + 24 : hour) * 60 + min;
    };

    // Group concerts into overlap groups (concerts that share any time overlap)
    const overlapGroups: Concert[][] = [];

    for (const concert of sorted) {
      const concertStart = getMinutes(concert.start_time);
      const concertEnd = getMinutes(concert.end_time);

      // Find if this concert overlaps with any existing group
      let addedToGroup = false;
      for (const group of overlapGroups) {
        const hasOverlap = group.some(c => {
          const cStart = getMinutes(c.start_time);
          const cEnd = getMinutes(c.end_time);
          // Check if times overlap (not just touch)
          return concertStart < cEnd && concertEnd > cStart;
        });

        if (hasOverlap) {
          group.push(concert);
          addedToGroup = true;
          break;
        }
      }

      if (!addedToGroup) {
        overlapGroups.push([concert]);
      }
    }

    // Now assign columns within each overlap group
    const concertColumns = new Map<number, { column: number, totalColumns: number }>();

    for (const group of overlapGroups) {
      if (group.length === 1) {
        // Single concert, takes full width
        concertColumns.set(group[0].id, { column: 0, totalColumns: 1 });
      } else {
        // Multiple overlapping concerts - use column algorithm
        const columns: Concert[][] = [];

        for (const concert of group) {
          const concertStart = getMinutes(concert.start_time);

          let placed = false;
          for (const column of columns) {
            // Check if this concert can fit in this column (no overlap with any concert in column)
            const canFit = column.every(c => {
              const cEnd = getMinutes(c.end_time);
              return concertStart >= cEnd;
            });

            if (canFit) {
              column.push(concert);
              placed = true;
              break;
            }
          }

          if (!placed) {
            columns.push([concert]);
          }
        }

        const totalColumns = columns.length;
        columns.forEach((column, idx) => {
          column.forEach(concert => {
            concertColumns.set(concert.id, { column: idx, totalColumns });
          });
        });
      }
    }

    return concertColumns;
  };

  // Get available friends with public favorites
  const availableFriends = users.filter(
    u => u.favorites_public && u.username !== currentUsername
  );

  // Define colors for each friend (cycling through available colors)
  const friendColors = [
    { bg: 'bg-rose-400', border: 'border-l-4 border-l-rose-600', text: 'text-rose-100' },
    { bg: 'bg-cyan-400', border: 'border-l-4 border-l-cyan-600', text: 'text-cyan-100' },
    { bg: 'bg-lime-400', border: 'border-l-4 border-l-lime-600', text: 'text-lime-100' },
    { bg: 'bg-fuchsia-400', border: 'border-l-4 border-l-fuchsia-600', text: 'text-fuchsia-100' },
    { bg: 'bg-teal-400', border: 'border-l-4 border-l-teal-600', text: 'text-teal-100' },
  ];

  const getFriendColor = (username: string) => {
    const friendIndex = availableFriends.findIndex(f => f.username === username);
    return friendColors[friendIndex % friendColors.length];
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

      <div className="mt-6 flex gap-6 items-end flex-wrap">
        <div>
          <label htmlFor="view-select" className="block text-sm font-medium text-gray-700 mb-2">
            View
          </label>
          <select
            id="view-select"
            value={view}
            onChange={(e) => setView(e.target.value as CalendarView)}
            className="block w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="by-stage">By Stage</option>
            <option value="favorites">My Favorites</option>
          </select>
        </div>

        {view === 'by-stage' && (
          <div>
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
        )}

        {view === 'favorites' && availableFriends.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overlay Friends' Calendars
            </label>
            <div className="flex flex-wrap gap-4">
              {availableFriends.map(user => (
                <label key={user.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFriendUsernames.has(user.username)}
                    onChange={() => handleToggleFriendSelection(user.username)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">👤 {user.username}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {view === 'by-stage' && selectedDay && (
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
                      <div className="sticky top-0 bg-gray-50 z-20 h-12 border-b border-gray-300 flex items-center justify-center font-semibold text-sm px-2 shadow-sm">
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
                                        title={`${concert.band_name} - ${concert.start_time.slice(0, 5)}-${concert.end_time.slice(0, 5)}`}
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

      {view === 'favorites' && (
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
                  {days.map((day) => {
                    // Collect ALL unique concerts that are favorited by user or any friend
                    const concertIdSet = new Set<number>();

                    // Add user's favorites
                    concerts
                      .filter(c => (c.festival_day || c.day) === day && favoriteConcertIds.has(c.id))
                      .forEach(c => concertIdSet.add(c.id));

                    // Add friends' favorites
                    for (const [username, favIds] of friendsFavorites.entries()) {
                      concerts
                        .filter(c => (c.festival_day || c.day) === day && favIds.has(c.id))
                        .forEach(c => concertIdSet.add(c.id));
                    }

                    // Get unique concert objects
                    const allDayConcerts = concerts.filter(c => concertIdSet.has(c.id));
                    const overlaps = calculateOverlaps(allDayConcerts);
                    const dayColor = getDayColor(day);

                    return (
                      <div
                        key={day}
                        className="flex-1 border-l border-gray-300"
                        style={{ position: 'relative', minWidth: '400px', maxWidth: '500px' }}
                      >
                        <div className="sticky top-0 bg-gray-50 z-20 h-12 border-b border-gray-300 flex items-center justify-center font-semibold text-sm px-2 shadow-sm">
                          {day}
                        </div>

                        <div className="relative" style={{ height: `${timeSlots.length * 80}px` }}>
                          {timeSlots.map((_, idx) => (
                            <div
                              key={idx}
                              className="absolute w-full h-20 border-b border-gray-100"
                              style={{ top: `${idx * 80}px` }}
                            />
                          ))}

                          {allDayConcerts.map((concert) => {
                            const position = getConcertPosition(concert);
                            const overlap = overlaps.get(concert.id);
                            const widthPercent = overlap ? 100 / overlap.totalColumns : 100;
                            const leftPercent = overlap ? (overlap.column * widthPercent) : 0;
                            const isUserFavorite = favoriteConcertIds.has(concert.id);

                            // Find ALL friends who have favorited this concert
                            const friendsWhoFavorited: string[] = [];
                            for (const [username, favIds] of friendsFavorites.entries()) {
                              if (favIds.has(concert.id)) {
                                friendsWhoFavorited.push(username);
                              }
                            }

                            // Determine color based on ownership
                            let bgColor = dayColor.bg;
                            let borderColor = dayColor.border;
                            let textColor = dayColor.text;
                            let opacity = '';

                            if (friendsWhoFavorited.length > 0 && !isUserFavorite) {
                              // Friend's favorite only - use first friend's color
                              const friendColor = getFriendColor(friendsWhoFavorited[0]);
                              bgColor = friendColor.bg;
                              borderColor = friendColor.border;
                              textColor = friendColor.text;
                              opacity = 'opacity-80';
                            }

                            return (
                              <div
                                key={concert.id}
                                className="absolute px-1"
                                style={{
                                  top: position.top,
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                              >
                                <div
                                  className={`${bgColor} ${opacity} border border-white ${borderColor} p-2 rounded shadow-sm hover:opacity-90 transition-all cursor-pointer overflow-hidden relative`}
                                  style={{ height: position.height, minHeight: '60px' }}
                                >
                                  <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between gap-1 mb-1">
                                      <div
                                        className="font-semibold text-sm text-white truncate flex-1"
                                        title={`${concert.band_name} - ${concert.stage} - ${concert.start_time.slice(0, 5)}-${concert.end_time.slice(0, 5)}${friendsWhoFavorited.length > 0 ? ` (also favorited by: ${friendsWhoFavorited.join(', ')})` : ''}`}
                                      >
                                        {concert.band_name}
                                      </div>
                                      {isUserFavorite && (
                                        <button
                                          onClick={(e) => handleToggleFavorite(e, concert.id)}
                                          className="flex-shrink-0 text-base hover:scale-125 transition-transform"
                                          title="Remove from favorites"
                                        >
                                          ⭐
                                        </button>
                                      )}
                                      {!isUserFavorite && friendsWhoFavorited.length > 0 && (
                                        <button
                                          onClick={(e) => handleToggleFavorite(e, concert.id)}
                                          className="flex-shrink-0 text-base hover:scale-125 transition-transform"
                                          title="Add to your favorites"
                                        >
                                          ☆
                                        </button>
                                      )}
                                    </div>
                                    <div className={`text-xs ${textColor} truncate`} title={concert.stage}>
                                      {concert.stage}
                                    </div>
                                    <div className={`text-xs ${textColor}`}>
                                      {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                                    </div>
                                    {friendsWhoFavorited.length > 0 && (
                                      <div className={`text-xs ${textColor} italic mt-0.5`}>
                                        {isUserFavorite ? '👥 ' : ''}{friendsWhoFavorited.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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
