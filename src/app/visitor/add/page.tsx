"use client";

import React, { useState, useRef, useEffect } from "react";
import { Box, Flex, Button } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import VisitorStepper from "./components/VisitorStepper";
import StepOne from "./components/StepOne";
import { VisitorFormData } from "@/app/api/visitor/routes";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "@/app/api/profile/routes";

const AddVisitorPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const stepOneRef = useRef<{
    validateFields: () => boolean;
    resetImage: () => void;
  }>(null);

  // Reset form function
  const resetForm = () => {
    setVisitorFormData({
      fullName: "",
      phoneNumber: "",
      gender: "",
      idType: "",
      idNumber: "",
      date: "",
      time: "",
      comingFrom: "company",
      companyName: "",
      location: null,
      purposeOfVisit: "",
      imgUrl: "",
      status: "pending",
      rejectionReason: "",
      hostDetails: {
        userId: 0,
        email: "",
        name: "",
        phoneNumber: "",
        profileImageUrl: null,
      },
      assets: [],
      guest: [],
    });
    setCurrentStep(0);
    setError(null);
    // Reset the image
    stepOneRef.current?.resetImage();
  };

  // Reset form when component mounts (when user navigates back to add page)
  useEffect(() => {
    // Check if we're coming back from a successful submission
    const shouldReset = sessionStorage.getItem("shouldResetForm");
    if (shouldReset === "true") {
      resetForm();
      sessionStorage.removeItem("shouldResetForm");
    }

    // Check if reset parameter is present (from New Visitor button)
    const resetParam = searchParams.get("reset");
    if (resetParam === "true") {
      resetForm();
      // Remove the reset parameter from URL without causing a page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("reset");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [searchParams]);

  // Initialize visitor form data with all required properties
  const [visitorFormData, setVisitorFormData] = useState<VisitorFormData>({
    fullName: "",
    phoneNumber: "",
    gender: "",
    idType: "",
    idNumber: "",
    date: "",
    time: "",
    comingFrom: "company",
    companyName: "",
    location: null,
    purposeOfVisit: "",
    imgUrl: "",
    status: "pending",
    rejectionReason: "",
    hostDetails: {
      userId: 0,
      email: "",
      name: "",
      phoneNumber: "",
      profileImageUrl: null,
    },
    assets: [],
    guest: [],
  });

  // Load profile data
  React.useEffect(() => {
    const loadProfileData = async () => {
      try {
        setProfileLoading(true);
        // Check auth data first
        const authDataRaw = localStorage.getItem("authData");

        if (!authDataRaw) {
          console.error("No auth data found in localStorage");
          setProfileLoading(false);
          return;
        }

        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        }
        setProfileData(profileData);
        setProfileLoading(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        console.error("Error details:", error);
        setProfileLoading(false);
      }
    };

    loadProfileData();
  }, []);

  // Update date/time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  const handleFormChange = (field: keyof VisitorFormData, value: unknown) => {
    setVisitorFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate Step One
      if (stepOneRef.current?.validateFields()) {
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };


  return (
    <Box
      // h="100vh"
      w="full"
      display="flex"
      flexDirection="column"
      // overflow="auto"
    >
      {/* Progress Stepper */}
      <VisitorStepper
        currentStep={currentStep}
        profileData={profileData}
        currentDateTime={currentDateTime}
        profileLoading={profileLoading}
      />

      {/* Main Content */}
      <Box flex="1" bg="#F0E6FF" overflowY='auto'>
        <Box p={8}>
          {currentStep === 0 && (
            <StepOne
              ref={stepOneRef}
              visitorFormData={visitorFormData}
              onChange={handleFormChange}
              loading={loading}
              error={error}
            />
          )}
          {/* Add other steps here */}
        </Box>

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
            <div>Logo</div>
          </Box>
        </Box>
      </Box>

      {/* Footer with Navigation Buttons */}
      <Box
        bg="white"
        px={8}
        py={4}
        borderTop="1px solid #E2E8F0"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Left side - empty for now */}
        <Box />

        {/* Right side - Navigation buttons */}
        <Flex gap={4}>
          <Button
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            bg="white"
            _hover={{ bg: "gray.50" }}
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            bg="var(--Primary-Dark, #5F24AC)"
            color="white"
            _hover={{ bg: "var(--Primary-Dark, #4A1F8A)" }}
            onClick={handleNext}
            disabled={loading}
          >
            Next
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default AddVisitorPage;
