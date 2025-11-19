"use client";

import React from "react";
import { Box, VStack, Text, Flex, HStack, Badge } from "@chakra-ui/react";
import { RiCloseLine } from "react-icons/ri";
import { RiAddFill } from "react-icons/ri";
import AddGuestModal from "@/components/modals/visitors/AddGuestModal";
import { useDisclosure } from "@chakra-ui/react";
import SecondaryButton from "@/components/ui/SecondaryButton";
import ImageWithBlob from "@/components/ui/ImageWithBlob";
// PhotoCapture functionality moved to AddGuestModal

const badgeColors = ["gray.100", "gray.100"];
const badgeTextColors = ["gray.800", "gray.800"];

type Guest = {
  guestName: string;
  imgUrl?: string;
  tempId?: string; // Temporary ID for tracking
  imageFile?: File | null; // Store the file for later upload
};

type TabTwoProps = {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  visitorId?: string | number;
};

const TabTwo: React.FC<TabTwoProps> = ({ guests, onGuestsChange }) => {
  const { open, onOpen, onClose } = useDisclosure();

  const handleAddGuest = (guest: {
    name: string;
    image?: File | null;
    imagePath?: string | null;
  }) => {
    // Create a unique identifier for this guest
    const guestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    onGuestsChange([
      ...guests,
      {
        guestName: guest.name,
        imgUrl: guest.imagePath || undefined, // Use the uploaded file path
        // Add temporary ID for tracking
        tempId: guestId,
        imageFile: guest.image, // Store the file for later upload
      },
    ]);
  };

  const handleDelete = (index: number) => {
    onGuestsChange(guests.filter((_, i) => i !== index));
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
          Add Guests
        </SecondaryButton>
        <AddGuestModal
          isOpen={open}
          onClose={onClose}
          onSave={handleAddGuest}
        />
        <Box mt={2}>
          <VStack align="stretch" gap={4}>
            {guests.length === 0 ? (
              <Text color="gray.400" fontSize="sm" textAlign="center" py={6}>
                No guests added
              </Text>
            ) : (
              guests.map((guest, idx) => (
                <Flex
                  key={guest.guestName + idx}
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
                  {/* Guest Image */}
                  <Box flexShrink={0} w="40px" h="40px">
                    {guest.imgUrl ? (
                      <ImageWithBlob
                        filePath={guest.imgUrl}
                        alt={`${guest.guestName} photo`}
                        type="guest"
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
                          {guest.guestName.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Guest Info */}
                  <Box flex={1} minW={0}>
                    <Text
                      fontWeight="semibold"
                      fontSize="sm"
                      color="#25292E"
                      mb={1}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {guest.guestName}
                    </Text>
                    <HStack gap={2}>
                      <Badge
                        bg={badgeColors[0]}
                        color={badgeTextColors[0]}
                        fontSize="xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        Guest
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
                    aria-label="Remove guest"
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
          {/* Add Guest Button - White Background */}
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)">
            <SecondaryButton
              onClick={onOpen}
              color="#000000"
              fontWeight="medium"
            >
              <Box>
                <RiAddFill color="#5F24AC" />
              </Box>
              Add Guests
            </SecondaryButton>
          </Box>
          <AddGuestModal
            isOpen={open}
            onClose={onClose}
            onSave={handleAddGuest}
          />

          {/* Guest List */}
          <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)" overflow="hidden">
            {guests.length === 0 ? (
              <Text color="gray.400" fontSize="sm" textAlign="center" py={6}>
                No guests added
              </Text>
            ) : (
              guests.map((guest, idx) => (
                <Flex
                  key={guest.guestName + idx}
                  align="center"
                  justify="space-between"
                  w="full"
                  p={3}
                  gap={3}
                >
                  {/* Guest Image/Initials - Left Side */}
                  <Box>
                    {guest.imgUrl ? (
                      <ImageWithBlob
                        filePath={guest.imgUrl}
                        alt={`${guest.guestName} photo`}
                        type="guest"
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
                          {guest.guestName.charAt(0).toUpperCase()}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Guest Info - Center */}
                  <Box flex={1}>
                    <Text
                      fontWeight="medium"
                      fontSize="sm"
                      color="gray.900"
                      mb={1}
                    >
                      {guest.guestName}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Guest
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
                    aria-label="Remove guest"
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

export default TabTwo;
