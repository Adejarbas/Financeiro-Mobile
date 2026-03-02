/**
 * 📰 FINANÇAS PRO GOLD - NEWS SCREEN
 * Feed de Notícias Financeiras com design Premium e Integração de API Real
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Linking,
    RefreshControl,
    Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Newspaper, ExternalLink, Clock, Search, ArrowLeft, RefreshCcw } from 'lucide-react-native';

import colors from '../theme/colors';
import { getMarketNews, NewsArticle } from '../utils/newsService';

export default function NewsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const data = await getMarketNews();
            // Optional: simulate small delay to show loading state nicely
            setTimeout(() => {
                setNews(data);
                setLoading(false);
            }, 500);
        } catch (error) {
            console.error('Failed to fetch news', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleOpenNews = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Agora';
        if (diffHours < 24) return `Há ${diffHours}h`;
        return date.toLocaleDateString('pt-BR');
    };

    const renderNewsItem = ({ item }: { item: NewsArticle }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => item.url && handleOpenNews(item.url)}
        >
            <View style={styles.imageContainer}>
                {item.urlToImage ? (
                    <Image source={{ uri: item.urlToImage }} style={styles.cardImage} />
                ) : (
                    <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                        <Newspaper size={48} color={colors.textSubtle} />
                    </View>
                )}
                <View style={styles.sourceOverlay}>
                    <Text style={styles.sourceTextOverlay}>{item.source?.name || 'Mercado'}</Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                        <Clock size={14} color={colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={styles.dateText}>{formatDate(item.publishedAt)}</Text>
                    </View>
                </View>

                <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>

                {item.description && (
                    <Text style={styles.newsSummary} numberOfLines={3}>{item.description}</Text>
                )}

                <View style={styles.cardFooter}>
                    <View style={styles.readMoreBtn}>
                        <Text style={styles.readMore}>Ler Notícia Completa</Text>
                        <ExternalLink size={14} color={colors.text} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.headerTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <ArrowLeft size={20} color={colors.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Notícias</Text>
                            <Text style={styles.subtitle}>Fique por dentro do mercado</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={fetchNews} style={styles.refreshButton} disabled={loading}>
                        <RefreshCcw size={20} color={loading ? colors.textSubtle : colors.gold} />
                    </TouchableOpacity>
                </View>
            </View>

            {loading && news.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <RefreshCcw size={48} color={colors.gold} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <Text style={styles.emptyText}>Buscando notícias no mercado...</Text>
                </View>
            ) : (
                <FlatList
                    data={news}
                    keyExtractor={(item, index) => item.url + index}
                    renderItem={renderNewsItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={fetchNews} tintColor={colors.gold} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Search size={48} color={colors.textSubtle} />
                            <Text style={styles.emptyText}>Nenhuma notícia encontrada no momento.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    refreshButton: {
        padding: 10,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSubtle,
        marginTop: 4,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20, // Increased radius
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    imageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: 180, // Same as web
        backgroundColor: colors.border,
    },
    cardImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    sourceOverlay: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    sourceTextOverlay: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    newsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
        lineHeight: 24,
    },
    newsSummary: {
        fontSize: 14,
        color: colors.textSubtle,
        lineHeight: 20,
        marginBottom: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readMoreBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
    },
    readMore: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: colors.textSubtle,
        fontSize: 16,
        fontWeight: '500'
    },
});
