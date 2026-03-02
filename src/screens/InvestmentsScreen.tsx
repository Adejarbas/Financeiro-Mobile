/**
 * 📈 FINANÇAS PRO GOLD - INVESTMENTS SCREEN
 * Gestão de portfólio com abas, nova interface e calculadora de juros.
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    Alert,
    ScrollView,
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    TrendingUp,
    Plus,
    DollarSign,
    Target,
    ArrowUpRight,
    ArrowDownLeft,
    Building2,
    Bitcoin,
    Lock,
    PieChart as PieIcon,
    RefreshCw,
    HelpCircle,
    Info,
    LineChart,
    Edit2,
    Trash2,
    Sun,
    Moon,
    Eye,
    EyeOff
} from 'lucide-react-native';
import { VictoryPie } from 'victory-native';

import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import { formatCurrency } from '../utils/currencyUtils';
import { Investimento, TipoInvestimento } from '../types';
import InvestmentModal from '../components/InvestmentModal';

const TABS: { id: TipoInvestimento; label: string; icon: any }[] = [
    { id: 'stocks', label: 'Ações', icon: TrendingUp },
    { id: 'fiis', label: 'FIIs', icon: Building2 },
    { id: 'crypto', label: 'Cripto', icon: Bitcoin },
    { id: 'bonds', label: 'Renda Fixa', icon: Lock },
];

export default function InvestmentsScreen() {
    const insets = useSafeAreaInsets();
    const { investments, loading, refreshing, refreshData, deleteInvestment, isDarkMode, toggleDarkMode, syncPrices, hideValues, toggleHideValues } = useFinance();
    const theme = getColors(isDarkMode);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investimento | null>(null);
    const [activeTab, setActiveTab] = useState<TipoInvestimento>('stocks');
    const [isSyncing, setIsSyncing] = useState(false);

    // Calculadora States
    const [calcInitial, setCalcInitial] = useState('1000');
    const [calcMonthly, setCalcMonthly] = useState('500');
    const [calcRate, setCalcRate] = useState('10');
    const [calcPeriod, setCalcPeriod] = useState('10');
    const [calcRateType, setCalcRateType] = useState<'yearly' | 'monthly'>('yearly');
    const [calcPeriodType, setCalcPeriodType] = useState<'years' | 'months'>('years');

    // Módulos Filtrados
    const filteredInvestments = useMemo(() => investments.filter(i => i.tipo === activeTab), [investments, activeTab]);

    // Resumo Global
    const { totalInvestido, totalAtual, lucroTotal, percentualTotal } = useMemo(() => {
        let investido = 0;
        let atual = 0;
        investments.forEach(inv => {
            const precoMedio = inv.preco_medio;
            const valAplic = inv.tipo === 'bonds' && inv.valor_aplicado ? inv.valor_aplicado : (precoMedio * inv.quantidade);
            const posAtual = inv.tipo === 'bonds' && inv.valor_aplicado ? inv.valor_aplicado : ((inv.preco_atual || precoMedio) * inv.quantidade);
            investido += valAplic;
            atual += posAtual;
        });
        const lucro = atual - investido;
        const perc = investido > 0 ? (lucro / investido) * 100 : 0;
        return { totalInvestido: investido, totalAtual: atual, lucroTotal: lucro, percentualTotal: perc };
    }, [investments]);

    // Calcular Juros Compostos
    const { calcTotalInvested, calcTotalInterest, calcTotalFinal } = useMemo(() => {
        const init = parseFloat(calcInitial.replace(',', '.')) || 0;
        const pmt = parseFloat(calcMonthly.replace(',', '.')) || 0;
        const rate = parseFloat(calcRate.replace(',', '.')) || 0;
        const period = parseInt(calcPeriod) || 0;

        const rateDecimal = rate / 100;
        const rMonthly = calcRateType === 'yearly' ? Math.pow(1 + rateDecimal, 1 / 12) - 1 : rateDecimal;
        const nMonths = calcPeriodType === 'years' ? period * 12 : period;

        let finalCapital = init * Math.pow(1 + rMonthly, nMonths);
        let futureValuePMT = 0;
        if (rMonthly > 0) {
            futureValuePMT = pmt * ((Math.pow(1 + rMonthly, nMonths) - 1) / rMonthly);
        } else {
            futureValuePMT = pmt * nMonths;
        }

        const totalF = finalCapital + futureValuePMT;
        const totalI = init + (pmt * nMonths);
        const totalInt = totalF - totalI;

        return { calcTotalInvested: totalI, calcTotalInterest: totalInt, calcTotalFinal: totalF };
    }, [calcInitial, calcMonthly, calcRate, calcPeriod, calcRateType, calcPeriodType]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncPrices();
            Alert.alert('Sincronização', 'Cotações de criptomoedas atualizadas com sucesso!');
        } catch (error) {
            Alert.alert('Erro', 'Houve um problema ao sincronizar os preços.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEdit = (inv: Investimento) => {
        setSelectedInvestment(inv);
        setModalVisible(true);
    };

    const handleDelete = (inv: Investimento) => {
        Alert.alert(
            'Excluir Ativo',
            `Deseja excluir ${inv.simbolo} do portfólio?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await deleteInvestment(inv.id);
                        if (error) Alert.alert('Erro', 'Não foi possível excluir.');
                    }
                }
            ]
        );
    };

    const renderTableRow = (item: Investimento) => {
        const precoMedio = item.preco_medio || 0;
        const precoAtual = item.preco_atual || precoMedio;

        let valAplic = 0;
        let posAtual = 0;

        if (item.tipo === 'bonds') {
            valAplic = item.valor_aplicado || precoMedio;
            posAtual = valAplic;
        } else {
            valAplic = precoMedio * item.quantidade;
            posAtual = precoAtual * item.quantidade;
        }

        const profit = posAtual - valAplic;
        const profitPercentage = valAplic > 0 ? (profit / valAplic) * 100 : 0;

        const alloc = calcTotalFinal > 0 ? (posAtual / calcTotalFinal) * 100 : 0;

        const formatCrypto = (num: number) => {
            if (num < 1) return `R$ ${num.toFixed(4).replace('.', ',')}`;
            return formatCurrency(num);
        };
        const displayAtual = hideValues ? '••••••' : (item.tipo === 'crypto' ? formatCrypto(precoAtual) : formatCurrency(precoAtual));
        const displayMedio = hideValues ? '••••••' : (item.tipo === 'crypto' ? formatCrypto(precoMedio) : formatCurrency(precoMedio));
        const displayPosAtual = hideValues ? '••••••' : (item.tipo === 'crypto' ? formatCrypto(posAtual) : formatCurrency(posAtual));

        const dataAquisicao = item.data_compra ? new Date(item.data_compra).toLocaleDateString('pt-BR') : '-';
        const vencimento = item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR') : '-';

        return (
            <View key={item.id} style={styles.tableRow}>
                {/* 1. Ativo */}
                <View style={[styles.cell, { width: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}>
                    <View style={styles.iconMini}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.gold }}>{item.simbolo.substring(0, 2)}</Text>
                    </View>
                    <View>
                        <Text style={styles.cellSymbol}>{item.simbolo}</Text>
                        <Text style={styles.cellName} numberOfLines={1}>{item.nome}</Text>
                    </View>
                </View>
                {/* 2. Data */}
                <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{dataAquisicao}</Text></View>

                {item.tipo !== 'bonds' ? (
                    <>
                        <View style={[styles.cell, { width: 70 }]}><Text style={styles.cellText}>{item.tipo === 'crypto' ? item.quantidade.toFixed(4) : item.quantidade}</Text></View>
                        <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{displayMedio}</Text></View>
                        <View style={[styles.cell, { width: 110 }]}><Text style={styles.cellText}>{displayAtual}</Text></View>
                        <View style={[styles.cell, { width: 100 }]}>
                            {item.tipo === 'crypto' && item.variacao_24h !== undefined ? (
                                <Text style={[styles.cellText, { color: item.variacao_24h >= 0 ? theme.teal : theme.error, fontWeight: 'bold' }]}>
                                    {item.variacao_24h >= 0 ? '+' : ''}{item.variacao_24h.toFixed(2)}%
                                </Text>
                            ) : (
                                <Text style={[styles.cellText, { color: theme.textSubtle }]}>-</Text>
                            )}
                        </View>
                        <View style={[styles.cell, { width: 110 }]}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{displayPosAtual}</Text></View>
                    </>
                ) : (
                    <>
                        <View style={[styles.cell, { width: 110 }]}><Text style={styles.cellText}>{hideValues ? '••••••' : formatCurrency(valAplic)}</Text></View>
                        <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{item.taxa_contratada || '-'}</Text></View>
                        <View style={[styles.cell, { width: 100 }]}><Text style={styles.cellText}>{vencimento}</Text></View>
                        <View style={[styles.cell, { width: 110 }]}><Text style={[styles.cellText, { fontWeight: 'bold' }]}>{displayPosAtual}</Text></View>
                    </>
                )}

                {/* Algumas comuns */}
                <View style={[styles.cell, { width: 110 }]}>
                    {item.tipo !== 'bonds' ? (
                        <Text style={[styles.cellText, { color: profit >= 0 ? theme.teal : theme.error, fontWeight: 'bold' }]}>
                            {hideValues ? '••••••' : `${profit >= 0 ? '+' : ''}${profitPercentage.toFixed(2)}%`}
                        </Text>
                    ) : (
                        <Text style={[styles.cellText, { color: theme.teal, fontWeight: 'bold' }]}>Pela Taxa</Text>
                    )}
                </View>
                <View style={[styles.cell, { width: 90 }]}><Text style={styles.cellText}>{alloc.toFixed(2)}%</Text></View>

                {/* Ações */}
                <View style={[styles.cell, { width: 100, flexDirection: 'row', gap: 12 }]}>
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                        <Edit2 size={16} color={theme.textSubtle} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                        <Trash2 size={16} color={theme.error} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderTableHeader = () => {
        const isBonds = activeTab === 'bonds';
        const isCrypto = activeTab === 'crypto';

        return (
            <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 140 }]}>Ativo</Text>
                <Text style={[styles.th, { width: 100 }]}>{isBonds ? 'Data Aplicação' : 'Data Aquisição'}</Text>

                {!isBonds ? (
                    <>
                        <Text style={[styles.th, { width: 70 }]}>Qtd.</Text>
                        <Text style={[styles.th, { width: 100 }]}>Preço Médio</Text>
                        <Text style={[styles.th, { width: 110 }]}>{isCrypto ? 'Preço Atual' : 'Cotação Atual'}</Text>
                        <Text style={[styles.th, { width: 100 }]}>{isCrypto ? 'Variação 24h' : 'Variação'}</Text>
                        <Text style={[styles.th, { width: 110 }]}>Saldo</Text>
                    </>
                ) : (
                    <>
                        <Text style={[styles.th, { width: 110 }]}>Valor Aplicado</Text>
                        <Text style={[styles.th, { width: 100 }]}>Taxa Contratada</Text>
                        <Text style={[styles.th, { width: 100 }]}>Vencimento</Text>
                        <Text style={[styles.th, { width: 110 }]}>Valor Atual</Text>
                    </>
                )}

                <Text style={[styles.th, { width: 110 }]}>Rentabilidade ⓘ</Text>
                <Text style={[styles.th, { width: 90 }]}>Alocação (%)</Text>
                <Text style={[styles.th, { width: 100 }]}>Ações</Text>
            </View>
        );
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.title}>Investimentos</Text>
                    <TouchableOpacity
                        style={{ marginLeft: 8 }}
                        onPress={() => Alert.alert("Como funciona", "Bem-vindo ao módulo de Investimentos!\n\n• Adicione ativos usando 'Nova Op.'.\n• Criptos podem ser sincronizadas nos preços reais.\n• Ações e FIIs usam o preço médio X atual.\n• Renda fixa calcula com base na taxa.\n\nDica: Mantenha pressionado os botões para mais detalhes.")}
                    >
                        <HelpCircle size={20} color={theme.textSubtle} />
                    </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={toggleHideValues}
                    >
                        {hideValues ? <EyeOff size={20} color={theme.textMuted} /> : <Eye size={20} color={theme.textMuted} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={toggleDarkMode}
                    >
                        {isDarkMode ? <Sun size={20} color={theme.gold} /> : <Moon size={20} color={theme.textMuted} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={handleSync}
                        onLongPress={() => Alert.alert("Sincronizar", "Busca o valor mais recente das suas criptomoedas direto do mercado.")}
                        disabled={isSyncing}
                    >
                        <RefreshCw size={20} color={isSyncing ? theme.textMuted : theme.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => { setSelectedInvestment(null); setModalVisible(true); }}
                        onLongPress={() => Alert.alert("Nova Operação", "Cadastre novas compras ou registre a venda dos seus ativos.")}
                    >
                        <Plus size={20} color="#000" />
                        <Text style={{ color: '#000', fontWeight: 'bold', marginLeft: 4, fontSize: 13 }}>Nova Op.</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* SUMMARY CARDS */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
                    <Text style={styles.summaryLabel}>Total Investido</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }]}>{hideValues ? '••••••' : formatCurrency(totalInvestido)}</Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
                    <Text style={styles.summaryLabel}>Posição Atual</Text>
                    <Text style={[styles.summaryValue, { color: theme.teal }]}>{hideValues ? '••••••' : formatCurrency(totalAtual)}</Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: theme.card }]}>
                    <Text style={styles.summaryLabel}>Rentab. Total</Text>
                    <Text style={[styles.summaryValue, { color: lucroTotal >= 0 ? theme.teal : theme.error }]}>
                        {hideValues ? '••••••' : `${lucroTotal >= 0 ? '+' : ''}${formatCurrency(lucroTotal)}`}
                    </Text>
                    <Text style={{ fontSize: 12, color: lucroTotal >= 0 ? theme.teal : theme.error, marginTop: 4, fontWeight: 'bold' }}>
                        {lucroTotal >= 0 ? '+' : ''}{percentualTotal.toFixed(2)}%
                    </Text>
                </View>
            </ScrollView>

            {/* TAB SELECTOR */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.tabBtn, activeTab === tab.id && { backgroundColor: theme.gold, borderColor: theme.gold }]}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={16} color={activeTab === tab.id ? '#000' : theme.textSubtle} />
                            <Text style={[styles.tabText, activeTab === tab.id && { color: '#000', fontWeight: 'bold' }]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    const renderFooter = () => (
        <View style={styles.calculatorSection}>
            <Text style={styles.calcTitle}>Calculadora de Juros Compostos</Text>
            <Text style={styles.calcSubText}>Simule a evolução do seu patrimônio no longo prazo.</Text>

            <View style={[styles.calcForm, { backgroundColor: theme.cardHover }]}>
                {/* INSTRUCTIONAL AVISO */}
                <View style={{ flexDirection: 'row', backgroundColor: theme.background, padding: 10, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: theme.border, alignItems: 'center' }}>
                    <Info size={16} color={theme.gold} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 11, color: theme.textSubtle, flex: 1, lineHeight: 16 }}>
                        <Text style={{ fontWeight: 'bold', color: theme.text }}>Como funciona:</Text> Preencha o valor inicial que já tem investido, quanto vai depositar por mês, qual a taxa rendimento estimada e o tempo para ver a evolução.
                    </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.calcLabel}>Valor Inicial (R$)</Text>
                        <TextInput style={styles.calcInput} value={calcInitial} onChangeText={setCalcInitial} keyboardType="numeric" placeholder="1000" placeholderTextColor={theme.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.calcLabel}>Inv. Mensal (R$)</Text>
                        <TextInput style={styles.calcInput} value={calcMonthly} onChangeText={setCalcMonthly} keyboardType="numeric" placeholder="500" placeholderTextColor={theme.textMuted} />
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.calcLabel}>Taxa (%)</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <TextInput style={[styles.calcInput, { borderWidth: 0, flex: 1, marginBottom: 0 }]} value={calcRate} onChangeText={setCalcRate} keyboardType="numeric" placeholder="10" placeholderTextColor={theme.textMuted} />
                            <TouchableOpacity onPress={() => setCalcRateType(prev => prev === 'yearly' ? 'monthly' : 'yearly')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: theme.border }}>
                                <Text style={{ color: theme.gold, fontWeight: 'bold', fontSize: 12 }}>{calcRateType === 'yearly' ? 'a.a.' : 'a.m.'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.calcLabel}>Tempo</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}>
                            <TextInput style={[styles.calcInput, { borderWidth: 0, flex: 1, marginBottom: 0 }]} value={calcPeriod} onChangeText={setCalcPeriod} keyboardType="numeric" placeholder="10" placeholderTextColor={theme.textMuted} />
                            <TouchableOpacity onPress={() => setCalcPeriodType(prev => prev === 'years' ? 'months' : 'years')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderLeftWidth: 1, borderLeftColor: theme.border }}>
                                <Text style={{ color: theme.gold, fontWeight: 'bold', fontSize: 12 }}>{calcPeriodType === 'years' ? 'Anos' : 'Meses'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* GRAPH */}
                <View style={[styles.graphContainer, { flexDirection: 'column' }]}>
                    <VictoryPie
                        height={200}
                        padAngle={2}
                        innerRadius={65}
                        colorScale={[theme.teal, theme.gold]}
                        data={[
                            { x: " ", y: calcTotalInvested > 0 ? calcTotalInvested : 1 },
                            { x: "  ", y: calcTotalInterest > 0 ? calcTotalInterest : 1 }
                        ]}
                        style={{ labels: { display: "none" } }}
                    />
                    {/* Legend */}
                    <View style={{ flexDirection: 'row', gap: 20, justifyContent: 'center', width: '100%', paddingHorizontal: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: theme.teal, marginRight: 8 }} />
                            <View>
                                <Text style={[styles.calcLabel, { marginBottom: 0 }]}>Valor Investido</Text>
                                <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'bold' }}>
                                    {(calcTotalInvested / (calcTotalFinal || 1) * 100).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: theme.gold, marginRight: 8 }} />
                            <View>
                                <Text style={[styles.calcLabel, { marginBottom: 0 }]}>Juros Ganhos</Text>
                                <Text style={{ fontSize: 12, color: theme.text, fontWeight: 'bold' }}>
                                    {(calcTotalInterest / (calcTotalFinal || 1) * 100).toFixed(1)}%
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Final Cards */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                    <View style={styles.calcResBox}>
                        <Text style={styles.calcResLabel}>Total Investido</Text>
                        <Text style={[styles.calcResVal, { color: theme.teal }]}>{formatCurrency(calcTotalInvested)}</Text>
                    </View>
                    <View style={styles.calcResBox}>
                        <Text style={styles.calcResLabel}>Juros Acum.</Text>
                        <Text style={[styles.calcResVal, { color: theme.gold }]}>{formatCurrency(calcTotalInterest)}</Text>
                    </View>
                </View>
                <View style={[styles.calcResBox, { marginTop: 10, alignItems: 'center', backgroundColor: theme.background }]}>
                    <Text style={styles.calcResLabel}>Total Final Acumulado</Text>
                    <Text style={[styles.calcResVal, { fontSize: 24, color: theme.text, marginTop: 4 }]}>{formatCurrency(calcTotalFinal)}</Text>
                </View>
            </View>
        </View>
    );

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 10 },
        title: { fontSize: 24, fontWeight: 'bold', color: theme.text },
        actionBtnOutline: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card },
        addButton: { height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: theme.gold, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },

        summaryBox: { width: 155, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
        summaryLabel: { color: theme.textSubtle, fontSize: 13, fontWeight: 'bold', marginBottom: 8 },
        summaryValue: { fontSize: 18, fontWeight: '900' },

        tabBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
        tabText: { color: theme.textSubtle, marginLeft: 8, fontWeight: '500' },

        listContent: { paddingBottom: 40 },

        tableContainer: { marginHorizontal: 20, marginBottom: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', backgroundColor: theme.card },
        tableHeader: { flexDirection: 'row', backgroundColor: theme.border, paddingVertical: 12, paddingHorizontal: 16 },
        th: { fontSize: 11, fontWeight: 'bold', color: theme.textSubtle, textTransform: 'uppercase' },
        tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
        cell: { justifyContent: 'center' },
        cellText: { fontSize: 13, color: theme.text },
        iconMini: { width: 32, height: 32, borderRadius: 8, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: theme.border },
        cellSymbol: { fontSize: 13, fontWeight: 'bold', color: theme.text },
        cellName: { fontSize: 10, color: theme.textSubtle, maxWidth: 80 },
        actionBtn: { padding: 8, borderRadius: 8, backgroundColor: theme.background },
        emptyState: { alignItems: 'center', paddingVertical: 60 },
        emptyText: { color: theme.text, fontSize: 16, fontWeight: 'bold', marginTop: 16 },

        calculatorSection: { padding: 20, borderTopWidth: 1, borderTopColor: theme.border, marginTop: 10 },
        calcTitle: { color: theme.text, fontSize: 18, fontWeight: '900', marginBottom: 4 },
        calcSubText: { color: theme.textSubtle, fontSize: 13, marginBottom: 16 },
        calcForm: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.border },
        calcLabel: { color: theme.textSubtle, fontSize: 12, fontWeight: 'bold', marginBottom: 6 },
        calcInput: { backgroundColor: theme.background, color: theme.text, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.border, fontSize: 15, fontWeight: 'bold' },
        graphContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
        calcResBox: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
        calcResLabel: { color: theme.textSubtle, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
        calcResVal: { fontSize: 16, fontWeight: '900', marginTop: 4 }
    });

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshData} tintColor={theme.gold} />}
            >
                {renderHeader()}

                {filteredInvestments.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 20 }}>
                        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', backgroundColor: theme.card, marginBottom: 16 }}>
                            {renderTableHeader()}
                            {filteredInvestments.map(item => renderTableRow(item))}
                        </View>
                    </ScrollView>
                ) : (
                    <View style={styles.emptyState}>
                        <PieIcon size={48} color={theme.textSubtle} />
                        <Text style={styles.emptyText}>Nenhum ativo nesta categoria.</Text>
                    </View>
                )}

                {renderFooter()}
            </ScrollView>

            <InvestmentModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                investmentToEdit={selectedInvestment}
            />
        </View>
    );
}
