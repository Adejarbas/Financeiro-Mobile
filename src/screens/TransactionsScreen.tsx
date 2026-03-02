/**
 * 📄 FINANÇAS PRO GOLD - TRANSACTIONS SCREEN
 * Extrato completo com Design Premium e Lucide Icons
 */

import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SectionList,
    RefreshControl,
    Alert,
    Modal,
    ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {

    ChevronLeft,
    ChevronRight,
    Filter,
    Receipt,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Trash2,
    Search,
    HelpCircle,
    Download,
    CalendarDays,
    X,
    Sun,
    Moon,
    Eye,
    EyeOff,
    TrendingUp,
    CreditCard,
    Briefcase,
    Building,
    Home,
    ShoppingBag,
    Car,
    Coffee,
    Activity,
    Book,
    Gift,
    Heart,
    Smartphone,
    LayoutList
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

import { useFinance } from '../context/FinanceContext';
import { getColors } from '../theme/colors';
import { formatCurrency, formatDate } from '../utils/currencyUtils';
import { TransacaoComRelacoes } from '../types';
import TransactionModal from '../components/TransactionModal';
import CategoryModal from '../components/CategoryModal';

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const { transactions, categories, accounts, loading, refreshing, refreshData, deleteTransaction, isDarkMode, toggleDarkMode, hideValues, toggleHideValues } = useFinance();

    const colors = useMemo(() => getColors(isDarkMode), [isDarkMode]);
    const styles = useMemo(() => getStyles(colors), [colors]);

    // Filtros
    const [currentDate, setCurrentDate] = useState(new Date());
    const [filterType, setFilterType] = useState<'all' | 'receita' | 'despesa'>('all');

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<TransacaoComRelacoes | null>(null);

    // Navegação de Período e Filtros Avançados
    const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterAccount, setFilterAccount] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);

    // Navegação de Mês
    const prevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const nextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const currentMonthLabel = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // Filtragem e Agrupamento
    const filteredData = useMemo(() => {
        let data = transactions.filter(tx => {
            const isTypeMatch = filterType === 'all' || tx.tipo === filterType;
            const isCatMatch = filterCategory === 'all' || tx.categoria_id === filterCategory;
            const isAccMatch = filterAccount === 'all' || tx.conta_id === filterAccount;

            return isTypeMatch && isCatMatch && isAccMatch;
        });

        // Ordenação
        data.sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime();
            if (sortBy === 'date-asc') return new Date(a.data_transacao).getTime() - new Date(b.data_transacao).getTime();
            if (sortBy === 'amount-desc') return b.valor - a.valor;
            if (sortBy === 'amount-asc') return a.valor - b.valor;
            return 0;
        });

        return data;
    }, [transactions, filterType, filterCategory, filterAccount, sortBy]);

    // Reseta paginação quando os filtros mudam
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterType, filterCategory, filterAccount, sortBy]);

    // Dados Paginados
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    // Calcular Totais do Mês
    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, curr) => {
                if (curr.tipo === 'receita') acc.receitas += curr.valor;
                else acc.despesas += curr.valor;
                return acc;
            },
            { receitas: 0, despesas: 0 }
        );
    }, [filteredData]);

    const balance = totals.receitas - totals.despesas;

    // Agrupar por data para SectionList
    const sections = useMemo(() => {
        const grouped: { [key: string]: TransacaoComRelacoes[] } = {};

        paginatedData.forEach(tx => {
            const date = tx.data_transacao;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(tx);
        });

        const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

        return sortedDates.map(date => ({
            title: formatDate(date),
            data: grouped[date],
        }));
    }, [paginatedData]);

    const handleEdit = (tx: TransacaoComRelacoes) => {
        setSelectedTransaction(tx);
        setModalVisible(true);
    };

    const handleDelete = (tx: TransacaoComRelacoes) => {
        Alert.alert(
            'Excluir Transação',
            'Tem certeza que deseja excluir esta transação?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await deleteTransaction(tx.id);
                        if (error) Alert.alert('Erro', 'Não foi possível excluir.');
                    }
                }
            ]
        );
    };

    const handleHelp = () => {
        Alert.alert(
            "Histórico Financeiro",
            "Cada centavo conta. Aqui você tem o raio-X completo de onde seu dinheiro veio e para onde foi.\n\n• Filtros Avançados: Use os filtros para encontrar compras específicas.\n• Exportação: Exporte tudo em CSV.\n• Conciliação: Verifique seu saldo."
        );
    };

    const handleExportCSV = async () => {
        try {
            if (filteredData.length === 0) {
                Alert.alert("Erro", "Nenhuma transação para exportar.");
                return;
            }

            // Simple CSV Builder with web parity formatting
            const BOM = '\uFEFF';
            let csv = BOM + "Data;Descricao;Categoria;Conta;Tipo;Valor;Status\n";
            filteredData.forEach(tx => {
                const typeLabel = tx.tipo === 'receita' ? 'Receita' : 'Despesa';
                const catName = tx.categorias?.nome || 'Geral';
                const accName = tx.contas?.nome || '-';

                // Formatar data no formato DD/MM/YYYY com tab (\t)
                const dateSplit = tx.data_transacao.split('T')[0].split('-');
                const formattedDate = `\t${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;

                // Formatar valor com R$
                const formattedValue = `R$ ${tx.valor.toFixed(2).replace('.', ',')}`;
                const finalValue = tx.tipo === 'receita' ? `+${formattedValue}` : `-${formattedValue}`;

                csv += `${formattedDate};"${tx.descricao}";${catName};${accName};${typeLabel};${finalValue};${tx.status || 'Concluído'}\n`;
            });

            const fileName = `Transacoes_${Date.now()}.csv`;
            // @ts-ignore
            const fileUri = (FileSystem.documentDirectory || '') + fileName;

            await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: 'utf8' as any });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Sucesso", "CSV salvo nos documentos do aparelho.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Falha ao exportar CSV.");
        }
    };

    const handleExportPDF = async () => {
        try {
            if (filteredData.length === 0) {
                Alert.alert("Erro", "Nenhuma transação para exportar.");
                return;
            }

            const htmlRows = filteredData.map(tx => {
                const typeLabel = tx.tipo === 'receita' ? 'Receita' : 'Despesa';
                const catName = tx.categorias?.nome || 'Geral';
                const accName = tx.contas?.nome || '-';
                const color = tx.tipo === 'receita' ? '#10B981' : '#EF4444';
                return '<tr>' +
                    '<td>' + formatDate(tx.data_transacao) + '</td>' +
                    '<td>' + tx.descricao + '</td>' +
                    '<td>' + catName + '</td>' +
                    '<td>' + accName + '</td>' +
                    '<td style="color:' + color + ';font-weight:bold;">' + typeLabel + '</td>' +
                    '<td style="color:' + color + ';font-weight:bold;">R$ ' + tx.valor.toFixed(2) + '</td>' +
                    '<td>' + (tx.status || 'Concluído') + '</td>' +
                    '</tr>';
            }).join('');

            const html = [
                '<html>',
                '<head>',
                '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />',
                '<style>',
                'body { font-family: "Helvetica", sans-serif; padding: 20px; color: #1F2937; }',
                'h1 { color: #D4AF37; text-align: center; }',
                'table { width: 100%; border-collapse: collapse; margin-top: 20px; }',
                'th, td { border: 1px solid #E5E7EB; padding: 12px; text-align: left; }',
                'th { background-color: #F3F4F6; color: #4B5563; }',
                '</style>',
                '</head>',
                '<body>',
                '<h1>Extrato de Transações</h1>',
                '<table>',
                '<thead>',
                '<tr>',
                '<th>Data</th><th>Descrição</th><th>Categoria</th><th>Conta</th><th>Tipo</th><th>Valor</th><th>Status</th>',
                '</tr>',
                '</thead>',
                '<tbody>',
                htmlRows,
                '</tbody>',
                '</table>',
                '</body>',
                '</html>'
            ].join('');

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Sucesso", "PDF salvo com sucesso.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Falha ao gerar PDF.");
        }
    };

    const promptExportFormat = () => {
        Alert.alert(
            "Exportar Transações",
            "Escolha o formato do arquivo:",
            [
                { text: "PDF", onPress: handleExportPDF },
                { text: "CSV", onPress: handleExportCSV },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    // Helper to render lucide icon if the string is a valid lucide icon name, otherwise just render the text (emoji)
    const renderCategoryIcon = (iconStr: string | null | undefined, size: number = 14) => {
        if (!iconStr) return <Text style={{ fontSize: size }}>📄</Text>;

        // Dictionary of some common Lucide icons used as categories
        const LucideIcons: Record<string, any> = {
            TrendingUp, CreditCard, Briefcase, Building, Home,
            ShoppingBag, Car, Coffee, Activity, Book, Gift, Heart, Smartphone
        };

        if (LucideIcons[iconStr]) {
            const Icon = LucideIcons[iconStr];
            return <Icon size={size} color={colors.textSubtle} />;
        }

        return <Text style={{ fontSize: size }}>{iconStr}</Text>;
    };



    const renderItem = ({ item }: { item: TransacaoComRelacoes }) => (
        <TouchableOpacity
            style={styles.transactionItem}
            onPress={() => handleEdit(item)}
            onLongPress={() => handleDelete(item)}
        >
            <View style={[
                styles.iconContainer,
                { backgroundColor: item.tipo === 'receita' ? colors.success + '20' : colors.error + '20' }
            ]}>
                {item.tipo === 'receita' ? (
                    <ArrowUpRight size={20} color={colors.success} />
                ) : (
                    <ArrowDownLeft size={20} color={colors.error} />
                )}
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.description} numberOfLines={1}>{item.descricao}</Text>
                <View style={styles.categoryRow}>
                    <View style={styles.categoryBadge}>
                        {renderCategoryIcon(item.categorias?.icone)}
                        <Text style={styles.categoryBadgeText}>
                            {" "}{item.categorias?.nome || 'Geral'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.accountText} numberOfLines={1}>Conta: {item.contas?.nome}</Text>
            </View>

            <View style={styles.amountContainer}>
                <Text style={[
                    styles.amount,
                    { color: item.tipo === 'receita' ? colors.success : colors.error }
                ]}>
                    {item.tipo === 'receita' ? '+' : '-'}{hideValues ? '••••••' : formatCurrency(item.valor)}
                </Text>
                {item.status === 'Pendente' && (
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingText}>Pendente</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );

    const renderFooter = () => {
        const totalItems = filteredData.length;
        if (totalItems === 0) return null;

        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

        return (
            <View style={styles.paginationContainer}>
                <View style={styles.paginationInfoRow}>
                    <Text style={styles.paginationText}>
                        Mostrando {startIndex + 1}-{endIndex} de {totalItems}
                    </Text>
                    <View style={styles.itemsPerPageContainer}>
                        <Text style={styles.paginationText}>Por pág:</Text>
                        {[10, 25, 50].map((size) => (
                            <TouchableOpacity
                                key={size}
                                onPress={() => { setItemsPerPage(size); setCurrentPage(1); }}
                                style={[styles.pageBtnSmall, itemsPerPage === size && styles.pageBtnSmallActive]}
                            >
                                <Text style={[styles.pageBtnSmallText, itemsPerPage === size && styles.pageBtnSmallTextActive]}>{size}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.paginationControls}>
                    <TouchableOpacity
                        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                        <ChevronLeft size={20} color={currentPage === 1 ? colors.textMuted : colors.gold} />
                        <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>Anterior</Text>
                    </TouchableOpacity>

                    <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>

                    <TouchableOpacity
                        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                        disabled={currentPage === totalPages}
                        onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                        <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>Próxima</Text>
                        <ChevronRight size={20} color={currentPage === totalPages ? colors.textMuted : colors.gold} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header com Clicáveis e Ações */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleHelp} style={styles.iconButton}>
                    <HelpCircle size={24} color={colors.textSubtle} />
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={toggleHideValues} style={[styles.iconButton, { marginRight: 4 }]}>
                        {hideValues ? <EyeOff size={22} color={colors.textSubtle} /> : <Eye size={22} color={colors.textSubtle} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={toggleDarkMode} style={[styles.iconButton, { marginRight: 4 }]}>
                        {isDarkMode ? <Sun size={22} color={colors.gold} /> : <Moon size={22} color={colors.textSubtle} />}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setCategoryModalVisible(true)} style={[styles.iconButton, { marginRight: 4 }]}>
                        <LayoutList size={22} color={colors.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setAdvancedFiltersVisible(true)} style={[styles.iconButton, { marginRight: 4 }]}>
                        <Filter size={22} color={colors.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={promptExportFormat} style={styles.iconButton}>
                        <Download size={22} color={colors.textSubtle} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Resumo do Mês */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                    <View style={styles.summaryIconUp}>
                        <ArrowUpRight size={16} color={colors.success} />
                    </View>
                    <View>
                        <Text style={styles.summaryLabel}>Receitas</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                            {hideValues ? '••••••' : formatCurrency(totals.receitas)}
                        </Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.summaryItem}>
                    <View style={styles.summaryIconDown}>
                        <ArrowDownLeft size={16} color={colors.error} />
                    </View>
                    <View>
                        <Text style={styles.summaryLabel}>Despesas</Text>
                        <Text style={[styles.summaryValue, { color: colors.error }]}>
                            {hideValues ? '••••••' : formatCurrency(totals.despesas)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Filtros de Tipo Restored */}
            <View style={styles.chipFiltersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}>
                    <TouchableOpacity
                        style={[styles.typeChip, filterType === 'all' && styles.typeChipActive]}
                        onPress={() => setFilterType('all')}
                    >
                        <Text style={[styles.typeChipText, filterType === 'all' && styles.typeChipTextActive]}>Tudo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeChip, filterType === 'receita' && styles.typeChipActive]}
                        onPress={() => setFilterType('receita')}
                    >
                        <ArrowUpRight size={14} color={filterType === 'receita' ? colors.textInverted : colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={[styles.typeChipText, filterType === 'receita' && styles.typeChipTextActive]}>Receitas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.typeChip, filterType === 'despesa' && styles.typeChipActive]}
                        onPress={() => setFilterType('despesa')}
                    >
                        <ArrowDownLeft size={14} color={filterType === 'despesa' ? colors.textInverted : colors.textSubtle} style={{ marginRight: 6 }} />
                        <Text style={[styles.typeChipText, filterType === 'despesa' && styles.typeChipTextActive]}>Despesas</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Lista */}
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshData}
                        tintColor={colors.gold}
                        colors={[colors.gold]}
                    />
                }
                ListFooterComponent={renderFooter}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Receipt size={64} color={colors.textSubtle + '40'} />
                        <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                    </View>
                }
            />

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    setSelectedTransaction(null);
                    setModalVisible(true);
                }}
            >
                <Plus size={32} color={colors.textInverted} />
            </TouchableOpacity>

            <TransactionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                transactionToEdit={selectedTransaction}
            />

            {/* Modal de Filtros Avançados */}
            <Modal
                visible={advancedFiltersVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setAdvancedFiltersVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.filterModalContainer}>
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterModalTitle}>Filtros Avançados</Text>
                            <TouchableOpacity onPress={() => setAdvancedFiltersVisible(false)} style={styles.closeButton}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.filterLabel}>Ordenação</Text>
                            <View style={styles.filterOptionsGrid}>
                                <TouchableOpacity style={[styles.filterOptionChip, sortBy === 'date-desc' && styles.filterOptionActive]} onPress={() => setSortBy('date-desc')}>
                                    <Text style={[styles.filterOptionText, sortBy === 'date-desc' && styles.filterOptionTextActive]}>Mais Recentes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterOptionChip, sortBy === 'date-asc' && styles.filterOptionActive]} onPress={() => setSortBy('date-asc')}>
                                    <Text style={[styles.filterOptionText, sortBy === 'date-asc' && styles.filterOptionTextActive]}>Mais Antigas</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterOptionChip, sortBy === 'amount-desc' && styles.filterOptionActive]} onPress={() => setSortBy('amount-desc')}>
                                    <Text style={[styles.filterOptionText, sortBy === 'amount-desc' && styles.filterOptionTextActive]}>Maior Valor</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.filterOptionChip, sortBy === 'amount-asc' && styles.filterOptionActive]} onPress={() => setSortBy('amount-asc')}>
                                    <Text style={[styles.filterOptionText, sortBy === 'amount-asc' && styles.filterOptionTextActive]}>Menor Valor</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.filterLabel}>Categoria</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                <TouchableOpacity
                                    style={[styles.filterOptionChipRow, filterCategory === 'all' && styles.filterOptionActive]}
                                    onPress={() => setFilterCategory('all')}
                                >
                                    <Text style={[styles.filterOptionText, filterCategory === 'all' && styles.filterOptionTextActive]}>Todas</Text>
                                </TouchableOpacity>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.filterOptionChipRow, filterCategory === cat.id && styles.filterOptionActive]}
                                        onPress={() => setFilterCategory(cat.id)}
                                    >
                                        <Text style={[styles.filterOptionText, filterCategory === cat.id && styles.filterOptionTextActive]}>{cat.nome}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.filterLabel}>Conta</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                                <TouchableOpacity
                                    style={[styles.filterOptionChipRow, filterAccount === 'all' && styles.filterOptionActive]}
                                    onPress={() => setFilterAccount('all')}
                                >
                                    <Text style={[styles.filterOptionText, filterAccount === 'all' && styles.filterOptionTextActive]}>Todas</Text>
                                </TouchableOpacity>
                                {accounts.map(acc => (
                                    <TouchableOpacity
                                        key={acc.id}
                                        style={[styles.filterOptionChipRow, filterAccount === acc.id && styles.filterOptionActive]}
                                        onPress={() => setFilterAccount(acc.id)}
                                    >
                                        <Text style={[styles.filterOptionText, filterAccount === acc.id && styles.filterOptionTextActive]}>{acc.nome}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.filterApplyButton}
                            onPress={() => setAdvancedFiltersVisible(false)}
                        >
                            <Text style={styles.filterApplyText}>Aplicar Filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal de Categorias */}
            <CategoryModal
                visible={categoryModalVisible}
                onClose={() => setCategoryModalVisible(false)}
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    navButton: {
        padding: 8,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    monthContainer: {
        alignItems: 'center',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        textTransform: 'capitalize',
    },
    yearSubtitle: {
        fontSize: 12,
        color: colors.textSubtle,
    },
    summaryCard: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        marginHorizontal: 20,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    summaryItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryIconUp: {
        backgroundColor: colors.success + '20',
        padding: 8,
        borderRadius: 12,
        marginRight: 10,
    },
    summaryIconDown: {
        backgroundColor: colors.error + '20',
        padding: 8,
        borderRadius: 12,
        marginRight: 10,
    },
    summaryLabel: {
        fontSize: 11,
        color: colors.textSubtle,
        marginBottom: 2,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    summaryValue: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    divider: {
        width: 1,
        backgroundColor: colors.border,
        marginHorizontal: 8,
    },
    chipFiltersContainer: {
        marginBottom: 16,
    },
    typeChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    typeChipActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    typeChipText: {
        color: colors.textSubtle,
        fontWeight: '500',
        fontSize: 13,
    },
    typeChipTextActive: {
        color: colors.textInverted,
        fontWeight: 'bold',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    sectionHeader: {
        paddingVertical: 12,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.gold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContainer: {
        flex: 1,
        marginRight: 12,
    },
    description: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 6,
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    categoryBadgeText: {
        fontSize: 12,
        color: colors.text,
        marginLeft: 4,
    },
    accountText: {
        fontSize: 12,
        color: colors.textSubtle,
        marginTop: 4,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    pendingBadge: {
        backgroundColor: colors.warning + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 4,
    },
    pendingText: {
        fontSize: 10,
        color: colors.warning,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        opacity: 0.7,
    },
    emptyText: {
        marginTop: 16,
        color: colors.textSubtle,
        fontSize: 16,
        fontWeight: '500',
    },
    paginationContainer: {
        marginTop: 20,
        marginBottom: 80,
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    paginationInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    paginationText: {
        color: colors.textSubtle,
        fontSize: 13,
        fontWeight: '500',
    },
    itemsPerPageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    pageBtnSmall: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    pageBtnSmallActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    pageBtnSmallText: {
        color: colors.textSubtle,
        fontSize: 12,
        fontWeight: 'bold',
    },
    pageBtnSmallTextActive: {
        color: colors.textInverted,
    },
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 4,
    },
    pageButtonDisabled: {
        opacity: 0.5,
    },
    pageButtonText: {
        color: colors.gold,
        fontSize: 14,
        fontWeight: 'bold',
    },
    pageButtonTextDisabled: {
        color: colors.textMuted,
    },
    pageIndicator: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    iconButton: {
        padding: 8,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    allPeriodsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.gold,
    },
    allPeriodsText: {
        color: colors.gold,
        fontWeight: 'bold',
        fontSize: 14,
    },
    advancedFilterButton: {
        padding: 10,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterModalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    filterModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    closeButton: {
        padding: 4,
    },
    filterScroll: {
        marginBottom: 20,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.gold,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    filterOptionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    horizontalScroll: {
        marginBottom: 24,
    },
    filterOptionChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterOptionChipRow: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 12,
    },
    filterOptionActive: {
        backgroundColor: colors.gold,
        borderColor: colors.gold,
    },
    filterOptionText: {
        color: colors.textSubtle,
        fontWeight: '500',
    },
    filterOptionTextActive: {
        color: colors.textInverted,
        fontWeight: 'bold',
    },
    filterApplyButton: {
        backgroundColor: colors.gold,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    filterApplyText: {
        color: colors.textInverted,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.gold,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
