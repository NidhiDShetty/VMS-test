import { ReactNode } from 'react';
import { Box } from '@chakra-ui/react';

const DashboardiLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Box minH="100vh" bg="gray.50">
      {children}
    </Box>
  );
};

export default DashboardiLayout; 