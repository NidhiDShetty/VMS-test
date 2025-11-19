"use client";
import ProfileDetailsCard, { ProfileField } from "../ProfileDetailsCard";
import { Box, Flex, Text, Icon, Button, Avatar, Heading, IconButton } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import React, { useState, useEffect } from "react";
import EditProfileModal, {
  EditProfileForm,
} from "@/components/modals/profile/EditProfileModal";
import {
  getProfileData,
  ProfileResponse,
  updateProfileData,
  UpdateProfilePayload,
  getProfileImage,
} from "../../api/profile/routes";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";

const MyProfilePage = () => {
  const router = useRouter();
  const { safeBack } = useNavigation();
  const handleBack = () => safeBack();
  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBack();
    }
  };

  const [isEditOpen, setEditOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webUserFields, setWebUserFields] = useState<ProfileField[]>([]);
  const [mobileUserFields, setMobileUserFields] = useState<ProfileField[]>([]);
  const [userRole, setUserRole] = useState<string>("");

  // Load profile image
  const loadProfileImage = async () => {
    try {
      const imageResponse = await getProfileImage();
      if (imageResponse.success && imageResponse.data?.imageData) {
        return imageResponse.data.imageData;
      }
    } catch (error) {
      console.error("Failed to load profile image:", error);
    }
    return null;
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          loadProfileImage(),
        ]);

        // Update profile data with image
        if (imageData) {
          profileData.profile.profileImageUrl = imageData;
        }

        setProfileData(profileData);
        setLoading(false);
      } catch {
        setError("Failed to load profile");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Format phone number for display with country code
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "";

    // If phone already contains country code (starts with +), return as is
    if (phone.startsWith("+")) {
      return phone;
    }

    // If phone starts with 91 and has more digits, it's likely a full number with country code
    if (phone.startsWith("91") && phone.length > 10) {
      // Remove the leading 91 and format properly
      const numberWithoutCountryCode = phone.substring(2);
      return `+91-${numberWithoutCountryCode}`;
    }

    // If phone is just digits (10 digits), add country code
    if (/^\d{10}$/.test(phone)) {
      return `+91-${phone}`;
    }

    // If phone already has country code format, return as is
    if (phone.includes("-")) {
      return phone;
    }

    // Default case: assume it's just digits and add country code
    return `+91-${phone}`;
  };

  // Update userFields when profileData or userRole changes
  useEffect(() => {
    if (profileData) {
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Web fields (with gender)
      setWebUserFields([
        { label: "Name:", value: profileData.profile.name },
        {
          label: "Phone No :",
          value: formatPhoneForDisplay(profileData.profile.phoneNumber),
        },
        { label: "Email :", value: profileData.profile.email },
        // { label: "Department :", value: profileData.profile.department },
        { label: "Gender:", value: profileData.profile.gender },
        // { label: "Role:", value: userRole },
        { label: "Date:", value: currentDate },
      ]);
      
      // Mobile fields (with gender)
      setMobileUserFields([
        { label: "Name:", value: profileData.profile.name },
        {
          label: "Phone No :",
          value: formatPhoneForDisplay(profileData.profile.phoneNumber),
        },
        { label: "Email :", value: profileData.profile.email },
        // { label: "Department :", value: profileData.profile.department },
        { label: "Gender:", value: profileData.profile.gender },
        // { label: "Role:", value: userRole },
        { label: "Date:", value: currentDate },
      ]);
    }
  }, [profileData, userRole]);

  useEffect(() => {
    // Fetch user role from authData
    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        const role = parsed?.user?.roleName || parsed?.user?.roleType || "";
        
        // Normalize role for display
        const normalizedRole = role === "superadmin" ? "SuperAdmin" :
                              role === "admin" ? "Admin" :
                              role === "security" ? "Security" :
                              role === "host" ? "Host" :
                              role === "employee" ? "Employee" :
                              role;
        
        setUserRole(normalizedRole);
      } catch {
        setUserRole("");
      }
    }
  }, []);

  // Listen for profile updates (when image is uploaded)
  useEffect(() => {
    const handleProfileUpdate = async () => {
      try {
        // Refresh profile data and image
        const [updatedProfileData, imageData] = await Promise.all([
          getProfileData(),
          loadProfileImage(),
        ]);

        // Update profile data with latest image
        if (imageData) {
          updatedProfileData.profile.profileImageUrl = imageData;
        }

        setProfileData(updatedProfileData);
      } catch (error) {
        console.error("Failed to refresh profile data:", error);
      }
    };

    // Add event listener for profile updates
    window.addEventListener("profileUpdated", handleProfileUpdate);

    // Cleanup event listener on unmount
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  const handleImageDeleted = async () => {
    // Immediately update the UI to reflect image deletion
    if (profileData) {
      setProfileData({
        ...profileData,
        profile: {
          ...profileData.profile,
          profileImageUrl: null,
        },
      });
    }
    
    // Also refresh profile data from server to ensure consistency
    try {
      const updatedProfileData = await getProfileData();
      setProfileData(updatedProfileData);
    } catch (error) {
      console.error("Failed to refresh profile data after image deletion:", error);
    }
  };

  const handleSaveProfile = async (form: EditProfileForm) => {
    setLoading(true);
    setError(null);
    try {
      // Don't include profileImageUrl in the payload - image is handled separately
      const payload: UpdateProfilePayload = {
        name: form.name,
        phoneNumber: form.phone,
        email: form.email,
        // department: form.department,
        gender: form.gender,
        // roleType: form.roleType,
        // profileImageUrl is handled by the separate image upload API
      };

      await updateProfileData(payload);

      // Fetch the latest profile data and image after update
      const [updated, imageData] = await Promise.all([
        getProfileData(),
        loadProfileImage(),
      ]);

      // Update profile data with image (handle null case properly)
      updated.profile.profileImageUrl = imageData || null;

      setProfileData(updated);
      
      // Update role state with the new role from form
      // const normalizedRole = form.roleType === "superadmin" ? "SuperAdmin" :
      //                       form.roleType === "admin" ? "Admin" :
      //                       form.roleType === "security" ? "Security" :
      //                       form.roleType === "host" ? "Host" :
      //                       form.roleType === "employee" ? "Employee" :
      //                       form.roleType;
      
      // setUserRole(normalizedRole);
      
      // Update localStorage with new role
      const authDataRaw = typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (authDataRaw) {
        try {
          const parsed = JSON.parse(authDataRaw);
          if (parsed && parsed.user) {
            // parsed.user.roleName = form.roleType;
            // parsed.user.roleType = form.roleType;
            localStorage.setItem("authData", JSON.stringify(parsed));
          }
        } catch (err) {
          console.error("Failed to update authData in localStorage:", err);
        }
      }
      
      const currentDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Web fields (with gender)
      setWebUserFields([
        { label: "Name:", value: updated.profile.name },
        {
          label: "Phone No :",
          value: formatPhoneForDisplay(updated.profile.phoneNumber),
        },
        { label: "Email :", value: updated.profile.email },
        // { label: "Department :", value: updated.profile.department },
        { label: "Gender:", value: updated.profile.gender },
        // { label: "Role:", value: normalizedRole },
        { label: "Date:", value: currentDate },
      ]);
      
      // Mobile fields (with gender)
      setMobileUserFields([
        { label: "Name:", value: updated.profile.name },
        {
          label: "Phone No :",
          value: formatPhoneForDisplay(updated.profile.phoneNumber),
        },
        { label: "Email :", value: updated.profile.email },
        // { label: "Department :", value: updated.profile.department },
        { label: "Gender:", value: updated.profile.gender },
        // { label: "Role:", value: normalizedRole },
        { label: "Date:", value: currentDate },
      ]);
      setEditOpen(false);
      window.dispatchEvent(new Event("profileUpdated"));
    } catch {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Box h="100vh" w="full" display="flex" flexDirection="column">
        {/* Desktop Header */}
        <DesktopHeader notificationCount={3} />

        {/* Mobile Header - Hidden on Desktop */}
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
            onClick={handleBack}
            onKeyDown={handleBackKeyDown}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">Profile</Text>
        </Flex>
        
        {/* Desktop Content - Hidden on Mobile */}
        <Flex
          display={{ base: "none", md: "flex" }}
          direction="column"
          bg="#F0E6FF"
          h="calc(100vh - 60px)"
          position="relative"
          overflowY="scroll"
        >
          {/* Decorative Background Logo - Centered */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            opacity={0.1}
            zIndex={1}
          >
            <Box transform="scale(5)">
              <Logo />
            </Box>
          </Box>

          {/* Main Content */}
          <Flex
            position="relative"
            zIndex={2}
            direction="column"
            h="full"
            pt={4}
            px={8}
          >
            {/* Profile Header */}
            <Flex align="center" gap={3} mb='20px'>
              <IconButton
                aria-label="Back"
                tabIndex={0}
                variant="ghost"
                fontSize="lg"
                bg="#FFF"
                onClick={() => router.push("/profile")}
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

            {/* Profile Image */}
            <Box display="flex" justifyContent="center" position="relative" top='30px'>
              <Box
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                borderRadius="full"
                overflow="hidden"
                w={24}
                h={24}
                bg="gray.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
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
                        fontSize="4xl"
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
                        fontSize="4xl"
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
            </Box>

            {/* Profile Details Card */}
            <Box flex="1" mb={6}>
              {loading ? (
                <Text color="black" textAlign="center">Loading...</Text>
              ) : error ? (
                <Text color="red.500" textAlign="center">{error}</Text>
              ) : (
                <ProfileDetailsCard fields={webUserFields} />
              )}
            </Box>

            {/* Edit Button - Inside Pink Background */}
            <Box display="flex" justifyContent="center">
              <Button
                w="300px"
                bg="#8a37f7"
                color="white"
                borderRadius="md"
                fontWeight="bold"
                fontSize="md"
                py={6}
                _hover={{ bg: "#7a2ee6" }}
                tabIndex={0}
                aria-label="Edit Information"
                onClick={() => setEditOpen(true)}
              >
                Edit Information
              </Button>
            </Box>
            <Box h={16} /> {/* Extra bottom spacing to ensure scroll */}
          </Flex>
        </Flex>

        {/* Mobile Content - Hidden on Desktop */}
        <Flex
          display={{ base: "flex", md: "none" }}
          direction="column"
          minH="calc(100vh - 60px)"
          bg="white"
          overflowY="scroll"
        >
          {/* Profile Image - clearly below header */}
          <Box display="flex" justifyContent="center" mt='16px' mb={-12} zIndex={2}>
            <Box
              boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              borderRadius="full"
              overflow="hidden"
              w={12}
              h={12}
              bg="gray.200"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
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
          </Box>
            
          {/* Card */}
          <Box px={4} pb={2} flex="1">
            {loading ? (
              <Text color="black">Loading...</Text>
            ) : error ? (
              <Text color="red.500">{error}</Text>
            ) : (
              <ProfileDetailsCard fields={mobileUserFields} />
            )}
          </Box>
            
          {/* Button at bottom */}
          <Box px={4} pb={6}>
            <Button
              w="full"
              bg="#8a37f7"
              color="white"
              borderRadius="md"
              fontWeight="bold"
              fontSize="md"
              py={6}
              _hover={{ bg: "#7a2ee6" }}
              tabIndex={0}
              aria-label="Edit Information"
              onClick={() => setEditOpen(true)}
            >
              Edit Information
            </Button>
          </Box>
          
        </Flex>
      </Box>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditOpen}
        onClose={() => setEditOpen(false)}
        initialData={{
          name: profileData?.profile.name || "",
          phone: profileData?.profile.phoneNumber || "",
          email: profileData?.profile.email || "",
          // department: profileData?.profile.department || "",
          gender: profileData?.profile.gender || "Male",
          // roleType: userRole || "",
          profileImage:
            profileData?.profile.profileImageUrl &&
            profileData?.profile.profileImageUrl !== "-"
              ? profileData.profile.profileImageUrl
              : null,
        }}
        // allowedRoles={userRole ? [userRole] : []}
        onSave={handleSaveProfile}
        onImageDeleted={handleImageDeleted}
      />
    </>
  );
};

export default MyProfilePage;