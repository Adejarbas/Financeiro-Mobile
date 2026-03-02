import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import colors from '../theme/colors';
import { useFinance } from '../context/FinanceContext';
import { FamilyMember, SharedExpense } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    members: FamilyMember[];
    onSave: (expense: Omit<SharedExpense, 'id'>) => Promise<void>;
    groupId: string;
}

export function SharedExpenseModal({ isOpen, onClose, members, onSave, groupId }: Props) {
    const { categories, user } = useFinance();
    const [loading, setLoading] = useState(false);

    const expenseCategories = categories.filter(c => c.tipo === 'despesa');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'pending' | 'open'>('pending');
    const [paidBy, setPaidBy] = useState('');
    const [category, setCategory] = useState('');
    const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');

    // For custom splits
    const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

    // Reset when open
    useEffect(() => {
        if (isOpen) {
            setDescription('');
            setAmount('');
            setStatus('pending');
            setCategory(expenseCategories.length > 0 ? expenseCategories[0].nome : 'Geral');
            setSplitType('equal');
            const currentUserMember = members.find(m => m.userId === user?.id);
            if (currentUserMember) {
                setPaidBy(currentUserMember.id);
            } else if (members.length > 0) {
                setPaidBy(members[0].id);
            }
            const initialSplits: Record<string, string> = {};
            members.forEach(m => initialSplits[m.id] = '');
            setCustomSplits(initialSplits);
        }
    }, [isOpen, members, user]);

    const handleSave = async () => {
        const numAmount = parseFloat(amount.replace(',', '.'));
        if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Erro', 'Preencha a descrição e um valor válido maior que zero.');
            return;
        }

        setLoading(true);
        try {
            let splits = [];

            if (splitType === 'equal') {
                const splitAmount = numAmount / members.length;
                splits = members.map(m => ({
                    memberId: m.id,
                    amount: splitAmount,
                    paid: m.id === paidBy && status === 'pending' // If I paid and it's pending, my part is paid
                }));
            } else {
                let totalSplit = 0;
                splits = members.map(m => {
                    const sAmt = parseFloat(customSplits[m.id]?.replace(',', '.') || '0');
                    totalSplit += sAmt;
                    return {
                        memberId: m.id,
                        amount: sAmt,
                        paid: m.id === paidBy && status === 'pending'
                    };
                });

                if (Math.abs(totalSplit - numAmount) > 0.1) {
                    Alert.alert('Erro', 'A soma das divisões deve ser exatamente igual ao valor total.');
                    setLoading(false);
                    return;
                }
            }

            const expenseData: Omit<SharedExpense, 'id'> = {
                groupId,
                description,
                amount: numAmount,
                paidBy,
                splitType,
                splits,
                date: new Date().toISOString(),
                category,
                status
            };

            await onSave(expenseData);
            onClose();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao adicionar despesa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isOpen}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={styles.modalOverlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Nova Despesa Compartilhada</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Descrição</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Conta de Luz"
                                placeholderTextColor={colors.textSubtle}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Valor Total (R$)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0,00"
                                placeholderTextColor={colors.textSubtle}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Status do Pagamento</Text>
                            <View style={styles.statusContainer}>
                                <TouchableOpacity
                                    style={[styles.statusBtn, status === 'pending' && styles.statusBtnActive]}
                                    onPress={() => setStatus('pending')}
                                >
                                    <Text style={[styles.statusBtnText, status === 'pending' && styles.statusBtnTextActive]}>Já foi Pago</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.statusBtn, status === 'open' && styles.statusBtnActive]}
                                    onPress={() => setStatus('open')}
                                >
                                    <Text style={[styles.statusBtnText, status === 'open' && styles.statusBtnTextActive]}>A Pagar (Futuro)</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Quem {status === 'open' ? 'vai pagar' : 'Pagou'}</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={paidBy}
                                    onValueChange={(itemValue) => setPaidBy(itemValue)}
                                    dropdownIconColor={colors.gold}
                                    style={styles.picker}
                                >
                                    {members.map(m => (
                                        <Picker.Item key={m.id} label={m.name} value={m.id} color={Platform.OS === 'ios' ? colors.text : undefined} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Categoria</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={category}
                                    onValueChange={(itemValue) => setCategory(itemValue)}
                                    dropdownIconColor={colors.gold}
                                    style={styles.picker}
                                >
                                    {expenseCategories.map(c => (
                                        <Picker.Item key={c.nome} label={c.nome} value={c.nome} color={Platform.OS === 'ios' ? colors.text : undefined} />
                                    ))}
                                    {expenseCategories.length === 0 && (
                                        <Picker.Item label="Geral" value="Geral" color={Platform.OS === 'ios' ? colors.text : undefined} />
                                    )}
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Tipo de Divisão</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={splitType}
                                    onValueChange={(itemValue) => setSplitType(itemValue as 'equal' | 'custom')}
                                    dropdownIconColor={colors.gold}
                                    style={styles.picker}
                                >
                                    <Picker.Item label="Igual para todos" value="equal" color={Platform.OS === 'ios' ? colors.text : undefined} />
                                    <Picker.Item label="Personalizado" value="custom" color={Platform.OS === 'ios' ? colors.text : undefined} />
                                </Picker>
                            </View>
                        </View>

                        {splitType === 'custom' && (
                            <View style={styles.customSplitContainer}>
                                <Text style={styles.customSplitTitle}>Valores por Pessoa (R$)</Text>
                                {members.map(m => (
                                    <View key={m.id} style={styles.customSplitRow}>
                                        <Text style={styles.customSplitName}>{m.name}</Text>
                                        <TextInput
                                            style={styles.customSplitInput}
                                            placeholder="0,00"
                                            placeholderTextColor={colors.textSubtle}
                                            keyboardType="numeric"
                                            value={customSplits[m.id]}
                                            onChangeText={(val) => setCustomSplits(prev => ({ ...prev, [m.id]: val }))}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                        <View style={{ height: 20 }} />

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Adicionar Despesa</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeBtn: {
        padding: 4,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: colors.text,
        fontSize: 16,
    },
    statusContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statusBtn: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        alignItems: 'center',
    },
    statusBtnActive: {
        borderColor: colors.text,
        backgroundColor: colors.text,
    },
    statusBtnText: {
        color: colors.textSubtle,
        fontWeight: '600',
    },
    statusBtnTextActive: {
        color: colors.background,
    },
    pickerContainer: {
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    picker: {
        color: colors.text,
        height: 50,
    },
    customSplitContainer: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 8,
    },
    customSplitTitle: {
        color: colors.textSubtle,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    customSplitRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customSplitName: {
        color: colors.text,
        flex: 1,
    },
    customSplitInput: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        width: 100,
        padding: 8,
        color: colors.text,
        textAlign: 'right',
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveBtn: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: colors.gold,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveBtnText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
