"use client";

import {
  Flex,
  Box,
  Heading,
  Text,
  Button,
  Input,
} from "@chakra-ui/react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyOTP } from "@/app/api/forgot-password/routes";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import Logo from "@/components/svgs/logo";

const VerifyOTP: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value;
    setOtpCode(newOtpCode);

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
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtpCode = [...otpCode];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtpCode[i] = pastedData[i];
    }

    setOtpCode(newOtpCode);

    // Focus the next empty input or the last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const otpString = otpCode.join("");

  const handleVerify = async () => {
    if (!otpString.trim()) {
      setOtpError("OTP code is required");
      return;
    }

    if (otpString.length !== 6) {
      setOtpError("OTP code must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOTP({ email, otpCode: otpString });

      if (response.success) {
        toaster.success({
          title: "OTP Verified",
          description: response.message,
        });

        // Navigate to reset password page
        router.push(
          `/reset-password?email=${encodeURIComponent(email)}&otp=${otpString}`
        );
      }
    } catch (error: unknown) {
      setOtpError(error instanceof Error ? error.message : "Invalid OTP. Please try again.");
      toaster.error({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Invalid OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${FRONTEND_URL}/api/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setTimeLeft(600); // Reset timer
        setCanResend(false);
        setOtpCode(["", "", "", "", "", ""]);
        setOtpError("");
        toaster.success({
          title: "OTP Resent",
          description: "A new OTP has been sent to your email",
        });
      } else {
        throw new Error(data.message || "Failed to resend OTP");
      }
    } catch (error: unknown) {
      toaster.error({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push(`/forgot-password`);
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
                Verify OTP
              </Heading>

              <Text fontSize="10px" color="gray.500" mb={6} textAlign="center">
                Enter the 6-digit code sent to <strong>{email}</strong>
              </Text>

              {/* OTP Input Fields */}
              <Box mb={4}>
                <Text fontSize="13px" fontWeight="bold" mb={4} color="gray.800" textAlign="center">
                  Verification Code{" "}
                  <Box as="span" color="red.500">
                    *
                  </Box>
                </Text>

                <Box display="flex" justifyContent="center" mb={2} gap={2}>
                  {otpCode.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
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
                  <Text color="red.500" fontSize="12px" mt={2} textAlign="center">
                    {otpError}
                  </Text>
                )}
              </Box>

              {/* Timer */}
              <Box textAlign="center" mb={4}>
                {timeLeft > 0 ? (
                  <Text fontSize="12px" color="gray.600">
                    Code expires in: <strong>{formatTime(timeLeft)}</strong>
                  </Text>
                ) : (
                  <Text fontSize="12px" color="red.500">
                    Code has expired
                  </Text>
                )}
              </Box>

              {/* Verify Button */}
              <PrimaryButton
                ariaLabel="Verify OTP"
                onClick={handleVerify}
                isLoading={isLoading}
                loadingText="Verifying..."
                isDisabled={otpString.length !== 6}
              >
                Verify OTP
              </PrimaryButton>

               {/* Action Links */}
               <Flex justify="center" mt={4} gap={4}>
                 <Button
                   variant="ghost"
                   color="purple.500"
                   fontSize="12px"
                   onClick={handleBack}
                   disabled={isLoading}
                 >
                   Back to Email
                 </Button>

                 {canResend && (
                   <Button
                     variant="ghost"
                     color="purple.500"
                     fontSize="12px"
                     onClick={handleResendOTP}
                     loading={isLoading}
                     loadingText="Resending..."
                   >
                     Resend OTP
                   </Button>
                 )}
               </Flex>

              <Box textAlign="center" mt={3} fontSize="12px" color="gray.500">
                <Text>Didn&apos;t receive the code? Check your spam folder</Text>
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
          {/* Logo */}
          <Flex w="full" justify="flex-start" mb={4}>
            <Box transform="translateX(-8px)">
              <Logo />
            </Box>
          </Flex>

          <Box flex="1" mt={8}>
            <Heading
              as="h1"
              fontSize="20px"
              fontWeight="semibold"
              color="gray.900"
              mb={2}
            >
              Verify OTP
            </Heading>
            <Text fontSize="13px" color="gray.500" mb={6}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </Text>

            <Box mb={6}>
              <Box mb={4}>
                <Text
                  fontWeight="bold"
                  fontSize="14px"
                  as="label"
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
                {otpCode.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
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
                <Text color="red.500" fontSize="12px" mt={2} textAlign="center">
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
          </Box>

          {/* Fixed Bottom Section */}
          <Box py={4}>
            <PrimaryButton
              ariaLabel="Verify OTP"
              onClick={handleVerify}
              isLoading={isLoading}
              loadingText="Verifying..."
              isDisabled={otpString.length !== 6}
            >
              Verify OTP
            </PrimaryButton>

            <Flex justify="center" mt={4} gap={4}>
              <Button
                variant="ghost"
                color="purple.500"
                fontSize="14px"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back to Email
              </Button>

              {canResend && (
                <Button
                  variant="ghost"
                  color="purple.500"
                  fontSize="14px"
                  onClick={handleResendOTP}
                  loading={isLoading}
                  loadingText="Resending..."
                >
                  Resend OTP
                </Button>
              )}
            </Flex>

            <Box textAlign="center" mt={3} fontSize="12px" color="gray.500">
              <Text>Didn&apos;t receive the code? Check your spam folder</Text>
            </Box>
          </Box>
        </Flex>
      </Box>
    </Box>
  );
};

export default VerifyOTP;
