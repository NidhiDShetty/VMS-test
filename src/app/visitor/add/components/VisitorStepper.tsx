"use client";

import { Box, Flex, Text, IconButton } from "@chakra-ui/react";
import { MdCheck } from "react-icons/md";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import DesktopHeader from "@/components/DesktopHeader";

interface VisitorStepperProps {
  currentStep: number;
  profileData?: unknown;
  currentDateTime?: Date;
  profileLoading?: boolean;
}

const steps = ["Visitor's Info", "Host Details", "Other Details"];

const VisitorStepper = ({ currentStep }: VisitorStepperProps) => {
  const router = useRouter();
  
  const handleBack = () => router.back();
  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBack();
    }
  };

  // Load role from localStorage to match profile pages exactly
  useEffect(() => {
    const authDataRaw = localStorage.getItem("authData");
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        const role = parsed?.user?.roleName || null;
        // Note: roleName state not needed in this component
      } catch {
        // Note: roleName state not needed in this component
      }
    }
  }, []);

  return (
    <Box w="full">
      {/* Desktop Header - Same as my-profile */}
      <DesktopHeader />

      {/* Page Title Section - Add New Visitors */}
      <Box
        display={{ base: "none", md: "flex" }}
        bg="var(--Primary-Light, #F0E6FF)"
        w="full"
        p='16px'
        alignItems="center"
        gap={3}
      >
        <IconButton
          aria-label="Back"
          tabIndex={0}
          variant="ghost"
          fontSize="lg"
          bg="#FFF"
          onClick={handleBack}
          color="#8A37F7"
          _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </IconButton>
        <Text
          fontWeight="bold"
          fontSize="lg"
          color="#18181b"
        >
          Add New Visitors
        </Text>
      </Box>

      {/* Stepper Component */}
      <Box bg={{ base: "#f4edfefa", md: "white" }} w="full" pt={6} pb={4}>
        <Box px={4} maxW="800px" mx="auto">
      <Flex align="center" justify="space-between" position="relative">
        {steps.map((_, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          const borderColor = isActive || isCompleted ? "#5F24AC" : "#D6D6D6";
          const textColor = isCompleted
            ? "#5F24AC"
            : isActive
            ? "#5F24AC"
            : "#B0B0B0";
          const bgColor = "white";

          return (
            <Flex
              key={index}
              direction="column"
              align="center"
              justify="center"
              flex="1"
              position="relative"
            >
              {/* Line connector left */}
              {index > 0 && (
                <Box
                  position="absolute"
                  top="18px"
                  left="0"
                  right="50%"
                  height="2px"
                  bg={index <= currentStep ? "#5F24AC" : "#D6D6D6"}
                  zIndex={0}
                />
              )}

              {/* Line connector right */}
              {index < steps.length - 1 && (
                <Box
                  position="absolute"
                  top="18px"
                  left="50%"
                  right="0"
                  height="2px"
                  bg={index < currentStep ? "#5F24AC" : "#D6D6D6"}
                  zIndex={0}
                />
              )}

              {/* Step circle */}
              <Flex
                borderRadius="full"
                w="36px"
                h="36px"
                bg={bgColor}
                color={textColor}
                justify="center"
                align="center"
                fontWeight="bold"
                border="2px solid"
                borderColor={borderColor}
                zIndex={1}
              >
                {isCompleted ? <MdCheck size={18} /> : index + 1}
              </Flex>
            </Flex>
          );
        })}
      </Flex>

      {/* Step labels - Simplified */}
      <Flex justify="space-between" mt={2} maxW="800px" mx="auto">
        {steps.map((label, index) => (
          <Text
            key={index}
            fontSize="xs"
            color={index === currentStep ? "#5F24AC" : "#18181B"}
            fontWeight={index === currentStep ? "bold" : "normal"}
            textAlign="center"
            w="full"
          >
            {index === 0 ? "Visitor's Info" : index === 1 ? "Host Details" : "Other Details"}
          </Text>
        ))}
      </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default VisitorStepper;
