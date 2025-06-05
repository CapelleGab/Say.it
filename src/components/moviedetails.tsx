import { MovieDetails } from "../types/movieDetailsType";

export const MovieCard = ({ movieInfo }: { movieInfo: MovieDetails }) => {
  return (
    <div className="fixed right-4 top-20 w-72 bg-background/90 backdrop-blur-sm border border-border/50 rounded-xl shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        {movieInfo.title}
        {movieInfo.year && (
          <span className="text-sm font-normal text-muted-foreground ml-2">
            ({movieInfo.year})
          </span>
        )}
      </h3>

      {movieInfo.poster && (
        <div className="mb-3">
          <img
            src={movieInfo.poster}
            alt={movieInfo.title || "Poster du film"}
            className="w-full h-auto rounded-lg object-cover shadow-md"
          />
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
          <p className="text-xs text-muted-foreground line-clamp-6">
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
  );
};
