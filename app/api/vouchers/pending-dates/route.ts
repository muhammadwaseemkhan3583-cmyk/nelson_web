import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const authStatus = await verifyAuth(request);
    if (!authStatus.authenticated) {
      return NextResponse.json({ success: false, message: authStatus.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "Petty Cash";

    // Fetch unique dates where voucherId is NULL for the specific type
    const pendingExpenses = await prisma.expense.findMany({
      where: {
        voucherId: null,
        type: type
      },
      select: {
        date: true,
      },
      distinct: ['date'],
      orderBy: {
        date: 'desc'
      }
    });

    // Format dates to YYYY-MM-DD
    const dates = pendingExpenses.map((exp: any) => exp.date.toISOString().split('T')[0]);

    return NextResponse.json({ 
      success: true, 
      dates 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Pending Dates Error:", error.message);
    return NextResponse.json({ success: false, message: "Failed to load pending dates." }, { status: 500 });
  }
}
