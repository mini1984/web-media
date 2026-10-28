
const PASTEBIN_URL = "https://pastebin.com/raw/KgQ4jTy6";

export async function onRequestGet() {
  try {
    const response = await fetch(PASTEBIN_URL, {
      headers: {
        "Accept": "text/plain",
        "User-Agent": "WebMediaTVLive/1.0"
      }
    });

    if (!response.ok) {
      return Response.json(
        { error: "Impossibile leggere la lista Pastebin." },
        { status: 502 }
      );
    }

    const text = await response.text();

    const urls = [...new Set(
      text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => /^https?:\/\/\S+$/i.test(line))
    )];

    return Response.json({
      success: true,
      count: urls.length,
      sources: urls
    }, {
      headers: {
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (error) {
    return Response.json(
      { error: "Errore durante la lettura delle fonti." },
      { status: 500 }
    );
  }
}
