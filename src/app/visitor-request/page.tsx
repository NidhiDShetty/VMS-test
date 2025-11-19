"use client"
import { Box, Flex, Text} from "@chakra-ui/react";
import { KeyboardEvent, useState, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useNavigation } from "@/hooks/useNavigation";
import { FiChevronLeft } from "react-icons/fi";
import Image from "next/image";

interface VisitorRequest {
  id: string;
  name: string;
  avatarUrl: string;
  badge: string;
  status: "checked-in" | "pending" | "rejected" | "completed";
}

const visitorRequests: VisitorRequest[] = [
  {
    id: "1",
    name: "Ryan Culhane",
    avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
    badge: "Checked-in",
    status: "checked-in",
  },
  {
    id: "2",
    name: "Sherin Francis",
    avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg",
    badge: "Pending",
    status: "pending",
  },
  {
    id: "3",
    name: "Marcus Lubin",
    avatarUrl: "https://randomuser.me/api/portraits/men/65.jpg",
    badge: "Rejected",
    status: "rejected",
  },
  {
    id: "4",
    name: "Alex Kim",
    avatarUrl: "https://randomuser.me/api/portraits/men/12.jpg",
    badge: "Completed",
    status: "completed",
  },
];

const TABS = [
  { label: "Checked-in", value: "checked-in" },
  { label: "Pending", value: "pending" },
  { label: "Rejected", value: "rejected" },
  { label: "Completed", value: "completed" },
];

const handleCardKeyDown = (callback: () => void) => (e: KeyboardEvent<HTMLDivElement>) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    callback();
  }
};

const RightArrowIcon = () => (
  <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.5 0C16.02 0 20.5 4.48 20.5 10C20.5 15.52 16.02 20 10.5 20C4.98 20 0.5 15.52 0.5 10C0.5 4.48 4.98 0 10.5 0ZM10.5 9H6.5V11H10.5V14L14.5 10L10.5 6V9Z" fill="#8A38F5"/>
  </svg>
);

// HeaderBar component for mobile - matching check-in-visitor style
const HeaderBar = (): ReactElement => {
  const { safeBack } = useNavigation();
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
        onClick={() => safeBack()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') safeBack(); }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18l-6-6 6-6" stroke="#18181B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Box>
      <Text fontWeight="bold" fontSize="sm" color="#181a1b">Visitor Request</Text>
    </Flex>
  );
};

const VisitorRequestPage = () => {
  const [activeTab, setActiveTab] = useState<string>("checked-in");
  const router = useRouter();

  const handleCardClick = (status: string) => {
    router.push(`/visitor-request/preview?status=${status}`);
  };

  const filteredRequests =
    visitorRequests.filter((v) => v.status === activeTab);

  return (
    <Flex direction="column" w="full" minH="100vh" bg="white" pt={0} px={0}>
      <HeaderBar />
      <Box w="full" py={2} px={2}>
        {/* Tabs */}
        <Flex direction="row" gap={2} mb={2} w="full" px={0}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            const isCheckedIn = tab.value === "checked-in";
            return (
              <Box
                as="button"
                key={tab.value}
                flex={1}
                h="30px"
                w="85px"
                px={0}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="md"
                fontWeight="500"
                fontSize={isCheckedIn ? "xs" : "sm"}
                bg={isActive ? "#8B38F5" : "#F2F2F2"}
                color={isActive ? "#fff" : "#18181b"}
                tabIndex={0}
                aria-label={`Show ${tab.label}`}
                onClick={() => setActiveTab(tab.value)}
                onKeyDown={handleCardKeyDown(() => setActiveTab(tab.value))}
                cursor="pointer"
                _focus={{ boxShadow: "outline" }}
                transition="background 0.2s"
                whiteSpace={isCheckedIn ? "nowrap" : undefined}
              >
                {tab.label}
              </Box>
            );
          })}
        </Flex>
        <Flex direction="column" gap={6}>
          {filteredRequests.length === 0 ? (
            <Text color="gray.500" textAlign="center">No requests found.</Text>
          ) : (
            filteredRequests.map((visitor) => (
              <Flex
                key={visitor.id}
                align="center"
                w="full"
                px={2}
                py={3}
                tabIndex={0}
                aria-label={`View details for ${visitor.name}`}
                role="button"
                onClick={() => handleCardClick(visitor.status)}
                onKeyDown={handleCardKeyDown(() => handleCardClick(visitor.status))}
                _hover={{ bg: "gray.50" }}
                cursor="pointer"
                gap={4}
              >
                <Box
                  w={12}
                  h={12}
                  borderRadius="full"
                  overflow="hidden"
                  bg="gray.200"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Image
                    src={visitor.avatarUrl}
                    alt={visitor.name}
                    width={48}
                    height={48}
                  />
                </Box>
                <Flex direction="column" flex={1} minW={0}>
                  <Text fontWeight="600" fontSize="lg" color="gray.900" truncate>
                    {visitor.name}
                  </Text>
                  <Box
                    mt={2}
                    w="76px"
                    h="22px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    opacity={1}
                    gap={7}
                    bg={
                      visitor.status === "pending"
                        ? "#FFF7D7"
                        : visitor.status === "rejected"
                        ? "#F0E6E4"
                        : visitor.status === "completed"
                        ? "#EBF7FC"
                        : "#DDECE7"
                    }
                  >
                    <Text fontSize="xs" color="#25292E" fontWeight="500" textAlign="center">
                      {visitor.badge}
                    </Text>
                  </Box>
                </Flex>
                {/* Replace Icon with custom RightArrowIcon */}
                <Box as="span" ml={2} display="flex" alignItems="center">
                  <RightArrowIcon />
                </Box>
              </Flex>
            ))
          )}
        </Flex>
      </Box>
    </Flex>
  );
};

export default VisitorRequestPage; 