"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";

// Définition des types pour l'API YouTube
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          height: string;
          width: string;
          videoId: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            disablekb?: number;
            fs?: number;
            modestbranding?: number;
            rel?: number;
            showinfo?: number;
            start?: number;
          };
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// Interface pour le player YouTube
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getPlayerState: () => number;
  destroy: () => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
}

// Variable globale pour accéder au player YouTube
let youtubePlayer: YTPlayer | null = null;

export const VideoPlayer = forwardRef<VideoPlayerRef>((props, ref) => {
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Fonction pour convertir le timecode en secondes
  const parseTimecode = (timecode: string | number): number => {
    if (typeof timecode === "number") return timecode;

    // Format possible: "HH:MM:SS" ou "MM:SS" ou "SS"
    const parts = timecode.split(":").map(Number).reverse();
    let seconds = 0;

    // Secondes
    if (parts.length > 0) seconds += parts[0];
    // Minutes
    if (parts.length > 1) seconds += parts[1] * 60;
    // Heures
    if (parts.length > 2) seconds += parts[2] * 3600;

    return seconds;
  };

  // Fonction pour extraire l'ID de vidéo YouTube d'une URL
  const extractYouTubeVideoId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      try {
        if (youtubePlayer) {
          youtubePlayer.playVideo();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error("Erreur lors de la lecture:", err);
      }
    },
    pause: () => {
      try {
        if (youtubePlayer) {
          youtubePlayer.pauseVideo();
          setIsPlaying(false);
        }
      } catch (err) {
        console.error("Erreur lors de la pause:", err);
      }
    },
    setVolume: (volume: number) => {
      try {
        if (youtubePlayer) {
          // YouTube prend un volume entre 0 et 100
          youtubePlayer.setVolume(volume * 100);
        }
      } catch (err) {
        console.error("Erreur lors du réglage du volume:", err);
      }
    },
    togglePlay: () => {
      try {
        if (youtubePlayer) {
          const state = youtubePlayer.getPlayerState();
          if (state === 1) {
            // 1 = PLAYING
            youtubePlayer.pauseVideo();
            setIsPlaying(false);
          } else {
            youtubePlayer.playVideo();
            setIsPlaying(true);
          }
        }
      } catch (err) {
        console.error("Erreur lors du toggle play:", err);
      }
    },
    getPlayState: () => {
      try {
        if (youtubePlayer) {
          return youtubePlayer.getPlayerState() === 1; // 1 = PLAYING
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'état:", err);
      }
      return isPlaying;
    },
    setVideoSource: (src: string) => {
      // Si c'est une URL YouTube
      if (src.includes("youtube.com") || src.includes("youtu.be")) {
        const videoId = extractYouTubeVideoId(src);
        if (videoId) {
          setYoutubeVideoId(videoId);
          return;
        }
      }
    },
    seekToTime: (time: string | number) => {
      const seconds = parseTimecode(time);
      setStartTime(seconds);

      try {
        if (youtubePlayer) {
          youtubePlayer.seekTo(seconds, true);
        }
      } catch (err) {
        console.error("Erreur lors du seek:", err);
      }
    },
    loadYouTubeVideo: (videoId: string, startTimeInSeconds?: number) => {
      console.log(
        `Loading YouTube video: ${videoId}, startTime: ${startTimeInSeconds}`
      );

      if (startTimeInSeconds !== undefined) {
        setStartTime(startTimeInSeconds);
      } else {
        setStartTime(0);
      }

      setYoutubeVideoId(videoId);

      // Si l'iframe existe déjà, on charge directement la vidéo
      if (youtubePlayer) {
        try {
          youtubePlayer.loadVideoById({
            videoId: videoId,
            startSeconds: startTimeInSeconds || 0,
          });
          setIsPlaying(true);
        } catch (err) {
          console.error("Erreur lors du chargement de la vidéo:", err);
        }
      }
    },
    resetToDefaultVideo: () => {
      setYoutubeVideoId(null);
      setStartTime(0);
    },
    getCurrentSource: () => {
      if (youtubeVideoId) {
        return `https://www.youtube.com/watch?v=${youtubeVideoId}`;
      }
      return null;
    },
  }));

  // Charger l'API YouTube
  useEffect(() => {
    // Fonction pour initialiser le player
    const initPlayer = (videoId: string | null) => {
      if (!containerRef.current || !videoId) return;

      // Nettoyer le conteneur
      containerRef.current.innerHTML = "";

      // Créer un div pour le player
      const playerDiv = document.createElement("div");
      playerDiv.id = "youtube-player";
      containerRef.current.appendChild(playerDiv);

      try {
        youtubePlayer = new window.YT.Player("youtube-player", {
          height: "100%",
          width: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            start: startTime,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              event.target.playVideo();
              setIsPlaying(true);
            },
            onStateChange: (event: { data: number }) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
      } catch (err) {
        console.error("Erreur lors de l'initialisation du player:", err);
      }
    };

    // Charger l'API YouTube si nécessaire
    if (!window.YT && youtubeVideoId) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initPlayer(youtubeVideoId);
      };
    } else if (window.YT && youtubeVideoId) {
      // Si l'API est déjà chargée
      initPlayer(youtubeVideoId);
    }

    return () => {
      if (youtubePlayer) {
        try {
          youtubePlayer.destroy();
        } catch (err) {
          console.error("Erreur lors de la destruction du player:", err);
        }
      }
    };
  }, [youtubeVideoId, startTime]);

  return (
    <div className="w-full h-full">
      {!youtubeVideoId && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&showinfo=0"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        </div>
      )}

      {youtubeVideoId && (
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full overflow-hidden bg-black"
        >
          {/* Le player YouTube sera injecté ici par l'API */}
        </div>
      )}
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";
