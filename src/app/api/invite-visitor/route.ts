import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { INVITE_COMPANY_API, COMPANIES_LOG_API } from "@/lib/server-urls";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      console.error("[INVITE-VISITOR] No auth token found");
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const body = await req.json();
    console.log("[INVITE-VISITOR] Sending POST to:", INVITE_COMPANY_API);
    console.log("[INVITE-VISITOR] Request body:", body);

    const backendRes = await axios.post(INVITE_COMPANY_API, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("[INVITE-VISITOR] Backend response:", backendRes.data);
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (err: unknown) {
    console.error("[INVITE-VISITOR] Error occurred:", err);
    let status = 500;
    let message = "Failed to invite company";
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (
        err as { response?: { status?: number; data?: { error?: string } } }
      ).response === "object"
    ) {
      const response = (
        err as { response?: { status?: number; data?: { error?: string } } }
      ).response;
      status = response?.status || 500;
      message = response?.data?.error || message;
      console.error("[INVITE-VISITOR] Backend error status:", status);
      console.error("[INVITE-VISITOR] Backend error message:", message);
      console.error("[INVITE-VISITOR] Full backend error:", response?.data);
    }
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const backendRes = await axios.get(COMPANIES_LOG_API, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return NextResponse.json(backendRes.data, { status: backendRes.status });
  } catch (err: unknown) {
    let status = 500;
    let message = "Failed to fetch company invitations log";
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (
        err as { response?: { status?: number; data?: { error?: string } } }
      ).response === "object"
    ) {
      const response = (
        err as { response?: { status?: number; data?: { error?: string } } }
      ).response;
      status = response?.status || 500;
      message = response?.data?.error || message;
    }
    return NextResponse.json({ error: message }, { status });
  }
}

// export async function DELETE(req: NextRequest) {
//   try {
//     const url = new URL(req.url);
//     const pathParts = url.pathname.split("/");
//     const invId = pathParts[pathParts.length - 1];
//     const token = req.headers.get("x-access-token");
//     if (!token) {
//       return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
//     }
//     const backendRes = await axios.delete(
//       `${BASE_URL}/api/companyInvitation/invitations/${invId}`,
//       {
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${token}`,
//         },
//       }
//     );
//     return NextResponse.json(backendRes.data, { status: backendRes.status });
//   } catch (error: any) {
//     console.error('API INVITE-VISITOR DELETE ERROR:', {
//       error,
//       errorMessage: error?.message,
//       errorResponse: error?.response?.data,
//     });
//     const status = error.response?.status || 500;
//     const message = error.response?.data?.error || "Failed to delete invitation";
//     return NextResponse.json({ error: message }, { status });
//   }
// }
