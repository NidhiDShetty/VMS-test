"use client";

import React, { useState } from "react";
import {
  Box,
  VStack,
  Text,
  Flex,
  Avatar,
  HStack,
  Badge,
  Image as ChakraImage,
  Input,
  Button,
} from "@chakra-ui/react";
import { RiAddFill } from "react-icons/ri";
import { RiCheckLine } from "react-icons/ri";
import { RiCloseLine } from "react-icons/ri";
import SearchBar from "@/components/ui/SearchBar";
import { VisitorFormData, Employee } from "@/app/api/visitor/routes";
import { FiUser } from "react-icons/fi";
import { useEffect, useState as useReactState } from "react";
import { getVisitorImage } from "@/app/api/visitor-image/routes";
import Logo from "@/components/svgs/logo";
import { getProfileData, ProfileResponse } from "@/app/api/profile/routes";

type StepTwoProps = {
  visitorFormData: VisitorFormData;
  onChange: (field: keyof VisitorFormData, value: unknown) => void;
  visitorsList: Employee[];
  loading: boolean;
  error: string | null;
  onSelectHost: (employee: Employee) => void;
  currentUserProfile?: ProfileResponse | null;
};

const badgeColors = ["gray.100", "gray.100", "gray.100"];
const badgeTextColors = ["gray.800", "gray.800", "gray.800"];

// Resolve auth-protected or relative image paths to a usable src
const HostAvatar: React.FC<{ src?: string | null; name?: string; size?: number; rounded?: "full" | "md" }> = ({ src, name, size = 40, rounded = "full" }) => {
  const [resolvedSrc, setResolvedSrc] = useReactState<string | null>(null);
  const [loading, setLoading] = useReactState(false);

  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (!src) {
        setResolvedSrc(null);
        return;
      }
      if (src.startsWith("data:")) {
        setResolvedSrc(src);
        return;
      }
      if (src.startsWith("http://") || src.startsWith("https://")) {
        setResolvedSrc(src);
        return;
      }
      setLoading(true);
      try {
        const result = await getVisitorImage(src);
        if (isMounted && result.success && result.data?.imageData) {
          setResolvedSrc(result.data.imageData);
        } else if (isMounted) {
          setResolvedSrc(null);
        }
      } catch (_e) {
        if (isMounted) setResolvedSrc(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <Avatar.Root
      boxSize={`${size}px`}
      borderRadius={rounded}
      overflow="hidden"
      border="1px solid #E2E8F0"
      bg="purple.100"
    >
      {resolvedSrc ? (
        <ChakraImage
          src={resolvedSrc}
          alt={name || "Host"}
          w="full"
          h="full"
          objectFit="cover"
        />
      ) : name && typeof name === "string" && name.length > 0 ? (
        <Avatar.Fallback
          fontSize="sm"
          bg="purple.100"
          color="purple.700"
          w="full"
          h="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={rounded}
          fontWeight="bold"
        >
          {name.charAt(0).toUpperCase()}
        </Avatar.Fallback>
      ) : (
        <Avatar.Fallback
          fontSize="sm"
          bg="purple.100"
          color="purple.700"
          w="full"
          h="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius={rounded}
        >
          <FiUser size={Math.max(16, Math.round(size * 0.4))} />
        </Avatar.Fallback>
      )}
    </Avatar.Root>
  );
};

const StepTwo: React.FC<StepTwoProps> = ({
  visitorFormData,
  visitorsList,
  loading,
  error,
  onSelectHost,
  currentUserProfile,
}) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    visitorFormData.hostDetails.userId || null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [manualHostName, setManualHostName] = useState<string>("");
  const [isManualHostMode, setIsManualHostMode] = useState<boolean>(false);

  // Initialize manual host mode if editing a visitor with manually entered host
  useEffect(() => {
    const hostDetails = visitorFormData.hostDetails;
    
    // Check if this is a manually entered host:
    // - Has a name
    // - Has empty or no phoneNumber
    // - Has empty or no email
    // - Name doesn't match the current security person (to avoid false positives)
    const isManualHost = 
      hostDetails?.name && 
      (!hostDetails.phoneNumber || hostDetails.phoneNumber.trim() === "") &&
      (!hostDetails.email || hostDetails.email.trim() === "") &&
      currentUserProfile &&
      hostDetails.name !== currentUserProfile.profile.name;
    
    if (isManualHost) {
      // Trigger manual host mode with the saved name
      setIsManualHostMode(true);
      setManualHostName(hostDetails.name);
      setSelectedEmployeeId(null);
    } else if (hostDetails?.userId && hostDetails?.phoneNumber && hostDetails.phoneNumber.trim() !== "") {
      // This is a host selected from the employee list (has userId and phone number)
      setSelectedEmployeeId(hostDetails.userId);
      setIsManualHostMode(false);
      setManualHostName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set security person as default host if no host is selected on initial load
  useEffect(() => {
    if (!visitorFormData.hostDetails.userId && currentUserProfile) {
      onSelectHost({
        userId: Number(currentUserProfile.userId),
        email: "",
        name: currentUserProfile.profile.name,
        phoneNumber: "",
        profileImageUrl: currentUserProfile.profile.profileImageUrl,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserProfile]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredVisitors = visitorsList.filter((emp: Employee) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      // (emp.name && emp.name.toLowerCase().includes(term))
      emp.name &&
      emp.name
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(term))
      //  ||
      // (emp.email && emp.email.toLowerCase().includes(term)) ||
      // (emp.phoneNumber && emp.phoneNumber.toLowerCase().includes(term))
    );
  });

  const handleEmployeeSelect = (emp: Employee) => {
    if (loading) return;

    if (selectedEmployeeId === emp.userId) {
      // Deselect if already selected - fall back to security person as default host
      setSelectedEmployeeId(null);
      setIsManualHostMode(false);
      setManualHostName("");
      // Set security person as default host when deselecting (without phone/email to avoid display)
      if (currentUserProfile) {
        onSelectHost({
          userId: Number(currentUserProfile.userId),
          email: "",
          name: currentUserProfile.profile.name,
          phoneNumber: "",
          profileImageUrl: currentUserProfile.profile.profileImageUrl,
        });
      } else {
        onSelectHost({
          userId: 0,
          email: "",
          name: "",
          phoneNumber: "",
          profileImageUrl: null,
        });
      }
    } else {
      // Select new employee
      setSelectedEmployeeId(emp.userId);
      setIsManualHostMode(false);
      setManualHostName("");
      onSelectHost(emp);
    }
  };

  const handleManualHostToggle = () => {
    if (isManualHostMode) {
      // Cancel manual host mode - fall back to security person as default host
      setIsManualHostMode(false);
      setManualHostName("");
      setSelectedEmployeeId(null);
      // Set security person as default host when canceling (without phone/email to avoid display)
      if (currentUserProfile) {
        onSelectHost({
          userId: Number(currentUserProfile.userId),
          email: "",
          name: currentUserProfile.profile.name,
          phoneNumber: "",
          profileImageUrl: currentUserProfile.profile.profileImageUrl,
        });
      } else {
        onSelectHost({
          userId: 0,
          email: "",
          name: "",
          phoneNumber: "",
          profileImageUrl: null,
        });
      }
    } else {
      // Enter manual host mode
      setIsManualHostMode(true);
      setSelectedEmployeeId(null);
      setManualHostName("");
    }
  };

  const handleManualHostSubmit = () => {
    if (manualHostName.trim()) {
      // Use manual host name without phone number and email (manually entered hosts should only show name)
      const hostData = {
        userId: currentUserProfile ? Number(currentUserProfile.userId) : 0,
        email: "",
        name: manualHostName.trim(),
        phoneNumber: "",
        profileImageUrl: null,
      };
      onSelectHost(hostData);
      
      // Hide the manual host input and tick button after successful submission
      setIsManualHostMode(false);
      setSelectedEmployeeId(null);
    }
  };

  return (
    <Box w="full" overflowY='auto'>
      {/* Mobile Layout */}
      <VStack
        align="stretch"
        w="full"
        gap={4}
        display={{ base: "flex", lg: "none" }}
      >
        {/* Search Bar */}
        <Box w="full">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            size="md"
          />
        </Box>

        {/* Optional Host Input Section */}
        <Box mt={2}>
          <Flex align="center" justify="space-between" mb={3}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.800">
              Host Selection (Optional)
            </Text>
            <Button
              size="sm"
              variant={isManualHostMode ? "solid" : "outline"}
              colorScheme="purple"
              onClick={handleManualHostToggle}
              aria-label={isManualHostMode ? "Cancel manual host entry" : "Enter manual host name"}
              bg={isManualHostMode ? "#8A38F5" : "transparent"}
              color={isManualHostMode ? "white" : "#8A38F5"}
              borderColor="#8A38F5"
              _hover={{ bg: isManualHostMode ? "#7a2ed6" : "#f4edfefa" }}
            >
              {isManualHostMode ? (
                <>
                  <RiCloseLine size={14} />
                  <Text ml={1} fontSize="xs">Cancel</Text>
                </>
              ) : (
                <>
                  <RiAddFill size={14} />
                  <Text ml={1} fontSize="xs">Manual</Text>
                </>
              )}
            </Button>
          </Flex>

          {/* Show current manual host when not in edit mode but has manually entered host */}
          {!isManualHostMode && visitorFormData.hostDetails?.name && 
           (!visitorFormData.hostDetails.phoneNumber || visitorFormData.hostDetails.phoneNumber.trim() === "") &&
           currentUserProfile && visitorFormData.hostDetails.name !== currentUserProfile.profile.name && (
            <Box mb={3} p={2} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
              <Flex align="center" justify="space-between">
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={0.5}>
                    Manual Host:
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="purple.700">
                    {visitorFormData.hostDetails.name}
                  </Text>
                </Box>
              </Flex>
            </Box>
          )}

          {isManualHostMode && (
            <Box mb={4} p={3} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
              <Text fontSize="xs" color="gray.600" mb={2}>
                Enter host name manually (Security person will be assigned as actual host)
              </Text>
              <Flex gap={2}>
                <Input
                  placeholder="Enter host name..."
                  value={manualHostName}
                  onChange={(e) => setManualHostName(e.target.value)}
                  size="sm"
                  borderRadius="md"
                  autoFocus={isManualHostMode}
                />
                <Button
                  size="sm"
                  colorScheme="purple"
                  onClick={handleManualHostSubmit}
                  disabled={!manualHostName.trim()}
                  aria-label="Submit manual host name"
                  bg="#8A38F5"
                  color="white"
                  _hover={{ bg: "#7a2ed6" }}
                  _disabled={{ bg: "#d1d5db", cursor: "not-allowed" }}
                >
                  <RiCheckLine size={14} />
                </Button>
              </Flex>
            </Box>
          )}
        </Box>

        {/* Employee List Section */}
        <Box mt={2}>
          <Text fontWeight="semibold" fontSize="sm" color="gray.800" mb={2}>
            Employee List
          </Text>
          <VStack align="stretch" gap={4}>
            {filteredVisitors.map((emp: Employee) => {
              const isSelected = selectedEmployeeId === emp.userId;
              return (
                <Flex
                  key={emp.userId || emp.name}
                  align="center"
                  justify="space-between"
                  w="full"
                  minH="48px"
                >
                  <HStack gap={2} align="center">
                    <HostAvatar src={emp.profileImageUrl} name={emp.name} size={36} rounded="full" />
                    <Box>
                      <Text fontWeight="medium" fontSize="sm" color="gray.900">
                        {emp.name}
                      </Text>
                      <HStack gap={1} mt={0.5}>
                        <Badge
                          bg={badgeColors[0]}
                          color={badgeTextColors[0]}
                          borderRadius="full"
                          px={2}
                          py={0}
                          fontSize="xs"
                          fontWeight="semibold"
                          lineHeight="1.2"
                        >
                          #{emp.userId}
                        </Badge>
                      </HStack>
                    </Box>
                  </HStack>
                  <Box
                    as="button"
                    aria-label={isSelected ? "Deselect Host" : "Select as Host"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg={isSelected ? "green.500" : "purple.500"}
                    borderRadius="full"
                    p={1}
                    boxSize="20px"
                    _hover={{ bg: isSelected ? "green.600" : "purple.600" }}
                    _active={{ bg: isSelected ? "green.700" : "purple.700" }}
                    tabIndex={0}
                    onClick={() => handleEmployeeSelect(emp)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEmployeeSelect(emp);
                      }
                    }}
                  >
                    {isSelected ? (
                      <RiCheckLine color="white" size={12} />
                    ) : (
                      <RiAddFill color="white" size={12} />
                    )}
                  </Box>
                </Flex>
              );
            })}
          </VStack>
        </Box>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>

      {/* Web Layout - Full Width Search + Single Card */}
      <Box
        // position="relative"
        bg="#F0E6FF"
        display={{ base: "none", lg: "block" }}
        // minH="100vh"
      >
        {/* Background Logo */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.15}
          zIndex={1}
        >
          <Box transform="scale(4.5)">
            <Logo />
          </Box>
        </Box>

        {/* Form Content */}
        <Box
          position="relative"
          zIndex={2}
          p={8}
        >
          <VStack align="stretch" gap={6} w="full">
            {/* Fixed Search Section */}
            <Box flexShrink={0}>
              {/* <Text fontWeight="semibold" fontSize="lg" color="gray.800" mb={4}>
                Who are visiting today?
              </Text> */}
              <Box w="full">
                <SearchBar
                  value={searchTerm}
                  onChange={handleSearchChange}
                  size="lg"
                />
              </Box>
            </Box>

            {/* Optional Host Input Section */}
            <Box
              bg="white"
              borderRadius="lg"
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              border="1px solid"
              borderColor="#dce0e3"
              p={6}
              flexShrink={0}
            >
              <Flex align="center" justify="space-between" mb={4}>
                <Text fontWeight="semibold" fontSize="lg" color="gray.800">
                  Host Selection (Optional)
                </Text>
                <Button
                  size="md"
                  variant={isManualHostMode ? "solid" : "outline"}
                  colorScheme="purple"
                  onClick={handleManualHostToggle}
                  aria-label={isManualHostMode ? "Cancel manual host entry" : "Enter manual host name"}
                  bg={isManualHostMode ? "#8A38F5" : "transparent"}
                  color={isManualHostMode ? "white" : "#8A38F5"}
                  borderColor="#8A38F5"
                  _hover={{ bg: isManualHostMode ? "#7a2ed6" : "#f4edfefa" }}
                >
                  {isManualHostMode ? (
                    <>
                      <RiCloseLine size={16} />
                      <Text ml={2}>Cancel</Text>
                    </>
                  ) : (
                    <>
                      <RiAddFill size={16} />
                      <Text ml={2}>Manual Entry</Text>
                    </>
                  )}
                </Button>
              </Flex>

              {/* Show current manual host when not in edit mode but has manually entered host */}
              {!isManualHostMode && visitorFormData.hostDetails?.name && 
               (!visitorFormData.hostDetails.phoneNumber || visitorFormData.hostDetails.phoneNumber.trim() === "") &&
               currentUserProfile && visitorFormData.hostDetails.name !== currentUserProfile.profile.name && (
                <Box mb={3} p={3} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Manual Host:
                      </Text>
                      <Text fontSize="md" fontWeight="semibold" color="purple.700">
                        {visitorFormData.hostDetails.name}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}

              {isManualHostMode && (
                <Box p={4} bg="purple.50" borderRadius="md" border="1px solid" borderColor="purple.200">
                  <Text fontSize="sm" color="gray.600" mb={3}>
                    Enter host name manually (Security person will be assigned as actual host)
                  </Text>
                  <Flex gap={3}>
                    <Input
                      placeholder="Enter host name..."
                      value={manualHostName}
                      onChange={(e) => setManualHostName(e.target.value)}
                      size="md"
                      borderRadius="md"
                      flex={1}
                      autoFocus={isManualHostMode}
                    />
                    <Button
                      size="md"
                      colorScheme="purple"
                      onClick={handleManualHostSubmit}
                      disabled={!manualHostName.trim()}
                      aria-label="Submit manual host name"
                      bg="#8A38F5"
                      color="white"
                      _hover={{ bg: "#7a2ed6" }}
                      _disabled={{ bg: "#d1d5db", cursor: "not-allowed" }}
                    >
                      <RiCheckLine size={16} />
                    </Button>
                  </Flex>
                </Box>
              )}
            </Box>

            {/* Scrollable Employee List Card */}
            <Box
              bg="white"
              borderRadius="lg"
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              border="1px solid"
              borderColor="#dce0e3"
              flex={1}
              overflow="hidden"
              display="flex"
              flexDirection="column"
            >
              <Text
                fontWeight="semibold"
                fontSize="lg"
                color="gray.800"
                p={6}
                pb={4}
                flexShrink={0}
              >
                Employee List
              </Text>
              <Box flex={1} overflowY="scroll" overflowX="hidden">
                <VStack align="stretch" gap={0}>
                  {filteredVisitors.map((emp: Employee, index) => {
                    const isSelected = selectedEmployeeId === emp.userId;
                    return (
                      <Flex
                        key={emp.userId || emp.name}
                        align="center"
                        justify="space-between"
                        w="full"
                        p={3}
                        gap={3}
                        borderBottom={
                          index < filteredVisitors.length - 1
                            ? "1px solid"
                            : "none"
                        }
                        borderBottomColor="gray.200"
                        _hover={{ bg: "purple.50" }}
                        transition="all 0.2s"
                      >
                        <HStack gap={3} align="center">
                          <HostAvatar src={emp.profileImageUrl} name={emp.name} size={40} rounded="md" />
                          <Box flex={1}>
                            <Text
                              fontWeight="medium"
                              fontSize="sm"
                              color="gray.900"
                              mb={1}
                            >
                              {emp.name}
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              #{emp.userId}
                            </Text>
                          </Box>
                        </HStack>
                        <Box
                          as="button"
                          aria-label={
                            isSelected ? "Deselect Host" : "Select as Host"
                          }
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bg={isSelected ? "green.500" : "purple.500"}
                          borderRadius="full"
                          p={1}
                          boxSize="20px"
                          _hover={{
                            bg: isSelected ? "green.600" : "purple.600",
                          }}
                          _active={{
                            bg: isSelected ? "green.700" : "purple.700",
                          }}
                          tabIndex={0}
                          onClick={() => handleEmployeeSelect(emp)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleEmployeeSelect(emp);
                            }
                          }}
                          transition="all 0.2s"
                          flexShrink={0}
                        >
                          {isSelected ? (
                            <RiCheckLine color="white" size={12} />
                          ) : (
                            <RiAddFill color="white" size={12} />
                          )}
                        </Box>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
            </Box>
          </VStack>
          {/* <Box h={16} /> */}
        </Box>
      </Box>
    </Box>
  );
};

export default StepTwo;
