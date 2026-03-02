/**
 * 📊 FINANÇAS PRO GOLD - DASHBOARD SCREEN
 * Espelho do web: métricas, gráficos, metas, orçamento, notificações
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    DollarSign,
    Sun,
    Moon,
    Eye,
    EyeOff,
    Target,
    Bell,
    AlertCircle,
    CheckCircle,
    X,
    BarChart2,
} from 'lucide-react-native';
import {
    VictoryBar,
    VictoryChart,
    VictoryGroup,
    VictoryAxis,
    VictoryTooltip,
    VictoryVoronoiContainer,
} from 'victory-native';

import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { getColors } from '../theme/colors';
import { formatCurrency } from '../utils/currencyUtils';
import TransactionModal from '../components/TransactionModal';
import { accountIcon, accountIconColor, accountIconBg } from './AccountsScreen';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 40;

// ─── Palavras genéricas a ignorar no nome ──────────────────────────────────
const GENERIC_NAMES = new Set([
    'cliente', 'usuario', 'user', 'test', 'teste', 'admin', 'gestor',
    'financeiro', 'demo', 'trial',
]);

// Tipo de navegação genérico — aceita qualquer rota definida em AppNavigator
type AnyNavigation = NavigationProp<Record<string, undefined>>;

export default function DashboardScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<AnyNavigation>();
    const { user, userProfile } = useAuth();
    const {
        dashboardSummary,
        accounts,
        transactions,
        goals,
        budgets,
        categories,
        refreshData,
        hideValues,
        toggleHideValues,
        isDarkMode,
        toggleDarkMode,
    } = useFinance();

    const c = getColors(isDarkMode);

    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshData();
        setRefreshing(false);
    };

    // ─── Nome do usuário: vem da tabela `usuarios` (nome cadastrado) ─────────────
    const userName = useMemo(() => {
        // 1ª opção: perfil da tabela usuarios (mais fiável)
        if (userProfile?.nome) {
            const parts = userProfile.nome.trim().split(/\s+/);
            // Pula tokens genéricos (ex: "cliente", "teste")
            const meaningful = parts.find(p => p.length > 1 && !GENERIC_NAMES.has(p.toLowerCase()));
            return meaningful || parts[parts.length - 1] || 'Investidor';
        }
        // 2ª opção: metadata do Supabase Auth
        const authName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
        if (authName) {
            return authName.trim().split(/\s+/)[0];
        }
        // 3ª opção: prefixo do email
        const emailPrefix = (user?.email || '').split('@')[0];
        return emailPrefix || 'Investidor';
    }, [userProfile, user]);

    const recentTransactions = transactions.slice(0, 5);

    // ─── Métricas calculadas das transações ───────────────────────────────
    const { monthlyIncome, monthlyExpense } = useMemo(() => {
        const now = new Date();

        const calc = (year: number, month: number) => {
            const inc = transactions
                .filter(t => {
                    const d = new Date(t.data_transacao);
                    return t.tipo === 'receita' &&
                        t.status === 'Concluído' &&
                        d.getMonth() === month && d.getFullYear() === year;
                })
                .reduce((s, t) => s + t.valor, 0);

            const exp = transactions
                .filter(t => {
                    const d = new Date(t.data_transacao);
                    return t.tipo === 'despesa' &&
                        t.status === 'Concluído' &&
                        d.getMonth() === month && d.getFullYear() === year;
                })
                .reduce((s, t) => s + t.valor, 0);

            return { inc, exp };
        };

        // Mês atual
        const cur = calc(now.getFullYear(), now.getMonth());
        if (cur.inc > 0 || cur.exp > 0) {
            return { monthlyIncome: cur.inc, monthlyExpense: cur.exp };
        }

        // Fallback: mês anterior
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const p = calc(prev.getFullYear(), prev.getMonth());
        return { monthlyIncome: p.inc, monthlyExpense: p.exp };
    }, [transactions]);

    const lucro = monthlyIncome - monthlyExpense;
    const profitPct = monthlyIncome > 0
        ? ((lucro / monthlyIncome) * 100).toFixed(1) : '0.0';

    // ─── Notificações / Alertas (igual ao web) ────────────────────────────
    const alerts = useMemo(() => {
        const list: { type: 'warning' | 'error' | 'success'; msg: string }[] = [];

        // Orçamentos
        budgets.forEach(b => {
            const spent = transactions
                .filter(t => t.tipo === 'despesa' && t.categoria_id === b.categoria_id)
                .reduce((s, t) => s + t.valor, 0);
            const pct = b.valor_planejado > 0 ? (spent / b.valor_planejado) * 100 : 0;
            const cat = categories.find(c => c.id === b.categoria_id);
            const catName = cat?.nome || 'Categoria';

            if (pct >= 100) {
                list.push({ type: 'error', msg: `Orçamento de ${catName} esgotado (${pct.toFixed(0)}%)` });
            } else if (pct >= 80) {
                list.push({ type: 'warning', msg: `Orçamento de ${catName} quase no limite (${pct.toFixed(0)}%)` });
            }
        });

        // Metas com progresso baixo (< 20%)
        goals.forEach(g => {
            const pct = g.valor_alvo > 0 ? (g.valor_atual / g.valor_alvo) * 100 : 0;
            if (pct < 20 && g.valor_alvo > 0) {
                list.push({ type: 'warning', msg: `Meta "${g.nome}" com progresso baixo (${pct.toFixed(0)}%)` });
            }
            if (pct >= 100) {
                list.push({ type: 'success', msg: `Parabéns! Meta "${g.nome}" concluída! 🎉` });
            }
        });

        // Saldo zerado
        if (dashboardSummary.saldo_total <= 0) {
            list.push({ type: 'error', msg: 'Saldo total zerado ou negativo — atenção!' });
        }

        return list;
    }, [budgets, goals, transactions, categories, dashboardSummary]);

    // ─── Gráfico: Despesas vs Receitas (últimos 6 meses) ─────────────────
    const expenseVsIncomeData = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const m = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
            const label = m.toLocaleDateString('pt-BR', { month: 'short' });
            const inc = transactions
                .filter(t => {
                    const d = new Date(t.data_transacao);
                    return t.tipo === 'receita' && t.status === 'Concluído' &&
                        d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
                })
                .reduce((s, t) => s + t.valor, 0);
            const exp = transactions
                .filter(t => {
                    const d = new Date(t.data_transacao);
                    return t.tipo === 'despesa' && t.status === 'Concluído' &&
                        d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
                })
                .reduce((s, t) => s + t.valor, 0);
            return {
                month: label.charAt(0).toUpperCase() + label.slice(1),
                receitas: inc,
                despesas: exp,
            };
        });
    }, [transactions]);

    // ─── Gráfico: Comparativo Mensal ──────────────────────────────────────
    const comparisonData = useMemo(() => {
        const lucroMes = monthlyIncome - monthlyExpense;
        return [
            { x: 'Receitas', anterior: monthlyIncome * 0.85, atual: monthlyIncome },
            { x: 'Despesas', anterior: monthlyExpense * 1.05, atual: monthlyExpense },
            { x: 'Lucro', anterior: (monthlyIncome * 0.85) - (monthlyExpense * 1.05), atual: lucroMes },
        ];
    }, [monthlyIncome, monthlyExpense]);

    // ─── Metas top 3 ─────────────────────────────────────────────────────
    const topGoals = goals.slice(0, 3);

    // ─── Orçamento status top 3 ───────────────────────────────────────────
    const budgetStatus = useMemo(() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const monthTxs = transactions.filter(
            t => t.tipo === 'despesa' && t.data_transacao.slice(0, 7) === currentMonth
        );
        const spent: Record<string, number> = {};
        monthTxs.forEach(t => {
            if (t.categoria_id) spent[t.categoria_id] = (spent[t.categoria_id] || 0) + t.valor;
        });
        return budgets
            .map(b => {
                const s = spent[b.categoria_id || ''] || 0;
                const pct = b.valor_planejado > 0 ? (s / b.valor_planejado) * 100 : 0;
                const cat = categories.find(c => c.id === b.categoria_id);
                return { ...b, spent: s, pct, catName: cat?.nome || 'Categoria' };
            })
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 3);
    }, [budgets, transactions, categories]);

    const maskValue = (val: string) => (hideValues ? '••••••' : val);
    const budgetColor = (pct: number) =>
        pct >= 100 ? c.error : pct >= 80 ? c.warning : c.teal;

    // ─────────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ══ HEADER ══ */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.greeting, { color: c.text }]}>Olá, {userName} 👋</Text>
                        <Text style={[styles.date, { color: c.textSubtle }]}>
                            {new Date().toLocaleDateString('pt-BR', {
                                weekday: 'long', day: 'numeric', month: 'long',
                            })}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {/* Ocultar valores */}
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: c.card, borderColor: c.border }]}
                            onPress={toggleHideValues}
                        >
                            {hideValues
                                ? <EyeOff size={17} color={c.textSubtle} />
                                : <Eye size={17} color={c.textSubtle} />
                            }
                        </TouchableOpacity>

                        {/* Dark/Light toggle */}
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: c.card, borderColor: c.border }]}
                            onPress={toggleDarkMode}
                        >
                            {isDarkMode
                                ? <Sun size={17} color={c.gold} />
                                : <Moon size={17} color={c.textSubtle} />
                            }
                        </TouchableOpacity>

                        {/* Notificações */}
                        <TouchableOpacity
                            style={[styles.headerBtn, { backgroundColor: c.card, borderColor: c.border }]}
                            onPress={() => setNotifVisible(true)}
                        >
                            <Bell size={17} color={alerts.length > 0 ? c.warning : c.textSubtle} />
                            {alerts.length > 0 && (
                                <View style={[styles.notifBadge, { backgroundColor: c.error }]}>
                                    <Text style={styles.notifBadgeText}>
                                        {alerts.length > 9 ? '9+' : alerts.length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ══ 4 CARDS DE MÉTRICAS ══ */}
                <View style={styles.metricsGrid}>
                    <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <View style={styles.metricCardHeader}>
                            <Text style={[styles.metricCardLabel, { color: c.textSubtle }]}>SALDO TOTAL</Text>
                            <Wallet size={17} color={c.gold} />
                        </View>
                        <Text style={[styles.metricCardValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                            {maskValue(formatCurrency(dashboardSummary.saldo_total))}
                        </Text>
                        <View style={styles.metricCardFooter}>
                            <TrendingUp size={12} color={c.teal} />
                            <Text style={[styles.metricCardTrend, { color: c.teal }]}> +12.5%</Text>
                        </View>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <View style={styles.metricCardHeader}>
                            <Text style={[styles.metricCardLabel, { color: c.textSubtle }]}>RECEITAS</Text>
                            <TrendingUp size={17} color={c.teal} />
                        </View>
                        <Text style={[styles.metricCardValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                            {maskValue(formatCurrency(monthlyIncome))}
                        </Text>
                        <View style={styles.metricCardFooter}>
                            <TrendingUp size={12} color={c.teal} />
                            <Text style={[styles.metricCardTrend, { color: c.teal }]}> +5.2%</Text>
                        </View>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <View style={styles.metricCardHeader}>
                            <Text style={[styles.metricCardLabel, { color: c.textSubtle }]}>DESPESAS</Text>
                            <TrendingDown size={17} color={c.error} />
                        </View>
                        <Text style={[styles.metricCardValue, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                            {maskValue(formatCurrency(monthlyExpense))}
                        </Text>
                        <View style={styles.metricCardFooter}>
                            <TrendingDown size={12} color={c.error} />
                            <Text style={[styles.metricCardTrend, { color: c.error }]}> -3.1%</Text>
                        </View>
                    </View>

                    <View style={[styles.metricCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <View style={styles.metricCardHeader}>
                            <Text style={[styles.metricCardLabel, { color: c.textSubtle }]}>LUCRO</Text>
                            <DollarSign size={17} color={lucro >= 0 ? c.teal : c.error} />
                        </View>
                        <Text style={[styles.metricCardValue, { color: lucro >= 0 ? c.text : c.error }]} numberOfLines={1} adjustsFontSizeToFit>
                            {maskValue(formatCurrency(lucro))}
                        </Text>
                        <View style={styles.metricCardFooter}>
                            <TrendingUp size={12} color={lucro >= 0 ? c.teal : c.error} />
                            <Text style={[styles.metricCardTrend, { color: lucro >= 0 ? c.teal : c.error }]}>
                                {' '}{profitPct}%
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ══ ÚLTIMAS TRANSAÇÕES (aqui — acima de gráficos) ══ */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Últimas Transações</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Transações' as any)}>
                        <Text style={[styles.seeAll, { color: c.gold }]}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.transactionsList, { backgroundColor: c.card, borderColor: c.border }]}>
                    {recentTransactions.length === 0 ? (
                        <View style={[styles.emptyState, { paddingVertical: 24 }]}>
                            <Text style={[styles.emptyText, { color: c.textSubtle }]}>Nenhuma transação ainda</Text>
                        </View>
                    ) : (
                        recentTransactions.map((tx, idx) => (
                            <View
                                key={tx.id}
                                style={[
                                    styles.transactionItem,
                                    idx < recentTransactions.length - 1 && {
                                        borderBottomWidth: 1, borderBottomColor: c.divider,
                                    },
                                ]}
                            >
                                <View style={[
                                    styles.txIcon,
                                    { backgroundColor: tx.tipo === 'receita' ? c.success + '20' : c.error + '20' },
                                ]}>
                                    {tx.tipo === 'receita'
                                        ? <ArrowUpRight size={18} color={c.success} />
                                        : <ArrowDownLeft size={18} color={c.error} />
                                    }
                                </View>
                                <View style={styles.txInfo}>
                                    <Text style={[styles.txDescription, { color: c.text }]} numberOfLines={1}>
                                        {tx.descricao}
                                    </Text>
                                    <Text style={[styles.txCategory, { color: c.textSubtle }]}>
                                        {tx.categorias?.nome || 'Geral'} · {new Date(tx.data_transacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </Text>
                                </View>
                                <Text style={[styles.txAmount, { color: tx.tipo === 'receita' ? c.success : c.error }]}>
                                    {tx.tipo === 'receita' ? '+' : '-'}{maskValue(formatCurrency(tx.valor))}
                                </Text>
                            </View>
                        ))
                    )}
                </View>

                {/* ══ QUICK ACTIONS ══ */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => setModalVisible(true)}>
                        <View style={[styles.actionIcon, { backgroundColor: c.gold + '20' }]}>
                            <Plus size={22} color={c.gold} />
                        </View>
                        <Text style={[styles.actionLabel, { color: c.textSubtle }]}>Nova</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Investir' as any)}>
                        <View style={[styles.actionIcon, { backgroundColor: c.teal + '20' }]}>
                            <TrendingUp size={22} color={c.teal} />
                        </View>
                        <Text style={[styles.actionLabel, { color: c.textSubtle }]}>Investir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Menu' as any)}>
                        <View style={[styles.actionIcon, { backgroundColor: c.purple + '20' }]}>
                            <BarChart2 size={22} color={c.purple} />
                        </View>
                        <Text style={[styles.actionLabel, { color: c.textSubtle }]}>Relatórios</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Menu' as any)}>
                        <View style={[styles.actionIcon, { backgroundColor: c.info + '20' }]}>
                            <DollarSign size={22} color={c.info} />
                        </View>
                        <Text style={[styles.actionLabel, { color: c.textSubtle }]}>Orçamento</Text>
                    </TouchableOpacity>
                </View>

                {/* ══ GRÁFICO: DESPESAS VS RECEITAS ══ */}
                <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>Despesas vs Receitas</Text>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: c.error }]} />
                                <Text style={[styles.legendText, { color: c.textSubtle }]}>Desp.</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: c.teal }]} />
                                <Text style={[styles.legendText, { color: c.textSubtle }]}>Rec.</Text>
                            </View>
                        </View>
                    </View>
                    <VictoryChart
                        width={CHART_WIDTH - 32}
                        height={190}
                        domainPadding={{ x: 18 }}
                        padding={{ top: 10, bottom: 36, left: 48, right: 10 }}
                        containerComponent={
                            <VictoryVoronoiContainer
                                voronoiDimension="x"
                                labels={({ datum }) =>
                                    `${datum.month || datum.x}: ${formatCurrency(datum._y || 0)}`
                                }
                                labelComponent={
                                    <VictoryTooltip
                                        renderInPortal={false}
                                        flyoutStyle={{ fill: c.chartTooltipBg, stroke: c.border }}
                                        style={{ fill: c.text, fontSize: 10 }}
                                    />
                                }
                            />
                        }
                    >
                        <VictoryAxis
                            tickValues={expenseVsIncomeData.map(d => d.month)}
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: c.chartAxis, fontSize: 10, fontWeight: '500' },
                                grid: { stroke: 'transparent' },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickFormat={v => `${(v / 1000).toFixed(0)}k`}
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: c.chartAxis, fontSize: 9 },
                                grid: { stroke: c.chartGrid, strokeDasharray: '4,4' },
                            }}
                        />
                        <VictoryGroup offset={13}>
                            <VictoryBar
                                data={expenseVsIncomeData} x="month" y="despesas"
                                style={{ data: { fill: c.error } }}
                                barWidth={11} cornerRadius={{ top: 3 }}
                            />
                            <VictoryBar
                                data={expenseVsIncomeData} x="month" y="receitas"
                                style={{ data: { fill: c.teal } }}
                                barWidth={11} cornerRadius={{ top: 3 }}
                            />
                        </VictoryGroup>
                    </VictoryChart>
                </View>

                {/* ══ GRÁFICO: COMPARATIVO MENSAL ══ */}
                <View style={[styles.chartCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.chartHeader}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>Comparativo Mensal</Text>
                        <View style={styles.chartLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: c.tealDark }]} />
                                <Text style={[styles.legendText, { color: c.textSubtle }]}>Ant.</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: c.gold }]} />
                                <Text style={[styles.legendText, { color: c.textSubtle }]}>Atual</Text>
                            </View>
                        </View>
                    </View>
                    <VictoryChart
                        width={CHART_WIDTH - 32}
                        height={190}
                        domainPadding={{ x: 38 }}
                        padding={{ top: 10, bottom: 36, left: 52, right: 10 }}
                        containerComponent={
                            <VictoryVoronoiContainer
                                voronoiDimension="x"
                                labels={({ datum }) =>
                                    `${datum.x}: ${formatCurrency(datum._y || 0)}`
                                }
                                labelComponent={
                                    <VictoryTooltip
                                        renderInPortal={false}
                                        flyoutStyle={{ fill: c.chartTooltipBg, stroke: c.border }}
                                        style={{ fill: c.text, fontSize: 10 }}
                                    />
                                }
                            />
                        }
                    >
                        <VictoryAxis
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: c.chartAxis, fontSize: 10, fontWeight: '500' },
                                grid: { stroke: 'transparent' },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis
                            tickFormat={v => `${(v / 1000).toFixed(0)}k`}
                            style={{
                                axis: { stroke: 'transparent' },
                                tickLabels: { fill: c.chartAxis, fontSize: 9 },
                                grid: { stroke: c.chartGrid, strokeDasharray: '4,4' },
                            }}
                        />
                        <VictoryGroup offset={26}>
                            <VictoryBar
                                data={comparisonData} x="x" y="anterior"
                                style={{ data: { fill: c.tealDark } }}
                                barWidth={22} cornerRadius={{ top: 4 }}
                            />
                            <VictoryBar
                                data={comparisonData} x="x" y="atual"
                                style={{ data: { fill: c.gold } }}
                                barWidth={22} cornerRadius={{ top: 4 }}
                            />
                        </VictoryGroup>
                    </VictoryChart>
                </View>

                {/* ══ MINHAS CONTAS ══ */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Minhas Contas</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Contas' as any)}>
                        <ArrowUpRight size={20} color={c.gold} />
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsScroll}>
                    {accounts.map(acc => (
                        <View key={acc.id} style={[styles.accountCard, { backgroundColor: c.card, borderColor: c.border }]}>
                            <View style={styles.accountHeader}>
                                <View style={[styles.bankIcon, { backgroundColor: accountIconBg(acc.tipo, c) }]}>
                                    {accountIcon(acc.tipo, accountIconColor(acc.tipo, c), 16)}
                                </View>
                                <Text style={[styles.bankName, { color: c.text }]} numberOfLines={1}>{acc.nome}</Text>
                            </View>
                            <Text style={[styles.accountBalance, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>
                                {maskValue(formatCurrency(acc.saldo))}
                            </Text>
                            <Text style={[styles.accountType, { color: c.textSubtle }]}>{acc.tipo}</Text>
                        </View>
                    ))}
                    <TouchableOpacity
                        style={[styles.addAccountCard, { borderColor: c.border }]}
                        onPress={() => navigation.navigate('Contas' as any)}
                    >
                        <Plus size={20} color={c.textMuted} />
                        <Text style={[styles.addAccountText, { color: c.textMuted }]}>Nova{'\n'}Conta</Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* ══ METAS FINANCEIRAS ══ */}
                <View style={[styles.widgetCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.widgetHeader}>
                        <View style={styles.widgetTitleRow}>
                            <Target size={16} color={c.gold} />
                            <Text style={[styles.sectionTitle, { color: c.text, marginLeft: 7 }]}>Metas Financeiras</Text>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('Menu' as any)}>
                            <Text style={[styles.seeAll, { color: c.teal }]}>Gerenciar →</Text>
                        </TouchableOpacity>
                    </View>

                    {topGoals.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: c.textSubtle }]}>Nenhuma meta cadastrada</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Menu' as any)}>
                                <Text style={[styles.emptyAction, { color: c.gold }]}>Criar meta →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        topGoals.map((goal, idx) => {
                            const pct = goal.valor_alvo > 0
                                ? Math.min((goal.valor_atual / goal.valor_alvo) * 100, 100) : 0;
                            const goalColor = goal.cor || c.teal;
                            return (
                                <View key={goal.id} style={[styles.goalItem, idx < topGoals.length - 1 && { marginBottom: 16 }]}>
                                    <View style={styles.goalHeader}>
                                        <Text style={[styles.goalName, { color: c.text }]} numberOfLines={1}>{goal.nome}</Text>
                                        <Text style={[styles.goalPct, { color: c.textSubtle }]}>{pct.toFixed(0)}%</Text>
                                    </View>
                                    <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
                                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: goalColor }]} />
                                    </View>
                                    <View style={styles.goalFooter}>
                                        <Text style={[styles.goalCurrent, { color: goalColor }]}>
                                            {maskValue(formatCurrency(goal.valor_atual))}
                                        </Text>
                                        <Text style={[styles.goalTarget, { color: c.textSubtle }]}>
                                            de {maskValue(formatCurrency(goal.valor_alvo))}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ══ STATUS DO ORÇAMENTO ══ */}
                <View style={[styles.widgetCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.widgetHeader}>
                        <Text style={[styles.sectionTitle, { color: c.text }]}>💰 Status do Orçamento</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Menu' as any)}>
                            <Text style={[styles.seeAll, { color: c.gold }]}>Ver tudo →</Text>
                        </TouchableOpacity>
                    </View>

                    {budgetStatus.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={[styles.emptyText, { color: c.textSubtle }]}>Nenhum orçamento definido</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Menu' as any)}>
                                <Text style={[styles.emptyAction, { color: c.gold }]}>Definir agora →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        budgetStatus.map((b, idx) => {
                            const color = budgetColor(b.pct);
                            return (
                                <View key={b.id} style={[styles.goalItem, idx < budgetStatus.length - 1 && { marginBottom: 14 }]}>
                                    <View style={styles.goalHeader}>
                                        <Text style={[styles.goalName, { color: c.text }]} numberOfLines={1}>{b.catName}</Text>
                                        <Text style={[styles.goalPct, { color }]}>{b.pct.toFixed(0)}%</Text>
                                    </View>
                                    <View style={[styles.progressTrack, { backgroundColor: c.background }]}>
                                        <View style={[styles.progressFill, { width: `${Math.min(b.pct, 100)}%`, backgroundColor: color }]} />
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* ══ MODAL: TRANSAÇÃO ══ */}
            <TransactionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />

            {/* ══ PAINEL DE NOTIFICAÇÕES (absolute — sem Modal nativo = sem bug de foco) ══ */}
            {notifVisible && (
                <>
                    {/* Overlay escuro */}
                    <TouchableOpacity
                        style={styles.notifOverlay}
                        activeOpacity={1}
                        onPress={() => setNotifVisible(false)}
                    />
                    {/* Painel */}
                    <View
                        style={[
                            styles.notifPanel,
                            {
                                backgroundColor: c.card,
                                borderColor: c.border,
                                top: insets.top + 58,
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={[styles.notifHeader, { borderBottomColor: c.divider }]}>
                            <View style={styles.notifTitleRow}>
                                <Bell size={16} color={c.gold} />
                                <Text style={[styles.notifTitle, { color: c.text }]}>Notificações</Text>
                                {alerts.length > 0 && (
                                    <View style={[styles.notifCountBadge, { backgroundColor: c.error }]}>
                                        <Text style={styles.notifCountText}>{alerts.length}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setNotifVisible(false)}>
                                <X size={18} color={c.textSubtle} />
                            </TouchableOpacity>
                        </View>

                        {/* Lista */}
                        {alerts.length === 0 ? (
                            <View style={[styles.emptyState, { paddingVertical: 24 }]}>
                                <CheckCircle size={32} color={c.teal} />
                                <Text style={[styles.emptyText, { color: c.textSubtle, marginTop: 8 }]}>
                                    Tudo em ordem! Sem alertas.
                                </Text>
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 300 }} bounces={false}>
                                {alerts.map((a, idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.alertItem,
                                            idx < alerts.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.divider },
                                        ]}
                                    >
                                        <AlertCircle
                                            size={17}
                                            color={a.type === 'error' ? c.error : a.type === 'success' ? c.success : c.warning}
                                        />
                                        <Text style={[styles.alertMsg, { color: c.text }]}>{a.msg}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </>
            )}
        </View>
    );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 12,
    },
    greeting: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3 },
    date: { fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerBtn: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },

    // Notif badge no sino
    notifBadge: {
        position: 'absolute', top: -4, right: -4,
        minWidth: 16, height: 16, borderRadius: 8,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 3,
    },
    notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

    // Grid 4 métricas
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    metricCard: {
        width: (width - 52) / 2,
        borderRadius: 16, padding: 16, borderWidth: 1,
        minHeight: 110, justifyContent: 'space-between',
    },
    metricCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    metricCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    metricCardValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
    metricCardFooter: { flexDirection: 'row', alignItems: 'center' },
    metricCardTrend: { fontSize: 11, fontWeight: '600' },

    // Quick Actions
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
    actionButton: { alignItems: 'center', width: (width - 40) / 4 - 8 },
    actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    actionLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },

    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
    seeAll: { fontSize: 13, fontWeight: '600' },

    chartCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    chartLegend: { flexDirection: 'row', gap: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, fontWeight: '600' },

    accountsScroll: { paddingRight: 20, paddingBottom: 20 },
    accountCard: {
        width: 145, height: 148, borderRadius: 16,
        padding: 14, marginRight: 12, borderWidth: 1, justifyContent: 'space-between',
    },
    accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    bankIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    bankName: { fontWeight: '700', fontSize: 13, flex: 1 },
    accountBalance: { fontSize: 16, fontWeight: '800' },
    accountType: { fontSize: 11 },
    addAccountCard: {
        width: 58, height: 148, borderRadius: 16,
        borderWidth: 1.5, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4,
    },
    addAccountText: { fontSize: 10, fontWeight: '600', textAlign: 'center' },

    widgetCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 16 },
    widgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    widgetTitleRow: { flexDirection: 'row', alignItems: 'center' },
    goalItem: { gap: 6 },
    goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    goalName: { fontSize: 13, fontWeight: '700', flex: 1, marginRight: 8 },
    goalPct: { fontSize: 12, fontWeight: '600' },
    progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 4 },
    goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    goalCurrent: { fontSize: 12, fontWeight: '700' },
    goalTarget: { fontSize: 12 },

    emptyState: { alignItems: 'center', paddingVertical: 12, gap: 6 },
    emptyText: { fontSize: 13 },
    emptyAction: { fontSize: 12, fontWeight: '600' },

    transactionsList: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },
    transactionItem: { flexDirection: 'row', alignItems: 'center', padding: 14 },
    txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    txInfo: { flex: 1 },
    txDescription: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    txCategory: { fontSize: 11 },
    txAmount: { fontWeight: '700', fontSize: 14 },

    // Modal de notificações (absolute positioning — evita bug Android)
    notifOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        zIndex: 100,
    },
    notifPanel: {
        position: 'absolute',
        left: 20,
        right: 20,
        zIndex: 101,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 14,
    },
    notifHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: 14, borderBottomWidth: 1,
    },
    notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    notifTitle: { fontSize: 15, fontWeight: '700' },
    notifCountBadge: {
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 10, minWidth: 20, alignItems: 'center',
    },
    notifCountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    alertItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
    alertMsg: { fontSize: 13, lineHeight: 20, flex: 1 },
});
