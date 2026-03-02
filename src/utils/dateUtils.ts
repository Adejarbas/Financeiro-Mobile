export const formatMonthKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

export const getMonthRange = (monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-based

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0); // 0th day of next month is last day of current month

    // Create strings in format YYYY-MM-DD correcting for timezone offset issues
    const format = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    return {
        firstDay: format(firstDay),
        lastDay: format(lastDay),
    };
};
