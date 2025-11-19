"use client";

import { Box, Text, VStack } from "@chakra-ui/react";
import HeaderTitle from "@/components/HeaderTitle";
import VisitorStepper from "./components/VisitorStepper";
import FooterNav from "./components/FooterNav";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import TabsView from "./components/StepThree/Tabs";
import {
  useVisitorForm,
  Employee,
  VisitorFormData,
} from "@/lib/hooks/useVisitorForm";
import { useVisitorPreview } from "./VisitorPreviewContext";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getVisitorsByHost } from "@/app/api/visitor/routes";

export default function AddVisitorLayout() {
  // Force white background for body/html in dark mode
  useEffect(() => {
    // Create a style element to override CSS variables
    const styleId = 'visitor-add-white-bg-override';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = `
        body, html {
          background-color: #ffffff !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
    
    // Also set inline styles as backup
    const originalBodyBg = document.body.style.backgroundColor;
    const originalHtmlBg = document.documentElement.style.backgroundColor;
    
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.style.backgroundColor = '#ffffff';
    
    // Cleanup: remove style element and restore original background
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      document.body.style.backgroundColor = originalBodyBg;
      document.documentElement.style.backgroundColor = originalHtmlBg;
    };
  }, []);
  const {
    // State
    currentStep,
    visitorFormData,
    employeesList,
    loading,
    error,
    currentUserProfile,

    // Actions
    handleChangeVisitorField,
    handleBack,
    handleNext,
    handleCreateVisitor,
    handleSelectHost,
    resetFormData,
  } = useVisitorForm();

  const { visitorPreviewData, setVisitorPreviewData } = useVisitorPreview();
  const searchParams = useSearchParams();
  const stepOneRef = useRef<{ validateFields: () => boolean; resetImage: () => void }>(null);
  const initializedRef = useRef(false);
  const syncedToContextRef = useRef(false);
  const [isLoadingVisitorData, setIsLoadingVisitorData] = useState(false);

  // Get clean form data for reset
  const getCleanFormData = () => ({
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
    status: "PENDING",
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

  // Format date from ISO string or other formats to YYYY-MM-DD
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    
    try {
      // Handle malformed ISO strings like "11T00:00:00.000Z-10-2025"
      if (dateString.includes("T") && dateString.includes("Z")) {
        // Try to extract date parts from malformed string
        const parts = dateString.split("T");
        if (parts.length >= 2) {
          const datePart = parts[0];
          const timePart = parts[1];
          
          // If date part is just a number, it might be malformed
          if (/^\d+$/.test(datePart)) {
            // Try to reconstruct from the full string
            const match = dateString.match(/(\d+)T.*?(\d+)-(\d+)-(\d+)/);
            if (match) {
              const [, day, hour, month, year] = match;
              const date = new Date(`${year}-${month}-${day}`);
              if (!isNaN(date.getTime())) {
                return date.toISOString().split("T")[0];
              }
            }
          }
        }
      }
      
      // Handle ISO datetime strings
      if (dateString.includes("T")) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      }
      
      // Handle other date formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }
      
      return "";
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "";
    }
  };

  // Format time from ISO string or other formats to HH:MM
  const formatTimeForInput = (timeString: string): string => {
    if (!timeString) return "";
    
    try {
      // Handle malformed ISO strings like "1970-01-01T13:51:12.000Z"
      if (timeString.includes("T") && timeString.includes("Z")) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toTimeString().slice(0, 5);
        }
      }
      
      // Handle time-only strings
      if (timeString.includes(":") && !timeString.includes("T")) {
        const time = new Date(`2000-01-01T${timeString}`);
        if (!isNaN(time.getTime())) {
          return time.toTimeString().slice(0, 5);
        }
      }
      
      // Handle other formats
      const date = new Date(timeString);
      if (!isNaN(date.getTime())) {
        return date.toTimeString().slice(0, 5);
      }
      
      return "";
    } catch (error) {
      console.error("Error formatting time:", error, timeString);
      return "";
    }
  };

  // Load visitor data for edit mode
  const loadVisitorData = useCallback(async (visitorId: string) => {
    setIsLoadingVisitorData(true);
    try {
      const authDataRaw = localStorage.getItem("authData");
      if (!authDataRaw) {
        throw new Error("No authentication data found");
      }

      const authData = JSON.parse(authDataRaw);
      const token = authData.token;

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await getVisitorsByHost(token);
      const visitor = response.visitors.find((v: { id: string }) => v.id === visitorId);

      if (!visitor) {
        throw new Error("Visitor not found");
      }

      // Format the visitor data for the form
      const formattedVisitorData: VisitorFormData = {
        fullName: visitor.fullName || "",
        phoneNumber: visitor.phoneNumber || "",
        gender: visitor.gender || "",
        idType: visitor.idType || "",
        idNumber: visitor.idNumber || "",
        date: formatDateForInput(visitor.date || ""),
        time: formatTimeForInput(visitor.time || ""),
        comingFrom: visitor.comingFrom || "company",
        companyName: visitor.companyName || "",
        location: visitor.location || null,
        purposeOfVisit: visitor.purposeOfVisit || "",
        imgUrl: visitor.imgUrl || "",
        status: visitor.status || "PENDING",
        rejectionReason: visitor.rejectionReason || "",
        hostDetails: visitor.hostDetails || {
          userId: 0,
          email: "",
          name: "",
          phoneNumber: "",
          profileImageUrl: null,
        },
        assets: visitor.assets || [],
        guest: visitor.guest || [],
      };

      setVisitorPreviewData(formattedVisitorData);
    } catch (error) {
      console.error("Error loading visitor data:", error);
      // Fallback to clean form data
      setVisitorPreviewData(getCleanFormData());
    } finally {
      setIsLoadingVisitorData(false);
    }
  }, [setVisitorPreviewData]);


  // On mount, initialize context if empty
  React.useEffect(() => {
    // Check if we're coming from check-in visitor page (reset parameter)
    const shouldReset = searchParams.get("reset") === "true";
    const isEdit = searchParams.get("edit") === "true";
    const visitorId = searchParams.get("id");

    // Prevent multiple initializations
    if (initializedRef.current && !shouldReset) {
      return;
    }

    if (shouldReset) {
      // Clear the context to start fresh
      setVisitorPreviewData(null);
      // Reset the form data in the hook
      resetFormData();
      // Set clean form data in context
      setVisitorPreviewData(getCleanFormData());
      initializedRef.current = true;
      syncedToContextRef.current = false;
    } else if (isEdit) {
      // For edit mode, check if we have visitor data that needs formatting
      if (visitorId) {
        // Load visitor data if we have an ID
        if (!visitorPreviewData) {
          loadVisitorData(visitorId);
          initializedRef.current = true;
        }
      } else if (visitorPreviewData && visitorPreviewData.date && visitorPreviewData.time) {
        // If we have visitor data but it's not formatted properly, format it
        const formattedData = {
          ...visitorPreviewData,
          date: formatDateForInput(visitorPreviewData.date),
          time: formatTimeForInput(visitorPreviewData.time),
        };
        setVisitorPreviewData(formattedData);
        initializedRef.current = true;
      } else if (!visitorPreviewData) {
        // Fallback to current form data
        setVisitorPreviewData(visitorFormData);
        initializedRef.current = true;
      }
    } else if (!visitorPreviewData && !shouldReset) {
      // Only initialize if not resetting and context is empty
      setVisitorPreviewData(visitorFormData);
      initializedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setVisitorPreviewData, resetFormData, loadVisitorData]);

  // Format existing visitor data if it has malformed date/time
  React.useEffect(() => {
    const isEdit = searchParams.get("edit") === "true";
    
    if (
      isEdit &&
      visitorPreviewData &&
      visitorPreviewData.date &&
      visitorPreviewData.time &&
      (visitorPreviewData.date.includes("T") || visitorPreviewData.time.includes("T"))
    ) {
      // Format the malformed date/time data
      const formattedData = {
        ...visitorPreviewData,
        date: formatDateForInput(visitorPreviewData.date),
        time: formatTimeForInput(visitorPreviewData.time),
      };
      setVisitorPreviewData(formattedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visitorPreviewData, searchParams]);

  // Initialize form state with context data when in edit mode (run only once)
  React.useEffect(() => {
    const isEdit = searchParams.get("edit") === "true";
    
    // Only sync once per edit session and when not loading
    if (
      isEdit &&
      visitorPreviewData &&
      Object.keys(visitorPreviewData).length > 0 &&
      !syncedToContextRef.current &&
      !isLoadingVisitorData
    ) {
      // Update form state to match context data
      Object.entries(visitorPreviewData).forEach(([key, value]) => {
        handleChangeVisitorField(key as keyof VisitorFormData, value);
      });
      syncedToContextRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, visitorPreviewData, isLoadingVisitorData]);

  // Sync all changes to the form with the context
  const handleChangeAndSync = useCallback((
    field: keyof VisitorFormData,
    value: unknown
  ) => {
    handleChangeVisitorField(field as keyof VisitorFormData, value);
    // Update context with the new value
    const updatedData = {
      ...(visitorPreviewData || visitorFormData),
      [field]: value,
    };
    setVisitorPreviewData(updatedData);
  }, [handleChangeVisitorField, visitorPreviewData, visitorFormData, setVisitorPreviewData]);

  // On successful submission, reset the context
  const handleCreateAndReset = async () => {
    await handleCreateVisitor();
    setVisitorPreviewData(null);
  };

  // Sync host selection with context
  const handleSelectHostAndSync = useCallback((employee: Employee) => {
    handleSelectHost(employee);
    setVisitorPreviewData({
      ...(visitorPreviewData || visitorFormData),
      hostDetails: {
        userId: employee.userId,
        email: employee.email,
        name: employee.name,
        phoneNumber: employee.phoneNumber,
        profileImageUrl: employee.profileImageUrl ?? null,
      },
    });
  }, [handleSelectHost, visitorPreviewData, visitorFormData, setVisitorPreviewData]);

  // Custom handleNext to validate StepOne before moving to StepTwo
  const handleNextWithValidation = () => {
    if (currentStep === 0 && stepOneRef.current) {
      const isValid = stepOneRef.current.validateFields();
      if (!isValid) return;
    }
    handleNext();
  };

  const renderStep = () => {
    const shouldReset = searchParams.get("reset") === "true";
    const resetKey = shouldReset ? "reset" : "normal";

    switch (currentStep) {
      case 0:
        return (
          <StepOne
            key={resetKey}
            ref={stepOneRef}
            visitorFormData={visitorPreviewData || visitorFormData}
            onChange={handleChangeAndSync as (field: string, value: unknown) => void}
            loading={loading}
            error={error}
          />
        );
      case 1:
        return (
          <StepTwo
            visitorFormData={visitorPreviewData || visitorFormData}
            onChange={handleChangeAndSync as (field: string, value: unknown) => void}
            visitorsList={employeesList}
            loading={loading}
            error={error}
            onSelectHost={handleSelectHostAndSync}
            currentUserProfile={currentUserProfile}
          />
        );
      case 2:
        return (
          <TabsView
            visitorFormData={visitorPreviewData || visitorFormData}
            onChange={handleChangeAndSync as (field: string, value: unknown) => void}
            loading={loading}
            error={error}
          />
        );
      default:
        return <div>Step Not Found</div>;
    }
  };

  return (
    <Box 
      // position="relative"
      bg="#fff" 
      color="black" 
      // minH="100vh"
      w="100%"
      pb="50px"
      style={{ 
        backgroundColor: '#ffffff',
      }}
    >
      {/* Sticky Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={20}
        bg="white"
        borderBottom="1px solid #E2E8F0"
        display={{ base: "block", md: "none" }}
        style={{ backgroundColor: '#ffffff' }}
      >
        <HeaderTitle title="Add New Visitor's Details" onBack={handleBack} />
      </Box>

      {/* Top Info + Stepper */}
      <Box bg="#f4edfefa" pb={2} pt={4} mt="0" style={{ backgroundColor: '#f4edfefa' }}>
        <VStack
          px={4}
          align="flex-start"
          display={{ base: "flex", md: "none" }}
          gap={0}
        >
          <Text fontWeight="bold" fontSize="md" color="#18181B">
            Add New
          </Text>
          <Text fontSize="xs" color="gray.600">
            Please provide all the information
          </Text>
        </VStack>
        <VisitorStepper currentStep={currentStep} />
      </Box>

      {/* Step Content */}
      <Box 
        mt={3} 
        px={4} 
        pb={4}
        // h='48vh'
        bg="#fff" 
        style={{ 
          backgroundColor: '#ffffff',
          ...(searchParams.get("edit") === "true" ? {
            height: 'calc(100vh - 300px)',
            overflowY: 'auto',
          } : {}),
        }}
      >
        <Box 
          overflowY='auto'
          // style={{ maxHeight: 'calc(100vh - 200px)' }}
        >
          {renderStep()}
        </Box>
        {/* Add extra white space at the bottom to ensure white background when scrolling */}
        {/* <Box h="120px" bg="#fff" style={{ backgroundColor: '#ffffff' }} /> */}
      </Box>

      {/* Sticky Footer Navigation */}
      <FooterNav
        currentStep={currentStep}
        onBack={handleBack}
        onNext={handleNextWithValidation}
        loading={loading}
        error={error}
        onCreateVisitor={handleCreateAndReset}
        visitorFormData={visitorPreviewData || visitorFormData}
      />
    </Box>
  );
}
