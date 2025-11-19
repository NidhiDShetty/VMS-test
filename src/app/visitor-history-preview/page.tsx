"use client";

import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Avatar,
  Icon,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import React, { FC, useState, useEffect } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import SecondaryButton from "@/components/ui/SecondaryButton";
import { useSearchParams } from "next/navigation";
import { FRONTEND_URL, EMPLOYEES_API } from "@/lib/server-urls";
import Image from "next/image";
import {
  createVisitor,
  getVisitors,
  updateVisitor,
  VisitorFormData,
} from "@/app/api/visitor/routes";
import { useVisitorPreview } from "@/app/visitor/add/VisitorPreviewContext";
import { FiChevronLeft } from "react-icons/fi";
import Logo from "@/components/svgs/logo";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "@/app/api/profile/routes";
import { getVisitorImageBlob } from "@/app/api/visitor-image/routes";
import { getVisitorAssetImageBlob } from "@/app/api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "@/app/api/visitor-guests/routes";
import { useUserData } from "@/lib/hooks/useUserData";
import DesktopHeader from "@/components/DesktopHeader";

// Helper function to check if a resolved image URL is valid for Next.js Image component
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return (
    url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http")
  );
};

const HeaderBar = () => {
  const { safeBack } = useNavigation();
  return (
    <Flex
      w="full"
      align="center"
      px={4}
      h="70px"
      bg="#f4edfe"
      borderBottom="1px solid #f1f1f1"
    >
      <Icon
        as={FiChevronLeft}
        boxSize={6}
        color="gray.700"
        aria-label="Back"
        tabIndex={0}
        mr={2}
        role="button"
        cursor="pointer"
        onClick={() => safeBack()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            safeBack();
          }
        }}
        _focus={{ boxShadow: "none", outline: "none", bg: "transparent" }}
        _active={{ bg: "transparent" }}
      />
      <Text
        flex={1}
        textAlign="center"
        fontWeight="bold"
        fontSize="sm"
        color="gray.800"
      >
        Visitor Details
      </Text>
      <Box w={8} /> {/* Placeholder for right icon */}
    </Flex>
  );
};

type Guest = {
  guestName: string;
  imgUrl?: string;
};

type Asset = {
  index: number;
  assetName: string;
  assetType: "Personal" | "Company";
  serialNumber: string;
  imgUrl?: string;
};

type HostDetails = {
  name: string;
  profileImageUrl?: string;
  userId: string;
  role?: string;
};

interface EmployeeData {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}

type Visit = {
  id: string;
  guest: Guest[];
  hostDetails: HostDetails;
  purposeOfVisit: string;
  companyName: string;
  location?: string | null;
  checkInTime: string;
  checkOutTime: string;
  assets: Asset[];
  date: string;
  // Add any other fields used
};
type Visitor = {
  id: string;
  fullName: string;
  phoneNumber: string;
  gender: string;
  idType: string;
  idNumber: string;
  guest: Guest[];
  hostDetails: HostDetails;
  purposeOfVisit: string;
  companyName: string;
  location?: string | null;
  checkInTime: string;
  checkOutTime: string;
  assets: Asset[];
  imgUrl: string;
  status: string;
  date: string;
  // ... add more as needed
};
const VisitorHistoryPreview: FC = () => {
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const approvalReq = searchParams.get("approvalReq");
  const router = useRouter();
  const { safeBack } = useNavigation();
  const { userData } = useUserData();

  // Helper function to get the correct image URL
  const getImageUrl = async (
    imgUrl: string | undefined,
    type: "visitor" | "asset" | "guest" = "visitor"
  ): Promise<string | null> => {
    if (!imgUrl) return null;

    // If it's already a valid URL (http/https or data), return as is
    if (imgUrl.startsWith("http") || imgUrl.startsWith("data:")) {
      return imgUrl;
    }

    // If it's a file path, get the blob URL based on type
    try {
      let blobUrl: string | null = null;

      switch (type) {
        case "visitor":
          blobUrl = await getVisitorImageBlob(imgUrl);
          break;
        case "asset":
          blobUrl = await getVisitorAssetImageBlob(imgUrl);
          break;
        case "guest":
          blobUrl = await getVisitorGuestPhotoBlob(imgUrl);
          break;
        default:
          blobUrl = await getVisitorImageBlob(imgUrl);
      }

      // Validate that the blob URL is actually a valid URL
      if (
        blobUrl &&
        (blobUrl.startsWith("blob:") || blobUrl.startsWith("data:"))
      ) {
        return blobUrl;
      }

      // If blobUrl is not null but doesn't start with blob: or data:, it might be the original file path
      // This should not happen, but let's be extra safe
      if (
        blobUrl &&
        !blobUrl.startsWith("blob:") &&
        !blobUrl.startsWith("data:") &&
        !blobUrl.startsWith("http")
      ) {
        console.warn(`Invalid blob URL returned for ${type} image:`, blobUrl);
        return null;
      }

      return null;
    } catch (error) {
      console.error(`Failed to load ${type} image:`, error);
      return null;
    }
  };

  // Helper function to get avatar initials
  const getAvatarInitials = (name: string | undefined): string => {
    if (!name || name.trim() === "") return "V";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Get visitor preview data from context
  const { visitorPreviewData, setVisitorPreviewData } = useVisitorPreview();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const visitorId = searchParams.get("id");
  const [profileData, setProfileData] = useState<Visitor | null>(null);
  const [visitorHistory, setVisitorHistory] = useState<Visitor[] | null>([]);
  const [isApprovalRequired, setIsApprovalRequired] = useState<boolean>(true);
  const [userProfileData, setUserProfileData] =
    useState<ProfileResponse | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);

  useEffect(() => {
    // Retrieve JWT token from localStorage
    const authDataRaw =
      typeof window !== "undefined" ? localStorage.getItem("authData") : null;
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        if (parsed?.token) setToken(parsed.token);
      } catch {
        // Optionally handle error
      }
    }
  }, []);

  // Fetch employee data to populate missing host profile information
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!token) return;

      try {
        const response = await fetch(EMPLOYEES_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setEmployeesData(data.employees || []);
        }
      } catch (error) {
        console.error("Failed to fetch employees:", error);
      }
    };

    fetchEmployees();
  }, [token]);

  // Update role name when user data is loaded
  useEffect(() => {
    if (userData?.roleName) {
      setRoleName(userData.roleName);
    }
  }, [userData]);

  // Set approval requirement from URL params or visitor preview data
  useEffect(() => {
    if (approvalReq !== null) {
      const approvalRequired = approvalReq === "true";
      setIsApprovalRequired(approvalRequired);
    } else if (visitorPreviewData?.isApprovalReq !== undefined) {
      setIsApprovalRequired(visitorPreviewData.isApprovalReq);
    }
  }, [approvalReq, visitorPreviewData]);

  // Load user profile data for header
  useEffect(() => {
    const loadProfileAndImage = async () => {
      try {
        const [profileData, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        if (imageData.success && imageData.data?.imageData) {
          profileData.profile.profileImageUrl = imageData.data.imageData;
        }

        setUserProfileData(profileData);
      } catch (error) {
        console.error("Failed to load profile:", error);
      }
    };

    loadProfileAndImage();
  }, []);

  useEffect(() => {
    if (!visitorId || !token) return;

    const fetchVisitorDetails = async () => {
      try {
        const res = await getVisitors(token);
        const allVisitors = res.visitors;

        const matchedVisitor = allVisitors.find(
          (v: Visitor) => v.id === visitorId
        );
        if (!matchedVisitor) return;

        // Use phone number as a unique key
        const identifier =
          matchedVisitor.idNumber || matchedVisitor.phoneNumber;

        // Filter all visits for same person (based on idNumber or phone)
        const visitHistory = allVisitors.filter(
          (v: Visitor) =>
            (v.idNumber === identifier || v.phoneNumber === identifier) &&
            v.status == "CHECKED_OUT"
        );

        // Sort by date if needed (e.g., descending)
        const sortedHistory = visitHistory.sort(
          (
            a: { checkInTime: string | number | Date },
            b: { checkInTime: string | number | Date }
          ) =>
            new Date(b.checkInTime).getTime() -
            new Date(a.checkInTime).getTime()
        );

        // Optional: limit to 2 or more entries
        const lastTwoVisits = sortedHistory.slice(0, 2);

        // Save to state
        setVisitorHistory(lastTwoVisits);
      } catch (err) {
        console.error("Failed to fetch visitor details", err);
      }
    };

    fetchVisitorDetails();
  }, [visitorId, token]);

  useEffect(() => {
    if (visitorHistory && visitorHistory?.length > 0) {
      const visitorData = visitorHistory[0];

      // Set profile data directly - the image resolution will be handled by the existing logic
      console.log("Setting visitor data:", visitorData);
      setProfileData(visitorData);
    }
  }, [visitorHistory]);

  // Populate missing host profile information from employee data
  useEffect(() => {
    if (!employeesData.length) return;

    // Update profileData if it has incomplete host information
    if (profileData?.hostDetails) {
      const hostDetails = profileData.hostDetails;
      const employee = employeesData.find(
        (emp) => emp.userId === parseInt(hostDetails.userId)
      );

      if (employee) {
        let needsUpdate = false;
        const updatedHostDetails = { ...hostDetails };

        if (!hostDetails.profileImageUrl && employee.profileImageUrl) {
          updatedHostDetails.profileImageUrl = employee.profileImageUrl;
          needsUpdate = true;
        }

        if (employee.name && employee.name !== hostDetails.name) {
          updatedHostDetails.name = employee.name;
          needsUpdate = true;
        }

        if (needsUpdate) {
          setProfileData((prev) =>
            prev ? { ...prev, hostDetails: updatedHostDetails } : prev
          );
        }
      }
    }

    // Update visitorHistory if it has incomplete host information
    if (visitorHistory && visitorHistory.length > 0) {
      let historyNeedsUpdate = false;
      const updatedHistory = visitorHistory.map((visit) => {
        if (visit.hostDetails) {
          const hostDetails = visit.hostDetails;
          const employee = employeesData.find(
            (emp) => emp.userId === parseInt(hostDetails.userId)
          );

          if (employee) {
            let visitNeedsUpdate = false;
            const updatedHostDetails = { ...hostDetails };

            if (!hostDetails.profileImageUrl && employee.profileImageUrl) {
              updatedHostDetails.profileImageUrl = employee.profileImageUrl;
              visitNeedsUpdate = true;
            }

            if (employee.name && employee.name !== hostDetails.name) {
              updatedHostDetails.name = employee.name;
              visitNeedsUpdate = true;
            }

            if (visitNeedsUpdate) {
              historyNeedsUpdate = true;
              return { ...visit, hostDetails: updatedHostDetails };
            }
          }
        }
        return visit;
      });

      if (historyNeedsUpdate) {
        setVisitorHistory(updatedHistory);
      }
    }
  }, [employeesData, profileData, visitorHistory]);

  // Fallback: Try to get data from context if available
  const [fallbackData, setFallbackData] = useState<VisitorFormData | null>(
    null
  );

  React.useEffect(() => {
    if (source === "add" && !visitorPreviewData) {
      // Use context data if available, otherwise keep fallback as null
      setFallbackData(null);
    }
  }, [source, visitorPreviewData]);

  // Use fallback data if context data is not available
  const effectivePreviewData = visitorPreviewData || fallbackData;

  // Resolve image URLs when data changes
  useEffect(() => {
    const resolveImageUrls = async () => {
      const urls: Record<string, string> = {};

      // Resolve visitor image URLs
      if (effectivePreviewData?.imgUrl) {
        const resolvedUrl = await getImageUrl(
          effectivePreviewData.imgUrl,
          "visitor"
        );
        if (resolvedUrl && resolvedUrl !== effectivePreviewData.imgUrl) {
          // Only add if the resolved URL is different from the original (safety check)
          urls[effectivePreviewData.imgUrl] = resolvedUrl;
        } else if (resolvedUrl === effectivePreviewData.imgUrl) {
          console.warn(
            "Resolved URL is same as original, skipping:",
            resolvedUrl
          );
        }
      }

      if (profileData?.imgUrl) {
        const resolvedUrl = await getImageUrl(profileData.imgUrl, "visitor");
        if (resolvedUrl && resolvedUrl !== profileData.imgUrl) {
          // Only add if the resolved URL is different from the original (safety check)
          urls[profileData.imgUrl] = resolvedUrl;
        } else if (resolvedUrl === profileData.imgUrl) {
          console.warn(
            "Resolved profile URL is same as original, skipping:",
            resolvedUrl
          );
        }
      }

      // Resolve host profile image URL if it exists
      if (effectivePreviewData?.hostDetails?.profileImageUrl) {
        const resolvedUrl = await getImageUrl(
          effectivePreviewData.hostDetails.profileImageUrl,
          "visitor"
        );
        if (
          resolvedUrl &&
          resolvedUrl !== effectivePreviewData.hostDetails.profileImageUrl
        ) {
          urls[effectivePreviewData.hostDetails.profileImageUrl] = resolvedUrl;
        }
      }

      // Resolve host profile image URL from profileData if it exists
      if (profileData?.hostDetails?.profileImageUrl) {
        const resolvedUrl = await getImageUrl(
          profileData.hostDetails.profileImageUrl,
          "visitor"
        );
        if (
          resolvedUrl &&
          resolvedUrl !== profileData.hostDetails.profileImageUrl
        ) {
          urls[profileData.hostDetails.profileImageUrl] = resolvedUrl;
        }
      }

      // Resolve guest image URLs
      if (effectivePreviewData?.guest) {
        for (const guest of effectivePreviewData.guest) {
          if (guest.imgUrl) {
            const resolvedUrl = await getImageUrl(guest.imgUrl, "guest");
            if (resolvedUrl && resolvedUrl !== guest.imgUrl) {
              // Only add if the resolved URL is different from the original (safety check)
              urls[guest.imgUrl] = resolvedUrl;
            } else if (resolvedUrl === guest.imgUrl) {
              console.warn(
                "Resolved guest URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      // Resolve asset image URLs
      if (effectivePreviewData?.assets) {
        for (const asset of effectivePreviewData.assets) {
          if (asset.imgUrl) {
            const resolvedUrl = await getImageUrl(asset.imgUrl, "asset");
            if (resolvedUrl && resolvedUrl !== asset.imgUrl) {
              // Only add if the resolved URL is different from the original (safety check)
              urls[asset.imgUrl] = resolvedUrl;
            } else if (resolvedUrl === asset.imgUrl) {
              console.warn(
                "Resolved asset URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      // Resolve guest image URLs from profileData if it exists
      if (profileData?.guest) {
        for (const guest of profileData.guest) {
          if (guest.imgUrl) {
            const resolvedUrl = await getImageUrl(guest.imgUrl, "guest");
            if (resolvedUrl && resolvedUrl !== guest.imgUrl) {
              urls[guest.imgUrl] = resolvedUrl;
            } else if (resolvedUrl === guest.imgUrl) {
              console.warn(
                "Resolved profileData guest URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      // Resolve asset image URLs from profileData if it exists
      if (profileData?.assets) {
        for (const asset of profileData.assets) {
          if (asset.imgUrl) {
            const resolvedUrl = await getImageUrl(asset.imgUrl, "asset");
            if (resolvedUrl && resolvedUrl !== asset.imgUrl) {
              urls[asset.imgUrl] = resolvedUrl;
            } else if (resolvedUrl === asset.imgUrl) {
              console.warn(
                "Resolved profileData asset URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      // Resolve host profile images from visitorHistory if it exists
      if (visitorHistory && visitorHistory.length > 0) {
        for (const visit of visitorHistory) {
          if (visit.hostDetails?.profileImageUrl) {
            const resolvedUrl = await getImageUrl(
              visit.hostDetails.profileImageUrl,
              "visitor"
            );
            if (
              resolvedUrl &&
              resolvedUrl !== visit.hostDetails.profileImageUrl
            ) {
              urls[visit.hostDetails.profileImageUrl] = resolvedUrl;
            } else if (resolvedUrl === visit.hostDetails.profileImageUrl) {
              console.warn(
                "Resolved visitorHistory host URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [effectivePreviewData, profileData, visitorHistory]);

  // If no preview data and source is "add", show a message
  if (source === "add" && !effectivePreviewData && !profileData) {
    return (
      <Box p={8} textAlign="center">
        <Text color="red.500" fontWeight="bold">
          No visitor preview data found. Please start from the Add Visitor flow.
        </Text>
      </Box>
    );
  }

  const handleSendForApproval = async () => {
    if (!effectivePreviewData || !token) {
      setError("No visitor data or token found");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare visitor data with status based on approval requirement
      const visitorData = {
        ...effectivePreviewData,
        status: isApprovalRequired ? "PENDING" : "APPROVED",
      };

      // TypeScript knows effectivePreviewData is not null here due to the check above
      const response = await createVisitor(
        visitorData as VisitorFormData,
        token
      );
      const visitors = response?.visitor;
      // Clear the stored data after successful creation
      // localStorage.removeItem("visitorPreviewData"); // Removed
      if (visitors) {
        // Set flag to reset form when user goes back to add page
        sessionStorage.setItem("shouldResetForm", "true");
        // Navigate to the next page
        const id = visitors?.id;
        router.push(`/visitor-checkInOrCheckOut-preview?id=${id}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send for approval");
      }
      console.error("Error creating visitor:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExistingSendForApproval = async (visitorData: Visitor | null) => {
    if (!visitorHistory || !token) {
      setError("No visitor data or token found");
      return;
    }
    setLoading(true);
    setError(null);
    if (!visitorData || !visitorData.id) {
      setError("Visitor ID not available");
      return;
    }

    try {
      const now = new Date();

      // Format date as 'YYYY-MM-DD'
      const date = now.toISOString().split("T")[0];

      // Format time as 'HH:MM:SS'
      const time = now.toTimeString().split(" ")[0];

      // Create a new visitor entry instead of updating the existing one
      // This preserves the previous visit history

      // Get proper host details from current user's profile data (from ProfileResponse)
      const hostDetails = userProfileData
        ? {
            userId: userData?.userId || 0,
            email: userData?.email || "",
            name: userProfileData.profile?.name || "",
            phoneNumber: userProfileData.profile?.phoneNumber || "",
            profileImageUrl: userProfileData.profile?.profileImageUrl || null,
          }
        : {
            userId: userData?.userId || 0,
            email: userData?.email || "",
            name: "",
            phoneNumber: "",
            profileImageUrl: null,
          };

      const newVisitorData: VisitorFormData = {
        fullName: visitorData.fullName || "Unknown Visitor",
        phoneNumber: visitorData.phoneNumber || "",
        gender: visitorData.gender || "Male",
        idType: visitorData.idType || "Aadhar Card",
        idNumber: visitorData.idNumber || "",
        date: date,
        time: time,
        comingFrom: "company", // Use proper default value
        companyName: visitorData.companyName || "",
        location: visitorData.location || null,
        purposeOfVisit: visitorData.purposeOfVisit || "Meeting",
        imgUrl: visitorData.imgUrl,
        status: isApprovalRequired ? "PENDING" : "APPROVED",
        hostDetails: hostDetails,
        assets: visitorData.assets || [],
        guest: visitorData.guest || [],
        isApprovalReq: isApprovalRequired,
      };

      // Debug logging to see what we're sending
      console.log("Debug - visitorData:", visitorData);
      console.log("Debug - userData:", userData);
      console.log("Debug - userProfileData:", userProfileData);
      console.log("Debug - hostDetails:", hostDetails);
      console.log("Reinvite payload:", newVisitorData);

      // Create new visitor entry instead of updating existing one
      const response = await createVisitor(newVisitorData, token);
      const visitors = response?.visitor;
      if (visitors) {
        // Navigate to the next page
        const id = visitors?.id;
        router.push(`/visitor-checkInOrCheckOut-preview?id=${id}`);
      }
    } catch (err: unknown) {
      console.error("Error creating visitor:", err);
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
        });
        setError(`Failed to reinvite visitor: ${err.message}`);
      } else {
        setError("Failed to send for approval");
      }
    } finally {
      setLoading(false);
    }
  };

  if (source === "add") {
    // Render the screenshot-matching UI for Add New Visitor flow
    return (
      <Box
        h="100vh"
        w="full"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {/* Desktop Header - Hidden on Mobile */}
        <DesktopHeader notificationCount={3} />

        {/* Desktop Profile Content - Hidden on Mobile */}
        <Box
          display={{ base: "none", md: "flex" }}
          h="calc(100vh - 60px)"
          bg="#F0E6FF"
          position="relative"
          overflow="hidden"
          flexDirection="column"
        >
          {/* Decorative Background Logo */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={0}
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>

          {/* Main Content */}
          <Box
            position="relative"
            zIndex={2}
            p={6}
            h="full"
            display="flex"
            flexDirection="column"
            css={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {/* Profile Header */}
            <Flex
              justifyContent="space-between"
              alignItems="center"
              mb={4}
              flexShrink={0}
            >
              <Flex align="center" gap={3} mb="20px">
                <IconButton
                  aria-label="Back"
                  tabIndex={0}
                  variant="ghost"
                  fontSize="lg"
                  bg="#FFF"
                  onClick={() => safeBack()}
                  color="#8A37F7"
                  _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
                >
                  <FiChevronLeft />
                </IconButton>
                <Heading fontSize="lg" color="#18181b" fontWeight="bold">
                  Visitor Check-In Preview
                </Heading>
              </Flex>
            </Flex>

            {/* Web Content - Employee Info on Top, Visitor Info on Bottom */}
            <Flex
              direction="column"
              gap={6}
              flex="1"
              overflow="auto"
              pb={4}
              css={{
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              {/* Employee Info Card - Horizontal Layout with Separators */}
              {effectivePreviewData && (
                <Box
                  bg="white"
                  borderRadius="10px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  p={6}
                  w="100%"
                >
                  {/* Horizontal Layout with Vertical Separators */}
                  <Flex alignItems="center" w="full">
                    {/* Profile Picture and Full Name Section */}
                    <Flex alignItems="center" gap={4} flex="1" pr={6}>
                      <Box
                        w="60px"
                        h="60px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        {(() => {
                          // Check both effectivePreviewData and profileData for host details
                          const hostDetails =
                            effectivePreviewData?.hostDetails ||
                            profileData?.hostDetails;
                          const profileImageUrl = hostDetails?.profileImageUrl;
                          const resolvedUrl = profileImageUrl
                            ? resolvedImageUrls[profileImageUrl]
                            : null;
                          const hasImage =
                            resolvedUrl && isValidImageUrl(resolvedUrl);

                          // Debug logging
                          console.log("Host details check:", {
                            effectivePreviewData:
                              effectivePreviewData?.hostDetails,
                            profileData: profileData?.hostDetails,
                            hostDetails,
                            profileImageUrl,
                            resolvedUrl,
                            hasImage,
                          });

                          return hasImage;
                        })() ? (
                          <Image
                            src={
                              resolvedImageUrls[
                                (
                                  effectivePreviewData?.hostDetails ||
                                  profileData?.hostDetails
                                )?.profileImageUrl || ""
                              ]
                            }
                            alt={
                              (
                                effectivePreviewData?.hostDetails ||
                                profileData?.hostDetails
                              )?.name || "Employee"
                            }
                            width={60}
                            height={60}
                            style={{ objectFit: "cover" }}
                            onError={(e) => {
                              console.error("Host image failed to load:", e);
                              // Force re-render to show avatar fallback
                              // Note: We can't easily update hostDetails here, so we'll rely on the validation
                            }}
                          />
                        ) : (
                          <Box
                            w="60px"
                            h="60px"
                            borderRadius="full"
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="purple.700"
                            fontSize="lg"
                            fontWeight="bold"
                          >
                            {(
                              effectivePreviewData?.hostDetails ||
                              profileData?.hostDetails
                            )?.name
                              ? (
                                  effectivePreviewData?.hostDetails ||
                                  profileData?.hostDetails
                                )?.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "E"}
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="gray.600"
                          mb={1}
                          fontFamily="Roboto"
                        >
                          Full Name :
                        </Text>
                        <Text
                          fontSize="18px"
                          fontWeight="600"
                          color="gray.800"
                          fontFamily="Roboto"
                        >
                          {(
                            effectivePreviewData?.hostDetails ||
                            profileData?.hostDetails
                          )?.name || "-"}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Vertical Separator - Only show if phone number exists */}
                    {(
                      effectivePreviewData?.hostDetails ||
                      profileData?.hostDetails
                    )?.phoneNumber &&
                      (
                        effectivePreviewData?.hostDetails ||
                        profileData?.hostDetails
                      )?.phoneNumber.trim() !== "" && (
                        <Box w="1px" h="60px" bg="gray.300" mx={4} />
                      )}

                    {/* Phone Number Section - Only show if phone number exists */}
                    {(
                      effectivePreviewData?.hostDetails ||
                      profileData?.hostDetails
                    )?.phoneNumber &&
                      (
                        effectivePreviewData?.hostDetails ||
                        profileData?.hostDetails
                      )?.phoneNumber.trim() !== "" && (
                        <Box flex="1" px={4}>
                          <Text
                            fontSize="14px"
                            fontWeight="500"
                            color="gray.600"
                            mb={1}
                            fontFamily="Roboto"
                          >
                            Phone No :
                          </Text>
                          <Text
                            fontSize="16px"
                            fontWeight="500"
                            color="gray.800"
                            fontFamily="Roboto"
                          >
                            {
                              (
                                effectivePreviewData?.hostDetails ||
                                profileData?.hostDetails
                              )?.phoneNumber
                            }
                          </Text>
                        </Box>
                      )}

                    {/* Vertical Separator */}
                    <Box w="1px" h="60px" bg="gray.300" mx={4} />

                    {/* Total Visits Section */}
                    <Box flex="1" px={4}>
                      <Text
                        fontSize="14px"
                        fontWeight="500"
                        color="gray.600"
                        mb={1}
                        fontFamily="Roboto"
                      >
                        Total Visits :
                      </Text>
                      <Text
                        fontSize="16px"
                        fontWeight="500"
                        color="gray.800"
                        fontFamily="Roboto"
                      >
                        {visitorHistory?.length
                          ? visitorHistory.length.toString().padStart(2, "0")
                          : "00"}
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* Visitor Info Card - Matching visitor-history-preview design */}
              {effectivePreviewData && (
                <Box
                  bg="white"
                  borderRadius="10px"
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  p={6}
                  w="60%"
                  mx="auto"
                >
                  {/* Visitor Information - Top Row */}
                  <Flex alignItems="flex-start" mb={3}>
                    {/* Left Side - Profile Picture and Name */}
                    <Flex alignItems="center" gap={4} flex="1">
                      <Box
                        w="60px"
                        h="60px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="gray.100"
                      >
                        {(() => {
                          const imgUrl = effectivePreviewData?.imgUrl;
                          const resolvedUrl = resolvedImageUrls[imgUrl || ""];
                          const isValid = isValidImageUrl(resolvedUrl);
                          return imgUrl && resolvedUrl && isValid;
                        })() ? (
                          <Image
                            src={
                              resolvedImageUrls[
                                effectivePreviewData?.imgUrl || ""
                              ]
                            }
                            alt={effectivePreviewData.fullName || "Visitor"}
                            width={60}
                            height={60}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                            onError={(e) => {
                              console.error("Image failed to load:", e);
                              console.error(
                                "Image src:",
                                resolvedImageUrls[
                                  effectivePreviewData?.imgUrl || ""
                                ]
                              );
                              // Force re-render to show avatar fallback
                              setResolvedImageUrls((prev) => ({
                                ...prev,
                                [effectivePreviewData?.imgUrl || ""]: "",
                              }));
                            }}
                          />
                        ) : (
                          <Box
                            w="60px"
                            h="60px"
                            borderRadius="full"
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="purple.700"
                            fontSize="lg"
                            fontWeight="bold"
                          >
                            {getAvatarInitials(effectivePreviewData?.fullName)}
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Text
                          fontSize="18px"
                          fontWeight="600"
                          color="gray.800"
                          mb={1}
                          fontFamily="Roboto"
                        >
                          {effectivePreviewData?.fullName || "-"}
                        </Text>
                        {/* <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="gray.600"
                          fontFamily="Roboto"
                        >
                          #{effectivePreviewData?.idNumber || "-"}
                        </Text> */}
                      </Box>
                    </Flex>

                    {/* Right Side - Purpose of Visit */}
                    <Box flex="1">
                      <Text
                        fontSize="14px"
                        fontWeight="500"
                        color="gray.600"
                        mb={1}
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        Purpose of Visit :
                      </Text>
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.800"
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        {effectivePreviewData?.purposeOfVisit || "-"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Second Row - Company Name and Location */}
                  <Flex alignItems="flex-start" mb={3}>
                    {/* Company Name */}
                    <Box flex="1" mr={4}>
                      <Text
                        fontSize="14px"
                        fontWeight="500"
                        color="gray.600"
                        mb={1}
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        Company Name :
                      </Text>
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.800"
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        {effectivePreviewData?.companyName || "-"}
                      </Text>
                    </Box>

                    {/* Location */}
                    {effectivePreviewData?.location && (
                      <Box flex="1">
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="gray.600"
                          mb={1}
                          fontFamily="Roboto"
                          textAlign="left"
                        >
                          Location :
                        </Text>
                        <Text
                          fontSize="16px"
                          fontWeight="600"
                          color="gray.800"
                          fontFamily="Roboto"
                          textAlign="left"
                        >
                          {effectivePreviewData.location}
                        </Text>
                      </Box>
                    )}
                  </Flex>

                  {/* Third Row - Gender and ID Type */}
                  <Flex alignItems="flex-start" mb={3}>
                    {/* Gender Section */}
                    <Box flex="1" mr={4}>
                      <Text
                        fontSize="14px"
                        fontWeight="500"
                        color="gray.600"
                        mb={1}
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        Gender :
                      </Text>
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.800"
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        {effectivePreviewData?.gender || "-"}
                      </Text>
                    </Box>

                    {/* ID Type Section */}
                    <Box flex="1">
                      <Text
                        fontSize="14px"
                        fontWeight="500"
                        color="gray.600"
                        mb={1}
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        ID Type :
                      </Text>
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="#2563EB"
                        textDecoration="underline"
                        fontFamily="Roboto"
                        textAlign="left"
                      >
                        {effectivePreviewData?.idType || "-"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* With Guests Section */}
                  {effectivePreviewData?.guest &&
                    effectivePreviewData.guest.length > 0 && (
                      <Box mb={4}>
                        <Text
                          fontSize="16px"
                          fontWeight="600"
                          color="gray.800"
                          mb={3}
                          fontFamily="Roboto"
                        >
                          With Guests:
                        </Text>
                        <Flex gap={6}>
                          {(showAll
                            ? effectivePreviewData.guest
                            : effectivePreviewData.guest.slice(0, 2)
                          ).map((guest, index) => (
                            <Flex
                              key={index}
                              alignItems="center"
                              gap={3}
                              w="full"
                              minW={0}
                              flexWrap={{ base: "wrap", md: "nowrap" }}
                            >
                              <Text
                                fontSize="14px"
                                color="gray.800"
                                fontWeight="500"
                                flexShrink={0}
                              >
                                {index + 1}.
                              </Text>
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                overflow="hidden"
                                bg="gray.200"
                                flexShrink={0}
                              >
                                {guest.imgUrl &&
                                isValidImageUrl(
                                  resolvedImageUrls[guest.imgUrl]
                                ) ? (
                                  <Image
                                    src={resolvedImageUrls[guest.imgUrl]}
                                    alt={guest.guestName}
                                    width={40}
                                    height={40}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Box
                                    w="40px"
                                    h="40px"
                                    borderRadius="full"
                                    bg="purple.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    color="purple.700"
                                    fontSize="sm"
                                    fontWeight="bold"
                                  >
                                    {guest.guestName
                                      ? guest.guestName.charAt(0).toUpperCase()
                                      : "G"}
                                  </Box>
                                )}
                              </Box>
                              <Text
                                fontSize="14px"
                                color="gray.800"
                                fontWeight="500"
                                wordBreak="break-word"
                                overflowWrap="anywhere"
                                flex={1}
                                minW={0}
                              >
                                {guest.guestName}
                              </Text>
                            </Flex>
                          ))}
                        </Flex>
                        {/* View More / View Less for Guests */}
                        {effectivePreviewData.guest.length > 2 && (
                          <Text
                            color="#8A38F5"
                            fontWeight="bold"
                            fontSize="sm"
                            textAlign="right"
                            cursor="pointer"
                            tabIndex={0}
                            aria-label={showAll ? "View Less" : "View More"}
                            textDecoration="underline"
                            onClick={() => setShowAll(!showAll)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ")
                                setShowAll(!showAll);
                            }}
                            mt={2}
                          >
                            {showAll ? "View Less" : "View More"}
                          </Text>
                        )}
                      </Box>
                    )}

                  {/* Assets Section - Only show if there are assets */}
                  {effectivePreviewData?.assets &&
                    effectivePreviewData.assets.length > 0 && (
                      <Box>
                        <Flex
                          alignItems="center"
                          justifyContent="space-between"
                          mb={3}
                        >
                          <Text
                            fontSize="16px"
                            fontWeight="600"
                            color="gray.800"
                            fontFamily="Roboto"
                          >
                            Assets Recorded :
                          </Text>
                          <Text
                            fontSize="16px"
                            fontWeight="600"
                            color="gray.800"
                            fontFamily="Roboto"
                          >
                            Total Assets:{" "}
                            {effectivePreviewData.assets.length
                              .toString()
                              .padStart(2, "0")}
                          </Text>
                        </Flex>

                        {/* All Assets Side by Side */}
                        <Flex gap={6} wrap="wrap" w="full">
                          {/* Personal Assets */}
                          {effectivePreviewData.assets.filter(
                            (asset) => asset.assetType === "Personal"
                          ).length > 0 && (
                            <Box>
                              <Flex gap={3} flexWrap="wrap" w="full">
                                {effectivePreviewData.assets
                                  .filter(
                                    (asset) => asset.assetType === "Personal"
                                  )
                                  .map((asset, index) => (
                                    <Flex
                                      key={index}
                                      align="center"
                                      gap={2}
                                      bg="gray.50"
                                      p={2}
                                      borderRadius="md"
                                      border="1px solid #e2e8f0"
                                      minW="fit-content"
                                    >
                                      <Box
                                        w="28px"
                                        h="20px"
                                        borderRadius="sm"
                                        border="1px solid #8A38F5"
                                        overflow="hidden"
                                        bg="white"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        flexShrink={0}
                                      >
                                        {asset.imgUrl &&
                                        isValidImageUrl(
                                          resolvedImageUrls[asset.imgUrl]
                                        ) ? (
                                          <Image
                                            src={
                                              resolvedImageUrls[asset.imgUrl]
                                            }
                                            alt={asset.assetName}
                                            width={28}
                                            height={20}
                                            style={{
                                              objectFit: "cover",
                                              width: "100%",
                                              height: "100%",
                                            }}
                                          />
                                        ) : (
                                          <Text
                                            color="purple.700"
                                            fontSize="2xs"
                                            fontWeight="bold"
                                          >
                                            {asset.assetName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </Text>
                                        )}
                                      </Box>
                                      <Flex
                                        direction="column"
                                        gap={0.5}
                                        minW={0}
                                      >
                                        <Text
                                          fontSize="2xs"
                                          color="gray.800"
                                          fontWeight="600"
                                          whiteSpace="nowrap"
                                        >
                                          Personal: {asset.assetName}
                                        </Text>
                                        <Text
                                          fontSize="3xs"
                                          color="gray.600"
                                          fontWeight="500"
                                        >
                                          #{asset.serialNumber}
                                        </Text>
                                      </Flex>
                                    </Flex>
                                  ))}
                              </Flex>
                            </Box>
                          )}

                          {/* Company Assets - Only show if there are company assets */}
                          {effectivePreviewData.assets.filter(
                            (asset) => asset.assetType === "Company"
                          ).length > 0 && (
                            <Box>
                              <Flex gap={3} flexWrap="wrap" w="full">
                                {effectivePreviewData.assets
                                  .filter(
                                    (asset) => asset.assetType === "Company"
                                  )
                                  .map((asset, index) => (
                                    <Flex
                                      key={index}
                                      align="center"
                                      gap={2}
                                      bg="gray.50"
                                      p={2}
                                      borderRadius="md"
                                      border="1px solid #e2e8f0"
                                      minW="fit-content"
                                    >
                                      <Box
                                        w="28px"
                                        h="20px"
                                        borderRadius="sm"
                                        border="1px solid #8A38F5"
                                        overflow="hidden"
                                        bg="white"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        flexShrink={0}
                                      >
                                        {asset.imgUrl &&
                                        isValidImageUrl(
                                          resolvedImageUrls[asset.imgUrl]
                                        ) ? (
                                          <Image
                                            src={
                                              resolvedImageUrls[asset.imgUrl]
                                            }
                                            alt={asset.assetName}
                                            width={28}
                                            height={20}
                                            style={{
                                              objectFit: "cover",
                                              width: "100%",
                                              height: "100%",
                                            }}
                                          />
                                        ) : (
                                          <Text
                                            color="purple.700"
                                            fontSize="2xs"
                                            fontWeight="bold"
                                          >
                                            {asset.assetName
                                              .charAt(0)
                                              .toUpperCase()}
                                          </Text>
                                        )}
                                      </Box>
                                      <Flex
                                        direction="column"
                                        gap={0.5}
                                        minW={0}
                                      >
                                        <Text
                                          fontSize="2xs"
                                          color="gray.800"
                                          fontWeight="600"
                                          whiteSpace="nowrap"
                                        >
                                          Company: {asset.assetName}
                                        </Text>
                                        <Text
                                          fontSize="3xs"
                                          color="gray.600"
                                          fontWeight="500"
                                        >
                                          #{asset.serialNumber}
                                        </Text>
                                      </Flex>
                                    </Flex>
                                  ))}
                              </Flex>
                            </Box>
                          )}
                        </Flex>
                      </Box>
                    )}
                </Box>
              )}
            </Flex>

            {/* Action Buttons - Positioned at bottom */}
            <Flex
              gap={4}
              mt="auto"
              justifyContent="center"
              w="60%"
              mx="auto"
              pt={4}
            >
              <SecondaryButton
                variant="outline"
                size="md"
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="500"
                borderRadius="md"
                borderColor="gray.300"
                color="gray.700"
                flex="1"
                _hover={{
                  bg: "gray.50",
                  borderColor: "gray.400",
                }}
                onClick={() => {
                  // Navigate to edit mode - data will be passed via context
                  const dataToEdit = effectivePreviewData || profileData;
                  if (dataToEdit) {
                    // Set data in context before navigating
                    setVisitorPreviewData(dataToEdit as VisitorFormData);
                    router.push("/visitor/add?edit=true");
                  } else {
                    console.error("No data available for edit");
                  }
                }}
                isDisabled={loading}
              >
                Edit
              </SecondaryButton>
              <PrimaryButton
                bg="#8A38F5"
                color="white"
                size="md"
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="500"
                borderRadius="md"
                flex="1"
                _hover={{
                  bg: "#7A2FE5",
                }}
                onClick={handleSendForApproval}
                isLoading={loading}
                isDisabled={loading || !effectivePreviewData || !token}
              >
                {isApprovalRequired ? "Send for Approval" : "Next"}
              </PrimaryButton>
            </Flex>
          </Box>
        </Box>

        {/* Mobile Layout - Hidden on Desktop */}
        <Flex
          direction="column"
          bg="white"
          align="center"
          w="full"
          display={{ base: "flex", md: "none" }}
          h="100vh"
        >
          <HeaderBar />
          <Flex
            display="flex"
            flexDirection="column"
            alignItems="center"
            w="full"
            flex="1"
            overflow="auto"
            py={4}
          >
            <Box
              position="relative"
              w={{ base: "94%", sm: "340px" }}
              mx="auto"
              mt={{ base: 10, sm: 12 }}
              mb={4}
              bg="#f4f3fd"
              borderBottomRadius="lg"
              borderTopRadius="lg"
              boxShadow="sm"
              px={{ base: 3, sm: 6, md: 8 }}
              pt={10}
              pb={3}
              maxW="370px"
              // display="flex"
              // flexDirection="column"
              // alignItems="center"
              // flex="1"
            >
              {/* Avatar - overlaps top border, centered */}
              <Box
                position="absolute"
                top="-28px"
                left="50%"
                transform="translateX(-50%)"
                w="56px"
                h="56px"
                borderRadius="full"
                overflow="hidden"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg="white"
                boxShadow="md"
              >
                {effectivePreviewData?.imgUrl &&
                resolvedImageUrls[effectivePreviewData.imgUrl] &&
                isValidImageUrl(
                  resolvedImageUrls[effectivePreviewData.imgUrl]
                ) ? (
                  <Image
                    src={resolvedImageUrls[effectivePreviewData.imgUrl]}
                    alt={effectivePreviewData.fullName || "Visitor"}
                    width={56}
                    height={56}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                    onError={(e) => {
                      console.error("Image failed to load:", e);
                      const imgUrl = effectivePreviewData.imgUrl;
                      console.error(
                        "Image src:",
                        imgUrl ? resolvedImageUrls[imgUrl] : "No image URL"
                      );
                      // Force re-render to show avatar fallback
                      if (imgUrl) {
                        setResolvedImageUrls((prev) => ({
                          ...prev,
                          [imgUrl]: "",
                        }));
                      }
                    }}
                  />
                ) : (
                  <Box
                    w="56px"
                    h="56px"
                    borderRadius="full"
                    bg="purple.100"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    color="purple.700"
                    fontSize="lg"
                    fontWeight="bold"
                  >
                    {getAvatarInitials(effectivePreviewData?.fullName)}
                  </Box>
                )}
              </Box>
              {/* Two-column info grid */}
              <Box mt={2} w="full">
                <Box
                  as="dl"
                  display="grid"
                  gridTemplateColumns={{ base: "120px 1fr", sm: "120px 1fr" }}
                  rowGap={3}
                  columnGap={4}
                >
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    Full Name :
                  </Text>
                  <Text
                    as="dd"
                    color="gray.800"
                    fontSize="sm"
                    textAlign="right"
                    truncate
                  >
                    {effectivePreviewData?.fullName || "N/A"}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    Phone No :
                  </Text>
                  <Text
                    as="dd"
                    color="gray.800"
                    fontSize="sm"
                    textAlign="right"
                    truncate
                  >
                    {effectivePreviewData?.phoneNumber || "N/A"}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    Gender :
                  </Text>
                  <Text
                    as="dd"
                    color="gray.800"
                    fontSize="sm"
                    textAlign="right"
                    truncate
                  >
                    {effectivePreviewData?.gender || "N/A"}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    ID Type :
                  </Text>
                  <Text as="dd" fontSize="sm" textAlign="right">
                    <a
                      href="#"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      {effectivePreviewData?.idType || "N/A"}
                    </a>
                  </Text>
                  {/* <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    ID Number :
                  </Text>
                  <Text as="dd" fontSize="sm" textAlign="right">
                    <a
                      href="#"
                      style={{ color: "#2563eb", textDecoration: "underline" }}
                    >
                      {effectivePreviewData?.idNumber || "N/A"}
                    </a>
                  </Text> */}
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    Purpose of Visit :
                  </Text>
                  <Text
                    as="dd"
                    color="gray.800"
                    fontSize="sm"
                    textAlign="right"
                    truncate
                  >
                    {effectivePreviewData?.purposeOfVisit || "N/A"}
                  </Text>
                  <Text
                    as="dt"
                    fontWeight="bold"
                    color="#363636"
                    fontSize="sm"
                    textAlign="left"
                  >
                    Company Name :
                  </Text>
                  <Text
                    as="dd"
                    color="gray.800"
                    fontSize="sm"
                    textAlign="right"
                    truncate
                  >
                    {effectivePreviewData?.companyName || "N/A"}
                  </Text>
                  {effectivePreviewData?.location && (
                    <>
                      <Text
                        as="dt"
                        fontWeight="bold"
                        color="#363636"
                        fontSize="sm"
                        textAlign="left"
                      >
                        Location :
                      </Text>
                      <Text
                        as="dd"
                        color="gray.800"
                        fontSize="sm"
                        textAlign="right"
                        truncate
                      >
                        {effectivePreviewData.location}
                      </Text>
                    </>
                  )}
                </Box>
                {/* <Text fontWeight="bold" fontSize="sm" color="#363636" mb={1} mt={2}>
        Check-In & Check-Out :
      </Text> */}
                {/* <Flex
        align="center"
        bg="white"
        borderRadius="xl"
        px={2}
        py={1}
        mb={2}
        gap={2}
      >
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">
          {effectivePreviewData?.date || "N/A"}:
        </Text>
        <HStack gap={1} align="center">
         
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
              fill="#23A36D"
            />
          </svg>
          <Text fontSize="sm" color="#23A36D" fontWeight="medium">
            {effectivePreviewData?.time || "-"}
          </Text>
        </HStack>
        <HStack gap={1} align="center">
          
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
              fill="#E34935"
            />
          </svg>
          <Text fontSize="sm" color="#E34935" fontWeight="medium">
           -
          </Text>
        </HStack>
      </Flex> */}
              </Box>
              {/* Guests */}
              {effectivePreviewData?.guest &&
                effectivePreviewData.guest.length > 0 && (
                  <Box w="full" mt={4}>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="#363636"
                      mb={1}
                    >
                      With Guests :
                    </Text>
                    {effectivePreviewData.guest.map((guest, index) => (
                      <Flex
                        key={index}
                        gap={3}
                        align="center"
                        mt={1}
                        w="full"
                        minW={0}
                      >
                        <Box
                          w="32px"
                          h="32px"
                          borderRadius="full"
                          overflow="hidden"
                          bg="gray.200"
                          flexShrink={0}
                        >
                          {guest.imgUrl &&
                          isValidImageUrl(resolvedImageUrls[guest.imgUrl]) ? (
                            <Image
                              src={resolvedImageUrls[guest.imgUrl]}
                              alt={guest.guestName}
                              width={32}
                              height={32}
                              style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                              }}
                            />
                          ) : (
                            <Box
                              w="32px"
                              h="32px"
                              borderRadius="full"
                              bg="purple.100"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="purple.700"
                              fontSize="sm"
                              fontWeight="bold"
                            >
                              {guest.guestName
                                ? guest.guestName.charAt(0).toUpperCase()
                                : "G"}
                            </Box>
                          )}
                        </Box>
                        <Text
                          fontSize="sm"
                          color="#363636"
                          fontWeight="bold"
                          wordBreak="break-word"
                          overflowWrap="anywhere"
                          flex={1}
                        >
                          {guest.guestName}
                        </Text>
                      </Flex>
                    ))}
                  </Box>
                )}
              {/* Assets */}
              {effectivePreviewData?.assets &&
                effectivePreviewData.assets.length > 0 && (
                  <Box w="full" mt={4}>
                    <Flex align="center" mb={1}>
                      <Text fontWeight="bold" fontSize="sm" color="#363636">
                        Assets Recorded :
                      </Text>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color="#363636"
                        ml="auto"
                      >
                        {effectivePreviewData.assets.length
                          .toString()
                          .padStart(2, "0")}
                      </Text>
                    </Flex>
                    {Object.entries(
                      effectivePreviewData.assets.reduce((acc, asset) => {
                        const type = asset.assetType || "Unknown";
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(asset);
                        return acc;
                      }, {} as Record<string, typeof effectivePreviewData.assets>)
                    ).map(([assetType, assets]) => (
                      <Box key={assetType}>
                        <Flex gap={2} mb={2} flexWrap="wrap" w="full">
                          {assets.map((asset, index) => (
                            <Flex
                              key={index}
                              align="center"
                              gap={2}
                              bg="gray.50"
                              p={2}
                              borderRadius="md"
                              border="1px solid #e2e8f0"
                              minW={0}
                              w={{ base: "full", md: "fit-content" }}
                              maxW={{ base: "100%", md: "auto" }}
                            >
                              <Box
                                w={{ base: "44px", md: "32px" }}
                                h={{ base: "36px", md: "24px" }}
                                borderRadius={{ base: "md", md: "sm" }}
                                border="1px solid #8A38F5"
                                overflow="hidden"
                                bg="white"
                                flexShrink={0}
                              >
                                {asset.imgUrl &&
                                isValidImageUrl(
                                  resolvedImageUrls[asset.imgUrl]
                                ) ? (
                                  <Image
                                    src={resolvedImageUrls[asset.imgUrl]}
                                    alt={asset.assetName}
                                    width={44}
                                    height={36}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <Box
                                    w={{ base: "44px", md: "32px" }}
                                    h={{ base: "36px", md: "24px" }}
                                    bg="gray.100"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    color="#363636"
                                    fontSize="xs"
                                    fontWeight="bold"
                                  >
                                    {asset.assetName
                                      ? asset.assetName.charAt(0).toUpperCase()
                                      : "A"}
                                  </Box>
                                )}
                              </Box>
                              <Flex
                                direction="column"
                                gap={0.5}
                                minW={0}
                                flex={1}
                                w="full"
                              >
                                <Text
                                  fontSize="xs"
                                  color="#363636"
                                  fontWeight="600"
                                  wordBreak="break-word"
                                  overflowWrap="anywhere"
                                >
                                  {assetType}: {asset.assetName || "Asset"}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color="gray.600"
                                  fontWeight="500"
                                >
                                  #
                                  {asset.serialNumber ||
                                    `${(index + 1)
                                      .toString()
                                      .padStart(3, "0")}`}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                        </Flex>
                      </Box>
                    ))}
                  </Box>
                )}
            </Box>
          </Flex>
          {error && (
            <Text color="red.500" fontSize="sm" textAlign="center" mt={2}>
              {error}
            </Text>
          )}

          {/* Action Buttons - At the bottom */}
          <Flex
            w="full"
            maxW="370px"
            mx="auto"
            px={{ base: 2, sm: 4, md: 0 }}
            py={4}
            gap={3}
            direction="row"
            bg="#f8fafc"
            position="sticky"
            bottom={0}
            zIndex={10}
          >
            <PrimaryButton
              flex="1"
              minW={0}
              ariaLabel="Edit"
              tabIndex={0}
              onClick={() => {
                // Navigate to edit mode - data will be passed via context
                const dataToEdit = effectivePreviewData || profileData;
                if (dataToEdit) {
                  // Set data in context before navigating
                  setVisitorPreviewData(dataToEdit as VisitorFormData);
                  router.push("/visitor/add?edit=true");
                } else {
                  console.error("No data available for edit");
                }
              }}
              bg="white"
              color="#8A37F7"
              border="2px solid #8A37F7"
              _hover={{ bg: "gray.50" }}
              h={{ base: "40px", sm: "48px" }}
              fontWeight="bold"
              fontSize={{ base: "sm", sm: "md" }}
              px={0}
              isDisabled={loading}
            >
              <Text truncate>Edit</Text>
            </PrimaryButton>
            <PrimaryButton
              flex="1"
              minW={0}
              ariaLabel={isApprovalRequired ? "Send for Approval" : "Next"}
              tabIndex={0}
              colorScheme="purple"
              h={{ base: "40px", sm: "48px" }}
              fontWeight="bold"
              fontSize={{ base: "sm", sm: "md" }}
              px={0}
              onClick={handleSendForApproval}
              isLoading={loading}
              isDisabled={loading || !effectivePreviewData || !token}
            >
              <Text truncate>
                {isApprovalRequired ? "Send for Approval" : "Next"}
              </Text>
            </PrimaryButton>
          </Flex>
        </Flex>
      </Box>
    );
  }

  // Default: existing UI
  return (
    <Box
      h="100vh"
      w="full"
      bg="white"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      css={{
        "&::-webkit-scrollbar": {
          display: "none",
        },
        msOverflowStyle: "none",
        scrollbarWidth: "none",
      }}
    >
      {/* Desktop Header - Hidden on Mobile */}
      <DesktopHeader notificationCount={3} />

      {/* Desktop Profile Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        bg="#F0E6FF"
        h="calc(100vh - 70px)"
        position="relative"
        overflow="auto"
        css={{
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {/* Decorative Background Logo */}
        <Box
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={0}
        >
          <Box transform="scale(5)" opacity={0.15}>
            <Logo />
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          position="relative"
          zIndex={2}
          p={8}
          minH="full"
          overflow="visible"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Profile Header */}
          <Flex align="center" gap={3} mb="20px">
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={() => safeBack()}
              color="#8A37F7"
              _hover={{ bg: "rgba(138, 55, 247, 0.1)" }}
            >
              <FiChevronLeft />
            </IconButton>
            <Heading fontSize="lg" color="#18181b" fontWeight="bold">
              Visitors Details Preview
            </Heading>
          </Flex>

          {/* Web Visitor Details Card */}
          <Box
            bg="white"
            borderRadius="10px"
            boxShadow="0 4px 12px rgba(0,0,0,0.1)"
            mb={8}
            w="60%"
            p={8}
            mx="auto"
          >
            {/* Visitor Information - Top Row */}
            <Flex alignItems="flex-start" mb={4}>
              {/* Left Side - Profile Picture and Name */}
              <Flex alignItems="center" gap={4} flex="1">
                <Box
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  overflow="hidden"
                  bg="gray.100"
                >
                  {profileData?.imgUrl &&
                  isValidImageUrl(resolvedImageUrls[profileData.imgUrl]) ? (
                    <Image
                      src={resolvedImageUrls[profileData.imgUrl]}
                      alt={profileData.fullName || "Visitor"}
                      width={60}
                      height={60}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Box
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      bg="purple.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="purple.700"
                      fontSize="lg"
                      fontWeight="bold"
                    >
                      {getAvatarInitials(profileData?.fullName)}
                    </Box>
                  )}
                </Box>
                <Box>
                  <Text
                    fontSize="18px"
                    fontWeight="600"
                    color="gray.800"
                    mb={1}
                    fontFamily="Roboto"
                  >
                    {profileData?.fullName || "-"}
                  </Text>
                  {/* <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="gray.600"
                    fontFamily="Roboto"
                  >
                    #{profileData?.idNumber || "-"}
                  </Text> */}
                </Box>
              </Flex>

              {/* Right Side - Purpose of Visit */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  Purpose of Visit :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  {profileData?.purposeOfVisit || "-"}
                </Text>
              </Box>
            </Flex>

            {/* Second Row - Company Name, Location and Check-In/Out */}
            <Flex alignItems="flex-start" mb={6}>
              {/* Left Side - Company Name */}
              <Box flex="1" mr={4}>
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  Company Name :
                </Text>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  {profileData?.companyName || "-"}
                </Text>
              </Box>

              {/* Middle - Location */}
              {profileData?.location && (
                <Box flex="1" mr={4}>
                  <Text
                    fontSize="14px"
                    fontWeight="500"
                    color="gray.600"
                    mb={1}
                    fontFamily="Roboto"
                    textAlign="left"
                  >
                    Location :
                  </Text>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                    textAlign="left"
                  >
                    {profileData.location}
                  </Text>
                </Box>
              )}

              {/* Right Side - Check-In & Check-Out */}
              <Box flex="1">
                <Text
                  fontSize="14px"
                  fontWeight="500"
                  color="gray.600"
                  mb={1}
                  fontFamily="Roboto"
                  textAlign="left"
                >
                  Check-In & Check-Out :
                </Text>
                <Flex alignItems="center" gap={2}>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    {profileData?.date
                      ? new Date(profileData.date).toLocaleDateString("en-GB")
                      : "-"}
                    :
                  </Text>
                  <Flex alignItems="center" gap={1}>
                    {/* Check-in icon */}
                    <svg
                      width="14"
                      height="12"
                      viewBox="0 0 14 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
                        fill="#23A36D"
                      />
                    </svg>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                    >
                      {profileData?.checkInTime
                        ? new Date(profileData.checkInTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit", hour12: true }
                          )
                        : "-"}
                    </Text>
                  </Flex>
                  <Flex alignItems="center" gap={1}>
                    {/* Check-out icon */}
                    <svg
                      width="14"
                      height="12"
                      viewBox="0 0 14 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
                        fill="#E34935"
                      />
                    </svg>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                    >
                      {profileData?.checkOutTime
                        ? new Date(profileData.checkOutTime).toLocaleTimeString(
                            "en-US",
                            { hour: "2-digit", minute: "2-digit", hour12: true }
                          )
                        : "-"}
                    </Text>
                  </Flex>
                </Flex>
              </Box>
            </Flex>

            {/* With Guests Section */}
            {profileData?.guest && profileData.guest.length > 0 && (
              <Box mb={6}>
                <Text
                  fontSize="16px"
                  fontWeight="600"
                  color="gray.800"
                  mb={4}
                  fontFamily="Roboto"
                >
                  With Guests:
                </Text>
                <Flex gap={6}>
                  {profileData.guest.slice(0, 2).map((guest, index) => (
                    <Flex key={index} alignItems="center" gap={3}>
                      <Text fontSize="14px" color="gray.800" fontWeight="500">
                        {index + 1}.
                      </Text>
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="full"
                        overflow="hidden"
                        bg="gray.200"
                      >
                        {guest.imgUrl &&
                        isValidImageUrl(resolvedImageUrls[guest.imgUrl]) ? (
                          <Image
                            src={resolvedImageUrls[guest.imgUrl]}
                            alt={guest.guestName}
                            width={40}
                            height={40}
                            style={{
                              objectFit: "cover",
                              width: "100%",
                              height: "100%",
                            }}
                          />
                        ) : (
                          <Box
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color="purple.700"
                            fontSize="sm"
                            fontWeight="bold"
                          >
                            {guest.guestName
                              ? guest.guestName.charAt(0).toUpperCase()
                              : "G"}
                          </Box>
                        )}
                      </Box>
                      <Text fontSize="14px" color="gray.800" fontWeight="500">
                        {guest.guestName}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Box>
            )}

            {/* Assets Section - Only show if there are assets */}
            {profileData?.assets && profileData.assets.length > 0 && (
              <Box>
                <Flex alignItems="center" justifyContent="space-between" mb={4}>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    Assets Recorded :
                  </Text>
                  <Text
                    fontSize="16px"
                    fontWeight="600"
                    color="gray.800"
                    fontFamily="Roboto"
                  >
                    Total Assets:{" "}
                    {profileData.assets.length.toString().padStart(2, "0")}
                  </Text>
                </Flex>

                {/* All Assets Side by Side */}
                <Flex gap={6} wrap="wrap" w="full">
                  {/* Personal Assets */}
                  {profileData.assets.filter(
                    (asset) => asset.assetType === "Personal"
                  ).length > 0 && (
                    <Box>
                      <Flex gap={3} flexWrap="wrap" w="full">
                        {profileData.assets
                          .filter((asset) => asset.assetType === "Personal")
                          .map((asset, index) => (
                            <Flex
                              key={index}
                              align="center"
                              gap={3}
                              bg="gray.50"
                              p={3}
                              borderRadius="md"
                              border="1px solid #e2e8f0"
                              minW="fit-content"
                            >
                              <Box
                                w="40px"
                                h="32px"
                                borderRadius="sm"
                                border="1px solid #8A38F5"
                                overflow="hidden"
                                bg="white"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                {asset.imgUrl &&
                                resolvedImageUrls[asset.imgUrl] ? (
                                  <Image
                                    src={resolvedImageUrls[asset.imgUrl]}
                                    alt={asset.assetName}
                                    width={40}
                                    height={32}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text
                                    color="purple.700"
                                    fontSize="sm"
                                    fontWeight="bold"
                                  >
                                    {asset.assetName.charAt(0).toUpperCase()}
                                  </Text>
                                )}
                              </Box>
                              <Flex direction="column" gap={1}>
                                <Text
                                  fontSize="sm"
                                  color="gray.800"
                                  fontWeight="600"
                                  whiteSpace="nowrap"
                                >
                                  Personal: {asset.assetName}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color="gray.600"
                                  fontWeight="500"
                                >
                                  #{asset.serialNumber}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                      </Flex>
                    </Box>
                  )}

                  {/* Company Assets - Only show if there are company assets */}
                  {profileData.assets.filter(
                    (asset) => asset.assetType === "Company"
                  ).length > 0 && (
                    <Box>
                      <Flex gap={3} flexWrap="wrap" w="full">
                        {profileData.assets
                          .filter((asset) => asset.assetType === "Company")
                          .map((asset, index) => (
                            <Flex
                              key={index}
                              align="center"
                              gap={3}
                              bg="gray.50"
                              p={3}
                              borderRadius="md"
                              border="1px solid #e2e8f0"
                              minW="fit-content"
                            >
                              <Box
                                w="40px"
                                h="32px"
                                borderRadius="sm"
                                border="1px solid #8A38F5"
                                overflow="hidden"
                                bg="white"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                flexShrink={0}
                              >
                                {asset.imgUrl &&
                                resolvedImageUrls[asset.imgUrl] ? (
                                  <Image
                                    src={resolvedImageUrls[asset.imgUrl]}
                                    alt={asset.assetName}
                                    width={40}
                                    height={32}
                                    style={{
                                      objectFit: "cover",
                                      width: "100%",
                                      height: "100%",
                                    }}
                                  />
                                ) : (
                                  <Text
                                    color="purple.700"
                                    fontSize="sm"
                                    fontWeight="bold"
                                  >
                                    {asset.assetName.charAt(0).toUpperCase()}
                                  </Text>
                                )}
                              </Box>
                              <Flex direction="column" gap={1}>
                                <Text
                                  fontSize="sm"
                                  color="gray.800"
                                  fontWeight="600"
                                  whiteSpace="nowrap"
                                >
                                  Company: {asset.assetName}
                                </Text>
                                <Text
                                  fontSize="xs"
                                  color="gray.600"
                                  fontWeight="500"
                                >
                                  #{asset.serialNumber}
                                </Text>
                              </Flex>
                            </Flex>
                          ))}
                      </Flex>
                    </Box>
                  )}
                </Flex>
              </Box>
            )}
          </Box>

          {/* Action Buttons - Outside the card */}
          <Flex gap={4} mt={4} justifyContent="center" w="60%" mx="auto">
            <SecondaryButton
              variant="outline"
              size="md"
              px={6}
              py={3}
              fontSize="sm"
              fontWeight="500"
              borderRadius="md"
              borderColor="gray.300"
              color="gray.700"
              flex="1"
              _hover={{
                bg: "gray.50",
                borderColor: "gray.400",
              }}
              onClick={() => {
                // Navigate to edit mode - data will be passed via context
                const dataToEdit = effectivePreviewData || profileData;
                if (dataToEdit) {
                  // Set data in context before navigating
                  setVisitorPreviewData(dataToEdit as VisitorFormData);
                  router.push("/visitor/add?edit=true");
                } else {
                  console.error("No data available for edit");
                }
              }}
              isDisabled={loading}
            >
              Edit
            </SecondaryButton>
            <PrimaryButton
              bg="#8A38F5"
              color="white"
              size="md"
              px={6}
              py={3}
              fontSize="sm"
              fontWeight="500"
              borderRadius="md"
              flex="1"
              _hover={{
                bg: "#7A2FE5",
              }}
              onClick={() => {
                handleExistingSendForApproval(profileData);
              }}
              isLoading={loading}
              isDisabled={loading || !profileData || !token}
            >
              {isApprovalRequired ? "Send for Approval" : "Reinvite"}
            </PrimaryButton>
          </Flex>
        </Box>
      </Box>

      {/* Mobile Layout - Hidden on Desktop */}
      <Flex
        direction="column"
        h="100vh"
        bg="white"
        display={{ base: "flex", md: "none" }}
        overflow="hidden"
      >
        {/* Top App Bar */}
        <HeaderBar />

        {/* Content Area - Always scrollable when content overflows */}
        <Box
          flex="1"
          overflow="auto"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {/* Add padding below header */}
          <Box mt={6} />
          {/* Profile Card UI */}
          <Box
            position="relative"
            w={{ base: "90%", sm: "340px" }}
            mx="auto"
            mt={0}
            mb={4}
            bg="#f7f7ff"
            borderBottomRadius="lg"
            boxShadow="sm"
            px={6}
            pt={6}
            pb={1}
          >
            {/* Avatar - overlaps top border, centered */}
            <Box
              position="absolute"
              top="-20px"
              left="50%"
              transform="translateX(-50%)"
              w="56px"
              h="56px"
              borderRadius="full"
              overflow="hidden"
              display="flex"
              alignItems="center"
              justifyContent="center"
              bg="white"
              boxShadow="md"
            >
              {profileData?.imgUrl && resolvedImageUrls[profileData.imgUrl] ? (
                <Image
                  src={resolvedImageUrls[profileData.imgUrl]}
                  alt={profileData.fullName || "Visitor"}
                  width={56}
                  height={56}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : (
                <Box
                  w="56px"
                  h="56px"
                  borderRadius="full"
                  bg="purple.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="purple.700"
                  fontSize="lg"
                  fontWeight="bold"
                >
                  {getAvatarInitials(profileData?.fullName)}
                </Box>
              )}
            </Box>
            {/* Two-column info */}
            <Box mt={2}>
              <Box
                as="dl"
                display="grid"
                gridTemplateColumns="120px 1fr"
                rowGap={3}
                columnGap={4}
              >
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Full Name :
                </Text>
                <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                  {profileData?.fullName}
                </Text>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Phone No :
                </Text>
                <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                  {profileData?.phoneNumber}
                </Text>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Gender :
                </Text>
                <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                  {profileData?.gender}
                </Text>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  ID Type :
                </Text>
                <Text as="dd" fontSize="sm" textAlign="right">
                  <a
                    href="#"
                    style={{ color: "#2563eb", textDecoration: "underline" }}
                  >
                    {profileData?.idType}
                  </a>
                </Text>
                {/* <Text
                as="dt"
                fontWeight="bold"
                color="#363636"
                fontSize="sm"
                textAlign="left"
              >
                ID Number :
              </Text>
              <Text as="dd" fontSize="sm" textAlign="right">
                <a
                  href="#"
                  style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                  {profileData?.idNumber}
                </a>
              </Text> */}
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Total Visits :
                </Text>
                <Text as="dd" color="gray.800" fontSize="sm" textAlign="right">
                  {visitorHistory?.length.toString().padStart(2, "0")}
                </Text>
              </Box>
            </Box>
          </Box>
          {/* Main Content */}
          {visitorHistory?.map((visit, index) => (
            <Box
              key={visit.id}
              flex={1}
              w="full"
              maxW="420px"
              mx="auto"
              px={{ base: 4, sm: 6, md: 8 }}
              pt={0}
              pb={index === visitorHistory.length - 1 ? 55 : 4}
            >
              {/* Visit 01 Card - Combined UI */}
              <Box
                bg="#f3f2fd"
                borderRadius="lg"
                boxShadow="sm"
                w="full"
                maxW="380px"
                mx="auto"
                px={{ base: 4, sm: 6, md: 8 }}
                py={3}
                mt={0}
                mb={0}
              >
                {/* Title */}
                <Text fontWeight="bold" fontSize="sm" color="#181a1b" mb={3}>
                  Visit {(index + 1).toString().padStart(2, "0")} :
                </Text>
                {/* View More/View Less toggle for card content */}
                <Visit01CardContent
                  visit={visit}
                  resolvedImageUrls={resolvedImageUrls}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Bottom Action Button */}
        <Box
          position="fixed"
          left={0}
          bottom={0}
          w="full"
          maxW="420px"
          mx="auto"
          px={4}
          pb={3}
          bg="white"
          zIndex={20}
        >
          <PrimaryButton
            flex="1"
            minW={0}
            ariaLabel={isApprovalRequired ? "Send for Approval" : "Reinvite"}
            tabIndex={0}
            colorScheme="purple"
            h={{ base: "40px", sm: "48px" }}
            fontWeight="bold"
            fontSize={{ base: "sm", sm: "md" }}
            px={0}
            isLoading={loading}
            isDisabled={loading}
            size="md"
            onClick={() => {
              handleExistingSendForApproval(profileData);
            }}
          >
            {isApprovalRequired ? "Send for Approval" : "Reinvite"}
          </PrimaryButton>
        </Box>
      </Flex>
    </Box>
  );
};

export default VisitorHistoryPreview;

// Visit01CardContent: toggles all content except the title
const Visit01CardContent: React.FC<{
  visit: Visit;
  resolvedImageUrls: Record<string, string>;
}> = ({ visit, resolvedImageUrls }) => {
  const [showAll, setShowAll] = useState(false);
  // Demo data for guests and assets
  const guests =
    visit.guest?.map((g) => ({
      name: g.guestName,
      imgUrl: g.imgUrl,
      img: "https://randomuser.me/api/portraits/men/44.jpg", // or generate dynamically
    })) || [];

  // Format check-in/check-out
  // const formatDate = (dateString: string) => {
  //   if (!dateString) return "-";
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString("en-GB");
  // };
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
  const formatTime = (timeString: string) => {
    if (!timeString) return "-";
    const time = new Date(timeString);
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const checkInDate = visit?.date ? formatDate(visit.date) : "-";
  const checkInTime = visit?.checkInTime ? formatTime(visit.checkInTime) : "-";
  const checkOutTime = visit?.checkOutTime
    ? formatTime(visit.checkOutTime)
    : "-";
  return (
    <>
      {/* Host Info Row */}
      <Flex align="center" gap={4} mb={2}>
        {/* <Box
          w="48px"
          h="48px"
          borderRadius="full"
          overflow="hidden"
          bg="gray.200"
        >
          <Image
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="Marcus Lubin"
            width={48}
            height={48}
          />
        </Box> */}
        <Box w="48px" h="48px" borderRadius="full" overflow="hidden" bg="white">
          {(() => {
            const profileImageUrl = visit?.hostDetails?.profileImageUrl;

            if (!profileImageUrl) {
              // No image URL, show initial avatar
              return (
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="full"
                  bg="purple.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="purple.700"
                  fontSize="md"
                  fontWeight="bold"
                >
                  {visit?.hostDetails?.name
                    ? visit?.hostDetails?.name.charAt(0).toUpperCase()
                    : "E"}
                </Box>
              );
            }

            // Check if we have a resolved URL
            const resolvedUrl = resolvedImageUrls[profileImageUrl];
            const imageUrl = resolvedUrl || profileImageUrl;

            // Validate the image URL
            if (
              imageUrl &&
              (imageUrl.startsWith("blob:") ||
                imageUrl.startsWith("data:") ||
                imageUrl.startsWith("http"))
            ) {
              return (
                <Image
                  src={imageUrl}
                  alt={visit?.hostDetails?.name || "Employee"}
                  width={48}
                  height={48}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                  onError={(e) => {
                    console.error("Host image failed to load:", e);
                  }}
                />
              );
            }

            // Fallback to initial avatar
            return (
              <Box
                w="48px"
                h="48px"
                borderRadius="full"
                bg="purple.100"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="purple.700"
                fontSize="md"
                fontWeight="bold"
              >
                {visit?.hostDetails?.name
                  ? visit?.hostDetails?.name.charAt(0).toUpperCase()
                  : "E"}
              </Box>
            );
          })()}
        </Box>
        <Box flex={1} minW={0}>
          <Text fontWeight="bold" fontSize="sm" color="#363636">
            {visit.hostDetails.name}
          </Text>
          <HStack gap={2} mt={1}>
            <Box
              bg="#ede9fe"
              color="#363636"
              borderRadius="12px"
              px={2}
              py={0.5}
              fontSize="sm"
              fontWeight="medium"
            >
              {visit.hostDetails.userId}
            </Box>
            <Box
              bg="#ede9fe"
              color="#363636"
              borderRadius="12px"
              px={2}
              py={0.5}
              fontSize="sm"
              fontWeight="medium"
            >
              Host
            </Box>
          </HStack>
        </Box>
      </Flex>
      {/* Purpose & Company */}
      <Flex mt={3}>
        <Text fontWeight="bold" fontSize="sm" color="#363636" minW="120px">
          Purpose of Visit :
        </Text>
        <Text fontSize="sm" color="#363636" flex={1} textAlign="right">
          {visit.purposeOfVisit}
        </Text>
      </Flex>
      <Flex mt={3}>
        <Text fontWeight="bold" fontSize="sm" color="#363636" minW="120px">
          Company Name :
        </Text>
        <Text fontSize="sm" color="#363636" flex={1} textAlign="right">
          {visit.companyName}
        </Text>
      </Flex>
      {visit.location && (
        <Flex mt={3}>
          <Text fontWeight="bold" fontSize="sm" color="#363636" minW="120px">
            Location :
          </Text>
          <Text fontSize="sm" color="#363636" flex={1} textAlign="right">
            {visit.location}
          </Text>
        </Flex>
      )}
      {/* Check-In & Check-Out */}
      <Text fontWeight="bold" fontSize="sm" color="#363636" mt={3}>
        Check-In & Check-Out :
      </Text>
      <Flex
        align="center"
        bg="white"
        borderRadius="xl"
        px={2}
        py={1}
        mb={2}
        gap={2}
      >
        <Text fontWeight="bold" fontSize="sm" color="#181a1b" minW="80px">
          {checkInDate}:
        </Text>
        <HStack gap={1} align="center">
          {/* Check-in icon */}
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6.35 2.66667L5.44 3.6L7.13 5.33333H0.5V6.66667H7.13L5.44 8.4L6.35 9.33333L9.6 6L6.35 2.66667ZM12.2 10.6667H7V12H12.2C12.915 12 13.5 11.4 13.5 10.6667V1.33333C13.5 0.6 12.915 0 12.2 0H7V1.33333H12.2V10.6667Z"
              fill="#23A36D"
            />
          </svg>
          <Text fontSize="sm" fontWeight="medium" color="#181a1b">
            {checkInTime}
          </Text>
        </HStack>
        <HStack gap={1} align="center">
          {/* Check-out icon */}
          <svg
            width="14"
            height="12"
            viewBox="0 0 14 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.65 2.66667L8.56 3.6L6.87 5.33333H13.5V6.66667H6.87L8.56 8.4L7.65 9.33333L4.4 6L7.65 2.66667ZM1.8 10.6667H7V12H1.8C1.085 12 0.5 11.4 0.5 10.6667V1.33333C0.5 0.6 1.085 0 1.8 0H7V1.33333H1.8V10.6667Z"
              fill="#E34935"
            />
          </svg>
          <Text fontSize="sm" fontWeight="medium" color="#181a1b">
            {checkOutTime}
          </Text>
        </HStack>
      </Flex>
      {/* With Guests */}
      <Text fontWeight="bold" fontSize="sm" color="#363636" mt={3}>
        With Guests :
      </Text>
      <VStack align="start" gap={2} mt={2}>
        {guests.map((guest) => (
          <Flex key={guest.name} align="center" gap={2}>
            <Box
              w="32px"
              h="32px"
              borderRadius="full"
              overflow="hidden"
              bg="gray.200"
            >
              {guest.imgUrl &&
              isValidImageUrl(resolvedImageUrls[guest.imgUrl]) ? (
                <Image
                  src={resolvedImageUrls[guest.imgUrl]}
                  alt={guest.name}
                  width={32}
                  height={32}
                  style={{
                    objectFit: "cover",
                    width: "100%",
                    height: "100%",
                  }}
                />
              ) : (
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg="purple.100"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="purple.700"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {guest?.name ? guest?.name.charAt(0).toUpperCase() : "G"}
                </Box>
              )}
            </Box>
            <Text fontSize="sm" color="#363636" fontWeight="bold">
              {guest.name}
            </Text>
          </Flex>
        ))}
      </VStack>
      {/* View More / View Less */}
      {!showAll && (
        <Text
          color="#8A38F5"
          fontWeight="bold"
          fontSize="sm"
          textAlign="right"
          cursor="pointer"
          tabIndex={0}
          aria-label="View More"
          textDecoration="underline"
          onClick={() => setShowAll(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setShowAll(true);
          }}
          mt={2}
        >
          View More
        </Text>
      )}
      {showAll && (
        <>
          {/* Assets Recorded */}
          <AssetsSection
            showAll={showAll}
            visit={visit}
            resolvedImageUrls={resolvedImageUrls}
          />
          <Text
            color="#8A38F5"
            fontWeight="bold"
            fontSize="sm"
            textAlign="right"
            cursor="pointer"
            tabIndex={0}
            aria-label="View Less"
            textDecoration="underline"
            onClick={() => setShowAll(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setShowAll(false);
            }}
            mt={2}
          >
            View Less
          </Text>
        </>
      )}
    </>
  );
};

const AssetsSection = ({
  visit,
  showAll,
  resolvedImageUrls,
}: {
  visit: Visit;
  showAll: boolean;
  resolvedImageUrls: Record<string, string>;
}) => {
  // Demo data
  const personalAssets = visit.assets.filter(
    (asset) => asset.assetType === "Personal"
  );
  const companyAssets = visit.assets.filter(
    (asset) => asset.assetType === "Company"
  );
  const personalToShow = showAll ? personalAssets : personalAssets.slice(0, 2);
  const companyToShow = showAll ? companyAssets : companyAssets.slice(0, 1);
  const totalAssets = visit.assets.length;
  return (
    <Box
      w="full"
      maxW="342px"
      mx="auto"
      // mt={2}
      // pt={2}
      pb={2}
      position="relative"
    >
      <Flex align="center" justify="space-between" mt={2}>
        <Text fontWeight="bold" fontSize="sm" color="#363636" mb={1}>
          Assets Recorded :
        </Text>
        <Text fontWeight="bold" fontSize="sm" color="gray.700">
          {totalAssets.toString().padStart(2, "0")}
        </Text>
      </Flex>
      {/* Personal */}
      {personalToShow?.length > 0 && (
        <>
          <Flex gap={3} mb={2} flexWrap="wrap">
            {personalToShow.map((asset, index) => (
              <Flex
                key={`personal-${asset.serialNumber}-${index}`}
                align="center"
                gap={2}
                bg="gray.50"
                p={2}
                borderRadius="md"
                border="1px solid #e2e8f0"
                minW="fit-content"
              >
                <Box
                  w="32px"
                  h="24px"
                  borderRadius="sm"
                  border="1px solid #8A38F5"
                  overflow="hidden"
                  bg="white"
                  flexShrink={0}
                >
                  {asset.imgUrl &&
                  isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                    <Image
                      src={resolvedImageUrls[asset.imgUrl]}
                      alt={asset.assetName}
                      width={32}
                      height={24}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Box
                      w="32px"
                      h="24px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="purple.700"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {asset?.assetName
                        ? asset?.assetName.charAt(0).toUpperCase()
                        : "P"}
                    </Box>
                  )}
                </Box>
                <Flex direction="column" gap={0.5} minW={0}>
                  <Text
                    fontSize="xs"
                    color="#363636"
                    fontWeight="600"
                    whiteSpace="nowrap"
                  >
                    Personal: {asset.assetName || "Asset"}
                  </Text>
                  <Text fontSize="2xs" color="gray.600" fontWeight="500">
                    #{asset.serialNumber}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </>
      )}
      {companyToShow?.length > 0 && (
        <>
          {/* Company */}
          <Flex gap={3} mb={2} flexWrap="wrap">
            {companyToShow.map((asset, index) => (
              <Flex
                key={`company-${asset.serialNumber}-${index}`}
                align="center"
                gap={2}
                bg="gray.50"
                p={2}
                borderRadius="md"
                border="1px solid #e2e8f0"
                minW="fit-content"
              >
                <Box
                  w="32px"
                  h="24px"
                  borderRadius="sm"
                  border="1px solid #8A38F5"
                  overflow="hidden"
                  bg="white"
                  flexShrink={0}
                >
                  {asset.imgUrl &&
                  isValidImageUrl(resolvedImageUrls[asset.imgUrl]) ? (
                    <Image
                      src={resolvedImageUrls[asset.imgUrl]}
                      alt={asset.assetName}
                      width={32}
                      height={24}
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <Box
                      w="32px"
                      h="24px"
                      bg="gray.100"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="purple.700"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {asset?.assetName
                        ? asset?.assetName.charAt(0).toUpperCase()
                        : "C"}
                    </Box>
                  )}
                </Box>
                <Flex direction="column" gap={0.5} minW={0}>
                  <Text
                    fontSize="xs"
                    color="#363636"
                    fontWeight="600"
                    whiteSpace="nowrap"
                  >
                    Company: {asset.assetName || "Asset"}
                  </Text>
                  <Text fontSize="2xs" color="gray.600" fontWeight="500">
                    #{asset.serialNumber}
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </>
      )}
    </Box>
  );
};
