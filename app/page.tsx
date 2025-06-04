import { SearchBar } from "@/src/components/searchbar";
import { VideoPlayer } from "@/src/components/videoplayer";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <VideoPlayer />
      <div className="absolute bottom-10 left-0 right-0">
        <SearchBar />
      </div>
    </div>
  );
}
