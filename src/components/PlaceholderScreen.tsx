/**
 * 🚧 FINANÇAS PRO GOLD - PLACEHOLDER SCREEN
 * Tela base para funcionalidades em desenvolvimento
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../theme/colors';

interface PlaceholderScreenProps {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
}

export default function PlaceholderScreen({ title, icon, description }: PlaceholderScreenProps) {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={64} color={colors.gold} />
                </View>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                <Text style={styles.comingSoon}>Em breve na versão completa!</Text>
            </View>
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
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: colors.gold,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: colors.textSubtle,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    comingSoon: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.gold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
