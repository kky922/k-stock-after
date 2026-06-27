const FALLBACK_FX_RATE = 1545;
const API_TIMEOUT_MS = 8000;
const CG_TOKEN_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const KRX_PROXY_URL = "https://orange-sunset-3ab4.kangkuyun.workers.dev";

let fxRate = FALLBACK_FX_RATE;
let marketUpdatedAt = new Date().toISOString();

const apiState = {
  fx: "샘플",
  krx: "대기",
  tokenized: "대기"
};

const kospiAssets = [
  {
    id: "samsung-electronics",
    nameKo: "삼성전자",
    nameEn: "Samsung Electronics",
    krxTicker: "005930",
    cryptoSymbols: [],
    binanceSymbol: "SAMSUNGUSDT",
    bybitSymbol: "SAMSUNGUSDT",
    okxSymbol: "SAMSUNG-USDT-SWAP",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SAMSUNGUSDT",
    provider: "Binance / Bybit / OKX",
    status: "confirmed",
    note: "2026-06-02 Binance Futures, 06-04 Bybit, 06-10 OKX 상장. 퍼페추얼 컨트랙트 기준."
  },
  {
    id: "sk-hynix",
    nameKo: "SK하이닉스",
    nameEn: "SK Hynix",
    krxTicker: "000660",
    cryptoSymbols: ["SKHX"],
    binanceSymbol: "SKHYNIXUSDT",
    bybitSymbol: "SKHYNIXUSDT",
    okxSymbol: "SKHYNIX-USDT-SWAP",
    hlSymbol: "SKHX",
    coinGeckoId: "",
    tokenLabel: "SKHYNIXUSDT / SKHX",
    provider: "Binance / Bybit / OKX / Hyperliquid",
    status: "confirmed",
    note: "Hyperliquid SKHX $677M 24H 거래량. Binance/Bybit/OKX 동시 상장."
  },
  {
    id: "hyundai-motor",
    nameKo: "현대차",
    nameEn: "Hyundai Motor",
    krxTicker: "005380",
    cryptoSymbols: [],
    binanceSymbol: "HYUNDAIUSDT",
    bybitSymbol: "HYUNDAIUSDT",
    okxSymbol: "HYUNDAI-USDT-SWAP",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "HYUNDAIUSDT",
    provider: "Binance / Bybit / OKX",
    status: "confirmed",
    note: "2026-06-02 Binance Futures, 06-04 Bybit, 06-10 OKX 상장. 퍼페추얼 컨트랙트 기준."
  },
  // --- KOSPI 대형주 (상장 감시) ---
  {
    id: "lg-energy-solution",
    nameKo: "LG에너지솔루션",
    nameEn: "LG Energy Solution",
    krxTicker: "373220",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "LGES",
    provider: "상장 감시",
    status: "watch",
    note: "KOSPI 시총 3위. 배터리 섹터 대표주. 퍼페추얼 상장 시 즉시 연결."
  },
  {
    id: "samsung-biologics",
    nameKo: "삼성바이오로직스",
    nameEn: "Samsung Biologics",
    krxTicker: "207940",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SAMSUNGBIO",
    provider: "상장 감시",
    status: "watch",
    note: "KOSPI 바이오 대장주. 삼성전자 상장 이후 후속 종목으로 주목."
  },
  {
    id: "celltrion",
    nameKo: "셀트리온",
    nameEn: "Celltrion",
    krxTicker: "068270",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "CELLTRION",
    provider: "상장 감시",
    status: "watch",
    note: "바이오시밀러 글로벌 1위. 해외 투자자 관심도 높아 토큰화 후보."
  },
  {
    id: "kia",
    nameKo: "기아",
    nameEn: "Kia Corporation",
    krxTicker: "000270",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "KIA",
    provider: "상장 감시",
    status: "watch",
    note: "현대차와 함께 K-차동차 대표주. 현대차 상장 이후 연계 가능성."
  },
  {
    id: "posco-holdings",
    nameKo: "POSCO홀딩스",
    nameEn: "POSCO Holdings",
    krxTicker: "005490",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "POSCO",
    provider: "상장 감시",
    status: "watch",
    note: "글로벌 철강·2차전지 소재. ADR(PKX) 상장으로 해외 접근성 높음."
  },
  {
    id: "naver",
    nameKo: "NAVER",
    nameEn: "NAVER Corporation",
    krxTicker: "035420",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "NAVER",
    provider: "상장 감시",
    status: "watch",
    note: "한국 1위 인터넷 플랫폼. 라인·웹툰 글로벌 사업으로 해외 관심 높음."
  },
  {
    id: "kakao",
    nameKo: "카카오",
    nameEn: "Kakao Corp",
    krxTicker: "035720",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "KAKAO",
    provider: "상장 감시",
    status: "watch",
    note: "카카오뱅크·카카오페이 등 핀테크 생태계. 크립토 친화적 기업."
  },
  {
    id: "lg-chem",
    nameKo: "LG화학",
    nameEn: "LG Chem",
    krxTicker: "051910",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "LGCHEM",
    provider: "상장 감시",
    status: "watch",
    note: "배터리 소재·석유화학 대표주. LG에너지솔루션 모회사."
  },
  {
    id: "samsung-sdi",
    nameKo: "삼성SDI",
    nameEn: "Samsung SDI",
    krxTicker: "006400",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SAMSUNGSDI",
    provider: "상장 감시",
    status: "watch",
    note: "전기차 배터리 글로벌 3위. 삼성전자 상장 이후 후속 후보군."
  },
  {
    id: "hyundai-mobis",
    nameKo: "현대모비스",
    nameEn: "Hyundai Mobis",
    krxTicker: "012330",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "HMOBIS",
    provider: "상장 감시",
    status: "watch",
    note: "현대·기아차 부품 핵심 계열사. 현대차 상장과 연계 가능성."
  },
  {
    id: "kb-financial",
    nameKo: "KB금융",
    nameEn: "KB Financial Group",
    krxTicker: "105560",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "KB",
    provider: "상장 감시",
    status: "watch",
    note: "국내 1위 금융지주. NYSE ADR(KB) 상장으로 해외 접근 용이."
  },
  {
    id: "shinhan-financial",
    nameKo: "신한지주",
    nameEn: "Shinhan Financial Group",
    krxTicker: "055550",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SHG",
    provider: "상장 감시",
    status: "watch",
    note: "NYSE ADR(SHG) 상장. 국내 금융주 중 해외 거래량 상위."
  },
  {
    id: "sk-telecom",
    nameKo: "SK텔레콤",
    nameEn: "SK Telecom",
    krxTicker: "017670",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SKT",
    provider: "상장 감시",
    status: "watch",
    note: "국내 1위 통신사. AI·반도체 투자로 해외 주목도 상승 중."
  },
  {
    id: "lg-electronics",
    nameKo: "LG전자",
    nameEn: "LG Electronics",
    krxTicker: "066570",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "LGE",
    provider: "상장 감시",
    status: "watch",
    note: "가전·전장 글로벌 선두. 삼성전자 토큰화 성공 시 연계 후보."
  },
  {
    id: "krafton",
    nameKo: "크래프톤",
    nameEn: "Krafton",
    krxTicker: "259960",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "KRAFTON",
    provider: "상장 감시",
    status: "watch",
    note: "배틀그라운드(PUBG) 개발사. 게임·크립토 교차 투자자 관심 높음."
  },
  {
    id: "netmarble",
    nameKo: "넷마블",
    nameEn: "Netmarble",
    krxTicker: "251270",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "NETMARBLE",
    provider: "상장 감시",
    status: "watch",
    note: "글로벌 모바일 게임사. 자체 블록체인 게임 사업 보유."
  },
  {
    id: "hana-financial",
    nameKo: "하나금융지주",
    nameEn: "Hana Financial Group",
    krxTicker: "086790",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "HFG",
    provider: "상장 감시",
    status: "watch",
    note: "국내 3위 금융지주. 디지털금융 전환 적극 추진."
  },
  {
    id: "kepco",
    nameKo: "한국전력",
    nameEn: "Korea Electric Power",
    krxTicker: "015760",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "KEP",
    provider: "상장 감시",
    status: "watch",
    note: "NYSE ADR(KEP) 상장. 국내 유일 전력 공기업."
  },
  {
    id: "samsung-ct",
    nameKo: "삼성물산",
    nameEn: "Samsung C&T",
    krxTicker: "028260",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SAMSUNGCT",
    provider: "상장 감시",
    status: "watch",
    note: "삼성그룹 지주 역할. 삼성전자 대규모 지분 보유."
  },
  {
    id: "sk-hynix-aim",
    nameKo: "SK이노베이션",
    nameEn: "SK Innovation",
    krxTicker: "096770",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "",
    tokenLabel: "SKINNO",
    provider: "상장 감시",
    status: "watch",
    note: "SK온(배터리) 모회사. 전기차 배터리 섹터 투자 관심주."
  },
  // --- 온체인 토큰화 ETF ---
  {
    id: "ewyon",
    nameKo: "EWYon",
    nameEn: "iShares MSCI South Korea ETF Ondo",
    krxTicker: "",
    cryptoSymbols: [],
    binanceSymbol: "",
    bybitSymbol: "",
    okxSymbol: "",
    hlSymbol: "",
    coinGeckoId: "ishares-msci-south-korea-etf-ondo-tokenized",
    tokenLabel: "EWYON",
    provider: "Ondo / CoinGecko",
    status: "confirmed",
    note: "한국 ETF 토큰 가격은 CoinGecko 확인됨. 개별 코스피 주식 기준 비교는 별도."
  }
];

let assets = kospiAssets.map(buildAsset);

const state = {
  view: "home",
  rankSort: "abs",
  rankFilter: "all",
  watchlist: readJson("watchlist", ["samsung-electronics", "sk-hynix"]),
  alerts: readJson("alerts", [])
};

const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const number = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 });

function buildAsset(item) {
  const hasSource = item.coinGeckoId || item.binanceSymbol || item.hlSymbol || item.cryptoSymbols.length;
  return {
    ...item,
    yahooSymbol: item.krxTicker ? `${item.krxTicker}.KS` : "",
    krxName: item.nameKo,
    krxPriceKrw: 0,
    krxSource: "대기",
    tokenPriceUsd: 0,
    tokenPriceKrw: 0,
    tokenChange24h: 0,
    volume24hUsd: 0,
    tokenSource: hasSource ? "대기" : "심볼 미확인",
    matchedSymbol: "",
    premiumRate: null,
    updatedAt: marketUpdatedAt,
    risk: "크립토거래소의 퍼페추얼/토큰 가격은 실제 주식 소유권, 배당, 의결권과 다릅니다. 24시간 거래되며 현물 주식과 괴리가 발생할 수 있습니다."
  };
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function premiumClass(value) {
  if (value == null) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function formatRate(value) {
  if (value == null || !Number.isFinite(value)) return "비교 대기";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatMoneyKrw(value) {
  return value > 0 ? won.format(value) : "-";
}

function formatMoneyUsd(value) {
  return value > 0 ? usd.format(value) : "시세 없음";
}

function render() {
  document.querySelector("#fxRate").textContent = won.format(fxRate);
  document.querySelector("#krxState").textContent = getKrxState();
  document.querySelector("#cryptoState").textContent = apiState.tokenized || "-";
  document.querySelector("#lastUpdated").textContent = `업데이트 ${formatTime(marketUpdatedAt)}`;
  document.querySelector("#fxSource").textContent = apiState.fx ? `환율 ${apiState.fx}` : "";
  document.querySelector("#apiStatus").textContent = apiStatusText();
  renderAssets(assets);
  renderUniverse();
  renderRanking(assets);
  renderWatchlist(assets);
  renderAlerts(assets);
  renderAlertOptions(assets);
}

function apiStatusText() {
  return `데이터: KOSPI ${apiState.krx} · 크립토 외화시세 ${apiState.tokenized} · USD/KRW ${apiState.fx}`;
}

async function loadLiveData() {
  render();
  await updateFxRate();
  await Promise.allSettled([updateKrxPrices(), updateCryptoPrices()]);
  calculatePremiums();
  marketUpdatedAt = new Date().toISOString();
  for (const asset of assets) asset.updatedAt = marketUpdatedAt;
  render();
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        accept: "application/json",
        ...(options.headers ?? {})
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function updateKrxPrices() {
  const targets = assets.filter((a) => a.yahooSymbol);
  if (!targets.length) return;

  const results = await Promise.allSettled(
    targets.map((asset) =>
      fetchJson(`${KRX_PROXY_URL}/?s=${asset.krxTicker}`).then((data) => ({ asset, data }))
    )
  );

  let updated = 0;
  const priceCache = {};

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { asset, data } = result.value;
    const meta = data?.chart?.result?.[0]?.meta;
    const price = Number(meta?.regularMarketPrice ?? 0);
    if (price <= 0) continue;
    asset.krxName = meta.shortName || asset.nameKo;
    asset.krxPriceKrw = price;
    asset.krxSource = "Yahoo Finance";
    priceCache[asset.krxTicker] = { name: asset.krxName, price };
    updated += 1;
  }

  if (updated > 0) {
    apiState.krx = `Yahoo Finance (${updated}종목)`;
    writeJson("lastKrxPrices", { savedAt: new Date().toISOString(), prices: priceCache });
    return;
  }

  // 모든 fetch 실패 시 캐시 사용
  const cached = readJson("lastKrxPrices", null);
  if (cached?.prices) {
    for (const asset of assets) {
      const row = cached.prices[asset.krxTicker];
      const price = Number(row?.price ?? 0);
      if (price > 0) {
        asset.krxName = row.name || asset.nameKo;
        asset.krxPriceKrw = price;
        asset.krxSource = "마지막 성공";
      }
    }
    apiState.krx = "마지막 성공";
    return;
  }
  apiState.krx = "시세 없음";
}

async function updateCryptoPrices() {
  // 병렬 fetch: CoinGecko(EWYON) + Binance(perps)
  const [cgCount, bnCount] = await Promise.all([
    updateCoinGeckoPrices(),
    updateBinancePrices()
  ]);

  // Binance에서 못 잡은 perp 자산은 Bybit → OKX → Hyperliquid 순으로 보완
  const missing = assets.filter((a) => a.binanceSymbol && a.tokenPriceUsd <= 0);
  if (missing.length) await updateBybitPrices(missing);

  const stillMissing = assets.filter((a) => a.binanceSymbol && a.tokenPriceUsd <= 0);
  if (stillMissing.length) await updateOKXPrices(stillMissing);

  // Hyperliquid 전용 심볼 (SKHX 등)
  await updateHyperliquidPrices();

  const updated = assets.filter((a) => a.tokenPriceUsd > 0).length;
  if (updated > 0) {
    const sources = [...new Set(assets.filter((a) => a.tokenPriceUsd > 0).map((a) => a.tokenSource.split(" · ")[0]))];
    apiState.tokenized = sources.join(" / ");
    writeJson("lastCryptoPrices", {
      savedAt: new Date().toISOString(),
      assets: assets.map((asset) => ({
        id: asset.id,
        tokenPriceUsd: asset.tokenPriceUsd,
        tokenPriceKrw: asset.tokenPriceKrw,
        tokenChange24h: asset.tokenChange24h,
        volume24hUsd: asset.volume24hUsd,
        tokenSource: asset.tokenSource,
        matchedSymbol: asset.matchedSymbol
      }))
    });
    return;
  }

  const cached = readJson("lastCryptoPrices", null);
  if (cached?.assets?.length) {
    for (const row of cached.assets) {
      const asset = assets.find((item) => item.id === row.id);
      if (!asset) continue;
      asset.tokenPriceUsd = Number(row.tokenPriceUsd ?? 0);
      asset.tokenPriceKrw = Number(row.tokenPriceKrw ?? asset.tokenPriceUsd * fxRate);
      asset.tokenChange24h = Number(row.tokenChange24h ?? 0);
      asset.volume24hUsd = Number(row.volume24hUsd ?? 0);
      asset.tokenSource = row.tokenSource ? `마지막 성공 · ${row.tokenSource}` : "마지막 성공";
      asset.matchedSymbol = row.matchedSymbol || "";
    }
    apiState.tokenized = "마지막 성공";
    return;
  }

  apiState.tokenized = "시세 없음";
}

async function updateCoinGeckoPrices() {
  const liveAssets = assets.filter((asset) => asset.coinGeckoId);
  if (!liveAssets.length) return 0;
  try {
    const query = new URLSearchParams({
      ids: liveAssets.map((asset) => asset.coinGeckoId).join(","),
      vs_currencies: "usd,krw",
      include_24hr_change: "true",
      include_24hr_vol: "true"
    });
    const prices = await fetchJson(`${CG_TOKEN_PRICE_URL}?${query.toString()}`);
    let updated = 0;
    for (const asset of liveAssets) {
      const item = prices?.[asset.coinGeckoId];
      const tokenUsd = Number(item?.usd ?? 0);
      if (tokenUsd <= 0) continue;
      asset.tokenPriceUsd = tokenUsd;
      asset.tokenPriceKrw = Number(item.krw ?? tokenUsd * fxRate);
      asset.tokenChange24h = Number(item.usd_24h_change ?? 0);
      asset.volume24hUsd = Number(item.usd_24h_vol ?? 0);
      asset.tokenSource = "CoinGecko";
      asset.matchedSymbol = asset.tokenLabel;
      updated += 1;
    }
    return updated;
  } catch {
    return 0;
  }
}

async function updateBinancePrices() {
  const targets = assets.filter((a) => a.binanceSymbol);
  if (!targets.length) return 0;
  try {
    // 배치 조회: 전체 ticker 가격 목록
    const tickers = await fetchJson("https://fapi.binance.com/fapi/v1/ticker/price");
    const priceMap = {};
    for (const t of tickers) priceMap[t.symbol] = Number(t.price);

    // 24H 통계 (변화율, 거래량)
    const stats = await fetchJson("https://fapi.binance.com/fapi/v1/ticker/24hr");
    const statsMap = {};
    for (const s of stats) statsMap[s.symbol] = s;

    let updated = 0;
    for (const asset of targets) {
      const price = priceMap[asset.binanceSymbol];
      if (!price || price <= 0) continue;
      const stat = statsMap[asset.binanceSymbol] ?? {};
      asset.tokenPriceUsd = price;
      asset.tokenPriceKrw = price * fxRate;
      asset.tokenChange24h = Number(stat.priceChangePercent ?? 0);
      asset.volume24hUsd = Number(stat.quoteVolume ?? 0);
      asset.tokenSource = `Binance · ${asset.binanceSymbol}`;
      asset.matchedSymbol = asset.binanceSymbol;
      updated += 1;
    }
    return updated;
  } catch {
    return 0;
  }
}

async function updateBybitPrices(targets) {
  if (!targets?.length) return 0;
  let updated = 0;
  for (const asset of targets) {
    if (!asset.bybitSymbol) continue;
    try {
      const data = await fetchJson(
        `https://api.bybit.com/v5/market/tickers?category=linear&symbol=${asset.bybitSymbol}`
      );
      const price = Number(data?.result?.list?.[0]?.lastPrice ?? 0);
      if (price <= 0) continue;
      const item = data.result.list[0];
      asset.tokenPriceUsd = price;
      asset.tokenPriceKrw = price * fxRate;
      asset.tokenChange24h = Number(item.price24hPcnt ?? 0) * 100;
      asset.volume24hUsd = Number(item.turnover24h ?? 0);
      asset.tokenSource = `Bybit · ${asset.bybitSymbol}`;
      asset.matchedSymbol = asset.bybitSymbol;
      updated += 1;
    } catch {
      // 다음 거래소로 fallback
    }
  }
  return updated;
}

async function updateOKXPrices(targets) {
  if (!targets?.length) return 0;
  let updated = 0;
  for (const asset of targets) {
    if (!asset.okxSymbol) continue;
    try {
      const data = await fetchJson(
        `https://www.okx.com/api/v5/market/ticker?instId=${asset.okxSymbol}`
      );
      const price = Number(data?.data?.[0]?.last ?? 0);
      if (price <= 0) continue;
      const item = data.data[0];
      asset.tokenPriceUsd = price;
      asset.tokenPriceKrw = price * fxRate;
      asset.tokenChange24h = 0;
      asset.volume24hUsd = Number(item.volCcy24h ?? 0) * price;
      asset.tokenSource = `OKX · ${asset.okxSymbol}`;
      asset.matchedSymbol = asset.okxSymbol;
      updated += 1;
    } catch {
      // 다음으로 넘김
    }
  }
  return updated;
}

async function updateHyperliquidPrices() {
  // Hyperliquid 전용 심볼이 있는 자산만 (이미 다른 거래소에서 잡혔더라도 HL 가격 보완 가능)
  const candidates = assets.filter((a) => a.hlSymbol || a.cryptoSymbols.length);
  if (!candidates.length) return 0;
  try {
    const mids = await fetchJson(HYPERLIQUID_INFO_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "allMids" })
    });
    let updated = 0;
    for (const asset of candidates) {
      // 이미 메인 거래소에서 가격이 잡혔으면 스킵 (HL은 보완 전용)
      if (asset.tokenPriceUsd > 0 && !asset.hlSymbol) continue;
      const symbols = asset.hlSymbol ? [asset.hlSymbol, ...asset.cryptoSymbols] : asset.cryptoSymbols;
      const matched = symbols.find((s) => Number(mids?.[s]) > 0);
      if (!matched) {
        if (!asset.tokenPriceUsd) asset.tokenSource = "심볼 없음";
        continue;
      }
      const tokenUsd = Number(mids[matched]);
      // HL 심볼이 지정된 경우 무조건 HL 가격 우선 (SKHX 등 HL 전용)
      if (asset.hlSymbol === matched || asset.tokenPriceUsd <= 0) {
        asset.tokenPriceUsd = tokenUsd;
        asset.tokenPriceKrw = tokenUsd * fxRate;
        asset.tokenSource = `Hyperliquid · ${matched}`;
        asset.matchedSymbol = matched;
      }
      updated += 1;
    }
    return updated;
  } catch {
    for (const asset of candidates) {
      if (!asset.tokenPriceUsd) asset.tokenSource = "크립토 API 실패";
    }
    return 0;
  }
}

async function updateFxRate() {
  let fallbackCandidate = null;
  const sources = [
    async () => {
      const data = await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW");
      return { rate: Number(data?.rates?.KRW), label: "실시간" };
    },
    async () => {
      const data = await fetchJson("https://open.er-api.com/v6/latest/USD");
      return { rate: Number(data?.rates?.KRW), label: "실시간" };
    }
  ];

  for (const source of sources) {
    try {
      const result = await source();
      const rate = result.rate;
      if (Number.isFinite(rate) && rate > 1000) {
        if (result.label === "fallback") {
          fallbackCandidate = { rate, label: "fallback" };
          continue;
        }
        fxRate = rate;
        apiState.fx = result.label;
        writeJson("lastFxRate", { savedAt: new Date().toISOString(), rate, label: apiState.fx });
        return;
      }
    } catch {
      apiState.fx = "샘플";
    }
  }
  if (fallbackCandidate) {
    fxRate = fallbackCandidate.rate;
    apiState.fx = fallbackCandidate.label;
    return;
  }
  const cached = readJson("lastFxRate", null);
  if (cached?.rate) {
    fxRate = Number(cached.rate);
    apiState.fx = "마지막 성공";
  }
}

function calculatePremiums() {
  for (const asset of assets) {
    if (asset.tokenPriceUsd > 0) {
      asset.tokenPriceKrw = asset.tokenPriceKrw || asset.tokenPriceUsd * fxRate;
    }
    if (asset.tokenPriceKrw > 0 && asset.krxPriceKrw > 0) {
      asset.premiumRate = ((asset.tokenPriceKrw - asset.krxPriceKrw) / asset.krxPriceKrw) * 100;
    } else {
      asset.premiumRate = null;
    }
  }
}

function getKrxState() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const current = hour * 60 + minute;
  if (day === 0 || day === 6) return "휴장";
  return current >= 9 * 60 && current <= 15 * 60 + 30 ? "거래중" : "마감";
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function renderAssets(items) {
  // 홈에는 실제 시세 비교가 가능한 confirmed 종목만 표시
  const comparable = items.filter((asset) => asset.status === "confirmed" && asset.krxPriceKrw > 0 && asset.tokenPriceKrw > 0);
  const watched = comparable.filter((asset) => state.watchlist.includes(asset.id));
  const ordered = watched.length
    ? [...watched, ...comparable.filter((asset) => !state.watchlist.includes(asset.id))]
    : comparable;
  document.querySelector("#assetList").innerHTML = ordered.map(assetCard).join("");
}

function assetCard(asset) {
  const watched = state.watchlist.includes(asset.id);
  const matchedAlerts = state.alerts.filter((alert) => alert.enabled !== false && alertMatches(asset, alert));
  return `
    <article class="asset-card" data-id="${asset.id}">
      <div class="asset-top">
        <div>
          <h3>${asset.nameKo}</h3>
          <p>${asset.krxTicker || asset.tokenLabel} · ${asset.nameEn}</p>
        </div>
        <button class="watch-button ${watched ? "is-on" : ""}" data-watch="${asset.id}" type="button" aria-label="관심종목">${watched ? "★" : "☆"}</button>
      </div>
      ${matchedAlerts.length ? `<div class="alert-hit">알림 조건 충족</div>` : ""}
      <div class="quote-grid">
        <div>
          <span>크립토 외화시세</span>
          <strong>${formatMoneyUsd(asset.tokenPriceUsd)}</strong>
        </div>
        <div>
          <span>코스피 원화시세</span>
          <strong>${asset.krxPriceKrw > 0 ? won.format(asset.krxPriceKrw) : "기준가 없음"}</strong>
        </div>
      </div>
      <div class="hero-price">
        <span>외화시세 원화환산</span>
        <strong>${formatMoneyKrw(asset.tokenPriceKrw)}</strong>
        <em class="${premiumClass(asset.premiumRate)}">괴리율 ${formatRate(asset.premiumRate)}</em>
      </div>
      <div class="meta-row">
        <span>토큰 ${asset.tokenSource}</span>
        <span>KOSPI ${asset.krxSource}</span>
      </div>
      <div class="card-timestamp">${formatTime(asset.updatedAt)}</div>
      <button class="detail-link" data-detail="${asset.id}" type="button">상세 보기</button>
    </article>
  `;
}

function alertMatches(asset, alert) {
  const threshold = Number(alert.threshold);
  if (!Number.isFinite(threshold)) return false;
  if (alert.condition === "premium_rate_gte") return asset.premiumRate != null && asset.premiumRate >= threshold;
  if (alert.condition === "premium_rate_lte") return asset.premiumRate != null && asset.premiumRate <= threshold;
  if (alert.condition === "price_krw_gte") return asset.tokenPriceKrw >= threshold;
  if (alert.condition === "price_krw_lte") return asset.tokenPriceKrw <= threshold;
  if (alert.condition === "fx_gte") return fxRate >= threshold;
  return false;
}

function renderRanking(items) {
  let ranked = items.filter((asset) => asset.tokenPriceKrw > 0 || asset.krxPriceKrw > 0);
  if (state.rankFilter === "confirmed") {
    ranked = ranked.filter((asset) => asset.status === "confirmed");
  } else if (state.rankFilter === "watch") {
    ranked = ranked.filter((asset) => asset.status === "watch");
  } else if (state.rankFilter === "comparable") {
    ranked = ranked.filter((asset) => asset.premiumRate != null);
  }

  ranked.sort((a, b) => {
    if (state.rankSort === "high") return (b.premiumRate ?? -Infinity) - (a.premiumRate ?? -Infinity);
    if (state.rankSort === "low") return (a.premiumRate ?? Infinity) - (b.premiumRate ?? Infinity);
    if (state.rankSort === "volume") return b.volume24hUsd - a.volume24hUsd;
    if (state.rankSort === "updated") return new Date(b.updatedAt) - new Date(a.updatedAt);
    return Math.abs(b.premiumRate ?? 0) - Math.abs(a.premiumRate ?? 0);
  });

  document.querySelector("#rankingList").innerHTML = ranked.map((asset) => `
    <li>
      <button data-detail="${asset.id}" type="button">
        <span>${asset.nameKo} · ${asset.krxTicker || asset.tokenLabel}</span>
        <strong class="${premiumClass(asset.premiumRate)}">${formatRate(asset.premiumRate)}</strong>
        <small>${asset.tokenSource} · KOSPI ${asset.krxSource} · 환산 ${formatMoneyKrw(asset.tokenPriceKrw)}</small>
      </button>
    </li>
  `).join("");
}

function renderWatchlist(items) {
  const watched = items.filter((asset) => state.watchlist.includes(asset.id));
  document.querySelector("#watchlistList").innerHTML = watched.length
    ? watched.map(assetCard).join("")
    : `<p class="empty">관심종목이 없습니다. 홈에서 ☆ 버튼을 눌러 추가하세요.</p>`;
}

function renderAlertOptions(items) {
  const select = document.querySelector("#alertAsset");
  const currentValue = select.value;
  select.innerHTML = items.map((asset) => `<option value="${asset.id}">${asset.nameKo} · ${asset.krxTicker || asset.tokenLabel}</option>`).join("");
  if (currentValue) select.value = currentValue;
}

function renderAlerts(items) {
  const list = document.querySelector("#alertList");
  if (!state.alerts.length) {
    list.innerHTML = `<p class="empty">저장된 알림 조건이 없습니다.</p>`;
    return;
  }

  list.innerHTML = state.alerts.map((alert) => {
    const asset = items.find((item) => item.id === alert.assetId);
    return `
      <div class="alert-item">
        <div>
          <strong>${asset ? `${asset.nameKo} · ${asset.krxTicker || asset.tokenLabel}` : alert.assetId}</strong>
          <span>${conditionLabel(alert.condition)} ${alert.threshold}</span>
        </div>
        <button data-delete-alert="${alert.id}" type="button">삭제</button>
      </div>
    `;
  }).join("");
}

function conditionLabel(value) {
  return {
    premium_rate_gte: "괴리율 >=",
    premium_rate_lte: "괴리율 <=",
    price_krw_gte: "원화 환산가 >=",
    price_krw_lte: "원화 환산가 <=",
    fx_gte: "USD/KRW >="
  }[value] ?? value;
}

function statusLabel(status) {
  return {
    confirmed: "확인됨",
    watch: "상장 감시",
    index: "지수 후보",
    excluded: "제외"
  }[status] ?? "미확인";
}

function renderUniverse() {
  document.querySelector("#universeList").innerHTML = kospiAssets.map((item) => {
    const exchangeTags = [
      item.binanceSymbol ? `<span title="Binance">BN·${item.binanceSymbol}</span>` : "",
      item.hlSymbol ? `<span title="Hyperliquid">HL·${item.hlSymbol}</span>` : "",
      item.coinGeckoId ? `<span title="CoinGecko">CG·${item.tokenLabel}</span>` : ""
    ].filter(Boolean).join("");
    return `
      <article class="universe-card">
        <div class="universe-card-top">
          <span class="status-badge ${item.status}">${statusLabel(item.status)}</span>
          <h3>${item.nameKo}</h3>
          <p>${item.krxTicker ? `KRX ${item.krxTicker}` : item.tokenLabel}</p>
        </div>
        ${exchangeTags ? `<div class="universe-meta">${exchangeTags}</div>` : ""}
      </article>
    `;
  }).join("");
}

function showView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("is-active", el.id === `${view}View`));
  document.querySelectorAll(".tab").forEach((el) => el.classList.toggle("is-active", el.dataset.view === view));
}

function showDetail(id) {
  const asset = assets.find((item) => item.id === id);
  if (!asset) return;
  document.querySelector("#detailContent").innerHTML = `
    <section class="detail-header">
      <div>
        <p>${asset.krxTicker || asset.tokenLabel} · ${asset.provider}</p>
        <h2>${asset.nameKo}</h2>
      </div>
      <strong class="${premiumClass(asset.premiumRate)}">${formatRate(asset.premiumRate)}</strong>
    </section>
    <section class="detail-grid">
      <div><span>코스피 원화시세</span><strong>${asset.krxPriceKrw > 0 ? won.format(asset.krxPriceKrw) : "기준가 없음"}</strong></div>
      <div><span>크립토 외화시세</span><strong>${formatMoneyUsd(asset.tokenPriceUsd)}</strong></div>
      <div><span>외화시세 원화환산</span><strong>${formatMoneyKrw(asset.tokenPriceKrw)}</strong></div>
      <div><span>USD/KRW</span><strong>${won.format(fxRate)}</strong></div>
    </section>
    <section class="source-panel">
      <h3 class="small-heading">데이터 상태</h3>
      <div class="source-grid">
        <div><span>코스피</span><strong>${asset.krxSource}</strong></div>
        <div><span>크립토</span><strong>${asset.tokenSource}</strong></div>
        <div><span>매칭 심볼</span><strong>${asset.matchedSymbol || "없음"}</strong></div>
        <div><span>24H 거래량</span><strong>${usd.format(asset.volume24hUsd || 0)}</strong></div>
      </div>
    </section>
    <section>
      <h3 class="small-heading">비교 공식</h3>
      <div class="formula-box">(크립토 외화시세 × USD/KRW - 코스피 원화시세) / 코스피 원화시세 × 100</div>
    </section>
    <section class="risk-note">
      <strong>주의</strong>
      <p>${asset.risk}</p>
    </section>
  `;
  showView("detail");
}

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-view]");
  const detail = event.target.closest("[data-detail]");
  const watch = event.target.closest("[data-watch]");
  const alertDelete = event.target.closest("[data-delete-alert]");
  const filter = event.target.closest("[data-filter]");

  if (tab) showView(tab.dataset.view);
  if (detail) showDetail(detail.dataset.detail);
  if (filter) {
    state.rankFilter = filter.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((el) => el.classList.toggle("is-active", el === filter));
    renderRanking(assets);
  }
  if (watch) {
    const id = watch.dataset.watch;
    state.watchlist = state.watchlist.includes(id)
      ? state.watchlist.filter((item) => item !== id)
      : [...state.watchlist, id];
    writeJson("watchlist", state.watchlist);
    render();
  }
  if (alertDelete) {
    state.alerts = state.alerts.filter((alert) => alert.id !== alertDelete.dataset.deleteAlert);
    writeJson("alerts", state.alerts);
    render();
  }
});

document.querySelector("#backBtn").addEventListener("click", () => showView("home"));
document.querySelector("#refreshBtn").addEventListener("click", () => location.reload());
document.querySelector("#rankSort").addEventListener("change", (event) => {
  state.rankSort = event.target.value;
  renderRanking(assets);
});
document.querySelector("#alertForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.alerts.unshift({
    id: `alert_${Date.now()}`,
    assetId: document.querySelector("#alertAsset").value,
    condition: document.querySelector("#alertCondition").value,
    threshold: Number(document.querySelector("#alertThreshold").value),
    enabled: true,
    createdAt: new Date().toISOString()
  });
  writeJson("alerts", state.alerts);
  render();
});

loadLiveData();
