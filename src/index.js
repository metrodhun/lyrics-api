export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- Handle CORS preflight ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    function jsonResponse(data, status = 200) {
      const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      };
      return new Response(JSON.stringify(data, null, 2), { status, headers });
    }

    try {
      // --- POST /search : add/update lyrics ---
      if (url.pathname === "/search" && request.method === "POST") {
        const { title, artist, image, content } = await request.json();

        if (!title || !artist || !content) {
          return jsonResponse({ error: "Fields 'title', 'artist', 'content' are required" }, 400);
        }

        // Check if the title already exists
        const existing = await env.DB.prepare(
          "SELECT id, content FROM lyrics WHERE LOWER(title) = ?"
        ).bind(title.toLowerCase()).first();

        const now = new Date().toISOString();

        if (existing) {
          // If content is different, update the row
          if (existing.content !== content) {
            await env.DB.prepare(
              "UPDATE lyrics SET artist = ?, image = ?, content = ?, updated_at = ? WHERE id = ?"
            ).bind(artist, image || null, content, now, existing.id).run();

            return jsonResponse({ message: "Lyrics updated successfully", title, artist, updated_at: now });
          } else {
            // Content unchanged
            return jsonResponse({ message: "Lyrics already up to date", title, artist });
          }
        } else {
          // Insert new row
          await env.DB.prepare(
            "INSERT INTO lyrics (title, artist, image, content, published_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
          ).bind(title, artist, image || null, content, now, now).run();

          return jsonResponse({ message: "Lyrics added successfully", title, artist, published_at: now, updated_at: now });
        }
      }

      // --- GET /search?q=... : search lyrics ---
      if (url.pathname === "/search" && request.method === "GET") {
        const query = url.searchParams.get("q");
        if (!query) return jsonResponse({ error: "Missing query parameter ?q=" }, 400);

        const { results } = await env.DB.prepare(
          "SELECT title, artist, image, content, published_at, updated_at FROM lyrics " +
          "WHERE LOWER(title) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(content) LIKE ?"
        )
        .bind(`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`)
        .all();

        return jsonResponse({ query, results });
      }

      // --- Not Found ---
      return jsonResponse({ error: "Not Found" }, 404);

    } catch (err) {
      return jsonResponse({ error: "Database or Worker error", details: err.message }, 500);
    }
  }
};
