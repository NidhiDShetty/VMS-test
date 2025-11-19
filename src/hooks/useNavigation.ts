"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { INTERNAL_ROUTES } from "@/lib/server-urls";

export const useNavigation = () => {
  const router = useRouter();

  const safeBack = useCallback(() => {
    try {
      // Check if there's a proper history to go back to
      if (window.history.length > 1) {
        router.back();
      } else {
        // No history available, navigate to dashboard as fallback
        router.push(INTERNAL_ROUTES.DASHBOARD);
      }
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to dashboard on any navigation error
      router.push(INTERNAL_ROUTES.DASHBOARD);
    }
  }, [router]);

  const navigateTo = useCallback((path: string) => {
    try {
      router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to dashboard on any navigation error
      router.push(INTERNAL_ROUTES.DASHBOARD);
    }
  }, [router]);

  const replaceWith = useCallback((path: string) => {
    try {
      router.replace(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to dashboard on any navigation error
      router.push(INTERNAL_ROUTES.DASHBOARD);
    }
  }, [router]);

  return {
    safeBack,
    navigateTo,
    replaceWith,
    // Keep the original router available for specific use cases
    router,
  };
};
