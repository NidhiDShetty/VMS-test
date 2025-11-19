import { Box, Text } from "@chakra-ui/react";
import React, { useRef, ChangeEvent } from "react";
import Image from "next/image";
import { FRONTEND_URL } from "@/lib/server-urls";

interface DateInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  ariaLabel: string;
}

const formatDisplayDate = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
};

const DateInput: React.FC<DateInputProps> = ({ value, onChange, placeholder, ariaLabel }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBoxClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (typeof inputRef.current.showPicker === 'function') {
        inputRef.current.showPicker();
      }
    }
  };

  return (
    <Box
      position="relative"
      h="48px"
      borderRadius="4px"
      border="1px solid #dce0e6"
      bg="white"
      pl={3}
      pr={3}
      fontSize="lg"
      color={value ? "black" : "#74829c"}
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      w="100%"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleBoxClick}
      style={{ cursor: 'pointer' }}
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.01,
          zIndex: 2,
          border: "none",
          background: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
        }}
      />
      <Text as="span" color={value ? "black" : "#74829c"} fontSize="lg" truncate zIndex={1}>
        {value ? formatDisplayDate(value) : placeholder}
      </Text>
      <Box position="absolute" right={3} top="50%" transform="translateY(-50%)" zIndex={1} pointerEvents="none">
        <Image src={`${FRONTEND_URL}/calendar.svg`} width={18} height={18} alt="calendar" />
      </Box>
    </Box>
  );
};

export default DateInput; 