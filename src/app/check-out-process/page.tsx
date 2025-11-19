"use client";
import { useState } from "react";
import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const mockAssets = [
  {
    id: "1",
    name: "Laptop",
    image: "/assets/laptop.png",
    checked: false,
  },
  {
    id: "2",
    name: "USB Drive",
    image: "/assets/usb.png",
    checked: false,
  },
];

const mockGuests = [
  {
    id: "1",
    name: "Phillip Westervelt",
    avatar: "https://randomuser.me/api/portraits/men/44.jpg",
    checked: false,
  },
  {
    id: "2",
    name: "Roger Ekstrom Bothman",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    checked: false,
  },
];

const CheckOutProcessPage = () => {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState("0");
  const [assets, setAssets] = useState(mockAssets);
  const [guests, setGuests] = useState(mockGuests);

  const handleAssetCheck = (id: string) => {
    setAssets((prev) => prev.map((a) => a.id === id ? { ...a, checked: !a.checked } : a));
  };
  const handleGuestCheck = (id: string) => {
    setGuests((prev) => prev.map((g) => g.id === id ? { ...g, checked: !g.checked } : g));
  };

  const tabOptions = [
    { label: "Assets", value: "0" },
    { label: "Guests", value: "1" },
  ];

  return (
    <Flex direction="column" minH="100vh" bg="#fff" w="full">
      {/* Header */}
      <Flex as="header" align="center" justify="center" w="full" h="70px" bg="#f4edfefa" borderBottom="1px solid #f2f2f2" position="relative">
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
          bg="#FFFFFF"
          _hover={{ bg: 'gray.100' }}
          p={0}
          cursor="pointer"
          onClick={() => router.back()}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') router.back(); }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <Text fontWeight="bold" fontSize="sm" color="#181a1b">Check-Out Process</Text>
      </Flex>

      {/* Custom Tabs */}
      <Box w="full" maxW="420px" mx="auto" mt={2} px={{ base: 2, sm: 4 }}>
        <Box display="flex" flexDirection="row" alignItems="center" w="full" mb={2} borderBottom="1px solid #E5E7EB" px={{ base: 0, sm: 2 }}>
          {tabOptions.map((tab) => {
            const isSelected = tabIndex === tab.value;
            return (
              <Box
                key={tab.value}
                flex={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="flex-end"
                tabIndex={0}
                aria-label={tab.label}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setTabIndex(tab.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") setTabIndex(tab.value);
                }}
                cursor="pointer"
                outline={isSelected ? "none" : undefined}
                pb={1}
              >
                <Text
                  fontSize={{ base: 'sm', sm: 'md' }}
                  fontWeight={isSelected ? "bold" : "normal"}
                  color={isSelected ? "#8A38F5" : "#23292e"}
                  textAlign="center"
                  w="full"
                  truncate
                >
                  {tab.label}
                </Text>
                {isSelected && (
                  <Box mt={"2px"} w="full" h="3px" borderRadius="2px" bg="#8A38F5" />
                )}
              </Box>
            );
          })}
        </Box>
        {/* Tab Content */}
        {tabIndex === "0" && (
          <Box px={{ base: 0, sm: 2 }} pt={3} pb={0}>
            <Text color="#23292e" fontSize="xs" mb={3} fontWeight="medium">
              Check the box if you have received back the assets
            </Text>
            <Flex direction="column" gap={3}>
              {assets.map((asset) => (
                <Flex key={asset.id} align="center" gap={2} w="full" bg="transparent">
                  <Box w="40px" h="40px" borderRadius="md" overflow="hidden" border="1px solid #E5E7EB" bg="#fff">
                    <Image
                      src={asset.image}
                      alt={asset.name}
                      width={40}
                      height={40}
                    />
                  </Box>
                  <Text fontWeight="bold" color="#23292e" fontSize="sm" flex={1}>
                    {asset.name}
                  </Text>
                  <input
                    type="checkbox"
                    checked={asset.checked}
                    onChange={() => handleAssetCheck(asset.id)}
                    tabIndex={0}
                    aria-label={`Mark ${asset.name} as received`}
                    style={{
                      accentColor: "#8A38F5",
                      width: "16px",
                      height: "16px",
                      borderRadius: "6px",
                      border: "2px solid #8A38F5",
                      cursor: "pointer",
                    }}
                  />
                </Flex>
              ))}
            </Flex>
          </Box>
        )}
        {tabIndex === "1" && (
          <Box px={{ base: 0, sm: 2 }} pt={3} pb={0}>
            <Text color="#23292e" fontSize="xs" mb={3} fontWeight="medium">
              Check the box if guest is also checking out
            </Text>
            <Flex direction="column" gap={3}>
              {guests.map((guest) => (
                <Flex key={guest.id} align="center" gap={2} w="full" bg="transparent">
                  <Box w="32px" h="32px" borderRadius="full" overflow="hidden" bg="gray.200">
                    <Image
                      src={guest.avatar}
                      alt={guest.name}
                      width={32}
                      height={32}
                    />
                  </Box>
                  <Text fontWeight="bold" color="#23292e" fontSize="sm" flex={1}>
                    {guest.name}
                  </Text>
                  <input
                    type="checkbox"
                    checked={guest.checked}
                    onChange={() => handleGuestCheck(guest.id)}
                    tabIndex={0}
                    aria-label={`Mark ${guest.name} as checked out`}
                    style={{
                      accentColor: "#8A38F5",
                      width: "16px",
                      height: "16px",
                      borderRadius: "6px",
                      border: "2px solid #8A38F5",
                      cursor: "pointer",
                    }}
                  />
                </Flex>
              ))}
            </Flex>
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
              if (tabIndex === "1") {
                setTabIndex("0");
              } else {
                router.back();
              }
            }}
          >
            Back
          </Button>
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
            onClick={() => {
              if (tabIndex === "0") {
                setTabIndex("1");
              } else {
                router.push('/visitor-checkInOrCheckOut-preview?fromCheckout=1&fromCheckOutProcess=1');
              }
            }}
          >
            Next
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default CheckOutProcessPage; 