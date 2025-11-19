"use client";
import {
  Box,
  Flex,
  Text,
  Button,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { FiFilter, FiX } from "react-icons/fi";
import { useState, ChangeEvent, useEffect } from "react";
import DateInput from "./DateInput";

export interface FilterOptions {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  status: string[];
  company: string;
  reportType: "summary" | "detailed";
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
  isMobile: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  isMobile,
}) => {
  const [, setFilters] = useState<FilterOptions>(currentFilters);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(currentFilters);

  useEffect(() => {
    setTempFilters(currentFilters);
  }, [currentFilters]);

  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        startDate: e.target.value,
      },
    }));
  };

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        endDate: e.target.value,
      },
    }));
  };

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedStatus = e.target.value;
    if (selectedStatus === "all") {
      setTempFilters(prev => ({
        ...prev,
        status: [],
      }));
    } else {
      setTempFilters(prev => ({
        ...prev,
        status: [selectedStatus],
      }));
    }
  };

  const handleCompanyChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTempFilters(prev => ({
      ...prev,
      company: e.target.value,
    }));
  };

  const handleReportTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setTempFilters(prev => ({
      ...prev,
      reportType: e.target.value as "summary" | "detailed",
    }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleClearFilters = () => {
    const clearedFilters: FilterOptions = {
      dateRange: {
        startDate: "",
        endDate: "",
      },
      status: [],
      company: "",
      reportType: "summary",
    };
    setTempFilters(clearedFilters);
  };

  const hasActiveFilters = () => {
    return (
      tempFilters.dateRange.startDate ||
      tempFilters.dateRange.endDate ||
      tempFilters.status.length > 0 ||
      tempFilters.company !== ""
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (tempFilters.dateRange.startDate) count++;
    if (tempFilters.dateRange.endDate) count++;
    if (tempFilters.status.length > 0) count++;
    if (tempFilters.company !== "") count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        zIndex={1000}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <Box
        position="fixed"
        top={isMobile ? 0 : "50%"}
        left={isMobile ? 0 : "50%"}
        right={isMobile ? 0 : "auto"}
        bottom={isMobile ? 0 : "auto"}
        transform={isMobile ? "none" : "translate(-50%, -50%)"}
        w={isMobile ? "100vw" : "600px"}
        h={isMobile ? "100vh" : "90vh"}
        maxH={isMobile ? "100vh" : "90vh"}
        bg="white"
        borderRadius={isMobile ? "none" : "xl"}
        zIndex={1001}
        display="flex"
        flexDirection="column"
        boxShadow="xl"
      >
        {/* Header */}
        <Box
          bg="purple.50"
          borderTopRadius={isMobile ? "none" : "xl"}
          px={6}
          py={4}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <Flex align="center" justify="space-between">
            <Flex align="center" gap={3}>
              <Icon as={FiFilter} boxSize={5} color="purple.600" />
              <Text fontSize="lg" fontWeight="bold" color="gray.800">
                Filter Reports
              </Text>
              {hasActiveFilters() && (
                <Badge colorScheme="purple" borderRadius="full" px={2} py={1}>
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Flex>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close filter modal"
            >
              <Icon as={FiX} boxSize={4} />
            </Button>
          </Flex>
        </Box>
        
        {/* Body */}
        <Box p={6} overflowY="auto" flex={1}>
          <Flex direction="column" gap={6} align="stretch">
            {/* Date Range Filter */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Date Range
              </Text>
               <Flex direction="row" gap={3} align="start">
                <Box flex={1}>
                   <Text fontSize="sm" color="gray.600" mb={2}>
                     Start Date
                   </Text>
                  <DateInput
                    value={tempFilters.dateRange.startDate}
                    onChange={handleStartDateChange}
                    placeholder="Select start date"
                    ariaLabel="Filter start date"
                  />
                </Box>
                <Box flex={1}>
                   <Text fontSize="sm" color="gray.600" mb={2}>
                     End Date
                   </Text>
                  <DateInput
                    value={tempFilters.dateRange.endDate}
                    onChange={handleEndDateChange}
                    placeholder="Select end date"
                    ariaLabel="Filter end date"
                  />
                </Box>
              </Flex>
            </Box>

            <Box h="1px" bg="gray.200" my={4} />

            {/* Status Filter */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Visitor Status
              </Text>
               <Box>
                 <select
                   value={tempFilters.status.length > 0 ? tempFilters.status[0] : "all"}
                   onChange={handleStatusChange}
                   style={{
                     width: "100%",
                     padding: "8px 12px",
                     border: "1px solid #d1d5db",
                     borderRadius: "6px",
                     backgroundColor: "white",
                     fontSize: "14px",
                   }}
                 >
                   <option value="all">All Status</option>
                   <option value="pending">Pending</option>
                   <option value="approved">Approved</option>
                   <option value="rejected">Rejected</option>
                   <option value="checked-in">Checked In</option>
                   <option value="checked-out">Checked Out</option>
                 </select>
               </Box>
            </Box>

            <Box h="1px" bg="gray.200" my={4} />

            {/* Company Filter */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Company
              </Text>
               <Box>
                 <select
                   value={tempFilters.company}
                   onChange={handleCompanyChange}
                   style={{
                     width: "100%",
                     padding: "8px 12px",
                     border: "1px solid #d1d5db",
                     borderRadius: "6px",
                     backgroundColor: "white",
                     fontSize: "14px",
                   }}
                 >
                   <option value="">All Companies</option>
                   <option value="HCM Cafe">HCM Cafe</option>
                   <option value="Tech Corp">Tech Corp</option>
                   <option value="Innovation Labs">Innovation Labs</option>
                   <option value="Global Solutions">Global Solutions</option>
                 </select>
               </Box>
            </Box>

            <Box h="1px" bg="gray.200" my={4} />

            {/* Report Type Filter */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={3} color="gray.700">
                Report Type
              </Text>
               <Box>
                 <select
                   value={tempFilters.reportType}
                   onChange={handleReportTypeChange}
                   style={{
                     width: "100%",
                     padding: "8px 12px",
                     border: "1px solid #d1d5db",
                     borderRadius: "6px",
                     backgroundColor: "white",
                     fontSize: "14px",
                   }}
                 >
                   <option value="summary">Summary Report</option>
                   <option value="detailed">Detailed Report</option>
                 </select>
               </Box>
            </Box>
           </Flex>
        </Box>

        {/* Action Buttons */}
        <Box p={6} pt={0} borderTop="1px solid" borderColor="gray.200">
           <Flex direction="row" gap={3} justify="flex-end">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              color="gray.600"
              borderColor="gray.300"
              _hover={{ bg: "gray.50" }}
            >
              Clear All
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleApplyFilters}
              bg="purple.600"
              _hover={{ bg: "purple.700" }}
              minW="120px"
            >
              Apply Filters
            </Button>
          </Flex>
        </Box>
      </Box>
    </>
  );
};

export default FilterModal;
