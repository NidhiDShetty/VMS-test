"use client";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  HStack,
  Portal,
  Dialog,
  Table,
  IconButton,
} from "@chakra-ui/react";
import { useEffect, useCallback, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/ui/SearchBar";
import {
  getEmployeesLog,
  EmployeeLog,
  deleteEmployee,
} from "@/app/api/invite-employees/client";
import InviteEmployeeModal from "./InviteEmployeeModal";
import { toaster } from "@/components/ui/toaster";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import DesktopHeader from "@/components/DesktopHeader";
import { getVisitorImage } from "@/app/api/visitor-image/routes";

// Custom component to handle authenticated profile images
const ProfileImage: React.FC<{
  avatarUrl: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}> = ({ avatarUrl, alt, width = 44, height = 48, style }) => {
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
          borderRadius: "8px",
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
          borderRadius: "8px",
          color: "black",
          fontWeight: "bold",
          fontSize: "14px",
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
        borderRadius: "8px",
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
      h={{ base: "70px", md: "48px" }}
      bg="#f4edfefa"
      borderBottom="1px solid #f2f2f2"
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={1000}
      px={0}
    >
      <Box
        position="absolute"
        left={2}
        top="50%"
        transform="translateY(-50%)"
        as="button"
        tabIndex={0}
        aria-label="Go back to Dashboard"
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
        onClick={() => router.push("/dashboard")}
        onKeyDown={(_e) => {
          if (_e.key === "Enter" || _e.key === " ") {
            router.push("/dashboard");
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
      <Text fontWeight="bold" fontSize="sm" color="#181a1b">
        Employee List
      </Text>
    </Flex>
  );
};

// Remove local Employee type/interface and mockEmployees array

const tabOptions = [
  { label: "All Employee", value: "0" },
  { label: "Invited", value: "1" },
  { label: "Accepted", value: "2" },
];

// Standalone badge row component for check-in/check-out info
import React from "react";
const CheckInOutBadgeRow = ({
  visitDate = "23/06/2025",
  checkInTime = "09:00 AM",
  checkOutTime = "10:10 AM",
}: {
  visitDate: string;
  checkInTime?: string;
  checkOutTime?: string;
}) => (
  <Flex
    align="center"
    bg="#f3f4f6"
    borderRadius="xl"
    h={{ base: "20px", sm: "22px" }}
    px={{ base: 1, sm: 2 }}
    gap={{ base: 0.5, sm: 2 }}
    minW={0}
    maxW="100%"
    overflow="hidden"
    whiteSpace="nowrap"
    alignItems="center"
    mt={{ base: 1, sm: 4 }}
  >
    <Text
      fontWeight="bold"
      fontSize={{ base: "2xs", sm: "xs" }}
      color="#181a1b"
      whiteSpace="nowrap"
      truncate
    >
      {visitDate}:
    </Text>
    {checkInTime && (
      <HStack gap={{ base: 0.5, sm: 1 }} align="center">
        <Box
          as="span"
          display="inline-block"
          w={{ base: "12px", sm: "13px" }}
          h={{ base: "12px", sm: "13px" }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
              fill="#23A36D"
            />
          </svg>
        </Box>
        <Text
          fontSize={{ base: "2xs", sm: "xs" }}
          color="#23292e"
          fontWeight="medium"
          whiteSpace="nowrap"
          truncate
        >
          {checkInTime}
        </Text>
      </HStack>
    )}
    {checkOutTime && (
      <HStack gap={{ base: 0.5, sm: 1 }} align="center">
        <Box
          as="span"
          display="inline-block"
          w={{ base: "12px", sm: "13px" }}
          h={{ base: "12px", sm: "13px" }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
              fill="#E34935"
            />
          </svg>
        </Box>
        <Text
          fontSize={{ base: "2xs", sm: "xs" }}
          color="#23292e"
          fontWeight="medium"
          whiteSpace="nowrap"
          truncate
        >
          {checkOutTime}
        </Text>
      </HStack>
    )}
  </Flex>
);

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  recordsPerPage,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords: number;
  recordsPerPage: number;
}) => {
  const startRecord = (currentPage - 1) * recordsPerPage + 1;
  const endRecord = Math.min(currentPage * recordsPerPage, totalRecords);

  return (
    <Flex
      align="center"
      justify="space-between"
      w="full"
      px={6}
      py={4}
      bg="transparent"
    >
      {/* Left side - Records per page */}
      {/* <Flex align="center" gap={2}>
        <Text fontSize="sm" color="#666">
          Showing
        </Text>
        <Box
          px={2}
          py={1}
          border="1px solid #d1d5db"
          borderRadius="md"
          bg="white"
        >
          <Text fontSize="sm" color="#666" fontWeight="medium">
            {recordsPerPage}
          </Text>
        </Box>
      </Flex> */}

      {/* Center - Records info */}
      <Flex flex={1} justify="center">
        <Text fontSize="sm" color="#666">
          Showing {startRecord}-{endRecord} of {totalRecords} records
        </Text>
      </Flex>

      {/* Right side - Page navigation */}
      <Flex align="center" gap={1}>
        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          p={2}
          borderRadius="md"
          _hover={{ bg: "gray.100" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>

        {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
          const pageNum = i + 1;
          return (
            <Button
              key={pageNum}
              variant="ghost"
              size="sm"
              bg={currentPage === pageNum ? "#8A37F7" : "transparent"}
              color={currentPage === pageNum ? "white" : "#666"}
              _hover={
                currentPage === pageNum ? { bg: "#6C2BC2" } : { bg: "gray.100" }
              }
              onClick={() => onPageChange(pageNum)}
              minW="32px"
              h="32px"
              borderRadius="md"
              fontWeight="medium"
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          p={2}
          borderRadius="md"
          _hover={{ bg: "gray.100" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </Flex>
    </Flex>
  );
};

const EmployeeListPage = () => {
  const {} = useDeviceDetection();
  const [search, setSearch] = useState("");
  const [tabIndex, setTabIndex] = useState("0");
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeLog[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeLog | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const router = useRouter();

  // Fetch employees from backend
  const fetchEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      const data = await getEmployeesLog();
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        setEmployees([]);
        // Optionally show an error toast here
      }
    } catch (error: unknown) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchEmployees(); // Refresh employee list when profile is updated
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [fetchEmployees]);

  // When modal closes, refresh list
  const handleInviteClose = () => {
    setInviteOpen(false);
    fetchEmployees();
  };

  // Handle delete employee
  const handleDeleteClick = (employee: EmployeeLog, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete?.invId) return;

    setIsDeleting(true);
    try {
      const result = await deleteEmployee(employeeToDelete.invId);

      if (result.success) {
        // Get role-specific text based on employee type
        const roleText =
          employeeToDelete.type === "Security"
            ? "Security"
            : employeeToDelete.type === "Admin"
            ? "Admin"
            : employeeToDelete.type === "Employee"
            ? "Employee"
            : employeeToDelete.type === "Host"
            ? "Host"
            : "Employee";

        toaster.create({
          type: "success",
          title: `${roleText} deleted successfully`,
          description: `${roleText} has been removed successfully.`,
          duration: 3000,
          closable: true,
        });

        // Refresh the employee list
        await fetchEmployees();
      } else {
        // Get role-specific text based on employee type for error message
        const roleText =
          employeeToDelete.type === "Security"
            ? "Security"
            : employeeToDelete.type === "Admin"
            ? "Admin"
            : employeeToDelete.type === "Employee"
            ? "Employee"
            : employeeToDelete.type === "Host"
            ? "Host"
            : "Employee";

        toaster.create({
          type: "error",
          title: "Error",
          description: result.message || `Failed to delete ${roleText}.`,
          duration: 3000,
          closable: true,
        });
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
      
      // Get role-specific text based on employee type for error message
      const roleText =
        employeeToDelete?.type === "Security"
          ? "Security"
          : employeeToDelete?.type === "Admin"
          ? "Admin"
          : employeeToDelete?.type === "Employee"
          ? "Employee"
          : employeeToDelete?.type === "Host"
          ? "Host"
          : "Employee";

      toaster.create({
        type: "error",
        title: "Error",
        description: `Failed to delete ${roleText}.`,
        duration: 3000,
        closable: true,
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setEmployeeToDelete(null);
  };

  // Filtering logic
  const filteredEmployees = Array.isArray(employees)
    ? employees.filter((emp) => {
        const matchesSearch =
          emp.name &&
          emp.name
            .toLowerCase()
            .split(/\s+/)
            .some((word) => word.startsWith(search.toLowerCase()));
        if (tabIndex === "1") return emp.status === "Invited" && matchesSearch;
        if (tabIndex === "2") return emp.status === "Accepted" && matchesSearch;
        return matchesSearch;
      })
    : [];

  // Pagination logic
  const totalRecords = filteredEmployees.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, tabIndex]);

  return (
    <Flex direction="column" minH="100vh" bg="#f8fafc" className="w-full">
      {/* Responsive Header */}
      <Box display={{ base: "block", lg: "none" }}>
        <MobileHeaderBar />
      </Box>
      <DesktopHeader notificationCount={9} />
      {/* Main Content Area */}
      <Box
        flex={1}
        pt={{ base: "44px", lg: "0px" }}
        display="flex"
        flexDirection="column"
      >
        {/* Mobile Layout */}
        <Box display={{ base: "block", lg: "none" }} w="full">
          <Box w="full" px={2} pt={3} mt={2}>
            {/* Invite Employee Button */}
            <Button
              w="full"
              maxW="420px"
              h="48px"
              mt={3}
              mb={2}
              px={3}
              mx="auto"
              bg="#8A37F7"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              borderRadius="md"
              _hover={{ bg: "#6C2BC2" }}
              _active={{ bg: "#6C2BC2" }}
              tabIndex={0}
              aria-label="Invite Employee"
              role="button"
              onClick={() => setInviteOpen(true)}
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={3}
            >
              <Box
                as="span"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <svg
                  width="29"
                  height="28"
                  viewBox="0 0 29 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M28.5 17.5H18V28H11V17.5H0.5V10.5H11V0H18V10.5H28.5V17.5Z"
                    fill="white"
                  />
                </svg>
              </Box>
              Add Employee
            </Button>
          </Box>
        </Box>

        {/* Web Layout */}
        <Box
          display={{ base: "none", lg: "flex" }}
          flex={1}
          bg="white"
          flexDirection="column"
        >
          {/* Page Title and Actions */}
          <Flex
            align="center"
            justify="space-between"
            px={6}
            py={4}
            bg="#f4edfefa"
          >
            <Flex align="center" gap={3}>
              <IconButton
                aria-label="Back"
                tabIndex={0}
                variant="ghost"
                fontSize="lg"
                bg="#FFF"
                onClick={() => router.push("/dashboard")}
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
              <Text fontSize="lg" color="#18181b" fontWeight="bold">
                Employees List
              </Text>
            </Flex>

            <Flex align="center" gap={4}>
              {/* Search Bar */}
              <Box w="300px">
                <SearchBar
                  value={search}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search...."
                />
              </Box>

              <Button
                bg="#8A37F7"
                color="white"
                fontWeight="bold"
                px={6}
                py={2}
                borderRadius="md"
                _hover={{ bg: "#6C2BC2" }}
                _active={{ bg: "#6C2BC2" }}
                onClick={() => setInviteOpen(true)}
                display="flex"
                alignItems="center"
                gap={2}
              >
                <svg width="20" height="20" viewBox="0 0 29 28" fill="none">
                  <path
                    d="M28.5 17.5H18V28H11V17.5H0.5V10.5H11V0H18V10.5H28.5V17.5Z"
                    fill="white"
                  />
                </svg>
                Add Employee
              </Button>
            </Flex>
          </Flex>

          {/* Tabs */}
          <Box px={6} py={4} bg="#f4edfefa">
            <Flex w="full">
              {tabOptions.map((tab) => {
                const isSelected = tabIndex === tab.value;
                return (
                  <Button
                    key={tab.value}
                    variant="ghost"
                    fontWeight={isSelected ? "bold" : "normal"}
                    color={isSelected ? "#8A37F7" : "#666"}
                    borderBottom={
                      isSelected ? "2px solid #8A37F7" : "2px solid transparent"
                    }
                    borderRadius={0}
                    pb={2}
                    px={0}
                    flex={1}
                    _hover={{ bg: "transparent", color: "#8A37F7" }}
                    onClick={() => setTabIndex(tab.value)}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </Flex>
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
                      py={3}
                      px={6}
                      borderBottom="none"
                      w="40%"
                    >
                      <Flex align="center" gap={2}>
                        Name
                        <Box position="relative">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M7 14l5-5 5 5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ position: "absolute", top: "-6px" }}
                          >
                            <path
                              d="M17 10l-5 5-5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Box>
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={3}
                      px={6}
                      borderBottom="none"
                      w="25%"
                    >
                      <Flex align="center" gap={2}>
                        Type
                        <Box position="relative">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M7 14l5-5 5 5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ position: "absolute", top: "-6px" }}
                          >
                            <path
                              d="M17 10l-5 5-5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Box>
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={3}
                      px={6}
                      borderBottom="none"
                      w="25%"
                      textAlign="center"
                    >
                      <Flex align="center" justify="center" gap={2}>
                        Status
                        <Box position="relative">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M7 14l5-5 5 5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ position: "absolute", top: "-6px" }}
                          >
                            <path
                              d="M17 10l-5 5-5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Box>
                      </Flex>
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      color="white"
                      fontWeight="bold"
                      py={3}
                      px={6}
                      borderBottom="none"
                      w="auto"
                      textAlign="center"
                    >
                      <Flex align="center" justify="center" gap={2}>
                        Action
                        <Box position="relative">
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M7 14l5-5 5 5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{ position: "absolute", top: "-6px" }}
                          >
                            <path
                              d="M17 10l-5 5-5-5"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Box>
                      </Flex>
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {employeesLoading ? (
                    <Table.Row bg="white">
                      <Table.Cell colSpan={4} py={8} textAlign="center">
                        <Flex align="center" justify="center" gap={2}>
                          <Box
                            w="4"
                            h="4"
                            bg="#8A37F7"
                            borderRadius="full"
                            animation="pulse 1.5s ease-in-out infinite"
                          />
                          <Text color="gray.500">Loading employees...</Text>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  ) : paginatedEmployees.length === 0 ? (
                    <Table.Row bg="white">
                      <Table.Cell colSpan={4} py={8} textAlign="center">
                        <Text color="gray.500">No employees found.</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paginatedEmployees.map((emp) => (
                      <Table.Row
                        key={`${emp.invId}-${emp.email}`}
                        bg="white"
                        _hover={{ bg: "#f8fafc" }}
                      >
                        <Table.Cell py={4} px={6} w="40%">
                          <Flex align="center" gap={3}>
                            <ProfileImage
                              avatarUrl={emp.avatarUrl}
                              alt={emp.name}
                              width={32}
                              height={32}
                              style={{
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                            />
                            <Text
                              color="#3b82f6"
                              textDecoration="underline"
                              fontWeight="medium"
                            >
                              {emp.name}
                            </Text>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell py={4} px={6} w="25%">
                          <Text color="#666">{emp.type}</Text>
                        </Table.Cell>
                        <Table.Cell py={4} px={6} w="25%" textAlign="center">
                          <Flex justify="center">
                            <Badge
                              bg={
                                emp.status === "Accepted"
                                  ? "#23A36D"
                                  : "#8A38F5"
                              }
                              color="white"
                              px={3}
                              py={1}
                              borderRadius="full"
                              fontSize="sm"
                              fontWeight="semibold"
                            >
                              {emp.status === "Accepted"
                                ? "Accepted"
                                : "Invited"}
                            </Badge>
                          </Flex>
                        </Table.Cell>
                        <Table.Cell py={4} px={6} w="auto" textAlign="center">
                          <Flex gap={2} align="center" justify="center">
                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              color="#ef4444"
                              _hover={{ bg: "#fef2f2" }}
                              _active={{ bg: "#fee2e2" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(emp, e);
                              }}
                              p={2}
                              borderRadius="full"
                              bg="white"
                              border="1px solid #e2e8f0"
                              tabIndex={0}
                              aria-label={`Delete ${emp.name}`}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Button>
                            {/* View Details Button - Same as Mobile */}
                            <Button
                              variant="ghost"
                              size="sm"
                              color="#8A37F7"
                              _hover={{ bg: "#f3f2fd" }}
                              _active={{ bg: "#e9e6fa" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/employee-list/preview/${emp.invId}`
                                );
                              }}
                              p={2}
                              borderRadius="full"
                              bg="white"
                              border="1px solid #e2e8f0"
                              tabIndex={0}
                              aria-label={`View details for ${emp.name}`}
                            >
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
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>

          {/* Pagination - Only show if more than 10 employees */}
          {totalRecords > 10 && (
            <Box bg="#f4edfefa" px={6} py={4}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalRecords={totalRecords}
                recordsPerPage={recordsPerPage}
              />
            </Box>
          )}
        </Box>
        {/* Mobile Content */}
        <Box
          display={{ base: "block", lg: "none" }}
          w="full"
          maxW="420px"
          mx="auto"
          py={3}
          px={2}
          flex={1}
          className="mobile-content"
        >
          {/* Tabs and SearchBar aligned */}
          <Box>
            {/* Tabs */}
            <Box
              display="flex"
              flexDirection="row"
              alignItems="center"
              w="full"
              mb={2}
            >
              {tabOptions.map((tab) => {
                const isSelected = tabIndex === tab.value;
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
                    onClick={() => setTabIndex(tab.value)}
                    onKeyDown={(_e) => {
                      if (_e.key === "Enter" || _e.key === " ")
                        setTabIndex(tab.value);
                    }}
                    cursor="pointer"
                    outline={isSelected ? "none" : undefined}
                    pb={1}
                  >
                    <Text
                      fontSize="sm"
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
            {/* SearchBar with filter button */}
            <Box mb={4} w="full">
              <SearchBar
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearch(e.target.value)
                }
                placeholder="Search ..."
              />
            </Box>
          </Box>
          {/* Tab Content */}
          {tabIndex === "0" && (
            <Box as="ul" className="divide-y divide-gray-200" w="full">
              {employeesLoading ? (
                <Flex align="center" justify="center" gap={2} py={8}>
                  <Box
                    w="4"
                    h="4"
                    bg="#8A37F7"
                    borderRadius="full"
                    animation="pulse 1.5s ease-in-out infinite"
                  />
                  <Text color="gray.500">Loading employees...</Text>
                </Flex>
              ) : paginatedEmployees.length === 0 ? (
                <Text color="gray.500" py={8} textAlign="center">
                  No employees found.
                </Text>
              ) : (
                paginatedEmployees.map((emp) => (
                  <Flex
                    as="li"
                    key={`${emp.invId}-${emp.email}`}
                    align="center"
                    w="full"
                    py={{ base: 2, sm: 3 }}
                    tabIndex={0}
                    aria-label={`View details for ${emp.name}`}
                    role="button"
                    _hover={{ bg: "#f3f2fd" }}
                    _focus={{ bg: "#f3f2fd" }}
                    px={2}
                    cursor="pointer"
                    onClick={() =>
                      router.push(`/employee-list/preview/${emp.invId}`)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/employee-list/preview/${emp.invId}`);
                      }
                    }}
                  >
                    {/* Avatar + Content */}
                    <Flex align="center" flex="1 1 0%" minW={0} gap={3}>
                      <Box
                        as="span"
                        w={{ base: "44px", sm: "48px" }}
                        h={{ base: "44px", sm: "48px" }}
                        borderRadius="full"
                        overflow="hidden"
                        bg="#d9d9d9"
                        mr={2}
                      >
                        {emp.avatarUrl ? (
                          <ProfileImage
                            avatarUrl={emp.avatarUrl}
                            alt={emp.name}
                            width={44}
                            height={48}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <Flex
                            w="100%"
                            h="100%"
                            align="center"
                            justify="center"
                            bg="#d9d9d9"
                            color="black"
                            fontWeight="bold"
                            fontSize="md"
                          >
                            {emp.name?.charAt(0).toUpperCase() || "?"}
                          </Flex>
                        )}
                      </Box>
                      <Flex direction="column" minW={0} gap={1}>
                        <Text
                          fontWeight="bold"
                          fontSize={{ base: "sm", sm: "md" }}
                          color="#23292e"
                          truncate
                        >
                          {emp.name}
                        </Text>
                        {emp.visitDate ? (
                          <CheckInOutBadgeRow
                            visitDate={emp.visitDate}
                            checkInTime={emp.checkInTime}
                            checkOutTime={emp.checkOutTime}
                          />
                        ) : (
                          <Flex align="center" gap={2}>
                            {/* Position Badge */}
                            <Box
                              bg="#f2f2f2"
                              color="#23292e"
                              fontSize={{ base: "xs", sm: "sm" }}
                              px={{ base: 2, sm: 3 }}
                              h={{ base: "20px", sm: "24px" }}
                              display="flex"
                              alignItems="center"
                              borderRadius="full"
                              fontWeight="medium"
                              minW={0}
                              maxW="full"
                              lineHeight="1"
                              whiteSpace="nowrap"
                              overflow="hidden"
                            >
                              {emp.type}
                            </Box>
                            {/* Status Badge */}
                            <Badge
                              fontSize={{ base: "xs", sm: "sm" }}
                              px={{ base: 2, sm: 3 }}
                              h={{ base: "20px", sm: "24px" }}
                              display="flex"
                              alignItems="center"
                              borderRadius="full"
                              bg={
                                emp.status === "Accepted"
                                  ? "#23A36D"
                                  : "#8A38F5"
                              }
                              color="#fff"
                              fontWeight="semibold"
                              lineHeight="1"
                              whiteSpace="nowrap"
                              overflow="hidden"
                            >
                              <Box as="span" whiteSpace="nowrap">
                                {emp.status === "Accepted"
                                  ? "Accepted"
                                  : "Invited"}
                              </Box>
                            </Badge>
                          </Flex>
                        )}
                      </Flex>
                    </Flex>
                    {/* Action Buttons */}
                    <Flex gap={1} ml={2}>
                      {/* Delete Button */}
                      <Button
                        aria-label={`Delete ${emp.name}`}
                        tabIndex={0}
                        minW="36px"
                        h="36px"
                        bg="transparent"
                        color="#ef4444"
                        borderRadius="full"
                        _hover={{ bg: "#fef2f2" }}
                        _active={{ bg: "#fee2e2" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={0}
                        flexShrink={0}
                        onClick={(e) => handleDeleteClick(emp, e)}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Button>
                      {/* View Details Button */}
                      <Button
                        aria-label={`View details for ${emp.name}`}
                        tabIndex={0}
                        minW="36px"
                        h="36px"
                        bg="transparent"
                        color="#8A37F7"
                        borderRadius="full"
                        _hover={{ bg: "#f3f2fd" }}
                        _active={{ bg: "#e9e6fa" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={0}
                        flexShrink={0}
                      >
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
                      </Button>
                    </Flex>
                  </Flex>
                ))
              )}
            </Box>
          )}
          {tabIndex === "1" && (
            <Box as="ul" className="divide-y divide-gray-200" w="full">
              {employeesLoading ? (
                <Flex align="center" justify="center" gap={2} py={8}>
                  <Box
                    w="4"
                    h="4"
                    bg="#8A37F7"
                    borderRadius="full"
                    animation="pulse 1.5s ease-in-out infinite"
                  />
                  <Text color="gray.500">Loading employees...</Text>
                </Flex>
              ) : paginatedEmployees.filter((emp) => emp.status === "Invited")
                  .length === 0 ? (
                <Text color="gray.500" py={8} textAlign="center">
                  No invited employees found.
                </Text>
              ) : (
                paginatedEmployees
                  .filter((emp) => emp.status === "Invited")
                  .map((emp) => (
                    <Flex
                      as="li"
                      key={emp.invId}
                      align="center"
                      justify="between"
                      className="w-full"
                      py={{ base: 2, sm: 3 }}
                      tabIndex={0}
                      aria-label={`View details for ${emp.name}`}
                      role="button"
                      _hover={{ bg: "#f3f2fd" }}
                      _focus={{ bg: "#f3f2fd" }}
                      px={2}
                      gap={3}
                      cursor="pointer"
                      onClick={() =>
                        router.push(`/employee-list/preview/${emp.invId}`)
                      }
                      onKeyDown={(_e) => {
                        if (_e.key === "Enter" || _e.key === " ") {
                          router.push(`/employee-list/preview/${emp.invId}`);
                        }
                      }}
                    >
                      <Box
                        as="span"
                        w={{ base: "44px", sm: "48px" }}
                        h={{ base: "44px", sm: "48px" }}
                        borderRadius="full"
                        overflow="hidden"
                        bg="#d9d9d9"
                        mr={2}
                      >
                        {emp.avatarUrl ? (
                          <ProfileImage
                            avatarUrl={emp.avatarUrl}
                            alt={emp.name}
                            width={44}
                            height={48}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <Flex
                            w="100%"
                            h="100%"
                            align="center"
                            justify="center"
                            bg="#d9d9d9"
                            color="black"
                            fontWeight="bold"
                            fontSize="md"
                          >
                            {emp.name?.charAt(0).toUpperCase() || "?"}
                          </Flex>
                        )}
                      </Box>
                      <Flex direction="column" flex={1} gap={1} minW={0}>
                        <Text
                          fontWeight="bold"
                          fontSize={{ base: "sm", sm: "md" }}
                          color="#23292e"
                          truncate
                        >
                          {emp.name}
                        </Text>
                        <Flex align="center" gap={2}>
                          {/* Type Badge */}
                          <Box
                            bg="#f2f2f2"
                            color="#23292e"
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                            h={{ base: "20px", sm: "24px" }}
                            display="flex"
                            alignItems="center"
                            borderRadius="full"
                            fontWeight="medium"
                            minW={0}
                            maxW="full"
                            lineHeight="1"
                            whiteSpace="nowrap"
                            overflow="hidden"
                          >
                            {emp.type}
                          </Box>
                          {/* Status Badge */}
                          <Badge
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                            h={{ base: "20px", sm: "24px" }}
                            display="flex"
                            alignItems="center"
                            borderRadius="full"
                            bg={
                              emp.status === "Accepted" ? "#23A36D" : "#8A38F5"
                            }
                            color="#fff"
                            fontWeight="semibold"
                            lineHeight="1"
                            whiteSpace="nowrap"
                            overflow="hidden"
                          >
                            Invited
                          </Badge>
                        </Flex>
                      </Flex>
                      {/* Right Arrow Button */}
                      <Button
                        aria-label={`View details for ${emp.name}`}
                        tabIndex={0}
                        minW="36px"
                        h="36px"
                        bg="transparent"
                        color="#8A37F7"
                        borderRadius="full"
                        _hover={{ bg: "#f3f2fd" }}
                        _active={{ bg: "#e9e6fa" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={0}
                        flexShrink={0}
                        ml={2}
                      >
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
                      </Button>
                    </Flex>
                  ))
              )}
            </Box>
          )}
          {tabIndex === "2" && (
            <Box as="ul" className="divide-y divide-gray-200" w="full">
              {employeesLoading ? (
                <Flex align="center" justify="center" gap={2} py={8}>
                  <Box
                    w="4"
                    h="4"
                    bg="#8A37F7"
                    borderRadius="full"
                    animation="pulse 1.5s ease-in-out infinite"
                  />
                  <Text color="gray.500">Loading employees...</Text>
                </Flex>
              ) : paginatedEmployees.filter((emp) => emp.status === "Accepted")
                  .length === 0 ? (
                <Text color="gray.500" py={8} textAlign="center">
                  No accepted employees found.
                </Text>
              ) : (
                paginatedEmployees
                  .filter((emp) => emp.status === "Accepted")
                  .map((emp) => (
                    <Flex
                      as="li"
                      key={emp.invId}
                      align="center"
                      justify="between"
                      className="w-full"
                      py={{ base: 2, sm: 3 }}
                      tabIndex={0}
                      aria-label={`View details for ${emp.name}`}
                      role="button"
                      _hover={{ bg: "#f3f2fd" }}
                      _focus={{ bg: "#f3f2fd" }}
                      px={2}
                      gap={3}
                      cursor="pointer"
                      onClick={() =>
                        router.push(`/employee-list/preview/${emp.invId}`)
                      }
                      onKeyDown={(_e) => {
                        if (_e.key === "Enter" || _e.key === " ") {
                          router.push(`/employee-list/preview/${emp.invId}`);
                        }
                      }}
                    >
                      <Box
                        as="span"
                        w={{ base: "44px", sm: "48px" }}
                        h={{ base: "44px", sm: "48px" }}
                        borderRadius="full"
                        overflow="hidden"
                        bg="#d9d9d9"
                        mr={2}
                      >
                        {emp.avatarUrl ? (
                          <ProfileImage
                            avatarUrl={emp.avatarUrl}
                            alt={emp.name}
                            width={44}
                            height={48}
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <Flex
                            w="100%"
                            h="100%"
                            align="center"
                            justify="center"
                            bg="#d9d9d9"
                            color="black"
                            fontWeight="bold"
                            fontSize="md"
                          >
                            {emp.name?.charAt(0).toUpperCase() || "?"}
                          </Flex>
                        )}
                      </Box>
                      <Flex direction="column" flex={1} gap={1} minW={0}>
                        <Text
                          fontWeight="bold"
                          fontSize={{ base: "sm", sm: "md" }}
                          color="#23292e"
                          truncate
                        >
                          {emp.name}
                        </Text>
                        <Flex align="center" gap={2}>
                          {/* Type Badge */}
                          <Box
                            bg="#f2f2f2"
                            color="#23292e"
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                            h={{ base: "20px", sm: "24px" }}
                            display="flex"
                            alignItems="center"
                            borderRadius="full"
                            fontWeight="medium"
                            minW={0}
                            maxW="full"
                            lineHeight="1"
                            whiteSpace="nowrap"
                            overflow="hidden"
                          >
                            {emp.type}
                          </Box>
                          {/* Status Badge */}
                          <Badge
                            fontSize={{ base: "xs", sm: "sm" }}
                            px={{ base: 2, sm: 3 }}
                            h={{ base: "20px", sm: "24px" }}
                            display="flex"
                            alignItems="center"
                            borderRadius="full"
                            bg={
                              emp.status === "Accepted" ? "#23A36D" : "#8A38F5"
                            }
                            color="#fff"
                            fontWeight="semibold"
                            lineHeight="1"
                            whiteSpace="nowrap"
                            overflow="hidden"
                          >
                            Accepted
                          </Badge>
                        </Flex>
                      </Flex>
                      {/* Right Arrow Button */}
                      <Button
                        aria-label={`View details for ${emp.name}`}
                        tabIndex={0}
                        minW="36px"
                        h="36px"
                        bg="transparent"
                        color="#8A37F7"
                        borderRadius="full"
                        _hover={{ bg: "#f3f2fd" }}
                        _active={{ bg: "#e9e6fa" }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        px={0}
                        flexShrink={0}
                        ml={2}
                      >
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
                      </Button>
                    </Flex>
                  ))
              )}
            </Box>
          )}
        </Box>
      </Box>
      <InviteEmployeeModal isOpen={isInviteOpen} onClose={handleInviteClose} />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel();
        }}
      >
        <Portal>
          <Dialog.Backdrop
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="1050"
          />
          <Dialog.Positioner
            className="flex items-center justify-center"
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            zIndex="1100"
          >
            <Dialog.Content
              className="max-w-md"
              w="90%"
              bg="white"
              borderRadius="lg"
              p={6}
              tabIndex={0}
              aria-label={`Delete ${employeeToDelete?.type || "Employee"} Confirmation`}
            >
              <Dialog.Header mb={4}>
                <Dialog.Title asChild>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Delete {employeeToDelete?.type || "Employee"}
                  </Text>
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body mb={6}>
                <Text color="gray.600" fontSize="sm">
                  Are you sure you want to delete{" "}
                  <strong>{employeeToDelete?.name}</strong>? This action cannot
                  be undone.
                </Text>
              </Dialog.Body>

              <Dialog.Footer>
                <Flex gap={3} w="full">
                  <Button
                    flex={1}
                    variant="outline"
                    color="black"
                    _hover={{ bg: "transparent" }}
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                    tabIndex={0}
                    aria-label="Cancel deletion"
                  >
                    Cancel
                  </Button>
                  <Button
                    flex={1}
                    bg="#ef4444"
                    color="white"
                    _hover={{ bg: "#dc2626" }}
                    _active={{ bg: "#b91c1c" }}
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    tabIndex={0}
                    aria-label="Confirm deletion"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

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
    </Flex>
  );
};

export default EmployeeListPage;
