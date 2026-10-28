export async function onRequestGet({ request, env }) {
  const apiKey = env.TMDB_API_KEY;

  if (!apiKey) {
    return Response.json(
      { success: false, error: "Chiave TMDB non configurata su Cloudflare." },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("query") || "").trim();
  const type = (url.searchParams.get("type") || "all").toLowerCase();

  if (query.length < 2) {
    return Response.json(
      { success: false, error: "Inserisci almeno due caratteri." },
      { status: 400 }
    );
  }

  if (!["all", "movie", "tv"].includes(type)) {
    return Response.json(
      { success: false, error: "Tipo di ricerca non valido." },
      { status: 400 }
    );
  }

  const endpoint =
    type === "all"
      ? "search/multi"
      : type === "movie"
        ? "search/movie"
        : "search/tv";

  try {
    const tmdbUrl = new URL(
      `https://api.themoviedb.org/3/${endpoint}`
    );

    tmdbUrl.searchParams.set("api_key", apiKey);
    tmdbUrl.searchParams.set("query", query);
    tmdbUrl.searchParams.set("language", "it-IT");
    tmdbUrl.searchParams.set("page", "1");
    tmdbUrl.searchParams.set("include_adult", "false");

    const response = await fetch(tmdbUrl.toString(), {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: "TMDB non ha completato la ricerca.",
          status: response.status
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const results = (data.results || [])
      .filter(item => item.media_type !== "person")
      .map(item => ({
        id: item.id,
        type: item.media_type ||
          (endpoint === "search/movie" ? "movie" :
           endpoint === "search/tv" ? "tv" : "unknown"),
        title: item.title || item.name || "Titolo non disponibile",
        originalTitle: item.original_title || item.original_name || "",
        overview: item.overview || "",
        releaseDate: item.release_date || item.first_air_date || "",
        year: (item.release_date || item.first_air_date || "").slice(0, 4),
        poster: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
          : null,
        rating: item.vote_average ?? null
      }));

    return Response.json(
      {
        success: true,
        query,
        page: data.page || 1,
        total: data.total_results || 0,
        results
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60"
        }
      }
    );
  } catch {
    return Response.json(
      { success: false, error: "Errore durante la ricerca TMDB." },
      { status: 500 }
    );
  }
}
