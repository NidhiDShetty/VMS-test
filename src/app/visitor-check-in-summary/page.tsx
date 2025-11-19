"use client";
import {
  Box,
  Flex,
  Text,
  Button,
  Avatar,
  IconButton,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiChevronLeft } from "react-icons/fi";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { updateVisitor } from "@/app/api/visitor/routes";
import { toaster } from "@/components/ui/toaster";
import Image from "next/image";
import DesktopHeader from "@/components/DesktopHeader";
import { getVisitorImageBlob } from "../api/visitor-image/routes";
import { getVisitorAssetImageBlob } from "../api/visitor-assets/routes";
import { getVisitorGuestPhotoBlob } from "../api/visitor-guests/routes";
import { EMPLOYEES_API } from "@/lib/server-urls";

interface VisitorData {
  id: string;
  orgId: string;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  date?: string;
  time?: string;
  comingFrom?: string;
  companyName?: string;
  location?: string | null;
  purposeOfVisit?: string;
  imgUrl?: string;
  hostDetails?: HostData | string;
  assets?: Asset[];
  guest?: Guest[];
  createdAt?: string;
  updatedAt?: string;
  visitorAddedBy?: string;
  status?: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  rejectionReason?: string | null;
}

interface Asset {
  assetName?: string;
  serialNumber?: string;
  assetType?: string;
  type?: string;
  index?: number;
  imgUrl?: string;
}

interface Guest {
  guestName?: string;
  name?: string;
  index?: number;
  imgUrl?: string;
}

interface HostData {
  userId: number;
  name: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string | null;
}

interface EmployeeData {
  userId: number;
  email: string;
  name: string;
  phoneNumber: string;
  profileImageUrl: string | null;
}

const HeaderBar = ({ isCheckout = false }: { isCheckout?: boolean }) => {
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
        {isCheckout ? "Check-out Summary" : "Check-in Summary"}
      </Text>
    </Flex>
  );
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name[0]?.toUpperCase() || "?";
};

const VisitorInfoCard = ({
  showAll,
  onToggleShowAll,
  visitorData,
  assets,
  guests,
  resolvedImageUrls,
}: {
  showAll: boolean;
  onToggleShowAll: () => void;
  visitorData: VisitorData;
  assets: Asset[];
  guests: Guest[];
  resolvedImageUrls: Record<string, string>;
}) => {
  // Format check-in time - show blank if not checked in yet
  const formatCheckInTime = () => {
    if (visitorData.checkInTime) {
      const date = new Date(visitorData.checkInTime);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return ""; // Return blank if not checked in yet
  };

  // Format check-out time
  const formatCheckOutTime = () => {
    if (visitorData.checkOutTime) {
      const date = new Date(visitorData.checkOutTime);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Not checked out";
  };

  // Format date - show current date if not checked in
  const formatDate = () => {
    if (visitorData.checkInTime) {
      const date = new Date(visitorData.checkInTime);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    // For current date, also format in dd/mm/yyyy
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, "0");
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const year = currentDate.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Box position="relative" mb={4}>
      <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3} ml={1}>
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
        mt="30px"
        minH="180px"
        mx="auto"
      >
        {/* Profile Photo */}
        <Box
          position="absolute"
          top="-28px"
          left="50%"
          transform="translateX(-50%)"
          w="56px"
          h="56px"
          borderRadius="full"
          overflow="hidden"
          bg="#d9d9d9"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="black"
          fontWeight="bold"
          fontSize="lg"
          boxShadow="md"
          zIndex={2}
        >
          {visitorData?.imgUrl && resolvedImageUrls[visitorData.imgUrl] ? (
            <Image
              src={resolvedImageUrls[visitorData.imgUrl]}
              alt={visitorData.fullName || "Visitor"}
              width={56}
              height={56}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            getInitials(visitorData?.fullName || "Visitor")
          )}
        </Box>

        <Box mt={4}>
          <Box
            as="dl"
            display="grid"
            gridTemplateColumns="120px 1fr"
            rowGap={2}
            columnGap={3}
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
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {visitorData?.fullName || "Unknown"}
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
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {visitorData?.phoneNumber || "Not provided"}
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
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {visitorData?.gender || "Not specified"}
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Purpose of Visit :
            </Text>
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {visitorData?.purposeOfVisit || "Not specified"}
            </Text>
          </Box>
          <Box mt={1} mb={1}>
            <Text fontWeight="bold" fontSize="sm" color="#23292e" mb={0.5}>
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
              <Text fontWeight="bold" fontSize="sm" color="#181a1b" minW="70px">
                {formatDate()}:
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
                <Text fontSize="sm" color="#23A36D" fontWeight="medium">
                  {formatCheckInTime() || "Not checked in"}
                </Text>
              </Flex>
              {visitorData.checkOutTime && (
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
                  <Text fontSize="sm" color="#E34935" fontWeight="medium">
                    {formatCheckOutTime()}
                  </Text>
                </Flex>
              )}
            </Flex>
          </Box>
          <Flex justify="flex-end" mt={0.5}>
            <Text
              color="#8A38F5"
              fontWeight="bold"
              fontSize="sm"
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
              {/* Guests Section */}
              {guests.length > 0 && (
                <Box w="full" mt={4}>
                  <Text fontWeight="bold" fontSize="sm" color="#23292e" mb={1}>
                    With Guests :
                  </Text>
                  {guests.map((guest, index) => (
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
                        {guest.imgUrl && resolvedImageUrls[guest.imgUrl] ? (
                          <Image
                            src={resolvedImageUrls[guest.imgUrl]}
                            alt={guest.guestName || guest.name || "Guest"}
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
                        color="#23292e" 
                        fontWeight="bold"
                        wordBreak="break-word"
                        overflowWrap="anywhere"
                        flex={1}
                      >
                        {guest.guestName || guest.name || "Unknown Guest"}
                      </Text>
                    </Flex>
                  ))}
                </Box>
              )}

              {/* Assets Section */}
              {assets.length > 0 && (
                <Box w="full" mt={4}>
                  <Flex align="center" mb={3}>
                    <Text fontWeight="bold" fontSize="sm" color="#23292e">
                      Assets Recorded :
                    </Text>
                    <Text
                      fontWeight="bold"
                      fontSize="sm"
                      color="#23292e"
                      ml="auto"
                    >
                      Total Assets: {assets.length.toString().padStart(2, "0")}
                    </Text>
                  </Flex>

                  {/* Two Column Layout for Assets */}
                  <Flex
                    gap={4}
                    w="full"
                    direction={{ base: "column", md: "row" }}
                  >
                    {/* Left Column - Personal Assets */}
                    <Box flex={1}>
                      {(() => {
                        const personalAssets = assets.filter((asset) => {
                          return (
                            asset.assetType === "Personal" ||
                            asset.type === "Personal"
                          );
                        });
                        return personalAssets.length > 0 ? (
                          <>
                            <Text
                              fontWeight="medium"
                              fontSize="sm"
                              color="#23292e"
                              mb={2}
                            >
                              Personal ({personalAssets.length})
                            </Text>
                            <VStack gap={2} align="stretch">
                              {personalAssets.map((asset, index) => (
                                <Flex
                                  key={`personal-${index}`}
                                  align="center"
                                  gap={3}
                                  bg="white"
                                  p={2}
                                  borderRadius="md"
                                  border="1px solid #E2E8F0"
                                >
                                  <Box
                                    w="40px"
                                    h="40px"
                                    borderRadius="md"
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
                                        alt={asset.assetName || "Asset"}
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
                                        bg="gray.100"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        color="gray.600"
                                        fontSize="sm"
                                      >
                                        {asset.assetName
                                          ? asset.assetName
                                              .charAt(0)
                                              .toUpperCase()
                                          : "P"}
                                      </Box>
                                    )}
                                  </Box>
                                  <Box flex={1} minW={0}>
                                    <Text
                                      fontSize="sm"
                                      color="#23292e"
                                      fontWeight="600"
                                      truncate
                                    >
                                      {asset.assetName || "Asset"}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      Serial:{" "}
                                      {asset.serialNumber ||
                                        `${(index + 1)
                                          .toString()
                                          .padStart(3, "0")}`}
                                    </Text>
                                  </Box>
                                </Flex>
                              ))}
                            </VStack>
                          </>
                        ) : (
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            fontStyle="italic"
                          >
                            No personal assets
                          </Text>
                        );
                      })()}
                    </Box>

                    {/* Right Column - Company Assets */}
                    <Box flex={1}>
                      {(() => {
                        const companyAssets = assets.filter((asset) => {
                          return (
                            asset.assetType === "Company" ||
                            asset.type === "Company"
                          );
                        });
                        return companyAssets.length > 0 ? (
                          <>
                            <Text
                              fontWeight="medium"
                              fontSize="sm"
                              color="#23292e"
                              mb={2}
                            >
                              Company ({companyAssets.length})
                            </Text>
                            <VStack gap={2} align="stretch">
                              {companyAssets.map((asset, index) => (
                                <Flex
                                  key={`company-${index}`}
                                  align="center"
                                  gap={3}
                                  bg="white"
                                  p={2}
                                  borderRadius="md"
                                  border="1px solid #E2E8F0"
                                >
                                  <Box
                                    w="40px"
                                    h="40px"
                                    borderRadius="md"
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
                                        alt={asset.assetName || "Asset"}
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
                                        bg="gray.100"
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        color="gray.600"
                                        fontSize="xs"
                                      >
                                        {asset.assetName
                                          ? asset.assetName
                                              .charAt(0)
                                              .toUpperCase()
                                          : "C"}
                                      </Box>
                                    )}
                                  </Box>
                                  <Box flex={1} minW={0}>
                                    <Text
                                      fontSize="sm"
                                      color="#23292e"
                                      fontWeight="600"
                                      truncate
                                    >
                                      {asset.assetName || "Asset"}
                                    </Text>
                                    <Text fontSize="xs" color="gray.600">
                                      Serial:{" "}
                                      {asset.serialNumber ||
                                        `${(index + 1)
                                          .toString()
                                          .padStart(3, "0")}`}
                                    </Text>
                                  </Box>
                                </Flex>
                              ))}
                            </VStack>
                          </>
                        ) : (
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            fontStyle="italic"
                          >
                            No company assets
                          </Text>
                        );
                      })()}
                    </Box>
                  </Flex>
                </Box>
              )}

              {/* Show message if no assets or guests */}
              {assets.length === 0 && guests.length === 0 && (
                <Text fontSize="sm" color="#666" fontStyle="italic">
                  No assets or guests added.
                </Text>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

const EmployeeInfoCard = ({
  hideStatus = false,
  hostDetails,
  resolvedImageUrls,
}: {
  hideStatus?: boolean;
  hostDetails?: HostData | string;
  resolvedImageUrls: Record<string, string>;
}) => {
  let hostData: HostData | null = null;

  // Handle both object and string formats
  if (typeof hostDetails === "string") {
    try {
      hostData = JSON.parse(hostDetails);
    } catch {
      hostData = null;
    }
  } else if (hostDetails && typeof hostDetails === "object") {
    hostData = hostDetails as HostData;
  }

  return (
    <Box position="relative" mb={1}>
      <Text fontWeight="bold" color="#381A63" fontSize="sm" mb={3} ml={1}>
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
        mt="30px"
        mx="auto"
      >
        {/* Host Profile Photo */}
        <Box
          position="absolute"
          top="-28px"
          left="50%"
          transform="translateX(-50%)"
          w="56px"
          h="56px"
          borderRadius="full"
          overflow="hidden"
          bg="#d9d9d9"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="black"
          fontWeight="bold"
          fontSize="lg"
          boxShadow="md"
          zIndex={2}
        >
          {hostData?.profileImageUrl && resolvedImageUrls[hostData.profileImageUrl] ? (
            <Image
              src={resolvedImageUrls[hostData.profileImageUrl]}
              alt={hostData.name || "Host"}
              width={56}
              height={56}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          ) : (
            getInitials(hostData?.name || "Host")
          )}
        </Box>

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
              fontSize="sm"
              textAlign="left"
            >
              Host Name :
            </Text>
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {hostData?.name || "Unknown Host"}
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
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {hostData?.phoneNumber || "Not provided"}
            </Text>
            <Text
              as="dt"
              fontWeight="bold"
              color="#363636"
              fontSize="sm"
              textAlign="left"
            >
              Email :
            </Text>
            <Text as="dd" color="#363636" fontSize="sm" textAlign="right">
              {hostData?.email || "Not provided"}
            </Text>
            {!hideStatus && (
              <>
                <Text
                  as="dt"
                  fontWeight="bold"
                  color="#363636"
                  fontSize="sm"
                  textAlign="left"
                >
                  Status
                </Text>
                <Text as="dd" fontSize="sm" textAlign="right">
                  <Box
                    as="span"
                    color="#23A36D"
                    fontWeight="bold"
                    display="inline-block"
                  >
                    Approved
                  </Box>
                </Text>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const FooterButtons = ({
  onCompleteCheckIn,
  isCheckout = false,
}: {
  onCompleteCheckIn: () => void;
  isCheckout?: boolean;
}) => {
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
          bg={isCheckout ? "#E34935" : "#23A36D"}
          color="#fff"
          fontWeight="bold"
          borderRadius="md"
          h="48px"
          fontSize="md"
          tabIndex={0}
          aria-label={isCheckout ? "Complete Check-out" : "Complete Check-in"}
          _hover={{ bg: isCheckout ? "#DC2626" : "#1e8e5a" }}
          onClick={onCompleteCheckIn}
        >
          {isCheckout ? "Complete Check-out" : "Complete Check-in"}
        </Button>
      </Box>
    </Box>
  );
};

const VisitorCheckInSummary = () => {
  const [showAll, setShowAll] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [resolvedImageUrls, setResolvedImageUrls] = useState<
    Record<string, string>
  >({});
  const [employeesData, setEmployeesData] = useState<EmployeeData[]>([]);

  // Determine if this is checkout flow
  const isCheckout = searchParams.get("fromCheckout") === "1";

  // Helper function to get the correct image URL
  const getImageUrl = async (
    imgUrl: string | undefined,
    type: "visitor" | "asset" | "guest" = "visitor"
  ): Promise<string | null> => {
    if (!imgUrl) return null;

    // If it's already a blob URL, return as is (no server request needed)
    if (imgUrl.startsWith("blob:")) {
      console.log(`✅ Using existing blob URL for ${type}:`, imgUrl);
      return imgUrl;
    }

    // If it's already a valid URL (http/https or data), return as is
    if (imgUrl.startsWith("http") || imgUrl.startsWith("data:")) {
      console.log(`✅ Using existing URL for ${type}:`, imgUrl);
      return imgUrl;
    }

    // If it's a fallback path like "/assets/laptop.png", return as is
    if (imgUrl.startsWith("/assets/")) {
      console.log(`✅ Using fallback path for ${type}:`, imgUrl);
      return imgUrl;
    }

    // If it's a file path (stored in DB), get the blob URL from server
    console.log(`📁 Fetching ${type} image from server for path:`, imgUrl);
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

      if (blobUrl) {
        console.log(`✅ Successfully fetched ${type} image:`, blobUrl);
      } else {
        console.log(`❌ Failed to fetch ${type} image for path:`, imgUrl);
      }

      return blobUrl;
    } catch (error) {
      console.error(`❌ Error loading ${type} image:`, error);
      return null;
    }
  };

  // Fetch employee data to populate missing host profile information
  useEffect(() => {
    const fetchEmployees = async () => {
      const authDataRaw = typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (!authDataRaw) return;

      let token = "";
      try {
        const parsed = JSON.parse(authDataRaw);
        token = parsed?.token;
      } catch {
        return;
      }
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
  }, []);

  // Parse visitor data from URL params or sessionStorage
  useEffect(() => {
    // For checkout flow, get data from sessionStorage to avoid HTTP 431 error
    if (isCheckout) {
      const storedData = sessionStorage.getItem("checkoutVisitorData");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          const visitorData = parsedData.visitor;
          
          // Clean up sessionStorage after reading
          sessionStorage.removeItem("checkoutVisitorData");
          
          // Parse hostDetails - handle both object and string formats
          if (visitorData?.hostDetails) {
            let hostDetailsParsed: HostData | null = null;
            if (typeof visitorData.hostDetails === "string") {
              try {
                hostDetailsParsed = JSON.parse(visitorData.hostDetails);
              } catch (e) {
                console.error("Error parsing hostDetails:", e);
              }
            } else if (typeof visitorData.hostDetails === "object") {
              hostDetailsParsed = visitorData.hostDetails as HostData;
            }
            visitorData.hostDetails = hostDetailsParsed;
          }

          setVisitorData(visitorData);

          // Parse assets - handle both array and string formats
          if (visitorData?.assets) {
            let assetsArray: Asset[] = [];
            if (Array.isArray(visitorData.assets)) {
              assetsArray = visitorData.assets;
            } else if (typeof visitorData.assets === "string") {
              try {
                assetsArray = JSON.parse(visitorData.assets);
              } catch (e) {
                console.error("Error parsing assets:", e);
                // Try to parse as a double-encoded string
                try {
                  const doubleParsed = JSON.parse(JSON.parse(visitorData.assets));
                  assetsArray = doubleParsed;
                } catch (e2) {
                  console.error("Error parsing double-encoded assets:", e2);
                }
              }
            }
            setAssets(assetsArray);
          }

          // Parse guests - handle both array and string formats
          if (visitorData?.guest) {
            let guestsArray: Guest[] = [];
            if (Array.isArray(visitorData.guest)) {
              guestsArray = visitorData.guest;
            } else if (typeof visitorData.guest === "string") {
              try {
                guestsArray = JSON.parse(visitorData.guest);
              } catch (e) {
                console.error("Error parsing guests:", e);
              }
            }
            setGuests(guestsArray);
          }
        } catch (error) {
          console.error("Error parsing visitor data from sessionStorage:", error);
        }
      }
      return;
    }

    // For regular check-in flow, use URL params (backward compatibility)
    const visitorDataParam = searchParams.get("visitorData");
    if (visitorDataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(visitorDataParam));
        const visitorData = parsedData.visitor;

        // Parse hostDetails - handle both object and string formats
        if (visitorData?.hostDetails) {
          let hostDetailsParsed: HostData | null = null;
          if (typeof visitorData.hostDetails === "string") {
            try {
              hostDetailsParsed = JSON.parse(visitorData.hostDetails);
            } catch (e) {
              console.error("Error parsing hostDetails:", e);
            }
          } else if (typeof visitorData.hostDetails === "object") {
            hostDetailsParsed = visitorData.hostDetails as HostData;
          }
          visitorData.hostDetails = hostDetailsParsed;
        }

        setVisitorData(visitorData);

        // Parse assets - handle both array and string formats
        if (visitorData?.assets) {
          let assetsArray: Asset[] = [];
          if (Array.isArray(visitorData.assets)) {
            assetsArray = visitorData.assets;
          } else if (typeof visitorData.assets === "string") {
            try {
              assetsArray = JSON.parse(visitorData.assets);
            } catch (e) {
              console.error("Error parsing assets:", e);
              // Try to parse as a double-encoded string
              try {
                const doubleParsed = JSON.parse(JSON.parse(visitorData.assets));
                assetsArray = doubleParsed;
              } catch (e2) {
                console.error("Error parsing double-encoded assets:", e2);
              }
            }
          }
          setAssets(assetsArray);
        }

        // Parse guests - handle both array and string formats
        if (visitorData?.guest) {
          let guestsArray: Guest[] = [];
          if (Array.isArray(visitorData.guest)) {
            guestsArray = visitorData.guest;
          } else if (typeof visitorData.guest === "string") {
            try {
              guestsArray = JSON.parse(visitorData.guest);
            } catch (e) {
              console.error("Error parsing guests:", e);
            }
          }
          setGuests(guestsArray);
        }
      } catch (error) {
        console.error("Error parsing visitor data:", error);
      }
    }
  }, [searchParams, isCheckout]);

  // Populate missing host profile information from employee data
  useEffect(() => {
    if (!visitorData || !employeesData.length) return;

    // Check if host details exist and if profileImageUrl or name is missing/incomplete
    if (visitorData.hostDetails && typeof visitorData.hostDetails === "object") {
      const hostDetails = visitorData.hostDetails as HostData;
      
      // Find the employee matching the host's userId
      const employee = employeesData.find(
        (emp) => emp.userId === hostDetails.userId
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

        // Update email if it's missing
        if (!hostDetails.email && employee.email) {
          updatedHostDetails.email = employee.email;
          needsUpdate = true;
        }

        // Update phone number if it's missing
        if (!hostDetails.phoneNumber && employee.phoneNumber) {
          updatedHostDetails.phoneNumber = employee.phoneNumber;
          needsUpdate = true;
        }

        // Only update state if changes were made
        if (needsUpdate) {
          setVisitorData((prev) =>
            prev ? { ...prev, hostDetails: updatedHostDetails } : prev
          );
        }
      }
    }
  }, [visitorData, employeesData]);

  // Resolve image URLs when visitorData changes
  useEffect(() => {
    const resolveImageUrls = async () => {
      if (!visitorData) return;

      const urls: Record<string, string> = {};

      // Resolve visitor image URL
      if (visitorData.imgUrl) {
        const resolvedUrl = await getImageUrl(visitorData.imgUrl, "visitor");
        if (resolvedUrl) {
          urls[visitorData.imgUrl] = resolvedUrl;
        }
      }

      // Resolve host profile image URL
      if (
        typeof visitorData.hostDetails === "object" &&
        visitorData.hostDetails?.profileImageUrl
      ) {
        const resolvedUrl = await getImageUrl(
          visitorData.hostDetails.profileImageUrl,
          "visitor"
        );
        if (resolvedUrl) {
          urls[visitorData.hostDetails.profileImageUrl] = resolvedUrl;
        }
      }

      // Resolve guest image URLs
      if (visitorData.guest) {
        for (const guest of visitorData.guest) {
          if (guest.imgUrl) {
            const resolvedUrl = await getImageUrl(guest.imgUrl, "guest");
            if (resolvedUrl) {
              urls[guest.imgUrl] = resolvedUrl;
            }
          }
        }
      }

      // Resolve asset image URLs
      if (visitorData.assets) {
        for (const asset of visitorData.assets) {
          if (asset.imgUrl) {
            const resolvedUrl = await getImageUrl(asset.imgUrl, "asset");
            if (resolvedUrl) {
              urls[asset.imgUrl] = resolvedUrl;
            }
          }
        }
      }

      // Also resolve from separate state arrays (used by UI components)
      for (const guest of guests) {
        if (guest.imgUrl) {
          const resolvedUrl = await getImageUrl(guest.imgUrl, "guest");
          if (resolvedUrl) {
            urls[guest.imgUrl] = resolvedUrl;
          }
        }
      }

      for (const asset of assets) {
        if (asset.imgUrl) {
          const resolvedUrl = await getImageUrl(asset.imgUrl, "asset");
          if (resolvedUrl) {
            urls[asset.imgUrl] = resolvedUrl;
          }
        }
      }

      setResolvedImageUrls(urls);
    };

    resolveImageUrls();
  }, [visitorData, assets, guests]);

  // Handle complete check-in or check-out
  const handleCompleteAction = async () => {
    if (!visitorData?.id) {
      console.error("No visitor ID found");
      return;
    }

    try {
      // Get auth token
      const authDataRaw =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (!authDataRaw) throw new Error("No auth data found");

      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;
      if (!token) throw new Error("No token found");

      if (isCheckout) {
        // Update visitor status to CHECKED_OUT
        const updateData = {
          status: "CHECKED_OUT",
          checkOutTime: new Date().toISOString(),
        };

        await updateVisitor(visitorData.id, updateData, token);

        toaster.success({
          title: "Check-out Complete",
          description: "Visitor has been successfully checked out.",
        });
      } else {
        // Update visitor status to CHECKED_IN
        const updateData = {
          status: "CHECKED_IN",
          checkInTime: new Date().toISOString(),
        };

        await updateVisitor(visitorData.id, updateData, token);

        toaster.success({
          title: "Check-in Complete",
          description: "Visitor has been successfully checked in.",
        });
      }

      // Navigate to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating visitor status:", error);
      toaster.error({
        title: "Error",
        description: isCheckout
          ? "Failed to check out visitor."
          : "Failed to check in visitor.",
      });
      // Still navigate to dashboard even if update fails
      router.push("/dashboard");
    }
  };

  // Header: 44px, Footer: ~64px, Padding: ~32px
  const mainContentMaxH = "calc(100vh - 70px - 64px - 32px)";

  return (
    <Flex direction="column" minH="100vh" bg="#f8fafc" w="full">
      {/* Responsive Header */}
      <Box display={{ base: "block", md: "none" }}>
        <HeaderBar isCheckout={isCheckout} />
      </Box>
      <Box display={{ base: "none", md: "block" }}>
        <DesktopHeader />
      </Box>

      {/* Main Content Area */}
      <Box
        flex={1}
        pt={{ base: "16px", md: "0px" }}
        display="flex"
        flexDirection="column"
      >
        {/* Mobile Layout */}
        <Box
          display={{ base: "flex", md: "none" }}
          flex={1}
          flexDirection="column"
        >
          <Box
            w="full"
            h="calc(100vh - 155px)"
            maxW="390px"
            mx="auto"
            pt={0}
            pb={0}
            px={{ base: 2, sm: 0 }}
           overflowY='auto' 
            transition="overflow 0.2s"
          >
            {visitorData && (
              <VisitorInfoCard
                showAll={showAll}
                onToggleShowAll={() => setShowAll((v) => !v)}
                visitorData={visitorData}
                assets={assets}
                guests={guests}
                resolvedImageUrls={resolvedImageUrls}
              />
            )}
            {visitorData && (
              <EmployeeInfoCard
                hideStatus={true}
                hostDetails={visitorData.hostDetails}
                resolvedImageUrls={resolvedImageUrls}
              />
            )}
          </Box>
          <FooterButtons
            onCompleteCheckIn={handleCompleteAction}
            isCheckout={isCheckout}
          />
        </Box>

        {/* Web Layout */}
        <Box
          display={{ base: "none", md: "flex" }}
          flex={1}
          flexDirection="column"
          bg="#f4edfefa"
          overflow="hidden"
        >
          {/* Page Title and Back Button */}
          <Flex align="center" gap={3} mb='20px' px={8} py={0} bg="#f4edfefa">
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
            <Text fontSize="lg" color="#18181b" fontWeight="bold">
              {isCheckout ? "Check-out Summary" : "Check-in Summary"}
            </Text>
          </Flex>

          {/* Main Content Card */}
          <Box
            flex={1}
            px={8}
            pb={6}
            display="flex"
            flexDirection="column"
            overflow="auto"
            maxH="calc(100vh - 180px)"
            minH="0"
          >
            <Box w="full" minH="0">
              {visitorData && (
                <>
                  {/* Page Header */}
                  <Box mb={0}></Box>

                  {/* Visitor Primary Information Card */}
                  <Box
                    bg="white"
                    borderRadius="lg"
                    p={6}
                    mb={3}
                    boxShadow="sm"
                    w="full"
                  >
                    <Flex align="center" w="full" justify="space-between">
                      {/* Avatar and Name Section */}
                      <Flex align="center" gap={4} flex="1">
                        <Avatar.Root w="80px" h="80px" flexShrink={0}>
                          <Avatar.Fallback
                            name={visitorData.fullName}
                            w="full"
                            h="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            bg="#8A38F5"
                            color="white"
                          />
                          {visitorData.imgUrl &&
                            resolvedImageUrls[visitorData.imgUrl] && (
                              <Avatar.Image
                                src={resolvedImageUrls[visitorData.imgUrl]}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            )}
                        </Avatar.Root>
                        <Flex direction="column">
                          <Text
                            fontWeight="bold"
                            color="#18181b"
                            fontSize="sm"
                            mb={1}
                          >
                            Full Name:
                          </Text>
                          <Text color="#18181b" fontSize="md">
                            {visitorData.fullName || "Unknown"}
                          </Text>
                        </Flex>
                      </Flex>

                      {/* Phone Number Section */}
                      <Flex direction="column" align="center" flex="1">
                        <Text
                          fontWeight="bold"
                          color="#18181b"
                          fontSize="sm"
                          mb={1}
                        >
                          Phone No:
                        </Text>
                        <Text color="#18181b" fontSize="md" textAlign="center">
                          {visitorData.phoneNumber || "Not provided"}
                        </Text>
                      </Flex>

                      {/* Gender Section */}
                      <Flex direction="column" align="center" flex="1">
                        <Text
                          fontWeight="bold"
                          color="#18181b"
                          fontSize="sm"
                          mb={1}
                        >
                          Gender:
                        </Text>
                        <Text color="#18181b" fontSize="md" textAlign="center">
                          {visitorData.gender || "Not specified"}
                        </Text>
                      </Flex>

                      {/* ID Type Section */}
                      <Flex direction="column" align="center" flex="1">
                        <Text
                          fontWeight="bold"
                          color="#18181b"
                          fontSize="sm"
                          mb={1}
                        >
                          ID Type:
                        </Text>
                        <Text
                          color="#8A37F7"
                          textDecoration="underline"
                          cursor="pointer"
                          fontSize="md"
                          textAlign="center"
                        >
                          {visitorData.idType || "Aadhaar"}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>

                  {/* Visit Details Card */}
                  <Box
                    bg="white"
                    borderRadius="lg"
                    p={6}
                    mb={2}
                    boxShadow="sm"
                    w="60%"
                    mx="auto"
                  >
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      color="#18181b"
                      mb={4}
                    >
                      Visit 01:
                    </Text>

                    {/* Host and Visit Details Grid */}
                    <Box mb={6}>
                      {/* Host ID Tag */}
                      <Flex gap={2} mb={6}>
                        <Box
                          bg="#f2f2f2"
                          color="#23292e"
                          fontSize="sm"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontWeight="medium"
                        >
                          #
                          {typeof visitorData.hostDetails === "object"
                            ? visitorData.hostDetails?.userId || "032"
                            : "032"}
                        </Box>
                      </Flex>

                      {/* 3x2 Grid Layout for Visit Details */}
                      <Box
                        display="grid"
                        gridTemplateColumns="1fr 1fr"
                        gridTemplateRows="1fr 1fr 1fr"
                        gap={6}
                        mb={4}
                      >
                        {/* Row 1 - Item 1: Name */}
                        <Flex align="center" gap={3}>
                          <Avatar.Root w="60px" h="60px" flexShrink={0}>
                            <Avatar.Fallback
                              name={
                                typeof visitorData.hostDetails === "object"
                                  ? visitorData.hostDetails?.name || "Host"
                                  : "Host"
                              }
                              w="full"
                              h="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="lg"
                              bg="#8A38F5"
                              color="white"
                            />
                            {typeof visitorData.hostDetails === "object" &&
                              visitorData.hostDetails?.profileImageUrl &&
                              resolvedImageUrls[
                                visitorData.hostDetails.profileImageUrl
                              ] && (
                                <Avatar.Image
                                  src={
                                    resolvedImageUrls[
                                      visitorData.hostDetails.profileImageUrl
                                    ]
                                  }
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                          </Avatar.Root>
                          <Box>
                            <Text fontSize="sm" color="#666" mb={1}>
                              Name:
                            </Text>
                            <Text
                              fontSize="sm"
                              color="#18181b"
                              fontWeight="bold"
                            >
                              {typeof visitorData.hostDetails === "object"
                                ? visitorData.hostDetails?.name ||
                                  "Unknown Host"
                                : "Unknown Host"}
                            </Text>
                          </Box>
                        </Flex>

                        {/* Row 1 - Item 2: Check-In & Check-Out */}
                        <Box>
                          <Text fontSize="sm" color="#666" mb={1}>
                            Check-In & Check-Out:
                          </Text>
                          <Box bg="#f7f7ff" borderRadius="lg" px={3} py={2}>
                            <Flex align="center" gap={2}>
                              <Text
                                fontSize="sm"
                                color="#18181b"
                                fontWeight="bold"
                              >
                                {visitorData.checkInTime
                                  ? new Date(
                                      visitorData.checkInTime
                                    ).toLocaleDateString() +
                                    ": " +
                                    new Date(
                                      visitorData.checkInTime
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Not checked in"}
                              </Text>
                              <Box as="span" color="#23A36D" fontSize="sm">
                                ✓
                              </Box>
                              <Box as="span" color="#ef4444" fontSize="sm">
                                -
                              </Box>
                            </Flex>
                          </Box>
                        </Box>

                        {/* Row 2 - Item 3: Phone Number - Only show if phone number exists */}
                        {typeof visitorData.hostDetails === "object" && 
                         visitorData.hostDetails?.phoneNumber && 
                         visitorData.hostDetails.phoneNumber.trim() !== "" && (
                          <Box>
                            <Text fontSize="sm" color="#666" mb={1}>
                              Phone No:
                            </Text>
                            <Text fontSize="sm" color="#18181b" fontWeight="bold">
                              {visitorData.hostDetails.phoneNumber}
                            </Text>
                          </Box>
                        )}

                        {/* Row 2 - Item 4: Purpose of Visit */}
                        <Box>
                          <Text fontSize="sm" color="#666" mb={1}>
                            Purpose of Visit:
                          </Text>
                          <Text fontSize="sm" color="#18181b" fontWeight="bold">
                            {visitorData.purposeOfVisit || "Not specified"}
                          </Text>
                        </Box>

                        {/* Row 3 - Item 5: Company Name */}
                        <Box>
                          <Text fontSize="sm" color="#666" mb={1}>
                            Company Name:
                          </Text>
                          <Text fontSize="sm" color="#18181b" fontWeight="bold">
                            {visitorData.companyName || "Not provided"}
                          </Text>
                        </Box>

                        {/* Row 3 - Item 6: Status */}
                        <Box>
                          <Text fontSize="sm" color="#666" mb={1}>
                            Status:
                          </Text>
                          <Text fontSize="sm" color="#23A36D" fontWeight="bold">
                            {visitorData.status === "CHECKED_IN"
                              ? "Check-In"
                              : visitorData.status || "Check-In"}
                          </Text>
                        </Box>
                      </Box>
                    </Box>

                    {/* Separator Line */}
                    <Box w="full" h="1px" bg="#e2e8f0" mb={6} />

                    {/* Guests Section */}
                    {visitorData.guest &&
                      Array.isArray(visitorData.guest) &&
                      visitorData.guest.length > 0 && (
                        <Box mb={6} maxH="200px" overflowY="auto" pr={2}>
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            color="#18181b"
                            mb={3}
                          >
                            With Guests:
                          </Text>
                          {visitorData.guest.map((guest, index) => (
                            <Flex key={index} align="center" gap={3} mb={2}>
                              <Avatar.Root w="40px" h="40px">
                                <Avatar.Fallback
                                  name={guest.guestName || "Guest"}
                                  w="full"
                                  h="full"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontSize="sm"
                                  bg="#8A38F5"
                                  color="white"
                                />
                                {guest.imgUrl &&
                                  resolvedImageUrls[guest.imgUrl] && (
                                    <Avatar.Image
                                      src={resolvedImageUrls[guest.imgUrl]}
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                      }}
                                    />
                                  )}
                              </Avatar.Root>
                              <Text 
                                fontSize="sm" 
                                color="#18181b"
                                wordBreak="break-word"
                                overflowWrap="anywhere"
                                flex={1}
                              >
                                {index + 1}.{" "}
                                {guest.guestName || "Unknown Guest"}
                              </Text>
                            </Flex>
                          ))}
                        </Box>
                      )}

                    {/* Assets Section */}
                    {visitorData.assets &&
                      Array.isArray(visitorData.assets) &&
                      visitorData.assets.length > 0 && (
                        <Box maxH="400px" overflowY="auto" pr={2}>
                          <Flex align="center" justify="space-between" mb={3}>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="#18181b"
                            >
                              Assets Recorded:
                            </Text>
                            <Text fontSize="sm" color="#18181b">
                              Total Assets:{" "}
                              {visitorData.assets.length
                                .toString()
                                .padStart(2, "0")}
                            </Text>
                          </Flex>

                          {/* Personal Assets */}
                          {(() => {
                            const personalAssets = Array.isArray(
                              visitorData.assets
                            )
                              ? visitorData.assets.filter(
                                  (asset) => asset.assetType === "Personal"
                                )
                              : [];
                            return personalAssets.length > 0 ? (
                              <Box mb={4}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="#18181b"
                                  mb={2}
                                >
                                  Personal ({personalAssets.length}):
                                </Text>
                                <VStack gap={2} align="stretch">
                                  {personalAssets.map((asset, index) => (
                                    <Flex
                                      key={`personal-${index}`}
                                      align="center"
                                      gap={3}
                                      bg="white"
                                      p={2}
                                      borderRadius="md"
                                      border="1px solid #E2E8F0"
                                    >
                                      <Box
                                        w="40px"
                                        h="40px"
                                        borderRadius="md"
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
                                            src={
                                              resolvedImageUrls[asset.imgUrl]
                                            }
                                            alt={asset.assetName || "Asset"}
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
                                            bg="gray.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            color="gray.600"
                                            fontSize="sm"
                                          >
                                            {asset.assetName
                                              ? asset.assetName
                                                  .charAt(0)
                                                  .toUpperCase()
                                              : "P"}
                                          </Box>
                                        )}
                                      </Box>
                                      <Box flex={1} minW={0}>
                                        <Text
                                          fontSize="sm"
                                          color="#18181b"
                                          fontWeight="600"
                                          truncate
                                        >
                                          {asset.assetName || "Asset"}
                                        </Text>
                                        <Text fontSize="xs" color="gray.600">
                                          Serial:{" "}
                                          {asset.serialNumber ||
                                            (index + 1)
                                              .toString()
                                              .padStart(3, "0")}
                                        </Text>
                                      </Box>
                                    </Flex>
                                  ))}
                                </VStack>
                              </Box>
                            ) : null;
                          })()}

                          {/* Company Assets */}
                          {(() => {
                            const companyAssets = Array.isArray(
                              visitorData.assets
                            )
                              ? visitorData.assets.filter(
                                  (asset) => asset.assetType === "Company"
                                )
                              : [];
                            return companyAssets.length > 0 ? (
                              <Box>
                                <Text
                                  fontSize="sm"
                                  fontWeight="medium"
                                  color="#18181b"
                                  mb={2}
                                >
                                  Company ({companyAssets.length}):
                                </Text>
                                <VStack gap={2} align="stretch">
                                  {companyAssets.map((asset, index) => (
                                    <Flex
                                      key={`company-${index}`}
                                      align="center"
                                      gap={3}
                                      bg="white"
                                      p={2}
                                      borderRadius="md"
                                      border="1px solid #E2E8F0"
                                    >
                                      <Box
                                        w="40px"
                                        h="40px"
                                        borderRadius="md"
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
                                            src={
                                              resolvedImageUrls[asset.imgUrl]
                                            }
                                            alt={asset.assetName || "Asset"}
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
                                            bg="gray.100"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            color="gray.600"
                                            fontSize="sm"
                                          >
                                            {asset.assetName
                                              ? asset.assetName
                                                  .charAt(0)
                                                  .toUpperCase()
                                              : "C"}
                                          </Box>
                                        )}
                                      </Box>
                                      <Box flex={1} minW={0}>
                                        <Text
                                          fontSize="sm"
                                          color="#18181b"
                                          fontWeight="600"
                                          truncate
                                        >
                                          {asset.assetName || "Asset"}
                                        </Text>
                                        <Text fontSize="xs" color="gray.600">
                                          Serial:{" "}
                                          {asset.serialNumber ||
                                            (index + 1)
                                              .toString()
                                              .padStart(3, "0")}
                                        </Text>
                                      </Box>
                                    </Flex>
                                  ))}
                                </VStack>
                              </Box>
                            ) : null;
                          })()}
                        </Box>
                      )}
                  </Box>
                </>
              )}
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            px={8}
            py={3}
            display="flex"
            justifyContent="center"
            flexShrink={0}
            bg="#f4edfefa"
          >
            <Box w="60%">
              <Button
                w="full"
                h="48px"
                bg="#E34935"
                color="white"
                fontWeight="bold"
                fontSize="md"
                borderRadius="md"
                _hover={{ bg: "#DC2626" }}
                _active={{ bg: "#B91C1C" }}
                tabIndex={0}
                aria-label={
                  isCheckout ? "Complete Check-out" : "Complete Check-in"
                }
                onClick={handleCompleteAction}
              >
                {isCheckout ? "Check Out" : "Check In"}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Flex>
  );
};

export default VisitorCheckInSummary;
