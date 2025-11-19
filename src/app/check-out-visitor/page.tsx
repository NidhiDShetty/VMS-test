"use client";
import { useState, useEffect } from "react";
import { Box, Flex, Text, Button, IconButton, Table } from "@chakra-ui/react";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
import { getVisitors } from "@/app/api/visitor/routes";
import { toaster } from "@/components/ui/toaster";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import { FiChevronLeft } from "react-icons/fi";
import { getVisitorImageBlob } from "../api/visitor-image/routes";

import DesktopHeader from "@/components/DesktopHeader";

// Helper function to navigate to visitor summary with data stored in sessionStorage
// This avoids HTTP 431 error (URL too long) when visitor data is large
const navigateToVisitorSummary = (visitor: unknown, router: ReturnType<typeof useRouter>) => {
  sessionStorage.setItem(
    "checkoutVisitorData",
    JSON.stringify({ visitor })
  );
  router.push("/visitor-check-in-summary?fromCheckout=1");
};

// HeaderBar component for mobile
const HeaderBar = () => {
  const router = useRouter();
  return (
    <Flex
      as="header"
      align="center"
      justify="center"
      w="full"
      h={{ base: "70px", md: "48px" }}
      bg="#f4edfefa"
      borderBottom="1px solid #f2f2f2"
      position="relative"
      px={0}
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
        bg="#FFFFFF"
        _hover={{ bg: 'gray.100' }}
        p={0}
        cursor="pointer"
        onClick={() => router.back()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.back(); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize="sm" color="#181a1b">Check Out / Check In List</Text>
    </Flex>
  );
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name[0]?.toUpperCase() || "?";
};

// Helper function to get color based on name
const getNameColor = (name: string): string => {
  const colors = [
    "#8A38F5",
    "#23A36D",
    "#E34935",
    "#F59E0B",
    "#3B82F6",
    "#10B981",
    "#F97316",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Helper function to format check-in time
const formatCheckInTime = (checkInTime: string | null): string => {
  if (!checkInTime) return "Not checked in";
  try {
    const date = new Date(checkInTime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Invalid date";
  }
};

interface Visitor {
  id: number;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  purposeOfVisit?: string;
  comingFrom?: string;
  companyName?: string;
  hostDetails?: string | object;
  assets?: string | Array<object>;
  guest?: string | Array<object>;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status?: string;
  date?: string;
  time?: string;
  imgUrl?: string;
}

const QrIcon = () => (
  <svg
    width="29"
    height="28"
    viewBox="0 0 29 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.16667 4.66667H12.1667V11.6667H5.16667V4.66667ZM23.8333 4.66667V11.6667H16.8333V4.66667H23.8333ZM16.8333 17.5H19.1667V15.1667H16.8333V12.8333H19.1667V15.1667H21.5V12.8333H23.8333V15.1667H21.5V17.5H23.8333V21H21.5V23.3333H19.1667V21H15.6667V23.3333H13.3333V18.6667H16.8333V17.5ZM19.1667 17.5V21H21.5V17.5H19.1667ZM5.16667 23.3333V16.3333H12.1667V23.3333H5.16667ZM7.5 7V9.33333H9.83333V7H7.5ZM19.1667 7V9.33333H21.5V7H19.1667ZM7.5 18.6667V21H9.83333V18.6667H7.5ZM5.16667 12.8333H7.5V15.1667H5.16667V12.8333ZM11 12.8333H15.6667V17.5H13.3333V15.1667H11V12.8333ZM13.3333 7H15.6667V11.6667H13.3333V7ZM2.83333 2.33333V7H0.5V2.33333C0.5 1.71449 0.745833 1.121 1.18342 0.683417C1.621 0.245833 2.21449 0 2.83333 0L7.5 0V2.33333H2.83333ZM26.1667 0C26.7855 0 27.379 0.245833 27.8166 0.683417C28.2542 1.121 28.5 1.71449 28.5 2.33333V7H26.1667V2.33333H21.5V0H26.1667ZM2.83333 21V25.6667H7.5V28H2.83333C2.21449 28 1.621 27.7542 1.18342 27.3166C0.745833 26.879 0.5 26.2855 0.5 25.6667V21H2.83333ZM26.1667 25.6667V21H28.5V25.6667C28.5 26.2855 28.2542 26.879 27.8166 27.3166C27.379 27.7542 26.7855 28 26.1667 28H21.5V25.6667H26.1667Z"
      fill="white"
    />
  </svg>
);

const RightArrowIcon = () => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 0C16.02 0 20.5 4.48 20.5 10C20.5 15.52 16.02 20 10.5 20C4.98 20 0.5 15.52 0.5 10C0.5 4.48 4.98 0 10.5 0ZM10.5 9H6.5V11H10.5V14L14.5 10L10.5 6V9Z"
      fill="#8A38F5"
    />
  </svg>
);

const VisitorRow = ({
  visitor,
  resolvedImageUrls,
}: {
  visitor: Visitor;
  resolvedImageUrls: Record<string, string>;
}) => {
  const router = useRouter();

  const getStatusBadge = (
    status: string | undefined,
    checkInTime: string | null,
    checkOutTime: string | null
  ) => {
    if (status === "CHECKED_IN" && checkInTime && !checkOutTime) {
      return { text: "Checked-in", bg: "#E6F4EA", color: "#23292e" };
    } else if (status === "CHECKED_OUT" || checkOutTime) {
      return { text: "Checked-out", bg: "#FEE2E2", color: "#DC2626" };
    } else if (status === "APPROVED") {
      return { text: "Approved", bg: "#FEF3C7", color: "#D97706" };
    } else {
      return { text: "Pending", bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const statusBadge = getStatusBadge(
    visitor.status || "PENDING",
    visitor.checkInTime || null,
    visitor.checkOutTime || null
  );

  return (
    <Flex
      align="center"
      justify="space-between"
      w="full"
      py={2}
      cursor="pointer"
      onClick={() => navigateToVisitorSummary(visitor, router)}
      tabIndex={0}
      aria-label="View visitor details"
      role="button"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          navigateToVisitorSummary(visitor, router);
      }}
    >
      <Flex align="center" gap={3}>
        <Box
          w="44px"
          h="44px"
          borderRadius="full"
          bg={
            visitor.imgUrl && resolvedImageUrls[visitor.imgUrl]
              ? "transparent"
              : getNameColor(visitor.fullName)
          }
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontWeight="bold"
          fontSize="lg"
          overflow="hidden"
          position="relative"
        >
          {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
            <Image
              src={resolvedImageUrls[visitor.imgUrl]}
              alt={visitor.fullName}
              width={44}
              height={44}
              style={{ objectFit: "cover" }}
            />
          ) : (
            getInitials(visitor.fullName)
          )}
        </Box>
        <Flex direction="column" gap={1}>
          <Text fontWeight="bold" fontSize="sm" color="#25292E">
            {visitor.fullName}
          </Text>
          <Box
            bg={statusBadge.bg}
            borderRadius="12px"
            px={3}
            py={0.5}
            display="inline-flex"
            alignItems="center"
            // minW="80px"
            h="22px"
          >
            <Text fontSize="xs" color={statusBadge.color}>
              {statusBadge.text}
            </Text>
          </Box>
          {visitor.checkInTime && (
            <Text fontSize="xs" color="gray.500">
              {formatCheckInTime(visitor.checkInTime)}
            </Text>
          )}
        </Flex>
      </Flex>
      <Box
        w="36px"
        h="36px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        cursor="pointer"
        tabIndex={0}
        aria-label="Check out visitor"
        role="button"
        _hover={{ bg: "#f3f2fd" }}
        _active={{ bg: "#ede9fe" }}
        onClick={(e) => {
          e.stopPropagation();
          navigateToVisitorSummary(visitor, router);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            navigateToVisitorSummary(visitor, router);
          }
        }}
      >
        <RightArrowIcon />
      </Box>
    </Flex>
  );
};

const CheckOutVisitor = () => {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});

  // Helper function to resolve image URLs
  const getImageUrl = async (imgUrl: string): Promise<string | null> => {
    if (!imgUrl) return null;

    // If it's already a full URL or data URL, return as is
    if (imgUrl.startsWith("http") || imgUrl.startsWith("data:")) {
      return imgUrl;
    }

    // If it's a file path, resolve it to a blob URL
    try {
      const blobUrl = await getVisitorImageBlob(imgUrl);
      return blobUrl;
    } catch (error) {
      console.error("Failed to resolve image URL:", error);
      return null;
    }
  };

  // Resolve image URLs for visitors
  useEffect(() => {
    const resolveImageUrls = async () => {
      const newResolvedUrls: Record<string, string> = {};

      for (const visitor of visitors) {
        if (visitor.imgUrl) {
          const resolvedUrl = await getImageUrl(visitor.imgUrl);
          if (resolvedUrl) {
            newResolvedUrls[visitor.imgUrl] = resolvedUrl;
          }
        }
      }

      setResolvedImageUrls(newResolvedUrls);
    };

    if (visitors.length > 0) {
      resolveImageUrls();
    }
  }, [visitors]);

  // Fetch all visitors
  const fetchVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get auth token
      const authDataRaw =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (!authDataRaw) throw new Error("No auth data found");

      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;
      if (!token) throw new Error("No token found");

      // Fetch all visitors
      const response = await getVisitors(token);

      const allVisitors = response.visitors || [];

      setVisitors(allVisitors);
    } catch (error) {
      console.error("Error fetching visitors:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch visitors.";
      setError(errorMessage);
      toaster.error({
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // Filter visitors based on search term
  const filteredVisitors = visitors.filter(
    (visitor) =>
      visitor.fullName
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(searchTerm.toLowerCase()))
    // (visitor.fullName?.toLowerCase().split(/\s+/).some(word => word.startsWith(search.toLowerCase())))
    //  ||
    //   visitor.phoneNumber.includes(searchTerm) ||
    //   (visitor.purposeOfVisit &&
    //     visitor.purposeOfVisit.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Only show checked-in visitors
  const checkedInVisitors = filteredVisitors.filter(
    (v) => v.status === "CHECKED_IN" && v.checkInTime && !v.checkOutTime
  );

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVisitors = checkedInVisitors.slice(startIndex, endIndex);

  return (
    <Flex direction="column" minH="100vh" bg="white" w="full">
      {/* Responsive Header */}
      <Box display={{ base: "block", lg: "none" }}>
        <HeaderBar />
      </Box>
      <Box display={{ base: "none", lg: "block" }}>
        <DesktopHeader notificationCount={3} />
      </Box>

      {/* Main Content Area */}
      <Box flex={1} display="flex" flexDirection="column" bg="white">
        {/* Mobile Layout */}
        <Box
          display={{ base: "flex", lg: "none" }}
          flex={1}
          flexDirection="column"
          bg="white"
        >
          <Box
            w="full"
            maxW="390px"
            mx="auto"
            px={{ base: 4, sm: 6 }}
            pt={4}
            pb={24}
          >
            {/* Scan QR Button */}
            <Button
              w="full"
              h="52px"
              bg="#8A38F5"
              color="#fff"
              fontWeight="bold"
              fontSize="md"
              borderRadius="md"
              mb={6}
              _hover={{ bg: "#7a2ee6" }}
              _active={{ bg: "#6c28d9" }}
              onClick={() => router.push("/scanner?fromCheckout=1")}
            >
              <Box as="span" mr={2} display="inline-flex">
                <QrIcon />
              </Box>
              Scan QR
            </Button>

            {/* Check-In List Title */}
            <Text fontWeight="bold" fontSize="md" color="#381A63" mb={2}>
              Checked-in Visitors
            </Text>

            {/* Search Bar */}
            <Box mb={4}>
              <SearchBar
                placeholder="Search checked-in visitors..."
                // onFilterClick={undefined}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Box>

            {loading ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">Loading checked-in visitors...</Text>
              </Box>
            ) : error ? (
              <Box textAlign="center" py={8}>
                <Text color="red.500" fontSize="sm" mb={2}>
                  Error: {error}
                </Text>
                <Button size="sm" colorScheme="blue" onClick={fetchVisitors}>
                  Try Again
                </Button>
              </Box>
            ) : checkedInVisitors.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" fontSize="sm">
                  {searchTerm
                    ? "No checked-in visitors found matching your search."
                    : "No checked-in visitors found."}
                </Text>
                <Text color="gray.400" fontSize="sm" mt={2}>
                  All visitors have been checked out or none are currently
                  checked in.
                </Text>
              </Box>
            ) : (
              <>
                {/* Checked-in Visitors */}
                <Text color="#8A38F5" fontWeight="bold" fontSize="sm" mb={2}>
                  Checked-in ({checkedInVisitors.length})
                </Text>
                <Box>
                  {checkedInVisitors.map((visitor) => (
                    <VisitorRow
                      key={visitor.id}
                      visitor={visitor}
                      resolvedImageUrls={resolvedImageUrls}
                    />
                  ))}
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* Web Layout */}
        <Box
          display={{ base: "none", lg: "flex" }}
          flex={1}
          flexDirection="column"
          bg="#f4edfefa"
        >
          {/* Page Title and Back Button */}
          <Flex
            align="center"
            justify="space-between"
            px={8}
            py={2}
            bg="#f4edfefa"
          >
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
              <Text fontSize="lg" color="#18181b" fontWeight="bold">
                Check Out / Check In List
              </Text>
            </Flex>

            <Flex align="center" gap={4}>
              {/* Enter ID Button for Web */}
              <Button
                bg="#8A38F5"
                color="#fff"
                fontWeight="bold"
                fontSize="sm"
                borderRadius="md"
                px={4}
                py={2}
                h="40px"
                _hover={{ bg: "#7a2ee6" }}
                _active={{ bg: "#6c28d9" }}
                onClick={() => router.push("/scanner?fromCheckout=1")}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <QrIcon />
                Enter ID
              </Button>

              {/* Search Bar */}
              <Box w="300px">
                <SearchBar
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search...."
                />
              </Box>
            </Flex>
          </Flex>

          {/* Checked-in Visitors Header */}
          <Box px={8} py={3} bg="#f4edfefa">
            <Text fontWeight="bold" fontSize="md" color="#381A63">
              Checked-in Visitors
            </Text>
          </Box>

          {/* Table */}
          <Box bg="#f4edfefa" flex={1} px={6} py={4}>
            <Box bg="white" borderRadius="lg" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)" overflow="hidden">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg="#8A37F7">
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={4}
                      px={6}
                    >
                      Name
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={4}
                      px={6}
                    >
                      Checked-In
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={4}
                      px={6}
                    >
                      Action
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {loading ? (
                    <Table.Row bg="white">
                      <Table.Cell colSpan={3} py={8} textAlign="center">
                        <Text color="gray.500">
                          Loading checked-in visitors...
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : error ? (
                    <Table.Row bg="white">
                      <Table.Cell colSpan={3} py={8} textAlign="center">
                        <Text color="red.500" fontSize="sm" mb={2}>
                          Error: {error}
                        </Text>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={fetchVisitors}
                        >
                          Try Again
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ) : paginatedVisitors.length === 0 ? (
                    <Table.Row bg="white">
                      <Table.Cell colSpan={3} py={8} textAlign="center">
                        <Text color="gray.500" fontSize="sm">
                          {searchTerm
                            ? "No checked-in visitors found matching your search."
                            : "No checked-in visitors found."}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedVisitors.map((visitor) => (
                      <Table.Row
                        key={visitor.id}
                        bg="white"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Table.Cell py={4} px={6}>
                          <Flex align="center" gap={3}>
                            <Box
                              w="36px"
                              h="36px"
                              borderRadius="full"
                              bg={
                                visitor.imgUrl &&
                                resolvedImageUrls[visitor.imgUrl]
                                  ? "transparent"
                                  : getNameColor(visitor.fullName)
                              }
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="white"
                              fontWeight="bold"
                              fontSize="sm"
                              overflow="hidden"
                              position="relative"
                            >
                              {visitor.imgUrl &&
                              resolvedImageUrls[visitor.imgUrl] ? (
                                <Image
                                  src={resolvedImageUrls[visitor.imgUrl]}
                                  alt={visitor.fullName}
                                  width={36}
                                  height={36}
                                  style={{ objectFit: "cover" }}
                                />
                              ) : (
                                getInitials(visitor.fullName)
                              )}
                            </Box>
                            <Text
                              color="#3B82F6"
                              fontWeight="bold"
                              textDecoration="underline"
                              cursor="pointer"
                              onClick={() => {
                                // Store visitor data in sessionStorage to avoid HTTP 431 error (URL too long)
                                sessionStorage.setItem(
                                  "checkoutVisitorData",
                                  JSON.stringify({ visitor })
                                );
                                router.push(
                                  `/visitor-check-in-summary?fromCheckout=1`
                                );
                              }}
                            >
                              {visitor.fullName}
                            </Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell py={4} px={6}>
                          <Text color="#18181b">
                            {visitor.checkInTime
                              ? formatCheckInTime(visitor.checkInTime)
                              : "-"}
                          </Text>
                        </Table.Cell>
                        <Table.Cell py={4} px={6}>
                          <Box
                            w="36px"
                            h="36px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            borderRadius="full"
                            cursor="pointer"
                            tabIndex={0}
                            aria-label="Check out visitor"
                            role="button"
                            _hover={{ bg: "#f3f2fd" }}
                            _active={{ bg: "#ede9fe" }}
                            onClick={() => navigateToVisitorSummary(visitor, router)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                navigateToVisitorSummary(visitor, router);
                              }
                            }}
                          >
                            <RightArrowIcon />
                          </Box>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          {/* Pagination - Only show when there are visitors */}
          {checkedInVisitors.length > 0 && (
            <Box bg="#f4edfefa" px={6} py={4}>
              <Flex align="center" justify="center">
                <Text fontSize="sm" color="#666">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, checkedInVisitors.length)} of{" "}
                  {checkedInVisitors.length} records
                </Text>
              </Flex>
            </Box>
          )}

          {/* Decorative Logo */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={-1}
            pointerEvents="none"
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default CheckOutVisitor;
