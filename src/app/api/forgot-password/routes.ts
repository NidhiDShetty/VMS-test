import axios from "axios";
import {
  FORGOT_PASSWORD_API,
  VERIFY_OTP_API,
  RESET_PASSWORD_API,
} from "@/lib/server-urls";

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOTPPayload {
  email: string;
  otpCode: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Request password reset - sends OTP
export async function requestPasswordReset(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  try {
    const res = await axios.post(FORGOT_PASSWORD_API, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response === "object"
    ) {
      const response = (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response;
      if (response && (response.data?.message || response.data?.error)) {
        throw new Error(response.data.message || response.data.error);
      }
    }
    if (err instanceof Error) {
      throw new Error(`Request password reset error: ${err.message}`);
    } else {
      throw new Error(
        "An unknown error occurred during password reset request."
      );
    }
  }
}

// Verify OTP
export async function verifyOTP(
  payload: VerifyOTPPayload
): Promise<VerifyOTPResponse> {
  try {
    const res = await axios.post(VERIFY_OTP_API, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response === "object"
    ) {
      const response = (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response;
      if (response && (response.data?.message || response.data?.error)) {
        throw new Error(response.data.message || response.data.error);
      }
    }
    if (err instanceof Error) {
      throw new Error(`Verify OTP error: ${err.message}`);
    } else {
      throw new Error("An unknown error occurred during OTP verification.");
    }
  }
}

// Reset password with OTP
export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  try {
    const res = await axios.post(RESET_PASSWORD_API, payload, {
      headers: { "Content-Type": "application/json" },
    });
    return res.data;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response === "object"
    ) {
      const response = (
        err as { response?: { data?: { message?: string; error?: string } } }
      ).response;
      if (response && (response.data?.message || response.data?.error)) {
        throw new Error(response.data.message || response.data.error);
      }
    }
    if (err instanceof Error) {
      throw new Error(`Reset password error: ${err.message}`);
    } else {
      throw new Error("An unknown error occurred during password reset.");
    }
  }
}
