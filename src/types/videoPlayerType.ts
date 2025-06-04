export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  setVolume: (volume: number) => void;
  togglePlay: () => void;
  getPlayState: () => boolean;
}
