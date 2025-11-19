import { Box, Flex, Text, Button, Icon } from "@chakra-ui/react";
import { FiDownload } from "react-icons/fi";
import { ChangeEvent, FC } from "react";
import DateInput from "./DateInput";
export type VisitorReportCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  onDownload: () => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onEndDateChange: (e: ChangeEvent<HTMLInputElement>) => void;
  fillHeight?: boolean;
  error?: string;
  isSummaryLoading?: boolean;
  isDetailedLoading?: boolean;
};
const VisitorReportCard: FC<VisitorReportCardProps> = ({
  title,
  description,
  buttonLabel,
  onDownload,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  fillHeight = false,
  error,
  isSummaryLoading = false,
  isDetailedLoading = false,
}) => (
  <Box
    // w={{ base: '100%', sm: '100%', md: '90%', lg: '80%' }}
    // {...(fillHeight ? { h: '100%', flex: 1, maxW: 'none' } : { maxW: { base: '100%', sm: '400px', md: '500px', lg: '600px' } })}
    // className={fillHeight ? 'w-full h-full flex-1' : 'w-full max-w-full sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px]'}
    borderRadius="lg"
    bg="white"
    boxShadow="0 2px 16px rgba(95,36,172,0.27)"
    // display="flex"
    // flexDirection="column"
  >
    <Box
      p="16px"
      flex={fillHeight ? 1 : undefined}
      h={fillHeight ? "100%" : undefined}
      display="flex"
      flexDirection="column"
    >
      <Text
        fontSize="xl"
        fontWeight="bold"
        mb="12px"
        color="black"
        whiteSpace="normal"
        wordBreak="break-word"
      >
        {title}
      </Text>
      <Text
        fontSize="md"
        color="gray.600"
        mb="16px"
        whiteSpace="normal"
        wordBreak="break-word"
        className="break-words"
      >
        {description}
      </Text>
      <Box mb={2}>
        <Text fontSize="base" mb="12px" color="black">
          Date
        </Text>
        <Flex gap={2} direction={{ base: "row", md: "column" }} wrap="nowrap">
          {/* Start Date */}
          <Box flex="1" minW="0" position="relative">
            <DateInput
              value={startDate}
              onChange={onStartDateChange}
              placeholder="Start Date"
              ariaLabel="Start Date"
            />
          </Box>
          {/* End Date */}
          <Box flex="1" minW="0" position="relative" w="100%">
            <DateInput
              value={endDate}
              onChange={onEndDateChange}
              placeholder="End Date"
              ariaLabel="End Date"
            />
          </Box>
        </Flex>
      </Box>
      {error && (
        <Text color="red.500" fontSize="sm">
          {error}
        </Text>
      )}
      <Button
        width="full"
        bg="purple.600"
        color="white"
        _hover={{ bg: "purple.700" }}
        onClick={onDownload}
        aria-label={buttonLabel}
        tabIndex={0}
        mt={2}
        // mb="16px"
        fontSize="md"
        h="50px"
        borderRadius="lg"
        loading={
          buttonLabel === "Download Summary Report"
            ? isSummaryLoading
            : isDetailedLoading
        }
      >
        <Icon as={FiDownload} mr="8px" />
        {buttonLabel}
      </Button>
    </Box>
  </Box>
);
export default VisitorReportCard;