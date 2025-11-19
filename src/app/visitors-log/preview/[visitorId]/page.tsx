"use client";
import {
  Box,
  Flex,
  Text,
  Button,
  Link as ChakraLink,
  Spinner,
  Icon,
  VStack,
  IconButton,
} from "@chakra-ui/react";
import { useRouter, useParams } from "next/navigation";
import { FC, useState, useEffect, useCallback } from "react";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import { updateVisitor } from "@/app/api/visitor/routes";
import { FiChevronLeft } from "react-icons/fi";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import Image from "next/image";
import { getVisitorImageBlob } from "@/app/api/visitor-image/routes";
import { getVisitorAssetImageBlob } from "@/app/api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "@/app/api/visitor-guests/routes";
import DesktopHeader from "@/components/DesktopHeader";
import { useUserData } from "@/lib/hooks/useUserData";
import { EMPLOYEES_API } from "@/lib/server-urls";

// // Helper function to get color based on name
// const getNameColor = (name: string): string => {
//   const colors = [
//     "#8A38F5",
//     "#23A36D",
//     "#E34935",
//     "#F59E0B",
//     "#3B82F6",
//     "#10B981",
//     "#F97316",
//     "#8B5CF6",
//     "#EF4444",
//     "#06B6D4",
//   ];
//   const index = name.charCodeAt(0) % colors.length;
//   return colors[index];
// };

// Asset interface
interface Asset {
  assetName?: string;
  name?: string;
  serialNumber?: string;
  assetType?: string;
  imgUrl?: string;
}

// Guest interface
interface Guest {
  guestName?: string;
  name?: string;
  imgUrl?: string;
}

// Employee interface
interface EmployeeData {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}

// Visitor interface
interface Visitor {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  idType: string;
  idNumber: string;
  date: string;
  time: string;
  comingFrom: string;
  companyName: string;
  location?: string | null;
  purposeOfVisit: string;
  imgUrl?: string;
  hostDetails: {
    name: string;
    phoneNumber: string;
    email: string;
    profileImageUrl?: string | null;
  };
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  assets?: Asset[];
  guest?: Guest[];
}

// Format check-in time - show blank if not checked in yet
const formatCheckInTime = (checkInTime: string | null | undefined): string => {
  if (checkInTime) {
    const date = new Date(checkInTime);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "-"; // Return blank if not checked in yet
};

// Format check-out time
const formatCheckOutTime = (
  checkOutTime: string | null | undefined
): string => {
  if (checkOutTime) {
    const date = new Date(checkOutTime);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "-";
};

const VisitorPreviewPage: FC = () => {
  const router = useRouter();
  const params = useParams();
  const {} = useDeviceDetection();
  // Fix: Get the correct parameter name
  const visitorId = params?.id || params?.visitorId;

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);
  
  const { } = useUserData();

  // Helper function to get the correct image URL
  const getImageUrl = async (
    imgUrl: string | undefined,
    type: "visitor" | "asset" | "guest" = "visitor"
  ): Promise<string | null> => {
    if (!imgUrl) return null;

    // If it's already a valid URL (http/https or data), return as is
    if (imgUrl.startsWith("http") || imgUrl.startsWith("data:")) {
      return imgUrl;
    }

    // If it's a file path, get the blob URL based on type
    try {
      let blobUrl: string | null = null;

      switch (type) {
        case "visitor":
          blobUrl = await getVisitorImageBlob(imgUrl);
          break;
        case "asset":
          blobUrl = await getVisitorAssetImageBlob(imgUrl);
          break;
        case "guest":
          blobUrl = await getVisitorGuestPhotoBlob(imgUrl);
          break;
        default:
          blobUrl = await getVisitorImageBlob(imgUrl);
      }

      // Validate that the blob URL is actually a valid URL
      if (
        blobUrl &&
        (blobUrl.startsWith("blob:") || blobUrl.startsWith("data:"))
      ) {
        return blobUrl;
      }

      return null;
    } catch (error) {
      console.error(`Failed to load ${type} image:`, error);
      return null;
    }
  };

  // Helper function to check if a resolved image URL is valid for Next.js Image component
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return (
      url.startsWith("blob:") ||
      url.startsWith("data:") ||
      url.startsWith("http")
    );
  };

  const fetchVisitor = useCallback(async () => {
    try {
      // Fix: Use the correct auth token key and API endpoint
      const authData = localStorage.getItem("authData");
      if (!authData) {
        setError("No auth token found. Please login again.");
        setLoading(false);
        return;
      }

      const token = JSON.parse(authData)?.token;
      if (!token) {
        setError("Invalid auth token. Please login again.");
        setLoading(false);
        return;
      }

      // Fix: Use the correct API endpoint that matches your main visitors-log page
      const res = await fetch(`${FRONTEND_URL}/api/visitors-log/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const allVisitors = data?.visitors || data || [];

      // Fix: More robust visitor matching
      const matched = allVisitors.find((v: Visitor) => {
        return String(v.id) === String(visitorId);
      });

      if (!matched) {
        console.error(
          "Visitor not found. Available visitors:",
          allVisitors.map((v: Visitor) => ({ id: v.id, name: v.fullName }))
        );
        setError(`Visitor with ID ${visitorId} not found`);
        setLoading(false);
        return;
      }

      setVisitor(matched);
      setLoading(false);
    } catch (err: unknown) {
      console.error("Error fetching visitor:", err);

      // Type guard for error message
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(`Failed to fetch visitor: ${errorMessage}`);
      setLoading(false);
    }
  }, [visitorId]);

  useEffect(() => {
    if (visitorId) {
      fetchVisitor();
    } else {
      setError("No visitor ID provided");
      setLoading(false);
    }
  }, [visitorId, fetchVisitor]);

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const authData = localStorage.getItem("authData");
        if (!authData) return;

        const token = JSON.parse(authData)?.token;
        if (!token) return;

        const response = await fetch(EMPLOYEES_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setEmployeesData(data?.employees || data || []);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };

    fetchEmployees();
  }, []);

  // Resolve image URLs when visitor changes
  useEffect(() => {
    const resolveImageUrls = async () => {
      if (!visitor) return;

      const urls: Record<string, string> = {};

      // Resolve visitor image URL
      if (visitor.imgUrl) {
        const resolvedUrl = await getImageUrl(visitor.imgUrl, "visitor");
        if (resolvedUrl) {
          urls[visitor.imgUrl] = resolvedUrl;
        }
      }

      // Resolve host profile image URL
      if (visitor.hostDetails?.profileImageUrl) {
        const resolvedUrl = await getImageUrl(
          visitor.hostDetails.profileImageUrl,
          "visitor"
        );
        if (resolvedUrl) {
          urls[visitor.hostDetails.profileImageUrl] = resolvedUrl;
        }
      }

      // Resolve guest image URLs
      if (visitor.guest) {
        for (const guest of visitor.guest) {
          if (guest.imgUrl) {
            const resolvedUrl = await getImageUrl(guest.imgUrl, "guest");
            if (resolvedUrl) {
              urls[guest.imgUrl] = resolvedUrl;
            }
          }
        }
      }

      // Resolve asset image URLs
      if (visitor.assets) {
        for (const asset of visitor.assets) {
          if (asset.imgUrl) {
            const resolvedUrl = await getImageUrl(asset.imgUrl, "asset");
            if (resolvedUrl) {
              urls[asset.imgUrl] = resolvedUrl;
            }
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [visitor]);

  // Update host details from employee data
  useEffect(() => {
    if (visitor && employeesData.length > 0) {
      const hostDetails = visitor.hostDetails;
      if (hostDetails) {
        // Find matching employee by email or name
        const employee = employeesData.find(
          (emp) => emp.email === hostDetails.email || emp.name === hostDetails.name
        );

        if (employee) {
          const updatedHostDetails = { ...hostDetails };
          let needsUpdate = false;

          // Update profile image if employee has one and host doesn't
          if (
            (!hostDetails.profileImageUrl || hostDetails.profileImageUrl.trim() === "") &&
            employee.profileImageUrl
          ) {
            updatedHostDetails.profileImageUrl = employee.profileImageUrl;
            needsUpdate = true;
          }

          // Update name if employee has a more complete name
          if (employee.name && employee.name !== hostDetails.name) {
            updatedHostDetails.name = employee.name;
            needsUpdate = true;
          }

          // Update phone number if it's missing or empty
          if (
            (!hostDetails.phoneNumber || hostDetails.phoneNumber.trim() === "") &&
            employee.phoneNumber
          ) {
            updatedHostDetails.phoneNumber = employee.phoneNumber;
            needsUpdate = true;
          }

          // Only update state if changes were made
          if (needsUpdate) {
            setVisitor((prev) =>
              prev ? { ...prev, hostDetails: updatedHostDetails } : prev
            );
          }
        }
      }
    }
  }, [visitor, employeesData]);

  const handleGoBack = () => router.push("/visitors-log");

  const handleCheckOut = async () => {
    if (!visitor?.id) {
      console.error("No visitor ID found");
      return;
    }

    setCheckingOut(true);
    try {
      // Get auth token
      const authDataRaw =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (!authDataRaw) throw new Error("No auth data found");

      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;
      if (!token) throw new Error("No token found");

      // Update visitor status to CHECKED_OUT
      const updateData = {
        status: "CHECKED_OUT",
        checkOutTime: new Date().toISOString(),
      };

      await updateVisitor(visitor.id, updateData, token);

      toaster.success({
        title: "Check-out Complete",
        description: "Visitor has been successfully checked out.",
      });

      // Update the visitor data with the new check-out time
      setVisitor((prev) =>
        prev
          ? {
              ...prev,
              checkOutTime: updateData.checkOutTime,
              status: updateData.status,
            }
          : null
      );
    } catch (error) {
      console.error("Error updating visitor status:", error);
      toaster.error({
        title: "Error",
        description: "Failed to check out visitor.",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <Flex
        align="center"
        justify="center"
        h="100vh"
        direction="column"
        gap={4}
        bg="white"
        w="100vw"
      >
        <Spinner size="lg" color="#8A38F5" />
        <Text fontSize="sm" color="#363636">
          Loading visitor details...
        </Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        align="center"
        justify="center"
        h="100vh"
        direction="column"
        gap={4}
        bg="white"
        w="100vw"
      >
        <Text fontSize="sm" color="red.500" textAlign="center" px={4}>
          {error}
        </Text>
        <Button onClick={handleGoBack} bg="#8A38F5" color="white" size="sm">
          Back to Visitors Log
        </Button>
      </Flex>
    );
  }

  if (!visitor) {
    return (
      <Flex
        align="center"
        justify="center"
        h="100vh"
        direction="column"
        gap={4}
        bg="white"
        w="100vw"
      >
        <Text fontSize="sm" color="red.500">
          Visitor not found
        </Text>
        <Button onClick={handleGoBack} bg="#8A38F5" color="white" size="sm">
          Back to Visitors Log
        </Button>
      </Flex>
    );
  }

  return (
    <Box
      h="100vh"
      w="full"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      bg="white"
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {/* Desktop Header */}
      <DesktopHeader notificationCount={3} />

      {/* Mobile Header */}
      <Flex
        display={{ base: "flex", md: "none" }}
        align="center"
        justify="center"
        h="70px"
        bg="#f7f2fd"
        borderBottom="1px solid #f2f2f2"
        position="relative"
      >
        <Button
          onClick={handleGoBack}
          variant="ghost"
          aria-label="Go back to visitors log"
          tabIndex={0}
          position="absolute"
          left={2}
          top="50%"
          transform="translateY(-50%)"
          minW="auto"
          p={2}
          _hover={{ bg: "gray.100" }}
          _active={{ bg: "gray.200" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <Text
          fontWeight="bold"
          fontSize="sm"
          color="#18181b"
          textAlign="center"
        >
          Visitor Details
        </Text>
      </Flex>

      {/* Web Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "flex" }}
        flex={1}
        flexDirection="column"
        bg="#f4edfefa"
        pt="0px"
        overflowY="auto"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {/* Page Title and Back Button */}
        <Flex align="center" gap={3} mb='20px' p='16px' bg="#f4edfefa">
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={handleGoBack}
            color="#8A37F7"
            _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
          >
            <FiChevronLeft />
          </IconButton>
          <Text fontSize="lg" color="#18181b" fontWeight="bold">
            Visitor Details
          </Text>
        </Flex>

        {/* Web Content - Employee Info on Top, Visitor Info on Bottom */}
        <Flex
          direction="column"
          gap={6}
          h="calc(100% - 140px)"
          overflow="auto"
          px={0}
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Employee Info Card - Horizontal Layout with Separators */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="0 2px 16px rgba(95,36,172,0.27)"
            p={6}
            w="calc(100% - 64px)"
            mx={8}
          >
            {/* Horizontal Layout with Vertical Separators */}
            <Flex alignItems="center" w="full">
              {/* Profile Picture and Full Name Section */}
              <Box flex="1" px={4}>
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="#8A38F5"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontWeight="bold"
                  fontSize="lg"
                  mb={2}
                  overflow="hidden"
                >
                  {visitor.hostDetails?.profileImageUrl &&
                  isValidImageUrl(
                    resolvedImageUrls[visitor.hostDetails.profileImageUrl]
                  ) ? (
                    <Image
                      src={
                        resolvedImageUrls[visitor.hostDetails.profileImageUrl]
                      }
                      alt={visitor.hostDetails.name || "Host"}
                      width={60}
                      height={60}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {visitor.hostDetails?.name?.charAt(0).toUpperCase() ||
                        "E"}
                    </Text>
                  )}
                </Box>
                <Box>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="gray.600"
                    mb={1}
                    fontFamily="Roboto"
                  >
                    Full Name :
                  </Text>
                  <Text
                    fontSize="18px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    {visitor.hostDetails?.name || "-"}
                  </Text>
                </Box>
              </Box>

              {/* Vertical Separator - Only show if phone number exists */}
              {visitor.hostDetails?.phoneNumber && visitor.hostDetails.phoneNumber.trim() !== "" && (
                <Box w="1px" h="60px" bg="gray.300" mx={4} />
              )}

              {/* Phone Number Section - Only show if phone number exists */}
              {visitor.hostDetails?.phoneNumber && visitor.hostDetails.phoneNumber.trim() !== "" && (
                <Box flex="1" px={4}>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="gray.600"
                    mb={1}
                    fontFamily="Roboto"
                  >
                    Phone No :
                  </Text>
                  <Text
                    fontSize="16px"
                    fontWeight="500"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    {visitor.hostDetails.phoneNumber}
                  </Text>
                </Box>
              )}

              {/* Vertical Separator - Only show if email exists */}
              {visitor.hostDetails?.email && visitor.hostDetails.email.trim() !== "" && (
                <Box w="1px" h="60px" bg="gray.300" mx={4} />
              )}

              {/* Email Section - Only show if email exists */}
              {visitor.hostDetails?.email && visitor.hostDetails.email.trim() !== "" && (
                <Box flex="1" px={4}>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="gray.600"
                    mb={1}
                    fontFamily="Roboto"
                  >
                    Email :
                  </Text>
                  <Text
                    fontSize="16px"
                    fontWeight="500"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    {visitor.hostDetails.email}
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>

          {/* Visitor Info Card - Matching visitor-history-preview design */}
          <Box
            bg="white"
            borderRadius="lg"
            boxShadow="0 2px 16px rgba(95,36,172,0.27)"
            p={6}
            w="60%"
            mx="auto"
            mb={4}
          >
            {/* Visitor Information - Top Row */}
            <Flex alignItems="center" w="full" mb={4}>
              {/* Left Side - Profile Picture and Name */}
              <Flex alignItems="center" gap={4} flex="1">
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  bg="#8A38F5"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontWeight="bold"
                  fontSize="lg"
                  overflow="hidden"
                >
                  {visitor.imgUrl &&
                  isValidImageUrl(resolvedImageUrls[visitor.imgUrl]) ? (
                    <Image
                      src={resolvedImageUrls[visitor.imgUrl]}
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
                    <Text fontSize="lg" fontWeight="bold" color="white">
                      {visitor.fullName?.charAt(0).toUpperCase() || "V"}
                    </Text>
                  )}
                </Box>
                <Box>
                  <Text
                    fontSize="18px"
                    fontWeight="600"
                    color="gray.800"
                    mb={1}
                    fontFamily="Roboto"
                  >
                    {visitor.fullName || "-"}
                  </Text>
                </Box>
              </Flex>

              {/* Right Side - Purpose of Visit */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                >
                  Purpose of Visit :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                >
                  {visitor.purposeOfVisit || "-"}
                </Text>
              </Box>
            </Flex>

            {/* Second Row - Company Name and Check-In/Check-Out */}
            <Flex alignItems="center" w="full" mb={4}>
              {/* Company Name */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                >
                  Company Name :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                >
                  {visitor.companyName || "-"}
                </Text>
              </Box>

              {/* Check-In & Check-Out */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                >
                  Check-In & Check-Out :
                </Text>
                <Flex alignItems="center" gap={2}>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    {visitor.date
                      ? new Date(visitor.date).toLocaleDateString("en-GB")
                      : "-"}
                    :
                  </Text>
                  <Flex alignItems="center" gap={1}>
                    {/* Check-in icon */}
                    <svg
                      width="16"
                      height="14"
                      viewBox="0 0 14 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
                        fill="#23A36D"
                      />
                    </svg>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                    >
                      {visitor.checkInTime
                        ? new Date(visitor.checkInTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : "-"}
                    </Text>
                  </Flex>
                  <Flex alignItems="center" gap={1}>
                    {/* Check-out icon */}
                    <svg
                      width="16"
                      height="14"
                      viewBox="0 0 14 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
                        fill="#E34935"
                      />
                    </svg>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                    >
                      {visitor.checkOutTime
                        ? new Date(visitor.checkOutTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )
                        : "-"}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>

            {/* Third Row - Gender and ID Type */}
            <Flex alignItems="flex-start" mb={3}>
              {/* Gender Section */}
              <Box flex="1" mr={4}>
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  Gender :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  {visitor.gender || "-"}
                </Text>
              </Box>

              {/* ID Type Section */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  ID Type :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="blue.500"
                  textDecoration="underline"
                  fontFamily="Roboto"
                  textAlign="left"
                  cursor="pointer"
                >
                  {visitor.idType || "-"}
                </Text>
              </Box>
            </Flex>

            {/* Fourth Row - Phone Number and Status */}
            <Flex alignItems="flex-start" mb={4} gap={6}>
              {/* Phone Number */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                >
                  Phone Number :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                >
                  {visitor.phoneNumber || "-"}
                </Text>
              </Box>

              {/* Status */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                >
                  Status :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color={
                    visitor.status === "APPROVED"
                      ? "green.500"
                      : visitor.status === "PENDING"
                      ? "green.500"
                      : visitor.status === "REJECTED"
                      ? "red.500"
                      : visitor.status === "CHECKED_IN"
                      ? "green.500"
                      : "gray.800"
                  }
                  fontFamily="Roboto"
                >
                  {visitor.status || "-"}
                </Text>
              </Box>
            </Flex>

            {/* HR Line Separator - Only show if there are guests or assets */}
            {((visitor?.guest && visitor.guest.length > 0) ||
              (visitor?.assets && visitor.assets.length > 0)) && (
              <Box w="full" h="1px" bg="gray.200" mb={4} />
            )}

            {/* Guests Section */}
            {visitor?.guest && visitor.guest.length > 0 && (
              <Box mb={4}>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  mb={3}
                  fontFamily="Roboto"
                >
                  With Guests :
                </Text>
                <Flex direction="column" gap={2}>
                  {visitor.guest.slice(0, 2).map((guest, index) => (
                    <Flex key={index} alignItems="center" gap={3}>
                      <Text fontSize="14px" color="gray.800" fontWeight="500">
                        {index + 1}.
                      </Text>
                      <Box
                        w="32px"
                        h="32px"
                        borderRadius="full"
                        bg="#8A38F5"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        color="white"
                        fontSize="sm"
                        fontWeight="bold"
                        overflow="hidden"
                      >
                        {guest.imgUrl &&
                        isValidImageUrl(resolvedImageUrls[guest.imgUrl]) ? (
                          <Image
                            src={resolvedImageUrls[guest.imgUrl]}
                            alt={guest.guestName || "Guest"}
                            width={32}
                            height={32}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <Text fontSize="sm" fontWeight="bold" color="white">
                            {guest.guestName?.charAt(0).toUpperCase() || "G"}
                          </Text>
                        )}
                      </Box>
                      <Text fontSize="14px" color="gray.800" fontWeight="500">
                        {guest.guestName}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Assets Section */}
            {visitor?.assets && visitor.assets.length > 0 && (
              <Box>
                <Flex alignItems="center" justifyContent="space-between" mb={3}>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    Assets Recorded :
                  </Text>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    Total Assets:{" "}
                    {visitor.assets.length.toString().padStart(2, "0")}
                  </Text>
                </Flex>

                {/* Personal Assets */}
                {visitor.assets.filter(
                  (asset) => asset.assetType === "Personal"
                ).length > 0 && (
                  <Flex gap={3} mb={2} flexWrap="wrap">
                    {visitor.assets
                      .filter((asset) => asset.assetType === "Personal")
                      .map((asset, index) => (
                        <Flex
                          key={`personal-${asset.serialNumber}-${index}`}
                          align="center"
                          gap={2}
                          bg="gray.50"
                          p={2}
                          borderRadius="md"
                          border="1px solid #e2e8f0"
                          minW={0}
                          w={{ base: "full", md: "fit-content" }}
                          maxW={{ base: "100%", md: "auto" }}
                        >
                          <Box
                            w="32px"
                            h="24px"
                            borderRadius="sm"
                            border="1px solid #8A38F5"
                            overflow="hidden"
                            bg="white"
                            color="purple.700"
                            fontSize="xs"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            {asset.imgUrl &&
                            isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                              <Image
                                src={resolvedImageUrls[asset.imgUrl]}
                                alt={asset.assetName || "Asset"}
                                width={32}
                                height={24}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}
                              />
                            ) : (
                              <Text fontSize="xs" fontWeight="bold" color="purple.700">
                                {asset?.assetName
                                  ? asset?.assetName.charAt(0).toUpperCase()
                                  : "P"}
                              </Text>
                            )}
                          </Box>
                          <Flex direction="column" gap={0.5} minW={0} flex={1} w="full">
                            <Text
                              fontSize="xs"
                              color="#363636"
                              fontWeight="600"
                              wordBreak="break-word"
                              overflowWrap="anywhere"
                            >
                              Personal: {asset.assetName || "Asset"}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="gray.600"
                              fontWeight="500"
                            >
                              #{asset.serialNumber}
                            </Text>
                          </Flex>
                        </Flex>
                      ))}
                  </Flex>
                )}

                {/* Company Assets */}
                {visitor.assets.filter(
                  (asset) => asset.assetType === "Company"
                ).length > 0 && (
                  <Flex gap={3} mb={2} flexWrap="wrap">
                    {visitor.assets
                      .filter((asset) => asset.assetType === "Company")
                      .map((asset, index) => (
                        <Flex
                          key={`company-${asset.serialNumber}-${index}`}
                          align="center"
                          gap={2}
                          bg="gray.50"
                          p={2}
                          borderRadius="md"
                          border="1px solid #e2e8f0"
                          minW={0}
                          w={{ base: "full", md: "fit-content" }}
                          maxW={{ base: "100%", md: "auto" }}
                        >
                          <Box
                            w="32px"
                            h="24px"
                            borderRadius="sm"
                            border="1px solid #8A38F5"
                            overflow="hidden"
                            bg="white"
                            color="purple.700"
                            fontSize="xs"
                            fontWeight="bold"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            {asset.imgUrl &&
                            isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                              <Image
                                src={resolvedImageUrls[asset.imgUrl]}
                                alt={asset.assetName || "Asset"}
                                width={32}
                                height={24}
                                style={{
                                  objectFit: "cover",
                                  width: "100%",
                                  height: "100%",
                                }}
                              />
                            ) : (
                              <Text fontSize="xs" fontWeight="bold" color="purple.700">
                                {asset?.assetName
                                  ? asset?.assetName.charAt(0).toUpperCase()
                                  : "C"}
                              </Text>
                            )}
                          </Box>
                          <Flex direction="column" gap={0.5} minW={0} flex={1} w="full">
                            <Text
                              fontSize="xs"
                              color="#363636"
                              fontWeight="600"
                              wordBreak="break-word"
                              overflowWrap="anywhere"
                            >
                              Company: {asset.assetName || "Asset"}
                            </Text>
                            <Text
                              fontSize="2xs"
                              color="gray.600"
                              fontWeight="500"
                            >
                              #{asset.serialNumber}
                            </Text>
                          </Flex>
                        </Flex>
                      ))}
                  </Flex>
                )}
              </Box>
            )}
          </Box>
        </Flex>

        {/* Action Buttons */}
        <Box px={8} py={3} display="flex" justifyContent="center">
          <Box w="60%" maxW="400px">
            {visitor.checkInTime && !visitor.checkOutTime ? (
              <Flex gap={4} w="full">
                <Button
                  flex="1"
                  h="48px"
                  bg="gray.500"
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  borderRadius="md"
                  _hover={{ bg: "gray.600" }}
                  onClick={handleGoBack}
                >
                  Back
                </Button>
                <Button
                  flex="1"
                  h="48px"
                  bg="#E34935"
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  borderRadius="md"
                  _hover={{ bg: "#DC2626" }}
                  _active={{ bg: "#B91C1C" }}
                  onClick={handleCheckOut}
                  loading={checkingOut}
                  loadingText="Checking Out..."
                >
                  Check Out
                </Button>
              </Flex>
            ) : (
              <Button
                w="full"
                h="48px"
                bg="#8A38F5"
                color="white"
                fontWeight="bold"
                fontSize="md"
                borderRadius="md"
                _hover={{ bg: "#7a2ed6" }}
                onClick={handleGoBack}
              >
                Go Back
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Mobile Content - Hidden on Desktop */}
      <Box
        display={{ base: "block", md: "none" }}
        flex="1"
        overflowY="auto"
        px={0}
        py={0}
        pb="120px"
        bg="white"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {/* Visitor's Info */}
        <Text
          fontWeight="bold"
          color="#381A63"
          fontSize="sm"
          mb={3}
          ml={6}
          mt={6}
        >
          Visitor&apos;s Info
        </Text>
        <Box
          position="relative"
          w="full"
          maxW="280px"
          bg="#f7f7ff"
          borderRadius="lg"
          boxShadow="sm"
          px={3}
          pt={5}
          pb={2}
          mt="40px"
          minH="180px"
          mx="auto"
          mb={6}
        >
          {/* Avatar - overlaps top border, centered */}
          <Box
            position="absolute"
            top="-36px"
            left="50%"
            transform="translateX(-50%)"
            boxSize="72px"
            borderRadius="full"
            bg="#d9d9d9"
            boxShadow="md"
            zIndex={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {visitor.imgUrl &&
            isValidImageUrl(resolvedImageUrls[visitor.imgUrl]) ? (
              <Image
                src={resolvedImageUrls[visitor.imgUrl]}
                alt={visitor.fullName || "Visitor"}
                width={72}
                height={72}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <Text fontSize="lg" color="black" fontWeight="bold">
                {visitor.fullName?.charAt(0) || "V"}
              </Text>
            )}
          </Box>
          <Box mt={10}>
            <Box
              as="dl"
              display="grid"
              gridTemplateColumns="115px 1fr"
              rowGap={2}
              columnGap={3}
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
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.fullName || "N/A"}
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
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.phoneNumber || "N/A"}
              </Text>

              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                Gender :
              </Text>
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.gender || "N/A"}
              </Text>

              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                ID Type :
              </Text>
              <Text as="dd" fontSize="sm" textAlign="right">
                {visitor.idType ? (
                  <ChakraLink
                    href="#"
                    color="#2563eb"
                    textDecoration="underline"
                    tabIndex={0}
                    aria-label="View ID type document"
                  >
                    {visitor.idType}
                  </ChakraLink>
                ) : (
                  "N/A"
                )}
              </Text>

              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                ID Number :
              </Text>
              <Text as="dd" fontSize="sm" textAlign="right">
                {visitor.idNumber ? (
                  <ChakraLink
                    href="#"
                    color="#2563eb"
                    textDecoration="underline"
                    tabIndex={0}
                    aria-label="View ID number document"
                  >
                    {visitor.idNumber}
                  </ChakraLink>
                ) : (
                  "N/A"
                )}
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
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.purposeOfVisit || "N/A"}
              </Text>
            </Box>

            <Box mt={1} mb={1}>
              <Text fontWeight="bold" fontSize="sm" color="#363636" mb={0.5}>
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
                w="full"
              >
                <Text fontWeight="bold" fontSize="xs" color="#181a1b">
                  {visitor.date
                    ? new Date(visitor.date).toLocaleDateString("en-GB")
                    : "N/A"}
                  :
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
                  <Text fontSize="xs" color="#23A36D" fontWeight="medium">
                    {formatCheckInTime(visitor.checkInTime) || "-"}
                  </Text>
                </Flex>
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
                  <Text fontSize="xs" color="#E34935" fontWeight="medium">
                    {formatCheckOutTime(visitor.checkOutTime)}
                  </Text>
                </Flex>
              </Flex>
            </Box>

            <Flex justify="flex-end" mt={0.5}>
              <Text
                color="#8A38F5"
                fontWeight="bold"
                fontSize="sm"
                textAlign="right"
                cursor="pointer"
                tabIndex={0}
                aria-label={showAll ? "View Less" : "View More"}
                textDecoration="underline"
                _hover={{ color: "#6c28d9" }}
                onClick={() => setShowAll(!showAll)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setShowAll(!showAll);
                }}
              >
                {showAll ? "View Less" : "View More"}
              </Text>
            </Flex>

            {showAll && (
              <Box mt={2}>
                {/* Guests Section */}
                {visitor.guest && visitor.guest.length > 0 && (
                  <Box w="full" mt={4}>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="#23292e"
                      mb={1}
                    >
                      With Guests :
                    </Text>
                    {visitor.guest.map((guest, index) => (
                      <Flex key={index} gap={3} align="center" mt={1}>
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          overflow="hidden"
                          bg="gray.200"
                        >
                          {guest.imgUrl &&
                          isValidImageUrl(resolvedImageUrls[guest.imgUrl]) ? (
                            <Image
                              src={resolvedImageUrls[guest.imgUrl]}
                              alt={guest.guestName || "Guest"}
                              width={32}
                              height={32}
                              style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                              }}
                            />
                          ) : (
                            <Box
                              w="32px"
                              h="32px"
                              borderRadius="full"
                              bg="purple.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="purple.700"
                              fontSize="sm"
                              fontWeight="bold"
                            >
                              {guest.guestName
                                ? guest.guestName.charAt(0).toUpperCase()
                                : "G"}
                            </Box>
                          )}
                        </Box>
                        <Text fontSize="sm" color="#23292e" fontWeight="bold">
                          {guest.guestName}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                )}

                {/* Assets Section */}
                {visitor.assets && visitor.assets.length > 0 && (
                  <Box w="full" mt={4}>
                    <Flex align="center" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" color="#23292e">
                        Assets Recorded :
                      </Text>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color="#23292e"
                        ml="auto"
                      >
                        {visitor.assets.length.toString().padStart(2, "0")}
                      </Text>
                    </Flex>
                    {/* Personal Assets */}
                    {visitor.assets.filter(
                      (asset) => asset.assetType === "Personal"
                    ).length > 0 && (
                      <Flex gap={3} mb={2} flexWrap="wrap">
                        {visitor.assets
                          .filter((asset) => asset.assetType === "Personal")
                          .map((asset, index) => (
                            <Flex
                              key={`personal-${asset.serialNumber}-${index}`}
                              align="center"
                              gap={2}
                              bg="gray.50"
                              p={2}
                              borderRadius="md"
                              border="1px solid #e2e8f0"
                              minW={0}
                          w={{ base: "full", md: "fit-content" }}
                          maxW={{ base: "100%", md: "auto" }}
                            >
                              <Box
                                w="32px"
                                h="24px"
                                borderRadius="sm"
                                border="1px solid #8A38F5"
                                overflow="hidden"
                                bg="white"
                                color="purple.700"
                                fontSize="xs"
                                fontWeight="bold"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                {asset.imgUrl &&
                                isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                                  <Image
                                    src={resolvedImageUrls[asset.imgUrl]}
                                    alt={asset.assetName || "Asset"}
                                    width={32}
                                    height={24}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text fontSize="xs" fontWeight="bold" color="purple.700">
                                    {asset?.assetName
                                      ? asset?.assetName.charAt(0).toUpperCase()
                                      : "P"}
                                  </Text>
                                )}
                              </Box>
                              <Flex direction="column" gap={0.5} minW={0} flex={1} w="full">
                                <Text
                                  fontSize="xs"
                                  color="#363636"
                                  fontWeight="600"
                                  wordBreak="break-word"
                              overflowWrap="anywhere"
                                >
                                  Personal: {asset.assetName || "Asset"}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color="gray.600"
                                  fontWeight="500"
                                >
                                  #{asset.serialNumber}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                      </Flex>
                    )}

                    {/* Company Assets */}
                    {visitor.assets.filter(
                      (asset) => asset.assetType === "Company"
                    ).length > 0 && (
                      <Flex gap={3} mb={2} flexWrap="wrap">
                        {visitor.assets
                          .filter((asset) => asset.assetType === "Company")
                          .map((asset, index) => (
                            <Flex
                              key={`company-${asset.serialNumber}-${index}`}
                              align="center"
                              gap={2}
                              bg="gray.50"
                              p={2}
                              borderRadius="md"
                              border="1px solid #e2e8f0"
                              minW={0}
                          w={{ base: "full", md: "fit-content" }}
                          maxW={{ base: "100%", md: "auto" }}
                            >
                              <Box
                                w="32px"
                                h="24px"
                                borderRadius="sm"
                                border="1px solid #8A38F5"
                                overflow="hidden"
                                bg="white"
                                color="purple.700"
                                fontSize="xs"
                                fontWeight="bold"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                {asset.imgUrl &&
                                isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                                  <Image
                                    src={resolvedImageUrls[asset.imgUrl]}
                                    alt={asset.assetName || "Asset"}
                                    width={32}
                                    height={24}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text fontSize="xs" fontWeight="bold" color="purple.700">
                                    {asset?.assetName
                                      ? asset?.assetName.charAt(0).toUpperCase()
                                      : "C"}
                                  </Text>
                                )}
                              </Box>
                              <Flex direction="column" gap={0.5} minW={0} flex={1} w="full">
                                <Text
                                  fontSize="xs"
                                  color="#363636"
                                  fontWeight="600"
                                  wordBreak="break-word"
                              overflowWrap="anywhere"
                                >
                                  Company: {asset.assetName || "Asset"}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color="gray.600"
                                  fontWeight="500"
                                >
                                  #{asset.serialNumber}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                      </Flex>
                    )}
                  </Box>
                )}

                {/* Show message if no assets or guests */}
                {(!visitor.assets || visitor.assets.length === 0) &&
                  (!visitor.guest || visitor.guest.length === 0) && (
                    <Text fontSize="sm" color="#666" fontStyle="italic">
                      No assets or guests added.
                    </Text>
                  )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Employee Info */}
        <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3} ml={6}>
          Employee Info
        </Text>
        <Box
          position="relative"
          w="full"
          maxW="280px"
          bg="#f7f7ff"
          borderRadius="lg"
          boxShadow="sm"
          px={3}
          pt={5}
          pb={2}
          mt="40px"
          minH="120px"
          mx="auto"
          mb={6}
        >
          {/* Avatar - overlaps top border, centered */}
          <Box
            position="absolute"
            top="-36px"
            left="50%"
            transform="translateX(-50%)"
            boxSize="72px"
            borderRadius="full"
            bg="#d9d9d9"
            boxShadow="md"
            zIndex={2}
            display="flex"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
          >
            {visitor.hostDetails?.profileImageUrl &&
            isValidImageUrl(
              resolvedImageUrls[visitor.hostDetails.profileImageUrl]
            ) ? (
              <Image
                src={resolvedImageUrls[visitor.hostDetails.profileImageUrl]}
                alt={visitor.hostDetails.name || "Host"}
                width={72}
                height={72}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                }}
              />
            ) : (
              <Text fontSize="lg" color="black" fontWeight="bold">
                {visitor.hostDetails?.name?.charAt(0) || "H"}
              </Text>
            )}
          </Box>
          <Box mt={10}>
            <Box
              as="dl"
              display="grid"
              gridTemplateColumns="110px 1fr"
              rowGap={2}
              columnGap={3}
              wordBreak="break-word"
            >
              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                Host Name :
              </Text>
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.hostDetails?.name || "N/A"}
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
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.hostDetails?.phoneNumber || "N/A"}
              </Text>

              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                Email :
              </Text>
              <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                {visitor.hostDetails?.email || "N/A"}
              </Text>

              <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                Status :
              </Text>
              <Text as="dd" fontSize="sm" textAlign="right">
                <Box
                  as="span"
                  color="#23A36D"
                  fontWeight="bold"
                  display="inline-block"
                >
                  {visitor.status || "Pending"}
                </Box>
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Fixed Bottom Button - Mobile Only */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        left={0}
        bottom={0}
        w="full"
        maxW="100vw"
        bgGradient="linear(to-t, #fff 80%, transparent)"
        zIndex={20}
        py={2}
      >
        <Box w="full" maxW="370px" mx="auto" px={{ base: 2, sm: 4, md: 0 }}>
          {visitor.checkInTime && !visitor.checkOutTime ? (
            <Flex direction="row" gap="14px" maxW="280px" w="full" mx="auto">
              <Button
                variant="outline"
                color="#8A38F5"
                borderColor="#8A38F5"
                borderWidth="1px"
                borderRadius="4px"
                fontWeight="bold"
                fontSize="sm"
                tabIndex={0}
                aria-label="Go Back"
                onClick={handleGoBack}
                w="full"
                flex={1}
                bg="white"
                _hover={{ bg: "#f3f2fd" }}
              >
                Back
              </Button>
              <Button
                bg="#E34935"
                color="white"
                borderRadius="4px"
                fontWeight="bold"
                fontSize="sm"
                tabIndex={0}
                aria-label="Check Out"
                onClick={handleCheckOut}
                w="full"
                flex={1}
                _hover={{ bg: "#d32f2f" }}
                loading={checkingOut}
                loadingText="Checking Out..."
              >
                Check Out
              </Button>
            </Flex>
          ) : (
            <Button
              bg="#8A38F5"
              color="white"
              borderRadius="4px"
              fontWeight="bold"
              fontSize="sm"
              tabIndex={0}
              aria-label="Go Back"
              onClick={handleGoBack}
              w="full"
              maxW="280px"
              mx="auto"
              display="block"
              _hover={{ bg: "#7a2ee6" }}
            >
              Go Back
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default VisitorPreviewPage;
