"use client";

import { Button } from "@/src/components/ui/button";
import { VideoPlayerRef } from "@/src/types/videoPlayerType";
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { VolumeControl } from "./VolumeControl";

interface MediaControlsProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
  initialPlayState?: boolean;
}

export const MediaControls = ({
  videoPlayerRef,
  initialPlayState = false,
}: MediaControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Effet pour synchroniser l'état de lecture avec le lecteur vidéo
  useEffect(() => {
    // Attendre que l'API YouTube soit chargée
    const timeoutId = setTimeout(() => {
      setIsPlayerReady(true);
    }, 1000); // Réduire le délai à 1 seconde

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  // Effet pour vérifier l'état du lecteur une fois qu'il est prêt
  useEffect(() => {
    if (!isPlayerReady) return;

    // Créer une fonction pour vérifier l'état de lecture
    const checkPlayState = () => {
      if (videoPlayerRef?.current) {
        try {
          const currentState = videoPlayerRef.current.getPlayState();
          setIsPlaying(currentState);
        } catch (error) {
          console.warn(
            "Erreur lors de la vérification de l'état de lecture:",
            error
          );
        }
      }
    };

    // Vérifier l'état initial
    checkPlayState();

    // Mettre en place un intervalle pour vérifier régulièrement l'état
    const intervalId = setInterval(checkPlayState, 100); // Réduire l'intervalle à 100ms pour une meilleure réactivité

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, [videoPlayerRef, isPlayerReady]);

  const togglePlay = () => {
    if (videoPlayerRef?.current && isPlayerReady) {
      videoPlayerRef.current.togglePlay();

      // Mettre à jour immédiatement l'état local pour une meilleure réactivité
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (videoPlayerRef?.current && isPlayerReady) {
      videoPlayerRef.current.setVolume(volume);
    }
  };

  return (
    <div className="flex items-center gap-3 ml-2 border-l border-border/50 pl-3">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Button
          onClick={togglePlay}
          variant="ghost"
          size="icon"
          className="h-8 w-8 relative"
          type="button"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="sr-only">
            {isPlaying ? "Pause" : "Lecture"} (Barre d&apos;espace)
          </span>
        </Button>

        {showTooltip && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-background/80 backdrop-blur-sm text-xs rounded shadow-md whitespace-nowrap z-50 border border-border/50">
            {isPlaying ? "Pause" : "Lecture"} (Espace)
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 border-4 border-transparent border-t-background/80" />
          </div>
        )}
      </div>

      <VolumeControl onVolumeChange={handleVolumeChange} />
    </div>
  );
};
