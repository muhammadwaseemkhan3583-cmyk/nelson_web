import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  const authStatus = await verifyAuth(request);
  if (!authStatus.authenticated) {
    return NextResponse.json({ success: false, message: authStatus.error }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const type = searchParams.get("type") || "Petty Cash"; // New parameter

  if (!dateStr) {
    return NextResponse.json({ success: false, message: "Date is required." }, { status: 400 });
  }

  try {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Fetch expenses for specific date AND type
    const expenses = await prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        type: type,
        voucherId: null,
      },
    });

    if (expenses.length === 0) {
      return NextResponse.json({ success: false, message: `No new ${type} records found for this date.` }, { status: 404 });
    }

    // Aggregation Logic
    let voucherItems = [];
    if (type === "Petty Cash") {
        const aggregated = expenses.reduce((acc: any, curr: any) => {
            // Normalize category: Trim and title case for consistent grouping
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
        
        voucherItems = Object.values(aggregated).map((item: any, i) => ({ 
            srNo: i + 1, 
            detail: item.detail, 
            amount: item.amount, 
            remarks: item.remarks.join(", ") 
        }));
    } else {
        // Cash Voucher aggregation (One row per entry as usually requested for cash vouchers)
        voucherItems = expenses.map((e: any, i: number) => ({
            srNo: i + 1,
            detail: `${e.description} (${e.vendorName})${e.department ? ` - ${e.department}` : ''}`,
            amount: e.amount,
            remarks: `${e.concernPerson} - ${e.billOfMonth}`
        }));
    }

    const totalAmount = voucherItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const count = await prisma.voucherRecord.count({ where: { date: { gte: startOfDay, lte: endOfDay } } });
    const serial = `VC-${dateStr.replace(/-/g, '')}-${(count + 1).toString().padStart(3, '0')}`;

    return NextResponse.json({ success: true, serial, items: voucherItems, total: totalAmount, expenseIds: expenses.map(e => e.id) }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
