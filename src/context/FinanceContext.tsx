/**
 * 💰 FINANÇAS PRO GOLD - FINANCE CONTEXT
 * Gerenciamento de dados financeiros com Supabase (DADOS REAIS)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
    Conta,
    Transacao,
    TransacaoComRelacoes,
    Categoria,
    Investimento,
    Orcamento,
    Meta,
    DashboardSummary,
    Noticia,
    FamilyMember,
    ChatMessage,
    SystemLog
} from '../types';
import { formatMonthKey, getMonthRange, formatCurrency } from '../utils/currencyUtils';

// ===== INTERFACE DO CONTEXT =====
interface FinanceContextData {
    // Estados
    accounts: Conta[];
    transactions: TransacaoComRelacoes[];
    categories: Categoria[];
    investments: Investimento[];
    goals: Meta[];
    budgets: Orcamento[];
    loading: boolean;
    refreshing: boolean;

    // Preferências
    hideValues: boolean;
    toggleHideValues: () => Promise<void>;
    isDarkMode: boolean;
    toggleDarkMode: () => Promise<void>;

    // Dados Globais e Extras (Restaurados)
    news: Noticia[];
    familyMembers: FamilyMember[];
    dashboardSummary: DashboardSummary;
    chatMessages: ChatMessage[];
    chatSystemLogs: SystemLog[];

    // Funções CRUD - Transações
    addTransaction: (tx: Partial<Transacao>) => Promise<{ error: Error | null }>;
    updateTransaction: (id: string, updates: Partial<Transacao>) => Promise<{ error: Error | null }>;
    deleteTransaction: (id: string) => Promise<{ error: Error | null }>;

    // Funções CRUD - Contas
    addAccount: (account: Partial<Conta>) => Promise<{ error: Error | null }>;
    updateAccount: (id: string, updates: Partial<Conta>) => Promise<{ error: Error | null }>;

    // Funções CRUD - Categorias
    addCategory: (category: Partial<Categoria>) => Promise<{ error: Error | null }>;
    deleteCategory: (id: string) => Promise<{ error: Error | null }>;

    // Funções CRUD - Metas
    addGoal: (goal: Partial<Meta>) => Promise<{ error: Error | null }>;
    updateGoal: (id: string, updates: Partial<Meta>) => Promise<{ error: Error | null }>;
    deleteGoal: (id: string) => Promise<{ error: Error | null }>;

    addBudget: (budget: Partial<Orcamento>) => Promise<{ error: Error | null }>;
    updateBudget: (id: string, updates: Partial<Orcamento>) => Promise<{ error: Error | null }>;
    deleteBudget: (id: string) => Promise<{ error: Error | null }>;
    setBudget: (categoryNameOrId: string, amount: number, month: string) => Promise<{ error: Error | null }>;
    copyBudgets: (fromMonth: string, toMonth: string) => Promise<{ error: Error | null }>;

    // Funções CRUD - Investimentos
    addInvestment: (investment: Partial<Investimento>) => Promise<{ error: Error | null }>;
    updateInvestment: (id: string, updates: Partial<Investimento>) => Promise<{ error: Error | null }>;
    deleteInvestment: (id: string) => Promise<{ error: Error | null }>;

    // Funções Família
    addFamilyMember: (member: Partial<FamilyMember>) => Promise<{ error: Error | null }>;
    removeFamilyMember: (id: string) => Promise<{ error: Error | null }>;

    // Funções Chat
    sendMessage: (text: string, sender: 'user' | 'ai') => Promise<{ error: Error | null }>;
    clearChatHistory: () => Promise<void>;

    // Refresh
    refreshData: () => Promise<void>;

    // Sync
    syncPrices: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export function useFinance() {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
    }
    return context;
}

interface FinanceProviderProps {
    children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
    const { user } = useAuth();

    // Estados
    const [accounts, setAccounts] = useState<Conta[]>([]);
    const [transactions, setTransactions] = useState<TransacaoComRelacoes[]>([]);
    const [categories, setCategories] = useState<Categoria[]>([]);
    const [investments, setInvestments] = useState<Investimento[]>([]);
    const [goals, setGoals] = useState<Meta[]>([]);
    const [budgets, setBudgets] = useState<Orcamento[]>([]);
    const [news, setNews] = useState<Noticia[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatSystemLogs, setChatSystemLogs] = useState<SystemLog[]>([]);
    const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary>({
        saldo_total: 0,
        receitas: 0,
        despesas: 0,
        lucro: 0,
        saldo_contas: 0,
        saldo_investimentos: 0,
        month_start: '',
        month_end: ''
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hideValues, setHideValues] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Carregar preferências
    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const [savedHide, savedDark, savedLogs] = await Promise.all([
                AsyncStorage.getItem('@financas_pro:hideValues'),
                AsyncStorage.getItem('@financas_pro:isDarkMode'),
                AsyncStorage.getItem('@financas_pro:chatSystemLogs'),
            ]);
            if (savedHide !== null) setHideValues(JSON.parse(savedHide));
            if (savedDark !== null) setIsDarkMode(JSON.parse(savedDark));
            else setIsDarkMode(true); // Padrão: dark mode
            if (savedLogs !== null) setChatSystemLogs(JSON.parse(savedLogs));
        } catch (e) {
            console.error('Erro ao carregar preferências', e);
        }
    };

    const toggleHideValues = async () => {
        try {
            const newValue = !hideValues;
            setHideValues(newValue);
            await AsyncStorage.setItem('@financas_pro:hideValues', JSON.stringify(newValue));
        } catch (e) {
            console.error('Erro ao salvar preferências', e);
        }
    };

    const toggleDarkMode = async () => {
        try {
            const newValue = !isDarkMode;
            setIsDarkMode(newValue);
            await AsyncStorage.setItem('@financas_pro:isDarkMode', JSON.stringify(newValue));
        } catch (e) {
            console.error('Erro ao salvar tema', e);
        }
    };

    // ===== FETCH DE DADOS =====

    const fetchCategories = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .or(`usuario_id.eq.${userId},usuario_id.is.null`)
                .order('nome');

            if (error) throw error;
            if (data) {
                setCategories(data.map(cat => ({
                    id: cat.id,
                    nome: cat.nome,
                    tipo: cat.tipo,
                    icone: cat.icone || '📁',
                    cor: cat.cor || '#9CA3AF',
                    eh_padrao: cat.eh_padrao || false,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
        }
    }, []);

    const fetchAccounts = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('contas')
                .select('*')
                .eq('usuario_id', userId)
                .order('nome');

            if (error) throw error;
            if (data) {
                setAccounts(data.map(acc => ({
                    id: acc.id,
                    usuario_id: acc.usuario_id,
                    nome: acc.nome,
                    tipo: acc.tipo,
                    saldo: parseFloat(acc.saldo) || 0,
                    nome_banco: acc.nome_banco,
                    ativa: acc.ativa !== false,
                    cor: acc.cor,
                    limite_credito: acc.limite_credito ? parseFloat(acc.limite_credito) : undefined,
                    fatura_atual: acc.fatura_atual ? parseFloat(acc.fatura_atual) : undefined,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
        }
    }, []);

    const fetchTransactions = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('transacoes')
                .select(`
                    *,
                    categorias:categoria_id (id, nome, cor, icone, tipo),
                    contas:conta_id (id, nome, tipo)
                `)
                .eq('usuario_id', userId)
                .order('data_transacao', { ascending: false })
                .limit(500);

            if (error) throw error;
            if (data) {
                setTransactions(data.map(tx => ({
                    id: tx.id,
                    usuario_id: tx.usuario_id,
                    conta_id: tx.conta_id,
                    categoria_id: tx.categoria_id,
                    descricao: tx.descricao,
                    valor: parseFloat(tx.valor) || 0,
                    data_transacao: tx.data_transacao,
                    tipo: tx.tipo,
                    status: tx.status || 'Concluído',
                    eh_recorrente: tx.eh_recorrente || false,
                    tipo_recorrencia: tx.tipo_recorrencia,
                    data_fim_recorrencia: tx.data_fim_recorrencia,
                    criado_em: tx.criado_em,
                    categorias: tx.categorias || undefined,
                    contas: tx.contas || undefined,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        }
    }, []);

    const fetchInvestments = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('investimentos')
                .select('*')
                .eq('usuario_id', userId);

            if (error) throw error;
            if (data) {
                setInvestments(data.map(inv => ({
                    id: inv.id,
                    usuario_id: inv.usuario_id,
                    simbolo: inv.simbolo,
                    nome: inv.nome,
                    quantidade: parseFloat(inv.quantidade) || 0,
                    preco_medio: parseFloat(inv.preco_medio) || 0,
                    preco_atual: parseFloat(inv.preco_atual) || 0,
                    tipo: inv.tipo,
                    data_compra: inv.data_compra,
                    variacao_24h: inv.variacao_24h ? parseFloat(inv.variacao_24h) : undefined,
                    variacao_percentual: inv.variacao_percentual ? parseFloat(inv.variacao_percentual) : undefined,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar investimentos:', error);
        }
    }, []);

    const fetchGoals = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('metas')
                .select('*')
                .eq('usuario_id', userId);

            if (error) throw error;
            if (data) {
                setGoals(data.map(goal => ({
                    id: goal.id,
                    usuario_id: goal.usuario_id,
                    nome: goal.nome,
                    valor_alvo: parseFloat(goal.valor_alvo) || 0,
                    valor_atual: parseFloat(goal.valor_atual) || 0,
                    prazo: goal.prazo,
                    categoria: goal.categoria,
                    status: goal.status || 'pendente',
                    cor: goal.cor,
                    criado_em: goal.criado_em,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar metas:', error);
        }
    }, []);

    const fetchBudgets = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('orcamentos')
                .select('*')
                .eq('usuario_id', userId);

            if (error) throw error;
            if (data) {
                setBudgets(data.map(budget => ({
                    id: budget.id,
                    usuario_id: budget.usuario_id,
                    categoria_id: budget.categoria_id,
                    valor_planejado: parseFloat(budget.valor_planejado) || 0,
                    mes: budget.mes,
                })));
            }
        } catch (error) {
            console.error('Erro ao buscar orçamentos:', error);
        }
    }, []);

    const fetchNews = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('noticias')
                .select('*')
                .order('data_publicacao', { ascending: false });

            if (error) throw error; // Se a tabela nao existir, vai dar erro, mas ok, usuario pediu
            setNews(data || []);
        } catch (error) {
            console.error('Erro ao buscar notícias:', error);
        }
    }, []);

    const fetchFamily = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('familia_membros')
                .select('*')
                .eq('usuario_pai_id', userId);

            if (error) throw error;
            setFamilyMembers(data || []);
        } catch (error) {
            console.error('Erro ao buscar família:', error);
        }
    }, []);

    const fetchChat = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('mensagens_chat')
                .select('*')
                .eq('usuario_id', userId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setChatMessages(data || []);
        } catch (error) {
            console.error('Erro ao buscar chat:', error);
        }
    }, []);

    const fetchDashboardSummary = useCallback(async () => {
        try {
            const currentMonth = formatMonthKey(); // YYYY-MM
            const { firstDay, lastDay } = getMonthRange(currentMonth);

            const { data, error } = await supabase.rpc('get_dashboard_summary', {
                month_start: firstDay,
                month_end: lastDay
            });

            if (error) throw error;
            if (data) {
                setDashboardSummary(data as DashboardSummary);
            }
        } catch (error) {
            console.error('Erro ao buscar resumo dashboard:', error);
        }
    }, []);

    // ===== CARREGAR TODOS OS DADOS =====
    const fetchAllData = useCallback(async (userId: string) => {
        try {
            await Promise.all([
                fetchCategories(userId),
                fetchAccounts(userId),
                fetchTransactions(userId),
                fetchInvestments(userId),
                fetchGoals(userId),
                fetchBudgets(userId),
                fetchNews(),
                fetchFamily(userId),
                fetchChat(userId),
                fetchDashboardSummary(),
            ]);
        } catch (error) {
            console.error('Erro ao carregar dados financeiros:', error);
        }
    }, [fetchCategories, fetchAccounts, fetchTransactions, fetchInvestments, fetchGoals, fetchBudgets, fetchNews, fetchFamily, fetchChat, fetchDashboardSummary]);

    // Carregar dados quando o usuário estiver autenticado
    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchAllData(user.id).finally(() => setLoading(false));
        } else {
            setAccounts([]);
            setTransactions([]);
            setCategories([]);
            setInvestments([]);
            setGoals([]);
            setBudgets([]);
            setNews([]);
            setFamilyMembers([]);
            setChatMessages([]);
            setChatSystemLogs([]);
            setLoading(false);
        }
    }, [user, fetchAllData]);

    // Salvar logs sempre que mudar
    useEffect(() => {
        AsyncStorage.setItem('@financas_pro:chatSystemLogs', JSON.stringify(chatSystemLogs)).catch(e => console.error(e));
    }, [chatSystemLogs]);

    const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        const time = new Date().toLocaleTimeString('pt-BR');
        setChatSystemLogs(prev => [{ time, message, type }, ...prev]);
    }, []);

    const clearChatHistory = async () => {
        if (!user) return;
        try {
            await supabase.from('mensagens_chat').delete().eq('usuario_id', user.id);
            setChatMessages([]);
            setChatSystemLogs([]);
            await AsyncStorage.removeItem('@financas_pro:chatSystemLogs');
        } catch (e) {
            console.error("Erro ao limpar histórico:", e);
        }
    };

    const refreshData = useCallback(async () => {
        if (!user) return;
        setRefreshing(true);
        await fetchAllData(user.id);
        setRefreshing(false);
    }, [user, fetchAllData]);

    // ===== CRUDs =====

    const addTransaction = async (tx: Partial<Transacao>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase
                .from('transacoes')
                .insert({
                    usuario_id: user.id,
                    descricao: tx.descricao,
                    valor: tx.valor,
                    tipo: tx.tipo,
                    categoria_id: tx.categoria_id,
                    conta_id: tx.conta_id,
                    data_transacao: tx.data_transacao || new Date().toISOString().split('T')[0],
                    status: tx.status || 'Concluído',
                    eh_recorrente: tx.eh_recorrente || false,
                    tipo_recorrencia: tx.tipo_recorrencia,
                })
                .select(`
                    *,
                    categorias:categoria_id (id, nome, cor, icone, tipo),
                    contas:conta_id (id, nome, tipo)
                `)
                .single();

            if (error) throw error;

            if (data) {
                const newTx: TransacaoComRelacoes = {
                    id: data.id,
                    usuario_id: data.usuario_id,
                    conta_id: data.conta_id,
                    categoria_id: data.categoria_id,
                    descricao: data.descricao,
                    valor: parseFloat(data.valor) || 0,
                    data_transacao: data.data_transacao,
                    tipo: data.tipo,
                    status: data.status || 'Concluído',
                    eh_recorrente: data.eh_recorrente || false,
                    tipo_recorrencia: data.tipo_recorrencia,
                    categorias: data.categorias || undefined,
                    contas: data.contas || undefined,
                };
                setTransactions(prev => [newTx, ...prev]);
                await fetchAccounts(user.id);
            }

            return { error: null };
        } catch (error) {
            console.error('Erro ao adicionar transação:', error);
            return { error: error as Error };
        }
    };

    const updateTransaction = async (id: string, updates: Partial<Transacao>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('transacoes').update(updates).eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            await fetchTransactions(user.id);
            await fetchAccounts(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const deleteTransaction = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('transacoes').delete().eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            setTransactions(prev => prev.filter(tx => tx.id !== id));
            await fetchAccounts(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const addAccount = async (account: Partial<Conta>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { data, error } = await supabase.from('contas').insert({
                usuario_id: user.id,
                nome: account.nome,
                tipo: account.tipo,
                saldo: account.saldo || 0,
                nome_banco: account.nome_banco,
                cor: account.cor,
                ativa: true,
            }).select().single();

            if (error) throw error;
            if (data) {
                setAccounts(prev => [...prev, {
                    id: data.id,
                    usuario_id: data.usuario_id,
                    nome: data.nome,
                    tipo: data.tipo,
                    saldo: parseFloat(data.saldo) || 0,
                    nome_banco: data.nome_banco,
                    ativa: data.ativa,
                    cor: data.cor,
                }]);
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updateAccount = async (id: string, updates: Partial<Conta>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('contas').update(updates).eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            await fetchAccounts(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const addCategory = async (category: Partial<Categoria>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { data, error } = await supabase.from('categorias').insert({
                usuario_id: user.id,
                nome: category.nome,
                tipo: category.tipo,
                icone: category.icone,
                cor: category.cor || '#64748B',
                eh_padrao: false,
            }).select().single();

            if (error) {
                console.error("ADD CAT ERR:", error);
                throw error;
            }
            if (data) {
                setCategories(prev => [...prev, data as Categoria]);
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const deleteCategory = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('categorias').delete().eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            setCategories(prev => prev.filter(cat => cat.id !== id));
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const addGoal = async (goal: Partial<Meta>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { data, error } = await supabase.from('metas').insert({
                usuario_id: user.id,
                nome: goal.nome,
                valor_alvo: goal.valor_alvo,
                valor_atual: goal.valor_atual || 0,
                prazo: goal.prazo,
                categoria: goal.categoria || '',
                status: goal.status || 'pendente',
                cor: goal.cor,
            }).select().single();
            if (error) throw error;
            if (data) {
                setGoals(prev => [...prev, {
                    id: data.id,
                    usuario_id: data.usuario_id,
                    nome: data.nome,
                    valor_alvo: parseFloat(data.valor_alvo) || 0,
                    valor_atual: parseFloat(data.valor_atual) || 0,
                    prazo: data.prazo,
                    categoria: data.categoria,
                    status: data.status || 'pendente',
                    cor: data.cor,
                }]);
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updateGoal = async (id: string, updates: Partial<Meta>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('metas').update(updates).eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            await fetchGoals(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const deleteGoal = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('metas').delete().eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            setGoals(prev => prev.filter(goal => goal.id !== id));
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const addInvestment = async (investment: Partial<Investimento>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { data, error } = await supabase.from('investimentos').insert({
                usuario_id: user.id,
                simbolo: investment.simbolo,
                nome: investment.nome,
                quantidade: investment.quantidade,
                tipo: investment.tipo,
                preco_medio: investment.preco_medio,
                preco_atual: investment.preco_atual || investment.preco_medio,
                data_compra: investment.data_compra || new Date().toISOString().split('T')[0],
            }).select().single();

            if (error) throw error;
            await fetchInvestments(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updateInvestment = async (id: string, updates: Partial<Investimento>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('investimentos').update(updates).eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            await fetchInvestments(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const deleteInvestment = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('investimentos').delete().eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            setInvestments(prev => prev.filter(inv => inv.id !== id));
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const syncPrices = async () => {
        const { fetchCryptoPrice } = await import('../utils/investmentApi');

        await Promise.all(
            investments.map(async (asset) => {
                if (asset.tipo === 'crypto') {
                    try {
                        const data = await fetchCryptoPrice(asset.simbolo);
                        if (data) {
                            const updatedAsset = {
                                ...asset,
                                preco_atual: data.price,
                                variacao_24h: data.change24h,
                                data_atualizacao: new Date().toISOString()
                            };

                            await supabase.from('investimentos').update({
                                preco_atual: updatedAsset.preco_atual,
                                variacao_24h: updatedAsset.variacao_24h,
                            }).eq('id', updatedAsset.id);

                            setInvestments(prev => prev.map(inv => inv.id === updatedAsset.id ? updatedAsset : inv));
                        }
                    } catch (error) {
                        console.error(`Error syncing ${asset.simbolo}:`, error);
                    }
                }
            })
        );
    };

    const addBudget = async (budget: Partial<Orcamento>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { data, error } = await supabase.from('orcamentos').insert({
                usuario_id: user.id,
                categoria_id: budget.categoria_id,
                valor_planejado: budget.valor_planejado,
                mes: budget.mes || formatMonthKey(),
            }).select().single();
            if (error) throw error;
            await fetchBudgets(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const updateBudget = async (id: string, updates: Partial<Orcamento>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('orcamentos').update(updates).eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            await fetchBudgets(user.id);
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const deleteBudget = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            const { error } = await supabase.from('orcamentos').delete().eq('id', id).eq('usuario_id', user.id);
            if (error) throw error;
            setBudgets(prev => prev.filter(b => b.id !== id));
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const getCategoryId = (categoryNameOrId: string): string | null => {
        const cat = categories.find(c => c.nome === categoryNameOrId || c.id === categoryNameOrId);
        return cat?.id || null;
    };

    const setBudget = async (categoryNameOrId: string, amount: number, month: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            const catId = getCategoryId(categoryNameOrId);
            if (!catId) throw new Error('Categoria não encontrada');

            const existingBudget = budgets.find(b => b.categoria_id === catId && b.mes === month);

            if (existingBudget) {
                const { error } = await supabase
                    .from('orcamentos')
                    .update({ valor_planejado: amount })
                    .eq('id', existingBudget.id);

                if (error) throw error;

                setBudgets(prev => prev.map(b =>
                    b.id === existingBudget.id ? { ...b, valor_planejado: amount } : b
                ));
            } else {
                const { data: inserted, error } = await supabase
                    .from('orcamentos')
                    .insert({
                        usuario_id: user.id,
                        categoria_id: catId,
                        valor_planejado: amount,
                        mes: month
                    })
                    .select()
                    .single();

                if (error) throw error;

                const newBudget: Orcamento = {
                    id: inserted.id,
                    usuario_id: inserted.usuario_id,
                    categoria_id: inserted.categoria_id,
                    valor_planejado: parseFloat(inserted.valor_planejado) || 0,
                    mes: inserted.mes
                };
                setBudgets(prev => [...prev, newBudget]);
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const copyBudgets = async (fromMonth: string, toMonth: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            const sourceBudgets = budgets.filter(b => b.mes === fromMonth);
            if (sourceBudgets.length === 0) return { error: null };

            const insertRows = sourceBudgets.map(b => ({
                usuario_id: user.id,
                categoria_id: b.categoria_id,
                valor_planejado: b.valor_planejado,
                mes: toMonth
            }));

            const { data, error } = await supabase
                .from('orcamentos')
                .insert(insertRows)
                .select();

            if (error) throw error;

            if (data) {
                const newBudgets: Orcamento[] = data.map(b => ({
                    id: b.id,
                    usuario_id: b.usuario_id,
                    categoria_id: b.categoria_id,
                    valor_planejado: parseFloat(b.valor_planejado) || 0,
                    mes: b.mes
                }));
                // Para simplificar, recarregamos tudo do banco se houver inserts
                await fetchBudgets(user.id);
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    // Funcionalidades Restauradas
    const addFamilyMember = async (member: Partial<FamilyMember>): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            // Mock Fallback se a tabela não existir, mas tentamos o real
            try {
                const { error } = await supabase.from('familia_membros').insert({
                    usuario_pai_id: user.id,
                    nome_membro: member.nome_membro,
                    email_membro: member.email_membro,
                    papel: member.papel || 'Membro',
                    avatar_emoji: member.avatar_emoji
                });
                if (error) throw error;
                await fetchFamily(user.id);
            } catch (e) {
                console.warn('Backend family error, using local state mock', e);
                setFamilyMembers(prev => [...prev, { ...member, id: Math.random().toString() } as FamilyMember]);
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const removeFamilyMember = async (id: string): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');
            try {
                const { error } = await supabase.from('familia_membros').delete().eq('id', id);
                if (error) throw error;
                await fetchFamily(user.id);
            } catch (e) {
                setFamilyMembers(prev => prev.filter(m => m.id !== id));
            }
            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };

    const findCategory = (description: string, type: 'despesa' | 'receita') => {
        const lowerDesc = description.toLowerCase();
        const exactMatch = categories.find(c => c.tipo === type && lowerDesc.includes(c.nome.toLowerCase()));
        if (exactMatch) return exactMatch.id;
        const fallback = categories.find(c => c.tipo === type && (c.nome.toLowerCase().includes('outros') || c.nome.toLowerCase().includes('geral')));
        return fallback?.id || categories.find(c => c.tipo === type)?.id || '';
    };

    const processMessage = async (text: string): Promise<string> => {
        const lowerText = text.toLowerCase().trim();
        addLog(`Processando comando: "${text}"`, 'info');

        if (lowerText.includes('saldo') || lowerText.includes('quanto tenho')) {
            const totalBalance = accounts.reduce((acc, curr) => acc + curr.saldo, 0);
            addLog(`Consulta de saldo: ${formatCurrency(totalBalance, true)}`, 'success');
            return `💰 *Seu Saldo Atual*\n\nTotal: ${formatCurrency(totalBalance, true)}\n\n` +
                accounts.map(a => `• ${a.nome}: ${formatCurrency(a.saldo, true)}`).join('\n');
        }

        if (lowerText.includes('extrato') || lowerText.includes('ultimas') || lowerText.includes('últimas')) {
            const match = lowerText.match(/\d+/);
            const limit = match ? Math.min(parseInt(match[0]), 50) : 5;

            // Tenta encontrar o nome de uma conta específica na mensagem
            const requestedAccount = accounts.find(a => lowerText.includes(a.nome.toLowerCase()));

            addLog(`Consulta de extrato solicitada (${limit} itens${requestedAccount ? ` na conta ${requestedAccount.nome}` : ''}).`, 'success');

            let filteredTransactions = [...transactions];
            if (requestedAccount) {
                filteredTransactions = filteredTransactions.filter(t => t.conta_id === requestedAccount.id);
            }

            const lastTransactions = filteredTransactions
                .sort((a, b) => new Date(b.data_transacao).getTime() - new Date(a.data_transacao).getTime())
                .slice(0, limit);

            if (lastTransactions.length === 0) return '📭 Nenhuma transação recente encontrada.';

            return `📄 *Últimas ${lastTransactions.length} Transações${requestedAccount ? ` (${requestedAccount.nome})` : ''}*\n\n` +
                lastTransactions.map(t =>
                    `${t.tipo === 'receita' ? '🟢' : '🔴'} ${t.descricao}\n   ${formatCurrency(t.valor, true)} • ${new Date(t.data_transacao).toLocaleDateString('pt-BR')}`
                ).join('\n\n');
        }

        const expenseMatch = lowerText.match(/(?:gastei|paguei|comprei|despesa)\s+(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:em|no|na|de)?\s*(.*)/i);
        if (expenseMatch) {
            try {
                const amountStr = expenseMatch[1].replace(',', '.');
                const amount = parseFloat(amountStr);
                const description = expenseMatch[2]?.trim() || 'Despesa via Bot';

                if (isNaN(amount)) {
                    addLog('Erro: Valor da despesa inválido.', 'error');
                    return '❌ Não entendi o valor. Diga "gastei 50 no mercado".';
                }

                const categoryId = findCategory(description, 'despesa');
                const accountId = accounts[0]?.id;

                if (!accountId) return '❌ Nenhuma conta cadastrada para lançar a despesa.';

                await addTransaction({
                    descricao: description.charAt(0).toUpperCase() + description.slice(1),
                    valor: amount,
                    tipo: 'despesa',
                    categoria_id: categoryId,
                    data_transacao: new Date().toISOString().split('T')[0],
                    status: 'Concluído',
                    conta_id: accountId
                });

                addLog(`Despesa registrada: ${formatCurrency(amount, true)} (${description})`, 'success');
                return `✅ *Despesa Registrada!*\n\n💸 Valor: ${formatCurrency(amount, true)}\n📝 Descrição: ${description}\n\nSaldo atualizado!`;
            } catch (error) {
                addLog(`Erro ao salvar despesa: ${error}`, 'error');
                return '❌ Erro ao registrar despesa via comando.';
            }
        }

        const incomeMatch = lowerText.match(/(?:recebi|ganhei|receita|deposito)\s+(?:r\$)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:de|do|da)?\s*(.*)/i);
        if (incomeMatch) {
            try {
                const amountStr = incomeMatch[1].replace(',', '.');
                const amount = parseFloat(amountStr);
                const description = incomeMatch[2]?.trim() || 'Receita via Bot';

                if (isNaN(amount)) {
                    addLog('Erro: Valor da receita inválido.', 'error');
                    return '❌ Não entendi o valor. Diga "recebi 1000 de salário".';
                }

                const categoryId = findCategory(description, 'receita');
                const accountId = accounts[0]?.id;

                if (!accountId) return '❌ Nenhuma conta cadastrada.';

                await addTransaction({
                    descricao: description.charAt(0).toUpperCase() + description.slice(1),
                    valor: amount,
                    tipo: 'receita',
                    categoria_id: categoryId,
                    data_transacao: new Date().toISOString().split('T')[0],
                    status: 'Concluído',
                    conta_id: accountId
                });

                addLog(`Receita registrada: ${formatCurrency(amount, true)} (${description})`, 'success');
                return `✅ *Receita Registrada!*\n\n💰 Valor: ${formatCurrency(amount, true)}\n📝 Descrição: ${description}\n\nSaldo atualizado!`;
            } catch (error) {
                addLog(`Erro ao salvar receita: ${error}`, 'error');
                return '❌ Erro ao registrar receita via comando.';
            }
        }

        if (lowerText.includes('ajuda') || lowerText.includes('help')) {
            addLog('Usuário solicitou ajuda.', 'info');
            return '🤖 *Comandos que entendo:*\n\n• "Quanto tenho de saldo?"\n• "Gastei 50 no uber"\n• "Recebi 1500 de aluguel"\n• "Ver extrato"\n• "extrato 10"\n• "extrato [nome da conta]"\n• "Paguei 100 de luz"';
        }

        addLog(`Comando não reconhecido: "${text}"`, 'error');
        return '🤔 Não entendi. Tente dizer "gastei 50 em algo", "recebi 100" ou "saldo". Digite "ajuda" para ver opções.';
    };

    const sendMessage = async (text: string, sender: 'user' | 'ai'): Promise<{ error: Error | null }> => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            // Tentativa real de inserir a mensagem do usuario
            try {
                const { error } = await supabase.from('mensagens_chat').insert({
                    usuario_id: user.id,
                    texto: text,
                    remetente: sender
                });
                if (error) throw error;
            } catch (e) {
                const newMsg: ChatMessage = {
                    id: Math.random().toString(),
                    usuario_id: user.id,
                    texto: text,
                    remetente: sender,
                    created_at: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, newMsg]);
            }

            // Lógica de chatbot local simulado (Bot)
            if (sender === 'user') {
                setTimeout(async () => {
                    try {
                        const botResponse = await processMessage(text);
                        const { error } = await supabase.from('mensagens_chat').insert({
                            usuario_id: user.id,
                            texto: botResponse,
                            remetente: 'ai'
                        });
                        if (error) throw error;
                        fetchChat(user.id);
                    } catch (e) {
                        const aiMsg: ChatMessage = {
                            id: Math.random().toString(),
                            usuario_id: user.id,
                            texto: "❌ Erro ao processar ou salvar a resposta da IA no banco.",
                            remetente: 'ai',
                            created_at: new Date().toISOString()
                        };
                        setChatMessages(prev => [...prev, aiMsg]);
                    }
                }, 600);
            } else {
                await fetchChat(user.id);
            }

            return { error: null };
        } catch (error) {
            return { error: error as Error };
        }
    };


    // ===== VALOR DO CONTEXT =====
    const value: FinanceContextData = {
        accounts,
        transactions,
        categories,
        investments,
        goals,
        budgets,
        news,
        familyMembers,
        chatMessages,
        chatSystemLogs,
        dashboardSummary,

        loading,
        refreshing,
        refreshData,

        hideValues,
        toggleHideValues,
        isDarkMode,
        toggleDarkMode,

        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        addCategory,
        deleteCategory,
        addGoal,
        updateGoal,
        deleteGoal,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addBudget,
        updateBudget,
        deleteBudget,
        setBudget,
        copyBudgets,

        addFamilyMember,
        removeFamilyMember,
        sendMessage,
        clearChatHistory,
        syncPrices
    };

    return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}
