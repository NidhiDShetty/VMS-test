import { Box, Flex, Text } from '@chakra-ui/react';
import Image from 'next/image';

const profile = {
  name: 'James Davis!',
  phone: '+91-8838666666',
  email: 'Jamesdavis@gmail.com',
  department: 'IT Security',
  gender: 'Male',
  role: 'Admin',
  
  image: 'https://randomuser.me/api/portraits/men/32.jpg',
};

const labelStyle = {
  fontWeight: 'bold',
  color: 'gray.700',
  fontSize: 'sm',
};
const valueStyle = {
  color: 'gray.800',
  fontSize: 'sm',
  textAlign: 'right' as const,
};

const CardProfile = () => (
  <Flex direction="column" align="center" w="full" maxW="sm" mx="auto" pt={12} pb={8} bg="white">
    {/* Profile Image - centered above card */}
    <Box
      position="relative"
      zIndex={2}
      mt={-16}
      mb={-10}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Box
        w="80px"
        h="80px"
        borderRadius="full"
        overflow="hidden"
        boxShadow="0 12px 32px 0 rgba(0,0,0,0.12)"
        border="4px solid #fff"
        bg="gray.200"
      >
        <Image
          src={profile.image}
          alt="Profile"
          width={80}
          height={80}
          style={{ objectFit: 'cover', borderRadius: '9999px', width: '100%', height: '100%' }}
        />
      </Box>
    </Box>
    {/* Card Container */}
    <Box
      bg="#f3f2fd"
      borderRadius="lg"
      boxShadow="md"
      px={8}
      pt={16}
      pb={8}
      w="full"
      maxW="sm"
      mt={0}
      position="relative"
      zIndex={1}
    >
      <Flex direction="column" gap={4}>
        {/* Host Name */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Name :</Text>
          <Text {...valueStyle}>{profile.name}</Text>
        </Flex>
        {/* Phone No */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Phone No :</Text>
          <Text {...valueStyle}>{profile.phone}</Text>
        </Flex>
        {/* Email */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Email :</Text>
          <Text {...valueStyle}>{profile.email}</Text>
        </Flex>
        {/* Department */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Department :</Text>
          <Text {...valueStyle}>{profile.department}</Text>
        </Flex>
        {/* Gender */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Gender :</Text>
          <Text {...valueStyle}>{profile.gender}</Text>
        </Flex>
        {/* Role */}
        <Flex justify="space-between" align="center">
          <Text {...labelStyle}>Role :</Text>
          <Text {...valueStyle}>{profile.role}</Text>
        </Flex>
       
        
      </Flex>
    </Box>
  </Flex>
);

export default CardProfile; 