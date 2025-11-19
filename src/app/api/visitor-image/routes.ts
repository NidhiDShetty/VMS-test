import axios from "axios";
import {
  VISITOR_IMAGE_UPLOAD_API,
  VISITOR_IMAGE_GET_API,
  VISITOR_IMAGE_BLOB_API,
  VISITOR_IMAGE_DELETE_API,
} from "@/lib/server-urls";

// Types for visitor image responses
export interface VisitorImageUploadResponse {
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

export interface VisitorImageGetResponse {
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

export interface VisitorImageDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Upload visitor image
export const uploadVisitorImage = async (
  file: File
): Promise<VisitorImageUploadResponse> => {
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
    formData.append("visitorImage", file);

    const response = await axios.post(VISITOR_IMAGE_UPLOAD_API, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to upload visitor image:", error);
    return {
      success: false,
      error: "Failed to upload visitor image",
    };
  }
};

// Get visitor image as base64
export const getVisitorImage = async (
  filePath: string
): Promise<VisitorImageGetResponse> => {
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
    const response = await axios.get(VISITOR_IMAGE_GET_API(filePath), {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    // Handle 404 as a normal case (image not found or deleted)
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        success: false,
        error: "Image not found",
      };
    }
    
    // Log other errors
    console.error("Failed to fetch visitor image:", error);
    return {
      success: false,
      error: "Failed to fetch visitor image",
    };
  }
};

// Get visitor image as blob URL
export const getVisitorImageBlob = async (
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
    const response = await fetch(VISITOR_IMAGE_BLOB_API(filePath), {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return blobUrl;
    }

    // 404 is expected when image doesn't exist - don't log as error
    if (response.status === 404) {
      return null;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to fetch visitor image blob:", error);
    return null;
  }
};

// Delete visitor image
export const deleteVisitorImage = async (
  filePath: string
): Promise<VisitorImageDeleteResponse> => {
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
    const response = await axios.delete(VISITOR_IMAGE_DELETE_API(filePath), {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to delete visitor image:", error);
    return {
      success: false,
      error: "Failed to delete visitor image",
    };
  }
};
