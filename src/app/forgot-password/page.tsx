"use client";

import { Flex, Box, Heading, Text, Input, Link, IconButton } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { requestPasswordReset } from "@/app/api/forgot-password/routes";
import { toaster } from "@/components/ui/toaster";
import Logo from "@/components/svgs/logo";

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill email from URL parameter if available
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmailOrPhone(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push("/");
  };

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailOrPhone(value);
    if (value.trim() === "") {
      setEmailError("Email is required");
    } else if (emailError) {
      setEmailError("");
    }
  };

  const handleEmailOrPhoneBlur = () => {
    if (!emailOrPhone.trim()) {
      setEmailError("Email is required");
    }
  };

  const validateEmailOrPhone = () => {
    if (!emailOrPhone.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?91([6-9]\d{9})$|^([6-9]\d{9})$/;
    if (emailRegex.test(emailOrPhone)) {
      setEmailError("");
      return true;
    } else if (phoneRegex.test(emailOrPhone)) {
      const digits = emailOrPhone.replace(/\D/g, "");
      if (digits.length !== 10) {
        setEmailError("Phone number must be exactly 10 digits");
        return false;
      } else {
        setEmailError("");
        return true;
      }
    } else {
      setEmailError("Please enter a valid email address");
      return false;
    }
  };

  const handleVerify = async () => {
    if (!validateEmailOrPhone()) return;

    setIsLoading(true);
    try {
      const response = await requestPasswordReset({ email: emailOrPhone });

      if (response.success) {
        toaster.success({
          title: "OTP Sent",
          description: response.message,
        });

        // Navigate to verify OTP page
        router.push(`/verify-otp?email=${encodeURIComponent(emailOrPhone)}`);
      }
    } catch (error: unknown) {
      toaster.error({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box w="full" minH="100vh" bg="white">
      {/* Desktop Header Banner */}
      <Box
        display={{ base: "none", md: "flex" }}
        bg="#8A38F5"
        w="full"
        h="70px"
        px={8}
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Back Button */}
        <IconButton
          aria-label="Go back to sign in"
          onClick={handleBack}
          bg="transparent"
          color="white"
          fontSize="24px"
          _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
          _active={{ bg: "rgba(255, 255, 255, 0.2)" }}
          tabIndex={0}
        >
          <FiChevronLeft />
        </IconButton>
        
        {/* Logo and Title */}
        <Box
          bg="white"
          w="200px"
          h="50px"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="flex-start"
          pl={2}
        >
          <Box 
            w="57.245px"
            h="50px"
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
          >
            <Logo />
          </Box>
          <Text
            color="gray.800"
            fontFamily="Roboto, sans-serif"
            fontWeight="600"
            fontSize="16px"
            lineHeight="24px"
            letterSpacing="0%"
            w="112px"
            h="24px"
            ml={1}
            whiteSpace="nowrap"
          >
            HCM Cafe VMS
          </Text>
        </Box>
        
        {/* Spacer for centering */}
        <Box w="48px" />
      </Box>

      {/* Desktop Background with Decorative Elements */}
      <Box
        display={{ base: "none", md: "block" }}
        position="relative"
        h="calc(100vh - 70px)"
        bg="#F0E6FF"
        overflow="hidden"
      >
        {/* Layout Container - 20% | 60% | 20% */}
        <Flex
          h="calc(100vh - 70px)"
          position="relative"
          zIndex={2}
        >
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
          <Flex
            w="60%"
            h="full"
            align="center"
            justify="center"
            px={2}
          >
            <Box
              bg="white"
              borderRadius="lg"
              p={8}
              boxShadow="xl"
              w="400px"
              h="540px"
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
            {/* Desktop Form Content */}
            <Box display={{ base: "none", md: "flex" }} flex="1" flexDirection="column" justifyContent="center">
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
                Forgot Password
              </Heading>

              <Text fontSize="10px" color="gray.500" mb={6} textAlign="center">
                Enter your registered email address to reset your password
              </Text>

              {/* Email Field */}
              <Box mb={4}>
                <Text fontSize="13px" fontWeight="bold" mb={1} color="gray.800">
                  Email{" "}
                  <Box as="span" color="red.500">
                    *
                  </Box>
                </Text>
                <Input
                  placeholder="Enter your Email"
                  id="email"
                  name="email"
                  type="email"
                  value={emailOrPhone}
                  onChange={handleEmailOrPhoneChange}
                  onBlur={handleEmailOrPhoneBlur}
                  size="md"
                  borderRadius="md"
                  bg="white"
                  borderColor={emailError ? "red.500" : undefined}
                  _focus={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                  _active={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                  fontSize="13px"
                  color="black"
                  tabIndex={0}
                  aria-label="Enter your email address"
                  h="40px"
                />
                {emailError && (
                  <Text color="red.500" fontSize="12px" mt={1}>
                    {emailError}
                  </Text>
                )}
              </Box>

              {/* Send OTP Button */}
              <PrimaryButton
                ariaLabel="Send OTP"
                onClick={handleVerify}
                isLoading={isLoading}
                loadingText="Sending OTP..."
              >
                Send OTP
              </PrimaryButton>

              <Box textAlign="center" mt={3} fontSize="12px" color="gray.500">
                <Text>By signing up or logging in, I accept the apps</Text>
                <Text>
                  <Link href="#" color="purple.500" textDecor="underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="#" color="purple.500" textDecor="underline">
                    Privacy Policy
                  </Link>
                </Text>
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
        <Flex direction="column" minH="100vh" px={6} pt={3} pb={4}>
          {/* Back Button and Logo */}
          <Flex w="full" justify="space-between" alignItems="center" mb={4}>
            <IconButton
              aria-label="Go back to sign in"
              onClick={handleBack}
              bg="transparent"
              color="gray.600"
              fontSize="24px"
              _hover={{ bg: "gray.100" }}
              _active={{ bg: "gray.200" }}
              tabIndex={0}
            >
              <FiChevronLeft />
            </IconButton>
            <Box transform="translateX(-8px)">
              <Logo />
            </Box>
            {/* Spacer for centering */}
            <Box w="48px" />
          </Flex>

          <Box flex="1" mt={8}>
            <Heading
              as="h1"
              fontSize="20px"
              fontWeight="semibold"
              color="gray.900"
              mb={2}
            >
              Forgot Password
            </Heading>
            <Text fontSize="13px" color="gray.500" mb={6}>
              Enter your registered email address to reset your password.
            </Text>

            <Box mb={6}>
              <Box mb={1}>
                <Text
                  fontWeight="bold"
                  fontSize="14px"
                  as="label"
                  color="gray.800"
                  display="flex"
                  alignItems="center"
                >
                  Email
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
              <Input
                placeholder="Enter your Email"
                id="phone"
                name="phone"
                type="email"
                value={emailOrPhone}
                onChange={handleEmailOrPhoneChange}
                onBlur={handleEmailOrPhoneBlur}
                bg="white"
                borderColor={emailError ? "red.500" : undefined}
                _focus={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                _active={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                color="gray.800"
                borderRadius="md"
                size="md"
              />
              {emailError && (
                <Text color="red.500" fontSize="12px" mt={1}>
                  {emailError}
                </Text>
              )}
            </Box>
          </Box>

          {/* Fixed Bottom Section */}
          <Box py={4}>
            <PrimaryButton
              ariaLabel="Send OTP"
              onClick={handleVerify}
              isLoading={isLoading}
              loadingText="Sending OTP..."
            >
              Send OTP
            </PrimaryButton>

            <Box textAlign="center" mt={3} fontSize="12px" color="gray.500">
              <Text>By signing up or logging in, I accept the apps</Text>
              <Text>
                <Link href="#" color="purple.500" textDecor="underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" color="purple.500" textDecor="underline">
                  Privacy Policy
                </Link>
              </Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
