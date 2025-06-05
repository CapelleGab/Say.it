
export interface TMDBResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
}

// Interfaces pour les données de TMDB
export interface TMDBCreator {
  id: number;
  name: string;
  profile_path?: string;
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBTVShowDetails {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  created_by: TMDBCreator[];
  credits?: TMDBCredits;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  credits?: TMDBCredits;
}