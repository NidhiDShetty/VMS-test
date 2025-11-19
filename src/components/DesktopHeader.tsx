"use client";

import React, { useState, useEffect, useRef } from "react";
import { Box, Flex, Text, Avatar } from "@chakra-ui/react";
import { FRONTEND_URL } from "@/lib/server-urls";
import { FiBell, FiChevronDown, FiUser, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/components/svgs/logo";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../app/api/profile/routes";
import { toaster } from "@/components/ui/toaster";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";
import { useUserData } from "@/lib/hooks/useUserData";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Use user data hook to get role information
  const { userData, loading: userLoading } = useUserData();

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

  // Listen for profile updates (when image is uploaded/deleted)
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        } else if (imageData.success && !imageData.data?.hasImage) {
          // No image exists, clear the profile image
          profileData.profile.profileImageUrl = null;
        }

        setProfileData(profileData);
      } catch (error) {
        console.error("Failed to refresh profile data in header:", error);
      }
    };

    // Add event listener for profile updates
    window.addEventListener("profileUpdated", handleProfileUpdate);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
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
    const roleName = userData?.roleName;
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

  // Show loading state while user data is being fetched
  if (typeof window !== "undefined" && userLoading) {
    return (
      <Box
        display={{ base: "none", md: "flex" }}
        bg="var(--Primary-Dark, #5F24AC)"
        w="full"
        h="60px"
        px={8}
        alignItems="center"
        justifyContent="center"
        className={className}
      >
        <Text color="white">Loading...</Text>
      </Box>
    );
  }

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
              ml={5}
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

          {/* Notification Bell - COMMENTED OUT */}
          {/* {showNotifications && (
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
          )} */}

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
                {profileData?.profile.profileImageUrl && (
                  <Avatar.Image
                    src={profileData.profile.profileImageUrl}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
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
                    <FiUser size={16} color="black" />
                    <Text color="black">My Profile</Text>
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
                    <FiLock size={16} color="black" />
                    <Text color="black">Change Password</Text>
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

export default DesktopHeader;

