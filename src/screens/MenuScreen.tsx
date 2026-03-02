/**
 * 🍔 FINANÇAS PRO GOLD - MENU SCREEN
 * Acesso rápido a todas as funcionalidades do sistema
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '../theme/colors';

// Configuração dos itens do menu
const MENU_ITEMS = [
    { title: 'Relatórios', icon: 'pie-chart', route: 'Relatórios' },
    { title: 'Metas', icon: 'trophy', route: 'Metas' },
    { title: 'Orçamento', icon: 'calculator', route: 'Orçamento' },
    { title: 'Notícias', icon: 'newspaper', route: 'Notícias' },
    { title: 'Família', icon: 'people', route: 'Família' },
    { title: 'Assistente IA', icon: 'chatbubbles', route: 'Assistente' },
    { title: 'Configurações', icon: 'settings', route: 'Configurações' },
];

export default function MenuScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.headerTitle}>Mais Opções</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.grid}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.gridItem}
                            onPress={() => navigation.navigate(item.route)}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon as any} size={28} color={colors.gold} />
                            </View>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Versão do App */}
                <Text style={styles.version}>Versão 1.0.0 (Beta)</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    scrollContent: {
        padding: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    gridItem: {
        width: '47%', // 2 colunas com espaço
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        // Sombra suave
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: `${colors.gold}15`, // Transparente 15%
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: `${colors.gold}30`,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    version: {
        textAlign: 'center',
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: 32,
        marginBottom: 32,
    },
});
