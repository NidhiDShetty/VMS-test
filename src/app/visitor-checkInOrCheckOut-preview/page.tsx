"use client";
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  Heading,
  IconButton,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { getVisitors, updateVisitor } from "../api/visitor/routes";
import { toaster } from "@/components/ui/toaster";
import { FiChevronLeft } from "react-icons/fi";
import { getVisitorImageBlob } from "../api/visitor-image/routes";
import { getVisitorAssetImageBlob } from "../api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "../api/visitor-guests/routes";
import Logo from "@/components/svgs/logo";
import { useUserData } from "@/lib/hooks/useUserData";
import { EMPLOYEES_API } from "@/lib/server-urls";
// import { useVisitorPreview } from "../visitor/add/VisitorPreviewContext";

// const DEFAULT_VISITOR_DATA = {
//   visitor: {
//     id: "100003",
//     orgId: "3",
//     fullName: "Ramesh",
//     phoneNumber: "9876543212",
//     gender: "Male",
//     idType: "Aadhar",
//     idNumber: "1234-5678-9022",
//     date: "2025-07-28T00:00:00.000Z",
//     time: "1970-01-01T15:00:00.000Z",
//     comingFrom: "company",
//     companyName: "TCS",
//     location: null,
//     purposeOfVisit: "Project discussion",
//     imgUrl: "https://example.com/image.jpg",
//     hostDetails: "{\"userId\":2027,\"email\":\"nisha1234@gmail.com\",\"name\":\"nisha\",\"phoneNumber\":\"8427852680\",\"profileImageUrl\":null}",
//     assets: "[{\"assetName\":\"Laptop\",\"serialNumber\":\"LPT-9876\",\"assetType\":\"Electronics\",\"imgUrl\":\"https://example.com/laptop.jpg\",\"index\":0}]",
//     guest: "[{\"guestName\":\"Amit Kumar\",\"imgUrl\":\"https://example.com/amit.jpg\",\"index\":0}]",
//     createdAt: "2025-07-24T11:22:21.847Z",
//     updatedAt: "2025-07-24T11:22:21.847Z",
//     visitorAddedBy: "2",
//     status: "PENDING",
//     checkInTime: null,
//     checkOutTime: null
//   }
// };
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
  phoneNumber?: string;
};

interface EmployeeData {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}

type Visitor = {
  id: number;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  date?: string;
  time?: string;
  comingFrom: string;
  companyName?: string;
  location?: string;
  purposeOfVisit?: string;
  imgUrl?: string;
  status?: string;
  checkInTime?: string;
  checkOutTime?: string;
  hostDetails?: HostDetails;
  assets?: Asset[];
  guest?: Guest[];
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

const HeaderBar = () => {
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
        left={{ base: 2, md: 4 }}
        top="50%"
        transform="translateY(-50%)"
        as="button"
        tabIndex={0}
        aria-label="Go back"
        display="flex"
        alignItems="center"
        justifyContent="center"
        w={{ base: "24px", md: "28px" }}
        h={{ base: "24px", md: "28px" }}
        borderRadius="full"
        bg="transparent"
        _hover={{ bg: "gray.100" }}
        p={0}
        role="button"
        onClick={() => router.back()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") router.back();
        }}
        cursor="pointer"
      >
        <FiChevronLeft size={20} color="#18181B" />
      </Box>
      <Text
        fontWeight="bold"
        fontSize={{ base: "md", md: "lg" }}
        color="#181a1b"
      >
        Visitor Details
      </Text>
    </Flex>
  );
};

// ProfilePhoto: supports both image and initials fallback
const ProfilePhoto = ({
  name,
  imgUrl,
  resolvedImageUrls,
}: {
  name?: string;
  imgUrl?: string;
  resolvedImageUrls?: Record<string, string>;
}) => {
  const getInitial = (name: string) =>
    name ? name.charAt(0).toUpperCase() : "?";

  return (
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
      color="#8A38F5"
      fontWeight="bold"
      fontSize="xl"
      boxShadow="md"
      zIndex={2}
      border="2px solid #eee"
    >
      {imgUrl && resolvedImageUrls?.[imgUrl] ? (
        <Image
          src={resolvedImageUrls[imgUrl]}
          alt={name || "Profile"}
          width={56}
          height={56}
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        />
      ) : (
        getInitial(name || "?")
      )}
    </Box>
  );
};

const VisitorInfoCard = ({
  showAll,
  onToggleShowAll,
  visitorData,
  resolvedImageUrls,
}: {
  showAll: boolean;
  onToggleShowAll: () => void;
  visitorData: {
    id: number;
    fullName: string;
    phoneNumber: string;
    gender?: string;
    idType?: string;
    idNumber?: string;
    date?: string;
    time?: string;
    comingFrom: string;
    companyName?: string;
    location?: string;
    purposeOfVisit?: string;
    imgUrl?: string;
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
    hostDetails?: HostDetails;
    assets?: Asset[];
    guest?: Guest[];
    createdAt: string;
    updatedAt: string;
  };
  resolvedImageUrls?: Record<string, string>;
}) => {
  // const { visitorPreviewData } = useVisitorPreview();

  // Format check-in/check-out
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

  // Always use the visitor's scheduled date
  const checkInDate = visitorData?.date
    ? formatDate(visitorData.date)
    : // : visitorPreviewData?.date
      // ? formatDate(visitorPreviewData.date)
      "-";
  const checkInTime = visitorData?.checkInTime
    ? formatTime(visitorData.checkInTime)
    : "-";
  const checkOutTime = visitorData?.checkOutTime
    ? formatTime(visitorData.checkOutTime)
    : "-";

  return (
    <Box position="relative" mb={4} mx={2}>
      <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3}>
        Visitor&apos;s Info
      </Text>
      <Box
        position="relative"
        w="full"
        maxW="342px"
        bg="#f7f7ff"
        borderRadius="lg"
        boxShadow="sm"
        px={4}
        pt={6}
        pb={2}
        minH="180px"
        mx="auto"
      >
        <ProfilePhoto
          name={visitorData?.fullName}
          imgUrl={visitorData?.imgUrl}
          resolvedImageUrls={resolvedImageUrls}
        />
        <Box mt={4}>
          <Box
            as="dl"
            display="grid"
            gridTemplateColumns="110px 1fr"
            rowGap={2}
            columnGap={3}
          >
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              Full Name :
            </Text>
            <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
              {visitorData?.fullName || "-"}
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              Phone No :
            </Text>
            <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
              {visitorData?.phoneNumber || "-"}
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              Gender :
            </Text>
            <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
              {visitorData?.gender || "-"}
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              ID Type :
            </Text>
            <Text as="dd" fontSize="xs" textAlign="right">
              <a
                href="#"
                style={{ color: "#2563eb", textDecoration: "underline" }}
              >
                {visitorData?.idType || "N/A"}
              </a>
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              ID Number :
            </Text>
            <Text as="dd" fontSize="xs" textAlign="right">
              <a
                href="#"
                style={{ color: "#2563eb", textDecoration: "underline" }}
              >
                {visitorData?.idNumber || "N/A"}
              </a>
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              Purpose of Visit :
            </Text>
            <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
              {visitorData?.purposeOfVisit || "-"}
            </Text>
          </Box>
          <Box mt={2} mb={1}>
            <Text fontWeight="bold" fontSize="xs" color="#23292e" mb={0.5}>
              Check-In & Check-Out :
            </Text>
            <Flex
              align="center"
              bg="white"
              borderRadius="xl"
              px={2}
              py={1}
              gap={2}
            >
              <Text fontWeight="bold" fontSize="xs" color="#181a1b" minW="70px">
                {checkInDate}:
              </Text>
              <Flex align="center" gap={1}>
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
                <Text fontSize="xs" color="#181a1b" fontWeight="medium">
                  {checkInTime}
                </Text>
              </Flex>
              <Flex align="center" gap={1}>
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
                <Text fontSize="xs" color="#181a1b" fontWeight="medium">
                  {checkOutTime}
                </Text>
              </Flex>
            </Flex>
          </Box>
          <Flex justify="flex-end" mt={0.5}>
            <Text
              color="#8A38F5"
              fontWeight="bold"
              fontSize="xs"
              textAlign="right"
              cursor="pointer"
              tabIndex={0}
              aria-label={showAll ? "View Less" : "View More"}
              textDecoration="underline"
              _hover={{ color: "#6c28d9" }}
              onClick={onToggleShowAll}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onToggleShowAll();
              }}
            >
              {showAll ? "View Less" : "View More"}
            </Text>
          </Flex>
          {showAll && (
            <Box mt={2}>
              {/* Guests */}
              {visitorData?.guest && visitorData.guest.length > 0 && (
                <Box w="full" mt={4}>
                  <Text fontWeight="bold" fontSize="xs" color="#23292e" mb={1}>
                    With Guests :
                  </Text>
                  {visitorData.guest.map((guest, index) => (
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
                        {(guest as { imgUrl?: string }).imgUrl &&
                        resolvedImageUrls &&
                        isValidImageUrl(resolvedImageUrls[(guest as { imgUrl?: string }).imgUrl!]) ? (
                          <Image
                            src={resolvedImageUrls[(guest as { imgUrl?: string }).imgUrl!]}
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
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {guest.guestName
                              ? guest.guestName.charAt(0).toUpperCase()
                              : "G"}
                          </Box>
                        )}
                      </Box>
                      <Text 
                        fontSize="xs" 
                        color="#23292e" 
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
              {visitorData?.assets && visitorData.assets.length > 0 && (
                <Box w="full" mt={4}>
                  <Flex align="center" mb={1}>
                    <Text fontWeight="bold" fontSize="xs" color="#23292e">
                      Assets Recorded :
                    </Text>
                    <Text
                      fontWeight="bold"
                      fontSize="xs"
                      color="#23292e"
                      ml="auto"
                    >
                      {visitorData.assets.length.toString().padStart(2, "0")}
                    </Text>
                  </Flex>
                  {Object.entries(
                    visitorData.assets.reduce((acc, asset) => {
                      const type = asset.assetType || "Unknown";
                      if (!acc[type]) acc[type] = [];
                      acc[type].push(asset);
                      return acc;
                    }, {} as Record<string, typeof visitorData.assets>)
                  ).map(([assetType, assets]) => (
                    <Box key={assetType}>
                      <Flex gap={3} mb={2} flexWrap="wrap">
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
                              w="32px"
                              h="24px"
                              borderRadius="sm"
                              border="1px solid #8A38F5"
                              overflow="hidden"
                              bg="white"
                              flexShrink={0}
                            >
                              {(asset as { imgUrl?: string }).imgUrl &&
                              resolvedImageUrls &&
                              isValidImageUrl(resolvedImageUrls[(asset as { imgUrl?: string }).imgUrl!]) ? (
                                <Image
                                  src={resolvedImageUrls[(asset as { imgUrl?: string }).imgUrl!]}
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
                            <Flex direction="column" gap={0.5} minW={0} flex={1} w="full">
                              <Text
                                fontSize="xs"
                                color="#23292e"
                                fontWeight="600"
                                wordBreak="break-word"
                                overflowWrap="anywhere"
                              >
                                {assetType}: {asset.assetName}
                              </Text>
                              <Text
                                fontSize="2xs"
                                color="#666"
                                fontWeight="500"
                              >
                                #{asset.serialNumber ||
                                  `${(index + 1).toString().padStart(3, "0")}`}
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
          )}
        </Box>
      </Box>
    </Box>
  );
};

// Helper function to check if a resolved image URL is valid for Next.js Image component
const isValidImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  return url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http");
};

const EmployeeInfoCard = ({ 
  visitorData,
  resolvedImageUrls
}: { 
  visitorData: Visitor;
  resolvedImageUrls: Record<string, string>;
}) => {
  // Parse host details if it's a JSON string
  const hostDetails = visitorData?.hostDetails || null;

  return (
    <Box position="relative" mb={1} mx={2}>
      <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3}>
        Employee Info
      </Text>
      <Box
        position="relative"
        w="full"
        maxW="342px"
        bg="#f7f7ff"
        borderRadius="lg"
        boxShadow="sm"
        px={4}
        pt={6}
        pb={2}
        minH="120px"
        mx="auto"
      >
        <ProfilePhoto 
          name={hostDetails?.name} 
          imgUrl={hostDetails?.profileImageUrl}
          resolvedImageUrls={resolvedImageUrls}
        />
        <Box mt={4}>
          <Box
            as="dl"
            display="grid"
            gridTemplateColumns="110px 1fr"
            rowGap={2}
            columnGap={3}
            wordBreak="break-word"
          >
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="xs"
              textAlign="left"
            >
              Host Name :
            </Text>
            <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
              {hostDetails?.name || "N/A"}
            </Text>
            {/* Only show Phone No if phoneNumber exists and is not empty */}
            {hostDetails?.phoneNumber && hostDetails.phoneNumber.trim() !== "" && (
              <>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="xs"
                  textAlign="left"
                >
                  Phone No :
                </Text>
                <Text as="dd" color="gray.800" fontSize="xs" textAlign="right">
                  {hostDetails.phoneNumber}
                </Text>
              </>
            )}
            {(visitorData?.status == "PENDING" ||
              visitorData?.status == "APPROVED" ||
              visitorData?.status == "REJECTED") && (
              <>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="xs"
                  textAlign="left"
                >
                  Status
                </Text>
                <Text as="dd" fontSize="xs" textAlign="right">
                  {(visitorData?.status == "PENDING" ||
                    visitorData?.status == "APPROVED") && (
                    <Box
                      as="span"
                      color="#23A36D"
                      fontWeight="bold"
                      display="inline-block"
                    >
                      {visitorData?.status || "N/A"}
                    </Box>
                  )}
                  {visitorData?.status == "REJECTED" && (
                    <Box
                      as="span"
                      color="#dc2626"
                      fontWeight="bold"
                      display="inline-block"
                    >
                      {visitorData?.status || "N/A"}
                    </Box>
                  )}
                </Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const VisitorCheckInPreview = () => {
  const [showAll, setShowAll] = useState(false);
  const searchParams = useSearchParams();
  const fromScanner = searchParams.get("fromScanner") === "1";
  const fromCheckout = searchParams.get("fromCheckout") === "1";
  const fromCheckOutProcess = searchParams.get("fromCheckOutProcess") === "1";
  const fromCheckInProcess = searchParams.get("fromCheckInProcess") === "1";
  const id = searchParams.get("id");
  const router = useRouter();
  const [visitorData, setVisitor] = useState<Visitor | null>(null);
  // const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>("");
  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);
  
  const { } = useUserData();

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
      if (blobUrl && (blobUrl.startsWith("blob:") || blobUrl.startsWith("data:"))) {
        return blobUrl;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to load ${type} image:`, error);
      return null;
    }
  };

  // Helper function to check if a resolved image URL is valid for Next.js Image component
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http");
  };

  // Helper function to get avatar initials
  const getAvatarInitials = (name: string | undefined): string => {
    if (!name || name.trim() === "") return "E";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

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

  // Populate missing host profile information from employee data
  useEffect(() => {
    if (!visitorData || !employeesData.length) return;

    // Check if host details exist and if profileImageUrl or name is missing/incomplete
    if (visitorData.hostDetails) {
      const hostDetails = visitorData.hostDetails;
      
      // Find the employee matching the host's userId
      const employee = employeesData.find(
        (emp) => emp.userId === parseInt(hostDetails.userId)
      );

      if (employee) {
        let needsUpdate = false;
        const updatedHostDetails = { ...hostDetails };

        // Update profile image URL if it's null and employee has one
        if (!hostDetails.profileImageUrl && employee.profileImageUrl) {
          updatedHostDetails.profileImageUrl = employee.profileImageUrl;
          needsUpdate = true;
        }

        // Update name if employee has a more complete name
        if (employee.name && employee.name !== hostDetails.name) {
          updatedHostDetails.name = employee.name;
          needsUpdate = true;
        }

        // Update phone number if it's missing or empty
        if ((!hostDetails.phoneNumber || hostDetails.phoneNumber.trim() === "") && employee.phoneNumber) {
          updatedHostDetails.phoneNumber = employee.phoneNumber;
          needsUpdate = true;
        }

        // Only update state if changes were made
        if (needsUpdate) {
          setVisitor((prev) =>
            prev ? { ...prev, hostDetails: updatedHostDetails } : prev
          );
        }
      }
    }
  }, [visitorData, employeesData]);

  // Update role name when user data is loaded

  // Resolve image URLs when visitorData changes
  useEffect(() => {
    const resolveImageUrls = async () => {
      const urls: Record<string, string> = {};

      // Resolve visitor image URL
      if (visitorData?.imgUrl) {
        const resolvedUrl = await getImageUrl(visitorData.imgUrl, "visitor");
        if (resolvedUrl && resolvedUrl !== visitorData.imgUrl) {
          // Only add if the resolved URL is different from the original (safety check)
          urls[visitorData.imgUrl] = resolvedUrl;
        } else if (resolvedUrl === visitorData.imgUrl) {
          console.warn(
            "Resolved visitor URL is same as original, skipping:",
            resolvedUrl
          );
        }
      }

      // Resolve host profile image URL
      if (visitorData?.hostDetails?.profileImageUrl) {
        const resolvedUrl = await getImageUrl(
          visitorData.hostDetails.profileImageUrl,
          "visitor"
        );
        if (resolvedUrl && resolvedUrl !== visitorData.hostDetails.profileImageUrl) {
          urls[visitorData.hostDetails.profileImageUrl] = resolvedUrl;
        }
      }

      // Resolve guest image URLs
      if (visitorData?.guest) {
        for (const guest of visitorData.guest) {
          if ((guest as { imgUrl?: string }).imgUrl) {
            const resolvedUrl = await getImageUrl(
              (guest as { imgUrl?: string }).imgUrl!,
              "guest"
            );
            if (resolvedUrl && resolvedUrl !== (guest as { imgUrl?: string }).imgUrl!) {
              // Only add if the resolved URL is different from the original (safety check)
              urls[(guest as { imgUrl?: string }).imgUrl!] = resolvedUrl;
            } else if (resolvedUrl === (guest as { imgUrl?: string }).imgUrl!) {
              console.warn(
                "Resolved guest URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      // Resolve asset image URLs
      if (visitorData?.assets) {
        for (const asset of visitorData.assets) {
          if ((asset as { imgUrl?: string }).imgUrl) {
            const resolvedUrl = await getImageUrl(
              (asset as { imgUrl?: string }).imgUrl!,
              "asset"
            );
            if (resolvedUrl && resolvedUrl !== (asset as { imgUrl?: string }).imgUrl!) {
              // Only add if the resolved URL is different from the original (safety check)
              urls[(asset as { imgUrl?: string }).imgUrl!] = resolvedUrl;
            } else if (resolvedUrl === (asset as { imgUrl?: string }).imgUrl!) {
              console.warn(
                "Resolved asset URL is same as original, skipping:",
                resolvedUrl
              );
            }
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [visitorData]);
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchVisitor = async () => {
      try {
        const res = await getVisitors(token); // Replace with your actual API

        // Filter visitor by ID
        const matched = res.visitors.find(
          (v: { id: string | null }) => v.id === id
        );
        if (matched) {
          setVisitor(matched);

          if (matched.status === "APPROVED" || matched.status === "REJECTED") {
            clearInterval(interval); // Stop polling once approved
            // setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching visitor data:", error);
        clearInterval(interval);
        // setLoading(false);
      }
    };
    if (id && token) {
      fetchVisitor();
      interval = setInterval(fetchVisitor, 3000);
    }
    return () => clearInterval(interval);
  }, [id, token]);

  const fetchVisitor = async () => {
    try {
      const res = await getVisitors(token);
      const matched = res.visitors.find(
        (v: { id: string | null }) => v.id === id
      );
      if (matched) {
        setVisitor(matched);
      }
    } catch (err) {
      console.error("Error fetching visitors", err);
    } finally {
      // setLoading(false);
    }
  };

  // // Parse visitor data from URL params
  // const visitorDataParam = searchParams.get("visitorData");
  // console.log("Visitor data param:", visitorDataParam);

  // let visitorData = null;
  // if (visitorDataParam) {
  //   try {
  //     visitorData = JSON.parse(decodeURIComponent(visitorDataParam));
  //     console.log("Parsed visitor data:", visitorData);
  //   } catch (error) {
  //     console.error("Error parsing visitor data:", error);
  //     visitorData = DEFAULT_VISITOR_DATA; // Fallback to default if parsing fails
  //   }
  // } else {
  //   visitorData = DEFAULT_VISITOR_DATA; // Use default if no param
  // }

  // Header: 44px, Footer: ~64px, Padding: ~32px
  const mainContentMaxH = "calc(100vh - 70px - 64px - 32px)";

  const handleCheckIn = async (_id: string | number) => {
    try {
      const now = new Date();

      // Format date as 'YYYY-MM-DD'
      const date = now.toISOString().split("T")[0];

      // Format time as 'HH:MM:SS'
      const time = now.toTimeString().split(" ")[0];
      const payload = {
        date: date,
        time: time,
        checkInTime: new Date().toISOString(), // example JSON payload
        status: "CHECKED_IN",
      };
      await updateVisitor(_id, payload, token); // call PATCH API with ID and JSON
      toaster.success({
        title: "Check-In Successful",
        description: "Check-In Successful",
      });
      fetchVisitor(); // refresh the visitor data
    } catch (err) {
      console.error("Check-in failed", err);
      toaster.error({
        title: "Check-In Failed",
        description: "Check-In Failed",
      });
    }
  };

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
        
      <DesktopHeader />{/* Desktop Content Wrapper - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        bg="#F0E6FF"
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

        {/* Center Logo */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          opacity={0.15}
          zIndex={1}
        >
          <Box transform="scale(5)">
            <Logo />
          </Box>
        </Box>

        {/* Main Content */}
        <Box position="relative" zIndex={2} p={6} h="full" overflow="hidden">
          {/* Profile Header */}
          <Flex align="center" gap={3} mb='20px'>
            <IconButton
              aria-label="Back"
              tabIndex={0}
              variant="ghost"
              fontSize="lg"
              bg="#FFF"
              onClick={() => router.back()}
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
              Visitor Check-In Preview
            </Heading>
          </Flex>

          {/* Web Content - Employee Info on Top, Visitor Info on Bottom */}
          <Flex
            direction="column"
            gap={6}
            h="calc(100% - 80px)"
            overflow="auto"
            css={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
              msOverflowStyle: "none",
              scrollbarWidth: "none",
            }}
          >
            {/* Employee Info Card - Horizontal Layout with Separators */}
            {visitorData && (
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
                  <Flex alignItems="center" gap={4} flex="2" pr={6}>
                    <Box
                      w="60px"
                      h="60px"
                      borderRadius="full"
                      overflow="hidden"
                      bg="gray.100"
                    >
                      {visitorData?.hostDetails?.profileImageUrl &&
                      isValidImageUrl(visitorData.hostDetails.profileImageUrl) ? (
                        <Image
                          src={visitorData.hostDetails.profileImageUrl}
                          alt={visitorData.hostDetails.name || "Employee"}
                          width={60}
                          height={60}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                          onError={(e) => {
                            console.error("Host image failed to load:", e);
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
                          {getAvatarInitials(visitorData?.hostDetails?.name)}
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
                        {visitorData?.hostDetails?.name || "-"}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Vertical Separator - Only show if phone number exists */}
                  {visitorData?.hostDetails?.phoneNumber && visitorData.hostDetails.phoneNumber.trim() !== "" && (
                    <Box w="1px" h="60px" bg="gray.300" mx={4} />
                  )}

                  {/* Phone Number Section - Only show if phone number exists */}
                  {visitorData?.hostDetails?.phoneNumber && visitorData.hostDetails.phoneNumber.trim() !== "" && (
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
                        {visitorData.hostDetails.phoneNumber}
                      </Text>
                    </Box>
                  )}

                  {/* Vertical Separator */}
                  <Box w="1px" h="60px" bg="gray.300" mx={4} />

                  {/* Total Visits Section */}
                  <Box flex="0.7" px={4}>
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
                      {visitorData?.status === "CHECKED_IN" ? "01" : "00"}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            )}

            {/* Visitor Info Card - Matching visitor-history-preview design */}
            {visitorData && (
              <Box
                bg="white"
                borderRadius="10px"
                boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                p={6}
                w="60%"
                mx="auto"
                mb={4}
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
                      {visitorData?.imgUrl &&
                      isValidImageUrl(resolvedImageUrls[visitorData.imgUrl]) ? (
                        <Image
                          src={resolvedImageUrls[visitorData.imgUrl]}
                          alt={visitorData.fullName || "Visitor"}
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
                          {visitorData?.fullName?.charAt(0).toUpperCase() ||
                            "V"}
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
                        {visitorData?.fullName || "-"}
                      </Text>
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
                      {visitorData?.purposeOfVisit || "-"}
                    </Text>
                  </Box>
                </Flex>

                {/* Second Row - Company Name and Check-In/Out */}
                <Flex alignItems="flex-start" mb={3}>
                  {/* Company Name */}
                  <Box flex="1">
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
                      {visitorData?.companyName || "-"}
                    </Text>
                  </Box>

                  {/* Check-In & Check-Out */}
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
                        {visitorData?.date
                          ? new Date(visitorData.date).toLocaleDateString(
                              "en-GB"
                            )
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
                          {visitorData?.checkInTime
                            ? new Date(
                                visitorData.checkInTime
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
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
                          {visitorData?.checkOutTime
                            ? new Date(
                                visitorData.checkOutTime
                              ).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })
                            : "-"}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>
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
                      {visitorData?.gender || "-"}
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
                      color="blue.500"
                      textDecoration="underline"
                      fontFamily="Roboto"
                      textAlign="left"
                      cursor="pointer"
                    >
                      {visitorData?.idType || "-"}
                    </Text>
                  </Box>
                </Flex>

                {/* Fourth Row - Phone Number and Status */}
                <Flex alignItems="flex-start" mb={4} gap={6}>
                  {/* Phone Number */}
                  <Box flex="1">
                    <Text
                      fontSize="14px"
                      fontWeight="500"
                      color="gray.600"
                      mb={1}
                      fontFamily="Roboto"
                      textAlign="left"
                    >
                      Phone Number :
                    </Text>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color="gray.800"
                      fontFamily="Roboto"
                      textAlign="left"
                    >
                      {visitorData?.phoneNumber || "-"}
                    </Text>
                  </Box>

                  {/* Status */}
                  <Box flex="1">
                    <Text
                      fontSize="14px"
                      fontWeight="500"
                      color="gray.600"
                      mb={1}
                      fontFamily="Roboto"
                      textAlign="left"
                    >
                      Status :
                    </Text>
                    <Text
                      fontSize="16px"
                      fontWeight="600"
                      color={
                        visitorData?.status === "APPROVED"
                          ? "green.500"
                          : visitorData?.status === "PENDING"
                          ? "green.500"
                          : visitorData?.status === "REJECTED"
                          ? "red.500"
                          : visitorData?.status === "CHECKED_IN"
                          ? "green.500"
                          : "gray.800"
                      }
                      fontFamily="Roboto"
                      textAlign="left"
                    >
                      {visitorData?.status || "-"}
                    </Text>
                  </Box>
                </Flex>


                {/* With Guests Section */}
                {visitorData?.guest && visitorData.guest.length > 0 && (
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
                      {visitorData.guest.slice(0, 2).map((guest, index) => (
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
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            {(guest as { imgUrl?: string }).imgUrl &&
                            isValidImageUrl(resolvedImageUrls[(guest as { imgUrl?: string }).imgUrl!]) ? (
                              <Image
                                src={resolvedImageUrls[(guest as { imgUrl?: string }).imgUrl!]}
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
                              <Text
                                color="purple.700"
                                fontSize="sm"
                                fontWeight="bold"
                              >
                                {guest.guestName.charAt(0).toUpperCase()}
                              </Text>
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
                  </Box>
                )}


                {/* Assets Section - Only show if there are assets */}
                {visitorData?.assets && visitorData.assets.length > 0 && (
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
                        {visitorData.assets.length.toString().padStart(2, "0")}
                      </Text>
                    </Flex>

                    {/* All Assets Side by Side */}
                    <Flex gap={6} wrap="wrap">
                      {/* Personal Assets */}
                      {visitorData.assets.filter(
                        (asset) => asset.assetType === "Personal"
                      ).length > 0 && (
                        <Box>
                          <Flex gap={4} flexWrap="wrap">
                            {visitorData.assets
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
                                    {(asset as { imgUrl?: string }).imgUrl &&
                                    resolvedImageUrls &&
                                    isValidImageUrl(resolvedImageUrls[(asset as { imgUrl?: string }).imgUrl!]) ? (
                                      <Image
                                        src={
                                          resolvedImageUrls[
                                            (asset as { imgUrl?: string }).imgUrl!
                                          ]
                                        }
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
                                        {asset.assetName
                                          .charAt(0)
                                          .toUpperCase()}
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

                      {/* Company Assets */}
                      {visitorData.assets.filter(
                        (asset) => asset.assetType === "Company"
                      ).length > 0 && (
                        <Box>
                          <Flex gap={4} flexWrap="wrap">
                            {visitorData.assets
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
                                    {(asset as { imgUrl?: string }).imgUrl &&
                                    resolvedImageUrls &&
                                    isValidImageUrl(resolvedImageUrls[(asset as { imgUrl?: string }).imgUrl!]) ? (
                                      <Image
                                        src={
                                          resolvedImageUrls[
                                            (asset as { imgUrl?: string }).imgUrl!
                                          ]
                                        }
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
                                        {asset.assetName
                                          .charAt(0)
                                          .toUpperCase()}
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
            )}

            {/* Generate QR Button - Web Only - Show only for APPROVED status */}
            {visitorData && visitorData.status === "APPROVED" && (
              <Flex justifyContent="center" mt={2}>
                <Button
                  w="200px"
                  bg="#8A38F5"
                  color="#fff"
                  fontWeight="bold"
                  borderRadius="md"
                  h="48px"
                  fontSize="md"
                  tabIndex={0}
                  aria-label="Generate QR Code"
                  _hover={{ bg: "#7a2ed6" }}
                  _active={{ bg: "#6b28be" }}
                  onClick={() => {
                    // Navigate to visitor QR page with visitor ID and source
                    router.push(`/visitor-qr?id=${visitorData.id}&source=admin`);
                  }}
                >
                  Generate QR
                </Button>
              </Flex>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Action Buttons - Web Only - Fixed at Bottom */}
      {visitorData && visitorData.status !== "CHECKED_IN" && (
        <Box
          position="fixed"
          left={0}
          bottom={0}
          w="full"
          bgGradient="linear(to-t, #fff 80%, transparent)"
          zIndex={20}
          py={4}
          display={{ base: "none", md: "block" }}
        >
          <Flex gap={4} justify="center" maxW="1200px" mx="auto" px={6}>
            <Button
              w="200px"
              variant="outline"
              borderColor="#8A38F5"
              color="#8A38F5"
              fontWeight="bold"
              borderRadius="md"
              h="48px"
              fontSize="md"
              tabIndex={0}
              aria-label="Cancel"
              _hover={{ bg: "#f4edfefa" }}
              bg="#fff"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              w="200px"
              bg="#23A36D"
              color="#fff"
              fontWeight="bold"
              borderRadius="md"
              h="48px"
              fontSize="md"
              tabIndex={0}
              aria-label="Check-In"
              _hover={{ bg: "#1e8c5a" }}
              disabled={visitorData && visitorData.status !== "APPROVED"}
              onClick={() => {
                if (visitorData?.id) {
                  handleCheckIn(visitorData.id);
                }
              }}
            >
              Check-In
            </Button>
          </Flex>
        </Box>
      )}

      {/* Go Back Home Button - Fixed at Bottom Right - Show only when CHECKED_IN */}
      {visitorData && visitorData.status === "CHECKED_IN" && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          zIndex={30}
          display={{ base: "none", md: "block" }}
        >
          <Button
            bg="var(--Primary-VMS, #8A38F5)"
            color="#fff"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            px={6}
            fontSize="md"
            tabIndex={0}
            aria-label="Go Back Home"
            _hover={{ bg: "#6C2BC2" }}
            onClick={() => router.push("/dashboard")}
          >
            Go Back Home
          </Button>
        </Box>
      )}

      {/* Mobile Layout - Hidden on Desktop */}
      <Flex
        direction="column"
        minH="100vh"
        bg="#fff"
        overflow="visible"
        display={{ base: "flex", md: "none" }}
      >
        <HeaderBar />
        <Box
          w="full"
          maxW="390px"
          mx="auto"
          pt={2}
          pb={32}
          px={{ base: 2, sm: 0 }}
          maxH="calc(100vh - 120px)"
          overflow="auto"
          css={{
            "&::-webkit-scrollbar": {
              display: "none",
            },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {visitorData && (
            <VisitorInfoCard
              showAll={showAll}
              onToggleShowAll={() => setShowAll((v) => !v)}
              visitorData={visitorData}
              resolvedImageUrls={resolvedImageUrls}
            />
          )}
          {visitorData && (
            <EmployeeInfoCard
              // hideStatus={fromScanner || fromCheckout || fromCheckInProcess }
              visitorData={visitorData}
              resolvedImageUrls={resolvedImageUrls}
            />
          )}

          {visitorData?.status == "REJECTED" && (
            // <Box px={6} mt={6}>
            // {visitorData?.rejectionReason !== null && (
            //   <><Text fontWeight="medium" color="black">Reason</Text>
            //     <Text
            //         mt={2}
            //         fontFamily="Roboto"
            //         fontWeight={400}
            //         fontStyle="normal"
            //         fontSize="16px"
            //         lineHeight="24px"
            //         letterSpacing="0"
            //         color="#601E17"
            //       >
            //         {visitorData?.rejectionReason}
            //     </Text>
            //   </>
            // )}
            // </Box>
            <Box w="full" maxW="400px" mx="auto" px={{ base: 4, sm: 8 }} mt={4}>
              {visitorData?.rejectionReason !== null && (
                <>
                  <Text
                    fontWeight="bold"
                    fontSize="md"
                    color="#18181A"
                    alignSelf="flex-start"
                  >
                    Reason
                  </Text>
                  <Box
                    bg="white"
                    // border="1px solid #E2E8F0"
                    // borderRadius="md"
                    // p={2}
                    // minH="60px"
                    pt={2}
                    display="flex"
                    alignItems="center"
                  >
                    <Text
                      fontSize="sm"
                      color={
                        visitorData.rejectionReason ? "#9b5339ff" : "#E53E3E"
                      }
                      fontWeight={
                        visitorData.rejectionReason ? "normal" : "medium"
                      }
                    >
                      {visitorData?.rejectionReason ||
                        "Not available at this time."}
                    </Text>
                  </Box>
                </>
              )}
            </Box>
          )}
          {/* JSON Data Display */}
          {/* {visitorData && (
          <Box position="relative" mb={4} mt={4}>
            <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3} ml={1}>
              Visitor Data (JSON) - Debug Info
            </Text>
            <Box
              position="relative"
              w="full"
              maxW="342px"
              bg="#f0f8ff"
              borderRadius="lg"
              boxShadow="sm"
              px={4}
              py={3}
              mx="auto"
              border="2px solid #2563eb"
            >
              <Text
                color="gray.800"
                fontSize="xs"
                fontFamily="mono"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
                lineHeight="1.4"
                maxH="200px"
                overflow="auto"
                css={{
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                  msOverflowStyle: "none",
                  scrollbarWidth: "none",
                }}
              >
                {JSON.stringify(visitorData, null, 2)}
              </Text>
            </Box>
          </Box>
        )} */}

          {/* Debug Info */}
          {/* <Box position="relative" mb={4} mt={2}>
          <Text fontWeight="bold" color="#dc2626" fontSize="sm" mb={3} ml={1}>
            Debug Info
          </Text>
          <Box
            position="relative"
            w="full"
            maxW="342px"
            bg="#fef2f2"
            borderRadius="lg"
            boxShadow="sm"
            px={4}
            py={3}
            mx="auto"
            border="2px solid #dc2626"
          >
            <Text color="gray.800" fontSize="xs" fontFamily="mono">
              fromScanner: {fromScanner ? "true" : "false"}
            </Text>
            <Text color="gray.800" fontSize="xs" fontFamily="mono">
              visitorDataParam exists: {visitorDataParam ? "true" : "false"}
            </Text>
            <Text color="gray.800" fontSize="xs" fontFamily="mono">
              visitorData exists: {visitorData ? "true" : "false"}
            </Text>
          </Box>
        </Box> */}
        </Box>


        {visitorData && (
          <FooterButtons
            visitorData={visitorData}
            fromScanner={
              fromScanner || fromCheckOutProcess || fromCheckInProcess
            }
            fromCheckout={fromCheckout}
            refreshVisitor={fetchVisitor}
          />
        )}
      </Flex>
    </Box>
  );
};
const FooterButtons = ({
  visitorData,
  fromScanner,
  fromCheckout,
  refreshVisitor,
}: {
  visitorData: {
    id: number;
    fullName: string;
    phoneNumber: string;
    gender?: string;
    idType?: string;
    idNumber?: string;
    date?: string;
    time?: string;
    comingFrom: string;
    companyName?: string;
    location?: string;
    purposeOfVisit?: string;
    imgUrl?: string;
    status?: string;
    checkInTime?: string;
    checkOutTime?: string;
    hostDetails?: HostDetails;
    assets?: Asset[];
    guest?: Guest[];
    createdAt: string;
    updatedAt: string;
  };
  fromScanner: boolean;
  fromCheckout: boolean;
  refreshVisitor?: () => void;
}) => {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [checkedIn, setCheckedIn] = useState(false);

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

  const handleCheckIn = async (_id: string | number) => {
    try {
      const now = new Date();

      // Format date as 'YYYY-MM-DD'
      const date = now.toISOString().split("T")[0];

      // Format time as 'HH:MM:SS'
      const time = now.toTimeString().split(" ")[0];
      const payload = {
        date: date,
        time: time,
        checkInTime: new Date().toISOString(), // example JSON payload
        status: "CHECKED_IN",
      };
      await updateVisitor(_id, payload, token); // call PATCH API with ID and JSON
      toaster.success({
        title: "Check-In Successful",
        description: "Check-In Successful",
      });
      setCheckedIn(true);
      refreshVisitor?.(); // refresh the visitor data
    } catch (err) {
      console.error("Check-in failed", err);
      toaster.error({
        title: "Check-In Failed",
        description: "Check-In Failes",
      });
    }
  };


  if (fromScanner || checkedIn) {
    return (
      <Box
        position="fixed"
        left={0}
        bottom={0}
        w="full"
        maxW="100vw"
        bgGradient="linear(to-t, #fff 80%, transparent)"
        zIndex={20}
        py={2}
      >
        <Box w="full" maxW="370px" mx="auto" px={{ base: 2, sm: 4, md: 0 }}>
          <Button
            w="full"
            bg="#8A37F7"
            color="#fff"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Go Back Home"
            _hover={{ bg: "#6C2BC2" }}
            onClick={() => router.push("/dashboard")}
          >
            Go Back Home
          </Button>
        </Box>
      </Box>
    );
  }
  if (fromCheckout) {
    return (
      <Box
        position="fixed"
        left={0}
        bottom={0}
        w="full"
        maxW="100vw"
        bgGradient="linear(to-t, #fff 80%, transparent)"
        zIndex={20}
        py={2}
      >
        <Flex
          w="full"
          maxW="342px"
          mx="auto"
          pl={4}
          pr={6}
          direction="row"
          gap={2}
        >
          <Button
            w="50%"
            variant="outline"
            borderColor="#8A38F5"
            color="#8A38F5"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Back"
            _hover={{ bg: "#f4edfefa" }}
            bg="#fff"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <Button
            w="50%"
            bg="#E34935"
            color="#fff"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Check Out"
            _hover={{ bg: "#c53030" }}
            onClick={() => router.push("/scanner?fromCheckout=1")}
          >
            Check Out
          </Button>
        </Flex>
      </Box>
    );
  }
  return (
    <Box
      position="fixed"
      left={0}
      bottom={0}
      w="full"
      bgGradient="linear(to-t, #fff 80%, transparent)"
      zIndex={20}
      py={2}
    >
      <Flex
        w="full"
        maxW="342px"
        mx="auto"
        gap={2}
        pl={4}
        pr={6}
        direction="column"
      >
        {/* Testing Accept Button - Only show when status is PENDING */}
        {/* {visitorData?.status === "PENDING" && (
          <>
            <Box
              w="full"
              bg="yellow.50"
              border="1px solid"
              borderColor="yellow.200"
              borderRadius="md"
              p={3}
              mb={2}
            >
              <Text
                fontSize="xs"
                color="yellow.800"
                fontWeight="medium"
                textAlign="center"
              >
                🧪 TESTING MODE: Accept button for development purposes only
              </Text>
            </Box>
            <Button
              w="full"
              bg="#23A36D"
              color="#fff"
              fontWeight="bold"
              borderRadius="md"
              h="48px"
              fontSize="md"
              tabIndex={0}
              aria-label="Accept Visitor (Testing)"
              _hover={{ bg: "#1e8c5a" }}
              loading={loading}
              disabled={loading}
              onClick={() => handleAcceptVisitor(visitorData?.id)}
            >
              Accept Visitor (Testing)
            </Button>
          </>
        )} */}

        {/* Generate QR Button - Show only for APPROVED status */}
        {visitorData && visitorData.status === "APPROVED" && (
          <Button
            w="full"
            bg="#8A38F5"
            color="#fff"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Generate QR Code"
            _hover={{ bg: "#7a2ed6" }}
            _active={{ bg: "#6b28be" }}
            mb={2}
            onClick={() => {
              router.push(`/visitor-qr?id=${visitorData.id}&source=admin`);
            }}
          >
            Generate QR
          </Button>
        )}

        <Flex gap={2} direction="row">
          <Button
            w="50%"
            variant="outline"
            borderColor="#8A38F5"
            color="#8A38F5"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Cancel"
            _hover={{ bg: "#f4edfefa" }}
            bg="#fff"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            w="50%"
            bg="#23A36D"
            color="#fff"
            fontWeight="bold"
            borderRadius="md"
            h="48px"
            fontSize="md"
            tabIndex={0}
            aria-label="Check-In"
            _hover={{ bg: "#1e8c5a" }}
            disabled={visitorData && visitorData.status !== "APPROVED"}
            // onClick={() => router.push("/scanner")}
            onClick={() => {
              handleCheckIn(visitorData?.id);
            }}
          >
            Check-In
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};
export default VisitorCheckInPreview;
// import { VisitorPreviewProvider } from "../visitor/add/VisitorPreviewContext";

import DesktopHeader from "@/components/DesktopHeader";
// const VisitorCheckInPreviewWithProvider = () => {
//   return (
//     <VisitorPreviewProvider>
//       <VisitorCheckInPreview />
//     </VisitorPreviewProvider>
//   );
// };

// export default VisitorCheckInPreviewWithProvider;
