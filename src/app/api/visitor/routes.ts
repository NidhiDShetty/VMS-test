// Server-side API functions only
import axios from "axios";
import {
  VISITORS_API,
  VISITOR_API,
  VISITOR_CHECK_IN_API,
  VISITOR_SCAN_QR_API,
  VISITORS_BY_HOST_API,
} from "@/lib/server-urls";

// Types for visitor check-in
export interface VisitorCheckInPayload {
  id: number;
}

export interface VisitorCheckInResponse {
  otp: string;
  qrCode: string;
  hostName: string | null;
  companyName: string | null;
  location: string | null;
}

// Types for visitor QR scan
export interface VisitorScanQRPayload {
  otp: string;
}

export interface VisitorScanQRResponse {
  visitor: {
    id: number;
    fullName: string;
    phoneNumber: string;
    gender?: string;
    idType?: string;
    idNumber?: string;
    date?: string;
    time?: string;
    comingFrom: string;
    companyName?: string;
    location?: string;
    purposeOfVisit?: string;
    imgUrl?: string;
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
    hostDetails?: string;
    assets?: string;
    guest?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export type VisitorFormData = {
  fullName: string;
  phoneNumber: string;
  gender: string;
  idType: string;
  idNumber: string;
  date: string;
  time: string;
  comingFrom: string;
  companyName?: string;
  location?: string | null;
  purposeOfVisit: string;
  imgUrl?: string;
  status: string;
  rejectionReason?: string;
  hostDetails: {
    userId: number;
    email: string;
    name: string;
    phoneNumber: string;
    profileImageUrl: string | null;
  };
  assets: Array<{
    assetName: string;
    serialNumber?: string;
    assetType?: string;
    imgUrl?: string;
  }>;
  guest: Array<{
    guestName: string;
    imgUrl?: string;
  }>;
  isApprovalReq?: boolean;
};

/**
 * Generate OTP and QR code for visitor check-in
 */
export async function visitorCheckIn(
  payload: VisitorCheckInPayload
): Promise<VisitorCheckInResponse> {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
  if (!authDataRaw) throw new Error("No auth data found");
  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    throw new Error("Invalid auth data");
  }
  if (!token) throw new Error("No token found");

  try {
    const res = await axios.post(VISITOR_CHECK_IN_API, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data;
    if (!data.otp || !data.qrCode) {
      throw new Error(
        "Incomplete response from server. Please contact support."
      );
    }

    return data;
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
      throw new Error(`Visitor check-in error: ${err.message}`);
    } else {
      throw new Error("An unknown error occurred during visitor check-in.");
    }
  }
}

/**
 * Validate OTP and retrieve visitor details
 */
export async function visitorScanQR(
  payload: VisitorScanQRPayload
): Promise<VisitorScanQRResponse | { error: string; message: string }> {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
  if (!authDataRaw) {
    return { error: "Authentication Error", message: "No auth data found" };
  }

  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    return { error: "Authentication Error", message: "Invalid auth data" };
  }

  if (!token) {
    return { error: "Authentication Error", message: "No token found" };
  }

  try {
    const res = await axios.post(VISITOR_SCAN_QR_API, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = res.data;
    if (!data.visitor) {
      return {
        error: "Invalid Code",
        message: "Invalid OTP or visitor not found",
      };
    }

    return data;
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
        return {
          error: "API Error",
          message: (response.data.message || response.data.error || "Unknown error") as string,
        };
      }
    }

    if (err instanceof Error) {
      return { error: "QR Scan Error", message: err.message };
    } else {
      return {
        error: "Unknown Error",
        message: "An unknown error occurred during QR scan",
      };
    }
  }
}

export const createVisitor = async (
  visitorData: VisitorFormData,
  token: string
) => {
  console.log("Creating visitor with data:", JSON.stringify(visitorData, null, 2));
  
  const response = await fetch(VISITORS_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(visitorData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("CreateVisitor API Error Response:", {
      status: response.status,
      statusText: response.statusText,
      errorData: errorData,
      url: VISITORS_API,
      requestPayload: visitorData
    });
    throw new Error(
      errorData.message || errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return await response.json();
};

export const getVisitors = async (token: string) => {
  const response = await fetch(VISITORS_API, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return await response.json();
};

export const updateVisitor = async (
  id: string | number,
  updateData: Partial<VisitorFormData>,
  token: string
) => {
  const response = await fetch(VISITOR_API(id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  return await response.json();
};

export interface Employee {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}

export const fetchAllVisitors = async (token: string) => {
  const res = await fetch(VISITORS_API, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch visitors");
  return res.json();
};

export const getVisitorsByHost = async (token: string) => {
  try {
    const response = await fetch(VISITORS_BY_HOST_API, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (parseError) {
        // Try to get response text instead
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch (textError) {
          // Could not get error text
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[getVisitorsByHost] Error:", error);
    
    // Handle specific error types gracefully - return empty data to prevent UI from breaking
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.warn("[getVisitorsByHost] Request timeout - returning empty data");
        return { visitors: [] };
      } else if (error.message.includes('Failed to fetch')) {
        console.warn("[getVisitorsByHost] Network error - returning empty data");
        return { visitors: [] };
      } else if (error.message.includes('500')) {
        console.warn("[getVisitorsByHost] Backend server error - returning empty data");
        return { visitors: [] };
      }
    }
    
    // For other errors, return empty data to prevent UI from breaking
    console.warn("[getVisitorsByHost] Unexpected error - returning empty data");
    return { visitors: [] };
  }
};

// Helper function to get auth token from localStorage (client-side only)
export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  try {
    const authDataRaw = localStorage.getItem("authData");
    if (!authDataRaw) return null;

    const parsed = JSON.parse(authDataRaw);
    return parsed?.token || null;
  } catch {
    return null;
  }
};
