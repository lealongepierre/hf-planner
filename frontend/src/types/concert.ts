export interface Concert {
  id: number;
  band_name: string;
  day: string;
  festival_day: string | null;
  start_time: string; // "HH:MM:SS" format
  end_time: string;   // "HH:MM:SS" format
  stage: string;
}
