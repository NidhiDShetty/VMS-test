"use client";

import React, { useState, useRef } from "react";
import { Box, Flex, Text, Button, Icon, Input } from "@chakra-ui/react";
import { FiCamera, FiTrash2, FiUpload } from "react-icons/fi";
import Image from "next/image";
import {
  uploadVisitorImage,
  getVisitorImageBlob,
} from "@/app/api/visitor-image/routes";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import {
  takePhotoWithSizeLimit,
  compressFileToMaxSize,
} from "@/utils/imageCompression";

interface VisitorImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (filePath: string | null) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export interface VisitorImageUploadRef {
  reset: () => void;
}

const VisitorImageUpload = React.forwardRef<
  VisitorImageUploadRef,
  VisitorImageUploadProps
>(
  (
    {
      currentImageUrl,
      onImageChange,
      loading = false,
      disabled = false,
      label = "Visitor Photo",
    },
    ref
  ) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset function
    const reset = () => {
      setImagePreview(null);
      setError(null);
      setUploading(false);
      onImageChange(null);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Expose reset function via ref
    React.useImperativeHandle(ref, () => ({
      reset,
    }));

    // Clear image preview on mount if no currentImageUrl
    React.useEffect(() => {
      if (!currentImageUrl) {
        setImagePreview(null);
      }
    }, [currentImageUrl]);

    // Handle camera capture
    const handleCameraCapture = async () => {
      if (disabled || loading || uploading) return;

      setError(null);
      setUploading(true);

      try {
        // Check if we're on mobile (Capacitor) or web
        // More reliable detection for Capacitor
        const windowWithCapacitor = window as {
          Capacitor?: { isNativePlatform?: () => boolean };
        };
        const isCapacitor =
          typeof window !== "undefined" &&
          windowWithCapacitor.Capacitor &&
          windowWithCapacitor.Capacitor.isNativePlatform?.();

        if (isCapacitor) {
          // Use Capacitor Camera for mobile with automatic compression
          const compressedFile = await takePhotoWithSizeLimit(15);

          // Upload the compressed image
          const uploadResult = await uploadVisitorImage(compressedFile);

          if (uploadResult.success && uploadResult.data?.filePath) {
            // Create preview URL from compressed file
            const previewUrl = URL.createObjectURL(compressedFile);
            setImagePreview(previewUrl);
            // Update the form with the file path
            onImageChange(uploadResult.data.filePath);
          } else {
            setError(uploadResult.error || "Failed to upload image");
          }
        } else {
          // Use web camera API with better implementation
          await captureWebCamera();
        }
      } catch (err) {
        console.error("Camera capture error:", err);
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError("Camera access denied. Please allow camera permissions.");
          } else if (err.name === "NotFoundError") {
            setError("No camera found on this device.");
          } else if (err.message.includes("User cancelled")) {
            // User cancelled, don't show error
            return;
          } else {
            setError("Failed to capture image. Please try again.");
          }
        } else {
          setError("Failed to capture image. Please try again.");
        }
      } finally {
        setUploading(false);
      }
    };

    // Web camera capture function
    const captureWebCamera = async () => {
      // Create a modal for camera preview
      const modal = document.createElement("div");
      modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.9);
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
      user-select: none;
    `;

      const video = document.createElement("video");
      video.style.cssText = `
      width: 90%;
      max-width: 500px;
      height: auto;
      border-radius: 10px;
      pointer-events: none;
    `;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText = `
      margin-top: 20px;
      display: flex;
      gap: 10px;
      pointer-events: auto;
    `;

      const captureBtn = document.createElement("button");
      captureBtn.textContent = "Capture";
      captureBtn.style.cssText = `
      padding: 12px 24px;
      background: #8A38F5;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      pointer-events: auto;
      user-select: none;
      transition: background-color 0.2s;
    `;

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.style.cssText = `
      padding: 12px 24px;
      background: #6B7280;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      pointer-events: auto;
      user-select: none;
      transition: background-color 0.2s;
    `;

      // Add hover effects
      captureBtn.addEventListener("mouseenter", () => {
        captureBtn.style.background = "#7A2FE5";
      });
      captureBtn.addEventListener("mouseleave", () => {
        captureBtn.style.background = "#8A38F5";
      });

      cancelBtn.addEventListener("mouseenter", () => {
        cancelBtn.style.background = "#4B5563";
      });
      cancelBtn.addEventListener("mouseleave", () => {
        cancelBtn.style.background = "#6B7280";
      });

      buttonContainer.appendChild(captureBtn);
      buttonContainer.appendChild(cancelBtn);
      modal.appendChild(video);
      modal.appendChild(buttonContainer);
      document.body.appendChild(modal);

      try {
        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        video.srcObject = stream;

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => resolve(true);
          video.onerror = () => reject(new Error("Video failed to load"));
        });

        // Capture image when button is clicked
        await new Promise((resolve, reject) => {
          captureBtn.onclick = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx?.drawImage(video, 0, 0);

            canvas.toBlob(
              async (blob) => {
                if (blob) {
                  try {
                    // Create JPG file from blob
                    const jpgFile = new File(
                      [blob],
                      `visitor_photo_${Date.now()}.jpg`,
                      {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                      }
                    );

                    // Compress the file if needed before uploading
                    const compressedFile = await compressFileToMaxSize(
                      jpgFile,
                      15
                    );

                    // Upload the compressed image
                    const uploadResult = await uploadVisitorImage(compressedFile);

                    if (uploadResult.success && uploadResult.data?.filePath) {
                      // Create preview URL
                      const previewUrl = URL.createObjectURL(compressedFile);
                      setImagePreview(previewUrl);
                      // Update the form with the file path
                      onImageChange(uploadResult.data.filePath);
                    } else {
                      setError(uploadResult.error || "Failed to upload image");
                    }
                  } catch (uploadErr) {
                    console.error("Upload error:", uploadErr);
                    setError("Failed to upload image");
                  }
                }
                resolve(true);
              },
              "image/jpeg",
              0.9
            );
          };

          cancelBtn.onclick = () => {
            reject(new Error("User cancelled"));
          };
        });
      } finally {
        // Cleanup
        try {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach((track) => track.stop());
          }
          if (modal && modal.parentNode) {
            document.body.removeChild(modal);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
      }
    };

    // Convert image to JPG format
    const convertToJpg = async (file: File): Promise<File> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new window.Image();

        img.onload = () => {
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw image on canvas
          ctx?.drawImage(img, 0, 0);

          // Convert to blob with JPG format
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Create new File object with JPG extension
                const jpgFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, ".jpg"),
                  {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  }
                );
                resolve(jpgFile);
              } else {
                reject(new Error("Failed to convert image to JPG"));
              }
            },
            "image/jpeg",
            0.9
          );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
      });
    };

    // Handle file selection (fallback for file upload)
    const handleFileSelect = async (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      // Note: File size validation removed - compression will handle large files

      setError(null);
      setUploading(true);

      try {
        // Convert to JPG format
        const jpgFile = await convertToJpg(file);

        // Compress the file if needed before uploading
        const compressedFile = await compressFileToMaxSize(jpgFile, 15);

        // Upload the compressed image
        const uploadResult = await uploadVisitorImage(compressedFile);

        if (uploadResult.success && uploadResult.data?.filePath) {
          // Create preview URL for immediate display
          const previewUrl = URL.createObjectURL(compressedFile);
          setImagePreview(previewUrl);

          // Update the form with the file path
          onImageChange(uploadResult.data.filePath);
        } else {
          setError(uploadResult.error || "Failed to upload image");
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError("Failed to upload image");
      } finally {
        setUploading(false);
      }
    };

    // Handle image deletion
    const handleImageDelete = () => {
      setImagePreview(null);
      onImageChange(null);
      setError(null);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Handle camera capture click
    const handleCameraClick = () => {
      if (disabled || loading || uploading) return;
      handleCameraCapture();
    };

    // Handle file input click (fallback)
    const handleFileInputClick = () => {
      if (disabled || loading || uploading) return;
      fileInputRef.current?.click();
    };

    // Get the current image to display
    const getCurrentImage = () => {
      // If currentImageUrl is empty/null, return null immediately
      if (!currentImageUrl) {
        return null;
      }

      if (imagePreview) return imagePreview;

      // If it's a file path, we need to get the blob URL
      if (
        !currentImageUrl.startsWith("http") &&
        !currentImageUrl.startsWith("data:")
      ) {
        // This is a file path, we'll handle it in useEffect
        return null;
      }
      return currentImageUrl;
    };

    // Load existing image as blob if it's a file path
    React.useEffect(() => {
      const loadExistingImage = async () => {
        // If currentImageUrl is empty/null, clear imagePreview immediately
        if (!currentImageUrl) {
          setImagePreview(null);
          return;
        }

        if (
          !currentImageUrl.startsWith("http") &&
          !currentImageUrl.startsWith("data:")
        ) {
          try {
            const blobUrl = await getVisitorImageBlob(currentImageUrl);
            if (blobUrl) {
              setImagePreview(blobUrl);
            } else {
              setImagePreview(null);
            }
          } catch (err) {
            console.error("Failed to load existing image:", err);
            setImagePreview(null);
          }
        } else {
          // For direct URLs, clear imagePreview since we'll use the URL directly
          setImagePreview(null);
        }
      };

      loadExistingImage();
    }, [currentImageUrl]);

    const currentImage = getCurrentImage();
    const isUploading = uploading || loading;

    return (
      <Box>
        <Text fontSize="sm" fontWeight="500" color="gray.700" mb={3}>
          {label}
        </Text>

        <Flex direction="column" align="center" gap={4}>
          {/* Image Preview Container */}
          <Box position="relative" display="inline-block">
            <Box
              w="120px"
              h="120px"
              borderRadius="full"
              overflow="hidden"
              bg="gray.100"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="2px solid"
              borderColor={currentImage ? "green.300" : "gray.200"}
            >
              {currentImage ? (
                <Image
                  src={currentImage}
                  alt="Visitor"
                  width={120}
                  height={120}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : (
                <Flex direction="column" align="center" gap={2}>
                  <Icon as={FiCamera} boxSize={8} color="gray.400" />
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    No Image
                  </Text>
                </Flex>
              )}
            </Box>
            {/* Delete button positioned outside the circle */}
            {currentImage && (
              <Button
                position="absolute"
                top="4px"
                right="-8px"
                size="sm"
                bg="red.500"
                color="white"
                borderRadius="full"
                w="24px"
                h="24px"
                minW="24px"
                p={0}
                onClick={handleImageDelete}
                disabled={isUploading}
                _hover={{ bg: "red.600" }}
                zIndex={10}
                boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                tabIndex={0}
                aria-label="Delete visitor image"
              >
                <Icon as={FiTrash2} boxSize={3} />
              </Button>
            )}
          </Box>

          {/* Action Buttons */}
          <Flex gap={2} direction="column" w="full">
            {/* Camera Button */}
            <Button
              onClick={handleCameraClick}
              disabled={isUploading}
              bg="#8A38F5"
              color="white"
              size="sm"
              _hover={{
                bg: "#7A2FE5",
              }}
              loading={isUploading}
              loadingText="Capturing..."
              w="full"
            >
              <Icon as={FiCamera} mr={2} />
              {currentImage ? "Retake Photo" : "Take Photo"}
            </Button>

            {/* File Upload Button */}
            <Button
              onClick={handleFileInputClick}
              disabled={isUploading}
              variant="outline"
              size="sm"
              borderColor="#8A38F5"
              color="#8A38F5"
              _hover={{
                bg: "#8A38F5",
                color: "white",
              }}
              w="full"
            >
              <Icon as={FiUpload} mr={2} />
              Choose from Gallery
            </Button>
          </Flex>

          <Text fontSize="xs" color="gray.500" textAlign="center">
            Images will be automatically compressed to meet size requirements.
          </Text>

          {/* Error Message */}
          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center">
              {error}
            </Text>
          )}

          {/* Hidden File Input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            display="none"
          />
        </Flex>
      </Box>
    );
  }
);

VisitorImageUpload.displayName = "VisitorImageUpload";

export default VisitorImageUpload;
