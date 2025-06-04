"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";

export const VideoPlayer = forwardRef<VideoPlayerRef>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 1;

      // Tenter de lire la vidéo automatiquement
      const playPromise = videoRef.current.play();

      // Gérer le cas où la lecture automatique est bloquée
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Autoplay prevented:", error);
          // Mettre à jour l'état de lecture dans le parent via la référence
        });
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    play: () => {
      videoRef.current?.play().catch((err) => {
        console.log("Play failed:", err);
      });
    },
    pause: () => {
      videoRef.current?.pause();
    },
    setVolume: (volume: number) => {
      if (videoRef.current) {
        videoRef.current.volume = Math.min(Math.max(volume, 0), 1);
      }
    },
    togglePlay: () => {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play().catch((err) => {
            console.log("Play failed:", err);
          });
        } else {
          videoRef.current.pause();
        }
      }
    },
    getPlayState: () => {
      return videoRef.current ? !videoRef.current.paused : false;
    },
  }));

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover -z-10"
    >
      <source src="video/demo.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );
});

VideoPlayer.displayName = "VideoPlayer";
