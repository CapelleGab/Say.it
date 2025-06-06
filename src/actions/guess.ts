"use server";

import {
  TMDBCastMember,
  TMDBCreator,
  TMDBCrewMember,
  TMDBMovieDetails,
  TMDBResult,
  TMDBTVShowDetails,
} from "@/src/types/tmdbTypes";
import { Mistral } from "@mistralai/mistralai";
import { MovieResponse } from "../types/movieDetailsType";

// Constantes d'API
const MISTRAL_CLIENT = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY!,
});
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

// Fonction principale
export const guessMovieFromQuote = async (quote: string) => {
  try {
    // 1. Récupérer les informations depuis Mistral
    const movieData = await getMovieInfoFromMistral(quote);

    // 2. Enrichir avec les données TMDB si un titre est trouvé
    if (movieData.title) {
      await enrichWithTMDBData(movieData);
    }

    return { result: movieData };
  } catch (error) {
    console.error("Server action error:", error);
    throw error;
  }
};

/**
 * Interroge l'API Mistral pour obtenir des informations sur un film ou une série à partir d'une citation
 */
const getMovieInfoFromMistral = async (
  quote: string
): Promise<MovieResponse> => {
  const prompt = `Tu es un expert en cinéma et séries TV. À partir de la citation suivante, trouve le film ou la série d'où elle provient.
    Si c'est une série TV, indique également la saison et l'épisode.
    Réponds uniquement avec un objet JSON comme ceci : {
      "title": "Nom du film ou de la série",
      "year": "Année de sortie",
      "is_series": true/false,
      "season": "Numéro de saison (si série)",
      "episode": "Numéro d'épisode (si série)"
    }
  
    Citation : "${quote}"`;

  try {
    const chatResponse = await MISTRAL_CLIENT.chat.complete({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
    });

    // Vérifier si chatResponse et ses propriétés existent
    if (!chatResponse?.choices?.[0]?.message?.content) {
      console.error("Mistral API returned unexpected response format");
      return {};
    }

    // Récupérer le contenu de la réponse
    const content = chatResponse.choices[0].message.content;

    // Convertir le contenu en chaîne si ce n'est pas déjà le cas
    const rawText =
      typeof content === "string" ? content.trim() : JSON.stringify(content);

    return parseMistralResponse(rawText);
  } catch (error) {
    console.error("Error calling Mistral API:", error);
    return {};
  }
};

/**
 * Analyse la réponse brute de Mistral pour en extraire un objet structuré
 */
const parseMistralResponse = (rawText: string): MovieResponse => {
  let movieData: MovieResponse = {};

  try {
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      movieData = JSON.parse(jsonMatch[0]);
      return movieData;
    }

    console.log("No JSON object found in response");
  } catch (e) {
    console.error("Error parsing Mistral response:", e);
  }

  return movieData;
};

/**
 * Enrichit les données du film/série avec les informations de TMDB
 */
const enrichWithTMDBData = async (movieData: MovieResponse): Promise<void> => {
  try {
    // Recherche multi-type (film + série)
    const searchResults = await searchTMDB(movieData.title!);
    if (!searchResults?.length) {
      console.log(`No TMDB results found for "${movieData.title}"`);
      return;
    }

    // Filtrer et trouver le meilleur résultat
    const bestMatch = findBestTMDBMatch(searchResults, movieData);
    if (!bestMatch) {
      console.log(`No suitable match found for "${movieData.title}"`);
      return;
    }

    // Compléter les informations avec le résultat trouvé
    updateMovieDataFromTMDB(movieData, bestMatch);

    // Si c'est une série TV, récupérer des informations supplémentaires
    if (bestMatch.media_type === "tv") {
      await enrichWithTVShowDetails(movieData, bestMatch.id);
    }
    // Si c'est un film, récupérer les détails du film
    else if (bestMatch.media_type === "movie") {
      await enrichWithMovieDetails(movieData, bestMatch.id);
    }
  } catch (error) {
    console.error(`Error enriching data for "${movieData.title}":`, error);
  }
};

/**
 * Recherche un film ou une série dans l'API TMDB
 */
const searchTMDB = async (title: string): Promise<TMDBResult[]> => {
  const searchRes = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}`
  );

  const searchData = await searchRes.json();

  return searchData.results || [];
};

/**
 * Trouve le meilleur résultat TMDB correspondant à notre recherche
 */
const findBestTMDBMatch = (
  results: TMDBResult[],
  movieData: MovieResponse
): TMDBResult | null => {
  // Filtrer les résultats par type (film ou série)
  const filteredResults = results.filter(
    (result) => result.media_type === "movie" || result.media_type === "tv"
  );

  if (filteredResults.length === 0) return null;

  // Si nous avons l'année, chercher une correspondance plus précise
  if (movieData.year) {
    const yearStr = movieData.year.toString();
    for (const result of filteredResults) {
      const resultYear = result.release_date || result.first_air_date || "";
      if (resultYear.startsWith(yearStr)) {
        return result;
      }
    }
  }

  // Sinon retourner le premier résultat
  return filteredResults[0];
};

/**
 * Met à jour les données du film avec les informations de TMDB
 */
const updateMovieDataFromTMDB = (
  movieData: MovieResponse,
  tmdbResult: TMDBResult
): void => {
  movieData.id = tmdbResult.id;
  movieData.media_type = tmdbResult.media_type;
  movieData.is_series = tmdbResult.media_type === "tv";

  // Mise à jour du titre si nécessaire
  if (!movieData.title) {
    movieData.title = tmdbResult.title || tmdbResult.name || "Titre inconnu";
  }

  // Mise à jour de l'année si nécessaire
  if (!movieData.year) {
    const dateStr = tmdbResult.release_date || tmdbResult.first_air_date;
    if (dateStr) {
      movieData.year = dateStr.split("-")[0];
    }
  }

  // Ajout de l'image de poster si disponible
  if (tmdbResult.poster_path) {
    movieData.poster = `${TMDB_IMAGE_BASE_URL}${tmdbResult.poster_path}`;
  } else {
    movieData.poster = null;
  }

  // Ajout du résumé si disponible
  if (tmdbResult.overview) {
    movieData.overview = tmdbResult.overview;
  }
};

/**
 * Enrichit les données avec les détails d'une série TV
 */
const enrichWithTVShowDetails = async (
  movieData: MovieResponse,
  tvId: number
): Promise<void> => {
  try {
    const tvDetailsRes = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    const tvDetails: TMDBTVShowDetails = await tvDetailsRes.json();

    // Ajouter les créateurs
    if (tvDetails.created_by && tvDetails.created_by.length > 0) {
      const creatorNames = tvDetails.created_by
        .map((creator: TMDBCreator) => creator.name)
        .join(", ");
      movieData.director = creatorNames;
    }

    // Ajouter les acteurs principaux
    if (tvDetails.credits && tvDetails.credits.cast) {
      const mainCast = tvDetails.credits.cast
        .slice(0, 5)
        .map((actor: TMDBCastMember) => actor.name);
      movieData.actors = mainCast;
    }
  } catch (error) {
    console.error(`Error getting TV show details for ID ${tvId}:`, error);
  }
};

/**
 * Enrichit les données avec les détails d'un film
 */
const enrichWithMovieDetails = async (
  movieData: MovieResponse,
  movieId: number
): Promise<void> => {
  try {
    const movieDetailsRes = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
    );
    const movieDetails: TMDBMovieDetails = await movieDetailsRes.json();

    // Ajouter le réalisateur
    if (movieDetails.credits && movieDetails.credits.crew) {
      const directors = movieDetails.credits.crew
        .filter((crew: TMDBCrewMember) => crew.job === "Director")
        .map((director: TMDBCrewMember) => director.name);

      if (directors.length > 0) {
        movieData.director = directors.join(", ");
      }
    }

    // Ajouter les acteurs principaux
    if (movieDetails.credits && movieDetails.credits.cast) {
      const mainCast = movieDetails.credits.cast
        .slice(0, 5)
        .map((actor: TMDBCastMember) => actor.name);
      movieData.actors = mainCast;
    }
  } catch (error) {
    console.error(`Error getting movie details for ID ${movieId}:`, error);
  }
};
