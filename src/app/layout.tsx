"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { INTERNAL_ROUTES } from "@/lib/server-urls";
import { Provider } from "@/components/ui/provider";
import SplashScreen from "@/components/ui/SplashScreen";
import { Toaster } from "@/components/ui/toaster";
import { App as CapacitorApp } from "@capacitor/app";
import "./globals.css";
import type { PluginListenerHandle } from "@capacitor/core";
import { VisitorPreviewProvider } from "@/app/visitor/add/VisitorPreviewContext";
import { EdgeToEdgeInit } from "@/components/edge-to-edge-init";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check for initial splash screen
    const splashSeen = sessionStorage.getItem("splashSeen");
    const justLoggedIn = sessionStorage.getItem("justLoggedIn");

    // If user just logged in, skip initial splash
    if (justLoggedIn) {
      sessionStorage.removeItem("justLoggedIn");
      setShowSplash(false);
      return;
    }

    if (splashSeen) {
      setShowSplash(false);
    } else {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem("splashSeen", "true");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Handle authentication routing after initial splash - only run once
    if (!showSplash && !authChecked) {
      // Check if user is logged in using authData instead of currentUser
      const authData = localStorage.getItem("authData");
      // Only redirect to dashboard if on login page
      if (authData && typeof window !== "undefined") {
        const path = window.location.pathname;
        const normalizedPath = path.replace(/^\/vmsapp/, "");

        // Only redirect if on root/login page (handles both / and /vmsapp/)
        if (
          normalizedPath === "/" ||
          normalizedPath === "" ||
          path === "/vmsapp/" ||
          path === "/vmsapp"
        ) {
          try {
            JSON.parse(authData); // Validate auth data
            // User is logged in, redirect to dashboard
            router.push(INTERNAL_ROUTES.DASHBOARD);
          } catch {
            // Invalid auth data, clear it and stay on login page
            localStorage.removeItem("authData");
          }
        }
      }
      // Mark auth check as complete
      setAuthChecked(true);
      setIsLoading(false);
    }
  }, [showSplash, authChecked, router]);

  useEffect(() => {
    // Add meta tags for orientation lock
    const addOrientationMetaTags = () => {
      if (typeof document !== "undefined") {
        // Remove existing orientation meta tags if any
        const existingTags = document.querySelectorAll(
          'meta[name="screen-orientation"], meta[name="orientation"]'
        );
        existingTags.forEach((tag) => tag.remove());

        // Add viewport meta tag with orientation lock
        let viewportMeta = document.querySelector('meta[name="viewport"]');
        if (!viewportMeta) {
          viewportMeta = document.createElement("meta");
          viewportMeta.setAttribute("name", "viewport");
          document.head.appendChild(viewportMeta);
        }
        viewportMeta.setAttribute(
          "content",
          "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        );

        // Add screen orientation meta tags
        const screenOrientationMeta = document.createElement("meta");
        screenOrientationMeta.setAttribute("name", "screen-orientation");
        screenOrientationMeta.setAttribute("content", "portrait");
        document.head.appendChild(screenOrientationMeta);

        const orientationMeta = document.createElement("meta");
        orientationMeta.setAttribute("name", "orientation");
        orientationMeta.setAttribute("content", "portrait");
        document.head.appendChild(orientationMeta);
      }
    };

    // Lock screen orientation to portrait mode using Screen Orientation API
    const lockScreenOrientation = async () => {
      if (typeof window !== "undefined" && typeof screen !== "undefined") {
        try {
          // Check if Screen Orientation API is available
          const screenWithOrientation = screen as unknown as {
            orientation?: {
              lock?: (orientation: string) => Promise<void>;
            };
            mozOrientation?: {
              lock?: (orientation: string) => Promise<void>;
            };
            msOrientation?: {
              lock?: (orientation: string) => Promise<void>;
            };
          };

          if (screenWithOrientation.orientation?.lock) {
            await screenWithOrientation.orientation.lock("portrait");
          } else if (screenWithOrientation.mozOrientation?.lock) {
            // Firefox
            await screenWithOrientation.mozOrientation.lock("portrait");
          } else if (screenWithOrientation.msOrientation?.lock) {
            // IE/Edge
            await screenWithOrientation.msOrientation.lock("portrait");
          }
        } catch (error) {
          // Orientation lock may fail if not supported or user interaction required
          // This is expected in some browsers/apps, so we silently handle it
          console.log("Screen orientation lock not available:", error);
        }
      }
    };

    // Add meta tags immediately
    addOrientationMetaTags();

    // Lock orientation on mount and when orientation changes
    lockScreenOrientation();

    // Listen for orientation changes and re-lock if needed
    const handleOrientationChange = () => {
      lockScreenOrientation();
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    let backHandler: PluginListenerHandle | undefined;

    // Function to handle back button logic
    const handleBackButton = () => {
      const path = window.location.pathname;

      // Normalize path to handle with or without /vmsapp prefix
      const normalizedPath = path.replace(/^\/vmsapp/, "");

      console.log(
        "Back button pressed. Path:",
        path,
        "Normalized:",
        normalizedPath
      );

      // If on login page or root path, exit app instead of going back
      if (normalizedPath === "/" || normalizedPath === "") {
        console.log("On root/login page - exiting app");
        CapacitorApp.exitApp();
        return;
      }

      // If on dashboard (with or without /vmsapp prefix), exit app
      if (normalizedPath === "/dashboard" || normalizedPath === "/dashboard/") {
        console.log("On dashboard - exiting app");
        CapacitorApp.exitApp();
        return;
      }

      console.log("Not on root or dashboard - going back");
      // For other pages, try to go back or fallback to dashboard
      try {
        // Check if there's a history to go back to
        if (window.history.length > 1) {
          router.back();
        } else {
          // No history, navigate to dashboard as fallback
          router.push(INTERNAL_ROUTES.DASHBOARD);
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback to dashboard on any navigation error
        router.push(INTERNAL_ROUTES.DASHBOARD);
      }
    };

    const setupBackButton = async () => {
      // Add Capacitor back button listener
      backHandler = await CapacitorApp.addListener(
        "backButton",
        handleBackButton
      );
    };

    // Check if we're in a Capacitor environment
    const isCapacitor =
      typeof (window as { Capacitor?: unknown }).Capacitor !== "undefined";

    // Also handle browser popstate as fallback (only for web, not in Capacitor)
    const handlePopState = (e: PopStateEvent) => {
      if (!isCapacitor) {
        e.preventDefault();
        handleBackButton();
      }
    };

    setupBackButton();

    // Only add popstate listener if not in Capacitor environment
    if (!isCapacitor) {
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      backHandler?.remove();
      if (!isCapacitor) {
        window.removeEventListener("popstate", handlePopState);
      }
    };
  }, [router]);

  // Show splash while loading or checking auth
  if (showSplash || isLoading || !authChecked) {
    return (
      <html suppressHydrationWarning>
        <body>
          <Provider>
            <SplashScreen />
          </Provider>
        </body>
      </html>
    );
  }

  // Render children (login page or dashboard based on auth)
  return (
    <html suppressHydrationWarning>
      <body>
        <Provider>
          <Toaster />
          <EdgeToEdgeInit />
          <VisitorPreviewProvider>{children}</VisitorPreviewProvider>
        </Provider>
      </body>
    </html>
  );
}
