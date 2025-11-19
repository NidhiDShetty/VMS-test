"use client";

import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  Tabs,
  Badge,
  VStack,
  Heading,
  Button,
} from "@chakra-ui/react";
import { FiChevronLeft, FiSearch } from "react-icons/fi";
import { FaArrowAltCircleRight } from "react-icons/fa";
import { useState, KeyboardEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FRONTEND_URL } from "@/lib/server-urls";
import { fetchCompanyInvitations, CompanyInvitation } from "./api";
import Logo from "@/components/svgs/logo";

import DesktopHeader from "@/components/DesktopHeader";
const CompaniesLogPage = () => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tabIndex, setTabIndex] = useState("0");
  const [companies, setCompanies] = useState<CompanyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state for web layout
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Show 10 companies per page

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchCompanyInvitations();
        setCompanies(data);
        setError(null);
      } catch (err: unknown) {
        let errorMsg = "Failed to fetch companies";
        if (
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { data?: { error?: string } } })
            .response === "object"
        ) {
          const response = (err as { response?: { data?: { error?: string } } })
            .response;
          errorMsg = response?.data?.error || errorMsg;
        }
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const handleBack = () => {
    router.push("/dashboard");
  };

  const handleKeyDownBack = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") handleBack();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleTabChange = (details: { value: string }) => {
    setTabIndex(details.value);
  };

  const filteredCompanies = (status?: string) => {
    let filtered = companies;
    if (status) filtered = filtered.filter((c) => c.status === status);
    if (search.trim())
      filtered = filtered.filter((c) =>
        (c.companyName || "")
          .toLowerCase()
          .split(/\s+/).some(word => word.startsWith(search.trim().toLowerCase()))
          
      );
    return filtered;
  };

  // Get paginated companies for web layout
  const getPaginatedCompanies = (status?: string) => {
    const filtered = filteredCompanies(status);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };


  // Reset to first page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, tabIndex]);

  // Calculate total pages for current filtered data
  const getTotalPages = (status?: string) => {
    const filtered = filteredCompanies(status);
    return Math.ceil(filtered.length / itemsPerPage);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Pagination Component
  const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    totalRecords,
    recordsPerPage
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
        bg="transparent"
      >
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

  return (
    <Box
      w="100vw"
      px={0}
      h="100vh"
      bg={{ base: "white", md: "#f7f2fd" }}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      className="relative"
    >
      {/* Header - Original Mobile Design */}
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
          onClick={handleBack}
          onKeyDown={handleKeyDownBack}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">Companies Log</Text>
      </Flex>

      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader notificationCount={3} />

      {/* Web Navigation Bar - Light Purple Background */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        h="70px"
        // bg="#f7f2fd"
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
            onClick={handleBack}
            onKeyDown={handleKeyDownBack}
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
            Companies Log
          </Heading>
        </Flex>

        {/* Right - Search Bar (Desktop) */}
        <Flex
          w="300px"
          h="36px"
          bg="white"
          borderRadius="8px"
          align="center"
          pe={3}
          gap={2}
          border="1px solid transparent"
          _focusWithin={{
            border: "1px solid #8A37F7",
            boxShadow: "0 0 0 1px rgba(138, 55, 247, 0.2)"
          }}
          transition="all 0.2s ease"
        >
          <Input
            placeholder="Search..."
            border="none"
            bg="transparent"
            fontSize="sm"
            color="#757A95"
            _placeholder={{ color: "#757A95" }}
            flex={1}
            _focus={{ boxShadow: "none", outline: "none" }}
            value={search}
            onChange={handleSearchChange}
          />
          <FiSearch color="#757A95" size={16} />
        </Flex>
      </Flex>

      {/* Filter Tabs */}
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        px={2}
        py={0}
        w="100%"
        h="40px"
        mb={2}
        mt={4}
        bg={{ base: "transparent", md: "#f7f2fd" }}
      >
        {[
          { label: "All" },
          { label: "Accepted" },
          { label: "Pending" },
          { label: "Rejected" },
        ].map((tab, idx) => {
          const value = idx.toString();
          const isSelected = tabIndex === value;

          return (
            <Box
              key={value}
              flex="1"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              tabIndex={0}
              aria-label={tab.label}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleTabChange({ value })}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleTabChange({ value });
              }}
              cursor="pointer"
            >
              <Text
                fontSize="sm"
                fontWeight={isSelected ? "bold" : "medium"}
                color={isSelected ? "#6040B8" : "#1A202C"}
                textAlign="center"
                px={1}
                whiteSpace="nowrap"
                lineHeight="20px"
              >
                {tab.label}
              </Text>
              <Box
                h="4px"
                w="100%"
                mt="2px"
                bg={isSelected ? "#8A37F7" : "transparent"}
                borderRadius="2px"
                transition="background-color 0.2s ease"
              />
            </Box>
          );
        })}
      </Box>

      {/* Mobile Search Bar - Only visible on mobile */}
      <Flex align="center" gap="10px" px={2} py={2} w="100%" display={{ base: "flex", md: "none" }}>
        {/* Search Container */}
        <Flex
          flex={1}
          w="100%"
          h="36px"
          bg="white"
          border="1px solid #DCE3E3"
          borderRadius="10px"
          align="center"
          px={2}
          gap="20px"
          maxW="none"
        >
          {/* Search Input */}
          <Input
            placeholder="Search ..."
            border="none"
            bg="transparent"
            fontSize="xs"
            color="#757A95"
            _placeholder={{ color: "#757A95" }}
            flex={1}
            _focus={{ boxShadow: "none", outline: "none" }}
            _focusVisible={{ boxShadow: "none", outline: "none" }}
            value={search}
            onChange={handleSearchChange}
          />

          {/* Search Icon */}
          <IconButton
            aria-label="Search"
            variant="ghost"
            size="xs"
            color="#757A95"
            bg="transparent"
            _hover={{ bg: "transparent" }}
            _active={{ bg: "transparent" }}
            minW="20px"
            h="20px"
            p={0}
            flexShrink={0}
          >
            <FiSearch size={16} />
          </IconButton>
        </Flex>
      </Flex>

      {/* Loading/Error State */}
      {loading ? (
        <Flex justify="center" align="center" flex={1}>
          <Text color="black">Loading Companies...</Text>
        </Flex>
      ) : error ? (
        <Flex justify="center" align="center" flex={1}>
          <Text color="red.500">{error}</Text>
        </Flex>
      ) : (
        /* Content Area */
        <Box 
          flex={1} 
          overflow={{ base: "auto", md: "hidden" }} 
          px={0} 
          pt={2} 
          pb={4} 
          position="relative" 
          bg={{ base: "white", md: "#f7f2fd" }}
        >
        {/* Background Logo - Web Only */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.1}
          zIndex={0}
          display={{ base: "none", md: "block" }}
        >
          <Image
            src={`${FRONTEND_URL}/next.svg`}
            alt="Background Logo"
            width={400}
            height={400}
            style={{
              filter: "opacity(0.1)",
              userSelect: "none",
              pointerEvents: "none"
            }}
          />
        </Box>
        
        <Tabs.Root
          value={tabIndex}
          onValueChange={handleTabChange}
          variant="plain"
          mt={0}
          px={0}
          pt={2}
          position="relative"
          zIndex={1}
        >
          {/* <Tabs.List>
            <Tabs.Trigger value="0">All</Tabs.Trigger>
            <Tabs.Trigger value="1">Accepted</Tabs.Trigger>
            <Tabs.Trigger value="2">Pending</Tabs.Trigger>
            <Tabs.Trigger value="3">Rejected</Tabs.Trigger>
          </Tabs.List> */}
          <Tabs.Content value="0" px={0} py={2}>
            <CompanyList
              companies={filteredCompanies()}
              paginatedCompanies={getPaginatedCompanies()}
              search={search}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalPages={getTotalPages()}
              onPageChange={handlePageChange}
            />
          </Tabs.Content>
          <Tabs.Content value="1" px={0} py={2}>
            <CompanyList
              companies={filteredCompanies("Accepted")}
              paginatedCompanies={getPaginatedCompanies("Accepted")}
              search={search}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalPages={getTotalPages("Accepted")}
              onPageChange={handlePageChange}
            />
          </Tabs.Content>
          <Tabs.Content value="2" px={0} py={2}>
            <CompanyList
              companies={filteredCompanies("Pending")}
              paginatedCompanies={getPaginatedCompanies("Pending")}
              search={search}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalPages={getTotalPages("Pending")}
              onPageChange={handlePageChange}
            />
          </Tabs.Content>
          <Tabs.Content value="3" px={0} py={2}>
            <CompanyList
              companies={filteredCompanies("Rejected")}
              paginatedCompanies={getPaginatedCompanies("Rejected")}
              search={search}
              onSearchChange={handleSearchChange}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              totalPages={getTotalPages("Rejected")}
              onPageChange={handlePageChange}
            />
          </Tabs.Content>
        </Tabs.Root>
        
        {/* Pagination Footer - Web Only */}
        {(() => {
          const getCurrentTabStatus = () => {
            switch (tabIndex) {
              case "1": return "Accepted";
              case "2": return "Pending";
              case "3": return "Rejected";
              default: return undefined; // "All" tab
            }
          };
          
          const currentStatus = getCurrentTabStatus();
          const currentTabCompanies = filteredCompanies(currentStatus);
          
          return currentTabCompanies.length > 0 && currentTabCompanies.length > itemsPerPage ? (
            <Box bg="#f4edfefa" px={6} py={4} display={{ base: "none", md: "block" }}>
              <Pagination
                currentPage={currentPage}
                totalPages={getTotalPages(currentStatus)}
                onPageChange={handlePageChange}
                totalRecords={currentTabCompanies.length}
                recordsPerPage={itemsPerPage}
              />
            </Box>
          ) : null;
        })()}
      </Box>
      )}
    </Box>
  );
};

type CompanyListProps = {
  companies: CompanyInvitation[];
  paginatedCompanies: CompanyInvitation[];
  search: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const CompanyList = ({ companies, paginatedCompanies }: CompanyListProps) => {
  const router = useRouter();
  
  return (
    <Box px={{ base: 2, md: 6 }} pt={0} w="100%" pb={6} bg={{ base: "white", md: "#f7f2fd" }}>
      {companies.length === 0 ? (
        <Text color="black" fontSize="sm" textAlign="center" py={8}>
          No companies found.
        </Text>
      ) : (
        <>
          {/* Desktop Table View - Uses Paginated Data */}
          <Box display={{ base: "none", md: "block" }} h="calc(100vh - 350px)" overflow="hidden" position="relative">
            {/* Background Logo - Centered in Table */}
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              opacity={0.1}
              zIndex={0}
              display="flex"
              justifyContent="center"
              alignItems="center"
            >
              <Box transform="scale(6)">
                <Logo />
              </Box>
            </Box>

            {/* Table Header - Fixed/Sticky */}
            <Flex
              align="center"
              justify="space-between"
              bg="#8A37F7"
              px={4}
              py={3}
              borderRadius="8px 8px 0 0"
              color="white"
              fontWeight="bold"
              fontSize="sm"
              position="sticky"
              top="0"
              zIndex={10}
            >
              <Text flex={1}>Company Name</Text>
              <Text flex={1}>Status</Text>
              <Text flex={1} textAlign="right" mr='8px'>Action</Text>
            </Flex>
            
            {/* Table Rows - Paginated for Web, No Scroll */}
            <Box overflowY="auto" h="calc(100% - 48px)" maxH="calc(100vh - 398px)" position="relative" zIndex={1}>
              <VStack gap={0} align="stretch" h="auto" overflow="visible">
                {paginatedCompanies.map((company: CompanyInvitation, index) => (
                <Link
                  key={company.invId}
                  href={`/companies-log/preview/${company.invId}`}
                >
                  <Flex
                    align="center"
                    justify="space-between"
                    bg="rgba(255, 255, 255, 0.9)"
                    px={4}
                    py={3}
                    borderBottom={index === companies.length - 1 ? "none" : "1px solid #f2f2f2"}
                    borderRadius={index === companies.length - 1 ? "0 0 8px 8px" : "none"}
                    cursor="pointer"
                    _hover={{ bg: "rgba(248, 248, 248, 0.9)" }}
                    tabIndex={0}
                    aria-label={`View details for ${company.companyName}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        router.push(`/companies-log/preview/${company.invId}`);
                      }
                    }}
                  >
                    {/* Company Name */}
                    <Text
                      flex={1}
                      fontWeight="bold"
                      fontSize="sm"
                      color="#252A2E"
                      textDecoration="underline"
                      _hover={{ color: "#8A37F7" }}
                    >
                      {company.companyName}
                    </Text>
                    
                    {/* Status */}
                    <Flex flex={1}>
                      <Badge
                        bg={
                          company.status === "Accepted"
                            ? "#23A36D"
                            : company.status === "Pending"
                            ? "#B38400"
                            : "#E53935"
                        }
                        color="white"
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="12px"
                        aria-label={`Status: ${company.status}`}
                      >
                        {company.status}
                      </Badge>
                    </Flex>
                    
                    {/* Action */}
                    <Flex flex={1} justify="flex-end" mr='8px'>
                      <IconButton
                        aria-label={`View ${company.companyName}`}
                        variant="ghost"
                        color="#8A37F7"
                        bg="transparent"
                        _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
                        size="sm"
                      >
                        <FaArrowAltCircleRight size={16} />
                      </IconButton>
                    </Flex>
                  </Flex>
                </Link>
              ))}
              </VStack>
            </Box>
          </Box>

          {/* Mobile Card View - Shows All Companies (No Pagination) */}
          <VStack gap="10px" align="stretch" display={{ base: "flex", md: "none" }}>
            {companies.map((company: CompanyInvitation) => (
              <Link
                key={company.invId}
                href={`/companies-log/preview/${company.invId}`}
              >
                <Flex
                  align="center"
                  h="70px"
                  minH="56px"
                  w="100%"
                  tabIndex={0}
                  aria-label={`View details for ${company.companyName}`}
                  justify="space-between"
                  bg="white"
                  borderRadius={0}
                  px={3}
                  py={2}
                  boxShadow="none"
                  cursor="pointer"
                  _hover={{ bg: "#f8f8f8" }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      router.push(`/companies-log/preview/${company.invId}`);
                    }
                  }}
                >
                  {/* Left side - Avatar and Company Info */}
                  <Flex align="center" gap="6px" flex={1}>
                    {/* Avatar */}
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="full"
                      bg="#F4EDFE"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      position="relative"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 51 50"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <circle cx="25.5" cy="25" r="25" fill="#F4EDFE" />
                        <path
                          d="M30.5 28H28.5V30H30.5M30.5 24H28.5V26H30.5M32.5 32H24.5V30H26.5V28H24.5V26H26.5V24H24.5V22H32.5M22.5 20H20.5V18H22.5M22.5 24H20.5V22H22.5M22.5 28H20.5V26H22.5M22.5 32H20.5V30H22.5M18.5 20H16.5V18H18.5M18.5 24H16.5V22H18.5M18.5 28H16.5V26H18.5M18.5 32H16.5V30H18.5M24.5 20V16H14.5V34H34.5V20H24.5Z"
                          fill="#5F24AC"
                        />
                      </svg>
                    </Box>
                    {/* Company Name and Badge */}
                    <VStack align="flex-start" gap="2px" minW={0} flex={1}>
                      <Text
                        fontWeight="bold"
                        fontSize="12px"
                        color="#252A2E"
                        truncate
                        w="100%"
                      >
                        {company.companyName}
                      </Text>
                      <Badge
                        bg={
                          company.status === "Accepted"
                            ? "#23A36D"
                            : company.status === "Pending"
                            ? "#B38400"
                            : "#E53935"
                        }
                        color="white"
                        fontSize="10px"
                        px={2}
                        borderRadius="12px"
                        aria-label={`Status: ${company.status}`}
                      >
                        {company.status}
                      </Badge>
                    </VStack>
                  </Flex>
                  {/* Right side - Chevron */}
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mr={3}
                    p={0}
                    h="100%"
                  >
                    <FaArrowAltCircleRight size={18} color="#9747ff" />
                  </Box>
                </Flex>
              </Link>
            ))}
          </VStack>
        </>
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
  );
};

export default CompaniesLogPage;
