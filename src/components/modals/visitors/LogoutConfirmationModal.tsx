import React from "react";
import { Box, Flex, Text, Portal, Dialog, useBreakpointValue } from "@chakra-ui/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

export type LogoutConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const LogoutConfirmationModal: React.FC<LogoutConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);
  
  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
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
            maxW="md"
            w="90%"
            bg="white"
            borderRadius="lg"
            boxShadow="lg"
            tabIndex={0}
            aria-label="Logout Confirmation Modal"
            p={0}
            mx="auto"
            my="auto"
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
              borderTopLeftRadius="lg"
              borderTopRightRadius="lg"
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
                  Logout Confirmation
                </Text>
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Box display="flex" flexDirection="column" gap={4}>
                <Text
                  fontSize="md"
                  color="black"
                  textAlign="center"
                  aria-label="Confirmation Message"
                  px={4}
                  py={2}
                >
                  Are you sure you want to logout?
                </Text>
              </Box>
            </Dialog.Body>
            <Box
              px={{ base: contentPadding, md: "32px" }}
              pb={{ base: contentPadding, md: "24px" }}
              pt={{ base: 2, md: 4 }}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius="lg"
              borderBottomRightRadius="lg"
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
                  // borderRadius={{ base: "md", md: "xl" }}
                  // fontFamily="Roboto, sans-serif"
                >
                  No
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleConfirm}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  // borderRadius={{ base: "md", md: "xl" }}
                  // fontFamily="Roboto, sans-serif"
                  // bg="linear-gradient(135deg, #8A38F5, #5F24AC)"
                  // _hover={{
                  //   bg: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                  //   transform: { base: "none", md: "translateY(-1px)" },
                  // }}
                  // transition="all 0.2s ease"
                >
                  Yes
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default LogoutConfirmationModal; 