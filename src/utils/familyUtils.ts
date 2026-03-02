import { FamilyMember, SharedExpense, Settlement } from '../types';

// Calculate settlements (who owes whom)
export const calculateSettlements = (expenses: SharedExpense[], members: FamilyMember[]): Settlement[] => {
    const balances: Record<string, number> = {};

    // Initialize balances
    members.forEach(member => {
        balances[member.id] = 0;
    });

    // Calculate balances
    expenses.filter(e => e.status === 'pending' || e.status === 'open').forEach(expense => {
        expense.splits.forEach(split => {
            // Only consider unpaid splits
            if (!split.paid) {
                // Debtor (person responsible for this split part)
                balances[split.memberId] = (balances[split.memberId] || 0) - split.amount;

                // Creditor (person who paid the full bill)
                balances[expense.paidBy] = (balances[expense.paidBy] || 0) + split.amount;
            }
        });
    });

    // Generate settlements
    const settlements: Settlement[] = [];
    const debtors = Object.entries(balances).filter(([, balance]) => balance < -0.01);
    const creditors = Object.entries(balances).filter(([, balance]) => balance > 0.01);

    debtors.forEach(([debtorId, debtAmount]) => {
        let remaining = Math.abs(debtAmount);

        creditors.forEach(([creditorId, creditAmount], index) => {
            if (remaining > 0.01 && creditAmount > 0.01) {
                const amount = Math.min(remaining, creditAmount);
                settlements.push({
                    from: debtorId,
                    to: creditorId,
                    amount
                });
                remaining -= amount;
                creditors[index][1] -= amount; // Update the reference array directly
            }
        });
    });

    return settlements;
};
