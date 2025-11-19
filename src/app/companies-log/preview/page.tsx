"use client";

import {
  Box,
  Flex,
  Text,
  Button,
  IconButton,
  VStack,
  Input,
} from "@chakra-ui/react";
import { FiChevronLeft, FiSearch, FiBell, FiClock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import DesktopHeader from "@/components/DesktopHeader";
const STATUS_COLORS: Record<string, string> = {
  Accepted: "#23a36a",
  Pending: "#B38400",
  Rejected: "#E34A35",
};

const CompanyPreviewPage = (): ReactNode => {
  const router = useRouter();

  // Mock data for preview (replace with real data as needed)
  const companyName = "Crecientech Infosystem";
  const phoneNumber = "+91-8838666666";
  const email = "crecientech@gmail.com";
  const status = "Accepted";

  return (
    <Box
      w="100vw"
      px={0}
      h="100vh"
      bg="white"
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
        h="70px"
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
          left={2}
          onClick={() => router.back()}
          color="black"
          _focus={{ boxShadow: 'none', outline: 'none', bg: 'transparent' }}
          _active={{ bg: 'transparent' }}
        >
          <FiChevronLeft />
        </IconButton>
        <Text fontWeight="bold" fontSize="sm" color="#18181b">
          Add visitor&apos;s Details
        </Text>
      </Flex>

      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader notificationCount={3} />

      {/* Web Header - Purple Background */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        h="64px"
        bg="#8A37F7"
        w="100%"
        display={{ base: "none", md: "flex" }}
      >
        {/* Left - Logo */}
        <Flex align="center" gap={2}>
          <Box
            w="40px"
            h="40px"
            borderRadius="full"
            bg="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize="xl"
              fontWeight="bold"
              color="#8A37F7"
            >
              S
            </Text>
          </Box>
          <Text
            fontSize="lg"
            fontWeight="bold"
            color="white"
          >
            HCM Cafe VMS
          </Text>
        </Flex>

        {/* Right - Time, Notifications, Search, Profile */}
        <Flex align="center" gap={4}>
          {/* Time */}
          <Flex align="center" gap={1}>
            <FiClock color="white" size={16} />
            <Text fontSize="sm" color="white">
              30-06-2025, Tue 09:00 AM
            </Text>
          </Flex>

          {/* Notifications */}
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              variant="ghost"
              color="white"
              bg="transparent"
              _hover={{ bg: "rgba(255,255,255,0.1)" }}
              size="sm"
            >
              <FiBell size={20} />
            </IconButton>
            <Box
              position="absolute"
              top="-2px"
              right="-2px"
              w="16px"
              h="16px"
              bg="#8A37F7"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" color="white" fontWeight="bold">
                9
              </Text>
            </Box>
          </Box>

          {/* Search Bar */}
          <Flex
            w="200px"
            h="32px"
            bg="white"
            borderRadius="6px"
            align="center"
            px={2}
            gap={2}
          >
            <FiSearch color="#757A95" size={14} />
            <Input
              placeholder="Search..."
              border="none"
              bg="transparent"
              fontSize="xs"
              color="#757A95"
              _placeholder={{ color: "#757A95" }}
              flex={1}
              _focus={{ boxShadow: "none", outline: "none" }}
            />
          </Flex>

          {/* Profile */}
          <Flex align="center" gap={2}>
            <Box
              w="32px"
              h="32px"
              borderRadius="full"
              bg="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" fontWeight="bold" color="#8A37F7">
                JD
              </Text>
            </Box>
            <VStack align="flex-start" gap={0}>
              <Text fontSize="sm" color="white" fontWeight="bold">
                James Davis!
              </Text>
              <Text fontSize="xs" color="white" opacity={0.8}>
                Admin
              </Text>
            </VStack>
          </Flex>
        </Flex>
      </Flex>

      {/* Web Navigation Bar - Light Purple Background */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        h="56px"
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
          <Text
            fontSize="lg"
            color="#18181b"
            fontWeight="bold"
          >
            Check Out / Check In List
          </Text>
        </Flex>

        {/* Right - Search Bar (Desktop) */}
        <Flex
          w="300px"
          h="36px"
          bg="white"
          borderRadius="8px"
          align="center"
          px={3}
          gap={2}
        >
          <FiSearch color="#757A95" size={16} />
          <Input
            placeholder="Search...."
            border="none"
            bg="transparent"
            fontSize="sm"
            color="#757A95"
            _placeholder={{ color: "#757A95" }}
            flex={1}
            _focus={{ boxShadow: "none", outline: "none" }}
          />
        </Flex>
      </Flex>

      {/* Content Area */}
      <Box flex={1} position="relative" overflowY="auto">
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
          <Text
            fontSize="200px"
            fontWeight="bold"
            color="#8A37F7"
            userSelect="none"
            pointerEvents="none"
          >
            S
          </Text>
        </Box>

        {/* Preview Card */}
        <Box px={{ base: 2, md: 6 }} position="relative" zIndex={1}>
          <Box
            bg="#f6f6fd"
            borderRadius={{ base: "10px", md: "12px" }}
            px={{ base: 5, md: 6 }}
            py={{ base: 5, md: 6 }}
            mt={{ base: 4, md: 8 }}
            w={{ base: "calc(100% - 32px)", md: "600px" }}
            mx="auto"
            boxShadow="sm"
          >

            {/* Mobile Layout - Original Design */}
            <Flex direction="column" gap={1} display={{ base: "flex", md: "none" }}>
              <Flex align="center" minH="28px">
                <Text fontWeight="bold" color="#18181b" fontSize="sm" minW="110px">
                  Company Name:
                </Text>
                <Text color="#18181b" fontSize="sm" ml={2}>
                  {companyName}
                </Text>
              </Flex>
              <Flex align="center" minH="28px">
                <Text fontWeight="bold" color="#18181b" fontSize="sm" minW="110px">
                  Phone No:
                </Text>
                <Text color="#18181b" fontSize="sm" ml={2}>
                  {phoneNumber}
                </Text>
              </Flex>
              <Flex align="center" minH="28px">
                <Text fontWeight="bold" color="#18181b" fontSize="sm" minW="110px">
                  Email:
                </Text>
                <Text color="#18181b" fontSize="sm" ml={2}>
                  {email}
                </Text>
              </Flex>
              <Flex align="center" minH="28px">
                <Text fontWeight="bold" color="#18181b" fontSize="sm" minW="110px">
                  Status:
                </Text>
                <Box
                  as="span"
                  bg={STATUS_COLORS[status] || STATUS_COLORS.Accepted}
                  color="white"
                  borderRadius="12px"
                  px={4}
                  h="22px"
                  display="flex"
                  alignItems="center"
                  fontSize="sm"
                  fontWeight="normal"
                  ml={2}
                  minW="70px"
                  justifyContent="center"
                  aria-label={`Status: ${status}`}
                  tabIndex={0}
                >
                  {status}
                </Box>
              </Flex>
            </Flex>

            {/* Web Layout - Full Screen Card Format */}
            <Flex 
              align="center" 
              justify="space-between" 
              w="full" 
              px={8} 
              py={6}
              display={{ base: "none", md: "flex" }}
            >
              {/* Company Icon */}
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
                <svg
                  width="40"
                  height="40"
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

              {/* Company Name */}
              <Flex direction="column" gap={1} flex="1" maxW="250px">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Company Name:
                </Text>
                <Text color="#18181b" fontSize="sm" fontWeight="bold">
                  {companyName}
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
                  {phoneNumber}
                </Text>
              </Flex>

              {/* Separator */}
              <Box w="1px" h="40px" bg="#E2E8F0" />

              {/* Email */}
              <Flex direction="column" gap={1} flex="1" maxW="250px">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Email:
                </Text>
                <Text color="#18181b" fontSize="sm" fontWeight="bold">
                  {email}
                </Text>
              </Flex>

              {/* Separator */}
              <Box w="1px" h="40px" bg="#E2E8F0" />

              {/* Status */}
              <Flex direction="column" gap={1} flex="1" maxW="150px">
                <Text
                  fontWeight="normal"
                  color="#666"
                  fontSize="sm"
                >
                  Status:
                </Text>
                <Box
                  as="span"
                  bg={STATUS_COLORS[status] || STATUS_COLORS.Accepted}
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
                  aria-label={`Status: ${status}`}
                  tabIndex={0}
                  alignSelf="flex-start"
                >
                  {status}
                </Box>
              </Flex>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* Remove Button */}
      <Box
        position={{ base: "fixed", md: "static" }}
        bottom={{ base: "16px", md: "auto" }}
        left={{ base: "50%", md: "auto" }}
        transform={{ base: "translateX(-50%)", md: "none" }}
        w={{ base: "calc(100% - 32px)", md: "600px" }}
        maxW={{ base: "390px", md: "600px" }}
        mx={{ base: "auto", md: "auto" }}
        px={{ base: 0, md: 6 }}
        pb={{ base: 0, md: 6 }}
        zIndex={10}
      >
        <Button
          w="100%"
          h={{ base: "48px", md: "48px" }}
          bg="#e34a35"
          color="white"
          borderRadius="4px"
          fontWeight="bold"
          fontSize={{ base: "md", md: "md" }}
          _hover={{ bg: "#c43d2b" }}
          aria-label="Remove visitor"
          tabIndex={0}
        >
          Remove
        </Button>
      </Box>
    </Box>
  );
};

export default CompanyPreviewPage; 
