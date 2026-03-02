import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { TransacaoComRelacoes, Conta } from '../types';

export interface ReportData {
    transactions: TransacaoComRelacoes[];
    dateRange: { start: string; end: string; label: string };
    metrics: {
        totalIncome: number;
        totalExpense: number;
        balance: number;
        savingsRate: number;
        averageIncome: number;
        averageExpense: number;
    };
    categoryBreakdown?: Array<{ category: string; amount: number; percentage: number }>;
    insights?: Array<{ type: string; title: string; message: string; value?: string }>;
    comparison?: {
        incomeGrowth: number;
        expenseGrowth: number;
        balanceGrowth: number;
    };
    accounts?: Conta[];
}

const getCategoryName = (categoryId?: string, count: number = 0) => {
    return categoryId ? categoryId : 'Geral';
}

export const exportReportToPDF = async (data: ReportData) => {
    try {
        const today = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        // Helper para nome da conta
        const getAccName = (accountId: string) => {
            const acc = (data.accounts || []).find(a => a.id === accountId);
            return acc?.nome || '-';
        };

        const balanceColor = data.metrics.balance >= 0 ? '#10B981' : '#DC2626';

        let insightsHtml = '';
        if (data.insights && data.insights.length > 0) {
            insightsHtml = `
                <div class="section-title">INSIGHTS E RECOMENDAÇÕES</div>
                <div class="insights-container">
                    ${data.insights.slice(0, 4).map(insight => {
                let color = '#6B7280';
                if (insight.type === 'success') color = '#10B981';
                else if (insight.type === 'warning') color = '#F59E0B';
                else if (insight.type === 'danger') color = '#DC2626';
                else if (insight.type === 'info') color = '#3B82F6';

                return `
                            <div class="insight-card" style="border-left-color: ${color}">
                                <div class="insight-header">
                                    <span class="insight-title" style="color: ${color}">${insight.title}</span>
                                    ${insight.value ? `<span class="insight-value" style="color: ${color}">${insight.value}</span>` : ''}
                                </div>
                                <div class="insight-message">${insight.message}</div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        }

        let categoryHtml = '';
        if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
            categoryHtml = `
                <div style="page-break-before: always;"></div>
                <div class="section-title">DESPESAS POR CATEGORIA</div>
                <div class="divider"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Categoria</th>
                            <th style="text-align: right;">Valor</th>
                            <th style="text-align: center;">% do Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.categoryBreakdown.map((cat, i) => `
                            <tr class="${i % 2 === 0 ? 'even-row' : 'odd-row'}">
                                <td>${cat.category}</td>
                                <td align="right" style="font-weight: bold;">${formatCurrency(cat.amount)}</td>
                                <td align="center">${cat.percentage.toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        const transactionsHtml = `
            <div style="page-break-before: always;"></div>
            <div class="section-title">TRANSAÇÕES DETALHADAS</div>
            <div class="divider"></div>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Tipo</th>
                        <th style="text-align: right;">Valor</th>
                        <th>Conta</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.transactions.map((t, i) => {
            const dateSplit = t.data_transacao.split('T')[0].split('-');
            const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;
            const typeLabel = t.tipo === 'receita' ? 'Receita' : 'Despesa';

            return `
                        <tr class="${i % 2 === 0 ? 'even-row' : 'odd-row'}">
                            <td>${formattedDate}</td>
                            <td>${t.descricao}</td>
                            <td>${t.categorias?.nome || 'Geral'}</td>
                            <td>${typeLabel}</td>
                            <td align="right" style="font-weight: bold; color: ${t.tipo === 'receita' ? '#10B981' : '#DC2626'}">
                                ${t.tipo === 'receita' ? '+' : '-'}${formatCurrency(t.valor)}
                            </td>
                            <td>${getAccName(t.conta_id)}</td>
                        </tr>
                        `}).join('')}
                </tbody>
            </table>
        `;

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório Financeiro Completo</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                        background-color: #fff;
                    }
                    .header-border {
                        border-top: 4px solid #D4AF37;
                        margin-bottom: 20px;
                    }
                    .title {
                        font-size: 32px;
                        font-weight: bold;
                        text-align: center;
                        color: #000;
                        margin-bottom: 5px;
                    }
                    .subtitle {
                        font-size: 16px;
                        color: #555;
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .info-text {
                        font-size: 10px;
                        color: #666;
                        margin-bottom: 5px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #000;
                        margin-top: 30px;
                        margin-bottom: 10px;
                    }
                    .divider {
                        border-top: 1px solid #eee;
                        margin-bottom: 20px;
                    }
                    .gold-divider {
                        border-top: 2px solid #D4AF37;
                        margin-bottom: 15px;
                        width: 30%;
                    }
                    .cards-container {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 30px;
                        flex-wrap: wrap;
                        gap: 15px;
                    }
                    .card {
                        flex: 1;
                        min-width: 30%;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        padding: 15px;
                        box-sizing: border-box;
                    }
                    .card-title {
                        font-size: 10px;
                        font-weight: bold;
                        color: #666;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                    }
                    .card-value {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .indicators-list {
                        font-size: 11px;
                        color: #444;
                        line-height: 1.8;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10px;
                        margin-bottom: 30px;
                    }
                    th {
                        background-color: #D4AF37;
                        color: #000;
                        font-weight: bold;
                        text-align: left;
                        padding: 10px;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    .even-row {
                        background-color: #fafafa;
                    }
                    .insight-card {
                        border: 1px solid #eee;
                        border-left-width: 4px;
                        border-radius: 6px;
                        padding: 12px;
                        margin-bottom: 12px;
                    }
                    .insight-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .insight-title {
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .insight-value {
                        font-size: 11px;
                        font-weight: bold;
                    }
                    .insight-message {
                        font-size: 10px;
                        color: #555;
                    }
                </style>
            </head>
            <body>
                <div class="header-border"></div>
                <div class="title">FINANÇAS PRO GOLD</div>
                <div class="subtitle">Relatório Financeiro Completo</div>
                
                <div class="divider"></div>
                
                <div class="info-text">Período: ${data.dateRange.label}</div>
                <div class="info-text">Gerado em: ${today}</div>
                
                <div class="section-title">RESUMO EXECUTIVO</div>
                <div class="cards-container">
                    <div class="card" style="border-color: #10B981;">
                        <div class="card-title">RECEITAS</div>
                        <div class="card-value" style="color: #10B981;">${formatCurrency(data.metrics.totalIncome)}</div>
                    </div>
                    <div class="card" style="border-color: #DC2626;">
                        <div class="card-title">DESPESAS</div>
                        <div class="card-value" style="color: #DC2626;">${formatCurrency(data.metrics.totalExpense)}</div>
                    </div>
                    <div class="card" style="border-color: #D4AF37;">
                        <div class="card-title">SALDO</div>
                        <div class="card-value" style="color: ${balanceColor};">${formatCurrency(Math.abs(data.metrics.balance))}</div>
                    </div>
                </div>

                <div class="section-title">INDICADORES FINANCEIROS</div>
                <div class="indicators-list">
                    <div>• Taxa de Poupança: ${data.metrics.savingsRate.toFixed(1)}%</div>
                    <div>• Receita Média: ${formatCurrency(data.metrics.averageIncome)}</div>
                    <div>• Despesa Média: ${formatCurrency(data.metrics.averageExpense)}</div>
                    <div>• Total de Transações: ${data.transactions.length}</div>
                </div>

                ${insightsHtml}
                ${categoryHtml}
                ${transactionsHtml}

                <div style="margin-top: 40px; text-align: center; color: #888; font-size: 9px; border-top: 1px solid #eee; padding-top: 10px;">
                    Finanças Pro Gold © ${new Date().getFullYear()} - Relatório Confidencial
                </div>
            </body>
            </html>
        `;

        const { uri } = await Print.printToFileAsync({
            html,
            base64: false
        });

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Exportar Relatório PDF',
                UTI: 'com.adobe.pdf'
            });
        } else {
            Alert.alert("Sucesso", "PDF Gerado! (Compartilhamento não disponível no emulador)");
        }
    } catch (err) {
        console.error("Erro ao gerar PDF: ", err);
        Alert.alert("Erro", "Ocorreu um erro ao gerar o PDF.");
    }
};
