// visitor/add/components/HeaderTitle.tsx

"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { ReactElement } from "react";
import { FiChevronLeft } from "react-icons/fi";

interface HeaderTitleProps {
  title: string;
  onBack?: () => void;
}

const HeaderTitle = ({ title, onBack }: HeaderTitleProps): ReactElement => {
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
        onClick={onBack}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onBack?.();
        }}
        cursor="pointer"
      >
        <FiChevronLeft size={20} color="#18181B" />
      </Box>

      <Text
        fontWeight="bold"
        fontSize={{ base: "sm", md: "lg" }}
        color="#181a1b"
      >
        {title}
      </Text>
    </Flex>
  );
};

export default HeaderTitle;
