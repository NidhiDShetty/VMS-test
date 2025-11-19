import { FRONTEND_URL } from "@/lib/server-urls";

export interface InviteEmployeePayload {
  name: string;
  phoneNo: string;
  email?: string;
  type: string;
}

export interface InviteEmployeeResponse {
  success: boolean;
  message: string;
  data?: unknown;
  status?: string;
  statusCode?: number;
  error?: string;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  const authData = localStorage.getItem("authData");
  if (!authData) return null;
  try {
    const parsed = JSON.parse(authData);
    return parsed.token || null;
  } catch {
    return null;
  }
}

export const inviteEmployee = async (
  payload: InviteEmployeePayload
): Promise<InviteEmployeeResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${FRONTEND_URL}/api/invite-employees/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the error response from backend instead of throwing
    return {
      success: false,
      message: data.error || "Failed to send invite",
      error: data.error,
      statusCode: response.status,
    };
  }

  return data;
};

export interface EmployeeLog {
  id: string;
  name: string;
  phone: string;
  phoneNo?: string; // Add phoneNo as optional for backward compatibility
  email?: string;
  type: string;
  status?: string;
  position?: string;
  department?: string; // Add department property
  avatarUrl?: string;
  visitDate?: string;
  checkInTime?: string;
  checkOutTime?: string;
  invId?: string;
}

export const getEmployeesLog = async (): Promise<EmployeeLog[]> => {
  const token = getAuthToken();
  const response = await fetch(`${FRONTEND_URL}/api/invite-employees/`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch employees log");
  }
  const result = await response.json();
  return Array.isArray(result.data) ? result.data : [];
};

export const deleteEmployee = async (
  invId: string
): Promise<InviteEmployeeResponse> => {
  const token = getAuthToken();
  const response = await fetch(`${FRONTEND_URL}/api/invite-employees/?invId=${invId}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    // Return the error response from backend instead of throwing
    return {
      success: false,
      message: data.message || "Failed to delete employee",
      error: data.error,
      statusCode: response.status,
    };
  }

  return data;
};
