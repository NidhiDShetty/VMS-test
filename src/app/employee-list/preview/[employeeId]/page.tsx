"use client";
import { Box, Flex, Text, Button, Badge, IconButton } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import {
  getEmployeesLog,
  EmployeeLog,
} from "@/app/api/invite-employees/client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { FiChevronLeft } from "react-icons/fi";
import DesktopHeader from "@/components/DesktopHeader";
import { getVisitorImage } from "@/app/api/visitor-image/routes";
import { FRONTEND_URL } from "@/lib/server-urls";

// Custom component to handle authenticated profile images
const ProfileImage: React.FC<{
  avatarUrl: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ avatarUrl, alt, width = 60, height = 60, style }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!avatarUrl) {
      setImageSrc(null);
      return;
    }

    // If it's already a data URL, use it directly
    if (avatarUrl.startsWith("data:")) {
      setImageSrc(avatarUrl);
      return;
    }

    // If it's an absolute URL, use it directly
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      setImageSrc(avatarUrl);
      return;
    }

    // For relative paths, use the visitor image API function
    const fetchImage = async () => {
      setLoading(true);
      try {
        const result = await getVisitorImage(avatarUrl);

        if (result.success && result.data?.imageData) {
          setImageSrc(result.data.imageData);
        } else {
          // If no image data, show fallback
          setImageSrc(null);
        }
      } catch (error) {
        console.error("Failed to fetch profile image:", error);
        setImageSrc(null);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [avatarUrl]);

  if (loading) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
          borderRadius: "50%",
          ...style,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!imageSrc) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#d9d9d9",
          borderRadius: "50%",
          color: "black",
          fontWeight: "bold",
          fontSize: "16px",
          ...style,
        }}
      >
        {alt?.charAt(0).toUpperCase() || "?"}
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      style={{
        borderRadius: "50%",
        objectFit: "cover",
        width: `${width}px`,
        height: `${height}px`,
        display: "block",
        ...style,
      }}
    />
  );
};

// Mobile HeaderBar (unchanged)
const MobileHeaderBar = () => {
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
        aria-label="Go back to Employee List"
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="24px"
        h="24px"
        borderRadius="full"
        bg="transparent"
        _hover={{ bg: "gray.100" }}
        p={0}
        role="button"
        onClick={() => router.push("/employee-list")}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            router.push("/employee-list");
          }
        }}
        cursor="pointer"
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
            stroke="#18181B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize="md" color="#181a1b">
        Employee Profile
      </Text>
    </Flex>
  );
};

// ProfileCard with responsive mobile and web layouts
const ProfileCard: React.FC<{ employee: EmployeeLog }> = ({ employee }) => {
  return (
    <>
      {/* Mobile Layout - Direct pink card without white wrapper */}
      <Box display={{ base: "block", md: "none" }}>
        <Box
          position="relative"
          w="full"
          bg="#f4f3fd"
          borderBottomRadius="lg"
          borderTopRadius="lg"
          boxShadow="sm"
          px={{ base: 3, sm: 6, md: 8 }}
          pt={10}
          pb={3}
          minH="240px"
          maxW="370px"
          mx="auto"
          mt={{ base: 2, md: 8 }}
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
            bg="white"
            boxShadow="md"
          >
            {employee.avatarUrl ? (
              <ProfileImage
                avatarUrl={employee.avatarUrl}
                alt={employee.name}
                width={56}
                height={56}
                style={{
                  objectFit: "cover",
                  borderRadius: "50%",
                  width: "56px",
                  height: "56px",
                }}
              />
            ) : (
              <Flex
                w="full"
                h="full"
                align="center"
                justify="center"
                bg="#d9d9d9"
                color="black"
                fontWeight="bold"
                fontSize="xl"
              >
                {employee.name?.charAt(0).toUpperCase() || "?"}
              </Flex>
            )}
          </Box>

          {/* Two-column info grid */}
          <Box mt={2} w="full">
            <Box
              as="dl"
              display="grid"
              gridTemplateColumns={{ base: "100px 1fr", sm: "120px 1fr" }}
              rowGap={4}
              columnGap={4}
            >
              <Text
                as="dt"
                fontWeight="bold"
                color="gray.600"
                fontSize="xs"
                textAlign="left"
              >
                Host Name :
              </Text>
              <Text
                as="dd"
                color="gray.800"
                fontSize="xs"
                textAlign="right"
                truncate
              >
                {employee.name}
              </Text>
              <Text
                as="dt"
                fontWeight="bold"
                color="gray.600"
                fontSize="xs"
                textAlign="left"
              >
                Phone No :
              </Text>
              <Text
                as="dd"
                color="gray.800"
                fontSize="xs"
                textAlign="right"
                truncate
              >
                {employee.phoneNo || employee.phone || "-"}
              </Text>
              <Text
                as="dt"
                fontWeight="bold"
                color="gray.600"
                fontSize="xs"
                textAlign="left"
              >
                Role :
              </Text>
              <Text
                as="dd"
                color="gray.800"
                fontSize="xs"
                textAlign="right"
                truncate
              >
                {employee.type || "-"}
              </Text>
              <Text
                as="dt"
                fontWeight="bold"
                color="gray.600"
                fontSize="xs"
                textAlign="left"
              >
                Email :
              </Text>
              <Text
                as="dd"
                color="gray.800"
                fontSize="xs"
                textAlign="right"
                truncate
              >
                {employee.email}
              </Text>
              <Text
                as="dt"
                fontWeight="bold"
                color="gray.600"
                fontSize="xs"
                textAlign="left"
              >
                Status :
              </Text>
              <Box display="flex" justifyContent="flex-end" alignItems="center">
                <Badge
                  fontSize="xs"
                  px={3}
                  h="22px"
                  display="flex"
                  alignItems="center"
                  borderRadius="full"
                  bg={employee.status === "Accepted" ? "#23A36D" : "#8A38F5"}
                  color="#fff"
                  fontWeight="semibold"
                  lineHeight="1"
                  whiteSpace="nowrap"
                  overflow="hidden"
                >
                  {employee.status === "Accepted" ? "Accepted" : "Invited"}
                </Badge>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Web Layout - White wrapper card */}
      <Box
        bg="white"
        borderRadius={{ base: "8px", md: "12px" }}
        px={{ base: 3, md: 6 }}
        py={{ base: 3, md: 6 }}
        mt={{ base: 2, md: 8 }}
        w={{ base: "calc(100% - 16px)", md: "75%" }}
        mx="auto"
        boxShadow="sm"
        display={{ base: "none", md: "block" }}
      >
        {/* Web Layout - Full Screen Card Format */}
        <Flex
          align="center"
          w="full"
          px={8}
          py={6}
          display={{ base: "none", md: "flex" }}
          gap={6}
        >
          {/* Employee Icon */}
          <Box
            w="60px"
            h="60px"
            borderRadius="full"
            bg="#F4EDFE"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            {employee.avatarUrl ? (
              <ProfileImage
                avatarUrl={employee.avatarUrl}
                alt={employee.name}
                width={60}
                height={60}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  width: "60px",
                  height: "60px",
                }}
              />
            ) : (
              <Text fontSize="24px" fontWeight="bold" color="#5F24AC">
                {employee.name?.charAt(0).toUpperCase() || "?"}
              </Text>
            )}
          </Box>

          {/* Employee Name */}
          <Flex direction="column" gap={1} flex="1" minW="0">
            <Text fontWeight="normal" color="#666" fontSize="sm">
              Employee Name:
            </Text>
            <Text color="#18181b" fontSize="sm" fontWeight="bold" truncate>
              {employee.name}
            </Text>
          </Flex>

          {/* Separator */}
          <Box w="1px" h="40px" bg="#E2E8F0" flexShrink={0} />

          {/* Phone No */}
          <Flex direction="column" gap={1} flex="1" minW="0">
            <Text fontWeight="normal" color="#666" fontSize="sm">
              Phone No:
            </Text>
            <Text color="#18181b" fontSize="sm" fontWeight="bold" truncate>
              {employee.phoneNo || employee.phone || "-"}
            </Text>
          </Flex>

          {/* Separator */}
          <Box w="1px" h="40px" bg="#E2E8F0" flexShrink={0} />

          {/* Email */}
          <Flex direction="column" gap={1} flex="1" minW="0">
            <Text fontWeight="normal" color="#666" fontSize="sm">
              Email:
            </Text>
            <Text color="#18181b" fontSize="sm" fontWeight="bold" truncate>
              {employee.email}
            </Text>
          </Flex>

          {/* Separator */}
          <Box w="1px" h="40px" bg="#E2E8F0" flexShrink={0} />

          {/* Role */}
          <Flex direction="column" gap={1} flex="1" minW="0">
            <Text fontWeight="normal" color="#666" fontSize="sm">
              Role:
            </Text>
            <Text color="#18181b" fontSize="sm" fontWeight="bold" truncate>
              {employee.type || "-"}
            </Text>
          </Flex>

          {/* Separator */}
          <Box w="1px" h="40px" bg="#E2E8F0" flexShrink={0} />

          {/* Status */}
          <Flex direction="column" gap={1} flex="1" minW="0">
            <Text fontWeight="normal" color="#666" fontSize="sm">
              Status:
            </Text>
            <Badge
              bg={employee.status === "Accepted" ? "#23A36D" : "#8A38F5"}
              color="white"
              borderRadius="12px"
              px={4}
              h="22px"
              display="flex"
              alignItems="center"
              fontSize="xs"
              fontWeight="normal"
              minW="70px"
              justifyContent="center"
              aria-label={`Status: ${employee.status}`}
              tabIndex={0}
            >
              {employee.status === "Accepted" ? "Accepted" : "Invited"}
            </Badge>
          </Flex>
        </Flex>
      </Box>
    </>
  );
};

const EmployeeProfilePreviewPage = () => {
  const router = useRouter();
  const params = useParams();
  const { employeeId } = params as { employeeId: string };
  const [employee, setEmployee] = useState<EmployeeLog | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom function to fetch fresh employee data with cache busting
  const fetchFreshEmployees = useCallback(async () => {
    const authData = typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (!authData) throw new Error("No auth data");
    
    const parsed = JSON.parse(authData);
    const token = parsed?.token;
    if (!token) throw new Error("No token found");
    
    const cacheBuster = `_=${new Date().getTime()}`;
    
    const response = await fetch(`${FRONTEND_URL}/api/invite-employees/?${cacheBuster}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch employees log");
    }
    
    const result = await response.json();
    return Array.isArray(result.data) ? result.data : [];
  }, [FRONTEND_URL]);

  useEffect(() => {
    const fetchEmployee = async () => {
      setLoading(true);
      try {
        // Fetch fresh employee data with cache busting
        const employees = await fetchFreshEmployees();
        const found = employees.find(
          (emp: EmployeeLog) =>
            String(emp.invId) === String(employeeId) ||
            String(emp.id) === String(employeeId)
        );
        setEmployee(found || null);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        setEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('Profile update event received, refreshing employee data for:', employeeId);
      // Refresh employee data when profile is updated - add small delay to ensure backend has updated
      setTimeout(() => {
        const fetchEmployee = async () => {
          setLoading(true);
          try {
            // Fetch fresh employee data with cache busting
            const employees = await fetchFreshEmployees();
            console.log('Fetched employees count:', employees.length);
            const found = employees.find(
              (emp: EmployeeLog) =>
                String(emp.invId) === String(employeeId) ||
                String(emp.id) === String(employeeId)
            );
            console.log('Found employee:', found?.name, 'Phone:', found?.phoneNo || found?.phone);
            setEmployee(found || null);
          } catch (error) {
            console.error("Failed to fetch employee:", error);
            setEmployee(null);
          } finally {
            setLoading(false);
          }
        };
        fetchEmployee();
      }, 500); // 500ms delay to allow backend to process the update
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [employeeId, fetchFreshEmployees]);

  // Refresh data when window gains focus or page becomes visible
  useEffect(() => {
    const handleFocus = async () => {
      const employees = await fetchFreshEmployees();
      const found = employees.find(
        (emp: EmployeeLog) =>
          String(emp.invId) === String(employeeId) ||
          String(emp.id) === String(employeeId)
      );
      setEmployee(found || null);
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const employees = await fetchFreshEmployees();
        const found = employees.find(
          (emp: EmployeeLog) =>
            String(emp.invId) === String(employeeId) ||
            String(emp.id) === String(employeeId)
        );
        setEmployee(found || null);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [employeeId, fetchFreshEmployees]);

  return (
    <Flex direction="column" minH="100vh" bg="white" w="full">
      {/* Responsive Header */}
      <Box display={{ base: "block", md: "none" }}>
        <MobileHeaderBar />
      </Box>
      <Box display={{ base: "none", md: "block" }}>
        <DesktopHeader notificationCount={9} />
      </Box>

      {/* Main Content Area */}
      <Box
        flex={1}
        pt={{ base: "20px", md: "20px" }}
        display="flex"
        flexDirection="column"
        bg="white"
      >
        {/* Mobile Layout */}
        <Box
          display={{ base: "flex", md: "none" }}
          flex={1}
          flexDirection="column"
          bg="white"
        >
          {loading ? (
            <Flex direction="column" align="center" justify="center" flex="1">
              <Text color="gray.500" fontWeight="bold">
                Loading...
              </Text>
            </Flex>
          ) : !employee ? (
            <Flex direction="column" align="center" justify="center" flex="1">
              <Text color="red.500" fontWeight="bold">
                Employee not found.
              </Text>
              <Button
                mt={4}
                onClick={() => router.push("/employee-list")}
                colorScheme="purple"
                tabIndex={0}
                aria-label="Go back to Employee List"
              >
                Go Back
              </Button>
            </Flex>
          ) : (
            <>
              <ProfileCard employee={employee} />
              <Box w="full" px={4} mt="auto" mb={8}>
                {employee.status === "invited" ? (
                  <Button
                    w="full"
                    h="48px"
                    bg="#8A37F7"
                    color="white"
                    fontWeight="bold"
                    fontSize="md"
                    borderRadius="md"
                    _hover={{ bg: "#6C2BC2" }}
                    _active={{ bg: "#6C2BC2" }}
                    tabIndex={0}
                    aria-label="Re - Invite Employee"
                    role="button"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={3}
                    onClick={() => {
                      /* Add re-invite logic here */
                    }}
                  >
                    Re - Invite
                  </Button>
                ) : (
                  <Button
                    w="full"
                    h="48px"
                    bg="#8A37F7"
                    color="white"
                    fontWeight="bold"
                    fontSize="md"
                    borderRadius="md"
                    _hover={{ bg: "#6C2BC2" }}
                    _active={{ bg: "#6C2BC2" }}
                    tabIndex={0}
                    aria-label="Go back to Employee List"
                    role="button"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap={3}
                    onClick={() => router.push("/employee-list")}
                  >
                    Go Back
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>

        {/* Web Layout */}
        <Box
          display={{ base: "none", md: "flex" }}
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
            <Flex align="center" gap={4}>
              <IconButton
                aria-label="Go back to Employee List"
                size="sm"
                variant="ghost"
                onClick={() => router.push("/employee-list")}
                color="#8A37F7"
                _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
              >
                <FiChevronLeft />
              </IconButton>
              <Text fontSize="lg" color="#18181b" fontWeight="bold">
                Employee Profile
              </Text>
            </Flex>
          </Flex>

          {/* Content Area */}
          <Box
            flex={1}
            position="relative"
            overflowY="auto"
            display="flex"
            flexDirection="column"
          >
            {loading ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                flex="1"
                h="400px"
              >
                <Text color="gray.500" fontWeight="bold">
                  Loading...
                </Text>
              </Flex>
            ) : !employee ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                flex="1"
                h="400px"
              >
                <Text color="red.500" fontWeight="bold">
                  Employee not found.
                </Text>
                <Button
                  mt={4}
                  onClick={() => router.push("/employee-list")}
                  colorScheme="purple"
                  tabIndex={0}
                  aria-label="Go back to Employee List"
                >
                  Go Back
                </Button>
              </Flex>
            ) : (
              <>
                <Box px={6} position="relative" zIndex={1} flex={1}>
                  <ProfileCard employee={employee} />
                </Box>

                {/* Action Button at Bottom */}
                <Box mt="auto" mb={8} display="flex" justifyContent="center">
                  {employee.status === "invited" ? (
                    <Button
                      w="200px"
                      h="48px"
                      bg="#8A37F7"
                      color="white"
                      fontWeight="bold"
                      fontSize="md"
                      borderRadius="md"
                      _hover={{ bg: "#6C2BC2" }}
                      _active={{ bg: "#6C2BC2" }}
                      tabIndex={0}
                      aria-label="Re - Invite Employee"
                      role="button"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={3}
                      onClick={() => {
                        /* Add re-invite logic here */
                      }}
                    >
                      Re - Invite
                    </Button>
                  ) : (
                    <Button
                      w="340px"
                      h="56px"
                      bg="#8A37F7"
                      color="white"
                      fontWeight="bold"
                      fontSize="lg"
                      borderRadius="md"
                      _hover={{ bg: "#6C2BC2" }}
                      _active={{ bg: "#6C2BC2" }}
                      tabIndex={0}
                      aria-label="Go back to Employee List"
                      role="button"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      gap={3}
                      onClick={() => router.push("/employee-list")}
                    >
                      Go Back
                    </Button>
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

export default EmployeeProfilePreviewPage;
