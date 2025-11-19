"use client";

import React, { useEffect, useState, useRef } from "react";
import { Box, Flex, Text, IconButton } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import SecondaryButton from "@/components/ui/SecondaryButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Image from "next/image";
import { createVisitor, getVisitors, VisitorFormData } from "@/app/api/visitor/routes";
import { toaster } from "@/components/ui/toaster";
import { useHostVisitor } from "../HostVisitorContext";

import DesktopHeader from "@/components/DesktopHeader";
import { IoIosArrowBack } from "react-icons/io";
// Type for visitor data
interface VisitorData {
  fullName: string;
  countryCode: string;
  phone: string;
  gender?: string;
  date: string;
  time: string;
  purpose: string;
  comingFrom?: string;
  companyName?: string;
  location?: string;
  avatarUrl?: string;
  hostDetails?: {
    userId: number;
    email: string;
    name: string;
    phoneNumber: string;
    profileImageUrl: string | null;
  };
}

// WebHeader component removed - using DesktopHeader instead

const PreviewVisitorPage: React.FC = () => {
  const { hostVisitorData, setHostVisitorData, visitorId, setVisitorId } = useHostVisitor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedVisitorData, setFetchedVisitorData] = useState<VisitorData | null>(null);

  // Derive hasInvited from visitorId - if visitorId exists, invitation was sent
  const hasInvited = !!visitorId;

  // Use ref to track current visitor
  const currentVisitorRef = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get visitor ID from URL parameters or context
  const visitorIdFromUrl = searchParams.get('visitorId');
  const effectiveVisitorId = visitorIdFromUrl || visitorId;

  // Fetch visitor data from API when visitor ID is available
  useEffect(() => {
    const fetchVisitorData = async () => {
      if (!effectiveVisitorId) return;

      try {
        setLoading(true);
        const authDataRaw = localStorage.getItem("authData");
        if (!authDataRaw) return;

        const authData = JSON.parse(authDataRaw);
        const token = authData?.token;
        if (!token) return;

        const response = await getVisitors(token);
        const visitor = response.visitors.find(
          (v: { id: string | number }) => String(v.id) === String(effectiveVisitorId)
        );

        if (visitor) {
          // Convert API visitor format to VisitorData format
          setFetchedVisitorData({
            fullName: visitor.fullName,
            countryCode: "",
            phone: visitor.phoneNumber,
            gender: visitor.gender || "",
            date: visitor.date || "",
            time: visitor.time || "",
            purpose: visitor.purposeOfVisit || "",
            comingFrom: visitor.comingFrom || "",
            companyName: visitor.companyName || "",
            location: visitor.location || "",
            avatarUrl: visitor.imgUrl || "",
            hostDetails: typeof visitor.hostDetails === 'string'
              ? JSON.parse(visitor.hostDetails)
              : visitor.hostDetails
          });

          // Update context with visitor ID if it's from URL
          if (visitorIdFromUrl && !visitorId) {
            setVisitorId(visitorIdFromUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching visitor data:", error);
        setError("Failed to fetch visitor data");
      } finally {
        setLoading(false);
      }
    };

    fetchVisitorData();
  }, [effectiveVisitorId, visitorIdFromUrl, visitorId, setVisitorId]);

  // Reset invitation state when new visitor data is loaded
  useEffect(() => {
    if (hostVisitorData) {
      // Create a unique identifier for this visitor based on their data
      const visitorKey = `${hostVisitorData.fullName}-${hostVisitorData.phone}-${hostVisitorData.date}-${hostVisitorData.time}`;

      // Only reset invitation state if this is a new visitor
      if (currentVisitorRef.current !== visitorKey) {
        setVisitorId(null);
        currentVisitorRef.current = visitorKey;
      }
    }
  }, [hostVisitorData, setVisitorId]);

  // Use fetched data if available (after invitation), otherwise use context data (before invitation)
  const visitor: VisitorData | null = fetchedVisitorData || (hostVisitorData
    ? {
      fullName: hostVisitorData.fullName,
      countryCode: "",
      phone: hostVisitorData.phone,
      gender: hostVisitorData.gender,
      date: hostVisitorData.date,
      time: hostVisitorData.time,
      purpose: hostVisitorData.purpose,
      comingFrom: hostVisitorData.comingFrom,
      companyName: hostVisitorData.companyName,
      location: hostVisitorData.location,
      avatarUrl: "",
      hostDetails: hostVisitorData.hostDetails,
    }
    : null);

  // Clear context when navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Only clear on page unload, not on navigation
      setHostVisitorData(null);
      setVisitorId(null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [setHostVisitorData, setVisitorId]);

  // Handle navigation state - preserve data when returning from other pages
  useEffect(() => {
    // Check if we're returning from another page and preserve data
    const handlePopState = () => {
      // Don't clear data on navigation, only on explicit actions
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Robust date and time formatter that handles all possible formats
  const formatDateTime = (date: string, time: string): string => {
    if (!date || !time) return "-";

    try {
      let parsedDate: Date;
      let parsedTime: string;

      // Handle different date formats
      if (date.includes("T") && date.includes("Z")) {
        // ISO format like "2025-01-29T00:00:00.000Z"
        parsedDate = new Date(date);
      } else if (date.includes("-")) {
        // YYYY-MM-DD format
        parsedDate = new Date(date);
      } else if (date.includes("/")) {
        // DD/MM/YYYY or MM/DD/YYYY format
        const parts = date.split("/");
        if (parts.length === 3) {
          // Assume DD/MM/YYYY format
          parsedDate = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`);
        } else {
          parsedDate = new Date(date);
        }
      } else {
        parsedDate = new Date(date);
      }

      // Handle different time formats
      if (time.includes(":")) {
        parsedTime = time;
      } else {
        // If time is not in HH:MM format, try to parse it
        parsedTime = time;
      }

      // Validate parsed date
      if (isNaN(parsedDate.getTime())) {
        return "-";
      }

      // Format date as DD/MM/YYYY
      const day = parsedDate.getDate().toString().padStart(2, "0");
      const month = (parsedDate.getMonth() + 1).toString().padStart(2, "0");
      const year = parsedDate.getFullYear();

      // Parse and format time
      const [hours, minutes] = parsedTime.split(":");
      if (!hours || !minutes) return "-";

      let hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "pm" : "am";
      hour = hour % 12 || 12;

      return `${day}/${month}/${year} ${hour}:${minutes}${ampm}`;
    } catch (error) {
      console.error("Error formatting date/time:", error);
      return "-";
    }
  };

  const handleCancel = () => {
    // Clear context data
    setHostVisitorData(null);
    setVisitorId(null);
    router.push("/dashboard");
  };

  const handleGoBack = () => {
    // Clear context data
    setHostVisitorData(null);
    setVisitorId(null);
    router.push("/dashboard");
  };

  const handleBackButton = () => {
    // Header back button - go back to host visitor form if no invitation made yet
    if (!hasInvited) {
      router.push("/host-visitor");
    } else {
      // If already invited, go to dashboard
      router.push("/dashboard");
    }
  };

  const handleInvite = async () => {
    if (!visitor) {
      console.error("[HostVisitorPreview] No visitor data found");
      setError("No visitor data found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const authDataRaw = localStorage.getItem("authData");

      if (!authDataRaw) {
        console.error("[HostVisitorPreview] No auth data found");
        setError("No auth data found");
        return;
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData?.token;

      if (!token) {
        console.error("[HostVisitorPreview] No token found in auth data");
        setError("No token found");
        return;
      }

      // Get host details from localStorage
      const hostDetails = visitor.hostDetails || {
        userId: 0,
        email: "",
        name: "",
        phoneNumber: "",
        profileImageUrl: null,
      };

      // Prepare visitor data in the same format as visitor/add
      const visitorData: VisitorFormData = {
        fullName: visitor.fullName,
        phoneNumber: visitor.phone,
        gender: visitor.gender || "",
        idType: "",
        idNumber: "",
        date: visitor.date,
        time: visitor.time,
        comingFrom: visitor.comingFrom || "company",
        companyName:
          visitor.comingFrom === "company" ? visitor.companyName || "" : "",
        location:
          visitor.comingFrom === "location" ? visitor.location || null : null,
        purposeOfVisit: visitor.purpose,
        imgUrl: "",
        status: "APPROVED", // Set to APPROVED for Host role
        hostDetails: hostDetails,
        assets: [],
        guest: [],
      };

      // Create visitor using the same API
      const result = await createVisitor(visitorData, token);

      // Store visitor ID from response
      if (result.visitor && result.visitor.id) {
        setVisitorId(result.visitor.id);
      }

      // Show success toast
      toaster.success({
        title: "Invited successfully",
        description: `Visitor ${visitor.fullName} has been invited successfully. SMS notification sent!`,
        duration: 5000,
      });

      // Set hasInvited to true to change button text
      // hasInvited will be automatically true since visitorId is set

      // Don't clear context data yet - keep it for sharing

      // Stay on the same page (no navigation)
    } catch (err: unknown) {
      console.error("[HostVisitorPreview] Error creating visitor:", err);
      if (err instanceof Error) {
        console.error("[HostVisitorPreview] Error message:", err.message);
        setError(err.message);
      } else {
        console.error("[HostVisitorPreview] Unknown error type:", typeof err);
        setError("Failed to create visitor");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!visitor) {
    return (
      <Flex
        className="min-h-screen bg-white"
        align="center"
        justify="center"
        direction="column"
      >
        <Text fontSize="lg" mb={4}>
          No visitor data found.
        </Text>
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg={{ base: "#f8fafc", md: "#f7f2fd" }} className="w-full">
      {/* Responsive Header */}
      <Box display={{ base: "block", lg: "none" }}>
        {/* Mobile Header */}
        <Flex
          as="header"
          align="center"
          justify="center"
          w="full"
          h="70px"
          bg="#f4edfefa"
          borderBottom="1px solid #f2f2f2"
          position="relative"
          px={0}
          display={{ base: "flex", md: "none" }}
        >
          <Box
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            as="button"
            tabIndex={0}
            aria-label="Go back"
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="24px"
            h="24px"
            borderRadius="full"
            bg="transparent"
            _hover={{ bg: 'gray.100' }}
            p={0}
            cursor="pointer"
            onClick={handleBackButton}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBackButton();
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">Visitor Details</Text>
        </Flex>
      </Box>
      <Box display={{ base: "none", lg: "block" }}>
        <DesktopHeader notificationCount={3} />
      </Box>

      {/* Main Content Area */}
      <Box
        flex={1}
        pt={{ base: "0px", lg: "0px" }}
        display="flex"
        flexDirection="column"
      >
        {/* Web Page Title */}
        <Box
          display={{ base: "none", lg: "block" }}
          bg="#f4edfefa"
          px={6}
          py={1}
        >
          <Flex align="center" gap={3}>
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={handleBackButton}
              color="#8A37F7"
              _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
            >
              <FiChevronLeft />
            </IconButton>
            <Text fontSize="lg" fontWeight="bold" color="#18181b">
              Visitor Details
            </Text>
          </Flex>
        </Box>

        {/* Content */}
        <Box px={6} py={6}>
          {/* Mobile Layout - Original Design */}
          <Box display={{ base: "block", md: "none" }}>
            <Text
              fontWeight="bold"
              color="#381A63"
              fontSize="sm"
              mt={3}
              mb={2}
              ml={7}
            >
              Visitor&apos;s Info
            </Text>

            <Box
              w="full"
              maxW="90%"
              mx="auto"
              bg="#f3edfd"
              borderRadius="lg"
              px={3}
              pt={6}
              pb={2}
              position="relative"
              mt="30px"
            >
              {/* Avatar */}
              <Box
                position="absolute"
                top="-28px"
                left="50%"
                transform="translateX(-50%)"
                w="56px"
                h="56px"
                borderRadius="full"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="white"
                boxShadow="md"
              >
                {visitor.avatarUrl ? (
                  <Image
                    src={visitor.avatarUrl}
                    alt={visitor.fullName || "Visitor"}
                    width={56}
                    height={56}
                  />
                ) : (
                  <Box
                    w="56px"
                    h="56px"
                    borderRadius="full"
                    bg="purple.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="purple.700"
                    fontSize="lg"
                    fontWeight="bold"
                  >
                    {visitor.fullName
                      ? visitor.fullName.charAt(0).toUpperCase()
                      : "V"}
                  </Box>
                )}
              </Box>

              <Box mt={7}>
                <Box
                  as="dl"
                  display="grid"
                  gridTemplateColumns="minmax(120px,auto) 1fr"
                  rowGap={2}
                  columnGap={1}
                >
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#18181b"
                    fontSize="xs"
                    textAlign="left"
                    whiteSpace="nowrap"
                  >
                    Visitor&apos;s Name:
                  </Text>
                  <Text as="dd" color="#18181b" fontSize="xs" textAlign="right">
                    {visitor.fullName}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#18181b"
                    fontSize="xs"
                    textAlign="left"
                  >
                    Phone No:
                  </Text>
                  <Text as="dd" color="#18181b" fontSize="xs" textAlign="right">
                    {visitor.phone}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#18181b"
                    fontSize="xs"
                    textAlign="left"
                  >
                    Gender:
                  </Text>
                  <Text as="dd" color="#18181b" fontSize="xs" textAlign="right">
                    {visitor.gender || "-"}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#18181b"
                    fontSize="xs"
                    textAlign="left"
                  >
                    Date and Time:
                  </Text>
                  <Text as="dd" color="#18181b" fontSize="xs" textAlign="right">
                    {formatDateTime(visitor.date, visitor.time)}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="xs"
                    textAlign="left"
                  >
                    Purpose of Visit:
                  </Text>
                  <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
                    {visitor.purpose}
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Web Layout - Preview Card */}
          <Box px={{ base: 2, md: 6 }} position="relative" zIndex={1} display={{ base: "none", md: "block" }}>
            <Box
              bg="white"
              borderRadius="12px"
              px={6}
              py={6}
              mt={8}
              w="75%"
              mx="auto"
              boxShadow="sm"
            >

              {/* Web Layout - Horizontal Card Format */}
              <Flex
                align="center"
                justify="space-between"
                w="full"
                px={8}
                py={6}
                display={{ base: "none", md: "flex" }}
              >
                {/* Visitor Icon */}
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="#F4EDFE"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  overflow="hidden"
                >
                  {visitor.avatarUrl ? (
                    <Image
                      src={visitor.avatarUrl}
                      alt={visitor.fullName || "Visitor"}
                      width={60}
                      height={60}
                    />
                  ) : (
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="#8A37F7"
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="bold"
                      fontSize="lg"
                    >
                      {visitor.fullName?.charAt(0)?.toUpperCase() || "?"}
                    </Box>
                  )}
                </Box>

                {/* Full Name */}
                <Flex direction="column" gap={1} flex="1" maxW="200px">
                  <Text
                    fontWeight="normal"
                    color="#666"
                    fontSize="sm"
                  >
                    Full Name:
                  </Text>
                  <Text color="#18181b" fontSize="sm" fontWeight="bold">
                    {visitor.fullName}
                  </Text>
                </Flex>

                {/* Separator */}
                <Box w="1px" h="40px" bg="#E2E8F0" />

                {/* Phone No */}
                <Flex direction="column" gap={1} flex="1" maxW="200px">
                  <Text
                    fontWeight="normal"
                    color="#666"
                    fontSize="sm"
                  >
                    Phone No:
                  </Text>
                  <Text color="#18181b" fontSize="sm" fontWeight="bold">
                    {visitor.phone}
                  </Text>
                </Flex>

                {/* Separator */}
                <Box w="1px" h="40px" bg="#E2E8F0" />

                {/* Gender */}
                <Flex direction="column" gap={1} flex="1" maxW="150px">
                  <Text
                    fontWeight="normal"
                    color="#666"
                    fontSize="sm"
                  >
                    Gender:
                  </Text>
                  <Text color="#18181b" fontSize="sm" fontWeight="bold">
                    {visitor.gender || "-"}
                  </Text>
                </Flex>

                {/* Separator */}
                <Box w="1px" h="40px" bg="#E2E8F0" />

                {/* Date and Time */}
                <Flex direction="column" gap={1} flex="1" maxW="200px">
                  <Text
                    fontWeight="normal"
                    color="#666"
                    fontSize="sm"
                  >
                    Date & Time:
                  </Text>
                  <Text color="#18181b" fontSize="sm" fontWeight="bold">
                    {formatDateTime(visitor.date, visitor.time)}
                  </Text>
                </Flex>

                {/* Separator */}
                <Box w="1px" h="40px" bg="#E2E8F0" />

                {/* Purpose */}
                <Flex direction="column" gap={1} flex="1" maxW="200px">
                  <Text
                    fontWeight="normal"
                    color="#666"
                    fontSize="sm"
                  >
                    Purpose:
                  </Text>
                  <Text color="#18181b" fontSize="sm" fontWeight="bold">
                    {visitor.purpose}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          </Box>

          {/* Error Display */}
          {error && (
            <Box px={6} pb={2}>
              <Text color="red.500" fontSize="sm" textAlign="center">
                {error}
              </Text>
            </Box>
          )}

          {/* Mobile Share Button */}
          <Box px={6} pb={3} mt={4} display={{ base: "block", md: "none" }}>
            <PrimaryButton
              width="100%"
              fontSize="sm"
              onClick={() => {
                if (visitorId) {
                  // Get auth token
                  const authDataRaw = localStorage.getItem("authData");
                  if (authDataRaw) {
                    const authData = JSON.parse(authDataRaw);
                    const token = authData?.token;
                    if (token) {
                      // Don't clear context data - preserve it for when user returns
                      router.push(`/visitor-qr?id=${visitorId}`);
                    } else {
                      setError("No auth token found");
                    }
                  } else {
                    setError("No auth data found");
                  }
                } else {
                  setError("Please invite the visitor first to share QR code");
                }
              }}
              disabled={!visitorId}
            >
              Share
            </PrimaryButton>
          </Box>

          {/* Mobile Footer Actions */}
          <Flex w="full" justify="center" px={6} pb={3} mt={3} gap={3} display={{ base: "flex", md: "none" }}>
            <Box flex={1}>
              <SecondaryButton
                variant="outline"
                width="100%"
                onClick={hasInvited ? handleGoBack : handleCancel}
                fontSize="sm"
                disabled={loading}
              >
                {hasInvited ? "Go Back" : "Cancel"}
              </SecondaryButton>
            </Box>
            <Box flex={1}>
              <PrimaryButton
                width="100%"
                fontSize="sm"
                onClick={handleInvite}
                disabled={loading}
              >
                {loading ? "Inviting..." : hasInvited ? "Reinvite" : "Invite"}
              </PrimaryButton>
            </Box>
          </Flex>

          {/* Web Share Button */}
          <Box px={6} pb={3} mt={4} display={{ base: "none", md: "block" }}>
            <Flex justify="center" maxW="1200px" mx="auto">
              <PrimaryButton
                width="200px"
                fontSize="md"
                onClick={() => {
                  if (visitorId) {
                    // Get auth token
                    const authDataRaw = localStorage.getItem("authData");
                    if (authDataRaw) {
                      const authData = JSON.parse(authDataRaw);
                      const token = authData?.token;
                      if (token) {
                        // Don't clear context data - preserve it for when user returns
                        router.push(`/visitor-qr?id=${visitorId}&source=host`);
                      } else {
                        setError("No auth token found");
                      }
                    } else {
                      setError("No auth data found");
                    }
                  } else {
                    setError("Please invite the visitor first to share QR code");
                  }
                }}
                disabled={!visitorId}
              >
                Share QR Code
              </PrimaryButton>
            </Flex>
          </Box>

          {/* Web Footer Actions */}
          <Flex w="full" justify="center" px={6} pb={6} mt={6} gap={4} display={{ base: "none", md: "flex" }}>
            <SecondaryButton
              variant="outline"
              width="200px"
              onClick={hasInvited ? handleGoBack : handleCancel}
              fontSize="md"
              disabled={loading}
            >
              {hasInvited ? "Go Back" : "Cancel"}
            </SecondaryButton>
            <PrimaryButton
              width="200px"
              fontSize="md"
              onClick={handleInvite}
              disabled={loading}
            >
              {loading ? "Inviting..." : hasInvited ? "Reinvite" : "Invite"}
            </PrimaryButton>
          </Flex>


        </Box>
      </Box>
    </Flex>
  );
};

export default PreviewVisitorPage;

