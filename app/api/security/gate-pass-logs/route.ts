import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    // Only security personnel and admins should be able to view these logs
    if (auth.role !== "Security" && auth.role !== "Admin") {
      return NextResponse.json({ success: false, message: "Unauthorized to view security logs." }, { status: 403 });
    }

    const logs = await prisma.securityLog.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, logs }, { status: 200 });
  } catch (error: any) {
    console.error(`Security Logs (${request.url}) Fetch Error:`, error);
    return NextResponse.json({ success: false, message: "Failed to load security logs." }, { status: 500 });
  }
}
