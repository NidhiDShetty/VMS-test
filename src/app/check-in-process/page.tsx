"use client";
import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  Avatar,
  Tabs,
  IconButton,
} from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { RiCloseLine } from "react-icons/ri";
import { LuUser, LuBox } from "react-icons/lu";
import AddAssetsModal from "@/components/modals/visitors/AddAssetsModal";
import AddGuestModal from "@/components/modals/visitors/AddGuestModal";
import { useDisclosure } from "@chakra-ui/react";
import { updateVisitor } from "@/app/api/visitor/routes";
import { toaster } from "@/components/ui/toaster";
import { FiUser, FiChevronLeft } from "react-icons/fi";
import Logo from "@/components/svgs/logo";
import DesktopHeader from "@/components/DesktopHeader";
import ImageWithBlob from "@/components/ui/ImageWithBlob";

// const DUMMY_AVATAR = "https://i.pravatar.cc/150?img=11";

const PlusIcon = () => (
  <svg
    width="17"
    height="16"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M16.5 10H10.5V16H6.5V10H0.5V6H6.5V0H10.5V6H16.5V10Z"
      fill="#5F24AC"
    />
  </svg>
);

interface VisitorData {
  visitor: {
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
    hostDetails?: string;
    assets?: Array<{
      assetName?: string;
      name?: string;
      serialNumber?: string;
      serial?: string;
      assetType?: string;
      type?: string;
      imgUrl?: string;
    }>;
    guest?: Array<{
      guestName?: string;
      name?: string;
      imgUrl?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

interface Asset {
  assetName: string;
  serialNumber: string;
  assetType: string;
  imgUrl?: string;
  tempId?: string;
  imageFile?: File | null;
}

interface Guest {
  guestName: string;
  imgUrl?: string;
  tempId?: string;
  imageFile?: File | null;
}

interface AssetData {
  assetName?: string;
  name?: string;
  serialNumber?: string;
  serial?: string;
  assetType?: string;
  type?: string;
  imgUrl?: string;
}

interface GuestData {
  guestName?: string;
  name?: string;
  imgUrl?: string;
}

const CheckInProcessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tabIndex, setTabIndex] = useState("0");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [visitorData, setVisitorData] = useState<VisitorData | null>(null);
  const [loading, setLoading] = useState(false);
  // Note: resolvedImageUrls removed - using ImageWithBlob component instead
  const assetModal = useDisclosure();
  const guestModal = useDisclosure();

  // Note: Image handling functions removed - using ImageWithBlob component instead

  // Parse visitor data from URL params on component mount
  useEffect(() => {
    const visitorDataParam = searchParams.get("visitorData");
    if (visitorDataParam) {
      try {
        const parsedData = JSON.parse(
          decodeURIComponent(visitorDataParam)
        ) as VisitorData;
        setVisitorData(parsedData);

        // Map existing assets if present - handle JSON string from backend
        if (parsedData.visitor?.assets) {
          let assetsArray: AssetData[] = [];

          // Handle both string and array formats
          if (typeof parsedData.visitor.assets === "string") {
            try {
              assetsArray = JSON.parse(parsedData.visitor.assets);
            } catch (e) {
              console.error("Error parsing assets string:", e);
            }
          } else if (Array.isArray(parsedData.visitor.assets)) {
            assetsArray = parsedData.visitor.assets;
          }

          if (assetsArray.length > 0) {
            const mappedAssets = assetsArray.map((asset) => ({
              assetName: asset.assetName || asset.name || "Unknown Asset",
              serialNumber: asset.serialNumber || asset.serial || "",
              assetType: asset.assetType || asset.type || "Unknown",
              imgUrl: asset.imgUrl || undefined,
              tempId:
                asset.tempId ||
                `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              imageFile: asset.imageFile || null,
            }));
            setAssets(mappedAssets);
          }
        }

        // Map existing guests if present - handle JSON string from backend
        if (parsedData.visitor?.guest) {
          let guestsArray: GuestData[] = [];

          // Handle both string and array formats
          if (typeof parsedData.visitor.guest === "string") {
            try {
              guestsArray = JSON.parse(parsedData.visitor.guest);
            } catch (e) {
              console.error("Error parsing guests string:", e);
            }
          } else if (Array.isArray(parsedData.visitor.guest)) {
            guestsArray = parsedData.visitor.guest;
          }

          if (guestsArray.length > 0) {
            const mappedGuests = guestsArray.map((guest) => ({
              guestName: guest.guestName || guest.name || "Unknown Guest",
              imgUrl: guest.imgUrl || undefined,
              tempId:
                guest.tempId ||
                `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              imageFile: guest.imageFile || null,
            }));
            setGuests(mappedGuests);
          }
        }
      } catch (error) {
        console.error("Error parsing visitor data:", error);
      }
    }
  }, [searchParams]);

  // Note: Image resolution is now handled by ImageWithBlob component

  // Asset handlers
  const handleDeleteAsset = (idx: number) =>
    setAssets((prev) => prev.filter((_, i) => i !== idx));

  // Guest handlers
  const handleDeleteGuest = (idx: number) =>
    setGuests((prev) => prev.filter((_, i) => i !== idx));

  // Handle next button click - save data and navigate
  const handleNext = async () => {
    if (tabIndex === "0") {
      setTabIndex("1");
    } else {
      // On guests tab, save data and navigate
      await handleCheckInComplete();
    }
  };

  // Handle check-in process completion
  const handleCheckInComplete = async () => {
    if (!visitorData?.visitor?.id) {
      toaster.error({
        title: "Error",
        description: "No visitor data found. Please try scanning again.",
      });
      return;
    }

    setLoading(true);
    try {
      // Get auth token
      const authDataRaw =
        typeof window !== "undefined" ? localStorage.getItem("authData") : null;
      if (!authDataRaw) throw new Error("No auth data found");

      const parsed = JSON.parse(authDataRaw);
      const token = parsed?.token;
      if (!token) throw new Error("No token found");

      // Prepare update data
      const updateData = {
        assets: assets.map((asset) => ({
          assetName: asset.assetName,
          serialNumber: asset.serialNumber,
          assetType: asset.assetType,
          imgUrl: asset.imgUrl,
        })),
        guest: guests.map((guest) => ({
          guestName: guest.guestName,
          imgUrl: guest.imgUrl,
        })),
      };

      // Update visitor in database
      await updateVisitor(visitorData.visitor.id, updateData, token);

      toaster.success({
        title: "Check-in Process Complete",
        description: "Visitor assets and guests have been saved successfully.",
      });

      // Navigate to summary page with updated data
      const updatedVisitorData = {
        ...visitorData,
        visitor: {
          ...visitorData.visitor,
          assets: updateData.assets,
          guest: updateData.guest,
        },
      };

      const navigationUrl = `/visitor-check-in-summary?visitorData=${encodeURIComponent(
        JSON.stringify(updatedVisitorData)
      )}`;
      router.push(navigationUrl);
    } catch (error) {
      console.error("Error updating visitor:", error);
      toaster.error({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save visitor data.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box w="full" bg="white" minH="100vh">
      {/* Mobile Layout */}
      <Box display={{ base: "block", lg: "none" }} bg="white">
        {/* Header */}
        <Flex
          as="header"
          align="center"
          justify="center"
          w="full"
          h="70px"
          bg="#f4edfefa"
          borderBottom="1px solid #f2f2f2"
          position="relative"
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
            _hover={{ bg: "gray.100" }}
            p={0}
            cursor="pointer"
            onClick={() => {
              if (tabIndex === "1") setTabIndex("0");
              else router.back();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (tabIndex === "1") setTabIndex("0");
                else router.back();
              }
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="#18181B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Text fontWeight="bold" fontSize="sm" color="#181a1b">
            Check-In Process
          </Text>
        </Flex>
        {/* Tabs */}
        <Box w="full" maxW="420px" mx="auto" mt={2} px={{ base: 2, sm: 4 }}>
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            w="full"
            mb={2}
            borderBottom="1px solid #E5E7EB"
            px={{ base: 0, sm: 2 }}
          >
            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-end"
              tabIndex={0}
              aria-label="Assets"
              role="tab"
              aria-selected={tabIndex === "0"}
              onClick={() => setTabIndex("0")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTabIndex("0");
              }}
              cursor="pointer"
              outline={tabIndex === "0" ? "none" : undefined}
              pb={1}
            >
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                fontWeight={tabIndex === "0" ? "bold" : "normal"}
                color={tabIndex === "0" ? "#8A38F5" : "#23292e"}
                textAlign="center"
                w="full"
                truncate
              >
                Assets
              </Text>
              {tabIndex === "0" && (
                <Box
                  mt={"2px"}
                  w="full"
                  h="3px"
                  borderRadius="2px"
                  bg="#8A38F5"
                />
              )}
            </Box>
            <Box
              flex={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="flex-end"
              tabIndex={0}
              aria-label="Guests"
              role="tab"
              aria-selected={tabIndex === "1"}
              onClick={() => setTabIndex("1")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTabIndex("1");
              }}
              cursor="pointer"
              outline={tabIndex === "1" ? "none" : undefined}
              pb={1}
            >
              <Text
                fontSize={{ base: "sm", sm: "md" }}
                fontWeight={tabIndex === "1" ? "bold" : "normal"}
                color={tabIndex === "1" ? "#8A38F5" : "#23292e"}
                textAlign="center"
                w="full"
                truncate
              >
                Guests
              </Text>
              {tabIndex === "1" && (
                <Box
                  mt={"2px"}
                  w="full"
                  h="3px"
                  borderRadius="2px"
                  bg="#8A38F5"
                />
              )}
            </Box>
          </Box>
          {/* Tab Content */}
          {tabIndex === "0" && (
            <Box px={{ base: 0, sm: 2 }} pt={3} pb={0}>
              <Button
                size="sm"
                variant="outline"
                mb={3}
                w="full"
                borderWidth="1.5px"
                borderColor="#8A38F5"
                borderRadius="md"
                fontWeight="bold"
                color="black"
                _hover={{ bg: "transparent", borderColor: "#8A38F5" }}
                onClick={assetModal.onOpen}
              >
                <Box as="span" mr={2} display="inline-flex">
                  <PlusIcon />
                </Box>
                Add Asset
              </Button>
              <AddAssetsModal
                isOpen={assetModal.open}
                onClose={assetModal.onClose}
                onSave={(asset) => {
                  // Convert File object to imgUrl string
                  const imgUrl = asset.image
                    ? URL.createObjectURL(asset.image)
                    : undefined;
                  const newAsset = {
                    name: asset.name,
                    serial: asset.serial,
                    type: asset.type,
                    imgUrl: imgUrl,
                  };
                  setAssets((prev) => [...prev, newAsset]);
                }}
              />
              <VStack align="stretch" gap={2}>
                {assets.length === 0 ? (
                  <Text
                    color="gray.500"
                    fontSize="sm"
                    textAlign="center"
                    py={4}
                  >
                    No assets added yet. Click &quot;Add Asset&quot; to get
                    started.
                  </Text>
                ) : (
                  assets.map((item, idx) => (
                    <Flex
                      key={item.assetName + item.serialNumber + idx}
                      align="center"
                      justify="space-between"
                      w="full"
                      minH="40px"
                      px={0}
                      py={1}
                      bg="transparent"
                    >
                      <Box flexShrink={0} w="40px" h="40px">
                        {item.imgUrl ? (
                          <ImageWithBlob
                            filePath={item.imgUrl}
                            alt={`${item.assetName} photo`}
                            type="asset"
                            width="40px"
                            height="40px"
                            borderRadius="full"
                            border="1px solid"
                            borderColor="#E2E8F0"
                            bg="purple.100"
                          />
                        ) : (
                          <Box
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            border="1px solid #E2E8F0"
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color="purple.700"
                            >
                              {item.assetName.charAt(0).toUpperCase()}
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <Box
                        flex={1}
                        ml={2}
                        minW={0}
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          color="#23292e"
                          mb={0}
                          lineHeight={1.2}
                          truncate
                        >
                          {item.assetName}
                        </Text>
                        <Flex gap={1} align="center" mt={0.5}>
                          {item.serialNumber && (
                            <Text
                              fontSize="xs"
                              color="#888"
                              bg="gray.100"
                              px={2}
                              borderRadius="full"
                              lineHeight={1.2}
                            >
                              #{item.serialNumber}
                            </Text>
                          )}
                          {item.assetType && (
                            <Text
                              fontSize="xs"
                              color="#888"
                              bg="gray.100"
                              px={2}
                              borderRadius="full"
                              lineHeight={1.2}
                            >
                              {item.assetType}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                      <Box
                        as="button"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="transparent"
                        borderRadius="full"
                        p={0}
                        ml={2}
                        aria-label="Remove"
                        tabIndex={0}
                        onClick={() => handleDeleteAsset(idx)}
                      >
                        <Box
                          bg="#E34935"
                          borderRadius="full"
                          w="18px"
                          h="18px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <RiCloseLine size={11} color="white" />
                        </Box>
                      </Box>
                    </Flex>
                  ))
                )}
              </VStack>
            </Box>
          )}
          {tabIndex === "1" && (
            <Box px={{ base: 0, sm: 2 }} pt={3} pb={0}>
              <Button
                size="sm"
                variant="outline"
                mb={3}
                w="full"
                borderWidth="1.5px"
                borderColor="#8A38F5"
                borderRadius="md"
                fontWeight="bold"
                color="black"
                _hover={{ bg: "transparent", borderColor: "#8A38F5" }}
                onClick={guestModal.onOpen}
              >
                <Box as="span" mr={2} display="inline-flex">
                  <PlusIcon />
                </Box>
                Add Guests
              </Button>
              <AddGuestModal
                isOpen={guestModal.open}
                onClose={guestModal.onClose}
                onSave={(guest) => {
                  // Convert File object to imgUrl string
                  const imgUrl = guest.image
                    ? URL.createObjectURL(guest.image)
                    : undefined;
                  const newGuest = {
                    name: guest.name,
                    imgUrl: imgUrl,
                  };
                  setGuests((prev) => [...prev, newGuest]);
                }}
              />
              <VStack align="stretch" gap={2}>
                {guests.length === 0 ? (
                  <Text
                    color="gray.500"
                    fontSize="sm"
                    textAlign="center"
                    py={4}
                  >
                    No guests added yet. Click &quot;Add Guests&quot; to get
                    started.
                  </Text>
                ) : (
                  guests.map((guest, idx) => (
                    <Flex
                      key={guest.guestName + idx}
                      align="center"
                      justify="space-between"
                      w="full"
                      minH="40px"
                      px={0}
                      py={1}
                      bg="transparent"
                    >
                      <Box flexShrink={0} w="40px" h="40px">
                        {guest.imgUrl ? (
                          <ImageWithBlob
                            filePath={guest.imgUrl}
                            alt={`${guest.guestName} photo`}
                            type="guest"
                            width="40px"
                            height="40px"
                            borderRadius="full"
                            border="1px solid"
                            borderColor="#E2E8F0"
                            bg="purple.100"
                          />
                        ) : (
                          <Box
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            border="1px solid #E2E8F0"
                            bg="purple.100"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              fontSize="md"
                              fontWeight="bold"
                              color="purple.700"
                            >
                              {guest.guestName.charAt(0).toUpperCase()}
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <Text
                        fontWeight="bold"
                        fontSize="sm"
                        color="#23292e"
                        flex={1}
                        ml={2}
                        truncate
                      >
                        {guest.guestName}
                      </Text>
                      <Box
                        as="button"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="transparent"
                        borderRadius="full"
                        p={0}
                        ml={2}
                        aria-label="Remove"
                        tabIndex={0}
                        onClick={() => handleDeleteGuest(idx)}
                      >
                        <Box
                          bg="#E34935"
                          borderRadius="full"
                          w="18px"
                          h="18px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <RiCloseLine size={11} color="white" />
                        </Box>
                      </Box>
                    </Flex>
                  ))
                )}
              </VStack>
            </Box>
          )}
        </Box>
        {/* Footer */}
        <Box
          w="full"
          maxW="420px"
          mx="auto"
          px={{ base: 3, sm: 4, md: 0 }}
          position="fixed"
          left={0}
          right={0}
          bottom={0}
          pb={4}
          bgGradient="linear(to-t, #fff 80%, transparent)"
          zIndex={20}
        >
          <Flex gap={2}>
            <Button
              w="50%"
              variant="outline"
              borderColor="#8A38F5"
              color="#8A38F5"
              fontWeight="bold"
              borderRadius="sm"
              h="36px"
              fontSize="xs"
              tabIndex={0}
              aria-label="Back"
              onClick={() => {
                if (tabIndex === "1") setTabIndex("0");
                else router.back();
              }}
            >
              Back
            </Button>
            {tabIndex === "0" ? (
              <Button
                w="50%"
                bg="#8A38F5"
                color="#fff"
                fontWeight="bold"
                borderRadius="sm"
                h="36px"
                fontSize="xs"
                tabIndex={0}
                aria-label="Next"
                _hover={{ bg: "#6C2BC2" }}
                onClick={() => setTabIndex("1")}
              >
                Next
              </Button>
            ) : (
              <Button
                w="50%"
                bg="#23A36D"
                color="#fff"
                fontWeight="bold"
                borderRadius="sm"
                h="36px"
                fontSize="xs"
                tabIndex={0}
                aria-label="Complete Check-in"
                _hover={{ bg: "#1e8e5a" }}
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? "Saving..." : "Check-in"}
              </Button>
            )}
          </Flex>
        </Box>
      </Box>

      {/* Web Layout - With Background and Logo */}
      <Box
        display={{ base: "none", lg: "block" }}
        minH="100vh"
        w="full"
        bg="white"
      >
        {/* Desktop Header */}
        <DesktopHeader />

        {/* Page Title Section */}
        <Flex
          align="center"
          gap={3}
          mb="20px"
          px={8}
          py={2}
          alignItems="center"
        >
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
            Check-In Process
          </Text>
        </Flex>

        {/* Main Content Area */}
        <Box
          position="relative"
          bg="#F0E6FF"
          minH="calc(100vh - 100px)"
          w="full"
          pb="100px"
        >
          {/* Background Logo */}
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

          {/* Tab Content */}
          <Box position="relative" zIndex={2} p={8}>
            {/* Heading */}
            <Text fontSize="xl" fontWeight="bold" color="#181a1b" mb={4}>
              Add Guests and Assets
            </Text>

            <Tabs.Root
              value={tabIndex}
              onValueChange={(e) => setTabIndex(e.value[0] || "0")}
              width="full"
            >
              {/* Tabs Header */}
              <Box
                bg="white"
                pt={4}
                borderRadius="lg 8px 0 0"
                borderWidth="1px"
                borderColor="#dce0e3"
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              >
                <Tabs.List
                  display="flex"
                  width="full"
                  borderBottom="1px solid #E2E8F0"
                >
                  <Tabs.Trigger
                    value="0"
                    _focus={{
                      outline: "none !important",
                      boxShadow: "none !important",
                    }}
                    _focusVisible={{
                      outline: "none !important",
                      boxShadow: "none !important",
                    }}
                    flex="1"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    gap={2}
                    fontWeight="medium"
                    fontSize="sm"
                    py={2}
                    color="#000000"
                    borderBottom="2px solid transparent"
                    outline="none"
                    boxShadow="none"
                    _selected={{
                      color: "#8A38F5",
                      borderBottom: "3px solid #8A38F5",
                      fontWeight: "semibold",
                    }}
                  >
                    <LuBox size={16} />
                    Assets
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="1"
                    flex="1"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    gap={2}
                    _focus={{
                      outline: "none !important",
                      boxShadow: "none !important",
                    }}
                    _focusVisible={{
                      outline: "none !important",
                      boxShadow: "none !important",
                    }}
                    fontWeight="medium"
                    fontSize="sm"
                    py={2}
                    color="#000000"
                    borderBottom="2px solid transparent"
                    outline="none"
                    boxShadow="none"
                    _selected={{
                      color: "#8A38F5",
                      borderBottom: "3px solid #8A38F5",
                      fontWeight: "semibold",
                    }}
                  >
                    <LuUser size={16} />
                    Guests
                  </Tabs.Trigger>
                </Tabs.List>
              </Box>
              {/* Tab Contents */}
              <Box
                bg="white"
                px={4}
                pb={5}
                borderRadius="0 0 lg 8px"
                borderWidth="1px"
                borderColor="#dce0e3"
                boxShadow="0 2px 16px rgba(95,36,172,0.27)"
              >
                <Tabs.Content value="0">
                  <Button
                    size="sm"
                    variant="outline"
                    mb={3}
                    w="full"
                    borderWidth="1.5px"
                    borderColor="#8A38F5"
                    borderRadius="md"
                    fontWeight="bold"
                    color="black"
                    _hover={{ bg: "transparent", borderColor: "#8A38F5" }}
                    onClick={assetModal.onOpen}
                  >
                    <Box as="span" mr={2} display="inline-flex">
                      <PlusIcon />
                    </Box>
                    Add Asset
                  </Button>
                  <AddAssetsModal
                    isOpen={assetModal.open}
                    onClose={assetModal.onClose}
                    onSave={(asset) => {
                      // Create a unique identifier for this asset
                      const assetId = `${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}`;

                      // Use the uploaded file path and match visitor add form structure
                      const newAsset = {
                        assetName: asset.name,
                        serialNumber: asset.serial,
                        assetType: asset.type,
                        imgUrl: asset.imagePath || undefined, // Use uploaded file path
                        tempId: assetId,
                        imageFile: asset.image, // Store the file for later upload
                      };
                      setAssets((prev) => [...prev, newAsset]);
                    }}
                  />
                  <VStack align="stretch" gap={2}>
                    {assets.length === 0 ? (
                      <Text
                        color="gray.500"
                        fontSize="sm"
                        textAlign="center"
                        py={4}
                      >
                        No assets added yet. Click &quot;Add Asset&quot; to get
                        started.
                      </Text>
                    ) : (
                      assets.map((item, idx) => (
                        <Flex
                          key={item.assetName + item.serialNumber + idx}
                          align="center"
                          justify="space-between"
                          w="full"
                          minH="40px"
                          px={0}
                          py={1}
                          bg="transparent"
                        >
                          <Box flexShrink={0} w="40px" h="40px">
                            {item.imgUrl ? (
                              <ImageWithBlob
                                filePath={item.imgUrl}
                                alt={`${item.assetName} photo`}
                                type="asset"
                                width="40px"
                                height="40px"
                                borderRadius="full"
                                border="1px solid"
                                borderColor="#E2E8F0"
                                bg="purple.100"
                              />
                            ) : (
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                border="1px solid #E2E8F0"
                                bg="purple.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text
                                  fontSize="md"
                                  fontWeight="bold"
                                  color="purple.700"
                                >
                                  {item.assetName.charAt(0).toUpperCase()}
                                </Text>
                              </Box>
                            )}
                          </Box>
                          <Box
                            flex={1}
                            ml={2}
                            minW={0}
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                          >
                            <Text
                              fontWeight="bold"
                              fontSize="sm"
                              color="#23292e"
                              mb={0}
                              lineHeight={1.2}
                              truncate
                            >
                              {item.assetName}
                            </Text>
                            <Flex gap={1} align="center" mt={0.5}>
                              {item.serialNumber && (
                                <Text
                                  fontSize="xs"
                                  color="#888"
                                  bg="gray.100"
                                  px={2}
                                  borderRadius="full"
                                  lineHeight={1.2}
                                >
                                  #{item.serialNumber}
                                </Text>
                              )}
                              {item.assetType && (
                                <Text
                                  fontSize="xs"
                                  color="#888"
                                  bg="gray.100"
                                  px={2}
                                  borderRadius="full"
                                  lineHeight={1.2}
                                >
                                  {item.assetType}
                                </Text>
                              )}
                            </Flex>
                          </Box>
                          <Box
                            as="button"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="transparent"
                            borderRadius="full"
                            p={0}
                            ml={2}
                            aria-label="Remove"
                            tabIndex={0}
                            onClick={() => handleDeleteAsset(idx)}
                          >
                            <Box
                              bg="#E34935"
                              borderRadius="full"
                              w="18px"
                              h="18px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <RiCloseLine size={11} color="white" />
                            </Box>
                          </Box>
                        </Flex>
                      ))
                    )}
                  </VStack>
                </Tabs.Content>
                <Tabs.Content value="1">
                  <Button
                    size="sm"
                    variant="outline"
                    mb={3}
                    w="full"
                    borderWidth="1.5px"
                    borderColor="#8A38F5"
                    borderRadius="md"
                    fontWeight="bold"
                    color="black"
                    _hover={{ bg: "transparent", borderColor: "#8A38F5" }}
                    onClick={guestModal.onOpen}
                  >
                    <Box as="span" mr={2} display="inline-flex">
                      <PlusIcon />
                    </Box>
                    Add Guests
                  </Button>
                  <AddGuestModal
                    isOpen={guestModal.open}
                    onClose={guestModal.onClose}
                    onSave={(guest) => {
                      // Create a unique identifier for this guest
                      const guestId = `${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}`;

                      // Use the uploaded file path and match visitor add form structure
                      const newGuest = {
                        guestName: guest.name,
                        imgUrl: guest.imagePath || undefined, // Use uploaded file path
                        tempId: guestId,
                        imageFile: guest.image, // Store the file for later upload
                      };
                      setGuests((prev) => [...prev, newGuest]);
                    }}
                  />
                  <VStack align="stretch" gap={2}>
                    {guests.length === 0 ? (
                      <Text
                        color="gray.500"
                        fontSize="sm"
                        textAlign="center"
                        py={4}
                      >
                        No guests added yet. Click &quot;Add Guests&quot; to get
                        started.
                      </Text>
                    ) : (
                      guests.map((guest, idx) => (
                        <Flex
                          key={guest.guestName + idx}
                          align="center"
                          justify="space-between"
                          w="full"
                          minH="40px"
                          px={0}
                          py={1}
                          bg="transparent"
                        >
                          <Box flexShrink={0} w="40px" h="40px">
                            {guest.imgUrl ? (
                              <ImageWithBlob
                                filePath={guest.imgUrl}
                                alt={`${guest.guestName} photo`}
                                type="guest"
                                width="40px"
                                height="40px"
                                borderRadius="full"
                                border="1px solid"
                                borderColor="#E2E8F0"
                                bg="purple.100"
                              />
                            ) : (
                              <Box
                                w="40px"
                                h="40px"
                                borderRadius="full"
                                border="1px solid #E2E8F0"
                                bg="purple.100"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Text
                                  fontSize="md"
                                  fontWeight="bold"
                                  color="purple.700"
                                >
                                  {guest.guestName.charAt(0).toUpperCase()}
                                </Text>
                              </Box>
                            )}
                          </Box>
                          <Text
                            fontWeight="bold"
                            fontSize="sm"
                            color="#23292e"
                            flex={1}
                            ml={2}
                            truncate
                          >
                            {guest.guestName}
                          </Text>
                          <Box
                            as="button"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg="transparent"
                            borderRadius="full"
                            p={0}
                            ml={2}
                            aria-label="Remove"
                            tabIndex={0}
                            onClick={() => handleDeleteGuest(idx)}
                          >
                            <Box
                              bg="#E34935"
                              borderRadius="full"
                              w="18px"
                              h="18px"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                            >
                              <RiCloseLine size={11} color="white" />
                            </Box>
                          </Box>
                        </Flex>
                      ))
                    )}
                  </VStack>
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Box>
        </Box>

        {/* Web Layout Bottom Navigation */}
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="white"
          borderTop="1px solid #E2E8F0"
          px={8}
          py={4}
          zIndex={1000}
          display={{ base: "none", lg: "block" }}
        >
          <Flex gap={4} maxW="1200px" mx="auto">
            <Button
              w="50%"
              bg="transparent"
              color="#8A38F5"
              fontWeight="bold"
              borderRadius="sm"
              h="44px"
              fontSize="sm"
              border="1px solid #8A38F5"
              tabIndex={0}
              aria-label="Back"
              _hover={{ bg: "#f4edfe" }}
              onClick={() => {
                if (tabIndex === "1") setTabIndex("0");
                else router.back();
              }}
            >
              Back
            </Button>
            {tabIndex === "0" ? (
              <Button
                w="50%"
                bg="#8A38F5"
                color="#fff"
                fontWeight="bold"
                borderRadius="sm"
                h="44px"
                fontSize="sm"
                tabIndex={0}
                aria-label="Next"
                _hover={{ bg: "#6C2BC2" }}
                onClick={() => setTabIndex("1")}
              >
                Next
              </Button>
            ) : (
              <Button
                w="50%"
                bg="#23A36D"
                color="#fff"
                fontWeight="bold"
                borderRadius="sm"
                h="44px"
                fontSize="sm"
                tabIndex={0}
                aria-label="Complete Check-in"
                _hover={{ bg: "#1e8e5a" }}
                onClick={handleNext}
                disabled={loading}
              >
                {loading ? "Saving..." : "Check-in"}
              </Button>
            )}
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default CheckInProcessPage;
