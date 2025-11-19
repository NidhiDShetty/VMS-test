"use client";
import { Button, Icon } from "@chakra-ui/react";
import { FiFilter } from "react-icons/fi";

interface FilterButtonProps {
  onClick: () => void;
  isMobile?: boolean;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  onClick,
  isMobile = false,
}) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size={isMobile ? "sm" : "md"}
      bg="white"
      borderColor="purple.300"
      color="purple.600"
      _hover={{
        bg: "purple.50",
        borderColor: "purple.400",
      }}
      _active={{
        bg: "purple.100",
        borderColor: "purple.500",
      }}
      aria-label="Open filter options"
      tabIndex={0}
      fontWeight="medium"
      px={isMobile ? 3 : 4}
      py={isMobile ? 2 : 3}
      borderRadius="lg"
      fontSize={isMobile ? "sm" : "md"}
      minW={isMobile ? "auto" : "120px"}
    >
      <Icon as={FiFilter} mr={2} />
      Filter
    </Button>
  );
};

export default FilterButton;