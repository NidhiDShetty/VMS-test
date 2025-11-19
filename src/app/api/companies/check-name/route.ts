import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get("name");

    if (!companyName || companyName.trim() === "") {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // Call the backend API to check if company name exists
    const backendUrl = process.env.BACKEND_URL || "http://localhost:1433";
    const response = await fetch(
      `${backendUrl}/api/companies/check-name?name=${encodeURIComponent(companyName.trim())}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error checking company name:", error);
    return NextResponse.json(
      { error: "Failed to check company name" },
      { status: 500 }
    );
  }
}
