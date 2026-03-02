import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Check, Mail, User } from 'lucide-react-native';
import colors from '../theme/colors';
import { useFamily } from '../context/FamilyContext';
import { Picker } from '@react-native-picker/picker';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function AddFamilyMemberModal({ isOpen, onClose }: Props) {
    const { inviteMember, addGhostMember } = useFamily();
    const [activeTab, setActiveTab] = useState<'email' | 'manual'>('email');
    const [loading, setLoading] = useState(false);

    // Email state
    const [email, setEmail] = useState('');

    // Manual state
    const [name, setName] = useState('');

    const handleInvite = async () => {
        if (activeTab === 'email') {
            if (!email.trim() || !email.includes('@')) {
                Alert.alert('Erro', 'Por favor, insira um e-mail válido.');
                return;
            }
            setLoading(true);
            try {
                await inviteMember(email.trim(), 'member');
                Alert.alert('Sucesso', 'Convite enviado (usuário adicionado)!');
                setEmail('');
                onClose();
            } catch (error: any) {
                Alert.alert('Erro', error.message || 'Erro ao convidar membro.');
            } finally {
                setLoading(false);
            }
        } else {
            if (!name.trim()) {
                Alert.alert('Erro', 'Por favor, insira o nome do membro.');
                return;
            }
            setLoading(true);
            try {
                await addGhostMember(name.trim(), 'member');
                Alert.alert('Sucesso', 'Membro adicionado manualmente!');
                setName('');
                onClose();
            } catch (error: any) {
                Alert.alert('Erro', error.message || 'Erro ao adicionar membro manualmente.');
            } finally {
                setLoading(false);
            }
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
                        <View>
                            <Text style={styles.modalTitle}>Adicionar Membro</Text>
                            <Text style={styles.modalSubtitle}>Convide alguém por e-mail ou adicione manualmente.</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'email' && styles.activeTab]}
                            onPress={() => setActiveTab('email')}
                        >
                            <Text style={[styles.tabText, activeTab === 'email' && styles.activeTabText]}>Por E-mail</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
                            onPress={() => setActiveTab('manual')}
                        >
                            <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>Manualmente</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {activeTab === 'email' ? (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>E-mail do Usuário</Text>
                                <View style={styles.inputContainer}>
                                    <Mail size={20} color={colors.textSubtle} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="exemplo@email.com"
                                        placeholderTextColor={colors.textSubtle}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                    />
                                </View>
                                <Text style={styles.helperText}>O usuário deve ter uma conta no aplicativo.</Text>
                            </View>
                        ) : (
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Nome do Membro (Sem Conta)</Text>
                                <View style={styles.inputContainer}>
                                    <User size={20} color={colors.textSubtle} style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Ex: Filho, Namorada"
                                        placeholderTextColor={colors.textSubtle}
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                                <Text style={styles.helperText}>Ideal para gerenciar contas de dependentes ou quem não usa o app.</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleInvite}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.textInverted} />
                            ) : (
                                <>
                                    <Check size={20} color={colors.textInverted} style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>
                                        {activeTab === 'email' ? 'Enviar Convite' : 'Adicionar Membro'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
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
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textSubtle,
        marginTop: 4,
        maxWidth: '90%',
    },
    closeBtn: {
        padding: 4,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    activeTabText: {
        color: colors.text,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 8,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        color: colors.text,
        fontSize: 16,
    },
    helperText: {
        fontSize: 12,
        color: colors.textSubtle,
        marginTop: 6,
    },
    saveButton: {
        flexDirection: 'row',
        backgroundColor: colors.gold,
        borderRadius: 16,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    saveButtonText: {
        color: colors.textInverted,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
