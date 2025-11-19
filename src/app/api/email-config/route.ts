import { NextRequest, NextResponse } from "next/server";
import { EMAIL_CONFIG_API } from "@/lib/server-urls";

// Helper function to get token from request headers
function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

// POST - Create email configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 }
      );
    }

    const response = await fetch(EMAIL_CONFIG_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error creating email configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create email configuration" },
      { status: 500 }
    );
  }
}

// GET - Get email configuration
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 }
      );
    }

    const response = await fetch(EMAIL_CONFIG_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching email configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch email configuration" },
      { status: 500 }
    );
  }
}

// PATCH - Update email configuration
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 }
      );
    }

    const response = await fetch(EMAIL_CONFIG_API, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating email configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update email configuration" },
      { status: 500 }
    );
  }
}

// DELETE - Delete email configuration
export async function DELETE(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authorization token is required" },
        { status: 401 }
      );
    }

    const response = await fetch(EMAIL_CONFIG_API, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting email configuration:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete email configuration" },
      { status: 500 }
    );
  }
}
