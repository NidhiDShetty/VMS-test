import { Button, ButtonProps } from "@chakra-ui/react";
import type { FC, ReactNode, MouseEvent, KeyboardEvent } from "react";

export interface PrimaryButtonProps extends ButtonProps {
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
  /**
   * Button size: 'xs' | 'sm' | 'md' | 'lg'. Default: 'sm'.
   */
  size?: "xs" | "sm" | "md" | "lg";
}

const sizeStyles = {
  xs: { fontSize: "12px", h: "32px", px: 3 },
  sm: { fontSize: "14px", h: "36px", px: 4 },
  md: { fontSize: "16px", h: "44px", px: 6 },
  lg: { fontSize: "18px", h: "52px", px: 8 },
};

const PrimaryButton: FC<PrimaryButtonProps> = ({
  children,
  onClick,
  isLoading = false,
  isDisabled = false,
  type = "button",
  ariaLabel,
  tabIndex = 0,
  className,
  //   leftIcon,
  //   rightIcon,
  w = "full",
  // h and fontSize will be set by sizeStyles
  // fontSize = "16px",
  size = "md",
  ...rest
}) => {
  const { fontSize, h, px } = sizeStyles[size] || sizeStyles.sm;

  // Keyboard accessibility: trigger click on Enter/Space
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
      bg="#8A38F5"
      color="white"
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
        (typeof children === "string" ? children : "Primary action")
      }
      tabIndex={tabIndex}
      className={className}
      //   leftIcon={leftIcon}
      //   rightIcon={rightIcon}
      _hover={{ bg: "#7a2ed6" }}
      _active={{ bg: "#6b28be" }}
      _focus={{ boxShadow: "outline" }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </Button>
  );
};

export default PrimaryButton;
