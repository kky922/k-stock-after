# 온체인 코스피 모니터

한국 코스피 원화시세와 크립토거래소 외화 퍼페추얼 시세를 원화로 환산해 괴리율을 실시간 비교하는 모바일 PWA입니다.

**라이브**: https://kstock-monitor.netlify.app

## 구조

| 파일 | 역할 |
|------|------|
| `index.html` | UI 껍데기 |
| `app.js` | 시세 수집 · 괴리율 계산 · 렌더링 |
| `styles.css` | 스타일 |
| `sw.js` | Service Worker (PWA 오프라인 캐시) |
| `manifest.webmanifest` | PWA 메타데이터 |
| `krx-worker.js` | Cloudflare Worker — Yahoo Finance CORS 프록시 |

`server.py`는 개인 KIS API 키가 포함되어 git에 포함되지 않습니다.

## 데이터 소스

### KOSPI 원화시세
Yahoo Finance (`query2.finance.yahoo.com`) — Cloudflare Worker 프록시를 통해 CORS 우회

### 크립토 외화시세 (USD 퍼페추얼)
우선순위 폴백 체인:
1. **Binance Futures** `fapi.binance.com` — 배치 조회 (primary)
2. **Bybit V5** `api.bybit.com` — 누락 종목 보완
3. **OKX** `okx.com` — 추가 폴백
4. **Hyperliquid** `api.hyperliquid.xyz` — HL 전용 심볼 (SKHX 등)
5. **CoinGecko** — EWYON 전용

### USD/KRW 환율
`frankfurter.dev` → `open.er-api.com` 폴백

## 거래소 상장 종목 (2026-06-27 확인)

| 종목 | KRX | Binance | Bybit | OKX | Hyperliquid |
|------|-----|---------|-------|-----|-------------|
| 삼성전자 | 005930 | SAMSUNGUSDT | SAMSUNGUSDT | SAMSUNG-USDT-SWAP | — |
| SK하이닉스 | 000660 | SKHYNIXUSDT | SKHYNIXUSDT | SKHYNIX-USDT-SWAP | SKHX |
| 현대차 | 005380 | HYUNDAIUSDT | HYUNDAIUSDT | HYUNDAI-USDT-SWAP | — |

## 배포 구조

```
GitHub (kky922/k-stock-after)
  └─ Netlify 자동 배포 → kstock-monitor.netlify.app

Cloudflare Worker (orange-sunset-3ab4)
  └─ Yahoo Finance CORS 프록시 (KRX 시세용)
```

GitHub push 시 Netlify가 자동으로 재배포합니다.

## 괴리율 계산식

```
외화시세 원화환산 = 크립토 USD 시세 × USD/KRW
괴리율 = (외화시세 원화환산 − KOSPI 원화시세) / KOSPI 원화시세 × 100
```

## 주의

크립토거래소의 퍼페추얼은 실제 주식 소유권·배당·의결권과 다릅니다. 심볼이 확인된 종목만 괴리율을 표시합니다.
