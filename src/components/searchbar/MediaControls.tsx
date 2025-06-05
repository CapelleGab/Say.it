"use client";

import { Button } from "@/src/components/ui/button";
import { VideoPlayerRef } from "@/src/types/videoPlayerType";
import { Pause, Play } from "lucide-react";
import { useState } from "react";
import { VolumeControl } from "./VolumeControl";

interface MediaControlsProps {
  videoPlayerRef?: React.RefObject<VideoPlayerRef | null>;
  initialPlayState?: boolean;
}

export const MediaControls = ({
  videoPlayerRef,
  initialPlayState = false,
}: MediaControlsProps) => {
  const [isPlaying, setIsPlaying] = useState(initialPlayState);

  const togglePlay = () => {
    if (videoPlayerRef?.current) {
      const newPlayState = !isPlaying;
      setIsPlaying(newPlayState);
      videoPlayerRef.current.togglePlay();
    }
  };

  const handleVolumeChange = (volume: number) => {
    if (videoPlayerRef?.current) {
      videoPlayerRef.current.setVolume(volume);
    }
  };

  return (
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

      <VolumeControl onVolumeChange={handleVolumeChange} />
    </div>
  );
};
