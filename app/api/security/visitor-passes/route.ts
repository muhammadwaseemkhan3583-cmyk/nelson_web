import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-middleware";

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { visitorName, visitorIdType, visitorIdNumber, contactNumber, fromWhere, toMeet, purpose, itemsCarried, remarks } = body;

    if (!visitorName || !fromWhere || !purpose || !toMeet) {
      return NextResponse.json({ success: false, message: "Missing required visitor fields (Name, Source, Purpose, or To Meet)." }, { status: 400 });
    }

    const db = prisma as any;
    if (!db.visitorEntry) {
        console.error(">>> ERROR: visitorEntry model is missing in Prisma Client!");
        const available = Object.keys(db).filter(k => !k.startsWith('$') && !k.startsWith('_'));
        return NextResponse.json({ success: false, message: `System Config Error: VisitorEntry model not found. Available: ${available.join(', ')}` }, { status: 500 });
    }

    const newVisitor = await db.visitorEntry.create({
      data: {
        visitorName,
        visitorIdType: visitorIdType || null,
        visitorIdNumber: visitorIdNumber || null,
        contactNumber: contactNumber || null,
        fromWhere,
        toMeet,
        purpose,
        itemsCarried: itemsCarried || null,
        remarks: remarks || null,
        securityOfficer: auth.name || "Security Officer",
        status: "In",
        inTime: new Date()
      }
    });

    return NextResponse.json({ success: true, message: "Visitor entry recorded.", visitor: newVisitor }, { status: 201 });

  } catch (error: any) {
    console.error("Visitor Pass Save Error:", error.message);
    return NextResponse.json({ success: false, message: `Failed to record visitor: ${error.message}` }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "In" or "Out" or "All"

    const query: any = {
      orderBy: { createdAt: 'desc' }
    };

    if (status && status !== "All") {
      query.where = { status };
    }

    const db = prisma as any;
    const visitors = await db.visitorEntry.findMany(query);
    return NextResponse.json({ success: true, visitors }, { status: 200 });

  } catch (error: any) {
    console.error("Visitor Pass Fetch Error:", error);
    return NextResponse.json({ success: false, message: "Failed to load visitor data." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ success: false, message: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { id, remarks } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Missing visitor ID." }, { status: 400 });
    }

    const db = prisma as any;
    const updatedVisitor = await db.visitorEntry.update({
      where: { id },
      data: {
        status: "Out",
        outTime: new Date(),
        remarks: remarks ? `[OUT] ${remarks}` : undefined
      }
    });

    return NextResponse.json({ success: true, message: "Visitor marked as OUT.", visitor: updatedVisitor }, { status: 200 });

  } catch (error: any) {
    console.error("Visitor Pass Update Error:", error);
    return NextResponse.json({ success: false, message: "Failed to update visitor status." }, { status: 500 });
  }
}
