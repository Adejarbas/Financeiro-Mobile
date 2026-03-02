// API Services for Investment Data
// Integrates Brapi (Stocks/FIIs), CoinGecko (Crypto), and BCB (Fixed Income)

// ============================================
// BRAPI - Ações e FIIs (B3)
// ============================================

export interface BrapiQuote {
    symbol: string;
    longName: string;
    regularMarketPrice: number;
    regularMarketChangePercent: number;
    regularMarketChange: number;
}

export async function fetchStockPrice(ticker: string): Promise<BrapiQuote | null> {
    try {
        const response = await fetch(`https://brapi.dev/api/quote/${ticker.toUpperCase()}?token=demo`);

        if (!response.ok) {
            throw new Error(`Brapi API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            return null;
        }

        return {
            symbol: data.results[0].symbol,
            longName: data.results[0].longName || data.results[0].shortName,
            regularMarketPrice: data.results[0].regularMarketPrice,
            regularMarketChangePercent: data.results[0].regularMarketChangePercent,
            regularMarketChange: data.results[0].regularMarketChange
        };
    } catch (error) {
        console.error(`Error fetching stock price for ${ticker}:`, error);
        return null;
    }
}

// ============================================
// COINGECKO - Criptomoedas
// ============================================

export interface CryptoPrice {
    price: number;
    change24h: number;
}

// Mapeamento de símbolos para IDs do CoinGecko (80+ criptomoedas populares)
const CRYPTO_ID_MAP: Record<string, string> = {
    // Top 10
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'SOL': 'solana',
    'DOGE': 'dogecoin',
    'TRX': 'tron',
    'TON': 'the-open-network',
    'AVAX': 'avalanche-2',
    // DeFi & Smart Contracts
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'POL': 'matic-network',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LTC': 'litecoin',
    'BCH': 'bitcoin-cash',
    'NEAR': 'near',
    'APT': 'aptos',
    'ARB': 'arbitrum',
    'OP': 'optimism',
    'SUI': 'sui',
    'INJ': 'injective-protocol',
    'FIL': 'filecoin',
    'ICP': 'internet-computer',
    'HBAR': 'hedera-hashgraph',
    'VET': 'vechain',
    'EOS': 'eos',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'EGLD': 'elrond-erd-2',
    'FLOW': 'flow',
    'THETA': 'theta-token',
    'XTZ': 'tezos',
    'MANA': 'decentraland',
    'SAND': 'the-sandbox',
    'AXS': 'axie-infinity',
    'GALA': 'gala',
    'ENJ': 'enjincoin',
    'CHZ': 'chiliz',
    // Stablecoins
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'BUSD': 'binance-usd',
    'DAI': 'dai',
    'TUSD': 'true-usd',
    // Layer 1/2 alternativas
    'FTM': 'fantom',
    'ONE': 'harmony',
    'CELO': 'celo',
    'KAVA': 'kava',
    'ZIL': 'zilliqa',
    'ICX': 'icon',
    'WAVES': 'waves',
    'NEO': 'neo',
    'QTUM': 'qtum',
    'ZEC': 'zcash',
    'DASH': 'dash',
    'XMR': 'monero',
    'ETC': 'ethereum-classic',
    // DeFi populares
    'AAVE': 'aave',
    'COMP': 'compound-governance-token',
    'MKR': 'maker',
    'SNX': 'havven',
    'CRV': 'curve-dao-token',
    'SUSHI': 'sushi',
    'YFI': 'yearn-finance',
    '1INCH': '1inch',
    'BAL': 'balancer',
    // Outros populares
    'XDC': 'xdce-crowd-sale',
    'SHIB': 'shiba-inu',
    'PEPE': 'pepe',
    'FLOKI': 'floki',
    'WIF': 'dogwifcoin',
    'BONK': 'bonk',
    'STX': 'blockstack',
    'RUNE': 'thorchain',
    'KCS': 'kucoin-shares',
    'OKB': 'okb',
    'HT': 'huobi-token',
    'RENDER': 'render-token',
    'FET': 'fetch-ai',
    'AGIX': 'singularitynet',
    'WLD': 'worldcoin-wld',
    'SEI': 'sei-network',
    'TIA': 'celestia',
    'PYTH': 'pyth-network',
    'JUP': 'jupiter-exchange-solana',
};

export async function fetchCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
        const coinId = CRYPTO_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl&include_24hr_change=true`
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data[coinId]) {
            return null;
        }

        return {
            price: data[coinId].brl,
            change24h: data[coinId].brl_24h_change || 0
        };
    } catch (error) {
        console.warn(`Aviso: Limite da API CoinGecko ou Erro ao buscar preço para ${symbol}`, error);
        return null;
    }
}

// ============================================
// BCB - Banco Central (Taxas)
// ============================================

export interface BCBRate {
    date: string;
    value: number;
}

// Códigos de séries do BCB
export const BCB_SERIES = {
    SELIC: 432,
    CDI: 12,
    IPCA: 433
};

export async function fetchBCBRate(seriesCode: number): Promise<number | null> {
    try {
        const response = await fetch(
            `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesCode}/dados/ultimos/1?formato=json`
        );

        if (!response.ok) {
            throw new Error(`BCB API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            return null;
        }

        return parseFloat(data[0].valor);
    } catch (error) {
        console.error(`Error fetching BCB rate for series ${seriesCode}:`, error);
        return null;
    }
}

// ============================================
// BUSCA INTELIGENTE
// ============================================

export interface AssetSearchResult {
    symbol: string;
    name: string;
    currentPrice: number;
    type: 'stocks' | 'fiis' | 'crypto';
    variation?: number;
}

// Lista de sufixos conhecidos de FIIs brasileiros
const FII_SUFFIXES = ['11', '12', '13'];

/**
 * Detecta se um ticker é provavelmente um FII brasileiro.
 * FIIs têm entre 4-6 letras + 2 números (ex: HGLG11, MXRF11, KNRI11)
 */
function detectIfFII(ticker: string): boolean {
    const fiiPattern = /^[A-Z]{4,6}\d{2}$/;
    if (!fiiPattern.test(ticker)) return false;
    const suffix = ticker.slice(-2);
    return FII_SUFFIXES.includes(suffix);
}

export async function searchAsset(query: string, typeFilter?: 'stocks' | 'fiis' | 'crypto'): Promise<AssetSearchResult | null> {
    const upperQuery = query.toUpperCase().trim();

    if (!upperQuery) return null;

    if (typeFilter === 'crypto') {
        const cryptoData = await fetchCryptoPrice(upperQuery);
        if (cryptoData) {
            const coinId = CRYPTO_ID_MAP[upperQuery];
            const friendlyName = coinId
                ? coinId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                : upperQuery;
            return {
                symbol: upperQuery,
                name: friendlyName,
                currentPrice: cryptoData.price,
                type: 'crypto',
                variation: cryptoData.change24h
            };
        }
        return null;
    }

    if (typeFilter === 'stocks' || typeFilter === 'fiis' || !typeFilter) {
        const stockData = await fetchStockPrice(upperQuery);
        if (stockData) {
            const isFII = detectIfFII(upperQuery);

            if (typeFilter === 'stocks' && isFII) return null;
            if (typeFilter === 'fiis' && !isFII) return null;

            const assetType = isFII ? 'fiis' : 'stocks';
            return {
                symbol: stockData.symbol,
                name: stockData.longName,
                currentPrice: stockData.regularMarketPrice,
                type: assetType,
                variation: stockData.regularMarketChangePercent
            };
        }

        if (!typeFilter) {
            const cryptoData = await fetchCryptoPrice(upperQuery);
            if (cryptoData) {
                const coinId = CRYPTO_ID_MAP[upperQuery];
                const friendlyName = coinId
                    ? coinId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : upperQuery;
                return {
                    symbol: upperQuery,
                    name: friendlyName,
                    currentPrice: cryptoData.price,
                    type: 'crypto',
                    variation: cryptoData.change24h
                };
            }
        }
    }

    return null;
}
