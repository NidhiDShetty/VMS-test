"use client";
import React from "react";
import { Box, Flex, Text, IconButton, Icon } from "@chakra-ui/react";
import { FiX } from "react-icons/fi";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

interface FixedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  isMobile?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  showCloseButton?: boolean;
}

const FixedModal: React.FC<FixedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  isMobile = false,
  maxWidth = "600px",
  maxHeight = "80vh",
  showCloseButton = true,
}) => {
  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1000}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Box
        position="fixed"
        top={isMobile ? 0 : "50%"}
        left={isMobile ? 0 : "50%"}
        right={isMobile ? 0 : "auto"}
        bottom={isMobile ? 0 : "auto"}
        transform={isMobile ? "none" : "translate(-50%, -50%)"}
        w={isMobile ? "100vw" : maxWidth}
        h={isMobile ? "100vh" : "auto"}
        maxH={isMobile ? "100vh" : maxHeight}
        bg="white"
        borderRadius={isMobile ? "none" : "xl"}
        zIndex={1001}
        display="flex"
        flexDirection="column"
        boxShadow="xl"
        overflow="hidden"
      >
        {/* Header */}
        <Box
          bg="purple.50"
          borderTopRadius={isMobile ? "none" : "xl"}
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor="gray.200"
          position="sticky"
          top={0}
          zIndex={2}
        >
          <Flex align="center" justify="space-between">
            <Text fontSize="lg" fontWeight="bold" color="gray.800">
              {title}
            </Text>
            {showCloseButton && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                aria-label="Close modal"
              >
                <Icon as={FiX} boxSize={4} />
              </IconButton>
            )}
          </Flex>
        </Box>
        
        {/* Body */}
        <Box p={6} flex={1} overflowY="auto">
          {children}
        </Box>
      </Box>
    </>
  );
};

export default FixedModal;




