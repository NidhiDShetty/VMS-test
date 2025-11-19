"use client";

import { Tabs, Box } from "@chakra-ui/react";
import { LuUser, LuBox } from "react-icons/lu";
import TabOne from "./TabOne";
import TabTwo from "./TabTwo";
import { VisitorFormData } from "@/app/api/visitor/routes";
import Logo from "@/components/svgs/logo";

type TabsViewProps = {
  visitorFormData: VisitorFormData;
  onChange: (field: keyof VisitorFormData, value: unknown) => void;
  loading: boolean;
  error: string | null;
  visitorId?: string | number;
};

const TabsView = ({ visitorFormData, onChange }: TabsViewProps) => {
  const handleAssetsChange = (assets: VisitorFormData["assets"]) =>
    onChange("assets", assets);
  const handleGuestsChange = (guests: VisitorFormData["guest"]) =>
    onChange("guest", guests);
  return (
    <Box w="full" overflowY='auto'>
      {/* Mobile Layout */}
      <Box display={{ base: "block", lg: "none" }}>
        <Tabs.Root defaultValue="assets" width="full">
          {/* Tabs Header */}
          <Box bg="white" pt={4}>
            <Tabs.List display="flex" width="full" borderBottom="1px solid #E2E8F0">
              <Tabs.Trigger
                value="assets"
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
                  // borderBottomColor: 'transparent'
                }}
              >
                <LuBox size={16} />
                Assets
              </Tabs.Trigger>
              <Tabs.Trigger
                value="guests"
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
                  // borderBottomColor: 'transparent'
                }}
              >
                <LuUser size={16} />
                Guests
              </Tabs.Trigger>
            </Tabs.List>
          </Box>
          {/* Tab Contents */}
          <Box px={4} pb={5}>
            <Tabs.Content value="assets">
              <TabOne
                assets={visitorFormData.assets}
                onAssetsChange={handleAssetsChange}
              />
            </Tabs.Content>
            <Tabs.Content value="guests">
              <TabTwo
                guests={visitorFormData.guest}
                onGuestsChange={handleGuestsChange}
              />
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>

      {/* Web Layout - With Background and Logo */}
      <Box
        position="relative"
        bg="#F0E6FF"
        display={{ base: "none", lg: "block" }}
        minH="100vh"
        w="full"
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
          <Tabs.Root defaultValue="assets" width="full">
            {/* Tabs Header */}
            <Box bg="white" pt={4} borderRadius="lg 8px 0 0" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)">
              <Tabs.List display="flex" width="full" borderBottom="1px solid #E2E8F0">
                <Tabs.Trigger
                  value="assets"
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
                    // borderBottomColor: 'transparent'
                  }}
                >
                  <LuBox size={16} />
                  Assets
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="guests"
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
                    // borderBottomColor: 'transparent'
                  }}
                >
                  <LuUser size={16} />
                  Guests
                </Tabs.Trigger>
              </Tabs.List>
            </Box>
            {/* Tab Contents */}
            <Box bg="white" px={4} pb={5} borderRadius="0 0 lg 8px" borderWidth="1px" borderColor="#dce0e3" boxShadow="0 2px 16px rgba(95,36,172,0.27)">
              <Tabs.Content value="assets">
                <TabOne
                  assets={visitorFormData.assets}
                  onAssetsChange={handleAssetsChange}
                />
              </Tabs.Content>
              <Tabs.Content value="guests">
                <TabTwo
                  guests={visitorFormData.guest}
                  onGuestsChange={handleGuestsChange}
                />
              </Tabs.Content>
            </Box>
          </Tabs.Root>
          {/* <Box h={16} /> */}
        </Box>
      </Box>
    </Box>
  );
};

export default TabsView;
