import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";
import { aggregateVoucherItems } from "@/lib/vouchers";

export async function GET(request: Request) {
  try {
    const authStatus = await verifyAuth(request);
    if (!authStatus.authenticated) {
      return NextResponse.json({ success: false, message: authStatus.error }, { status: 401 });
    }

    const vouchers = await prisma.voucherRecord.findMany({
      orderBy: {
        date: 'desc'
      }
    });

    const now = new Date();
    
    // Live Sync Logic: Only for vouchers created within the last 36 hours
    const liveVouchers = await Promise.all(vouchers.map(async (v) => {
        const createdTime = new Date(v.createdAt).getTime();
        const diffHours = (now.getTime() - createdTime) / (1000 * 60 * 60);

        if (diffHours <= 36) {
            // Fetch live expenses for this voucher
            const expenses = await prisma.expense.findMany({
                where: { voucherId: v.id }
            });

            if (expenses.length > 0) {
                const liveItems = aggregateVoucherItems(expenses, v.type);
                const liveTotal = liveItems.reduce((sum: number, item: any) => sum + item.amount, 0);
                
                return {
                    ...v,
                    items: liveItems,
                    totalAmount: liveTotal,
                    isLive: true
                };
            }
        }
        
        return { ...v, isLive: false };
    }));

    return NextResponse.json({ 
      success: true, 
      vouchers: liveVouchers 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Voucher List Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to load records." 
    }, { status: 500 });
  }
}
