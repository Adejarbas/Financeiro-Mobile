import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';

import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';

interface CopyBudgetModalProps {
    visible: boolean;
    onClose: () => void;
    currentMonth: string;
}

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CopyBudgetModal({ visible, onClose, currentMonth }: CopyBudgetModalProps) {
    const { copyBudgets } = useFinance();
    const [loading, setLoading] = useState(false);

    // Calcula mêses passados baseados em "YYYY-MM"
    const [yearStr, monthStr] = currentMonth.split('-');
    const currentYearNum = parseInt(yearStr);
    const currentMonthNum = parseInt(monthStr);

    const getPreviousMonths = () => {
        const months = [];
        for (let i = 1; i <= 3; i++) {
            let m = currentMonthNum - i;
            let y = currentYearNum;
            if (m <= 0) {
                m += 12;
                y -= 1;
            }
            const monthFormatted = m.toString().padStart(2, '0');
            months.push({
                key: `${y}-${monthFormatted}`,
                label: `${MONTH_NAMES[m - 1]} de ${y}`
            });
        }
        return months;
    };

    const previousMonths = getPreviousMonths();
    const [selectedFromMonth, setSelectedFromMonth] = useState('');

    const handleCopy = async () => {
        if (!selectedFromMonth) {
            Alert.alert('Selecione', 'Por favor, selecione um mês de origem.');
            return;
        }

        setLoading(true);
        const result = await copyBudgets(selectedFromMonth, currentMonth);
        setLoading(false);

        if (result.error) {
            Alert.alert('Erro', 'Ocorreu um erro ao copiar os orçamentos.');
        } else {
            Alert.alert('Sucesso', 'Orçamentos copiados com sucesso!');
            onClose();
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
                        <Text style={styles.modalTitle}>Copiar Orçamento</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.helperText}>
                        Você pode copiar todos os limites definidos em um mês anterior para o mês atual.
                        Escolha de qual mês deseja copiar:
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
                        {previousMonths.map((m) => (
                            <TouchableOpacity
                                key={m.key}
                                style={[
                                    styles.monthOption,
                                    selectedFromMonth === m.key && styles.monthOptionActive
                                ]}
                                onPress={() => setSelectedFromMonth(m.key)}
                            >
                                <Text style={[
                                    styles.monthText,
                                    selectedFromMonth === m.key && styles.monthTextActive
                                ]}>
                                    {m.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleCopy}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? 'Copiando...' : 'Copiar para o Mês Atual'}
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
        height: '50%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
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
    helperText: {
        color: colors.textSubtle,
        fontSize: 14,
        marginBottom: 24,
        lineHeight: 20,
    },
    form: {
        paddingBottom: 24,
    },
    monthOption: {
        padding: 16,
        backgroundColor: colors.background,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    monthOptionActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    monthText: {
        color: colors.textSubtle,
        fontSize: 16,
        fontWeight: '500',
    },
    monthTextActive: {
        color: colors.textInverted,
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
