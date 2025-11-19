import {
  GUEST_PHOTO_UPLOAD_API,
  GUEST_PHOTO_GET_API,
  GUEST_PHOTO_DELETE_API,
} from "@/lib/server-urls";

interface UploadGuestPhotoResponse {
  success: boolean;
  message: string;
  data: {
    filePath: string;
    fileName: string;
    imageUrl: string;
    guestIndex: number;
  };
}

interface GetGuestPhotoResponse {
  success: boolean;
  data: {
    hasImage: boolean;
    filePath: string | null;
    imageData: string | null;
    mimeType: string | null;
    size: number;
    guestIndex: number;
  };
}

interface DeleteGuestPhotoResponse {
  success: boolean;
  message: string;
  data: {
    guestIndex: number;
  };
}

export const uploadGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number,
  file: File,
  token: string
): Promise<UploadGuestPhotoResponse> => {
  const formData = new FormData();
  formData.append("guestPhoto", file);

  const response = await fetch(
    GUEST_PHOTO_UPLOAD_API(visitorId, guestIndex),
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
    throw new Error(errorData.error || "Failed to upload guest photo");
  }

  return response.json();
};

export const getGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number,
  token: string
): Promise<GetGuestPhotoResponse> => {
  const response = await fetch(
    GUEST_PHOTO_GET_API(visitorId, guestIndex),
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
    throw new Error(errorData.error || "Failed to get guest photo");
  }

  return response.json();
};

export const deleteGuestPhoto = async (
  visitorId: string | number,
  guestIndex: number,
  token: string
): Promise<DeleteGuestPhotoResponse> => {
  const response = await fetch(
    GUEST_PHOTO_DELETE_API(visitorId, guestIndex),
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
    throw new Error(errorData.error || "Failed to delete guest photo");
  }

  return response.json();
};
