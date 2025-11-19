"use client";

import { Box, Image } from "@chakra-ui/react";
import type { FC } from "react";
import { FRONTEND_URL } from "@/lib/server-urls";

const SplashScreen: FC = () => {
  return (
    <Box
      minH="100vh"
      minW="100vw"
      bg="white"
      position="relative"
      overflow="hidden"
      tabIndex={0}
      aria-label="Splash screen for HCM Cafe's VMS"
    >
      <Image
        src={`${FRONTEND_URL}/splashscreen.svg`}
        alt="Splash screen"
        objectFit="contain"
        width="100vw"
        height="100vh"
        position="absolute"
        top={0}
        left={0}
        zIndex={0}
      />
    </Box>
  );
};

export default SplashScreen;
