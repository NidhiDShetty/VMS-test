"use client";

import { Box, Flex, Button, Icon, Text } from "@chakra-ui/react";
import { FiHome, FiUsers, FiUser } from "react-icons/fi";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

type UserRole = "Admin" | "SuperAdmin" | "Host" | "Security";

const FooterMenuNavigation = ({ role }: { role: UserRole }) => {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      label: "Home",
      icon: FiHome,
      route: "/dashboard",
      ariaLabel: "Go to Home",
    },
    ...(role === "Admin"
      ? [
          {
            label: "Employees",
            icon: FiUsers,
            route: "/employee-list",
            ariaLabel: "View Employees",
          },
        ]
      : []),
    {
      label: "Profile",
      icon: FiUser,
      route: "/profile",
      ariaLabel: "View Profile",
    },
  ];

  return (
    <Box
      as="footer"
      w="full"
      minH="64px"
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="white"
      boxShadow="0px -1px 4px rgba(0, 0, 0, 0.05)"
      borderRadius="0"
      borderTopWidth={0}
      px={0}
      pb="env(safe-area-inset-bottom, 0px)"
    >
      <Flex justify="space-between" align="center" minH="60px" gap="4px">
        {" "}
        {/* spacing/xxxs */}
        {menuItems.map((item) => {
          const isActive = pathname === item.route || (item.route === "/dashboard" && pathname.startsWith("/dashboard"));
          return (
            <Button
              key={item.label}
              variant="plain"
              display="flex"
              flexDir="column"
              alignItems="center"
              justifyContent="center"
              h="full"
              flex="1"
              gap="4px" // spacing/xxxs
              onClick={() => router.push(item.route)}
              aria-label={item.ariaLabel}
              _focus={{ outline: "none" }}
            >
              <Icon
                as={item.icon}
                boxSize="24px"
                color={isActive ? "#000000" : "#758195"}
              />
              <Text
                fontSize="12px"
                fontWeight={isActive ? "700" : "500"}
                color={isActive ? "#000000" : "#758195"}
              >
                {item.label}
              </Text>
            </Button>
          );
        })}
      </Flex>
    </Box>
  );
};

export default FooterMenuNavigation;
