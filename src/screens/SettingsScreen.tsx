/**
 * ⚙️ FINANÇAS PRO GOLD - SETTINGS SCREEN
 * Configurações com UI Premium e Lucide Icons
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    Image,
    Modal,
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    User,
    LogOut,
    Moon,
    Bell,
    HelpCircle,
    ChevronRight,
    Eye,
    FileText,
    Edit2,
    DollarSign,
    Camera,
    Check
} from 'lucide-react-native';

import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import colors from '../theme/colors';

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const { user, userProfile, signOut, updateProfile } = useAuth();
    const { isDarkMode, toggleDarkMode, hideValues, toggleHideValues } = useFinance();

    // Estados de Interface - Notificações Avançadas
    const [notifPayment, setNotifPayment] = useState(true);
    const [notifTransactions, setNotifTransactions] = useState(true);
    const [notifReports, setNotifReports] = useState(false);
    const [notifTips, setNotifTips] = useState(true);

    // Estados - Edição de Perfil
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Estados - Moeda
    const [currency, setCurrency] = useState('BRL');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (userProfile) {
            setEditName(userProfile.nome || '');
            setCurrency(userProfile.moeda || 'BRL');
        }
    }, [userProfile]);

    const loadSettings = async () => {
        try {
            const prefs = await AsyncStorage.getItem('@financas_pro:notifications_prefs');

            if (prefs) {
                const parsedPrefs = JSON.parse(prefs);
                setNotifPayment(parsedPrefs.notifPayment ?? true);
                setNotifTransactions(parsedPrefs.notifTransactions ?? true);
                setNotifReports(parsedPrefs.notifReports ?? false);
                setNotifTips(parsedPrefs.notifTips ?? true);
            }
        } catch (e) { console.error(e); }
    };

    const saveNotificationPrefs = async (newPrefs: any) => {
        try {
            const currentPrefs = {
                notifPayment, notifTransactions, notifReports, notifTips, ...newPrefs
            };
            await AsyncStorage.setItem('@financas_pro:notifications_prefs', JSON.stringify(currentPrefs));
        } catch (e) { console.error('Error saving notifs', e); }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sair da Conta',
            'Deseja realmente desconectar?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: () => signOut()
                }
            ]
        );
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert('Erro', 'O nome não pode estar vazio.');
            return;
        }

        setIsSaving(true);
        const { error } = await updateProfile({ nome: editName.trim() });
        setIsSaving(false);

        if (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
        } else {
            setIsEditModalVisible(false);
        }
    };

    const handleCurrencyChange = async (val: string) => {
        setCurrency(val);
        const { error } = await updateProfile({ moeda: val });
        if (error) {
            Alert.alert('Erro', 'Falha ao sincronizar moeda.');
        }
    };

    const pickImage = async () => {
        // Pedir permissão
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permissão Recusada", "Você recusou a permissão para acessar suas fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true, // Requerido para upload sem bucket no momento, ou para bucket via URI
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            uploadAvatar(asset.uri, asset.base64);
        }
    };

    const uploadAvatar = async (uri: string, base64?: string | null) => {
        try {
            // Se estivermos usando Base64 diretamente (como no Web):
            if (base64) {
                const imageUrl = `data:image/jpeg;base64,${base64}`;
                const { error } = await updateProfile({ avatar_url: imageUrl });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Upload Error:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a foto.');
        }
    };

    const SettingItem = ({
        icon: Icon,
        label,
        value,
        onValueChange,
        type = 'switch',
        color = colors.gold
    }: {
        icon: any, label: string, value?: boolean, onValueChange?: (val: boolean) => void, type?: 'switch' | 'arrow', color?: string
    }) => (
        <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                    <Icon size={20} color={color} />
                </View>
                <Text style={styles.settingLabel}>{label}</Text>
            </View>
            {type === 'switch' ? (
                <Switch
                    trackColor={{ false: colors.border, true: colors.gold }}
                    thumbColor={colors.textInverted}
                    ios_backgroundColor={colors.border}
                    onValueChange={onValueChange}
                    value={value}
                />
            ) : (
                <ChevronRight size={20} color={colors.textSubtle} />
            )}
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Configurações</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Perfil */}
                <View style={styles.profileCard}>
                    <TouchableOpacity style={styles.avatarContainer} onPress={pickImage} activeOpacity={0.8}>
                        {userProfile?.avatar_url ? (
                            <Image
                                source={{ uri: userProfile.avatar_url }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {userProfile?.nome?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.editAvatarBadge}>
                            <Camera size={12} color={colors.background} />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.profileInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {userProfile?.nome || 'Investidor'}
                        </Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{userProfile?.email || user?.email}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>PRO GOLD</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => setIsEditModalVisible(true)}
                    >
                        <Edit2 size={20} color={colors.gold} />
                    </TouchableOpacity>
                </View>

                {/* Preferências Globais */}
                <Text style={styles.sectionTitle}>Geral</Text>
                <View style={styles.sectionCard}>
                    <SettingItem icon={Moon} label="Modo Escuro (Padrão)" value={isDarkMode} onValueChange={toggleDarkMode} />
                    <View style={styles.divider} />
                    <SettingItem icon={Eye} label="Mascarar Valores" value={hideValues} onValueChange={toggleHideValues} />
                    <View style={styles.divider} />

                    {/* Currency Selector */}
                    <View style={styles.settingItem}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconContainer, { backgroundColor: colors.success + '15' }]}>
                                <DollarSign size={20} color={colors.success} />
                            </View>
                            <Text style={styles.settingLabel}>Moeda Principal</Text>
                        </View>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={currency}
                                style={styles.picker}
                                onValueChange={(itemValue) => handleCurrencyChange(itemValue)}
                                dropdownIconColor={colors.gold}
                            >
                                <Picker.Item label="BRL (R$)" value="BRL" color={colors.text} />
                                <Picker.Item label="USD ($)" value="USD" color={colors.text} />
                                <Picker.Item label="EUR (€)" value="EUR" color={colors.text} />
                            </Picker>
                        </View>
                    </View>
                </View>

                {/* Notificações Detalhadas */}
                <Text style={styles.sectionTitle}>Notificações</Text>
                <View style={styles.sectionCard}>
                    <SettingItem
                        icon={Bell}
                        label="Alertas de Pagamento"
                        value={notifPayment}
                        onValueChange={(val) => { setNotifPayment(val); saveNotificationPrefs({ notifPayment: val }); }}
                        color={colors.primary}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon={Bell}
                        label="Novas Transações"
                        value={notifTransactions}
                        onValueChange={(val) => { setNotifTransactions(val); saveNotificationPrefs({ notifTransactions: val }); }}
                        color={colors.success}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon={Bell}
                        label="Relatórios Semanais"
                        value={notifReports}
                        onValueChange={(val) => { setNotifReports(val); saveNotificationPrefs({ notifReports: val }); }}
                        color={colors.purple}
                    />
                    <View style={styles.divider} />
                    <SettingItem
                        icon={Bell}
                        label="Dicas de Economia"
                        value={notifTips}
                        onValueChange={(val) => { setNotifTips(val); saveNotificationPrefs({ notifTips: val }); }}
                        color={colors.gold}
                    />
                </View>

                {/* Suporte */}
                <Text style={styles.sectionTitle}>Suporte</Text>
                <View style={styles.sectionCard}>
                    <TouchableOpacity style={styles.touchableItem}>
                        <SettingItem icon={HelpCircle} label="Central de Ajuda" type="arrow" color={colors.purple} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.touchableItem}>
                        <SettingItem icon={FileText} label="Termos e Privacidade" type="arrow" color={colors.purple} />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
                    <LogOut size={20} color={colors.error} style={{ marginRight: 12 }} />
                    <Text style={styles.logoutText}>Encerrar Sessão</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Versão 2.1.0 (Build 2026)</Text>
                <View style={{ height: 40 }} />

            </ScrollView>

            {/* Modal de Edição de Nome */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Editar Perfil</Text>

                        <Text style={styles.modalLabel}>Seu Nome</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nome de Exibição"
                            placeholderTextColor={colors.textSubtle}
                            autoCapitalize="words"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonCancel]}
                                onPress={() => setIsEditModalVisible(false)}
                                disabled={isSaving}
                            >
                                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSave]}
                                onPress={handleSaveProfile}
                                disabled={isSaving}
                            >
                                <Check size={16} color={colors.background} style={{ marginRight: 8 }} />
                                <Text style={styles.modalButtonSaveText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        paddingTop: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: colors.card,
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    avatarImage: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: colors.gold,
    },
    editAvatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.gold,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.card,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.textInverted,
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: colors.textSubtle,
        marginBottom: 8,
    },
    badge: {
        backgroundColor: colors.gold + '20',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: colors.gold + '40',
    },
    badgeText: {
        color: colors.gold,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    editButton: {
        padding: 8,
        backgroundColor: colors.gold + '15',
        borderRadius: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSubtle,
        marginBottom: 12,
        marginLeft: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    touchableItem: {
        // Wrapper para touch
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginLeft: 68,
    },
    pickerContainer: {
        width: 130,   // Largura fixa para caber BRL (R$)
        justifyContent: 'center',
    },
    picker: {
        width: '100%',
        color: colors.gold,
        backgroundColor: 'transparent',
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: colors.error + '10',
        padding: 16,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    logoutText: {
        color: colors.error,
        fontSize: 16,
        fontWeight: 'bold',
    },
    versionText: {
        textAlign: 'center',
        color: colors.textSubtle,
        fontSize: 12,
        opacity: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 14,
        color: colors.textSubtle,
        marginBottom: 8,
    },
    modalInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        padding: 16,
        color: colors.text,
        fontSize: 16,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    modalButtonCancel: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalButtonSave: {
        backgroundColor: colors.gold,
    },
    modalButtonCancelText: {
        color: colors.text,
        fontWeight: '600',
    },
    modalButtonSaveText: {
        color: colors.background,
        fontWeight: 'bold',
    }
});
