import { Button, ButtonProps } from "@chakra-ui/react";
import type { FC, ReactNode, MouseEvent, KeyboardEvent } from "react";

export interface SecondaryButtonProps extends ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  tabIndex?: number;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeStyles = {
  xs: { fontSize: "12px", h: "32px", px: 3 },
  sm: { fontSize: "14px", h: "36px", px: 4 },
  md: { fontSize: "16px", h: "44px", px: 6 },
  lg: { fontSize: "18px", h: "52px", px: 8 },
};

const SecondaryButton: FC<SecondaryButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  isDisabled = false,
  type = "button",
  ariaLabel,
  tabIndex = 0,
  className,
  w = "full",
  size = "md",
  ...rest
}) => {
  const { fontSize, h, px } = sizeStyles[size] || sizeStyles.sm;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (
      (event.key === "Enter" || event.key === " ") &&
      onClick &&
      !isDisabled
    ) {
      event.preventDefault();
      onClick(event as unknown as MouseEvent<HTMLButtonElement>);
    }
    if (rest.onKeyDown) rest.onKeyDown(event);
  };

  return (
    <Button
      bg="white"
      color="#8A38F5"
      border="1px solid #8A38F5"
      w={w}
      h={h}
      px={px}
      borderRadius="md"
      fontWeight="bold"
      fontSize={fontSize}
      loading={isLoading}
      disabled={isDisabled}
      type={type}
      size={size}
      aria-label={
        ariaLabel ||
        (typeof children === "string" ? children : "Secondary action")
      }
      tabIndex={tabIndex}
      className={className}
      _hover={{ bg: "#F3EBFF" }}
      _active={{ bg: "#E6D4FF" }}
      _focus={{ boxShadow: "outline" }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default SecondaryButton;
