"use client";

import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
} from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { useVisitorInfo } from "../VisitorInfoContext";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { inviteCompany } from "../api";
import { toaster } from "@/components/ui/toaster";
import { useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";

const InviteVisitorPreviewPage = (): ReactNode => {
  const { info, clearStoredData } = useVisitorInfo();
  const { companyName, phoneNumber, email, country } = info;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const countryCodes: Record<string, string> = { Ind: '+91', US: '+1', UK: '+44' };
  const countryCode = countryCodes[country] || "";
  let formattedPhone = phoneNumber || "-";
  if (phoneNumber && countryCode) {
    // Remove leading country code (with or without '+', and optional dash or space)
    const regex = new RegExp(`^\\+?${countryCode.replace("+", "").replace("-", "")}[- ]?`);
    formattedPhone = phoneNumber.replace(regex, "");
  }
  const phoneDisplay = phoneNumber ? `${countryCode}-${formattedPhone}` : "-";

  const handleSendInvite = async () => {
    setLoading(true);
    try {
      await inviteCompany({ companyName, phoneNo: phoneNumber, email });
      setLoading(false);
      toaster.success({ title: "Invite sent successfully", description: `Invitation sent to ${email}` });
      // Clear stored data after successful invitation
      clearStoredData();
      // Navigate to companies-log page after successful invitation
      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMsg = "Unknown error";
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: string } } }).response === 'object'
      ) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        errorMsg = response?.data?.error || errorMsg;
      }
      setLoading(false);
      
      // Handle specific error for duplicate company name
      if (errorMsg.includes("Company name already exists")) {
        toaster.error({ 
          title: "Company name already exists", 
          description: "Please choose a different company name and try again." 
        });
        // Navigate back to the form to allow user to change company name
        router.push("/invite-visitor");
      } else {
        toaster.error({ title: "Failed to send invite", description: errorMsg });
      }
    }
  };

  return (
    <Box
      w="100vw"
      h="100vh"
      px={0}
      bg="white"
      display="flex"
      flexDirection="column"
      overflowX="hidden"
      overflowY="hidden"
      css={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        px={4}
        py={3}
        bg="#f4edfe"
        borderBottom="1px solid #f1f1f1"
      >
        <IconButton
          aria-label="Back"
          tabIndex={0}
          variant="ghost"
          fontSize="lg"
          mr={2}
          bg="transparent"
          onClick={() => router.push("/invite-visitor")}
          color="gray.700"
          _focus={{ boxShadow: "none", outline: "none", bg: "transparent" }}
          _active={{ bg: "transparent" }}
        >
          <FiChevronLeft />
        </IconButton>
        <Text
          flex={1}
          textAlign="center"
          fontWeight="bold"
          fontSize="lg"
          color="gray.800"
        >
          Add Company Details
        </Text>
        <Box w={8} />
      </Flex>

      {/* Preview Card */}
      <Box
        bg="#f3f2fd"
        borderRadius="md"
        mx={4}
        mt={3}
        p={4}
        boxShadow="sm"
      >
        <Stack align="stretch" gap={3}>
          <Flex justify="space-between" align="center">
            <Text fontWeight="semibold" color="#18181b" fontSize="xs">
              Company Name:
            </Text>
            <Text color="#18181b" fontSize="xs">
              {companyName || "-"}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Text fontWeight="semibold" color="#18181b" fontSize="xs">
              Phone No :
            </Text>
            <Text color="#18181b" fontSize="xs">
              {phoneDisplay}
            </Text>
          </Flex>
          <Flex justify="space-between" align="center">
            <Text fontWeight="semibold" color="#18181b" fontSize="xs">
              Email :
            </Text>
            <Text color="#18181b" fontSize="xs">
              {email || "-"}
            </Text>
          </Flex>
        </Stack>
      </Box>

      {/* Send Invite Button */}
      <Box
        px={4}
        w="100%"
        maxW="md"
        mx="auto"
        position="absolute"
        bottom={0}
        left={0}
        mb={4}
      >
        <PrimaryButton
          size="sm"
          w="100%"
          borderRadius="md"
          fontWeight="bold"
          fontSize="sm"
          py={2}
          isLoading={loading}
          isDisabled={loading}
          onClick={handleSendInvite}
          ariaLabel="Send Invite"
          tabIndex={0}
        >
          Send Invite
        </PrimaryButton>
      </Box>
    </Box>
  );
};

export default InviteVisitorPreviewPage; 