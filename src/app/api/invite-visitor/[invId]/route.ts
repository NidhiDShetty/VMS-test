import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { COMPANY_INVITATION_API } from "@/lib/server-urls";

export async function DELETE(req: NextRequest, context: { params: Promise<{ invId: string }> }) {
  const { invId } = await context.params;
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  try {
    const backendRes = await axios.delete(
      COMPANY_INVITATION_API(invId),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (err: unknown) {
    let status = 500;
    let message = "Failed to delete invitation";
    if (
      typeof err === 'object' &&
      err !== null &&
      'response' in err &&
      typeof (err as { response?: { status?: number; data?: { error?: string } } }).response === 'object'
    ) {
      const response = (err as { response?: { status?: number; data?: { error?: string } } }).response;
      status = response?.status || 500;
      message = response?.data?.error || message;
    }
    return NextResponse.json({ error: message }, { status });
  }
} 