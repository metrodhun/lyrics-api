export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // POST /lyrics (optional restricted)
    if (url.pathname === "/lyrics" && request.method === "POST") {
      try {
        const { title, artist, image, content } = await request.json();
        if (!title || !artist || !content) {
          return jsonResponse({ error: "Fields 'title', 'artist', 'content' required" }, 400, "*");
        }

        await env.DB.prepare(
          "INSERT INTO lyrics (title, artist, image, content) VALUES (?, ?, ?, ?)"
        ).bind(title, artist, image || null, content).run();

        return jsonResponse({ message: "Lyrics added successfully", title, artist }, 200, "*");
      } catch (err) {
        return jsonResponse({ error: "Invalid JSON or DB error", details: err.message }, 400, "*");
      }
    }

    // GET /lyrics/:title
    if (url.pathname.startsWith("/lyrics/") && request.method === "GET") {
      const title = url.pathname.replace("/lyrics/", "").toLowerCase();
      try {
        const { results } = await env.DB.prepare(
          "SELECT title, artist, image, content FROM lyrics WHERE LOWER(title) = ?"
        ).bind(title).all();

        if (results.length > 0) return jsonResponse(results[0], 200, "*");
        return jsonResponse({ error: "Lyrics not found" }, 404, "*");
      } catch (err) {
        return jsonResponse({ error: "Database error", details: err.message }, 500, "*");
      }
    }

    // GET /search?q=...
    if (url.pathname === "/search" && request.method === "GET") {
      const query = url.searchParams.get("q");
      if (!query) {
        return jsonResponse({ error: "Missing query parameter ?q=" }, 400, "*");
      }

      try {
        const { results } = await env.DB.prepare(
          "SELECT title, artist, image, substr(content,1,80) || '...' as snippet " +
          "FROM lyrics WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(content) LIKE ?"
        )
          .bind(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`)
          .all();

        return jsonResponse({ query, results }, 200, "*");
      } catch (err) {
        return jsonResponse({ error: "Database error", details: err.message }, 500, "*");
      }
    }

    return jsonResponse({ error: "Not Found" }, 404, "*");
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
