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

    const liveVouchers = await Promise.all(vouchers.map(async (v) => {
        // 1. Ensure items is an array
        let parsedItems = v.items;
        if (typeof v.items === 'string') {
            try {
                parsedItems = JSON.parse(v.items);
            } catch (e) {
                parsedItems = [];
            }
        }
        if (!Array.isArray(parsedItems)) parsedItems = [];

        // 2. Only fetch live data if the database says a sync is needed
        let liveItems = parsedItems;
        let liveTotal = v.totalAmount;

        if (v.needsSync) {
            const expenses = await prisma.expense.findMany({
                where: {
                    OR: [
                        { voucherId: v.serialNumber },
                        { voucherId: v.id }
                    ]
                }
            });
            liveItems = aggregateVoucherItems(expenses, v.type);
            liveTotal = liveItems.reduce((sum: number, item: any) => sum + item.amount, 0);
        }

        return {
            ...v,
            items: parsedItems,
            liveItems,
            liveTotal,
            needsSync: v.needsSync
        };
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
