import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { RESET_PASSWORD_API } from "@/lib/server-urls";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otpCode, newPassword } = body;

    if (!email || !otpCode || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Email, OTP code, and new password are required",
        },
        { status: 400 }
      );
    }

    const response = await axios.post(
      RESET_PASSWORD_API,
      { email, otpCode, newPassword },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    console.error("Reset password API error:", error);

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
      {
        success: false,
        message: "Failed to reset password. Please try again.",
      },
      { status: 500 }
    );
  }
}
