"use client";

import React, { useState } from "react";
import { Box, Text, IconButton } from "@chakra-ui/react";
import Image from "next/image";
import { FiCamera, FiX } from "react-icons/fi";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { toaster } from "@/components/ui/toaster";
import { compressFileToMaxSize } from "@/utils/imageCompression";

interface PhotoCaptureProps {
  currentImageUrl?: string;
  onImageCapture: (file: File) => Promise<void>;
  onImageDelete?: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  showMessage?: boolean;
  message?: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  currentImageUrl,
  onImageCapture,
  onImageDelete,
  loading = false,
  disabled = false,
  label = "Photo",
  showMessage = false,
  message = "Photos can be uploaded after visitor is created",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCameraClick = async () => {
    if (disabled || loading) return;

    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (image.webPath) {
        // Convert the web path to a File object
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], "camera-capture.jpg", {
          type: blob.type,
        });

        // Compress the file if needed before processing
        const compressedFile = await compressFileToMaxSize(file, 5);

        // Create preview URL from compressed file
        const url = URL.createObjectURL(compressedFile);
        setPreviewUrl(url);

        // Call the parent handler with compressed file
        await onImageCapture(compressedFile);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toaster.error({
        title: "Camera Error",
        description: "Failed to open camera. Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    if (onImageDelete) {
      await onImageDelete();
    }
    setPreviewUrl(null);
  };

  const displayImage = previewUrl || currentImageUrl;

  return (
    <Box textAlign="center">
      <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={3}>
        {label}
      </Text>

      {showMessage && (
        <Text
          fontSize="xs"
          color="orange.600"
          textAlign="center"
          maxW="120px"
          mb={3}
        >
          {message}
        </Text>
      )}

      <Box position="relative" w="full">
        <Box
          w="full"
          h="120px"
          borderRadius="lg"
          border="2px solid"
          borderColor={displayImage ? "#8A38F5" : "#8A38F5"}
          bg={displayImage ? "white" : "#F4EDFE"}
          display="flex"
          alignItems="center"
          justifyContent="center"
          cursor={disabled || loading ? "not-allowed" : "pointer"}
          onClick={handleCameraClick}
          tabIndex={0}
          aria-label={`${label} camera`}
          _hover={!disabled && !loading ? { bg: "#F4EDFE" } : {}}
          transition="all 0.2s"
        >
          {displayImage ? (
            <Box
              w="100%"
              h="100%"
              borderRadius="lg"
              overflow="hidden"
              position="relative"
            >
              <Image
                src={displayImage}
                alt={label}
                fill
                style={{
                  objectFit: "cover",
                }}
              />
            </Box>
          ) : (
            <FiCamera size={32} color="#8A38F5" />
          )}
        </Box>

        {displayImage && (
          <IconButton
            aria-label="Delete photo"
            size="xs"
            colorScheme="red"
            variant="solid"
            position="absolute"
            top="-8px"
            right="-8px"
            borderRadius="full"
            boxSize="24px"
            onClick={handleDelete}
            disabled={loading || disabled}
            _hover={{ bg: "red.600" }}
          >
            <FiX />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default PhotoCapture;
