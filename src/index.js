export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // POST /lyrics - optional: still restricted by domain
    if (url.pathname === "/lyrics" && request.method === "POST") {
      const origin = request.headers.get("Origin") || request.headers.get("Referer");
      const ALLOWED_DOMAINS = ["https://myapp.com"];
      if (!origin || !ALLOWED_DOMAINS.some(d => origin.startsWith(d))) {
        return jsonResponse({ error: "Access denied" }, 403, origin);
      }

      try {
        const { title, artist, image, content } = await request.json();
        if (!title || !artist || !content) {
          return jsonResponse({ error: "Fields 'title', 'artist', 'content' required" }, 400, origin);
        }

        await env.DB.prepare(
          "INSERT INTO lyrics (title, artist, image, content) VALUES (?, ?, ?, ?)"
        ).bind(title, artist, image || null, content).run();

        return jsonResponse({ message: "Lyrics added successfully", title, artist }, 200, origin);
      } catch (err) {
        return jsonResponse({ error: "Invalid JSON or DB error", details: err.message }, 400, origin);
      }
    }

    // GET /lyrics/:title or GET /search - no domain restriction (public)
    if ((url.pathname.startsWith("/lyrics/") && request.method === "GET") || 
        (url.pathname === "/search" && request.method === "GET")) {

      const origin = request.headers.get("Origin") || "*"; // CORS for all

      // GET /lyrics/:title
      if (url.pathname.startsWith("/lyrics/")) {
        const title = url.pathname.replace("/lyrics/", "").toLowerCase();
        const { results } = await env.DB.prepare(
          "SELECT title, artist, image, content FROM lyrics WHERE LOWER(title) = ?"
        ).bind(title).all();

        if (results.length > 0) return jsonResponse(results[0], 200, origin);
        return jsonResponse({ error: "Lyrics not found" }, 404, origin);
      }

      // GET /search?q=...
      if (url.pathname === "/search") {
        const query = url.searchParams.get("q");
        if (!query) return jsonResponse({ error: "Missing query parameter ?q=" }, 400, origin);

        const { results } = await env.DB.prepare(
          "SELECT title, artist, image, substr(content,1,80) || '...' as snippet " +
          "FROM lyrics WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(content) LIKE ?"
        ).bind(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`).all();

        return jsonResponse({ query, results }, 200, origin);
      }
    }

    return jsonResponse({ error: "Not Found" }, 404);
  }
};

function jsonResponse(data, status = 200, origin = "*") {
  const headers = { 
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  return new Response(JSON.stringify(data, null, 2), { status, headers });
}
