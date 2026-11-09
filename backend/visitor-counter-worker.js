/** 7jabek-site shared, privacy-conscious browser visitor counter. */
const ALLOWED_ORIGIN = "https://7jabk.github.io";
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Vary": "Origin",
      "X-Content-Type-Options": "nosniff"
    });
    if (origin === ALLOWED_ORIGIN) headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    const reply = (payload, status = 200) =>
      new Response(JSON.stringify(payload), { status, headers });
    const path = new URL(request.url).pathname;
    if (path !== "/api/visitors") return reply({ error: "not_found" }, 404);
    if (request.method === "OPTIONS") {
      if (origin !== ALLOWED_ORIGIN) return reply({ error: "forbidden" }, 403);
      headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Content-Type");
      headers.set("Access-Control-Max-Age", "600");
      return new Response(null, { status: 204, headers });
    }
    if (!["GET", "POST"].includes(request.method)) return reply({ error: "method_not_allowed" }, 405);
    if (origin && origin !== ALLOWED_ORIGIN) return reply({ error: "forbidden" }, 403);
    if (request.method === "POST") {
      if (origin !== ALLOWED_ORIGIN) return reply({ error: "origin_required" }, 403);
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type") || ""))
        return reply({ error: "invalid_content_type" }, 415);
      if (Number(request.headers.get("Content-Length") || 0) > 256)
        return reply({ error: "payload_too_large" }, 413);
      let body;
      try { body = await request.json(); } catch { return reply({ error: "invalid_json" }, 400); }
      if (!body || typeof body.visitorId !== "string" || !ID_RE.test(body.visitorId))
        return reply({ error: "invalid_visitor_id" }, 400);
      try {
        await env.DB.prepare("INSERT OR IGNORE INTO visitor_ids(id) VALUES (?)").bind(body.visitorId.toLowerCase()).run();
      } catch {
        return reply({ error: "storage_unavailable" }, 503);
      }
    }
    try {
      const row = await env.DB.prepare("SELECT total FROM site_counts WHERE key = 'all'").first();
      if (!row || !Number.isSafeInteger(Number(row.total))) return reply({ error: "counter_unavailable" }, 503);
      return reply({ count: Number(row.total) });
    } catch {
      return reply({ error: "storage_unavailable" }, 503);
    }
  }
};