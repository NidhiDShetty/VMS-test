import { Box, Text } from '@chakra-ui/react';
import { ReactNode } from 'react';

export type ProductCardProps = {
  label: string;
  value: string;
  bg: string;
  valueColor: string;
  boxShadow?: string;
  borderColor?: string;
  children?: ReactNode;
  ariaLabel: string;
  onClick?: () => void;
};

export const ProductCard = ({
  label,
  value,
  bg,
  valueColor,
  boxShadow,
  borderColor,
  children,
  ariaLabel,
  onClick,
}: ProductCardProps) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <Box p='11px 8px 5px 8px'
      bg={bg}
      borderRadius="12px"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow={boxShadow}
      className="flex flex-col items-center justify-center w-full h-[80px]"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      cursor={onClick ? "pointer" : "default"}
      role={onClick ? "button" : undefined}
    >
      <Text fontSize="sm" color="#000000" fontWeight="semibold" mb={1}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={valueColor}>
        {value}
      </Text>
      {children}
    </Box>
  );
};

export default ProductCard; 