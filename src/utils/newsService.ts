// Função para buscar notícias de feeds RSS via rss2json.com (GRATUITO)
export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    urlToImage?: string;
    publishedAt: string;
    source: {
        name: string;
    };
}

// API Key gratuita do rss2json.com
const RSS2JSON_API_KEY = '2a2cpv08czv1oyobsb3spm9db0icyi4x6vezcgxg'; // Substitua pela sua key

// Feeds RSS de portais brasileiros de economia
const RSS_FEEDS = [
    'https://www.infomoney.com.br/feed/',
    'https://valor.globo.com/rss/'
];

// Imagens de fallback por categoria
const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1611974765215-e28d48d464d9?auto=format&fit=crop&q=80&w=600', // Bolsa
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=600', // Dólar
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=600', // Cripto
    'https://images.unsplash.com/photo-1621504450162-e15296cc6fc5?auto=format&fit=crop&q=80&w=600', // Economia
    'https://images.unsplash.com/photo-1565514020176-ade3f047b481?auto=format&fit=crop&q=80&w=600', // Petróleo
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600', // Imóveis
];

export const getMarketNews = async (): Promise<NewsArticle[]> => {
    try {
        const response = await fetch(
            `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEEDS[0])}&api_key=${RSS2JSON_API_KEY}&count=9`
        );

        const data = await response.json();

        if (data.status === 'ok' && data.items) {
            return data.items.map((item: any, index: number) => {
                let imageUrl = item.thumbnail || item.enclosure?.link;

                if (!imageUrl && item.content) {
                    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
                    if (imgMatch) {
                        imageUrl = imgMatch[1];
                    }
                }

                if (!imageUrl || imageUrl.includes('default') || imageUrl.includes('placeholder')) {
                    imageUrl = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
                }

                const cleanDescription = item.description
                    ?.replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .trim()
                    .substring(0, 150) + '...';

                return {
                    title: item.title,
                    description: cleanDescription || 'Clique para ler a notícia completa.',
                    url: item.link,
                    urlToImage: imageUrl,
                    publishedAt: item.pubDate,
                    source: { name: 'InfoMoney' }
                };
            });
        }
    } catch (error) {
        console.error('Erro ao buscar RSS:', error);
    }

    // Fallback: dados mock caso a API falhe
    return [
        {
            title: "Ibovespa fecha em alta com otimismo sobre reforma tributária",
            description: "Índice principal da bolsa brasileira avançou 1,5% nesta terça-feira, impulsionado por grandes bancos e Petrobras.",
            url: "https://www.infomoney.com.br",
            urlToImage: "https://images.unsplash.com/photo-1611974765215-e28d48d464d9?auto=format&fit=crop&q=80&w=600",
            publishedAt: new Date().toISOString(),
            source: { name: "InfoMoney" }
        },
        {
            title: "Dólar recua a R$ 4,95 com dados de inflação nos EUA",
            description: "Moeda norte-americana perde força globalmente após divulgação do CPI abaixo do esperado.",
            url: "https://valor.globo.com",
            urlToImage: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&q=80&w=600",
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            source: { name: "Valor Econômico" }
        },
        {
            title: "Bitcoin supera US$ 45 mil com expectativa de ETF",
            description: "Criptomoeda líder avança forte com rumores de aprovação de fundos pela SEC.",
            url: "https://www.infomoney.com.br/mercados/criptomoedas",
            urlToImage: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80&w=600",
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            source: { name: "CryptoTimes" }
        }
    ];
};
