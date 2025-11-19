'use client';
import ProfileDetailsCard, { ProfileField } from '../ProfileDetailsCard';
import { Box, Flex, Text, Icon, Button, Heading, Avatar, IconButton } from '@chakra-ui/react';
import { FiChevronLeft } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from "react";
import EditCompanyModal, { EditCompanyForm } from "@/components/modals/company/EditCompanyModal";
import { getCompanyProfileData, updateCompanyProfileData, CompanyProfileResponse, getProfileData, ProfileResponse, getProfileImage } from "@/app/api/profile/routes";
import Logo from "@/components/svgs/logo";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import { useUserData } from "@/lib/hooks/useUserData";
import DesktopHeader from "@/components/DesktopHeader";

const CompanyProfilePage = () => {
  const router = useRouter();
  const { isMobile } = useDeviceDetection();
  const { userData } = useUserData();
  const roleName = userData?.roleName;
  
  const handleBack = () => router.back();
  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBack();
    }
  };

  const [company, setCompany] = useState<CompanyProfileResponse | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Format phone number for display with country code
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "";
    
    // If phone already contains country code (starts with +), return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    // If phone starts with 91 and has more digits, it's likely a full number with country code
    if (phone.startsWith('91') && phone.length > 10) {
      // Remove the leading 91 and format properly
      const numberWithoutCountryCode = phone.substring(2);
      return `+91-${numberWithoutCountryCode}`;
    }
    
    // If phone is just digits (10 digits), add country code
    if (/^\d{10}$/.test(phone)) {
      return `+91-${phone}` ;
    }
    
    // If phone already has country code format, return as is
    if (phone.includes('-')) {
      return phone;
    }
    
    // Default case: assume it's just digits and add country code
    return `+91-${phone}`;
  };

  // Fetch profile data for header
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setProfileLoading(true);
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        }

        setProfileData(profileData);
        setProfileLoading(false);
      } catch (error) {
        console.error("Failed to load profile:", error);
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Fetch company profile data on mount
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCompanyProfileData();
        setCompany(data);
        // Convert location object to comma-separated string
        // if (data.location) {
        //   const loc = data.location;
        //   // setLocationString([
        //   //   loc.buildingNo,
        //   //   loc.floor,
        //   //   loc.street,
        //   //   loc.locality,
        //   //   loc.city,
        //   //   loc.state,
        //   //   loc.pincode
        //   // ].filter(Boolean).join(", "));
        // } else {
        //   // setLocationString("");
        // }
      } catch {
        setError('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyProfile();
  }, []);

  const handleOpenEdit = () => setEditOpen(true);
  const handleCloseEdit = () => setEditOpen(false);
  const handleSaveEdit = async (form: EditCompanyForm) => {
    setError(null);
    try {
      const updatedProfile: CompanyProfileResponse = {
        companyName: form.companyName,
        phoneNumber: form.phoneNumber,
        email: form.email,
        location: {
          buildingNo: form.buildingNumber,
          floor: form.floorDetails,
          street: form.streetDetails,
          locality: form.locality,
          city: form.city,
          state: form.state,
          pincode: form.pinCode,
        },
      };
      await updateCompanyProfileData(updatedProfile);
      setEditOpen(false);
      // Refresh profile from backend
      const data = await getCompanyProfileData();
      setCompany(data);
      // if (data.location) {
      //   const loc = data.location;
      //   // setLocationString([
      //   //   loc.buildingNo,
      //   //   loc.floor,
      //   //   loc.street,
      //   //   loc.locality,
      //   //   loc.city,
      //   //   loc.state,
      //   //   loc.pincode
      //   // ].filter(Boolean).join(", "));
      // } else {
      //   // setLocationString("");
      // }
    } catch {
      setError("Failed to update company profile");
    } finally {
      // setSaving(false);
    }
  };

  // Prepare fields for ProfileDetailsCard
  const companyFields: ProfileField[] = company
    ? [
        { label: 'Company Name:', value: company.companyName },
        { label: 'Phone No :', value: formatPhoneForDisplay(company.phoneNumber) },
        { label: 'Email :', value: company.email },
        { label: 'Location :', value: [
          company.location.buildingNo,
          company.location.floor,
          company.location.street,
          company.location.locality,
          company.location.city,
          company.location.state,
          company.location.pincode
        ].filter(Boolean).join(', ') },
      ]
    : [];

  return (
    <Flex direction="column" minH="100vh" bg="#f8fafc" w="full">
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
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">Company Profile</Text>
      </Flex>

      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader />

      {/* Main Content Area */}
      <Box
        flex={1}
      
        display="flex"
        flexDirection="column"
      >
        {/* Mobile Layout */}
        <Box display={{ base: "flex", md: "none" }} w="full" flexDirection="column" flex={1}>
          {/* Card */}
          <Box px={4} pb={4}>
            {loading ? (
              <Flex align="center" justify="center" minH="200px">
                <Text color="black">Loading...</Text>
              </Flex>
            ) : error ? (
              <Flex align="center" justify="center" minH="200px">
                <Text color="red.500">{error}</Text>
              </Flex>
            ) : (
              <ProfileDetailsCard fields={companyFields} />
            )}
          </Box>
          
          {/* Spacer to push button to bottom */}
          <Box flex={1} />
          
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
              _hover={{ bg: '#7a2ee6' }}
              tabIndex={0}
              aria-label="Edit Company Information"
              onClick={handleOpenEdit}
            >
              Edit Company Information
            </Button>
          </Box>
        </Box>

        {/* Desktop Layout */}
        <Box display={{ base: "none", md: "flex" }} flex={1} bg="#F0E6FF" flexDirection="column" position="relative" overflow="hidden">
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

          {/* Page Title and Back Button */}
          <Flex align="center" gap={3} mb='20px' px={8} py={4} bg="transparent" position="relative" zIndex={2}>
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
              Company Profile
            </Heading>
          </Flex>

          {/* Content Area */}
          <Box flex={1} position="relative" overflowY="auto" display="flex" flexDirection="column" zIndex={2}>
            {loading ? (
              <Flex direction="column" align="center" justify="center" flex="1" h="400px">
                <Text color="gray.500" fontWeight="bold">Loading...</Text>
              </Flex>
            ) : error ? (
              <Flex direction="column" align="center" justify="center" flex="1" h="400px">
                <Text color="red.500" fontWeight="bold">{error}</Text>
              </Flex>
            ) : (
              <>
                {/* Company Profile Card */}
                <Box px={8} py={6} flex={1}>
                  <Box
                    bg="white"
                    borderRadius="lg"
                    boxShadow="0 2px 16px rgba(95,36,172,0.27)"
                    p={8}
                    w="95%"
                    mx="auto"
                  >
                    <Flex direction="column" gap={6}>
                      {companyFields.map((field) => (
                        <Flex key={field.label} justify="space-between" align="flex-start" gap={4}>
                          <Text 
                            fontWeight="600" 
                            color="gray.600" 
                            fontSize="16px" 
                            flexShrink={0}
                            minW="150px"
                            fontFamily="Roboto, sans-serif"
                          >
                            {field.label}
                          </Text>
                          <Text 
                            fontSize="16px" 
                            color="gray.800" 
                            textAlign="left" 
                            flex="1"
                            fontFamily="Roboto, sans-serif"
                            wordBreak="break-word"
                          >
                            {field.value || "-"}
                          </Text>
                        </Flex>
                      ))}
                    </Flex>
                  </Box>
                </Box>
                
                {/* Action Button at Bottom */}
                <Box mt="auto" mb={8} display="flex" justifyContent="center" position="relative" zIndex={2}>
                  <Button
                    w="300px"
                    h="56px"
                    bg="#8A37F7"
                    color="white"
                    fontWeight="bold"
                    fontSize="lg"
                    borderRadius="md"
                    _hover={{ bg: '#6C2BC2' }}
                    _active={{ bg: '#6C2BC2' }}
                    tabIndex={0}
                    aria-label="Edit Company Information"
                    onClick={handleOpenEdit}
                  >
                    Edit Company Information
                  </Button>
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
              </>
            )}
          </Box>
        </Box>
      </Box>

      <EditCompanyModal
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        onBack={handleCloseEdit}
        onSave={handleSaveEdit}
        initialData={company ? {
          companyName: company.companyName || '',
          phoneNumber: company.phoneNumber || '',
          email: company.email || '',
          buildingNumber: company.location.buildingNo || '',
          floorDetails: company.location.floor || '',
          streetDetails: company.location.street || '',
          locality: company.location.locality || '',
          city: company.location.city || '',
          state: company.location.state || '',
          pinCode: company.location.pincode || '',
        } as EditCompanyForm : {
          companyName: '',
          phoneNumber: '',
          email: '',
          buildingNumber: '',
          floorDetails: '',
          streetDetails: '',
          locality: '',
          city: '',
          state: '',
          pinCode: '',
        }}
      />
    </Flex>
  );
};

export default CompanyProfilePage;