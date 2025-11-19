import axios from "axios";
import {
  GUEST_PHOTO_UPLOAD_API,
  GUEST_PHOTO_GET_API,
  GUEST_PHOTO_DELETE_API,
  GUEST_PHOTO_UPLOAD_API_GENERAL,
  GUEST_PHOTO_BLOB_API_GENERAL,
} from "@/lib/server-urls";

// Types for visitor guest photo responses
export interface VisitorGuestPhotoUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    filePath: string;
    fileName: string;
    imageUrl: string;
    uploadedBy: string;
    orgId: string;
  };
  error?: string;
}

export interface VisitorGuestPhotoGetResponse {
  success: boolean;
  data?: {
    hasImage: boolean;
    filePath: string;
    imageData: string;
    mimeType: string;
    size: number;
  };
  error?: string;
}

export interface VisitorGuestPhotoDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Upload visitor guest photo
export const uploadVisitorGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number,
  file: File
): Promise<VisitorGuestPhotoUploadResponse> => {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
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
    const formData = new FormData();
    formData.append("guestImage", file);

    // Use general guests endpoint for temporary uploads (when visitorId is "temp")
    const uploadUrl =
      visitorId === "temp"
        ? GUEST_PHOTO_UPLOAD_API_GENERAL
        : GUEST_PHOTO_UPLOAD_API(visitorId, guestIndex);

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to upload visitor guest photo:", error);
    return {
      success: false,
      error: "Failed to upload visitor guest photo",
    };
  }
};

// Get visitor guest photo as base64
export const getVisitorGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number
): Promise<VisitorGuestPhotoGetResponse> => {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
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
    const response = await axios.get(
      GUEST_PHOTO_GET_API(visitorId, guestIndex),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    // Handle 404 as a normal case (image not found or deleted)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        success: false,
        error: "Guest photo not found",
      };
    }
    
    // Log other errors
    console.error("Failed to fetch visitor guest photo:", error);
    return {
      success: false,
      error: "Failed to fetch visitor guest photo",
    };
  }
};

// Get visitor guest photo as blob URL
export const getVisitorGuestPhotoBlob = async (
  filePath: string
): Promise<string | null> => {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
  if (!authDataRaw) {
    return null;
  }

  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch {
    return null;
  }
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${GUEST_PHOTO_BLOB_API_GENERAL(filePath)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    
    // 404 is expected when image doesn't exist - don't log as error
    if (response.status === 404) {
      return null;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch visitor guest photo blob:", error);
    return null;
  }
};

// Delete visitor guest photo
export const deleteVisitorGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number
): Promise<VisitorGuestPhotoDeleteResponse> => {
  const authDataRaw =
    typeof window !== "undefined" ? localStorage.getItem("authData") : null;
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
    const response = await axios.delete(
      GUEST_PHOTO_DELETE_API(visitorId, guestIndex),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to delete visitor guest photo:", error);
    return {
      success: false,
      error: "Failed to delete visitor guest photo",
    };
  }
};
