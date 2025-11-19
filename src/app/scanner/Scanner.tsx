"use client";
import React, { useState, useEffect, ReactElement } from "react";
import { Box, Flex, Text, Button, Stack, IconButton } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import OTPInput from "react-otp-input";
import { toaster } from "@/components/ui/toaster";
import { CapacitorBarcodeScanner } from "@capacitor/barcode-scanner";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { visitorScanQR, VisitorScanQRResponse } from "@/app/api/visitor";
import { FiChevronLeft } from "react-icons/fi";
import DesktopHeader from "@/components/DesktopHeader";
import Logo from "@/components/svgs/logo";

const WebHeader = () => {
  return <DesktopHeader notificationCount={3} />;
};

// HeaderBar component for mobile - matching check-in-visitor style
const HeaderBar = (): ReactElement => {
  const { safeBack } = useNavigation();
  return (
    <Flex
      as="header"
      align="center"
      justify="center"
      w="full"
      h={{ base: "70px", md: "48px" }}
      bg="#f4edfefa"
      borderBottom="1px solid #f2f2f2"
      position="relative"
      px={0}
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
        onClick={() => safeBack()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') safeBack(); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize="sm" color="#181a1b">Scanner</Text>
    </Flex>
  );
};

const Scanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [visitorId, setVisitorId] = useState("");
  const [webScanner, setWebScanner] = useState<unknown>(null);
  const [isWebEnvironment, setIsWebEnvironment] = useState(false);
  const [nativeScanActive, setNativeScanActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { safeBack } = useNavigation();
  const searchParams = useSearchParams();

  // Detect if we're in a web environment
  useEffect(() => {
    setIsWebEnvironment(
      typeof window !== "undefined" &&
        !(window as { Capacitor?: unknown }).Capacitor
    );
  }, []);

  // Cleanup web scanner on unmount
  useEffect(() => {
    return () => {
      if (
        webScanner &&
        typeof webScanner === "object" &&
        webScanner !== null &&
        "clear" in webScanner
      ) {
        (webScanner as { clear: () => void }).clear();
      }
    };
  }, [webScanner]);

  // Check if this is checkout flow
  const isCheckout = searchParams.get("fromCheckout") === "1";

  // Helper function to show pop-up with queue management
  const showPopup = (type: "error" | "success", title: string, description: string) => {
    if (isProcessing) {
      return; // Prevent multiple pop-ups
    }
    
    setIsProcessing(true);
    
    if (type === "error") {
      toaster.error({
        title,
        description,
      });
    } else {
      toaster.success({
        title,
        description,
      });
    }

    // Reset processing state after a delay to allow pop-up to be dismissed
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000); // 3 seconds delay
  };

  // Type guard to check if response is an error
  const isErrorResponse = (
    response: VisitorScanQRResponse | { error: string; message: string }
  ): response is { error: string; message: string } => {
    return response && typeof response === "object" && "error" in response;
  };

  // Navigate based on flow
  const navigateWithVisitorData = (
    visitorDataResponse: VisitorScanQRResponse
  ) => {
    if (isCheckout) {
      // For checkout flow, go directly to summary page
      // Store visitor data in sessionStorage to avoid HTTP 431 error (URL too long)
      sessionStorage.setItem(
        "checkoutVisitorData",
        JSON.stringify({ visitor: visitorDataResponse.visitor })
      );
      const navigationUrl = `/visitor-check-in-summary?fromCheckout=1`;
      router.push(navigationUrl);
    } else {
      // For check-in flow, go to check-in-process page
      const navigationUrl = `/check-in-process?fromScanner=1&visitorData=${encodeURIComponent(
        JSON.stringify(visitorDataResponse)
      )}`;
      router.push(navigationUrl);
    }
  };

  // Request camera permission explicitly
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toaster.error({
          title: "Camera Not Supported",
          description:
            "Your browser doesn't support camera access. Please use a modern browser.",
        });
        return false;
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error) {
      console.error("Camera permission error:", error);

      if (error && typeof error === "object" && "name" in error) {
        const errorName = (error as { name: string }).name;

        if (
          errorName === "NotAllowedError" ||
          errorName === "PermissionDeniedError"
        ) {
          toaster.error({
            title: "Camera Permission Denied",
            description:
              "Please allow camera access in your browser settings to scan QR codes.",
          });
        } else if (
          errorName === "NotFoundError" ||
          errorName === "DevicesNotFoundError"
        ) {
          toaster.error({
            title: "No Camera Found",
            description:
              "No camera detected on this device. Please use manual entry.",
          });
        } else if (
          errorName === "NotReadableError" ||
          errorName === "TrackStartError"
        ) {
          toaster.error({
            title: "Camera In Use",
            description:
              "Camera is being used by another application. Please close it and try again.",
          });
        } else {
          toaster.error({
            title: "Camera Access Failed",
            description:
              "Unable to access camera. Please check your browser settings.",
          });
        }
      }

      return false;
    }
  };

  // Web-based QR scanning function
  const handleWebScan = async () => {
    // First, request camera permission explicitly
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      return;
    }

    setScanning(true);
    try {
      // Create scanner instance
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedFormats: [Html5QrcodeSupportedFormats.QR_CODE],
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
        },
        false
      );

      setWebScanner(scanner);

      scanner.render(
        (decodedText: string) => {
          // Success callback
          scanner.clear();
          setWebScanner(null);
          setScanning(false);

          // Process the scanned data
          processScannedData(decodedText);
        },
        (error: unknown) => {
          // Error callback - ignore most errors as they're just scanning attempts
          // Only log critical errors
          if (error && typeof error === "object" && "message" in error) {
            const errorMessage = (
              error as { message: string }
            ).message.toLowerCase();

            // Only handle critical permission errors here
            if (
              errorMessage.includes("permission") ||
              errorMessage.includes("denied")
            ) {
              console.error("Permission error during scanning:", error);
              scanner.clear();
              setWebScanner(null);
              setScanning(false);
              toaster.error({
                title: "Camera Permission Lost",
                description:
                  "Camera access was revoked. Please refresh and allow camera access.",
              });
            }
            // Ignore other errors as they're normal scanning attempts
          }
        }
      );
    } catch (error) {
      setScanning(false);
      setWebScanner(null);
      console.error("Web scanner initialization error:", error);

      // Check if it's a permission error
      if (error && typeof error === "object") {
        if ("message" in error) {
          const errorMessage = (
            error as { message: string }
          ).message.toLowerCase();
          if (
            errorMessage.includes("permission") ||
            errorMessage.includes("denied")
          ) {
            toaster.error({
              title: "Camera Permission Required",
              description: "Please allow camera access to scan QR codes.",
            });
            return;
          }
          if (
            errorMessage.includes("not supported") ||
            errorMessage.includes("not found")
          ) {
            toaster.error({
              title: "Camera Not Available",
              description:
                "No camera found on this device. Please use manual entry.",
            });
            return;
          }
        }
      }

      toaster.error({
        title: "Scanner Error",
        description:
          "Failed to initialize camera. Please check permissions and try again.",
      });
    }
  };

  // Process scanned data (common for both web and mobile)
  const processScannedData = async (scannedData: string) => {
    // Prevent multiple submissions
    if (isProcessing) {
      return;
    }

    try {
      // Try to parse the scanned result as JSON and extract visitor ID
      let visitorIdToUse = scannedData.trim();

      // Try to parse as JSON first
      try {
        const parsedData = JSON.parse(scannedData);
        visitorIdToUse = parsedData.visitorId || parsedData.otp || scannedData;
      } catch {
        // If not JSON, use the raw data as visitor ID
        visitorIdToUse = scannedData;
      }

      const response = await visitorScanQR({ otp: visitorIdToUse });

      // Check if response has error
      if (isErrorResponse(response)) {
        showPopup("error", "Visitor Not Found", "The visitor ID you entered is not valid. Please check and try again.");
        return;
      }

      // Success case - response has visitor data
      const visitorDataResponse = response as VisitorScanQRResponse;
      const visitorStatus = visitorDataResponse.visitor.status;

      // Validate visitor status based on flow
      if (isCheckout) {
        // From checkout flow - only allow if status is CHECKED_IN
        if (visitorStatus === "CHECKED_OUT") {
          showPopup("error", "Visitor Already Checked Out", `${visitorDataResponse.visitor.fullName} has already been checked out.`);
          return;
        } else if (visitorStatus === "APPROVED") {
          showPopup("error", "Visitor Not Checked In", `${visitorDataResponse.visitor.fullName} is approved but not checked in yet.`);
          return;
        } else if (visitorStatus !== "CHECKED_IN") {
          showPopup("error", "Invalid Status for Checkout", `${visitorDataResponse.visitor.fullName} cannot be checked out with current status: ${visitorStatus}`);
          return;
        }
      } else {
        // From check-in flow - only allow if status is APPROVED
        if (visitorStatus === "CHECKED_IN") {
          showPopup("error", "Visitor Already Checked In", `${visitorDataResponse.visitor.fullName} has already been checked in.`);
          return;
        } else if (visitorStatus === "CHECKED_OUT") {
          showPopup("error", "Visitor Already Checked Out", `${visitorDataResponse.visitor.fullName} has already been checked out.`);
          return;
        } else if (visitorStatus !== "APPROVED") {
          showPopup("error", "Visitor Not Approved", `${visitorDataResponse.visitor.fullName} is not approved for check-in. Current status: ${visitorStatus}`);
          return;
        }
      }

      showPopup("success", "QR Code Scanned Successfully", `Visitor: ${visitorDataResponse.visitor.fullName}`);

      // Navigate based on flow
      navigateWithVisitorData(visitorDataResponse);
    } catch (apiError) {
      console.error("API Error:", apiError);
      showPopup("error", "Scanner Error", "QR code scanned but visitor not found. Please check the code and try again.");
    }
  };

  // Start scanning
  const handleStartScan = async () => {
    // Clean up any existing scanner first
    if (
      webScanner &&
      typeof webScanner === "object" &&
      webScanner !== null &&
      "clear" in webScanner
    ) {
      (webScanner as { clear: () => void }).clear();
      setWebScanner(null);
    }

    if (isWebEnvironment) {
      // Use web-based scanner
      await handleWebScan();
    } else {
      // Use Capacitor scanner for mobile with auto-scan (no button needed)
      setScanning(true);
      setNativeScanActive(true);
      try {
        const result = await CapacitorBarcodeScanner.scanBarcode({
          hint: "Scan a QR code",
          scanInstructions: "Align the QR code within the frame",
          scanButton: false, // Disable built-in button - auto scan on detection
          scanText: "",
        });
        setScanning(false);
        setNativeScanActive(false);
        if (result?.ScanResult) {
          await processScannedData(result.ScanResult);
        } else {
          toaster.error({
            title: "Scan Failed",
            description: "No QR code detected. Please try again.",
          });
        }
      } catch (error) {
        setScanning(false);
        setNativeScanActive(false);
        console.error("Scanner error:", error);

        // Check if it's a permission error
        if (error && typeof error === "object" && "message" in error) {
          const errorMessage = (
            error as { message: string }
          ).message.toLowerCase();
          if (
            errorMessage.includes("permission") ||
            errorMessage.includes("denied")
          ) {
            toaster.error({
              title: "Camera Permission Required",
              description: "Please allow camera access to scan QR codes.",
            });
            return;
          }
          if (
            errorMessage.includes("cancelled") ||
            errorMessage.includes("cancel")
          ) {
            // User cancelled, don't show error
            return;
          }
        }

        // For other errors, show a generic message
        toaster.error({
          title: "Scan Failed",
          description:
            "Unable to start camera. Please check permissions and try again.",
        });
      }
    }
  };

  // Visitor ID input change
  const handleVisitorIdChange = (value: string) => {
    setVisitorId(value.replace(/\D/g, ""));
  };

  // Visitor ID submit
  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isProcessing) {
      return;
    }

    if (visitorId.length !== 6) {
      showPopup("error", "Invalid Visitor ID", "Please enter a valid 6-digit visitor ID.");
      return;
    }

    try {
      const response = await visitorScanQR({ otp: visitorId });

      // Check if response has error
      if (isErrorResponse(response)) {
        showPopup("error", "Visitor Not Found", "The visitor ID you entered is not valid. Please check and try again.");
        return;
      }

      // Success case - response has visitor data
      const visitorDataResponse = response as VisitorScanQRResponse;
      const visitorStatus = visitorDataResponse.visitor.status;

      // Validate visitor status based on flow
      if (isCheckout) {
        // From checkout flow - only allow if status is CHECKED_IN
        if (visitorStatus === "CHECKED_OUT") {
          showPopup("error", "Visitor Already Checked Out", `${visitorDataResponse.visitor.fullName} has already been checked out.`);
          return;
        } else if (visitorStatus === "APPROVED") {
          showPopup("error", "Visitor Not Checked In", `${visitorDataResponse.visitor.fullName} is approved but not checked in yet.`);
          return;
        } else if (visitorStatus !== "CHECKED_IN") {
          showPopup("error", "Invalid Status for Checkout", `${visitorDataResponse.visitor.fullName} cannot be checked out with current status: ${visitorStatus}`);
          return;
        }
      } else {
        // From check-in flow - only allow if status is APPROVED
        if (visitorStatus === "CHECKED_IN") {
          showPopup("error", "Visitor Already Checked In", `${visitorDataResponse.visitor.fullName} has already been checked in.`);
          return;
        } else if (visitorStatus === "CHECKED_OUT") {
          showPopup("error", "Visitor Already Checked Out", `${visitorDataResponse.visitor.fullName} has already been checked out.`);
          return;
        } else if (visitorStatus !== "APPROVED") {
          showPopup("error", "Visitor Not Approved", `${visitorDataResponse.visitor.fullName} is not approved for check-in. Current status: ${visitorStatus}`);
          return;
        }
      }

      showPopup("success", "Visitor ID Submitted Successfully", `Visitor: ${visitorDataResponse.visitor.fullName}`);

      // Navigate based on flow
      navigateWithVisitorData(visitorDataResponse);
    } catch (apiError) {
      console.error("API Error:", apiError);
      showPopup("error", "System Error", "An unexpected error occurred. Please try again.");
    }
  };

  // UI
  return (
    <Box
      position="relative"
      w="100vw"
      h="100vh"
      overflow="hidden"
      bg={{ base: "white", md: "#f7f2fd" }}
    >
      {/* Desktop Header - Always visible */}
      <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
        <WebHeader />
      </Box>

      {/* Web Navigation Bar - Only visible on web */}
      <Flex
        align="center"
        justify="space-between"
        px={6}
        h="56px"
        bg="#f7f2fd"
        borderBottom="1px solid #f2f2f2"
        display={{ base: "none", md: "flex" }}
        position="fixed"
        top="60px"
        left={0}
        right={0}
        zIndex={999}
      >
        {/* Left - Back Button and Title */}
        <Flex align="center" gap={3}>
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={() => safeBack()}
            color="#8A37F7"
            _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
          >
            <FiChevronLeft />
          </IconButton>
          <Text fontSize="lg" color="#18181b" fontWeight="bold">
            Enter visitor id
          </Text>
        </Flex>
      </Flex>

      <Flex
        className="scanner-overlay-ui"
        direction="column"
        minH="100vh"
        w="100vw"
        position="absolute"
        top={0}
        left={0}
        zIndex={10}
        bg={{ base: "white", md: "transparent" }}
        justify="flex-start"
        pt={{ base: "70px", md: "116px" }} // Add top padding for fixed header + navigation
      >
        {/* Mobile Header - Only visible on mobile */}
        <Box
          display={{ base: "block", md: "none" }}
          position="fixed"
          top="0"
          left={0}
          right={0}
          zIndex={1001}
        >
          <HeaderBar />
        </Box>

        {/* Main Content Container - Mobile Only */}
        <Flex
          direction="column"
          flex={1}
          w="full"
          px={2}
          pt={2}
          pb={20}
          display={{ base: "flex", md: "none" }}
        >
          {/* Scanner Section */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            flex={1}
            w="full"
            px={2}
          >
            <Text
              color="gray.700"
              fontWeight="medium"
              textAlign="center"
              mb={4}
              fontSize={{ base: "sm", sm: "md" }}
            >
              Place barcode inside the frame
              <br />
              when scanning
            </Text>
            <Button
              bg="#8A38F5"
              color="white"
              w="full"
              maxW={{ base: "280px", sm: "320px" }}
              size="lg"
              borderRadius="md"
              fontWeight="bold"
              onClick={handleStartScan}
              aria-label="Start QR Scan"
              tabIndex={0}
              _hover={{ bg: "#7a2ed6" }}
              _active={{ bg: "#6b28be" }}
              fontSize={{ base: "md", sm: "lg" }}
              h="48px"
            >
              {scanning ? "Scanning..." : "Start Scan"}
            </Button>
          </Flex>

          {/* Divider Line */}
          <Flex align="center" justify="center" my={3}>
            <Box
              w="160px"
              h="3px"
              bg="linear-gradient(90deg, transparent 0%, #8A38F5 50%, transparent 100%)"
              borderRadius="full"
            />
          </Flex>

          {/* Visitor ID Section */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            flex={1}
            w="full"
            px={2}
          >
            <Text
              color="gray.700"
              fontWeight="medium"
              textAlign="center"
              mb={4}
              fontSize={{ base: "sm", sm: "md" }}
            >
              Or enter Visitor ID manually
            </Text>

            {/* Visitor ID Input */}
            <Stack
              direction="row"
              gap={{ base: 2, sm: 3 }}
              justify="center"
              mb={3}
              flexWrap="wrap"
            >
              <OTPInput
                value={visitorId}
                onChange={handleVisitorIdChange}
                numInputs={6}
                inputType="tel"
                shouldAutoFocus
                renderInput={(props, idx) => (
                  <input
                    {...props}
                    key={idx}
                    aria-label={`Visitor ID digit ${idx + 1}`}
                    tabIndex={0}
                    style={{
                      width: 44,
                      height: 48,
                      fontSize: 18,
                      borderRadius: 8,
                      border: "2px solid #8A38F5",
                      textAlign: "center",
                      background: "white",
                      color: "black",
                      marginLeft: 2,
                      marginRight: 2,
                      outline: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                )}
              />
            </Stack>
          </Flex>
        </Flex>

        {/* Web Layout - Side by Side */}
        <Flex
          direction="column"
          flex={1}
          w="full"
          px={8}
          pt={8}
          pb={8}
          align="center"
          justify="center"
          display={{ base: "none", md: "flex" }}
        >
          {/* Visitor ID Section - Full width for web */}
          <Flex
            direction="column"
            align="center"
            justify="center"
            w="full"
            maxW="600px"
            px={2}
            py={8}
          >
            {/* Manual Input Icon */}
            <Box
              w="120px"
              h="120px"
              borderRadius="lg"
              bg="linear-gradient(135deg, #F4EDFE 0%, #E2E8F0 100%)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mb={6}
              border="2px solid #8A38F5"
            >
              <svg
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="#8A38F5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#8A38F5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#8A38F5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Box>

            <Text
              color="gray.700"
              fontWeight="medium"
              textAlign="center"
              mb={6}
              fontSize="lg"
              maxW="400px"
            >
              Enter Visitor ID manually
            </Text>

            {/* Visitor ID Input */}
            <Stack
              direction="row"
              gap={3}
              justify="center"
              mb={6}
              flexWrap="wrap"
            >
              <OTPInput
                value={visitorId}
                onChange={handleVisitorIdChange}
                numInputs={6}
                inputType="tel"
                shouldAutoFocus
                renderInput={(props, idx) => (
                  <input
                    {...props}
                    key={idx}
                    aria-label={`Visitor ID digit ${idx + 1}`}
                    tabIndex={0}
                    style={{
                      width: 44,
                      height: 48,
                      fontSize: 18,
                      borderRadius: 8,
                      border: "2px solid #8A38F5",
                      textAlign: "center",
                      background: "white",
                      color: "black",
                      marginLeft: 2,
                      marginRight: 2,
                      outline: "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }}
                    maxLength={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                )}
              />
            </Stack>

            {/* Submit Button */}
            <Button
              bg="#8A38F5"
              color="white"
              w="full"
              maxW="320px"
              size="lg"
              borderRadius="md"
              fontWeight="bold"
              onClick={handleSubmit}
              aria-label="Submit Visitor ID"
              tabIndex={0}
              _hover={{ bg: "#7a2ed6" }}
              _active={{ bg: "#6b28be" }}
              fontSize="lg"
              h="56px"
              disabled={isProcessing}
              opacity={isProcessing ? 0.6 : 1}
              cursor={isProcessing ? "not-allowed" : "pointer"}
            >
              {isProcessing ? "Processing..." : (isCheckout ? "Check Out Visitor" : "Check In Visitor")}
            </Button>
          </Flex>
        </Flex>

        {/* Fixed Submit Button at Bottom - Only on Mobile */}
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          p={3}
          zIndex={20}
          display={{ base: "block", md: "none" }}
        >
          <Button
            bg="#8A38F5"
            color="white"
            w="full"
            maxW={{ base: "280px", sm: "320px" }}
            size="lg"
            borderRadius="md"
            fontWeight="bold"
            onClick={handleSubmit}
            aria-label="Submit Visitor ID"
            tabIndex={0}
            _hover={{ bg: "#7a2ed6" }}
            _active={{ bg: "#6b28be" }}
            fontSize={{ base: "md", sm: "lg" }}
            h="48px"
            mx="auto"
            display="block"
            disabled={isProcessing}
            opacity={isProcessing ? 0.6 : 1}
            cursor={isProcessing ? "not-allowed" : "pointer"}
          >
            {isProcessing ? "Processing..." : "Submit"}
          </Button>
        </Box>

        {/* Custom Scan Overlay Button for Native Scanner - Only visible when native scanning is active */}
        {nativeScanActive && !isWebEnvironment && (
          <Box
            position="fixed"
            bottom={0}
            left={0}
            right={0}
            bg="rgba(0, 0, 0, 0.7)"
            px={6}
            py={6}
            pb="calc(1.5rem + env(safe-area-inset-bottom, 20px))"
            zIndex={9999}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Flex
              direction="column"
              align="center"
              gap={3}
              w="full"
              maxW="400px"
            >
              <Text
                color="white"
                fontSize="sm"
                textAlign="center"
                fontWeight="medium"
              >
                Position the QR code within the frame
              </Text>
              <Button
                bg="#8A38F5"
                color="white"
                w="full"
                size="lg"
                borderRadius="md"
                fontWeight="bold"
                onClick={() => {
                  setNativeScanActive(false);
                  setScanning(false);
                }}
                aria-label="Cancel scan"
                tabIndex={0}
                _hover={{ bg: "#7a2ed6" }}
                _active={{ bg: "#6b28be" }}
                fontSize="md"
                h="50px"
                minH="50px"
              >
                Cancel Scan
              </Button>
            </Flex>
          </Box>
        )}

        {/* Background Logo - Web Only */}
        <Box
          display={{ base: "none", md: "flex" }}
          justifyContent="center"
          alignItems="center"
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={1}
          pointerEvents="none"
        >
          <Box transform="scale(5)" opacity={0.15}>
            <Logo />
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default Scanner;
