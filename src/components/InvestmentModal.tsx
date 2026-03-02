/**
 * 📊 FINANÇAS PRO GOLD - INVESTMENT MODAL
 * Modal para adicionar/editar investimentos com suporte a Compra/Venda, Renda Fixa e Integração de Contas.
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Switch
} from 'react-native';
import {
    X,
    TrendingUp,
    TrendingDown,
    Globe,
    Bitcoin,
    Building2,
    Lock,
    AlertTriangle,
    Check
} from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import { Investimento, TipoInvestimento } from '../types';
import { searchAsset } from '../utils/investmentApi';

interface InvestmentModalProps {
    visible: boolean;
    onClose: () => void;
    investmentToEdit?: Investimento | null;
}

const INVESTMENT_TYPES: { label: string; value: TipoInvestimento; icon: any }[] = [
    { label: 'Ações', value: 'stocks', icon: TrendingUp },
    { label: 'FIIs', value: 'fiis', icon: Building2 },
    { label: 'Cripto', value: 'crypto', icon: Bitcoin },
    { label: 'Renda Fixa', value: 'bonds', icon: Lock },
];

export default function InvestmentModal({ visible, onClose, investmentToEdit }: InvestmentModalProps) {
    const { addInvestment, updateInvestment, deleteInvestment, investments, accounts, addTransaction, categories, isDarkMode } = useFinance();
    const theme = getColors(isDarkMode);
    const [loading, setLoading] = useState(false);

    // Modes
    const [operationType, setOperationType] = useState<'buy' | 'sell'>('buy');

    // Common States
    const [type, setType] = useState<TipoInvestimento>('stocks');
    const [dateString, setDateString] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

    // Others mode States
    const [symbol, setSymbol] = useState('');
    const [name, setName] = useState('');
    const [inputMode, setInputMode] = useState<'quantity' | 'value'>('quantity');
    const [quantity, setQuantity] = useState('');
    const [totalValueInput, setTotalValueInput] = useState('');
    const [price, setPrice] = useState(''); // Compra ou Venda (unitário)
    const [currentPrice, setCurrentPrice] = useState(''); // Cotação atual no Edit

    // Bonds mode States
    const [bondsName, setBondsName] = useState('');
    const [bondsRate, setBondsRate] = useState('');
    const [bondsDueDate, setBondsDueDate] = useState('');
    const [bondsAppliedValue, setBondsAppliedValue] = useState('');
    const [showBondsWarning, setShowBondsWarning] = useState(true);

    // Account Integration
    const [useAccountBalance, setUseAccountBalance] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');

    // Dropdown States
    const [isAccountSelectOpen, setIsAccountSelectOpen] = useState(false);
    const [isAssetSelectOpen, setIsAssetSelectOpen] = useState(false);

    // Auto-select when operation changes
    useEffect(() => {
        setIsAssetSelectOpen(operationType === 'sell');
    }, [operationType]);

    useEffect(() => {
        if (visible) {
            if (investmentToEdit) {
                setOperationType('buy'); // Edit acts primarily on 'buy' info
                setType(investmentToEdit.tipo);
                setDateString(investmentToEdit.data_compra);

                if (investmentToEdit.tipo === 'bonds') {
                    // Retirar a taxa do nome se formos editar, no web salvamos "Nome (Taxa)", aqui tentamos separar
                    setBondsName(investmentToEdit.nome.split(' (')[0] || investmentToEdit.nome);
                    setBondsRate(investmentToEdit.taxa_contratada || '');
                    setBondsDueDate(investmentToEdit.data_vencimento || '');
                    setBondsAppliedValue((investmentToEdit.valor_aplicado || investmentToEdit.preco_medio).toString());
                } else {
                    setSymbol(investmentToEdit.simbolo);
                    setName(investmentToEdit.nome);
                    setQuantity(investmentToEdit.quantidade.toString());
                    setPrice(investmentToEdit.preco_medio.toString());
                    setCurrentPrice(investmentToEdit.preco_atual?.toString() || investmentToEdit.preco_medio.toString());
                }
            } else {
                resetForm();
            }
        }
    }, [visible, investmentToEdit]);

    const resetForm = () => {
        setOperationType('buy');
        setType('stocks');
        setDateString(new Date().toISOString().split('T')[0]);
        setSymbol('');
        setName('');
        setInputMode('quantity');
        setTotalValueInput('');
        setQuantity('');
        setPrice('');
        setCurrentPrice('');
        setBondsName('');
        setBondsRate('');
        setBondsDueDate('');
        setBondsAppliedValue('');
        setUseAccountBalance(false);
        setSelectedAccountId('');
    };

    const handleSave = async () => {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(dateString)) {
            Alert.alert('Erro', 'Data inválida. Use o formato YYYY-MM-DD.');
            return;
        }

        if (useAccountBalance && !selectedAccountId) {
            Alert.alert('Erro', 'Por favor, selecione uma conta para debitar/creditar o valor.');
            return;
        }

        setLoading(true);

        const priceNum = type === 'bonds' ? parseFloat(bondsAppliedValue.replace(',', '.')) || 0 : parseFloat(price.replace(',', '.')) || 0;
        let qtyNum = 0;
        let totalValue = 0;

        if (type === 'bonds') {
            qtyNum = 1;
            totalValue = priceNum;
        } else {
            if (inputMode === 'value') {
                totalValue = parseFloat(totalValueInput.replace(',', '.')) || 0;
                qtyNum = priceNum > 0 ? (totalValue / priceNum) : 0;
            } else {
                qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
                totalValue = qtyNum * priceNum;
            }
        }

        const finalName = type === 'bonds' && bondsRate ? `${bondsName} (${bondsRate})` : (name || symbol);
        const finalTicker = type === 'bonds' ? 'RENDA-FIXA' : symbol.toUpperCase();

        try {
            if (investmentToEdit) {
                // MODO EDIÇÃO
                const editCurrentPriceStr = type === 'bonds' ? bondsAppliedValue : currentPrice;
                const editCurrentPriceNum = editCurrentPriceStr ? parseFloat(editCurrentPriceStr.replace(',', '.')) : priceNum;

                const updateData: Partial<Investimento> = {
                    simbolo: finalTicker,
                    nome: finalName,
                    tipo: type,
                    quantidade: qtyNum,
                    preco_medio: priceNum,
                    preco_atual: editCurrentPriceNum,
                    data_compra: dateString,
                    valor_aplicado: type === 'bonds' ? priceNum : undefined,
                    taxa_contratada: type === 'bonds' ? bondsRate : undefined,
                    data_vencimento: type === 'bonds' ? bondsDueDate : undefined,
                };

                await updateInvestment(investmentToEdit.id, updateData);
                Alert.alert('Sucesso', 'Investimento atualizado!');

            } else {
                // MODO NOVO
                if (operationType === 'buy') {
                    // COMPRA
                    if (type === 'bonds') {
                        if (!bondsName || !bondsAppliedValue) {
                            Alert.alert('Erro', 'Nome do Título e Valor Aplicado são obrigatórios.');
                            setLoading(false); return;
                        }
                    } else {
                        if (!symbol || !price || (inputMode === 'quantity' ? !quantity : !totalValueInput)) {
                            Alert.alert('Erro', 'Símbolo, Preço e (Quantidade ou Valor Total) são obrigatórios.');
                            setLoading(false); return;
                        }
                    }

                    await addInvestment({
                        simbolo: finalTicker,
                        nome: finalName,
                        tipo: type,
                        quantidade: qtyNum,
                        preco_medio: priceNum,
                        preco_atual: priceNum, // Na compra, atual = médio
                        data_compra: dateString,
                        valor_aplicado: type === 'bonds' ? priceNum : undefined,
                        taxa_contratada: bondsRate || undefined,
                        data_vencimento: bondsDueDate || undefined,
                    });

                    // Tentar debitar da conta
                    if (useAccountBalance && selectedAccountId) {
                        const invCategory = categories.find(c => c.nome.toLowerCase().includes('investimento') && c.tipo === 'despesa')
                            || categories.find(c => c.tipo === 'despesa');

                        if (invCategory) {
                            await addTransaction({
                                descricao: `Investimento: ${finalName}`,
                                valor: totalValue,
                                tipo: 'despesa',
                                categoria_id: invCategory.id,
                                conta_id: selectedAccountId,
                                data_transacao: dateString,
                                status: 'Concluído'
                            });
                        }
                    }

                    Alert.alert('Sucesso', 'Operação de compra registrada!');

                } else {
                    // VENDA
                    if (!symbol || (inputMode === 'quantity' ? !quantity : !totalValueInput)) {
                        Alert.alert('Erro', 'Selecione o ativo e informe a quantidade ou valor.');
                        setLoading(false); return;
                    }

                    const existingInvestments = investments
                        .filter(inv => inv.simbolo.toUpperCase() === symbol.toUpperCase() && inv.tipo === type)
                        .sort((a, b) => new Date(a.data_compra).getTime() - new Date(b.data_compra).getTime());

                    if (existingInvestments.length === 0) {
                        Alert.alert('Erro', 'Você não possui este ativo na sua carteira.');
                        setLoading(false); return;
                    }

                    const totalQuantityAvailable = existingInvestments.reduce((sum, inv) => sum + inv.quantidade, 0);

                    if (totalQuantityAvailable < qtyNum && Math.abs(totalQuantityAvailable - qtyNum) > 0.000001) {
                        Alert.alert('Erro', `Saldo insuficiente. Você tem ${totalQuantityAvailable}.`);
                        setLoading(false); return;
                    }

                    let remainingQtyToSell = qtyNum;

                    for (const inv of existingInvestments) {
                        if (remainingQtyToSell <= 0) break;

                        if (inv.quantidade <= remainingQtyToSell + 0.000001) {
                            await deleteInvestment(inv.id);
                            remainingQtyToSell -= inv.quantidade;
                        } else {
                            const newQty = inv.quantidade - remainingQtyToSell;
                            await updateInvestment(inv.id, { quantidade: newQty });
                            remainingQtyToSell = 0;
                        }
                    }

                    const aggregatedName = existingInvestments[0].nome || symbol;

                    // Tentar creditar na conta
                    if (useAccountBalance && selectedAccountId) {
                        const resgateCategory = categories.find(c => (c.nome.toLowerCase().includes('resgate') || c.nome.toLowerCase().includes('invest')) && c.tipo === 'receita')
                            || categories.find(c => c.tipo === 'receita');

                        if (resgateCategory) {
                            await addTransaction({
                                descricao: `Resgate: ${aggregatedName}`,
                                valor: totalValue, // Venda = priceNum atual de venda * qty
                                tipo: 'receita',
                                categoria_id: resgateCategory.id,
                                conta_id: selectedAccountId,
                                data_transacao: dateString,
                                status: 'Concluído'
                            });
                        }
                    }

                    Alert.alert('Sucesso', 'Operação de venda/resgate registrada!');
                }
            }
            onClose();
        } catch (error) {
            Alert.alert('Erro', 'Ocorreu um erro ao salvar a operação.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Derived Variables 
    const priceNum = type === 'bonds' ? parseFloat(bondsAppliedValue.replace(',', '.')) || 0 : parseFloat(price.replace(',', '.')) || 0;

    let qtyNum = 0;
    let totalValueDisplay = 0;

    if (type === 'bonds') {
        qtyNum = 1;
        totalValueDisplay = priceNum;
    } else {
        if (inputMode === 'value') {
            totalValueDisplay = parseFloat(totalValueInput.replace(',', '.')) || 0;
            qtyNum = priceNum > 0 ? (totalValueDisplay / priceNum) : 0;
        } else {
            qtyNum = parseFloat(quantity.replace(',', '.')) || 0;
            totalValueDisplay = qtyNum * priceNum;
        }
    }

    const getSymbolPlaceholder = () => {
        switch (type) {
            case 'stocks': return 'Ex: PETR4';
            case 'fiis': return 'Ex: HGLG11';
            case 'crypto': return 'Ex: BTC, ETH';
            case 'bonds': return 'Ex: Tesouro Direto';
            default: return 'Ticker';
        }
    };

    const getNamePlaceholder = () => {
        switch (type) {
            case 'stocks': return 'Ex: Petrobras PN';
            case 'fiis': return 'Ex: CSHG Logística';
            case 'crypto': return 'Ex: Bitcoin';
            case 'bonds': return 'Ex: CDB Banco Inter';
            default: return 'Nome (Opcional)';
        }
    };

    const handleSymbolBlur = async () => {
        if (type === 'crypto' && symbol && operationType === 'buy') {
            setLoading(true);
            try {
                const result = await searchAsset(symbol, 'crypto');
                if (result) {
                    if (result.currentPrice) {
                        setPrice(result.currentPrice.toString());
                    }
                    if (result.name) {
                        setName(result.name);
                    }
                }
            } catch (error) {
                console.log('Erro ao buscar crypto', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const styles = StyleSheet.create({
        centeredView: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.overlay },
        modalView: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%', shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
        header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
        modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
        closeButton: { padding: 4 },
        operationTabs: { flexDirection: 'row', gap: 10, marginBottom: 20 },
        opTab: { flex: 1, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background },
        opTabBuyActive: { backgroundColor: theme.teal, borderColor: theme.teal },
        opTabSellActive: { backgroundColor: theme.error, borderColor: theme.error },
        opTabText: { color: theme.textSubtle, fontWeight: 'bold', marginLeft: 8 },
        opTabTextActive: { color: '#FFF' },
        accountBox: { backgroundColor: theme.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 20 },
        rowSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: useAccountBalance ? 12 : 0 },
        switchLabel: { color: theme.text, fontSize: 13, flex: 1, paddingRight: 10 },
        label: { color: theme.textSubtle, marginBottom: 8, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
        typeScroll: { flexDirection: 'row', marginBottom: 20 },
        typeChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: theme.background, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: theme.border },
        typeChipActive: { backgroundColor: theme.gold, borderColor: theme.gold },
        typeText: { color: theme.textSubtle, fontWeight: '500', marginLeft: 8 },
        typeTextActive: { color: '#000', fontWeight: 'bold' },
        input: { backgroundColor: theme.background, color: theme.text, padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.border, fontSize: 15 },
        row: { flexDirection: 'row', gap: 10 },
        col: { flex: 1 },
        totalBox: { backgroundColor: theme.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 },
        totalLabel: { color: theme.textSubtle, fontSize: 14, fontWeight: 'bold' },
        totalValue: { color: theme.text, fontSize: 20, fontWeight: 'bold' },
        btnContainer: { flexDirection: 'row', gap: 10, marginTop: 10 },
        cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center' },
        cancelText: { color: theme.text, fontWeight: 'bold', fontSize: 15 },
        saveBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
        saveText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
        accountSelectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
        accountSelectText: { color: theme.text, fontSize: 14 },
        warningBox: { backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)', marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
        warningText: { color: theme.text, fontSize: 12, marginLeft: 8, flex: 1, lineHeight: 18 }
    });

    const activeAccounts = accounts.filter(a => !a.tipo.toLowerCase().includes('crédito') && !a.tipo.toLowerCase().includes('credito'));

    // Aggregating investments for the Sell Dropdown
    const aggregatedInvestments = investments.filter(i => i.tipo === type && i.quantidade > 0).reduce((acc, curr) => {
        const existing = acc.find(item => item.simbolo === curr.simbolo);
        if (existing) {
            existing.quantidade += curr.quantidade;
        } else {
            acc.push({ ...curr });
        }
        return acc;
    }, [] as Investimento[]);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>
                            {investmentToEdit ? 'Editar Investimento' : (operationType === 'sell' ? 'Resgatar / Vender Ativo' : 'Novo Aporte / Compra')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                        {/* BUY/SELL TABS - Only for new investments */}
                        {!investmentToEdit && (
                            <View style={styles.operationTabs}>
                                <TouchableOpacity
                                    style={[styles.opTab, operationType === 'buy' && styles.opTabBuyActive]}
                                    onPress={() => setOperationType('buy')}
                                >
                                    <TrendingUp size={18} color={operationType === 'buy' ? '#FFF' : theme.textSubtle} />
                                    <Text style={[styles.opTabText, operationType === 'buy' && styles.opTabTextActive]}>Compra</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.opTab, operationType === 'sell' && styles.opTabSellActive]}
                                    onPress={() => setOperationType('sell')}
                                >
                                    <TrendingDown size={18} color={operationType === 'sell' ? '#FFF' : theme.textSubtle} />
                                    <Text style={[styles.opTabText, operationType === 'sell' && styles.opTabTextActive]}>Venda</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ACCOUNT INTEGRATION */}
                        {!investmentToEdit && (
                            <View style={styles.accountBox}>
                                <View style={styles.rowSwitch}>
                                    <Text style={styles.switchLabel}>
                                        {operationType === 'buy' ? 'Debitar valor da minha conta corrente?' : 'Creditar valor na minha conta corrente?'}
                                    </Text>
                                    <Switch
                                        value={useAccountBalance}
                                        onValueChange={setUseAccountBalance}
                                        trackColor={{ false: theme.border, true: theme.gold }}
                                        thumbColor={Platform.OS === 'android' ? '#FFF' : undefined}
                                    />
                                </View>

                                {useAccountBalance && (
                                    <View style={{ gap: 8, marginTop: 12 }}>
                                        {selectedAccountId && !isAccountSelectOpen ? (
                                            <TouchableOpacity
                                                style={[styles.accountSelectBtn, { borderColor: theme.gold }]}
                                                onPress={() => setIsAccountSelectOpen(true)}
                                            >
                                                <Text style={[styles.accountSelectText, { color: theme.gold, fontWeight: 'bold' }]}>
                                                    {activeAccounts.find(a => a.id === selectedAccountId)?.nome || 'Conta Selecionada'}
                                                </Text>
                                                <Check size={18} color={theme.gold} />
                                            </TouchableOpacity>
                                        ) : (
                                            activeAccounts.map(acc => (
                                                <TouchableOpacity
                                                    key={acc.id}
                                                    style={[styles.accountSelectBtn, selectedAccountId === acc.id && { borderColor: theme.gold }]}
                                                    onPress={() => { setSelectedAccountId(acc.id); setIsAccountSelectOpen(false); }}
                                                >
                                                    <Text style={[styles.accountSelectText, selectedAccountId === acc.id && { color: theme.gold, fontWeight: 'bold' }]}>
                                                        {acc.nome}
                                                    </Text>
                                                    {selectedAccountId === acc.id && <Check size={18} color={theme.gold} />}
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ASSET TYPE */}
                        <Text style={styles.label}>Tipo de Ativo</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                            {INVESTMENT_TYPES.map((t) => (
                                <TouchableOpacity
                                    key={t.value}
                                    style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                                    disabled={!!investmentToEdit}
                                    onPress={() => {
                                        setType(t.value);
                                        setSymbol(''); setPrice(''); setQuantity('');
                                    }}
                                >
                                    <t.icon size={16} color={type === t.value ? '#000' : theme.textSubtle} />
                                    <Text style={[styles.typeText, type === t.value && styles.typeTextActive]}>{t.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* DYNAMIC FORM */}
                        {type === 'bonds' && operationType !== 'sell' ? (
                            <View>
                                {showBondsWarning && (
                                    <View style={styles.warningBox}>
                                        <AlertTriangle size={16} color="#EAB308" style={{ marginTop: 2 }} />
                                        <Text style={styles.warningText}>
                                            <Text style={{ fontWeight: 'bold' }}>Opção Manual:{'\n'}</Text>
                                            Estamos implementando Renda Fixa automática. Por enquanto cadastre valores aplicados manualmente.
                                        </Text>
                                    </View>
                                )}

                                <Text style={styles.label}>Nome do Título</Text>
                                <TextInput style={styles.input} placeholder="Ex: CDB Banco Inter" placeholderTextColor={theme.textSubtle} value={bondsName} onChangeText={setBondsName} />

                                <View style={styles.row}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Taxa</Text>
                                        <TextInput style={styles.input} placeholder="Ex: 110% CDI" placeholderTextColor={theme.textSubtle} value={bondsRate} onChangeText={setBondsRate} />
                                    </View>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Venc. (Opci.)</Text>
                                        <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSubtle} value={bondsDueDate} onChangeText={setBondsDueDate} />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Data Apli.</Text>
                                        <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSubtle} value={dateString} onChangeText={setDateString} />
                                    </View>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Valor (R$)</Text>
                                        <TextInput style={styles.input} placeholder="0,00" keyboardType="numeric" placeholderTextColor={theme.textSubtle} value={bondsAppliedValue} onChangeText={setBondsAppliedValue} />
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View>
                                <Text style={styles.label}>{type === 'bonds' ? 'Título' : 'Ativo (Ticker)'}</Text>
                                {operationType === 'sell' && !investmentToEdit ? (
                                    <View style={{ gap: 8, marginBottom: 16 }}>
                                        {symbol && !isAssetSelectOpen ? (
                                            <TouchableOpacity
                                                style={[styles.accountSelectBtn, { borderColor: theme.gold }]}
                                                onPress={() => setIsAssetSelectOpen(true)}
                                            >
                                                <Text style={[styles.accountSelectText, { color: theme.gold, fontWeight: 'bold' }]}>
                                                    {symbol} - {name} ({aggregatedInvestments.find(a => a.simbolo === symbol)?.quantidade || 0} {type === 'bonds' ? 'disp.' : 'cotas'})
                                                </Text>
                                                <Check size={18} color={theme.gold} />
                                            </TouchableOpacity>
                                        ) : (
                                            <>
                                                {aggregatedInvestments.map(inv => (
                                                    <TouchableOpacity
                                                        key={inv.simbolo}
                                                        style={[styles.accountSelectBtn, symbol === inv.simbolo && { borderColor: theme.gold }]}
                                                        onPress={() => {
                                                            setSymbol(inv.simbolo);
                                                            setName(inv.nome);
                                                            setIsAssetSelectOpen(false);
                                                            if (type === 'bonds') {
                                                                setQuantity('1'); // Padrão 1 título
                                                                setPrice(inv.preco_medio.toString());
                                                            } else {
                                                                setPrice(inv.preco_atual ? inv.preco_atual.toString() : inv.preco_medio.toString());
                                                            }
                                                        }}
                                                    >
                                                        <Text style={[styles.accountSelectText, symbol === inv.simbolo && { color: theme.gold, fontWeight: 'bold' }]}>
                                                            {inv.simbolo} - {inv.nome} ({inv.quantidade} {type === 'bonds' ? 'disp.' : 'cotas'})
                                                        </Text>
                                                        {symbol === inv.simbolo && <Check size={18} color={theme.gold} />}
                                                    </TouchableOpacity>
                                                ))}
                                                {aggregatedInvestments.length === 0 && (
                                                    <Text style={{ color: theme.textSubtle, fontSize: 13, paddingVertical: 10 }}>Nenhum ativo desta categoria disponível para venda.</Text>
                                                )}
                                            </>
                                        )}
                                    </View>
                                ) : (
                                    <TextInput
                                        style={styles.input}
                                        placeholder={getSymbolPlaceholder()}
                                        placeholderTextColor={theme.textSubtle}
                                        value={symbol}
                                        onChangeText={setSymbol}
                                        onBlur={handleSymbolBlur}
                                        autoCapitalize="characters"
                                    />
                                )}

                                <Text style={styles.label}>Nome (Opcional)</Text>
                                <TextInput style={styles.input} placeholder={getNamePlaceholder()} placeholderTextColor={theme.textSubtle} value={name} onChangeText={setName} />

                                {!investmentToEdit && (
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16, marginBottom: 8 }}>
                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                            onPress={() => setInputMode('quantity')}
                                        >
                                            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: inputMode === 'quantity' ? theme.gold : theme.border, alignItems: 'center', justifyContent: 'center' }}>
                                                {inputMode === 'quantity' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.gold }} />}
                                            </View>
                                            <Text style={{ color: inputMode === 'quantity' ? theme.text : theme.textSubtle, fontSize: 13, fontWeight: 'bold' }}>Por Quantidade</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                                            onPress={() => setInputMode('value')}
                                        >
                                            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: inputMode === 'value' ? theme.gold : theme.border, alignItems: 'center', justifyContent: 'center' }}>
                                                {inputMode === 'value' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.gold }} />}
                                            </View>
                                            <Text style={{ color: inputMode === 'value' ? theme.text : theme.textSubtle, fontSize: 13, fontWeight: 'bold' }}>Por Valor (R$)</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <View style={styles.row}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Data</Text>
                                        <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSubtle} value={dateString} onChangeText={setDateString} />
                                    </View>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>{inputMode === 'value' ? 'Valor Total (R$)' : 'Quantidade'}</Text>
                                        {inputMode === 'value' ? (
                                            <TextInput style={styles.input} placeholder="0,00" keyboardType="numeric" placeholderTextColor={theme.textSubtle} value={totalValueInput} onChangeText={setTotalValueInput} />
                                        ) : (
                                            <TextInput style={styles.input} placeholder="0" keyboardType="numeric" placeholderTextColor={theme.textSubtle} value={quantity} onChangeText={setQuantity} />
                                        )}
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>{investmentToEdit ? 'Preço Médio (R$)' : 'Preço Unit. (R$)'}</Text>
                                        <TextInput style={styles.input} placeholder="0,00" keyboardType="numeric" placeholderTextColor={theme.textSubtle} value={price} onChangeText={setPrice} />
                                    </View>

                                    {investmentToEdit && (
                                        <View style={styles.col}>
                                            <Text style={styles.label}>Cotação (R$)</Text>
                                            <TextInput style={styles.input} placeholder="0,00" keyboardType="numeric" placeholderTextColor={theme.textSubtle} value={currentPrice} onChangeText={setCurrentPrice} />
                                        </View>
                                    )}
                                </View>
                            </View>
                        )}

                        <View style={styles.totalBox}>
                            <Text style={styles.totalLabel}>{inputMode === 'value' && type !== 'bonds' ? 'Quantidade Calculada' : 'Valor Total'}</Text>
                            <Text style={styles.totalValue}>
                                {inputMode === 'value' && type !== 'bonds'
                                    ? `${qtyNum > 0 ? qtyNum.toFixed(8).replace(/\.?0+$/, '') : '0'}`
                                    : `R$ ${totalValueDisplay.toFixed(2).replace('.', ',')}`
                                }
                            </Text>
                        </View>

                        {/* BUTTONS */}
                        <View style={styles.btnContainer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveBtn, loading && { opacity: 0.7 }, { backgroundColor: operationType === 'buy' ? theme.gold : theme.error }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                <Text style={[styles.saveText, operationType === 'sell' && { color: '#FFF' }]}>
                                    {loading ? 'Aguarde...' : (investmentToEdit ? 'Salvar Alterações' : operationType === 'buy' ? 'Confirmar Compra' : 'Confirmar Venda')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
