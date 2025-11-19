import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { VERIFY_OTP_API } from "@/lib/server-urls";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode } = body;

    if (!email || !otpCode) {
      return NextResponse.json(
        { success: false, message: "Email and OTP code are required" },
        { status: 400 }
      );
    }

    const response = await axios.post(
      VERIFY_OTP_API,
      { email, otpCode },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("Verify OTP API error:", error);

    // Type guard to check if error has response property (axios error)
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response: { data: { error?: string; message?: string }; status: number } };
      return NextResponse.json(
        {
          success: false,
          message: axiosError.response.data.error || axiosError.response.data.message,
        },
        { status: axiosError.response.status || 500 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
