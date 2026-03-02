import React, { useState } from 'react';
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
import { X, Trash2, Plus, LayoutList } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';

interface CategoryModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function CategoryModal({ visible, onClose }: CategoryModalProps) {
    const insets = useSafeAreaInsets();
    const { categories, addCategory, deleteCategory } = useFinance();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'receita' | 'despesa'>('despesa');
    const [saving, setSaving] = useState(false);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Erro', 'O nome da categoria é obrigatório.');
            return;
        }

        const existingNames = categories.map(c => c.nome.toLowerCase());
        if (existingNames.includes(newCategoryName.trim().toLowerCase())) {
            Alert.alert('Erro', 'Já existe uma categoria com este nome.');
            return;
        }

        setSaving(true);
        const { error } = await addCategory({
            nome: newCategoryName.trim(),
            tipo: newCategoryType,
            icone: 'LayoutList',
            cor: '#64748B',
            eh_padrao: false,
        });
        setSaving(false);

        if (error) {
            Alert.alert('Erro', 'Não foi possível adicionar a categoria.');
        } else {
            setNewCategoryName('');
            Alert.alert('Sucesso', 'Categoria criada com sucesso!');
        }
    };

    const handleDelete = (id: string, nome: string) => {
        Alert.alert(
            'Remover Categoria',
            `Deseja realmente remover a categoria "${nome}"?\nOperação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await deleteCategory(id);
                        if (error) {
                            Alert.alert('Erro', 'Não foi possível remover a categoria.');
                        }
                    }
                }
            ]
        );
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.modalContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    {/* Cabeçalho */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Gerenciar Categorias</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={colors.textSubtle} />
                        </TouchableOpacity>
                    </View>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={{ flex: 1 }}
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            {/* Lista de Categorias Existentes */}
                            <Text style={styles.sectionTitle}>CATEGORIAS EXISTENTES</Text>
                            <View style={styles.listContainer}>
                                {categories.map(cat => (
                                    <View key={cat.id} style={styles.categoryItem}>
                                        <View style={styles.categoryInfo}>
                                            <View style={[styles.colorDot, { backgroundColor: cat.cor || colors.border }]} />
                                            <View>
                                                <Text style={styles.categoryName}>{cat.nome}</Text>
                                                <Text style={styles.categoryType}>
                                                    {cat.tipo === 'receita' ? 'Receita' : 'Despesa'} {cat.eh_padrao ? '(Padrão)' : ''}
                                                </Text>
                                            </View>
                                        </View>
                                        {!cat.eh_padrao && (
                                            <TouchableOpacity
                                                onPress={() => handleDelete(cat.id, cat.nome)}
                                                style={styles.deleteButton}
                                            >
                                                <Trash2 size={18} color={colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>

                            {/* Adicionar Nova Categoria */}
                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>ADICIONAR NOVA CATEGORIA</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nome</Text>
                                <TextInput
                                    style={styles.input}
                                    value={newCategoryName}
                                    onChangeText={setNewCategoryName}
                                    placeholder="Ex: Pets, Assinaturas, etc."
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Tipo</Text>
                                <View style={styles.typeSelectorContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            newCategoryType === 'despesa' && styles.typeButtonExpenseActive
                                        ]}
                                        onPress={() => setNewCategoryType('despesa')}
                                    >
                                        <Text
                                            style={[
                                                styles.typeButtonText,
                                                newCategoryType === 'despesa' && styles.typeButtonTextActive
                                            ]}
                                        >
                                            Despesa
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            newCategoryType === 'receita' && styles.typeButtonIncomeActive
                                        ]}
                                        onPress={() => setNewCategoryType('receita')}
                                    >
                                        <Text
                                            style={[
                                                styles.typeButtonText,
                                                newCategoryType === 'receita' && styles.typeButtonTextActive
                                            ]}
                                        >
                                            Receita
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </ScrollView>

                        {/* Botão Salvar (Adicionar) */}
                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={handleAddCategory}
                                disabled={saving}
                            >
                                {saving ? (
                                    <ActivityIndicator color={colors.background} />
                                ) : (
                                    <>
                                        <Plus size={20} color={colors.background} style={{ marginRight: 8 }} />
                                        <Text style={styles.saveButtonText}>Adicionar Categoria</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        minHeight: '75%',
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    scrollContent: {
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.textSubtle,
        marginBottom: 12,
    },
    listContainer: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoryInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
    },
    categoryType: {
        fontSize: 12,
        color: colors.textSubtle,
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: colors.error + '10',
        borderRadius: 8,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSubtle,
        marginBottom: 8,
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
    },
    typeSelectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 4,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
    },
    typeButtonExpenseActive: {
        backgroundColor: colors.error,
    },
    typeButtonIncomeActive: {
        backgroundColor: colors.success,
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.textSubtle,
    },
    typeButtonTextActive: {
        color: '#FFFFFF',
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    saveButton: {
        backgroundColor: colors.gold,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    saveButtonText: {
        color: colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
