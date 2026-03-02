/**
 * 🎨 FINANÇAS PRO GOLD - DESIGN SYSTEM
 * Paleta de cores alinhada com o sistema Web (Dark + Light Premium Theme)
 */

const darkColors = {
    // === FUNDOS ===
    background: '#0F1219',
    card: '#161B22',
    cardHover: '#1C2128',
    border: '#27272A',
    divider: '#21262D',
    primary: '#0D9488',
    shadow: 'rgba(0, 0, 0, 0.2)',

    // === SIDEBAR/NAVEGAÇÃO ===
    sidebar: '#0D1117',
    sidebarActive: '#D4AF37',
    sidebarInactive: '#6E7681',

    // === TEXTOS ===
    text: '#F3F4F6',
    textSubtle: '#94A3B8',
    textMuted: '#6B7280',
    textInverted: '#0F1219',

    // === CORES DE AÇÃO (GOLD THEME) ===
    gold: '#D4AF37',
    goldLight: '#F59E0B',
    goldDark: '#B8941F',

    // === CORES SECUNDÁRIAS (TEAL THEME) ===
    teal: '#0D9488',
    tealLight: '#14B8A6',
    tealDark: '#115E59',

    // === STATUS E SEMÂNTICAS ===
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',

    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',

    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',

    purple: '#A855F7',
    purpleLight: '#C084FC',
    purpleDark: '#7E22CE',

    // === GRÁFICOS ===
    chart1: '#3B82F6',
    chart2: '#10B981',
    chart3: '#F59E0B',
    chart4: '#EF4444',
    chart5: '#8B5CF6',
    chart6: '#14B8A6',

    // === TRANSPARÊNCIAS E EFEITOS ===
    overlay: 'rgba(0, 0, 0, 0.8)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
    glassmorphism: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.2)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowHeavy: 'rgba(0, 0, 0, 0.6)',
    goldGlow: 'rgba(212, 175, 55, 0.15)',
    successGlow: 'rgba(16, 185, 129, 0.15)',
    errorGlow: 'rgba(239, 68, 68, 0.15)',

    // === GRADIENTES ===
    gradientGold: ['#D4AF37', '#F59E0B'] as const,
    gradientSuccess: ['#10B981', '#34D399'] as const,
    gradientError: ['#EF4444', '#F87171'] as const,
    gradientDark: ['#0F1219', '#161B22'] as const,
    gradientCard: ['#161B22', '#1C2128'] as const,

    // === GRÁFICO TOOLTIP ===
    chartTooltipBg: '#161B22',
    chartGrid: '#2c3036',
    chartAxis: '#94A3B8',
};

const lightColors = {
    // === FUNDOS ===
    background: '#F1F5F9',
    card: '#FFFFFF',
    cardHover: '#F8FAFC',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    primary: '#0D9488',
    shadow: 'rgba(0, 0, 0, 0.08)',

    // === SIDEBAR/NAVEGAÇÃO ===
    sidebar: '#1E293B',
    sidebarActive: '#D4AF37',
    sidebarInactive: '#94A3B8',

    // === TEXTOS ===
    text: '#0F172A',
    textSubtle: '#64748B',
    textMuted: '#94A3B8',
    textInverted: '#0F1219',

    // === CORES DE AÇÃO (GOLD THEME) ===
    gold: '#D4AF37',
    goldLight: '#F59E0B',
    goldDark: '#B8941F',

    // === CORES SECUNDÁRIAS (TEAL THEME) ===
    teal: '#0D9488',
    tealLight: '#14B8A6',
    tealDark: '#115E59',

    // === STATUS E SEMÂNTICAS ===
    success: '#10B981',
    successLight: '#34D399',
    successDark: '#059669',

    error: '#EF4444',
    errorLight: '#F87171',
    errorDark: '#DC2626',

    warning: '#F59E0B',
    warningLight: '#FBBF24',
    warningDark: '#D97706',

    info: '#3B82F6',
    infoLight: '#60A5FA',
    infoDark: '#2563EB',

    purple: '#A855F7',
    purpleLight: '#C084FC',
    purpleDark: '#7E22CE',

    // === GRÁFICOS ===
    chart1: '#3B82F6',
    chart2: '#10B981',
    chart3: '#F59E0B',
    chart4: '#EF4444',
    chart5: '#8B5CF6',
    chart6: '#14B8A6',

    // === TRANSPARÊNCIAS E EFEITOS ===
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    glassmorphism: 'rgba(255, 255, 255, 0.6)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    shadowLight: 'rgba(0, 0, 0, 0.05)',
    shadowMedium: 'rgba(0, 0, 0, 0.1)',
    shadowHeavy: 'rgba(0, 0, 0, 0.2)',
    goldGlow: 'rgba(212, 175, 55, 0.15)',
    successGlow: 'rgba(16, 185, 129, 0.15)',
    errorGlow: 'rgba(239, 68, 68, 0.15)',

    // === GRADIENTES ===
    gradientGold: ['#D4AF37', '#F59E0B'] as const,
    gradientSuccess: ['#10B981', '#34D399'] as const,
    gradientError: ['#EF4444', '#F87171'] as const,
    gradientDark: ['#F1F5F9', '#FFFFFF'] as const,
    gradientCard: ['#FFFFFF', '#F8FAFC'] as const,

    // === GRÁFICO TOOLTIP ===
    chartTooltipBg: '#FFFFFF',
    chartGrid: '#E2E8F0',
    chartAxis: '#64748B',
};

export type ColorPalette = typeof darkColors | typeof lightColors;

/**
 * Retorna a paleta de cores baseada no modo (escuro ou claro)
 */
export function getColors(isDark: boolean): typeof darkColors {
    return isDark ? darkColors : (lightColors as unknown as typeof darkColors);
}

// Exporta dark como padrão para compatibilidade legada
export const colors = darkColors;

// Categorias de cores para transações
export const categoryColors = {
    alimentacao: '#EF4444',
    transporte: '#F97316',
    saude: '#EC4899',
    educacao: '#8B5CF6',
    lazer: '#06B6D4',
    salario: '#10B981',
    freelance: '#14B8A6',
    investimentos: '#3B82F6',
    outros: '#6B7280',
};

// Tipos de conta (cores para cards)
export const accountTypeColors = {
    corrente: '#3B82F6',
    investimento: '#10B981',
    credito: '#F59E0B',
    cripto: '#8B5CF6',
    poupanca: '#14B8A6',
};

export default colors;
