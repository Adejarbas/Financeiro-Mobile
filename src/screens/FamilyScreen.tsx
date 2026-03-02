import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    TextInput,
    Platform
} from 'react-native';
import {
    Users,
    Plus,
    FileText,
    Info,
    CheckCircle2,
    Clock,
    UserPlus,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    Calendar
} from 'lucide-react-native';
import colors from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { calculateSettlements } from '../utils/familyUtils';
import { generateFamilyReportPDF } from '../utils/familyPdfUtils';
import { formatMonthKey } from '../utils/currencyUtils';

// Modals
import { AddFamilyMemberModal } from '../components/AddFamilyMemberModal';
import { SharedExpenseModal } from '../components/SharedExpenseModal';
import { EditExpenseModal } from '../components/EditExpenseModal';
import { SharedExpense } from '../types';

export default function FamilyScreen() {
    const { user } = useAuth();
    const {
        group,
        expenses,
        loading,
        refreshing,
        refreshData,
        createGroup,
        addExpense,
        updateExpense,
        deleteExpense,
        settleDebt,
        payExpense,
        settleAllDebts
    } = useFamily();

    // Modals state
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isSharedExpenseModalOpen, setIsSharedExpenseModalOpen] = useState(false);
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SharedExpense | null>(null);

    // Group creation state
    const [newGroupName, setNewGroupName] = useState('');

    const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const settlements = useMemo(() => {
        if (!group) return [];
        return calculateSettlements(expenses, group.members);
    }, [expenses, group]);

    // Month filter state
    const [selectedMonthDate, setSelectedMonthDate] = useState(new Date());

    const selectedMonthKey = useMemo(() => {
        return `${selectedMonthDate.getFullYear()}-${String(selectedMonthDate.getMonth() + 1).padStart(2, '0')}`;
    }, [selectedMonthDate]);

    const formattedSelectedMonthName = useMemo(() => {
        const month = selectedMonthDate.toLocaleString('pt-BR', { month: 'short' });
        const year = selectedMonthDate.getFullYear();
        if (year === new Date().getFullYear()) {
            return month.charAt(0).toUpperCase() + month.slice(1).replace('.', '');
        }
        return `${month.charAt(0).toUpperCase() + month.slice(1).replace('.', '')} ${year}`;
    }, [selectedMonthDate]);

    // Generate month options for modal (last 6 months, current, next 6)
    const monthOptions = useMemo(() => {
        const list = [];
        const today = new Date();
        for (let i = -12; i <= 12; i++) {
            list.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        return list;
    }, []);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e => e.date.startsWith(selectedMonthKey));
    }, [expenses, selectedMonthKey]);

    const totalSpentThisMonth = useMemo(() => {
        return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }, [filteredExpenses]);

    const totalPending = useMemo(() => {
        return expenses
            .filter(e => e.status === 'pending' || e.status === 'open')
            .reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            Alert.alert('Erro', 'O nome do grupo não pode estar vazio.');
            return;
        }
        await createGroup(newGroupName.trim(), 'Nosso grupo familiar');
    };

    const handleExportPDF = async () => {
        if (!group) return;
        const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        await generateFamilyReportPDF(group, expenses, settlements, currentMonth);
    };

    const showHowItWorks = () => {
        Alert.alert(
            'Como funciona',
            '1. Convide membros para seu grupo (podem ter conta no app ou não).\n' +
            '2. Adicione despesas e divida igualmente ou com valores personalizados.\n' +
            '3. O app calcula automaticamente quem deve a quem.\n' +
            '4. Gere relatórios em PDF para acompanhamento mensal.',
            [{ text: 'Entendi' }]
        );
    };

    const getMemberName = (id: string) => group?.members.find(m => m.id === id)?.name || 'Desconhecido';
    const getMemberAvatar = (id: string) => group?.members.find(m => m.id === id)?.avatarUrl || `https://ui-avatars.com/api/?name=User&background=random&color=fff`;

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.gold} />
            </SafeAreaView>
        );
    }

    if (!group) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.emptyGroupContainer}>
                    <Users size={64} color={colors.gold} />
                    <Text style={styles.emptyTitle}>Plano Gold - Família</Text>
                    <Text style={styles.emptySubtitle}>
                        Crie um grupo familiar para compartilhar despesas, dividir contas e controlar quem deve a quem automaticamente.
                    </Text>

                    <View style={styles.createGroupForm}>
                        <Text style={styles.label}>Nome do Grupo Familiar</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Família Silva"
                            placeholderTextColor={colors.textSubtle}
                            value={newGroupName}
                            onChangeText={setNewGroupName}
                        />
                        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateGroup}>
                            <Text style={styles.primaryButtonText}>Criar Grupo</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{group.name}</Text>
                    <Text style={styles.headerSubtitle}>{group.members.length} membros</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={showHowItWorks}>
                        <Info size={24} color={colors.textSubtle} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleExportPDF}>
                        <FileText size={24} color={colors.gold} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Horizontal Member List */}
                <View style={styles.membersSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.membersScroll}>
                        <TouchableOpacity style={styles.addMemberBtn} onPress={() => setIsAddMemberModalOpen(true)}>
                            <View style={styles.addMemberIconContainer}>
                                <Plus size={24} color={colors.gold} />
                            </View>
                            <Text style={styles.memberText}>Adicionar</Text>
                        </TouchableOpacity>

                        {group.members.map(member => (
                            <View key={member.id} style={styles.memberAvatarContainer}>
                                <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
                                {member.role === 'owner' && (
                                    <View style={styles.badgeOwner}>
                                        <Text style={styles.badgeText}>Admin</Text>
                                    </View>
                                )}
                                {!member.userId && (
                                    <View style={styles.badgeGhost}>
                                        <Text style={styles.badgeText}>Sem App</Text>
                                    </View>
                                )}
                                <Text style={styles.memberText} numberOfLines={1}>
                                    {member.userId === user?.id ? 'Você' : member.name.split(' ')[0]}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryCardHeader}>
                            <TrendingDown size={18} color={colors.error} />
                            <Text style={styles.summaryCardLabel}>Total Pendente</Text>
                        </View>
                        <Text style={[styles.summaryCardValue, { color: colors.error }]}>{formatCurrency(totalPending)}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <View style={[styles.summaryCardHeader, { justifyContent: 'space-between', alignItems: 'center' }]}>
                            <Text style={styles.summaryCardLabel} numberOfLines={1}>Neste Mês</Text>

                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.cardHover, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                                onPress={() => setIsMonthPickerOpen(true)}
                            >
                                <Calendar size={12} color={colors.gold} />
                                <Text style={{ color: colors.gold, fontSize: 11, fontWeight: 'bold' }}>
                                    {formattedSelectedMonthName}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.summaryCardValue}>{formatCurrency(totalSpentThisMonth)}</Text>
                    </View>
                </View>

                {/* Settlements / Acerto de Contas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acertos Pendentes</Text>
                    {settlements.length === 0 ? (
                        <View style={styles.emptyState}>
                            <CheckCircle2 size={48} color={colors.success} style={{ opacity: 0.5 }} />
                            <Text style={styles.emptyStateText}>Tudo certo! Ninguém deve a ninguém.</Text>
                        </View>
                    ) : (
                        settlements.map((s, idx) => (
                            <View key={idx} style={styles.settlementCard}>
                                <View style={styles.settlementInfo}>
                                    <View style={styles.settlementRow}>
                                        <Image source={{ uri: getMemberAvatar(s.from) }} style={styles.settlementAvatar} />
                                        <Text style={styles.settlementName} numberOfLines={2} ellipsizeMode="tail">{getMemberName(s.from)}</Text>
                                    </View>
                                    <ArrowRight size={20} color={colors.textSubtle} style={{ marginHorizontal: 8 }} />
                                    <View style={styles.settlementRow}>
                                        <Image source={{ uri: getMemberAvatar(s.to) }} style={styles.settlementAvatar} />
                                        <Text style={styles.settlementName} numberOfLines={2} ellipsizeMode="tail">{getMemberName(s.to)}</Text>
                                    </View>
                                </View>
                                <View style={styles.settlementRight}>
                                    <Text style={styles.settlementAmount}>{formatCurrency(s.amount)}</Text>
                                    <TouchableOpacity
                                        style={styles.settleBtn}
                                        onPress={() => {
                                            Alert.alert(
                                                'Confirmar Pagamento',
                                                `Você confirma que ${getMemberName(s.from)} pagou R$ ${s.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${getMemberName(s.to)}?`,
                                                [
                                                    { text: 'Cancelar', style: 'cancel' },
                                                    { text: 'Confirmar', onPress: () => settleAllDebts(s.from, s.to) }
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={styles.settleBtnText}>Dar Baixa</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Expenses List */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Despesas Compartilhadas</Text>
                        <TouchableOpacity onPress={refreshData}>
                            <Text style={styles.refreshBtn}>Atualizar</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredExpenses.length === 0 ? (
                        <View style={styles.emptyState}>
                            <FileText size={48} color={colors.textSubtle} style={{ opacity: 0.5 }} />
                            <Text style={styles.emptyStateText}>Nenhuma despesa para este mês.</Text>
                        </View>
                    ) : (
                        filteredExpenses.map(exp => (
                            <TouchableOpacity
                                key={exp.id}
                                style={styles.expenseCard}
                                onPress={() => setExpenseToEdit(exp)}
                            >
                                <View style={styles.expenseHeader}>
                                    <View style={styles.expenseMainInfo}>
                                        <View style={[styles.statusDot,
                                        {
                                            backgroundColor: exp.status === 'settled' ? colors.success :
                                                (exp.status === 'open' ? colors.warning : colors.error)
                                        }]} />
                                        <Text style={styles.expenseDesc}>{exp.description}</Text>
                                    </View>
                                    <Text style={styles.expenseAmount}>{formatCurrency(exp.amount)}</Text>
                                </View>

                                <View style={styles.expenseFooter}>
                                    <Text style={styles.expenseDate}>
                                        {new Date(exp.date).toLocaleDateString('pt-BR')} • {exp.category}
                                    </Text>
                                    <Text style={styles.expensePayer}>
                                        {exp.status === 'open' ? 'Vai pagar' : 'Pago por'}: {getMemberName(exp.paidBy)}
                                    </Text>
                                </View>

                                {exp.status !== 'settled' && (
                                    <View style={styles.expenseActions}>
                                        <TouchableOpacity
                                            style={styles.actionBtnOutline}
                                            onPress={() => payExpense(exp.id, group.members.find(m => m.userId === user?.id)?.id || '')}
                                        >
                                            <Text style={styles.actionBtnText}>Marcar como Pago</Text>
                                        </TouchableOpacity>
                                        {exp.status === 'pending' && (
                                            <TouchableOpacity
                                                style={styles.actionBtnFill}
                                                onPress={() => settleDebt(exp.id)}
                                            >
                                                <Text style={styles.actionBtnFillText}>Quitar</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsSharedExpenseModalOpen(true)}
            >
                <Plus size={24} color="#000" />
                <Text style={styles.fabText}>Despesa</Text>
            </TouchableOpacity>

            <AddFamilyMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
            />

            <SharedExpenseModal
                isOpen={isSharedExpenseModalOpen}
                onClose={() => setIsSharedExpenseModalOpen(false)}
                members={group.members}
                groupId={group.id}
                onSave={addExpense}
            />

            <EditExpenseModal
                isOpen={!!expenseToEdit}
                onClose={() => setExpenseToEdit(null)}
                members={group.members}
                expense={expenseToEdit}
                onSave={async (exp) => {
                    await updateExpense(exp.id, exp);
                }}
                onDelete={async (id) => {
                    await deleteExpense(id);
                    setExpenseToEdit(null);
                }}
            />

            {/* Custom Month Picker Modal */}
            {isMonthPickerOpen && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end', zIndex: 9999 }]}>
                    <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, maxHeight: '60%' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Selecione o Mês</Text>
                            <TouchableOpacity onPress={() => setIsMonthPickerOpen(false)}>
                                <Text style={{ color: colors.textSubtle, fontSize: 16 }}>Fechar</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {monthOptions.map((date, idx) => {
                                const isSelected = date.getFullYear() === selectedMonthDate.getFullYear() && date.getMonth() === selectedMonthDate.getMonth();
                                const m = date.toLocaleString('pt-BR', { month: 'long' });
                                const label = `${m.charAt(0).toUpperCase() + m.slice(1)} ${date.getFullYear()}`;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                        onPress={() => {
                                            setSelectedMonthDate(date);
                                            setIsMonthPickerOpen(false);
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: isSelected ? colors.gold : colors.text, fontWeight: isSelected ? 'bold' : 'normal' }}>
                                            {label}
                                        </Text>
                                        {isSelected && <CheckCircle2 size={20} color={colors.gold} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </View>
            )}
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        paddingBottom: 20,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 14,
        color: colors.textSubtle,
        marginTop: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBtn: {
        padding: 4,
    },
    membersSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    membersScroll: {
        paddingRight: 20,
        gap: 16,
    },
    addMemberBtn: {
        alignItems: 'center',
        marginRight: 8,
    },
    addMemberIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.gold,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberAvatarContainer: {
        alignItems: 'center',
        position: 'relative',
        width: 64,
        marginRight: 8,
    },
    memberAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: colors.border,
        marginBottom: 8,
    },
    memberText: {
        fontSize: 12,
        color: colors.text,
        textAlign: 'center',
    },
    badgeOwner: {
        position: 'absolute',
        top: -4,
        right: 0,
        backgroundColor: colors.gold,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 1,
    },
    badgeGhost: {
        position: 'absolute',
        top: -4,
        right: 0,
        backgroundColor: colors.cardHover,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        zIndex: 1,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#000',
    },
    summaryGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    summaryCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    summaryCardLabel: {
        fontSize: 13,
        color: colors.textSubtle,
        fontWeight: '600',
    },
    summaryCardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    refreshBtn: {
        color: colors.gold,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        borderStyle: 'dashed',
    },
    emptyStateText: {
        marginTop: 12,
        color: colors.textSubtle,
        fontSize: 14,
    },
    settlementCard: {
        backgroundColor: colors.cardHover,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.error + '30',
        minHeight: 110,
    },
    settlementInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settlementRow: {
        alignItems: 'center',
        flex: 1,
    },
    settlementAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginBottom: 4,
    },
    settlementName: {
        fontSize: 12,
        color: colors.textSubtle,
        textAlign: 'center',
        minHeight: 32,
    },
    settlementRight: {
        alignItems: 'flex-end',
    },
    settlementAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: 8,
    },
    settleBtn: {
        backgroundColor: colors.success + '20',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    settleBtnText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: 'bold',
    },
    expenseCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    expenseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    expenseMainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    expenseDesc: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
    expenseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expenseDate: {
        fontSize: 12,
        color: colors.textSubtle,
    },
    expensePayer: {
        fontSize: 12,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    expenseActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    actionBtnOutline: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    actionBtnText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    actionBtnFill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.success,
    },
    actionBtnFillText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 100 : 80,
        right: 20,
        backgroundColor: colors.gold,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 28,
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 8,
    },
    fabText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyGroupContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: 24,
        marginBottom: 12,
    },
    emptySubtitle: {
        fontSize: 16,
        color: colors.textSubtle,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    createGroupForm: {
        width: '100%',
        backgroundColor: colors.card,
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
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
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: colors.gold,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
