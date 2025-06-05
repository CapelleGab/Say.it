"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MovieDetails } from "../types/movieDetailsType";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { YouTubeVideo } from "../types/youtubeVideoType";
import { MovieCard } from "./moviedetails";
import { MediaControls } from "./searchbar/MediaControls";
import { SearchForm } from "./searchbar/SearchForm";
import { ModeToggle } from "./ui/toggle-theme";

interface SearchBarProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
}

export const SearchBar = ({ videoPlayerRef }: SearchBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVideoInfo, setSelectedVideoInfo] =
    useState<YouTubeVideo | null>(null);
  const [movieInfo, setMovieInfo] = useState<MovieDetails | null>(null);

  // Ajouter un gestionnaire d'événement pour la barre d'espace
  useEffect(() => {
    const handleSpaceKey = (e: KeyboardEvent) => {
      // Ignorer si l'utilisateur tape dans un champ de texte
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Vérifier si c'est la barre d'espace
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault(); // Empêcher le défilement de la page

        // Toggler la lecture
        if (videoPlayerRef?.current) {
          try {
            videoPlayerRef.current.togglePlay();
            console.log("Spacebar pressed: toggling video playback");
          } catch (error) {
            console.warn("Erreur lors du toggle via barre d'espace:", error);
          }
        }
      }
    };

    // Ajouter l'écouteur d'événement
    window.addEventListener("keydown", handleSpaceKey);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener("keydown", handleSpaceKey);
    };
  }, [videoPlayerRef]);

  // Fonction de recherche principale
  const handleSearch = async (prompt: string) => {
    setIsLoading(true);
    setSelectedVideoInfo(null);
    setMovieInfo(null);

    try {
      // 1. Récupérer les informations du film/série via Gemini
      const guessData = await fetchGeminiData(prompt);

      // 2. Si on a des résultats, rechercher les vidéos YouTube correspondantes
      if (guessData?.result) {
        const {
          title,
          timecode,
          year,
          overview,
          poster,
          id,
          media_type,
          season,
          episode,
          director,
          actors,
        } = guessData.result;

        // Stocker les informations du film/série
        setMovieInfo({
          title,
          year,
          overview,
          poster,
          id,
          media_type,
          season,
          episode,
          director,
          actors,
        });

        // Chercher les vidéos sur YouTube
        const youtubeData = await fetchYouTubeVideos(title, prompt, timecode);

        // Si on a des vidéos, charger la première
        if (youtubeData?.videos && youtubeData.videos.length > 0) {
          await loadYouTubeVideo(youtubeData.videos[0]);
        } else {
          toast.info("Aucune vidéo trouvée sur YouTube.");
        }
      } else {
        toast.error("Impossible de déterminer le film ou le timecode.");
      }
    } catch (error) {
      console.error("Error during search:", error);
      toast.error("Une erreur s'est produite lors de la recherche.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions utilitaires encapsulées
  const fetchGeminiData = async (quote: string) => {
    const response = await fetch("/api/guess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from guess API");
    }

    const data = await response.json();
    console.log("Guess API Response:", data);
    return data;
  };

  const fetchYouTubeVideos = async (
    title: string | undefined,
    quote: string,
    timecode: string | undefined
  ) => {
    const searchQuery = title
      ? `${title} movie scene "${quote}"`
      : `movie scene "${quote}"`;

    const response = await fetch("/api/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery, timecode }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from YouTube API");
    }

    const data = await response.json();
    console.log("YouTube API Response:", data);
    return data;
  };

  const loadYouTubeVideo = async (video: YouTubeVideo) => {
    setSelectedVideoInfo(video);

    // Extraire l'ID de la vidéo et le temps de départ de l'URL d'embed
    const { id, embedUrl } = video;

    // Analyser l'URL pour extraire le paramètre start
    let startTime = 0;
    try {
      const url = new URL(embedUrl);
      const startParam = url.searchParams.get("start");
      if (startParam) {
        startTime = parseInt(startParam, 10);
      }
    } catch (error) {
      console.error("Error parsing embed URL:", error);
    }

    console.log(`Loading YouTube video ID: ${id}, start time: ${startTime}`);

    // Charger la vidéo dans le lecteur
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.loadYouTubeVideo(id, startTime);
      toast.success(`Lecture de la vidéo: ${video.title}`);

      // Série de tentatives pour s'assurer que la vidéo démarre
      // Première tentative après un court délai
      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
          console.log("First auto-play attempt after search");
        }
      }, 500);

      // Deuxième tentative après un délai moyen
      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
          console.log("Second auto-play attempt after search");
        }
      }, 1500);

      // Troisième tentative après un délai plus long
      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
          console.log("Third auto-play attempt after search");
        }
      }, 3000);
    } else {
      console.error("videoPlayerRef is not available");
    }
  };

  // Gestionnaires d'événements
  const resetVideo = () => {
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.resetToDefaultVideo();
      setSelectedVideoInfo(null);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
        <ModeToggle />
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        <MediaControls videoPlayerRef={videoPlayerRef} />
      </div>

      {/* Informations du film */}
      {movieInfo && <MovieCard movieInfo={movieInfo} />}
    </>
  );
};
