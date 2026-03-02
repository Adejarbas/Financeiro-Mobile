/**
 * 🎯 FINANÇAS PRO GOLD - GOALS SCREEN
 * Metas Financeiras com Design Premium e Lucide Icons
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    Trophy,
    Plus,
    Flag,
    Calendar,
    Target,
    ArrowLeft,
    Edit2,
    Trash2,
    TrendingUp,
    Sun,
    Moon,
    Eye,
    EyeOff
} from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import colors from '../theme/colors';
import { formatCurrency } from '../utils/currencyUtils';
import { Meta } from '../types';
import GoalModal from '../components/GoalModal';

export default function GoalsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { goals, loading, refreshing, refreshData, deleteGoal, isDarkMode, toggleDarkMode, hideValues, toggleHideValues } = useFinance();
    const theme = getColors(isDarkMode);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Meta | null>(null);

    const calculateProgress = (current: number, target: number) => {
        if (target <= 0) return 0;
        const progress = (current / target) * 100;
        return Math.min(progress, 100);
    };

    const calculateDaysRemaining = (deadline: string) => {
        const today = new Date();
        const end = new Date(deadline);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const handleEdit = (goal: Meta) => {
        setSelectedGoal(goal);
        setModalVisible(true);
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            'Excluir Meta',
            `Deseja realmente excluir a meta "${name}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteGoal(id);
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Meta }) => {
        const progress = calculateProgress(item.valor_atual, item.valor_alvo);
        const daysLeft = calculateDaysRemaining(item.prazo);
        const barColor = item.cor || colors.gold;
        const isCompleted = item.status === 'completed' || progress >= 100;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: barColor + '20' }]}>
                        <Trophy size={20} color={barColor} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.goalName}>{item.nome}</Text>
                        <Text style={styles.goalCategory}>{item.categoria || 'Geral'}</Text>
                    </View>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
                            <Edit2 size={16} color={colors.textSubtle} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id, item.nome)}>
                            <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Values */}
                <View style={styles.valuesRow}>
                    <Text style={[styles.currentValue, { color: theme.text }]}>{hideValues ? '••••••' : formatCurrency(item.valor_atual)}</Text>
                    <Text style={[styles.targetValue, { color: theme.textSubtle }]}>de {hideValues ? '••••••' : formatCurrency(item.valor_alvo)}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBg}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${isCompleted ? 100 : progress}%`, backgroundColor: barColor }
                        ]}
                    />
                </View>

                {/* Footer Info */}
                <View style={styles.cardFooter}>
                    <Text style={[styles.percentage, { color: barColor }]}>
                        {progress.toFixed(1)}% concluído
                    </Text>

                    {!isCompleted && (
                        <Text style={[styles.daysLeft, daysLeft < 30 ? { color: colors.error } : {}]}>
                            {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
                        </Text>
                    )}
                    {isCompleted && (
                        <View style={styles.completedBadge}>
                            <TrendingUp size={12} color={colors.teal} style={{ marginRight: 4 }} />
                            <Text style={styles.completedText}>
                                {item.status === 'completed' ? 'Concluída manualmente' : 'Meta atingida!'}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.deadlineAbsolute}>
                    <Text style={styles.deadlineText}>Prazo: {item.prazo.split('-').reverse().join('/')}</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Metas Financeiras</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => { setSelectedGoal(null); setModalVisible(true); }}
                >
                    <Plus size={24} color={colors.gold} />
                </TouchableOpacity>
            </View>

            {/* Resumo */}
            {goals.length > 0 && (
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={styles.statLabel}>Total de Metas</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{goals.length}</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={styles.statLabel}>Metas Concluídas</Text>
                        <Text style={[styles.statValue, { color: theme.teal }]}>
                            {goals.filter(g => g.status === 'completed' || calculateProgress(g.valor_atual, g.valor_alvo) >= 100).length}
                        </Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={styles.statLabel}>Em Progresso</Text>
                        <Text style={[styles.statValue, { color: theme.gold }]}>
                            {goals.filter(g => g.status !== 'completed' && calculateProgress(g.valor_atual, g.valor_alvo) < 100).length}
                        </Text>
                    </View>
                </View>
            )}

            {/* Lista */}
            <FlatList
                data={goals}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshData}
                        tintColor={colors.gold}
                        colors={[colors.gold]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Flag size={64} color={colors.textSubtle + '40'} />
                        <Text style={styles.emptyText}>Nenhuma meta definida</Text>
                        <Text style={styles.emptySubText}>Defina um objetivo para começar a economizar.</Text>
                    </View>
                }
            />

            <GoalModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                goalToEdit={selectedGoal}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        padding: 12,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.gold + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    summaryText: {
        color: colors.textSubtle,
        fontSize: 13,
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    goalName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    goalCategory: {
        fontSize: 12,
        color: colors.textSubtle,
        textTransform: 'uppercase',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    actionButton: {
        padding: 4,
    },
    valuesRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        marginBottom: 12,
    },
    currentValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    targetValue: {
        fontSize: 14,
        color: colors.textSubtle,
    },
    progressBg: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    percentage: {
        fontSize: 14,
        fontWeight: '600',
    },
    daysLeft: {
        fontSize: 12,
        color: colors.textSubtle,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.teal + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedText: {
        color: colors.teal,
        fontSize: 12,
        fontWeight: 'bold',
    },
    deadlineAbsolute: {
        position: 'absolute',
        top: 16,
        right: 16,
        opacity: 0, // Hidden for now, optional logic
    },
    deadlineText: {
        fontSize: 12,
        color: colors.textSubtle,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSubtle,
        marginBottom: 4,
        textAlign: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        opacity: 0.7,
    },
    emptyText: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubText: {
        color: colors.textSubtle,
        marginTop: 8,
    },
});
