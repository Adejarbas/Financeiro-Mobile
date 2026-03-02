/**
 * 📝 FINANÇAS PRO GOLD - TYPESCRIPT TYPES
 * Definições de tipos baseadas no schema do banco de dados
 */

// ===== USUÁRIOS =====
export interface Usuario {
    id: string;
    email: string;
    nome: string;
    avatar_url?: string;
    moeda: string;
    plano: 'basico' | 'premium' | 'empresarial';
    eh_admin: boolean;
    criado_em: string;
}

// ===== CONTAS =====
export type TipoConta = 'Corrente' | 'Investimento' | 'Cripto' | 'Credito' | 'Poupanca';

export interface Conta {
    id: string;
    usuario_id: string;
    nome: string;
    tipo: TipoConta;
    saldo: number;
    nome_banco?: string;
    ativa: boolean;
    cor?: string;
    limite_credito?: number;
    fatura_atual?: number;
}

// ===== CATEGORIAS =====
export type TipoCategoria = 'receita' | 'despesa';

export interface Categoria {
    id: string;
    nome: string;
    tipo: TipoCategoria;
    icone: string;
    cor: string;
    eh_padrao: boolean;
}

// ===== TRANSAÇÕES =====
export type TipoTransacao = 'receita' | 'despesa';
export type StatusTransacao = 'Concluído' | 'Pendente';
export type TipoRecorrencia = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Transacao {
    id: string;
    usuario_id: string;
    conta_id: string;
    categoria_id: string;
    descricao: string;
    valor: number;
    data_transacao: string;
    tipo: TipoTransacao;
    status: StatusTransacao;
    eh_recorrente: boolean;
    tipo_recorrencia?: TipoRecorrencia;
    data_fim_recorrencia?: string;
    criado_em?: string;
}

// Transação com relações populadas (para listagens)
export interface TransacaoComRelacoes extends Transacao {
    categorias?: Categoria;
    contas?: Conta;
}

// ===== INVESTIMENTOS =====
export type TipoInvestimento = 'stocks' | 'crypto' | 'fiis' | 'bonds' | 'other';

export interface Investimento {
    id: string;
    usuario_id: string;
    simbolo: string;
    nome: string;
    quantidade: number;
    preco_medio: number;
    preco_atual: number;
    tipo: TipoInvestimento;
    data_compra: string;
    variacao_24h?: number;
    variacao_percentual?: number;
    valor_aplicado?: number;
    taxa_contratada?: string;
    data_vencimento?: string;
}

// Investimento com cálculos (para exibição)
export interface InvestimentoCalculado extends Investimento {
    valor_total: number;
    lucro_prejuizo: number;
    percentual_lucro: number;
}

// ===== METAS =====
export interface Meta {
    id: string;
    usuario_id: string;
    nome: string;
    valor_alvo: number;
    valor_atual: number;
    prazo: string;
    categoria?: string;
    status?: string;
    cor?: string;
    criado_em?: string;
}

// Meta com cálculos
export interface MetaCalculada extends Meta {
    progresso: number;
    restante: number;
    dias_restantes: number;
}

// ===== ORÇAMENTOS =====
export interface Orcamento {
    id: string;
    usuario_id: string;
    categoria_id: string;
    valor_planejado: number;
    mes: string; // formato: 'YYYY-MM'
}

// Orçamento com dados da categoria e gasto real
export interface OrcamentoComDados extends Orcamento {
    categoria?: Categoria;
    gasto_real: number;
    percentual_usado: number;
    esta_excedido: boolean;
    em_alerta: boolean; // >= 80%
}

// ===== EMPRESAS =====
export interface Empresa {
    id: string;
    usuario_id: string;
    cnpj: string;
    razao_social: string;
    nome_fantasia?: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    criado_em?: string;
}

// ===== CLIENTES =====
export interface Cliente {
    id: string;
    usuario_id: string;
    nome: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    criado_em?: string;
}

// ===== NOTAS FISCAIS =====
export type StatusNotaFiscal = 'Emitida' | 'Cancelada' | 'Pendente';

export interface NotaFiscal {
    id: string;
    usuario_id: string;
    empresa_id: string;
    cliente_id: string;
    numero_nota: string;
    valor_total: number;
    data_emissao: string;
    status: StatusNotaFiscal;
    transacao_id?: string;
    xml_url?: string;
}

// ===== FAMÍLIA =====
export interface FamilyGroup {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    members: FamilyMember[];
    createdAt: string;
}

export type FamilyRole = 'owner' | 'admin' | 'member';

export interface FamilyMember {
    id: string;
    userId?: string;
    name: string;
    email: string;
    role: FamilyRole;
    avatarUrl: string;
    joinedAt: string;
    // Legacy support depending on previous mobile app components
    nome_membro?: string;
    email_membro?: string;
    papel?: string;
    avatar_emoji?: string;
    usuario_pai_id?: string;
}

export interface ExpenseSplit {
    memberId: string;
    amount: number;
    paid: boolean;
}

export interface SharedExpense {
    id: string;
    groupId: string;
    description: string;
    amount: number;
    paidBy: string; // memberId
    splitType: 'equal' | 'custom' | 'percentage';
    splits: ExpenseSplit[];
    date: string;
    category: string;
    status: 'pending' | 'settled' | 'open';
}

export interface Settlement {
    from: string; // memberId
    to: string; // memberId
    amount: number;
}

// ===== DASHBOARD (Tipos calculados) =====
export interface DashboardMetrics {
    saldoTotal: number;
    receitasMes: number;
    despesasMes: number;
    lucroMes: number;
    variacaoSaldo: number; // Percentual
    variacaoReceitas: number;
    variacaoDespesas: number;
}

export interface TransacaoRecente extends TransacaoComRelacoes {
    grupo_data?: string; // "Hoje", "Ontem", "Esta Semana"
}

export interface ChartData {
    label: string;
    value: number;
    color?: string;
}

export interface ChartDataMulti {
    label: string;
    values: {
        receitas: number;
        despesas: number;
    };
}

// ===== AUTENTICAÇÃO =====
export interface AuthUser {
    id: string;
    email: string;
    nome?: string;
    avatar_url?: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials extends LoginCredentials {
    nome: string;
}

// ===== API RESPONSES =====
export interface ApiResponse<T> {
    data: T | null;
    error: Error | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    perPage: number;
}

// ===== UTILITÁRIOS =====
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
    tipo?: TipoTransacao;
    categoria_id?: string;
    conta_id?: string;
    status?: StatusTransacao;
    data_inicio?: string;
    data_fim?: string;
    busca?: string;
}

export interface SortOptions {
    field: string;
    order: SortOrder;
}

export interface Noticia {
    id: string;
    titulo: string;
    fonte: string;
    data_publicacao: string;
    imagem_url: string;
    categoria: string;
    link_url: string;
    url?: string;
    resumo?: string;
}

export interface ChatMessage {
    id: string;
    usuario_id: string;
    texto: string;
    remetente: 'user' | 'ai';
    created_at: string;
}

export interface SystemLog {
    time: string;
    message: string;
    type: 'info' | 'success' | 'error';
}

export interface DashboardSummary {
    saldo_total: number;
    receitas: number;
    despesas: number;
    lucro: number;
    saldo_contas: number;
    saldo_investimentos: number;
    month_start: string;
    month_end: string;
}

