"use client";

import { Input } from "@/src/components/ui/input";
import { Film, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ModeToggle } from "./ui/toggle-theme";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  embedUrl: string;
}

interface SearchBarProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
}

export const SearchBar = ({ videoPlayerRef }: SearchBarProps) => {
  const [prompt, setPrompt] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [selectedVideoInfo, setSelectedVideoInfo] =
    useState<YouTubeVideo | null>(null);
  const [showVideoInfo, setShowVideoInfo] = useState(false);
  const previousVolume = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoPlayerRef?.current) {
      setIsPlaying(videoPlayerRef.current.getPlayState());
    }
  }, [videoPlayerRef]);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setYoutubeVideos([]);
    setSelectedVideoInfo(null);
    setShowVideoInfo(false);

    try {
      // 1. D'abord on cherche le timecode avec notre API Gemini
      const guessResponse = await fetch("/api/guess", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quote: prompt }),
      });

      if (!guessResponse.ok) {
        throw new Error("Failed to fetch from guess API");
      }

      const guessData = await guessResponse.json();
      console.log("Guess API Response:", guessData);

      // 2. Ensuite on utilise ce timecode et le titre du film pour chercher sur YouTube
      if (guessData.result) {
        const { title, timecode } = guessData.result;
        const searchQuery = title
          ? `${title} movie scene "${prompt}"`
          : `movie scene "${prompt}"`;

        const youtubeResponse = await fetch("/api/youtube", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: searchQuery,
            timecode,
          }),
        });

        if (!youtubeResponse.ok) {
          throw new Error("Failed to fetch from YouTube API");
        }

        const youtubeData = await youtubeResponse.json();
        console.log("YouTube API Response:", youtubeData);

        if (youtubeData.videos && youtubeData.videos.length > 0) {
          setYoutubeVideos(youtubeData.videos);

          // Sélectionner automatiquement la première vidéo
          const selectedVideo = youtubeData.videos[0];
          setSelectedVideoInfo(selectedVideo);

          // Extraire l'ID de la vidéo et le temps de départ de l'URL d'embed
          const { id, embedUrl } = selectedVideo;

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

          console.log(
            `Loading YouTube video ID: ${id}, start time: ${startTime}`
          );

          // Charger la vidéo dans le lecteur
          if (videoPlayerRef?.current) {
            videoPlayerRef.current.loadYouTubeVideo(id, startTime);
            setShowVideoInfo(true);
            toast.success(`Lecture de la vidéo: ${selectedVideo.title}`);
          } else {
            console.error("videoPlayerRef is not available");
          }
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

  const selectVideo = (video: YouTubeVideo) => {
    setSelectedVideoInfo(video);
    setShowVideoInfo(true);

    // Ouvrir YouTube dans un nouvel onglet
    window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank");

    // Aussi charger dans le lecteur local
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.loadYouTubeVideo(video.id);
    }

    // Fermer le panneau d'informations après 5 secondes
    setTimeout(() => {
      setShowVideoInfo(false);
    }, 5000);
  };

  const resetVideo = () => {
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.resetToDefaultVideo();
      setSelectedVideoInfo(null);
      setShowVideoInfo(false);
    }
  };

  const togglePlay = () => {
    if (videoPlayerRef?.current) {
      // Changer l'état immédiatement avant d'appeler la méthode de la vidéo
      const newPlayState = !isPlaying;
      setIsPlaying(newPlayState);

      // Puis modifier l'état de la vidéo
      videoPlayerRef.current.togglePlay();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      previousVolume.current = newVolume;
      setIsMuted(false);
    }

    if (videoPlayerRef?.current) {
      videoPlayerRef.current.setVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (videoPlayerRef?.current) {
      if (isMuted) {
        videoPlayerRef.current.setVolume(previousVolume.current);
        setVolume(previousVolume.current);
        setIsMuted(false);
      } else {
        videoPlayerRef.current.setVolume(0);
        setVolume(0);
        setIsMuted(true);
      }
    }
  };

  const toggleVolumeSlider = () => {
    setShowVolumeSlider(!showVolumeSlider);
  };

  const toggleVideoInfo = () => {
    setShowVideoInfo(!showVideoInfo);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showVolumeSlider) {
        const volumeControls = document.getElementById("volume-controls");
        if (volumeControls && !volumeControls.contains(e.target as Node)) {
          setShowVolumeSlider(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showVolumeSlider]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Play/Pause (Shortcut)
      const isInputFocused = document.activeElement === inputRef.current;
      if (e.code === "Space" && !isInputFocused) {
        e.preventDefault();
        togglePlay();
      }

      // Touche Entrée pour soumettre le formulaire quand on est dans le champ
      if (e.code === "Enter" && isInputFocused) {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <>
      <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
        <ModeToggle />
        <form
          ref={formRef}
          onSubmit={handleSearch}
          className="flex items-center gap-2 w-full"
        >
          <Input
            ref={inputRef}
            type="text"
            placeholder="Entrez une citation de film..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Recherche..." : "Rechercher"}
          </Button>
        </form>

        <div className="flex items-center gap-3 ml-2 border-l border-border/50 pl-3">
          {selectedVideoInfo && (
            <Button
              onClick={toggleVideoInfo}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
              title="Informations sur la vidéo"
            >
              <Film className="h-4 w-4" />
            </Button>
          )}

          <Button
            onClick={togglePlay}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            type="button"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div id="volume-controls" className="relative">
            <Button
              onClick={toggleVolumeSlider}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              type="button"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-background rounded-lg shadow-lg border border-border/50 w-36">
                <div className="flex items-center gap-2 mb-1">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    type="button"
                  >
                    {isMuted ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                  <span className="text-xs">{Math.round(volume * 100)}%</span>
                </div>
                <Slider
                  value={[volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informations sur la vidéo en cours de lecture */}
      {selectedVideoInfo && showVideoInfo && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md p-4 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg">
          <div className="flex items-start gap-4">
            <img
              src={selectedVideoInfo.thumbnailUrl}
              alt={selectedVideoInfo.title}
              className="w-24 h-16 object-cover rounded-md"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 line-clamp-1">
                {selectedVideoInfo.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-1">
                {selectedVideoInfo.channelTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatViewCount(selectedVideoInfo.viewCount)} vues
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setShowVideoInfo(false)}
          >
            ×
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={resetVideo}
          >
            Retour à la vidéo d&apos;origine
          </Button>
        </div>
      )}

      {/* Liste des vidéos YouTube (si plusieurs résultats) */}
      {youtubeVideos.length > 1 && (
        <div className="fixed right-4 top-20 w-64 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-3">
          <h3 className="text-sm font-medium mb-2">Autres vidéos</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {youtubeVideos.map((video) => (
              <div
                key={video.id}
                className={`flex gap-2 p-2 rounded-lg cursor-pointer hover:bg-background/60 transition-colors ${
                  selectedVideoInfo?.id === video.id
                    ? "bg-primary/10 border border-primary/30"
                    : ""
                }`}
                onClick={() => selectVideo(video)}
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-20 h-12 object-cover rounded-sm"
                />
                <div>
                  <p className="text-xs font-medium line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {video.channelTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Utilitaire pour formatter le nombre de vues
function formatViewCount(viewCount: string): string {
  const count = parseInt(viewCount, 10);
  if (isNaN(count)) return "0";

  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + " M";
  }

  if (count >= 1000) {
    return (count / 1000).toFixed(1) + " k";
  }

  return count.toString();
}
