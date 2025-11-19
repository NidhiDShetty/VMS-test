"use client";
import {
  Box,
  Flex,
  Text,
  Textarea,
  Portal,
  Dialog,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useState } from "react";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: string) => void;
  isLoading?: boolean;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}) => {
  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);
  const [rejectionReason, setRejectionReason] = useState("");
  const maxCharacters = 500;

  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });

  const handleSave = () => {
    if (rejectionReason.trim()) {
      onSave(rejectionReason.trim());
    }
  };

  const handleClose = () => {
    setRejectionReason("");
    onClose();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
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
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            overscrollBehavior: 'none'
          }}
        >
          <Dialog.Content
            width="full"
            maxWidth={{ base: "100%", md: "400px" }}
            height="auto"
            maxHeight={{ base: "100%", md: "calc(100vh - 2rem)" }}
            borderRadius={{ base: 0, md: "lg" }}
            bg="white"
            boxShadow={{ base: "0 2px 16px rgba(95,36,172,0.27)", md: "0 2px 16px rgba(95,36,172,0.27)" }}
            tabIndex={0}
            aria-label="Reject Reason Modal"
            p={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
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
              borderTopLeftRadius={{ base: 0, md: "lg" }}
              borderTopRightRadius={{ base: 0, md: "lg" }}
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
                  Add Reason
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            {/* Body */}
            <Box
              as={Dialog.Body}
              px={6}
              py={6}
              flex={1}
              className="modal-content"
              style={{
                overscrollBehavior: 'contain'
              }}
              minH={0}
              overflowY="auto"
              overflowX="hidden"
            >
              <Flex direction="column" gap={4}>
                <Text fontWeight="bold" fontSize="md" color="#18181A" mb={2}>
                  Reason for Rejection
                </Text>

                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  size="md"
                  minH="120px"
                  resize="vertical"
                  border="1px solid #DCE3E3"
                  borderRadius="md"
                  color="#000000"
                  _focus={{
                    borderColor: "#8A38F5",
                    boxShadow: "0 0 0 1px #8A38F5",
                  }}
                  _placeholder={{
                    color: "#757A95",
                  }}
                  maxLength={maxCharacters}
                />

                <Text fontSize="sm" color="#757A95" textAlign="right">
                  {rejectionReason.length}/{maxCharacters} characters
                </Text>
              </Flex>
            </Box>

            <Box
              px={{ base: contentPadding, md: "32px" }}
              pb={{ base: contentPadding, md: "24px" }}
              pt={{ base: 2, md: 4 }}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius={{ base: 0, md: "lg" }}
              borderBottomRightRadius={{ base: 0, md: "lg" }}
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
                  onClick={handleClose}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                  disabled={isLoading}
                >
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSave}
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
                  disabled={isLoading || !rejectionReason.trim()}
                >
                  {isLoading ? "Saving..." : "Save"}
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default RejectReasonModal;
