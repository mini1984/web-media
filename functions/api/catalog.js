
export async function onRequestGet({ request }) {
  const base = new URL(request.url);

  try {
    const response = await fetch(
      new URL("/api/sources", base.origin),
      { headers: { "Accept": "application/json" } }
    );

    if (!response.ok) {
      return Response.json(
        { error: "Impossibile recuperare le fonti." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const sources = Array.isArray(data.sources) ? data.sources : [];

    const catalog = sources.map((url) => {
      let host;

      try {
        host = new URL(url).hostname.toLowerCase();
      } catch {
        return null;
      }

      let type = "da_verificare";

      if (/anime/.test(host)) {
        type = "anime";
      } else if (/iptv|tv|live|streaming.*tv/.test(host)) {
        type = "tv_live_da_verificare";
      } else if (/film|movie|altadefinizione|cb01|streamingcommunity|eurostreaming/.test(host)) {
        type = "film_serie_da_verificare";
      } else if (/1337x|rarbg/.test(host)) {
        type = "torrent";
      }

      return {
        url,
        host,
        type,
        status: "non_verificato"
      };
    }).filter(Boolean);

    return Response.json({
      success: true,
      total: catalog.length,
      note: "Classificazione preliminare: i domini non confermano la presenza di contenuti o flussi riproducibili.",
      sources: catalog
    }, {
      headers: {
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch {
    return Response.json(
      { error: "Errore durante la classificazione delle fonti." },
      { status: 500 }
    );
  }
}
