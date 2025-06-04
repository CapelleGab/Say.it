"use client";

import { useRef } from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { SearchBar } from "./searchbar";
import { VideoPlayer } from "./videoplayer";

export const VideoContainer = () => {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  return (
    <div className="">
      <VideoPlayer ref={videoPlayerRef} />
      <div className="absolute bottom-8 left-0 right-0 px-4">
        <SearchBar videoPlayerRef={videoPlayerRef} />
      </div>
    </div>
  );
};
