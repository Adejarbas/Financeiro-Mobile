/**
 * 💰 FINANÇAS PRO GOLD - TRANSACTION MODAL
 * Modal para adicionar transações com dados REAIS do Supabase e Lucide Icons
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import {
    X,
    ArrowDownCircle,
    ArrowUpCircle,
    FileText,
    Calendar,
    CreditCard,
    TrendingUp,
    Bitcoin,
    Wallet,
    CheckCircle,
    DollarSign,
    CheckCircle2,
    Clock,
    Repeat,
    CalendarClock,
    Trash2
} from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';
import CategoryModal from './CategoryModal';

import { TransacaoComRelacoes } from '../types';

interface TransactionModalProps {
    visible: boolean;
    onClose: () => void;
    transactionToEdit?: TransacaoComRelacoes | null;
}

export default function TransactionModal({ visible, onClose, transactionToEdit }: TransactionModalProps) {
    const { addTransaction, updateTransaction, deleteTransaction, categories, accounts } = useFinance();

    const [type, setType] = useState<'receita' | 'despesa'>('despesa');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [accountId, setAccountId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Novos campos
    const [status, setStatus] = useState<'Concluído' | 'Pendente'>('Concluído');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [endDate, setEndDate] = useState('');

    const [saving, setSaving] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    useEffect(() => {
        if (visible) {
            if (transactionToEdit) {
                setType(transactionToEdit.tipo);
                setDescription(transactionToEdit.descricao);
                setAmount(transactionToEdit.valor.toString().replace('.', ','));
                setCategoryId(transactionToEdit.categoria_id);
                setAccountId(transactionToEdit.conta_id);
                setDate(transactionToEdit.data_transacao.split('T')[0]);
                setStatus(transactionToEdit.status || 'Concluído');
                setIsRecurring(transactionToEdit.eh_recorrente || false);
                setRecurringType(transactionToEdit.tipo_recorrencia || 'monthly');
                setEndDate(transactionToEdit.data_fim_recorrencia ? transactionToEdit.data_fim_recorrencia.split('T')[0] : '');
            } else {
                resetForm();
            }
        }
    }, [visible, transactionToEdit]);

    // Categorias filtradas pelo tipo selecionado
    const filteredCategories = categories.filter(cat => cat.tipo === type);

    // Contas ativas
    const activeAccounts = accounts.filter(acc => acc.ativa);

    const resetForm = () => {
        setType('despesa');
        setDescription('');
        setAmount('');
        setCategoryId('');
        setAccountId('');
        setDate(new Date().toISOString().split('T')[0]);
        setStatus('Concluído');
        setIsRecurring(false);
        setRecurringType('monthly');
        setEndDate('');
    };

    const handleSave = async () => {
        // Validação
        if (!description.trim()) {
            Alert.alert('Atenção', 'Informe a descrição da transação.');
            return;
        }
        if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
            Alert.alert('Atenção', 'Informe um valor válido.');
            return;
        }
        if (!categoryId) {
            Alert.alert('Atenção', 'Selecione uma categoria.');
            return;
        }
        if (!accountId) {
            Alert.alert('Atenção', 'Selecione uma conta.');
            return;
        }

        setSaving(true);

        let result;
        const value = parseFloat(amount.replace(',', '.'));

        if (transactionToEdit) {
            result = await updateTransaction(transactionToEdit.id, {
                descricao: description.trim(),
                valor: value,
                tipo: type,
                categoria_id: categoryId,
                conta_id: accountId,
                data_transacao: date,
                status,
                eh_recorrente: isRecurring,
                tipo_recorrencia: isRecurring ? recurringType : undefined,
                data_fim_recorrencia: isRecurring && endDate ? endDate : undefined,
            });
        } else {
            result = await addTransaction({
                descricao: description.trim(),
                valor: value,
                tipo: type,
                categoria_id: categoryId,
                conta_id: accountId,
                data_transacao: date,
                status,
                eh_recorrente: isRecurring,
                tipo_recorrencia: isRecurring ? recurringType : undefined,
                data_fim_recorrencia: isRecurring && endDate ? endDate : undefined,
            });
        }

        setSaving(false);

        if (result.error) {
            Alert.alert('Erro', 'Não foi possível salvar a transação. Tente novamente.');
        } else {
            Alert.alert('Sucesso!', `Transação ${transactionToEdit ? 'atualizada' : 'salva'} com sucesso.`, [
                { text: 'OK', onPress: () => { resetForm(); onClose(); } }
            ]);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleDelete = () => {
        if (!transactionToEdit) return;
        Alert.alert(
            "Excluir Transação",
            "Tem certeza que deseja excluir esta transação?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        setSaving(true);
                        const result = await deleteTransaction(transactionToEdit.id);
                        setSaving(false);
                        if (result.error) {
                            Alert.alert('Erro', 'Não foi possível excluir a transação.');
                        } else {
                            resetForm();
                            onClose();
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
                        </Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Toggle Receita/Despesa */}
                    <View style={styles.typeToggle}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                type === 'despesa' && styles.typeButtonDespesa,
                            ]}
                            onPress={() => { setType('despesa'); setCategoryId(''); }}
                        >
                            <ArrowDownCircle
                                size={18}
                                color={type === 'despesa' ? '#FFF' : colors.textSubtle}
                            />
                            <Text style={[
                                styles.typeText,
                                type === 'despesa' && styles.typeTextActive,
                            ]}>
                                Despesa
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                type === 'receita' && styles.typeButtonReceita,
                            ]}
                            onPress={() => { setType('receita'); setCategoryId(''); }}
                        >
                            <ArrowUpCircle
                                size={18}
                                color={type === 'receita' ? '#FFF' : colors.textSubtle}
                            />
                            <Text style={[
                                styles.typeText,
                                type === 'receita' && styles.typeTextActive,
                            ]}>
                                Receita
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.formContent}
                    >
                        {/* Descrição */}
                        <Text style={styles.label}>Descrição</Text>
                        <View style={styles.inputContainer}>
                            <FileText size={20} color={colors.textSubtle} />
                            <TextInput
                                style={styles.input}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Ex: Mercado, Salário..."
                                placeholderTextColor={colors.textSubtle}
                            />
                        </View>

                        {/* Valor */}
                        <Text style={styles.label}>Valor (R$)</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.currencySign}>R$</Text>
                            <TextInput
                                style={[styles.input, styles.valueInput]}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0,00"
                                placeholderTextColor={colors.textSubtle}
                                keyboardType="numeric"
                            />
                        </View>

                        {/* Data */}
                        <Text style={styles.label}>Data</Text>
                        <View style={styles.inputContainer}>
                            <Calendar size={20} color={colors.textSubtle} />
                            <TextInput
                                style={styles.input}
                                value={date}
                                onChangeText={setDate}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor={colors.textSubtle}
                            />
                        </View>

                        {/* Categoria */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <Text style={[styles.label, { marginBottom: 0 }]}>Categoria</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(true)}>
                                <Text style={{ color: colors.gold, fontSize: 13, fontWeight: 'bold' }}>+ Nova Categoria</Text>
                            </TouchableOpacity>
                        </View>
                        {filteredCategories.length === 0 ? (
                            <Text style={styles.emptyMessage}>
                                Nenhuma categoria {type === 'receita' ? 'de receita' : 'de despesa'} encontrada
                            </Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {filteredCategories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.chip,
                                            categoryId === cat.id && {
                                                backgroundColor: cat.cor || colors.gold,
                                                borderColor: cat.cor || colors.gold,
                                            }
                                        ]}
                                        onPress={() => setCategoryId(cat.id)}
                                    >
                                        <Text style={styles.chipIcon}>{cat.icone}</Text>
                                        <Text style={[
                                            styles.chipText,
                                            categoryId === cat.id && styles.chipTextActive,
                                        ]}>
                                            {cat.nome}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        {/* Conta */}
                        <Text style={styles.label}>Conta</Text>
                        {activeAccounts.length === 0 ? (
                            <Text style={styles.emptyMessage}>
                                Nenhuma conta encontrada. Crie uma conta primeiro.
                            </Text>
                        ) : (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                                {activeAccounts.map(acc => {
                                    // Helpers para ícone da conta
                                    const AccountIcon = acc.tipo === 'Corrente' ? CreditCard :
                                        acc.tipo === 'Investimento' ? TrendingUp :
                                            acc.tipo === 'Cripto' ? Bitcoin : Wallet;

                                    return (
                                        <TouchableOpacity
                                            key={acc.id}
                                            style={[
                                                styles.chip,
                                                accountId === acc.id && {
                                                    backgroundColor: colors.gold,
                                                    borderColor: colors.gold,
                                                }
                                            ]}
                                            onPress={() => setAccountId(acc.id)}
                                        >
                                            <AccountIcon
                                                size={16}
                                                color={accountId === acc.id ? colors.textInverted : colors.textSubtle}
                                            />
                                            <Text style={[
                                                styles.chipText,
                                                accountId === acc.id && styles.chipTextActive,
                                            ]}>
                                                {acc.nome}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        {/* Status Toggle */}
                        <Text style={styles.label}>Status</Text>
                        <View style={styles.statusToggleContainer}>
                            <TouchableOpacity
                                style={[styles.statusButton, status === 'Concluído' && styles.statusButtonActive]}
                                onPress={() => setStatus('Concluído')}
                            >
                                <CheckCircle2 size={18} color={status === 'Concluído' ? colors.success : colors.textSubtle} />
                                <Text style={[styles.statusButtonText, status === 'Concluído' && { color: colors.success }]}>Concluído</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.statusButton, status === 'Pendente' && styles.statusButtonActive]}
                                onPress={() => setStatus('Pendente')}
                            >
                                <Clock size={18} color={status === 'Pendente' ? colors.gold : colors.textSubtle} />
                                <Text style={[styles.statusButtonText, status === 'Pendente' && { color: colors.gold }]}>Pendente</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Transação Recorrente */}
                        <View style={styles.recurringContainer}>
                            <View style={styles.recurringHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Repeat size={20} color={colors.gold} style={{ marginRight: 8 }} />
                                    <Text style={styles.recurringLabel}>Transação Recorrente</Text>
                                </View>
                                <Switch
                                    value={isRecurring}
                                    onValueChange={setIsRecurring}
                                    trackColor={{ false: colors.border, true: colors.gold + '50' }}
                                    thumbColor={isRecurring ? colors.gold : colors.textSubtle}
                                />
                            </View>

                            {isRecurring && (
                                <View style={styles.recurringOptions}>
                                    <Text style={styles.label}>Frequência</Text>
                                    <View style={styles.recurringTypeRow}>
                                        {[
                                            { label: 'Diária', value: 'daily' },
                                            { label: 'Semanal', value: 'weekly' },
                                            { label: 'Mensal', value: 'monthly' },
                                            { label: 'Anual', value: 'yearly' },
                                        ].map((opt) => (
                                            <TouchableOpacity
                                                key={opt.value}
                                                style={[styles.recurringTypeChip, recurringType === opt.value && styles.recurringTypeChipActive]}
                                                onPress={() => setRecurringType(opt.value as any)}
                                            >
                                                <Text style={[styles.recurringTypeText, recurringType === opt.value && styles.recurringTypeTextActive]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={styles.label}>Término (Opcional)</Text>
                                    <View style={styles.inputContainer}>
                                        <CalendarClock size={20} color={colors.textSubtle} />
                                        <TextInput
                                            style={styles.input}
                                            value={endDate}
                                            onChangeText={setEndDate}
                                            placeholder="AAAA-MM-DD"
                                            placeholderTextColor={colors.textSubtle}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Botão Salvar */}
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={colors.textInverted} />
                            ) : (
                                <>
                                    <CheckCircle size={22} color={colors.textInverted} />
                                    <Text style={styles.saveButtonText}>Salvar Transação</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {transactionToEdit && (
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                                disabled={saving}
                            >
                                <Trash2 size={20} color={colors.error} />
                                <Text style={styles.deleteButtonText}>Excluir Transação</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>

            {/* Modal de Categorias aninhado/sobreposto */}
            <CategoryModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: colors.overlay,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeToggle: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        gap: 6,
    },
    typeButtonDespesa: {
        backgroundColor: colors.error,
    },
    typeButtonReceita: {
        backgroundColor: colors.success,
    },
    typeText: {
        color: colors.textSubtle,
        fontWeight: '600',
        fontSize: 15,
    },
    typeTextActive: {
        color: '#FFF',
    },
    formContent: {
        paddingBottom: 20,
    },
    label: {
        color: colors.textSubtle,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        gap: 10,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingVertical: 14,
    },
    valueInput: {
        fontSize: 24,
        fontWeight: '700',
    },
    currencySign: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    chipScroll: {
        marginVertical: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 8,
        gap: 6,
    },
    chipIcon: {
        fontSize: 16,
    },
    chipText: {
        color: colors.textSubtle,
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextActive: {
        color: colors.textInverted,
        fontWeight: '600',
    },
    emptyMessage: {
        color: colors.textMuted,
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 12,
    },
    saveButton: {
        backgroundColor: colors.gold,
        borderRadius: 14,
        paddingVertical: 16,
        marginTop: 28,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: colors.textInverted,
        fontSize: 17,
        fontWeight: '700',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 14,
        gap: 8,
        backgroundColor: colors.error + '15',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    deleteButtonText: {
        color: colors.error,
        fontSize: 15,
        fontWeight: '600',
    },
    statusToggleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statusButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
    },
    statusButtonActive: {
        borderColor: colors.gold,
        backgroundColor: colors.gold + '10',
    },
    statusButtonText: {
        color: colors.textSubtle,
        fontWeight: '600',
        marginLeft: 8,
    },
    recurringContainer: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recurringHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    recurringLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.gold,
    },
    recurringOptions: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16,
    },
    recurringTypeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    recurringTypeChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    recurringTypeChipActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    recurringTypeText: {
        color: colors.textSubtle,
        fontWeight: '500',
        fontSize: 13,
    },
    recurringTypeTextActive: {
        color: colors.textInverted,
        fontWeight: 'bold',
    },
});
