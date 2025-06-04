"use client";

import { Input } from "@/src/components/ui/input";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { ModeToggle } from "./ui/toggle-theme";

interface SearchBarProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
}

export const SearchBar = ({ videoPlayerRef }: SearchBarProps) => {
  const [prompt, setPrompt] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const previousVolume = useRef(1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoPlayerRef?.current) {
      setIsPlaying(videoPlayerRef.current.getPlayState());
    }
  }, [videoPlayerRef]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(prompt);
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
  }, [isPlaying]);

  return (
    <div className="flex items-center gap-2 w-full max-w-2xl mx-auto bg-background/50 backdrop-blur-sm border border-border/50 p-4 rounded-2xl">
      <ModeToggle />
      <form
        ref={formRef}
        onSubmit={handleSearch}
        className="flex items-center gap-2 w-full max-w-2xl mx-auto"
      >
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="flex items-center gap-3 ml-2 border-l border-border/50 pl-3">
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
  );
};
