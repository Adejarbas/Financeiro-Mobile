/**
 * 🤖 FINANÇAS PRO GOLD - ASSISTANT SCREEN
 * Interface de Chat com IA com design Premium
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Send, Bot, ArrowLeft, Terminal, Trash2, HelpCircle, Sparkles } from 'lucide-react-native';
import { useFinance } from '../context/FinanceContext';
import colors from '../theme/colors';
import { ChatMessage } from '../types';

export default function AssistantScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { chatMessages, chatSystemLogs, sendMessage, clearChatHistory } = useFinance();
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    // Scroll to bottom ao receber mensagens
    useEffect(() => {
        if (chatMessages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [chatMessages]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        const text = inputText.trim();
        setInputText('');
        setSending(true);

        await sendMessage(text, 'user');
        setSending(false);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isUser = item.remetente === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.messageUser : styles.messageBot
            ]}>
                {!isUser && (
                    <View style={styles.botIcon}>
                        <Bot size={16} color={colors.textInverted} />
                    </View>
                )}
                <View style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleBot
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.textUser : styles.textBot
                    ]}>
                        {item.texto}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        isUser ? styles.timestampUser : styles.timestampBot
                    ]}>
                        {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerIconContainer}>
                        <Sparkles size={24} color={colors.gold} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Assistente IA</Text>
                        <Text style={styles.headerSubtitle}>Sempre disponível</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity onPress={() => setShowLogs(true)}>
                        <Terminal size={22} color={colors.textSubtle} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => sendMessage('ajuda', 'user')}>
                        <HelpCircle size={22} color={colors.textSubtle} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={clearChatHistory}>
                        <Trash2 size={22} color={colors.error} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                ref={flatListRef}
                data={chatMessages}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Bot size={48} color={colors.textSubtle} style={{ opacity: 0.5 }} />
                        <Text style={styles.emptyText}>Olá! Como posso ajudar com suas finanças hoje?</Text>
                    </View>
                }
            />

            {/* Command Pills */}
            <View style={styles.pillsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
                    {['/saldo', 'gastei 50 no mercado', 'recebi 100 de pix', 'extrato', 'ajuda'].map((pill, i) => (
                        <TouchableOpacity key={i} style={styles.pill} onPress={() => setInputText(pill)}>
                            <Text style={styles.pillText}>{pill}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite sua mensagem..."
                        placeholderTextColor={colors.textSubtle}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || sending}
                    >
                        {sending ? (
                            <ActivityIndicator color={colors.textInverted} size="small" />
                        ) : (
                            <Send size={20} color={colors.textInverted} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* System Logs Modal */}
            <Modal visible={showLogs} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowLogs(false)}>
                <View style={[styles.logsModalContainer, { paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}>
                    <View style={styles.logsHeader}>
                        <Text style={styles.logsTitle}>Histórico de Atividades</Text>
                        <TouchableOpacity onPress={() => setShowLogs(false)} style={styles.logsCloseButton}>
                            <Text style={styles.logsCloseText}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.logsScroll}>
                        {chatSystemLogs.map((log, i) => (
                            <View key={i} style={styles.logItem}>
                                <Text style={styles.logTime}>{log.time}</Text>
                                <Text style={[
                                    styles.logMessage,
                                    log.type === 'error' && { color: colors.error },
                                    log.type === 'success' && { color: colors.success }
                                ]}>
                                    {log.message}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.gold + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: colors.success,
    },
    chatContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
    },
    messageContainer: {
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'flex-end',
        maxWidth: '85%',
    },
    messageUser: {
        alignSelf: 'flex-end',
        flexDirection: 'row-reverse',
    },
    messageBot: {
        alignSelf: 'flex-start',
    },
    botIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    bubble: {
        padding: 12,
        borderRadius: 20,
        minWidth: 80,
    },
    bubbleUser: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleBot: {
        backgroundColor: colors.card,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textUser: {
        color: colors.textInverted,
    },
    textBot: {
        color: colors.text,
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timestampUser: {
        color: colors.textInverted + '80',
    },
    timestampBot: {
        color: colors.textSubtle,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: colors.textSubtle,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: colors.background,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
        color: colors.text,
        maxHeight: 100,
        marginRight: 10,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: colors.textSubtle,
        shadowOpacity: 0,
        elevation: 0,
    },
    pillsContainer: {
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingVertical: 8,
    },
    pillsScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    pill: {
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pillText: {
        color: colors.text,
        fontSize: 13,
    },
    logsModalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    logsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
    },
    logsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    logsCloseButton: {
        padding: 8,
    },
    logsCloseText: {
        color: colors.gold,
        fontWeight: 'bold',
        fontSize: 16,
    },
    logsScroll: {
        padding: 20,
    },
    logItem: {
        flexDirection: 'row',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    logTime: {
        color: colors.textSubtle,
        fontSize: 12,
        marginRight: 12,
        width: 60,
    },
    logMessage: {
        flex: 1,
        color: colors.text,
        fontSize: 14,
    }
});
