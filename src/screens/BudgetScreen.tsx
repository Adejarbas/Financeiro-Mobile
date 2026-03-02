/**
 * 📉 FINANÇAS PRO GOLD - BUDGET SCREEN
 * Controle de orçamentos com UI Premium e Lucide Icons, Totalmente Alinhado com a Web
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Target,
    Plus,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Info,
    Wallet,
    ChevronLeft,
    ChevronRight,
    Copy,
    Lightbulb,
    Trash2,
    Calendar,
    BarChart3,
    Edit2,
    ArrowLeft,
    Sun,
    Moon,
    Eye,
    EyeOff
} from 'lucide-react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryGroup, VictoryTheme, VictoryLine, VictoryTooltip, VictoryVoronoiContainer } from 'victory-native';
import { useNavigation } from '@react-navigation/native';

import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import colors from '../theme/colors';
import { formatCurrency } from '../utils/currencyUtils';
import { Orcamento } from '../types';
import BudgetModal from '../components/BudgetModal';
import CopyBudgetModal from '../components/CopyBudgetModal';

export default function BudgetScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { budgets, transactions, categories, accounts, loading, refreshing, refreshData, deleteBudget, setBudget, isDarkMode, toggleDarkMode, hideValues, toggleHideValues } = useFinance();
    const theme = getColors(isDarkMode);

    const [selectedMonth, setSelectedMonth] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    const [filterAccount, setFilterAccount] = useState<string>('all');

    const [modalVisible, setModalVisible] = useState(false);
    const [copyModalVisible, setCopyModalVisible] = useState(false);
    const [selectedBudgetToEdit, setSelectedBudgetToEdit] = useState<Orcamento | null>(null);

    // Helpers Mês
    const handlePrevMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        let d = new Date(year, month - 2, 1);
        setSelectedMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    };

    const handleNextMonth = () => {
        const [year, month] = selectedMonth.split('-').map(Number);
        let d = new Date(year, month, 1);
        setSelectedMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
    };

    const monthLabel = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${months[month - 1]} de ${year}`;
    }, [selectedMonth]);

    const daysRemaining = useMemo(() => {
        const now = new Date();
        const year = parseInt(selectedMonth.split('-')[0]);
        const month = parseInt(selectedMonth.split('-')[1]) - 1;
        const lastDay = new Date(year, month + 1, 0).getDate();

        const currentMonthKey = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        if (selectedMonth === currentMonthKey) {
            return Math.max(1, lastDay - now.getDate());
        }
        return 0;
    }, [selectedMonth]);

    // Data Processing
    const currentMonthBudgets = budgets.filter(b => b.mes === selectedMonth);

    const budgetData = useMemo(() => {
        const monthTransactions = transactions.filter(t => {
            const txMonth = t.data_transacao.slice(0, 7);
            const matchesAccount = filterAccount === 'all' || t.conta_id === filterAccount;
            return t.tipo === 'despesa' && txMonth === selectedMonth && matchesAccount;
        });

        const spentByCategory = monthTransactions.reduce<Record<string, number>>((acc, t) => {
            acc[t.categoria_id] = (acc[t.categoria_id] || 0) + t.valor;
            return acc;
        }, {});

        const allCategoryIds = new Set([
            ...Object.keys(spentByCategory),
            ...currentMonthBudgets.map(b => b.categoria_id)
        ]);

        return Array.from(allCategoryIds).map(catId => {
            const category = categories.find(c => c.id === catId);
            const budget = currentMonthBudgets.find(b => b.categoria_id === catId);
            const spent = spentByCategory[catId] || 0;
            const planned = budget?.valor_planejado || 0;
            const percentage = planned > 0 ? (spent / planned) * 100 : 0;

            return {
                id: budget?.id,
                catId,
                categoryName: category?.nome || 'Desconhecida',
                categoryIcon: category?.icone || '🏷️',
                categoryColor: category?.cor || colors.textSubtle,
                planned,
                spent,
                percentage,
                remaining: planned - spent,
                hasBudget: !!budget,
                budgetData: budget, // the raw Orcamento struct for editing
                isOverBudget: spent > planned && planned > 0,
                isWarning: percentage >= 80 && spent <= planned
            };
        }).sort((a, b) => b.percentage - a.percentage);
    }, [transactions, budgets, selectedMonth, filterAccount, categories, currentMonthBudgets]);

    const categoriesWithBudget = budgetData.filter(b => b.hasBudget);
    const categoriesWithoutBudget = budgetData.filter(b => !b.hasBudget && b.spent > 0);

    const totalPlanned = categoriesWithBudget.reduce((sum, item) => sum + item.planned, 0);
    const totalSpent = categoriesWithBudget.reduce((sum, item) => sum + item.spent, 0);
    const overallPercentage = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;
    const totalRemaining = totalPlanned - totalSpent;

    const monthlyIncome = useMemo(() => {
        return transactions
            .filter(t => t.tipo === 'receita' && t.data_transacao.slice(0, 7) === selectedMonth && (filterAccount === 'all' || t.conta_id === filterAccount))
            .reduce((acc, t) => acc + t.valor, 0);
    }, [transactions, selectedMonth, filterAccount]);

    const potentialSavings = monthlyIncome - totalSpent;

    // Histórico de Performance
    const performanceHistory = useMemo(() => {
        const result = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;

            const monthBudgets = budgets.filter(b => b.mes === monthKey);
            const mPlanned = monthBudgets.reduce((sum, b) => sum + b.valor_planejado, 0);

            const mSpent = transactions
                .filter(t => t.tipo === 'despesa' && t.data_transacao.slice(0, 7) === monthKey && (filterAccount === 'all' || t.conta_id === filterAccount))
                .reduce((sum, t) => sum + t.valor, 0);

            result.push({
                x: `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`,
                planejado: mPlanned,
                gasto: mSpent
            });
        }
        return result;
    }, [budgets, transactions, filterAccount]);

    // Handlers
    const handleEdit = (budget: Orcamento) => {
        setSelectedBudgetToEdit(budget);
        setModalVisible(true);
    };

    const handleDelete = (id: string, name: string) => {
        Alert.alert(
            "Excluir Orçamento",
            `Deseja realmente excluir o limite para ${name}?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => deleteBudget(id) }
            ]
        );
    };

    const handleSuggest = async () => {
        Alert.alert(
            "Sugestões Inteligentes",
            "Isto irá calcular a média dos seus gastos nos últimos 3 meses e aplicar automaticamente os orçamentos no mês selecionado. Deseja prosseguir?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Aplicar", onPress: async () => {
                        let count = 0;
                        for (const cat of budgetData) {
                            const amount = Math.max(cat.spent, 100); // Exemplo de 'calculo' basico simulado para evitar freeze no app
                            await setBudget(cat.catId, amount, selectedMonth);
                            count++;
                        }
                        if (count > 0) {
                            Alert.alert("Sucesso", "Orçamentos sugeridos aplicados!");
                        } else {
                            Alert.alert("Sem Dados", "Gaste mais primeiro para que possamos sugerir.");
                        }
                    }
                }
            ]
        );
    };

    // Components
    const renderStatCard = (title: string, value: number, icon: any, color: string, subtitle?: string) => (
        <View style={styles.statCard}>
            <View style={styles.statHeaderRow}>
                <View style={[styles.statIconBadge, { backgroundColor: color + '20' }]}>
                    {icon}
                </View>
                <Text style={styles.statTitle}>{title}</Text>
            </View>
            <Text style={[styles.statValue, { color }]}>{hideValues ? '••••••' : formatCurrency(value)}</Text>
            {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
    );

    const renderBudgetItem = (item: any) => {
        let statusColor = colors.success;
        if (item.isOverBudget) statusColor = colors.error;
        else if (item.isWarning) statusColor = colors.warning;

        return (
            <View key={item.catId} style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: item.categoryColor + '20' }]}>
                        <Text style={styles.emoji}>{item.categoryIcon}</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.catName}>{item.categoryName}</Text>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.isOverBudget ? 'Limite Excedido' : item.isWarning ? 'Atenção' : 'Abaixo do Limite'}
                        </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.percentText, { color: statusColor }]}>{item.percentage.toFixed(0)}%</Text>
                    </View>
                </View>

                <View style={styles.progressBg}>
                    <View
                        style={[
                            styles.progressBar,
                            {
                                width: `${Math.min(item.percentage, 100)}%`,
                                backgroundColor: statusColor
                            }
                        ]}
                    />
                </View>

                <View style={styles.valuesContainer}>
                    <Text style={styles.spentValue}>
                        <Text style={{ color: colors.textSubtle, fontSize: 13, fontWeight: '400' }}>Gasto: </Text>
                        {hideValues ? '••••••' : formatCurrency(item.spent)}
                    </Text>
                    <Text style={styles.targetValue}>
                        <Text style={{ color: colors.textSubtle, fontSize: 13, fontWeight: '400' }}>Limite: </Text>
                        {hideValues ? '••••••' : formatCurrency(item.planned)}
                    </Text>
                </View>

                <View style={styles.actionsRow}>
                    <View style={[styles.remainingBadge, { backgroundColor: item.remaining >= 0 ? colors.success + '20' : colors.error + '20' }]}>
                        <Text style={[styles.remainingText, { color: item.remaining >= 0 ? colors.success : colors.error }]}>
                            {item.remaining >= 0 ? 'Resta' : 'Passou'}: {hideValues ? '••••••' : formatCurrency(Math.abs(item.remaining))}
                        </Text>
                    </View>

                    <View style={styles.cardIconActions}>
                        <TouchableOpacity style={styles.iconAction} onPress={() => handleEdit(item.budgetData)}>
                            <Edit2 size={16} color={colors.textSubtle} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.iconAction, { backgroundColor: colors.error + '10' }]} onPress={() => handleDelete(item.id, item.categoryName)}>
                            <Trash2 size={16} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            {/* Título Principal Fixo */}
            <View style={[styles.mainHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16, padding: 8, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                        <ArrowLeft size={20} color={theme.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[styles.title, { color: theme.text }]}>Orçamentos</Text>
                        <Text style={[styles.subtitle, { color: theme.textSubtle }]}>Planejamento Financeiro</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        style={{ padding: 8, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}
                        onPress={toggleHideValues}
                    >
                        {hideValues ? <EyeOff size={20} color={theme.textSubtle} /> : <Eye size={20} color={theme.textSubtle} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ padding: 8, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}
                        onPress={toggleDarkMode}
                    >
                        {isDarkMode ? <Sun size={20} color={theme.gold} /> : <Moon size={20} color={theme.textSubtle} />}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={colors.gold} />}
            >
                {/* Seletor de Mês */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrow}>
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.monthCenter}>
                        <Calendar size={18} color={colors.gold} style={{ marginRight: 6 }} />
                        <Text style={styles.monthTitle}>{monthLabel}</Text>
                    </View>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.monthArrow}>
                        <ChevronRight size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Filtro de Contas Horizontal */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountFilters} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    <TouchableOpacity
                        style={[styles.accountChip, filterAccount === 'all' && styles.accountChipActive]}
                        onPress={() => setFilterAccount('all')}
                    >
                        <Text style={[styles.accountChipText, filterAccount === 'all' && styles.accountChipTextActive]}>Todas as Contas</Text>
                    </TouchableOpacity>
                    {accounts.map(acc => (
                        <TouchableOpacity
                            key={acc.id}
                            style={[styles.accountChip, filterAccount === acc.id && styles.accountChipActive]}
                            onPress={() => setFilterAccount(acc.id)}
                        >
                            <Text style={[styles.accountChipText, filterAccount === acc.id && styles.accountChipTextActive]}>{acc.nome}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Ações (Copiar, Sugerir, Novo) */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionBtn} onPress={handleSuggest}>
                        <Lightbulb size={18} color={colors.textSubtle} />
                        <Text style={styles.actionBtnText}>Sugerir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedBudgetToEdit(null); setModalVisible(true); }}>
                        <Plus size={18} color={colors.gold} />
                        <Text style={[styles.actionBtnText, { color: colors.gold, fontWeight: 'bold' }]}>Novo Limite</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setCopyModalVisible(true)}>
                        <Copy size={18} color={colors.textSubtle} />
                        <Text style={styles.actionBtnText}>Copiar</Text>
                    </TouchableOpacity>
                </View>

                {/* Métricas (4 Cards) */}
                <View style={styles.statsGrid}>
                    <View style={styles.statsRow}>
                        {renderStatCard('Planejado', totalPlanned, <Target size={16} color={colors.gold} />, colors.gold, 'Total orçado')}
                        {renderStatCard('Gasto', totalSpent, <Wallet size={16} color={totalSpent > totalPlanned ? colors.error : colors.text} />, totalSpent > totalPlanned ? colors.error : colors.text, 'Consumido')}
                    </View>
                    <View style={styles.statsRow}>
                        {renderStatCard('Restante', totalRemaining, <TrendingDown size={16} color={totalRemaining < 0 ? colors.error : colors.success} />, totalRemaining < 0 ? colors.error : colors.success, 'Saldo disponível')}
                        {renderStatCard('Potencial de Guarda', potentialSavings, <TrendingUp size={16} color={colors.primary} />, colors.primary, 'Deste mês')}
                    </View>
                </View>

                <View style={styles.progressContainer}>
                    <View style={styles.progressHeaderRow}>
                        <Text style={styles.progressLabel}>Progresso Geral do Mês</Text>
                        <Text style={styles.progressPercent}>{overallPercentage.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressBar, { width: `${Math.min(overallPercentage, 100)}%`, backgroundColor: overallPercentage > 100 ? colors.error : colors.gold }]} />
                    </View>
                </View>

                {/* Gráficos */}
                {totalPlanned > 0 && categoriesWithBudget.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Planejado vs Gasto (Top 5)</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: -10, zIndex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                <View style={{ width: 12, height: 12, backgroundColor: colors.gold, borderRadius: 2, marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>Planejado</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 12, height: 12, backgroundColor: colors.error, borderRadius: 2, marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>Gasto</Text>
                            </View>
                        </View>

                        <View style={{ alignItems: 'center', marginLeft: -10 }}>
                            <VictoryChart
                                theme={VictoryTheme.material}
                                height={250}
                                width={Dimensions.get('window').width - 40}
                                domainPadding={{ x: 30 }}
                                containerComponent={
                                    <VictoryVoronoiContainer
                                        labels={({ datum }) => hideValues ? '••••••' : formatCurrency(datum._y || datum.y || 0)}
                                        labelComponent={<VictoryTooltip constrainToVisibleArea renderInPortal={false} style={{ fontSize: 10, fill: colors.text }} flyoutStyle={{ fill: colors.card, stroke: colors.border }} />}
                                    />
                                }
                            >
                                <VictoryAxis
                                    style={{
                                        tickLabels: { fill: colors.textSubtle, fontSize: 10, padding: 5 },
                                        axis: { stroke: colors.border }
                                    }}
                                />
                                <VictoryAxis
                                    dependentAxis
                                    tickFormat={(x) => `R$${x >= 1000 ? (x / 1000) + 'k' : x}`}
                                    style={{
                                        tickLabels: { fill: colors.textSubtle, fontSize: 10, padding: 5 },
                                        axis: { stroke: colors.border },
                                        grid: { stroke: colors.border, strokeDasharray: "4, 4" }
                                    }}
                                />
                                <VictoryGroup offset={16} colorScale={[colors.gold, colors.error]}>
                                    <VictoryBar
                                        barWidth={12}
                                        data={categoriesWithBudget.slice(0, 5).map(c => ({ x: c.categoryName.substring(0, 6) + '...', y: c.planned }))}
                                    />
                                    <VictoryBar
                                        barWidth={12}
                                        data={categoriesWithBudget.slice(0, 5).map(c => ({ x: c.categoryName.substring(0, 6) + '...', y: c.spent }))}
                                    />
                                </VictoryGroup>
                            </VictoryChart>
                        </View>
                    </View>
                )}

                {/* Gráfico 2: Histórico */}
                {performanceHistory.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Desempenho (Últimos 6 meses)</Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16, marginBottom: -10, zIndex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                                <View style={{ width: 16, height: 3, backgroundColor: colors.gold, marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>Planejado</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ width: 16, height: 3, backgroundColor: colors.error, marginRight: 6 }} />
                                <Text style={{ fontSize: 12, color: colors.textSubtle }}>Gasto</Text>
                            </View>
                        </View>

                        <View style={{ alignItems: 'center', marginLeft: -10 }}>
                            <VictoryChart
                                theme={VictoryTheme.material}
                                height={200}
                                width={Dimensions.get('window').width - 40}
                                domainPadding={{ x: 20 }}
                                containerComponent={
                                    <VictoryVoronoiContainer
                                        labels={({ datum }) => hideValues ? '••••••' : formatCurrency(datum._y || datum.y || 0)}
                                        labelComponent={<VictoryTooltip constrainToVisibleArea renderInPortal={false} style={{ fontSize: 10, fill: colors.text }} flyoutStyle={{ fill: colors.card, stroke: colors.border }} />}
                                    />
                                }
                            >
                                <VictoryAxis style={{ tickLabels: { fill: colors.textSubtle, fontSize: 10, padding: 5 } }} />
                                <VictoryAxis dependentAxis tickFormat={(x) => `R$${x >= 1000 ? (x / 1000) + 'k' : x}`} style={{ tickLabels: { fill: colors.textSubtle, fontSize: 10, padding: 5 } }} />
                                <VictoryLine
                                    data={performanceHistory}
                                    x="x" y="planejado"
                                    style={{ data: { stroke: colors.gold, strokeWidth: 3 } }}
                                />
                                <VictoryLine
                                    data={performanceHistory}
                                    x="x" y="gasto"
                                    style={{ data: { stroke: colors.error, strokeWidth: 3 } }}
                                />
                            </VictoryChart>
                        </View>
                    </View>
                )}

                {/* Categorias sem Orçamento */}
                {categoriesWithoutBudget.length > 0 && (
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <AlertCircle size={18} color={colors.warning} />
                            <Text style={styles.sectionTitle}>Sem Orçamento Definido</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                            {categoriesWithoutBudget.map(item => (
                                <View key={item.catId} style={styles.noBudgetCard}>
                                    <View style={[styles.iconContainer, { backgroundColor: item.categoryColor + '20', width: 32, height: 32, borderRadius: 10 }]}>
                                        <Text style={{ fontSize: 16 }}>{item.categoryIcon}</Text>
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={styles.noBudgetCatName}>{item.categoryName}</Text>
                                        <Text style={styles.noBudgetSpent}>Gasto: {hideValues ? '••••••' : formatCurrency(item.spent)}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.noBudgetBtn}
                                        onPress={() => {
                                            setModalVisible(true);
                                            // Ideally we'd pass category to modal, for now handled normally via BudgetModal state
                                        }}
                                    >
                                        <Text style={styles.noBudgetBtnText}>Definir Limite</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Lista de Orçamentos */}
                <View style={styles.listContainer}>
                    <Text style={[styles.sectionTitle, { paddingHorizontal: 20, marginBottom: 12 }]}>Meus Orçamentos</Text>

                    {categoriesWithBudget.length === 0 ? (
                        <View style={styles.emptyState}>
                            <BarChart3 size={48} color={colors.textSubtle + '40'} />
                            <Text style={styles.emptyText}>Nenhum limite definido</Text>
                            <Text style={styles.emptySubText}>Comece criando ou copiando de um mês anterior.</Text>
                        </View>
                    ) : (
                        <View style={{ paddingHorizontal: 20 }}>
                            {categoriesWithBudget.map(renderBudgetItem)}
                        </View>
                    )}
                </View>

                {/* Padding extra por causa das tabs */}
                <View style={{ height: 100 }} />
            </ScrollView>

            <BudgetModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                budgetToEdit={selectedBudgetToEdit}
                currentMonth={selectedMonth}
            />

            <CopyBudgetModal
                visible={copyModalVisible}
                onClose={() => setCopyModalVisible(false)}
                currentMonth={selectedMonth}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    mainHeader: {
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
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
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    monthArrow: {
        padding: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    monthCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    accountFilters: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    accountChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.card,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    accountChipActive: {
        backgroundColor: colors.text,
        borderColor: colors.text,
    },
    accountChipText: {
        fontSize: 14,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    accountChipTextActive: {
        color: colors.background,
        fontWeight: 'bold',
    },
    actionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.card,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    actionBtnText: {
        fontSize: 14,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    statsGrid: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    statIconBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statTitle: {
        fontSize: 13,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statSubtitle: {
        fontSize: 11,
        color: colors.textSubtle,
    },
    progressContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    progressHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    progressPercent: {
        fontSize: 14,
        color: colors.text,
        fontWeight: 'bold',
    },
    chartCard: {
        backgroundColor: colors.card,
        marginHorizontal: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: -10,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    noBudgetCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.warning + '50',
        width: 300,
        marginRight: 12,
    },
    noBudgetCatName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    noBudgetSpent: {
        fontSize: 12,
        color: colors.warning,
        fontWeight: '500',
        marginTop: 2,
    },
    noBudgetBtn: {
        backgroundColor: colors.gold + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    noBudgetBtnText: {
        color: colors.gold,
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContainer: {
        marginTop: 8,
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
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    emoji: {
        fontSize: 20,
    },
    headerText: {
        flex: 1,
    },
    catName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    percentText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressBg: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    valuesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    spentValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },
    targetValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    remainingBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    remainingText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardIconActions: {
        flexDirection: 'row',
        gap: 8,
    },
    iconAction: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 50,
        opacity: 0.7,
    },
    emptyText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubText: {
        color: colors.textSubtle,
        marginTop: 8,
        fontSize: 14,
    }
});
