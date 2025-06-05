"use client";

import { useEffect, useRef, useState } from "react";
import { VideoPlayerRef } from "../types/videoPlayerType";
import { SearchBar } from "./searchbar";
import { VideoPlayer } from "./videoplayer";

export const VideoContainer = () => {
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Vérifier que la référence est correctement attachée
  useEffect(() => {
    console.log("VideoPlayer ref initial:", videoPlayerRef.current);

    // Attendre que le composant soit monté
    const checkInterval = setInterval(() => {
      if (videoPlayerRef.current) {
        console.log(
          "VideoPlayer ref is now available:",
          videoPlayerRef.current
        );
        setIsPlayerReady(true);
        clearInterval(checkInterval);
      }
    }, 500);

    // Nettoyer l'intervalle au démontage
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <div className="">
      <VideoPlayer ref={videoPlayerRef} />
      <div className="absolute bottom-8 left-0 right-0 px-4 z-10">
        <SearchBar videoPlayerRef={videoPlayerRef} />
      </div>
    </div>
  );
};
