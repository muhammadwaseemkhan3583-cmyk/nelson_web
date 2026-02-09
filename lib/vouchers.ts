export function aggregateVoucherItems(expenses: any[], type: string) {
    if (type === "Petty Cash") {
        const aggregated = expenses.reduce((acc: any, curr: any) => {
            const rawCat = (curr.category || "General").trim();
            const catKey = rawCat.toLowerCase();
            
            if (!acc[catKey]) {
                acc[catKey] = { 
                    detail: rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase(), 
                    amount: 0, 
                    remarks: [] 
                };
            }
            
            acc[catKey].amount += curr.amount;
            if (curr.remarks && !acc[catKey].remarks.includes(curr.remarks)) {
                acc[catKey].remarks.push(curr.remarks);
            }
            return acc;
        }, {});
        
        return Object.values(aggregated).map((item: any, i) => ({ 
            srNo: i + 1, 
            detail: item.detail, 
            amount: item.amount, 
            remarks: item.remarks.join(", ") 
        }));
    } else {
        return expenses.map((e: any, i: number) => ({
            srNo: i + 1,
            detail: `${e.description} (${e.vendorName})${e.department ? ` - ${e.department}` : ''}`,
            amount: e.amount,
            remarks: `${e.concernPerson} - ${e.billOfMonth}`
        }));
    }
}
