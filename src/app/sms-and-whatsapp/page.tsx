"use client";
import React from "react";
import { Box, Flex, Text, Stack, Button, Icon } from "@chakra-ui/react";
import { FiChevronLeft } from "react-icons/fi";

const insights = [
  { label: "Total", value: "10" },
  { label: "Used", value: "06" },
  { label: "Remaining", value: "04" },
];

const usageLogs = [
  {
    date: "30-06-2025",
    badges: ["SMS", "Visitor Invite"],
    stats: [
      { label: "Messages Sent", value: 50 },
      { label: "Credits Used", value: 50 },
    ],
  },
  {
    date: "30-06-2025",
    badges: ["SMS", "Visitor Invite"],
    stats: [
      { label: "Messages Sent", value: 50 },
      { label: "Credits Used", value: 50 },
    ],
  },
  {
    date: "30-06-2025",
    badges: ["SMS", "Visitor Invite"],
    stats: [
      { label: "Messages Sent", value: 50 },
      { label: "Credits Used", value: 50 },
    ],
  },
  {
    date: "30-06-2025",
    badges: ["SMS", "Visitor Invite"],
    stats: [
      { label: "Messages Sent", value: 50 },
      { label: "Credits Used", value: 50 },
    ],
  },
];

const tabList = ["SMS", "WhatsApp"];

const SmsAndWhatsappPage: React.FC = () => {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabChange = (index: number) => {
    setTabIndex(index);
  };

  const handleBack = () => {
    // Placeholder for navigation logic
  };

  const handleBackKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBack();
    }
  };

  // Determine badges based on tab
  const getBadges = () => (tabIndex === 0 ? ["SMS", "Visitor Invite"] : ["WhatsApp", "Visitor Invite"]);

  return (
    <Flex className="w-[360px] h-[709px] mx-auto" direction="column" bg="white" rounded="md" boxShadow="md" p={0} style={{ overflowY: 'auto' }}>
     
       {/* Header */}
       <Flex mt={2} align="center" px={2} py={1} bg="#f4edfe" borderBottom="1px solid #f1f1f1">
        <Icon
          as={FiChevronLeft}
          boxSize={9}
          color="gray.700"
          aria-label="Back"
          tabIndex={0}
          mr={2}
          role="button"
          onClick={handleBack}
          onKeyDown={handleBackKeyDown}
          cursor="pointer"
        />
        <Text flex={1} textAlign="center" fontWeight="bold" fontSize="md" color="gray.800">
          SMS & WhatsApp Usage Tracker
        </Text>
        <Box w={8} />
      </Flex>
      {/* Tabs Section */}
      <Box className="w-full" borderBottomWidth={1} borderColor="gray.200">
        <Flex className="w-full" direction="row" justify="center" align="center" h="40px">
          {tabList.map((tab, idx) => (
            <Box
              key={tab}
              flex={1}
              className="h-full flex flex-col items-center justify-center cursor-pointer"
              tabIndex={0}
              aria-label={`Tab: ${tab}`}
              onClick={() => handleTabChange(idx)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") handleTabChange(idx); }}
            >
              <Text fontWeight="semibold" color={tabIndex === idx ? "#8A38F5" : "black"} fontSize="md">
                {tab}
              </Text>
              <Box
                className="w-full"
                h="3px"
                bg={tabIndex === idx ? "purple.500" : "transparent"}
                mt={1}
                borderRadius="full"
                transition="background 0.2s"
              />
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Insights Section */}
      <Stack align="stretch" className="w-full" gap="2" mt={2}>
        <Text fontWeight="bold" fontSize="lg" color="gray.800" px={4}>
          Insights
        </Text>
        <Flex direction="row" className="w-full" gap={1} px={4}>
          {insights.map((item, idx) => (
            <Box
              key={idx}
              flex={1}
              bg="purple.50"
              rounded="xl"
              boxShadow="inner"
              className="h-[87px] flex flex-col items-center justify-center"
              minW={0}
            >
              <Text fontSize="sm" color="black" mb={1}>
                {item.label}
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.700">
                {item.value}
              </Text>
            </Box>
          ))}
        </Flex>
      </Stack>

      {/* Usage Log Section */}
      <Stack align="stretch" className="w-full flex-1" gap="0" mt={2} mb={0}>
        <Text fontWeight="bold" fontSize="lg" color="gray.800" px={4}>
          Usage Log
        </Text>
        <Stack gap="0">
          {usageLogs.map((log, idx) => (
            <Box key={idx} bg="white" rounded="lg" className="w-full" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)" p={0} pb={idx === usageLogs.length - 1 ? 0 : 2}>
              <Flex direction="row" align="center" justify="space-between" className="w-full" px={2} pt={2}>
                <Text fontSize="sm" color="gray.900">
                  {log.date}
                </Text>
                <Flex direction="row" gap={2}>
                  {getBadges().map((badge, bidx) => (
                    <Box
                      key={bidx}
                      bg="purple.500"
                      color="white"
                      rounded="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {badge}
                    </Box>
                  ))}
                </Flex>
              </Flex>
              <Flex direction="row" align="center" justify="space-between" className="w-full" px={2} pb={2} mt={2}>
                <Text fontSize="xs" color="gray.700">
                  Messages Sent: {log.stats[0].value}
                </Text>
                <Text fontSize="xs" color="gray.700">
                  Credits Used: {log.stats[1].value}
                </Text>
              </Flex>
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Bottom Button */}
      <Box className="w-full" mt={0} pt={0} pb={0} mb={0}>
        <Button
          w="full"
          h="52px"
          bg="#8A38F5"
          color="white"
          rounded="md"
          fontWeight="bold"
          fontSize="lg"
          tabIndex={0}
          aria-label="Send Message"
          _hover={{ bg: "purple.600" }}
        >
          Request Credits
        </Button>
      </Box>
    </Flex>
  );
};

export default SmsAndWhatsappPage; 