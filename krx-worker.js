export default {
  async fetch(req) {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Accept, Cache-Control, Pragma",
          "Access-Control-Max-Age": "86400"
        }
      });
    }

    const symbol = url.searchParams.get("s");
    if (!symbol) return new Response(JSON.stringify({ error: "missing ?s=" }), { status: 400 });

    const upstream = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}.KS?interval=1m&range=1d&includePrePost=false&_=${Date.now()}`;
    try {
      const r = await fetch(upstream, {
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
          "User-Agent": "Mozilla/5.0 (compatible; KStockProxy/1.0)"
        },
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });
      const body = await r.text();
      return new Response(body, {
        status: r.status,
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store, max-age=0"
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
