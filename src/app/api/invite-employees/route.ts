import { NextRequest, NextResponse } from "next/server";
import {
  INVITE_EMPLOYEE_API,
  EMPLOYEES_LOG_API,
  DELETE_EMPLOYEE_API,
} from "@/lib/server-urls";

function getTokenFromHeader(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer (.+)$/);
  return match ? match[1] : null;
}

export async function POST(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Bearer token missing" },
      { status: 401 }
    );
  }
  try {
    const body = await req.json();
    const backendRes = await fetch(INVITE_EMPLOYEE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await backendRes.json();

    // Ensure consistent response structure
    const response = {
      success: backendRes.ok,
      message:
        data.message ||
        (backendRes.ok
          ? "Employee invited successfully"
          : "Failed to invite employee"),
      ...data,
    };

    return NextResponse.json(response, { status: backendRes.status });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Bearer token missing" },
      { status: 401 }
    );
  }
  try {
    const backendRes = await fetch(EMPLOYEES_LOG_API, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const token = getTokenFromHeader(req);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized: Bearer token missing" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const invId = searchParams.get("invId");

    if (!invId) {
      return NextResponse.json(
        { success: false, message: "Invitation ID is required" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(DELETE_EMPLOYEE_API(invId), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await backendRes.json();

    // Ensure consistent response structure
    const response = {
      success: backendRes.ok,
      message:
        data.message ||
        (backendRes.ok
          ? "Employee deleted successfully"
          : "Failed to delete employee"),
      ...data,
    };

    return NextResponse.json(response, { status: backendRes.status });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
