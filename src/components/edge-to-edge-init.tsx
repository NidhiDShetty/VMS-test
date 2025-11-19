"use client";

import { useEffect } from "react";

export function EdgeToEdgeInit() {
  useEffect(() => {
    const init = async () => {
      // Only run in Capacitor environment (not during Next.js build/web)
      if (typeof window === "undefined") return;

      const isCapacitor =
        typeof (window as { Capacitor?: unknown }).Capacitor !== "undefined";

      if (!isCapacitor) return;

      try {
        // Dynamically import Capacitor plugins only when needed
        const [{ EdgeToEdge }, { StatusBar, Style }] = await Promise.all([
          import("@capawesome/capacitor-android-edge-to-edge-support"),
          import("@capacitor/status-bar"),
        ]);

        // Enable Android edge-to-edge behavior
        await EdgeToEdge.enable();

        // Set purple background for status + nav bars
        await EdgeToEdge.setBackgroundColor({ color: "#8A38F5" });

        // Make sure the status bar itself matches the app background
        await StatusBar.setBackgroundColor({ color: "#8A38F5" });

        // White icons (for dark backgrounds)
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        // Silently fail if plugins are not available (e.g., during web build)
        console.warn("EdgeToEdgeInit error:", err);
      }
    };

    init();
  }, []);

  return null;
}
