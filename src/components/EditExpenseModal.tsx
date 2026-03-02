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
    expense: SharedExpense | null;
    onSave: (expense: SharedExpense) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
}

export function EditExpenseModal({ isOpen, onClose, members, expense, onSave, onDelete }: Props) {
    const { categories } = useFinance();
    const [loading, setLoading] = useState(false);

    const expenseCategories = categories.filter(c => c.tipo === 'despesa');

    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState<'pending' | 'open' | 'settled'>('pending');
    const [paidBy, setPaidBy] = useState('');
    const [category, setCategory] = useState('');

    useEffect(() => {
        if (isOpen && expense) {
            setDescription(expense.description);
            setAmount(expense.amount.toString().replace('.', ','));
            setStatus(expense.status);
            setPaidBy(expense.paidBy);
            setCategory(expense.category);
        }
    }, [isOpen, expense]);

    const handleSave = async () => {
        if (!expense) return;

        const numAmount = parseFloat(amount.replace(',', '.'));
        if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
            Alert.alert('Erro', 'Preencha a descrição e um valor válido maior que zero.');
            return;
        }

        setLoading(true);
        try {
            await onSave({
                ...expense,
                description,
                amount: numAmount,
                status,
                category,
                // If it was equal split, we recalculate, otherwise we leave the splits as they are. 
                // For a proper app, we'd allow re-editing splits, but let's keep it simple for edit mode now.
            });
            onClose();
        } catch (error: any) {
            Alert.alert('Erro', error.message || 'Erro ao editar despesa');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!expense || !onDelete) return;
        Alert.alert('Excluir Despesa', 'Tem certeza que deseja excluir esta despesa?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await onDelete(expense.id);
                        onClose();
                    } catch (error: any) {
                        Alert.alert('Erro', error.message || 'Erro ao excluir despesa');
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    if (!expense) return null;

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
                        <Text style={styles.modalTitle}>Editar Despesa</Text>
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

                        <View style={{ height: 20 }} />

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                                <Text style={styles.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            {onDelete && (
                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={handleDelete}
                                    disabled={loading}
                                >
                                    <Text style={styles.deleteBtnText}>Excluir</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <Text style={styles.saveBtnText}>Salvar</Text>
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
        maxHeight: '80%',
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
    },
    deleteBtn: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: colors.error + '20',
        borderRadius: 12,
        alignItems: 'center',
    },
    deleteBtnText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
