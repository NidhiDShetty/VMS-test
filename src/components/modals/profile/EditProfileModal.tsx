"use client";

import React, { useState, ChangeEvent, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Box,
  Flex,
  Text,
  Input,
  VStack,
  HStack,
  Portal,
  Dialog,
  RadioGroup,
  createListCollection,
  useBreakpointValue,
  Icon,
} from "@chakra-ui/react";
import { FiCamera, FiTrash2 } from "react-icons/fi";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import {
  uploadProfileImage,
  getProfileImage,
  deleteProfileImage,
} from "@/app/api/profile/routes";
import usePreventBodyScroll from "@/hooks/usePreventBodyScroll";

export type EditProfileForm = {
  name: string;
  phone: string;
  email: string;
  department?: string; // Made optional
  gender: string;
  // roleType: string;
  profileImage?: string | ArrayBuffer | null;
};

export type EditProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  onSave?: (profile: EditProfileForm) => void;
  onImageDeleted?: () => void;
  initialData?: EditProfileForm;
  // allowedRoles?: string[];
};

const genderOptions = createListCollection({
  items: [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ],
});

// const roleTypeOptions = createListCollection({
//   items: [
//     { label: "Admin", value: "Admin" },
//     { label: "Security", value: "Security" },
//     { label: "Employee", value: "Employee" },
//   ],
// });

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onBack,
  onSave,
  onImageDeleted,
  initialData,
  // allowedRoles = [],
}) => {
  const [form, setForm] = useState<EditProfileForm>(
    initialData || {
      name: "",
      phone: "",
      email: "",
      // department: "",
      gender: "Male",
      // roleType: "Security",
      profileImage: null,
    }
  );

  // Get user role for validation
  const [userRole, setUserRole] = useState<string>("");

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageRefreshing, setImageRefreshing] = useState(false);
  const [imageJustUploaded, setImageJustUploaded] = useState(false);

  // Add this effect to sync form with initialData and refresh image
  useEffect(() => {
    if (initialData) {
      setForm(initialData);
    }
  }, [initialData]);

  // Get user role from authData
  useEffect(() => {
    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
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
              setUserRole(jwtRole);
              return; // Use JWT role and skip fallback
            }
          } catch (decodeError) {
            console.warn("Failed to decode JWT token:", decodeError);
          }
        }

        // Fallback to old format (if exists)
        const role = parsed?.user?.roleName || parsed?.user?.roleType || "";
        
        // Normalize role for comparison
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
  }, [isOpen]);

  // Refresh image data when modal opens (only if no current image in form and not just uploaded)
  useEffect(() => {
    if (isOpen && !form.profileImage && !imageJustUploaded) {
      const refreshImage = async () => {
        setImageRefreshing(true);
        try {
          const imageResponse = await getProfileImage();
          if (imageResponse.success && imageResponse.data?.imageData) {
            setForm((prev) => ({
              ...prev,
              profileImage: imageResponse.data!.imageData,
            }));
          } else if (imageResponse.success && !imageResponse.data?.hasImage) {
            // No image exists, ensure form reflects this
            setForm((prev) => ({
              ...prev,
              profileImage: null,
            }));
          }
        } catch (error) {
          console.warn("Could not refresh image data:", error);
          // On error, ensure we don't show stale data
          setForm((prev) => ({
            ...prev,
            profileImage: null,
          }));
        } finally {
          setImageRefreshing(false);
        }
      };

      refreshImage();
    }
  }, [isOpen, form.profileImage, imageJustUploaded]); // Include all dependencies
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalPadding = useBreakpointValue({ base: "12px", md: "16px" });
  const contentPadding = useBreakpointValue({ base: "12px", md: "16px" });

  const handleChange =
    (field: keyof EditProfileForm) => (e: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Allow different characters based on user role
    let cleanValue: string;
    if (userRole === "Security") {
      // For security role: allow letters, spaces, hyphens, and numbers
      cleanValue = value.replace(/[^a-zA-Z0-9\s-]/g, "");
    } else {
      // For admin and other roles: allow only letters, spaces, and hyphens
      cleanValue = value.replace(/[^a-zA-Z\s-]/g, "");
    }
    
    setForm((prev) => ({ ...prev, name: cleanValue }));

    // Clear error if it exists
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
    const { value } = e.target;

    // Extract only the numeric part after any country code
    let cleanValue = value;

    // Remove any country code prefix (+91-, +91, etc.)
    cleanValue = cleanValue.replace(/^\+91-?/, "");
    cleanValue = cleanValue.replace(/^\+/, ""); // Remove any other country code

    // Remove all non-digit characters
    cleanValue = cleanValue.replace(/\D/g, "");

    // Restrict to 10 digits
    if (cleanValue.length <= 10) {
      setForm((prev) => ({ ...prev, phone: cleanValue }));
    }
  };

  // Format phone number for display - handle both cases where backend provides full number or just digits
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

  const handleRadioValueChange =
    (field: keyof EditProfileForm) => (val: unknown) => {
      const radioVal = val as { value: string };
      setForm((prev) => ({ ...prev, [field]: radioVal?.value ?? "" }));
    };

  // Image upload handlers
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setImageError("File size must be less than 10MB");
      return;
    }

    setImageLoading(true);
    setImageError(null);

    // Store the current image state for potential rollback
    const previousImage = form.profileImage;

    try {
      // Immediately show the new image preview and set upload flag
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setForm((prev) => ({
          ...prev,
          profileImage: result,
        }));
        // Set the flag immediately when preview is shown
        setImageJustUploaded(true);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      const response = await uploadProfileImage(file);
      if (response.success) {
        // Upload successful - keep the preview image
        // Flag is already set, so refresh won't interfere

        // Notify dashboard to refresh
        window.dispatchEvent(new Event("profileUpdated"));

        // Clear the success indicator after 3 seconds
        setTimeout(() => {
          setImageJustUploaded(false);
        }, 3000);
      } else {
        setImageError(response.error || "Failed to upload image");
        // Revert to previous state on upload failure
        setForm((prev) => ({
          ...prev,
          profileImage: previousImage,
        }));
        setImageJustUploaded(false); // Reset flag on failure
      }
    } catch (error) {
      console.error("Image upload error:", error);
      setImageError("Failed to upload image");
      // Revert to previous state on error
      setForm((prev) => ({
        ...prev,
        profileImage: previousImage,
      }));
      setImageJustUploaded(false); // Reset flag on error
    } finally {
      setImageLoading(false);
      // Clear the file input to allow re-uploading the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async () => {
    setDeleteLoading(true);
    setImageError(null);

    // Store the current image for potential rollback
    const previousImage = form.profileImage;

    // Immediately clear the image from UI for smooth UX
    setForm((prev) => ({
      ...prev,
      profileImage: null,
    }));
    setShowDeleteConfirm(false);
    setImageJustUploaded(false); // Reset the upload flag

    try {
      const response = await deleteProfileImage();
      if (!response.success) {
        setImageError(response.error || "Failed to delete image");
        // Restore the image if deletion failed
        setForm((prev) => ({
          ...prev,
          profileImage: previousImage,
        }));
      } else {
        // Notify dashboard to refresh
        window.dispatchEvent(new Event("profileUpdated"));

        // Notify parent component that image was deleted
        if (onImageDeleted) {
          onImageDeleted();
        }
      }
    } catch (error) {
      console.error("Image delete error:", error);
      setImageError("Failed to delete image");
      // Restore the image if deletion failed
      setForm((prev) => ({
        ...prev,
        profileImage: previousImage,
      }));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else onClose();
  };

  const handleClose = () => {
    setImageJustUploaded(false); // Reset flag when modal closes
    onClose();
  };

  const validate = () => {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    // Name validation - required field
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (userRole === "Security") {
      // For security role: allow letters, spaces, hyphens, and numbers
      if (/[^a-zA-Z0-9\s-]/.test(form.name)) {
        newErrors.name = "Name should only contain letters, numbers, spaces, and hyphens";
      }
    } else {
      // For admin and other roles: allow only letters, spaces, and hyphens
      if (/[^a-zA-Z\s-]/.test(form.name)) {
        newErrors.name = "Name should only contain letters, spaces, and hyphens";
      }
    }

    // Phone validation: extract local number (without country code) and validate
    const phoneDigits = form.phone.replace(/\D/g, "");
    let localPhoneDigits = phoneDigits;
    
    // If it's exactly 10 digits, it's already a local number
    if (phoneDigits.length === 10) {
      localPhoneDigits = phoneDigits;
    }
    // If it's 11 digits and starts with 0, remove the 0
    else if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
      localPhoneDigits = phoneDigits.substring(1);
    }
    // If it's 12 digits and starts with 91 (India), remove country code
    else if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
      localPhoneDigits = phoneDigits.substring(2);
    }
    // If it's 11 digits and starts with 1 (US/Canada), remove country code
    else if (phoneDigits.length === 11 && phoneDigits.startsWith("1")) {
      localPhoneDigits = phoneDigits.substring(1);
    }
    // If it's 12 digits and starts with 44 (UK), remove country code
    else if (phoneDigits.length === 12 && phoneDigits.startsWith("44")) {
      localPhoneDigits = phoneDigits.substring(2);
    }
    // For any number longer than 10 digits, extract last 10 digits (fallback)
    else if (phoneDigits.length > 10) {
      localPhoneDigits = phoneDigits.slice(-10);
    }
    
    // Validate that we have exactly 10 digits for the local number
    if (localPhoneDigits.length !== 10) {
      newErrors.phone = "Enter a valid phone number";
    }

    // Basic email validation
    if (form.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Extract local phone number (without country code) before saving
    const phoneDigits = form.phone.replace(/\D/g, "");
    let localPhoneNumber = phoneDigits;
    
    // If it's exactly 10 digits, it's already a local number
    if (phoneDigits.length === 10) {
      localPhoneNumber = phoneDigits;
    }
    // If it's 11 digits and starts with 0, remove the 0
    else if (phoneDigits.length === 11 && phoneDigits.startsWith("0")) {
      localPhoneNumber = phoneDigits.substring(1);
    }
    // If it's 12 digits and starts with 91 (India), remove country code
    else if (phoneDigits.length === 12 && phoneDigits.startsWith("91")) {
      localPhoneNumber = phoneDigits.substring(2);
    }
    // If it's 11 digits and starts with 1 (US/Canada), remove country code
    else if (phoneDigits.length === 11 && phoneDigits.startsWith("1")) {
      localPhoneNumber = phoneDigits.substring(1);
    }
    // If it's 12 digits and starts with 44 (UK), remove country code
    else if (phoneDigits.length === 12 && phoneDigits.startsWith("44")) {
      localPhoneNumber = phoneDigits.substring(2);
    }
    // For any number longer than 10 digits, extract last 10 digits (fallback)
    else if (phoneDigits.length > 10) {
      localPhoneNumber = phoneDigits.slice(-10);
    }

    // Create a form object without the image data for saving
    // The image is handled separately by the upload API
    const formForSave: EditProfileForm = {
      name: form.name,
      phone: localPhoneNumber, // Send only local number (10 digits) without country code
      email: form.email,
      // department: form.department,
      gender: form.gender,
      // roleType: form.roleType,
      // Don't include profileImage in the save - it's handled separately
    };

    if (onSave) onSave(formForSave);
    handleClose();
  };

  // const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // useEffect(() => {
  //   // Check authData for SuperAdmin role
  //   const authDataRaw =
  //     typeof window !== "undefined" ? localStorage.getItem("authData") : null;
  //   if (authDataRaw) {
  //     try {
  //       const parsed = JSON.parse(authDataRaw);
  //       const role = parsed?.user?.roleName || parsed?.user?.roleType || "";
  //       setIsSuperAdmin(
  //         role.toLowerCase() === "superadmin" ||
  //           role.toLowerCase() === "super admin"
  //       );
  //     } catch {
  //       setIsSuperAdmin(false);
  //     }
  //   }
  // }, [isOpen]);

  // Prevent body scrolling when modal is open
  usePreventBodyScroll(isOpen);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Portal>
        <Dialog.Backdrop
          bg="rgba(0, 0, 0, 0.5)"
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          zIndex={1000}
        />
        <Dialog.Positioner
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 3, md: 4 }}
          zIndex={1001}
          overflow="hidden"
          overscrollBehavior="none"
          className="modal-container"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: "hidden",
            overscrollBehavior: "none",
          }}
        >
          <Dialog.Content
            width="full"
            maxWidth={{ base: "100%", md: "600px" }}
            height="full"
            maxHeight={{ base: "100%", md: "calc(100vh - 2rem)" }}
           borderRadius="lg"
            bg="white"
            boxShadow={{ base: "0 2px 16px rgba(95,36,172,0.27)", md: "0 2px 16px rgba(95,36,172,0.27)" }}
            tabIndex={0}
            aria-label="Edit Profile Modal"
            p={0}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            border={{ base: "none", md: "1px solid" }}
            borderColor={{ base: "transparent", md: "rgba(139, 92, 246, 0.1)" }}
            position="relative"
          >
            <Dialog.Header
              p={{ base: `${modalPadding} ${contentPadding}`, md: "24px 32px" }}
              bg={{
                base: "#F4EDFE",
                md: "linear-gradient(135deg, #8A38F5, #5F24AC)",
              }}
              borderBottomWidth="1px"
              borderBottomColor={{
                base: "gray.200",
                md: "rgba(255,255,255,0.1)",
              }}
              borderTopLeftRadius={{ base: 0, md: "xl" }}
              borderTopRightRadius={{ base: 0, md: "xl" }}
              position="sticky"
              top={0}
              zIndex={2}
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow={{
                base: "none",
                md: "0 4px 20px rgba(139, 92, 246, 0.2)",
              }}
            >
              <Dialog.Title asChild>
                <Text
                  fontWeight="bold"
                  fontSize={{ base: "lg", md: "xl" }}
                  color={{ base: "gray.800", md: "white" }}
                  textAlign="center"
                  fontFamily="Roboto, sans-serif"
                >
                  Edit Profile
                </Text>
              </Dialog.Title>
            </Dialog.Header>

            <Box
              as={Dialog.Body}
              p={{ base: contentPadding, md: "32px" }}
              flex={1}
              minH={0}
              overflowY="scroll"
              overflowX="hidden"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              className="scrollbar-hide modal-content"
              bg="white"
              position="relative"
              maxH="calc(100vh - 140px)"
              overscrollBehavior="contain"
            >
              <VStack
                align="stretch"
                w="full"
                pt={{ base: 2, md: 4 }}
                gap={{ base: 4, md: 6 }}
              >
                {/* Profile Image Upload */}
                <Box>
                  <Text
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    mb={{ base: 1, md: 2 }}
                    color="#000"
                    fontFamily="Roboto, sans-serif"
                  >
                    Profile Image
                  </Text>
                  <Box
                    className="flex flex-col items-center justify-center gap-2"
                    h={{ base: "140px", md: "180px" }}
                    w={{ base: "140px", md: "180px" }}
                    borderRadius="full"
                    bg="gray.50"
                    cursor={
                      imageLoading || deleteLoading || imageRefreshing
                        ? "not-allowed"
                        : "pointer"
                    }
                    onClick={
                      imageLoading || deleteLoading || imageRefreshing
                        ? undefined
                        : handleImageClick
                    }
                    opacity={
                      imageLoading || deleteLoading || imageRefreshing ? 0.6 : 1
                    }
                    position="relative"
                    transition="all 0.2s ease-in-out"
                    mx="auto"
                    _hover={{
                      bg: imageError ? "red.50" : "purple.50",
                      transform: { base: "none", md: "translateY(-2px)" },
                      boxShadow: {
                        base: "none",
                        md: "0 8px 25px rgba(139, 92, 246, 0.15)",
                      },
                    }}
                  >
                    {form.profileImage ? (
                      <>
                        <Image
                          src={
                            typeof form.profileImage === "string"
                              ? form.profileImage
                              : ""
                          }
                          alt="Profile Preview"
                          width={140}
                          height={140}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "50%",
                            transition: "opacity 0.3s ease-in-out",
                          }}
                        />
                        {/* Upload Success Indicator */}
                        {imageJustUploaded && !imageLoading && (
                          <Box
                            position="absolute"
                            top={2}
                            left={2}
                            bg="green.500"
                            color="white"
                            borderRadius="full"
                            p={1}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            ✓
                          </Box>
                        )}
                        {/* Delete Button */}
                        {!deleteLoading && !imageRefreshing && (
                          <Box
                            position="absolute"
                            top={4}
                            right={4}
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            p={1}
                            cursor="pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm(true);
                            }}
                            _hover={{ bg: "red.600" }}
                            tabIndex={0}
                            aria-label="Delete profile image"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowDeleteConfirm(true);
                              }
                            }}
                            transition="background-color 0.2s ease-in-out"
                            boxShadow="0 2px 8px rgba(0,0,0,0.3)"
                            border="2px solid white"
                            w="24px"
                            h="24px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Icon as={FiTrash2} boxSize={3} />
                          </Box>
                        )}
                      </>
                    ) : (
                      <>
                        <Icon as={FiCamera} boxSize={10} color="purple.400" />
                        <Text fontSize="sm" color="gray.500">
                          {imageLoading
                            ? "Uploading..."
                            : deleteLoading
                            ? "Deleting..."
                            : imageRefreshing
                            ? "Loading..."
                            : "Tap to add photo"}
                        </Text>
                      </>
                    )}
                    {(imageLoading || deleteLoading || imageRefreshing) && (
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        bg="rgba(0,0,0,0.7)"
                        color="white"
                        px={3}
                        py={1}
                        borderRadius="md"
                        fontSize="sm"
                        transition="opacity 0.2s ease-in-out"
                      >
                        {imageLoading
                          ? "Uploading..."
                          : deleteLoading
                          ? "Deleting..."
                          : "Loading..."}
                      </Box>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      display="none"
                      onChange={handleImageChange}
                      disabled={imageLoading || deleteLoading}
                    />
                  </Box>
                  {imageError && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {imageError}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    color={"#000"}
                    mb={{ base: 1, md: 2 }}
                    fontFamily="Roboto, sans-serif"
                  >
                    Name{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Input
                    id="name"
                    color={"#000"}
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="Enter your name"
                    required
                    tabIndex={-1}
                    aria-invalid={!!errors.name}
                    borderColor={errors.name ? "red.500" : "gray.200"}
                    borderRadius={{ base: "lg", md: "xl" }}
                    borderWidth="2px"
                    h={{ base: "40px", md: "48px" }}
                    fontSize={{ base: "sm", md: "md" }}
                    _focus={{
                      borderColor: errors.name ? "red.500" : "#8A38F5",
                      boxShadow: errors.name
                        ? "0 0 0 1px #ef4444"
                        : "0 0 0 1px #8A38F5",
                    }}
                    _active={{
                      borderColor: errors.name ? "red.500" : "#8A38F5",
                    }}
                    _hover={{
                      borderColor: errors.name ? "red.400" : "#8A38F5",
                    }}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.name && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {errors.name}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    color={"#000"}
                    mb={{ base: 1, md: 2 }}
                    fontFamily="Roboto, sans-serif"
                  >
                    Phone Number{" "}
                    <Text as="span" color="red.500">
                      *
                    </Text>
                  </Text>
                  <Input
                    color={"#000"}
                    id="phone"
                    type="tel"
                    value={formatPhoneForDisplay(form.phone)}
                    onChange={handlePhoneChange}
                    placeholder="Enter 10-digit phone number"
                    required
                    tabIndex={-1}
                    aria-invalid={!!errors.phone}
                    borderColor={errors.phone ? "red.500" : "gray.200"}
                    borderRadius={{ base: "lg", md: "xl" }}
                    borderWidth="2px"
                    h={{ base: "40px", md: "48px" }}
                    fontSize={{ base: "sm", md: "md" }}
                    _focus={{
                      borderColor: errors.phone ? "red.500" : "#8A38F5",
                      boxShadow: errors.phone
                        ? "0 0 0 1px #ef4444"
                        : "0 0 0 1px #8A38F5",
                    }}
                    _active={{
                      borderColor: errors.phone ? "red.500" : "#8A38F5",
                    }}
                    _hover={{
                      borderColor: errors.phone ? "red.400" : "#8A38F5",
                    }}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.phone && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {errors.phone}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    color={"#000"}
                    mb={{ base: 1, md: 2 }}
                    fontFamily="Roboto, sans-serif"
                  >
                    Email
                  </Text>
                  <Input
                    id="email"
                    color="#000"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="Enter your email"
                    disabled={true}
                    aria-disabled="true"
                    fontSize={{ base: "xs", sm: "sm", md: "md" }}
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    borderColor="gray.200"
                    bg="gray.100"
                    borderRadius={{ base: "lg", md: "xl" }}
                    borderWidth="2px"
                    h={{ base: "40px", md: "48px" }}
                    _focus={{ borderColor: "gray.200" }}
                    _active={{ borderColor: "gray.200" }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: "not-allowed",
                      bg: "gray.100",
                      color: "#000",
                    }}
                    _hover={{
                      borderColor: "gray.300",
                      bg: "gray.150",
                    }}
                    transition="all 0.2s ease-in-out"
                  />
                  {errors.email && (
                    <Text color="red.500" fontSize="xs" mt={1}>
                      {errors.email}
                    </Text>
                  )}
                </Box>

                {/* Gender Field (hide if Admin or SuperAdmin) */}
                {/* {!isSuperAdmin && form.roleType !== "Admin" && ( */}
                <Box>
                  <Text
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    color={"#000"}
                    mb={{ base: 1, md: 2 }}
                    fontFamily="Roboto, sans-serif"
                  >
                    Gender
                  </Text>
                  <RadioGroup.Root
                    name="gender"
                    value={form.gender}
                    onValueChange={handleRadioValueChange("gender")}
                  >
                    <HStack gap={{ base: 4, md: 6 }} mt={{ base: 2, md: 3 }}>
                      {genderOptions.items.map((item) => (
                        <RadioGroup.Item key={item.value} value={item.value}>
                          <RadioGroup.ItemHiddenInput />
                          <RadioGroup.ItemIndicator
                            boxSize={{ base: "24px", md: "28px" }}
                            borderRadius="full"
                            borderWidth="2px"
                            borderColor={
                              form.gender === item.value
                                ? "#8A38F5"
                                : "gray.300"
                            }
                            bg={
                              form.gender === item.value ? "#8A38F5" : "white"
                            }
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            transition="all 0.2s"
                            _hover={{
                              borderColor:
                                form.gender === item.value
                                  ? "#8A38F5"
                                  : "#8A38F5",
                              transform: { base: "none", md: "scale(1.05)" },
                            }}
                          >
                            {form.gender === item.value && (
                              <Box
                                boxSize={{ base: "8px", md: "10px" }}
                                borderRadius="full"
                                bg="white"
                              />
                            )}
                          </RadioGroup.ItemIndicator>
                          <RadioGroup.ItemText
                            color="#18181B"
                            ml={{ base: 2, md: 3 }}
                            fontSize={{ base: "sm", md: "md" }}
                            fontFamily="Roboto, sans-serif"
                          >
                            {item.label}
                          </RadioGroup.ItemText>
                        </RadioGroup.Item>
                      ))}
                    </HStack>
                  </RadioGroup.Root>
                </Box>
                {/* )} */}

                {/* Department Field (hide if SuperAdmin) */}
                {/* {!isSuperAdmin && (
                  <Box>
                    <Text fontWeight="medium" fontSize="sm" color={"#000"} mb={1}>Department</Text>
                    <Select.Root
                      value={[form.department]}
                      onValueChange={handleSelectValueChange("department")}
                      collection={departmentOptions}
                    >
                      <Select.HiddenSelect />
                      <Select.Control>
                        <Select.Trigger
                          bg="white"
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="4px"
                          height="40px"
                          _focus={{ borderColor: "#8A38F5" }}
                          _active={{ borderColor: "#8A38F5" }}
                        >
                          <Select.ValueText 
                            placeholder="Dropdown" 
                            color={form.department ? "#000" : "gray.500"}
                          />
                        </Select.Trigger>
                        <Select.IndicatorGroup>
                          <Select.Indicator />
                        </Select.IndicatorGroup>
                      </Select.Control>
                      <Portal>
                        <Select.Positioner>
                          <Select.Content>
                            {departmentOptions.items.map((item) => (
                              <Select.Item key={item.value} item={item}>
                                <Text color={"#000"}>{item.label}</Text>
                                <Select.ItemIndicator />
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Portal>
                    </Select.Root>
                  </Box>
                )} */}

                {/* Role Type Field (hide if SuperAdmin) */}
                {/* {!isSuperAdmin && (
                  <>
                    <Box>
                      <Text
                        fontWeight="medium"
                        fontSize={{ base: "sm", md: "md" }}
                        color={"#000"}
                        mb={{ base: 1, md: 2 }}
                        fontFamily="Roboto, sans-serif"
                      >
                        Role Type
                      </Text>
                      {allowedRoles.length === 1 ? (
                        <RadioGroup.Root
                          name="roleType"
                          value={allowedRoles[0]}
                          disabled
                        >
                          <HStack gap={4} mt={2}>
                            <RadioGroup.Item value={allowedRoles[0]} disabled>
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator
                                boxSize="24px"
                                borderRadius="full"
                                borderWidth="2px"
                                borderColor="#8A38F5"
                                bg="#8A38F5"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                transition="all 0.2s"
                              >
                                <Box
                                  boxSize="8px"
                                  borderRadius="full"
                                  bg="white"
                                />
                              </RadioGroup.ItemIndicator>
                              <RadioGroup.ItemText color="#000" ml={2}>
                                {allowedRoles[0]}
                              </RadioGroup.ItemText>
                            </RadioGroup.Item>
                          </HStack>
                        </RadioGroup.Root>
                      ) : (
                        <RadioGroup.Root
                          name="roleType"
                          value={form.roleType}
                          onValueChange={handleRadioValueChange("roleType")}
                        >
                          <HStack gap={4} mt={2}>
                            {roleTypeOptions.items.map((item) => (
                              <RadioGroup.Item
                                key={item.value}
                                value={item.value}
                              >
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemIndicator
                                  boxSize="24px"
                                  borderRadius="full"
                                  borderWidth="2px"
                                  borderColor={
                                    form.roleType === item.value
                                      ? "#8A38F5"
                                      : "gray.300"
                                  }
                                  bg={
                                    form.roleType === item.value
                                      ? "#8A38F5"
                                      : "white"
                                  }
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  transition="all 0.2s"
                                >
                                  {form.roleType === item.value && (
                                    <Box
                                      boxSize="8px"
                                      borderRadius="full"
                                      bg="white"
                                    />
                                  )}
                                </RadioGroup.ItemIndicator>
                                <RadioGroup.ItemText color="#000" ml={2}>
                                  {item.label}
                                </RadioGroup.ItemText>
                              </RadioGroup.Item>
                            ))}
                          </HStack>
                        </RadioGroup.Root>
                      )}
                    </Box>
                  </>
                )} */}
              </VStack>
            </Box>

            <Box
              px={{ base: contentPadding, md: "32px" }}
              pb={{ base: contentPadding, md: "24px" }}
              pt={{ base: 2, md: 4 }}
              position="sticky"
              bottom={0}
              zIndex={2}
              bg="white"
              borderBottomLeftRadius={{ base: 0, md: "xl" }}
              borderBottomRightRadius={{ base: 0, md: "xl" }}
              borderTopWidth="1px"
              borderTopColor={{
                base: "gray.200",
                md: "rgba(139, 92, 246, 0.1)",
              }}
              boxShadow={{
                base: "none",
                md: "0 -4px 20px rgba(139, 92, 246, 0.1)",
              }}
            >
              <Flex gap={{ base: 2, md: 4 }} w="full">
                <SecondaryButton
                  onClick={handleBack}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                >
                  Back
                </SecondaryButton>
                <PrimaryButton
                  onClick={handleSave}
                  className="flex-1"
                  w="50%"
                  h={{ base: "40px", md: "48px" }}
                  fontSize={{ base: "sm", md: "md" }}
                  borderRadius={{ base: "md", md: "xl" }}
                  fontFamily="Roboto, sans-serif"
                  bg="linear-gradient(135deg, #8A38F5, #5F24AC)"
                  _hover={{
                    bg: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                    transform: { base: "none", md: "translateY(-1px)" },
                  }}
                  transition="all 0.2s ease"
                >
                  Save Changes
                </PrimaryButton>
              </Flex>
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={showDeleteConfirm}
        onOpenChange={(details) => setShowDeleteConfirm(details.open)}
      >
        <Portal>
          <Dialog.Backdrop
            bg="rgba(0, 0, 0, 0.5)"
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            zIndex={1002}
          />
          <Dialog.Positioner
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
            zIndex={1003}
          >
            <Dialog.Content
              width="full"
              maxWidth="sm"
              borderRadius="md"
              bg="white"
              boxShadow="lg"
              p={6}
            >
              <Dialog.Header mb={4}>
                <Dialog.Title>
                  <Text fontWeight="bold" fontSize="lg" color="gray.800">
                    Delete Profile Image
                  </Text>
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body mb={6}>
                <Text color="gray.600">
                  Are you sure you want to delete your profile image? This
                  action cannot be undone.
                </Text>
              </Dialog.Body>

              <Dialog.Footer>
                <Flex gap={3} w="full">
                  <SecondaryButton
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                    disabled={deleteLoading}
                  >
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleDeleteImage}
                    className="flex-1"
                    bg="red.500"
                    _hover={{ bg: "red.600" }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </PrimaryButton>
                </Flex>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Dialog.Root>
  );
};

export default EditProfileModal;
