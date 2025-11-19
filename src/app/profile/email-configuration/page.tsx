"use client";
import {
  Box,
  Flex,
  Text,
  Icon,
  Input,
  Button,
  Select,
  Switch,
  Checkbox,
  RadioGroup,
  Portal,
  createListCollection,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { useState, useCallback, useEffect } from "react";
import { FiChevronLeft, FiEye, FiEyeOff } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import { useColorMode, useColorModeValue } from "@/components/ui/color-mode";
import {
  EmailConfigService,
  EmailConfigData,
} from "@/lib/email-config-service";
import Logo from "@/components/svgs/logo";

import DesktopHeader from "@/components/DesktopHeader";
interface EmailConfigErrors {
  smtpHost?: string;
  smtpPort?: string;
  customPort?: string;
  isSecure?: string;
  requireTLS?: string;
  emailAddress?: string;
  password?: string;
  fromName?: string;
}

const EmailConfigurationPage = () => {
  const router = useRouter();
  const { colorMode } = useColorMode();
  


  // Color values for dark/light theme
  const bgColor = useColorModeValue("white", "gray.800");
  const headerBg = useColorModeValue("#f4edfe", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const labelColor = useColorModeValue("gray.800", "gray.200");
  const borderColor = useColorModeValue("#E5E7EB", "gray.600");
  const focusBorderColor = useColorModeValue("#3B82F6", "#8A38F5");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");
  const inputBg = useColorModeValue("white", "gray.700");
  const buttonBg = useColorModeValue("white", "gray.600");
  const buttonBorder = useColorModeValue("#D1D5DB", "gray.500");

  const [formData, setFormData] = useState<EmailConfigData>({
    smtpHost: "",
    smtpPort: "",
    customPort: "",
    isSecure: false,
    requireTLS: false,
    emailAddress: "",
    password: "",
    fromName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<EmailConfigErrors>({});
  const [loading, setLoading] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  // Create collection for port options
  const portOptions = createListCollection({
    items: [
      { label: "Select port", value: "" },
      { label: "587 (TLS - recommended)", value: "587" },
      { label: "465 (SSL)", value: "465" },
      { label: "25 (Unencrypted)", value: "25" },
      { label: "Other", value: "other" },
    ],
  });


  // Load existing email configuration on mount
  useEffect(() => {
    const loadEmailConfig = async () => {
      try {
        const result = await EmailConfigService.getEmailConfig();

        if (result.success && result.data) {
          const hasPassword =
            result.data.password && result.data.password.trim() !== "";
          setFormData({
            smtpHost: result.data.smtpHost || "",
            smtpPort: result.data.smtpPort || "",
            customPort: result.data.customPort || "",
            isSecure: result.data.isSecure || false,
            requireTLS: result.data.requireTLS || false,
            emailAddress: result.data.emailAddress || "",
            password: result.data.password || "",
            fromName: result.data.fromName || "",
          });
          setHasExistingData(true);
          setHasExistingPassword(Boolean(hasPassword));
        } else {
          setHasExistingData(false);
          setHasExistingPassword(false);
        }
      } catch (error) {
        console.error("Error loading email configuration:", error);
        setHasExistingData(false);
      }
    };

    loadEmailConfig();
  }, []);

  const handleInputChange = useCallback(
    (field: keyof EmailConfigData, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    },
    [errors]
  );

  const handlePortChange = useCallback((value: string) => {
    if (value === "other") {
      setFormData((prev) => ({
        ...prev,
        smtpPort: "other",
        customPort: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        smtpPort: value,
        customPort: "",
      }));
    }
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: EmailConfigErrors = {};

    if (!formData.smtpHost.trim()) {
      newErrors.smtpHost = "SMTP Host is required";
    } else if (!/^[a-zA-Z0-9.-]+$/.test(formData.smtpHost)) {
      newErrors.smtpHost = "Please enter a valid SMTP host";
    }

    if (!formData.smtpPort || formData.smtpPort === "") {
      newErrors.smtpPort = "Port is required";
    } else if (formData.smtpPort === "other") {
      if (!formData.customPort.trim()) {
        newErrors.customPort = "Custom port is required";
      } else if (
        !/^\d+$/.test(formData.customPort) ||
        parseInt(formData.customPort) < 1 ||
        parseInt(formData.customPort) > 65535
      ) {
        newErrors.customPort = "Please enter a valid port number (1-65535)";
      }
    }

    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress)) {
      newErrors.emailAddress = "Please enter a valid email address";
    }

    // Skip password validation if it's the placeholder for existing password
    if (formData.password === "••••••••" && hasExistingPassword) {
      // Password is already set, no validation needed
    } else if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.fromName.trim()) {
      newErrors.fromName = "From name is required";
    } else if (formData.fromName.length < 2) {
      newErrors.fromName = "From name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, hasExistingPassword]);

  const handleSave = async () => {
    if (!validateForm()) {
      toaster.error({
        title: "Validation Error",
        description: "Please fix the errors below.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await EmailConfigService.saveEmailConfig(
        formData,
        hasExistingData
      );

      if (result.success) {
        toaster.success({
          title: hasExistingData
            ? "Configuration Updated"
            : "Configuration Saved",
          description:
            result.message ||
            "Email configuration has been successfully saved.",
        });
        setHasExistingData(true);
      } else {
        toaster.error({
          title: "Error",
          description: result.error || "Failed to save email configuration.",
        });
      }
    } catch (error) {
      console.error("Error saving email configuration:", error);
      toaster.error({
        title: "Error",
        description: "Failed to save email configuration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/profile");
  };

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <Box h="100vh" w="full" display="flex" flexDirection="column" overflow="hidden">
              {/* Desktop Header - Hidden on Mobile */}
        
      <DesktopHeader />{/* Desktop Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        bg="#F0E6FF"
        h="calc(100vh - 60px)"
        position="relative"
        overflow="hidden"
      >
        {/* Decorative Background Logo */}
        <Box
          position="absolute"
          bottom="-100px"
          right="-50px"
          opacity={0.1}
          zIndex={1}
        >
          <Box transform="scale(3)">
            <Logo />
          </Box>
        </Box>

        {/* Main Content */}
        <Box position="relative" zIndex={2} p={8} h="full" overflow="auto">
          {/* Email Configuration Header */}
          <Flex align="center" gap={3} mb='20px'>
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={handleCancel}
              color="#8A37F7"
              _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
            >
              <FiChevronLeft />
            </IconButton>
            <Heading
              fontSize="lg"
              color="#18181b"
              fontWeight="bold"
            >
              Email Configuration
            </Heading>
          </Flex>

          {/* Desktop Form Content */}
          <Box 
            display={{ base: "none", md: "block" }}
            bg="white" 
            borderRadius="lg" 
            boxShadow="0 2px 16px rgba(95,36,172,0.27)" 
            p={8}
            maxW="800px"
            mx="auto"
          >
        {/* SMTP Host */}
        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            SMTP Host
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
            value={formData.smtpHost}
            onChange={(e) => handleInputChange("smtpHost", e.target.value)}
            placeholder="Enter SMTP host (e.g., smtp.gmail.com)"
            borderRadius="md"
            border="1px solid"
            borderColor={errors.smtpHost ? "red.500" : borderColor}
            bg={inputBg}
            color={textColor}
            px={3}
            py={3}
            fontSize="sm"
            _focus={{
              borderColor: errors.smtpHost ? "red.500" : focusBorderColor,
              boxShadow: errors.smtpHost
                ? "0 0 0 1px #ef4444"
                : `0 0 0 1px ${focusBorderColor}`,
            }}
            _placeholder={{
              color: placeholderColor,
            }}
            tabIndex={0}
            aria-label="SMTP Host input"
            aria-invalid={!!errors.smtpHost}
          />
          {errors.smtpHost && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.smtpHost}
            </Text>
          )}
        </Box>

        {/* SMTP Port */}
        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            SMTP Port
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
          <Select.Root
            value={[formData.smtpPort]}
            onValueChange={(details) => handlePortChange(details.value[0])}
            collection={portOptions}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                borderRadius="md"
                border="1px solid"
                borderColor={errors.smtpPort ? "red.500" : borderColor}
                bg={inputBg}
                color={textColor}
                px={3}
                py={3}
                fontSize="sm"
                _focus={{
                  borderColor: errors.smtpPort ? "red.500" : focusBorderColor,
                  boxShadow: errors.smtpPort
                    ? "0 0 0 1px #ef4444"
                    : `0 0 0 1px ${focusBorderColor}`,
                }}
                tabIndex={0}
                aria-label="SMTP Port selection"
                aria-invalid={!!errors.smtpPort}
              >
                <Select.ValueText
                  placeholder="Select port"
                  color={formData.smtpPort ? textColor : placeholderColor}
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator>
                  <Icon
                    as={FiChevronLeft}
                    boxSize={4}
                    transform="rotate(-90deg)"
                  />
                </Select.Indicator>
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="4px"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                >
                  {portOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Text color={textColor}>{item.label}</Text>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          {formData.smtpPort === "other" && (
            <Input
              value={formData.customPort}
              onChange={(e) => handleInputChange("customPort", e.target.value)}
              placeholder="Enter custom port (1-65535)"
              borderRadius="md"
              border="1px solid"
              borderColor={errors.customPort ? "red.500" : borderColor}
              bg={inputBg}
              color={textColor}
              px={3}
              py={3}
              fontSize="sm"
              mt={2}
              _focus={{
                borderColor: errors.customPort ? "red.500" : focusBorderColor,
                boxShadow: errors.customPort
                  ? "0 0 0 1px #ef4444"
                  : `0 0 0 1px ${focusBorderColor}`,
              }}
              _placeholder={{
                color: placeholderColor,
              }}
              tabIndex={0}
              aria-label="Custom port input"
              aria-invalid={!!errors.customPort}
            />
          )}

          {errors.smtpPort && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.smtpPort}
            </Text>
          )}
          {formData.smtpPort === "other" && errors.customPort && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.customPort}
            </Text>
          )}
        </Box>

        {/* Secure (SSL/TLS) Toggle */}
        <Box mb={6}>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Text fontSize="sm" fontWeight="bold" color={labelColor} mr={3}>
                Secure (SSL/TLS)
              </Text>
              <RadioGroup.Root
                name="isSecure"
                value={formData.isSecure ? "secure" : "insecure"}
                onValueChange={(details) => {
                  const newValue = details.value === "secure";
                  handleInputChange("isSecure", newValue);
                }}
                tabIndex={0}
                aria-label="SSL/TLS security options"
              >
                <Flex gap={4}>
                  <RadioGroup.Item value="insecure">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.isSecure === false ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.isSecure === false ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.isSecure === false && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      Off
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="secure">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.isSecure === true ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.isSecure === true ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.isSecure === true && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      On
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
            </Flex>
            <Switch.Root
              checked={formData.isSecure}
              onCheckedChange={(details) =>
                handleInputChange("isSecure", details.checked)
              }
              tabIndex={0}
              aria-label="Enable SSL/TLS security"
            >
              <Switch.Thumb />
            </Switch.Root>
          </Flex>
        </Box>

        {/* Require TLS Checkbox */}
        <Box mb={6}>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Text fontSize="sm" fontWeight="bold" color={labelColor} mr={3}>
                Require TLS
              </Text>
              <RadioGroup.Root
                name="requireTLS"
                value={formData.requireTLS ? "required" : "not-required"}
                onValueChange={(details) => {
                  const newValue = details.value === "required";
                  handleInputChange("requireTLS", newValue);
                }}
                tabIndex={0}
                aria-label="TLS requirement options"
              >
                <Flex gap={4}>
                  <RadioGroup.Item value="not-required">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.requireTLS === false ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.requireTLS === false ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.requireTLS === false && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      No
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="required">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.requireTLS === true ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.requireTLS === true ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.requireTLS === true && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      Yes
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
            </Flex>
            <Checkbox.Root
              checked={formData.requireTLS}
              onCheckedChange={(details) =>
                handleInputChange("requireTLS", details.checked)
              }
              tabIndex={0}
              aria-label="Require TLS"
            >
              <Checkbox.Indicator>
                <Checkbox.Control />
              </Checkbox.Indicator>
            </Checkbox.Root>
          </Flex>
        </Box>

        {/* Email Address */}
        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            Email Address (Username)
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
            type="email"
            value={formData.emailAddress}
            onChange={(e) => handleInputChange("emailAddress", e.target.value)}
            placeholder="Enter email address"
            borderRadius="md"
            border="1px solid"
            borderColor={errors.emailAddress ? "red.500" : borderColor}
            bg={inputBg}
            color={textColor}
            px={3}
            py={3}
            fontSize="sm"
            _focus={{
              borderColor: errors.emailAddress ? "red.500" : focusBorderColor,
              boxShadow: errors.emailAddress
                ? "0 0 0 1px #ef4444"
                : `0 0 0 1px ${focusBorderColor}`,
            }}
            _placeholder={{
              color: placeholderColor,
            }}
            tabIndex={0}
            aria-label="Email address input"
            aria-invalid={!!errors.emailAddress}
          />
          {errors.emailAddress && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.emailAddress}
            </Text>
          )}
        </Box>

        {/* Password */}
        <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
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
          <Box position="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => {
                handleInputChange("password", e.target.value);
              }}
              placeholder="Enter password"
              borderRadius="md"
              border="1px solid"
              borderColor={errors.password ? "red.500" : borderColor}
              bg={inputBg}
              color={textColor}
              px={3}
              py={3}
              fontSize="sm"
              _focus={{
                borderColor: errors.password ? "red.500" : focusBorderColor,
                boxShadow: errors.password
                  ? "0 0 0 1px #ef4444"
                  : `0 0 0 1px ${focusBorderColor}`,
              }}
              _placeholder={{
                color: placeholderColor,
              }}
              tabIndex={0}
              aria-label="Password input"
              aria-invalid={!!errors.password}
            />
            <Icon
              as={showPassword ? FiEyeOff : FiEye}
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              boxSize={5}
              color={placeholderColor}
              cursor="pointer"
              tabIndex={0}
              role="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={togglePasswordVisibility}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  togglePasswordVisibility();
                }
              }}
              _focus={{ boxShadow: "none", outline: "none" }}
            />
          </Box>
          {errors.password && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.password}
            </Text>
          )}
        </Box>

        {/* From Name */}
        <Box mb={8}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            From Name
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
            value={formData.fromName}
            onChange={(e) => handleInputChange("fromName", e.target.value)}
            placeholder="Enter from name"
            borderRadius="md"
            border="1px solid"
            borderColor={errors.fromName ? "red.500" : borderColor}
            bg={inputBg}
            color={textColor}
            px={3}
            py={3}
            fontSize="sm"
            _focus={{
              borderColor: errors.fromName ? "red.500" : focusBorderColor,
              boxShadow: errors.fromName
                ? "0 0 0 1px #ef4444"
                : `0 0 0 1px ${focusBorderColor}`,
            }}
            _placeholder={{
              color: placeholderColor,
            }}
            tabIndex={0}
            aria-label="From name input"
            aria-invalid={!!errors.fromName}
          />
          {errors.fromName && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.fromName}
            </Text>
          )}
        </Box>

        {/* SMTP Port */}
        {/* <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            SMTP Port
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
          <Select.Root
            value={[formData.smtpPort]}
            onValueChange={(details) => handlePortChange(details.value[0])}
            collection={portOptions}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                borderRadius="md"
                border="1px solid"
                borderColor={errors.smtpPort ? "red.500" : borderColor}
                bg={inputBg}
                color={textColor}
                px={3}
                py={3}
                fontSize="sm"
                _focus={{
                  borderColor: errors.smtpPort ? "red.500" : focusBorderColor,
                  boxShadow: errors.smtpPort
                    ? "0 0 0 1px #ef4444"
                    : `0 0 0 1px ${focusBorderColor}`,
                }}
                tabIndex={0}
                aria-label="SMTP Port selection"
                aria-invalid={!!errors.smtpPort}
              >
                <Select.ValueText
                  placeholder="Select port"
                  color={formData.smtpPort ? textColor : placeholderColor}
                />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator>
                  <Icon
                    as={FiChevronLeft}
                    boxSize={4}
                    transform="rotate(-90deg)"
                  />
                </Select.Indicator>
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="4px"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                >
                  {portOptions.items.map((item) => (
                    <Select.Item key={item.value} item={item}>
                      <Text color={textColor}>{item.label}</Text>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          {formData.smtpPort === "other" && (
            <Input
              value={formData.customPort}
              onChange={(e) => handleInputChange("customPort", e.target.value)}
              placeholder="Enter custom port (1-65535)"
              borderRadius="md"
              border="1px solid"
              borderColor={errors.customPort ? "red.500" : borderColor}
              bg={inputBg}
              color={textColor}
              px={3}
              py={3}
              fontSize="sm"
              mt={2}
              _focus={{
                borderColor: errors.customPort ? "red.500" : focusBorderColor,
                boxShadow: errors.customPort
                  ? "0 0 0 1px #ef4444"
                  : `0 0 0 1px ${focusBorderColor}`,
              }}
              _placeholder={{
                color: placeholderColor,
              }}
              tabIndex={0}
              aria-label="Custom port input"
              aria-invalid={!!errors.customPort}
            />
          )}

          {errors.smtpPort && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.smtpPort}
            </Text>
          )}
          {formData.smtpPort === "other" && errors.customPort && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.customPort}
            </Text>
          )}
        </Box> */}

        {/* Secure (SSL/TLS) Toggle */}
        {/* <Box mb={6}>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Text fontSize="sm" fontWeight="bold" color={labelColor} mr={3}>
                Secure (SSL/TLS)
              </Text>
              <RadioGroup.Root
                name="isSecure"
                value={formData.isSecure ? "secure" : "insecure"}
                onValueChange={(details) => {
                  const newValue = details.value === "secure";
                  handleInputChange("isSecure", newValue);
                }}
                tabIndex={0}
                aria-label="SSL/TLS security options"
              >
                <Flex gap={4}>
                  <RadioGroup.Item value="insecure">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.isSecure === false ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.isSecure === false ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.isSecure === false && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      Off
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="secure">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.isSecure === true ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.isSecure === true ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.isSecure === true && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      On
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
            </Flex>
            <Switch.Root
              checked={formData.isSecure}
              onCheckedChange={(details) =>
                handleInputChange("isSecure", details.checked)
              }
              tabIndex={0}
              aria-label="Enable SSL/TLS security"
            >
              <Switch.Thumb />
            </Switch.Root>
          </Flex>
        </Box> */}

        {/* Require TLS Checkbox */}
        {/* <Box mb={6}>
          <Flex align="center" justify="space-between">
            <Flex align="center">
              <Text fontSize="sm" fontWeight="bold" color={labelColor} mr={3}>
                Require TLS
              </Text>
              <RadioGroup.Root
                name="requireTLS"
                value={formData.requireTLS ? "required" : "not-required"}
                onValueChange={(details) => {
                  const newValue = details.value === "required";
                  handleInputChange("requireTLS", newValue);
                }}
                tabIndex={0}
                aria-label="TLS requirement options"
              >
                <Flex gap={4}>
                  <RadioGroup.Item value="not-required">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.requireTLS === false ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.requireTLS === false ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.requireTLS === false && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      No
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                  <RadioGroup.Item value="required">
                    <RadioGroup.ItemHiddenInput />
                    <RadioGroup.ItemIndicator
                      boxSize="24px"
                      borderRadius="full"
                      borderWidth="2px"
                      borderColor={
                        formData.requireTLS === true ? "#8A38F5" : "gray.300"
                      }
                      bg={formData.requireTLS === true ? "#8A38F5" : "white"}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      transition="all 0.2s"
                    >
                      {formData.requireTLS === true && (
                        <Box boxSize="8px" borderRadius="full" bg="white" />
                      )}
                    </RadioGroup.ItemIndicator>
                    <RadioGroup.ItemText color={textColor} ml={2}>
                      Yes
                    </RadioGroup.ItemText>
                  </RadioGroup.Item>
                </Flex>
              </RadioGroup.Root>
            </Flex>
            <Checkbox.Root
              checked={formData.requireTLS}
              onCheckedChange={(details) =>
                handleInputChange("requireTLS", details.checked)
              }
              tabIndex={0}
              aria-label="Require TLS"
            >
              <Checkbox.Indicator>
                <Checkbox.Control />
              </Checkbox.Indicator>
            </Checkbox.Root>
          </Flex>
        </Box> */}

        {/* Email Address */}
        {/* <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            Email Address (Username)
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
            type="email"
            value={formData.emailAddress}
            onChange={(e) => handleInputChange("emailAddress", e.target.value)}
            placeholder="Enter email address"
            borderRadius="md"
            border="1px solid"
            borderColor={errors.emailAddress ? "red.500" : borderColor}
            bg={inputBg}
            color={textColor}
            px={3}
            py={3}
            fontSize="sm"
            _focus={{
              borderColor: errors.emailAddress ? "red.500" : focusBorderColor,
              boxShadow: errors.emailAddress
                ? "0 0 0 1px #ef4444"
                : `0 0 0 1px ${focusBorderColor}`,
            }}
            _placeholder={{
              color: placeholderColor,
            }}
            tabIndex={0}
            aria-label="Email address input"
            aria-invalid={!!errors.emailAddress}
          />
          {errors.emailAddress && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.emailAddress}
            </Text>
          )}
        </Box> */}

        {/* Password */}
        {/* <Box mb={6}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
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
          <Box position="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => {
                handleInputChange("password", e.target.value);
              }}
              placeholder="Enter password"
              borderRadius="md"
              border="1px solid"
              borderColor={errors.password ? "red.500" : borderColor}
              bg={inputBg}
              color={textColor}
              px={3}
              py={3}
              fontSize="sm"
              _focus={{
                borderColor: errors.password ? "red.500" : focusBorderColor,
                boxShadow: errors.password
                  ? "0 0 0 1px #ef4444"
                  : `0 0 0 1px ${focusBorderColor}`,
              }}
              _placeholder={{
                color: placeholderColor,
              }}
              tabIndex={0}
              aria-label="Password input"
              aria-invalid={!!errors.password}
            />
            <Icon
              as={showPassword ? FiEyeOff : FiEye}
              position="absolute"
              right={3}
              top="50%"
              transform="translateY(-50%)"
              boxSize={5}
              color={placeholderColor}
              cursor="pointer"
              tabIndex={0}
              role="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={togglePasswordVisibility}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  togglePasswordVisibility();
                }
              }}
              _focus={{ boxShadow: "none", outline: "none" }}
            />
          </Box>
          {errors.password && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.password}
            </Text>
          )}
        </Box> */}

        {/* From Name */}
        {/* <Box mb={8}>
          <Text
            fontSize="sm"
            fontWeight="bold"
            color={labelColor}
            mb={2}
            display="flex"
            alignItems="center"
          >
            From Name
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
            value={formData.fromName}
            onChange={(e) => handleInputChange("fromName", e.target.value)}
            placeholder="Enter from name"
            borderRadius="md"
            border="1px solid"
            borderColor={errors.fromName ? "red.500" : borderColor}
            bg={inputBg}
            color={textColor}
            px={3}
            py={3}
            fontSize="sm"
            _focus={{
              borderColor: errors.fromName ? "red.500" : focusBorderColor,
              boxShadow: errors.fromName
                ? "0 0 0 1px #ef4444"
                : `0 0 0 1px ${focusBorderColor}`,
            }}
            _placeholder={{
              color: placeholderColor,
            }}
            tabIndex={0}
            aria-label="From name input"
            aria-invalid={!!errors.fromName}
          />
          {errors.fromName && (
            <Text color="red.500" fontSize="12px" mt={1}>
              {errors.fromName}
            </Text>
          )}
        </Box> */}

        {/* Action Buttons */}
        <Flex gap={3} w="full" mt={8}>
          <Button
            onClick={handleCancel}
            variant="outline"
            border="1px solid"
            borderColor="#D1D5DB"
            color="gray.800"
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
            aria-label="Cancel email configuration"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCancel();
              }
            }}
          >
            Back
          </Button>
          <Button
            onClick={handleSave}
            bg="#8a37f7"
            color="white"
            borderRadius="md"
            flex={1}
            py={3}
            fontSize="sm"
            fontWeight="medium"
            loading={loading}
            loadingText={hasExistingData ? "Updating..." : "Saving..."}
            _hover={{
              bg: "#7a2ee6",
            }}
            _active={{
              bg: "#6a1dd9",
            }}
            tabIndex={0}
            aria-label={
              hasExistingData
                ? "Update email configuration"
                : "Save email configuration"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSave();
              }
            }}
          >
            {hasExistingData ? "Update" : "Save"}
          </Button>
        </Flex>
          </Box>
        </Box>
      </Box>

      {/* Mobile Version - Hidden on Desktop */}
      <Box display={{ base: "block", md: "none" }} minH="100vh" bg={bgColor}>
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
            onClick={handleCancel}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCancel();
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">SMTP Configuration</Text>
        </Flex>

        {/* Mobile Form Content */}
        <Box px={6} py={8} flex={1} bg={bgColor}>
          {/* SMTP Host */}
          <Box mb={6}>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color={labelColor}
              mb={2}
              display="flex"
              alignItems="center"
            >
              SMTP Host
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
              value={formData.smtpHost}
              onChange={(e) => handleInputChange("smtpHost", e.target.value)}
              placeholder="Enter SMTP host (e.g., smtp.gmail.com)"
              borderRadius="md"
              border="1px solid"
              borderColor={errors.smtpHost ? "red.500" : borderColor}
              bg={inputBg}
              color={textColor}
              px={3}
              py={3}
              fontSize="sm"
              _focus={{
                borderColor: errors.smtpHost ? "red.500" : focusBorderColor,
                boxShadow: errors.smtpHost
                  ? "0 0 0 1px #ef4444"
                  : `0 0 0 1px ${focusBorderColor}`,
              }}
              _placeholder={{
                color: placeholderColor,
              }}
              tabIndex={0}
              aria-label="SMTP Host input"
              aria-invalid={!!errors.smtpHost}
            />
            {errors.smtpHost && (
              <Text color="red.500" fontSize="12px" mt={1}>
                {errors.smtpHost}
              </Text>
            )}
          </Box>

          {/* Mobile Action Buttons */}
          <Flex gap={3} w="full" mt={8}>
          <Button
            onClick={handleCancel}
            variant="outline"
            border="1px solid"
            borderColor={buttonBorder}
            color={textColor}
            bg={buttonBg}
            borderRadius="md"
            flex={1}
            py={3}
            fontSize="sm"
            fontWeight="medium"
            _hover={{
              bg: colorMode === "dark" ? "gray.500" : "#F9FAFB",
              borderColor: colorMode === "dark" ? "gray.400" : "#9CA3AF",
            }}
            _active={{
              bg: colorMode === "dark" ? "gray.600" : "#F3F4F6",
            }}
            tabIndex={0}
            aria-label="Cancel email configuration"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCancel();
              }
            }}
          >
            Back
          </Button>
          <Button
            onClick={handleSave}
            bg="#8a37f7"
            color="white"
            borderRadius="md"
            flex={1}
            py={3}
            fontSize="sm"
            fontWeight="medium"
            loading={loading}
            loadingText={hasExistingData ? "Updating..." : "Saving..."}
            _hover={{
              bg: "#7a2ee6",
            }}
            _active={{
              bg: "#6a1dd9",
            }}
            tabIndex={0}
            aria-label={
              hasExistingData
                ? "Update email configuration"
                : "Save email configuration"
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSave();
              }
            }}
          >
            {hasExistingData ? "Update" : "Save"}
          </Button>
        </Flex>
      </Box>
      </Box>
    </Box>
  );
};

export default EmailConfigurationPage;