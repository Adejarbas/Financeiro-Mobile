/**
 * 🎯 FINANÇAS PRO GOLD - GOAL MODAL
 * Modal para adicionar/editar metas financeiras com Lucide Icons
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
    Check
} from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';
import { Meta } from '../types';

interface GoalModalProps {
    visible: boolean;
    onClose: () => void;
    goalToEdit?: Meta | null;
}

const GOAL_COLORS = [
    '#D4AF37', '#2DD4BF', '#F87171', '#9333EA', '#F59E0B', '#10B981'
];

export default function GoalModal({ visible, onClose, goalToEdit }: GoalModalProps) {
    const { addGoal, updateGoal } = useFinance();
    const [loading, setLoading] = useState(false);

    // Form States
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [currentValue, setCurrentValue] = useState(''); // Opcional
    const [deadline, setDeadline] = useState(''); // YYYY-MM-DD
    const [color, setColor] = useState(GOAL_COLORS[0]);

    useEffect(() => {
        if (visible) {
            if (goalToEdit) {
                setName(goalToEdit.nome);
                setCategory(goalToEdit.categoria || '');
                setTargetValue(goalToEdit.valor_alvo.toString());
                setCurrentValue(goalToEdit.valor_atual.toString());
                setDeadline(goalToEdit.prazo);
                setColor(goalToEdit.cor || GOAL_COLORS[0]);
            } else {
                resetForm();
            }
        }
    }, [visible, goalToEdit]);

    const resetForm = () => {
        setName('');
        setCategory('');
        setTargetValue('');
        setCurrentValue('');
        setDeadline(new Date().toISOString().split('T')[0]); // Hoje
        setColor(GOAL_COLORS[0]);
    };

    const handleSave = async () => {
        if (!name || !category || !targetValue || !deadline) {
            Alert.alert('Erro', 'Por favor preencha Nome, Categoria, Valor Meta e Data Limite.');
            return;
        }

        // Validação de data simples
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(deadline)) {
            Alert.alert('Erro', 'Data inválida. Use o formato YYYY-MM-DD.');
            return;
        }

        setLoading(true);
        const goalData: Partial<Meta> = {
            nome: name,
            categoria: category,
            valor_alvo: parseFloat(targetValue.replace(',', '.')),
            valor_atual: currentValue ? parseFloat(currentValue.replace(',', '.')) : 0,
            prazo: deadline,
            cor: color,
        };

        let result;
        if (goalToEdit) {
            result = await updateGoal(goalToEdit.id, goalData);
        } else {
            result = await addGoal(goalData);
        }

        setLoading(false);

        if (result.error) {
            Alert.alert('Erro', 'Ocorreu um erro ao salvar a meta.');
        } else {
            Alert.alert('Sucesso', 'Meta salva com sucesso!');
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
                        <Text style={styles.modalTitle}>{goalToEdit ? 'Editar Meta' : 'Nova Meta'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
                        <View style={styles.row}>
                            <View style={[styles.column, { flex: 1, marginRight: 8 }]}>
                                {/* Nome */}
                                <Text style={styles.label}>Nome da Meta *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Viagem Europa"
                                    placeholderTextColor={colors.textSubtle}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                            <View style={[styles.column, { flex: 1, marginLeft: 8 }]}>
                                {/* Categoria */}
                                <Text style={styles.label}>Categoria *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: Viagem, Sonho"
                                    placeholderTextColor={colors.textSubtle}
                                    value={category}
                                    onChangeText={setCategory}
                                />
                            </View>
                        </View>

                        {/* Valores */}
                        <View style={styles.row}>
                            <View style={[styles.column, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Valor Meta (R$) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0,00"
                                    placeholderTextColor={colors.textSubtle}
                                    keyboardType="numeric"
                                    value={targetValue}
                                    onChangeText={setTargetValue}
                                />
                            </View>
                            <View style={[styles.column, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Valor Atual (R$)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0,00"
                                    placeholderTextColor={colors.textSubtle}
                                    keyboardType="numeric"
                                    value={currentValue}
                                    onChangeText={setCurrentValue}
                                />
                            </View>
                        </View>

                        {/* Prazo */}
                        <Text style={styles.label}>Data Limite *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="AAAA-MM-DD"
                            placeholderTextColor={colors.textSubtle}
                            value={deadline}
                            onChangeText={setDeadline}
                            maxLength={10}
                        />

                        {/* Cores */}
                        <Text style={styles.label}>Cor da Meta</Text>
                        <View style={styles.colorsContainer}>
                            {GOAL_COLORS.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: c },
                                        color === c && styles.colorOptionSelected
                                    ]}
                                    onPress={() => setColor(c)}
                                >
                                    {color === c && <Check size={16} color="#FFF" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                    </ScrollView>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Salvando...' : (goalToEdit ? 'Salvar Alterações' : 'Criar Meta')}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
        height: '80%',
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
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    column: {
        flexDirection: 'column',
    },
    colorsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 2,
        borderColor: colors.text,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    cancelButtonText: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    saveButton: {
        flex: 1,
        backgroundColor: colors.gold,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: colors.textInverted,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
