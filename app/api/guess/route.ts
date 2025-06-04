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
      `Tu es un expert en cinéma. À partir de la citation suivante, donne moi le nom du film qui correspond à la citation. 
      Réponds uniquement avec un objet JSON comme ceci : {
        "title": "Nom du film",
        "year": "Année de sortie",
        "overview": "Résumé du film",
        "poster": "URL de l'affiche du film",
        "timecode": "Temps de la citation dans le film",
        "id": "ID du film"
      }
    
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
        // Si pas d'objet JSON, on essaie de récupérer juste le titre
        const title = rawText.replace(/```json|```/g, "").trim();
        if (title) {
          movieData = { title };
        }
      }
    } catch (e) {
      console.error("Error parsing Gemini response:", e);
      // En cas d'erreur, on utilise le texte brut comme titre
      movieData = { title: rawText };
    }

    // Si nous avons un titre, rechercher dans TMDB
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

    return NextResponse.json({
      result: Object.keys(movieData).length > 0 ? movieData : null,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}
