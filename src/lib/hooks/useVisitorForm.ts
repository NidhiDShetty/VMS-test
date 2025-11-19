"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  VISITORS_API,
  VISITOR_API,
  EMPLOYEES_API,
  VISITOR_CHECK_IN_API,
  VISITOR_SCAN_QR_API,
  VISITORS_BY_HOST_API,
} from "@/lib/server-urls";
import { getProfileData, ProfileResponse } from "@/app/api/profile/routes";

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
    const res = await fetch(VISITOR_CHECK_IN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    if (!data.otp || !data.qrCode) {
      throw new Error(
        "Incomplete response from server. Please contact support."
      );
    }

    return data;
  } catch (err: unknown) {
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
    const res = await fetch(VISITOR_SCAN_QR_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        error: "API Error",
        message: errorData.message || `HTTP error! status: ${res.status}`,
      };
    }

    const data = await res.json();
    if (!data.visitor) {
      return {
        error: "Invalid Code",
        message: "Invalid OTP or visitor not found",
      };
    }

    return data;
  } catch (err: unknown) {
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
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
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
  const response = await fetch(VISITORS_BY_HOST_API, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
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

// Custom hook for visitor form management
export const useVisitorForm = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize form data with default values
  const getInitialFormData = (): VisitorFormData => {
    // Default form data - context will handle edit mode
    const defaultData = {
      fullName: "",
      phoneNumber: "",
      gender: "",
      idType: "",
      idNumber: "",
      date: "",
      time: "",
      comingFrom: "company",
      companyName: "",
      location: null,
      purposeOfVisit: "",
      imgUrl: "",
      status: "PENDING",
      hostDetails: {
        userId: 0,
        email: "",
        name: "",
        phoneNumber: "",
        profileImageUrl: null,
      },
      assets: [],
      guest: [],
    };
    return defaultData;
  };

  const [visitorFormData, setVisitorFormData] = useState<VisitorFormData>(
    getInitialFormData()
  );
  const [visitorsList, setVisitorsList] = useState<string[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [currentUserProfile, setCurrentUserProfile] = useState<ProfileResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Retrieve JWT token from localStorage
    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        if (parsed?.token) setToken(parsed.token);
      } catch {
        // Optionally handle error
      }
    }
  }, []);

  // Load current user profile and set as default host
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      try {
        const profile = await getProfileData();
        setCurrentUserProfile(profile);
        
        // Set current user as default host if no host is selected
        setVisitorFormData((prev) => {
          if (prev.hostDetails.userId === 0) {
            return {
              ...prev,
              hostDetails: {
                userId: Number(profile.userId),
                email: profile.profile.email,
                name: profile.profile.name,
                phoneNumber: profile.profile.phoneNumber,
                profileImageUrl: profile.profile.profileImageUrl,
              },
            };
          }
          return prev;
        });
      } catch (error) {
        console.error("Failed to load current user profile:", error);
      }
    };
    
    loadCurrentUserProfile();
  }, []);

  const handleChangeVisitorField = useCallback(
    (field: keyof VisitorFormData, value: unknown) => {
      setVisitorFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Scroll to top when changing steps
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      router.push("/check-in-visitor");
    }
  }, [currentStep, router]);

  const handleNext = useCallback(() => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      // Scroll to top when changing steps
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [currentStep]);

  const handleFetchVisitors = useCallback(async () => {
    if (!token) return setError("No token found");
    setLoading(true);
    setError(null);
    try {
      const data = await getVisitors(token);
      setVisitorsList(data.visitors || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to fetch visitors");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchEmployees = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(EMPLOYEES_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEmployeesList(data.employees || []);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  }, [token]);

  const handleCreateVisitor = useCallback(async () => {
    if (!token) return setError("No token found");
    setLoading(true);
    setError(null);
    try {
      // Ensure host is assigned - use current user if no host selected
      const visitorData = { ...visitorFormData };
      if (visitorData.hostDetails.userId === 0 && currentUserProfile) {
        visitorData.hostDetails = {
          userId: Number(currentUserProfile.userId),
          email: currentUserProfile.profile.email,
          name: visitorData.hostDetails.name || currentUserProfile.profile.name,
          phoneNumber: currentUserProfile.profile.phoneNumber,
          profileImageUrl: currentUserProfile.profile.profileImageUrl,
        };
      }
      
      await createVisitor(visitorData, token);
      await handleFetchVisitors();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create visitor");
      }
    } finally {
      setLoading(false);
    }
  }, [token, visitorFormData, handleFetchVisitors, currentUserProfile]);

  // Fetch visitors and employees on mount
  useEffect(() => {
    if (token) {
      handleFetchVisitors();
      fetchEmployees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refresh employees list whenever a profile is updated anywhere in the app
  useEffect(() => {
    const handleProfileUpdated = () => {
      fetchEmployees();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("profileUpdated", handleProfileUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("profileUpdated", handleProfileUpdated);
      }
    };
  }, [fetchEmployees]);

  // Scroll to top when step changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentStep]);

  const handleUpdateVisitor = useCallback(
    async (id: string | number, updateData: Partial<VisitorFormData>) => {
      if (!token) return setError("No token found");
      setLoading(true);
      setError(null);
      try {
        await updateVisitor(id, updateData, token);
        await handleFetchVisitors();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to update visitor");
        }
      } finally {
        setLoading(false);
      }
    },
    [token, handleFetchVisitors]
  );

  const handleSelectHost = useCallback((employee: Employee) => {
    setVisitorFormData((prev) => ({
      ...prev,
      hostDetails: {
        userId: employee.userId,
        email: employee.email,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        profileImageUrl: employee.profileImageUrl ?? null,
      },
    }));
  }, []);

  // Reset form data to initial state
  const resetFormData = useCallback(() => {
    setVisitorFormData(getInitialFormData());
  }, []);

  return {
    // State
    currentStep,
    visitorFormData,
    visitorsList,
    employeesList,
    loading,
    error,
    token,
    currentUserProfile,

    // Actions
    setCurrentStep,
    handleChangeVisitorField,
    handleBack,
    handleNext,
    handleCreateVisitor,
    handleFetchVisitors,
    handleUpdateVisitor,
    handleSelectHost,
    resetFormData,
  };
};
