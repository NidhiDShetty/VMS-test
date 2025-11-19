"use client";

import { Box, Flex, Text, IconButton, Button } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { FaArrowAltCircleRight } from "react-icons/fa";
import { ReactNode, useState, KeyboardEvent, useEffect } from "react";
import SearchBar from "@/components/ui/SearchBar";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import { getVisitorImageBlob } from "../api/visitor-image/routes";
import { getVisitorAssetImageBlob } from "../api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "../api/visitor-guests/routes";

import DesktopHeader from "@/components/DesktopHeader";
import { FRONTEND_URL, INTERNAL_ROUTES } from "@/lib/server-urls";
// Types for visitor data
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
}

interface VisitorGroup {
  group: string;
  visitors: Visitor[];
}

const tabList = [
  { key: "all", label: "All Visitors", ariaLabel: "Show all visitors" },
  {
    key: "checked-in",
    label: "Checked-in",
    ariaLabel: "Show checked-in visitors",
  },
  {
    key: "checked-out",
    label: "Checked-out",
    ariaLabel: "Show checked-out visitors",
  },
];

type VisitorTabType = "all" | "checked-in" | "checked-out";

// Function to get first initial from full name
const getInitials = (fullName: string): string => {
  if (!fullName) return "?";

  return fullName.trim().charAt(0).toUpperCase();
};

// Function to get the relevant timestamp for grouping based on status
const getRelevantTimestamp = (visitor: Visitor): string | null => {
  if (visitor.status === "CHECKED_IN" || visitor.status === "checked_in") {
    return visitor.checkInTime || visitor.date; // Fallback to date if no check-in time
  } else if (
    visitor.status === "CHECKED_OUT" ||
    visitor.status === "checked_out"
  ) {
    return visitor.checkOutTime || visitor.checkInTime || visitor.date; // Prefer check-out, then check-in, then date
  }
  return visitor.date; // For pending or other statuses, use the original date
};

// Function to group visitors by timestamp
const groupVisitorsByTimestamp = (visitors: Visitor[]): VisitorGroup[] => {
  const groups: { [key: string]: Visitor[] } = {};

  visitors.forEach((visitor) => {
    const timestamp = getRelevantTimestamp(visitor);
    if (!timestamp) return;

    const dateKey = new Date(timestamp).toDateString(); // Use date string as key
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(visitor);
  });

  // Convert to array and sort by timestamp (most recent first)
  return Object.entries(groups)
    .map(([dateKey, visitors]) => ({
      group: formatTimestampGroup(dateKey, visitors.length),
      visitors: visitors.sort((a, b) => {
        const timestampA = getRelevantTimestamp(a);
        const timestampB = getRelevantTimestamp(b);
        if (!timestampA || !timestampB) return 0;
        return new Date(timestampB).getTime() - new Date(timestampA).getTime();
      }),
    }))
    .sort((a, b) => {
      // Sort by date, with "Today" being first
      if (a.group.includes("Today")) return -1;
      if (b.group.includes("Today")) return 1;
      const dateA = new Date(
        a.visitors[0]
          ? getRelevantTimestamp(a.visitors[0]) || a.visitors[0].date
          : ""
      );
      const dateB = new Date(
        b.visitors[0]
          ? getRelevantTimestamp(b.visitors[0]) || b.visitors[0].date
          : ""
      );
      return dateB.getTime() - dateA.getTime();
    });
};

// Function to format timestamp group with count
const formatTimestampGroup = (dateKey: string, count: number): string => {
  const today = new Date();
  const visitorDate = new Date(dateKey);

  // Format count with leading zero for single digits
  const formattedCount = count.toString().padStart(2, "0");

  if (isSameDay(today, visitorDate)) {
    return `Today (${formattedCount})`;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(yesterday, visitorDate)) {
    return `Yesterday (${formattedCount})`;
  }

  // Format as "Day, DD/MM/YYYY (count)"
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dayName = dayNames[visitorDate.getDay()];
  const formattedDate = visitorDate.toLocaleDateString("en-GB");
  return `${dayName}, ${formattedDate} (${formattedCount})`;
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Format check-in time - show blank if not checked in yet
const formatCheckInTime = (checkInTime: string | null | undefined): string => {
  if (checkInTime) {
    const date = new Date(checkInTime);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return ""; // Return blank if not checked in yet
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
  return "Not checked out";
};

// Function to get display date based on visitor status and timestamps
const getDisplayDate = (visitor: Visitor): string => {
  const timestamp = getRelevantTimestamp(visitor);
  if (!timestamp) return "Unknown";

  const visitorDate = new Date(timestamp);
  const today = new Date();

  if (isSameDay(today, visitorDate)) {
    return "Today";
  }

  return visitorDate.toLocaleDateString("en-GB");
};

// API function to fetch visitors
const fetchVisitors = async (): Promise<Visitor[]> => {
  try {
    const token = JSON.parse(localStorage.getItem("authData") || "{}")?.token;
    if (!token) throw new Error("Token not found in localStorage");

    const response = await fetch(`${FRONTEND_URL}/api/visitors-log/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch visitors");
    }

    const data = await response.json();
    return data.visitors || data || [];
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return [];
  }
};

const VisitorsLogPage = (): ReactNode => {
  const router = useRouter();
  const {} = useDeviceDetection();
  const [activeTab, setActiveTab] = useState<VisitorTabType>("all");
  const [search, setSearch] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});

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

  // Fetch visitors on component mount
  useEffect(() => {
    const loadVisitors = async () => {
      setLoading(true);
      setError(null);
      try {
        const visitorsData = await fetchVisitors();
        setVisitors(visitorsData);
      } catch (err) {
        setError("Failed to load visitors");
        console.error("Error loading visitors:", err);
      } finally {
        setLoading(false);
      }
    };

    loadVisitors();
  }, []);

  // Resolve image URLs when visitors change
  useEffect(() => {
    const resolveImageUrls = async () => {
      if (!visitors.length) return;

      const urls: Record<string, string> = {};

      // Resolve visitor image URLs
      for (const visitor of visitors) {
        if (visitor.imgUrl) {
          const resolvedUrl = await getImageUrl(visitor.imgUrl, "visitor");
          if (resolvedUrl) {
            urls[visitor.imgUrl] = resolvedUrl;
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [visitors]);

  const handleTabChange = (tab: VisitorTabType) => setActiveTab(tab);
  const handleTabKeyDown =
    (tab: VisitorTabType) => (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveTab(tab);
      }
    };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Filter visitors based on search and active tab
  const filteredVisitors = visitors.filter((visitor) => {
    const matchesSearch = visitor.fullName
      ?.toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(search.toLowerCase()));
    // (emp.name && emp.name.toLowerCase().split(/\s+/).some(word => word.startsWith(term)))
    // ||
    // (visitor.hostDetails?.name?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    // (visitor.purposeOfVisit?.toLowerCase().includes(search.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    // Only show checked-in and checked-out visitors, exclude pending
    const isCheckedIn =
      visitor.status === "CHECKED_IN" ||
      visitor.status === "checked_in" ||
      visitor.status === "approved";
    const isCheckedOut =
      visitor.status === "CHECKED_OUT" || visitor.status === "checked_out";

    // Filter based on status field from backend database
    if (activeTab === "checked-in") {
      return isCheckedIn;
    } else if (activeTab === "checked-out") {
      return isCheckedOut;
    }

    // For "all" tab, show both checked-in and checked-out visitors
    return isCheckedIn || isCheckedOut;
  });

  // Group filtered visitors by timestamp
  const filteredVisitorData = groupVisitorsByTimestamp(filteredVisitors);

  if (loading) {
    return (
      <Box
        w="100vw"
        h="100vh"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text>Loading visitors...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        w="100vw"
        h="100vh"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box
      w="100vw"
      h="100vh"
      overflowX="hidden"
      css={{
        "& *": {
          maxWidth: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      <Flex
        direction="column"
        minH="100vh"
        bg={{ base: "#f8fafc", lg: "#f7f2fd" }}
        className="w-full"
        overflowX="hidden"
      >
        {/* Responsive Header */}
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          top={0}
          left={0}
          right={0}
          zIndex={1000}
        >
          {/* Mobile Header */}
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
              bg="transparent"
              _hover={{ bg: 'gray.100' }}
              p={0}
              cursor="pointer"
              onClick={() => router.push(INTERNAL_ROUTES.DASHBOARD)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push(INTERNAL_ROUTES.DASHBOARD); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
            <Text fontWeight="bold" fontSize="sm" color="#181a1b">Check Out/ Check In List</Text>
          </Flex>
        </Box>

        {/* Web Header */}
        <DesktopHeader notificationCount={3} />

        {/* Main Content Area */}
        <Box
          flex={1}
          pt={{ base: "0px", lg: "0px" }}
          display="flex"
          flexDirection="column"
          overflowX="hidden"
        >
          {/* Mobile Layout */}
          <Box display={{ base: "block", lg: "none" }} w="full" mt="75px">
            <Box
              w="100%"
              px={0}
              h="calc(100vh - 56px)"
              bg="white"
              display="flex"
              flexDirection="column"
              overflowX="hidden"
              overflowY="hidden"
              className="shadow-none"
              css={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {/* Custom Tabs */}
              <Flex direction="column" w="full" borderBottom="1px solid #eee">
                <Flex
                  as="nav"
                  role="tablist"
                  flexDirection="row"
                  gap={0}
                  px={3}
                  pt={0}
                  align="center"
                  justify="space-between"
                  w="full"
                  position="relative"
                >
                  {tabList.map(({ key, label, ariaLabel }) => {
                    const isActive = activeTab === key;
                    return (
                      <Button
                        key={key}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={ariaLabel}
                        tabIndex={0}
                        onClick={() => handleTabChange(key as VisitorTabType)}
                        onKeyDown={handleTabKeyDown(key as VisitorTabType)}
                        fontWeight={isActive ? "bold" : "normal"}
                        color={isActive ? "#8A38F5" : "#18181b"}
                        bg="transparent"
                        border="none"
                        outline="none"
                        boxShadow="none"
                        position="relative"
                        px={0}
                        py={1}
                        cursor="pointer"
                        flex="1"
                        textAlign="center"
                        _focus={{
                          boxShadow: "none",
                          outline: "none",
                          border: "none",
                        }}
                        _active={{
                          bg: "transparent",
                          boxShadow: "none",
                          outline: "none",
                          border: "none",
                        }}
                        _selected={{
                          boxShadow: "none",
                          outline: "none",
                          border: "none",
                        }}
                        _hover={{
                          bg: "transparent",
                          color: isActive ? "#8A38F5" : "#8A38F5",
                        }}
                      >
                        <Text
                          fontSize="md"
                          fontWeight={isActive ? "bold" : "normal"}
                          color={isActive ? "#8A38F5" : "#18181b"}
                        >
                          {label}
                        </Text>
                        {isActive && (
                          <Box
                            position="absolute"
                            left={0}
                            right={0}
                            bottom={-1}
                            h="3px"
                            bg="#8A38F5"
                            borderRadius="2px"
                            w="full"
                          />
                        )}
                      </Button>
                    );
                  })}
                </Flex>
              </Flex>

              {/* Search & Filter */}
              <Box px={3} pt={3} pb={1}>
                <SearchBar
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search visitors..."
                />
              </Box>

              {/* Visitor Groups - Mobile View */}
              <Box
                flex="1"
                overflowY="auto"
                px={2}
                pt={2}
                pb={4}
                className="space-y-15"
              >
                {filteredVisitorData.length === 0 ? (
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    h="200px"
                    px={4}
                  >
                    <Text color="gray.500" textAlign="center">
                      {search
                        ? "No visitors found matching your search."
                        : "No visitors found."}
                    </Text>
                  </Box>
                ) : (
                  filteredVisitorData.map((group) => (
                    <Box key={group.group} className="px-4 py-2">
                      <Text
                        fontSize="md"
                        fontWeight="bold"
                        color="#9747ff"
                        className="mb-1"
                      >
                        {group.group}
                      </Text>
                      <Box className="space-y-[15px]">
                        {group.visitors.map((visitor) => (
                          <Flex
                            py={3}
                            key={visitor.id}
                            align="flex-start"
                            justify="space-between"
                            className="gap-[11px]"
                            tabIndex={0}
                            aria-label={`View details for ${visitor.fullName}`}
                            role="button"
                            _hover={{ bg: "gray.50" }}
                            borderRadius="md"
                            px={3}
                            onClick={() => {
                              router.push(
                                `/visitors-log/preview/${visitor.id}`
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                router.push(
                                  `/visitors-log/preview/${visitor.id}`
                                );
                              }
                            }}
                          >
                            {/* Avatar and Info */}
                            <Flex
                              align="flex-start"
                              className="gap-2"
                              flex="1"
                              minW={0}
                            >
                              <Box
                                w="48px"
                                h="48px"
                                borderRadius="full"
                                overflow="hidden"
                                bg="#d9d9d9"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                {visitor.imgUrl &&
                                isValidImageUrl(
                                  resolvedImageUrls[visitor.imgUrl]
                                ) ? (
                                  <Image
                                    src={resolvedImageUrls[visitor.imgUrl]}
                                    alt={visitor.fullName || "Visitor"}
                                    width={48}
                                    height={48}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text
                                    fontSize="md"
                                    fontWeight="bold"
                                    color="black"
                                  >
                                    {getInitials(visitor.fullName)}
                                  </Text>
                                )}
                              </Box>
                              <Box flex="1" minW={0}>
                                <Text
                                  fontWeight="bold"
                                  fontSize="sm"
                                  color="#18181b"
                                  truncate
                                >
                                  {visitor.fullName}
                                </Text>

                                {/* Status Badge - Show based on status from backend */}
                                <Flex
                                  align="center"
                                  bg="#F2F2F2"
                                  borderRadius="12px"
                                  px={2}
                                  py={1}
                                  minH="22px"
                                  w="fit-content"
                                  className="gap-2 mt-1"
                                >
                                  {/* Date based on relevant timestamp */}
                                  <Text
                                    fontWeight="600"
                                    fontSize="xs"
                                    color="#18181B"
                                  >
                                    {getDisplayDate(visitor)}
                                  </Text>

                                  {/* Status-based display with timestamps */}
                                  {(visitor.status === "CHECKED_IN" ||
                                    visitor.status === "checked_in") && (
                                    <Flex align="center" className="gap-1">
                                      <svg
                                        width="10"
                                        height="8"
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
                                        fontWeight="600"
                                        fontSize="xs"
                                        color="#18181B"
                                      >
                                        {formatCheckInTime(
                                          visitor.checkInTime
                                        ) || "Checked In"}
                                      </Text>
                                    </Flex>
                                  )}

                                  {/* Check-out section (only if checked out) */}
                                  {(visitor.status === "CHECKED_OUT" ||
                                    visitor.status === "checked_out") && (
                                    <Flex align="center" className="gap-2">
                                      {/* Check-in time */}
                                      <Flex align="center" className="gap-1">
                                        <svg
                                          width="10"
                                          height="8"
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
                                          fontWeight="600"
                                          fontSize="xs"
                                          color="#18181B"
                                        >
                                          {formatCheckInTime(
                                            visitor.checkInTime
                                          ) || "Checked In"}
                                        </Text>
                                      </Flex>
                                      {/* Check-out time */}
                                      <Flex align="center" className="gap-1">
                                        <svg
                                          width="10"
                                          height="8"
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
                                          fontWeight="600"
                                          fontSize="xs"
                                          color="#18181B"
                                        >
                                          {formatCheckOutTime(
                                            visitor.checkOutTime
                                          )}
                                        </Text>
                                      </Flex>
                                    </Flex>
                                  )}

                                  {/* Pending status */}
                                  {(visitor.status === "PENDING" ||
                                    visitor.status === "pending") && (
                                    <Flex align="center" className="gap-1">
                                      <Box
                                        w="8px"
                                        h="8px"
                                        borderRadius="full"
                                        bg="#FFA500"
                                      />
                                      <Text
                                        fontWeight="600"
                                        fontSize="sm"
                                        color="#18181B"
                                      >
                                        Pending
                                      </Text>
                                    </Flex>
                                  )}
                                </Flex>
                              </Box>
                            </Flex>

                            {/* Action Button */}
                            <IconButton
                              aria-label={`Open visitor preview for ${visitor.fullName}`}
                              tabIndex={0}
                              size="md"
                              bg="transparent"
                              color="#9747ff"
                              _hover={{ color: "#7a2ee6" }}
                              className="ml-auto"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/visitors-log/preview/${visitor.id}`
                                );
                              }}
                            >
                              <FaArrowAltCircleRight />
                            </IconButton>
                          </Flex>
                        ))}
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Box>
          </Box>

          {/* Web Layout */}
          <Box
            display={{ base: "none", lg: "flex" }}
            flex={1}
            bg="transparent"
            flexDirection="column"
          >
            {/* Page Title and Search */}
            <Flex
              align="center"
              justify="space-between"
              p='16px'
              bg="#f7f2fd"
            >
              <Flex align="center" gap={4}>
                <Button
                  variant="ghost"
                  onClick={() => router.push(INTERNAL_ROUTES.DASHBOARD)}
                  p={2}
                  bg='#FFFFFF'
                  _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M15 18l-6-6 6-6"
                      stroke="#18181B"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
                <Text fontSize="lg" color="#18181b" fontWeight="bold">
                  Check Out / Check In List
                </Text>
              </Flex>

              <Flex align="center" gap={4}>
                {/* Search Bar */}
                <Box w="300px">
                  <SearchBar
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Search...."
                  />
                </Box>
              </Flex>
            </Flex>

            {/* Custom Tabs for Web */}
            <Flex direction="column" w="full" borderBottom="1px solid #eee">
              <Flex
                as="nav"
                role="tablist"
                flexDirection="row"
                gap={0}
                px={0}
                pt={1}
                align="center"
                justify="space-between"
                w="full"
                position="relative"
              >
                {tabList.map(({ key, label, ariaLabel }) => {
                  const isActive = activeTab === key;
                  return (
                    <Button
                      key={key}
                      role="tab"
                      aria-selected={isActive}
                      aria-label={ariaLabel}
                      tabIndex={0}
                      onClick={() => handleTabChange(key as VisitorTabType)}
                      onKeyDown={handleTabKeyDown(key as VisitorTabType)}
                      fontWeight={isActive ? "bold" : "normal"}
                      color={isActive ? "#8A38F5" : "#18181b"}
                      bg="transparent"
                      border="none"
                      outline="none"
                      boxShadow="none"
                      position="relative"
                      px={0}
                      py={2}
                      cursor="pointer"
                      textAlign="center"
                      flex="1"
                      _focus={{
                        boxShadow: "none",
                        outline: "none",
                        border: "none",
                      }}
                      _active={{
                        bg: "transparent",
                        boxShadow: "none",
                        outline: "none",
                        border: "none",
                      }}
                      _selected={{
                        boxShadow: "none",
                        outline: "none",
                        border: "none",
                      }}
                      _hover={{
                        bg: "transparent",
                        color: isActive ? "#8A38F5" : "#8A38F5",
                      }}
                    >
                      <Text
                        fontSize="md"
                        fontWeight={isActive ? "bold" : "normal"}
                        color={isActive ? "#8A38F5" : "#18181b"}
                      >
                        {label}
                      </Text>
                      {isActive && (
                        <Box
                          position="absolute"
                          left={0}
                          right={0}
                          bottom={-1}
                          h="3px"
                          bg="#8A38F5"
                          borderRadius="2px"
                          w="full"
                        />
                      )}
                    </Button>
                  );
                })}
              </Flex>
            </Flex>

            {/* Table View - Desktop */}
            <Box flex="1" overflowY="auto" px={4} pb={4} pt={4}>
              {filteredVisitors.length === 0 ? (
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  h="200px"
                  bg="white"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text color="gray.500" fontSize="md">
                    {search
                      ? "No visitors found matching your search."
                      : "No visitors found."}
                  </Text>
                </Box>
              ) : (
                <Box
                  overflowX="hidden"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="white"
                  position="relative"
                  zIndex={1}
                >
                  <Box as="table" w="full">
                    <Box as="thead" bg="#8A37F7">
                      <Box as="tr">
                        <Box
                          as="th"
                          px={4}
                          py={4}
                          textAlign="left"
                          fontWeight="bold"
                          color="white"
                          fontSize="md"
                          borderBottom="none"
                        >
                          Name
                        </Box>
                        <Box
                          as="th"
                          px={4}
                          py={4}
                          textAlign="left"
                          fontWeight="bold"
                          color="white"
                          fontSize="md"
                          borderBottom="none"
                        >
                          Date
                        </Box>
                        <Box
                          as="th"
                          px={4}
                          py={4}
                          textAlign="left"
                          fontWeight="bold"
                          color="white"
                          fontSize="md"
                          borderBottom="none"
                        >
                          Check-in Time
                        </Box>
                        <Box
                          as="th"
                          px={4}
                          py={4}
                          textAlign="left"
                          fontWeight="bold"
                          color="white"
                          fontSize="md"
                          borderBottom="none"
                        >
                          Check-out Time
                        </Box>
                        <Box
                          as="th"
                          px={4}
                          py={4}
                          textAlign="center"
                          fontWeight="bold"
                          color="white"
                          fontSize="md"
                          borderBottom="none"
                        >
                          Actions
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {filteredVisitors.map((visitor) => (
                        <Box
                          as="tr"
                          key={visitor.id}
                          _hover={{ bg: "gray.50" }}
                          cursor="pointer"
                          onClick={() => {
                            router.push(`/visitors-log/preview/${visitor.id}`);
                          }}
                          onKeyDown={(
                            e: KeyboardEvent<HTMLTableRowElement>
                          ) => {
                            if (e.key === "Enter" || e.key === " ") {
                              router.push(
                                `/visitors-log/preview/${visitor.id}`
                              );
                            }
                          }}
                          tabIndex={0}
                          aria-label={`View details for ${visitor.fullName}`}
                          role="button"
                          borderBottom="1px solid"
                          borderColor="gray.100"
                        >
                          <Box as="td" px={4} py={4}>
                            <Flex align="center" gap={3}>
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                overflow="hidden"
                                bg="#d9d9d9"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                {visitor.imgUrl &&
                                isValidImageUrl(
                                  resolvedImageUrls[visitor.imgUrl]
                                ) ? (
                                  <Image
                                    src={resolvedImageUrls[visitor.imgUrl]}
                                    alt={visitor.fullName || "Visitor"}
                                    width={40}
                                    height={40}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="black"
                                  >
                                    {getInitials(visitor.fullName)}
                                  </Text>
                                )}
                              </Box>
                              <Text
                                fontWeight="bold"
                                fontSize="sm"
                                color="#18181b"
                              >
                                {visitor.fullName}
                              </Text>
                            </Flex>
                          </Box>
                          <Box as="td" px={4} py={4}>
                            <Text fontSize="sm" color="#18181b">
                              {getDisplayDate(visitor)}
                            </Text>
                          </Box>
                          <Box as="td" px={4} py={4}>
                            {visitor.status === "CHECKED_IN" ||
                            visitor.status === "checked_in" ||
                            visitor.status === "CHECKED_OUT" ||
                            visitor.status === "checked_out" ? (
                              <Flex align="center" gap={2}>
                                <svg
                                  width="12"
                                  height="10"
                                  viewBox="0 0 14 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
                                    fill="#23A36D"
                                  />
                                </svg>
                                <Text fontSize="sm" color="#18181b">
                                  {formatCheckInTime(visitor.checkInTime) ||
                                    "Checked In"}
                                </Text>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Not checked in
                              </Text>
                            )}
                          </Box>
                          <Box as="td" px={4} py={4}>
                            {visitor.status === "CHECKED_OUT" ||
                            visitor.status === "checked_out" ? (
                              <Flex align="center" gap={2}>
                                <svg
                                  width="12"
                                  height="10"
                                  viewBox="0 0 14 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
                                    fill="#E34935"
                                  />
                                </svg>
                                <Text fontSize="sm" color="#18181b">
                                  {formatCheckOutTime(visitor.checkOutTime)}
                                </Text>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Not checked out
                              </Text>
                            )}
                          </Box>
                          <Box as="td" px={4} py={4} textAlign="center">
                            <IconButton
                              aria-label={`Open visitor preview for ${visitor.fullName}`}
                              tabIndex={0}
                              size="sm"
                              bg="transparent"
                              color="#9747ff"
                              _hover={{ color: "#7a2ee6" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/visitors-log/preview/${visitor.id}`
                                );
                              }}
                            >
                              <FaArrowAltCircleRight />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Background Logo - Web Only */}
              <Box
                position="fixed"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={0}
                pointerEvents="none"
                display={{ base: "none", lg: "flex" }}
                justifyContent="center"
                alignItems="center"
              >
                <Box transform="scale(5)" opacity={0.15}>
                  <Logo />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default VisitorsLogPage;
