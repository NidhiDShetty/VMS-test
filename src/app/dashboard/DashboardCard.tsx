import { Box, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

export type DashboardCardProps = {
  // ActionCard props
  icon?: ReactNode;
  description?: string;
  actionLabel?: string;
  borderColor?: string;
  iconBg?: string;
  iconBorderColor?: string;
  // ProductCard props
  label?: string;
  value?: string;
  valueColor?: string;
  // Common
  bg: string;
  boxShadow?: string;
  ariaLabel: string;
  onClick?: () => void;
  children?: ReactNode;
};

const DashboardCard = ({
  icon,
  description,
  actionLabel,
  borderColor,
  iconBg,
  iconBorderColor,
  label,
  value,
  valueColor,
  bg,
  boxShadow,
  ariaLabel,
  onClick,
  children,
}: DashboardCardProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  // ActionCard style if icon is present
  if (icon) {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="#dce0e3"
        boxShadow="0 2px 16px rgba(95,36,172,0.27)"
        className="flex flex-col items-center justify-center w-full h-[130px] p-2"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
        onClick={onClick}
        cursor={onClick ? "pointer" : "default"}
        role={onClick ? "button" : undefined}
      >
        <Box
          bg={iconBg}
          borderRadius="md"
          borderWidth="1.4px"
          borderColor={iconBorderColor}
          className="flex items-center justify-center w-[70px] h-[70px] mb-3"
        >
          {icon}
        </Box>
        <Text fontSize="xs" color="gray.500" textAlign="center" mb={1} mt={1}>
          {description}
        </Text>
        <Text
          fontSize="md"
          fontWeight="semibold"
          color="gray.800"
          textAlign="center"
        >
          {actionLabel}
        </Text>
      </Box>
    );
  }

  // ProductCard style if value is present
  if (typeof value !== "undefined") {
    return (
      <Box
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="#dce0e3"
        boxShadow="0 2px 16px rgba(95,36,172,0.27)"
        className="flex flex-col items-center justify-center w-full h-[87px]"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        <Text fontSize="sm" color="black" mb={1}>
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color={valueColor}>
          {value}
        </Text>
        {children}
      </Box>
    );
  }

  // Fallback (empty card)
  return (
    <Box
      bg="white"
      borderRadius="lg"
      borderWidth="1px"
      borderColor="#dce0e3"
      boxShadow="0 2px 16px rgba(95,36,172,0.27)"
      className="flex flex-col items-center justify-center w-full h-[87px]"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {children}
    </Box>
  );
};

export default DashboardCard; 