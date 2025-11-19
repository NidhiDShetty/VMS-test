"use client";

import React from "react";
import { Box, VStack, Text, Flex, HStack, Badge } from "@chakra-ui/react";
import { RiCloseLine } from "react-icons/ri";
import { RiAddFill } from "react-icons/ri";
import AddAssetsModal from "@/components/modals/visitors/AddAssetsModal";
import { useDisclosure } from "@chakra-ui/react";
import SecondaryButton from "@/components/ui/SecondaryButton";
import ImageWithBlob from "@/components/ui/ImageWithBlob";
// PhotoCapture functionality moved to AddAssetsModal

const badgeColors = ["gray.100", "gray.100"];
const badgeTextColors = ["gray.800", "gray.800"];

type Asset = {
  assetName: string;
  serialNumber?: string;
  assetType?: string;
  imgUrl?: string;
  tempId?: string; // Temporary ID for tracking
  imageFile?: File | null; // Store the file for later upload
};

type TabOneProps = {
  assets: Asset[];
  onAssetsChange: (assets: Asset[]) => void;
  visitorId?: string | number;
};

const TabOne: React.FC<TabOneProps> = ({ assets, onAssetsChange }) => {
  const { open, onOpen, onClose } = useDisclosure();

  const handleAddAsset = (asset: {
    name: string;
    serial: string;
    type: string;
    image?: File | null;
    imagePath?: string | null;
  }) => {
    // Create a unique identifier for this asset
    const assetId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    onAssetsChange([
      ...assets,
      {
        assetName: asset.name,
        serialNumber: asset.serial,
        assetType: asset.type,
        imgUrl: asset.imagePath || undefined, // Use the uploaded file path
        // Add temporary ID for tracking
        tempId: assetId,
        imageFile: asset.image, // Store the file for later upload
      },
    ]);
  };

  const handleDelete = (index: number) => {
    onAssetsChange(assets.filter((_, i) => i !== index));
  };

  return (
    <Box w="full">
      {/* Mobile Layout */}
      <VStack
        align="stretch"
        w="full"
        gap={4}
        display={{ base: "flex", lg: "none" }}
      >
        <SecondaryButton onClick={onOpen} color="#000000" fontWeight="medium">
          <Box>
            <RiAddFill color="#5F24AC" />
          </Box>
          Add Asset
        </SecondaryButton>
        <AddAssetsModal
          isOpen={open}
          onClose={onClose}
          onSave={handleAddAsset}
        />
        <Box mt={2}>
          <VStack align="stretch" gap={4}>
            {assets.length === 0 ? (
              <Text color="gray.400" fontSize="sm" textAlign="center" py={6}>
                No assets added
              </Text>
            ) : (
              assets.map((item, idx) => (
                <Flex
                  key={item.assetName + item.serialNumber + idx}
                  align="center"
                  w="full"
                  minH="60px"
                  p={3}
                  border="1px solid"
                  borderColor="#dce0e3"
                  borderRadius="lg"
                  bg="white"
                  gap={3}
                >
                  {/* Asset Image */}
                  <Box flexShrink={0} w="40px" h="40px">
                    {item.imgUrl ? (
                      <ImageWithBlob
                        filePath={item.imgUrl}
                        alt={`${item.assetName} photo`}
                        type="asset"
                        width="40px"
                        height="40px"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                      />
                    ) : (
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="xs" fontWeight="bold" color="gray.600">
                          {item.assetName.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Asset Info */}
                  <Box flex={1} minW={0}>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="gray.900"
                      mb={1}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {item.assetName}
                    </Text>
                    <HStack gap={2} wrap="wrap">
                      <Badge
                        bg={badgeColors[0]}
                        color={badgeTextColors[0]}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {item.serialNumber}
                      </Badge>
                      <Badge
                        bg={badgeColors[1]}
                        color={badgeTextColors[1]}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {item.assetType}
                      </Badge>
                    </HStack>
                  </Box>

                  {/* Delete Button */}
                  <Box
                    as="button"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="red.500"
                    borderRadius="full"
                    p={1}
                    boxSize="20px"
                    _hover={{ bg: "red.600" }}
                    _active={{ bg: "red.700" }}
                    aria-label="Remove asset"
                    tabIndex={0}
                    onClick={() => handleDelete(idx)}
                    flexShrink={0}
                  >
                    <RiCloseLine size={12} color="white" />
                  </Box>
                </Flex>
              ))
            )}
          </VStack>
        </Box>
      </VStack>

      {/* Web Layout - With Pink Background */}
      <Box
        bg="#F0E6FF"
        p={4}
        borderRadius="8px"
        display={{ base: "none", lg: "block" }}
      >
        <VStack align="stretch" w="full" gap={4}>
          {/* Add Asset Button - White Background */}
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)">
            <SecondaryButton
              onClick={onOpen}
              color="#000000"
              fontWeight="medium"
            >
              <Box>
                <RiAddFill color="#5F24AC" />
              </Box>
              Add Asset
            </SecondaryButton>
          </Box>
          <AddAssetsModal
            isOpen={open}
            onClose={onClose}
            onSave={handleAddAsset}
          />

          {/* Asset List */}
          <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)" overflow="hidden">
            {assets.length === 0 ? (
              <Text color="gray.400" fontSize="sm" textAlign="center" py={6}>
                No assets added
              </Text>
            ) : (
              assets.map((item, idx) => (
                <Flex
                  key={item.assetName + item.serialNumber + idx}
                  align="center"
                  justify="space-between"
                  w="full"
                  p={3}
                  gap={3}
                >
                  {/* Asset Image/Initials - Left Side */}
                  <Box>
                    {item.imgUrl ? (
                      <ImageWithBlob
                        filePath={item.imgUrl}
                        alt={`${item.assetName} photo`}
                        type="asset"
                        width="40px"
                        height="40px"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.50"
                      />
                    ) : (
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        bg="gray.100"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="sm" fontWeight="bold" color="gray.600">
                          {item.assetName.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Asset Info - Center */}
                  <Box flex={1}>
                    <Text
                      fontWeight="medium"
                      fontSize="sm"
                      color="gray.900"
                      mb={1}
                    >
                      {item.assetName}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      #{item.serialNumber} {item.assetType}
                    </Text>
                  </Box>

                  {/* Delete Button - Right Side */}
                  <Box
                    as="button"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="red.500"
                    borderRadius="full"
                    p={1}
                    boxSize="20px"
                    _hover={{ bg: "red.600" }}
                    _active={{ bg: "red.700" }}
                    aria-label="Remove asset"
                    tabIndex={0}
                    onClick={() => handleDelete(idx)}
                    flexShrink={0}
                  >
                    <RiCloseLine size={12} color="white" />
                  </Box>
                </Flex>
              ))
            )}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
};

export default TabOne;
