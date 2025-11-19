"use client";

import React, { useState, useEffect } from "react";
import { Box, Flex, Text, Avatar } from "@chakra-ui/react";
import Image from "next/image";
import { FiBell } from "react-icons/fi";
import { useRouter } from "next/navigation";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../api/profile/routes";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";

const DashboardHeader = () => {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadProfileAndImage = async () => {
      try {
        // Check if user is authenticated before loading profile data
        const authData = localStorage.getItem("authData");
        if (!authData) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        // Validate auth data
        try {
          JSON.parse(authData);
        } catch {
          setError("Invalid authentication");
          setLoading(false);
          return;
        }

        // Load profile data and image in parallel
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        // Update profile data with image
        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        }

        setProfileData(profileData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    loadProfileAndImage();
  }, []);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = () => {
      const loadProfileAndImage = async () => {
        try {
          // Check if user is authenticated before loading profile data
          const authData = localStorage.getItem("authData");
          if (!authData) {
            return;
          }

          // Validate auth data
          try {
            JSON.parse(authData);
          } catch {
            return;
          }

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
          console.error("Failed to refresh profile:", error);
        }
      };

      loadProfileAndImage();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  // Get role name from localStorage

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
    <Box
      className="block md:hidden"
      bg="#F4EDFC"
      w="100%"
      p={4}
      pt={8}
      pb={8}
      mb={6}
      borderRadius={0}
      position="relative"
      overflow="visible"
    >
      {/* Top Row */}
      <Flex justify="space-between" align="center">
        {/* Avatar and Text - Direct navigation to profile (Mobile only) */}
        <Flex 
          align="center" 
          gap={4}
          cursor="pointer"
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
          style={{ cursor: 'pointer' }}
          onClick={() => router.push("/profile")}
          tabIndex={0}
          aria-label="Go to profile"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              router.push("/profile");
            }
          }}
        >
          <Box
            tabIndex={0}
            aria-label="User profile picture"
            borderRadius="full"
            overflow="hidden"
            w="50px"
            h="50px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            className="shadow-md"
          >
            <Avatar.Root colorPalette="#F4EDFE" w="full" h="full">
              {profileData?.profile.name &&
              profileData?.profile.name !== "-" ? (
                <>
                  <Avatar.Fallback
                    name={profileData.profile.name}
                    w="full"
                    h="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                  />
                  {profileData.profile.profileImageUrl &&
                  profileData.profile.profileImageUrl !== "-" ? (
                    <Avatar.Image
                      src={profileData.profile.profileImageUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        position: "absolute",
                        top: 0,
                        left: 0,
                      }}
                    />
                  ) : null}
                </>
              ) : (
                <>
                  <Avatar.Fallback
                    w="full"
                    h="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                  />
                  <Avatar.Image
                    src="https://bit.ly/broken-link"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      top: 0,
                      left: 0,
                    }}
                  />
                </>
              )}
            </Avatar.Root>
          </Box>
          <Box>
            {loading ? (
              <Text fontWeight="bold" fontSize="lg" color="black">
                Loading...
              </Text>
            ) : error ? (
              <Text fontWeight="bold" fontSize="lg" color="red.500">
                {error}
              </Text>
            ) : (
              <>
                <Flex align="center" gap={1}>
                  <Text fontWeight="bold" fontSize="lg" color="#5F24AD">
                    Hello{" "}
                    {profileData?.profile.name &&
                    profileData?.profile.name !== "-"
                      ? profileData.profile.name
                      : "-"}
                  </Text>
                  {/* Removed FiChevronDown icon - no dropdown on mobile */}
                </Flex>
                <Text fontStyle="italic" fontSize="sm" color="black">
                  {profileData?.profile.email}
                </Text>
              </>
            )}
          </Box>
        </Flex>
        {/* Notification Icon with Badge - COMMENTED OUT */}
        {/* <Box
          position="relative"
          tabIndex={0}
          aria-label="Notifications"
          mr={2} // Add right spacing
          alignSelf="center" // Vertically center in the Flex row
        >
          <Flex
            bg="white"
            p={3}
            w="40px"
            h="40px"
            borderRadius="xl"
            align="center"
            justify="center"
            boxShadow="md"
          >
            <FiBell size={20} color="black" />
          </Flex>

          <Box
            position="absolute"
            top="-6px"
            right="-6px"
            bg="#8A38F5"
            color="white"
            borderRadius="full"
            px={1.5}
            fontSize="10px"
            fontWeight="bold"
            height="18px"
            minW="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex={1}
          >
            <Text fontSize="10px" fontWeight="bold" color="white">
              0
            </Text>
          </Box>
        </Box> */}
      </Flex>
      {/* Bottom Badge - centrally cut by border */}
      <Box p='5px 20px 4px 20px !important'
        position="absolute"
        left="50%"
        bottom="-10px"
        transform="translateX(-50%)"
        bg="#5F24AD"
        color="#F4EDFC"
        px={4}
        py={0.5}
        borderRadius="full"
        fontSize="xs"
        fontWeight="semibold"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        tabIndex={0}
        aria-label="Current date and time"
        zIndex={2}
        boxShadow="0 2px 8px rgba(95, 36, 173, 0.15)"
        whiteSpace="nowrap"
      >
        <Text as="span" fontWeight="bold">
          {formatDate(currentDateTime)},
        </Text>
        <Text as="span" fontWeight="normal" ml={2}>
          {getDayName(currentDateTime)} {formatTime(currentDateTime)}
        </Text>
      </Box>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </Box>
  );
};

export default DashboardHeader;
