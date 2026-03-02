/**
 * 💰 FINANÇAS PRO GOLD - BUDGET MODAL
 * Modal para definir orçamentos por categoria com Lucide Icons
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
} from 'react-native';
import {
    X,
    Check,
    ChevronLeft,
    ChevronRight
} from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';
import { Orcamento } from '../types';

interface BudgetModalProps {
    visible: boolean;
    onClose: () => void;
    budgetToEdit?: Orcamento | null;
    currentMonth: string;
}

export default function BudgetModal({ visible, onClose, budgetToEdit, currentMonth }: BudgetModalProps) {
    const { setBudget, categories } = useFinance();
    const [loading, setLoading] = useState(false);

    // Filter categories that can have budgets (usually expenses)
    const expenseCategories = categories.filter(c => c.tipo === 'despesa');

    // Form States
    const [categoryId, setCategoryId] = useState('');
    const [plannedValue, setPlannedValue] = useState('');
    const [formMonth, setFormMonth] = useState(currentMonth);

    useEffect(() => {
        if (visible) {
            if (budgetToEdit) {
                setCategoryId(budgetToEdit.categoria_id);
                setPlannedValue(budgetToEdit.valor_planejado.toString());
                setFormMonth(budgetToEdit.mes);
            } else {
                resetForm();
                setFormMonth(currentMonth);
            }
        }
    }, [visible, budgetToEdit, currentMonth]);

    const resetForm = () => {
        setCategoryId('');
        setPlannedValue('');
    };

    const handleSave = async () => {
        if (!categoryId || !plannedValue) {
            Alert.alert('Erro', 'Por favor selecione uma categoria e defina um valor.');
            return;
        }

        setLoading(true);
        const amount = parseFloat(plannedValue.replace(',', '.'));
        const monthToSave = formMonth;

        const result = await setBudget(categoryId, amount, monthToSave);

        setLoading(false);

        if (result.error) {
            Alert.alert('Erro', 'Ocorreu um erro ao salvar o orçamento.');
        } else {
            Alert.alert('Sucesso', 'Orçamento salvo com sucesso!');
            onClose();
            resetForm();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.centeredView}
            >
                <View style={styles.modalView}>
                    <View style={styles.header}>
                        <Text style={styles.modalTitle}>{budgetToEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
                        {/* Mês Escohido */}
                        <Text style={styles.label}>Mês de Referência</Text>
                        <View style={styles.monthSelector}>
                            <TouchableOpacity onPress={() => {
                                const [year, month] = formMonth.split('-').map(Number);
                                let d = new Date(year, month - 2, 1);
                                setFormMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
                            }} style={styles.monthArrow}>
                                <ChevronLeft size={20} color={colors.text} />
                            </TouchableOpacity>
                            <View style={styles.monthCenter}>
                                <Text style={styles.monthTitle}>
                                    {(() => {
                                        const [year, month] = formMonth.split('-').map(Number);
                                        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                                        return `${months[month - 1]} de ${year}`;
                                    })()}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => {
                                const [year, month] = formMonth.split('-').map(Number);
                                let d = new Date(year, month, 1);
                                setFormMonth(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`);
                            }} style={styles.monthArrow}>
                                <ChevronRight size={20} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Categoria */}
                        <Text style={styles.label}>Categoria de Despesa</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                            {expenseCategories.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.catChip,
                                        categoryId === cat.id && { backgroundColor: cat.cor, borderColor: cat.cor }
                                    ]}
                                    onPress={() => setCategoryId(cat.id)}
                                >
                                    <Text style={styles.catIcon}>{cat.icone}</Text>
                                    <Text style={[
                                        styles.catText,
                                        categoryId === cat.id && styles.catTextActive
                                    ]}>
                                        {cat.nome}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Valor */}
                        <Text style={styles.label}>Limite Mensal (R$)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0,00"
                            placeholderTextColor={colors.textSubtle}
                            keyboardType="numeric"
                            value={plannedValue}
                            onChangeText={setPlannedValue}
                        />

                        <Text style={styles.helperText}>
                            Defina quanto você planeja gastar nesta categoria este mês.
                        </Text>

                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Salvando...' : 'Salvar Orçamento'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: colors.overlay,
    },
    modalView: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        height: '60%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background,
        padding: 8,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    monthArrow: {
        padding: 8,
    },
    monthCenter: {
        flex: 1,
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    form: {
        paddingBottom: 24,
    },
    label: {
        color: colors.textSubtle,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    input: {
        backgroundColor: colors.background,
        color: colors.text,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 18,
        fontWeight: 'bold',
    },
    helperText: {
        color: colors.textSubtle,
        fontSize: 12,
        marginBottom: 16,
    },
    catScroll: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    catChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    catIcon: {
        marginRight: 6,
        fontSize: 16,
    },
    catText: {
        color: colors.textSubtle,
        fontWeight: '500',
    },
    catTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    saveButton: {
        backgroundColor: colors.gold,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: colors.textInverted,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
