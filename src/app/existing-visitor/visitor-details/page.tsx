"use client";
import { Avatar, Box, Flex, Text, Button, IconButton, Heading } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useState } from "react";
import SearchBar from "@/components/ui/SearchBar";
import { getVisitors } from "@/app/api/visitor/routes";
import { getVisitorImageBlob } from "@/app/api/visitor-image/routes";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";
import Image from "next/image";
import { APPROVAL_REQUIREMENT_GET_API } from "@/lib/server-urls";

const HeaderBar = (): ReactElement => {
  const router = useRouter();
  return (
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
    >
      <Box
        position="absolute"
        left={2}
        top="50%"
        transform="translateY(-50%)"
        as="button"
        tabIndex={0}
        aria-label="Go back to Check-In Visitor"
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
        onClick={() => router.push("/check-in-visitor")}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push("/check-in-visitor"); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize={{ base: "sm", md: "lg" }} color="#181a1b">Existing Visitor</Text>
    </Flex>
  );
};

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
interface Visitor {
  id: string;
  fullName: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  phoneNumber?: string; // or mobile or something unique
  imgUrl?: string;
}
const VisitorDetails = (): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalReq = searchParams.get("approvalReq");
  const [token, setToken] = useState<string>("");
  const [existingVisitors, setExistingVisitors] = useState<Visitor[]>([]);
  const [filtered, setFiltered] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolvedImageUrls, setResolvedImageUrls] = useState<Record<string, string>>({});
  const [isApprovalRequired, setIsApprovalRequired] = useState<boolean>(true);

  // Helper function to get the correct image URL
  const getImageUrl = async (
    imgUrl: string | undefined,
    type: "visitor" = "visitor"
  ): Promise<string | null> => {
    if (!imgUrl) return null;

    // If it's already a valid URL (http/https or data), return as is
    if (imgUrl.startsWith("http") || imgUrl.startsWith("data:")) {
      return imgUrl;
    }

    // If it's a file path, get the blob URL
    try {
      let blobUrl: string | null = null;

      switch (type) {
        case "visitor":
          blobUrl = await getVisitorImageBlob(imgUrl);
          break;
        default:
          blobUrl = await getVisitorImageBlob(imgUrl);
      }

      // Validate that the blob URL is actually a valid URL
      if (blobUrl && (blobUrl.startsWith("blob:") || blobUrl.startsWith("data:"))) {
        return blobUrl;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load ${type} image:`, error);
      return null;
    }
  };

  // Helper function to check if a resolved image URL is valid for Next.js Image component
  const isValidImageUrl = (url: string | null): boolean => {
    return !!(
      url &&
      (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:"))
    );
  };
  useEffect(() => {
    const authDataRaw = localStorage.getItem("authData");
    if (authDataRaw) {
      const parsed = JSON.parse(authDataRaw);
      if (parsed?.token) setToken(parsed.token);
    }
  }, []);

  // Load approval requirement setting from API
  useEffect(() => {
    const loadApprovalRequirement = async () => {
      try {
        const authData = localStorage.getItem("authData");
        if (!authData) return;

        const parsed = JSON.parse(authData);
        const token = parsed.token;
        if (!token) return;

        const response = await fetch(APPROVAL_REQUIREMENT_GET_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const responseData = await response.json();

        if (
          responseData &&
          responseData.success === true &&
          responseData.data !== undefined
        ) {
          setIsApprovalRequired(responseData.data.isApprovalReq || false);
        }
      } catch (error) {
        console.error("❌ Error loading approval requirement:", error);
      }
    };

    loadApprovalRequirement();
  }, []);


  useEffect(() => {
    const fetchVisitors = async () => {
      try {
        const res = await getVisitors(token);
        const allVisitors = res.visitors as Visitor[];

        // 1. Filter visitors who have checked out at least once (including those who may have been reinvited)
        // This ensures reinvited visitors still appear in the existing visitor list
        const visitorsWithCheckoutHistory = allVisitors.filter(
          (v) => v.checkOutTime !== null && v.checkOutTime !== undefined && v.checkOutTime !== ""
        );

        // 2. Group by unique identifier to show one record per visitor
        const visitorMap = new Map<string, Visitor>();

        visitorsWithCheckoutHistory.forEach((v) => {
          const key = v.phoneNumber || v.fullName; // Use phone number or name as unique identifier
          const existing = visitorMap.get(key);

          // Show the most recent record for each visitor (regardless of current status)
          // This ensures reinvited visitors appear with their latest status (PENDING/APPROVED)
          if (
            !existing ||
            new Date(v.checkInTime || "").getTime() >
              new Date(existing.checkInTime || "").getTime()
          ) {
            visitorMap.set(key, v);
          }
        });

        // 3. Final unique & sorted list - sorted by most recent activity
        const uniqueVisitors = Array.from(visitorMap.values()).sort(
          (a, b) => {
            const aTime = new Date(a.checkInTime || "").getTime();
            const bTime = new Date(b.checkInTime || "").getTime();
            return bTime - aTime;
          }
        );

        setExistingVisitors(uniqueVisitors);
        setFiltered(uniqueVisitors);
      } catch (err) {
        console.error("Failed to fetch visitors", err);
      }
    };

    if (token) fetchVisitors();
  }, [token]);

  // Resolve image URLs when visitors data changes
  useEffect(() => {
    const resolveImageUrls = async () => {
      const urls: Record<string, string> = {};

      // Resolve visitor image URLs
      for (const visitor of existingVisitors) {
        if (visitor.imgUrl) {
          const resolvedUrl = await getImageUrl(visitor.imgUrl, "visitor");
          if (resolvedUrl && resolvedUrl !== visitor.imgUrl) {
            urls[visitor.imgUrl] = resolvedUrl;
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [existingVisitors]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr}, ${timeStr}`;
  };

  const getInitials = (fullName: string): string => {
    if (!fullName) return "?";

    return fullName.trim().charAt(0).toUpperCase();
  };

  // Helper functions from visitors-log
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const getRelevantTimestamp = (visitor: Visitor): string | null => {
    if (visitor.status === "CHECKED_IN" || visitor.status === "checked_in") {
      return visitor.checkInTime || null; // Use check-in time if available
    } else if (
      visitor.status === "CHECKED_OUT" ||
      visitor.status === "checked_out"
    ) {
      return visitor.checkOutTime || visitor.checkInTime || null; // Prefer check-out, then check-in
    }
    return visitor.checkInTime || null; // For pending or other statuses, use check-in time if available
  };

  const getDisplayDate = (visitor: Visitor): string => {
    const timestamp = getRelevantTimestamp(visitor);
    if (!timestamp) return "Unknown";

    const visitorDate = new Date(timestamp);
    const today = new Date();

    if (isSameDay(today, visitorDate)) {
      return "Today";
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (isSameDay(yesterday, visitorDate)) {
      return "Yesterday";
    }

    return visitorDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCheckInTime = (checkInTime: string | null | undefined): string => {
    if (checkInTime) {
      const date = new Date(checkInTime);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Not checked in";
  };

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
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const result = existingVisitors.filter((item) =>
      item.fullName?.toLowerCase().startsWith(query.toLowerCase())
    );
    setFiltered(result);
  };
  return (
    <Box
      h="100vh"
      w="full"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      bg={{ base: "white", md: "#f7f2fd" }}
    >
      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader />
      
      {/* Desktop Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        h="calc(100vh - 70px)"
        position="relative"
        overflow="hidden"
      >
        {/* Decorative Background Logo */}
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={0}
        >
          <Box transform="scale(5)" opacity={0.15}>
            <Logo />
          </Box>
        </Box>

        {/* Main Content */}
        <Box position="relative" zIndex={2} p={6} h="full" overflow="hidden">
          {/* Page Title with Back Button */}
          <Flex align="center" gap={3} >
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={() => router.push("/check-in-visitor")}
              color="#8A37F7"
              _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
            <Heading
              fontSize="lg"
              color="#18181b"
              fontWeight="bold"
            >
              Existing Visitor
            </Heading>
          </Flex>

          {/* Content */}
          <Box
            w="full"
            maxW="1200px"
            mx="auto"
            py={6}
            px={8}
            flex={1}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="flex-start"
            gap={6}
          >
            <SearchBar
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onSearch={handleSearch}
              placeholder="Search Visitor..."
              //  onFilterClick={() => { /* TODO: Implement filter logic */ }}
            />
            {/* Visitor List UI below SearchBar */}
            <Flex direction="column" gap={4} w="full" flex={1}>
              {filtered.length === 0 ? (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  flex={1}
                  minH="50vh"
                  gap={3}
                >
                  <Text
                    fontSize="lg"
                    fontWeight="medium"
                    color="gray.400"
                    textAlign="center"
                  >
                    {searchQuery
                      ? "No visitors found matching your search"
                      : "No visitors found"}
                  </Text>
                </Flex>
              ) : (
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
                          w="25%"
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
                          w="30%"
                        >
                          Last Check-In
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
                          w="30%"
                        >
                          Last Check-Out
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
                          w="15%"
                        >
                          Actions
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {filtered.map((visitor) => (
                        <Box
                          as="tr"
                          key={visitor.id}
                          _hover={{ bg: "gray.50" }}
                          cursor="pointer"
                          onClick={() =>
                            router.push(
                              `/visitor-history-preview?id=${visitor.id}&source=existing&approvalReq=${isApprovalRequired}`
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              router.push(
                                `/visitor-history-preview?id=${visitor.id}&source=existing&approvalReq=${isApprovalRequired}`
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
                                position="relative"
                              >
                                {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] && isValidImageUrl(resolvedImageUrls[visitor.imgUrl]) ? (
                                  <Image
                                    src={resolvedImageUrls[visitor.imgUrl]}
                                    alt={visitor.fullName}
                                    width={40}
                                    height={40}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                    }}
                                    onError={(e) => {
                                      console.error("Image failed to load:", e);
                                      // Force re-render to show fallback
                                      setResolvedImageUrls(prev => ({
                                        ...prev,
                                        [visitor.imgUrl || ""]: ""
                                      }));
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
                            <Text fontSize="xs" color="#18181b">
                              {visitor.checkInTime
                                ? formatDateTime(visitor.checkInTime)
                                : "-"}
                            </Text>
                          </Box>
                          <Box as="td" px={4} py={4}>
                            <Text fontSize="xs" color="#18181b">
                              {visitor.checkOutTime
                                ? formatDateTime(visitor.checkOutTime)
                                : "-"}
                            </Text>
                          </Box>
                          <Box as="td" px={4} py={4} textAlign="center">
                            <Flex w="full" justify="center" align="center">
                              <Box
                                w="36px"
                                h="36px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                cursor="pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/visitor-history-preview?id=${visitor.id}&source=existing&approvalReq=${isApprovalRequired}`
                                  );
                                }}
                              >
                                <RightArrowIcon />
                              </Box>
                            </Flex>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* Mobile Layout - Hidden on Desktop */}
      <Flex
        display={{ base: "flex", md: "none" }}
        direction="column"
        align="center"
        justify="flex-start"
        minH="100vh"
        bg="#fff"
        overflow="hidden"
        pt={0}
        px={0}
      >
        {/* Mobile Header */}
        <Flex
          as="header"
          align="center"
          justify="center"
          w="full"
          h="70px"
          minH="70px"
          maxH="70px"
          bg="#f4edfefa"
          borderBottom="1px solid #f2f2f2"
          position="relative"
          px={0}
          flexShrink={0}
        >
          <Box
            position="absolute"
            left={2}
            top="50%"
            transform="translateY(-50%)"
            as="button"
            tabIndex={0}
            aria-label="Go back to Check-In Visitor"
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
            onClick={() => router.push("/check-in-visitor")}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push("/check-in-visitor"); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">Existing Visitor</Text>
        </Flex>
        <Box
          w="full"
          maxW="390px"
          mx="auto"
          py={{ base: 4, md: 6 }}
          px={{ base: 4, sm: 6, md: 8 }}
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="flex-start"
          gap={6}
        >
          <SearchBar
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
            placeholder="Search Visitor..."
            //  onFilterClick={() => { /* TODO: Implement filter logic */ }}
          />
          {/* Visitor List UI below SearchBar */}
          <Flex direction="column" gap={4} w="full" flex={1}>
            {filtered.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                flex={1}
                minH="50vh"
                gap={3}
              >
                <Text
                  fontSize="lg"
                  fontWeight="medium"
                  color="gray.400"
                  textAlign="center"
                >
                  {searchQuery
                    ? "No visitors found matching your search"
                    : "No visitors found"}
                </Text>
              </Flex>
            ) : (
              filtered.map((visitor) => (
                <Flex
                  key={visitor.id}
                  align="center"
                  justify="space-between"
                  className="w-full"
                  py={2}
                  cursor="pointer"
                  tabIndex={0}
                  role="button"
                   aria-label={`View ${visitor.fullName}'s visit history`}
                  onClick={() =>
                    router.push(`/visitor-history-preview?id=${visitor.id}&source=existing&approvalReq=${isApprovalRequired}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/visitor-history-preview?id=${visitor.id}&source=existing&approvalReq=${isApprovalRequired}`);
                    }
                  }}
                  _hover={{ bg: "#f3f2fd" }}
                  _focus={{ bg: "#f3f2fd" }}
                >
                  <Flex align="center" gap={3}>
                    {/* Blank Avatar */}
                    {/* <Box w="44px" h="44px" borderRadius="full" bg="#d9d9d9" /> */}
                    <Avatar.Root boxSize="40px">
                      <Avatar.Fallback fontSize="sm" fontWeight="bold">
                        {getInitials(visitor.fullName)}
                      </Avatar.Fallback>
                      {visitor.imgUrl && resolvedImageUrls[visitor.imgUrl] && isValidImageUrl(resolvedImageUrls[visitor.imgUrl]) && (
                        <Avatar.Image
                          src={resolvedImageUrls[visitor.imgUrl]}
                          alt={visitor.fullName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            console.error("Image failed to load:", e);
                            // Force re-render to show fallback
                            setResolvedImageUrls(prev => ({
                              ...prev,
                              [visitor.imgUrl || ""]: ""
                            }));
                          }}
                        />
                      )}
                    </Avatar.Root>
                    <Flex direction="column" gap={1}>
                      <Text fontWeight="bold" fontSize="sm" color="#18181b">
                        {visitor.fullName}
                      </Text>
                      
                      {/* Date and Time in Single Line with Gray Background */}
                      <Flex
                        align="center"
                        bg="#F2F2F2"
                        borderRadius="12px"
                        px={2}
                        py={1}
                        minH="22px"
                        w="fit-content"
                        gap={2}
                        mt={1}
                        flexWrap="nowrap"
                      >
                        {/* Date */}
                        <Text
                          fontWeight="600"
                          fontSize="2xs"
                          color="#18181B"
                          whiteSpace="nowrap"
                        >
                          {getDisplayDate(visitor)}
                        </Text>

                        {/* Status-based display with timestamps */}
                        {(visitor.status === "CHECKED_IN" ||
                          visitor.status === "checked_in") && (
                          <Flex align="center" gap={1}>
                            <svg
                              width="8"
                              height="6"
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
                              fontSize="2xs"
                              color="#18181B"
                              whiteSpace="nowrap"
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
                          <Flex align="center" gap={2}>
                            {/* Check-in time */}
                            <Flex align="center" gap={1}>
                              <svg
                                width="8"
                                height="6"
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
                                fontSize="2xs"
                                color="#18181B"
                                whiteSpace="nowrap"
                              >
                                {formatCheckInTime(
                                  visitor.checkInTime
                                ) || "Checked In"}
                              </Text>
                            </Flex>
                            {/* Check-out time */}
                            <Flex align="center" gap={1}>
                              <svg
                                width="8"
                                height="6"
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
                                fontSize="2xs"
                                color="#18181B"
                                whiteSpace="nowrap"
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
                          <Text
                            fontWeight="600"
                            fontSize="2xs"
                            color="#18181B"
                            whiteSpace="nowrap"
                          >
                            Pending
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                  </Flex>
                  {/* Right Arrow Icon */}
                  <Box
                    w="36px"
                    h="36px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <RightArrowIcon />
                  </Box>
                </Flex>
              ))
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default VisitorDetails;