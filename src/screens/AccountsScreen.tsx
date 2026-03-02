/**
 * 💳 FINANÇAS PRO GOLD - ACCOUNTS SCREEN
 * Cards equalizados: crédito mostra DISPONÍVEL; outros mostram Entradas/Saídas do mês
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Plus,
    Wallet,
    Building2,
    ArrowUpRight,
    Bitcoin,
    CreditCard,
    MoreVertical,
    Edit2,
    Trash2,
    Eye,
    EyeOff,
    Sun,
    Moon,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react-native';
import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import { formatCurrency, getMonthRange } from '../utils/currencyUtils';
import AccountModal from '../components/AccountModal';
import { Conta } from '../types';

const { width } = Dimensions.get('window');
const CARD_W = (width - 52) / 2;

const FILTER_OPTIONS = ['Todas', 'Corrente', 'Investimento', 'Cartão', 'Cripto'];

const TYPE_LABELS: Record<string, string> = {
    Corrente: 'Conta Corrente',
    Poupanca: 'Poupança',
    Investimento: 'Investimento',
    Credito: 'Cartão de Crédito',
    Cripto: 'Cripto',
};

// ─── Icon helpers (exported → Dashboard reuse) ─────────────────────────────
export function accountIcon(tipo: string, color: string, size = 20) {
    switch (tipo) {
        case 'Investimento': return <ArrowUpRight size={size} color={color} />;
        case 'Cripto': return <Bitcoin size={size} color={color} />;
        case 'Credito': return <CreditCard size={size} color={color} />;
        case 'Poupanca': return <Wallet size={size} color={color} />;
        default: return <Building2 size={size} color={color} />;
    }
}

export function accountIconColor(tipo: string, c: ReturnType<typeof getColors>) {
    switch (tipo) {
        case 'Corrente': case 'Poupanca': return c.teal;
        case 'Investimento': return c.text;
        case 'Credito': return c.error;
        case 'Cripto': return c.gold;
        default: return c.gold;
    }
}

export function accountIconBg(tipo: string, c: ReturnType<typeof getColors>) {
    switch (tipo) {
        case 'Corrente': case 'Poupanca': return c.teal + '20';
        case 'Investimento': return c.text + '15';
        case 'Credito': return c.error + '20';
        case 'Cripto': return c.gold + '20';
        default: return c.gold + '20';
    }
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function AccountsScreen() {
    const insets = useSafeAreaInsets();
    const {
        accounts,
        transactions,
        refreshing,
        refreshData,
        isDarkMode,
        toggleDarkMode,
        hideValues,
        toggleHideValues,
    } = useFinance();

    const c = getColors(isDarkMode);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Conta | null>(null);
    const [filter, setFilter] = useState('Todas');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleAdd = () => { setSelectedAccount(null); setModalVisible(true); setOpenMenuId(null); };
    const handleEdit = (acc: Conta) => { setSelectedAccount(acc); setModalVisible(true); setOpenMenuId(null); };
    const handleDelete = (acc: Conta) => {
        setOpenMenuId(null);
        Alert.alert('Excluir Conta', `Tem certeza que deseja excluir "${acc.nome}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: () => { } },
        ]);
    };

    const maskVal = (val: string) => (hideValues ? '••••••' : val);

    // ─── Entradas/Saídas do mês selecionado por conta ─────────────────────
    const { start, end } = useMemo(() => {
        const key = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
        const { firstDay, lastDay } = getMonthRange(key);
        return { start: firstDay, end: lastDay };
    }, [selectedDate]);

    const accountStats = useMemo(() => {
        const map: Record<string, { entradas: number; saidas: number }> = {};
        for (const tx of transactions) {
            const d = tx.data_transacao;
            if (d < start || d > end) continue;
            if (!map[tx.conta_id]) map[tx.conta_id] = { entradas: 0, saidas: 0 };
            if (tx.tipo === 'receita') map[tx.conta_id].entradas += tx.valor;
            else map[tx.conta_id].saidas += tx.valor;
        }
        return map;
    }, [transactions, start, end]);

    // ─── Totais por tipo ───────────────────────────────────────────────────
    const correntes = accounts.filter(a => a.tipo === 'Corrente' || a.tipo === 'Poupanca');
    const invest = accounts.filter(a => a.tipo === 'Investimento');
    const cripto = accounts.filter(a => a.tipo === 'Cripto');
    const cartoes = accounts.filter(a => a.tipo === 'Credito');

    const totalPatrimonio = accounts.reduce((s, a) => s + a.saldo, 0);
    const totalCorrente = correntes.reduce((s, a) => s + a.saldo, 0);
    const totalInvest = invest.reduce((s, a) => s + a.saldo, 0);
    const totalCripto = cripto.reduce((s, a) => s + a.saldo, 0);
    const totalFaturas = cartoes.reduce((s, a) => s + (a.fatura_atual || 0), 0);

    // ─── Filtro ────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        if (filter === 'Todas') return accounts;
        if (filter === 'Corrente') return accounts.filter(a => a.tipo === 'Corrente' || a.tipo === 'Poupanca');
        if (filter === 'Investimento') return accounts.filter(a => a.tipo === 'Investimento');
        if (filter === 'Cartão') return accounts.filter(a => a.tipo === 'Credito');
        if (filter === 'Cripto') return accounts.filter(a => a.tipo === 'Cripto');
        return accounts;
    }, [accounts, filter]);

    const handlePrevMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const monthLabel = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={c.gold} />}
                showsVerticalScrollIndicator={false}
            >
                {/* ══ HEADER ══ */}
                <View style={[styles.header, { marginBottom: 10 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: c.text }]}>Minhas Contas</Text>
                        <Text style={[styles.subtitle, { color: c.textSubtle }]}>
                            Gerencie todas as suas contas em um só lugar
                        </Text>
                    </View>
                    <View style={styles.headerBtns}>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
                            onPress={toggleHideValues}
                        >
                            {hideValues ? <EyeOff size={17} color={c.textSubtle} /> : <Eye size={17} color={c.textSubtle} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: c.card, borderColor: c.border }]}
                            onPress={toggleDarkMode}
                        >
                            {isDarkMode ? <Sun size={17} color={c.gold} /> : <Moon size={17} color={c.textSubtle} />}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addBtn, { backgroundColor: c.gold, shadowColor: c.gold }]}
                            onPress={handleAdd}
                        >
                            <Plus size={18} color="#000" />
                            <Text style={styles.addBtnText}>Nova</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ══ MONTH SELECTOR ══ */}
                <View style={styles.monthSelector}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.monthBtn}>
                        <ChevronLeft size={20} color={c.textSubtle} />
                    </TouchableOpacity>
                    <Text style={[styles.monthLabel, { color: c.text }]}>
                        {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
                    </Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.monthBtn}>
                        <ChevronRight size={20} color={c.textSubtle} />
                    </TouchableOpacity>
                </View>

                {/* ══ 5 SUMMARY CARDS ══ */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryScroll}>
                    {[
                        { label: 'PATRIMÔNIO', value: totalPatrimonio, hint: 'vs mês passado', color: c.gold, borderC: c.gold + '40', icon: <Wallet size={15} color={c.gold} /> },
                        { label: 'CORRENTES', value: totalCorrente, hint: `${correntes.length} conta(s)`, color: c.teal, borderC: c.border, icon: <Building2 size={15} color={c.teal} /> },
                        { label: 'INVESTIMENTOS', value: totalInvest, hint: `${invest.length} conta(s)`, color: c.text, borderC: c.border, icon: <ArrowUpRight size={15} color={c.text} /> },
                        { label: 'CRIPTO', value: totalCripto, hint: `${cripto.length} carteira(s)`, color: c.gold, borderC: c.border, icon: <Bitcoin size={15} color={c.gold} /> },
                        { label: 'FATURAS', value: totalFaturas, hint: `${cartoes.length} cartão(ões)`, color: c.error, borderC: c.border, icon: <CreditCard size={15} color={c.error} /> },
                    ].map(card => (
                        <View key={card.label} style={[styles.summCard, { backgroundColor: c.card, borderColor: card.borderC }]}>
                            <View style={styles.summCardTop}>
                                <Text style={[styles.summLabel, { color: c.textSubtle }]}>{card.label}</Text>
                                {card.icon}
                            </View>
                            <Text style={[styles.summValue, { color: card.color }]} numberOfLines={1} adjustsFontSizeToFit>
                                {maskVal(formatCurrency(card.value))}
                            </Text>
                            <Text style={[styles.summHint, { color: c.textMuted }]}>{card.hint}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* ══ FILTER TABS ══ */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTER_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            style={[
                                styles.filterChip,
                                { borderColor: c.border, backgroundColor: c.card },
                                filter === opt && { backgroundColor: c.gold, borderColor: c.gold },
                            ]}
                            onPress={() => setFilter(opt)}
                        >
                            <Text style={[styles.filterText, { color: filter === opt ? '#000' : c.textSubtle }]}>
                                {opt}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ══ ACCOUNT CARDS ══ */}
                {filtered.length === 0 ? (
                    <View style={[styles.emptyBox, { borderColor: c.border }]}>
                        <Wallet size={36} color={c.textMuted} />
                        <Text style={[styles.emptyText, { color: c.textSubtle }]}>Nenhuma conta nesta categoria</Text>
                        <TouchableOpacity onPress={handleAdd}>
                            <Text style={[styles.emptyAction, { color: c.gold }]}>Adicionar conta →</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    chunk(filtered, 2).map((pair, rowIdx) => (
                        <View key={rowIdx} style={styles.cardRow}>
                            {pair.map(acc => {
                                const iconColor = accountIconColor(acc.tipo, c);
                                const iconBg = accountIconBg(acc.tipo, c);
                                const isOpen = openMenuId === acc.id;
                                const isCredit = acc.tipo === 'Credito';
                                const stats = accountStats[acc.id] || { entradas: 0, saidas: 0 };
                                const available = (acc.limite_credito || 0) - (acc.fatura_atual || 0);

                                return (
                                    <View
                                        key={acc.id}
                                        style={[styles.accCard, { backgroundColor: c.card, borderColor: c.border, width: CARD_W }]}
                                    >
                                        {/* Header */}
                                        <View style={styles.accCardHeader}>
                                            <View style={[styles.accIcon, { backgroundColor: iconBg }]}>
                                                {accountIcon(acc.tipo, iconColor, 18)}
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={[styles.accName, { color: c.text }]} numberOfLines={1}>{acc.nome}</Text>
                                                <Text style={[styles.accType, { color: c.textSubtle }]} numberOfLines={1}>
                                                    {acc.nome_banco ? `${acc.nome_banco} · ` : ''}{TYPE_LABELS[acc.tipo] || acc.tipo}
                                                </Text>
                                            </View>
                                            <TouchableOpacity style={styles.menuBtn} onPress={() => setOpenMenuId(isOpen ? null : acc.id)}>
                                                <MoreVertical size={16} color={c.textSubtle} />
                                            </TouchableOpacity>
                                        </View>

                                        {/* Dropdown */}
                                        {isOpen && (
                                            <View style={[styles.dropdown, { backgroundColor: c.card, borderColor: c.border }]}>
                                                <TouchableOpacity style={styles.dropItem} onPress={() => handleEdit(acc)}>
                                                    <Edit2 size={13} color={c.text} />
                                                    <Text style={[styles.dropText, { color: c.text }]}>Editar</Text>
                                                </TouchableOpacity>
                                                <View style={[styles.dropDiv, { backgroundColor: c.divider }]} />
                                                <TouchableOpacity style={styles.dropItem} onPress={() => handleDelete(acc)}>
                                                    <Trash2 size={13} color={c.error} />
                                                    <Text style={[styles.dropText, { color: c.error }]}>Excluir</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}

                                        {/* ── MAIN VALUE ── */}
                                        <View style={styles.balanceSection}>
                                            <Text style={[styles.balanceLbl, { color: c.textSubtle }]}>
                                                {isCredit ? 'DISPONÍVEL' : 'SALDO'}
                                            </Text>
                                            <Text
                                                style={[styles.balanceVal, {
                                                    color: isCredit
                                                        ? (available >= 0 ? c.teal : c.error)
                                                        : (acc.saldo >= 0 ? c.teal : c.error),
                                                }]}
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                            >
                                                {maskVal(formatCurrency(isCredit ? available : acc.saldo))}
                                            </Text>
                                        </View>

                                        {/* ── EXTRA ROWS (equalized height) ── */}
                                        <View style={[styles.extraSection, { borderTopColor: c.divider }]}>
                                            {isCredit ? (
                                                // Cartão: Limite + Fatura
                                                <>
                                                    <View style={styles.extraRow}>
                                                        <Text style={[styles.extraLbl, { color: c.textSubtle }]}>Limite Total</Text>
                                                        <Text style={[styles.extraVal, { color: c.text }]}>
                                                            {maskVal(formatCurrency(acc.limite_credito || 0))}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.extraRow}>
                                                        <Text style={[styles.extraLbl, { color: c.textSubtle }]}>Fatura Atual</Text>
                                                        <Text style={[styles.extraVal, { color: c.error }]}>
                                                            {maskVal(formatCurrency(acc.fatura_atual || 0))}
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                // Corrente/Investimento/Cripto: Entradas + Saídas do mês
                                                <>
                                                    <View style={styles.extraRow}>
                                                        <Text style={[styles.extraLbl, { color: c.textSubtle }]}>↑ Entradas</Text>
                                                        <Text style={[styles.extraVal, { color: c.teal }]}>
                                                            {maskVal(formatCurrency(stats.entradas))}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.extraRow}>
                                                        <Text style={[styles.extraLbl, { color: c.textSubtle }]}>↓ Saídas</Text>
                                                        <Text style={[styles.extraVal, { color: c.error }]}>
                                                            {maskVal(formatCurrency(stats.saidas))}
                                                        </Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Filler if odd count */}
                            {pair.length === 1 && <View style={{ width: CARD_W }} />}
                        </View>
                    ))
                )}

                <View style={{ height: 120 }} />
            </ScrollView>

            <AccountModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                accountToEdit={selectedAccount}
            />
        </View>
    );
}

function chunk<T>(arr: T[], n: number): T[][] {
    return arr.reduce<T[][]>((acc, _, i) => {
        if (i % n === 0) acc.push(arr.slice(i, i + n));
        return acc;
    }, []);
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20 },

    header: {
        flexDirection: 'row', alignItems: 'flex-start',
        marginTop: 16, marginBottom: 20, gap: 10,
    },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 12, marginTop: 3 },

    headerBtns: { flexDirection: 'row', gap: 8, alignItems: 'center', flexShrink: 0 },
    iconBtn: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, justifyContent: 'center', alignItems: 'center',
    },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10,
        shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25,
        shadowRadius: 6, elevation: 4,
    },
    addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },

    monthSelector: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, gap: 15,
    },
    monthBtn: { padding: 5 },
    monthLabel: { fontSize: 13, fontWeight: '700', textTransform: 'capitalize', minWidth: 120, textAlign: 'center' },

    summaryScroll: { paddingRight: 20, paddingBottom: 20 },
    summCard: {
        width: 140, borderRadius: 14, padding: 13,
        marginRight: 12, borderWidth: 1, minHeight: 95, justifyContent: 'space-between',
    },
    summCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    summLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
    summValue: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
    summHint: { fontSize: 10 },

    filterScroll: { paddingRight: 20, paddingBottom: 16 },
    filterChip: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, borderWidth: 1, marginRight: 8,
    },
    filterText: { fontSize: 12, fontWeight: '700' },

    cardRow: {
        flexDirection: 'row', gap: 12, marginBottom: 12,
        alignItems: 'flex-start',
    },
    accCard: {
        borderRadius: 16, padding: 14, borderWidth: 1,
    },
    accCardHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    accIcon: {
        width: 34, height: 34, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0,
    },
    accName: { fontSize: 13, fontWeight: '700' },
    accType: { fontSize: 10, marginTop: 1 },
    menuBtn: { padding: 3, flexShrink: 0 },

    dropdown: {
        position: 'absolute', top: 46, right: 8,
        borderRadius: 10, borderWidth: 1, zIndex: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
    },
    dropItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
    dropText: { fontSize: 13, fontWeight: '600' },
    dropDiv: { height: 1 },

    // Main value
    balanceSection: { marginTop: 2 },
    balanceLbl: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
    balanceVal: { fontSize: 15, fontWeight: '800' },

    // Equal-height extra rows
    extraSection: {
        marginTop: 10, paddingTop: 10, borderTopWidth: 1, gap: 6,
    },
    extraRow: { flexDirection: 'row', justifyContent: 'space-between' },
    extraLbl: { fontSize: 9 },
    extraVal: { fontSize: 9, fontWeight: '700' },

    emptyBox: {
        borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed',
        alignItems: 'center', paddingVertical: 40, gap: 10,
    },
    emptyText: { fontSize: 13 },
    emptyAction: { fontSize: 13, fontWeight: '700' },
});
