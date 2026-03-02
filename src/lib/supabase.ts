/**
 * 🔌 FINANÇAS PRO GOLD - SUPABASE CLIENT
 * Configuração do cliente Supabase para comunicação com o backend
 */

import { createClient } from '@supabase/supabase-js';

// Credenciais do Supabase (configuradas via variáveis de ambiente)
const SUPABASE_URL = 'https://hqyxuhevjanvaccpcqme.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uOLNeHlkCI4gmBHSP2Fy1A_f7kgxAif';

// Validação das credenciais
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        '⚠️ Erro: Credenciais do Supabase não configuradas!\n' +
        'Certifique-se de que SUPABASE_URL e SUPABASE_ANON_KEY estão definidos.'
    );
}

// Criação do cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        // Configurações de autenticação
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Helper para verificar a conexão
export async function testConnection() {
    try {
        const { error } = await supabase.from('usuarios').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Conexão com Supabase estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com Supabase:', error);
        return false;
    }
}

export default supabase;
