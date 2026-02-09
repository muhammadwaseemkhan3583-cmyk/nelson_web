import { NextResponse } from "next/server";

export async function GET() {
  const now = new Date();
  
  // Format to DD/MM/YYYY for the frontend
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  return NextResponse.json({ 
    success: true, 
    serverDate: `${day}/${month}/${year}` 
  });
}
