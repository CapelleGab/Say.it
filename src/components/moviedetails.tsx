import { ChevronLeft, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { MovieDetails } from "../types/movieDetailsType";

export const MovieCard = ({ movieInfo }: { movieInfo: MovieDetails }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <>
      {isVisible ? (
        <div className="fixed right-4 md:right-6 top-[50%] translate-y-[-50%] w-72 sm:w-80 md:w-96 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4 z-10 max-h-[90vh] ">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold flex items-center">
              {movieInfo.title}
              {movieInfo.year && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({movieInfo.year})
                </span>
              )}
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 rounded-full hover:bg-secondary/60"
              aria-label="Masquer les informations"
            >
              <X size={18} />
            </button>
          </div>

          {movieInfo.poster && (
            <div className="mb-3">
              <Image
                src={movieInfo.poster}
                alt={movieInfo.title || "Poster du film"}
                className="w-full h-auto rounded-lg object-cover shadow-md"
                width={300}
                height={400}
              />
            </div>
          )}

          {movieInfo.director && (
            <div className="mb-2">
              <h4 className="text-sm font-medium">Réalisateur:</h4>
              <p className="text-xs text-muted-foreground">
                {movieInfo.director}
              </p>
            </div>
          )}

          {movieInfo.actors && movieInfo.actors.length > 0 && (
            <div className="mb-2">
              <h4 className="text-sm font-medium">Acteurs principaux:</h4>
              <p className="text-xs text-muted-foreground">
                {movieInfo.actors.join(", ")}
              </p>
            </div>
          )}

          {movieInfo.media_type === "tv" &&
            (movieInfo.season || movieInfo.episode) && (
              <div className="mb-2 text-sm">
                {movieInfo.season && movieInfo.episode && (
                  <p>
                    Saison {movieInfo.season}, Épisode {movieInfo.episode}
                  </p>
                )}
                {movieInfo.season && !movieInfo.episode && (
                  <p>Saison {movieInfo.season}</p>
                )}
              </div>
            )}

          {movieInfo.overview && (
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-1">Synopsis:</h4>
              <p className="text-xs md:text-sm text-muted-foreground line-clamp-6">
                {movieInfo.overview}
              </p>
            </div>
          )}

          {movieInfo.id && (
            <div className="mb-3">
              <a
                href={`https://www.themoviedb.org/${
                  movieInfo.media_type === "tv" ? "tv" : "movie"
                }/${movieInfo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Voir plus de détails sur TMDB
              </a>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed right-4 top-[50%] translate-y-[-50%] bg-background/90 backdrop-blur-sm border border-border/50 rounded-full shadow-lg p-2 z-10 hover:bg-secondary/60"
          aria-label="Afficher les informations"
        >
          <ChevronLeft size={24} />
        </button>
      )}
    </>
  );
};
