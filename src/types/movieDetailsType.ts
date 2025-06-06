export type MovieDetails = {
  title?: string;
  year?: string;
  overview?: string;
  poster?: string;
  id?: string | number;
  media_type?: string;
  season?: string | number;
  episode?: string | number;
  director?: string;
  actors?: string[];
}

// Interfaces
export type MovieResponse = {
  title?: string;
  year?: string;
  overview?: string;
  poster?: string | null;
  timecode?: string;
  id?: string | number;
  media_type?: string;
  is_series?: boolean;
  season?: string | number;
  episode?: string | number;
  director?: string;
  actors?: string[];
}