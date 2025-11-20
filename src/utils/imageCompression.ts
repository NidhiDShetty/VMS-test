import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/**
 * Maximum dimensions for compressed images (1920x1920 for good quality at low file size)
 */
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;

/**
 * Calculate the size of a base64 data URL in bytes
 */
const getBase64Size = (dataUrl: string): number => {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  return Math.ceil((base64.length * 3) / 4);
};

/**
 * Resize image to fit within maximum dimensions while maintaining aspect ratio
 */
const resizeToMaxDimensions = (
  dataUrl: string,
  maxWidth: number = MAX_WIDTH,
  maxHeight: number = MAX_HEIGHT
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Use high-quality image rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

/**
 * Compress an image by adjusting quality
 */
const compressImage = (dataUrl: string, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

/**
 * Resize an image by scaling dimensions (for aggressive compression)
 */
const resizeImage = (dataUrl: string, scale: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

/**
 * Compress a data URL to meet a maximum size limit
 * First resizes to max dimensions, then reduces quality if needed
 */
const compressToMaxSize = async (
  dataUrl: string,
  maxSizeMB: number
): Promise<string> => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Step 1: Always resize to maximum dimensions first (this is the key fix)
  let compressedDataUrl = await resizeToMaxDimensions(dataUrl);
  let currentSize = getBase64Size(compressedDataUrl);

  // If already under size limit after resizing, return
  if (currentSize <= maxSizeBytes) {
    return compressedDataUrl;
  }

  // Step 2: Reduce quality progressively if still too large
  let quality = 0.8;
  while (currentSize > maxSizeBytes && quality > 0.1) {
    compressedDataUrl = await compressImage(compressedDataUrl, quality);
    currentSize = getBase64Size(compressedDataUrl);
    quality -= 0.1;
  }

  // Step 3: If still too large, aggressively resize
  if (currentSize > maxSizeBytes) {
    // Try 0.7 scale first
    compressedDataUrl = await resizeImage(compressedDataUrl, 0.7);
    currentSize = getBase64Size(compressedDataUrl);

    // If still too large, try 0.5 scale
    if (currentSize > maxSizeBytes) {
      compressedDataUrl = await resizeImage(compressedDataUrl, 0.5);
      currentSize = getBase64Size(compressedDataUrl);
    }

    // Final aggressive compression with low quality
    if (currentSize > maxSizeBytes) {
      compressedDataUrl = await compressImage(compressedDataUrl, 0.5);
    }
  }

  return compressedDataUrl;
};

/**
 * Convert a data URL to a File object
 */
const dataUrlToFile = (dataUrl: string, fileName: string): File => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
};

/**
 * Convert a File to a data URL
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Take a photo with Capacitor Camera and compress it to meet size limit
 * Uses lower quality initially and always compresses to max dimensions
 * @param maxSizeMB Maximum size in MB (default: 5MB)
 * @returns Compressed File object ready for upload
 */
export const takePhotoWithSizeLimit = async (
  maxSizeMB: number = 5
): Promise<File> => {
  // Use lower quality (60) to reduce initial file size from camera
  const image = await Camera.getPhoto({
    quality: 60,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  if (!image.dataUrl) {
    throw new Error("Failed to capture image");
  }

  // Always compress to max dimensions and size limit
  const compressedDataUrl = await compressToMaxSize(image.dataUrl, maxSizeMB);
  return dataUrlToFile(
    compressedDataUrl,
    `visitor_photo_${Date.now()}.jpg`
  );
};

/**
 * Compress a File object to meet a maximum size limit
 * @param file The file to compress
 * @param maxSizeMB Maximum size in MB (default: 5MB)
 * @returns Compressed File object
 */
export const compressFileToMaxSize = async (
  file: File,
  maxSizeMB: number = 5
): Promise<File> => {
  const dataUrl = await fileToDataUrl(file);
  const compressedDataUrl = await compressToMaxSize(dataUrl, maxSizeMB);
  return dataUrlToFile(compressedDataUrl, file.name);
};

/**
 * Compress a data URL to meet a maximum size limit and return as File
 * @param dataUrl The data URL to compress
 * @param fileName The name for the resulting file
 * @param maxSizeMB Maximum size in MB (default: 5MB)
 * @returns Compressed File object
 */
export const compressDataUrlToFile = async (
  dataUrl: string,
  fileName: string,
  maxSizeMB: number = 5
): Promise<File> => {
  const compressedDataUrl = await compressToMaxSize(dataUrl, maxSizeMB);
  return dataUrlToFile(compressedDataUrl, fileName);
};

