"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { guessMovieFromQuote } from "../../actions/guess";
import { searchYouTubeVideos } from "../../actions/youtube";
import { MovieDetails } from "../../types/movieDetailsType";
import { VideoPlayerRef } from "../../types/videoPlayerType";
import { YouTubeVideo } from "../../types/youtube/youtubeVideoType";
import { MovieCard } from "../moviedetails";
import { MediaControls } from "../searchbar/MediaControls";
import { SearchForm } from "../searchbar/SearchForm";
import { ModeToggle } from "../ui/toggle-theme";

interface SearchBarProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
}

export const SearchBar = ({ videoPlayerRef }: SearchBarProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [movieInfo, setMovieInfo] = useState<MovieDetails | null>(null);

  useEffect(() => {
    const handleSpaceKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === "Space" || e.key === " ") {
        e.preventDefault();

        if (videoPlayerRef?.current) {
          try {
            videoPlayerRef.current.togglePlay();
          } catch (error) {
            console.warn("Erreur lors du toggle via barre d'espace:", error);
          }
        }
      }
    };

    window.addEventListener("keydown", handleSpaceKey);

    return () => {
      window.removeEventListener("keydown", handleSpaceKey);
    };
  }, [videoPlayerRef]);

  const handleSearch = async (prompt: string) => {
    setIsLoading(true);
    setMovieInfo(null);

    try {
      const guessData = await guessMovieFromQuote(prompt);

      if (guessData?.result) {
        const {
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
        } = guessData.result;

        setMovieInfo({
          title,
          year,
          overview,
          poster: poster || undefined,
          id,
          media_type,
          season,
          episode,
          director,
          actors,
        });

        const searchQuery = title
          ? `${title} movie scene "${prompt}"`
          : `movie scene "${prompt}"`;

        const youtubeData = await searchYouTubeVideos(searchQuery);

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

  const loadYouTubeVideo = async (video: YouTubeVideo) => {
    const { id, embedUrl } = video;

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

    if (videoPlayerRef?.current) {
      videoPlayerRef.current.loadYouTubeVideo(id, startTime);
      toast.success(`Lecture de la vidéo: ${video.title}`);

      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
        }
      }, 500);

      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
        }
      }, 1500);

      setTimeout(() => {
        if (videoPlayerRef?.current) {
          videoPlayerRef.current.play();
        }
      }, 3000);
    } else {
      console.error("videoPlayerRef is not available");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
        <ModeToggle />
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        <MediaControls videoPlayerRef={videoPlayerRef} />
      </div>

      {movieInfo && <MovieCard movieInfo={movieInfo} />}
    </>
  );
};
