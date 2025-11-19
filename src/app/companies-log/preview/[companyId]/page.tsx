"use client";
import { useParams, useRouter } from "next/navigation";
import { Box, Flex, Text, IconButton, Badge, Spinner } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { useEffect, useState } from "react";
import Logo from "@/components/svgs/logo";
import {
  fetchCompanyInvitations,
  CompanyInvitation,
  deleteCompanyInvitation,
} from "../../api";
import { toaster } from "@/components/ui/toaster";
import { inviteCompany } from "@/app/invite-visitor/api";
import PrimaryButton from "@/components/ui/PrimaryButton";
import DesktopHeader from "@/components/DesktopHeader";

const STATUS_COLORS: Record<string, string> = {
  Accepted: "#23a36a",
  Pending: "#B38400",
  Rejected: "#E34A35",
};

const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, "");
  
  // If it starts with 91 and has 12+ digits, format as +91-XXXXXXXXXX
  if (digits.startsWith("91") && digits.length >= 12) {
    const localNumber = digits.substring(2);
    return `+91-${localNumber}`;
  }
  
  // If it's exactly 10 digits, assume it's a local number and add +91-
  if (digits.length === 10) {
    return `+91-${digits}`;
  }
  
  // If it's 11 digits and starts with 0, remove the 0 and add +91-
  if (digits.length === 11 && digits.startsWith("0")) {
    const localNumber = digits.substring(1);
    return `+91-${localNumber}`;
  }
  
  // For any other format, return as is
  return phoneNumber;
};

export default function CompanyPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.companyId as string;
  const [company, setCompany] = useState<CompanyInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reinviteLoading, setReinviteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await fetchCompanyInvitations();
        const found = data.find((c) => String(c.invId) === companyId);
        setCompany(found || null);
        setError(found ? null : "Company not found.");
      } catch (err: unknown) {
        let errorMsg = "Failed to fetch company";
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
  }, [companyId]);

  const handleReinvite = async () => {
    if (!company) return;
    setReinviteLoading(true);
    try {
      await inviteCompany({
        companyName: company.companyName || "",
        phoneNo: company.phoneNo || "",
        email: company.email || "",
      });
      toaster.success({
        title: "Re-invite sent successfully",
        description: `Invitation sent to ${company.email || ""}`,
      });
      router.push("/companies-log");
    } catch (err: unknown) {
      let errorMsg = "Unknown error";
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
      toaster.error({ title: "Failed to re-invite", description: errorMsg });
    } finally {
      setReinviteLoading(false);
    }
  };

  if (loading) {
    return (
      <Flex w="100vw" h="100vh" align="center" justify="center" bg="white">
        <Spinner size="lg" color="#9747ff" />
      </Flex>
    );
  }

  if (error || !company) {
    return (
      <Box p={8}>
        <Text color="red.500">{error || "Company not found."}</Text>
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
          Add Company Details
        </Text>
      </Flex>

      {/* Desktop Header Component */}
      <DesktopHeader notificationCount={9} />

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
            Company Details
          </Text>
        </Flex>

        {/* Right - Search Bar (Desktop) */}
        {/* <Flex
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
        </Flex> */}
      </Flex>

      {/* Content Area */}
      <Box flex={1} position="relative" overflowY="auto">

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
              <Flex align="center" justify="space-between" minH="28px">
                <Text
                  fontWeight="bold"
                  color="#18181b"
                  fontSize="xs"
                  minW="110px"
                >
                  Company Name:
                </Text>
                <Text color="#18181b" fontSize="xs" textAlign="right" flex="1">
                  {company.companyName}
                </Text>
              </Flex>
              <Flex align="center" justify="space-between" minH="28px">
                <Text
                  fontWeight="bold"
                  color="#18181b"
                  fontSize="xs"
                  minW="110px"
                >
                  Phone No:
                </Text>
                <Text color="#18181b" fontSize="xs" textAlign="right" flex="1">
                  {company.phoneNo ? formatPhoneNumber(company.phoneNo) : "-"}
                </Text>
              </Flex>
              <Flex align="center" justify="space-between" minH="28px">
                <Text
                  fontWeight="bold"
                  color="#18181b"
                  fontSize="xs"
                  minW="110px"
                >
                  Email:
                </Text>
                <Text color="#18181b" fontSize="xs" textAlign="right" flex="1">
                  {company.email || "-"}
                </Text>
              </Flex>
              <Flex align="center" justify="space-between" minH="28px">
                <Text
                  fontWeight="bold"
                  color="#18181b"
                  fontSize="xs"
                  minW="110px"
                >
                  Status:
                </Text>
                <Badge
                  bg={STATUS_COLORS[company.status] || STATUS_COLORS.Accepted}
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
                  aria-label={`Status: ${company.status}`}
                  tabIndex={0}
                >
                  {company.status}
                </Badge>
              </Flex>
              {company.status === "Rejected" && (
                <Flex align="center" justify="space-between" minH="28px">
                  <Text
                    fontWeight="bold"
                    color="#18181b"
                    fontSize="xs"
                    minW="110px"
                  >
                    Reason:
                  </Text>
                  <Text color="#18181b" fontSize="xs" textAlign="right" flex="1">
                    --
                  </Text>
                </Flex>
              )}
            </Flex>

            {/* Web Layout - Full Screen Card Format */}
            <Flex 
              align="center" 
              justify="space-between" 
              w="full" 
              px={6} 
              py={6}
              display={{ base: "none", md: "flex" }}
              columnGap="10px"
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
                  {company.companyName}
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
                  {company.phoneNo ? formatPhoneNumber(company.phoneNo) : "-"}
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
                  {company.email || "-"}
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
                <Badge
                  bg={STATUS_COLORS[company.status] || STATUS_COLORS.Accepted}
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
                  aria-label={`Status: ${company.status}`}
                  tabIndex={0}
                  alignSelf="flex-start"
                >
                  {company.status}
                </Badge>
              </Flex>
            </Flex>
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
        {company.status === "Pending" ? (
          <PrimaryButton
            w="100%"
            h={{ base: "40px", md: "48px" }}
            borderRadius="4px"
            fontWeight="bold"
            fontSize={{ base: "xs", md: "md" }}
            ariaLabel="Re-Invite visitor"
            tabIndex={0}
            isLoading={reinviteLoading}
            isDisabled={reinviteLoading}
            onClick={handleReinvite}
          >
            Re-Invite
          </PrimaryButton>
        ) : company.status === "Rejected" ? (
          <PrimaryButton
            w="100%"
            h={{ base: "40px", md: "48px" }}
            borderRadius="4px"
            fontWeight="bold"
            fontSize={{ base: "xs", md: "md" }}
            bg="#9747ff"
            color="white"
            _hover={{ bg: "#7a2ee6" }}
            ariaLabel="Go Back"
            tabIndex={0}
            onClick={() => router.back()}
          >
            Go Back
          </PrimaryButton>
        ) : (
          <PrimaryButton
            w="100%"
            h={{ base: "40px", md: "48px" }}
            borderRadius="4px"
            fontWeight="bold"
            fontSize={{ base: "xs", md: "md" }}
            bg="#e34a35"
            _hover={{ bg: "#c43d2b" }}
            color="white"
            ariaLabel="Remove visitor"
            tabIndex={0}
            isLoading={deleting}
            isDisabled={deleting}
            onClick={async () => {
              setShowDeleteModal(true);
            }}
          >
            Remove
          </PrimaryButton>
        )}
      </Box>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="white"
            borderRadius="md"
            p={6}
            maxW="400px"
            w="90%"
            mx={4}
            boxShadow="xl"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4} color="#000">
              Delete Invitation
            </Text>
            <Text mb={6} color="gray.600">
              Are you sure? You can&apos;t undo this action afterwards.
            </Text>
            <Flex gap={3} justify="space-between">
              <PrimaryButton
                flex="1"
                onClick={() => setShowDeleteModal(false)}
                bg="white"
                color="black"
                border="2px solid"
                borderColor="gray.300"
                _hover={{ bg: "gray.50" }}
                _active={{ bg: "gray.100" }}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                flex="1"
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteCompanyInvitation(company.invId);
                    toaster.success({
                      title: "Invitation deleted",
                      description: "The invitation was removed successfully.",
                    });
                    // Use replace instead of push to replace the current history entry
                    // This prevents the back button from returning to this page after deletion
                    router.replace("/dashboard");
                  } catch (err: unknown) {
                    let errorMsg = "Unknown error";
                    if (
                      typeof err === "object" &&
                      err !== null &&
                      "response" in err &&
                      typeof (
                        err as { response?: { data?: { error?: string } } }
                      ).response === "object"
                    ) {
                      const response = (
                        err as { response?: { data?: { error?: string } } }
                      ).response;
                      errorMsg = response?.data?.error || errorMsg;
                    }
                    toaster.error({
                      title: "Failed to delete",
                      description: errorMsg,
                    });
                  } finally {
                    setDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
                loading={deleting}
                disabled={deleting}
                bg="#e34a35"
                color="white"
                _hover={{ bg: "#c43d2b" }}
                _active={{ bg: "#b33626" }}
              >
                Delete
              </PrimaryButton>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
