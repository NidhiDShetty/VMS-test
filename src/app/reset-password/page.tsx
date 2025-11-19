"use client";

import { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  Link,
  IconButton,
} from "@chakra-ui/react";
import { LuEye, LuEyeOff } from "react-icons/lu";
import { FiChevronLeft } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/app/api/forgot-password/routes";
import { toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import Logo from "@/components/svgs/logo";

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || searchParams.get("user");
  const otpCode = searchParams.get("otp");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Redirect if no email or OTP
  useEffect(() => {
    if (!email) {
      router.push(`/forgot-password`);
      return;
    }
    if (!otpCode) {
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
      return;
    }
  }, [email, otpCode, router]);

  const handleSubmit = async () => {
    setHasSubmitted(true);
    setError("");

    if (!password && !confirmPassword) {
      setError("Both fields are required");
      return;
    }
    if (!confirmPassword) {
      setError("Enter the confirm password");
      return;
    }
    if (!password) {
      setError("Both fields are required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password.length > 128) {
      setError("Password must not exceed 128 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!email || !otpCode) {
      setError("Missing email or OTP information");
      return;
    }
    setLoading(true);
    try {
      const res = await resetPassword({
        email,
        otpCode,
        newPassword: password,
      });
      toaster.success({
        title: "Password Reset Successful",
        description: res?.message,
      });
      router.push("/"); // Navigate to sign-in page
    } catch (err: unknown) {
      let message = "Failed to reset password";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
      ) {
        message = (err as { message?: string }).message || message;
      }
      setError(message);
      toaster.error({
        title: "Password Reset Failed",
        description: message,
      });
    } finally {
      setLoading(false);
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
        justifyContent="center"
      >
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
              h="auto"
              display="flex"
              flexDirection="column"
              justifyContent="center"
            >
            {/* Desktop Form Content */}
            <Box display={{ base: "none", md: "flex" }} flex="1" flexDirection="column" justifyContent="center">
              {/* Desktop Logo in Form */}
              <Flex justify="center" mb={3}>
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
                Reset Password
              </Heading>

              <Text fontSize="10px" color="gray.500" mb={4} textAlign="center">
                Enter your new password and confirm it
              </Text>

              {/* Password Field */}
              <Box mb={3}>
                <Text fontSize="13px" fontWeight="bold" mb={1} color="gray.800">
                  Password{" "}
                  <Box as="span" color="red.500">
                    *
                  </Box>
                </Text>
                <InputGroup
                  endElement={
                    <Box
                      as="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <LuEyeOff /> : <LuEye />}
                    </Box>
                  }
                >
                  <Input
                    placeholder="Enter your new Password"
                    type={showPassword ? "text" : "password"}
                    size="md"
                    borderRadius="md"
                    bg="white"
                    borderColor={
                      hasSubmitted &&
                      error &&
                      (!password ||
                        error === "Both fields are required" ||
                        error === "Passwords do not match")
                        ? "red.500"
                        : undefined
                    }
                    _focus={{
                      borderColor:
                        hasSubmitted &&
                        error &&
                        (!password ||
                          error === "Both fields are required" ||
                          error === "Passwords do not match")
                          ? "red.500"
                          : "#8A38F5",
                    }}
                    _active={{
                      borderColor:
                        hasSubmitted &&
                        error &&
                        (!password ||
                          error === "Both fields are required" ||
                          error === "Passwords do not match")
                          ? "red.500"
                          : "#8A38F5",
                    }}
                    fontSize="13px"
                    color="black"
                    tabIndex={0}
                    aria-label="Enter your new password"
                    h="40px"
                    value={password}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPassword(value);
                      if (hasSubmitted) {
                        if (!value && !confirmPassword) {
                          setError("Both fields are required");
                        } else if (!value) {
                          setError("Both fields are required");
                        } else if (value.length < 8) {
                          setError("Password must be at least 8 characters");
                        } else if (value.length > 128) {
                          setError("Password must not exceed 128 characters");
                        } else if (!confirmPassword) {
                          setError("Enter the confirm password");
                        } else if (value !== confirmPassword) {
                          setError("Passwords do not match");
                        } else {
                          setError("");
                        }
                      }
                    }}
                  />
                </InputGroup>
              </Box>

              {/* Confirm Password Field */}
              <Box mb={3}>
                <Text fontSize="13px" fontWeight="bold" mb={1} color="gray.800">
                  Confirm Password{" "}
                  <Box as="span" color="red.500">
                    *
                  </Box>
                </Text>
                <InputGroup
                  endElement={
                    <Box
                      as="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                    </Box>
                  }
                >
                  <Input
                    placeholder="Re-enter Password"
                    type={showConfirmPassword ? "text" : "password"}
                    size="md"
                    borderRadius="md"
                    bg="white"
                    borderColor={
                      hasSubmitted &&
                      error &&
                      (!confirmPassword ||
                        error === "Both fields are required" ||
                        error === "Passwords do not match")
                        ? "red.500"
                        : undefined
                    }
                    _focus={{
                      borderColor:
                        hasSubmitted &&
                        error &&
                        (!confirmPassword ||
                          error === "Both fields are required" ||
                          error === "Passwords do not match")
                          ? "red.500"
                          : "#8A38F5",
                    }}
                    _active={{
                      borderColor:
                        hasSubmitted &&
                        error &&
                        (!confirmPassword ||
                          error === "Both fields are required" ||
                          error === "Passwords do not match")
                          ? "red.500"
                          : "#8A38F5",
                    }}
                    fontSize="13px"
                    color="black"
                    tabIndex={0}
                    aria-label="Confirm your new password"
                    h="40px"
                    value={confirmPassword}
                    onChange={(e) => {
                      const value = e.target.value;
                      setConfirmPassword(value);
                      if (hasSubmitted) {
                        if (!password && !value) {
                          setError("Both fields are required");
                        } else if (!value) {
                          setError("Enter the confirm password");
                        } else if (!password) {
                          setError("Both fields are required");
                        } else if (password.length < 8) {
                          setError("Password must be at least 8 characters");
                        } else if (password.length > 128) {
                          setError("Password must not exceed 128 characters");
                        } else if (password !== value) {
                          setError("Passwords do not match");
                        } else {
                          setError("");
                        }
                      }
                    }}
                  />
                </InputGroup>
                {hasSubmitted && error && (
                  <Text color="red.500" fontSize="12px" mt={1}>
                    {error}
                  </Text>
                )}
              </Box>

              {/* Update Password Button */}
              <PrimaryButton
                ariaLabel="Update password button"
                onClick={handleSubmit}
                isLoading={loading}
                loadingText="Updating Password..."
              >
                Update Password
              </PrimaryButton>

              <Box textAlign="center" mt={2} fontSize="12px" color="gray.500">
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
      <Flex direction="column" minH="100vh" px={6} pt={6} pb={4}>
        {/* Back Button */}
        <IconButton
          aria-label="Go back to verify OTP"
          variant="ghost"
          size="sm"
          color="black"
          onClick={() =>
            router.push(`/verify-otp?email=${encodeURIComponent(email || "")}`)
          }
          _hover={{ bg: "gray.100" }}
          _active={{ bg: "gray.200" }}
          alignSelf="flex-start"
          mb={4}
        >
          <FiChevronLeft />
        </IconButton>

        {/* Top content */}
        <Box flex="1">
          {/* Header */}
          <Box mb={6}>
            <Heading
              fontSize="20px"
              fontWeight="semibold"
              color="gray.900"
              mb={2}
            >
              Reset Password
            </Heading>
            <Text fontSize="13px" color="gray.500">
              Enter your new password and confirm it
            </Text>
          </Box>

          {/* Password Input */}
          <Box mb={4}>
            <Text
              fontSize="14px"
              fontWeight="bold"
              mb={1}
              color="gray.800"
              display="flex"
              alignItems="center"
            >
              Password
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
            <InputGroup
              endElement={
                <Box
                  as="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </Box>
              }
            >
              <Input
                size="xs"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new Password"
                fontSize="12px"
                borderRadius="md"
                bg="white"
                borderColor={
                  hasSubmitted &&
                  error &&
                  (!password ||
                    error === "Both fields are required" ||
                    error === "Passwords do not match")
                    ? "red.500"
                    : "gray.300"
                }
                _focus={{
                  borderColor:
                    hasSubmitted &&
                    error &&
                    (!password ||
                      error === "Both fields are required" ||
                      error === "Passwords do not match")
                      ? "red.500"
                      : "#8A38F5",
                }}
                _active={{
                  borderColor:
                    hasSubmitted &&
                    error &&
                    (!password ||
                      error === "Both fields are required" ||
                      error === "Passwords do not match")
                      ? "red.500"
                      : "#8A38F5",
                }}
                color="black"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  if (hasSubmitted) {
                    if (!value && !confirmPassword) {
                      setError("Both fields are required");
                    } else if (!value) {
                      setError("Both fields are required");
                    } else if (value.length < 8) {
                      setError("Password must be at least 8 characters");
                    } else if (value.length > 128) {
                      setError("Password must not exceed 128 characters");
                    } else if (!confirmPassword) {
                      setError("Enter the confirm password");
                    } else if (value !== confirmPassword) {
                      setError("Passwords do not match");
                    } else {
                      setError("");
                    }
                  }
                }}
              />
            </InputGroup>
          </Box>

          {/* Confirm Password Input */}
          <Box mb={4}>
            <Text
              fontSize="14px"
              fontWeight="bold"
              mb={1}
              color="gray.800"
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
            <InputGroup
              endElement={
                <Box
                  as="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <LuEyeOff /> : <LuEye />}
                </Box>
              }
            >
              <Input
                size="xs"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter Password"
                fontSize="12px"
                borderRadius="md"
                bg="white"
                borderColor={
                  hasSubmitted &&
                  error &&
                  (!confirmPassword ||
                    error === "Both fields are required" ||
                    error === "Passwords do not match")
                    ? "red.500"
                    : "gray.300"
                }
                _focus={{
                  borderColor:
                    hasSubmitted &&
                    error &&
                    (!confirmPassword ||
                      error === "Both fields are required" ||
                      error === "Passwords do not match")
                      ? "red.500"
                      : "#8A38F5",
                }}
                _active={{
                  borderColor:
                    hasSubmitted &&
                    error &&
                    (!confirmPassword ||
                      error === "Both fields are required" ||
                      error === "Passwords do not match")
                      ? "red.500"
                      : "#8A38F5",
                }}
                color="black"
                value={confirmPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setConfirmPassword(value);
                  if (hasSubmitted) {
                    if (!password && !value) {
                      setError("Both fields are required");
                    } else if (!value) {
                      setError("Enter the confirm password");
                    } else if (!password) {
                      setError("Both fields are required");
                    } else if (password.length < 8) {
                      setError("Password must be at least 8 characters");
                    } else if (password.length > 128) {
                      setError("Password must not exceed 128 characters");
                    } else if (password !== value) {
                      setError("Passwords do not match");
                    } else {
                      setError("");
                    }
                  }
                }}
              />
            </InputGroup>
            {hasSubmitted && error && (
              <Text color="red.500" fontSize="12px" mt={1}>
                {error}
              </Text>
            )}
          </Box>
        </Box>

        {/* Bottom Fixed Section */}
        <Box mt={4}>
          <PrimaryButton
            onClick={handleSubmit}
            ariaLabel="Reset password button"
            isLoading={loading}
          >
            Update Password
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
}
