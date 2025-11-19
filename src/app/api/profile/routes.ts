import axios from "axios";
import {
  BACKEND_PROFILE_URL,
  BACKEND_COMPANY_PROFILE_URL,
  PROFILE_IMAGE_UPLOAD_API,
  PROFILE_IMAGE_GET_API,
  PROFILE_IMAGE_DELETE_API,
} from "@/lib/server-urls";

export interface ProfileResponse {
  userId: number | string;
  orgId: number | string;
  profile: {
    personId: string;
    name: string;
    phoneNumber: string;
    email: string;
    gender: string;
    department: string;
    roleType: string;
    profileImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateProfilePayload {
  name: string;
  phoneNumber: string;
  email: string;
  department?: string; // Made optional
  gender: string;
  // roleType: string;
  profileImageUrl?: string | null;
}

export interface CompanyLocation {
  buildingNo: string;
  floor: string;
  street: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CompanyProfileResponse {
  companyName: string;
  phoneNumber: string;
  email: string;
  location: CompanyLocation;
}

export const getProfileData = async (): Promise<ProfileResponse> => {
  // Check if we're in browser environment
  if (typeof window === "undefined") {
    throw new Error("Not in browser environment");
  }

  const authDataRaw = localStorage.getItem("authData");
  if (!authDataRaw) throw new Error("No auth data found");
  
  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    throw new Error("Invalid auth data");
  }
  if (!token) throw new Error("No token found");

  const response = await axios.get(BACKEND_PROFILE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = response.data;
  // Fill missing/null/empty fields with '-'
  const safe = <T>(v: unknown, fallback: T): T =>
    v === null || v === undefined || v === "" ? fallback : (v as T);
  const result = {
    userId: safe<string | number>(data.userId, "-"),
    orgId: safe<string | number>(data.orgId, "-"),
    profile: {
      personId: safe<string>(data.profile?.personId, "-"),
      name: safe<string>(data.profile?.name, "-"),
      phoneNumber: safe<string>(data.profile?.phoneNumber, "-"),
      email: safe<string>(data.profile?.email, "-"),
      gender: safe<string>(data.profile?.gender, "-"),
      department: safe<string>(data.profile?.department, "-"),
      roleType: safe<string>(data.profile?.roleType, "-"),
      profileImageUrl: safe<string | null>(data.profile?.profileImageUrl, null),
      createdAt: safe<string>(data.profile?.createdAt, "-"),
      updatedAt: safe<string>(data.profile?.updatedAt, "-"),
    },
  };
  return result;
};

export const updateProfileData = async (
  payload: UpdateProfilePayload
): Promise<ProfileResponse> => {
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

  // Use POST instead of PUT for updating profile
  const response = await axios.post(BACKEND_PROFILE_URL, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = response.data;
  // Fill missing/null/empty fields with '-'
  const safe = <T>(v: unknown, fallback: T): T =>
    v === null || v === undefined || v === "" ? fallback : (v as T);
  return {
    userId: safe<string | number>(data.userId, "-"),
    orgId: safe<string | number>(data.orgId, "-"),
    profile: {
      personId: safe<string>(data.profile?.personId, "-"),
      name: safe<string>(data.profile?.name, "-"),
      phoneNumber: safe<string>(data.profile?.phoneNumber, "-"),
      email: safe<string>(data.profile?.email, "-"),
      gender: safe<string>(data.profile?.gender, "-"),
      department: safe<string>(data.profile?.department, "-"),
      roleType: safe<string>(data.profile?.roleType, "-"),
      profileImageUrl: safe<string | null>(data.profile?.profileImageUrl, null),
      createdAt: safe<string>(data.profile?.createdAt, "-"),
      updatedAt: safe<string>(data.profile?.updatedAt, "-"),
    },
  };
};

export const getCompanyProfileData =
  async (): Promise<CompanyProfileResponse> => {
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
    const response = await fetch(BACKEND_PROFILE_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch company profile");
    const data = await response.json();
    const profile = data.profile || {};
    // Ensure location is always an object with all fields
    let locationObj: CompanyLocation = {
      buildingNo: "",
      floor: "",
      street: "",
      locality: "",
      city: "",
      state: "",
      pincode: "",
    };
    if (typeof profile.location === "string") {
      try {
        const parsed = JSON.parse(profile.location);
        locationObj = {
          buildingNo: parsed.buildingNo || "",
          floor: parsed.floor || "",
          street: parsed.street || "",
          locality: parsed.locality || "",
          city: parsed.city || "",
          state: parsed.state || "",
          pincode: parsed.pincode || "",
        };
      } catch {}
    } else if (
      typeof profile.location === "object" &&
      profile.location !== null
    ) {
      locationObj = {
        buildingNo: profile.location.buildingNo || "",
        floor: profile.location.floor || "",
        street: profile.location.street || "",
        locality: profile.location.locality || "",
        city: profile.location.city || "",
        state: profile.location.state || "",
        pincode: profile.location.pincode || "",
      };
    }
    return {
      companyName: profile.companyName || "",
      phoneNumber: profile.phoneNumber || "",
      email: profile.email || "",
      location: locationObj,
    };
  };

export const updateCompanyProfileData = async (
  profile: CompanyProfileResponse
): Promise<CompanyProfileResponse> => {
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
  const response = await fetch(BACKEND_COMPANY_PROFILE_URL, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      companyName: profile.companyName,
      phoneNumber: profile.phoneNumber,
      email: profile.email,
      location: profile.location,
    }),
  });
  if (!response.ok) throw new Error("Failed to update company profile");
  const data = await response.json();
  // Ensure location is always an object with all fields
  let locationObj: CompanyLocation = {
    buildingNo: "",
    floor: "",
    street: "",
    locality: "",
    city: "",
    state: "",
    pincode: "",
  };
  if (typeof data.location === "string") {
    try {
      const parsed = JSON.parse(data.location);
      locationObj = {
        buildingNo: parsed.buildingNo || "",
        floor: parsed.floor || "",
        street: parsed.street || "",
        locality: parsed.locality || "",
        city: parsed.city || "",
        state: parsed.state || "",
        pincode: parsed.pincode || "",
      };
    } catch {}
  } else if (typeof data.location === "object" && data.location !== null) {
    locationObj = {
      buildingNo: data.location.buildingNo || "",
      floor: data.location.floor || "",
      street: data.location.street || "",
      locality: data.location.locality || "",
      city: data.location.city || "",
      state: data.location.state || "",
      pincode: data.location.pincode || "",
    };
  }
  return {
    companyName: data.companyName,
    phoneNumber: data.phoneNumber,
    email: data.email,
    location: locationObj,
  };
};

// Profile Image API functions
export interface ProfileImageResponse {
  success: boolean;
  data?: {
    hasImage: boolean;
    filePath: string | null;
    imageData: string | null;
    mimeType: string | null;
    size: number;
  };
  error?: string;
}

export interface ProfileImageUploadResponse {
  success: boolean;
  message: string;
  data?: {
    filePath: string;
    fileName: string;
    imageUrl: string;
  };
  error?: string;
}

// Get profile image as base64
export const getProfileImage = async (): Promise<ProfileImageResponse> => {
  // Check if we're in browser environment
  if (typeof window === "undefined") {
    return {
      success: false,
      error: "Not in browser environment",
    };
  }

  const authDataRaw = localStorage.getItem("authData");
  if (!authDataRaw) {
    return {
      success: false,
      error: "No auth data found",
    };
  }

  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    return {
      success: false,
      error: "Invalid auth data",
    };
  }
  if (!token) {
    return {
      success: false,
      error: "No token found",
    };
  }

  try {
    const response = await axios.get(PROFILE_IMAGE_GET_API, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    // Handle 404 as a normal case (user doesn't have a profile image yet)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        success: true,
        data: {
          hasImage: false,
          filePath: null,
          imageData: null,
          mimeType: null,
          size: 0,
        },
      };
    }
    
    // Log other errors
    console.error("Failed to fetch profile image:", error);
    return {
      success: false,
      error: "Failed to fetch profile image",
    };
  }
};

// Upload profile image
export const uploadProfileImage = async (
  file: File
): Promise<ProfileImageUploadResponse> => {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
  if (!authDataRaw) {
    return {
      success: false,
      message: "No auth data found",
      error: "No auth data found",
    };
  }

  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    return {
      success: false,
      message: "Invalid auth data",
      error: "Invalid auth data",
    };
  }
  if (!token) {
    return {
      success: false,
      message: "No token found",
      error: "No token found",
    };
  }

  try {
    const formData = new FormData();
    formData.append("profileImage", file);

    const response = await axios.post(PROFILE_IMAGE_UPLOAD_API, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to upload profile image:", error);
    return {
      success: false,
      message: "Failed to upload profile image",
      error: "Failed to upload profile image",
    };
  }
};

// Delete profile image
export const deleteProfileImage = async (): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> => {
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

  const response = await axios.delete(PROFILE_IMAGE_DELETE_API, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};
