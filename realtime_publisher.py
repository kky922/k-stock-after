#!/usr/bin/env python3
"""Publish near-realtime KRX/crypto comparison snapshots from X9Pro.

This keeps personal KIS credentials on the local machine. The browser reads
only the generated quote snapshot, never the KIS key.
"""

from __future__ import annotations

import argparse
import json
import sys
import threading
import time
from dataclasses import dataclass
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo


KST = ZoneInfo("Asia/Seoul")
STOCK_BOT_DIR = Path("/Users/kangkuyun/stock_bot")
DEFAULT_OUTPUT = Path("realtime/quotes.json")
DEFAULT_INTERVAL_SEC = 3.0
DEFAULT_MAX_SKEW_MS = 2_000
FALLBACK_FX_RATE = 1545.0


@dataclass(frozen=True)
class Asset:
    code: str
    name: str
    binance_symbol: str


ASSETS = [
    Asset("005930", "삼성전자", "SAMSUNGUSDT"),
    Asset("000660", "SK하이닉스", "SKHYNIXUSDT"),
    Asset("005380", "현대차", "HYUNDAIUSDT"),
]

latest_snapshot: dict[str, Any] = {
    "status": "starting",
    "source": "x9pro_realtime_publisher",
    "updated_at": "",
    "fx_rate": FALLBACK_FX_RATE,
    "max_skew_ms": DEFAULT_MAX_SKEW_MS,
    "prices": {},
    "errors": {},
}
snapshot_lock = threading.Lock()
stop_event = threading.Event()


def now_kst_iso() -> str:
    return datetime.now(KST).isoformat(timespec="milliseconds")


def load_kis_client():
    if not STOCK_BOT_DIR.exists():
        raise RuntimeError(f"stock_bot not found: {STOCK_BOT_DIR}")
    if str(STOCK_BOT_DIR) not in sys.path:
        sys.path.insert(0, str(STOCK_BOT_DIR))
    from kis_api import KISAPI  # type: ignore

    return KISAPI()


def fetch_json(url: str, timeout: float = 5.0) -> Any:
    request = Request(url, headers={"accept": "application/json", "user-agent": "KStockRealtimePublisher/1.0"})
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_binance_prices() -> dict[str, dict[str, Any]]:
    tickers = fetch_json("https://fapi.binance.com/fapi/v1/ticker/price")
    stats = fetch_json("https://fapi.binance.com/fapi/v1/ticker/24hr")
    stats_by_symbol = {row.get("symbol"): row for row in stats if isinstance(row, dict)}
    received_at = now_kst_iso()

    prices: dict[str, dict[str, Any]] = {}
    for row in tickers:
        if not isinstance(row, dict):
            continue
        symbol = row.get("symbol")
        price = float(row.get("price") or 0)
        if symbol and price > 0:
            stat = stats_by_symbol.get(symbol, {})
            prices[symbol] = {
                "price": price,
                "received_at": received_at,
                "volume24h_usd": float(stat.get("quoteVolume") or 0),
                "change24h": float(stat.get("priceChangePercent") or 0),
            }
    return prices


def fetch_binance_quote(symbol: str) -> dict[str, Any]:
    price_row = fetch_json(f"https://fapi.binance.com/fapi/v1/ticker/price?symbol={symbol}")
    stats_row = fetch_json(f"https://fapi.binance.com/fapi/v1/ticker/24hr?symbol={symbol}")
    return {
        "price": float(price_row.get("price") or 0),
        "received_at": now_kst_iso(),
        "volume24h_usd": float(stats_row.get("quoteVolume") or 0),
        "change24h": float(stats_row.get("priceChangePercent") or 0),
    }


def read_fx_rate(kis: Any) -> float:
    try:
        rate = float(kis.get_exchange_rate())
        if rate > 1000 and rate != 1350.0:
            return rate
    except Exception:
        pass
    for url in (
        "https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW",
        "https://open.er-api.com/v6/latest/USD",
    ):
        try:
            data = fetch_json(url, timeout=4.0)
            if "rates" in data:
                rate = float(data["rates"].get("KRW") or 0)
            else:
                rate = 0
            if rate > 1000:
                return rate
        except Exception:
            continue
    return FALLBACK_FX_RATE


def build_snapshot(kis: Any, interval_sec: float, max_skew_ms: int) -> dict[str, Any]:
    errors: dict[str, str] = {}
    fx_rate = read_fx_rate(kis)
    prices: dict[str, dict[str, Any]] = {}

    for asset in ASSETS:
        try:
            krx = kis.get_stock_price(asset.code)
            krx_received_at = now_kst_iso()
            krx_price = float(krx.get("current") or 0)
            if krx_price <= 0:
                raise RuntimeError(krx.get("error_message") or "KIS price unavailable")
        except Exception as exc:
            errors[asset.code] = str(exc)
            continue

        try:
            token = fetch_binance_quote(asset.binance_symbol)
        except (URLError, TimeoutError, ValueError, OSError) as exc:
            token = {}
            errors[asset.binance_symbol] = str(exc)
        token_price_usd = float(token.get("price") or 0)
        token_received_at = token.get("received_at") or now_kst_iso()
        token_price_krw = token_price_usd * fx_rate if token_price_usd > 0 else 0

        krx_ts = parse_time_ms(krx_received_at)
        token_ts = parse_time_ms(token_received_at)
        skew_ms = abs(krx_ts - token_ts) if krx_ts and token_ts else None
        valid = token_price_krw > 0 and skew_ms is not None and skew_ms <= max_skew_ms

        premium_diff = token_price_krw - krx_price if valid else None
        premium_rate = (premium_diff / krx_price * 100) if valid and krx_price > 0 else None

        prices[asset.code] = {
            "name": krx.get("name") or asset.name,
            "krx_price": krx_price,
            "krx_source": "KIS",
            "krx_received_at": krx_received_at,
            "token_price_usd": token_price_usd,
            "token_price_krw": token_price_krw,
            "token_received_at": token_received_at,
            "crypto_source": "Binance Futures",
            "crypto_symbol": asset.binance_symbol,
            "volume24h_usd": token.get("volume24h_usd", 0),
            "skew_ms": skew_ms,
            "valid": valid,
            "premium_diff_krw": premium_diff,
            "premium_rate": premium_rate,
        }

    return {
        "status": "ok" if prices else "degraded",
        "source": "x9pro_realtime_publisher",
        "updated_at": now_kst_iso(),
        "interval_sec": interval_sec,
        "max_skew_ms": max_skew_ms,
        "fx_rate": fx_rate,
        "prices": prices,
        "errors": errors,
    }


def parse_time_ms(value: str) -> int | None:
    try:
        return int(datetime.fromisoformat(value).timestamp() * 1000)
    except ValueError:
        return None


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tmp.replace(path)


def publish_loop(output: Path, interval_sec: float, max_skew_ms: int, once: bool) -> None:
    kis = load_kis_client()
    while not stop_event.is_set():
        started = time.time()
        try:
            snapshot = build_snapshot(kis, interval_sec, max_skew_ms)
        except Exception as exc:
            snapshot = {
                "status": "error",
                "source": "x9pro_realtime_publisher",
                "updated_at": now_kst_iso(),
                "fx_rate": FALLBACK_FX_RATE,
                "max_skew_ms": max_skew_ms,
                "prices": {},
                "errors": {"_publisher": str(exc)},
            }

        with snapshot_lock:
            latest_snapshot.clear()
            latest_snapshot.update(snapshot)
        atomic_write_json(output, snapshot)
        print(
            f"{snapshot['updated_at']} status={snapshot['status']} "
            f"prices={len(snapshot.get('prices', {}))} output={output}",
            flush=True,
        )

        if once:
            return
        elapsed = time.time() - started
        stop_event.wait(max(0.2, interval_sec - elapsed))


class SnapshotHandler(BaseHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        if self.path.split("?", 1)[0] not in ("/", "/quotes.json"):
            self.send_response(404)
            self.end_headers()
            return

        with snapshot_lock:
            body = json.dumps(latest_snapshot, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(200)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("access-control-allow-origin", "*")
        self.send_header("cache-control", "no-store")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: Any) -> None:
        return


def serve(port: int) -> None:
    server = ThreadingHTTPServer(("127.0.0.1", port), SnapshotHandler)
    print(f"Serving realtime snapshot on http://127.0.0.1:{port}/quotes.json", flush=True)
    server.serve_forever()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Publish X9Pro KStock realtime quote snapshots.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--interval", type=float, default=DEFAULT_INTERVAL_SEC)
    parser.add_argument("--max-skew-ms", type=int, default=DEFAULT_MAX_SKEW_MS)
    parser.add_argument("--serve", type=int, default=8787, help="Serve quotes.json on this localhost port. Use 0 to disable.")
    parser.add_argument("--once", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.serve:
        threading.Thread(target=serve, args=(args.serve,), daemon=True).start()
    publish_loop(args.output, args.interval, args.max_skew_ms, args.once)


if __name__ == "__main__":
    main()
