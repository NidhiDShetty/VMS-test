"use client";
import { Box, Flex, Text, Icon, Avatar, Heading, IconButton } from "@chakra-ui/react";
import { KeyboardEvent, useEffect, useState } from "react";
import {
  FiUser,
  FiSettings,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiMail,
  FiBell,
} from "react-icons/fi";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../api/profile/routes";
import { toaster } from "@/components/ui/toaster";
import { FRONTEND_URL } from "@/lib/server-urls";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";
import EditCompanyModal, {
  EditCompanyForm,
} from "@/components/modals/company/EditCompanyModal";
import Logo from "@/components/svgs/logo";
import {
  APPROVAL_REQUIREMENT_UPDATE_API,
  APPROVAL_REQUIREMENT_GET_API,
} from "@/lib/server-urls";
import DesktopHeader from "@/components/DesktopHeader";

// Type for menu item
interface MenuItem {
  icon: React.ComponentType | string;
  label: string;
  ariaLabel: string;
  onClick: () => void;
  rightContent?: React.ReactNode;
  isLogout?: boolean;
}

const Profile = () => {
  const router = useRouter();
  const [roleName, setRoleName] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery] = useState("");
  const [isApprovalRequired, setIsApprovalRequired] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [isSavingApproval, setIsSavingApproval] = useState(false);

  // Function to check if profile data matches search query
  const matchesSearch = (
    data: ProfileResponse | null,
    query: string
  ): boolean => {
    if (!data || !query.trim()) return true;

    const searchTerm = query.toLowerCase();
    const profile = data.profile;

    return (
      profile.name?.toLowerCase().includes(searchTerm) ||
      profile.email?.toLowerCase().includes(searchTerm) ||
      profile.phoneNumber?.toLowerCase().includes(searchTerm) ||
      profile.department?.toLowerCase().includes(searchTerm) ||
      (roleName === "SuperAdmin"
        ? "super admin"
        : roleName === "Admin"
          ? "admin"
          : roleName === "Host"
            ? "host"
            : roleName === "Security"
              ? "security"
              : "user"
      ).includes(searchTerm)
    );
  };

  // Filtered profile data based on search
  const filteredProfileData = matchesSearch(profileData, searchQuery)
    ? profileData
    : null;

  // Load approval requirement setting
  const loadApprovalRequirement = async () => {
    try {
      // Get auth token
      const authData = localStorage.getItem("authData");
      if (!authData) {
        console.warn("No auth data found for loading approval requirement");
        return;
      }

      const parsed = JSON.parse(authData);
      const token = parsed.token;

      if (!token) {
        console.warn("No auth token found for loading approval requirement");
        return;
      }

      const response = await fetch(APPROVAL_REQUIREMENT_GET_API, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();

      if (
        responseData &&
        responseData.success === true &&
        responseData.data !== undefined
      ) {
        setIsApprovalRequired(responseData.data.isApprovalReq || false);
      }
    } catch (error) {
      console.error("❌ Error loading approval requirement:", error);
    }
  };

  // Save approval requirement
  const handleSaveApprovalRequirement = async () => {
    setIsSavingApproval(true);
    try {
      // Get auth token
      const authData = localStorage.getItem("authData");
      if (!authData) {
        toaster.error({
          title: "Error",
          description: "Authentication required. Please log in again.",
        });
        return;
      }

      const parsed = JSON.parse(authData);
      const token = parsed.token;

      if (!token) {
        toaster.error({
          title: "Error",
          description: "Authentication token not found. Please log in again.",
        });
        return;
      }

      const requestData = {
        isApprovalReq: isApprovalRequired,
      };

      const response = await fetch(APPROVAL_REQUIREMENT_UPDATE_API, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (responseData && responseData.success === true) {
        toaster.success({
          title: "Settings Saved",
          description: `Approval required has been ${isApprovalRequired ? "enabled" : "disabled"
            }.`,
        });
        setShowApprovalModal(false);
      } else {
        toaster.error({
          title: "Save Failed",
          description:
            responseData?.error || "Failed to update approval requirement",
        });
      }
    } catch (error) {
      console.error("❌ Error saving approval requirement:", error);
      toaster.error({
        title: "Save Failed",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSavingApproval(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadProfileAndImage = async () => {
      try {
        // Load profile data, image, and approval requirement in parallel
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

        // Load approval requirement setting
        await loadApprovalRequirement();
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
          const [profileData, imageData] = await Promise.all([
            getProfileData(),
            getProfileImage(),
          ]);

          if (imageData.success && imageData.data?.imageData) {
            profileData.profile.profileImageUrl = imageData.data.imageData;
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
    const authDataRaw = localStorage.getItem("authData");
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        const token = parsed?.token;

        if (token) {
          // Decode JWT token to get the authoritative role
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const jwtRole = payload.roleName || "User";
              setRoleName(jwtRole);
              return; // Use JWT role and skip API role
            }
          } catch (decodeError) {
            console.warn("Failed to decode JWT token:", decodeError);
          }
        }

        // Fallback to old format (if exists)
        const role = parsed?.user?.roleName || null;
        setRoleName(role);
      } catch {
        setRoleName(null);
      }
    }
  }, []);

  // NO LONGER UPDATE ROLE FROM API - JWT is the source of truth
  // useEffect(() => {
  //   if (profileData?.profile?.roleType) {
  //     const normalizedRole = profileData.profile.roleType === "admin" ? "Admin" :
  //                          profileData.profile.roleType === "superadmin" ? "SuperAdmin" :
  //                          profileData.profile.roleType === "host" ? "Host" :
  //                          profileData.profile.roleType === "security" ? "Security" :
  //                          profileData.profile.roleType;
  //     setRoleName(normalizedRole);
  //   }
  // }, [profileData]);

  const handleKeyDown =
    (callback: () => void) => (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        callback();
      }
    };

  // Logout handler
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

  // Company Profile Modal Handlers
  const handleCompanyModalClose = () => {
    setShowCompanyModal(false);
  };

  const handleCompanySave = (form: EditCompanyForm) => {
    // Handle company profile save logic here
    toaster.success({
      title: "Company Profile Updated",
      description: "Company information has been updated successfully.",
    });
    setShowCompanyModal(false);
  };

  // Approval Required Modal Handlers
  const handleApprovalModalClose = () => {
    setShowApprovalModal(false);
  };

  const handleApprovalSave = () => {
    // Use the same handler as desktop version
    handleSaveApprovalRequirement();
  };

  const menuItems: MenuItem[] = [
    // Only show Company Profile for Admin role
    ...(roleName === "Admin"
      ? [
        {
          icon: FiSettings,
          label: "Company Profile",
          ariaLabel: "Go to Company Profile",
          onClick: () => router.push("/profile/company-profile"),
        },
      ]
      : []),
    // Only show Approval Required for Admin role
    ...(roleName === "Admin"
      ? [
        {
          icon: FiBell,
          label: "Approval Required",
          ariaLabel: "Open Approval Required settings",
          onClick: () => setShowApprovalModal(true),
        },
      ]
      : []),
    // Only show Email Configuration for Admin role
    ...(roleName === "Admin"
      ? [
        {
          icon: FiMail,
          label: "Email Configuration",
          ariaLabel: "Go to Email Configuration",
          onClick: () => router.push("/profile/email-configuration"),
        },
      ]
      : []),
    // {
    //   icon: FiMessageSquare,
    //   label: "SMS & WhatsApp Usage Tracker",
    //   ariaLabel: "Go to SMS & WhatsApp Usage Tracker",
    //   onClick: () => router.push("/profile/sms"),
    // },
    // {
    //   icon: FiBell,
    //   label: "Notification",
    //   ariaLabel: "Notification settings",
    //   rightContent: (
    //     <Text fontSize="sm" color="gray.500">
    //       Allow
    //     </Text>
    //   ),
    //   onClick: () => {},
    // },
  ];

  return (
    <Box
      h="100vh"
      w="full"
      bg={{ base: "white", md: "#f7f2fd" }}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader notificationCount={3} />

      {/* Desktop Profile Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        // bg="#F0E6FF"
        h="calc(100vh - 70px)"
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
        <Box position="relative" zIndex={2} p='16px 24px' h="full" overflow="hidden">
          {/* Profile Header */}
          {/* <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Flex alignItems="center" gap={4}>
              <Icon
                as={FiChevronLeft}
                boxSize={6}
                color="var(--Primary-Dark, #5F24AC)"
                cursor="pointer"
                onClick={() => router.push("/dashboard")}
              />
              <Heading
                as="h1"
                fontSize="24px"
                fontWeight="bold"
                color="var(--Primary-Dark, #5F24AC)"
                fontFamily="Roboto, sans-serif"
              >
                Profile
              </Heading>
            </Flex>
          </Flex> */}

          <Flex align="center" gap={3} mb='20px'>
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={() => router.push("/dashboard")}
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
              My Profile
            </Heading>
          </Flex>

          {/* Profile Information */}
          {filteredProfileData ? (
            <Box
              bg="white"
              borderRadius="lg"
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              mb={8}
              w="100%"
              h="106px"
              p="10px 18px"
              display="flex"
              alignItems="center"
            >
              {/* Profile Picture */}
              <Box
                w="80px"
                h="80px"
                position="relative"
                display="flex"
                alignItems="center"
                justifyContent="center"
                mr={4}
              >
                <Avatar.Root w="full" h="full">
                  <Avatar.Fallback
                    name={filteredProfileData?.profile.name || "User"}
                    w="full"
                    h="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="2xl"
                    bg="var(--Primary-Dark, #5F24AC)"
                    color="white"
                  />
                  {filteredProfileData?.profile.profileImageUrl && (
                    <Avatar.Image
                      src={filteredProfileData.profile.profileImageUrl}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                </Avatar.Root>
              </Box>

              {/* Name and Edit Profile Section */}
              <Box mr={8}>
                {/* Full Name Label */}
                <Text
                  fontSize="16px"
                  fontWeight="500"
                  color="var(--Texxt, #333333)"
                  mb={1}
                  fontFamily="Public Sans"
                  lineHeight="24px"
                  letterSpacing="0%"
                  w="70px"
                  h="24px"
                  opacity={0.6}
                >
                  Full Name
                </Text>

                {/* User Name */}
                <Text
                  fontSize="18px"
                  fontWeight="500"
                  color="gray.800"
                  mb={2}
                  fontFamily="Roboto"
                  fontStyle="normal"
                  lineHeight="24px"
                  letterSpacing="0%"
                >
                  {filteredProfileData?.profile.name || "-"}
                </Text>

                {/* Edit Profile Button */}
                <Box
                  bg="var(--VMS-Bg, #F4EDFE)"
                  color="var(--Primary-Dark, #5F24AC)"
                  w="106px"
                  h="30px"
                  borderRadius="34px"
                  cursor="pointer"
                  _hover={{ opacity: 0.9 }}
                  onClick={() => router.push("/profile/my-profile")}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap="10px"
                  px="19px"
                  py="7px"
                >
                  <Text fontSize="14px" fontWeight="500">
                    Edit Profile
                  </Text>
                </Box>
              </Box>

              {/* Vertical Separator Line */}
              <Box w="1px" h="60px" bg="gray.300" mx={4} />

              {/* Profile Details */}
              <Box flex="1">
                <Flex
                  direction="row"
                  gap={6}
                  alignItems="center"
                  h="full"
                  w="full"
                >
                  <Box flex="1">
                    <Text
                      fontSize="14px"
                      fontWeight="500"
                      color="var(--Texxt, #333333)"
                      mb={1}
                      fontFamily="Public Sans"
                      lineHeight="20px"
                      letterSpacing="0%"
                      opacity={0.6}
                    >
                      Phone No:
                    </Text>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                      fontStyle="normal"
                      lineHeight="20px"
                      letterSpacing="0%"
                    >
                      {filteredProfileData?.profile.phoneNumber || "-"}
                    </Text>
                  </Box>

                  <Box flex="1">
                    <Text
                      fontSize="14px"
                      fontWeight="500"
                      color="var(--Texxt, #333333)"
                      mb={1}
                      fontFamily="Public Sans"
                      lineHeight="20px"
                      letterSpacing="0%"
                      opacity={0.6}
                    >
                      Role:
                    </Text>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                      fontStyle="normal"
                      lineHeight="20px"
                      letterSpacing="0%"
                    >
                      {(() => {
                        const displayRole =
                          roleName === "SuperAdmin"
                            ? "Super Admin"
                            : roleName === "Admin"
                              ? "Admin"
                              : roleName === "Host"
                                ? "Host"
                                : roleName === "Security"
                                  ? "Security"
                                  : "User";
                        return displayRole;
                      })()}
                    </Text>
                  </Box>

                  <Box flex="1">
                    <Text
                      fontSize="14px"
                      fontWeight="500"
                      color="var(--Texxt, #333333)"
                      mb={1}
                      fontFamily="Public Sans"
                      lineHeight="20px"
                      letterSpacing="0%"
                      opacity={0.6}
                    >
                      Email:
                    </Text>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                      fontStyle="normal"
                      lineHeight="20px"
                      letterSpacing="0%"
                    >
                      {filteredProfileData?.profile.email || "-"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          ) : (
            <Box
              bg="white"
              borderRadius="lg"
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              mb={8}
              w="100%"
              p={8}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="18px" color="gray.500" textAlign="center">
                No results found for &quot;{searchQuery}&quot;
              </Text>
            </Box>
          )}

          {/* Notification, Company Profile, Email Configuration, and Change Password Cards */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            w="100%"
            mb={8}
            gap={4}
            flexWrap="wrap"
          >
            {/* Company Profile Card - Only show for Admin role on web, SuperAdmin on mobile */}
            {roleName === "Admin" && (
              <Box
                bg="white"
                borderRadius="lg"
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                w="237px"
                h="111px"
                overflow="hidden"
                cursor="pointer"
                _hover={{ boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}
                onClick={() => router.push("/profile/company-profile")}
              >
                {/* Purple Header */}
                <Box
                  bg="var(--Primary-VMS, #8A38F5)"
                  p="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="18px" fontWeight="bold" color="white">
                    Company Profile
                  </Text>
                </Box>

                {/* White Content Area */}
                <Box
                  p="8px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  h="calc(100% - 40px)"
                >
                  <Box
                    bg="var(--VMS-Bg, #F4EDFE)"
                    borderRadius="md"
                    px={3}
                    py={2}
                    cursor="pointer"
                    w="full"
                    textAlign="center"
                    _hover={{
                      bg: "var(--Primary-Dark, #5F24AC)",
                      color: "white",
                      opacity: 0.9,
                      "& > *": { color: "white !important" },
                    }}
                  >
                    <Text fontSize="14px" color="gray.800" fontWeight="500">
                      View Details
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Approval Required Card - Only show for Admin role */}
            {roleName === "Admin" && (
              <Box
                bg="white"
                borderRadius="lg"
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                w="237px"
                h="111px"
                overflow="hidden"
                cursor="pointer"
                _hover={{ boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}
              >
                {/* Purple Header */}
                <Box
                  bg="var(--Primary-VMS, #8A38F5)"
                  p="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="18px" fontWeight="bold" color="white">
                    Approval Required
                  </Text>
                </Box>

                {/* White Content Area */}
                <Box
                  p="8px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  h="calc(100% - 40px)"
                >
                  <Flex
                    alignItems="center"
                    justifyContent="space-between"
                    w="full"
                  >
                    {/* Left side - Toggle Switch */}
                    <Flex alignItems="center" gap={2}>
                      <Box
                        w="40px"
                        h="20px"
                        bg={
                          isApprovalRequired
                            ? "var(--Primary-VMS, #8A38F5)"
                            : "gray.300"
                        }
                        borderRadius="10px"
                        position="relative"
                        cursor="pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsApprovalRequired(!isApprovalRequired);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setIsApprovalRequired(!isApprovalRequired);
                          }
                        }}
                        tabIndex={0}
                        role="switch"
                        aria-checked={isApprovalRequired}
                        aria-label="Toggle approval required setting"
                        transition="all 0.2s ease"
                        _hover={{ opacity: 0.9 }}
                      >
                        <Box
                          w="16px"
                          h="16px"
                          bg="white"
                          borderRadius="50%"
                          position="absolute"
                          top="2px"
                          left={isApprovalRequired ? "22px" : "2px"}
                          transition="all 0.2s ease"
                          boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                        />
                      </Box>
                      <Text fontSize="14px" color="gray.800" fontWeight="500">
                        Enable
                      </Text>
                    </Flex>

                    {/* Right side - Save Button */}
                    <Box
                      bg={
                        isSavingApproval
                          ? "gray.400"
                          : "var(--Primary-VMS, #8A38F5)"
                      }
                      color="white"
                      px={3}
                      py={1}
                      borderRadius="md"
                      cursor={isSavingApproval ? "not-allowed" : "pointer"}
                      fontSize="12px"
                      fontWeight="500"
                      textAlign="center"
                      opacity={isSavingApproval ? 0.7 : 1}
                      _hover={
                        isSavingApproval
                          ? {}
                          : {
                            bg: "var(--Primary-Dark, #5F24AC)",
                            opacity: 0.9,
                          }
                      }
                      _active={
                        isSavingApproval ? {} : { transform: "scale(0.98)" }
                      }
                      transition="all 0.2s"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isSavingApproval) {
                          handleSaveApprovalRequirement();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSaveApprovalRequirement();
                        }
                      }}
                      tabIndex={isSavingApproval ? -1 : 0}
                      role="button"
                      aria-label="Save approval required setting"
                      aria-disabled={isSavingApproval}
                    >
                      {isSavingApproval ? "Saving..." : "Save"}
                    </Box>
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Email Configuration Card - Only show for Admin role */}
            {roleName === "Admin" && (
              <Box
                bg="white"
                borderRadius="lg"
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                w="237px"
                h="111px"
                overflow="hidden"
                cursor="pointer"
                _hover={{ boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}
                onClick={() => {
                  router.push("/profile/email-configuration");
                }}
                tabIndex={0}
                role="button"
                aria-label="Navigate to Email Configuration"
              >
                {/* Purple Header */}
                <Box
                  bg="var(--Primary-VMS, #8A38F5)"
                  p="8px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="18px" fontWeight="bold" color="white">
                    Email Config
                  </Text>
                </Box>

                {/* White Content Area */}
                <Box
                  p="8px"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  h="calc(100% - 40px)"
                >
                  <Box
                    as="button"
                    bg="var(--VMS-Bg, #F4EDFE)"
                    borderRadius="md"
                    px={3}
                    py={2}
                    w="full"
                    textAlign="center"
                    cursor="pointer"
                    zIndex={10}
                    position="relative"
                    _hover={{
                      bg: "var(--Primary-Dark, #5F24AC)",
                      color: "white",
                      "& > *": { color: "white !important" },
                    }}
                    _active={{ transform: "scale(0.98)" }}
                    transition="all 0.2s"
                    onClick={() => {
                      router.push("/profile/email-configuration");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push("/profile/email-configuration");
                      }
                    }}
                    tabIndex={0}
                    aria-label="Navigate to Email Configuration"
                  >
                    <Text
                      fontSize="14px"
                      color="gray.800"
                      fontWeight="500"
                      pointerEvents="none"
                    >
                      Configure
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>

          {/* Decorative Logo */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={-1}
            pointerEvents="none"
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Layout - Hidden on Desktop */}
      <Flex
        display={{ base: "flex", md: "none" }}
        direction="column"
        w="100vw"
        minH="100vh"
        bg="white"
        position="relative"
        px={0}
      >
        {/* Header - Removed top margin to eliminate whitespace */}
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
            onClick={() => router.push("/dashboard")}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.push("/dashboard"); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">Profile</Text>
        </Flex>

        {/* Profile Info Row */}
        {loading ? (
          <Flex
            align="center"
            px={2}
            pt={5}
            pb={2}
            justify="center"
            minH="80px"
          >
            <Text color="black">Loading...</Text>
          </Flex>
        ) : error ? (
          <Flex
            align="center"
            px={2}
            pt={5}
            pb={2}
            justify="center"
            minH="80px"
          >
            <Text color="red.500">{error}</Text>
          </Flex>
        ) : (
          <Flex align="center" px={2} pt={5} pb={2}>
            <Box
              w={16}
              h={16}
              mr={4}
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
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
            <Box flex={1}>
              <Text
                fontWeight="600"
                fontSize="24px"
                color="#25292E"
                fontFamily="Roboto"
                lineHeight="32px"
              >
                {profileData?.profile.name && profileData?.profile.name !== "-"
                  ? profileData.profile.name
                  : "-"}
              </Text>
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
            </Box>
          </Flex>
        )}
        <Box mx={2} my={2} h="1px" bg="gray.200" />

        {/* Menu List */}
        <Box px={2} pt={4} pb={2} flex={1}>
          {/* My Profile - First Item */}
          <Flex
            align="center"
            mb={2}
            borderRadius="lg"
            px={3}
            py={3}
            tabIndex={0}
            aria-label="My Profile"
            role="button"
            onClick={() => router.push("/profile/my-profile")}
            onKeyDown={handleKeyDown(() => router.push("/profile/my-profile"))}
            _hover={{ bg: "#F2F2F2" }}
            cursor="pointer"
          >
            <Icon as={FiUser} boxSize={6} color={"gray.900"} mr={3} />
            <Text
              flex={1}
              color="gray.800"
              fontFamily="Roboto"
              fontSize="16px"
              fontWeight="400"
              lineHeight="24px"
            >
              My Profile
            </Text>
            <Icon as={FiChevronRight} boxSize={5} color="gray.400" ml={2} />
          </Flex>

          {menuItems.map((item, idx) => (
            <Flex
              key={item.label}
              align="center"
              mb={2}
              borderRadius="lg"
              px={3}
              py={3}
              tabIndex={0}
              aria-label={item.ariaLabel}
              role="button"
              onClick={item.onClick}
              onKeyDown={handleKeyDown(item.onClick)}
              _hover={{ bg: "#F2F2F2" }}
              cursor="pointer"
            >
              {item.isLogout ? (
                <Box
                  w={6}
                  h={6}
                  mr={3}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Image
                    src={item.icon as string}
                    alt="Log out"
                    width={24}
                    height={24}
                    style={{ objectFit: "contain" }}
                  />
                </Box>
              ) : (
                <Icon
                  as={item.icon as React.ComponentType}
                  boxSize={6}
                  color={"gray.900"}
                  mr={3}
                />
              )}
              <Text
                flex={1}
                color={item.isLogout ? "gray.900" : "gray.800"}
                fontFamily="Roboto"
                fontSize="16px"
                fontWeight="400"
                lineHeight="24px"
              >
                {item.label}
              </Text>
              {item.rightContent}
              {/* Only show FiChevronRight for the first 5 items */}
              {idx < 5 && (
                <Icon as={FiChevronRight} boxSize={5} color="gray.400" ml={2} />
              )}
            </Flex>
          ))}

          {/* Additional Menu Items for Mobile */}
          {/* Change Password */}
          <Flex
            align="center"
            mb={2}
            borderRadius="lg"
            px={3}
            py={3}
            tabIndex={0}
            aria-label="Change Password"
            role="button"
            onClick={() => router.push("/profile/change-password")}
            onKeyDown={handleKeyDown(() =>
              router.push("/profile/change-password")
            )}
            _hover={{ bg: "#F2F2F2" }}
            cursor="pointer"
          >
            <Icon as={FiLock} boxSize={6} color={"gray.900"} mr={3} />
            <Text
              flex={1}
              color="gray.800"
              fontFamily="Roboto"
              fontSize="16px"
              fontWeight="400"
              lineHeight="24px"
            >
              Change Password
            </Text>
            <Icon as={FiChevronRight} boxSize={5} color="gray.400" ml={2} />
          </Flex>

          {/* Logout */}
          <Flex
            align="center"
            mb={2}
            borderRadius="lg"
            px={3}
            py={3}
            tabIndex={0}
            aria-label="Logout"
            role="button"
            onClick={handleLogout}
            onKeyDown={handleKeyDown(handleLogout)}
            _hover={{ bg: "#F2F2F2" }}
            cursor="pointer"
          >
            <Box
              w={6}
              h={6}
              mr={3}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Image
                src={`${FRONTEND_URL}/logout.svg`}
                alt="Log out"
                width={24}
                height={24}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Text
              flex={1}
              color="gray.900"
              fontFamily="Roboto"
              fontSize="16px"
              fontWeight="400"
              lineHeight="24px"
            >
              Logout
            </Text>
            <Icon as={FiChevronRight} boxSize={5} color="gray.400" ml={2} />
          </Flex>
        </Box>
      </Flex>

      {/* Company Profile Modal */}
      <EditCompanyModal
        isOpen={showCompanyModal}
        onClose={handleCompanyModalClose}
        onBack={handleCompanyModalClose}
        onSave={handleCompanySave}
        initialData={{
          companyName: "",
          phoneNumber: "",
          email: "",
          buildingNumber: "",
          floorDetails: "",
          streetDetails: "",
          locality: "",
          city: "",
          state: "",
          pinCode: "",
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Approval Required Modal - Mobile Only */}
      {showApprovalModal && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.5)"
          zIndex={1000}
          display={{ base: "flex", md: "none" }}
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Box
            bg="white"
            borderRadius="lg"
            w="full"
            maxW="400px"
            maxH="90vh"
            overflow="hidden"
            boxShadow="0 10px 25px rgba(0, 0, 0, 0.2)"
          >
            {/* Modal Header */}
            <Flex
              align="center"
              justify="space-between"
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Approval Required
              </Text>
            </Flex>

            {/* Modal Content */}
            <Box p={6}>
              <Text fontSize="md" color="gray.600" mb={6} textAlign="center">
                Configure approval requirements for visitor access
              </Text>

              {/* Toggle Section */}
              <Flex
                align="center"
                justify="space-between"
                p={4}
                bg="gray.50"
                borderRadius="md"
                mb={6}
              >
                <Box>
                  <Text fontSize="md" fontWeight="600" color="gray.800" mb={1}>
                    Enable Approval Required
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Require admin approval for all visitor requests
                  </Text>
                </Box>
                <Box
                  w="50px"
                  h="26px"
                  bg={
                    isApprovalRequired
                      ? "var(--Primary-VMS, #8A38F5)"
                      : "gray.300"
                  }
                  borderRadius="13px"
                  position="relative"
                  cursor="pointer"
                  onClick={() => setIsApprovalRequired(!isApprovalRequired)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsApprovalRequired(!isApprovalRequired);
                    }
                  }}
                  tabIndex={0}
                  role="switch"
                  aria-checked={isApprovalRequired}
                  aria-label="Toggle approval required setting"
                  transition="all 0.2s ease"
                  _hover={{ opacity: 0.9 }}
                >
                  <Box
                    w="22px"
                    h="22px"
                    bg="white"
                    borderRadius="50%"
                    position="absolute"
                    top="2px"
                    left={isApprovalRequired ? "26px" : "2px"}
                    transition="all 0.2s ease"
                    boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                  />
                </Box>
              </Flex>

              {/* Action Buttons */}
              <Flex gap={3}>
                <Box
                  flex={1}
                  bg="gray.100"
                  color="gray.700"
                  py={3}
                  px={4}
                  borderRadius="md"
                  textAlign="center"
                  cursor="pointer"
                  fontWeight="500"
                  onClick={handleApprovalModalClose}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleApprovalModalClose();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Cancel changes"
                  _hover={{ bg: "gray.200" }}
                  transition="all 0.2s"
                >
                  Cancel
                </Box>
                <Box
                  flex={1}
                  bg="var(--Primary-VMS, #8A38F5)"
                  color="white"
                  py={3}
                  px={4}
                  borderRadius="md"
                  textAlign="center"
                  cursor="pointer"
                  fontWeight="500"
                  onClick={() => {
                    handleApprovalSave();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleApprovalSave();
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Save approval settings"
                  _hover={{
                    bg: "var(--Primary-Dark, #5F24AC)",
                    opacity: 0.9,
                  }}
                  _active={{ transform: "scale(0.98)" }}
                  transition="all 0.2s"
                >
                  Save
                </Box>
              </Flex>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Profile;
