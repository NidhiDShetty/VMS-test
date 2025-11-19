import React from "react";
import { Box, Spinner } from "@chakra-ui/react";
import Image from "next/image";
import { useAssetImageBlob, useGuestImageBlob } from "@/hooks/useImageBlob";

interface ImageWithBlobProps {
  filePath: string | undefined;
  alt: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  border?: string;
  borderColor?: string;
  bg?: string;
  type: "asset" | "guest";
}

const ImageWithBlob: React.FC<ImageWithBlobProps> = ({
  filePath,
  alt,
  width = "60px",
  height = "60px",
  borderRadius = "lg",
  border = "2px solid",
  borderColor = "green.300",
  bg = "green.50",
  type,
}) => {
  const assetBlob = useAssetImageBlob(type === "asset" ? filePath : undefined);
  const guestBlob = useGuestImageBlob(type === "guest" ? filePath : undefined);

  const { blobUrl, loading } = type === "asset" ? assetBlob : guestBlob;

  if (!filePath) {
    return null;
  }

  if (loading) {
    return (
      <Box
        w={width}
        h={height}
        borderRadius={borderRadius}
        overflow="hidden"
        border={border}
        borderColor={borderColor}
        bg={bg}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="sm" color="green.500" />
      </Box>
    );
  }

  if (!blobUrl) {
    return null;
  }

  return (
    <Box
      w={width}
      h={height}
      borderRadius={borderRadius}
      overflow="hidden"
      border={border}
      borderColor={borderColor}
      bg={bg}
      position="relative"
    >
      <Image
        src={blobUrl}
        alt={alt}
        fill
        style={{
          objectFit: "cover",
        }}
      />
    </Box>
  );
};

export default ImageWithBlob;
