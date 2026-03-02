/**
 * 💰 FINANÇAS PRO GOLD - CURRENCY UTILS
 * Utilitários para formatação de valores monetários
 */

/**
 * Formata um valor numérico para moeda brasileira (BRL)
 * @param value Valor a ser formatado
 * @param showSymbol Se deve mostrar o símbolo R$ (padrão: true)
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number, showSymbol: boolean = true): string {
    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);

    return showSymbol ? formatted : formatted.replace('R$', '').trim();
}

/**
 * Formata um valor para exibição compacta (ex: 1.2K, 3.5M)
 * @param value Valor a ser formatado
 * @returns String formatada
 */
export function formatCompactCurrency(value: number): string {
    if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(1)}K`;
    }
    return formatCurrency(value);
}

/**
 * Formata um percentual
 * @param value Valor decimal (ex: 0.12 = 12%)
 * @param decimals Número de casas decimais (padrão: 1)
 * @param showSign Se deve mostrar o sinal + para valores positivos
 * @returns String formatada (ex: "+12.5%")
 */
export function formatPercentage(
    value: number,
    decimals: number = 1,
    showSign: boolean = true
): string {
    const percentage = (value * 100).toFixed(decimals);
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${percentage}%`;
}

/**
 * Formata um percentual já calculado (ex: 12.5 -> "+12.5%")
 * @param value Valor percentual (ex: 12.5)
 * @param decimals Número de casas decimais
 * @param showSign Se deve mostrar o sinal +
 * @returns String formatada
 */
export function formatPercentageRaw(
    value: number,
    decimals: number = 1,
    showSign: boolean = true
): string {
    const formatted = value.toFixed(decimals);
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${formatted}%`;
}

/**
 * Converte string de moeda para número
 * Remove formatação e converte para float
 * @param value String com valor formatado (ex: "R$ 1.234,56")
 * @returns Número (ex: 1234.56)
 */
export function parseCurrency(value: string): number {
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = value.replace(/[^\d,.-]/g, '');
    // Substitui vírgula por ponto
    const normalized = cleaned.replace(',', '.');
    return parseFloat(normalized) || 0;
}

/**
 * Retorna a cor apropriada para um valor monetário
 * @param value Valor a ser analisado
 * @param invertColors Se deve inverter cores (receita=vermelho, despesa=verde)
 * @returns Código de cor hex
 */
export function getValueColor(value: number, invertColors: boolean = false): string {
    const colors = {
        positive: '#10B981', // Verde (receita)
        negative: '#EF4444', // Vermelho (despesa)
        neutral: '#94A3B8',  // Cinza
    };

    if (value === 0) return colors.neutral;

    if (invertColors) {
        return value > 0 ? colors.negative : colors.positive;
    }

    return value > 0 ? colors.positive : colors.negative;
}

/**
 * Formata data para padrão brasileiro
 * @param date String de data ou objeto Date
 * @param includeTime Se deve incluir horário
 * @returns String formatada (ex: "16/02/2026" ou "16/02/2026 14:30")
 */
export function formatDate(date: string | Date, includeTime: boolean = false): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('pt-BR', options).format(dateObj);
}

/**
 * Retorna uma descrição relativa da data (Hoje, Ontem, Esta Semana, etc)
 * @param date String de data ou objeto Date
 * @returns String descritiva
 */
export function getRelativeDate(date: string | Date): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Resetar horas para comparação apenas de datas
    const resetTime = (d: Date) => {
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const targetDate = resetTime(new Date(dateObj));
    const todayReset = resetTime(new Date(today));
    const yesterdayReset = resetTime(new Date(yesterday));

    if (targetDate.getTime() === todayReset.getTime()) {
        return 'Hoje';
    }

    if (targetDate.getTime() === yesterdayReset.getTime()) {
        return 'Ontem';
    }

    // Esta semana
    const weekAgo = new Date(todayReset);
    weekAgo.setDate(weekAgo.getDate() - 7);

    if (targetDate > weekAgo) {
        return 'Esta Semana';
    }

    // Este mês
    const monthAgo = new Date(todayReset);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (targetDate > monthAgo) {
        return 'Este Mês';
    }

    // Retorna data formatada
    return formatDate(dateObj);
}

/**
 * Calcula a diferença em dias entre duas datas
 * @param date1 Data inicial
 * @param date2 Data final (padrão: hoje)
 * @returns Número de dias
 */
export function getDaysDifference(date1: string | Date, date2: string | Date = new Date()): number {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Formata um mês no padrão YYYY-MM
 * @param date Data a ser formatada
 * @returns String no formato "YYYY-MM"
 */
export function formatMonthKey(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Retorna o primeiro e último dia de um mês
 * @param monthKey String no formato "YYYY-MM"
 * @returns Objeto com firstDay e lastDay
 */
export function getMonthRange(monthKey: string): { firstDay: string; lastDay: string } {
    const [year, month] = monthKey.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    return {
        firstDay: firstDay.toISOString().split('T')[0],
        lastDay: lastDay.toISOString().split('T')[0],
    };
}
