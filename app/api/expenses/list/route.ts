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
    const timeframe = searchParams.get("timeframe") || "all";
    const department = searchParams.get("department");
    const category = searchParams.get("category");
    const type = searchParams.get("type");

    let where: any = {};

    // Timeframe Logic
    if (timeframe !== "all") {
      const now = new Date();
      let startDate = new Date();

      if (timeframe === "1h") {
        startDate.setHours(now.getHours() - 1);
      } else if (timeframe === "1m") {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === "2m") {
        startDate.setMonth(now.getMonth() - 2);
      } else if (timeframe === "3m") {
        startDate.setMonth(now.getMonth() - 3);
      }

      where.date = {
        gte: startDate,
        lte: now,
      };
    }

    if (department && department !== "All") {
      where.department = department;
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (type && type !== "All") {
      where.type = type;
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      expenses 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Database Fetch Error:", error.message);
    return NextResponse.json({ 
      success: false, 
      message: "Failed to fetch records." 
    }, { status: 500 });
  }
}
