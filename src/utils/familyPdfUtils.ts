import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { FamilyGroup, SharedExpense, Settlement } from '../types';

export const generateFamilyReportPDF = async (
    group: FamilyGroup,
    expenses: SharedExpense[],
    settlements: Settlement[],
    monthLabel: string // e.g. "Fevereiro de 2026"
) => {
    try {
        const generationDate = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const getMemberName = (id: string) => group.members.find(m => m.id === id)?.name || 'Desconhecido';

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const pendingExpenses = expenses.filter(e => e.status === 'pending' || e.status === 'open').reduce((sum, e) => sum + e.amount, 0);

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Relatório de Despesas Familiares</title>
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #1F2937;
                        margin: 0;
                        padding: 40px;
                        background-color: #FFFFFF;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 2px solid #FBBF24;
                        padding-bottom: 20px;
                    }
                    .logo-text {
                        font-size: 28px;
                        font-weight: bold;
                        color: #111827;
                        letter-spacing: 1px;
                        margin-bottom: 4px;
                    }
                    .gold-text {
                        color: #FBBF24;
                    }
                    .report-title {
                        font-size: 24px;
                        color: #4B5563;
                        margin-bottom: 8px;
                    }
                    .report-subtitle {
                        font-size: 14px;
                        color: #6B7280;
                    }
                    .summary-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 40px;
                        gap: 16px;
                    }
                    .summary-card {
                        background-color: #F9FAFB;
                        border: 1px solid #E5E7EB;
                        border-radius: 12px;
                        padding: 20px;
                        flex: 1;
                        text-align: center;
                    }
                    .summary-label {
                        font-size: 12px;
                        color: #6B7280;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 8px;
                        font-weight: bold;
                    }
                    .summary-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #111827;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        color: #374151;
                        margin-top: 40px;
                        margin-bottom: 16px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .divider {
                        height: 1px;
                        background-color: #E5E7EB;
                        margin-bottom: 16px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th {
                        background-color: #F3F4F6;
                        color: #374151;
                        font-size: 12px;
                        font-weight: bold;
                        text-transform: uppercase;
                        padding: 12px 16px;
                        text-align: left;
                        border-bottom: 2px solid #E5E7EB;
                    }
                    td {
                        padding: 16px;
                        font-size: 14px;
                        border-bottom: 1px solid #E5E7EB;
                        color: #4B5563;
                    }
                    .even-row {
                        background-color: #FAFAFA;
                    }
                    .odd-row {
                        background-color: #FFFFFF;
                    }
                    .footer {
                        margin-top: 60px;
                        text-align: center;
                        font-size: 12px;
                        color: #9CA3AF;
                        border-top: 1px solid #E5E7EB;
                        padding-top: 20px;
                    }
                    .settlement-card {
                        background-color: #FEF2F2;
                        border: 1px solid #FCA5A5;
                        border-radius: 8px;
                        padding: 16px;
                        margin-bottom: 12px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .settlement-text {
                        font-size: 16px;
                        color: #991B1B;
                    }
                    .settlement-amount {
                        font-size: 18px;
                        font-weight: bold;
                        color: #7F1D1D;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo-text">Finanças <span class="gold-text">Gold</span></div>
                    <div class="report-title">Relatório de Despesas Familiares</div>
                    <div class="report-subtitle">Grupo: ${group.name} | Período: ${monthLabel}</div>
                </div>

                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-label">Total Gasto</div>
                        <div class="summary-value">${formatCurrency(totalExpenses)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Total Pendente</div>
                        <div class="summary-value" style="color: #DC2626">${formatCurrency(pendingExpenses)}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Lançamentos</div>
                        <div class="summary-value">${expenses.length}</div>
                    </div>
                </div>

                ${settlements.length > 0 ? `
                <div class="section-title">Acertos Pendentes (Sugestão de Transferências)</div>
                <div class="divider"></div>
                <div>
                    ${settlements.map(s => `
                        <div class="settlement-card">
                            <div class="settlement-text">
                                <strong>${getMemberName(s.from)}</strong> deve pagar para <strong>${getMemberName(s.to)}</strong>
                            </div>
                            <div class="settlement-amount">${formatCurrency(s.amount)}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <div class="section-title">Detalhamento das Despesas</div>
                <div class="divider"></div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Pago Por</th>
                            <th>Categoria</th>
                            <th style="text-align: right;">Valor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map((e, i) => {
            const dateSplit = e.date.split('T')[0].split('-');
            const formattedDate = `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`;
            return '<tr class="' + (i % 2 === 0 ? 'even-row' : 'odd-row') + '">' +
                '<td>' + formattedDate + '</td>' +
                '<td>' + e.description + '</td>' +
                '<td>' + getMemberName(e.paidBy) + '</td>' +
                '<td>' + e.category + '</td>' +
                '<td align="right" style="font-weight: bold;">' + formatCurrency(e.amount) + '</td>' +
                '<td>' + (e.status === 'settled' ? 'Pago' : e.status === 'open' ? 'A Pagar' : 'Pendente') + '</td>' +
                '</tr>';
        }).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    Gerado automaticamente por Finanças Gold em ${generationDate}<br>
                    financasgold.com.br
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
                dialogTitle: 'Compartilhar Relatório Familiar',
                UTI: 'com.adobe.pdf'
            });
        } else {
            Alert.alert('Sucesso', 'PDF gerado, mas o compartilhamento não está disponível neste dispositivo.');
        }

    } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        Alert.alert('Erro', 'Não foi possível gerar o relatório. Tente novamente mais tarde.');
    }
};
