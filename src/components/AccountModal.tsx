/**
 * 💳 FINANÇAS PRO GOLD - ACCOUNT MODAL
 * Igual ao web: Apelido, Banco, Tipo (4 opções grid), Saldo, Cor do Card
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import {
    X,
    Building2,
    ArrowUpRight,
    Bitcoin,
    CreditCard,
    Wallet,
    CheckCircle,
} from 'lucide-react-native';
import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import { Conta, TipoConta } from '../types';

interface AccountModalProps {
    visible: boolean;
    onClose: () => void;
    accountToEdit?: Conta | null;
}

// Tipos — igual ao web
const ACCOUNT_TYPES: { label: string; value: TipoConta; icon: React.ReactNode }[] = [
    { label: 'Conta', value: 'Corrente', icon: null },
    { label: 'Investimentos', value: 'Investimento', icon: null },
    { label: 'Criptomoedas', value: 'Cripto', icon: null },
    { label: 'Cartão', value: 'Credito', icon: null },
];

// Paleta de cores — igual ao web
const COLOR_PALETTE = [
    '#9333EA', '#F97316', '#EAB308', '#000000',
    '#DC2626', '#6366F1', '#10B981', '#F59E0B',
];

export default function AccountModal({ visible, onClose, accountToEdit }: AccountModalProps) {
    const { addAccount, updateAccount, isDarkMode } = useFinance();
    const c = getColors(isDarkMode);

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [banco, setBanco] = useState('');
    const [balance, setBalance] = useState('');
    const [type, setType] = useState<TipoConta>('Corrente');
    const [cor, setCor] = useState(COLOR_PALETTE[0]);
    // Crédito extras
    const [limite, setLimite] = useState('');

    useEffect(() => {
        if (visible) {
            if (accountToEdit) {
                setName(accountToEdit.nome);
                setBanco(accountToEdit.nome_banco || '');
                setBalance(accountToEdit.saldo.toString().replace('.', ','));
                setType(accountToEdit.tipo);
                setCor(accountToEdit.cor || COLOR_PALETTE[0]);
                setLimite((accountToEdit.limite_credito || 0).toString().replace('.', ','));
            } else {
                resetForm();
            }
        }
    }, [visible, accountToEdit]);

    const resetForm = () => {
        setName('');
        setBanco('');
        setBalance('');
        setType('Corrente');
        setCor(COLOR_PALETTE[0]);
        setLimite('');
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Atenção', 'Informe o apelido da conta.');
            return;
        }
        const balanceVal = parseFloat(balance.replace(',', '.') || '0');
        if (isNaN(balanceVal)) { Alert.alert('Atenção', 'Valor inválido.'); return; }

        const limiteVal = parseFloat(limite.replace(',', '.') || '0');

        setLoading(true);
        const payload: Partial<Conta> = {
            nome: name.trim(),
            nome_banco: banco.trim() || undefined,
            saldo: balanceVal,
            tipo: type,
            cor,
            ativa: true,
            ...(type === 'Credito' ? { limite_credito: limiteVal } : {}),
        };

        const result = accountToEdit
            ? await updateAccount(accountToEdit.id, payload)
            : await addAccount(payload);

        setLoading(false);
        if (result.error) {
            Alert.alert('Erro', 'Não foi possível salvar. Tente novamente.');
        } else {
            onClose();
            resetForm();
        }
    };

    const typeIcon = (t: TipoConta, active: boolean) => {
        const iconColor = active ? '#000' : c.textSubtle;
        const size = 18;
        switch (t) {
            case 'Investimento': return <ArrowUpRight size={size} color={iconColor} />;
            case 'Cripto': return <Bitcoin size={size} color={iconColor} />;
            case 'Credito': return <CreditCard size={size} color={iconColor} />;
            default: return <Building2 size={size} color={iconColor} />;
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={[styles.sheet, { backgroundColor: c.card }]}>
                    {/* Header */}
                    <View style={[styles.sheetHeader, { borderBottomColor: c.divider }]}>
                        <Text style={[styles.sheetTitle, { color: c.text }]}>
                            {accountToEdit ? 'Editar Conta' : 'Nova Conta'}
                        </Text>
                        <TouchableOpacity
                            style={[styles.closeBtn, { backgroundColor: c.background }]}
                            onPress={onClose}
                        >
                            <X size={18} color={c.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
                        {/* Apelido */}
                        <Text style={[styles.label, { color: c.textSubtle }]}>Apelido da Conta *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Ex: Minha Conta, Cartão Gold..."
                            placeholderTextColor={c.textMuted}
                        />

                        {/* Banco */}
                        <Text style={[styles.label, { color: c.textSubtle }]}>Banco/Instituição *</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: c.background, borderColor: c.border, color: c.text }]}
                            value={banco}
                            onChangeText={setBanco}
                            placeholder="Ex: Nubank, Inter, Binance..."
                            placeholderTextColor={c.textMuted}
                        />

                        {/* Tipo 2x2 grid */}
                        <Text style={[styles.label, { color: c.textSubtle }]}>Tipo de Conta *</Text>
                        <View style={styles.typeGrid}>
                            {ACCOUNT_TYPES.map(t => {
                                const active = type === t.value;
                                return (
                                    <TouchableOpacity
                                        key={t.value}
                                        style={[
                                            styles.typeBtn,
                                            { borderColor: c.border, backgroundColor: c.background },
                                            active && { backgroundColor: c.gold, borderColor: c.gold },
                                        ]}
                                        onPress={() => setType(t.value)}
                                    >
                                        {typeIcon(t.value, active)}
                                        <Text style={[styles.typeBtnText, { color: active ? '#000' : c.textSubtle }]}>
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Saldo */}
                        <Text style={[styles.label, { color: c.textSubtle }]}>Saldo Inicial (R$) *</Text>
                        <View style={[styles.inputRow, { backgroundColor: c.background, borderColor: c.border }]}>
                            <Text style={[styles.currency, { color: c.textSubtle }]}>R$</Text>
                            <TextInput
                                style={[styles.inputFlex, { color: c.text }]}
                                value={balance}
                                onChangeText={setBalance}
                                placeholder="0,00"
                                placeholderTextColor={c.textMuted}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Limite de crédito (só para cartão) */}
                        {type === 'Credito' && (
                            <>
                                <Text style={[styles.label, { color: c.textSubtle }]}>Limite de Crédito (R$)</Text>
                                <View style={[styles.inputRow, { backgroundColor: c.background, borderColor: c.border }]}>
                                    <Text style={[styles.currency, { color: c.textSubtle }]}>R$</Text>
                                    <TextInput
                                        style={[styles.inputFlex, { color: c.text }]}
                                        value={limite}
                                        onChangeText={setLimite}
                                        placeholder="0,00"
                                        placeholderTextColor={c.textMuted}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </>
                        )}

                        {/* Cor do Card */}
                        <Text style={[styles.label, { color: c.textSubtle }]}>Cor do Card</Text>
                        <View style={styles.colorPalette}>
                            {COLOR_PALETTE.map(color => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorDot,
                                        { backgroundColor: color },
                                        cor === color && styles.colorDotSelected,
                                    ]}
                                    onPress={() => setCor(color)}
                                >
                                    {cor === color && <CheckCircle size={14} color="#fff" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Botões */}
                        <View style={styles.buttonsRow}>
                            <TouchableOpacity
                                style={[styles.cancelBtn, { borderColor: c.border, backgroundColor: c.background }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.cancelBtnText, { color: c.text }]}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: c.gold }, loading && { opacity: 0.7 }]}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading
                                    ? <ActivityIndicator color="#000" />
                                    : <Text style={styles.saveBtnText}>
                                        {accountToEdit ? 'Salvar Alterações' : 'Adicionar Conta'}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '92%',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    sheetTitle: { fontSize: 18, fontWeight: '700' },
    closeBtn: {
        width: 34, height: 34, borderRadius: 17,
        justifyContent: 'center', alignItems: 'center',
    },
    body: { paddingHorizontal: 20, paddingBottom: 32 },

    label: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 18,
        marginBottom: 8,
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        height: 52,
        paddingHorizontal: 16,
        fontSize: 15,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        height: 52,
        paddingHorizontal: 16,
        gap: 8,
    },
    currency: { fontSize: 16, fontWeight: '700' },
    inputFlex: { flex: 1, fontSize: 16, fontWeight: '700' },

    // Type 2x2 grid
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    typeBtn: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    typeBtnText: { fontSize: 14, fontWeight: '600' },

    // Color palette
    colorPalette: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    colorDot: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorDotSelected: {
        borderWidth: 3,
        borderColor: '#fff',
        transform: [{ scale: 1.1 }],
    },

    // Buttons
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 28,
    },
    cancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnText: { fontSize: 15, fontWeight: '600' },
    saveBtn: {
        flex: 1.5,
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
});
