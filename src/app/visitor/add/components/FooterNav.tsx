"use client";

import { Box, Flex } from "@chakra-ui/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useRouter } from "next/navigation";
import { VisitorFormData } from "@/app/api/visitor/routes";
import { useVisitorPreview } from "../VisitorPreviewContext";
import { toaster } from "@/components/ui/toaster";
import { APPROVAL_REQUIREMENT_GET_API } from "@/lib/server-urls";

interface FooterNavProps {
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
  onCreateVisitor: () => void;
  visitorFormData: VisitorFormData;
}

const FooterNav = ({ currentStep, onNext, onBack, visitorFormData }: FooterNavProps) => {
  const router = useRouter();
  const { setVisitorPreviewData } = useVisitorPreview();

  const handleNext = async () => {
    if (currentStep < 2) {
      // Sync context before moving to next step to capture any changes (including manual host entries)
      setVisitorPreviewData({
        ...visitorFormData,
        hostDetails: {
          ...visitorFormData.hostDetails,
        },
      });
      onNext();
    } else {
      // When Preview button is clicked, check approval requirement
      try {
        // Get auth token
        const authData = localStorage.getItem('authData');
        if (!authData) {
          toaster.error({
            title: "Error",
            description: "Authentication required. Please log in again.",
          });
          return;
        }
        
        const parsed = JSON.parse(authData);
        const token = parsed.token;
        
        if (!token) {
          toaster.error({
            title: "Error",
            description: "Authentication token not found. Please log in again.",
          });
          return;
        }

        const response = await fetch(APPROVAL_REQUIREMENT_GET_API, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const approvalResponse = await response.json();
        
        if (approvalResponse.success && approvalResponse.data) {
          const isApprovalReq = approvalResponse.data.isApprovalReq;
          
          // Explicitly sync all form data to context, including any manually entered host details
          // This ensures the latest data (especially hostDetails) is captured before navigation
          const previewData = {
            ...visitorFormData,
            hostDetails: {
              ...visitorFormData.hostDetails,
            },
            isApprovalReq: isApprovalReq
          };
          
          // Force update the context with the latest form data
          setVisitorPreviewData(previewData);
          
          // Small delay to ensure state update completes before navigation
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Navigate to preview page with approval requirement info
          router.push(`/visitor-history-preview?source=add&approvalReq=${isApprovalReq}`);
        } else {
          console.error("❌ Failed to get approval requirement:", approvalResponse.error);
          toaster.error({
            title: "Error",
            description: "Failed to check approval requirements. Please try again.",
          });
        }
      } catch (error) {
        console.error("❌ Error checking approval requirement:", error);
        toaster.error({
          title: "Error",
          description: "An error occurred while checking approval requirements.",
        });
      }
    }
  };

  return (
    <Box
      w="100%"
      px={4}
      py={3}
      position="fixed"
      bottom={0}
      left={0}
      bg="white"
      borderTop="1px solid #e0e0e0"
      zIndex={10}
      style={{ backgroundColor: '#ffffff' }}
    >
      {/* Mobile Layout */}
      <Flex gap={3} display={{ base: "flex", md: "none" }}>
        {currentStep > 0 && (
          <Box flex={1}>
            <SecondaryButton variant="outline" onClick={onBack} width="100%">
              Back
            </SecondaryButton>
          </Box>
        )}

        <Box flex={1}>
          <PrimaryButton onClick={handleNext} width="100%">
            {currentStep < 2 ? "Next" : "Preview"}
          </PrimaryButton>
        </Box>
      </Flex>

      {/* Web Layout - Right corner with 15% width each */}
      <Flex gap={3} display={{ base: "none", md: "flex" }} justifyContent="flex-end">
        {currentStep > 0 && (
          <Box w="15%">
            <SecondaryButton variant="outline" onClick={onBack} width="100%">
              Back
            </SecondaryButton>
          </Box>
        )}

        <Box w="15%">
          <PrimaryButton onClick={handleNext} width="100%">
            {currentStep < 2 ? "Next" : "Preview"}
          </PrimaryButton>
        </Box>
      </Flex>
    </Box>
  );
};

export default FooterNav;
