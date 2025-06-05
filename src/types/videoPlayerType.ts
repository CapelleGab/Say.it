export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  togglePlay: () => void;
  getPlayState: () => boolean;
  setVideoSource: (src: string) => void;
  seekToTime: (time: string | number) => void;
  getCurrentSource: () => string | null;
  loadYouTubeVideo: (videoId: string, startTimeInSeconds?: number) => void;
  resetToDefaultVideo: () => void;
}
