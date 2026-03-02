import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { FamilyGroup, FamilyMember, SharedExpense } from '../types';
import { useAuth } from './AuthContext';

interface FamilyContextType {
    group: FamilyGroup | null;
    expenses: SharedExpense[];
    loading: boolean;
    refreshing: boolean;
    refreshData: () => Promise<void>;
    createGroup: (name: string, description: string) => Promise<void>;
    addExpense: (expense: Omit<SharedExpense, 'id'>) => Promise<void>;
    updateExpense: (id: string, data: Partial<SharedExpense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    inviteMember: (email: string, role: 'admin' | 'member') => Promise<void>;
    addGhostMember: (name: string, role?: 'member') => Promise<void>;
    removeMember: (memberId: string) => Promise<void>;
    settleDebt: (expenseId: string) => Promise<void>;
    payExpense: (expenseId: string, paidBy: string) => Promise<void>;
    settleAllDebts: (fromMemberId: string, toMemberId: string) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [group, setGroup] = useState<FamilyGroup | null>(null);
    const [expenses, setExpenses] = useState<SharedExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (user) {
            fetchFamilyData();
        } else {
            setGroup(null);
            setExpenses([]);
            setLoading(false);
        }
    }, [user]);

    const mapStatusFromDb = (status: string): 'pending' | 'settled' | 'open' => {
        switch (status) {
            case 'em_aberto': return 'open';
            case 'pendente': return 'pending';
            case 'quitado': return 'settled';
            default: return 'pending';
        }
    };

    const mapStatusToDb = (status: 'pending' | 'settled' | 'open'): string => {
        switch (status) {
            case 'open': return 'em_aberto';
            case 'pending': return 'pendente';
            case 'settled': return 'quitado';
            default: return 'pendente';
        }
    };

    const fetchFamilyData = async () => {
        try {
            if (!user) return;
            console.log('🔄 Fetching family groups for user:', user.id);

            // 1. Buscar grupos onde sou PROPRIETÁRIO
            const { data: ownedGroups, error: ownerError } = await supabase
                .from('grupos_familiares')
                .select('*')
                .eq('proprietario_id', user.id);

            if (ownerError) throw ownerError;

            // 2. Buscar grupos onde sou MEMBRO
            const { data: memberGroupsData, error: memberError } = await supabase
                .from('membros_familia')
                .select('grupo_id, grupos_familiares (*)')
                .eq('usuario_id', user.id);

            if (memberError) throw memberError;

            const allGroupsMap = new Map();

            ownedGroups?.forEach(g => allGroupsMap.set(g.id, g));
            memberGroupsData?.forEach((m: any) => {
                if (m.grupos_familiares) {
                    allGroupsMap.set(m.grupos_familiares.id, m.grupos_familiares);
                }
            });

            const allGroups = Array.from(allGroupsMap.values());

            if (allGroups.length > 0) {
                const selectedGroupData = allGroups[0];

                const { data: membersData, error: membersFetchError } = await supabase
                    .from('membros_familia')
                    .select(`
                        id, 
                        usuario_id, 
                        papel, 
                        entrou_em, 
                        nome, 
                        email_convite, 
                        avatar_url,
                        usuarios (id, nome, email, avatar_url)
                    `)
                    .eq('grupo_id', selectedGroupData.id);

                if (membersFetchError) throw membersFetchError;

                const mappedMembers: FamilyMember[] = membersData?.map((m: any) => {
                    const userData = m.usuarios;
                    return {
                        id: m.id,
                        userId: m.usuario_id || undefined,
                        name: userData?.nome || m.nome || 'Membro Sem Nome',
                        email: userData?.email || m.email_convite || '',
                        avatarUrl: userData?.avatar_url || m.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.nome || m.nome || 'User')}&background=random&color=fff`,
                        role: (m.papel === 'membro' ? 'member' : m.papel === 'proprietario' ? 'owner' : m.papel) as 'owner' | 'admin' | 'member',
                        joinedAt: m.entrou_em
                    };
                }) || [];

                const mappedGroup: FamilyGroup = {
                    id: selectedGroupData.id,
                    name: selectedGroupData.nome,
                    description: selectedGroupData.descricao || '',
                    ownerId: selectedGroupData.proprietario_id,
                    members: mappedMembers,
                    createdAt: selectedGroupData.criado_em
                };

                setGroup(mappedGroup);

                const { data: expensesData, error: expError } = await supabase
                    .from('despesas_compartilhadas')
                    .select(`*, divisoes_despesa (*)`)
                    .eq('grupo_id', selectedGroupData.id)
                    .order('data_despesa', { ascending: false });

                if (expError) throw expError;

                const mappedExpenses: SharedExpense[] = expensesData?.map((exp: any) => ({
                    id: exp.id,
                    groupId: exp.grupo_id,
                    description: exp.descricao,
                    amount: exp.valor,
                    paidBy: exp.pago_por,
                    splitType: exp.tipo_divisao === 'igual' ? 'equal' : 'custom',
                    splits: exp.divisoes_despesa?.map((div: any) => ({
                        memberId: div.membro_id,
                        amount: div.valor,
                        paid: div.pago
                    })) || [],
                    date: exp.data_despesa,
                    category: exp.categoria,
                    status: mapStatusFromDb(exp.status)
                })) || [];

                setExpenses(mappedExpenses);
            } else {
                setGroup(null);
            }
        } catch (error) {
            console.error('Error fetching family data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const refreshData = async () => {
        setRefreshing(true);
        await fetchFamilyData();
    };

    const createGroup = async (name: string, description: string) => {
        try {
            if (!user) throw new Error('Usuário não autenticado');

            // 1. Criar Grupo
            const { data: groupData, error: groupError } = await supabase
                .from('grupos_familiares')
                .insert({
                    nome: name,
                    descricao: description,
                    proprietario_id: user.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Adicionar Criador como Membro Admin
            const { error: memberError } = await supabase
                .from('membros_familia')
                .insert({
                    grupo_id: groupData.id,
                    usuario_id: user.id,
                    papel: 'admin',
                    entrou_em: new Date().toISOString()
                });

            if (memberError) throw memberError;

            await fetchFamilyData();
        } catch (error) {
            console.error('Error creating group:', error);
            throw error;
        }
    };

    const addExpense = async (expenseData: Omit<SharedExpense, 'id'>) => {
        try {
            const splitTypeMap: Record<string, string> = { 'equal': 'igual', 'custom': 'personalizado', 'percentage': 'porcentagem' };

            const { data, error } = await supabase
                .from('despesas_compartilhadas')
                .insert({
                    grupo_id: expenseData.groupId,
                    descricao: expenseData.description,
                    valor: expenseData.amount,
                    pago_por: expenseData.paidBy,
                    tipo_divisao: splitTypeMap[expenseData.splitType] || expenseData.splitType,
                    data_despesa: expenseData.date,
                    categoria: expenseData.category,
                    status: mapStatusToDb(expenseData.status)
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const splitsToInsert = expenseData.splits.map(split => ({
                    despesa_id: data.id,
                    membro_id: split.memberId,
                    valor: split.amount
                }));

                const { error: splitsError } = await supabase
                    .from('divisoes_despesa')
                    .insert(splitsToInsert);

                if (splitsError) throw splitsError;

                const newExpense: SharedExpense = { id: data.id, ...expenseData };
                setExpenses(prev => [newExpense, ...prev]);
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            throw error;
        }
    };

    const updateExpense = async (id: string, data: Partial<SharedExpense>) => {
        try {
            const updateData: any = {};
            if (data.description) updateData.descricao = data.description;
            if (data.amount !== undefined) updateData.valor = data.amount;
            if (data.category) updateData.categoria = data.category;
            if (data.status) updateData.status = mapStatusToDb(data.status);

            const { error } = await supabase
                .from('despesas_compartilhadas')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, ...data } : exp));
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            await supabase.from('divisoes_despesa').delete().eq('despesa_id', id);
            const { error } = await supabase.from('despesas_compartilhadas').delete().eq('id', id);
            if (error) throw error;
            setExpenses(prev => prev.filter(exp => exp.id !== id));
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    };

    const inviteMember = async (email: string, role: 'admin' | 'member') => {
        try {
            if (!group) throw new Error('No family group selected');

            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', email)
                .single();

            if (userError) throw new Error('Usuário não encontrado com este email.');

            const { error } = await supabase
                .from('membros_familia')
                .insert({
                    grupo_id: group.id,
                    usuario_id: userData.id,
                    papel: role === 'member' ? 'membro' : role
                });

            if (error) throw error;
            await fetchFamilyData();
        } catch (error) {
            console.error('Error inviting member:', error);
            throw error;
        }
    };

    const addGhostMember = async (name: string, role: 'member' = 'member') => {
        try {
            if (!group) throw new Error('No family group selected');

            const { error } = await supabase
                .from('membros_familia')
                .insert({
                    grupo_id: group.id,
                    usuario_id: null,
                    nome: name,
                    papel: role === 'member' ? 'membro' : role,
                    entrou_em: new Date().toISOString()
                });

            if (error) throw error;
            await fetchFamilyData();
        } catch (error) {
            console.error('Error adding ghost member:', error);
            throw error;
        }
    };

    const removeMember = async (memberId: string) => {
        try {
            const { error } = await supabase
                .from('membros_familia')
                .delete()
                .eq('id', memberId);

            if (error) throw error;

            if (group) {
                setGroup({
                    ...group,
                    members: group.members.filter(m => m.id !== memberId)
                });
            }
        } catch (error) {
            console.error('Error removing member:', error);
            throw error;
        }
    };

    const settleDebt = async (expenseId: string) => {
        try {
            const { error: expenseError } = await supabase
                .from('despesas_compartilhadas')
                .update({ status: 'quitado' })
                .eq('id', expenseId);

            if (expenseError) throw expenseError;

            const { error: splitsError } = await supabase
                .from('divisoes_despesa')
                .update({ pago: true })
                .eq('despesa_id', expenseId);

            if (splitsError) throw splitsError;

            setExpenses(prev => prev.map(exp =>
                exp.id === expenseId ? {
                    ...exp,
                    status: 'settled' as const,
                    splits: exp.splits.map(s => ({ ...s, paid: true }))
                } : exp
            ));
        } catch (error) {
            console.error('Error settling debt:', error);
            throw error;
        }
    };

    const payExpense = async (expenseId: string, paidBy: string) => {
        try {
            const { error } = await supabase
                .from('despesas_compartilhadas')
                .update({ status: 'pendente', pago_por: paidBy })
                .eq('id', expenseId);

            if (error) throw error;

            setExpenses(prev => prev.map(exp =>
                exp.id === expenseId ? { ...exp, status: 'pending', paidBy } : exp
            ));
        } catch (error) {
            console.error('Error paying expense:', error);
            throw error;
        }
    };

    const settleAllDebts = async (fromMemberId: string, toMemberId: string) => {
        try {
            const expensesToUpdate = expenses.filter(exp =>
                exp.status === 'pending' &&
                exp.paidBy === toMemberId &&
                exp.splits.some(s => s.memberId === fromMemberId && !s.paid)
            );

            const expenseIds = expensesToUpdate.map(e => e.id);
            if (expenseIds.length === 0) return;

            const { error } = await supabase
                .from('divisoes_despesa')
                .update({ pago: true })
                .in('despesa_id', expenseIds)
                .eq('membro_id', fromMemberId);

            if (error) throw error;

            await fetchFamilyData();
        } catch (error) {
            console.error('Error settling debts:', error);
            throw error;
        }
    };

    return (
        <FamilyContext.Provider value={{
            group,
            expenses,
            loading,
            refreshing,
            refreshData,
            createGroup,
            addExpense,
            updateExpense,
            deleteExpense,
            inviteMember,
            addGhostMember,
            removeMember,
            settleDebt,
            payExpense,
            settleAllDebts
        }}>
            {children}
        </FamilyContext.Provider>
    );
};

export const useFamily = () => {
    const context = useContext(FamilyContext);
    if (!context) throw new Error('useFamily must be used within FamilyProvider');
    return context;
};
