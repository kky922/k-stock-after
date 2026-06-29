exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return jsonResponse({}, 204);
  }

  try {
    const response = await fetch("https://api.upbit.com/v1/ticker?markets=KRW-USDT", {
      headers: { accept: "application/json" }
    });
    const data = await response.json();
    const row = Array.isArray(data) ? data[0] : null;
    const rate = Number(row?.trade_price || 0);
    if (!response.ok || rate <= 0) {
      throw new Error(row?.error?.message || `${response.status} ${response.statusText}`);
    }

    return jsonResponse({
      source: "Upbit",
      pair: "KRW-USDT",
      rate,
      updated_at: row?.timestamp ? new Date(Number(row.timestamp)).toISOString() : new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({ source: "Upbit", error: error.message }, 502);
  }
};

function jsonResponse(payload, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "cache-control": "no-store"
    },
    body: statusCode === 204 ? "" : JSON.stringify(payload)
  };
}
