"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Link,
  InputGroup,
} from "@chakra-ui/react";
import Image from "next/image";
import { LuEye, LuEyeOff } from "react-icons/lu";
import Logo from "@/components/svgs/logo";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SplashScreen from "@/components/ui/SplashScreen";
import DashboardSplash from "@/components/ui/DashboardSplash";
import { loginUser } from "@/app/api/auth/routes";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL, INTERNAL_ROUTES } from "@/lib/server-urls";


// Convert technical error messages to user-friendly ones
const convertToUserFriendlyMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Handle timeout errors
  if (lowerMessage.includes('timeout') || 
      lowerMessage.includes('failed to cancel request') ||
      lowerMessage.includes('request timed out')) {
    return "Login request timed out, please try again";
  }
  
  // Handle connection errors
  if (lowerMessage.includes('connection') || 
      lowerMessage.includes('network') ||
      lowerMessage.includes('server') ||
      lowerMessage.includes('unable to connect')) {
    return "Unable to connect to server, please try again";
  }
  
  // Handle SQL/database errors
  if (lowerMessage.includes('select') || 
      lowerMessage.includes('from') ||
      lowerMessage.includes('where') ||
      lowerMessage.includes('sql') ||
      lowerMessage.includes('database')) {
    return "Login service temporarily unavailable, please try again";
  }
  
  // Handle authentication errors
  if (lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('invalid token')) {
    return "Authentication failed, please try again";
  }
  
  // Handle server errors
  if (lowerMessage.includes('internal server error') ||
      lowerMessage.includes('500') ||
      lowerMessage.includes('service unavailable')) {
    return "Service temporarily unavailable, please try again";
  }
  
  // Return original message if no specific pattern matches
  return message;
};

export default function Home() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showDashboardSplash, setShowDashboardSplash] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const splashSeen = sessionStorage.getItem("signinSplashSeen");

    if (splashSeen) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("signinSplashSeen", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Check if user is already logged in
    if (!showSplash) {
      const authData = localStorage.getItem("authData");
      if (authData) {
        // Redirect to dashboard - role-based routing will be handled there
        window.location.href = `${FRONTEND_URL}${INTERNAL_ROUTES.DASHBOARD}`;
      }
      setIsAuthChecking(false);
    }
  }, [showSplash]);

  // Prevent any profile loading attempts when on login page
  useEffect(() => {
    // Clear any cached profile data when on login page to prevent loading issues
    if (typeof window !== "undefined" && window.location.pathname === "/vmsapp/") {
      sessionStorage.removeItem("profileData");
      sessionStorage.removeItem("profileImage");
    }
  }, []);

  // Handle dashboard splash redirect
  useEffect(() => {
    if (showDashboardSplash) {
      const timer = setTimeout(() => {
        sessionStorage.setItem("justLoggedIn", "true");
        // Redirect to dashboard - role-based routing will be handled there
        window.location.href = `${FRONTEND_URL}${INTERNAL_ROUTES.DASHBOARD}`;
      }, 2500); // 2.5 seconds

      return () => clearTimeout(timer);
    }
  }, [showDashboardSplash]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError("");
  };

  const handleEmailOrPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOrPhone(e.target.value);
    if (emailError) setEmailError("");
  };

  const validateEmailForForgotPassword = () => {
    if (!emailOrPhone.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailOrPhone)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleForgotPasswordClick = () => {
    if (validateEmailForForgotPassword()) {
      // Navigate to forgot password page with the email pre-filled
      window.location.href = `${FRONTEND_URL}/forgot-password?email=${encodeURIComponent(emailOrPhone)}`;
    }
  };

  // 2. Login logic: email + password
  const handleLogin = async () => {
    let hasError = false;
    setEmailError("");
    setPasswordError("");

    if (!emailOrPhone.trim()) {
      setEmailError("Email is required");
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) return;

    setIsLoggingIn(true);

    try {
      const res = await loginUser({
        email: emailOrPhone,
        password: password,
      });
      // Store only the token for authentication
      localStorage.setItem("authData", JSON.stringify({ token: res.token }));

      // Show success toast immediately
      toaster.success({
        title: "Sign-in Successful",
        description: "Sign-in Successful",
      });

      setShowDashboardSplash(true);
    } catch (err: unknown) {
      let message = "Invalid email or password";
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: string }).message === "string"
      ) {
        message = (err as { message?: string }).message || message;
      }
      
      // Convert technical error messages to user-friendly ones
      const userFriendlyMessage = convertToUserFriendlyMessage(message);
      
      // Set error for the correct field only and clear the other
      if (message === "enter valid email" || message === "Enter valid Email") {
        setEmailError("Enter valid Email");
        setPasswordError("");
      } else if (
        message === "enter valid password" ||
        message === "Enter valid Password"
      ) {
        setPasswordError("Enter valid Password");
        setEmailError("");
      } else {
        setPasswordError(userFriendlyMessage);
        setEmailError("");
      }
      toaster.error({
        title: "Sign-in Failed",
        description: userFriendlyMessage,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (showSplash) return <SplashScreen />;
  if (isAuthChecking) return <SplashScreen />;
  if (showDashboardSplash) return <DashboardSplash />;

  return (
    <Box h="100vh" bg={{ base: "white", md: "gray.800" }} overflow="hidden">
        {/* Desktop Header Banner - Custom for Login Page */}
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
                <Box 
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  w="auto"
                  h="auto"
                >
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
                whiteSpace="nowrap" // Ensure header text stays in one line
              >
                Sign In
              </Heading>

              {/* Email Field */}
              <Box mb={4}>
                <Text fontSize="13px" fontWeight="bold" mb={1} color="gray.800">
                  Email{" "}
                  <Box as="span" color="red.500">
                    *
                  </Box>
                </Text>
                <Input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="email"
                  placeholder="Enter your Email "
                  value={emailOrPhone}
                  onChange={handleEmailOrPhoneChange}
                  onKeyDown={handleInputKeyDown}
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

              {/* Password Field */}
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
                    tabIndex={0}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <LuEyeOff /> : <LuEye />}
                  </Box>
                }
              >
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your Password"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handleInputKeyDown}
                  size="md"
                  borderRadius="md"
                  bg="white"
                  borderColor={passwordError ? "red.500" : undefined}
                  _focus={{ borderColor: passwordError ? "red.500" : "#8A38F5" }}
                  _active={{ borderColor: passwordError ? "red.500" : "#8A38F5" }}
                  fontSize="13px"
                  color="black"
                  tabIndex={0}
                  aria-label="Enter your password"
                  h="40px"
                />
              </InputGroup>
              {/* Show error only once below password field */}
              {passwordError && (
                <Text color="red.500" fontSize="12px" mt={1}>
                  {passwordError}
                </Text>
              )}
              {/* Forgot Password Link */}
              <Flex justify="flex-end" mt={3}>
                <Box
                  as="button"
                  onClick={handleForgotPasswordClick}
                  fontFamily="Roboto, sans-serif"
                  fontWeight={300}
                  fontStyle="normal"
                  fontSize="12px"
                  lineHeight="24px"
                  letterSpacing="0"
                  color="#0056C9"
                  textAlign="center"
                  verticalAlign="middle"
                  tabIndex={0}
                  aria-label="Forgot Password"
                  bg="#FFFFFF"
                  border="none"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                  _focus={{ outline: "none", boxShadow: "none" }}
                  _active={{ bg: "transparent" }}
                >
                  Forgot Password?
                </Box>
              </Flex>

              {/* Login Button */}
              <PrimaryButton
                onClick={handleLogin}
                ariaLabel="Login button"
                loading={isLoggingIn}
                disabled={isLoggingIn}
              >
                Login
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
      <Box display={{ base: "block", md: "none" }} minH="100vh" bg="white">
        <Flex direction="column" minH="100vh" px={4} pt={4} pb={4}>
          {/* Logo positioned above Sign In text */}
          <Flex w="full" justify="flex-start" mb={2}>
            <Box 
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="auto"
              h="auto"
            >
              <Image
                src={`${FRONTEND_URL}/SPARSH-Mnemonic-for-logo-RGB-01 1.svg`}
                alt="VMS Logo"
                width={80}
                height={80}
                objectFit="contain"
              />
            </Box>
          </Flex>

          <Box flex="1">
            <Heading
              as="h1"
              fontSize="20px"
              fontWeight="bold"
              color="gray.900"
              mb={2}
              textAlign="left"
            >
              Sign In
            </Heading>

            <Text fontSize="13px" color="gray.500" mb={6} textAlign="left">
              Please enter your email and password to continue your registration
            </Text>

            {/* Email Field */}
            <Box mb={4}>
              <Text fontSize="14px" fontWeight="bold" mb={1} color="gray.800">
                Email{" "}
                <Box as="span" color="red.500">
                  *
                </Box>
              </Text>
              <Input
                id="emailOrPhone"
                name="emailOrPhone"
                type="email"
                placeholder="Enter your Email "
                value={emailOrPhone}
                onChange={handleEmailOrPhoneChange}
                onKeyDown={handleInputKeyDown}
                size="md"
                borderRadius="md"
                bg="white"
                borderColor={emailError ? "red.500" : undefined}
                _focus={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                _active={{ borderColor: emailError ? "red.500" : "#8A38F5" }}
                fontSize="12px"
                color="black"
                tabIndex={0}
                aria-label="Enter your email address"
              />
              {emailError && (
                <Text color="red.500" fontSize="12px" mt={1}>
                  {emailError}
                </Text>
              )}
            </Box>

            {/* Password Field */}
            <Text fontSize="14px" fontWeight="bold" mb={1} color="gray.800">
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
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </Box>
              }
            >
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleInputKeyDown}
                size="md"
                borderRadius="md"
                bg="white"
                borderColor={passwordError ? "red.500" : undefined}
                _focus={{ borderColor: passwordError ? "red.500" : "#8A38F5" }}
                _active={{ borderColor: passwordError ? "red.500" : "#8A38F5" }}
                fontSize="12px"
                color="black"
                tabIndex={0}
                aria-label="Enter your password"
              />
            </InputGroup>
            {/* Show error only once below password field */}
            {passwordError && (
              <Text color="red.500" fontSize="12px" mt={1}>
                {passwordError}
              </Text>
            )}
            {/* Forgot Password Link */}
            <Flex justify="flex-end" mt={3}>
              <Link
                href={`${FRONTEND_URL}/forgot-password`}
                fontFamily="Roboto, sans-serif"
                fontWeight={300}
                fontStyle="normal"
                fontSize="12px"
                lineHeight="24px"
                letterSpacing="0"
                color="#0056C9"
                textAlign="center"
                verticalAlign="middle"
                tabIndex={0}
                aria-label="Forgot Password"
                _hover={{ textDecoration: "underline" }}
                _focus={{ outline: "none", boxShadow: "none" }}
              >
                Forgot Password?
              </Link>
            </Flex>
          </Box>
        {/* Bottom CTA */}
        <Box>
          <PrimaryButton
            onClick={handleLogin}
            ariaLabel="Login button"
            loading={isLoggingIn}
            disabled={isLoggingIn}
          >
            Login
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
