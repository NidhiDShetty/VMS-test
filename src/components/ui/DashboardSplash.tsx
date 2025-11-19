import { Box, Flex, Text } from "@chakra-ui/react";
import { MdDoneAll } from "react-icons/md";
import type { FC } from "react";

const DashboardSplash: FC = () => (
  <Flex
    minH="100vh"
    minW="100vw"
    bg="#8A38F5"
    direction="column"
    align="center"
    justify="center"
    tabIndex={0}
    aria-label="Dashboard splash screen"
  >
    {/* Fully centered icon + text block */}
    <Flex direction="column" align="center" justify="center">
      <Box
        bg="white"
        borderRadius="16px"
        borderWidth="6px"
        borderColor="#CDC3FF"
        w="64px"
        h="64px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={6}
        tabIndex={0}
        aria-label="Success icon"
      >
        <MdDoneAll size={36} color="#8A38F5" />
      </Box>

      <Text
        fontSize="lg"
        fontWeight="semibold"
        color="white"
        textAlign="center"
        mb={1}
        tabIndex={0}
        aria-label="Hello Folks"
      >
        Hello Folks 👋
      </Text>
      <Text
        fontSize="sm"
        color="white"
        textAlign="center"
        tabIndex={0}
        aria-label="Welcome to HCM Cafe's VMS"
      >
        Welcome to HCM Cafe&apos;s VMS
      </Text>
    </Flex>
  </Flex>
);

export default DashboardSplash;
