"use client";

import { Button } from "@/src/components/ui/button";
import { Slider } from "@/src/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface VolumeControlProps {
  onVolumeChange: (volume: number) => void;
  initialVolume?: number;
}

export const VolumeControl = ({
  onVolumeChange,
  initialVolume = 1,
}: VolumeControlProps) => {
  const [volume, setVolume] = useState(initialVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const previousVolume = useRef(initialVolume);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);

    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      previousVolume.current = newVolume;
      setIsMuted(false);
    }

    onVolumeChange(newVolume);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume.current);
      setIsMuted(false);
      onVolumeChange(previousVolume.current);
    } else {
      setVolume(0);
      setIsMuted(true);
      onVolumeChange(0);
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

  return (
    <div id="volume-controls" className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? "Unmute" : "Mute"} (M)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showVolumeSlider && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-background rounded-lg shadow-lg border border-border/50 w-36 z-50">
          <div className="flex items-center gap-2 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? "Unmute" : "Mute"} (M)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
  );
};
