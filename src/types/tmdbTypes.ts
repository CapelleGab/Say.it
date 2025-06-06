export type TMDBResult = {
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
export type TMDBCreator = {
  id: number;
  name: string;
  profile_path?: string;
}

export type TMDBCastMember = {
  id: number;
  name: string;
  character: string;
  profile_path?: string;
}

export type TMDBCrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

export type TMDBCredits = {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export type TMDBTVShowDetails = {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  created_by: TMDBCreator[];
  credits?: TMDBCredits;
}

export type TMDBMovieDetails = {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  credits?: TMDBCredits;
}