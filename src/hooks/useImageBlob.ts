import { useState, useEffect } from "react";
import { getVisitorAssetImageBlob } from "@/app/api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "@/app/api/visitor-guests/routes";

export const useAssetImageBlob = (filePath: string | undefined) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setBlobUrl(null);
      return;
    }

    const fetchBlobUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = await getVisitorAssetImageBlob(filePath);
        setBlobUrl(url);
      } catch (err) {
        setError("Failed to load image");
        console.error("Error fetching asset image blob:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlobUrl();
  }, [filePath]);

  return { blobUrl, loading, error };
};

export const useGuestImageBlob = (filePath: string | undefined) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setBlobUrl(null);
      return;
    }

    const fetchBlobUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = await getVisitorGuestPhotoBlob(filePath);
        setBlobUrl(url);
      } catch (err) {
        setError("Failed to load image");
        console.error("Error fetching guest image blob:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlobUrl();
  }, [filePath]);

  return { blobUrl, loading, error };
};
