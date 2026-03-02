/**
 * 🔐 FINANÇAS PRO - LOGIN SCREEN
 * Design System alinhado com o Web
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, User, Eye, EyeOff, TrendingUp } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import colors from '../theme/colors';

// ─── Cores do web ───────────────────────────────────────────
const TEAL = colors.teal;        // #0D9488
const TEAL_BORDER = 'rgba(13, 148, 136, 0.5)';

type Mode = 'login' | 'register' | 'forgot';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { signIn, signUp } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [loading, setLoading] = useState(false);

    // ─── Login form ───────────────────────────────────────────
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLogin, setShowLogin] = useState(false);

    // ─── Register form ────────────────────────────────────────
    const [regName, setRegName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPass, setRegPass] = useState('');
    const [regConfirm, setRegConfirm] = useState('');
    const [showRegPass, setShowRegPass] = useState(false);
    const [showRegConf, setShowRegConf] = useState(false);

    // ─── Forgot form ──────────────────────────────────────────
    const [forgotEmail, setForgotEmail] = useState('');

    // ─── Handlers ─────────────────────────────────────────────
    async function handleLogin() {
        if (!loginEmail || !loginPassword) {
            Alert.alert('Atenção', 'Preencha todos os campos');
            return;
        }
        setLoading(true);
        try {
            const { error } = await signIn(loginEmail, loginPassword);
            if (error) Alert.alert('Erro no Login', error.message);
        } catch {
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRegister() {
        if (!regName || !regEmail || !regPass || !regConfirm) {
            Alert.alert('Atenção', 'Preencha todos os campos');
            return;
        }
        if (regPass !== regConfirm) {
            Alert.alert('Atenção', 'As senhas não coincidem!');
            return;
        }
        if (regPass.length < 6) {
            Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres!');
            return;
        }
        setLoading(true);
        try {
            const { error } = await signUp(regEmail, regPass, regName);
            if (error) {
                Alert.alert('Erro no Cadastro', error.message);
            } else {
                Alert.alert(
                    'Conta criada!',
                    'Faça login para continuar.',
                    [{ text: 'OK', onPress: () => setMode('login') }]
                );
            }
        } catch {
            Alert.alert('Erro', 'Ocorreu um erro inesperado.');
        } finally {
            setLoading(false);
        }
    }

    async function handleForgot() {
        if (!forgotEmail) {
            Alert.alert('Atenção', 'Informe seu e-mail cadastrado');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
            if (error) throw error;
            Alert.alert(
                'E-mail enviado',
                'Se este e-mail estiver cadastrado, você receberá as instruções.',
                [{ text: 'OK', onPress: () => { setMode('login'); setForgotEmail(''); } }]
            );
        } catch (e: any) {
            Alert.alert('Erro', e.message || 'Não foi possível enviar o e-mail.');
        } finally {
            setLoading(false);
        }
    }

    // ─── Render ───────────────────────────────────────────────
    return (
        <View style={styles.root}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── Logo ── */}
                    <View style={styles.logoContainer}>
                        <View style={styles.iconBg}>
                            <TrendingUp size={34} color={TEAL} />
                        </View>
                        <Text style={styles.appName}>Finanças Pro</Text>
                        <Text style={styles.tagline}>
                            {mode === 'forgot'
                                ? 'Insira seu e-mail para receber o link'
                                : 'Acesse sua conta para continuar'}
                        </Text>
                    </View>

                    {/* ── Card ── */}
                    <View style={styles.card}>

                        {/* ── Tabs (oculto no forgot) ── */}
                        {mode !== 'forgot' && (
                            <View style={styles.tabs}>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'login' && styles.tabActive]}
                                    onPress={() => setMode('login')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                                        Entrar
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'register' && styles.tabActive]}
                                    onPress={() => setMode('register')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                                        Criar conta
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ══════════ LOGIN ══════════ */}
                        {mode === 'login' && (
                            <View>
                                <InputField
                                    icon={<User size={18} color={colors.textMuted} />}
                                    placeholder="Seu e-mail"
                                    value={loginEmail}
                                    onChangeText={setLoginEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <InputField
                                    icon={<Lock size={18} color={colors.textMuted} />}
                                    placeholder="Sua senha"
                                    value={loginPassword}
                                    onChangeText={setLoginPassword}
                                    secure
                                    showSecure={showLogin}
                                    onToggleSecure={() => setShowLogin(v => !v)}
                                />
                                <TouchableOpacity
                                    style={styles.forgotLink}
                                    onPress={() => setMode('forgot')}
                                >
                                    <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                                </TouchableOpacity>

                                <ActionButton
                                    label="Entrar"
                                    onPress={handleLogin}
                                    loading={loading}
                                />
                            </View>
                        )}

                        {/* ══════════ CADASTRO ══════════ */}
                        {mode === 'register' && (
                            <View>
                                <InputField
                                    icon={<User size={18} color={colors.textMuted} />}
                                    placeholder="Nome completo"
                                    value={regName}
                                    onChangeText={setRegName}
                                />
                                <InputField
                                    icon={<Mail size={18} color={colors.textMuted} />}
                                    placeholder="E-mail"
                                    value={regEmail}
                                    onChangeText={setRegEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <InputField
                                    icon={<Lock size={18} color={colors.textMuted} />}
                                    placeholder="Senha"
                                    value={regPass}
                                    onChangeText={setRegPass}
                                    secure
                                    showSecure={showRegPass}
                                    onToggleSecure={() => setShowRegPass(v => !v)}
                                />
                                <InputField
                                    icon={<Lock size={18} color={colors.textMuted} />}
                                    placeholder="Confirmar senha"
                                    value={regConfirm}
                                    onChangeText={setRegConfirm}
                                    secure
                                    showSecure={showRegConf}
                                    onToggleSecure={() => setShowRegConf(v => !v)}
                                />
                                <ActionButton
                                    label="Criar Conta"
                                    onPress={handleRegister}
                                    loading={loading}
                                />
                            </View>
                        )}

                        {/* ══════════ RECUPERAR SENHA ══════════ */}
                        {mode === 'forgot' && (
                            <View>
                                <Text style={styles.forgotTitle}>Recuperar Senha</Text>
                                <InputField
                                    icon={<Mail size={18} color={colors.textMuted} />}
                                    placeholder="Digite seu e-mail cadastrado"
                                    value={forgotEmail}
                                    onChangeText={setForgotEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                                <ActionButton
                                    label="Enviar Link de Recuperação"
                                    onPress={handleForgot}
                                    loading={loading}
                                />
                                <TouchableOpacity
                                    style={styles.backLink}
                                    onPress={() => setMode('login')}
                                >
                                    <Text style={styles.backLinkText}>← Voltar para o Login</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                    </View>

                    {/* ── Footer ── */}
                    {mode !== 'forgot' && (
                        <TouchableOpacity
                            style={styles.toggleBtn}
                            onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
                        >
                            <Text style={styles.toggleTxt}>
                                {mode === 'login' ? 'Ainda não é membro? ' : 'Já possui conta? '}
                                <Text style={styles.toggleHighlight}>
                                    {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
                                </Text>
                            </Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

interface InputFieldProps {
    icon: React.ReactNode;
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    secure?: boolean;
    showSecure?: boolean;
    onToggleSecure?: () => void;
    keyboardType?: any;
    autoCapitalize?: any;
}

function InputField({
    icon, placeholder, value, onChangeText,
    secure, showSecure, onToggleSecure,
    keyboardType, autoCapitalize,
}: InputFieldProps) {
    return (
        <View style={inputStyles.container}>
            <View style={inputStyles.icon}>{icon}</View>
            <TextInput
                style={inputStyles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secure && !showSecure}
                keyboardType={keyboardType}
                autoCapitalize={autoCapitalize ?? 'sentences'}
            />
            {secure && (
                <TouchableOpacity onPress={onToggleSecure} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    {showSecure
                        ? <EyeOff size={18} color={colors.textMuted} />
                        : <Eye size={18} color={colors.textMuted} />
                    }
                </TouchableOpacity>
            )}
        </View>
    );
}

interface ActionButtonProps {
    label: string;
    onPress: () => void;
    loading: boolean;
}

function ActionButton({ label, onPress, loading }: ActionButtonProps) {
    return (
        <TouchableOpacity
            style={[btnStyles.btn, loading && btnStyles.disabled]}
            onPress={onPress}
            disabled={loading}
            activeOpacity={0.85}
        >
            {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={btnStyles.text}>{label}</Text>
            }
        </TouchableOpacity>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000',
    },
    keyboardView: { flex: 1 },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    // Logo
    logoContainer: {
        alignItems: 'center',
        marginBottom: 28,
    },
    iconBg: {
        width: 68,
        height: 68,
        borderRadius: 20,
        backgroundColor: 'rgba(13, 148, 136, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(13, 148, 136, 0.4)',
    },
    appName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.4,
    },
    tagline: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 26,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    // Tabs
    tabs: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 14,
        padding: 4,
        marginBottom: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 11,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: TEAL,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabTextActive: {
        color: '#fff',
    },
    // Forgot / back
    forgotLink: {
        alignSelf: 'flex-end',
        marginBottom: 14,
        marginTop: -4,
    },
    forgotText: {
        color: colors.textMuted,
        fontSize: 13,
    },
    forgotTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    backLink: {
        alignItems: 'center',
        marginTop: 16,
    },
    backLinkText: {
        color: colors.textMuted,
        fontSize: 14,
    },
    // Footer
    toggleBtn: {
        marginTop: 24,
        alignItems: 'center',
    },
    toggleTxt: {
        color: colors.textMuted,
        fontSize: 14,
    },
    toggleHighlight: {
        color: TEAL,
        fontWeight: 'bold',
    },
});

const inputStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(13, 148, 136, 0.25)',
        paddingHorizontal: 14,
        height: 54,
        marginBottom: 14,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
    },
});

const btnStyles = StyleSheet.create({
    btn: {
        backgroundColor: TEAL,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        shadowColor: TEAL,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    disabled: {
        opacity: 0.55,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
});
