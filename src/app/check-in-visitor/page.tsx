"use client";
import { Box, Flex, Text } from "@chakra-ui/react";
import { ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiChevronLeft } from "react-icons/fi";
import dynamic from "next/dynamic";

// Dynamically import DashboardPage to avoid circular dependency
const DashboardPage = dynamic(() => import("../dashboard/page"), {
  ssr: false,
  loading: () => <Box>Loading...</Box>
});

// SVGs for icons
const AddVisitorIcon = () => (
  <svg
    width="180"
    height="160"
    viewBox="0 0 150 145"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.2002 1.2002H138.8C144.599 1.2002 149.3 5.90121 149.3 11.7002V133.3C149.3 139.099 144.599 143.8 138.8 143.8H11.2002C5.40121 143.8 0.700195 139.099 0.700195 133.3V11.7002C0.700195 5.90121 5.4012 1.2002 11.2002 1.2002Z"
      fill="#D3F8DF"
    />
    <path
      d="M11.2002 1.2002H138.8C144.599 1.2002 149.3 5.90121 149.3 11.7002V133.3C149.3 139.099 144.599 143.8 138.8 143.8H11.2002C5.40121 143.8 0.700195 139.099 0.700195 133.3V11.7002C0.700195 5.90121 5.4012 1.2002 11.2002 1.2002Z"
      stroke="#23A36D"
      strokeWidth="1.4"
    />
    <path
      d="M100.667 90.7143V98H56.6667V90.7143C56.6667 90.7143 56.6667 76.1429 78.6667 76.1429C100.667 76.1429 100.667 90.7143 100.667 90.7143ZM89.6667 57.9286C89.6667 55.7671 89.0215 53.6542 87.8128 51.857C86.6041 50.0598 84.8862 48.6591 82.8762 47.8319C80.8662 47.0047 78.6545 46.7883 76.5207 47.21C74.3869 47.6317 72.4269 48.6725 70.8885 50.2009C69.3501 51.7293 68.3025 53.6766 67.878 55.7965C67.4536 57.9165 67.6714 60.1138 68.504 62.1108C69.3366 64.1077 70.7465 65.8145 72.5554 67.0153C74.3643 68.2162 76.4911 68.8571 78.6667 68.8571C81.584 68.8571 84.3819 67.7057 86.4448 65.6562C88.5077 63.6067 89.6667 60.827 89.6667 57.9286ZM101.4 76.3614C103.404 78.1985 105.02 80.4139 106.153 82.8782C107.287 85.3425 107.914 88.0063 108 90.7143V98H119V90.7143C119 90.7143 119 78.1464 101.4 76.3614ZM97 47C95.8922 47.0007 94.7912 47.1727 93.7367 47.51C95.8819 50.5662 97.032 54.2026 97.032 57.9286C97.032 61.6546 95.8819 65.2909 93.7367 68.3471C94.7912 68.6844 95.8922 68.8565 97 68.8571C99.9174 68.8571 102.715 67.7057 104.778 65.6562C106.841 63.6067 108 60.827 108 57.9286C108 55.0301 106.841 52.2504 104.778 50.2009C102.715 48.1514 99.9174 47 97 47ZM60.3333 65.2143H49.3333V54.2857H42V65.2143H31V72.5H42V83.4286H49.3333V72.5H60.3333V65.2143Z"
      fill="black"
    />
  </svg>
);

const ExistingVisitorIcon = () => (
  <svg
    width="180"
    height="160"
    viewBox="0 0 150 145"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.2002 1.2002H138.8C144.599 1.2002 149.3 5.90121 149.3 11.7002V133.3C149.3 139.099 144.599 143.8 138.8 143.8H11.2002C5.40121 143.8 0.700195 139.099 0.700195 133.3V11.7002C0.700195 5.90121 5.4012 1.2002 11.2002 1.2002Z"
      fill="#F4EDFE"
    />
    <path
      d="M11.2002 1.2002H138.8C144.599 1.2002 149.3 5.90121 149.3 11.7002V133.3C149.3 139.099 144.599 143.8 138.8 143.8H11.2002C5.40121 143.8 0.700195 139.099 0.700195 133.3V11.7002C0.700195 5.90121 5.4012 1.2002 11.2002 1.2002Z"
      stroke="#8A38F5"
      strokeWidth="1.4"
    />
    <path
      d="M87.8333 90.7143V98H43.8333V90.7143C43.8333 90.7143 43.8333 76.1429 65.8333 76.1429C87.8333 76.1429 87.8333 90.7143 87.8333 90.7143ZM76.8333 57.9286C76.8333 55.7671 76.1881 53.6542 74.9794 51.857C73.7707 50.0598 72.0528 48.6591 70.0428 47.8319C68.0328 47.0047 65.8211 46.7883 63.6873 47.21C61.5535 47.6317 59.5935 48.6725 58.0551 50.2009C56.5167 51.7293 55.4691 53.6766 55.0446 55.7965C54.6202 57.9165 54.838 60.1138 55.6706 62.1108C56.5031 64.1077 57.913 65.8145 59.722 67.0153C61.5309 68.2162 63.6577 68.8571 65.8333 68.8571C68.7506 68.8571 71.5485 67.7057 73.6114 65.6562C75.6743 63.6067 76.8333 60.827 76.8333 57.9286ZM88.5666 76.3614C90.5709 78.1985 92.1868 80.4139 93.32 82.8782C94.4532 85.3425 95.0809 88.0063 95.1666 90.7143V98H106.167V90.7143C106.167 90.7143 106.167 78.1464 88.5666 76.3614ZM84.1666 47C83.0588 47.0007 81.9578 47.1727 80.9033 47.51C83.0484 50.5662 84.1986 54.2026 84.1986 57.9286C84.1986 61.6546 83.0484 65.2909 80.9033 68.3471C81.9578 68.6844 83.0588 68.8565 84.1666 68.8571C87.084 68.8571 89.8819 67.7057 91.9448 65.6562C94.0077 63.6067 95.1666 60.827 95.1666 57.9286C95.1666 55.0301 94.0077 52.2504 91.9448 50.2009C89.8819 48.1514 87.084 47 84.1666 47Z"
      fill="black"
    />
  </svg>
);

// HeaderBar component for mobile
const HeaderBar = (): ReactElement => {
  const router = useRouter();
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
        bg="#FFFFFF"
        _hover={{ bg: 'gray.100' }}
        p={0}
        cursor="pointer"
        onClick={() => router.push("/dashboard")}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push("/dashboard"); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize="sm" color="#181a1b">Check-In</Text>
    </Flex>
  );
};

// VisitorCard component
interface VisitorCardProps {
  label: string;
  icon: ReactElement;
  tabIndex?: number;
  ariaLabel?: string;
  role?: string;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const VisitorCard = ({
  label,
  icon,
  tabIndex,
  ariaLabel,
  role,
  onClick,
  onKeyDown,
}: VisitorCardProps): ReactElement => (
  <Box
    bg="white"
    borderRadius="lg"
    border="1px solid #dce0e3"
    boxShadow="0 2px 16px rgba(95,36,172,0.27)"
    p="42.35px"
    w={{ base: "290px", sm: "350px", md: "380px", lg: "408px" }}
    h={{ base: "260px", sm: "300px", md: "350px", lg: "400px" }}
    maxW={{ base: "320px", sm: "350px", md: "380px", lg: "408px" }}
    mx="auto"
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    gap="12.1px"
    mb={4}
    tabIndex={tabIndex}
    aria-label={ariaLabel}
    role={role}
    onClick={onClick}
    onKeyDown={onKeyDown}
    cursor="pointer"
    transform="rotate(0deg)"
    position="relative"
    zIndex={1002}
    opacity={1}
    isolation="isolate"
  >
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={{ base: "130px", sm: "140px", md: "160px", lg: "180px" }}
      h={{ base: "120px", sm: "130px", md: "150px", lg: "160px" }}
    >
      {icon}
    </Box>
    <Text
      fontWeight="bold"
      fontSize={{ base: "lg", sm: "xl", md: "2xl", lg: "3xl" }}
      color="#181a1b"
      textAlign="center"
    >
      {label}
    </Text>
  </Box>
);

// Modal Overlay Component for Web
const CheckInModalOverlay = (): ReactElement => {
  const router = useRouter();

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      router.push("/dashboard");
    }
  };

  const handleBackClick = () => {
    router.push("/dashboard");
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(38, 38, 38, 0.85)"
      zIndex={1001}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={handleBackdropClick}
      tabIndex={-1}
      aria-label="Check-in visitor modal"
    >
      {/* Back Button */}
      <Box
        position="absolute"
        top={6}
        left={6}
        as="button"
        tabIndex={0}
        aria-label="Go back to dashboard"
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="40px"
        h="40px"
        borderRadius="full"
        bg="white"
        _hover={{ bg: "gray.100" }}
        cursor="pointer"
        onClick={handleBackClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleBackClick();
          }
        }}
        boxShadow="0 2px 8px rgba(0,0,0,0.15)"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15 18l-6-6 6-6"
            stroke="#18181B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>

      <Flex
        gap="50px"
        alignItems="center"
        justifyContent="center"
        flexDirection={{ base: "column", md: "row" }}
        onClick={(e) => e.stopPropagation()}
      >
        <VisitorCard
          label="Add New Visitor"
          icon={<AddVisitorIcon />}
          tabIndex={0}
          ariaLabel="Go to Add New Visitor details"
          role="button"
          onClick={() => router.push("/visitor/add?reset=true")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              router.push("/visitor/add?reset=true");
            }
          }}
        />
        <VisitorCard
          label="Existing Visitor"
          icon={<ExistingVisitorIcon />}
          tabIndex={0}
          ariaLabel="Go to Existing Visitor details"
          role="button"
          onClick={() => router.push("/existing-visitor/visitor-details")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              router.push("/existing-visitor/visitor-details");
            }
          }}
        />
      </Flex>
    </Box>
  );
};

// Main Page
const CheckInVisitor = (): ReactElement => {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Mobile layout - original design
  if (isMobile) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="flex-start"
        minH="100vh"
        bg="#f8fafc"
        overflow="hidden"
        pt={0}
        px={0}
      >
        <HeaderBar />
        <Box
          w="full"
          maxW="390px"
          mx="auto"
          py={{ base: 4, md: 6 }}
          px={{ base: 4, sm: 6, md: 8 }}
          flex={1}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          gap={6}
        >
          <VisitorCard
            label="Add New Visitor"
            icon={<AddVisitorIcon />}
            tabIndex={0}
            ariaLabel="Go to Add New Visitor details"
            role="button"
            onClick={() => router.push("/visitor/add?reset=true")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                router.push("/visitor/add?reset=true");
              }
            }}
          />
          <VisitorCard
            label="Existing Visitor"
            icon={<ExistingVisitorIcon />}
            tabIndex={0}
            ariaLabel="Go to Existing Visitor details"
            role="button"
            onClick={() => router.push("/existing-visitor/visitor-details")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                router.push("/existing-visitor/visitor-details");
              }
            }}
          />
        </Box>
      </Flex>
    );
  }

  // Web layout - modal overlay above dashboard
  return (
    <Box position="relative" w="full" h="100vh">
      <DashboardPage />
      <CheckInModalOverlay />
    </Box>
  );
};

export default CheckInVisitor;
