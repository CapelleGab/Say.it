import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const TMDB_API_KEY = process.env.TMDB_API_KEY!;

interface MovieResponse {
  title?: string;
  year?: string;
  overview?: string;
  poster?: string | null;
  timecode?: string;
  id?: string | number;
}

export async function POST(req: Request) {
  try {
    const { quote } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Tu es un expert en cinéma. À partir de la citation suivante, trouve le timecode exact où cette citation apparaît dans la vidéo complète.
      Réponds uniquement avec un objet JSON comme ceci : {
        "title": "Nom du film",
        "year": "Année de sortie",
        "timecode": "HH:MM:SS"
      }
      
      Le timecode doit être au format HH:MM:SS et représente le moment précis où cette citation apparaît dans notre vidéo de compilation.
    
      Citation : "${quote}"`
    );

    const rawText = result.response.text().trim();
    console.log("Raw response from Gemini:", rawText);

    let movieData: MovieResponse = {};

    try {
      // Extraire l'objet JSON de la réponse
      const jsonMatch = rawText.match(/{[\s\S]*}/);
      if (jsonMatch) {
        movieData = JSON.parse(jsonMatch[0]);
        console.log("Parsed JSON data:", movieData);
      } else {
        console.log("No JSON object found in response");
        // Si pas d'objet JSON, on essaie de récupérer juste le timecode
        const timecodeMatch = rawText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
        if (timecodeMatch) {
          movieData = { timecode: timecodeMatch[0] };
        } else {
          // Essayer des formats de timecode alternatifs (MM:SS)
          const shortTimecodeMatch = rawText.match(/(\d{1,2}):(\d{2})/);
          if (shortTimecodeMatch) {
            movieData = { timecode: `00:${shortTimecodeMatch[0]}` };
          }
        }
      }
    } catch (e) {
      console.error("Error parsing Gemini response:", e);
      // En cas d'erreur, on essaie d'extraire juste le timecode
      const timecodeMatch = rawText.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      if (timecodeMatch) {
        movieData = { timecode: timecodeMatch[0] };
      }
    }

    // Si nous avons un titre, rechercher dans TMDB pour obtenir plus d'informations
    if (movieData.title) {
      try {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
            movieData.title
          )}`
        );
        const data = await tmdbRes.json();
        console.log(`TMDB response for "${movieData.title}":`, data);

        const movie = data.results?.[0];

        if (movie) {
          // Compléter les informations manquantes avec TMDB
          movieData = {
            ...movieData,
            title: movie.title || movieData.title,
            year:
              movieData.year || (movie.release_date?.split("-")[0] ?? "N/A"),
            overview: movieData.overview || movie.overview,
            poster:
              movieData.poster ||
              (movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null),
            id: movieData.id || movie.id,
          };
        } else {
          console.log(`No movie found for "${movieData.title}"`);
        }
      } catch (error) {
        console.error(`Error searching for "${movieData.title}":`, error);
      }
    }

    console.log("Final result:", movieData);

    // Vérifier si nous avons un timecode
    if (!movieData.timecode) {
      // Si pas de timecode, on renvoie un timecode par défaut basé sur la citation
      // Cette partie serait à remplacer par une vraie recherche dans votre vidéo
      const fakeTimecodes = {
        "I'll be back": "00:15:30",
        "May the Force be with you": "00:23:45",
        "Say hello to my little friend": "00:45:12",
        "Houston, we have a problem": "01:12:05",
        "Life is like a box of chocolates": "01:34:28",
      };

      // Utiliser un timecode par défaut ou chercher une correspondance approximative
      let defaultTimecode = "00:10:00";

      for (const [key, value] of Object.entries(fakeTimecodes)) {
        if (quote.toLowerCase().includes(key.toLowerCase())) {
          defaultTimecode = value;
          break;
        }
      }

      movieData.timecode = defaultTimecode;
    }

    return NextResponse.json({
      result: movieData,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
