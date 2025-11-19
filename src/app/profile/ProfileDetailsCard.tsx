import { Box, Flex, Text } from '@chakra-ui/react';

export interface ProfileField {
  label: string;
  value: string;
  valueColor?: string;
}

interface ProfileDetailsCardProps {
  fields: ProfileField[];
}

const ProfileDetailsCard: React.FC<ProfileDetailsCardProps> = ({ fields }) => (
  <Box
    bg="#f3f2fd"
    borderRadius="lg"
    boxShadow="0 2px 16px rgba(95,36,172,0.27)"
    px={4}
    py={6}
    // mt={5}
    w={{ base: "95%", md: "500px" }} // 95% for mobile, fixed 500px for web
    mx="auto" mt={{ base: "30px", md: "0" }}
    // minH="300px"
  >
    <Flex direction="column" gap={4}>
      {fields.map((field) => (
        <Flex key={field.label} justify="space-between" align={field.label.toLowerCase().includes('location') ? "flex-start" : "center"} gap={2} py={1}>
          <Text fontWeight="600" color="gray.600" fontSize="14px" flexShrink={0} minW="100px" fontFamily="Roboto, sans-serif">
            {field.label}
          </Text>
          {field.label.toLowerCase().includes('location') ? (
            <Text
              fontSize="14px"
              color={field.valueColor || 'gray.800'}
              textAlign="right"
              flex="1"
              fontFamily="Roboto, sans-serif"
              wordBreak="break-word"
              whiteSpace="pre-wrap"
            >
              {field.value}
            </Text>
          ) : (
            <Text
              fontSize="14px"
              color={field.valueColor || 'gray.800'}
              textAlign="right"
              flex="1"
              fontFamily="Roboto, sans-serif"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
            >
              {field.value}
            </Text>
          )}
        </Flex>
      ))}
    </Flex>
  </Box>
);

export default ProfileDetailsCard; 