"use client";

import { AuthBar } from "@/src/components/auth/authbar";
import { SearchBar } from "@/src/components/searchbar/searchbar";
import { useRef } from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { VideoPlayer } from "./videoplayer";

export const VideoContainer = () => {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  return (
    <div>
      <div className="absolute top-10 right-10 z-30">
        <AuthBar />
      </div>
      <VideoPlayer ref={videoPlayerRef} />
      <div className="absolute bottom-8 left-0 right-0 px-4 z-10">
        <SearchBar videoPlayerRef={videoPlayerRef} />
      </div>
    </div>
  );
};
