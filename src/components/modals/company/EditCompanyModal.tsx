"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  VStack,
  Portal,
  Dialog,
  Button,
  useBreakpointValue,
} from "@chakra-ui/react";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";


export type EditCompanyForm = {
  companyName: string;
  phoneNumber: string;
  email: string;
  buildingNumber: string;
  floorDetails: string;
  streetDetails: string;
  locality: string;
  city: string;
  state: string;
  pinCode: string;
};

export interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onSave: (form: EditCompanyForm) => void;
  initialData?: EditCompanyForm;
}

const defaultForm: EditCompanyForm = {
  companyName: "",
  phoneNumber: "",
  email: "",
  buildingNumber: "",
  floorDetails: "",
  streetDetails: "",
  locality: "",
  city: "",
  state: "",
  pinCode: "",
};

const EditCompanyModal: React.FC<EditCompanyModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSave,
  initialData,
}) => {
  const { isMobile } = useDeviceDetection();
  const [form, setForm] = useState<EditCompanyForm>(initialData || defaultForm);
  const [errors, setErrors] = useState<{ companyName?: string; phoneNumber?: string; email?: string }>({});
  const companyNameInputRef = useRef<HTMLInputElement>(null);

  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);

  // Sync form state with initialData when it changes
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  // Reset form when modal opens/closes to ensure fresh state
  useEffect(() => {
    if (isOpen && initialData) {
      setForm(initialData);
      // Clear selection on company name input when modal opens
      setTimeout(() => {
        if (companyNameInputRef.current) {
          companyNameInputRef.current.setSelectionRange(0, 0);
        }
      }, 100);
    }
  }, [isOpen, initialData]);

  const contentPadding = useBreakpointValue({ base: "16px", md: "20px" });

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only letters, numbers, spaces, and remove special characters except basic punctuation
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s.,&'-]/g, "");
    if (errors.companyName) {
      setErrors((prev) => ({ ...prev, companyName: undefined }));
    }
    setForm((prev) => ({ ...prev, companyName: sanitizedValue }));
    // If user tries to enter special characters, show error
    if (value !== sanitizedValue) {
      setErrors((prev) => ({ ...prev, companyName: "Company name cannot contain special characters" }));
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
    const { value } = e.target;
    
    // Extract only the numeric part after any country code
    let cleanValue = value;
    
    // Remove any country code prefix (+91-, +91, etc.)
    cleanValue = cleanValue.replace(/^\+91-?/, "");
    cleanValue = cleanValue.replace(/^\+/, ""); // Remove any other country code
    
    // Remove all non-digit characters
    cleanValue = cleanValue.replace(/\D/g, "");
    
    // Restrict to 10 digits
    if (cleanValue.length <= 10) {
      setForm((prev) => ({ ...prev, phoneNumber: cleanValue }));
    }
  };

  // Format phone number for display - handle both cases where backend provides full number or just digits
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "";
    
    // If phone already contains country code (starts with +), return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // If phone starts with 91 and has more digits, it's likely a full number with country code
    if (phone.startsWith('91') && phone.length > 10) {
      // Remove the leading 91 and format properly
      const numberWithoutCountryCode = phone.substring(2);
      return `+91-${numberWithoutCountryCode}`;
    }
    
    // If phone is just digits (10 digits), add country code
    if (/^\d{10}$/.test(phone)) {
      return `+91-${phone}`;
    }
    
    // If phone already has country code format, return as is
    if (phone.includes('-')) {
      return phone;
    }
    
    // Default case: assume it's just digits and add country code
    return `+91-${phone}`;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, email: e.target.value }));
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleGenericChange = (field: keyof EditCompanyForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const numericValue = value.replace(/\D/g, ""); // Remove non-digit characters
    // Restrict to 6 digits
    if (numericValue.length <= 6) {
      setForm((prev) => ({ ...prev, pinCode: numericValue }));
    }
  };

  const validate = () => {
    const newErrors: { companyName?: string; phoneNumber?: string; email?: string } = {};
    
    // Company name validation - required field and no invalid characters
    const trimmedCompanyName = form.companyName.trim();
    if (!trimmedCompanyName) {
      newErrors.companyName = "Company name is required";
    } else {
      // Check for invalid characters - only allow letters, numbers, spaces, and basic punctuation
      const hasInvalidChars = /[^a-zA-Z0-9\s.,&'-]/.test(trimmedCompanyName);
      if (hasInvalidChars) {
        newErrors.companyName = "Company name cannot contain special characters";
      }
    }
    
    // Phone validation: extract clean digits and check length
    let cleanPhoneNumber = form.phoneNumber.replace(/\D/g, "");
    
    // Handle case where phone number might include country code (91)
    if (cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12) {
      cleanPhoneNumber = cleanPhoneNumber.substring(2); // Remove country code
    }
    
    if (!cleanPhoneNumber) {
      newErrors.phoneNumber = "Enter a valid phone number";
    } else if (cleanPhoneNumber.length !== 10) {
      newErrors.phoneNumber = "Enter a valid phone number";
    }
    
    // Basic email validation - only validate if email is provided
    if (form.email && form.email.trim()) {
      const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = "Enter a valid email address";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    
    // Create the form data to save - ensure we're saving clean data
    let cleanPhoneNumber = form.phoneNumber.replace(/\D/g, "");
    
    // Handle case where phone number might include country code (91)
    if (cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12) {
      cleanPhoneNumber = cleanPhoneNumber.substring(2); // Remove country code for storage
    }
    
    const formToSave = {
      ...form,
      companyName: form.companyName.trim(),
      phoneNumber: cleanPhoneNumber, // Save only 10 digits
      email: form.email.trim(),
    };
    
    onSave(formToSave);
    onClose();
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
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
            maxWidth={{ base: "100%", md: "600px" }}
            height="full"
            maxHeight={{ base: "100%", md: "calc(100vh - 2rem)" }}
            borderRadius="lg"
            bg="white"
            boxShadow={{ base: "0 2px 16px rgba(95,36,172,0.27)", md: "0 2px 16px rgba(95,36,172,0.27)" }}
            tabIndex={0}
            aria-label="Edit Company Modal"
            p={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            border={{ base: "none", md: "1px solid" }}
            borderColor={{ base: "transparent", md: "gray.200" }}
          >
            <Dialog.Header
              p={{ base: `${contentPadding}`, md: "24px 32px" }}
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
                  {isMobile ? "Edit Company" : "Edit Company Information"}
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            {/* Body */}
            <Box
              as={Dialog.Body}
              px={contentPadding}
              pt={6}
              pb={2}
              flex={1}
              minH={0}
              overflowY="scroll"
              overflowX="hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="scrollbar-hide modal-content"
              bg="white"
              position="relative"
              maxH="calc(100vh - 140px)"
              overscrollBehavior="contain"
            >
              <VStack align="stretch" gap={4} w="full">
                {/* Company Name */}
                <Box>
                  <Text as="label" fontWeight="medium" fontSize="sm" color={"#000"}>
                    Company Name <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Input mt={1}
                    ref={companyNameInputRef}
                    value={form.companyName}
                    onChange={handleCompanyNameChange}
                    placeholder="Enter Company Name"
                    required
                    aria-label="Company Name"
                    bg="white"
                    color="#000"
                    _placeholder={{ color: "gray.500", fontSize: "sm" }}
                    borderColor="gray.200"
                    borderWidth="2px"
                    borderRadius="lg"
                    _focus={{ 
                      borderColor: "#8A38F5",
                      boxShadow: "0 0 0 1px #8A38F5"
                    }}
                    _active={{ borderColor: "#8A38F5" }}
                    _hover={{ borderColor: "#8A38F5" }}
                    _disabled={{ bg: "white", color: "#000" }}
                    onFocus={(e) => e.target.setSelectionRange(0, 0)}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.companyName && (
                    <Text color="red.500" fontSize="xs" mt={1}>{errors.companyName}</Text>
                  )}
                </Box>

                {/* Phone Number */}
                <Box>
                  <Text as="label" fontWeight="medium" fontSize="sm" color={"#000"}>
                    Phone Number <Text as="span" color="red.500">*</Text>
                  </Text>
                  <Input mt={1}
                    value={formatPhoneForDisplay(form.phoneNumber)}
                    onChange={handlePhoneNumberChange}
                    placeholder="Enter 10-digit phone number"
                    required
                    aria-label="Phone Number"
                    bg="white"
                    color="#000"
                    _placeholder={{ color: "gray.500", fontSize: "sm" }}
                    borderColor="gray.200"
                    borderWidth="2px"
                    borderRadius="lg"
                    _focus={{ 
                      borderColor: "#8A38F5",
                      boxShadow: "0 0 0 1px #8A38F5"
                    }}
                    _active={{ borderColor: "#8A38F5" }}
                    _hover={{ borderColor: "#8A38F5" }}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.phoneNumber && (
                    <Text color="red.500" fontSize="xs" mt={1}>{errors.phoneNumber}</Text>
                  )}
                </Box>

                {/* Email */}
                <Box>
                  <Text as="label" fontWeight="medium" fontSize="sm" color={"#000"}>
                    Email
                  </Text>
                  <Input mt={1}
                    value={form.email}
                    onChange={handleEmailChange}
                    placeholder="Enter Email"
                    aria-label="Email"
                    bg="gray.100"
                    color="#000"
                    _placeholder={{ color: "gray.500", fontSize: "sm" }}
                    disabled={true}
                    aria-disabled="true"
                    fontSize={{ base: "xs", sm: "sm" }}
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    borderColor="gray.200"
                    borderWidth="2px"
                    borderRadius="lg"
                    _focus={{ borderColor: "gray.200" }}
                    _active={{ borderColor: "gray.200" }}
                    _hover={{ borderColor: "gray.300", bg: "gray.150" }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: "not-allowed",
                      bg: "gray.100",
                      color: "#000"
                    }}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.email && (
                    <Text color="red.500" fontSize="xs" mt={1}>{errors.email}</Text>
                  )}
                </Box>

                {/* Location Fields */}
                <Box>
                  <Text as="label" fontWeight="medium" fontSize="sm" color={"#000"}>
                    Location
                  </Text>
                  <VStack align="stretch" mt={1} gap={4}>
                    {[
                      ["buildingNumber", "Enter Building Number"],
                      ["floorDetails", "Enter Floor Details"],
                      ["streetDetails", "Enter Street Details"],
                      ["locality", "Locality"],
                      ["city", "City"],
                      ["state", "State"],
                    ].map(([field, placeholder]) => (
                      <Input
                        key={field}
                        value={form[field as keyof EditCompanyForm]}
                        onChange={handleGenericChange(field as keyof EditCompanyForm)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        bg="white"
                        color="#000"
                        _placeholder={{ color: "gray.500", fontSize: "sm" }}
                        borderColor="gray.200"
                        borderWidth="2px"
                        borderRadius="lg"
                        _focus={{ 
                          borderColor: "#8A38F5",
                          boxShadow: "0 0 0 1px #8A38F5"
                        }}
                        _active={{ borderColor: "#8A38F5" }}
                        _hover={{ borderColor: "#8A38F5" }}
                        transition="all 0.2s ease-in-out"
                      />
                    ))}
                    
                    {/* Pin Code with special validation */}
                    <Input
                      value={form.pinCode}
                      onChange={handlePinCodeChange}
                      placeholder="Pin Code"
                      aria-label="Pin Code"
                      bg="white"
                      color="#000"
                      _placeholder={{ color: "gray.500", fontSize: "sm" }}
                      borderColor="gray.200"
                      borderWidth="2px"
                      borderRadius="lg"
                      _focus={{ 
                        borderColor: "#8A38F5",
                        boxShadow: "0 0 0 1px #8A38F5"
                      }}
                      _active={{ borderColor: "#8A38F5" }}
                      _hover={{ borderColor: "#8A38F5" }}
                      maxLength={6}
                      transition="all 0.2s ease-in-out"
                    />
                  </VStack>
                </Box>
              </VStack>
            </Box>

            {/* Footer Buttons */}
            <Box
              px={contentPadding}
              pb={contentPadding}
              pt={2}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius={{ base: 0, md: "xl" }}
              borderBottomRightRadius={{ base: 0, md: "xl" }}
              borderTopWidth="1px"
              borderTopColor="gray.200"
              boxShadow={{ base: "none", md: "0 -4px 12px rgba(0, 0, 0, 0.1)" }}
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
                >
                  Save
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default EditCompanyModal;