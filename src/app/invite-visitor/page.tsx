"use client";

import { Box, Flex, Text, Heading, Input, IconButton } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useVisitorInfo } from "./VisitorInfoContext";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import PrimaryButton from "@/components/ui/PrimaryButton";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css"; // You can skip this if already added globally
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import InviteModal from "@/components/modals/InviteModal";

const InviteVisitorInfoPage = (): ReactNode => {
  const router = useRouter();
  const { info, setInfo } = useVisitorInfo();
  const { isMobile, isHydrated } = useDeviceDetection();
  const [companyName, setCompanyName] = useState(info.companyName || "");
  const [phoneNumber, setPhoneNumber] = useState(info.phoneNumber || "");
  const [phoneCountry, setPhoneCountry] = useState<string>(
    info.phoneCountry || "in"
  ); // ISO2 code, default to India
  const [email, setEmail] = useState(info.email || "");
  const [companyNameError, setCompanyNameError] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [touched, setTouched] = useState({
    companyName: false,
    phoneNumber: false,
    email: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-level validation
  const validateCompanyName = (value: string) => {
    if (!value.trim()) return "Company name is required";
    if (value.trim().length < 2)
      return "Company name must be at least 2 characters";
    if (value.trim().length > 50)
      return "Company name must be at most 50 characters";
    
    // Check for special characters - only allow letters, numbers, spaces, and hyphens
    if (!/^[a-zA-Z0-9\s-]+$/.test(value.trim())) {
      return "Company name can only contain letters, numbers, spaces, and hyphens";
    }
    
    return "";
  };
  const validatePhoneNumber = (value: string) => {
    if (!value.trim()) return "Phone number is required";
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    
    // Extract local number (excluding country code)
    let localDigits = digits;
    
    // If it starts with 91 (India), remove it to get local number
    if (digits.startsWith("91") && digits.length >= 12) {
      localDigits = digits.substring(2);
    }
    // If it's exactly 10 digits, it's already a local number
    else if (digits.length === 10) {
      localDigits = digits;
    }
    // If it's 11 digits and starts with 0, remove the 0
    else if (digits.length === 11 && digits.startsWith("0")) {
      localDigits = digits.substring(1);
    }
    // If it's less than 10 digits total, it's definitely invalid
    else if (digits.length < 10) {
      return "Phone number must be exactly 10 digits";
    }
    // If it's more than 12 digits, it's invalid
    else if (digits.length > 12) {
      return "Phone number must be exactly 10 digits";
    }
    
    // Validate local number is exactly 10 digits
    if (localDigits.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    return "";
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value.trim()) return "Email is required";
    if (!emailRegex.test(value.trim())) return "Invalid email address";
    
    // Check for common typos in Gmail domain
    const email = value.trim().toLowerCase();
    const gmailTypos = ['gamil.com', 'gmial.com', 'gmai.com', 'gmail.co', 'gamil.co'];
    
    for (const typo of gmailTypos) {
      if (email.endsWith(typo)) {
        return "Invalid email address";
      }
    }
    
    return "";
  };

  const checkCompanyNameExists = async (name: string) => {
    const res = await fetch(`${FRONTEND_URL}/api/companies/check-name/?name=${encodeURIComponent(name.trim())}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.exists;
  };

  const handlePreview = async () => {
    setSubmitAttempted(true);
    // Validate all fields on submit
    const cErr = validateCompanyName(companyName);
    const pErr = validatePhoneNumber(phoneNumber);
    const eErr = validateEmail(email);
    setCompanyNameError(cErr);
    setPhoneNumberError(pErr);
    setEmailError(eErr);
    if (cErr || pErr || eErr) return;
    
    setLoading(true);
    try {
      // Check for duplicate company name before proceeding
      const exists = await checkCompanyNameExists(companyName);
      if (exists) {
        setCompanyNameError("Company name already exists");
        setLoading(false);
        return; // Prevent proceeding to preview
      }
      
      // Only proceed if no duplicates found
      setInfo({
        companyName,
        phoneNumber,
        email,
        phoneCountry,
        country: info.country,
      });
      setLoading(false);
      router.push("/invite-visitor/preview");
    } catch (err: unknown) {
      let errorMsg = "Unknown error";
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { error?: string } } })
          .response === "object"
      ) {
        const response = (err as { response?: { data?: { error?: string } } })
          .response;
        errorMsg = response?.data?.error || errorMsg;
      }
      setLoading(false);
      
      // Handle specific error for duplicate company name
      if (errorMsg.includes("Company name already exists")) {
        setCompanyNameError("Company name already exists");
      } else {
        toaster.error({
          title: "Failed to check company name",
          description: errorMsg,
        });
      }
    }
  };

  // Real-time error clearing and validation on change
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Filter out special characters - only allow letters, numbers, spaces, and hyphens
    const filteredValue = value.replace(/[^a-zA-Z0-9\s-]/g, '');
    
    setCompanyName(filteredValue);
    setInfo({ ...info, companyName: filteredValue });
    setTouched((prev) => ({ ...prev, companyName: true }));
    
    // Clear previous errors first
    setCompanyNameError("");
    
    if (submitAttempted || touched.companyName) {
      const validationError = validateCompanyName(filteredValue);
      if (validationError) {
        setCompanyNameError(validationError);
      } else if (filteredValue.trim().length >= 2) {
        // Check for duplicates in real-time (debounced)
        setTimeout(async () => {
          try {
            const exists = await checkCompanyNameExists(filteredValue);
            if (exists) {
              setCompanyNameError("Company name already exists");
            }
          } catch (error) {
            // Silently handle error for real-time validation
            console.error("Error checking company name:", error);
          }
        }, 500);
      }
    }
  };
  const handlePhoneNumberChange = (
    value: string,
    data: { countryCode: string }
  ) => {
    setPhoneNumber(value);
    setPhoneCountry(data.countryCode || "");
    setInfo({
      ...info,
      phoneNumber: value,
      phoneCountry: data.countryCode || "",
    });
    // Validate on change if user has attempted submission
    if (submitAttempted) {
      setPhoneNumberError(validatePhoneNumber(value));
    } else {
      setPhoneNumberError("");
    }
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setInfo({ ...info, email: value });
    setTouched((prev) => ({ ...prev, email: true }));
    
    // Clear error on change, only validate on submit attempt
    if (submitAttempted) {
      setEmailError(validateEmail(value));
    } else {
      setEmailError("");
    }
  };



  // Wait for hydration to prevent SSR mismatch
  if (!isHydrated) {
    return (
      <Box
        w="100vw"
        h="100vh"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text>Loading...</Text>
      </Box>
    );
  }

  // For web view, show the modal directly
  if (!isMobile) {
    return (
      <InviteModal
        isOpen={true}
        onClose={() => router.push("/dashboard")}
      />
    );
  }

  // Mobile view - original form
  return (
    <Box
      w="100vw"
      px={0}
      h="100vh"
      bg="white"
      display="flex"
      flexDirection="column"
      overflowX="hidden"
      overflowY="hidden"
      css={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Header */}
      <Flex
        align="center"
        h="70px"
        px={4}
        py={3}
        bg="#f4edfe"
        borderBottom="1px solid #f1f1f1"
      >
        <IconButton
          aria-label="Back"
          tabIndex={0}
          variant="ghost"
          fontSize="lg"
          mr={2}
          bg="transparent"
          onClick={() => router.push("/dashboard")}
          color="gray.700"
          _focus={{ boxShadow: "none", outline: "none", bg: "transparent" }}
          _active={{ bg: "transparent" }}
        >
          <FiChevronLeft />
        </IconButton>
        <Text
          flex={1}
          textAlign="center"
          fontWeight="bold"
          fontSize="sm"
          color="gray.800"
        >
          Add Company Details
        </Text>
        <Box w={8} />
      </Flex>

      {/* Form Section */}
      <Box flex="1" px={4} pt={2} pb={10}>
        <Flex align="center" justify="space-between" mb={1}>
          <Heading
            as="h2"
            size="sm"
            color="#1e1e1e"
            fontWeight="bold"
            fontSize="md"
            mt="3"
          >
            Add Company Details
          </Heading>
          <Box
            bg="#f3edfd"
            borderRadius="md"
            p={0.5}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {/* <IconButton
              aria-label="Voice input"
              tabIndex={0}
              variant="ghost"
              fontSize="md"
              color="#9747ff"
              bg="transparent"
              _hover={{ bg: "transparent" }}
              _active={{ bg: "transparent" }}
              minW={"unset"}
              h={"auto"}
              p={0}
            >
              <FiMic style={{ fontSize: 18 }} />
            </IconButton> */}
          </Box>
        </Flex>
        <Text fontSize="sm" color="#b0b0b0" mb={2} mt="2">
          Please provide all the information
        </Text>

        {/* Company Name */}
        <Box mb={2}>
          <Text as="label" display="flex" alignItems="center" color="black" fontSize="md" fontWeight="medium" mb={2}>
            Company Name
            <Box as="span" color="red.500" ml={1}>*</Box>
          </Text>
          <Input
            placeholder="Enter Company Name"
            fontSize="xs"
            py={1.5}
            px={2}
            borderRadius="md"
            value={companyName}
            onChange={handleCompanyNameChange}
            borderColor={companyNameError ? "red.400" : undefined}
            _focus={{ borderColor: companyNameError ? "red.400" : "#9747ff" }}
            aria-invalid={!!companyNameError}
            color="black"
            maxLength={50}
            pattern="[a-zA-Z0-9\s-]+"
            title="Only letters, numbers, spaces, and hyphens are allowed"
          />
          {companyNameError && (touched.companyName || submitAttempted) && (
            <Text
              color="red.500"
              fontSize="2xs"
              mt={0.5}
              minH="16px"
              lineHeight="16px"
              aria-live="polite"
            >
              {companyNameError}
            </Text>
          )}
        </Box>

        {/* Phone Number */}
        <Box mb={2}>
          <Text as="label" display="flex" alignItems="center" color="black" fontSize="md" fontWeight="medium" mb={2}>
            Phone Number
            <Box as="span" color="red.500" ml={1}>*</Box>
          </Text>
          <Box>
            <PhoneInput
              country={phoneCountry}
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              inputProps={{
                name: "phone",
                required: true,
                autoFocus: false,
                tabIndex: 0,
                "aria-label": "Phone number with country code",
              }}
              inputStyle={{
                width: "100%",
                height: "36px",
                fontSize: "14px",
                borderRadius: "0.375rem",
                borderColor:
                  submitAttempted &&
                  phoneNumberError &&
                  (phoneNumber === "" || phoneNumberError)
                    ? "#fc8181"
                    : "#000",
                color: "#000",
                background: "#fff",
              }}
              buttonStyle={{
                borderRadius: "0.375rem 0 0 0.375rem",
                borderColor:
                  submitAttempted &&
                  phoneNumberError &&
                  (phoneNumber === "" || phoneNumberError)
                    ? "#fc8181"
                    : "#000",
                color: "#000",
                background: "#fff",
              }}
              dropdownStyle={{
                color: "#000",
                background: "#fff",
              }}
              specialLabel=""
              disableDropdown={false}
              countryCodeEditable={false}
              enableSearch={true}
              masks={{ in: ".........." }}
              isValid={(value: string) => {
                if (!value) return true; // Empty is valid
                
                const digits = value.replace(/\D/g, "");
                let localDigits = digits;
                
                // If it starts with 91 (India), remove it to get local number
                if (digits.startsWith("91") && digits.length >= 12) {
                  localDigits = digits.substring(2);
                }
                // If it's exactly 10 digits, it's already a local number
                else if (digits.length === 10) {
                  localDigits = digits;
                }
                // If it's 11 digits and starts with 0, remove the 0
                else if (digits.length === 11 && digits.startsWith("0")) {
                  localDigits = digits.substring(1);
                }
                // If it's less than 10 digits total, it's definitely invalid
                else if (digits.length < 10) {
                  return false;
                }
                // If it's more than 12 digits, it's invalid
                else if (digits.length > 12) {
                  return false;
                }
                
                return localDigits.length === 10;
              }}
            />
          </Box>
          {submitAttempted &&
            phoneNumberError &&
            (phoneNumber === "" || phoneNumberError) && (
              <Text
                color="red.500"
                fontSize="2xs"
                mt={0.5}
                minH="16px"
                lineHeight="16px"
                aria-live="polite"
              >
                {phoneNumberError}
              </Text>
            )}
        </Box>

        {/* Email */}
        <Box mb={2}>
          <Text as="label" display="flex" alignItems="center" color="black" fontSize="md" fontWeight="medium" mb={2}>
            Email
            <Box as="span" color="red.500" ml={1}>*</Box>
          </Text>
          <Input
            placeholder="Enter Email"
            fontSize="xs"
            py={1.5}
            px={2}
            borderRadius="md"
            value={email}
            onChange={handleEmailChange}
            borderColor={emailError ? "red.400" : undefined}
            _focus={{ borderColor: emailError ? "red.400" : "#9747ff" }}
            aria-invalid={!!emailError}
            color="black"
          />
          {emailError && submitAttempted && (
            <Text
              color="red.500"
              fontSize="2xs"
              mt={0.5}
              minH="16px"
              lineHeight="16px"
              aria-live="polite"
            >
              {emailError}
            </Text>
          )}
        </Box>
      </Box>

      {/* Preview Button */}
      <Box px={4} w="100%" position="absolute" bottom={4}>
        <PrimaryButton
          size="sm"
          fontSize="sm"
          py={2}
          borderRadius="md"
          w="100%"
          isLoading={loading}
          onClick={handlePreview}
          ariaLabel="Preview company details"
          tabIndex={0}
        >
          Preview
        </PrimaryButton>
      </Box>
      <style jsx global>{`
        .react-phone-input-2 .flag-dropdown,
        .react-phone-input-2 .selected-flag,
        .react-phone-input-2 .form-control,
        .react-phone-input-2 .country-list {
          color: #000 !important;
          background: #fff !important;
        }
      `}</style>
    </Box>
  );
};

export default InviteVisitorInfoPage;
