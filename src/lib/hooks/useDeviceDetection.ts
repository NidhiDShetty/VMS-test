"use client";

import { useState, useEffect } from "react";

const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(true); // Default to mobile for SSR
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      
      // Check if it's a mobile device based on user agent
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // For invite card behavior: only consider it mobile if it's actually a mobile device (user agent)
      // Don't use screen width for this decision as web browsers can have narrow windows
      const isMobileDevice = isMobileUserAgent;
      
      setIsMobile(isMobileDevice);
    };

    checkDevice();
    setIsHydrated(true);

    // Add resize listener
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return { isMobile, isHydrated };
};

export default useDeviceDetection;
