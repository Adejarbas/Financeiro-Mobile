/**
 * 🔐 FINANÇAS PRO GOLD - AUTH CONTEXT
 * Gerenciamento de estado de autenticação com Supabase
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Usuario } from '../types';

interface AuthContextData {
    user: User | null;
    userProfile: Usuario | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, nome: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<Usuario>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Usuario | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Carregar sessão inicial
    useEffect(() => {
        loadSession();

        // Listener para mudanças de autenticação
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('Auth event:', event);
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    await loadUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    async function loadSession() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await loadUserProfile(session.user.id);
            }
        } catch (error) {
            console.error('Erro ao carregar sessão:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadUserProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setUserProfile(data);
        } catch (error) {
            console.error('Erro ao carregar perfil:', error);
        }
    }

    async function signIn(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            console.error('Erro no login:', error);
            return { error: error as Error };
        }
    }

    async function signUp(email: string, password: string, nome: string) {
        try {
            // 1. Criar usuário no auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Erro ao criar usuário');
            }

            // 2. Criar perfil na tabela usuarios
            const { error: profileError } = await supabase.from('usuarios').insert({
                id: authData.user.id,
                email,
                nome,
                moeda: 'BRL',
                plano: 'basico',
                eh_admin: false,
            });

            if (profileError) throw profileError;

            return { error: null };
        } catch (error) {
            console.error('Erro no cadastro:', error);
            return { error: error as Error };
        }
    }

    async function signOut() {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
            setSession(null);
        } catch (error) {
            console.error('Erro no logout:', error);
        }
    }

    async function updateProfile(updates: Partial<Usuario>) {
        try {
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const { error } = await supabase
                .from('usuarios')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Atualizar perfil local
            setUserProfile(prev => (prev ? { ...prev, ...updates } : null));

            return { error: null };
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { error: error as Error };
        }
    }

    const value = {
        user,
        userProfile,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
