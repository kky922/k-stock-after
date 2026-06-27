export default {
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    const symbol = url.searchParams.get("s");
    if (!symbol) return new Response(JSON.stringify({ error: "missing ?s=" }), { status: 400 });

    const upstream = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}.KS?interval=1d&range=1d`;
    try {
      const r = await fetch(upstream, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KStockProxy/1.0)" }
      });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60"
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};
