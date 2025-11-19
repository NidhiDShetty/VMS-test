"use client";

import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  ChangeEvent,
  useEffect,
} from "react";
import {
  Box,
  VStack,
  Flex,
  Text,
  RadioGroup,
  HStack,
  Input,
  Select,
  createListCollection,
  Portal,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { VisitorFormData } from "@/app/api/visitor/routes";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import VisitorImageUpload, {
  VisitorImageUploadRef,
} from "./VisitorImageUpload";
import { FRONTEND_URL } from "@/lib/server-urls";

type StepOneProps = {
  visitorFormData: VisitorFormData;
  onChange: (field: keyof VisitorFormData, value: unknown) => void;
  loading: boolean;
  error: string | null;
};

type ValidationErrors = {
  phoneNumber?: string;
  date?: string;
  time?: string;
  fullName?: string;
  companyName?: string;
  location?: string;
  purposeOfVisit?: string;
  idNumber?: string;
};

const genderOptions = createListCollection({
  items: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ],
});

const idTypeOptions = createListCollection({
  items: [
    { label: "Aadhaar", value: "Aadhaar" },
    { label: "PAN", value: "PAN" },
    { label: "Passport", value: "Passport" },
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
        onFocus={(e) => {
          // Force the date picker to open above if near bottom of screen
          const rect = e.target.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;

          if (spaceBelow < 300 && spaceAbove > 300) {
            // If there's more space above and less below, try to position above
            e.target.style.position = "fixed";
            e.target.style.top = `${rect.top - 300}px`;
            e.target.style.left = `${rect.left}px`;
            e.target.style.width = `${rect.width}px`;
            e.target.style.height = `${rect.height}px`;
            e.target.style.zIndex = "9999";
          }
        }}
        onBlur={(e) => {
          // Reset positioning after blur
          e.target.style.position = "absolute";
          e.target.style.top = "0";
          e.target.style.left = "0";
          e.target.style.width = "100%";
          e.target.style.height = "100%";
          e.target.style.zIndex = "2";
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
        onFocus={(e) => {
          // Force the time picker to open above if near bottom of screen
          const rect = e.target.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;

          if (spaceBelow < 300 && spaceAbove > 300) {
            // If there's more space above and less below, try to position above
            e.target.style.position = "fixed";
            e.target.style.top = `${rect.top - 300}px`;
            e.target.style.left = `${rect.left}px`;
            e.target.style.width = `${rect.width}px`;
            e.target.style.height = `${rect.height}px`;
            e.target.style.zIndex = "9999";
          }
        }}
        onBlur={(e) => {
          // Reset positioning after blur
          e.target.style.position = "absolute";
          e.target.style.top = "0";
          e.target.style.left = "0";
          e.target.style.width = "100%";
          e.target.style.height = "100%";
          e.target.style.zIndex = "2";
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

const StepOne = forwardRef<
  { validateFields: () => boolean; resetImage: () => void },
  StepOneProps
>(({ visitorFormData, onChange, loading, error }, ref) => {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const imageUploadRef = useRef<VisitorImageUploadRef>(null);

  // Reset image function
  const resetImage = () => {
    imageUploadRef.current?.reset();
  };

  // Format malformed date/time values
  const formatMalformedDate = (dateString: string): string => {
    if (!dateString) return "";

    try {
      // Handle malformed ISO strings like "11T00:00:00.000Z-10-2025"
      if (dateString.includes("T") && dateString.includes("Z")) {
        const match = dateString.match(/(\d+)T.*?(\d+)-(\d+)-(\d+)/);
        if (match) {
          const [, day, , month, year] = match;
          const date = new Date(`${year}-${month}-${day}`);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        }
      }

      // Handle other malformed formats
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split("T")[0];
      }

      return "";
    } catch (error) {
      console.error("Error formatting malformed date:", error);
      return "";
    }
  };

  const formatMalformedTime = (timeString: string): string => {
    if (!timeString) return "";

    try {
      // Handle malformed ISO strings like "1970-01-01T13:51:12.000Z"
      if (timeString.includes("T") && timeString.includes("Z")) {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
          return date.toTimeString().slice(0, 5);
        }
      }

      return "";
    } catch (error) {
      console.error("Error formatting malformed time:", error);
      return "";
    }
  };

  // Format visitor data when it changes
  React.useEffect(() => {
    if (visitorFormData.date && visitorFormData.date.includes("T")) {
      const formattedDate = formatMalformedDate(visitorFormData.date);
      if (formattedDate && formattedDate !== visitorFormData.date) {
        onChange("date", formattedDate);
      }
    }

    if (visitorFormData.time && visitorFormData.time.includes("T")) {
      const formattedTime = formatMalformedTime(visitorFormData.time);
      if (formattedTime && formattedTime !== visitorFormData.time) {
        onChange("time", formattedTime);
      }
    }
  }, [visitorFormData.date, visitorFormData.time, onChange]);

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
  //   const digitsOnly = value.replace(/\D/g, '');

  //   // Limit to 10 digits
  //   const limitedDigits = digitsOnly.slice(0, 10);

  //   // Update the value
  //   onChange("phoneNumber", limitedDigits);

  //   // Clear validation error if valid
  //   if (limitedDigits.length === 10) {
  //     setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
  //   } else if (limitedDigits.length > 0) {
  //     setValidationErrors(prev => ({
  //       ...prev,
  //       phoneNumber: "Phone number must be exactly 10 digits"
  //     }));
  //   } else {
  //     setValidationErrors(prev => ({ ...prev, phoneNumber: undefined }));
  //   }
  // };

  // Phone number change - only allow digits and validate length
  const handlePhoneNumberChange = (value: string): void => {
    // Filter out non-digit characters
    const filteredValue = value.replace(/\D/g, "");

    // Limit to 10 digits maximum
    const limitedValue = filteredValue.slice(0, 10);
    onChange("phoneNumber", limitedValue);

    // Validate phone number length
    if (!limitedValue.trim()) {
      // Show error if phone number is empty
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: "Phone number is required",
      }));
    } else if (limitedValue.length < 10) {
      // Show error if phone number is less than 10 digits
      setValidationErrors((prev) => ({
        ...prev,
        phoneNumber: "Enter valid phone number (10 digits required)",
      }));
    } else {
      // Clear validation error if input is valid (exactly 10 digits)
      setValidationErrors((prev) => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // Date validation
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const today = getTodayDate();

    // Allow clearing the date (empty value)
    if (value === "") {
      onChange("date", value);
      setValidationErrors((prev) => ({ ...prev, date: undefined }));
      return;
    }

    if (value < today) {
      setValidationErrors((prev) => ({
        ...prev,
        date: "Cannot select past dates",
      }));
      return;
    }

    onChange("date", value);
    setValidationErrors((prev) => ({ ...prev, date: undefined }));

    // If time is set and date is today, validate time
    if (visitorFormData.time && value === today) {
      validateTimeForDate(visitorFormData.time, value);
    }
  };

  // Time validation
  const handleTimeChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    onChange("time", value);

    if (value) {
      setValidationErrors((prev) => ({ ...prev, time: undefined }));
    }
    if (visitorFormData.date) {
      validateTimeForDate(value, visitorFormData.date);
    } else {
      setValidationErrors((prev) => ({ ...prev, time: undefined }));
    }
  };

  // Validate time based on selected date
  const validateTimeForDate = (time: string, date: string): void => {
    const today = getTodayDate();
    const currentTime = getCurrentTime();

    if (date === today && time < currentTime) {
      setValidationErrors((prev) => ({
        ...prev,
        time: "Time must be current time or later for today",
      }));
    } else {
      setValidationErrors((prev) => ({ ...prev, time: undefined }));
    }
  };

  // Full name validation - COMMENTED OUT
  // const handleFullNameChange = (value: string): void => {
  //   const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');
  //   onChange("fullName", cleanValue);
  //   if (value !== cleanValue) {
  //     setValidationErrors(prev => ({ ...prev, fullName: "Enter only letters and spaces" }));
  //   } else if (cleanValue.trim()) {
  //     setValidationErrors(prev => ({ ...prev, fullName: undefined }));
  //   }
  // };

  // Full name change - only allow letters and spaces
  const handleFullNameChange = (value: string): void => {
    // Filter out special characters, only allow letters and spaces
    const filteredValue = value.replace(/[^a-zA-Z\s]/g, "");
    onChange("fullName", filteredValue);

    // Show error if special characters were typed
    if (value !== filteredValue) {
      setValidationErrors((prev) => ({
        ...prev,
        // fullName: "Special characters are not allowed. Only letters and spaces are permitted."
      }));
    } else if (filteredValue.trim()) {
      // Clear error if input is valid
      setValidationErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  // Company name change - only allow letters, spaces, and common punctuation
  const handleCompanyNameChange = (value: string): void => {
    // Allow letters, spaces, dots, commas, and hyphens for company names
    const filteredValue = value.replace(/[^a-zA-Z\s.,-]/g, "");
    onChange("companyName", filteredValue);

    // Clear validation error if input is valid
    if (filteredValue.trim()) {
      setValidationErrors((prev) => ({ ...prev, companyName: undefined }));
    } else {
      // Show error if company name is empty
      setValidationErrors((prev) => ({
        ...prev,
        companyName: "Company name is required",
      }));
    }
  };

  // ID Number change - handle different ID types with specific validation
  const handleIdNumberChange = (value: string): void => {
    let filteredValue = value;

    if (visitorFormData.idType === "Aadhaar") {
      // For Aadhaar: only allow digits, limit to 12 characters
      filteredValue = value.replace(/\D/g, "").slice(0, 12);
    } else if (visitorFormData.idType === "PAN") {
      // For PAN: only allow alphanumeric, limit to 10 characters, convert to uppercase
      filteredValue = value
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 10)
        .toUpperCase();
    } else {
      // For other ID types: allow alphanumeric and common characters
      filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, "");
    }

    onChange("idNumber", filteredValue);

    // Only clear validation errors when user is typing, don't show new errors
    if (filteredValue.trim()) {
      setValidationErrors((prev) => ({ ...prev, idNumber: undefined }));
    }
  };

  // Purpose change - validate required field
  const handlePurposeChange = (value: string): void => {
    onChange("purposeOfVisit", value);

    // Clear validation error if purpose is selected
    if (value && value.trim()) {
      setValidationErrors((prev) => ({ ...prev, purposeOfVisit: undefined }));
    } else {
      // Show error if purpose is not selected
      setValidationErrors((prev) => ({
        ...prev,
        purposeOfVisit: "Purpose is required",
      }));
    }
  };

  // Required field validation on submit - COMMENTED OUT
  // const handleSubmit = (e: React.FormEvent): void => {
  //   e.preventDefault();
  //   const errors: ValidationErrors = {};
  //   if (!visitorFormData.fullName.trim()) {
  //     errors.fullName = "Full name is required";
  //   }
  //   if (!visitorFormData.phoneNumber.trim()) {
  //     errors.phoneNumber = "Phone number is required";
  //   }
  //   if (visitorFormData.comingFrom === "company" && !(visitorFormData.companyName || "").trim()) {
  //     errors.companyName = "Company name is required";
  //   }
  //   if (!visitorFormData.purposeOfVisit.trim()) {
  //     errors.purposeOfVisit = "Purpose is required";
  //   }
  //   setValidationErrors((prev) => ({ ...prev, ...errors }));
  //   if (Object.keys(errors).length > 0) return;
  //   // If no errors, allow form submission (parent handles next step)
  // };

  // Simplified submit handler without validation
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    // No validation - allow form submission
  };

  // Expose validateFields to parent - COMMENTED OUT MOST VALIDATIONS
  useImperativeHandle(ref, () => ({
    validateFields: (): boolean => {
      const errors: ValidationErrors = {};

      // Validate required fields
      if (!visitorFormData.fullName.trim()) {
        errors.fullName = "Full name is required";
      } else if (!/^[a-zA-Z\s]+$/.test(visitorFormData.fullName)) {
        //  errors.fullName = "Special characters are not allowed.";
      }

      if (!visitorFormData.phoneNumber.trim()) {
        errors.phoneNumber = "Phone number is required";
      } else if (visitorFormData.phoneNumber.length < 10) {
        errors.phoneNumber = "Enter valid phone number (10 digits required)";
      } else if (visitorFormData.phoneNumber.length > 10) {
        errors.phoneNumber = "Phone number cannot exceed 10 digits";
      }

      if (
        visitorFormData.comingFrom === "company" &&
        !(visitorFormData.companyName || "").trim()
      ) {
        errors.companyName = "Company name is required";
      }

      if (
        visitorFormData.comingFrom === "location" &&
        !(visitorFormData.location || "").trim()
      ) {
        errors.location = "Location is required";
      }

      if (!visitorFormData.purposeOfVisit.trim()) {
        errors.purposeOfVisit = "Purpose is required";
      }

      if (!visitorFormData.date) {
        errors.date = "Date is required";
      }

      if (!visitorFormData.time) {
        errors.time = "Time is required";
      }

      // ID validation based on type
      if (visitorFormData.idType === "Aadhaar") {
        if (
          !visitorFormData.idNumber ||
          visitorFormData.idNumber.length === 0
        ) {
          // Aadhaar is optional, no error if empty
        } else if (visitorFormData.idNumber.length < 12) {
          errors.idNumber = "Aadhaar number must be exactly 12 digits";
        } else if (!/^\d{12}$/.test(visitorFormData.idNumber)) {
          errors.idNumber = "Aadhaar number must be exactly 12 digits";
        }
      } else if (visitorFormData.idType === "PAN") {
        if (
          !visitorFormData.idNumber ||
          visitorFormData.idNumber.length === 0
        ) {
          // PAN is optional, no error if empty
        } else if (visitorFormData.idNumber.length < 10) {
          errors.idNumber = "PAN must be exactly 10 characters";
        } else if (
          !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(visitorFormData.idNumber)
        ) {
          errors.idNumber = "Invalid PAN number";
        }
      }

      setValidationErrors((prev) => ({ ...prev, ...errors }));
      return Object.keys(errors).length === 0;
    },
    resetImage,
  }));

  // Set min date and time attributes
  const minDate = getTodayDate();
  const minTime =
    visitorFormData.date === getTodayDate() ? getCurrentTime() : "00:00";

  // Handle ID type changes - clear ID number and validation errors when type changes
  useEffect(() => {
    // Clear ID number when type changes to avoid invalid data
    if (visitorFormData.idNumber) {
      const currentValue = visitorFormData.idNumber;
      let shouldClear = false;

      if (visitorFormData.idType === "Aadhaar" && !/^\d*$/.test(currentValue)) {
        shouldClear = true;
      } else if (
        visitorFormData.idType === "PAN" &&
        !/^[A-Z0-9]*$/.test(currentValue)
      ) {
        shouldClear = true;
      }

      if (shouldClear) {
        onChange("idNumber", "");
        setValidationErrors((prev) => ({ ...prev, idNumber: undefined }));
      }
    }
  }, [visitorFormData.idType, onChange, visitorFormData.idNumber]);

  // Reset image when imgUrl becomes empty (for new visitor)
  useEffect(() => {
    if (!visitorFormData.imgUrl) {
      imageUploadRef.current?.reset();
    }
  }, [visitorFormData.imgUrl]);
  return (
    <Box w="full">
      {/* Mobile Layout - Single Column */}
      <VStack
        align="stretch"
        w="full"
        gap={4}
        display={{ base: "flex", lg: "none" }}
        p={4}
      >
        {/* Full Name */}
        <Box>
          <Text as="label" fontWeight="medium" fontSize="md" color="#000000">
            Visitor Full Name{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Box mt={1}>
            <Input
              id="fullName"
              value={visitorFormData.fullName}
              onChange={(e) => handleFullNameChange(e.target.value)}
              placeholder="Enter Full name"
              required
              autoComplete="off"
              disabled={loading}
              bg="white"
              color="#000"
              border="1px solid"
              borderColor={validationErrors.fullName ? "red.500" : "gray.200"}
              borderRadius="4px"
              height="40px"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: validationErrors.fullName ? "red.500" : "#8A38F5",
                bg: "white",
              }}
              _active={{ bg: "white" }}
            />
          </Box>
          {validationErrors.fullName && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {validationErrors.fullName}
            </Text>
          )}
        </Box>
        {/* Phone Number */}
        <Box>
          <Text as="label" fontWeight="medium" fontSize="md" color="#000000">
            Phone Number{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Box mt={1}>
            <Input
              id="phoneNumber"
              type="tel"
              value={visitorFormData.phoneNumber}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              placeholder="Enter 10 digit number"
              required
              disabled={loading}
              bg="white"
              color="#000"
              border="1px solid"
              borderColor={
                validationErrors.phoneNumber ? "red.500" : "gray.200"
              }
              borderRadius="4px"
              height="40px"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: validationErrors.phoneNumber
                  ? "red.500"
                  : "#8A38F5",
                bg: "white",
              }}
              _active={{ bg: "white" }}
            />
          </Box>
          {validationErrors.phoneNumber && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {validationErrors.phoneNumber}
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
            value={[visitorFormData.gender]}
            onValueChange={(val) => onChange("gender", val.value[0] ?? "")}
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
                  color={visitorFormData.gender ? "#000" : "gray.500"}
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
                  borderColor="#dce0e3"
                  borderRadius="lg"
                  boxShadow="0 2px 16px rgba(95,36,172,0.27)"
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
        {/* ID Type */}
        <Box>
          <Text as="label" fontWeight="medium" color="#000000">
            ID Type
          </Text>
          <Select.Root
            mt={1}
            value={[visitorFormData.idType]}
            onValueChange={(val) => onChange("idType", val.value[0] ?? "")}
            collection={idTypeOptions}
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
                  placeholder="Select ID Type"
                  color={visitorFormData.idType ? "#000" : "gray.500"}
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
                  borderColor="#dce0e3"
                  borderRadius="lg"
                  boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                  maxH="200px"
                  overflowY="auto"
                >
                  {idTypeOptions.items.map((item) => (
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
        {/* ID Number */}
        <Box>
          <Text as="label" fontWeight="medium" color="#000000">
            ID Number
          </Text>
          <Box mt={1}>
            <Input
              id="idNumber"
              value={visitorFormData.idNumber}
              onChange={(e) => handleIdNumberChange(e.target.value)}
              placeholder={
                visitorFormData.idType === "Aadhaar"
                  ? "Enter Aadhaar number"
                  : visitorFormData.idType === "PAN"
                  ? "Enter PAN"
                  : "Enter your ID number"
              }
              disabled={loading}
              bg="white"
              color="#000"
              border="1px solid"
              borderColor={validationErrors.idNumber ? "red.500" : "gray.200"}
              borderRadius="4px"
              height="40px"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: validationErrors.idNumber ? "red.500" : "#8A38F5",
                bg: "white",
              }}
              _active={{ bg: "white" }}
            />
            {validationErrors.idNumber && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.idNumber}
              </Text>
            )}
          </Box>
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
                value={visitorFormData.date}
                onChange={handleDateChange}
                placeholder="Select Date"
                min={minDate}
                required
                disabled={loading}
                hasError={!!validationErrors.date}
              />
            </Box>
            {validationErrors.date && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.date}
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
                value={visitorFormData.time}
                onChange={handleTimeChange}
                placeholder="Select Time"
                min={minTime}
                required
                disabled={loading}
                hasError={!!validationErrors.time}
              />
            </Box>
            {validationErrors.time && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.time}
              </Text>
            )}
          </Box>
        </Flex>
        {/* Coming From */}
        <Box>
          <Text fontWeight="medium" color="#000000" mb={1}>
            Coming From?
          </Text>
          <RadioGroup.Root
            name="comingFrom"
            value={visitorFormData.comingFrom}
            onValueChange={(e) => onChange("comingFrom", e?.value ?? "company")}
          >
            <HStack gap={4} mt={2}>
              {["company", "location"].map((option) => (
                <RadioGroup.Item key={option} value={option}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator
                    boxSize="24px"
                    borderRadius="full"
                    borderWidth="2px"
                    borderColor={
                      visitorFormData.comingFrom === option
                        ? "#8A38F5"
                        : "gray.300"
                    }
                    bg={
                      visitorFormData.comingFrom === option
                        ? "#8A38F5"
                        : "white"
                    }
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="all 0.2s"
                  >
                    {visitorFormData.comingFrom === option && (
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
        {visitorFormData.comingFrom === "company" && (
          <Box>
            <Text as="label" fontWeight="medium" color="#000000">
              Company Name{" "}
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Box mt={1}>
              <Input
                id="companyName"
                value={visitorFormData.companyName || ""}
                onChange={(e) => handleCompanyNameChange(e.target.value)}
                placeholder="Enter Company Name"
                disabled={loading}
                bg="white"
                color="#000"
                border="1px solid"
                borderColor={
                  validationErrors.companyName ? "red.500" : "gray.200"
                }
                borderRadius="4px"
                height="40px"
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: validationErrors.companyName
                    ? "red.500"
                    : "#8A38F5",
                  bg: "white",
                }}
                _active={{ bg: "white" }}
              />
            </Box>
            {validationErrors.companyName && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.companyName}
              </Text>
            )}
          </Box>
        )}
        {/* Location (if comingFrom is location) */}
        {visitorFormData.comingFrom === "location" && (
          <Box>
            <Text as="label" fontWeight="medium" color="#000000">
              Location{" "}
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Box mt={1}>
              <Input
                id="location"
                value={visitorFormData.location || ""}
                onChange={(e) => onChange("location", e.target.value)}
                placeholder="Enter Location"
                disabled={loading}
                bg="white"
                color="#000"
                border="1px solid"
                borderColor={validationErrors.location ? "red.500" : "gray.200"}
                borderRadius="4px"
                height="40px"
                _placeholder={{ color: "gray.500" }}
                _focus={{
                  borderColor: validationErrors.location
                    ? "red.500"
                    : "#8A38F5",
                  bg: "white",
                }}
                _active={{ bg: "white" }}
              />
            </Box>
            {validationErrors.location && (
              <Text color="red.500" fontSize="sm" mt={1}>
                {validationErrors.location}
              </Text>
            )}
          </Box>
        )}
        {/* Purpose */}
        <Box>
          <Text as="label" fontWeight="medium" color="#000000">
            Purpose of Visit{" "}
            <Text as="span" color="red.500">
              *
            </Text>
          </Text>
          <Select.Root
            mt={1}
            value={[visitorFormData.purposeOfVisit]}
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
                borderColor={
                  validationErrors.purposeOfVisit ? "red.500" : "gray.200"
                }
              >
                <Select.ValueText
                  placeholder="Select Purpose"
                  color={visitorFormData.purposeOfVisit ? "#000" : "gray.500"}
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
                  borderColor="#dce0e3"
                  borderRadius="lg"
                  boxShadow="0 2px 16px rgba(95,36,172,0.27)"
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
          {validationErrors.purposeOfVisit && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {validationErrors.purposeOfVisit}
            </Text>
          )}
        </Box>
        {/* Visitor Photo Upload */}
        <Box mt={4}>
          <VisitorImageUpload
            ref={imageUploadRef}
            currentImageUrl={visitorFormData.imgUrl}
            onImageChange={(filePath) => onChange("imgUrl", filePath)}
            loading={loading}
            disabled={loading}
            label="Visitor Photo"
          />
        </Box>
        {error && <Text color="red.500">{error}</Text>}
        <form onSubmit={handleSubmit} style={{ display: "none" }} />
        {/* <Box h={16} />  */}
        {/* Bottom spacing for proper scroll */}
      </VStack>

      {/* Web Layout - Two Column Grid with Background */}
      <Box
        position="relative"
        bg="#F0E6FF"
        display={{ base: "none", lg: "block" }}
        minH="100vh"
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
          <Grid templateColumns="50% 50%" gap={8} w="full" ml={0}>
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
                      value={visitorFormData.fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="Enter Full name"
                      required
                      autoComplete="off"
                      disabled={loading}
                      bg="white"
                      color="#000"
                      border="1px solid"
                      borderColor={
                        validationErrors.fullName ? "red.500" : "gray.200"
                      }
                      borderRadius="4px"
                      height="40px"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: validationErrors.fullName
                          ? "red.500"
                          : "#8A38F5",
                        bg: "white",
                      }}
                      _active={{ bg: "white" }}
                    />
                  </Box>
                  {validationErrors.fullName && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {validationErrors.fullName}
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
                      value={visitorFormData.phoneNumber}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      placeholder="Enter 10 digit number"
                      required
                      disabled={loading}
                      bg="white"
                      color="#000"
                      border="1px solid"
                      borderColor={
                        validationErrors.phoneNumber ? "red.500" : "gray.200"
                      }
                      borderRadius="4px"
                      height="40px"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: validationErrors.phoneNumber
                          ? "red.500"
                          : "#8A38F5",
                        bg: "white",
                      }}
                      _active={{ bg: "white" }}
                    />
                  </Box>
                  {validationErrors.phoneNumber && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {validationErrors.phoneNumber}
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
                    value={[visitorFormData.gender]}
                    onValueChange={(val) =>
                      onChange("gender", val.value[0] ?? "")
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
                          color={visitorFormData.gender ? "#000" : "gray.500"}
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

                {/* ID Type */}
                <Box>
                  <Text as="label" fontWeight="medium" color="#000000">
                    ID Type
                  </Text>
                  <Select.Root
                    mt={1}
                    value={[visitorFormData.idType]}
                    onValueChange={(val) =>
                      onChange("idType", val.value[0] ?? "")
                    }
                    collection={idTypeOptions}
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
                          placeholder="Select ID Type"
                          color={visitorFormData.idType ? "#000" : "gray.500"}
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
                          {idTypeOptions.items.map((item) => (
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

                {/* ID Number */}
                <Box>
                  <Text as="label" fontWeight="medium" color="#000000">
                    ID Number
                  </Text>
                  <Box mt={1}>
                    <Input
                      id="idNumber-web"
                      value={visitorFormData.idNumber}
                      onChange={(e) => handleIdNumberChange(e.target.value)}
                      placeholder={
                        visitorFormData.idType === "Aadhaar"
                          ? "Enter Aadhaar number"
                          : visitorFormData.idType === "PAN"
                          ? "Enter PAN"
                          : "Enter your ID number"
                      }
                      disabled={loading}
                      bg="white"
                      color="#000"
                      border="1px solid"
                      borderColor={
                        validationErrors.idNumber ? "red.500" : "gray.200"
                      }
                      borderRadius="4px"
                      height="40px"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: validationErrors.idNumber
                          ? "red.500"
                          : "#8A38F5",
                        bg: "white",
                      }}
                      _active={{ bg: "white" }}
                    />
                    {validationErrors.idNumber && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.idNumber}
                      </Text>
                    )}
                  </Box>
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
                        value={visitorFormData.date}
                        onChange={handleDateChange}
                        placeholder="Select Date"
                        min={minDate}
                        required
                        disabled={loading}
                        hasError={!!validationErrors.date}
                      />
                    </Box>
                    {validationErrors.date && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.date}
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
                        value={visitorFormData.time}
                        onChange={handleTimeChange}
                        placeholder="Select Time"
                        min={minTime}
                        required
                        disabled={loading}
                        hasError={!!validationErrors.time}
                      />
                    </Box>
                    {validationErrors.time && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.time}
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
                    value={visitorFormData.comingFrom}
                    onValueChange={(e) =>
                      onChange("comingFrom", e?.value ?? "company")
                    }
                  >
                    <HStack gap={6} mt={2}>
                      {["company", "location"].map((option) => (
                        <RadioGroup.Item key={option} value={option}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator
                            boxSize="20px"
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              visitorFormData.comingFrom === option
                                ? "#8A38F5"
                                : "gray.300"
                            }
                            bg={
                              visitorFormData.comingFrom === option
                                ? "#8A38F5"
                                : "white"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s"
                          >
                            {visitorFormData.comingFrom === option && (
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

                {/* Company Name (if comingFrom is company) */}
                {visitorFormData.comingFrom === "company" && (
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
                        value={visitorFormData.companyName || ""}
                        onChange={(e) =>
                          handleCompanyNameChange(e.target.value)
                        }
                        placeholder="Enter Company Name"
                        disabled={loading}
                        bg="white"
                        color="#000"
                        border="1px solid"
                        borderColor={
                          validationErrors.companyName ? "red.500" : "gray.200"
                        }
                        borderRadius="4px"
                        height="40px"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{
                          borderColor: validationErrors.companyName
                            ? "red.500"
                            : "#8A38F5",
                          bg: "white",
                        }}
                        _active={{ bg: "white" }}
                      />
                    </Box>
                    {validationErrors.companyName && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.companyName}
                      </Text>
                    )}
                  </Box>
                )}

                {/* Location (if comingFrom is location) */}
                {visitorFormData.comingFrom === "location" && (
                  <Box>
                    <Text as="label" fontWeight="medium" color="#000000">
                      Location{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box mt={1}>
                      <Input
                        id="location-web"
                        value={visitorFormData.location || ""}
                        onChange={(e) => onChange("location", e.target.value)}
                        placeholder="Enter Location"
                        disabled={loading}
                        bg="white"
                        color="#000"
                        border="1px solid"
                        borderColor={
                          validationErrors.location ? "red.500" : "gray.200"
                        }
                        borderRadius="4px"
                        height="40px"
                        _placeholder={{ color: "gray.500" }}
                        _focus={{
                          borderColor: validationErrors.location
                            ? "red.500"
                            : "#8A38F5",
                          bg: "white",
                        }}
                        _active={{ bg: "white" }}
                      />
                    </Box>
                    {validationErrors.location && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.location}
                      </Text>
                    )}
                  </Box>
                )}

                {/* Purpose */}
                <Box>
                  <Text as="label" fontWeight="medium" color="#000000">
                    Purpose of Visit{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Select.Root
                    mt={1}
                    value={[visitorFormData.purposeOfVisit]}
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
                        height="40px"
                        _focus={{ borderColor: "#8A38F5" }}
                        _active={{ borderColor: "#8A38F5" }}
                        borderColor={
                          validationErrors.purposeOfVisit
                            ? "red.500"
                            : "gray.200"
                        }
                      >
                        <Select.ValueText
                          placeholder="Select Purpose"
                          color={
                            visitorFormData.purposeOfVisit ? "#000" : "gray.500"
                          }
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
                  {validationErrors.purposeOfVisit && (
                    <Text color="red.500" fontSize="sm" mt={1}>
                      {validationErrors.purposeOfVisit}
                    </Text>
                  )}
                </Box>

                {/* Upload Visitor Image */}
                <Box>
                  <VisitorImageUpload
                    ref={imageUploadRef}
                    currentImageUrl={visitorFormData.imgUrl}
                    onImageChange={(filePath) => onChange("imgUrl", filePath)}
                    loading={loading}
                    disabled={loading}
                    label="Upload Visitor Image"
                  />
                </Box>
              </VStack>
            </GridItem>
          </Grid>
          <Box h={16} /> {/* Extra bottom spacing to ensure scroll */}
        </Box>
      </Box>

      {error && (
        <Text color="red.500" mt={4}>
          {error}
        </Text>
      )}
      <form onSubmit={handleSubmit} style={{ display: "none" }} />
    </Box>
  );
});

StepOne.displayName = "StepOne";

export default StepOne;
