import { Box, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

export type ActionCardProps = {
  icon?: ReactNode;
  actionLabel: string;
  bg: string;
  borderColor: string;
  iconBg: string;
  iconBorderColor: string;
  boxShadow?: string;
  ariaLabel: string;
  onClick?: () => void;
};

export const ActionCard = ({
  icon,
  actionLabel,
  bg,
  borderColor,
  iconBg,
  iconBorderColor,
  boxShadow,
  ariaLabel,
  onClick,
}: ActionCardProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Box w={{ base: "100%", md: "30%" }}
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="#dce0e3"
      boxShadow="0 2px 16px rgba(95,36,172,0.27)"
      // w="100%"
      // px={4}
      // py={8}
      // minH="200px"
      display="flex"
      px="16px"
      pt="16px"
      pb="12px"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
      role={onClick ? "button" : undefined}
      _hover={onClick ? { boxShadow: "md", transform: "scale(1.02)" } : undefined}
      transition="0.2s"
    >
      <Box
        bg={iconBg}
        borderRadius="md"
        borderWidth="1.4px"
        borderColor={iconBorderColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
        boxSize={{ base: "80px", md: "100px" }}
        mb="16px"
      >
        {icon}
      </Box>
      <Text 
        fontSize="sm" 
        fontWeight="500" 
        color="#18181B" 
        textAlign="center"
        lineHeight="1.2"
        minH="20px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {actionLabel}
      </Text>
    </Box>
  );
};

export default ActionCard;
