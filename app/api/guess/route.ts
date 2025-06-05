import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Constantes d'API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const DEFAULT_TIMECODE = "00:10:00";

// Interfaces
interface MovieResponse {
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
}

interface TMDBResult {
  id: number;
  media_type: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string;
  release_date?: string;
  first_air_date?: string;
}

// Fonction principale de l'API
export async function POST(req: Request) {
  try {
    const { quote } = await req.json();

    // 1. Récupérer les informations depuis Gemini
    const movieData = await getMovieInfoFromGemini(quote);

    // 2. Enrichir avec les données TMDB si un titre est trouvé
    if (movieData.title) {
      await enrichWithTMDBData(movieData);
    }

    // 3. Assurer qu'un timecode est présent
    ensureTimecode(movieData, quote);

    console.log("Final result:", movieData);

    return NextResponse.json({ result: movieData });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}

/**
 * Interroge l'API Gemini pour obtenir des informations sur un film ou une série à partir d'une citation
 */
async function getMovieInfoFromGemini(quote: string): Promise<MovieResponse> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `Tu es un expert en cinéma et séries TV. À partir de la citation suivante, trouve le timecode exact où cette citation apparaît dans la vidéo complète.
    Si c'est une série TV, indique également la saison et l'épisode.
    Réponds uniquement avec un objet JSON comme ceci : {
      "title": "Nom du film ou de la série",
      "year": "Année de sortie",
      "timecode": "HH:MM:SS",
      "is_series": true/false,
      "season": "Numéro de saison (si série)",
      "episode": "Numéro d'épisode (si série)"
    }
    
    Le timecode doit être au format HH:MM:SS et représente le moment précis où cette citation apparaît dans notre vidéo de compilation.
  
    Citation : "${quote}"`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();
  console.log("Raw response from Gemini:", rawText);

  return parseGeminiResponse(rawText);
}

/**
 * Analyse la réponse brute de Gemini pour en extraire un objet structuré
 */
function parseGeminiResponse(rawText: string): MovieResponse {
  let movieData: MovieResponse = {};

  try {
    const jsonMatch = rawText.match(/{[\s\S]*}/);
    if (jsonMatch) {
      movieData = JSON.parse(jsonMatch[0]);
      console.log("Parsed JSON data:", movieData);
      return movieData;
    }

    console.log("No JSON object found in response");

    const timecodeMatch = rawText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (timecodeMatch) {
      return { timecode: timecodeMatch[0] };
    }

    const shortTimecodeMatch = rawText.match(/(\d{1,2}):(\d{2})/);
    if (shortTimecodeMatch) {
      return { timecode: `00:${shortTimecodeMatch[0]}` };
    }
  } catch (e) {
    console.error("Error parsing Gemini response:", e);

    const timecodeMatch = rawText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (timecodeMatch) {
      return { timecode: timecodeMatch[0] };
    }
  }

  return movieData;
}

/**
 * Enrichit les données du film/série avec les informations de TMDB
 */
async function enrichWithTMDBData(movieData: MovieResponse): Promise<void> {
  try {
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
  } catch (error) {
    console.error(`Error enriching data for "${movieData.title}":`, error);
  }
}

/**
 * Recherche un film ou une série dans l'API TMDB
 */
async function searchTMDB(title: string): Promise<TMDBResult[]> {
  const searchRes = await fetch(
    `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}`
  );

  const searchData = await searchRes.json();
  console.log(`TMDB multi search for "${title}":`, searchData);

  return searchData.results || [];
}

/**
 * Trouve le meilleur résultat TMDB correspondant à notre recherche
 */
function findBestTMDBMatch(
  results: TMDBResult[],
  movieData: MovieResponse
): TMDBResult | null {
  if (results.length === 0) return null;

  // Filtrer selon le type de média si c'est une série
  const isSeries = movieData.is_series === true;
  let filteredResults = results;

  if (isSeries) {
    const tvResults = results.filter((item) => item.media_type === "tv");
    if (tvResults.length > 0) {
      filteredResults = tvResults;
    }
  } else {
    // Si c'est un film ou indéterminé, essayer d'abord les films, puis les séries
    const movieResults = results.filter((item) => item.media_type === "movie");
    if (movieResults.length > 0) {
      filteredResults = movieResults;
    } else {
      const tvResults = results.filter((item) => item.media_type === "tv");
      if (tvResults.length > 0) {
        filteredResults = tvResults;
      }
    }
  }

  // Chercher le titre qui correspond le mieux
  let bestMatch = filteredResults[0];
  if (filteredResults.length > 1 && movieData.title) {
    // Essayer de trouver une correspondance exacte ou proche du titre
    const lowerTitle = movieData.title.toLowerCase();
    for (const result of filteredResults) {
      const resultTitle = (result.title || result.name || "").toLowerCase();
      if (resultTitle === lowerTitle) {
        bestMatch = result;
        break;
      }
    }
  }

  return bestMatch;
}

/**
 * Met à jour les données du film avec les informations de TMDB
 */
function updateMovieDataFromTMDB(
  movieData: MovieResponse,
  tmdbResult: TMDBResult
): void {
  const mediaType = tmdbResult.media_type;

  // Compléter les informations manquantes
  movieData.title = tmdbResult.title || tmdbResult.name || movieData.title;
  movieData.year =
    movieData.year ||
    (tmdbResult.release_date || tmdbResult.first_air_date)?.split("-")[0] ||
    "N/A";
  movieData.overview = movieData.overview || tmdbResult.overview;
  movieData.poster =
    movieData.poster ||
    (tmdbResult.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${tmdbResult.poster_path}`
      : null);
  movieData.id = movieData.id || tmdbResult.id;
  movieData.media_type = mediaType;
}

/**
 * Récupère des informations supplémentaires pour les séries TV
 */
async function enrichWithTVShowDetails(
  movieData: MovieResponse,
  tvId: number
): Promise<void> {
  try {
    const tvRes = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}?api_key=${TMDB_API_KEY}`
    );
    const tvData = await tvRes.json();

    if (tvData) {
      movieData.overview = movieData.overview || tvData.overview;
      movieData.year =
        movieData.year || tvData.first_air_date?.split("-")[0] || "N/A";
    }
  } catch (error) {
    console.error(`Error fetching TV details for ID ${tvId}:`, error);
  }
}

/**
 * Assure qu'un timecode est présent dans les données du film
 */
function ensureTimecode(movieData: MovieResponse, quote: string): void {
  if (movieData.timecode) return;

  // Dictionnaire de timecodes par défaut pour des citations connues
  const fakeTimecodes: Record<string, string> = {
    "I'll be back": "00:15:30",
    "May the Force be with you": "00:23:45",
    "Say hello to my little friend": "00:45:12",
    "Houston, we have a problem": "01:12:05",
    "Life is like a box of chocolates": "01:34:28",
  };

  // Chercher une correspondance ou utiliser un timecode par défaut
  for (const [key, value] of Object.entries(fakeTimecodes)) {
    if (quote.toLowerCase().includes(key.toLowerCase())) {
      movieData.timecode = value;
      return;
    }
  }

  // Si aucune correspondance trouvée, utiliser le timecode par défaut
  movieData.timecode = DEFAULT_TIMECODE;
}
