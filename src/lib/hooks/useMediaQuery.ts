"use client";

import { useState, useEffect } from "react";

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    
    const updateMatches = () => {
      setMatches(media.matches);
    };

    // Set initial value
    updateMatches();
    setIsHydrated(true);

    // Add listener
    media.addEventListener('change', updateMatches);

    // Cleanup
    return () => media.removeEventListener('change', updateMatches);
  }, [query]);

  return { matches, isHydrated };
};

export default useMediaQuery;
