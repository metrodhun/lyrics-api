const ALLOWED_DOMAINS = [
  "https://buildvergelyrics.blogspot.com",
  "https://musicplayer.example",
  "http://localhost:3000"
];

export default {
  async fetch(request, env) {
    if (!checkAccess(request)) {
      return jsonResponse({ error: "Access denied" }, 403);
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return jsonResponse({ message: "Welcome to My Lyrics API (D1)" });
    }

    // Add lyrics
    if (url.pathname === "/lyrics" && request.method === "POST") {
      try {
        const { title, artist, image, content } = await request.json();
        if (!title || !artist || !content) {
          return jsonResponse({ error: "Fields 'title', 'artist', 'content' required" }, 400);
        }
        await env.DB.prepare(
          "INSERT INTO lyrics (title, artist, image, content) VALUES (?, ?, ?, ?)"
        ).bind(title, artist, image || null, content).run();
        return jsonResponse({ message: "Lyrics added successfully", title, artist });
      } catch (err) {
        return jsonResponse({ error: "Invalid JSON or DB error", details: err.message }, 400);
      }
    }

    // Fetch lyrics by title
    if (url.pathname.startsWith("/lyrics/") && request.method === "GET") {
      const title = url.pathname.replace("/lyrics/", "").toLowerCase();
      const { results } = await env.DB.prepare(
        "SELECT title, artist, image, content FROM lyrics WHERE LOWER(title) = ?"
      ).bind(title).all();
      if (results.length > 0) return jsonResponse(results[0]);
      return jsonResponse({ error: "Lyrics not found" }, 404);
    }

    // Search
    if (url.pathname === "/search" && request.method === "GET") {
      const query = url.searchParams.get("q");
      if (!query) return jsonResponse({ error: "Missing query parameter ?q=" }, 400);
      const { results } = await env.DB.prepare(
        "SELECT title, artist, image, substr(content,1,80) || '...' as snippet " +
        "FROM lyrics WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(content) LIKE ?"
      ).bind(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`).all();
      return jsonResponse({ query, results });
    }

    return jsonResponse({ error: "Not Found" }, 404);
  }
};

function checkAccess(request) {
  const origin = request.headers.get("Origin") || request.headers.get("Referer");
  if (!origin) return false;
  return ALLOWED_DOMAINS.some(domain => origin.startsWith(domain));
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
