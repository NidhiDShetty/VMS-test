"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  Box,
  Flex,
  Text,
  IconButton,
  Heading,
  Button,
  Input,
  HStack,
  RadioGroup,
  Select,
  createListCollection,
  Portal,
  VStack,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FRONTEND_URL } from "@/lib/server-urls";
import Logo from "@/components/svgs/logo";
import { useUserData } from "@/lib/hooks/useUserData";
import { getProfileData } from "@/app/api/profile/routes";

import { useHostVisitor, HostVisitorFormData } from "./HostVisitorContext";

import DesktopHeader from "@/components/DesktopHeader";
const genderOptions = createListCollection({
  items: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ],
});

const purposeOptions = createListCollection({
  items: [
    { label: "Meeting", value: "Meeting" },
    { label: "Interview", value: "Interview" },
    { label: "Delivery", value: "Delivery" },
    { label: "Maintenance", value: "Maintenance" },
    { label: "Admission", value: "Admission" },
    { label: "Other", value: "Other" },
  ],
});

// Custom Date Input Component
const CustomDateInput: React.FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  min?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}> = ({ value, onChange, placeholder, min, required, disabled, hasError }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      }
    }
  };

  // Format date from YYYY-MM-DD to DD-MM-YYYY
  const formatDisplayDate = (dateString: string): string => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}-${month}-${year}`;
  };

  return (
    <Box
      position="relative"
      h="40px"
      borderRadius="4px"
      border="1px solid"
      borderColor={hasError ? "red.500" : "gray.200"}
      bg="white"
      pl={3}
      pr={3}
      fontSize="sm"
      color={value ? "black" : "gray.500"}
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      w="100%"
      tabIndex={0}
      aria-label={placeholder}
      onClick={handleBoxClick}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      _focus={{ borderColor: hasError ? "red.500" : "#8A38F5" }}
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        min={min}
        required={required}
        disabled={disabled}
        aria-label={placeholder}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.01,
          zIndex: 2,
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      />
      <Text
        as="span"
        color={value ? "black" : "gray.500"}
        fontSize="sm"
        truncate
        zIndex={1}
      >
        {value ? formatDisplayDate(value) : placeholder}
      </Text>
      <Box
        position="absolute"
        right={3}
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        pointerEvents="none"
      >
        <Image
          src={`${FRONTEND_URL}/calendar.svg`}
          width={14}
          height={14}
          alt="calendar"
        />
      </Box>
    </Box>
  );
};

// Custom Time Input Component
const CustomTimeInput: React.FC<{
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  min?: string;
  required?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}> = ({ value, onChange, placeholder, min, required, disabled, hasError }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
      if (typeof inputRef.current.showPicker === "function") {
        inputRef.current.showPicker();
      }
    }
  };

  return (
    <Box
      position="relative"
      h="40px"
      borderRadius="4px"
      border="1px solid"
      borderColor={hasError ? "red.500" : "gray.200"}
      bg="white"
      pl={3}
      pr={3}
      fontSize="sm"
      color={value ? "black" : "gray.500"}
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      w="100%"
      tabIndex={0}
      aria-label={placeholder}
      onClick={handleBoxClick}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
      _focus={{ borderColor: hasError ? "red.500" : "#8A38F5" }}
    >
      <input
        ref={inputRef}
        type="time"
        value={value}
        onChange={onChange}
        min={min}
        required={required}
        disabled={disabled}
        aria-label={placeholder}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.01,
          zIndex: 2,
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      />
      <Text
        as="span"
        color={value ? "black" : "gray.500"}
        fontSize="sm"
        truncate
        zIndex={1}
      >
        {value ? value : placeholder}
      </Text>
      <Box
        position="absolute"
        right={3}
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        pointerEvents="none"
      >
        <Image
          src={`${FRONTEND_URL}/time.svg`}
          width={14}
          height={14}
          alt="time"
        />
      </Box>
    </Box>
  );
};

const comingFromOptions = ["company", "location"];

const AddVisitorPage: React.FC = () => {
  const { setHostVisitorData } = useHostVisitor();
  const { userData, loading: userLoading } = useUserData();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "",
    date: "",
    time: "",
    purpose: "",
    comingFrom: "company",
    companyName: "",
    location: "",
  });
  const [errors, setErrors] = useState<{
    fullName?: string;
    phone?: string;
    date?: string;
    time?: string;
    purpose?: string;
    companyName?: string;
  }>({
    fullName: undefined,
    phone: undefined,
    date: undefined,
    time: undefined,
    purpose: undefined,
    companyName: undefined,
  });
  const [hostDetails, setHostDetails] = useState({
    userId: 0,
    email: "",
    name: "",
    phoneNumber: "",
    profileImageUrl: null as string | null,
  });

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get host details from user data and profile
  useEffect(() => {
    if (userLoading) return; // Wait for user data to load

    if (!userData) {
      console.error("[HostVisitor] No user data available");
      setError("No user data available");
      return;
    }

    // Fetch complete profile data to get name and phoneNumber
    const fetchHostProfile = async () => {
      try {
        const profileData = await getProfileData();

        // Set complete host details with profile data
        const completeHostDetails = {
          userId: userData.userId || 0,
          email: userData.email || profileData.profile.email || "",
          name: profileData.profile.name || "",
          phoneNumber: profileData.profile.phoneNumber || "",
          profileImageUrl: profileData.profile.profileImageUrl || null,
        };

        setHostDetails(completeHostDetails);
      } catch (error) {
        console.error("[HostVisitor] Error fetching profile data:", error);
        // Fallback to basic details without profile
        const basicHostDetails = {
          userId: userData.userId || 0,
          email: userData.email || "",
          name: "",
          phoneNumber: "",
          profileImageUrl: null,
        };
        setHostDetails(basicHostDetails);
      }
    };

    fetchHostProfile();
  }, [userData, userLoading]);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Get current time in HH:MM format
  const getCurrentTime = (): string => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  // Phone number validation - COMMENTED OUT
  // const handlePhoneNumberChange = (value: string): void => {
  //   // Remove non-digit characters
  //   const digitsOnly = value.replace(/\D/g, "");

  //   // Limit to 10 digits
  //   const limitedDigits = digitsOnly.slice(0, 10);

  //   // Update the value
  //   setForm((prev) => ({ ...prev, phone: limitedDigits }));

  //   // Clear validation error if valid
  //   if (limitedDigits.length === 10) {
  //     setErrors((prev) => ({ ...prev, phone: undefined }));
  //   } else if (limitedDigits.length > 0) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       phone: "Phone number must be exactly 10 digits",
  //     }));
  //   } else {
  //     setErrors((prev) => ({ ...prev, phone: undefined }));
  //   }
  // };

  // Phone number change - only allow digits and validate length
  const handlePhoneNumberChange = (value: string): void => {
    // Filter out non-digit characters
    const filteredValue = value.replace(/\D/g, "");

    // Limit to 10 digits maximum
    const limitedValue = filteredValue.slice(0, 10);
    setForm((prev) => ({ ...prev, phone: limitedValue }));

    // Validate phone number length
    if (!limitedValue.trim()) {
      // Show error if phone number is empty
      setErrors((prev) => ({
        ...prev,
        phone: "Phone number is required",
      }));
    } else if (limitedValue.length < 10) {
      // Show error if phone number is less than 10 digits
      setErrors((prev) => ({
        ...prev,
        phone: "Enter valid phone number (10 digits required)",
      }));
    } else {
      // Clear validation error if input is valid (exactly 10 digits)
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  // Date validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const today = getTodayDate();

    // Allow clearing the date (empty value)
    if (value === "") {
      setForm((prev) => ({ ...prev, date: value }));
      setErrors((prev) => ({ ...prev, date: undefined }));
      return;
    }

    if (value < today) {
      setErrors((prev) => ({
        ...prev,
        date: "Cannot select past dates",
      }));
      return;
    }

    setForm((prev) => ({ ...prev, date: value }));
    setErrors((prev) => ({ ...prev, date: undefined }));

    // If time is set and date is today, validate time
    if (form.time && value === today) {
      validateTimeForDate(form.time, value);
    }
  };

  // Time validation
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, time: value }));

    if (value) {
      setErrors((prev) => ({ ...prev, time: undefined }));
    }
    if (form.date) {
      validateTimeForDate(value, form.date);
    } else {
      setErrors((prev) => ({ ...prev, time: undefined }));
    }
  };

  // Validate time based on selected date
  const validateTimeForDate = (time: string, date: string): void => {
    const today = getTodayDate();
    const currentTime = getCurrentTime();

    if (date === today && time < currentTime) {
      setErrors((prev) => ({
        ...prev,
        time: "Time must be current time or later for today",
      }));
    } else {
      setErrors((prev) => ({ ...prev, time: undefined }));
    }
  };

  // Full name validation - COMMENTED OUT
  // const handleFullNameChange = (value: string): void => {
  //   const cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
  //   setForm((prev) => ({ ...prev, fullName: cleanValue }));
  //   if (value !== cleanValue) {
  //     setErrors((prev) => ({
  //       ...prev,
  //       fullName: "Enter only letters and spaces",
  //     }));
  //   } else if (cleanValue.trim()) {
  //     setErrors((prev) => ({ ...prev, fullName: undefined }));
  //   }
  // };

  // Full name change - only allow letters and spaces
  const handleFullNameChange = (value: string): void => {
    // Filter out special characters, only allow letters and spaces
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
    setForm((prev) => ({ ...prev, fullName: filteredValue }));

    // Show error if special characters were typed
    if (value !== filteredValue) {
      setErrors((prev) => ({
        ...prev,
        // fullName: "Special characters are not allowed. Only letters and spaces are permitted."
      }));
    } else if (filteredValue.trim()) {
      // Clear error if input is valid
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  // Company name change - only allow letters, spaces, and common punctuation
  const handleCompanyNameChange = (value: string): void => {
    // Allow letters, spaces, dots, commas, and hyphens for company names
    const filteredValue = value.replace(/[^a-zA-Z\s.,-]/g, "");
    setForm((prev) => ({ ...prev, companyName: filteredValue }));

    // Clear validation error if input is valid
    if (filteredValue.trim()) {
      setErrors((prev) => ({ ...prev, companyName: undefined }));
    } else {
      // Show error if company name is empty
      setErrors((prev) => ({
        ...prev,
        companyName: "Company name is required",
      }));
    }
  };

  // Purpose change - validate required field
  const handlePurposeChange = (value: string): void => {
    setForm((prev) => ({ ...prev, purpose: value }));

    // Clear validation error if purpose is selected
    if (value && value.trim()) {
      setErrors((prev) => ({ ...prev, purpose: undefined }));
    } else {
      // Show error if purpose is not selected
      setErrors((prev) => ({
        ...prev,
        purpose: "Purpose is required",
      }));
    }
  };

  const handlePreview = () => {
    // Validate required fields
    const newErrors: typeof errors = {
      fullName: undefined,
      phone: undefined,
      date: undefined,
      time: undefined,
      purpose: undefined,
      companyName: undefined,
    };

    let hasError = false;

    // Validate full name
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      hasError = true;
    } else if (!/^[a-zA-Z\s]+$/.test(form.fullName)) {
      // Special characters validation (same as StepOne.tsx)
    }

    // Validate phone number
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
      hasError = true;
    } else if (form.phone.length < 10) {
      newErrors.phone = "Enter valid phone number (10 digits required)";
      hasError = true;
    } else if (form.phone.length > 10) {
      newErrors.phone = "Phone number cannot exceed 10 digits";
      hasError = true;
    }

    // Validate company name (if comingFrom is company)
    if (form.comingFrom === "company" && !form.companyName.trim()) {
      newErrors.companyName = "Company name is required";
      hasError = true;
    }

    // Validate purpose
    if (!form.purpose.trim()) {
      newErrors.purpose = "Purpose is required";
      hasError = true;
    }

    // Validate date
    if (!form.date) {
      newErrors.date = "Date is required";
      hasError = true;
    }

    // Validate time
    if (!form.time) {
      newErrors.time = "Time is required";
      hasError = true;
    }

    // Set errors and return if validation fails
    setErrors(newErrors);
    if (hasError) {
      return;
    }

    // Save form data to context for preview
    const previewData: HostVisitorFormData = {
      ...form,
      status: "APPROVED",
      hostDetails: hostDetails,
    };
    setHostVisitorData(previewData);

    router.push("/host-visitor/preview");
  };

  // Set min date and time attributes
  const minDate = getTodayDate();
  const minTime = form.date === getTodayDate() ? getCurrentTime() : "00:00";

  // Responsive Layout - Mobile and Web
  return (
    <Box className="min-h-screen bg-white flex flex-col">
      {/* Mobile Header */}
      <Flex
        as="header"
        align="center"
        justify="center"
        w="full"
        h="70px"
        bg="#f4edfefa"
        borderBottom="1px solid #f2f2f2"
        position="relative"
        px={0}
        display={{ base: "flex", md: "none" }}
      >
        <Box
          position="absolute"
          left={2}
          top="50%"
          transform="translateY(-50%)"
          as="button"
          tabIndex={0}
          aria-label="Go back"
          display="flex"
          alignItems="center"
          justifyContent="center"
          w="24px"
          h="24px"
          borderRadius="full"
          bg="transparent"
          _hover={{ bg: 'gray.100' }}
          p={0}
          cursor="pointer"
          onClick={() => router.push("/dashboard")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/dashboard");
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">Add Visitor Details</Text>
      </Flex>

      {/* Web Header */}
      <Box display={{ base: "none", md: "block" }}>
        <DesktopHeader notificationCount={3} />
      </Box>

      {/* Web Navigation Bar */}
      <Flex
        display={{ base: "none", md: "flex" }}
        align="center"
        justify="space-between"
        w="full"
        h="60px"
        bg="#f4edfefa"
        px={6}
        py={4}
        position="fixed"
        top="70px"
        left={0}
        right={0}
        zIndex={999}
      >
        <Flex align="center" gap={3}>
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={() => router.push("/dashboard")}
            color="#8A37F7"
            _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
          >
            <FiChevronLeft />
          </IconButton>
          <Text fontSize="lg" fontWeight="bold" color="#18181b">
            Add Visitor Details
          </Text>
        </Flex>
      </Flex>

      {/* Mobile Layout - Single Column */}
      <Box
        display={{ base: "block", md: "none" }}
        flex={1}
        px={4}
        pt={1}
        pb="60px"
      >
        <Flex align="center" justify="space-between" mb={0}>
          <Heading
            as="h2"
            size="xs"
            color="#1e1e1e"
            fontWeight="bold"
            fontSize="lg"
            py="8px"
          >
            Add Visitor Details
          </Heading>
          <Box
            bg="#f3edfd"
            borderRadius="md"
            p={0.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <IconButton
              aria-label="Voice input"
              tabIndex={0}
              variant="ghost"
              fontSize="md"
              color="#9747ff"
              bg="transparent"
              _hover={{ bg: "transparent" }}
              _active={{ bg: "transparent" }}
              minW="unset"
              h="auto"
              p={0}
            >
              {/* <FiMic style={{ fontSize: 18 }} /> */}
            </IconButton>
          </Box>
        </Flex>
        <Text className="text-gray-400 text-xs px-1" mb='12px' fontSize="sm">
          Please provide all the information
        </Text>

        {/* Mobile Form Content */}
        {/* Full Name */}
        <Box className="mb-3" px={1} mt={0}>
          <Text as="label" fontWeight="medium" fontSize="md" color="#000000">
            Visitor Full Name{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Box mt={1}>
            <Input
              id="fullName-mobile"
              value={form.fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="Enter Full name"
              autoComplete="off"
              h="40px"
              fontSize="sm"
              borderRadius="4px"
              border="1px solid #dce0e6"
              bg="white"
              color="black"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: "#8A38F5",
                bg: "white",
              }}
              _active={{ bg: "white" }}
              tabIndex={0}
              aria-label="Visitor Full Name"
              required
            />
          </Box>
          {errors.fullName && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.fullName}
            </Text>
          )}
        </Box>

        {/* Phone Number */}
        <Box mb={3} px={1} mt={2}>
          <Text as="label" fontWeight="medium" fontSize="md" color="#000000">
            Phone Number{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Box mt={1}>
            <Input
              id="phoneNumber-mobile"
              type="tel"
              value={form.phone}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="Enter 10 digit number"
              h="40px"
              fontSize="sm"
              borderRadius="4px"
              border="1px solid #dce0e6"
              bg="white"
              color="black"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: "#8A38F5",
                bg: "white",
              }}
              _active={{ bg: "white" }}
              tabIndex={0}
              aria-label="Phone Number"
              required
            />
          </Box>
          {errors.phone && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.phone}
            </Text>
          )}
        </Box>

        {/* Gender */}
        <Box mb={3} px={1}>
          <Text as="label" fontWeight="medium" color="#000000">
            Gender
          </Text>
          <Select.Root
            mt={1}
            value={[form.gender]}
            onValueChange={(val) =>
              setForm((prev) => ({ ...prev, gender: val.value[0] ?? "" }))
            }
            collection={genderOptions}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="4px"
                height="40px"
                _focus={{ borderColor: "#8A38F5" }}
                _active={{ borderColor: "#8A38F5" }}
              >
                <Select.ValueText
                  placeholder="Select Gender"
                  color={form.gender ? "#000" : "gray.500"}
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="4px"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                >
                  {genderOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Text color="#000">{item.label}</Text>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Box>

        {/* Date & Time */}
        <Flex gap={2} mb={3} px={1}>
          {/* Date Field */}
          <Box flex={1}>
            <Text as="label" fontWeight="medium" color="#000000">
              Date{" "}
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Box mt={1}>
              <CustomDateInput
                value={form.date}
                onChange={handleDateChange}
                placeholder="Select Date"
                min={minDate}
                hasError={!!errors.date}
              />
            </Box>
            {errors.date && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.date}
              </Text>
            )}
          </Box>
          {/* Time Field */}
          <Box flex={1}>
            <Text as="label" fontWeight="medium" color="#000000">
              Time{" "}
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Box mt={1}>
              <CustomTimeInput
                value={form.time}
                onChange={handleTimeChange}
                placeholder="Select Time"
                min={minTime}
                hasError={!!errors.time}
              />
            </Box>
            {errors.time && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {errors.time}
              </Text>
            )}
          </Box>
        </Flex>

        {/* Purpose of Visit */}
        <Box mb={3} px={1}>
          <Text as="label" fontWeight="medium" color="#000000">
            Purpose of Visit{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Select.Root
            mt={1}
            value={[form.purpose]}
            onValueChange={(val) => handlePurposeChange(val.value[0] ?? "")}
            collection={purposeOptions}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="white"
                border="1px solid"
                borderRadius="4px"
                height="40px"
                _focus={{ borderColor: "#8A38F5" }}
                _active={{ borderColor: "#8A38F5" }}
                borderColor="gray.200"
              >
                <Select.ValueText
                  placeholder="Select Purpose"
                  color={form.purpose ? "#000" : "gray.500"}
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="4px"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                >
                  {purposeOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Text color="#000">{item.label}</Text>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          {errors.purpose && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.purpose}
            </Text>
          )}
        </Box>

        {/* Coming From */}
        <Box mb={3} px={1}>
          <Text fontWeight="medium" color="#000000" mb={1}>
            Coming From?
          </Text>
          <RadioGroup.Root
            name="comingFrom"
            value={form.comingFrom}
            onValueChange={(e) =>
              setForm((prev) => ({
                ...prev,
                comingFrom: e?.value ?? "company",
              }))
            }
          >
            <HStack gap={4} mt={2}>
              {comingFromOptions.map((option) => (
                <RadioGroup.Item key={option} value={option}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator
                    boxSize="24px"
                    borderRadius="full"
                    borderWidth="2px"
                    borderColor={
                      form.comingFrom === option ? "#8A38F5" : "gray.300"
                    }
                    bg={form.comingFrom === option ? "#8A38F5" : "white"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.2s"
                  >
                    {form.comingFrom === option && (
                      <Box boxSize="8px" borderRadius="full" bg="white" />
                    )}
                  </RadioGroup.ItemIndicator>
                  <RadioGroup.ItemText color="#18181B" ml={2}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </HStack>
          </RadioGroup.Root>
        </Box>

        {/* Company Name (if comingFrom is company) */}
        {form.comingFrom === "company" && (
          <Box mb={3} px={1}>
            <Text as="label" fontWeight="medium" color="#000000">
              Company Name{" "}
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Box mt={1}>
              <Input
                id="companyName-mobile"
                value={form.companyName}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="Enter Company Name"
                h="40px"
                fontSize="sm"
                borderRadius="4px"
                border="1px solid #dce0e6"
                bg="white"
                color="black"
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: "#8A38F5",
                  bg: "white",
                }}
                _active={{ bg: "white" }}
                tabIndex={0}
                aria-label="Company Name"
                required
              />
            </Box>
          </Box>
        )}

        {/* Location (if comingFrom is location) */}
        {form.comingFrom === "location" && (
          <Box mb={3} px={1}>
            <Text as="label" fontWeight="medium" color="#000000">
              Location
            </Text>
            <Box mt={1}>
              <Input
                id="location-mobile"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Enter your Location"
                h="40px"
                fontSize="sm"
                borderRadius="4px"
                border="1px solid #dce0e6"
                bg="white"
                color="black"
                _placeholder={{ color: "gray.500" }}
                _focus={{ borderColor: "#8A38F5", bg: "white" }}
                _active={{ bg: "white" }}
                tabIndex={0}
                aria-label="Location"
              />
            </Box>
          </Box>
        )}
      </Box>

      {/* Web Layout - Two Column Grid with Background */}
      <Box
        position="relative"
        bg="#F0E6FF"
        flex={1}
        display={{ base: "none", md: "block" }}
        pt="40px"
        pb="120px"
      >
        {/* Background Logo */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.15}
          zIndex={1}
        >
          <Box transform="scale(4.5)">
            <Logo />
          </Box>
        </Box>

        {/* Form Content */}
        <Box position="relative" zIndex={2} p={8}>
          <Grid templateColumns="49% 49%" gap={8} w="full" ml={0}>
            {/* Left Column */}
            <GridItem>
              <VStack align="stretch" gap={4}>
                {/* Full Name */}
                <Box>
                  <Text
                    as="label"
                    fontWeight="medium"
                    fontSize="md"
                    color="#000000"
                  >
                    Visitor Full Name{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Box mt={1}>
                    <Input
                      id="fullName-web"
                      value={form.fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="Enter Full name"
                      autoComplete="off"
                      bg="white"
                      color="#000"
                      border="1px solid"
                      borderColor={errors.fullName ? "red.500" : "gray.200"}
                      borderRadius="4px"
                      height="32px"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: errors.fullName ? "red.500" : "#8A38F5",
                        bg: "white",
                      }}
                      _active={{ bg: "white" }}
                      required
                    />
                  </Box>
                  {errors.fullName && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.fullName}
                    </Text>
                  )}
                </Box>

                {/* Phone Number */}
                <Box>
                  <Text
                    as="label"
                    fontWeight="medium"
                    fontSize="md"
                    color="#000000"
                  >
                    Phone Number{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Box mt={1}>
                    <Input
                      id="phoneNumber-web"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      placeholder="Enter 10 digit number"
                      bg="white"
                      color="#000"
                      border="1px solid"
                      borderColor={errors.phone ? "red.500" : "gray.200"}
                      borderRadius="4px"
                      height="32px"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: errors.phone ? "red.500" : "#8A38F5",
                        bg: "white",
                      }}
                      _active={{ bg: "white" }}
                      required
                    />
                  </Box>
                  {errors.phone && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {errors.phone}
                    </Text>
                  )}
                </Box>

                {/* Gender */}
                <Box>
                  <Text as="label" fontWeight="medium" color="#000000">
                    Gender
                  </Text>
                  <Select.Root
                    mt={1}
                    value={[form.gender]}
                    onValueChange={(val) =>
                      setForm((prev) => ({
                        ...prev,
                        gender: val.value[0] ?? "",
                      }))
                    }
                    collection={genderOptions}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="4px"
                        height="32px"
                        _focus={{ borderColor: "#8A38F5" }}
                        _active={{ borderColor: "#8A38F5" }}
                      >
                        <Select.ValueText
                          placeholder="Select Gender"
                          color={form.gender ? "#000" : "gray.500"}
                        />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="4px"
                          boxShadow="lg"
                          maxH="200px"
                          overflowY="auto"
                        >
                          {genderOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Text color="#000">{item.label}</Text>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Box>

                {/* Date and Time */}
                <Flex gap={2}>
                  <Box flex={1}>
                    <Text as="label" fontWeight="medium" color="#000000">
                      Date{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box mt={1}>
                      <CustomDateInput
                        value={form.date}
                        onChange={handleDateChange}
                        placeholder="Select Date"
                        min={minDate}
                        hasError={!!errors.date}
                      />
                    </Box>
                    {errors.date && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.date}
                      </Text>
                    )}
                  </Box>
                  <Box flex={1}>
                    <Text as="label" fontWeight="medium" color="#000000">
                      Time{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box mt={1}>
                      <CustomTimeInput
                        value={form.time}
                        onChange={handleTimeChange}
                        placeholder="Select Time"
                        min={minTime}
                        hasError={!!errors.time}
                      />
                    </Box>
                    {errors.time && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.time}
                      </Text>
                    )}
                  </Box>
                </Flex>
              </VStack>
            </GridItem>

            {/* Right Column */}
            <GridItem>
              <VStack align="stretch" gap={4}>
                {/* Coming From */}
                <Box>
                  <Text fontWeight="medium" color="#000000" mb={1}>
                    Coming From?
                  </Text>
                  <RadioGroup.Root
                    name="comingFrom"
                    value={form.comingFrom}
                    onValueChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        comingFrom: e?.value ?? "company",
                      }))
                    }
                  >
                    <HStack gap={6} mt={2}>
                      {comingFromOptions.map((option) => (
                        <RadioGroup.Item key={option} value={option}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator
                            boxSize="20px"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              form.comingFrom === option
                                ? "#8A38F5"
                                : "gray.300"
                            }
                            bg={
                              form.comingFrom === option ? "#8A38F5" : "white"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s"
                          >
                            {form.comingFrom === option && (
                              <Box
                                boxSize="8px"
                                borderRadius="full"
                                bg="white"
                              />
                            )}
                          </RadioGroup.ItemIndicator>
                          <RadioGroup.ItemText color="#18181B" ml={2}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </HStack>
                  </RadioGroup.Root>
                </Box>

                {/* Purpose of Visit */}
                <Box>
                  <Text as="label" fontWeight="medium" color="#000000">
                    Purpose of Visit{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Select.Root
                    mt={1}
                    value={[form.purpose]}
                    onValueChange={(val) =>
                      handlePurposeChange(val.value[0] ?? "")
                    }
                    collection={purposeOptions}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger
                        bg="white"
                        border="1px solid"
                        borderRadius="4px"
                        height="32px"
                        _focus={{ borderColor: "#8A38F5" }}
                        _active={{ borderColor: "#8A38F5" }}
                        borderColor="gray.200"
                      >
                        <Select.ValueText
                          placeholder="Select Purpose"
                          color={form.purpose ? "#000" : "gray.500"}
                        />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="4px"
                          boxShadow="lg"
                          maxH="200px"
                          overflowY="auto"
                        >
                          {purposeOptions.items.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Text color="#000">{item.label}</Text>
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Box>

                {/* Company Name (if comingFrom is company) */}
                {form.comingFrom === "company" && (
                  <Box>
                    <Text as="label" fontWeight="medium" color="#000000">
                      Company Name{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box mt={1}>
                      <Input
                        id="companyName-web"
                        value={form.companyName}
                        onChange={(e) =>
                          handleCompanyNameChange(e.target.value)
                        }
                        placeholder="Enter Company Name"
                        bg="white"
                        color="#000"
                        border="1px solid"
                        borderColor={
                          errors.companyName ? "red.500" : "gray.200"
                        }
                        borderRadius="4px"
                        height="32px"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{
                          borderColor: errors.companyName
                            ? "red.500"
                            : "#8A38F5",
                          bg: "white",
                        }}
                        _active={{ bg: "white" }}
                        required
                      />
                    </Box>
                    {errors.companyName && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.companyName}
                      </Text>
                    )}
                  </Box>
                )}

                {/* Location (if comingFrom is location) */}
                {form.comingFrom === "location" && (
                  <Box>
                    <Text as="label" fontWeight="medium" color="#000000">
                      Location
                    </Text>
                    <Box mt={1}>
                      <Input
                        id="location-web"
                        value={form.location}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="Enter your Location"
                        bg="white"
                        color="#000"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="4px"
                        height="32px"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{ borderColor: "#8A38F5", bg: "white" }}
                        _active={{ bg: "white" }}
                      />
                    </Box>
                    {errors.companyName && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.companyName}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </GridItem>
          </Grid>

          {/* Preview Button - Fixed at Bottom for Web */}
          <Box
            position="fixed"
            left={0}
            bottom={0}
            w="full"
            bgGradient="linear(to-t, #fff 80%, transparent)"
            zIndex={20}
            py={4}
            display={{ base: "none", md: "block" }}
          >
            <Flex justify="center" maxW="1200px" mx="auto" px={6}>
              <Button
                size="xl"
                fontSize="lg"
                py={4}
                px={12}
                borderRadius="lg"
                bg="#8A38F5"
                color="white"
                _hover={{ bg: "#7A2FE5" }}
                onClick={handlePreview}
                aria-label="Preview visitor details"
                tabIndex={0}
                fontWeight="600"
                minW="400px"
              >
                Preview
              </Button>
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* Mobile Preview Button - Fixed at Bottom */}
      <Box bg='#FFFFFF'
        position="fixed"
        left={0}
        bottom={0}
        w="full"
        bgGradient="linear(to-t, #fff 80%, transparent)"
        zIndex={20}
        py={4}
        display={{ base: "block", md: "none" }}
      >
        <Box w="full" maxW="520px" mx="auto" px={4}>
          <Button
            size="sm"
            fontSize="sm"
            py={2}
            borderRadius="md"
            bg="#9747ff"
            color="white"
            width="100%"
            _hover={{ bg: "#7a2ee6" }}
            onClick={handlePreview}
            aria-label="Preview visitor details"
            tabIndex={0}
          >
            Preview
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Box px={4} pb={2}>
          <Text color="red.500" fontSize="sm" textAlign="center">
            {error}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default AddVisitorPage;
