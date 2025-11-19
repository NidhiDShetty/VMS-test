"use client";
import {
  Box,
  Flex,
  Text,
  Icon,
  Input,
  Button,
  Heading,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { FiChevronLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter, useSearchParams } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { getProfileData, ProfileResponse } from "@/app/api/profile/routes";
import {
  requestPasswordReset,
  verifyOTP,
  resetPassword,
} from "@/app/api/forgot-password/routes";
import Logo from "@/components/svgs/logo";

import DesktopHeader from "@/components/DesktopHeader";
interface PasswordFormData {
  newPassword: string;
  repeatPassword: string;
}

interface PasswordErrors {
  newPassword: string;
  repeatPassword: string;
}

interface EmailVerificationData {
  email: string;
  otp: string[];
}

const ChangePasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<"email" | "otp" | "password">(
    "email"
  );
  const [emailData, setEmailData] = useState<EmailVerificationData>({
    email: "", // Will be fetched from user profile
    otp: ["", "", "", "", "", ""],
  });
  const [, setProfileData] = useState<ProfileResponse | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [otpError, setOtpError] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [formData, setFormData] = useState<PasswordFormData>({
    newPassword: "",
    repeatPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    repeat: false,
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({
    newPassword: "",
    repeatPassword: "",
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Check if user is returning from OTP verification
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      setCurrentStep("password");
      // Use setTimeout to defer the toaster call outside of the lifecycle method
      setTimeout(() => {
        toaster.success({
          title: "Email Verified",
          description:
            "Your email has been successfully verified. You can now change your password.",
        });
      }, 0);
    }
  }, [searchParams]);

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setEmailLoading(true);
        const profile = await getProfileData();
        setProfileData(profile);
        const userEmail = profile.profile.email || "";
        setEmailData((prev) => ({
          ...prev,
          email: userEmail,
        }));
      } catch {
        toaster.error({
          title: "Error",
          description: "Failed to load user profile. Please try again.",
        });
        // Fallback to empty email
        setEmailData((prev) => ({
          ...prev,
          email: "",
        }));
      } finally {
        setEmailLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleSendVerificationCode = async () => {
    setOtpLoading(true);
    try {
      const response = await requestPasswordReset({ email: emailData.email });

      if (response.success) {
        toaster.success({
          title: "Verification Code Sent",
          description: response.message,
        });

        // Reset OTP and timer, move to OTP step
        setEmailData((prev) => ({ ...prev, otp: ["", "", "", "", "", ""] }));
        setTimeLeft(600);
        setCanResend(false);
        setOtpError("");
        setCurrentStep("otp");
      }
    } catch (error: unknown) {
      toaster.error({
        title: "Error",
        description:
          (error as Error).message ||
          "Failed to send verification code. Please try again.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtpCode = [...emailData.otp];
    newOtpCode[index] = value;
    setEmailData((prev) => ({ ...prev, otp: newOtpCode }));

    // Clear error when user starts typing
    if (otpError) {
      setOtpError("");
    }

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Handle backspace
    if (e.key === "Backspace" && !emailData.otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtpCode = [...emailData.otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtpCode[i] = pastedData[i];
    }

    setEmailData((prev) => ({ ...prev, otp: newOtpCode }));

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const otpString = emailData.otp.join("");

  const handleVerifyOtp = async () => {
    if (otpString.length !== 6) {
      setOtpError("OTP code must be 6 digits");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await verifyOTP({
        email: emailData.email,
        otpCode: otpString,
      });

      if (response.success) {
        toaster.success({
          title: "Email Verified",
          description: response.message,
        });

        setCurrentStep("password");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as Error).message || "Invalid OTP. Please try again.";
      setOtpError(errorMessage);
      toaster.error({
        title: "Verification Failed",
        description: errorMessage,
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const response = await requestPasswordReset({ email: emailData.email });

      if (response.success) {
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setEmailData((prev) => ({ ...prev, otp: ["", "", "", "", "", ""] }));
        setOtpError("");
        toaster.success({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email",
        });
      } else {
        throw new Error(response.message || "Failed to resend OTP");
      }
    } catch (error: unknown) {
      toaster.error({
        title: "Error",
        description:
          (error as Error).message || "Failed to resend OTP. Please try again.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation
    if (hasSubmitted) {
      validateField(field, value);
    }
  };

  const validateField = (field: keyof PasswordFormData, value: string) => {
    let error = "";

    if (!value.trim()) {
      error = `${
        field === "newPassword" ? "New" : "Repeat"
      } password is required`;
    } else if (field === "newPassword") {
      if (value.length < 8) {
        error = "Password must be at least 8 characters";
      } else if (value.length > 128) {
        error = "Password must not exceed 128 characters";
      } else if (formData.repeatPassword && value !== formData.repeatPassword) {
        error = "Passwords do not match";
      }
    } else if (field === "repeatPassword") {
      if (value !== formData.newPassword) {
        error = "Passwords do not match";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleInputBlur = (field: keyof PasswordFormData) => {
    if (!formData[field].trim()) {
      setErrors((prev) => ({
        ...prev,
        [field]: `${
          field === "newPassword" ? "New" : "Repeat"
        } password is required`,
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    setHasSubmitted(true);

    // Validate all fields
    const newErrors: PasswordErrors = {
      newPassword: "",
      repeatPassword: "",
    };

    // New password validation
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (formData.newPassword.length > 128) {
      newErrors.newPassword = "Password must not exceed 128 characters";
    }

    // Repeat password validation
    if (!formData.repeatPassword.trim()) {
      newErrors.repeatPassword = "Repeat password is required";
    } else if (formData.newPassword !== formData.repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some((error) => error !== "");
    if (hasErrors) {
      toaster.error({
        title: "Validation Error",
        description: "Please fix the errors below.",
      });
      return;
    }

    setLoading(true);
    try {
      // Use resetPassword function with email and OTP from the verification step
      const res = await resetPassword({
        email: emailData.email,
        otpCode: emailData.otp.join(""),
        newPassword: formData.newPassword,
      });

      // Show success message
      toaster.success({
        title: "Password Changed Successfully",
        description:
          res?.message || "Your password has been successfully updated. You will be logged out for security.",
      });

      // Reset form
      setFormData({
        newPassword: "",
        repeatPassword: "",
      });

      // Clear all auth data and redirect to login page after a short delay
      setTimeout(() => {
        // Clear all auth data
        localStorage.removeItem("authData");
        sessionStorage.removeItem("splashSeen");
        sessionStorage.removeItem("signinSplashSeen");
        sessionStorage.removeItem("justLoggedIn");
        
        // Use window.location for a full page reload to ensure clean state
        // This prevents Next.js router issues during logout
        window.location.href = "/vmsapp/";
      }, 1500);
    } catch (err: unknown) {
      let message = "Failed to change password. Please try again.";
      if (err instanceof Error) {
        message = err.message;
      }
      toaster.error({
        title: "Error",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  return (
    <Box w="full" minH="100vh" bg="white">
      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader />

      {/* Desktop Background with Decorative Elements */}
      <Box
        display={{ base: "none", md: "block" }}
        position="relative"
        h="calc(100vh - 70px)"
        bg="#F0E6FF"
        overflow="hidden"
      >
        {/* Layout Container - 20% | 60% | 20% */}
        <Flex h="calc(100vh - 70px)" position="relative" zIndex={2}>
          {/* Left Decorative Logo - 20% */}
          <Box
            w="20%"
            h="full"
            opacity={0.15}
            zIndex={1}
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            position="relative"
            pr={4}
          >
            <Box transform="scale(4.5)">
              <Logo />
            </Box>
          </Box>

          {/* Form Card - 60% */}
          <Flex w="60%" h="full" align="center" justify="center" px={2}>
            <Box
              bg="white"
              borderRadius="lg"
              p={8}
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              w="400px"
              h="540px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
              {/* Desktop Form Content */}
              <Box
                display={{ base: "none", md: "flex" }}
                flex="1"
                flexDirection="column"
                justifyContent="center"
              >
                {/* Desktop Logo in Form */}
                <Flex justify="center" mb={4}>
                  <Box transform="translateX(-8px)">
                    <Logo />
                  </Box>
                </Flex>

                <Heading
                  as="h1"
                  fontSize="22px"
                  fontWeight="bold"
                  color="gray.900"
                  mb={2}
                  textAlign="center"
                  whiteSpace="nowrap"
                >
                  {currentStep === "email"
                    ? "Verify Email"
                    : currentStep === "otp"
                    ? "Enter Verification Code"
                    : "Change Password"}
                </Heading>

                <Text
                  fontSize="10px"
                  color="gray.500"
                  mb={6}
                  textAlign="center"
                >
                  {currentStep === "email"
                    ? "Verify your email address to change your password"
                    : currentStep === "otp"
                    ? "Enter the 6-digit code sent to your email"
                    : "Enter your new password to complete the process"}
                </Text>

                {/* Desktop Form Content */}
                <Box
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                >
                  <Box>
                    {currentStep === "email" ? (
                      <>
                        {/* Email Input (Read-only) */}
                        <Box mb={4}>
                          <Text
                            fontSize="13px"
                            fontWeight="bold"
                            mb={1}
                            color="gray.800"
                          >
                            Email{" "}
                            <Box as="span" color="red.500">
                              *
                            </Box>
                          </Text>
                          <Input
                            value={
                              emailLoading ? "Loading..." : emailData.email
                            }
                            readOnly
                            placeholder="Enter your Email"
                            bg="white"
                            border="1px solid #E5E7EB"
                            borderRadius="md"
                            px={3}
                            py={3}
                            fontSize="13px"
                            color={emailLoading ? "gray.400" : "black"}
                            cursor="not-allowed"
                            tabIndex={-1}
                            aria-label="Email address (read-only)"
                            disabled={emailLoading}
                            h="40px"
                          />
                          {emailLoading && (
                            <Text color="gray.500" fontSize="12px" mt={1}>
                              Fetching your email address...
                            </Text>
                          )}
                        </Box>
                      </>
                    ) : currentStep === "otp" ? (
                      <>
                        {/* OTP Input */}
                        <Box mb={4}>
                          <Box mb={4}>
                            <Text
                              fontSize="13px"
                              fontWeight="bold"
                              color="gray.800"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              Verification Code
                              <Box
                                as="span"
                                color="red.500"
                                ml={1}
                                fontSize="md"
                                aria-label="required"
                              >
                                *
                              </Box>
                            </Text>
                          </Box>

                          <Box
                            display="flex"
                            justifyContent="center"
                            mb={2}
                            gap={2}
                          >
                            {emailData.otp.map((digit, index) => (
                              <Input
                                key={index}
                                ref={(el) => {
                                  inputRefs.current[index] = el;
                                }}
                                value={digit}
                                onChange={(e) =>
                                  handleOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                maxLength={1}
                                textAlign="center"
                                fontSize="18px"
                                fontWeight="bold"
                                width="45px"
                                height="45px"
                                borderColor={otpError ? "red.500" : "gray.300"}
                                _focus={{
                                  borderColor: otpError ? "red.500" : "#8A38F5",
                                  boxShadow: "none",
                                }}
                                _hover={{
                                  borderColor: otpError ? "red.500" : "#8A38F5",
                                }}
                                borderRadius="8px"
                                bg="white"
                                color="gray.800"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                              />
                            ))}
                          </Box>

                          {otpError && (
                            <Text
                              color="red.500"
                              fontSize="12px"
                              mt={2}
                              textAlign="center"
                            >
                              {otpError}
                            </Text>
                          )}
                        </Box>

                        {/* Timer and Resend */}
                        <Box textAlign="center" mb={4}>
                          {timeLeft > 0 ? (
                            <Text fontSize="14px" color="gray.600">
                              Code expires in:{" "}
                              <strong>{formatTime(timeLeft)}</strong>
                            </Text>
                          ) : (
                            <Text fontSize="14px" color="red.500">
                              Code has expired
                            </Text>
                          )}
                        </Box>
                      </>
                    ) : (
                      <>
                        {/* New Password */}
                        <Box mb={4}>
                          <Text
                            fontSize="13px"
                            fontWeight="bold"
                            mb={1}
                            color="gray.800"
                          >
                            New Password{" "}
                            <Box as="span" color="red.500">
                              *
                            </Box>
                          </Text>
                          <Box position="relative">
                            <Input
                              type={showPasswords.new ? "text" : "password"}
                              value={formData.newPassword}
                              onChange={(e) =>
                                handleInputChange("newPassword", e.target.value)
                              }
                              onBlur={() => handleInputBlur("newPassword")}
                              placeholder="Enter new password"
                              bg="white"
                              border="1px solid"
                              borderColor={
                                hasSubmitted && errors.newPassword
                                  ? "red.500"
                                  : "#E5E7EB"
                              }
                              borderRadius="md"
                              px={3}
                              py={3}
                              fontSize="13px"
                              color="black"
                              _focus={{
                                borderColor:
                                  hasSubmitted && errors.newPassword
                                    ? "red.500"
                                    : "#8A38F5",
                                boxShadow: "none",
                              }}
                              _placeholder={{
                                color: "gray.400",
                              }}
                              tabIndex={0}
                              aria-label="New password input"
                              h="40px"
                            />
                            <Icon
                              as={showPasswords.new ? FiEyeOff : FiEye}
                              position="absolute"
                              right={3}
                              top="50%"
                              transform="translateY(-50%)"
                              boxSize={5}
                              color="gray.400"
                              cursor="pointer"
                              tabIndex={0}
                              role="button"
                              aria-label={
                                showPasswords.new
                                  ? "Hide password"
                                  : "Show password"
                              }
                              onClick={() => togglePasswordVisibility("new")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  togglePasswordVisibility("new");
                                }
                              }}
                              _focus={{ boxShadow: "none", outline: "none" }}
                            />
                          </Box>
                          {hasSubmitted && errors.newPassword && (
                            <Text color="red.500" fontSize="12px" mt={1}>
                              {errors.newPassword}
                            </Text>
                          )}
                        </Box>

                        {/* Repeat Password */}
                        <Box mb={6}>
                          <Text
                            fontSize="13px"
                            fontWeight="bold"
                            mb={1}
                            color="gray.800"
                          >
                            Confirm Password{" "}
                            <Box as="span" color="red.500">
                              *
                            </Box>
                          </Text>
                          <Box position="relative">
                            <Input
                              type={showPasswords.repeat ? "text" : "password"}
                              value={formData.repeatPassword}
                              onChange={(e) =>
                                handleInputChange(
                                  "repeatPassword",
                                  e.target.value
                                )
                              }
                              onBlur={() => handleInputBlur("repeatPassword")}
                              placeholder="Repeat new password"
                              bg="white"
                              border="1px solid"
                              borderColor={
                                hasSubmitted && errors.repeatPassword
                                  ? "red.500"
                                  : "#E5E7EB"
                              }
                              borderRadius="md"
                              px={3}
                              py={3}
                              fontSize="13px"
                              color="black"
                              _focus={{
                                borderColor:
                                  hasSubmitted && errors.repeatPassword
                                    ? "red.500"
                                    : "#8A38F5",
                                boxShadow: "none",
                              }}
                              _placeholder={{
                                color: "gray.400",
                              }}
                              tabIndex={0}
                              aria-label="Repeat password input"
                              h="40px"
                            />
                            <Icon
                              as={showPasswords.repeat ? FiEyeOff : FiEye}
                              position="absolute"
                              right={3}
                              top="50%"
                              transform="translateY(-50%)"
                              boxSize={5}
                              color="gray.400"
                              cursor="pointer"
                              tabIndex={0}
                              role="button"
                              aria-label={
                                showPasswords.repeat
                                  ? "Hide password"
                                  : "Show password"
                              }
                              onClick={() => togglePasswordVisibility("repeat")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  togglePasswordVisibility("repeat");
                                }
                              }}
                              _focus={{ boxShadow: "none", outline: "none" }}
                            />
                          </Box>
                          {hasSubmitted && errors.repeatPassword && (
                            <Text color="red.500" fontSize="12px" mt={1}>
                              {errors.repeatPassword}
                            </Text>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>

                  {/* Desktop Action Buttons */}
                  <Box mt={4}>
                    {currentStep === "email" ? (
                      <Flex gap={3} w="full">
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          border="1px solid #D1D5DB"
                          color="black"
                          bg="white"
                          borderRadius="md"
                          flex={1}
                          py={3}
                          fontSize="sm"
                          fontWeight="medium"
                          _hover={{
                            bg: "#F9FAFB",
                            borderColor: "#9CA3AF",
                          }}
                          _active={{
                            bg: "#F3F4F6",
                          }}
                          tabIndex={0}
                          aria-label="Cancel email verification"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCancel();
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSendVerificationCode}
                          loading={otpLoading}
                          loadingText="Sending..."
                          disabled={emailLoading || !emailData.email}
                          bg="#8a37f7"
                          color="white"
                          borderRadius="md"
                          flex={1}
                          py={3}
                          fontSize="sm"
                          fontWeight="medium"
                          _hover={{
                            bg:
                              emailLoading || !emailData.email
                                ? "#8a37f7"
                                : "#7a2ee6",
                          }}
                          _active={{
                            bg:
                              emailLoading || !emailData.email
                                ? "#8a37f7"
                                : "#6a1dd9",
                          }}
                          tabIndex={0}
                          aria-label="Send verification code"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (!emailLoading && emailData.email) {
                                handleSendVerificationCode();
                              }
                            }
                          }}
                        >
                          Send OTP
                        </Button>
                      </Flex>
                    ) : currentStep === "otp" ? (
                      <Flex direction="column" gap={3} w="full">
                        <Button
                          onClick={handleVerifyOtp}
                          loading={otpLoading}
                          loadingText="Verifying..."
                          disabled={otpString.length !== 6}
                          bg="#8a37f7"
                          color="white"
                          borderRadius="md"
                          w="full"
                          py={3}
                          fontSize="sm"
                          fontWeight="medium"
                          _hover={{
                            bg: otpString.length !== 6 ? "#8a37f7" : "#7a2ee6",
                          }}
                          _active={{
                            bg: otpString.length !== 6 ? "#8a37f7" : "#6a1dd9",
                          }}
                          tabIndex={0}
                          aria-label="Verify OTP"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              if (otpString.length === 6) {
                                handleVerifyOtp();
                              }
                            }
                          }}
                        >
                          Verify OTP
                        </Button>

                        <Flex gap={3} w="full">
                          <Button
                            onClick={() => setCurrentStep("email")}
                            variant="outline"
                            border="1px solid #D1D5DB"
                            color="black"
                            bg="white"
                            borderRadius="md"
                            flex={1}
                            py={3}
                            fontSize="sm"
                            fontWeight="medium"
                            _hover={{
                              bg: "#F9FAFB",
                              borderColor: "#9CA3AF",
                            }}
                            _active={{
                              bg: "#F3F4F6",
                            }}
                            tabIndex={0}
                            aria-label="Back to email"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setCurrentStep("email");
                              }
                            }}
                          >
                            Back
                          </Button>

                          {canResend && (
                            <Button
                              onClick={handleResendOTP}
                              loading={otpLoading}
                              loadingText="Resending..."
                              variant="outline"
                              border="1px solid #8a37f7"
                              color="#8a37f7"
                              bg="white"
                              borderRadius="md"
                              flex={1}
                              py={3}
                              fontSize="sm"
                              fontWeight="medium"
                              _hover={{
                                bg: "#f4edfe",
                                borderColor: "#7a2ee6",
                              }}
                              _active={{
                                bg: "#e9d5ff",
                              }}
                              tabIndex={0}
                              aria-label="Resend OTP"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleResendOTP();
                                }
                              }}
                            >
                              Resend OTP
                            </Button>
                          )}
                        </Flex>
                      </Flex>
                    ) : (
                      <Flex gap={3} w="full">
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          border="1px solid #D1D5DB"
                          color="black"
                          bg="white"
                          borderRadius="md"
                          flex={1}
                          py={3}
                          fontSize="sm"
                          fontWeight="medium"
                          _hover={{
                            bg: "#F9FAFB",
                            borderColor: "#9CA3AF",
                          }}
                          _active={{
                            bg: "#F3F4F6",
                          }}
                          tabIndex={0}
                          aria-label="Cancel password change"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleCancel();
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          loading={loading}
                          loadingText="Saving..."
                          bg="#8a37f7"
                          color="white"
                          borderRadius="md"
                          flex={1}
                          py={3}
                          fontSize="sm"
                          fontWeight="medium"
                          _hover={{
                            bg: "#7a2ee6",
                          }}
                          _active={{
                            bg: "#6a1dd9",
                          }}
                          tabIndex={0}
                          aria-label="Save password changes"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSave();
                            }
                          }}
                        >
                          Save
                        </Button>
                      </Flex>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Flex>

          {/* Right Decorative Logo - 20% */}
          <Box
            w="20%"
            h="full"
            opacity={0.15}
            zIndex={1}
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            position="relative"
            pl={4}
          >
            <Box transform="scale(4.5)">
              <Logo />
            </Box>
          </Box>
        </Flex>
      </Box>

      {/* Mobile Layout - Hidden on Desktop */}
      <Box display={{ base: "block", md: "none" }}>
        <Flex
          direction="column"
          w="100vw"
          minH="100vh"
          bg="white"
          position="relative"
          px={0}
        >
          {/* Header */}
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
              onClick={() => router.push("/profile")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push("/profile");
                }
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
            <Text fontWeight="bold" fontSize="sm" color="#181a1b">
              {currentStep === "email"
                ? "Verify Email"
                : currentStep === "otp"
                ? "Enter Verification Code"
                : "Change Password"}
            </Text>
          </Flex>

          {/* Form Content */}
          <Box p='16px' flex={1}>
            {currentStep === "email" ? (
              <>
                {/* Email Verification Step */}
                <Text fontSize="sm" color="gray.600" mb={6}>
                  Enter your registered email address to verify your identity.
                </Text>

                {/* Email Input (Read-only) */}
                <Box mb={6}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.800"
                    mb={2}
                    display="flex"
                    alignItems="center"
                  >
                    Email Address
                    <Box
                      as="span"
                      color="red.500"
                      ml={1}
                      fontSize="md"
                      aria-label="required"
                    >
                      *
                    </Box>
                  </Text>
                  <Input
                    value={emailLoading ? "Loading..." : emailData.email}
                    readOnly
                    bg="gray.50"
                    border="1px solid #E5E7EB"
                    borderRadius="md"
                    px={3}
                    py={3}
                    fontSize="sm"
                    color={emailLoading ? "gray.400" : "gray.600"}
                    cursor="not-allowed"
                    tabIndex={-1}
                    aria-label="Email address (read-only)"
                    disabled={emailLoading}
                  />
                  {emailLoading && (
                    <Text color="gray.500" fontSize="12px" mt={1}>
                      Fetching your email address...
                    </Text>
                  )}
                </Box>
              </>
            ) : currentStep === "otp" ? (
              <>
                {/* OTP Verification Step */}
                <Text fontSize="sm" color="gray.600" mb={6}>
                  Enter the 6-digit code sent to{" "}
                  <strong>{emailData.email}</strong>
                </Text>

                {/* OTP Input */}
                <Box mb={6}>
                  <Box mb={4}>
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.800"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      Verification Code
                      <Box
                        as="span"
                        color="red.500"
                        ml={1}
                        fontSize="md"
                        aria-label="required"
                      >
                        *
                      </Box>
                    </Text>
                  </Box>

                  <Box display="flex" justifyContent="center" mb={2} gap={2}>
                    {emailData.otp.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        maxLength={1}
                        textAlign="center"
                        fontSize="18px"
                        fontWeight="bold"
                        width="45px"
                        height="45px"
                        borderColor={otpError ? "red.500" : "gray.300"}
                        _focus={{
                          borderColor: otpError ? "red.500" : "#8A38F5",
                          boxShadow: "none",
                        }}
                        _hover={{
                          borderColor: otpError ? "red.500" : "#8A38F5",
                        }}
                        borderRadius="8px"
                        bg="white"
                        color="gray.800"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    ))}
                  </Box>

                  {otpError && (
                    <Text
                      color="red.500"
                      fontSize="12px"
                      mt={2}
                      textAlign="center"
                    >
                      {otpError}
                    </Text>
                  )}
                </Box>

                {/* Timer and Resend */}
                <Box textAlign="center" mb={6}>
                  {timeLeft > 0 ? (
                    <Text fontSize="14px" color="gray.600">
                      Code expires in: <strong>{formatTime(timeLeft)}</strong>
                    </Text>
                  ) : (
                    <Text fontSize="14px" color="red.500">
                      Code has expired
                    </Text>
                  )}
                </Box>
              </>
            ) : (
              <>
                {/* Password Change Step */}

                {/* New Password */}
                <Box mb={6}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.800"
                    mb={2}
                    display="flex"
                    alignItems="center"
                  >
                    New Password
                    <Box
                      as="span"
                      color="red.500"
                      ml={1}
                      fontSize="md"
                      aria-label="required"
                    >
                      *
                    </Box>
                  </Text>
                  <Box position="relative">
                    <Input
                      type={showPasswords.new ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) =>
                        handleInputChange("newPassword", e.target.value)
                      }
                      onBlur={() => handleInputBlur("newPassword")}
                      placeholder="Enter new password"
                      borderRadius="md"
                      border="1px solid"
                      borderColor={
                        hasSubmitted && errors.newPassword
                          ? "red.500"
                          : "#E5E7EB"
                      }
                      px={3}
                      py={3}
                      fontSize="sm"
                      color="black"
                      _focus={{
                        borderColor:
                          hasSubmitted && errors.newPassword
                            ? "red.500"
                            : "#3B82F6",
                        boxShadow:
                          hasSubmitted && errors.newPassword
                            ? "0 0 0 1px #ef4444"
                            : "0 0 0 1px #3B82F6",
                      }}
                      _placeholder={{
                        color: "gray.400",
                      }}
                      tabIndex={0}
                      aria-label="New password input"
                    />
                    <Icon
                      as={showPasswords.new ? FiEyeOff : FiEye}
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      boxSize={5}
                      color="gray.400"
                      cursor="pointer"
                      tabIndex={0}
                      role="button"
                      aria-label={
                        showPasswords.new ? "Hide password" : "Show password"
                      }
                      onClick={() => togglePasswordVisibility("new")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          togglePasswordVisibility("new");
                        }
                      }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                    />
                  </Box>
                  {hasSubmitted && errors.newPassword && (
                    <Text color="red.500" fontSize="12px" mt={1}>
                      {errors.newPassword}
                    </Text>
                  )}
                </Box>

                {/* Repeat Password */}
                <Box mb={8}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.800"
                    mb={2}
                    display="flex"
                    alignItems="center"
                  >
                    Confirm Password
                    <Box
                      as="span"
                      color="red.500"
                      ml={1}
                      fontSize="md"
                      aria-label="required"
                    >
                      *
                    </Box>
                  </Text>
                  <Box position="relative">
                    <Input
                      type={showPasswords.repeat ? "text" : "password"}
                      value={formData.repeatPassword}
                      onChange={(e) =>
                        handleInputChange("repeatPassword", e.target.value)
                      }
                      onBlur={() => handleInputBlur("repeatPassword")}
                      placeholder="Repeat new password"
                      borderRadius="md"
                      border="1px solid"
                      borderColor={
                        hasSubmitted && errors.repeatPassword
                          ? "red.500"
                          : "#E5E7EB"
                      }
                      px={3}
                      py={3}
                      fontSize="sm"
                      color="black"
                      _focus={{
                        borderColor:
                          hasSubmitted && errors.repeatPassword
                            ? "red.500"
                            : "#3B82F6",
                        boxShadow:
                          hasSubmitted && errors.repeatPassword
                            ? "0 0 0 1px #ef4444"
                            : "0 0 0 1px #3B82F6",
                      }}
                      _placeholder={{
                        color: "gray.400",
                      }}
                      tabIndex={0}
                      aria-label="Repeat password input"
                    />
                    <Icon
                      as={showPasswords.repeat ? FiEyeOff : FiEye}
                      position="absolute"
                      right={3}
                      top="50%"
                      transform="translateY(-50%)"
                      boxSize={5}
                      color="gray.400"
                      cursor="pointer"
                      tabIndex={0}
                      role="button"
                      aria-label={
                        showPasswords.repeat ? "Hide password" : "Show password"
                      }
                      onClick={() => togglePasswordVisibility("repeat")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          togglePasswordVisibility("repeat");
                        }
                      }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                    />
                  </Box>
                  {hasSubmitted && errors.repeatPassword && (
                    <Text color="red.500" fontSize="12px" mt={1}>
                      {errors.repeatPassword}
                    </Text>
                  )}
                </Box>
              </>
            )}
          </Box>

          {/* Action Buttons - Fixed at bottom */}
          <Box px={6} py={4} bg="white">
            {currentStep === "email" ? (
              <Flex gap={4} w="full">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  border="1px solid #D1D5DB"
                  color="black"
                  bg="white"
                  borderRadius="md"
                  flex={1}
                  py={3}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    bg: "#F9FAFB",
                    borderColor: "#9CA3AF",
                  }}
                  _active={{
                    bg: "#F3F4F6",
                  }}
                  tabIndex={0}
                  aria-label="Cancel email verification"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCancel();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendVerificationCode}
                  loading={otpLoading}
                  loadingText="Sending..."
                  disabled={emailLoading || !emailData.email}
                  bg="#8a37f7"
                  color="white"
                  borderRadius="md"
                  flex={1}
                  py={3}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    bg:
                      emailLoading || !emailData.email ? "#8a37f7" : "#7a2ee6",
                  }}
                  _active={{
                    bg:
                      emailLoading || !emailData.email ? "#8a37f7" : "#6a1dd9",
                  }}
                  tabIndex={0}
                  aria-label="Send verification code"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (!emailLoading && emailData.email) {
                        handleSendVerificationCode();
                      }
                    }
                  }}
                >
                  Send OTP
                </Button>
              </Flex>
            ) : currentStep === "otp" ? (
              <Flex direction="column" gap={4} w="full">
                <Button
                  onClick={handleVerifyOtp}
                  loading={otpLoading}
                  loadingText="Verifying..."
                  disabled={otpString.length !== 6}
                  bg="#8a37f7"
                  color="white"
                  borderRadius="md"
                  w="full"
                  py={3}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    bg: otpString.length !== 6 ? "#8a37f7" : "#7a2ee6",
                  }}
                  _active={{
                    bg: otpString.length !== 6 ? "#8a37f7" : "#6a1dd9",
                  }}
                  tabIndex={0}
                  aria-label="Verify OTP"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (otpString.length === 6) {
                        handleVerifyOtp();
                      }
                    }
                  }}
                >
                  Verify OTP
                </Button>

                <Flex gap={4} w="full">
                  <Button
                    onClick={() => setCurrentStep("email")}
                    variant="outline"
                    border="1px solid #D1D5DB"
                    color="black"
                    bg="white"
                    borderRadius="md"
                    flex={1}
                    py={3}
                    fontSize="sm"
                    fontWeight="medium"
                    _hover={{
                      bg: "#F9FAFB",
                      borderColor: "#9CA3AF",
                    }}
                    _active={{
                      bg: "#F3F4F6",
                    }}
                    tabIndex={0}
                    aria-label="Back to email"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setCurrentStep("email");
                      }
                    }}
                  >
                    Back
                  </Button>

                  {canResend && (
                    <Button
                      onClick={handleResendOTP}
                      loading={otpLoading}
                      loadingText="Resending..."
                      variant="outline"
                      border="1px solid #8a37f7"
                      color="#8a37f7"
                      bg="white"
                      borderRadius="md"
                      flex={1}
                      py={3}
                      fontSize="sm"
                      fontWeight="medium"
                      _hover={{
                        bg: "#f4edfe",
                        borderColor: "#7a2ee6",
                      }}
                      _active={{
                        bg: "#e9d5ff",
                      }}
                      tabIndex={0}
                      aria-label="Resend OTP"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleResendOTP();
                        }
                      }}
                    >
                      Resend OTP
                    </Button>
                  )}
                </Flex>
              </Flex>
            ) : (
              <Flex gap={4} w="full">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  border="1px solid #D1D5DB"
                  color="black"
                  bg="white"
                  borderRadius="md"
                  flex={1}
                  py={3}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    bg: "#F9FAFB",
                    borderColor: "#9CA3AF",
                  }}
                  _active={{
                    bg: "#F3F4F6",
                  }}
                  tabIndex={0}
                  aria-label="Cancel password change"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCancel();
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  loading={loading}
                  loadingText="Saving..."
                  bg="#8a37f7"
                  color="white"
                  borderRadius="md"
                  flex={1}
                  py={3}
                  fontSize="sm"
                  fontWeight="medium"
                  _hover={{
                    bg: "#7a2ee6",
                  }}
                  _active={{
                    bg: "#6a1dd9",
                  }}
                  tabIndex={0}
                  aria-label="Save password changes"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                >
                  Save
                </Button>
              </Flex>
            )}
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default ChangePasswordPage;
