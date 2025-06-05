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
            playsinline?: number;
            mute?: number;
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
let youtubePlayerReady = false; // Nouvel indicateur pour vérifier si le player est prêt

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
        if (youtubePlayer && youtubePlayerReady) {
          youtubePlayer.playVideo();
          setIsPlaying(true);
          console.log("Play command sent to YouTube player");
        } else {
          console.log("Cannot play: YouTube player not ready");
        }
      } catch (err) {
        console.error("Erreur lors de la lecture:", err);
      }
    },
    pause: () => {
      try {
        if (youtubePlayer && youtubePlayerReady) {
          youtubePlayer.pauseVideo();
          setIsPlaying(false);
          console.log("Pause command sent to YouTube player");
        } else {
          console.log("Cannot pause: YouTube player not ready");
        }
      } catch (err) {
        console.error("Erreur lors de la pause:", err);
      }
    },
    setVolume: (volume: number) => {
      try {
        if (youtubePlayer && youtubePlayerReady) {
          // YouTube prend un volume entre 0 et 100
          youtubePlayer.setVolume(volume * 100);
        }
      } catch (err) {
        console.error("Erreur lors du réglage du volume:", err);
      }
    },
    togglePlay: () => {
      try {
        if (youtubePlayer && youtubePlayerReady) {
          try {
            const state = youtubePlayer.getPlayerState();
            console.log("Current YouTube state before toggle:", state);

            if (state === window.YT.PlayerState.PLAYING) {
              youtubePlayer.pauseVideo();
              setIsPlaying(false);
              console.log("Toggle: Pausing video");
            } else {
              youtubePlayer.playVideo();
              setIsPlaying(true);
              console.log("Toggle: Playing video");
            }
          } catch (stateError) {
            // Fallback si getPlayerState échoue
            console.warn(
              "Couldn't get player state, using internal state instead:",
              stateError
            );
            if (isPlaying) {
              youtubePlayer.pauseVideo();
              setIsPlaying(false);
            } else {
              youtubePlayer.playVideo();
              setIsPlaying(true);
            }
          }
        } else {
          console.log(
            "Toggle failed: YouTube player not initialized or not ready"
          );
        }
      } catch (err) {
        console.error("Erreur lors du toggle play:", err);
      }
    },
    getPlayState: () => {
      try {
        if (youtubePlayer && youtubePlayerReady) {
          try {
            const playerState = youtubePlayer.getPlayerState();
            const playing = playerState === window.YT.PlayerState.PLAYING;
            console.log(
              "Current YouTube player state:",
              playerState,
              playing ? "playing" : "paused"
            );
            return playing;
          } catch (stateError) {
            console.warn("Error getting player state:", stateError);
            // Retourner l'état local comme fallback
            return isPlaying;
          }
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
      setIsPlaying(true); // Indiquer que la vidéo devrait être en lecture

      // Si l'iframe existe déjà, on charge directement la vidéo
      if (youtubePlayer && youtubePlayerReady) {
        try {
          youtubePlayer.loadVideoById({
            videoId: videoId,
            startSeconds: startTimeInSeconds || 0,
          });
          // S'assurer que la vidéo joue
          setTimeout(() => {
            if (youtubePlayer) {
              youtubePlayer.playVideo();
              setIsPlaying(true);
              console.log("Force play after loading video");
            }
          }, 300);
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
        youtubePlayerReady = false; // Réinitialiser l'état
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
            playsinline: 1,
            mute: 0,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              youtubePlayerReady = true; // Marquer le player comme prêt
              event.target.playVideo();

              // S'assurer que la vidéo joue même après l'événement onReady
              setTimeout(() => {
                if (youtubePlayer) {
                  youtubePlayer.playVideo();
                }
              }, 200);

              setIsPlaying(true);
              // Ajouter un log pour déboguer
              console.log("YouTube player ready, starting playback");
            },
            onStateChange: (event: { data: number }) => {
              // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2
              const isPlayerPlaying =
                event.data === window.YT.PlayerState.PLAYING;
              console.log(
                "YouTube player state changed:",
                event.data,
                isPlayerPlaying ? "playing" : "paused"
              );
              setIsPlaying(isPlayerPlaying);
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
