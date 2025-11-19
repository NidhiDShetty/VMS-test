"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Avatar, Menu, Portal } from "@chakra-ui/react";
import { FRONTEND_URL } from "@/lib/server-urls";
import Image from "next/image";
import { FiChevronDown, FiUser, FiLock } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../app/api/profile/routes";
import { toaster } from "@/components/ui/toaster";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";

interface ProfileHeaderProps {
  variant?: "desktop" | "mobile";
  showRole?: boolean;
  showEmail?: boolean;
  textColor?: string;
  roleColor?: string;
  emailColor?: string;
  avatarSize?: string;
  nameFontSize?: string;
  roleFontSize?: string;
  emailFontSize?: string;
  className?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  variant = "desktop",
  showRole = true,
  showEmail = true,
  textColor = "white",
  roleColor = "white",
  emailColor = "#6B7280",
  avatarSize = "40px",
  nameFontSize = "16px",
  roleFontSize = "12px",
  emailFontSize = "14px",
  className = "",
}) => {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setLoading(true);

    const loadProfileAndImage = async () => {
      try {
        // Check if user is authenticated before loading profile data
        const authData = localStorage.getItem("authData");
        if (!authData) {
          setLoading(false);
          return;
        }

        // Validate auth data
        try {
          JSON.parse(authData);
        } catch {
          setLoading(false);
          return;
        }

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

  const isMobile = variant === "mobile";

  return (
    <>
      <Menu.Root>
        <Menu.Trigger asChild>
          <Flex 
            alignItems="center" 
            gap={isMobile ? 4 : 3}
            cursor="pointer"
            _hover={{ opacity: 0.8 }}
            transition="opacity 0.2s"
            style={{ cursor: 'pointer' }}
            className={className}
            px={isMobile ? 2 : 0}
            pt={isMobile ? 5 : 0}
            pb={isMobile ? 2 : 0}
          >
            <Avatar.Root w={avatarSize} h={avatarSize}>
              <Avatar.Fallback
                name={profileData?.profile.name || "User"}
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize={isMobile ? "2xl" : "sm"}
                bg={isMobile ? "#F4EDFE" : "var(--Primary-Dark, #5F24AC)"}
                color={isMobile ? "#25292E" : "white"}
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
            
            <Box flex={isMobile ? 1 : undefined}>
              <Flex align="center" gap={isMobile ? 2 : 1}>
                <Text
                  color={isMobile ? "#25292E" : textColor}
                  fontSize={isMobile ? "24px" : nameFontSize}
                  fontWeight={isMobile ? "600" : "600"}
                  fontFamily={isMobile ? "Roboto" : "Roboto, sans-serif"}
                  lineHeight={isMobile ? "32px" : undefined}
                >
                  {loading ? "Loading..." : profileData?.profile.name || "User"}
                </Text>
                <FiChevronDown 
                  size={isMobile ? 20 : 16} 
                  color={isMobile ? "#25292E" : textColor} 
                />
              </Flex>
              
              {showRole && (
                <Text
                  color={isMobile ? emailColor : roleColor}
                  fontSize={isMobile ? emailFontSize : roleFontSize}
                  fontWeight={isMobile ? "400" : "400"}
                  opacity={isMobile ? 1 : 0.9}
                  mt={isMobile ? 1 : 0}
                >
                  {getDisplayRole()}
                </Text>
              )}
              
              {showEmail && isMobile && (
                <Text
                  fontFamily="Roboto"
                  fontWeight="400"
                  fontSize="14px"
                  lineHeight="16px"
                  letterSpacing="0%"
                  color="#6B7280"
                  mt={1}
                >
                  {profileData?.profile.email}
                </Text>
              )}
            </Box>
          </Flex>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="200px" bg="white" borderRadius="md" boxShadow="lg" border="1px solid" borderColor="gray.200">
              <Menu.Item 
                value="my-profile"
                onClick={() => router.push("/profile")}
                _hover={{ bg: "gray.50" }}
                px={4}
                py={3}
              >
                <Flex align="center" gap={3}>
                  <FiUser size={16} />
                  <Text>My Profile</Text>
                </Flex>
              </Menu.Item>
              <Menu.Item 
                value="change-password"
                onClick={() => router.push("/profile/change-password")}
                _hover={{ bg: "gray.50" }}
                px={4}
                py={3}
              >
                <Flex align="center" gap={3}>
                  <FiLock size={16} />
                  <Text>Change Password</Text>
                </Flex>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item 
                value="logout"
                onClick={handleLogout}
                _hover={{ bg: "red.50" }}
                px={4}
                py={3}
                color="red.600"
              >
                <Flex align="center" gap={3}>
                  <Box w={4} h={4} display="flex" alignItems="center" justifyContent="center">
                    <Image src={`${FRONTEND_URL}/logout.svg`} alt="Logout" width={16} height={16} />
                  </Box>
                  <Text>Logout</Text>
                </Flex>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default ProfileHeader;

