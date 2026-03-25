import { useState, useEffect, useMemo } from 'react';
import { concertsApi, favoritesApi, usersApi } from '../api';
import type { Concert, UserListResponse } from '../types';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  detail?: string;
}

type CalendarView = 'by-stage' | 'favorites' | 'shared-favorites';

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
  const [friendsPopup, setFriendsPopup] = useState<{ concertId: number; bandName: string } | null>(null);
  const [concertInfoPopup, setConcertInfoPopup] = useState<{ bandName: string; startTime: string; endTime: string; stage: string; rating: number | null } | null>(null);

  useEffect(() => {
    loadConcerts();
    loadFavorites();
    loadUsers();
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAllFriendsFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, currentUsername]);

  const loadCurrentUser = async () => {
    try {
      const user = await usersApi.getCurrentUser();
      setCurrentUsername(user.username);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadAllFriendsFavorites = async () => {
    // Get all friends with public favorites
    const friendsWithPublicFavorites = users.filter(
      u => u.favorites_public && u.username !== currentUsername
    );

    const newFriendsFavorites = new Map<string, Set<number>>();

    for (const user of friendsWithPublicFavorites) {
      try {
        const favorites = await usersApi.getUserFavorites(user.username);
        newFriendsFavorites.set(user.username, new Set(favorites.map(concert => concert.id)));
      } catch (err) {
        console.error(`Failed to load favorites for ${user.username}:`, err);
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
        const dayOrder = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
        const availableDays = new Set(data.map(c => c.festival_day || c.day));
        const firstDay = dayOrder.find(d => availableDays.has(d)) ?? (data[0].festival_day || data[0].day);
        setSelectedDay(firstDay);
      }
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
    } catch (err) {
      const axiosError = err as AxiosError<ApiErrorResponse>;
      alert(axiosError.response?.data?.detail || 'Failed to update favorite');
    }
  };

  // Sort days in correct order (Thursday, Friday, Saturday, Sunday)
  const dayOrder = ['Thursday', 'Friday', 'Saturday', 'Sunday'];
  const days = [...new Set(concerts.map(c => c.festival_day || c.day))].sort((a, b) => {
    return dayOrder.indexOf(a) - dayOrder.indexOf(b);
  });
  const filteredConcerts = concerts.filter(c => (c.festival_day || c.day) === selectedDay);

  const stageOrder = ['Mainstage 1', 'Mainstage 2', 'Warzone', 'Valley', 'Altar', 'Temple'];
  const allStages = [...new Set(filteredConcerts.map(c => c.stage))];
  const stages = stageOrder.filter(stage => allStages.includes(stage)).concat(
    allStages.filter(stage => !stageOrder.includes(stage))
  );

  const getTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 10; hour <= 27; hour++) {
      const displayHour = hour > 23 ? hour - 24 : hour;
      slots.push(`${displayHour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  // Helper to convert time string to minutes since midnight.
  // Hours < 6 are after-midnight sets (00:xx, 01:xx, ...) and get +24h offset.
  const getMinutes = (time: string) => {
    const [hour, min] = time.split(':').map(Number);
    return (hour < 6 ? hour + 24 : hour) * 60 + min;
  };

  const getConcertPosition = (concert: Concert) => {
    const startMinutes = getMinutes(concert.start_time) - (10 * 60);
    const endMinutes = getMinutes(concert.end_time) - (10 * 60);
    const duration = endMinutes - startMinutes;

    const heightPx = Math.max((duration / 60) * 80, 20);
    return {
      top: `${(startMinutes / 60) * 80}px`,
      height: `${heightPx}px`,
      heightPx,
    };
  };

  // Helper to calculate overlapping concerts and their columns (Google Calendar style)
  const calculateOverlaps = (concerts: Concert[]) => {
    if (concerts.length === 0) return new Map();

    const sorted = [...concerts].sort((a, b) => {
      const aMinutes = getMinutes(a.start_time);
      const bMinutes = getMinutes(b.start_time);
      return aMinutes - bMinutes;
    });

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

  // User's color (always first)
  const userColor = { bg: 'bg-indigo-500', border: 'border-l-4 border-l-indigo-700', text: 'text-indigo-100' };

  // Define colors for each friend (cycling through available colors)
  const friendColors = [
    { bg: 'bg-emerald-500', border: 'border-l-4 border-l-emerald-700', text: 'text-emerald-100' },
    { bg: 'bg-purple-500', border: 'border-l-4 border-l-purple-700', text: 'text-purple-100' },
    { bg: 'bg-teal-400', border: 'border-l-4 border-l-teal-600', text: 'text-teal-100' },
    { bg: 'bg-blue-500', border: 'border-l-4 border-l-blue-700', text: 'text-blue-100' },
  ];

  const getFriendColor = (username: string) => {
    const friendIndex = availableFriends.findIndex(f => f.username === username);
    return friendColors[friendIndex % friendColors.length];
  };

  const getUsersWhoFavorited = (concertId: number) => {
    const users: Array<{ username: string, isCurrentUser: boolean }> = [];

    // Add current user first if they favorited it
    if (favoriteConcertIds.has(concertId)) {
      users.push({ username: currentUsername || 'You', isCurrentUser: true });
    }

    // Add friends who favorited it (only if they are selected in overlay)
    for (const [username, favIds] of friendsFavorites.entries()) {
      if (selectedFriendUsernames.has(username) && favIds.has(concertId)) {
        users.push({ username, isCurrentUser: false });
      }
    }

    return users;
  };

  const getAllFriendsWhoFavorited = (concertId: number): string[] => {
    const friends: string[] = [];

    // Get ALL friends who favorited it (regardless of selection)
    for (const [username, favIds] of friendsFavorites.entries()) {
      if (favIds.has(concertId)) {
        friends.push(username);
      }
    }

    return friends;
  };

  const formatFriendsText = (friends: string[], maxLength: number = 25): { text: string, isTruncated: boolean } => {
    if (friends.length === 0) return { text: '', isTruncated: false };

    const fullText = friends.join(', ');
    if (fullText.length <= maxLength) {
      return { text: fullText, isTruncated: false };
    }

    return { text: fullText.slice(0, maxLength) + '...', isTruncated: true };
  };

  // Pre-compute shared concert IDs once for all days (performance optimization)
  // This avoids recalculating the intersection for each day separately
  const sharedConcertIds = useMemo(() => {
    const shared = new Set<number>();

    if (selectedFriendUsernames.size === 0) {
      // No friends selected - all user's favorites are "shared"
      return favoriteConcertIds;
    }

    // Edge case: If a selected friend's favorites_public becomes false after being selected,
    // their favorites data may be stale. Currently we don't handle this dynamically - the user
    // would need to deselect and reselect the friend to refresh their data.

    // Start with user's favorites across all days
    concerts
      .filter(c => favoriteConcertIds.has(c.id))
      .forEach(concert => {
        // Check if ALL selected friends also favorited this concert
        const allFriendsHaveIt = Array.from(selectedFriendUsernames).every(username => {
          const friendFavs = friendsFavorites.get(username);
          return friendFavs && friendFavs.has(concert.id);
        });

        if (allFriendsHaveIt) {
          shared.add(concert.id);
        }
      });

    return shared;
  }, [selectedFriendUsernames, favoriteConcertIds, friendsFavorites, concerts]);

  const getSharedFavoriteConcerts = (day: string): Concert[] => {
    return concerts.filter(c =>
      (c.festival_day || c.day) === day && sharedConcertIds.has(c.id)
    );
  };

  // Helper functions for event handlers
  const handleShowConcertInfo = (e: React.MouseEvent, concert: Concert) => {
    e.stopPropagation();
    setConcertInfoPopup({
      bandName: concert.band_name,
      startTime: concert.start_time,
      endTime: concert.end_time,
      stage: concert.stage,
      rating: concert.rating,
    });
  };

  const handleShowFriendsPopup = (e: React.MouseEvent, concertId: number, bandName: string) => {
    e.stopPropagation();
    setFriendsPopup({ concertId, bandName });
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
            <option value="shared-favorites">Shared Favorites</option>
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

        {(view === 'favorites' || view === 'shared-favorites') && availableFriends.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {view === 'favorites' ? "Overlay Friends' Calendars" : "Select Friends to Find Shared Concerts"}
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
                  <span className="text-sm text-gray-700">{user.username}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {view === 'favorites' && selectedFriendUsernames.size > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-indigo-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">{currentUsername || 'You'}</span>
          </div>
          {Array.from(selectedFriendUsernames).map(username => {
            const color = getFriendColor(username);
            return (
              <div key={username} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color.bg} flex-shrink-0`} />
                <span className="text-sm text-gray-700">{username}</span>
              </div>
            );
          })}
        </div>
      )}

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
                            const friendsList = getAllFriendsWhoFavorited(concert.id);
                            const friendsDisplay = formatFriendsText(friendsList);

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
                                  } p-2 rounded shadow-sm hover:opacity-90 transition-all overflow-hidden relative`}
                                  style={{ height: position.height, minHeight: '40px' }}
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={(e) => handleShowConcertInfo(e, concert)}
                                    >
                                      <div
                                        className={`font-semibold text-sm ${isFavorite ? 'text-white' : 'text-gray-900'} truncate hover:underline`}
                                      >
                                        {concert.band_name}
                                      </div>
                                      <div className={`text-xs ${isFavorite ? 'text-indigo-100' : 'text-gray-600'} mt-1`}>
                                        {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                                      </div>
                                      {currentUsername === 'Wesker' && position.heightPx >= 80 && concert.rating !== null && (
                                        <div className={`text-xs font-medium mt-1 ${isFavorite ? 'text-yellow-300' : 'text-yellow-600'}`}>
                                          ★ {concert.rating}/20
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => handleToggleFavorite(e, concert.id)}
                                      className="flex-shrink-0 text-lg hover:scale-125 transition-transform cursor-pointer"
                                      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                    >
                                      {isFavorite ? '⭐' : '☆'}
                                    </button>
                                  </div>

                                  {/* Friend indicator */}
                                  {friendsList.length > 0 && (
                                    <div
                                      className="absolute bottom-1 right-1 text-xs text-gray-400 cursor-pointer hover:text-gray-600"
                                      onClick={(e) => handleShowFriendsPopup(e, concert.id, concert.band_name)}
                                    >
                                      👥 {friendsDisplay.text}
                                    </div>
                                  )}
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
                    // Collect ALL unique concerts that are favorited by user or selected friends
                    const concertIdSet = new Set<number>();

                    // Add user's favorites
                    concerts
                      .filter(c => (c.festival_day || c.day) === day && favoriteConcertIds.has(c.id))
                      .forEach(c => concertIdSet.add(c.id));

                    // Add selected friends' favorites only
                    for (const [username, favIds] of friendsFavorites.entries()) {
                      if (selectedFriendUsernames.has(username)) {
                        concerts
                          .filter(c => (c.festival_day || c.day) === day && favIds.has(c.id))
                          .forEach(c => concertIdSet.add(c.id));
                      }
                    }

                    // Get unique concert objects
                    const allDayConcerts = concerts.filter(c => concertIdSet.has(c.id));
                    const overlaps = calculateOverlaps(allDayConcerts);

                    return (
                      <div
                        key={day}
                        className="flex-1 border-l border-gray-300"
                        style={{ position: 'relative', minWidth: '300px', maxWidth: '500px' }}
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

                            // Get all users who favorited this concert (user first, then friends)
                            const usersWhoFavorited = getUsersWhoFavorited(concert.id);

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
                                {/* Single block with horizontal color sections for all users */}
                                <div
                                  className="relative border border-white rounded shadow-sm hover:opacity-90 transition-all overflow-hidden flex"
                                  style={{ height: position.height, minHeight: '20px' }}
                                >
                                  {usersWhoFavorited.map((user, idx) => {
                                    const color = user.isCurrentUser ? userColor : getFriendColor(user.username);
                                    const sectionWidth = `${100 / usersWhoFavorited.length}%`;

                                    return (
                                      <div
                                        key={`${concert.id}-section-${user.username}`}
                                        className={`${color.bg} h-full relative`}
                                        style={{ width: sectionWidth }}
                                      >
                                        {/* Only show content on the first section */}
                                        {idx === 0 && (
                                          <div className="absolute inset-0 p-2 z-10" style={{ width: `${100 * usersWhoFavorited.length}%` }}>
                                            <div className="flex flex-col h-full">
                                              <div className="flex items-start justify-between gap-1 mb-1">
                                                <div
                                                  className="font-semibold text-sm text-white truncate flex-1 cursor-pointer hover:underline"
                                                  onClick={(e) => handleShowConcertInfo(e, concert)}
                                                >
                                                  {concert.band_name}
                                                </div>
                                                {isUserFavorite && (
                                                  <button
                                                    onClick={(e) => handleToggleFavorite(e, concert.id)}
                                                    className="flex-shrink-0 text-base hover:scale-125 transition-transform cursor-pointer"
                                                    title="Remove from favorites"
                                                  >
                                                    ⭐
                                                  </button>
                                                )}
                                                {!isUserFavorite && usersWhoFavorited.length > 0 && (
                                                  <button
                                                    onClick={(e) => handleToggleFavorite(e, concert.id)}
                                                    className="flex-shrink-0 text-base hover:scale-125 transition-transform cursor-pointer"
                                                    title="Add to your favorites"
                                                  >
                                                    ☆
                                                  </button>
                                                )}
                                              </div>
                                              {position.heightPx >= 80 && (
                                                <div className="text-xs text-white truncate" title={concert.stage}>
                                                  {concert.stage}
                                                </div>
                                              )}
                                              <div className="text-xs text-white">
                                                {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                                              </div>
                                              {currentUsername === 'Wesker' && position.heightPx >= 80 && concert.rating !== null && (
                                                <div className="text-xs font-medium text-yellow-300 mt-1">
                                                  ★ {concert.rating}/20
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
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

      {view === 'shared-favorites' && (
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
                    const sharedConcerts = getSharedFavoriteConcerts(day);
                    const overlaps = calculateOverlaps(sharedConcerts);

                    return (
                      <div
                        key={day}
                        className="flex-1 border-l border-gray-300"
                        style={{ position: 'relative', minWidth: '300px', maxWidth: '500px' }}
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

                          {sharedConcerts.length === 0 ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center text-gray-400 px-4">
                                <p className="text-sm">
                                  {selectedFriendUsernames.size === 0
                                    ? 'No favorites yet'
                                    : 'No shared concerts'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            sharedConcerts.map((concert) => {
                              const position = getConcertPosition(concert);
                              const overlap = overlaps.get(concert.id);
                              const widthPercent = overlap ? 100 / overlap.totalColumns : 100;
                              const leftPercent = overlap ? (overlap.column * widthPercent) : 0;
                              // Note: This check is redundant (always true) in shared-favorites view since
                              // sharedConcerts only contains concerts the user has favorited. Kept for consistency.
                              const isUserFavorite = favoriteConcertIds.has(concert.id);
                              const friendsList = getAllFriendsWhoFavorited(concert.id);
                              const friendsDisplay = formatFriendsText(friendsList);

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
                                    className={`${userColor.bg} ${userColor.border} p-2 rounded shadow-sm hover:opacity-90 transition-all overflow-hidden`}
                                    style={{ height: position.height, minHeight: '20px' }}
                                  >
                                    <div className="flex flex-col h-full">
                                      <div className="flex items-start justify-between gap-1 mb-1">
                                        <div
                                          className="font-semibold text-sm text-white truncate flex-1 cursor-pointer hover:underline"
                                          onClick={(e) => handleShowConcertInfo(e, concert)}
                                        >
                                          {concert.band_name}
                                        </div>
                                        {isUserFavorite && (
                                          <button
                                            onClick={(e) => handleToggleFavorite(e, concert.id)}
                                            className="flex-shrink-0 text-base hover:scale-125 transition-transform cursor-pointer"
                                            title="Remove from favorites"
                                          >
                                            ⭐
                                          </button>
                                        )}
                                      </div>
                                      {position.heightPx >= 80 && (
                                        <div className="text-xs text-white truncate" title={concert.stage}>
                                          {concert.stage}
                                        </div>
                                      )}
                                      <div className="text-xs text-white">
                                        {concert.start_time.slice(0, 5)} - {concert.end_time.slice(0, 5)}
                                      </div>
                                      {currentUsername === 'Wesker' && position.heightPx >= 80 && concert.rating !== null && (
                                        <div className="text-xs font-medium text-yellow-300 mt-1">
                                          ★ {concert.rating}/20
                                        </div>
                                      )}
                                    </div>

                                    {/* Friend indicator */}
                                    {friendsList.length > 0 && (
                                      <div
                                        className="absolute bottom-1 right-1 text-xs text-white px-1 cursor-pointer hover:underline"
                                        onClick={(e) => handleShowFriendsPopup(e, concert.id, concert.band_name)}
                                      >
                                        👥 {friendsDisplay.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
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

      {/* Friends Popup Modal */}
      {friendsPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setFriendsPopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{friendsPopup.bandName}</h3>
                <p className="text-sm text-gray-600 mt-1">Friends who favorited this concert:</p>
              </div>
              <button
                onClick={() => setFriendsPopup(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-2">
              {getAllFriendsWhoFavorited(friendsPopup.concertId).map((friend) => (
                <div key={friend} className="flex items-center space-x-2 text-gray-700">
                  <span className="text-lg">👤</span>
                  <span>{friend}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Concert Info Popup Modal */}
      {concertInfoPopup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setConcertInfoPopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{concertInfoPopup.bandName}</h3>
              </div>
              <button
                onClick={() => setConcertInfoPopup(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="text-lg">🕐</span>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {concertInfoPopup.startTime.slice(0, 5)} - {concertInfoPopup.endTime.slice(0, 5)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="text-lg">🎪</span>
                <div>
                  <p className="text-sm text-gray-500">Stage</p>
                  <p className="font-medium">{concertInfoPopup.stage}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <span className="text-lg">★</span>
                <div>
                  <p className="text-sm text-gray-500">Wesker's rating</p>
                  <p className="font-medium">
                    {concertInfoPopup.rating !== null ? `${concertInfoPopup.rating}/20` : 'Not yet rated'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
