"use client";

import { useEffect, useState } from "react";
import { Box, Text, VStack, Flex, Button, useDisclosure } from "@chakra-ui/react";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import { fetchVisitorQR } from "@/app/api/scan-qr/routes";
import { useSearchParams, useRouter } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import DesktopHeader from "@/components/DesktopHeader";

// Helper function to format address from location object
const formatAddress = (location: unknown): string => {
  if (!location || typeof location !== 'object') return '';

  const loc = location as Record<string, unknown>;
  const parts = [];

  // Add building number if available
  if (loc.buildingNo && typeof loc.buildingNo === 'string' && loc.buildingNo.trim()) {
    parts.push(loc.buildingNo.trim());
  }

  // Add street if available
  if (loc.street && typeof loc.street === 'string' && loc.street.trim()) {
    parts.push(loc.street.trim());
  }

  // Add locality if available
  if (loc.locality && typeof loc.locality === 'string' && loc.locality.trim()) {
    parts.push(loc.locality.trim());
  }

  // Add city if available
  if (loc.city && typeof loc.city === 'string' && loc.city.trim()) {
    parts.push(loc.city.trim());
  }

  // Add state if available
  if (loc.state && typeof loc.state === 'string' && loc.state.trim()) {
    parts.push(loc.state.trim());
  }

  // Add pincode if available
  if (loc.pincode && typeof loc.pincode === 'string' && loc.pincode.trim()) {
    parts.push(loc.pincode.trim());
  }

  return parts.join(', ');
};

const VisitorsQR = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const { open: isLogoutOpen, onClose: onLogoutClose } = useDisclosure();

  const handleBack = () => {
    const visitorId = searchParams.get("id");
    const source = searchParams.get("source");
    
    if (visitorId && source === "admin") {
      // Coming from admin page - go back to visitor-checkInOrCheckOut-preview
      router.push(`/visitor-checkInOrCheckOut-preview?id=${visitorId}`);
    } else if (visitorId && source === "host") {
      // Coming from host page - go back to host-visitor/preview
      router.push(`/host-visitor/preview?visitorId=${visitorId}`);
    } else if (visitorId) {
      // Fallback for backward compatibility - default to host
      router.push(`/host-visitor/preview?visitorId=${visitorId}`);
    } else {
      // No visitorId - use browser back
      router.back();
    }
  };


  const confirmLogout = () => {
    localStorage.removeItem("authData");
    router.push("/login");
  };

  useEffect(() => {
    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (!authDataRaw) {
      setError("No auth data found");
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;
      const visitorId = searchParams.get("id"); // Get visitor ID from URL params
      if (!visitorId || !token) {
        setError("Missing visitor id or token. Please login again.");
        setLoading(false);
        return;
      }
      fetchVisitorQR(visitorId, token)
        .then((data) => {
          setQrCode(data.qrCode);
          setOtp(data.otp);
          setHostName(data.hostName);
          setCompanyName(data.companyName);
          setLocation(data.location);
          setError(null);
        })
        .catch((err) => {
          setError(err.message || "Failed to fetch QR/OTP");
        })
        .finally(() => setLoading(false));
    } catch {
      setError("Invalid auth data");
      setLoading(false);
    }
  }, [searchParams]);

  return (
    <Box minH="100vh" w="full" display="flex" flexDirection="column">
      {/* Desktop Header - Fixed and Hidden on Mobile */}
      <Box position="fixed" top={0} left={0} right={0} zIndex={1000} display={{ base: "none", md: "block" }}>
        <DesktopHeader />
      </Box>

      {/* Desktop Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        bg="#F0E6FF"
        minH="100vh"
        position="relative"
        overflow="auto"
        pt="60px"
        pb={8}
      >
        {/* Decorative Background Logo */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.15}
          zIndex={1}
        >
          <Box transform="scale(5)">
            <Logo />
          </Box>
        </Box>

        {/* Back Button - Below Header */}
        <Box position="relative" zIndex={2} p='16px'>
          <Button
            onClick={handleBack}
            color="var(--Primary-Dark, #5F24AC)"
            bg="white"
            _hover={{ bg: "gray.50" }}
            borderRadius="md"
            boxShadow="0 2px 4px rgba(0,0,0,0.1)"
            border="1px solid"
            borderColor="gray.200"
            px={4}
            py={2}
            fontSize="14px"
            fontWeight="500"
          >
            <FiChevronLeft size={20} style={{ marginRight: '8px' }} />
            Back
          </Button>
        </Box>

        {/* Main Content */}
        <Box position="relative" zIndex={2} p={4} pt={0} minH="calc(100vh - 60px)" display="flex" alignItems="center" justifyContent="center">
          <Box
            bg="white"
            borderRadius="20px"
            boxShadow="0 8px 32px rgba(0,0,0,0.1)"
            p={6}
            w="100%"
            maxW="600px"
            minH="500px"
            mx="auto"
            textAlign="center"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
            my={8}
          >
            {/* Logo */}
            <Box
              w="60px"
              h="50px"
              mx="auto"
              mb={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Logo />
            </Box>

            {/* Invitation Text */}
            <Text
              fontWeight="bold"
              fontSize="xl"
              textAlign="center"
              color="#000"
              mb={2}
              fontFamily="Roboto, sans-serif"
            >
              {loading
                ? "Loading..."
                : hostName
                  ? `${hostName} has invited you.`
                  : "Host has invited you."}
            </Text>

            <Text
              fontSize="md"
              color="#666"
              textAlign="center"
              mb={6}
              fontFamily="Roboto, sans-serif"
            >
              Show this QR code or Visitor ID to the security Guard
            </Text>

            {/* QR Code Container */}
            <Box
              position="relative"
              w="200px"
              h="200px"
              mx="auto"
              my="20px"
            >
              {/* Corners */}
              {["", "scaleX(-1)", "scaleY(-1)", "scaleX(-1) scaleY(-1)"].map(
                (transform, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    {...(i < 2 ? { top: 0 } : { bottom: 0 })}
                    {...(i % 2 === 0 ? { left: 0 } : { right: 0 })}
                    w="35px"
                    h="35px"
                    style={transform ? { transform } : undefined}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none">
                      <path
                        d="M38 2 Q2 2 2 38"
                        stroke="#8A37F7"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Box>
                )
              )}
              {/* QR code image */}
              <Box
                position="absolute"
                top="17px"
                left="17px"
                w="166px"
                h="166px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="white"
                borderRadius="md"
                overflow="hidden"
              >
                {qrCode ? (
                  <Image
                    src={qrCode}
                    alt="QR Code"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <Box w="80%" h="80%" bg="gray.200" borderRadius="md" />
                )}
              </Box>
            </Box>

            {/* Or divider */}
            <Text
              fontSize="md"
              color="#666"
              textAlign="center"
              fontWeight="medium"
              mb={3}
              fontFamily="Roboto, sans-serif"
            >
              Or
            </Text>

            {/* OTP */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="#000"
              textAlign="center"
              letterSpacing="2px"
              fontFamily="mono"
              mb={4}
            >
              {loading ? "------" : otp || "------"}
            </Text>

            {/* Company info */}
            <VStack gap={3} w="full">
              <Text
                fontSize="lg"
                fontWeight="600"
                color="#000"
                textAlign="center"
                fontFamily="Roboto, sans-serif"
              >
                {loading ? "Loading..." : companyName || "Company"}
              </Text>
              {location && (
                <Text
                  fontSize="sm"
                  color="#666"
                  textAlign="center"
                  px={4}
                  fontFamily="Roboto, sans-serif"
                >
                  {(() => {
                    if (typeof location === 'string') {
                      try {
                        const parsed = JSON.parse(location);
                        return formatAddress(parsed);
                      } catch {
                        return location;
                      }
                    } else if (typeof location === 'object' && location !== null) {
                      return formatAddress(location);
                    }
                    return location;
                  })()}
                </Text>
              )}
            </VStack>

            {/* Status Messages */}
            {loading && (
              <Text fontSize="md" color="gray.500" mt={4}>
                Loading QR code...
              </Text>
            )}
            {error && (
              <Text fontSize="md" color="red.500" mt={4}>
                {error}
              </Text>
            )}
          </Box>
          <Box h={8} /> {/* Bottom spacing */}
        </Box>
      </Box>

      {/* Mobile Layout - Hidden on Desktop */}
      <Flex
        direction="column" 
        minH="100vh"
        bg="#f4edfefa"
        align="center"
        w="full"
        display={{ base: "flex", md: "none" }}
      >
        {/* Mobile Header */}
        <Flex
          w="full"
          align="center"
          px={4}
          py={3}
          bg="#f4edfefa"
          borderBottom="1px solid #f1f1f1"
        >
          <Text
            flex={1}
            textAlign="center"
            fontWeight="bold"
            fontSize="lg"
            color="gray.800"
          >
            Visitor QR
          </Text>
        </Flex>

        {/* Mobile Back Button - Below Header */}
        <Box w="full" px={4} pb={0}>
          <Button mb='16px'
            onClick={handleBack}
            color="var(--Primary-Dark, #5F24AC)"
            bg="white"
            _hover={{ bg: "gray.50" }}
            borderRadius="md"
            boxShadow="0 2px 4px rgba(0,0,0,0.1)"
            border="1px solid"
            borderColor="gray.200"
            px={4}
            py={2}
            fontSize="14px"
            fontWeight="500"
          >
            <FiChevronLeft size={20} style={{ marginRight: '8px' }} />
            Back
          </Button>
        </Box>

        <Box
          w="full"
          maxW={{ base: "90%", sm: "400px", md: "450px" }}
          mx="auto"
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="flex-start"
          gap={4}
          pt={0}
          pb={4}
        >
          {/* Top Section - Logo and QR */}
          <VStack gap={4} flex={1} justifyContent="center">
            {/* Logo and invitation */}
            {/* <Box
              w={{ base: "50px", sm: "55px", md: "60px" }}
              h={{ base: "42px", sm: "47px", md: "52px" }}
              mx="auto"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Logo />
            </Box> */}

            <Text fontWeight="bold" fontSize={{ base: "md", sm: "lg" }} textAlign="center" color={"#000"} px={4}>
              {loading
                ? "Loading..."
                : hostName
                  ? `${hostName} has invited you.`
                  : "Host has invited you."}
            </Text>
            <Text fontSize={{ base: "xs", sm: "sm" }} color="#18181B" textAlign="center" px={4}>
              Show this QR code or Visitor ID to the security Guard
            </Text>
            {/* QR code with corners */}
            <Box
              position="relative"
              w={{ base: "160px", sm: "180px", md: "200px" }}
              h={{ base: "160px", sm: "180px", md: "200px" }}
              mx="auto"
              my="20px"
            >
              {/* Corners */}
              {["", "scaleX(-1)", "scaleY(-1)", "scaleX(-1) scaleY(-1)"].map(
                (transform, i) => (
                  <Box
                    key={i}
                    position="absolute"
                    {...(i < 2 ? { top: 0 } : { bottom: 0 })}
                    {...(i % 2 === 0 ? { left: 0 } : { right: 0 })}
                    w={{ base: "28px", sm: "32px", md: "35px" }}
                    h={{ base: "28px", sm: "32px", md: "35px" }}
                    style={transform ? { transform } : undefined}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 40 40" fill="none">
                      <path
                        d="M38 2 Q2 2 2 38"
                        stroke="#8A37F7"
                        strokeWidth="3"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Box>
                )
              )}
              {/* QR code image or placeholder */}
              <Box
                position="absolute"
                top={{ base: "14px", sm: "16px", md: "17px" }}
                left={{ base: "14px", sm: "16px", md: "17px" }}
                w={{ base: "132px", sm: "148px", md: "166px" }}
                h={{ base: "132px", sm: "148px", md: "166px" }}
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="white"
                borderRadius="md"
                overflow="hidden"
              >
                {qrCode ? (
                  <Image
                    src={qrCode}
                    alt="QR Code"
                    fill
                    style={{ objectFit: "contain" }}
                  />
                ) : (
                  <Box w="80%" h="80%" bg="gray.200" borderRadius="md" />
                )}
              </Box>
            </Box>
            {/* Or divider */}
            <Text
              fontSize={{ base: "xs", sm: "sm" }}
              color="#181a1b"
              textAlign="center"
              fontWeight="medium"
            >
              Or
            </Text>
            {/* OTP */}
            <Text
              fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
              fontWeight="bold"
              color="#181a1b"
              textAlign="center"
              letterSpacing={{ base: "1px", sm: "1px" }}
              fontFamily="mono"
            >
              {loading ? "------" : otp || "------"}
            </Text>
            {loading && (
              <Text fontSize="sm" color="gray.500">
                Loading QR code...
              </Text>
            )}
            {error && (
              <Text fontSize="sm" color="red.500">
                {error}
              </Text>
            )}
          </VStack>

          {/* Bottom Section - Company info and decoration */}
          <VStack gap={2} justifyContent="flex-end" mt={2}>
            {/* Company info */}
            <VStack
              gap={{ base: "1px", sm: "2px" }}
              w="full"
              maxW={{ base: "240px", sm: "260px", md: "280px" }}
            >
              <Text
                fontSize={{ base: "xs", sm: "sm", md: "sm" }}
                fontWeight="medium"
                color="#181a1b"
                textAlign="center"
                lineHeight={{ base: "16px", sm: "18px", md: "20px" }}
              >
                {loading ? "Loading..." : companyName || "Company"}
              </Text>
              {location && (
                <Text
                  fontSize={{ base: "xs", sm: "xs" }}
                  color="#181a1b"
                  textAlign="center"
                  lineHeight={{ base: "14px", sm: "16px", md: "18px" }}
                  px={{ base: 2, sm: 3, md: 4 }}
                >
                  {(() => {
                    if (typeof location === 'string') {
                      try {
                        const parsed = JSON.parse(location);
                        return formatAddress(parsed);
                      } catch {
                        return location;
                      }
                    } else if (typeof location === 'object' && location !== null) {
                      return formatAddress(location);
                    }
                    return location;
                  })()}
                </Text>
              )}
            </VStack>

            <svg
              width="200"
              height="140"
              viewBox="0 0 389 263"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_258_17849)">
                <path
                  d="M112.15 142.377C112.15 142.377 117.476 131.734 116.414 122.159L134.137 131.337L133.453 148.76L112.15 142.377Z"
                  fill="#9F616A"
                />
                <path
                  d="M123.971 135.459C132.802 135.459 139.961 128.305 139.961 119.481C139.961 110.656 132.802 103.502 123.971 103.502C115.14 103.502 107.98 110.656 107.98 119.481C107.98 128.305 115.14 135.459 123.971 135.459Z"
                  fill="#9F616A"
                />
                <path
                  d="M135.585 142.377L112.151 139.186L94.0429 147.7L92.9805 213.681C92.9805 213.681 137.518 219.003 144.536 212.085C151.554 205.168 146.23 149.829 146.23 149.829L135.578 142.377H135.585Z"
                  fill="#5F24AC"
                />
                <path
                  d="M111.299 122.285C112.089 125.011 110.405 128.212 110.405 128.212L109.621 127.981C109.621 127.981 98.6812 103.005 116.495 99.7367C134.308 96.4681 139.774 110.012 139.774 110.012C139.774 110.012 141.037 116.554 138.83 114.768C136.622 112.982 124.019 113.684 124.019 113.684L114.697 113.168C114.697 113.168 110.508 119.558 111.299 122.285Z"
                  fill="#090814"
                />
                <path
                  d="M96.1824 207.298L92.9883 216.955V250.137L105.29 361.153L120.381 359.587L123.413 278.8L121.747 243.488L157.463 297.485L139.489 353.007H154.433C154.433 353.007 184.886 288.724 181.018 283.02C177.151 277.315 142.529 210.017 142.529 210.017C142.529 210.017 96.1955 208.366 96.1955 207.305L96.1824 207.298Z"
                  fill="#090814"
                />
                <path
                  d="M86.593 168.984L81.4459 177.408C81.4459 177.408 74.1672 205.996 81.4459 206.112C88.7247 206.229 103.42 191.546 103.42 191.546L101.501 183.882L96.1753 186.012L97.2378 168.986H86.593V168.984Z"
                  fill="#9F616A"
                />
                <path
                  d="M102.569 147.569C102.569 147.569 85.5304 144.569 83.9334 155.712C82.3363 166.855 81.4453 177.416 81.4453 177.416L99.9098 178.944L102.569 147.569Z"
                  fill="#5F24AC"
                />
                <path
                  d="M140.393 221.453L164.438 200.979C164.713 200.73 164.878 200.381 164.897 200.011C164.916 199.64 164.787 199.277 164.538 199.001L125.599 153.337C125.366 153.048 125.028 152.863 124.658 152.823C124.289 152.782 123.919 152.89 123.629 153.122L99.5842 173.597C99.3089 173.846 99.1438 174.194 99.1249 174.565C99.106 174.936 99.2349 175.299 99.4834 175.575L138.425 221.239C138.658 221.527 138.996 221.712 139.365 221.752C139.734 221.792 140.103 221.685 140.393 221.453Z"
                  fill="white"
                />
                <path
                  d="M140.393 221.453L164.438 200.979C164.713 200.73 164.878 200.381 164.897 200.011C164.916 199.64 164.787 199.277 164.538 199.001L125.599 153.337C125.366 153.048 125.028 152.863 124.658 152.823C124.289 152.782 123.919 152.89 123.629 153.122L99.5842 173.597C99.3089 173.846 99.1438 174.194 99.1249 174.565C99.106 174.936 99.2349 175.299 99.4834 175.575L138.425 221.239C138.658 221.527 138.996 221.712 139.365 221.752C139.734 221.792 140.103 221.685 140.393 221.453Z"
                  stroke="#2F2E41"
                  strokeMiterlimit="10"
                />
                <path
                  d="M151.98 155.76L161.658 157.759C161.658 157.759 187.525 171.985 182.631 177.375C177.737 182.765 156.971 183.456 156.971 183.456L152.68 176.82L157.875 174.387L144.701 163.535L151.98 155.76Z"
                  fill="#9F616A"
                />
                <path
                  d="M125.413 152.78C125.413 152.78 134.865 138.295 144.097 144.746C153.329 151.198 161.652 157.76 161.652 157.76L150.149 172.273L125.406 152.78H125.413Z"
                  fill="#5F24AC"
                />
                <path
                  d="M159.401 179.494C158.874 176.892 154.227 175.635 149.022 176.688C143.817 177.74 140.024 180.703 140.552 183.306C141.079 185.909 145.726 187.165 150.931 186.113C156.136 185.06 159.928 182.097 159.401 179.494Z"
                  fill="#9F616A"
                />
                <path
                  d="M114.533 179.463C112.992 177.3 108.235 178.043 103.91 181.121C99.5841 184.2 97.3271 188.449 98.8688 190.612C100.41 192.775 105.167 192.033 109.493 188.954C113.818 185.875 116.075 181.626 114.533 179.463Z"
                  fill="#9F616A"
                />
                <path
                  opacity="0.7"
                  d="M388.315 41.6875V325.662C388.089 325.711 387.863 325.751 387.629 325.785C384.155 326.415 380.634 327.022 377.068 327.607C372.832 328.306 368.537 328.981 364.182 329.634C360.563 330.169 356.908 330.688 353.215 331.191C342.462 332.664 331.418 333.97 320.083 335.109C316.458 335.479 312.802 335.828 309.117 336.157C276.938 339.047 242.736 340.609 207.274 340.609C202.25 340.609 197.256 340.576 192.291 340.512C192.058 340.512 191.832 340.512 191.605 340.505V41.6875H388.315Z"
                  fill="#F2F2F2"
                />
                <path
                  d="M387.629 131.371V132.213L387.718 132.035C387.708 131.812 387.678 131.589 387.629 131.371ZM191.605 220.847L190.92 220.292V281.85H191.605V336.503C191.831 336.51 192.058 336.51 192.291 336.51V179.327C192.065 179.45 191.839 179.567 191.605 179.683V220.847ZM190.92 37.002V336.491C191.146 336.498 191.373 336.505 191.606 336.505C191.839 336.505 192.058 336.512 192.292 336.512V38.3701H387.629V321.784C387.862 321.75 388.088 321.708 388.315 321.661C388.541 321.627 388.774 321.585 389 321.538V37.002H190.92Z"
                  fill="#D6D6E3"
                />
                <path
                  d="M320.084 241.564V314.109C316.458 314.478 312.802 314.828 309.117 315.157V241.564H320.084Z"
                  fill="#3F3D56"
                />
                <path
                  d="M315.968 251.837H0V264.85H315.968V251.837Z"
                  fill="#5F24AC"
                />
                <path
                  d="M130.677 192.773C130.783 191.263 131.335 189.819 132.262 188.622C133.19 187.426 134.451 186.531 135.888 186.051C137.324 185.571 138.871 185.527 140.332 185.926C141.793 186.324 143.103 187.146 144.096 188.289C145.089 189.431 145.721 190.842 145.912 192.344C146.103 193.845 145.844 195.369 145.167 196.724C144.491 198.078 143.429 199.202 142.114 199.953C140.798 200.703 139.29 201.048 137.779 200.942C135.754 200.798 133.869 199.857 132.538 198.325C131.206 196.794 130.537 194.797 130.677 192.773ZM140.862 193.487C140.897 192.983 140.782 192.481 140.532 192.043C140.282 191.605 139.907 191.251 139.455 191.026C139.003 190.801 138.495 190.714 137.994 190.778C137.493 190.841 137.023 191.052 136.642 191.383C136.26 191.714 135.986 192.15 135.853 192.637C135.72 193.124 135.735 193.639 135.895 194.117C136.055 194.596 136.353 195.016 136.752 195.325C137.151 195.634 137.633 195.818 138.137 195.853C138.812 195.899 139.478 195.677 139.989 195.233C140.5 194.789 140.814 194.161 140.862 193.487L140.862 193.487Z"
                  fill="#090814"
                />
                <path
                  d="M118.66 181.703C118.683 181.369 118.772 181.043 118.922 180.744C119.072 180.444 119.279 180.177 119.532 179.958L123.619 176.409C123.872 176.189 124.166 176.021 124.484 175.915C124.802 175.809 125.138 175.766 125.472 175.79C125.806 175.813 126.133 175.902 126.433 176.052C126.733 176.201 127 176.408 127.22 176.661L136.69 187.553C137.134 188.063 137.357 188.73 137.31 189.404C137.262 190.079 136.948 190.708 136.437 191.152C135.926 191.595 135.26 191.818 134.584 191.771C133.909 191.724 133.28 191.41 132.836 190.899L125.041 181.931L122.88 183.807C122.499 184.138 122.028 184.348 121.528 184.412C121.027 184.475 120.518 184.389 120.067 184.164C119.615 183.939 119.24 183.585 118.99 183.147C118.739 182.708 118.625 182.206 118.66 181.703Z"
                  fill="#090814"
                />
                <path
                  d="M123.395 187.148C123.419 186.814 123.508 186.488 123.657 186.189C123.807 185.89 124.014 185.623 124.267 185.403L128.354 181.854C128.868 181.429 129.527 181.221 130.191 181.275C130.856 181.329 131.473 181.641 131.91 182.143C132.348 182.646 132.571 183.3 132.532 183.965C132.493 184.63 132.196 185.254 131.703 185.703L127.616 189.252C127.234 189.583 126.764 189.793 126.263 189.857C125.762 189.921 125.254 189.834 124.802 189.609C124.35 189.384 123.976 189.03 123.725 188.592C123.475 188.154 123.36 187.651 123.395 187.148Z"
                  fill="#090814"
                />
                <path
                  d="M289.96 99.8652C279.716 99.8652 271.373 91.0144 271.373 80.1357C271.373 69.257 279.711 60.4062 289.96 60.4062C300.21 60.4062 308.547 69.257 308.547 80.1357C308.547 91.0144 300.209 99.8652 289.96 99.8652ZM289.96 65.39C282.462 65.39 276.363 72.0041 276.363 80.1323C276.363 88.2606 282.463 94.8747 289.96 94.8747C297.458 94.8747 303.558 88.2577 303.558 80.1323C303.558 72.007 297.458 65.39 289.96 65.39Z"
                  fill="#D6D6E3"
                />
                <path
                  d="M307.56 134.249H272.353C269.249 134.245 266.273 133.011 264.079 130.818C261.884 128.625 260.65 125.651 260.646 122.549V88.0447C260.648 85.9199 261.494 83.8827 262.997 82.3803C264.501 80.8779 266.54 80.0331 268.666 80.0312H311.255C313.381 80.0327 315.42 80.8774 316.923 82.3799C318.427 83.8824 319.272 85.9198 319.274 88.0447V122.549C319.271 125.652 318.036 128.627 315.84 130.82C313.644 133.014 310.666 134.247 307.561 134.249L307.56 134.249Z"
                  fill="#5F24AC"
                />
                <path
                  d="M296.82 99.6628C296.821 98.4442 296.496 97.2475 295.881 96.1957C295.265 95.144 294.379 94.2753 293.316 93.6791C292.252 93.083 291.049 92.7809 289.83 92.804C288.61 92.827 287.419 93.1745 286.379 93.8105C285.339 94.4464 284.487 95.348 283.912 96.4223C283.336 97.4966 283.058 98.7047 283.105 99.9224C283.152 101.14 283.523 102.323 284.18 103.35C284.836 104.377 285.755 105.21 286.841 105.764V116.489H293.082V105.764C294.207 105.19 295.152 104.316 295.811 103.239C296.471 102.163 296.82 100.925 296.82 99.6628Z"
                  fill="#F2F2F2"
                />
              </g>
              <defs>
                <clipPath id="clip0_258_17849">
                  <rect width="389" height="377" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </VStack>
        </Box>
      </Flex>

      {/* Logout Confirmation Modal */}
      {isLogoutOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            bg="white"
            borderRadius="lg"
            p={6}
            maxW="400px"
            w="90%"
            boxShadow="xl"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.800">
              Confirm Logout
            </Text>
            <Text color="gray.600" mb={6}>
              Are you sure you want to logout? You will need to login again to access the system.
            </Text>
            <Flex gap={3} justifyContent="flex-end">
              <Button
                variant="outline"
                onClick={onLogoutClose}
                color="gray.600"
                borderColor="gray.300"
                _hover={{ bg: "gray.50" }}
              >
                Cancel
              </Button>
              <Button
                bg="red.500"
                color="white"
                _hover={{ bg: "red.600" }}
                onClick={confirmLogout}
              >
                Logout
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VisitorsQR;
