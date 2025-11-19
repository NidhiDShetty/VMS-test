import {
  VISITOR_ASSET_IMAGE_UPLOAD_API,
  VISITOR_ASSET_IMAGE_GET_API,
  VISITOR_ASSET_IMAGE_DELETE_API,
} from "@/lib/server-urls";

interface UploadAssetImageResponse {
  success: boolean;
  message: string;
  data: {
    filePath: string;
    fileName: string;
    imageUrl: string;
    assetIndex: number;
  };
}

interface GetAssetImageResponse {
  success: boolean;
  data: {
    hasImage: boolean;
    filePath: string | null;
    imageData: string | null;
    mimeType: string | null;
    size: number;
    assetIndex: number;
  };
}

interface DeleteAssetImageResponse {
  success: boolean;
  message: string;
  data: {
    assetIndex: number;
  };
}

export const uploadAssetImage = async (
  visitorId: string | number,
  assetIndex: number,
  file: File,
  token: string
): Promise<UploadAssetImageResponse> => {
  const formData = new FormData();
  formData.append("assetImage", file);

  const response = await fetch(
    VISITOR_ASSET_IMAGE_UPLOAD_API(visitorId, assetIndex),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload asset image");
  }

  return response.json();
};

export const getAssetImage = async (
  visitorId: string | number,
  assetIndex: number,
  token: string
): Promise<GetAssetImageResponse> => {
  const response = await fetch(
    VISITOR_ASSET_IMAGE_GET_API(visitorId, assetIndex),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to get asset image");
  }

  return response.json();
};

export const deleteAssetImage = async (
  visitorId: string | number,
  assetIndex: number,
  token: string
): Promise<DeleteAssetImageResponse> => {
  const response = await fetch(
    VISITOR_ASSET_IMAGE_DELETE_API(visitorId, assetIndex),
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete asset image");
  }

  return response.json();
};
