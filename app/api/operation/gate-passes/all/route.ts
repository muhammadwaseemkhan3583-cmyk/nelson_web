import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const [returnable, nonReturnable, outdoor] = await Promise.all([
        prisma.returnablePass.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.nonReturnablePass.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.outdoorPass.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const allPasses = [
        ...returnable.map(p => ({ ...p, type: "Returnable" })),
        ...nonReturnable.map(p => ({ ...p, type: "Non-Returnable" })),
        ...outdoor.map(p => ({ ...p, type: "Outdoor" })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, passes: allPasses }, { status: 200 });
  } catch (error: any) {
    console.error(`All Gate Passes Fetch Error:`, error);
    return NextResponse.json({ success: false, message: "Failed to load all passes." }, { status: 500 });
  }
}
