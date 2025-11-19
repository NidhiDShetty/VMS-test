"use client";

import { useState } from "react";
import { Box, Flex, Text, Portal, Dialog, useBreakpointValue } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { inviteCompany } from "@/app/invite-visitor/api";
import { useRouter } from "next/navigation";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onCloseParent?: () => void; // New prop to close parent InviteModal
  companyData: {
    companyName: string;
    phoneNumber: string;
    email: string;
    phoneCountry: string;
    country: string;
  };
}

const PreviewModal = ({ isOpen, onClose, onBack, onCloseParent, companyData }: PreviewModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);

  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });
  
  const { companyName, phoneNumber, email, country } = companyData;
  
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
      toaster.success({ 
        title: "Invite sent successfully", 
        description: `Invitation sent to ${email}` 
      });
      onClose();
      // Close parent InviteModal if provided
      if (onCloseParent) {
        onCloseParent();
      }
      // Navigate to dashboard after successful invite
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
        onClose();
      } else {
        toaster.error({ title: "Failed to send invite", description: errorMsg });
      }
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop
          bg="rgba(0, 0, 0, 0.5)"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1000}
        />
        <Dialog.Positioner
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 3, md: 4 }}
          zIndex={1001}
          overflow="hidden"
          overscrollBehavior="none"
          className="modal-container"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            overscrollBehavior: "none",
          }}
        >
          <Dialog.Content
            width="full"
            maxWidth={{ base: "100%", md: "600px" }}
            height="full"
            maxHeight={{ base: "100%", md: "calc(100vh - 2rem)" }}
            borderRadius={{ base: "none", md: "xl" }}
            bg="white"
            boxShadow={{ base: "0 2px 16px rgba(95,36,172,0.27)", md: "0 2px 16px rgba(95,36,172,0.27)" }}
            tabIndex={0}
            aria-label="Preview Company Details Modal"
            p={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            border={{ base: "none", md: "1px solid" }}
            borderColor={{ base: "transparent", md: "rgba(139, 92, 246, 0.1)" }}
            position="relative"
          >
            <Dialog.Header
              p={{ base: `${modalPadding} ${contentPadding}`, md: "24px 32px" }}
              bg={{
                base: "#F4EDFE",
                md: "linear-gradient(135deg, #8A38F5, #5F24AC)",
              }}
              borderBottomWidth="1px"
              borderBottomColor={{
                base: "gray.200",
                md: "rgba(255,255,255,0.1)",
              }}
              borderTopLeftRadius={{ base: 0, md: "xl" }}
              borderTopRightRadius={{ base: 0, md: "xl" }}
              position="sticky"
              top={0}
              zIndex={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow={{
                base: "none",
                md: "0 4px 20px rgba(139, 92, 246, 0.2)",
              }}
              h={{ base: "70px", md: "auto" }}
            >
              <Dialog.Title asChild>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: "lg", md: "xl" }}
                  color={{ base: "gray.800", md: "white" }}
                  textAlign="center"
                  fontFamily="Roboto, sans-serif"
                >
                  Preview Company Details
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            <Box
              as={Dialog.Body}
              p={{ base: contentPadding, md: "32px" }}
              flex={1}
              minH={0}
              overflowY="scroll"
              overflowX="hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="scrollbar-hide modal-content"
              bg="white"
              position="relative"
              maxH="calc(100vh - 200px)"
              overscrollBehavior="contain"
            >
              <Box display="flex" justifyContent="center" pt={{ base: 2, md: 4 }}>
                <Box
                  bg="#F3F2FD"
                  w="full"
                  maxW={{ base: "100%", md: "562px" }}
                  minH="138px"
                  borderRadius="8px"
                  p={4}
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                >
                  <Flex direction="column" gap={4}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontSize={{ base: "sm", md: "14px" }} fontWeight="500" color="gray.600">
                        Company Name:
                      </Text>
                      <Text fontSize={{ base: "md", md: "16px" }} color="gray.800">
                        {companyName || "-"}
                      </Text>
                    </Flex>
                    
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontSize={{ base: "sm", md: "14px" }} fontWeight="500" color="gray.600">
                        Phone No:
                      </Text>
                      <Text fontSize={{ base: "md", md: "16px" }} color="gray.800">
                        {phoneDisplay}
                      </Text>
                    </Flex>
                    
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontSize={{ base: "sm", md: "14px" }} fontWeight="500" color="gray.600">
                        Email:
                      </Text>
                      <Text fontSize={{ base: "md", md: "16px" }} color="gray.800">
                        {email || "-"}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              </Box>
              <Box h={16} /> {/* Extra bottom spacing to ensure scroll */}
            </Box>

            <Box
              px={{ base: contentPadding, md: "32px" }}
              pb={{ base: contentPadding, md: "24px" }}
              pt={{ base: 2, md: 4 }}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius={{ base: 0, md: "xl" }}
              borderBottomRightRadius={{ base: 0, md: "xl" }}
              borderTopWidth="1px"
              borderTopColor={{
                base: "gray.200",
                md: "rgba(139, 92, 246, 0.1)",
              }}
              boxShadow={{
                base: "none",
                md: "0 -4px 20px rgba(139, 92, 246, 0.1)",
              }}
            >
              <Flex gap={{ base: 2, md: 4 }} w="full">
                <SecondaryButton
                  onClick={handleBack}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                >
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSendInvite}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                  bg="linear-gradient(135deg, #8A38F5, #5F24AC)"
                  _hover={{
                    bg: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                    transform: { base: "none", md: "translateY(-1px)" },
                  }}
                  transition="all 0.2s ease"
                  loading={loading}
                >
                  {loading ? "Sending..." : "Send Invite"}
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PreviewModal;
