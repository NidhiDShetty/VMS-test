"use client";
import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiArrowLeft, FiSearch, FiChevronLeft } from "react-icons/fi";
import { FaArrowAltCircleRight } from "react-icons/fa";
import Image from "next/image";
import { getVisitorsByHost } from "@/app/api/visitor";
import { getVisitorImageBlob } from "@/app/api/visitor-image/routes";
import { useUserData } from "@/lib/hooks/useUserData";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";
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

const TABS = [
  { label: "All Visitors", value: "all-visitors" },
  { label: "My Invites", value: "my-invites" },
  { label: "Visitor Request", value: "visitor-request" },
];

const VISITOR_REQUEST_TABS = [
  { label: "Pending", value: "PENDING" },
  { label: "Checked-In", value: "CHECKED_IN" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Completed", value: "COMPLETED" },
];

// WebHeader component removed - using DesktopHeader instead

// Auto-reload configuration
const AUTO_RELOAD_CONFIG = {
  // Refresh every 30 seconds when app is active
  ACTIVE_INTERVAL: 30000,
  // Refresh every 2 minutes when app is in background
  BACKGROUND_INTERVAL: 120000,
  // Refresh every 10 seconds when on visitor-request tab (more frequent for real-time updates)
  VISITOR_REQUEST_INTERVAL: 10000,
};

const MainPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all-visitors");
  const [visitorRequestTab, setVisitorRequestTab] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAppActive, setIsAppActive] = useState(true);
  const [showScrollRefresh, setShowScrollRefresh] = useState(false);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<Record<string, string>>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useUserData();

  // Refs for managing intervals and preventing memory leaks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRefreshing = useRef(false);



  useEffect(() => {
    if (searchParams.get("request") === "1") {
      setActiveTab("visitor-request");
    }
  }, [searchParams]);




  // Fetch visitors data
  const fetchVisitors = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      // setIsAutoRefreshing(true); // This line is removed
    }
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
      setVisitors(response.visitors || []);
      // setLastRefresh(new Date()); // This line is removed
    } catch (err) {
      console.error("Error fetching visitors:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch visitors");
    } finally {
      if (showLoading) {
        setLoading(false);
      } else {
        // setIsAutoRefreshing(false); // This line is removed
      }
    }
  }, []);

  // Setup auto-reload intervals
  const setupAutoReload = useCallback(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Determine refresh interval based on current state
    let interval: number;
    if (activeTab === "visitor-request") {
      interval = AUTO_RELOAD_CONFIG.VISITOR_REQUEST_INTERVAL;
    } else if (isAppActive) {
      interval = AUTO_RELOAD_CONFIG.ACTIVE_INTERVAL;
    } else {
      interval = AUTO_RELOAD_CONFIG.BACKGROUND_INTERVAL;
    }

    // Set new interval
    intervalRef.current = setInterval(() => {
      fetchVisitors(false); // Don't show loading spinner for auto-refresh
    }, interval);

    // Auto-reload is now completely silent
  }, [activeTab, isAppActive, fetchVisitors]);

  // Handle app visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsAppActive(isVisible);

      if (isVisible) {
        // App became visible, refresh data immediately and reset interval
        fetchVisitors(false);
        setupAutoReload();
      }
    };

    const handleFocus = () => {
      setIsAppActive(true);
      // Refresh data when window gains focus
      fetchVisitors(false);
      setupAutoReload();
    };

    const handleBlur = () => {
      setIsAppActive(false);
      setupAutoReload();
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, [fetchVisitors, setupAutoReload]);

  // Setup auto-reload when component mounts or dependencies change
  useEffect(() => {
    if (!isInitialMount.current) {
      setupAutoReload();
    }
  }, [setupAutoReload]);

  // Initial data fetch and auto-reload setup
  useEffect(() => {
    fetchVisitors();
    setupAutoReload();
    isInitialMount.current = false;

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchVisitors, setupAutoReload]);

  // Scroll-based refresh functionality
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || isRefreshing.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrollPercentage =
        (scrollTop / (scrollHeight - clientHeight)) * 100;

      // Trigger refresh when user scrolls down more than 80% of the content
      if (scrollPercentage > 80 && !isRefreshing.current) {
        isRefreshing.current = true;
        setShowScrollRefresh(true);

        // Add a small delay to make it feel more natural
        setTimeout(() => {
          // Call fetchVisitors with showLoading=false to avoid loading states
          fetchVisitors(false);
          isRefreshing.current = false;

          // Hide the indicator after a short delay
          setTimeout(() => {
            setShowScrollRefresh(false);
          }, 1000);
        }, 300);
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", handleScroll);
      }
    };
  }, [fetchVisitors]);

  // Resolve visitor image URLs when visitors data changes
  useEffect(() => {
    const resolveVisitorImages = async () => {
      if (!visitors.length) return;

      const urls: Record<string, string> = {};
      
      for (const visitor of visitors) {
        if (visitor.imgUrl) {
          // If it's already a valid URL, use it directly
          if (visitor.imgUrl.startsWith("blob:") || visitor.imgUrl.startsWith("data:") || visitor.imgUrl.startsWith("http")) {
            urls[visitor.imgUrl] = visitor.imgUrl;
            continue;
          }

          // If it's a file path, get the blob URL
          try {
            const blobUrl = await getVisitorImageBlob(visitor.imgUrl);
            if (blobUrl) {
              urls[visitor.imgUrl] = blobUrl;
            }
          } catch (error) {
            console.error(`Failed to resolve image for visitor ${visitor.id}:`, error);
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveVisitorImages();
  }, [visitors]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Get current user ID from user data
  const getCurrentUserId = () => {
    return userData?.userId || null;
  };

  // Filter visitors based on search and tab
  const getFilteredVisitors = () => {
    if (!visitors.length) return [];

    let filtered = visitors;
    const currentUserId = getCurrentUserId();

    // Filter by active tab
    if (activeTab === "my-invites") {
      // Show only visitors added by the current user
      filtered = visitors.filter(
        (visitor) => visitor.visitorAddedBy === currentUserId?.toString()
      );
    } else if (activeTab === "visitor-request") {
      // Show only visitors that are not added by the current user
      filtered = visitors.filter(
        (visitor) => visitor.visitorAddedBy !== currentUserId?.toString()
      );

      // Additional filtering for visitor request status tabs
      if (visitorRequestTab) {
        filtered = filtered.filter((visitor) => {
          // Handle different status scenarios
          if (visitorRequestTab === "CHECKED_IN") {
            return visitor.checkInTime && !visitor.checkOutTime;
          } else if (visitorRequestTab === "COMPLETED") {
            return (
              visitor.status === "CHECKED_OUT" ||
              visitor.status === "checked_out"
            );
          } else {
            // For PENDING, REJECTED - use the status field
            return visitor.status === visitorRequestTab;
          }
        });
      }
    }
    // For "all-visitors" tab, show all visitors

    // Filter by search term
    if (search.trim()) {
      filtered = filtered.filter(
        (visitor) =>
          visitor.fullName
            .toLowerCase()
            .split(/\s+/)
            .some((word) => word.startsWith(search.toLowerCase()))
        // ||
        //   visitor.phoneNumber.includes(search) ||
        //   (visitor.companyName &&
        //     visitor.companyName.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return filtered;
  };

  // Function to get display date based on visitor status and timestamps
  const getDisplayDate = (visitor: Visitor): string => {
    const timestamp = visitor.checkInTime || visitor.createdAt;
    if (!timestamp) return "Unknown";

    const visitorDate = new Date(timestamp);
    const today = new Date();

    if (isSameDay(today, visitorDate)) {
      return "Today";
    }

    return visitorDate.toLocaleDateString("en-GB");
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
  const formatCheckInTime = (
    checkInTime: string | null | undefined
  ): string => {
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

  const filteredVisitors = getFilteredVisitors();

  return (
    <Flex direction="column" minH="100vh" bg="#f8fafc" className="w-full">
      {/* Responsive Header */}
      <Box display={{ base: "block", lg: "none" }}>
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
            onClick={() => router.back()}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.back(); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">Visitor&apos;s Log</Text>
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
        {/* Web Page Title and Search */}
        <Box
          display={{ base: "none", lg: "block" }}
          bg="#F0E6FF"
          p='16px'
        >
          <Flex align="center" justify="space-between">
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
              <Text fontSize="lg" fontWeight="bold" color="#18181b">
                Visitor&apos;s Log
              </Text>
            </Flex>
            <Box w="300px">
              <Flex
                bg="white"
                borderRadius="md"
                border="1px solid #e2e8f0"
                align="center"
                px={3}
                _focusWithin={{
                  borderColor: "#8A37F7",
                  boxShadow: "0 0 0 1px #8A37F7",
                }}
              >
                <Input
                  placeholder="Search...."
                  border="none"
                  bg="transparent"
                  _focus={{
                    boxShadow: "none",
                    outline: "none",
                    border: "none",
                  }}
                  _focusVisible={{
                    boxShadow: "none",
                    outline: "none",
                    border: "none",
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <IconButton
                  aria-label="Search"
                  variant="ghost"
                  size="sm"
                  color="#8A37F7"
                  bg="transparent"
                  _hover={{ bg: "transparent" }}
                  _active={{ bg: "transparent" }}
                  mr={2}
                >
                  <FiSearch />
                </IconButton>
              </Flex>
            </Box>
          </Flex>
        </Box>

        {/* Mobile Content */}
        <Box display={{ base: "block", lg: "none" }} w="full">
          <Box
            w="full"
            maxW="100%"
            mx="auto"
            minH="100vh"
            bg="white"
            display="flex"
            flexDirection="column"
            overflowY="auto"
            className="relative"
            ref={scrollRef}
          >
            {/* Main Content with Padding */}
            <Box flex={1} px={{ base: 4, sm: 6, md: 8 }}>
              {/* Tabs */}
              <Box w="full" mt={{ base: 4, sm: 6 }} mb={2}>
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  w="full"
                  mb={2}
                >
                  {TABS.map((tab) => {
                    const isSelected = activeTab === tab.value;
                    return (
                      <Box
                        key={tab.value}
                        flex={1}
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="flex-end"
                        tabIndex={0}
                        aria-label={tab.label}
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveTab(tab.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setActiveTab(tab.value);
                        }}
                        cursor="pointer"
                        outline={isSelected ? "none" : undefined}
                        pb={1}
                      >
                        <Text
                          fontSize={{ base: "sm", sm: "md" }}
                          fontWeight={isSelected ? "bold" : "normal"}
                          color={isSelected ? "#6040B8" : "#000"}
                          textAlign="center"
                          w="full"
                          truncate
                        >
                          {tab.label}
                        </Text>
                        {isSelected && (
                          <Box
                            mt={"2px"}
                            w="full"
                            h="3px"
                            borderRadius="2px"
                            bg="#8A37F7"
                          />
                        )}
                      </Box>
                    );
                  })}
                </Box>

                {/* Subtle scroll refresh indicator */}
                {showScrollRefresh && (
                  <Flex
                    justify="center"
                    align="center"
                    py={2}
                    opacity={0.7}
                    transition="opacity 0.3s"
                  >
                    <Box
                      w="2px"
                      h="2px"
                      bg="#8A37F7"
                      borderRadius="full"
                      mr={2}
                    />
                    <Text fontSize="2xs" color="#8A37F7">
                      Refreshing...
                    </Text>
                  </Flex>
                )}
              </Box>

              {/* Search and Filter */}
              <Flex
                align="center"
                gap={{ base: 2, sm: 4 }}
                w="full"
                py={2}
                flexWrap="wrap"
              >
                {/* Search Container */}
                <Flex
                  flex={1}
                  h="36px"
                  bg="white"
                  border="1px solid #DCE3E3"
                  borderRadius="10px"
                  align="center"
                  px={2}
                  gap="20px"
                  w="full"
                >
                  {/* Search Input */}
                  <Input
                    placeholder="Search visitors..."
                    border="none"
                    bg="transparent"
                    fontSize="xs"
                    color="#757A95"
                    _placeholder={{ color: "#757A95" }}
                    flex={1}
                    _focus={{
                      boxShadow: "none",
                      outline: "none",
                      border: "none",
                    }}
                    _focusVisible={{
                      boxShadow: "none",
                      outline: "none",
                      border: "none",
                    }}
                    value={search}
                    onChange={handleSearchChange}
                  />

                  {/* Search Icon */}
                  <IconButton
                    aria-label="Search"
                    variant="ghost"
                    size="xs"
                    color="#8A37F7"
                    bg="transparent"
                    _hover={{ bg: "transparent" }}
                    _active={{ bg: "transparent" }}
                    minW="20px"
                    h="20px"
                    p={0}
                  >
                    <FiSearch size={16} />
                  </IconButton>
                </Flex>

                {/* Filter Button */}
                {/* <IconButton
            aria-label="Filter"
            bg="#8A37F7"
            color="white"
            borderRadius="4px"
            w="40px"
            h="34px"
            _hover={{ bg: "#7A2EE6" }}
            _active={{ bg: "#6A1FD6" }}
            position="relative"
            p={0}
          >
            <svg
              width="19"
              height="12"
              viewBox="0 0 19 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.75 7H15.75V5H3.75M0.75 0V2H18.75V0M7.75 12H11.75V10H7.75V12Z"
                fill="white"
              />
            </svg>
          </IconButton> */}
              </Flex>

              {/* Content Area */}
              <Box
                w="full"
                mt={{ base: 2, sm: 4 }}
                px={{ base: 0, sm: 2, md: 4 }}
              >
                {activeTab === "visitor-request" ? (
                  <>
                    {/* Visitor Request Status Tabs */}
                    <Box w="full" mb={3} py={1}>
                      <Flex
                        direction="row"
                        gap={2}
                        w="full"
                        justify="space-between"
                        align="center"
                      >
                        {VISITOR_REQUEST_TABS.map((tab) => {
                          const isSelected = visitorRequestTab === tab.value;
                          return (
                            <Box
                              key={tab.value}
                              flex={1}
                              px={2}
                              py={1.5}
                              borderRadius="6px"
                              cursor="pointer"
                              bg={isSelected ? "#7C3AED" : "#F3F4F6"}
                              color={isSelected ? "white" : "#374151"}
                              fontWeight={isSelected ? "bold" : "medium"}
                              fontSize="2xs"
                              textAlign="center"
                              tabIndex={0}
                              aria-label={`Status tab: ${tab.label}`}
                              onClick={() => setVisitorRequestTab(tab.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ")
                                  setVisitorRequestTab(tab.value);
                              }}
                              transition="all 0.2s"
                              _hover={{
                                bg: isSelected ? "#6D28D9" : "#E5E7EB",
                              }}
                              _focus={{
                                outline: "none",
                              }}
                            >
                              {tab.label}
                            </Box>
                          );
                        })}
                      </Flex>
                    </Box>

                    {/* Web Table View - Hidden on Mobile */}
                    {!loading && !error && filteredVisitors.length > 0 && (
                      <Box display={{ base: "none", lg: "block" }} mb={6}>
                        <Box
                          overflowX="auto"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                          bg="white"
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
                                  Status
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
                                  _hover={{ bg: "#f3f2fd" }}
                                >
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                  >
                                    <Flex align="center" gap={3}>
                                      <Flex
                                        w="36px"
                                        h="36px"
                                        borderRadius="full"
                                        bg="#8A37F7"
                                        align="center"
                                        justify="center"
                                        color="white"
                                        fontWeight="bold"
                                        fontSize="sm"
                                        overflow="hidden"
                                      >
                                        {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                          <Image
                                            src={resolvedImageUrls[visitor.imgUrl]}
                                            alt={visitor.fullName || "Visitor"}
                                            width={36}
                                            height={36}
                                            style={{
                                              objectFit: "cover",
                                              width: "100%",
                                              height: "100%",
                                            }}
                                          />
                                        ) : (
                                          visitor.fullName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"
                                        )}
                                      </Flex>
                                      <Text
                                        fontWeight="bold"
                                        fontSize="sm"
                                        color="#23292e"
                                      >
                                        {visitor.fullName}
                                      </Text>
                                    </Flex>
                                  </Box>
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                  >
                                    <Flex
                                      align="center"
                                      bg={
                                        visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved"
                                          ? "#D1FAE5"
                                          : visitor.status === "REJECTED" ||
                                            visitor.status === "rejected"
                                          ? "#FEE2E2"
                                          : visitor.status === "CHECKED_OUT" ||
                                            visitor.status === "checked_out"
                                          ? "#DBEAFE"
                                          : "#FFF3CD"
                                      }
                                      borderRadius="8px"
                                      px={2}
                                      py={0.5}
                                      minH="18px"
                                      w="fit-content"
                                      className="gap-1"
                                    >
                                      <Box
                                        w="6px"
                                        h="6px"
                                        borderRadius="full"
                                        bg={
                                          visitor.status === "CHECKED_IN" ||
                                          visitor.status === "checked_in" ||
                                          visitor.status === "approved"
                                            ? "#10B981"
                                            : visitor.status === "REJECTED" ||
                                              visitor.status === "rejected"
                                            ? "#EF4444"
                                            : visitor.status ===
                                                "CHECKED_OUT" ||
                                              visitor.status === "checked_out"
                                            ? "#3B82F6"
                                            : "#FFA500"
                                        }
                                      />
                                      <Text
                                        fontWeight="600"
                                        fontSize="2xs"
                                        color={
                                          visitor.status === "CHECKED_IN" ||
                                          visitor.status === "checked_in" ||
                                          visitor.status === "approved"
                                            ? "#065F46"
                                            : visitor.status === "REJECTED" ||
                                              visitor.status === "rejected"
                                            ? "#991B1B"
                                            : visitor.status ===
                                                "CHECKED_OUT" ||
                                              visitor.status === "checked_out"
                                            ? "#1E40AF"
                                            : "#856404"
                                        }
                                      >
                                        {visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved"
                                          ? "Checked-In"
                                          : visitor.status === "REJECTED" ||
                                            visitor.status === "rejected"
                                          ? "Rejected"
                                          : visitor.status === "CHECKED_OUT" ||
                                            visitor.status === "checked_out"
                                          ? "Completed"
                                          : "Pending"}
                                      </Text>
                                    </Flex>
                                  </Box>
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                    textAlign="center"
                                  >
                                    <Box
                                      as="button"
                                      w="full"
                                      h="36px"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      tabIndex={0}
                                      aria-label={`View ${visitor.fullName}'s details`}
                                      onClick={() =>
                                        router.push(
                                          `/visitor-request/preview/${visitor.id}`
                                        )
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          router.push(
                                            `/visitor-request/preview/${visitor.id}`
                                          );
                                        }
                                      }}
                                    >
                                      <FaArrowAltCircleRight
                                        size={20}
                                        color="#8A38F5"
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Web Empty State - Hidden on Mobile */}
                    {!loading && !error && filteredVisitors.length === 0 && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          textAlign="center"
                          w="full"
                          py={16}
                          minH="300px"
                        >
                          <Flex
                            w="64px"
                            h="64px"
                            bg="#f7f2fd"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            mb={4}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                                fill="#8A37F7"
                              />
                            </svg>
                          </Flex>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#23292e"
                            mb={2}
                          >
                            {search.trim()
                              ? "No visitors found"
                              : `No ${visitorRequestTab.toLowerCase()} visitors`}
                          </Text>
                          <Text fontSize="sm" color="#757A95" maxW="300px">
                            {search.trim()
                              ? "Try adjusting your search terms or clear the search to see all visitors."
                              : `No visitors with ${visitorRequestTab.toLowerCase()} status found.`}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Web Loading State - Hidden on Mobile */}
                    {loading && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          justify="center"
                          align="center"
                          w="full"
                          py={16}
                          minH="200px"
                        >
                          <Spinner size="lg" color="#8A37F7" />
                          <Text ml={3} color="#757A95">
                            Loading visitors...
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Web Error State - Hidden on Mobile */}
                    {error && !loading && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          bg="red.50"
                          border="1px solid"
                          borderColor="red.200"
                          borderRadius="8px"
                          p={6}
                          align="center"
                          gap={2}
                          justify="center"
                          w="full"
                          minH="200px"
                        >
                          <Box
                            w="4px"
                            h="4px"
                            bg="red.500"
                            borderRadius="full"
                          />
                          <Text fontSize="sm" color="red.700">
                            {error}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Mobile Visitor Request Content */}
                    <Box display={{ base: "block", lg: "none" }}>
                      {/* Loading State */}
                      {loading && (
                        <Flex justify="center" align="center" py={8}>
                          <Spinner size="lg" color="#8A37F7" />
                          <Text ml={3} color="#757A95">
                            Loading visitors...
                          </Text>
                        </Flex>
                      )}

                      {/* Error State */}
                      {error && !loading && (
                        <Flex
                          bg="red.50"
                          border="1px solid"
                          borderColor="red.200"
                          borderRadius="8px"
                          p={3}
                          mb={4}
                          align="center"
                          gap={2}
                        >
                          <Box
                            w="4px"
                            h="4px"
                            bg="red.500"
                            borderRadius="full"
                          />
                          <Text fontSize="sm" color="red.700">
                            {error}
                          </Text>
                        </Flex>
                      )}

                      {/* Empty State */}
                      {!loading && !error && filteredVisitors.length === 0 && (
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          py={12}
                          textAlign="center"
                        >
                          <Flex
                            w="64px"
                            h="64px"
                            bg="#f7f2fd"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            mb={4}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                                fill="#8A37F7"
                              />
                            </svg>
                          </Flex>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#23292e"
                            mb={2}
                          >
                            {search.trim()
                              ? "No visitors found"
                              : `No ${visitorRequestTab.toLowerCase()} visitors`}
                          </Text>
                          <Text fontSize="sm" color="#757A95" maxW="300px">
                            {search.trim()
                              ? "Try adjusting your search terms or clear the search to see all visitors."
                              : `No visitors with ${visitorRequestTab.toLowerCase()} status found.`}
                          </Text>
                        </Flex>
                      )}

                      {/* Visitors List */}
                      {!loading && !error && filteredVisitors.length > 0 && (
                        <>
                          {filteredVisitors.map((visitor) => {
                            return (
                              <Flex
                                key={visitor.id}
                                align="center"
                                justify="space-between"
                                py={2}
                                px={0}
                                borderRadius="12px"
                                cursor="pointer"
                                tabIndex={0}
                                role="button"
                                aria-label={`View ${visitor.fullName}'s details`}
                                onClick={() =>
                                  router.push(
                                    `/visitor-request/preview/${visitor.id}`
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    );
                                  }
                                }}
                                transition="background 0.2s"
                                _hover={{ bg: "#f3f2fd" }}
                                _focus={{ bg: "#f3f2fd" }}
                              >
                                {/* Left: Avatar + Info */}
                                <Flex align="center" gap={3}>
                                  {/* Avatar */}
                                  <Flex
                                    w="36px"
                                    h="36px"
                                    borderRadius="full"
                                    bg="#8A37F7"
                                    align="center"
                                    justify="center"
                                    color="white"
                                    fontWeight="bold"
                                    fontSize="sm"
                                    overflow="hidden"
                                  >
                                    {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                      <Image
                                        src={resolvedImageUrls[visitor.imgUrl]}
                                        alt={visitor.fullName || "Visitor"}
                                        width={36}
                                        height={36}
                                        style={{
                                          objectFit: "cover",
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    ) : (
                                      visitor.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"
                                    )}
                                  </Flex>

                                  {/* Info */}
                                  <Flex direction="column" gap={1}>
                                    <Text
                                      fontWeight="bold"
                                      fontSize="sm"
                                      color="#23292e"
                                    >
                                      {visitor.fullName}
                                    </Text>

                                    {/* Status Badge - Show status for visitor request tab */}
                                    <Flex
                                      align="center"
                                      bg={
                                        visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved"
                                          ? "#D1FAE5"
                                          : visitor.status === "REJECTED" ||
                                            visitor.status === "rejected"
                                          ? "#FEE2E2"
                                          : visitor.status === "CHECKED_OUT" ||
                                            visitor.status === "checked_out"
                                          ? "#DBEAFE"
                                          : "#FFF3CD"
                                      }
                                      borderRadius="8px"
                                      px={2}
                                      py={0.5}
                                      minH="18px"
                                      w="fit-content"
                                      className="gap-1 mt-1"
                                    >
                                      {/* Status icon */}
                                      <Box
                                        w="6px"
                                        h="6px"
                                        borderRadius="full"
                                        bg={
                                          visitor.status === "CHECKED_IN" ||
                                          visitor.status === "checked_in" ||
                                          visitor.status === "approved"
                                            ? "#10B981"
                                            : visitor.status === "REJECTED" ||
                                              visitor.status === "rejected"
                                            ? "#EF4444"
                                            : visitor.status ===
                                                "CHECKED_OUT" ||
                                              visitor.status === "checked_out"
                                            ? "#3B82F6"
                                            : "#FFA500"
                                        }
                                      />
                                      {/* Status text */}
                                      <Text
                                        fontWeight="600"
                                        fontSize="2xs"
                                        color={
                                          visitor.status === "CHECKED_IN" ||
                                          visitor.status === "checked_in" ||
                                          visitor.status === "approved"
                                            ? "#065F46"
                                            : visitor.status === "REJECTED" ||
                                              visitor.status === "rejected"
                                            ? "#991B1B"
                                            : visitor.status ===
                                                "CHECKED_OUT" ||
                                              visitor.status === "checked_out"
                                            ? "#1E40AF"
                                            : "#856404"
                                        }
                                      >
                                        {visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved"
                                          ? "Checked-In"
                                          : visitor.status === "REJECTED" ||
                                            visitor.status === "rejected"
                                          ? "Rejected"
                                          : visitor.status === "CHECKED_OUT" ||
                                            visitor.status === "checked_out"
                                          ? "Completed"
                                          : "Pending"}
                                      </Text>
                                    </Flex>
                                  </Flex>
                                </Flex>

                                {/* Right: Arrow icon in purple, navigates to preview */}
                                <Box
                                  as="button"
                                  w="auto"
                                  h="36px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="flex-end"
                                  tabIndex={0}
                                  aria-label={`View ${visitor.fullName}'s details`}
                                  onClick={() =>
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      router.push(
                                        `/visitor-request/preview/${visitor.id}`
                                      );
                                    }
                                  }}
                                >
                                  <FaArrowAltCircleRight
                                    size={20}
                                    color="#8A38F5"
                                  />
                                </Box>
                              </Flex>
                            );
                          })}
                        </>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    {/* Web Table View for All Visitors and My Invites - Hidden on Mobile */}
                    {!loading && !error && filteredVisitors.length > 0 && (
                      <Box display={{ base: "none", lg: "block" }} mb={6}>
                        <Box
                          overflowX="auto"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="gray.200"
                          bg="white"
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
                                  Status
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
                                  _hover={{ bg: "#f3f2fd" }}
                                >
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                  >
                                    <Flex align="center" gap={3}>
                                      <Flex
                                        w="36px"
                                        h="36px"
                                        borderRadius="full"
                                        bg="#F2F2F2"
                                        align="center"
                                        justify="center"
                                        color="#757A95"
                                        fontWeight="bold"
                                        fontSize="sm"
                                        overflow="hidden"
                                      >
                                        {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                          <Image
                                            src={resolvedImageUrls[visitor.imgUrl]}
                                            alt={visitor.fullName || "Visitor"}
                                            width={36}
                                            height={36}
                                            style={{
                                              objectFit: "cover",
                                              width: "100%",
                                              height: "100%",
                                            }}
                                          />
                                        ) : (
                                          visitor.fullName
                                            ?.charAt(0)
                                            ?.toUpperCase() || "?"
                                        )}
                                      </Flex>
                                      <Text
                                        fontWeight="bold"
                                        fontSize="sm"
                                        color="#23292e"
                                      >
                                        {visitor.fullName}
                                      </Text>
                                    </Flex>
                                  </Box>
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                  >
                                    <Flex
                                      align="center"
                                      bg="#F2F2F2"
                                      borderRadius="12px"
                                      px={2}
                                      py={1}
                                      minH="22px"
                                      w="fit-content"
                                      className="gap-2"
                                    >
                                      {/* Show date and status for checked in/out visitors */}
                                      {(visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved" ||
                                        visitor.status === "CHECKED_OUT" ||
                                        visitor.status === "checked_out") && (
                                        <>
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
                                            visitor.status === "checked_in" ||
                                            visitor.status === "approved") && (
                                            <Flex
                                              align="center"
                                              className="gap-1"
                                            >
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
                                            visitor.status ===
                                              "checked_out") && (
                                            <Flex
                                              align="center"
                                              className="gap-2"
                                            >
                                              {/* Check-in time */}
                                              <Flex
                                                align="center"
                                                className="gap-1"
                                              >
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
                                              <Flex
                                                align="center"
                                                className="gap-1"
                                              >
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
                                        </>
                                      )}

                                      {/* Pending status - only show status, no date */}
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
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Pending
                                          </Text>
                                        </Flex>
                                      )}

                                      {/* Rejected status - only show status, no date */}
                                      {(visitor.status === "REJECTED" ||
                                        visitor.status === "rejected") && (
                                        <Flex align="center" className="gap-1">
                                          <Box
                                            w="8px"
                                            h="8px"
                                            borderRadius="full"
                                            bg="#EF4444"
                                          />
                                          <Text
                                            fontWeight="600"
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Rejected
                                          </Text>
                                        </Flex>
                                      )}

                                      {/* Approved status - only show status, no date */}
                                      {(visitor.status === "APPROVED" ||
                                        visitor.status === "approved") && (
                                        <Flex align="center" className="gap-1">
                                          <Box
                                            w="8px"
                                            h="8px"
                                            borderRadius="full"
                                            bg="#10B981"
                                          />
                                          <Text
                                            fontWeight="600"
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Approved
                                          </Text>
                                        </Flex>
                                      )}
                                    </Flex>
                                  </Box>
                                  <Box
                                    as="td"
                                    px={4}
                                    py={4}
                                    borderBottom="1px solid"
                                    borderColor="gray.100"
                                    textAlign="center"
                                  >
                                    <Box
                                      as="button"
                                      w="full"
                                      h="36px"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      tabIndex={0}
                                      aria-label={`View ${visitor.fullName}'s details`}
                                      onClick={() =>
                                        router.push(
                                          `/visitor-request/preview/${visitor.id}`
                                        )
                                      }
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          router.push(
                                            `/visitor-request/preview/${visitor.id}`
                                          );
                                        }
                                      }}
                                    >
                                      <FaArrowAltCircleRight
                                        size={20}
                                        color="#8A38F5"
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Web Empty State for All Visitors and My Invites - Hidden on Mobile */}
                    {!loading && !error && filteredVisitors.length === 0 && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          textAlign="center"
                          w="full"
                          py={16}
                          minH="300px"
                        >
                          <Flex
                            w="64px"
                            h="64px"
                            bg="#f7f2fd"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            mb={4}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                                fill="#8A37F7"
                              />
                            </svg>
                          </Flex>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#23292e"
                            mb={2}
                          >
                            {search.trim()
                              ? "No visitors found"
                              : "No visitors yet"}
                          </Text>
                          <Text fontSize="sm" color="#757A95" maxW="300px">
                            {search.trim()
                              ? "Try adjusting your search terms or clear the search to see all visitors."
                              : "When you host visitors, they will appear here for you to manage."}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Web Loading State for All Visitors and My Invites - Hidden on Mobile */}
                    {loading && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          justify="center"
                          align="center"
                          w="full"
                          py={16}
                          minH="200px"
                        >
                          <Spinner size="lg" color="#8A37F7" />
                          <Text ml={3} color="#757A95">
                            Loading visitors...
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Web Error State for All Visitors and My Invites - Hidden on Mobile */}
                    {error && !loading && (
                      <Box display={{ base: "none", lg: "flex" }} mb={6}>
                        <Flex
                          bg="red.50"
                          border="1px solid"
                          borderColor="red.200"
                          borderRadius="8px"
                          p={6}
                          align="center"
                          gap={2}
                          justify="center"
                          w="full"
                          minH="200px"
                        >
                          <Box
                            w="4px"
                            h="4px"
                            bg="red.500"
                            borderRadius="full"
                          />
                          <Text fontSize="sm" color="red.700">
                            {error}
                          </Text>
                        </Flex>
                      </Box>
                    )}

                    {/* Mobile Content for All Visitors and My Invites */}
                    <Box display={{ base: "block", lg: "none" }}>
                      {/* Loading State */}
                      {loading && (
                        <Flex justify="center" align="center" py={8}>
                          <Spinner size="lg" color="#8A37F7" />
                          <Text ml={3} color="#757A95">
                            Loading visitors...
                          </Text>
                        </Flex>
                      )}

                      {/* Error State */}
                      {error && !loading && (
                        <Flex
                          bg="red.50"
                          border="1px solid"
                          borderColor="red.200"
                          borderRadius="8px"
                          p={3}
                          mb={4}
                          align="center"
                          gap={2}
                        >
                          <Box
                            w="4px"
                            h="4px"
                            bg="red.500"
                            borderRadius="full"
                          />
                          <Text fontSize="sm" color="red.700">
                            {error}
                          </Text>
                        </Flex>
                      )}

                      {/* Empty State */}
                      {!loading && !error && filteredVisitors.length === 0 && (
                        <Flex
                          direction="column"
                          align="center"
                          justify="center"
                          py={12}
                          textAlign="center"
                        >
                          <Flex
                            w="64px"
                            h="64px"
                            bg="#f7f2fd"
                            borderRadius="full"
                            align="center"
                            justify="center"
                            mb={4}
                          >
                            <svg
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                                fill="#8A37F7"
                              />
                            </svg>
                          </Flex>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="#23292e"
                            mb={2}
                          >
                            {search.trim()
                              ? "No visitors found"
                              : "No visitors yet"}
                          </Text>
                          <Text fontSize="sm" color="#757A95" maxW="300px">
                            {search.trim()
                              ? "Try adjusting your search terms or clear the search to see all visitors."
                              : "When you host visitors, they will appear here for you to manage."}
                          </Text>
                        </Flex>
                      )}

                      {/* Visitors List */}
                      {!loading && !error && filteredVisitors.length > 0 && (
                        <>
                          {filteredVisitors.map((visitor) => {
                            return (
                              <Flex
                                key={visitor.id}
                                align="center"
                                justify="space-between"
                                py={2}
                                px={0}
                                borderRadius="12px"
                                cursor="pointer"
                                tabIndex={0}
                                role="button"
                                aria-label={`View ${visitor.fullName}'s details`}
                                onClick={() =>
                                  router.push(
                                    `/visitor-request/preview/${visitor.id}`
                                  )
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    );
                                  }
                                }}
                                transition="background 0.2s"
                                _hover={{ bg: "#f3f2fd" }}
                                _focus={{ bg: "#f3f2fd" }}
                              >
                                {/* Left: Avatar + Info */}
                                <Flex align="center" gap={3}>
                                  {/* Avatar */}
                                  <Flex
                                    w="36px"
                                    h="36px"
                                    borderRadius="full"
                                    bg="#F2F2F2"
                                    align="center"
                                    justify="center"
                                    color="#757A95"
                                    fontWeight="bold"
                                    fontSize="sm"
                                    overflow="hidden"
                                  >
                                    {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                      <Image
                                        src={resolvedImageUrls[visitor.imgUrl]}
                                        alt={visitor.fullName || "Visitor"}
                                        width={36}
                                        height={36}
                                        style={{
                                          objectFit: "cover",
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    ) : (
                                      visitor.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"
                                    )}
                                  </Flex>

                                  {/* Info */}
                                  <Flex direction="column" gap={1}>
                                    <Text
                                      fontWeight="bold"
                                      fontSize="sm"
                                      color="#23292e"
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
                                      {/* Show date and status for checked in/out visitors */}
                                      {(visitor.status === "CHECKED_IN" ||
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved" ||
                                        visitor.status === "CHECKED_OUT" ||
                                        visitor.status === "checked_out") && (
                                        <>
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
                                            visitor.status === "checked_in" ||
                                            visitor.status === "approved") && (
                                            <Flex
                                              align="center"
                                              className="gap-1"
                                            >
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
                                            visitor.status ===
                                              "checked_out") && (
                                            <Flex
                                              align="center"
                                              className="gap-2"
                                            >
                                              {/* Check-in time */}
                                              <Flex
                                                align="center"
                                                className="gap-1"
                                              >
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
                                              <Flex
                                                align="center"
                                                className="gap-1"
                                              >
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
                                        </>
                                      )}

                                      {/* Pending status - only show status, no date */}
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
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Pending
                                          </Text>
                                        </Flex>
                                      )}

                                      {/* Rejected status - only show status, no date */}
                                      {(visitor.status === "REJECTED" ||
                                        visitor.status === "rejected") && (
                                        <Flex align="center" className="gap-1">
                                          <Box
                                            w="8px"
                                            h="8px"
                                            borderRadius="full"
                                            bg="#EF4444"
                                          />
                                          <Text
                                            fontWeight="600"
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Rejected
                                          </Text>
                                        </Flex>
                                      )}

                                      {/* Approved status - only show status, no date */}
                                      {(visitor.status === "APPROVED" ||
                                        visitor.status === "approved") && (
                                        <Flex align="center" className="gap-1">
                                          <Box
                                            w="8px"
                                            h="8px"
                                            borderRadius="full"
                                            bg="#10B981"
                                          />
                                          <Text
                                            fontWeight="600"
                                            fontSize="2xs"
                                            color="#18181B"
                                          >
                                            Approved
                                          </Text>
                                        </Flex>
                                      )}
                                    </Flex>
                                  </Flex>
                                </Flex>

                                {/* Right: Arrow icon in purple, navigates to preview */}
                                <Box
                                  as="button"
                                  w="auto"
                                  h="36px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="flex-end"
                                  tabIndex={0}
                                  aria-label={`View ${visitor.fullName}'s details`}
                                  onClick={() =>
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      router.push(
                                        `/visitor-request/preview/${visitor.id}`
                                      );
                                    }
                                  }}
                                >
                                  <FaArrowAltCircleRight
                                    size={20}
                                    color="#8A38F5"
                                  />
                                </Box>
                              </Flex>
                            );
                          })}
                        </>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Web Content */}
        <Box
          display={{ base: "none", lg: "flex" }}
          flex={1}
          bg="#F0E6FF"
          flexDirection="column"
          position="relative"
          overflow="auto"
        >
          {/* Decorative Background Logo */}
          <Box
            position="fixed"
            top="60%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={0}
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>
          {/* Tabs */}
          <Box w="full" px={6} py={4} position="relative" zIndex={2}>
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              w="full"
              mb={2}
            >
              {TABS.map((tab) => {
                const isSelected = activeTab === tab.value;
                return (
                  <Box
                    key={tab.value}
                    flex={1}
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="flex-end"
                    tabIndex={0}
                    aria-label={tab.label}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setActiveTab(tab.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setActiveTab(tab.value);
                    }}
                    cursor="pointer"
                    outline={isSelected ? "none" : undefined}
                    pb={1}
                  >
                    <Text
                      fontSize="md"
                      fontWeight={isSelected ? "bold" : "normal"}
                      color={isSelected ? "#6040B8" : "#000"}
                      textAlign="center"
                      w="full"
                      truncate
                    >
                      {tab.label}
                    </Text>
                    {isSelected && (
                      <Box
                        mt={"2px"}
                        w="full"
                        h="3px"
                        borderRadius="2px"
                        bg="#8A37F7"
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Content Area */}
          <Box w="full" px={6} pb={6}>
            {activeTab === "visitor-request" ? (
              <>
                {/* Visitor Request Status Tabs */}
                <Box w="full" mb={6} py={1}>
                  <Flex
                    direction="row"
                    gap={2}
                    w="full"
                    justify="space-between"
                    align="center"
                  >
                    {VISITOR_REQUEST_TABS.map((tab) => {
                      const isSelected = visitorRequestTab === tab.value;
                      return (
                        <Box
                          key={tab.value}
                          flex={1}
                          px={2}
                          py={1.5}
                          borderRadius="6px"
                          cursor="pointer"
                          bg={isSelected ? "#7C3AED" : "#F3F4F6"}
                          color={isSelected ? "white" : "#374151"}
                          fontWeight={isSelected ? "bold" : "medium"}
                          fontSize="sm"
                          textAlign="center"
                          tabIndex={0}
                          aria-label={`Status tab: ${tab.label}`}
                          onClick={() => setVisitorRequestTab(tab.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              setVisitorRequestTab(tab.value);
                          }}
                          transition="all 0.2s"
                          _hover={{
                            bg: isSelected ? "#6D28D9" : "#E5E7EB",
                          }}
                          _focus={{
                            outline: "none",
                          }}
                        >
                          {tab.label}
                        </Box>
                      );
                    })}
                  </Flex>
                </Box>

                {/* Web Content */}
                <Box position="relative" zIndex={2}>
                {loading ? (
                  <Flex justify="center" align="center" py={16} minH="200px">
                    <Spinner size="lg" color="#8A37F7" />
                    <Text ml={3} color="#757A95">
                      Loading visitors...
                    </Text>
                  </Flex>
                ) : error ? (
                  <Flex
                    bg="red.50"
                    border="1px solid"
                    borderColor="red.200"
                    borderRadius="8px"
                    p={6}
                    align="center"
                    gap={2}
                    justify="center"
                    w="full"
                    minH="200px"
                  >
                    <Box w="4px" h="4px" bg="red.500" borderRadius="full" />
                    <Text fontSize="sm" color="red.700">
                      {error}
                    </Text>
                  </Flex>
                ) : filteredVisitors.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    textAlign="center"
                    w="full"
                    py={16}
                    minH="300px"
                  >
                    <Flex
                      w="64px"
                      h="64px"
                      bg="#f7f2fd"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      mb={4}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                          fill="#8A37F7"
                        />
                      </svg>
                    </Flex>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="#23292e"
                      mb={2}
                    >
                      {search.trim()
                        ? "No visitors found"
                        : `No ${visitorRequestTab.toLowerCase()} visitors`}
                    </Text>
                    <Text fontSize="sm" color="#757A95" maxW="300px">
                      {search.trim()
                        ? "Try adjusting your search terms or clear the search to see all visitors."
                        : `No visitors with ${visitorRequestTab.toLowerCase()} status found.`}
                    </Text>
                  </Flex>
                ) : (
                  <Box mb={6}>
                    <Box
                      overflowX="auto"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="white"
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
                              w="35%"
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
                              w="35%"
                            >
                              Status
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
                              w="30%"
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
                              _hover={{ bg: "#f3f2fd" }}
                            >
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                w="35%"
                              >
                                <Flex align="center" gap={3}>
                                  <Flex
                                    w="36px"
                                    h="36px"
                                    borderRadius="full"
                                    bg="#8A37F7"
                                    align="center"
                                    justify="center"
                                    color="white"
                                    fontWeight="bold"
                                    fontSize="sm"
                                    overflow="hidden"
                                  >
                                    {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                      <Image
                                        src={resolvedImageUrls[visitor.imgUrl]}
                                        alt={visitor.fullName || "Visitor"}
                                        width={36}
                                        height={36}
                                        style={{
                                          objectFit: "cover",
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    ) : (
                                      visitor.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"
                                    )}
                                  </Flex>
                                  <Text
                                    fontWeight="bold"
                                    fontSize="sm"
                                    color="#23292e"
                                  >
                                    {visitor.fullName}
                                  </Text>
                                </Flex>
                              </Box>
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                w="35%"
                              >
                                <Flex
                                  align="center"
                                  bg={
                                    visitor.status === "CHECKED_IN" ||
                                    visitor.status === "checked_in" ||
                                    visitor.status === "approved"
                                      ? "#D1FAE5"
                                      : visitor.status === "REJECTED" ||
                                        visitor.status === "rejected"
                                      ? "#FEE2E2"
                                      : visitor.status === "CHECKED_OUT" ||
                                        visitor.status === "checked_out"
                                      ? "#DBEAFE"
                                      : "#FFF3CD"
                                  }
                                  borderRadius="8px"
                                  px={2}
                                  py={0.5}
                                  minH="18px"
                                  w="fit-content"
                                  className="gap-1"
                                >
                                  <Box
                                    w="6px"
                                    h="6px"
                                    borderRadius="full"
                                    bg={
                                      visitor.status === "CHECKED_IN" ||
                                      visitor.status === "checked_in" ||
                                      visitor.status === "approved"
                                        ? "#10B981"
                                        : visitor.status === "REJECTED" ||
                                          visitor.status === "rejected"
                                        ? "#EF4444"
                                        : visitor.status === "CHECKED_OUT" ||
                                          visitor.status === "checked_out"
                                        ? "#3B82F6"
                                        : "#FFA500"
                                    }
                                  />
                                  <Text
                                    fontWeight="600"
                                    fontSize="2xs"
                                    color={
                                      visitor.status === "CHECKED_IN" ||
                                      visitor.status === "checked_in" ||
                                      visitor.status === "approved"
                                        ? "#065F46"
                                        : visitor.status === "REJECTED" ||
                                          visitor.status === "rejected"
                                        ? "#991B1B"
                                        : visitor.status === "CHECKED_OUT" ||
                                          visitor.status === "checked_out"
                                        ? "#1E40AF"
                                        : "#856404"
                                    }
                                  >
                                    {visitor.status === "CHECKED_IN" ||
                                    visitor.status === "checked_in" ||
                                    visitor.status === "approved"
                                      ? "Checked-In"
                                      : visitor.status === "REJECTED" ||
                                        visitor.status === "rejected"
                                      ? "Rejected"
                                      : visitor.status === "CHECKED_OUT" ||
                                        visitor.status === "checked_out"
                                      ? "Completed"
                                      : "Pending"}
                                  </Text>
                                </Flex>
                              </Box>
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                textAlign="center"
                                w="30%"
                              >
                                <Box
                                  as="button"
                                  w="full"
                                  h="36px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  tabIndex={0}
                                  aria-label={`View ${visitor.fullName}'s details`}
                                  onClick={() =>
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      router.push(
                                        `/visitor-request/preview/${visitor.id}`
                                      );
                                    }
                                  }}
                                >
                                  <FaArrowAltCircleRight
                                    size={20}
                                    color="#8A38F5"
                                  />
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
                </Box>
              </>
            ) : (
              <>
                {/* Web Content for All Visitors and My Invites */}
                <Box position="relative" zIndex={2}>
                {loading ? (
                  <Flex justify="center" align="center" py={16} minH="200px">
                    <Spinner size="lg" color="#8A37F7" />
                    <Text ml={3} color="#757A95">
                      Loading visitors...
                    </Text>
                  </Flex>
                ) : error ? (
                  <Flex
                    bg="red.50"
                    border="1px solid"
                    borderColor="red.200"
                    borderRadius="8px"
                    p={6}
                    align="center"
                    gap={2}
                    justify="center"
                    w="full"
                    minH="200px"
                  >
                    <Box w="4px" h="4px" bg="red.500" borderRadius="full" />
                    <Text fontSize="sm" color="red.700">
                      {error}
                    </Text>
                  </Flex>
                ) : filteredVisitors.length === 0 ? (
                  <Flex
                    direction="column"
                    align="center"
                    justify="center"
                    textAlign="center"
                    w="full"
                    py={16}
                    minH="300px"
                  >
                    <Flex
                      w="64px"
                      h="64px"
                      bg="#f7f2fd"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      mb={4}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9ZM19 9H14V4H5V21H19V9Z"
                          fill="#8A37F7"
                        />
                      </svg>
                    </Flex>
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="#23292e"
                      mb={2}
                    >
                      {search.trim() ? "No visitors found" : "No visitors yet"}
                    </Text>
                    <Text fontSize="sm" color="#757A95" maxW="300px">
                      {search.trim()
                        ? "Try adjusting your search terms or clear the search to see all visitors."
                        : "When you host visitors, they will appear here for you to manage."}
                    </Text>
                  </Flex>
                ) : (
                  <Box mb={6}>
                    <Box
                      overflowX="auto"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      bg="white"
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
                              w="35%"
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
                              w="35%"
                            >
                              Status
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
                              w="30%"
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
                              _hover={{ bg: "#f3f2fd" }}
                            >
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                w="35%"
                              >
                                <Flex align="center" gap={3}>
                                  <Flex
                                    w="36px"
                                    h="36px"
                                    borderRadius="full"
                                    bg="#F2F2F2"
                                    align="center"
                                    justify="center"
                                    color="#757A95"
                                    fontWeight="bold"
                                    fontSize="sm"
                                    overflow="hidden"
                                  >
                                    {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] ? (
                                      <Image
                                        src={resolvedImageUrls[visitor.imgUrl]}
                                        alt={visitor.fullName || "Visitor"}
                                        width={36}
                                        height={36}
                                        style={{
                                          objectFit: "cover",
                                          width: "100%",
                                          height: "100%",
                                        }}
                                      />
                                    ) : (
                                      visitor.fullName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"
                                    )}
                                  </Flex>
                                  <Text
                                    fontWeight="bold"
                                    fontSize="sm"
                                    color="#23292e"
                                  >
                                    {visitor.fullName}
                                  </Text>
                                </Flex>
                              </Box>
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                w="35%"
                              >
                                <Flex
                                  align="center"
                                  bg="#F2F2F2"
                                  borderRadius="12px"
                                  px={2}
                                  py={1}
                                  minH="22px"
                                  w="fit-content"
                                  className="gap-2"
                                >
                                  {/* Show date and status for checked in/out visitors */}
                                  {(visitor.status === "CHECKED_IN" ||
                                    visitor.status === "checked_in" ||
                                    visitor.status === "approved" ||
                                    visitor.status === "CHECKED_OUT" ||
                                    visitor.status === "checked_out") && (
                                    <>
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
                                        visitor.status === "checked_in" ||
                                        visitor.status === "approved") && (
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
                                          <Flex
                                            align="center"
                                            className="gap-1"
                                          >
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
                                          <Flex
                                            align="center"
                                            className="gap-1"
                                          >
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
                                    </>
                                  )}

                                  {/* Pending status - only show status, no date */}
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
                                        fontSize="2xs"
                                        color="#18181B"
                                      >
                                        Pending
                                      </Text>
                                    </Flex>
                                  )}

                                  {/* Rejected status - only show status, no date */}
                                  {(visitor.status === "REJECTED" ||
                                    visitor.status === "rejected") && (
                                    <Flex align="center" className="gap-1">
                                      <Box
                                        w="8px"
                                        h="8px"
                                        borderRadius="full"
                                        bg="#EF4444"
                                      />
                                      <Text
                                        fontWeight="600"
                                        fontSize="2xs"
                                        color="#18181B"
                                      >
                                        Rejected
                                      </Text>
                                    </Flex>
                                  )}

                                  {/* Approved status - only show status, no date */}
                                  {(visitor.status === "APPROVED" ||
                                    visitor.status === "approved") && (
                                    <Flex align="center" className="gap-1">
                                      <Box
                                        w="8px"
                                        h="8px"
                                        borderRadius="full"
                                        bg="#10B981"
                                      />
                                      <Text
                                        fontWeight="600"
                                        fontSize="2xs"
                                        color="#18181B"
                                      >
                                        Approved
                                      </Text>
                                    </Flex>
                                  )}
                                </Flex>
                              </Box>
                              <Box
                                as="td"
                                px={4}
                                py={4}
                                borderBottom="1px solid"
                                borderColor="gray.100"
                                textAlign="center"
                                w="30%"
                              >
                                <Box
                                  as="button"
                                  w="full"
                                  h="36px"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  tabIndex={0}
                                  aria-label={`View ${visitor.fullName}'s details`}
                                  onClick={() =>
                                    router.push(
                                      `/visitor-request/preview/${visitor.id}`
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      router.push(
                                        `/visitor-request/preview/${visitor.id}`
                                      );
                                    }
                                  }}
                                >
                                  <FaArrowAltCircleRight
                                    size={20}
                                    color="#8A38F5"
                                  />
                                </Box>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default MainPage;
