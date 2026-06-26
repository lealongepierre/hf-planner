const FESTIVAL_START = new Date('2026-06-18T00:00:00');

export function getDaysUntilFestival(today: Date = new Date()): number {
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const diffTime = FESTIVAL_START.getTime() - todayMidnight.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatCountdown(daysUntil: number): string {
  return daysUntil >= 0 ? `J-${daysUntil}` : `J+${Math.abs(daysUntil)}`;
}
