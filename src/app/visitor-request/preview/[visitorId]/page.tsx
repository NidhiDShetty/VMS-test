"use client";
import { useParams, useRouter } from "next/navigation";
import { Box, Flex, Text, Button, Spinner, IconButton, Avatar, Heading } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import React, { useState, useEffect, useCallback } from "react";
import { getVisitorsByHost, updateVisitor } from "@/app/api/visitor";
import { toaster } from "@/components/ui/toaster";
import RejectReasonModal from "@/components/modals/visitors/RejectReasonModal";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";
import Image from "next/image";
import { getVisitorImageBlob } from "@/app/api/visitor-image/routes";

// Types for visitor data
interface Visitor {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  date?: string;
  time?: string;
  comingFrom: string;
  companyName?: string;
  location?: string;
  purposeOfVisit?: string;
  imgUrl?: string;
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  rejectionReason?: string;
  hostDetails?: string;
  assets?: string;
  guest?: string;
  visitorAddedBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  message: string;
  visitors: Visitor[];
  totalCount: number;
}

const VisitorPreviewPage: React.FC = () => {
  const router = useRouter();
  const { visitorId } = useParams<{ visitorId: string }>();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);

  // Fetch visitor data
  const fetchVisitor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const authDataRaw = localStorage.getItem("authData");
      if (!authDataRaw) {
        throw new Error("No authentication data found");
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData.token;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: ApiResponse = await getVisitorsByHost(token);
      const foundVisitor = response.visitors.find((v) => v.id === visitorId);

      if (!foundVisitor) {
        throw new Error("Visitor not found");
      }
      setVisitor(foundVisitor);
    } catch (err) {
      console.error("Error fetching visitor:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch visitor");
    } finally {
      setLoading(false);
    }
  }, [visitorId]);

  // Handle visitor approval
  const handleApprove = async () => {
    if (!visitor?.id) {
      toaster.create({
        title: "Error",
        description: "Visitor ID not found",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const authDataRaw = localStorage.getItem("authData");
      if (!authDataRaw) {
        throw new Error("No authentication data found");
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData.token;

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Update visitor status to approved
      await updateVisitor(visitor.id, { status: "APPROVED" }, token);

      // Show success toast
      toaster.create({
        title: "Success",
        description: "Visitor approved successfully",
        type: "success",
      });

      router.back();
    } catch (error) {
      console.error("Error approving visitor:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to approve visitor";
      setError(errorMessage);

      // Show error toast
      toaster.create({
        title: "Error",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle visitor rejection - show modal first
  const handleReject = () => {
    setShowRejectModal(true);
  };

  // Handle rejection with reason
  const handleRejectWithReason = async (reason: string) => {
    if (!visitor?.id) {
      toaster.create({
        title: "Error",
        description: "Visitor ID not found",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const authDataRaw = localStorage.getItem("authData");
      if (!authDataRaw) {
        throw new Error("No authentication data found");
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData.token;

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Update visitor status to rejected with rejection reason
      await updateVisitor(
        visitor.id,
        {
          status: "REJECTED",
          rejectionReason: reason,
        },
        token
      );

      // Show success toast
      toaster.create({
        title: "Success",
        description: "Visitor rejected successfully",
        type: "success",
      });

      setShowRejectModal(false);
      router.back();
    } catch (error) {
      console.error("Error rejecting visitor:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reject visitor";
      setError(errorMessage);

      // Show error toast
      toaster.create({
        title: "Error",
        description: errorMessage,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if visitor status is pending
  const isPendingStatus = () => {
    const isPending =
      visitor?.status === "PENDING" || visitor?.status === "pending";
    return isPending;
  };

  // Fetch data on component mount
  useEffect(() => {
    if (visitorId) {
      fetchVisitor();
    }
  }, [visitorId, fetchVisitor]);

  // Resolve visitor image URL when visitor data changes
  useEffect(() => {
    const resolveVisitorImage = async () => {
      if (!visitor?.imgUrl) {
        setResolvedImageUrl(null);
        return;
      }

      // If it's already a valid URL, use it directly
      if (visitor.imgUrl.startsWith("blob:") || visitor.imgUrl.startsWith("data:") || visitor.imgUrl.startsWith("http")) {
        setResolvedImageUrl(visitor.imgUrl);
        return;
      }

      // If it's a file path, get the blob URL
      try {
        const blobUrl = await getVisitorImageBlob(visitor.imgUrl);
        setResolvedImageUrl(blobUrl);
      } catch (error) {
        console.error("Failed to resolve visitor image:", error);
        setResolvedImageUrl(null);
      }
    };

    resolveVisitorImage();
  }, [visitor?.imgUrl]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Parse host details
  const getHostDetails = () => {
    if (!visitor?.hostDetails) return null;
    try {
      return typeof visitor.hostDetails === "string"
        ? JSON.parse(visitor.hostDetails)
        : visitor.hostDetails;
    } catch (error) {
      console.error("Error parsing host details:", error);
      return null;
    }
  };

  const hostDetails = getHostDetails();

  // Check if current user is the one who added this visitor
  const isCurrentUserAddedVisitor = () => {
    if (!hostDetails || !visitor?.visitorAddedBy) return false;

    // Convert both to strings for comparison since they might be different types
    const hostUserId = String(hostDetails.userId);
    const visitorAddedBy = String(visitor.visitorAddedBy);

    return hostUserId === visitorAddedBy;
  };

  // Get header title based on user relationship
  const getHeaderTitle = () => {
    return isCurrentUserAddedVisitor() ? "My invites" : "Visitor Request";
  };

  if (loading) {
    return (
      <Flex w="100vw" h="100vh" align="center" justify="center" bg="white">
        <Spinner size="lg" color="#9747ff" />
      </Flex>
    );
  }

  if (error || !visitor) {
    return (
      <Box p={8}>
        <Text color="red.500">{error || "Visitor not found."}</Text>
      </Box>
    );
  }

  return (
    <Box
      w="100vw"
      px={0}
      h="100vh"
      bg={{ base: "white", md: "#f7f2fd" }}
      display="flex"
      flexDirection="column"
      overflowX="hidden"
      overflowY="hidden"
      className="relative"
      css={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Mobile Header */}
        <Flex
          align="center"
        justify="center"
          h="48px"
        bg="#f4edfd"
        borderBottom="1px solid #f2f2f2"
        position="relative"
        w="100%"
        display={{ base: "flex", md: "none" }}
      >
        <IconButton
          aria-label="Back"
            tabIndex={0}
          variant="ghost"
          fontSize="lg"
          bg="transparent"
          position="absolute"
          left={0}
            onClick={() => router.back()}
          color="black"
          _focus={{ boxShadow: "none", outline: "none", bg: "transparent" }}
          _active={{ bg: "transparent" }}
        >
          <FiChevronLeft />
        </IconButton>
        <Text fontWeight="bold" fontSize="md" color="#18181b">
          {getHeaderTitle()}
        </Text>
      </Flex>

      {/* Web Header */}
      <Box display={{ base: "none", md: "block" }}>
        <DesktopHeader />
      </Box>

      {/* Web Navigation Bar - Light Purple Background */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        py={4}
        bg="#f7f2fd"
        borderBottom="1px solid #f2f2f2"
        display={{ base: "none", md: "flex" }}
      >
        {/* Left - Back Button and Title */}
        <Flex align="center" gap={3}>
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={() => router.back()}
            color="#8A37F7"
            _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
          >
            <FiChevronLeft />
          </IconButton>
          <Heading
            fontSize="lg"
            color="#18181b"
            fontWeight="bold"
          >
            Visitors Info
          </Heading>
        </Flex>
      </Flex>

      {/* Content Area */}
      <Box flex={1} position="relative" overflowY="auto" mt={4}>
        {/* Preview Card */}
        <Box px={{ base: 2, md: 6 }} position="relative" zIndex={1}>
          <Box
            bg="white"
            borderRadius={{ base: "8px", md: "12px" }}
            px={{ base: 3, md: 6 }}
            py={{ base: 3, md: 6 }}
            mt={{ base: 2, md: 8 }}
            w={{ base: "calc(100% - 16px)", md: "75%" }}
            mx="auto"
            boxShadow="sm"
          >
            {/* Mobile Layout - Original Design */}
            <Flex direction="column" gap={1} display={{ base: "flex", md: "none" }}>
      {/* Section Title */}
      <Text
        fontWeight="bold"
        fontSize="md"
        color="#381B62"
        mb={2}
        alignSelf="flex-start"
      >
        Visitor&apos;s Info
      </Text>

      {/* Card Profile - Employee style */}
      <Box
        position="relative"
                w="full"
                maxW="342px"
                mx="auto"
                mt={2}
                bg="#f7f7ff"
                borderRadius="lg"
        boxShadow="sm"
                px={4}
                pt={8}
                pb={4}
        minH="240px"
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        {/* Avatar - overlaps top border, centered */}
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
          bg="#8A37F7"
          color="white"
          fontWeight="bold"
          fontSize="lg"
          boxShadow="md"
        >
          {resolvedImageUrl ? (
            <Image
              src={resolvedImageUrl}
              alt={visitor.fullName || "Visitor"}
              width={56}
              height={56}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            visitor.fullName?.charAt(0)?.toUpperCase() || "?"
          )}
        </Box>
        {/* Two-column info grid */}
        <Box mt={2} w="full">
          <Box
            as="dl"
            display="grid"
            gridTemplateColumns={{ base: "1fr 1fr", sm: "120px 1fr" }}
            rowGap={3}
            columnGap={4}
            wordBreak="break-word"
          >
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Full Name :
            </Text>
            <Text
              as="dd"
              color="#363636"
              fontSize="sm"
              textAlign={{ base: "right", sm: "right" }}
              truncate
            >
              {visitor.fullName}
            </Text>

            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Phone No :
            </Text>
            <Text
              as="dd"
              color="#363636"
              fontSize="sm"
              textAlign={{ base: "right", sm: "right" }}
              truncate
            >
              {visitor.phoneNumber}
            </Text>

            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Purpose of Visit :
            </Text>
            <Text
              as="dd"
              color="#363636"
              fontSize="sm"
              textAlign={{ base: "right", sm: "right" }}
              truncate
            >
              {visitor.purposeOfVisit}
            </Text>

            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Coming From :
            </Text>
            <Text
              as="dd"
              color="#363636"
              fontSize="sm"
              textAlign={{ base: "right", sm: "right" }}
              truncate
            >
              {visitor.comingFrom === "company"
                ? visitor.companyName
                : visitor.location}
            </Text>

            {/* Status display for pending and rejected visitors */}
            {(visitor.status === "PENDING" ||
              visitor.status === "pending" ||
              visitor.status === "REJECTED" ||
              visitor.status === "rejected") && (
              <>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Status :
                </Text>
                <Text
                  as="dd"
                  color={visitor.status === "REJECTED" ? "#dc2626" : "#363636"}
                  fontSize="sm"
                  textAlign={{ base: "right", sm: "right" }}
                  truncate
                >
                  {visitor.status === "PENDING" || visitor.status === "pending"
                    ? "Pending"
                    : "Rejected"}
                </Text>

                {/* Check-In & Check-Out Section */}
                <Box mt={1} mb={1} gridColumn={{ base: "1 / -1", sm: "2" }}>
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    color="#23292e"
                    mb={0.5}
                  >
                    Check-In & Check-Out :
                  </Text>
                  <Flex
                    align="center"
                    justify="center"
                    bg="white"
                    borderRadius="xl"
                    px={2}
                    py={1}
                    gap={2}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="#181a1b"
                      minW="70px"
                    >
                      {visitor.date ? formatDate(visitor.date) : "-"}:
                    </Text>
                    <Flex align="center" gap={1}>
                      {/* Check-in icon */}
                      <svg
                        width="14"
                        height="12"
                        viewBox="0 0 14 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
                          fill="#23A36D"
                        />
                      </svg>
                      <Text fontSize="sm" color="#23A36D" fontWeight="medium">
                        {visitor.checkInTime
                          ? formatTime(visitor.checkInTime)
                          : "-"}
                      </Text>
                    </Flex>
                    {visitor.checkOutTime ? (
                      <Flex align="center" gap={1}>
                        {/* Check-out icon */}
                        <svg
                          width="14"
                          height="12"
                          viewBox="0 0 14 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
                            fill="#E34935"
                          />
                        </svg>
                        <Text fontSize="sm" color="#E34935" fontWeight="medium">
                          {formatTime(visitor.checkOutTime)}
                        </Text>
                      </Flex>
                    ) : (
                      <Flex align="center" gap={1}>
                        {/* Check-out icon with dash for not checked out */}
                        <svg
                          width="14"
                          height="12"
                          viewBox="0 0 14 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
                            fill="#E34935"
                          />
                        </svg>
                        <Text fontSize="sm" color="#E34935" fontWeight="medium">
                          -
                        </Text>
                      </Flex>
                    )}
                  </Flex>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
            </Flex>

            {/* Reason Section - Only for Rejected Visitors */}
            {(visitor.status === "REJECTED" || visitor.status === "rejected") && visitor.rejectionReason && (
              <Box display={{ base: "block", md: "none" }} mt={4}>
                <Text
                  fontWeight="bold"
                  fontSize="md"
                  color="#381B62"
                  mb={2}
                  alignSelf="flex-start"
                >
                  Reason
                </Text>
                <Text
                  fontSize="sm"
                  color="#8B4513"
                >
                  {visitor.rejectionReason}
                </Text>
              </Box>
            )}

            {/* Web Layout - Full Screen Card Format */}
            <Flex 
              align="center" 
              justify="flex-start" 
              w="full" 
              px={8} 
              py={6}
              gap={6}
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
                {resolvedImageUrl ? (
                  <Image
                    src={resolvedImageUrl}
                    alt={visitor.fullName || "Visitor"}
                    width={60}
                    height={60}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
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
              <Flex direction="column" gap={1} flex="1">
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

              {/* Phone No */}
              <Flex direction="column" gap={1} flex="1">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Phone No:
                </Text>
                <Text color="#18181b" fontSize="sm" fontWeight="bold">
                  {visitor.phoneNumber}
                </Text>
              </Flex>

              {/* Purpose of Visit */}
              <Flex direction="column" gap={1} flex="1">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Purpose:
                </Text>
                <Text color="#18181b" fontSize="sm" fontWeight="bold">
                  {visitor.purposeOfVisit}
                </Text>
              </Flex>

              {/* Coming From */}
              <Flex direction="column" gap={1} flex="1">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Coming From:
                </Text>
                <Text color="#18181b" fontSize="sm" fontWeight="bold">
                  {visitor.comingFrom === "company"
                    ? visitor.companyName
                    : visitor.location}
                </Text>
              </Flex>

              {/* Status */}
              <Flex direction="column" gap={1} flex="1">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Status:
                </Text>
                <Box
                  bg={visitor.status === "REJECTED" ? "#E34A35" : visitor.status === "PENDING" ? "#B38400" : "#23a36a"}
                  color="white"
                  borderRadius="12px"
                  px={4}
                  h="24px"
                  display="flex"
                  alignItems="center"
                  fontSize="sm"
                  fontWeight="normal"
                  minW="70px"
                  justifyContent="center"
                  alignSelf="flex-start"
                >
                  {visitor.status === "PENDING" || visitor.status === "pending"
                    ? "Pending"
                    : visitor.status === "REJECTED" || visitor.status === "rejected"
                    ? "Rejected"
                    : "Approved"}
          </Box>
              </Flex>
            </Flex>

            {/* Reason Section for Web - Only for Rejected Visitors */}
            {(visitor.status === "REJECTED" || visitor.status === "rejected") && visitor.rejectionReason && (
              <Box display={{ base: "none", md: "block" }} mt={6}>
                <Text
                  fontWeight="bold"
                  fontSize="lg"
                  color="#381B62"
                  mb={3}
                >
                  Reason
                </Text>
                <Text
                  fontSize="md"
                  color="#8B4513"
                >
                  {visitor.rejectionReason}
                </Text>
              </Box>
            )}
        </Box>
        </Box>

        {/* Background Logo - Web Only */}
        <Box display={{ base: "none", md: "flex" }} justifyContent="center" alignItems="center" mt={20}>
          <Box transform="scale(5)" opacity={0.15}>
            <Logo />
          </Box>
        </Box>
      </Box>

      {/* Action Button */}
      <Box
        position={{ base: "fixed", md: "static" }}
        bottom={{ base: "16px", md: "auto" }}
        left={{ base: "50%", md: "auto" }}
        transform={{ base: "translateX(-50%)", md: "none" }}
        w={{ base: "calc(100% - 16px)", md: "600px" }}
        maxW={{ base: "390px", md: "600px" }}
        mx={{ base: "auto", md: "auto" }}
        px={{ base: 0, md: 6 }}
        pb={{ base: 0, md: 6 }}
        zIndex={10}
      >
        {isPendingStatus() ? (
          <Flex gap={3} w="full">
            <Button
              flex={1}
              h={{ base: "48px", md: "52px" }}
              bg="#E34935"
              color="#fff"
              borderRadius="md"
              fontWeight="bold"
              fontSize={{ base: "sm", md: "md" }}
              tabIndex={0}
              aria-label="Reject"
              onClick={handleReject}
              _hover={{ bg: "#c0392b" }}
              disabled={isProcessing}
            >
              Reject
            </Button>
            <Button
              flex={1}
              h={{ base: "48px", md: "52px" }}
              bg="#23A36D"
              color="#fff"
              borderRadius="md"
              fontWeight="bold"
              fontSize={{ base: "sm", md: "md" }}
              tabIndex={0}
              aria-label="Accept"
              onClick={handleApprove}
              _hover={{ bg: "#1e8a5a" }}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Accept"}
            </Button>
          </Flex>
        ) : (
          <Button
            w="full"
            h={{ base: "48px", md: "52px" }}
            bg="#8A38F5"
            color="#fff"
            borderRadius="md"
            fontWeight="bold"
            fontSize={{ base: "md", md: "lg" }}
            tabIndex={0}
            aria-label="Go Back"
            onClick={() => router.back()}
            _hover={{ bg: "#7a2ee0" }}
          >
            Go Back
          </Button>
        )}
      </Box>

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onSave={handleRejectWithReason}
        isLoading={isProcessing}
      />
    </Box>
  );
};

export default VisitorPreviewPage;

