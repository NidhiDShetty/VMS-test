"use client";
import { Box, Flex, Text, Button, HStack, Stack, VStack, Avatar, IconButton, Heading } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FC, useState, useEffect, useRef } from "react";
import RejectReasonModal from "@/components/modals/visitors/RejectReasonModal";
import Image from "next/image";
import { FiBell, FiChevronDown, FiUser, FiLock, FiChevronLeft } from "react-icons/fi";
import Logo from "@/components/svgs/logo";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../../api/profile/routes";
import { toaster } from "@/components/ui/toaster";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";
import { FRONTEND_URL } from "@/lib/server-urls";
// DesktopHeader component duplicated inline
interface DesktopHeaderProps {
  showDateTime?: boolean;
  showNotifications?: boolean;
  notificationCount?: number;
  className?: string;
}

const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  showDateTime = true,
  showNotifications = true,
  notificationCount = 0,
  className = "",
}) => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);

    const loadProfileAndImage = async () => {
      try {
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        }

        setProfileData(profileData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setLoading(false);
      }
    };

    loadProfileAndImage();
  }, []);

  // Get role name from localStorage
  useEffect(() => {
    const authDataRaw = localStorage.getItem("authData");
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        const role = parsed?.user?.roleName || null;
        setRoleName(role);
      } catch {
        setRoleName(null);
      }
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileMenu && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Logout handlers
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // Clear all auth data
    localStorage.removeItem("authData");
    sessionStorage.removeItem("splashSeen");
    sessionStorage.removeItem("signinSplashSeen");
    sessionStorage.removeItem("justLoggedIn");
    
    // Clear any cached profile data to prevent loading issues
    sessionStorage.removeItem("profileData");
    sessionStorage.removeItem("profileImage");
    
    // Show success message
    toaster.success({
      title: "Logout successful",
      description: "You have been logged out.",
    });
    
    // Use window.location for a full page reload to ensure clean state
    // This prevents Next.js router issues during logout and clears navigation history
    window.location.href = "/vmsapp/";
  };

  const getDisplayRole = () => {
    return roleName === "SuperAdmin" ? "Super Admin" : 
           roleName === "Admin" ? "Admin" :
           roleName === "Host" ? "Host" :
           roleName === "Security" ? "Security" : "User";
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes} ${ampm}`;
  };

  const getDayName = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  return (
    <>
      <Box
        display={{ base: "none", md: "flex" }}
        bg="var(--Primary-Dark, #5F24AC)"
        w="full"
        h="60px"
        px={8}
        alignItems="center"
        justifyContent="space-between"
        className={className}
      >
        {/* Left Side - Logo */}
        <Box>
          <Box
            bg="white"
            w={{ base: "200px", lg: "220px", xl: "250px" }}
            h="40px"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            pl={2}
          >
            <Box
              w={{ base: "40px", lg: "45px", xl: "57.245px" }}
              h="40px"
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
            >
              <Box transform={{ base: "scale(0.5)", lg: "scale(0.6)", xl: "scale(0.7)" }}>
                <Logo />
              </Box>
            </Box>
            <Text
              color="gray.800"
              fontFamily="Roboto, sans-serif"
              fontWeight="600"
              fontSize={{ base: "12px", lg: "14px", xl: "16px" }}
              lineHeight={{ base: "18px", lg: "20px", xl: "24px" }}
              letterSpacing="0%"
              w={{ base: "90px", lg: "100px", xl: "112px" }}
              h={{ base: "18px", lg: "20px", xl: "24px" }}
              ml={1}
              whiteSpace="nowrap"
            >
              HCM Cafe VMS
            </Text>
          </Box>
        </Box>

        {/* Right Side - Date/Time, Notifications and Profile */}
        <Flex alignItems="center" gap={4}>
          {/* Date and Time */}
          {showDateTime && (
            <Box
              bg="var(--Primary-VMS, #8A38F5)"
              borderRadius="md"
              px={4}
              py={2}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Image 
                src={`${FRONTEND_URL}/clock.svg`} 
                alt="Clock" 
                width={16} 
                height={16} 
                style={{ objectFit: "contain" }} 
                priority 
              />
              <Text color="white" fontSize="14px" fontWeight="500">
                {formatDate(currentDateTime)}, {getDayName(currentDateTime)} {formatTime(currentDateTime)}
              </Text>
            </Box>
          )}

          {/* Notification Bell */}
          {showNotifications && (
            <Box position="relative">
              <Box
                bg="white"
                w="40px"
                h="40px"
                borderRadius="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
              >
                <FiBell size={20} color="var(--Primary-Dark, #5F24AC)" />
              </Box>
              <Box
                position="absolute"
                top="-2px"
                right="-2px"
                bg="var(--Primary-Dark, #5F24AC)"
                color="white"
                borderRadius="full"
                w="18px"
                h="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="10px"
                fontWeight="bold"
              >
                {notificationCount}
              </Box>
            </Box>
          )}

          {/* Profile Section with Menu */}
          <Box position="relative">
            <Flex 
              alignItems="center" 
              gap={3}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <Avatar.Root w="40px" h="40px">
                <Avatar.Image
                  src={profileData?.profile.profileImageUrl || ""}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <Avatar.Fallback
                  name={profileData?.profile.name || "User"}
                  w="full"
                  h="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="sm"
                  bg="var(--Primary-Dark, #5F24AC)"
                  color="white"
                />
              </Avatar.Root>
              
              <Box>
                <Flex align="center" gap={1}>
                  <Text
                    color="white"
                    fontSize="16px"
                    fontWeight="600"
                    fontFamily="Roboto, sans-serif"
                  >
                    {loading ? "Loading..." : profileData?.profile.name || "User"}
                  </Text>
                  <FiChevronDown size={16} color="white" />
                </Flex>
                <Text
                  color="white"
                  fontSize="12px"
                  fontWeight="400"
                  opacity={0.9}
                >
                  {getDisplayRole()}
                </Text>
              </Box>
            </Flex>
            
            {/* Custom Dropdown Menu */}
            {showProfileMenu && (
              <Box
                ref={menuRef}
                position="absolute"
                top="100%"
                right={0}
                mt={2}
                minW="200px"
                bg="white"
                borderRadius="md"
                boxShadow="lg"
                border="1px solid"
                borderColor="gray.200"
                zIndex={1000}
              >
                <Box
                  px={4}
                  py={3}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => {
                    router.push("/profile");
                    setShowProfileMenu(false);
                  }}
                >
                  <Flex align="center" gap={3}>
                    <FiUser size={16} />
                    <Text>My Profile</Text>
                  </Flex>
                </Box>
                <Box
                  px={4}
                  py={3}
                  cursor="pointer"
                  _hover={{ bg: "gray.50" }}
                  onClick={() => {
                    router.push("/profile/change-password");
                    setShowProfileMenu(false);
                  }}
                >
                  <Flex align="center" gap={3}>
                    <FiLock size={16} />
                    <Text>Change Password</Text>
                  </Flex>
                </Box>
                <Box
                  h="1px"
                  bg="gray.200"
                  mx={2}
                />
                <Box
                  px={4}
                  py={3}
                  cursor="pointer"
                  _hover={{ bg: "red.50" }}
                  color="red.600"
                  onClick={() => {
                    handleLogout();
                    setShowProfileMenu(false);
                  }}
                >
                  <Flex align="center" gap={3}>
                    <Box w={4} h={4} display="flex" alignItems="center" justifyContent="center">
                      <Image src={`${FRONTEND_URL}/logout.svg`} alt="Logout" width={16} height={16} />
                    </Box>
                    <Text>Logout</Text>
                  </Flex>
                </Box>
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

// Demo data (reuse as needed)
const VISITOR = {
  name: "Marcus Lubin",
  phone: "+91-68665666666",
  purpose: "Business Meeting",
  comingFrom: "Techie Infosystem",
  company: "Crecienttech Infosystem",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  date: "23/06/2025",
  checkIn: "09:00 AM",
  checkOut: "-",
};
const GUESTS = [
  { name: "Phillip Westervelt", avatar: "https://randomuser.me/api/portraits/men/44.jpg" },
  { name: "Roger Ekstrom Bothman", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
];
const ASSETS = [
  { id: "#001", image: "/file.svg" },
  { id: "#002", image: "/file.svg" },
  { id: "#003", image: "/file.svg" },
];

// HeaderBar component removed - using DesktopHeader instead

// Unified Visitor Details Block
const VisitorDetailsBlock: FC = () => (
  <Box
    w="full"
    maxW="342px"
    mx="auto"
    mt={2}
    bg="#f7f7ff"
    borderRadius="lg"
    boxShadow="sm"
    px={4}
    pt={8}
    pb={4}
    position="relative"
  >
    {/* Visitor Info */}
    {/* Avatar - overlaps top border, centered */}
    <Box
      as="span"
      position="absolute"
      top="-30px"
      left="50%"
      transform="translateX(-50%)"
      w="70px"
      h="70px"
      borderRadius="full"
      overflow="hidden"
      bg="gray.200"
      display="flex"
      alignItems="center"
      justifyContent="center"
      tabIndex={0}
      aria-label="Visitor avatar"
    >
      <Image
        src={VISITOR.avatar}
        alt={VISITOR.name}
        width={70}
        height={70}
      />
    </Box>
    <Stack direction="column" gap={1} align="stretch" mt={6}>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Full Name :</Text><Text fontSize="xs">{VISITOR.name}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Phone No :</Text><Text fontSize="xs">{VISITOR.phone}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Purpose of Visit :</Text><Text fontSize="xs">{VISITOR.purpose}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Coming From :</Text><Text fontSize="xs">{VISITOR.comingFrom}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Company :</Text><Text fontSize="xs">{VISITOR.company}</Text></Flex>
    </Stack>
    {/* Check-In & Check-Out */}
    <Box mt={4}>
      <Text fontWeight="bold" fontSize="xs" color="#23292e" mb={1}>Check-In & Check-Out :</Text>
      <Flex align="center" bg="white" borderRadius="xl" px={2} py={1} gap={2}>
        <Text fontWeight="bold" fontSize="xs" color="#181a1b" minW="80px">{VISITOR.date}:</Text>
        <HStack gap={1} align="center">
          {/* Check-in icon */}
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z" fill="#23A36D"/></svg>
          <Text fontSize="xs" color="#23A36D" fontWeight="medium">{VISITOR.checkIn}</Text>
        </HStack>
        <HStack gap={1} align="center">
          {/* Check-out icon */}
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z" fill="#E34935"/></svg>
          <Text fontSize="xs" color="#E34935" fontWeight="medium">{VISITOR.checkOut}</Text>
        </HStack>
      </Flex>
    </Box>
    {/* With Guests */}
    <Box mt={6}>
      <Text fontWeight="bold" fontSize="sm" color="#381A63" mb={2}>With Guests :</Text>
      <VStack align="stretch" gap={3}>
        {GUESTS.map((guest) => (
          <Flex 
            key={guest.name} 
            align="center" 
            gap={3}
            w="full"
            minW={0}
          >
            <Box
              as="span"
              w="40px"
              h="40px"
              borderRadius="full"
              overflow="hidden"
              bg="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
              tabIndex={0}
              aria-label={`Guest: ${guest.name}`}
              flexShrink={0}
            >
              <Image
                src={guest.avatar}
                alt={guest.name}
                width={40}
                height={40}
              />
            </Box>
            <Text
              fontFamily="Roboto"
              fontWeight={600}
              fontStyle="normal"
              fontSize="14px"
              lineHeight="20px"
              letterSpacing="0"
              color="gray.900"
              wordBreak="break-word"
              overflowWrap="anywhere"
              flex={1}
            >
              {guest.name}
            </Text>
          </Flex>
        ))}
      </VStack>
    </Box>
    {/* Assets Recorded */}
    <Box mt={6}>
      <Flex align="center" justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize="sm" color="#381A63">Assets Recorded :</Text>
        <Text fontSize="xs" color="gray.700">{ASSETS.length.toString().padStart(2, "0")}</Text>
      </Flex>
      {/* Personal */}
      <Text fontWeight="medium" fontSize="xs" color="#23292e" mb={1}>Personal :</Text>
      <Flex gap={3} mb={2} flexWrap="wrap">
        {/* Example personal assets, replace with your data */}
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box w="44px" h="36px" borderRadius="md" border="1px solid #8A38F5" overflow="hidden" mb={1} bg="white">
            <Image
              src={`${FRONTEND_URL}/assets/usb.png`}
              alt="#002"
              width={44}
              height={36}
            />
          </Box>
          <Text fontSize="xs" color="#23292e">#002</Text>
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box w="44px" h="36px" borderRadius="md" border="1px solid #8A38F5" overflow="hidden" mb={1} bg="white">
            <Image
              src={`${FRONTEND_URL}/assets/bag.png`}
              alt="#003"
              width={44}
              height={36}
            />
          </Box>
          <Text fontSize="xs" color="#23292e">#003</Text>
        </Box>
      </Flex>
      {/* Company */}
      <Text fontWeight="medium" fontSize="xs" color="#23292e" mb={1}>Company :</Text>
      <Flex gap={3} mb={2} flexWrap="wrap">
        {/* Example company assets, replace with your data */}
        <Box display="flex" flexDirection="column" alignItems="center">
          <Box w="44px" h="36px" borderRadius="md" border="1px solid #8A38F5" overflow="hidden" mb={1} bg="white">
            <Image
              src={`${FRONTEND_URL}/assets/file.png`}
              alt="#004"
              width={44}
              height={36}
            />
          </Box>
          <Text fontSize="xs" color="#23292e">#004</Text>
        </Box>
      </Flex>
    </Box>
  </Box>
);

// Simple VisitorInfoCard for pending/rejected
const VisitorInfoCard: FC = () => (
  <Box
    w="full"
    maxW="342px"
    mx="auto"
    mt={2}
    bg="#f7f7ff"
    borderRadius="lg"
    boxShadow="sm"
    px={4}
    pt={8}
    pb={4}
    position="relative"
  >
    {/* Avatar - overlaps top border, centered */}
    <Box
      as="span"
      position="absolute"
      top="-30px"
      left="50%"
      transform="translateX(-50%)"
      w="70px"
      h="70px"
      borderRadius="full"
      overflow="hidden"
      bg="gray.200"
      display="flex"
      alignItems="center"
      justifyContent="center"
      tabIndex={0}
      aria-label="Visitor avatar"
    >
      <Image
        src={VISITOR.avatar}
        alt={VISITOR.name}
        width={70}
        height={70}
      />
    </Box>
    <Stack direction="column" gap={1} align="stretch" mt={6}>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Full Name :</Text><Text fontSize="xs">{VISITOR.name}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Phone No :</Text><Text fontSize="xs">{VISITOR.phone}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Purpose of Visit :</Text><Text fontSize="xs">{VISITOR.purpose}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Coming From :</Text><Text fontSize="xs">{VISITOR.comingFrom}</Text></Flex>
      <Flex justify="space-between"><Text fontWeight="bold" fontSize="xs">Company :</Text><Text fontSize="xs">{VISITOR.company}</Text></Flex>
    </Stack>
    {/* Check-In & Check-Out */}
    <Box mt={4}>
      <Text fontWeight="bold" fontSize="xs" color="#23292e" mb={1}>Check-In & Check-Out :</Text>
      <Flex align="center" bg="white" borderRadius="xl" px={2} py={1} gap={2}>
        <Text fontWeight="bold" fontSize="xs" color="#181a1b" minW="80px">{VISITOR.date}:</Text>
        <HStack gap={1} align="center">
          {/* Check-in icon */}
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z" fill="#23A36D"/></svg>
          <Text fontSize="xs" color="#23A36D" fontWeight="medium">{VISITOR.checkIn}</Text>
        </HStack>
        <HStack gap={1} align="center">
          {/* Check-out icon */}
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z" fill="#E34935"/></svg>
          <Text fontSize="xs" color="#E34935" fontWeight="medium">{VISITOR.checkOut}</Text>
        </HStack>
      </Flex>
    </Box>
  </Box>
);

const FooterActions: FC<{ onApprove: () => void; onReject: () => void }> = ({ onApprove, onReject }) => (
  <Flex position="fixed" left={0} bottom={0} w="full" maxW="390px" mx="auto" px={6} py={4} bgGradient="linear(to-t, #f8fafc 80%, transparent)" zIndex={20} gap={4}>
    <Button
      flex={1}
      h="52px"
      bg="#E34935"
      color="white"
      fontWeight="bold"
      fontSize="md"
      borderRadius="md"
      tabIndex={0}
      aria-label="Reject Visitor Request"
      onClick={onReject}
      _hover={{ bg: "#c53030" }}
      _active={{ bg: "#9b2c2c" }}
    >
      <HStack justify="center" align="center" w="full">
        {/* <Box as="span" display="flex" alignItems="center">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8h8M8 4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </Box> */}
        <Text>Reject</Text>
      </HStack>
    </Button>
    <Button
      flex={1}
      h="52px"
      bg="#23A36D"
      color="white"
      fontWeight="bold"
      fontSize="md"
      borderRadius="md"
      tabIndex={0}
      aria-label="Approve Visitor Request"
      onClick={onApprove}
      _hover={{ bg: "#178a5c" }}
      _active={{ bg: "#166534" }}
    >
      <HStack justify="center" align="center" w="full">
        {/* <Box as="span" display="flex" alignItems="center">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M4 8l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </Box> */}
        <Text>Approve</Text>
      </HStack>
    </Button>
  </Flex>
);

const VisitorRequestPending: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "checked-in";
  const rejectReason = searchParams.get("reason") || "No reason provided";
  const handleBack = () => router.back();
  const handleApprove = () => { /* Implement approve logic */ router.push("/visitor-request"); };
 

  const [isRejectModalOpen, setRejectModalOpen] = useState(false);

  // Handler for opening the reject modal
  const handleOpenRejectModal = () => setRejectModalOpen(true);
  // Handler for closing the reject modal
  const handleCloseRejectModal = () => setRejectModalOpen(false);
  // Handler for saving the reject reason
  const handleSaveRejectReason = () => {
    // Note: rejectReason comes from URL params, so we don't need to set it
    setRejectModalOpen(false);
    // Optionally: trigger API call or toast here
  };

  const isSingleBackButton = status === "checked-in" || status === "completed";

  // --- REJECTED STATE ---
  if (status === "rejected") {
    return (
      <Flex direction="column" minH="100vh" bg="#f8fafc" className="w-full">
        {/* Responsive Header */}
        <Box display={{ base: "block", lg: "none" }}>
          {/* Mobile Header */}
          <Flex
            align="center"
            justify="space-between"
            px={0}
            h={{ base: "70px", md: "48px" }}
            bg="#f4edfefa"
            borderBottom="1px solid #f2f2f2"
            w="full"
          >
            <Button
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="transparent"
              onClick={handleBack}
            >
              <Image src={`${FRONTEND_URL}/back-arrow.svg`} alt="Back" width={20} height={20} />
            </Button>
            <Text
              fontWeight="bold"
              fontSize="md"
              color="#18181b"
              flex={1}
              textAlign="center"
            >
              Visitor Preview
            </Text>
            <Box w="40px" />
          </Flex>
        </Box>
        <Box display={{ base: "none", md: "block" }}>
          <DesktopHeader notificationCount={3} />
        </Box>

        {/* Main Content Area */}
        <Box
          flex={1}
          pt={{ base: "0px", lg: "0px" }}
          display="flex"
          flexDirection="column"
        >
          {/* Web Page Title and Search */}
          <Box
            display={{ base: "none", md: "block" }}
            bg="#f4edfefa"
            px={6}
            py={1}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={4}>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                >
                  <Image src={`${FRONTEND_URL}/back-arrow.svg`} alt="Back" width={16} height={16} style={{ marginRight: '8px' }} />
                  Back
                </Button>
                <Text fontSize="xl" fontWeight="bold" color="#18181b">
                  Visitor Preview - Rejected
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Content */}
          <Box px={6} py={6}>
            <Text fontWeight="bold" color="#381A63" fontSize="lg" mb={4}>Visitor&apos;s Info</Text>
            <VisitorInfoCard />
            
            <Box mt={6}>
              <Text fontWeight="medium" color="black" fontSize="lg" mb={2}>Reason</Text>
              <Text
                fontFamily="Roboto"
                fontWeight={400}
                fontSize="16px"
                lineHeight="24px"
                color="#601E17"
                bg="#fef2f2"
                p={4}
                borderRadius="md"
                border="1px solid #fecaca"
              >
                {rejectReason}
              </Text>
            </Box>
          </Box>
        </Box>
      </Flex>
    );
  }

  if (status === "pending") {
    return (
      <Flex direction="column" minH="100vh" bg="#f8fafc" className="w-full">
        {/* Responsive Header */}
        <Box display={{ base: "block", lg: "none" }}>
          {/* Mobile Header */}
          <Flex
            align="center"
            justify="space-between"
            px={0}
            h={{ base: "70px", md: "48px" }}
            bg="#f4edfefa"
            borderBottom="1px solid #f2f2f2"
            w="full"
          >
            <Button
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="transparent"
              onClick={handleBack}
            >
              <Image src={`${FRONTEND_URL}/back-arrow.svg`} alt="Back" width={20} height={20} />
            </Button>
            <Text
              fontWeight="bold"
              fontSize="md"
              color="#18181b"
              flex={1}
              textAlign="center"
            >
              Visitor Preview
            </Text>
            <Box w="40px" />
          </Flex>
        </Box>
        <Box display={{ base: "none", md: "block" }}>
          <DesktopHeader notificationCount={3} />
        </Box>

        {/* Main Content Area */}
        <Box
          flex={1}
          pt={{ base: "0px", lg: "0px" }}
          display="flex"
          flexDirection="column"
        >
          {/* Web Page Title and Search */}
          <Box
            display={{ base: "none", md: "block" }}
            bg="#f4edfefa"
            px={6}
            py={1}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center" gap={4}>
                <Button
                  variant="ghost"
                  onClick={handleBack}
                >
                  <Image src={`${FRONTEND_URL}/back-arrow.svg`} alt="Back" width={16} height={16} style={{ marginRight: '8px' }} />
                  Back
                </Button>
                <Text fontSize="xl" fontWeight="bold" color="#18181b">
                  Visitor Preview - Pending
                </Text>
              </Flex>
            </Flex>
          </Box>

          {/* Content */}
          <Box px={6} py={6}>
            <Text fontWeight="bold" color="#381A63" fontSize="lg" mb={4}>Visitor&apos;s Info</Text>
            <VisitorInfoCard />
            
            <Box mt={6}>
              <FooterActions onApprove={handleApprove} onReject={handleOpenRejectModal} />
            </Box>
          </Box>
          
          <RejectReasonModal
            isOpen={isRejectModalOpen}
            onClose={handleCloseRejectModal}
            onSave={handleSaveRejectReason}
          />
        </Box>
      </Flex>
    );
  }

  // checked-in or completed
  return (
    <Flex direction="column" minH="100vh" bg="#f8fafc" className="w-full">
      {/* Responsive Header */}
      <Box display={{ base: "block", lg: "none" }}>
        {/* Mobile Header */}
        <Flex
          align="center"
          justify="space-between"
          px={0}
          h={{ base: "70px", sm: "70px", md: "64px" }}
          bg="#f7f2fd"
          borderBottom="1px solid #f2f2f2"
          w="full"
        >
          <Button
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="transparent"
            onClick={handleBack}
          >
            <Image src="/back-arrow.svg" alt="Back" width={20} height={20} />
          </Button>
          <Text
            fontWeight="bold"
            fontSize="md"
            color="#18181b"
            flex={1}
            textAlign="center"
          >
            Visitor Preview
          </Text>
          <Box w="40px" />
        </Flex>
      </Box>
      <Box display={{ base: "none", lg: "block" }}>
        <DesktopHeader notificationCount={3} />
      </Box>

      {/* Main Content Area */}
      <Box
        flex={1}
        pt={{ base: "0px", lg: "0px" }}
        display="flex"
        flexDirection="column"
      >
        {/* Web Page Title and Search */}
        <Flex align="center" gap={3} mb='20px'>
          <IconButton
            aria-label="Back"
            tabIndex={0}
            variant="ghost"
            fontSize="lg"
            bg="#FFF"
            onClick={handleBack}
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
            Visitor Preview - {status === "checked-in" ? "Checked In" : "Completed"}
          </Heading>
        </Flex>

        {/* Content */}
        <Box px={6} py={6}>
          <Text fontWeight="bold" color="#381A63" fontSize="lg" mb={4}>Visitor&apos;s Info</Text>
          <VisitorDetailsBlock />
          
          {!isSingleBackButton && (
            <Box mt={6}>
              <FooterActions onApprove={handleApprove} onReject={handleOpenRejectModal} />
            </Box>
          )}
        </Box>
        
        <RejectReasonModal
          isOpen={isRejectModalOpen}
          onClose={handleCloseRejectModal}
          onSave={handleSaveRejectReason}
        />
      </Box>
    </Flex>
  );
};

export default VisitorRequestPending; 