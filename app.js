const FALLBACK_FX_RATE = 1545;
const API_TIMEOUT_MS = 8000;
const FAST_REFRESH_MS = 60_000;
const KRX_REFRESH_MS = 60_000;
const REALTIME_REFRESH_MS = 3_000;
const REALTIME_MAX_STALE_MS = 15_000;
const CG_TOKEN_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";
const HYPERLIQUID_INFO_URL = "https://api.hyperliquid.xyz/info";
const KRX_PROXY_URL = "https://orange-sunset-3ab4.kangkuyun.workers.dev";

let fxRate = FALLBACK_FX_RATE;
let marketUpdatedAt = new Date().toISOString();
let fxUpdatedAt = marketUpdatedAt;
let realtimeQuotesUrl = "";
let fastRefreshTimer = null;
let krxRefreshTimer = null;
let isFastRefreshing = false;
let isKrxRefreshing = false;

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
  activeDetailId: "",
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
    krxPriceBasis: item.krxTicker ? "시장 기준가" : "KRX 기준 없음",
    krxUpdatedAt: marketUpdatedAt,
    tokenPriceUsd: 0,
    tokenPriceKrw: 0,
    tokenChange24h: 0,
    volume24hUsd: 0,
    tokenSource: hasSource ? "대기" : "심볼 미확인",
    tokenPriceBasis: hasSource ? "거래소 가격" : "상장 감시",
    tokenUpdatedAt: marketUpdatedAt,
    matchedSymbol: "",
    edgeValid: null,
    quoteSkewMs: null,
    quoteFreshnessMs: null,
    premiumRate: null,
    premiumDiffKrw: null,
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

function migrateStoredMarketData() {
  const cachedFx = readJson("lastFxRate", null);
  if (cachedFx?.label && String(cachedFx.label).includes("USD")) {
    localStorage.removeItem("lastFxRate");
  }
}

function premiumClass(value) {
  if (value == null) return "neutral";
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

function productLabel(asset) {
  if (asset.coinGeckoId) return "Tokenized ETF";
  if (asset.status === "watch") return "상장 감시";
  if (asset.binanceSymbol || asset.bybitSymbol || asset.okxSymbol || asset.hlSymbol) return "PERP";
  return "Unknown";
}

function productRiskLabel(asset) {
  if (asset.edgeValid === true) return "A급 비교";
  if (productLabel(asset) === "PERP") return "파생시장";
  if (productLabel(asset) === "Tokenized ETF") return "토큰화 가격";
  return "가격 대기";
}

function sourceName(value) {
  return String(value || "대기").split(" · ")[0];
}

function formatRate(value) {
  if (value == null || !Number.isFinite(value)) return "비교 대기";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatMoneyKrw(value) {
  return value > 0 ? won.format(value) : "-";
}

function formatSignedMoneyKrw(value) {
  if (value == null || !Number.isFinite(value)) return "비교 대기";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${won.format(Math.abs(value))}`;
}

function formatMoneyUsd(value) {
  return value > 0 ? usd.format(value) : "시세 없음";
}

function render() {
  document.querySelector("#fxRate").textContent = won.format(fxRate);
  document.querySelector("#krxState").textContent = getKrxState();
  document.querySelector("#cryptoState").textContent = apiState.tokenized || "-";
  document.querySelector("#lastUpdated").textContent = formatClock(marketUpdatedAt);
  document.querySelector("#fxSource").textContent = apiState.fx ? `환율 ${apiState.fx} · ${formatClock(fxUpdatedAt)} KST` : "";
  document.querySelector("#apiStatus").textContent = apiStatusText();
  renderAssets(assets);
  renderUniverse();
  renderRanking(assets);
  renderWatchlist(assets);
  renderAlerts(assets);
  renderAlertOptions(assets);
}

function apiStatusText() {
  return `데이터: KRX ${apiState.krx} · 크립토 ${apiState.tokenized} · USDT/KRW ${apiState.fx} · 자동 갱신 ${realtimeQuotesUrl ? "3초" : "60초"}`;
}

async function loadLiveData() {
  render();
  const realtimeLoaded = await updateRealtimeSnapshot();
  if (realtimeLoaded) {
    finishMarketRefresh();
    return;
  }
  await updateFxRate();
  await Promise.allSettled([updateKrxPrices(), updateCryptoPrices()]);
  finishMarketRefresh();
}

async function refreshFastData() {
  if (isFastRefreshing || document.hidden) return;
  isFastRefreshing = true;
  try {
    const realtimeLoaded = await updateRealtimeSnapshot();
    if (realtimeLoaded) {
      finishMarketRefresh();
      return;
    }
    await updateFxRate();
    await updateCryptoPrices();
    finishMarketRefresh();
  } finally {
    isFastRefreshing = false;
  }
}

async function refreshKrxData() {
  if (isKrxRefreshing || document.hidden) return;
  if (realtimeQuotesUrl) return;
  isKrxRefreshing = true;
  try {
    await updateKrxPrices();
    finishMarketRefresh();
  } finally {
    isKrxRefreshing = false;
  }
}

function finishMarketRefresh() {
  calculatePremiums();
  marketUpdatedAt = new Date().toISOString();
  for (const asset of assets) asset.updatedAt = marketUpdatedAt;
  render();
  if (state.view === "detail" && state.activeDetailId) {
    showDetail(state.activeDetailId);
  }
}

function startAutoRefresh() {
  if (fastRefreshTimer || krxRefreshTimer) return;
  fastRefreshTimer = setInterval(refreshFastData, realtimeQuotesUrl ? REALTIME_REFRESH_MS : FAST_REFRESH_MS);
  if (!realtimeQuotesUrl) krxRefreshTimer = setInterval(refreshKrxData, KRX_REFRESH_MS);
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      cache: "no-store",
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
      fetchJson(`${KRX_PROXY_URL}/?s=${asset.krxTicker}&t=${Date.now()}`).then((data) => ({ asset, data }))
    )
  );

  let updated = 0;
  const priceCache = {};

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { asset, data } = result.value;
    const quote = extractKrxQuote(data);
    if (quote.price <= 0) continue;
    const meta = quote.meta;
    const updatedAt = quote.timestamp ? new Date(quote.timestamp * 1000).toISOString() : new Date().toISOString();
    asset.krxName = meta.shortName || asset.nameKo;
    asset.krxPriceKrw = quote.price;
    asset.krxSource = "Yahoo Finance";
    asset.krxPriceBasis = quote.isIntraday ? "시장 기준가 · 분단위 검증" : "시장 기준가";
    asset.krxUpdatedAt = updatedAt;
    priceCache[asset.krxTicker] = {
      name: asset.krxName,
      price: quote.price,
      basis: asset.krxPriceBasis,
      updatedAt
    };
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
        asset.krxPriceBasis = row.basis || "시장 기준가";
        asset.krxUpdatedAt = row.updatedAt || cached.savedAt || marketUpdatedAt;
      }
    }
    apiState.krx = "마지막 성공";
    return;
  }
  apiState.krx = "시세 없음";
}

async function updateRealtimeSnapshot() {
  if (!realtimeQuotesUrl) return false;

  try {
    const data = await fetchJson(`${realtimeQuotesUrl}${realtimeQuotesUrl.includes("?") ? "&" : "?"}t=${Date.now()}`);
    const rows = data?.prices ?? {};
    const now = Date.now();
    let updated = 0;

    if (Number(data?.fx_rate) > 1000) {
      fxRate = Number(data.fx_rate);
      apiState.fx = "X9Pro";
      fxUpdatedAt = data.updated_at || new Date().toISOString();
    }

    for (const asset of assets) {
      const row = rows[asset.krxTicker] || rows[asset.id];
      if (!row) continue;

      const krxPrice = Number(row.krx_price ?? row.price ?? 0);
      const tokenPriceUsd = Number(row.token_price_usd ?? 0);
      const tokenPriceKrw = Number(row.token_price_krw ?? 0);
      if (krxPrice <= 0 && tokenPriceUsd <= 0 && tokenPriceKrw <= 0) continue;

      if (krxPrice > 0) {
        asset.krxPriceKrw = krxPrice;
        asset.krxName = row.name || asset.nameKo;
        asset.krxSource = row.krx_source || "KIS";
        asset.krxPriceBasis = row.krx_source || "KIS";
        asset.krxUpdatedAt = row.krx_received_at || data.updated_at || new Date().toISOString();
      }

      if (tokenPriceUsd > 0) {
        asset.tokenPriceUsd = tokenPriceUsd;
        asset.tokenPriceKrw = tokenPriceUsd * fxRate;
      }
      if (tokenPriceKrw > 0) asset.tokenPriceKrw = tokenPriceKrw;
      if (tokenPriceUsd > 0 || tokenPriceKrw > 0) {
        asset.tokenSource = row.crypto_source || asset.tokenSource || "X9Pro";
        asset.tokenPriceBasis = row.crypto_source || "Binance Futures";
        asset.tokenUpdatedAt = row.token_received_at || data.updated_at || new Date().toISOString();
        asset.matchedSymbol = row.crypto_symbol || asset.matchedSymbol;
      }

      asset.quoteSkewMs = Number(row.skew_ms ?? row.quote_skew_ms ?? NaN);
      asset.quoteFreshnessMs = Number.isFinite(Date.parse(data.updated_at)) ? now - Date.parse(data.updated_at) : null;
      asset.edgeValid = row.valid !== false
        && Number.isFinite(asset.quoteSkewMs)
        && asset.quoteSkewMs <= Number(data.max_skew_ms ?? 2_000)
        && (asset.quoteFreshnessMs == null || asset.quoteFreshnessMs <= REALTIME_MAX_STALE_MS);
      asset.updatedAt = data.updated_at || new Date().toISOString();
      updated += 1;
    }

    if (updated > 0) {
      apiState.krx = `X9Pro KIS (${updated}종목)`;
      apiState.tokenized = "X9Pro 실시간";
      return true;
    }
  } catch (error) {
    apiState.krx = "X9Pro 실패";
    console.info("X9Pro realtime snapshot unavailable, falling back", error);
  }
  return false;
}

function extractKrxQuote(data) {
  const result = data?.chart?.result?.[0] ?? {};
  const meta = result.meta ?? {};
  const isIntraday = meta.dataGranularity === "1m";
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closes = result.indicators?.quote?.[0]?.close;

  if (Array.isArray(closes)) {
    for (let i = closes.length - 1; i >= 0; i -= 1) {
      const price = Number(closes[i] ?? 0);
      if (price > 0) {
        return {
          meta,
          price,
          timestamp: Number(timestamps[i] ?? meta.regularMarketTime ?? 0),
          isIntraday
        };
      }
    }
  }

  return {
    meta,
    price: Number(meta.regularMarketPrice ?? 0),
    timestamp: Number(meta.regularMarketTime ?? 0),
    isIntraday: false
  };
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
        matchedSymbol: asset.matchedSymbol,
        tokenUpdatedAt: asset.tokenUpdatedAt
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
      asset.tokenPriceBasis = "거래소 가격";
      asset.matchedSymbol = row.matchedSymbol || "";
      asset.tokenUpdatedAt = row.tokenUpdatedAt || cached.savedAt || marketUpdatedAt;
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
      asset.tokenPriceBasis = "CoinGecko 가격";
      asset.matchedSymbol = asset.tokenLabel;
      asset.tokenUpdatedAt = new Date().toISOString();
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
      asset.tokenPriceBasis = "Binance Futures 체결가";
      asset.matchedSymbol = asset.binanceSymbol;
      asset.tokenUpdatedAt = new Date().toISOString();
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
      asset.tokenPriceBasis = "Bybit 체결가";
      asset.matchedSymbol = asset.bybitSymbol;
      asset.tokenUpdatedAt = new Date().toISOString();
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
      asset.tokenPriceBasis = "OKX 체결가";
      asset.matchedSymbol = asset.okxSymbol;
      asset.tokenUpdatedAt = new Date().toISOString();
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
        asset.tokenPriceBasis = "Hyperliquid 체결가";
        asset.matchedSymbol = matched;
        asset.tokenUpdatedAt = new Date().toISOString();
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
      const data = await fetchJson("https://api.upbit.com/v1/ticker?markets=KRW-USDT");
      return { rate: Number(data?.[0]?.trade_price), label: "Upbit" };
    },
    async () => {
      const data = await fetchJson("https://api.frankfurter.dev/v1/latest?base=USD&symbols=KRW");
      return { rate: Number(data?.rates?.KRW), label: "USD 일일환율" };
    },
    async () => {
      const data = await fetchJson("https://open.er-api.com/v6/latest/USD");
      return { rate: Number(data?.rates?.KRW), label: "USD 일일환율" };
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
        fxUpdatedAt = new Date().toISOString();
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
    fxUpdatedAt = new Date().toISOString();
    return;
  }
  const cached = readJson("lastFxRate", null);
  if (cached?.rate) {
    fxRate = Number(cached.rate);
    apiState.fx = "마지막 성공";
    fxUpdatedAt = cached.savedAt || marketUpdatedAt;
  }
}

function calculatePremiums() {
  for (const asset of assets) {
    if (asset.tokenPriceUsd > 0) {
      asset.tokenPriceKrw = asset.tokenPriceUsd * fxRate;
    }
    if (asset.tokenPriceKrw > 0 && asset.krxPriceKrw > 0) {
      asset.premiumDiffKrw = asset.tokenPriceKrw - asset.krxPriceKrw;
      asset.premiumRate = ((asset.tokenPriceKrw - asset.krxPriceKrw) / asset.krxPriceKrw) * 100;
      if (asset.edgeValid === false) {
        asset.premiumRate = null;
        asset.premiumDiffKrw = null;
      }
    } else {
      asset.premiumRate = null;
      asset.premiumDiffKrw = null;
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

function formatClock(value) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function edgeFreshnessLabel(asset) {
  if (!realtimeQuotesUrl || asset.edgeValid == null) return "가격 검증";
  const skew = Number.isFinite(asset.quoteSkewMs) ? `${(asset.quoteSkewMs / 1000).toFixed(1)}초차` : "시세차 확인중";
  return asset.edgeValid ? `동기화됨 · ${skew}` : `시각차 초과 · ${skew}`;
}

function configureRealtimeUrl() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("realtime");
  if (requested) {
    realtimeQuotesUrl = requested;
    writeJson("realtimeQuotesUrl", requested);
    return;
  }
  realtimeQuotesUrl = readJson("realtimeQuotesUrl", "");
}

function renderAssets(items) {
  // 홈에는 확인된 종목을 먼저 보여주고, 시세가 들어오면 괴리율 기준으로 바로 갱신한다.
  const confirmed = items.filter((asset) => asset.status === "confirmed");
  const orderedConfirmed = [...confirmed].sort((a, b) => {
    const aReady = a.krxPriceKrw > 0 && a.tokenPriceKrw > 0 ? 1 : 0;
    const bReady = b.krxPriceKrw > 0 && b.tokenPriceKrw > 0 ? 1 : 0;
    if (aReady !== bReady) return bReady - aReady;
    return Math.abs(b.premiumRate ?? 0) - Math.abs(a.premiumRate ?? 0);
  });
  const watched = orderedConfirmed.filter((asset) => state.watchlist.includes(asset.id));
  const ordered = watched.length
    ? [...watched, ...orderedConfirmed.filter((asset) => !state.watchlist.includes(asset.id))]
    : orderedConfirmed;
  document.querySelector("#assetList").innerHTML = ordered.map(assetCard).join("");
}

function assetCard(asset) {
  const watched = state.watchlist.includes(asset.id);
  const matchedAlerts = state.alerts.filter((alert) => alert.enabled !== false && alertMatches(asset, alert));
  const product = productLabel(asset);
  const risk = productRiskLabel(asset);
  return `
    <article class="asset-card" data-id="${asset.id}">
      <div class="asset-top">
        <div>
          <h3>${asset.nameKo}</h3>
          <p>${asset.krxTicker || asset.tokenLabel} · ${asset.nameEn}</p>
        </div>
        <button class="watch-button ${watched ? "is-on" : ""}" data-watch="${asset.id}" type="button" aria-label="관심종목">${watched ? "★" : "☆"}</button>
      </div>
      <div class="badge-row">
        <span class="status-badge product">${product}</span>
        <span class="status-badge risk">${risk}</span>
        <span class="status-badge data">${edgeFreshnessLabel(asset)}</span>
      </div>
      ${matchedAlerts.length ? `<div class="alert-hit">알림 조건 충족</div>` : ""}
      <div class="hero-price">
        <span>온체인 환산가</span>
        <strong>${formatMoneyKrw(asset.tokenPriceKrw)}</strong>
        <em class="${premiumClass(asset.premiumRate)}">KRX 대비 ${formatRate(asset.premiumRate)}</em>
      </div>
      <div class="diff-row ${premiumClass(asset.premiumRate)}">${formatSignedMoneyKrw(asset.premiumDiffKrw)}</div>
      <div class="quote-grid">
        <div>
          <span>KRX 체결가</span>
          <strong>${asset.krxPriceKrw > 0 ? won.format(asset.krxPriceKrw) : "기준가 없음"}</strong>
          <small>${asset.krxPriceBasis}</small>
        </div>
        <div>
          <span>Crypto 체결가</span>
          <strong>${formatMoneyUsd(asset.tokenPriceUsd)}</strong>
          <small>${asset.tokenPriceBasis}</small>
        </div>
      </div>
      <div class="meta-row">
        <span>크립토 ${asset.tokenSource}</span>
        <span>KRX ${asset.krxSource}</span>
      </div>
      <div class="card-timestamp">마지막 업데이트 ${formatClock(asset.updatedAt)} KST</div>
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
        <small>${productLabel(asset)} · ${asset.tokenSource} · KRX ${asset.krxSource} · 환산 ${formatMoneyKrw(asset.tokenPriceKrw)}</small>
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
    fx_gte: "USDT/KRW >="
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
  if (view !== "detail") state.activeDetailId = "";
  document.querySelectorAll(".view").forEach((el) => el.classList.toggle("is-active", el.id === `${view}View`));
  document.querySelectorAll(".tab").forEach((el) => el.classList.toggle("is-active", el.dataset.view === view));
}

function showDetail(id) {
  const asset = assets.find((item) => item.id === id);
  if (!asset) return;
  state.activeDetailId = id;
  const product = productLabel(asset);
  const risk = productRiskLabel(asset);
  document.querySelector("#detailContent").innerHTML = `
    <section class="detail-header">
      <div>
        <p>${asset.krxTicker || asset.tokenLabel} · ${asset.provider}</p>
        <h2>${asset.nameKo}</h2>
        <div class="badge-row">
          <span class="status-badge product">${product}</span>
          <span class="status-badge risk">${risk}</span>
        </div>
      </div>
    </section>
    <section class="premium-hero">
      <span>KRX 대비</span>
      <strong class="${premiumClass(asset.premiumRate)}">${formatRate(asset.premiumRate)}</strong>
      <em class="${premiumClass(asset.premiumRate)}">${formatSignedMoneyKrw(asset.premiumDiffKrw)}</em>
    </section>
    <section class="detail-grid">
      <div><span>온체인 환산가</span><strong>${formatMoneyKrw(asset.tokenPriceKrw)}</strong><small>가격 기준</small></div>
      <div><span>KRX 체결가</span><strong>${asset.krxPriceKrw > 0 ? won.format(asset.krxPriceKrw) : "기준가 없음"}</strong><small>${asset.krxPriceBasis}</small></div>
      <div><span>Crypto 체결가</span><strong>${formatMoneyUsd(asset.tokenPriceUsd)}</strong><small>${asset.tokenPriceBasis}</small></div>
      <div><span>USDT/KRW</span><strong>${won.format(fxRate)}</strong><small>${apiState.fx} · ${formatClock(fxUpdatedAt)} KST</small></div>
    </section>
    <section class="source-panel">
      <h3 class="small-heading">데이터 상태</h3>
      <div class="data-state-list">
        <div><span>KRX 가격</span><strong>${asset.krxPriceBasis}</strong><small>마지막 업데이트: ${formatClock(asset.krxUpdatedAt)} KST</small></div>
        <div><span>크립토 가격</span><strong>${asset.tokenPriceBasis}</strong><small>마지막 업데이트: ${formatClock(asset.tokenUpdatedAt)} KST</small></div>
        <div><span>시각 검증</span><strong>${edgeFreshnessLabel(asset)}</strong><small>${asset.edgeValid === true ? "비교 가능" : "조건 확인 필요"}</small></div>
        <div><span>환산율</span><strong>USDT/KRW · ${apiState.fx}</strong><small>마지막 업데이트: ${formatClock(fxUpdatedAt)} KST</small></div>
        <div><span>매칭 심볼</span><strong>${asset.matchedSymbol || "없음"}</strong><small>24H 거래량: ${usd.format(asset.volume24hUsd || 0)}</small></div>
      </div>
    </section>
    <section class="risk-note">
      <strong>주의</strong>
      <p>이 가격은 실제 ${asset.nameKo} 주식 가격이 아니며, 온체인/크립토 파생시장 기준 참고가입니다.</p>
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

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshFastData();
});

async function init() {
  migrateStoredMarketData();
  configureRealtimeUrl();
  const params = new URLSearchParams(window.location.search);
  const detailId = params.get("detail");
  if (detailId) showDetail(detailId);
  await loadLiveData();
  startAutoRefresh();
  if (detailId) showDetail(detailId);
}

init();
