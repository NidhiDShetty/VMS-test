import axios from "axios";
import {
  VISITOR_ASSET_IMAGE_UPLOAD_API,
  VISITOR_ASSET_IMAGE_GET_API,
  VISITOR_ASSET_IMAGE_DELETE_API,
  ASSET_IMAGE_UPLOAD_API,
  ASSET_IMAGE_BLOB_API,
} from "@/lib/server-urls";

// Types for visitor asset image responses
export interface VisitorAssetImageUploadResponse {
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

export interface VisitorAssetImageGetResponse {
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

export interface VisitorAssetImageDeleteResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// Upload visitor asset image
export const uploadVisitorAssetImage = async (
  visitorId: string | number,
  assetIndex: number,
  file: File
): Promise<VisitorAssetImageUploadResponse> => {
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
    formData.append("assetImage", file);

    // Use general assets endpoint for temporary uploads (when visitorId is "temp")
    const uploadUrl =
      visitorId === "temp"
        ? ASSET_IMAGE_UPLOAD_API
        : VISITOR_ASSET_IMAGE_UPLOAD_API(visitorId, assetIndex);

    const response = await axios.post(uploadUrl, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Failed to upload visitor asset image:", error);
    return {
      success: false,
      error: "Failed to upload visitor asset image",
    };
  }
};

// Get visitor asset image as base64
export const getVisitorAssetImage = async (
  visitorId: string | number,
  assetIndex: number
): Promise<VisitorAssetImageGetResponse> => {
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
      VISITOR_ASSET_IMAGE_GET_API(visitorId, assetIndex),
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
        error: "Asset image not found",
      };
    }
    
    // Log other errors
    console.error("Failed to fetch visitor asset image:", error);
    return {
      success: false,
      error: "Failed to fetch visitor asset image",
    };
  }
};

// Get visitor asset image as blob URL
export const getVisitorAssetImageBlob = async (
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
    const response = await fetch(`${ASSET_IMAGE_BLOB_API(filePath)}`, {
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
    console.error("Failed to fetch visitor asset image blob:", error);
    return null;
  }
};

// Delete visitor asset image
export const deleteVisitorAssetImage = async (
  visitorId: string | number,
  assetIndex: number
): Promise<VisitorAssetImageDeleteResponse> => {
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
      VISITOR_ASSET_IMAGE_DELETE_API(visitorId, assetIndex),
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to delete visitor asset image:", error);
    return {
      success: false,
      error: "Failed to delete visitor asset image",
    };
  }
};
