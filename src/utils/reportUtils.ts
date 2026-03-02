import { TransacaoComRelacoes, Categoria } from '../types';

export interface DailyData {
    day: string;
    income: number;
    expense: number;
    balance: number;
}

export interface MonthlyData {
    month: string;
    income: number;
    expense: number;
    balance: number;
}

export interface CategoryData {
    category: string;
    categoryId: string;
    amount: number;
    count: number;
    percentage: number;
    color?: string;
    icon?: string;
}

export interface ReportMetrics {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    averageIncome: number;
    averageExpense: number;
    savingsRate: number;
    largestExpense: { description: string; amount: number; category: string };
    largestIncome: { description: string; amount: number; category: string };
    transactionCount: number;
}

export interface Insight {
    type: 'success' | 'warning' | 'info' | 'danger';
    title: string;
    message: string;
    value?: string;
}

export const groupByDay = (transactions: TransacaoComRelacoes[]): DailyData[] => {
    const grouped = transactions.reduce((acc, t) => {
        // Assume t.data_transacao is YYYY-MM-DD
        const day = t.data_transacao.split('-')[2];

        if (!acc[day]) {
            acc[day] = { day, income: 0, expense: 0, balance: 0 };
        }

        if (t.tipo === 'receita') {
            acc[day].income += t.valor;
        } else {
            acc[day].expense += t.valor;
        }

        acc[day].balance = acc[day].income - acc[day].expense;

        return acc;
    }, {} as Record<string, DailyData>);

    return Object.values(grouped).sort((a, b) => parseInt(a.day) - parseInt(b.day));
};

export const groupByMonth = (transactions: TransacaoComRelacoes[]): MonthlyData[] => {
    const grouped = transactions.reduce((acc, t) => {
        const month = t.data_transacao.substring(0, 7); // YYYY-MM

        if (!acc[month]) {
            acc[month] = { month, income: 0, expense: 0, balance: 0 };
        }

        if (t.tipo === 'receita') {
            acc[month].income += t.valor;
        } else {
            acc[month].expense += t.valor;
        }

        acc[month].balance = acc[month].income - acc[month].expense;

        return acc;
    }, {} as Record<string, MonthlyData>);

    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
};

export const groupByCategory = (transactions: TransacaoComRelacoes[], categoriesStore: Categoria[]): CategoryData[] => {
    const expenses = transactions.filter(t => t.tipo === 'despesa');
    const total = expenses.reduce((sum, t) => sum + t.valor, 0);

    const grouped = expenses.reduce((acc, t) => {
        const catName = t.categorias?.nome || 'Geral';
        const catId = t.categoria_id || 'geral';

        if (!acc[catId]) {
            acc[catId] = {
                category: catName,
                categoryId: catId,
                amount: 0,
                count: 0,
                percentage: 0,
                color: t.categorias?.cor,
                icon: t.categorias?.icone
            };
        }

        acc[catId].amount += t.valor;
        acc[catId].count += 1;

        return acc;
    }, {} as Record<string, CategoryData>);

    return Object.values(grouped)
        .map(cat => ({
            ...cat,
            percentage: total > 0 ? (cat.amount / total) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount);
};

export const calculateMetrics = (transactions: TransacaoComRelacoes[]): ReportMetrics => {
    const income = transactions.filter(t => t.tipo === 'receita');
    const expenses = transactions.filter(t => t.tipo === 'despesa');

    const totalIncome = income.reduce((sum, t) => sum + t.valor, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.valor, 0);
    const balance = totalIncome - totalExpense;

    const averageIncome = income.length > 0 ? totalIncome / income.length : 0;
    const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;

    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const largestExpense = expenses.reduce((max, t) =>
        t.valor > max.amount ? { description: t.descricao, amount: t.valor, category: t.categorias?.nome || 'Geral' } : max,
        { description: '', amount: 0, category: '' }
    );

    const largestIncome = income.reduce((max, t) =>
        t.valor > max.amount ? { description: t.descricao, amount: t.valor, category: t.categorias?.nome || 'Geral' } : max,
        { description: '', amount: 0, category: '' }
    );

    return {
        totalIncome,
        totalExpense,
        balance,
        averageIncome,
        averageExpense,
        savingsRate,
        largestExpense,
        largestIncome,
        transactionCount: transactions.length
    };
};

export const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

export const comparePeriods = (
    currentTransactions: TransacaoComRelacoes[],
    previousTransactions: TransacaoComRelacoes[]
) => {
    const currentMetrics = calculateMetrics(currentTransactions);
    const previousMetrics = calculateMetrics(previousTransactions);

    return {
        incomeGrowth: calculateGrowth(currentMetrics.totalIncome, previousMetrics.totalIncome),
        expenseGrowth: calculateGrowth(currentMetrics.totalExpense, previousMetrics.totalExpense),
        balanceGrowth: calculateGrowth(currentMetrics.balance, previousMetrics.balance),
        savingsRateChange: currentMetrics.savingsRate - previousMetrics.savingsRate
    };
};

export const generateInsights = (
    transactions: TransacaoComRelacoes[],
    previousTransactions: TransacaoComRelacoes[],
    reportType: 'cashflow' | 'category' | 'annual' = 'cashflow'
): Insight[] => {
    const insights: Insight[] = [];
    const metrics = calculateMetrics(transactions);
    const comparison = comparePeriods(transactions, previousTransactions);

    // INSIGHTS GERAIS / FLUXO DE CAIXA
    if (reportType === 'cashflow') {
        if (metrics.balance > 0) {
            insights.push({
                type: 'success',
                title: 'Parabéns',
                message: `Você economizou neste período`,
                value: `R$ ${metrics.balance.toFixed(2).replace('.', ',')}`
            });
        } else if (metrics.balance < 0) {
            insights.push({
                type: 'warning',
                title: 'Atenção',
                message: 'Você gastou mais do que recebeu',
                value: `R$ ${Math.abs(metrics.balance).toFixed(2).replace('.', ',')}`
            });
        }

        if (comparison.expenseGrowth > 20) {
            insights.push({
                type: 'warning',
                title: 'Gastos Aumentaram',
                message: `Suas despesas cresceram ${comparison.expenseGrowth.toFixed(0)}% comparado ao período anterior`
            });
        } else if (comparison.expenseGrowth < -10) {
            insights.push({
                type: 'success',
                title: 'Economia Realizada',
                message: `Você reduziu suas despesas em ${Math.abs(comparison.expenseGrowth).toFixed(0)}%`
            });
        }

        if (metrics.savingsRate >= 20) {
            insights.push({
                type: 'success',
                title: 'Ótima Taxa de Poupança',
                message: `Você está poupando ${metrics.savingsRate.toFixed(0)}% da sua renda`
            });
        } else if (metrics.savingsRate < 10 && metrics.savingsRate > 0) {
            insights.push({
                type: 'info',
                title: 'Dica de Economia',
                message: `Tente poupar mais. Hoje você poupa ${metrics.savingsRate.toFixed(0)}% da renda`
            });
        }
    }

    // INSIGHTS DE CATEGORIA
    if (reportType === 'category') {
        if (metrics.largestExpense.amount > 0) {
            insights.push({
                type: 'warning',
                title: 'Atenção ao Vilão',
                message: `A categoria "${metrics.largestExpense.category}" foi a responsável pelo seu maior gasto único.`,
                value: `R$ ${metrics.largestExpense.amount.toFixed(2).replace('.', ',')}`
            });
        }

        // Concentração de gastos
        const expenses = transactions.filter(t => t.tipo === 'despesa');
        const grouped = expenses.reduce((acc, t) => {
            const catId = t.categoria_id || 'geral';
            if (!acc[catId]) acc[catId] = { name: t.categorias?.nome || 'Geral', amount: 0 };
            acc[catId].amount += t.valor;
            return acc;
        }, {} as Record<string, { name: string, amount: number }>);

        const topCategory = Object.values(grouped).sort((a, b) => b.amount - a.amount)[0];

        if (topCategory && metrics.totalExpense > 0) {
            const pct = (topCategory.amount / metrics.totalExpense) * 100;
            if (pct > 40) {
                insights.push({
                    type: 'danger',
                    title: 'Concentração de Gastos',
                    message: `Cuidado! Mais de ${pct.toFixed(0)}% das suas saídas estão concentradas apenas em "${topCategory.name}".`
                });
            } else if (pct < 20) {
                insights.push({
                    type: 'success',
                    title: 'Gastos Diversificados',
                    message: `Excelente: seus gastos estão bem distribuídos. Nenhuma categoria agrupa mais de 20% das despesas.`
                });
            }
        }
    }

    // INSIGHTS DE EVOLUÇÃO TEMPORAL (ANUAL)
    if (reportType === 'annual') {
        // Velocidade de queima de caixa ou Sobras Diárias
        const diasNoMes = 30; // Aproximação
        if (metrics.balance > 0) {
            const sobraDiaria = metrics.balance / diasNoMes;
            insights.push({
                type: 'success',
                title: 'Consistência',
                message: `Você está acumulando uma média de R$ ${sobraDiaria.toFixed(2).replace('.', ',')} por dia positivo neste período.`
            });
        }

        if (comparison.incomeGrowth > 10) {
            insights.push({
                type: 'success',
                title: 'Renda em Crescimento',
                message: `Excelente progresso! Sua renda está crescendo a um ritmo de ${comparison.incomeGrowth.toFixed(0)}% frente ao período anterior.`
            });
        } else if (comparison.incomeGrowth < -5) {
            insights.push({
                type: 'warning',
                title: 'Atenção à Receita',
                message: `Sua entrada de dinheiro sofreu uma queda de ${Math.abs(comparison.incomeGrowth).toFixed(0)}%. Fique de olho!`
            });
        }

        if (metrics.savingsRate > 0) {
            insights.push({
                type: 'info',
                title: 'Visão de Longo Prazo',
                message: `Mantendo essa taxa de poupança de ${metrics.savingsRate.toFixed(0)}%, você está construindo uma boa reserva estratégica através do tempo.`
            });
        }
    }

    return insights;
};
