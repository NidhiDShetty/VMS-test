"use client";

import { useState, useEffect } from "react";

const useBreakpoint = () => {
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      const isDesktopDevice = width >= 1024;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      setIsDesktop(isDesktopDevice);
    };

    // Check on mount
    checkBreakpoint();
    setIsHydrated(true);

    // Add event listener
    if (typeof window !== 'undefined') {
      window.addEventListener("resize", checkBreakpoint);
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener("resize", checkBreakpoint);
      }
    };
  }, []);

  return { isMobile, isTablet, isDesktop, isHydrated };
};

export default useBreakpoint;
