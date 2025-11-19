import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/**
 * Calculate the size of a base64 data URL in bytes
 */
const getBase64Size = (dataUrl: string): number => {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  return Math.ceil((base64.length * 3) / 4);
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
 * Resize an image by scaling dimensions
 */
const resizeImage = (dataUrl: string, scale: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

/**
 * Compress a data URL to meet a maximum size limit
 */
const compressToMaxSize = async (
  dataUrl: string,
  maxSizeMB: number
): Promise<string> => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  const currentSize = getBase64Size(dataUrl);

  if (currentSize <= maxSizeBytes) {
    return dataUrl;
  }

  let quality = 0.9;
  let compressedDataUrl = dataUrl;

  while (getBase64Size(compressedDataUrl) > maxSizeBytes && quality > 0.1) {
    compressedDataUrl = await compressImage(compressedDataUrl, quality);
    quality -= 0.1;
  }

  if (getBase64Size(compressedDataUrl) > maxSizeBytes) {
    compressedDataUrl = await resizeImage(compressedDataUrl, 0.7);
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
 * @param maxSizeMB Maximum size in MB (default: 15MB to match backend limit)
 * @returns Compressed File object ready for upload
 */
export const takePhotoWithSizeLimit = async (
  maxSizeMB: number = 15
): Promise<File> => {
  const image = await Camera.getPhoto({
    quality: 100,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
  });

  if (!image.dataUrl) {
    throw new Error("Failed to capture image");
  }

  const compressedDataUrl = await compressToMaxSize(image.dataUrl, maxSizeMB);
  return dataUrlToFile(
    compressedDataUrl,
    `visitor_photo_${Date.now()}.jpg`
  );
};

/**
 * Compress a File object to meet a maximum size limit
 * @param file The file to compress
 * @param maxSizeMB Maximum size in MB (default: 15MB to match backend limit)
 * @returns Compressed File object
 */
export const compressFileToMaxSize = async (
  file: File,
  maxSizeMB: number = 15
): Promise<File> => {
  const dataUrl = await fileToDataUrl(file);
  const compressedDataUrl = await compressToMaxSize(dataUrl, maxSizeMB);
  return dataUrlToFile(compressedDataUrl, file.name);
};

/**
 * Compress a data URL to meet a maximum size limit and return as File
 * @param dataUrl The data URL to compress
 * @param fileName The name for the resulting file
 * @param maxSizeMB Maximum size in MB (default: 15MB to match backend limit)
 * @returns Compressed File object
 */
export const compressDataUrlToFile = async (
  dataUrl: string,
  fileName: string,
  maxSizeMB: number = 15
): Promise<File> => {
  const compressedDataUrl = await compressToMaxSize(dataUrl, maxSizeMB);
  return dataUrlToFile(compressedDataUrl, fileName);
};

