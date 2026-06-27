# 코스피 외화시세 비교 PWA

한국 코스피 원화시세와 크립토거래소 외화시세를 원화로 환산한 값을 비교하는 모바일 PWA입니다.

## 실행

```bash
cd "/Volumes/X9Pro/projects/stock monitor"
python3 server.py
```

브라우저에서 엽니다.

```text
http://127.0.0.1:8765/index.html
```

## API

```text
GET /api/health
GET /api/krx-prices?symbols=005930,000660,005380
GET /api/fx/usdkrw
```

`/api/krx-prices`는 `/Users/kangkuyun/stock_bot/kis_api.py`의 `KISAPI.get_stock_price()`만 사용합니다. 매수/매도 API는 연결하지 않습니다.

## 비교 공식

```text
외화시세 원화환산 = 크립토 외화시세 × USD/KRW
괴리율 = (외화시세 원화환산 - 코스피 원화시세) / 코스피 원화시세 × 100
```

## 데이터 표시 기준

- 코스피 원화시세: KIS 실시간, 실패 시 마지막 성공 또는 샘플
- 크립토 외화시세: CoinGecko 또는 Hyperliquid에서 실제 심볼이 잡히는 경우만 표시
- 심볼이 안 잡히는 종목: `심볼 미확인`, `비교 대기`로 표시
- EWYON: 한국 ETF 토큰으로 유지하되, 삼성전자/하이닉스 개별주 비교와 분리

## 현재 감시 종목

- 삼성전자 `005930`
- SK하이닉스 `000660`
- 현대차 `005380`
- EWYON `ishares-msci-south-korea-etf-ondo-tokenized`

## 주의

크립토거래소의 토큰/Perp 가격은 실제 주식 소유권, 배당, 의결권과 다를 수 있습니다. 가격 소스가 확인되지 않은 종목은 괴리율을 계산하지 않습니다.
