/**
 * 📊 FINANÇAS PRO GOLD - REPORTS SCREEN
 * Paridade com Web: Fluxo de Caixa, Despesas por Categoria, Evolução Temporal
 * Desenvolvido Customizado (Sem Victory) - Design System Premium
 */
import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Dimensions,
    Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
    TrendingUp,
    PieChart as PieChartIcon,
    Calendar,
    AlertCircle,
    CheckCircle,
    Info,
    Download,
    ChevronDown,
    Filter,
    ArrowLeft,
    Check,
    ArrowUpRight,
    ArrowDownRight,
    TrendingDown,
    Target,
    CalendarDays,
    Sun,
    Moon,
    Eye,
    EyeOff
} from 'lucide-react-native';
import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import colors from '../theme/colors';
import { formatCurrency } from '../utils/currencyUtils';
import {
    calculateMetrics,
    comparePeriods,
    generateInsights,
    groupByDay,
    groupByMonth,
    groupByCategory
} from '../utils/reportUtils';
import { exportReportToPDF } from '../utils/pdfUtils';
import { formatMonthKey, getMonthRange } from '../utils/dateUtils';
import Svg, { Polyline, Circle, G } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

type ReportType = 'cashflow' | 'category' | 'annual';
type DateFilterType = 'current_month' | 'last_month' | 'last_30_days' | 'this_year' | 'all';

interface ChartItem {
    label: string;
    income?: number;
    expense?: number;
    cumulativeBalance?: number;
}

export default function ReportsScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { transactions, categories, accounts, refreshing, refreshData, isDarkMode, toggleDarkMode, hideValues, toggleHideValues } = useFinance();
    const theme = getColors(isDarkMode);

    const [reportType, setReportType] = useState<ReportType>('cashflow');
    const [dateFilter, setDateFilter] = useState<DateFilterType>('current_month');
    const [selectedAccount, setSelectedAccount] = useState<string>('all');
    const [isDateModalVisible, setDateModalVisible] = useState(false);
    const [isAccountModalVisible, setAccountModalVisible] = useState(false);

    const [selectedBarItem, setSelectedBarItem] = useState<ChartItem | null>(null);
    const [selectedLineItem, setSelectedLineItem] = useState<ChartItem | null>(null);

    // Mapeamento de Datas
    const dateRange = useMemo(() => {
        const now = new Date();
        let start = '', end = '';

        if (dateFilter === 'current_month') {
            const { firstDay, lastDay } = getMonthRange(formatMonthKey(now));
            start = firstDay;
            end = lastDay;
        } else if (dateFilter === 'last_month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const { firstDay, lastDay } = getMonthRange(formatMonthKey(lastMonth));
            start = firstDay;
            end = lastDay;
        } else if (dateFilter === 'last_30_days') {
            const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            start = past.toISOString().split('T')[0];
            end = now.toISOString().split('T')[0];
        } else if (dateFilter === 'this_year') {
            start = `${now.getFullYear()}-01-01`;
            end = `${now.getFullYear()}-12-31`;
        }

        return { start, end };
    }, [dateFilter]);

    // Filtragem Principal
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const acc = accounts.find(a => a.id === t.conta_id);
            if (acc && acc.tipo === 'Investimento') return false;

            const matchesDate = dateFilter === 'all' || (t.data_transacao >= dateRange.start && t.data_transacao <= dateRange.end);
            const matchesAccount = selectedAccount === 'all' || t.conta_id === selectedAccount;

            return matchesDate && matchesAccount;
        });
    }, [transactions, dateRange, dateFilter, selectedAccount, accounts]);

    const previousPeriodTransactions = useMemo(() => {
        if (dateFilter === 'all') return [];

        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() - daysDiff);
        const prevEnd = new Date(start);
        prevEnd.setDate(prevEnd.getDate() - 1);

        const strStart = prevStart.toISOString().split('T')[0];
        const strEnd = prevEnd.toISOString().split('T')[0];

        return transactions.filter(t => {
            const acc = accounts.find(a => a.id === t.conta_id);
            if (acc && acc.tipo === 'Investimento') return false;

            const matchesDate = t.data_transacao >= strStart && t.data_transacao <= strEnd;
            const matchesAccount = selectedAccount === 'all' || t.conta_id === selectedAccount;
            return matchesDate && matchesAccount;
        });
    }, [transactions, dateRange, dateFilter, selectedAccount, accounts]);

    const metrics = useMemo(() => calculateMetrics(filteredTransactions), [filteredTransactions]);
    const comparison = useMemo(() => comparePeriods(filteredTransactions, previousPeriodTransactions), [filteredTransactions, previousPeriodTransactions]);
    const insights = useMemo(() => generateInsights(filteredTransactions, previousPeriodTransactions, reportType as any), [filteredTransactions, previousPeriodTransactions, reportType]);

    const { chartData } = useMemo(() => {
        const data = reportType === 'annual' || dateFilter === 'this_year'
            ? groupByMonth(filteredTransactions).map(d => ({ ...d, label: d.month.substring(5, 7) + '/' + d.month.substring(2, 4) }))
            : groupByDay(filteredTransactions).map(d => ({ ...d, label: d.day }));
        return { chartData: data };
    }, [filteredTransactions, reportType, dateFilter]);

    const cumulativeData = useMemo(() => {
        let runningBalance = 0;
        return chartData.map(d => {
            runningBalance += (d.income || 0) - (d.expense || 0);
            return {
                ...d,
                cumulativeBalance: runningBalance
            };
        });
    }, [chartData]);

    const categoryData = useMemo(() => groupByCategory(filteredTransactions, categories), [filteredTransactions, categories]);

    const handleExportPDF = async () => {
        try {
            if (filteredTransactions.length === 0) {
                Alert.alert("Erro", "Nenhuma transação para exportar neste período.");
                return;
            }

            await exportReportToPDF({
                transactions: filteredTransactions,
                dateRange: { start: dateRange.start, end: dateRange.end, label: getDateFilterLabel() },
                metrics,
                categoryBreakdown: categoryData,
                insights,
                comparison,
                accounts
            });

        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Falha ao gerar PDF.");
        }
    };

    const dateFiltersList: { id: DateFilterType, label: string }[] = [
        { id: 'current_month', label: 'Este Mês' },
        { id: 'last_month', label: 'Mês Passado' },
        { id: 'last_30_days', label: 'Últimos 30 Dias' },
        { id: 'this_year', label: 'Este Ano' },
        { id: 'all', label: 'Todo o Período' }
    ];

    const getDateFilterLabel = () => dateFiltersList.find(f => f.id === dateFilter)?.label || 'Este Mês';
    const getAccountFilterLabel = () => selectedAccount === 'all' ? 'Todas as Contas' : accounts.find(a => a.id === selectedAccount)?.nome || 'Conta';

    // Gráfico de Barras
    const renderBarChart = () => {
        if (chartData.length === 0) return <Text style={[styles.emptyText]}>Nenhum dado no período</Text>;

        const maxIncome = Math.max(...chartData.map(d => d.income || 0));
        const maxExpense = Math.max(...chartData.map(d => d.expense || 0));
        const maxVal = Math.max(maxIncome, maxExpense, 1);
        const H = 160;

        return (
            <View style={{ position: 'relative', zIndex: 10, marginTop: 10 }}>
                {selectedBarItem && (
                    <View style={[styles.tooltipContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.tooltipLabel]}>{selectedBarItem.label}</Text>
                        <Text style={[styles.tooltipValue, { color: colors.teal }]}>+ {hideValues ? '••••••' : formatCurrency(selectedBarItem.income || 0)}</Text>
                        <Text style={[styles.tooltipValue, { color: colors.error }]}>- {hideValues ? '••••••' : formatCurrency(selectedBarItem.expense || 0)}</Text>
                    </View>
                )}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, gap: 14 }}>
                    {chartData.map((d, i) => {
                        const hInc = ((d.income || 0) / maxVal) * H;
                        const hExp = ((d.expense || 0) / maxVal) * H;
                        const isSelected = selectedBarItem?.label === d.label;

                        return (
                            <TouchableOpacity
                                key={i}
                                activeOpacity={0.7}
                                onPress={() => setSelectedBarItem(isSelected ? null : d as ChartItem)}
                                style={[{ alignItems: 'center', justifyContent: 'flex-end', height: H + 30, paddingHorizontal: 6 }, isSelected && { backgroundColor: colors.border, borderRadius: 8 }]}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: H }}>
                                    <View style={{ width: 8, height: hInc, backgroundColor: colors.teal, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginHorizontal: 3 }} />
                                    <View style={{ width: 8, height: hExp, backgroundColor: colors.error, borderTopLeftRadius: 4, borderTopRightRadius: 4, marginHorizontal: 3 }} />
                                </View>
                                <Text style={{ fontSize: 10, color: colors.textSubtle, marginTop: 8, fontWeight: isSelected ? 'bold' : 'normal' }}>{d.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        );
    };

    // Gráfico de Linhas C/ Grade
    const renderLineChart = (data: ChartItem[], keyY: string, color: string, color2?: string) => {
        if (data.length === 0) return <Text style={styles.emptyText}>Nenhum dado no período</Text>;

        const values1 = data.map(d => (d as any)[keyY] || 0);
        const values2 = color2 ? data.map(d => (d as any)['expense'] || 0) : [];
        const allVals = [...values1, ...values2];
        const maxVal = Math.max(...allVals, 1) * 1.1;
        const minVal = Math.min(...allVals, 0);
        const range = maxVal - minVal || 1;

        // Recalculando container para evitar overflow
        // Container Total = width - 40 (padding lateral da ScrollView principal) - 32 (padding lateral do card)
        const containerWidth = width - 72;
        const labelWidth = 35;
        const W = containerWidth - labelWidth;
        const H = 160;
        const step = data.length > 1 ? W / (data.length - 1) : 0;

        const points1 = data.map((d, i) => `${i * step},${H - ((((d as any)[keyY] || 0) - minVal) / range) * H}`).join(' ');
        const points2 = color2 ? data.map((d, i) => `${i * step},${H - ((((d as any)['expense'] || 0) - minVal) / range) * H}`).join(' ') : '';

        return (
            <View style={{ height: H + 30, width: containerWidth, position: 'relative', zIndex: 10, flexDirection: 'row', marginTop: 10 }}>
                {/* Eixo Y */}
                <View style={{ width: labelWidth, justifyContent: 'space-between', height: H, paddingRight: 4 }}>
                    <Text style={{ fontSize: 9, color: colors.textSubtle, textAlign: 'right' }}>{((maxVal) / 1000).toFixed(1)}k</Text>
                    <Text style={{ fontSize: 9, color: colors.textSubtle, textAlign: 'right' }}>{((maxVal / 2) / 1000).toFixed(1)}k</Text>
                    <Text style={{ fontSize: 9, color: colors.textSubtle, textAlign: 'right' }}>0</Text>
                </View>

                <View style={{ height: H + 30, width: W }}>
                    {selectedLineItem && (
                        <View style={[styles.tooltipContainer, { backgroundColor: colors.card, borderColor: colors.border, alignSelf: 'center' }]}>
                            <Text style={[styles.tooltipLabel]}>{selectedLineItem.label}</Text>
                            <Text style={[styles.tooltipValue, { color: color }]}>{keyY === 'cumulativeBalance' ? 'Saldo Acumulado' : 'Receitas'}: {hideValues ? '••••••' : formatCurrency((selectedLineItem as any)[keyY] || selectedLineItem.income || 0)}</Text>
                            {color2 && <Text style={[styles.tooltipValue, { color: color2 }]}>Despesas: {hideValues ? '••••••' : formatCurrency(selectedLineItem.expense || 0)}</Text>}
                        </View>
                    )}

                    <Svg width={W} height={H}>
                        {/* Linhas de Grade Verticais Base */}
                        {[0, 0.5, 1].map((val, i) => (
                            <Polyline key={`grid-${i}`} points={`0,${H * val} ${W},${H * val}`} fill="none" stroke={colors.border} strokeWidth="1" strokeDasharray="4,4" />
                        ))}
                        <Polyline points={points1} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {color2 && (
                            <Polyline points={points2} fill="none" stroke={color2} strokeWidth="3" strokeDasharray="6,6" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                        {/* Selected Point Overlay */}
                        {selectedLineItem && data.findIndex(d => d.label === selectedLineItem.label) !== -1 && (
                            <Circle cx={data.findIndex(d => d.label === selectedLineItem.label) * step}
                                cy={H - ((((selectedLineItem as any)[keyY] || 0) - minVal) / range) * H}
                                r={4} fill={color} stroke={colors.card} strokeWidth={2} />
                        )}
                    </Svg>

                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 30, flexDirection: 'row' }}>
                        {data.map((d, i) => (
                            <TouchableOpacity
                                key={`touch-${i}`}
                                style={{ flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' }}
                                activeOpacity={0.8}
                                onPress={() => setSelectedLineItem(selectedLineItem?.label === d.label ? null : d as ChartItem)}
                            >
                                {selectedLineItem?.label === d.label && (
                                    <View style={{ width: 1, height: '100%', backgroundColor: colors.border }} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 0 }}>
                        <Text style={{ fontSize: 9, color: colors.textSubtle }}>{data[0]?.label}</Text>
                        {data.length > 2 && <Text style={{ fontSize: 9, color: colors.textSubtle }}>{data[Math.floor(data.length / 2)]?.label}</Text>}
                        {data.length > 1 && <Text style={{ fontSize: 9, color: colors.textSubtle, textAlign: 'right' }}>{data[data.length - 1]?.label}</Text>}
                    </View>
                </View>
            </View>
        );
    };

    // Gráfico de Donut Customizado
    const renderDonutChart = () => {
        if (categoryData.length === 0) return null;
        const RADIUS = 60;
        const STROKE_WIDTH = 25;
        const CIRCLE_LENGTH = 2 * Math.PI * RADIUS; // ~377
        let currentOffset = 0;

        return (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Svg width={200} height={200} viewBox="0 0 200 200">
                    <G rotation="-90" origin="100, 100">
                        {categoryData.map((cat, idx) => {
                            const strokeDasharray = `${(cat.percentage / 100) * CIRCLE_LENGTH} ${CIRCLE_LENGTH}`;
                            const strokeDashoffset = -currentOffset;
                            currentOffset += (cat.percentage / 100) * CIRCLE_LENGTH;

                            return (
                                <Circle
                                    key={idx}
                                    cx="100"
                                    cy="100"
                                    r={RADIUS}
                                    stroke={cat.color || '#94A3B8'}
                                    strokeWidth={STROKE_WIDTH}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    fill="transparent"
                                />
                            );
                        })}
                    </G>
                </Svg>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, color: colors.textSubtle }}>Total</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>{categoryData.length}</Text>
                </View>
            </View>
        );
    };

    // Renderização do Insights Automáticos na Web Style
    const renderInsights = () => {
        if (insights.length === 0) return null;

        return (
            <View style={styles.webInsightsSection}>
                <View style={styles.webInsightsHeader}>
                    <AlertCircle size={18} color={colors.gold} />
                    <Text style={styles.webInsightsSectionTitle}>Insights Automáticos</Text>
                </View>
                <View style={styles.webInsightsGrid}>
                    {insights.map((insight, idx) => {
                        const isSuccess = insight.type === 'success';
                        const isWarning = insight.type === 'warning' || insight.type === 'danger';
                        const color = isSuccess ? colors.teal : isWarning ? colors.error : colors.gold;
                        const Icon = isSuccess ? CheckCircle : isWarning ? AlertCircle : Info;

                        return (
                            <View key={idx} style={[styles.webInsightCard, { borderColor: color + '50' }]}>
                                <View style={styles.insightHeaderRow}>
                                    <Icon size={16} color={color} />
                                    <Text style={[styles.insightTitle, { color }]}>{insight.title}</Text>
                                </View>
                                <Text style={[styles.insightMsg]}>{insight.message}</Text>
                                {insight.value ? <Text style={[styles.insightValue]}>{insight.value}</Text> : null}
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
            {/* Header com Voltar */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
                <View style={styles.headerTitleRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Relatórios</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={toggleHideValues} style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {hideValues ? <EyeOff size={20} color={theme.textSubtle} /> : <Eye size={20} color={theme.textSubtle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleDarkMode} style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {isDarkMode ? <Sun size={20} color={theme.gold} /> : <Moon size={20} color={theme.textSubtle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleExportPDF} style={[styles.exportBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Download size={20} color={theme.gold} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filtros em Linha (Modais) */}
            <View style={styles.filtersBar}>
                <TouchableOpacity style={styles.filterChip} onPress={() => setDateModalVisible(true)}>
                    <Calendar size={14} color={colors.textSubtle} style={{ marginRight: 8 }} />
                    <Text style={styles.filterChipText}>{getDateFilterLabel()}</Text>
                    <ChevronDown size={14} color={colors.textSubtle} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterChip} onPress={() => setAccountModalVisible(true)}>
                    <Filter size={14} color={colors.textSubtle} style={{ marginRight: 8 }} />
                    <Text style={[styles.filterChipText, { maxWidth: 100 }]} numberOfLines={1}>{getAccountFilterLabel()}</Text>
                    <ChevronDown size={14} color={colors.textSubtle} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
            </View>

            {/* Segmented Control (Abas) */}
            <View style={styles.tabsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: reportType === 'cashflow' ? 'transparent' : 'transparent', borderColor: reportType === 'cashflow' ? colors.gold : colors.border }]}
                        onPress={() => { setReportType('cashflow'); setSelectedBarItem(null); setSelectedLineItem(null); }}
                    >
                        <TrendingUp size={16} color={reportType === 'cashflow' ? colors.gold : colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, { color: reportType === 'cashflow' ? colors.gold : colors.textSubtle }]}>Fluxo de Caixa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: reportType === 'category' ? 'transparent' : 'transparent', borderColor: reportType === 'category' ? colors.gold : colors.border }]}
                        onPress={() => { setReportType('category'); setSelectedBarItem(null); setSelectedLineItem(null); }}
                    >
                        <PieChartIcon size={16} color={reportType === 'category' ? colors.gold : colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, { color: reportType === 'category' ? colors.gold : colors.textSubtle }]}>Despesas por Categoria</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, { backgroundColor: reportType === 'annual' ? 'transparent' : 'transparent', borderColor: reportType === 'annual' ? colors.gold : colors.border }]}
                        onPress={() => { setReportType('annual'); setSelectedBarItem(null); setSelectedLineItem(null); }}
                    >
                        <Calendar size={16} color={reportType === 'annual' ? colors.gold : colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={[styles.tabText, { color: reportType === 'annual' ? colors.gold : colors.textSubtle }]}>Evolução Temporal</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentScroll}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={colors.gold} />
                }
            >
                {/* 
                     ---- ABA: FLUXO DE CAIXA ---- 
                */}
                {reportType === 'cashflow' ? (
                    <>
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Total Entradas</Text>
                                    <ArrowUpRight size={16} color={colors.teal} />
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: colors.teal }]}>{hideValues ? '••••••' : formatCurrency(metrics.totalIncome)}</Text>
                            </View>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Total Saídas</Text>
                                    <ArrowDownRight size={16} color={colors.error} />
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: colors.error }]}>{hideValues ? '••••••' : formatCurrency(metrics.totalExpense)}</Text>
                                <Text style={[styles.kpiSubValueWeb, { color: comparison.expenseGrowth <= 0 ? colors.textSubtle : colors.textSubtle }]}>
                                    <Text style={{ color: comparison.expenseGrowth <= 0 ? colors.teal : colors.error }}>
                                        {comparison.expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.expenseGrowth).toFixed(1)}%
                                    </Text> vs anterior
                                </Text>
                            </View>
                        </View>
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Saldo Líquido</Text>
                                    <Target size={16} color={colors.gold} />
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: metrics.balance >= 0 ? colors.gold : colors.error }]}>
                                    {hideValues ? '••••••' : formatCurrency(metrics.balance)}
                                </Text>
                            </View>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Taxa de Poupança</Text>
                                </View>
                                <Text style={[styles.kpiValueWeb]}>{metrics.savingsRate.toFixed(1)}%</Text>
                                <Text style={styles.kpiSubValueWeb}>{metrics.savingsRate > 20 ? 'Excelente' : metrics.savingsRate > 0 ? 'Pode melhorar' : 'Atenção'}</Text>
                            </View>
                        </View>

                        {/* INSIGHTS AQUI */}
                        {renderInsights()}

                        <View style={[styles.chartCard]}>
                            <Text style={[styles.chartTitle]}>Evolução Diária</Text>
                            {renderBarChart()}
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: colors.teal }]} /><Text style={styles.legendText}>Receitas</Text>
                                <View style={[styles.legendDot, { backgroundColor: colors.error, marginLeft: 16 }]} /><Text style={styles.legendText}>Despesas</Text>
                            </View>
                        </View>

                        <View style={[styles.chartCard]}>
                            <Text style={[styles.chartTitle]}>Saldo Acumulado</Text>
                            <View style={{ alignItems: 'center' }}>
                                {renderLineChart(cumulativeData, 'cumulativeBalance', colors.gold)}
                            </View>
                        </View>
                    </>
                ) : null}

                {/* 
                     ---- ABA: CATEGORIA ---- 
                */}
                {reportType === 'category' ? (
                    <>
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Total Saídas</Text>
                                    <ArrowDownRight size={16} color={colors.error} />
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: colors.error }]}>{hideValues ? '••••••' : formatCurrency(metrics.totalExpense)}</Text>
                                <Text style={[styles.kpiSubValueWeb]}>
                                    <Text style={{ color: comparison.expenseGrowth <= 0 ? colors.teal : colors.error }}>
                                        {comparison.expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.expenseGrowth).toFixed(1)}%
                                    </Text> vs anterior
                                </Text>
                            </View>
                            <View style={[styles.kpiCardWeb]}>
                                <Text style={styles.kpiLabelWeb}>Maior Categoria</Text>
                                <Text style={[styles.kpiValueWeb, { fontSize: 20 }]} numberOfLines={1}>{categoryData[0]?.category || '-'}</Text>
                                <Text style={styles.kpiSubValueWeb}>{categoryData[0] ? (hideValues ? '••••••' : formatCurrency(categoryData[0].amount)) : '-'}</Text>
                            </View>
                        </View>
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiCardWeb]}>
                                <Text style={styles.kpiLabelWeb}>Maior Despesa Única</Text>
                                <Text style={[styles.kpiValueWeb, { fontSize: 18 }]} numberOfLines={1}>{metrics.largestExpense.description || '-'}</Text>
                                <Text style={[styles.kpiSubValueWeb, { marginTop: 4 }]}>{hideValues ? '••••••' : formatCurrency(metrics.largestExpense.amount)}</Text>
                            </View>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Total Transações</Text>
                                </View>
                                <Text style={[styles.kpiValueWeb]}>{filteredTransactions.length}</Text>
                                <Text style={styles.kpiSubValueWeb}>Neste período</Text>
                            </View>
                        </View>

                        {/* INSIGHTS AQUI */}
                        {renderInsights()}

                        <View style={[styles.chartCard]}>
                            <Text style={[styles.chartTitle]}>Distribuição por Categoria</Text>
                            {/* Gráfico Donut */}
                            {renderDonutChart()}

                            <Text style={[styles.chartTitle, { marginTop: 10, fontSize: 14 }]}>Top Categorias</Text>
                            {categoryData.length > 0 ? categoryData.map((cat, idx) => (
                                <View key={idx} style={[styles.catListItem]}>
                                    <View style={{ width: '100%', marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <View style={styles.catListLeft}>
                                            <View style={[styles.catColorDot, { backgroundColor: cat.color || '#94A3B8' }]} />
                                            <Text style={[styles.catListName]}>{cat.category}</Text>
                                        </View>
                                        <Text style={[styles.catListValue]}>{hideValues ? '••••••' : formatCurrency(cat.amount)} <Text style={styles.catListPct}>({cat.percentage.toFixed(1)}%)</Text></Text>
                                    </View>
                                    <View style={{ height: 6, width: '100%', backgroundColor: colors.border, borderRadius: 3 }}>
                                        <View style={{ height: 6, width: `${cat.percentage}%`, backgroundColor: cat.color || '#94A3B8', borderRadius: 3 }} />
                                    </View>
                                </View>
                            )) : (
                                <Text style={[styles.emptyText]}>Nenhum dado no período</Text>
                            )}
                        </View>
                    </>
                ) : null}

                {/* 
                     ---- ABA: EVOLUÇÃO ANUAL ---- 
                */}
                {reportType === 'annual' ? (
                    <>
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Crescimento Receita</Text>
                                    {comparison.incomeGrowth >= 0 ? <TrendingUp size={16} color={colors.teal} /> : <TrendingDown size={16} color={colors.error} />}
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: colors.teal }]}>{hideValues ? '••••••' : formatCurrency(metrics.totalIncome)}</Text>
                                <Text style={[styles.kpiSubValueWeb]}>
                                    <Text style={{ color: comparison.incomeGrowth >= 0 ? colors.teal : colors.error }}>
                                        {comparison.incomeGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.incomeGrowth).toFixed(1)}%
                                    </Text> vs anterior
                                </Text>
                            </View>
                            <View style={[styles.kpiCardWeb]}>
                                <View style={styles.kpiCardWebHeader}>
                                    <Text style={styles.kpiLabelWeb}>Controle de Gastos</Text>
                                    {comparison.expenseGrowth <= 0 ? <TrendingDown size={16} color={colors.teal} /> : <TrendingUp size={16} color={colors.error} />}
                                </View>
                                <Text style={[styles.kpiValueWeb, { color: colors.error }]}>{hideValues ? '••••••' : formatCurrency(metrics.totalExpense)}</Text>
                                <Text style={[styles.kpiSubValueWeb]}>
                                    <Text style={{ color: comparison.expenseGrowth <= 0 ? colors.teal : colors.error }}>
                                        {comparison.expenseGrowth >= 0 ? '↑' : '↓'} {Math.abs(comparison.expenseGrowth).toFixed(1)}%
                                    </Text> vs anterior
                                </Text>
                            </View>
                        </View>

                        {/* INSIGHTS AQUI */}
                        {renderInsights()}

                        <View style={[styles.chartCard]}>
                            <Text style={[styles.chartTitle]}>Comparativo Anual</Text>
                            <View style={{ alignItems: 'center' }}>
                                {renderLineChart(chartData, 'income', colors.teal, colors.error)}
                            </View>
                            <View style={styles.legendRow}>
                                <View style={[styles.legendDot, { backgroundColor: colors.teal }]} /><Text style={styles.legendText}>Receitas</Text>
                                <View style={[styles.legendDot, { backgroundColor: colors.error, marginLeft: 16 }]} /><Text style={styles.legendText}>Despesas</Text>
                            </View>
                        </View>
                    </>
                ) : null}
            </ScrollView>

            {/* Modal: Filtro de Data */}
            <Modal visible={isDateModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione o Período</Text>
                            <TouchableOpacity onPress={() => setDateModalVisible(false)} style={styles.modalCloseBtn}>
                                <Text style={{ color: colors.textSubtle, fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        {dateFiltersList.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={styles.modalItem}
                                onPress={() => { setDateFilter(filter.id); setDateModalVisible(false); }}
                            >
                                <Text style={[styles.modalItemText, { color: dateFilter === filter.id ? colors.gold : colors.text }]}>{filter.label}</Text>
                                {dateFilter === filter.id && <Check size={20} color={colors.gold} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            {/* Modal: Filtro de Conta */}
            <Modal visible={isAccountModalVisible} transparent={true} animationType="fade" onRequestClose={() => setAccountModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Conta</Text>
                            <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={styles.modalCloseBtn}>
                                <Text style={{ color: colors.textSubtle, fontSize: 16 }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={{ maxHeight: 300 }}>
                            <TouchableOpacity
                                style={styles.modalItem}
                                onPress={() => { setSelectedAccount('all'); setAccountModalVisible(false); }}
                            >
                                <Text style={[styles.modalItemText, { color: selectedAccount === 'all' ? colors.gold : colors.text }]}>Todas as Contas</Text>
                                {selectedAccount === 'all' && <Check size={20} color={colors.gold} />}
                            </TouchableOpacity>

                            {accounts.filter(a => a.tipo !== 'Investimento').map((account) => (
                                <TouchableOpacity
                                    key={account.id}
                                    style={styles.modalItem}
                                    onPress={() => { setSelectedAccount(account.id); setAccountModalVisible(false); }}
                                >
                                    <Text style={[styles.modalItemText, { color: selectedAccount === account.id ? colors.gold : colors.text }]}>{account.nome}</Text>
                                    {selectedAccount === account.id && <Check size={20} color={colors.gold} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        paddingTop: 10,
        paddingBottom: 16,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
    },
    exportBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filtersBar: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 14,
        gap: 12,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.text,
    },
    tabsContainer: {
        marginBottom: 16,
    },
    tabsScroll: {
        paddingHorizontal: 20,
        gap: 10,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
    },
    content: {
        flex: 1,
    },
    contentScroll: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },

    // KPIs Web Style
    kpiRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    kpiCardWeb: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        backgroundColor: colors.card,
        borderColor: colors.border,
    },
    kpiCardWebHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    kpiLabelWeb: {
        fontSize: 13,
        color: colors.textSubtle,
        fontWeight: '600',
    },
    kpiValueWeb: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: -0.5,
        color: colors.text,
    },
    kpiSubValueWeb: {
        fontSize: 12,
        color: colors.textSubtle,
        marginTop: 6,
    },

    // Insights Web Style
    webInsightsSection: {
        marginTop: 10,
        marginBottom: 20,
    },
    webInsightsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    webInsightsSectionTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    webInsightsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    webInsightCard: {
        width: '48%',
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        backgroundColor: 'transparent',
    },
    insightHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    insightTitle: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    insightMsg: {
        fontSize: 12,
        marginBottom: 8,
        lineHeight: 16,
        color: colors.textSubtle,
    },
    insightValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },

    // Charts Container
    chartCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 14,
        backgroundColor: colors.card,
        borderColor: colors.border,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: colors.text,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        color: colors.textSubtle,
        fontSize: 11,
    },

    // Listas
    catListItem: {
        flexDirection: 'column',
        justifyContent: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    catListLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    catColorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    catListName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.text,
    },
    catListValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },
    catListPct: {
        color: colors.textSubtle,
        fontSize: 12,
        fontWeight: 'normal'
    },
    emptyText: {
        textAlign: 'center',
        marginVertical: 40,
        fontSize: 14,
        color: colors.textSubtle,
    },
    tooltipContainer: {
        position: 'absolute',
        top: -15,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        zIndex: 50,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    tooltipLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        color: colors.text,
    },
    tooltipValue: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 1,
        borderBottomWidth: 0,
        paddingBottom: 30,
        backgroundColor: colors.card,
        borderColor: colors.border,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalCloseBtn: {
        padding: 4,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(150,150,150,0.05)',
    },
    modalItemText: {
        fontSize: 16,
    },
});
