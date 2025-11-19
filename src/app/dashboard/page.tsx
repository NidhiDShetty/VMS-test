"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Input,
  Heading,
  Avatar,
} from "@chakra-ui/react";
import ActionCard from "./ActionCard";
import ProductCard from "./ProductCard";
import DashboardHeader from "./DashboardHeader";
import Image from "next/image";
import FooterMenuNavigation from "./FooterMenuNavigation";
import { useRouter } from "next/navigation";
import { fetchCompanyInvitations } from "../companies-log/api";
import { fetchAllVisitors, getVisitorsByHost } from "@/app/api/visitor/routes";
import Logo from "@/components/svgs/logo";
import {
  getProfileData,
  ProfileResponse,
  getProfileImage,
} from "../api/profile/routes";
import InviteModal from "@/components/modals/InviteModal";
import useDeviceDetection from "@/lib/hooks/useDeviceDetection";
import { toaster } from "@/components/ui/toaster";
import LogoutConfirmationModal from "@/components/modals/visitors/LogoutConfirmationModal";
import DesktopHeader from "@/components/DesktopHeader";
import { useUserData } from "@/lib/hooks/useUserData";
import { FRONTEND_URL, INTERNAL_ROUTES } from "@/lib/server-urls";

// Utility: Map roleName to route
const getRouteForRole = (roleName: string): string => {
  const roleRouteMap: Record<string, string> = {
    SuperAdmin: INTERNAL_ROUTES.DASHBOARD,
    Admin: INTERNAL_ROUTES.DASHBOARD,
    Security: INTERNAL_ROUTES.DASHBOARD,
    Host: INTERNAL_ROUTES.DASHBOARD,
    Employee: INTERNAL_ROUTES.EMPLOYEE_LIST,
    // Add more roles as needed
  };
  return roleRouteMap[roleName] || INTERNAL_ROUTES.DASHBOARD;
};

// Use the same UserRole type as in dummyUsers.ts
type UserRole = "Admin" | "SuperAdmin" | "Host" | "Security";

type Action = {
  icon: React.ReactNode;
  description: string;
  actionLabel: string;
  bg: string;
  borderColor: string;
  iconBg: string;
  iconBorderColor: string;
  boxShadow?: string;
  ariaLabel: string;
  onClick?: () => void;
};

type Insight = {
  label: string;
  value: string;
  bg: string;
  valueColor: string;
  boxShadow?: string;
  borderColor?: string;
  ariaLabel: string;
};

type Visitor = {
  id: number;
  fullName: string;
  phoneNumber: string;
  gender?: string;
  idType?: string;
  idNumber?: string;
  date?: string;
  time?: string;
  comingFrom: string;
  companyName?: string;
  location?: string;
  purposeOfVisit?: string;
  imgUrl?: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  hostDetails?: string;
  assets?: string;
  guest?: string;
  createdAt: string;
  updatedAt: string;
};

const DashboardPage = () => {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Use user data hook to get role and user information
  const { userData, loading: userLoading, error: userError } = useUserData();

  // Get role from JWT token directly (more reliable than API)
  const [jwtRole, setJwtRole] = useState<string | null>(null);

  useEffect(() => {
    const authDataRaw = localStorage.getItem("authData");
    if (authDataRaw) {
      try {
        const parsed = JSON.parse(authDataRaw);
        const token = parsed?.token;

        if (token) {
          // Decode JWT token to get the authoritative role
          try {
            const tokenParts = token.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const role = payload.roleName || "User";
              setJwtRole(role);
            }
          } catch (decodeError) {
            console.warn("Failed to decode JWT token:", decodeError);
          }
        }
      } catch (error) {
        console.warn("Failed to parse authData:", error);
      }
    }
  }, []);

  // Device detection for invite card behavior
  const { isMobile, isHydrated } = useDeviceDetection();

  // Smart invite handler - routes to page on mobile, shows modal on web
  const handleInviteClick = useCallback(() => {
    if (!isHydrated) return; // Wait for hydration

    if (isMobile) {
      // Mobile: Navigate to full page
      router.push(INTERNAL_ROUTES.INVITE_VISITOR);
    } else {
      // Web: Show modal
      setIsInviteModalOpen(true);
    }
  }, [isMobile, isHydrated, router]);

  const handleConfirmLogout = () => {
    // Clear all auth data
    localStorage.removeItem("authData");
    sessionStorage.removeItem("splashSeen");
    sessionStorage.removeItem("signinSplashSeen");
    sessionStorage.removeItem("justLoggedIn");

    // Clear any cached profile data to prevent loading issues
    sessionStorage.removeItem("profileData");
    sessionStorage.removeItem("profileImage");

    // Show success message
    toaster.success({
      title: "Logout successful",
      description: "You have been logged out.",
    });

    // Use window.location for a full page reload to ensure clean state
    // This prevents Next.js router issues during logout and clears navigation history
    window.location.href = "/vmsapp/";
  };

  // Web dashboard profile data
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Add state for company invitations and loading/error
  const [companyInvitations, setCompanyInvitations] = useState<
    null | unknown[]
  >(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState(0);
  const [todayCheckOut, setTodayCheckOut] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  const [hostInsights, setHostInsights] = useState({
    upcoming: 0,
    pending: 0,
    completed: 0,
  });

  // Add date selection state for host role
  const [selectedDateType, setSelectedDateType] = useState<
    "today" | "tomorrow" | "custom"
  >("today");
  const [customDate, setCustomDate] = useState<string>("");
  const [isCancelClicked, setIsCancelClicked] = useState<boolean>(false);
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  // Web dashboard date/time formatting
  const formatWebDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatWebTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = date.getHours() >= 12 ? "PM" : "AM";
    return `${hours}:${minutes} ${ampm}`;
  };

  const getWebDayName = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  // Handle date type change
  const handleDateTypeChange = (dateType: "today" | "tomorrow" | "custom") => {
    setSelectedDateType(dateType);
    if (dateType === "custom") {
      // Don't prefill with today's date - wait for user input
      if (!customDate) {
        setCustomDate("");
      }
    } else {
      // Clear custom date when switching to today or tomorrow
      setCustomDate("");
    }
  };

  // Handle custom date change
  const handleCustomDateChange = (date: string) => {
    setCustomDate(date);
    setSelectedDateType("custom");

    // Don't hide the picker automatically - let it stay open
    // The picker will close when user clicks outside or selects a date
  };

  // Helper to open and focus the custom date picker
  const openCustomDatePicker = useCallback(() => {
    // Don't open picker if cancel was just clicked
    if (isCancelClicked) {
      setIsCancelClicked(false);
      return;
    }

    // Do not preventDefault/stopPropagation here; mobile needs the user gesture.
    // Don't prefill with today's date - wait for user input
    if (!customDate) {
      setCustomDate("");
    }

    setSelectedDateType("custom");

    // Ensure input exists before focusing
    requestAnimationFrame(() => {
      const input = datePickerRef.current;
      if (!input) return;

      // Make input invisible but positioned below the tab
      input.style.opacity = "0";
      input.style.pointerEvents = "auto";
      input.style.overflow = "hidden";
      input.style.visibility = "visible";
      input.style.position = "absolute";
      input.style.top = "100%";
      input.style.zIndex = "10";

      // Check if we're on web (md breakpoint and above)
      const isWeb = window.innerWidth >= 768; // md breakpoint

      if (isWeb) {
        // Web version: position calendar below the custom date badge
        input.style.width = "200px";
        input.style.height = "40px";

        // Find the custom date badge and position calendar below it
        const customDateBadge = document.querySelector(
          '[aria-label="Select custom date"]'
        );
        if (customDateBadge) {
          const badgeRect = customDateBadge.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft =
            window.pageXOffset || document.documentElement.scrollLeft;

          // Position calendar below the badge, centered
          input.style.position = "fixed";
          input.style.top = `${badgeRect.bottom + scrollTop + 5}px`;
          input.style.left = `${
            badgeRect.left + scrollLeft + badgeRect.width / 2
          }px`;
          input.style.transform = "translateX(-50%)";
        } else {
          // Fallback positioning
          input.style.position = "fixed";
          input.style.top = "100px";
          input.style.left = "50%";
          input.style.transform = "translateX(-50%)";
        }
      } else {
        // Mobile version: use original positioning
        input.style.width = "1px";
        input.style.height = "1px";
        input.style.position = "absolute";
        input.style.top = "100%";
        input.style.left = "0";
        input.style.transform = "none";
      }

      // 1) Focus helps iOS Safari open the calendar UI
      input.focus({ preventScroll: true });

      // 2) Chromium: explicitly open the native picker
      if (
        typeof (input as HTMLInputElement & { showPicker?: () => void })
          .showPicker === "function"
      ) {
        try {
          (input as HTMLInputElement & { showPicker: () => void }).showPicker();
        } catch {
          // Retry shortly if timing caused an exception
          setTimeout(() => {
            input.focus({ preventScroll: true });
            if (
              typeof (input as HTMLInputElement & { showPicker?: () => void })
                .showPicker === "function"
            ) {
              try {
                (
                  input as HTMLInputElement & { showPicker: () => void }
                ).showPicker();
              } catch {
                /* noop */
              }
            }
          }, 50);
        }
      } else {
        // Non-Chromium fallback: a tiny delay sometimes helps iOS
        setTimeout(() => input.focus({ preventScroll: true }), 50);
      }
    });
  }, [customDate, isCancelClicked]);

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Custom Date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle role-based routing when user data is loaded
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    if (userLoading) return; // Wait for user data to load

    if (userError) {
      console.error("[Dashboard] Error loading user data:", userError);
      router.replace(INTERNAL_ROUTES.LOGIN); // Not logged in or error, go to login
      return;
    }

    if (!userData && !jwtRole) {
      router.replace(INTERNAL_ROUTES.LOGIN); // No user data, go to login
      return;
    }

    // Use JWT role if available, fallback to userData role
    const roleName = jwtRole || userData?.roleName;

    // Allow SuperAdmin/Admin/Security/Host on dashboard
    const normalizedRoleName = roleName?.toLowerCase();
    if (
      normalizedRoleName !== "superadmin" &&
      normalizedRoleName !== "admin" &&
      normalizedRoleName !== "security" &&
      normalizedRoleName !== "host"
    ) {
      const route = getRouteForRole(roleName || "User");
      router.replace(route);
    }
  }, [userData, userLoading, userError, jwtRole, router]);

  // Load profile data for web dashboard
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const [profileResponse, imageData] = await Promise.all([
          getProfileData(),
          getProfileImage(),
        ]);

        // Safely handle the response - check if profile exists
        if (profileResponse && profileResponse.profile) {
          // Only set image if it exists
          if (imageData?.success && imageData.data?.imageData) {
            profileResponse.profile.profileImageUrl = imageData.data.imageData;
          } else {
            profileResponse.profile.profileImageUrl = null;
          }
          setProfileData(profileResponse);
        } else {
          console.warn("Profile data structure invalid, setting to null");
          setProfileData(null);
        }
      } catch (error) {
        console.warn(
          "Failed to load profile data, continuing without it:",
          error
        );
        // Set to null but don't break the app
        setProfileData(null);
      }
    };

    loadProfileData();

    // Listen for profile updates
    const handleProfileUpdate = () => {
      loadProfileData();
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);

  // Update date/time every second for web dashboard
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Normalize role: Use JWT role as source of truth (more reliable than API)
  // Admin and Security share the same dashboard
  const roleToUse = jwtRole || userData?.roleName;
  const effectiveRole = roleToUse
    ? roleToUse === "Admin" ||
      roleToUse === "admin" ||
      roleToUse === "Security" ||
      roleToUse === "security"
      ? "Admin"
      : roleToUse === "SuperAdmin" || roleToUse === "superadmin"
      ? "SuperAdmin"
      : roleToUse === "Host" || roleToUse === "host"
      ? "Host"
      : null
    : null;

  useEffect(() => {
    if (effectiveRole === "SuperAdmin") {
      setInsightsLoading(true);
      fetchCompanyInvitations()
        .then((data) => {
          setCompanyInvitations(data);
          setInsightsError(null);
        })
        .catch((error) => {
          console.error(
            "[Dashboard] SuperAdmin - Error fetching company invitations:",
            error
          );
          setInsightsError("Failed to load insights");
          setCompanyInvitations([]);
        })
        .finally(() => setInsightsLoading(false));
    }
  }, [effectiveRole]);

  // Fetch host visitors when effectiveRole is Host
  useEffect(() => {
    if (effectiveRole === "Host" && userData) {
      const authDataRaw = localStorage.getItem("authData");
      if (authDataRaw) {
        const parsed = JSON.parse(authDataRaw);
        const token = parsed?.token;
        if (token) {
          getVisitorsByHost(token)
            .then((data) => {
              const visitors = data.visitors || [];

              if (!visitors || visitors.length === 0) {
                setHostInsights({ upcoming: 0, pending: 0, completed: 0 });
                return;
              }

              // Get the target date based on selection
              let targetDate: string;
              if (selectedDateType === "today") {
                targetDate = new Date().toISOString().slice(0, 10);
              } else if (selectedDateType === "tomorrow") {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                targetDate = tomorrow.toISOString().slice(0, 10);
              } else {
                targetDate = customDate;
              }

              let upcoming = 0,
                completed = 0,
                pending = 0;

              visitors.forEach((v: Visitor) => {
                let visitDate: string | null = null;

                if (v.date) {
                  if (v.date.includes("-")) {
                    visitDate = v.date.slice(0, 10);
                  } else {
                    try {
                      const parsedDate = new Date(v.date);
                      if (!isNaN(parsedDate.getTime())) {
                        visitDate = parsedDate.toISOString().slice(0, 10);
                      }
                    } catch {
                      console.warn("[Dashboard] Could not parse date:", v.date);
                    }
                  }
                }

                if (visitDate === targetDate) {
                  const status = v.status?.toUpperCase();

                  if (status === "CHECKED_IN") {
                    pending++;
                  } else if (status === "APPROVED") {
                    upcoming++;
                  } else if (status === "CHECKED_OUT") {
                    completed++;
                  }
                }
              });

              setHostInsights({ upcoming, pending, completed });
            })
            .catch((error) => {
              console.error("[Dashboard] Error fetching host visitors:", error);
              setHostInsights({ upcoming: 0, pending: 0, completed: 0 });
            });
        }
      }
    }
  }, [effectiveRole, selectedDateType, customDate, userData]);

  // Fetch Admin/Security visitors when effectiveRole is Admin
  useEffect(() => {
    if (effectiveRole === "Admin" && userData) {
      const authDataRaw = localStorage.getItem("authData");
      if (authDataRaw) {
        const parsed = JSON.parse(authDataRaw);
        const token = parsed?.token;
        if (token) {
          fetchAllVisitors(token)
            .then((data) => {
              const visitors = data.visitors || [];
              const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
              let checkIn = 0,
                checkOut = 0;

              visitors.forEach((v: Visitor) => {
                const visitDate = v.checkInTime
                  ? v.checkInTime.slice(0, 10)
                  : v.date?.slice(0, 10) || undefined;
                if (visitDate === today) {
                  if (["CHECKED_IN", "CHECK_IN"].includes(v.status)) {
                    checkIn++;
                  }
                  if (v.status === "CHECKED_OUT") {
                    checkOut++;
                  }
                }
              });

              setTodayCheckIn(checkIn);
              setTodayCheckOut(checkOut);
              setTodayTotal(checkIn + checkOut);
            })
            .catch((error) => {
              console.error(
                "[Dashboard] Admin - Error fetching visitors:",
                error
              );
              setTodayCheckIn(0);
              setTodayCheckOut(0);
              setTodayTotal(0);
            });
        }
      }
    }
  }, [effectiveRole, userData]);

  // Role-based insights
  const insights: Insight[] = useMemo(() => {
    if (effectiveRole === "SuperAdmin") {
      if (insightsLoading) {
        return [
          {
            label: "Companies",
            value: "-",
            bg: "#F4EDFE",
            valueColor: "#5f24ac",
            borderColor: "#D2B0FF",
            boxShadow: "inset 0 1px 8px #D2B0FF",
            ariaLabel: "Loading companies",
          },
          {
            label: "Active",
            value: "-",
            bg: "#DDECE7",
            valueColor: "#1d6e4f",
            borderColor: "#00F08B4D",
            boxShadow: "inset 0 1px 8px #00F08B4D",
            ariaLabel: "Loading active",
          },
          {
            label: "Pending",
            value: "-",
            bg: "#F0E6E4",
            valueColor: "#af2a1a",
            borderColor: "#FFCBC5",
            boxShadow: "inset 0 1px 8px #FFCBC5",
            ariaLabel: "Loading pending",
          },
        ];
      }
      if (insightsError) {
        return [
          {
            label: "Companies",
            value: "-",
            bg: "#F4EDFE",
            valueColor: "#5f24ac",
            borderColor: "#D2B0FF",
            boxShadow: "inset 0 1px 8px #D2B0FF",
            ariaLabel: "Error loading companies",
          },
          {
            label: "Active",
            value: "-",
            bg: "#DDECE7",
            valueColor: "#1d6e4f",
            borderColor: "#00F08B4D",
            boxShadow: "inset 0 1px 8px #00F08B4D",
            ariaLabel: "Error loading active",
          },
          {
            label: "Pending",
            value: "-",
            bg: "#F0E6E4",
            valueColor: "#af2a1a",
            borderColor: "#FFCBC5",
            boxShadow: "inset 0 1px 8px #FFCBC5",
            ariaLabel: "Error loading pending",
          },
        ];
      }
      // Real data - using correct status values from database
      const total = companyInvitations ? companyInvitations.length : 0;
      const active = companyInvitations
        ? companyInvitations.filter(
            (c) => (c as { status: string }).status === "Accepted"
          ).length
        : 0;
      const pending = companyInvitations
        ? companyInvitations.filter(
            (c) => (c as { status: string }).status === "Pending"
          ).length
        : 0;
      return [
        {
          label: "Companies",
          value: String(total).padStart(2, "0"),
          bg: "#F4EDFE",
          valueColor: "#5f24ac",
          borderColor: "#D2B0FF",
          boxShadow: "inset 0 1px 8px #D2B0FF",
          ariaLabel: `${total} companies`,
        },
        {
          label: "Active",
          value: String(active).padStart(2, "0"),
          bg: "#DDECE7",
          valueColor: "#1d6e4f",
          borderColor: "#00F08B4D",
          boxShadow: "inset 0 1px 8px #00F08B4D",
          ariaLabel: `${active} active`,
        },
        {
          label: "Pending",
          value: String(pending).padStart(2, "0"),
          bg: "#F0E6E4",
          valueColor: "#af2a1a",
          borderColor: "#FFCBC5",
          boxShadow: "inset 0 1px 8px #FFCBC5",
          ariaLabel: `${pending} pending`,
        },
      ];
    }
    if (effectiveRole === "Host") {
      return [
        {
          label: "Upcoming",
          value: String(hostInsights.upcoming).padStart(2, "0"),
          bg: "#F4EDFE",
          valueColor: "#5f24ac",
          borderColor: "#D2B0FF",
          boxShadow: "inset 0 1px 8px #D2B0FF",
          ariaLabel: `${hostInsights.upcoming} upcoming`,
        },
        {
          label: "Completed",
          value: String(hostInsights.completed).padStart(2, "0"),
          bg: "#DDECE7",
          valueColor: "#1d6e4f",
          borderColor: "#00F08B4D",
          boxShadow: "inset 0 1px 8px #00F08B4D",
          ariaLabel: `${hostInsights.completed} completed`,
        },
        {
          label: "Pending",
          value: String(hostInsights.pending).padStart(2, "0"),
          bg: "#F0E6E4",
          valueColor: "#af2a1a",
          borderColor: "#FFCBC5",
          boxShadow: "inset 0 1px 8px #FFCBC5",
          ariaLabel: `${hostInsights.pending} pending`,
        },
      ];
    }
    if (effectiveRole === "Admin") {
      return [
        {
          label: "Total",
          value: String(todayTotal).padStart(2, "0"),
          bg: "#F4EDFE",
          valueColor: "#8a37f5",
          borderColor: "#D2B0FF",
          boxShadow: "inset 0 1px 8px #D2B0FF",
          ariaLabel: `${todayTotal} total today`,
        },
        {
          label: "Check-In",
          value: String(todayCheckIn).padStart(2, "0"),
          bg: "#DDECE7",
          valueColor: "#23a36d",
          borderColor: "#00F08B4D",
          boxShadow: "inset 0 1px 8px #00F08B4D",
          ariaLabel: `${todayCheckIn} checked in today`,
        },
        {
          label: "Check-Out",
          value: String(todayCheckOut).padStart(2, "0"),
          bg: "#F0E6E4",
          valueColor: "#e34a35",
          borderColor: "#FFCBC5",
          boxShadow: "inset 0 1px 8px #FFCBC5",
          ariaLabel: `${todayCheckOut} checked out today`,
        },
      ];
    }
    // Admin and Security default
    return [
      {
        label: "Total",
        value: "10",
        bg: "#F4EDFE",
        valueColor: "#5f24ac",
        borderColor: "#D2B0FF",
        boxShadow: "inset 0 1px 8px #D2B0FF",
        ariaLabel: "10 supporting text insight",
      },
      {
        label: "Check-In",
        value: "06",
        bg: "#DDECE7",
        valueColor: "#1d6e4f",
        borderColor: "#00F08B4D",
        boxShadow: "inset 0 1px 8px #00F08B4D",
        ariaLabel: "6 supporting text insight",
      },
      {
        label: "Check-Out",
        value: "04",
        bg: "#F0E6E4",
        valueColor: "#af2a1a",
        borderColor: "#FFCBC5",
        boxShadow: "inset 0 1px 8px #FFCBC5",
        ariaLabel: "4 supporting text insight",
      },
    ];
  }, [
    effectiveRole,
    companyInvitations,
    insightsLoading,
    insightsError,
    todayCheckIn,
    todayCheckOut,
    todayTotal,
    hostInsights,
  ]);

  // Role-based actions
  const actions: Action[] = useMemo(() => {
    if (effectiveRole === "SuperAdmin") {
      return [
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/invite.svg`}
              alt="Invite"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Invite",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#D3F8DF",
          iconBorderColor: "#23A36D",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Invite action",
          onClick: () => {
            // For web, show modal; for mobile, navigate to page
            if (window.innerWidth >= 768) {
              setIsInviteModalOpen(true);
            } else {
              router.push(INTERNAL_ROUTES.INVITE_VISITOR);
            }
          },
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/companies.svg`}
              alt="Companies"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Companies",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#EBF7FC",
          iconBorderColor: "#0056C9",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Companies action",
          onClick: () => router.push(INTERNAL_ROUTES.COMPANIES_LOG),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/report.svg`}
              alt="Report"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Report",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F2F0FE",
          iconBorderColor: "#8270DB",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Report action",
          onClick: () => router.push(INTERNAL_ROUTES.REPORT),
        },
        {
          icon: (
            <Avatar.Root w="40px" h="40px">
              <Avatar.Fallback
                name={profileData?.profile?.name || "User"}
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="sm"
                bg="var(--Primary-Dark, #5F24AC)"
                color="white"
              />
              {profileData?.profile?.profileImageUrl && (
                <Avatar.Image
                  src={profileData.profile.profileImageUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </Avatar.Root>
          ),
          description: "",
          actionLabel: "My Profile",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F4EDFE",
          iconBorderColor: "#8A38F5",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "My Profile action",
          onClick: () => router.push(INTERNAL_ROUTES.PROFILE),
        },
      ];
    }
    if (effectiveRole === "Admin") {
      return [
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/Scan-QR.svg`}
              alt="Scan QR"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: window.innerWidth >= 768 ? "Enter ID" : "Scan QR",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#ebf7fc",
          iconBorderColor: "#0056c9",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel:
            window.innerWidth >= 768 ? "Enter ID action" : "Scan QR action",
          onClick: () =>
            router.push(`${INTERNAL_ROUTES.SCANNER}?fromCheckIn=1`),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/login.svg`}
              alt="Check In"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Check In",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#ddece7",
          iconBorderColor: "#23a36d",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Check In action",
          onClick: () => router.push("/check-in-visitor"),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/check-out.svg`}
              alt="Check Out"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Check Out",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#f0e6e4",
          iconBorderColor: "#e34a35",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Check Out action",
          onClick: () => router.push("/check-out-visitor"),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/log.svg`}
              alt="Log"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Log",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#f4edfe",
          iconBorderColor: "#8a37f5",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Log action",
          onClick: () => router.push("/visitors-log"),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/report.svg`}
              alt="Report"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Report",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F2F0FE",
          iconBorderColor: "#8270DB",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Report action",
          onClick: () => router.push(INTERNAL_ROUTES.REPORT),
        },
      ];
    }
    if (effectiveRole === "Host") {
      return [
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/invite.svg`}
              alt="Invite"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Invite",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#D3F8DF",
          iconBorderColor: "#23A36D",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Invite action",
          onClick: () => router.push("/host-visitor"),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/visitor.svg`}
              alt="Visitors"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Visitors",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#FFFBE6",
          iconBorderColor: "#E2B226",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Visitors action",
          onClick: () => router.push("/visitor-request/main-page"),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/request.svg`}
              alt="Request"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Request",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#EBF7FC",
          iconBorderColor: "#0056C9",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Request action",
          onClick: () => router.push(`/visitor-request/main-page?request=1`),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/report.svg`}
              alt="Report"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Report",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F2F0FE",
          iconBorderColor: "#8a37f5",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Report action",
          onClick: () => router.push(INTERNAL_ROUTES.REPORT),
        },
      ];
    }
    // Admin and Security default
    return [
      {
        icon: (
          <Image
            src="/Scan-QR.svg"
            alt="Scan QR"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            priority
          />
        ),
        description: "",
        actionLabel:
          typeof window !== "undefined" && window.innerWidth >= 768
            ? "Enter ID"
            : "Scan QR",
        bg: "white",
        borderColor: "#dce0e3",
        iconBg: "#ebf7fc",
        iconBorderColor: "#0056c9",
        boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
        ariaLabel:
          typeof window !== "undefined" && window.innerWidth >= 768
            ? "Enter ID action"
            : "Scan QR action",
        onClick: () => router.push("/scanner?fromCheckIn=1"),
      },
      {
        icon: (
          <Image
            src="/login.svg"
            alt="Check In"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            priority
          />
        ),
        description: "",
        actionLabel: "Check In",
        bg: "white",
        borderColor: "#dce0e3",
        iconBg: "#ddece7",
        iconBorderColor: "#23a36d",
        boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
        ariaLabel: "Check In action",
        onClick: () => router.push("/check-in-visitor"),
      },
      {
        icon: (
          <Image
            src="/check-out.svg"
            alt="Check Out"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            priority
          />
        ),
        description: "",
        actionLabel: "Check Out",
        bg: "white",
        borderColor: "#dce0e3",
        iconBg: "#f0e6e4",
        iconBorderColor: "#e34a35",
        boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
        ariaLabel: "Check Out action",
        onClick: () => router.push("/check-out-visitor"),
      },
      {
        icon: (
          <Image
            src="/log.svg"
            alt="Log"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            priority
          />
        ),
        description: "",
        actionLabel: "Log",
        bg: "white",
        borderColor: "#dce0e3",
        iconBg: "#f4edfe",
        iconBorderColor: "#8a37f5",
        boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
        ariaLabel: "Log action",
        onClick: () => router.push("/visitors-log"),
      },
      {
        icon: (
          <Image
            src={`${FRONTEND_URL}/report.svg`}
            alt="Report"
            width={40}
            height={40}
            style={{ objectFit: "contain" }}
            priority
          />
        ),
        description: "",
        actionLabel: "Report",
        bg: "white",
        borderColor: "#dce0e3",
        iconBg: "#F2F0FE",
        iconBorderColor: "#8270DB",
        boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
        ariaLabel: "Report action",
        onClick: () => router.push(INTERNAL_ROUTES.REPORT),
      },
    ];
  }, [
    effectiveRole,
    router,
    profileData?.profile?.name,
    profileData?.profile?.profileImageUrl,
    jwtRole,
    userData?.roleName,
  ]);

  // Mobile actions (without profile card)
  const mobileActions: Action[] = useMemo(() => {
    if (effectiveRole === "SuperAdmin") {
      return [
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/invite.svg`}
              alt="Invite"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Invite",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#D3F8DF",
          iconBorderColor: "#23A36D",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Invite action",
          onClick: handleInviteClick,
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/companies.svg`}
              alt="Companies"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Companies",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#EBF7FC",
          iconBorderColor: "#0056C9",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Companies action",
          onClick: () => router.push(INTERNAL_ROUTES.COMPANIES_LOG),
        },
        {
          icon: (
            <Image
              src={`${FRONTEND_URL}/report.svg`}
              alt="Report"
              width={40}
              height={40}
              style={{ objectFit: "contain" }}
              priority
            />
          ),
          description: "",
          actionLabel: "Report",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F2F0FE",
          iconBorderColor: "#8270DB",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "Report action",
          onClick: () => router.push(INTERNAL_ROUTES.REPORT),
        },
        {
          icon: (
            <Avatar.Root w="40px" h="40px">
              <Avatar.Fallback
                name={profileData?.profile?.name || "User"}
                w="full"
                h="full"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="sm"
                bg="var(--Primary-Dark, #5F24AC)"
                color="white"
              />
              {profileData?.profile?.profileImageUrl && (
                <Avatar.Image
                  src={profileData.profile.profileImageUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
            </Avatar.Root>
          ),
          description: "",
          actionLabel: "My Profile",
          bg: "white",
          borderColor: "#dce0e3",
          iconBg: "#F4EDFE",
          iconBorderColor: "#8A38F5",
          boxShadow: "0 2px 16px rgba(95,36,172,0.27)",
          ariaLabel: "My Profile action",
          onClick: () => router.push(INTERNAL_ROUTES.PROFILE),
        },
      ];
    }
    // For other roles, return the same as web actions
    return actions;
  }, [
    effectiveRole,
    router,
    handleInviteClick,
    profileData?.profile?.name,
    profileData?.profile?.profileImageUrl,
    jwtRole,
    actions,
  ]);

  if (!effectiveRole) {
    return null;
  }

  // Show loading state while user data is being fetched
  if (typeof window !== "undefined" && userLoading) {
    return (
      <Box
        h="100vh"
        w="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
      >
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box
      h="100vh"
      w="full"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      minH="100vh"
    >
      {/* Desktop/Tablet Header - Hidden on Mobile */}
      <DesktopHeader notificationCount={0} />

      {/* Desktop/Tablet Dashboard Content - Hidden on Mobile */}
      <Box
        display={{ base: "none", md: "block" }}
        bg="#F0E6FF"
        h="calc(100vh - 60px)"
        position="relative"
        overflow="hidden"
        minH="calc(100vh - 60px)"
      >
        {/* Decorative Background Logo */}
        <Box
          position="absolute"
          bottom="-100px"
          right="-50px"
          opacity={0.1}
          zIndex={1}
          pointerEvents="none"
        >
          <Box transform="scale(3)">
            <Logo />
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          position="relative"
          zIndex={2}
          p={{ md: 4, lg: 6 }}
          h="full"
          overflow="hidden"
        >
          {/* Today's Insights Section */}
          <Box
            mb={{ md: 6, lg: 8 }}
            bg="white"
            p={{ md: 3, lg: 4 }}
            borderRadius="lg"
            boxShadow="0 4px 12px rgba(0,0,0,0.1)"
          >
            <Flex
              justifyContent="space-between"
              alignItems="center"
              mb={{ md: 4, lg: 6 }}
            >
              <Heading
                as="h2"
                fontSize={{ md: "20px", lg: "24px" }}
                fontWeight="bold"
                color="var(--Primary-Dark, #5F24AC)"
                fontFamily="Roboto, sans-serif"
              >
                Insights
              </Heading>

              <Flex alignItems="center" gap={4}>
                {/* Date Selection Badges - Only for Host role */}
                {effectiveRole === "Host" && (
                  <Flex gap={2} alignItems="center">
                    <Badge
                      px={3}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      bg={selectedDateType === "today" ? "#8A37F7" : "#E2E8F0"}
                      color={selectedDateType === "today" ? "white" : "#4A5568"}
                      _hover={{
                        bg:
                          selectedDateType === "today" ? "#7C3AED" : "#CBD5E0",
                      }}
                      onClick={() => handleDateTypeChange("today")}
                      tabIndex={0}
                      aria-label="Select today's date"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleDateTypeChange("today");
                        }
                      }}
                      fontSize="sm"
                      fontWeight="medium"
                      minH="32px"
                      minW="80px"
                      justifyContent="center"
                      textAlign="center"
                    >
                      Today
                    </Badge>

                    <Badge
                      px={3}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      bg={
                        selectedDateType === "tomorrow" ? "#8A37F7" : "#E2E8F0"
                      }
                      color={
                        selectedDateType === "tomorrow" ? "white" : "#4A5568"
                      }
                      _hover={{
                        bg:
                          selectedDateType === "tomorrow"
                            ? "#7C3AED"
                            : "#CBD5E0",
                      }}
                      onClick={() => handleDateTypeChange("tomorrow")}
                      tabIndex={0}
                      aria-label="Select tomorrow's date"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleDateTypeChange("tomorrow");
                        }
                      }}
                      fontSize="sm"
                      fontWeight="medium"
                      minH="32px"
                      minW="80px"
                      justifyContent="center"
                      textAlign="center"
                    >
                      Tomorrow
                    </Badge>

                    {/* Custom Date Badge */}
                    <Box
                      position="relative"
                      display="inline-flex"
                      alignItems="center"
                    >
                      <Badge
                        px={3}
                        py={1}
                        borderRadius="full"
                        cursor="pointer"
                        bg={
                          selectedDateType === "custom" ? "#8A37F7" : "#E2E8F0"
                        }
                        color={
                          selectedDateType === "custom" ? "white" : "#4A5568"
                        }
                        _hover={{
                          bg:
                            selectedDateType === "custom"
                              ? "#7C3AED"
                              : "#CBD5E0",
                        }}
                        onClick={openCustomDatePicker}
                        tabIndex={0}
                        aria-label="Select custom date"
                        fontSize="sm"
                        fontWeight="medium"
                        minH="32px"
                        minW="120px"
                        justifyContent="center"
                        textAlign="center"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            openCustomDatePicker();
                          }
                        }}
                      >
                        <Flex alignItems="center" gap={1}>
                          <Text
                            fontSize="sm"
                            maxWidth="100px"
                            textAlign="center"
                          >
                            {customDate
                              ? formatDateForDisplay(customDate)
                              : "Custom Date"}
                          </Text>
                          {customDate && (
                            <Box
                              as="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomDate("");
                                setIsCancelClicked(true);
                              }}
                              cursor="pointer"
                              color="currentColor"
                              fontSize="sm"
                              fontWeight="bold"
                              _hover={{ opacity: 0.8 }}
                              aria-label="Clear selected date"
                              ml={1}
                              flexShrink={0}
                            >
                              ✕
                            </Box>
                          )}
                        </Flex>
                      </Badge>
                    </Box>
                  </Flex>
                )}

                <Box
                  bg="var(--Primary-Dark, #5F24AC)"
                  color="white"
                  px={4}
                  py={2}
                  borderRadius="md"
                  fontSize="14px"
                  fontWeight="500"
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Image
                    src={`${FRONTEND_URL}/clock.svg`}
                    alt="Clock"
                    width={16}
                    height={16}
                    style={{ objectFit: "contain" }}
                    priority
                  />
                  <Text>
                    {formatWebDate(currentDateTime)},{" "}
                    {getWebDayName(currentDateTime)}{" "}
                    {formatWebTime(currentDateTime)}
                  </Text>
                </Box>
              </Flex>
            </Flex>

            {/* Insights Cards */}
            <Flex gap={6} mb={8}>
              {insights.map((insight) => (
                <Box
                  key={insight.label}
                  bg={insight.bg}
                  p={6}
                  flex="1"
                  position="relative"
                  overflow="hidden"
                >
                  <Flex justifyContent="space-between" alignItems="center">
                    <Box>
                      <Text
                        fontSize="32px"
                        fontWeight="bold"
                        color={insight.valueColor}
                        mb={1}
                      >
                        {insight.value}
                      </Text>
                      <Text fontSize="16px" fontWeight="600" color="gray.700">
                        {insight.label === "Companies"
                          ? "Total Companies"
                          : insight.label === "Active"
                          ? "Active Companies"
                          : insight.label === "Pending"
                          ? effectiveRole === "Host"
                            ? "Pending"
                            : "Pending Companies"
                          : insight.label}
                      </Text>
                    </Box>
                    <Box
                      w="60px"
                      h="60px"
                      bg="white"
                      borderRadius="lg"
                      display={effectiveRole === "Host" ? "none" : "flex"}
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                    >
                      {insight.label === "Companies" ? (
                        <Image
                          src={`${FRONTEND_URL}/total_companies.svg`}
                          alt="Total Companies"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : insight.label === "Active" ? (
                        <Image
                          src={`${FRONTEND_URL}/active_companies.svg`}
                          alt="Active Companies"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : insight.label === "Pending" ? (
                        <Image
                          src={`${FRONTEND_URL}/pending_companies.svg`}
                          alt="Pending Companies"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : insight.label === "Total" ? (
                        <Image
                          src={`${FRONTEND_URL}/report.svg`}
                          alt="Total"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : insight.label === "Check-In" ? (
                        <Image
                          src={`${FRONTEND_URL}/login.svg`}
                          alt="Check In"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : insight.label === "Check-Out" ? (
                        <Image
                          src={`${FRONTEND_URL}/check-out.svg`}
                          alt="Check Out"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <Image
                          src={`${FRONTEND_URL}/report.svg`}
                          alt="Report"
                          width={50}
                          height={50}
                          style={{ objectFit: "contain" }}
                        />
                      )}
                    </Box>
                  </Flex>
                </Box>
              ))}
            </Flex>
          </Box>

          {/* Actions Section */}
          <Box>
            <Heading
              as="h2"
              fontSize={{ md: "20px", lg: "24px" }}
              fontWeight="bold"
              color="var(--Primary-Dark, #5F24AC)"
              fontFamily="Roboto, sans-serif"
              mb={{ md: 4, lg: 6 }}
            >
              Actions
            </Heading>

            {/* Action Cards Grid - Role-based Layout */}
            {effectiveRole === "SuperAdmin" ? (
              /* SuperAdmin - 4 actions in single row */
              <Flex gap="10px" flexWrap="nowrap" w="full" mb={10}>
                {actions.map((action) => (
                  <Box
                    key={action.actionLabel}
                    bg="white"
                    borderRadius="sm"
                    flex="0 0 25%"
                    h={{ md: "80px", lg: "90px" }}
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    cursor="pointer"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    transition="all 0.2s"
                    onClick={action.onClick}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    pt="13px"
                    pr="30px"
                    pb="13px"
                    pl="30px"
                    gap="20px"
                  >
                    {/* Icon on the left */}
                    <Box
                      w="55px"
                      h="55px"
                      bg={action.iconBg}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border={`2px solid ${action.iconBorderColor}`}
                      p="6px"
                      flexShrink={0}
                    >
                      <Box transform="scale(0.8)">{action.icon}</Box>
                    </Box>

                    {/* Text on the right */}
                    <Box
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="flex-start"
                    >
                      <Text
                        fontSize={{ md: "14px", lg: "16px" }}
                        fontWeight="600"
                        color="gray.800"
                        lineHeight="1.2"
                        mb="2px"
                      >
                        {action.actionLabel}
                      </Text>
                      <Text
                        fontSize={{ md: "12px", lg: "14px" }}
                        color="gray.600"
                        lineHeight="1.3"
                      >
                        {action.description}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Flex>
            ) : effectiveRole === "Admin" ? (
              <Box mb={10}>
                {/* First Row - 5 Actions (Scan QR, Check In, Check Out, Log, Report) */}
                <Flex gap="10px" flexWrap="nowrap" w="full" mb="10px">
                  {actions.map((action) => (
                    <Box
                      key={action.actionLabel}
                      bg="white"
                      borderRadius="sm"
                      flex="1"
                      minW="0"
                      h={{ md: "80px", lg: "90px" }}
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      cursor="pointer"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      }}
                      transition="all 0.2s"
                      onClick={action.onClick}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      pt="13px"
                      pr="30px"
                      pb="13px"
                      pl="30px"
                      gap="20px"
                    >
                      {/* Icon on the left */}
                      <Box
                        w="55px"
                        h="55px"
                        bg={action.iconBg}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border={`2px solid ${action.iconBorderColor}`}
                        p="6px"
                        flexShrink={0}
                      >
                        <Box transform="scale(0.8)">{action.icon}</Box>
                      </Box>

                      {/* Text on the right */}
                      <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="flex-start"
                        h="full"
                        minW="0"
                      >
                        <Text
                          fontSize="16px"
                          fontWeight="600"
                          color="gray.700"
                          textAlign="left"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          whiteSpace="nowrap"
                        >
                          {action.actionLabel}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Flex>

                {/* Second Row - Employee and My Profile Cards */}
                <Flex gap="10px" flexWrap="nowrap" w="full">
                  {/* Employee Card - 25% width - Only show for Admin and SuperAdmin roles, hide for Security role */}
                  {(jwtRole || userData?.roleName)?.toLowerCase() !==
                    "security" && (
                    <Box
                      bg="white"
                      borderRadius="sm"
                      flex="0 0 25%"
                      h={{ md: "80px", lg: "90px" }}
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      cursor="pointer"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      }}
                      transition="all 0.2s"
                      onClick={() => router.push("/employee-list")}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      pt="13px"
                      pr="30px"
                      pb="13px"
                      pl="30px"
                      gap="20px"
                    >
                      {/* Icon on the left */}
                      <Box
                        w="55px"
                        h="55px"
                        bg="#FFFBE6"
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border="2px solid #E2B226"
                        p="6px"
                        flexShrink={0}
                      >
                        <Box transform="scale(0.8)">
                          <Image
                            src={`${FRONTEND_URL}/companies.svg`}
                            alt="Employee"
                            width={40}
                            height={40}
                            style={{ objectFit: "contain" }}
                            priority
                          />
                        </Box>
                      </Box>

                      {/* Text on the right */}
                      <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="flex-start"
                        h="full"
                      >
                        <Text
                          fontSize="16px"
                          fontWeight="600"
                          color="gray.700"
                          textAlign="left"
                        >
                          Employee
                        </Text>
                      </Box>
                    </Box>
                  )}

                  {/* My Profile Card - 25% width */}
                  <Box
                    bg="white"
                    borderRadius="sm"
                    flex="0 0 25%"
                    h={{ md: "80px", lg: "90px" }}
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    cursor="pointer"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    transition="all 0.2s"
                    onClick={() => router.push("/profile")}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    pt="13px"
                    pr="30px"
                    pb="13px"
                    pl="30px"
                    gap="20px"
                  >
                    {/* Avatar on the left */}
                    <Box
                      w="55px"
                      h="55px"
                      bg="var(--Primary-Dark, #5F24AC)"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid var(--Primary-Dark, #5F24AC)"
                      p="6px"
                      flexShrink={0}
                    >
                      <Avatar.Root w="full" h="full">
                        <Avatar.Fallback
                          name={profileData?.profile.name || "User"}
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="lg"
                          bg="white"
                          color="var(--Primary-Dark, #5F24AC)"
                        />
                        {profileData?.profile?.profileImageUrl && (
                          <Avatar.Image
                            src={profileData.profile.profileImageUrl}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </Avatar.Root>
                    </Box>

                    {/* Text on the right */}
                    <Box
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="flex-start"
                      h="full"
                    >
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.700"
                        textAlign="left"
                      >
                        My Profile
                      </Text>
                    </Box>
                  </Box>
                </Flex>
              </Box>
            ) : effectiveRole === "Host" ? (
              /* Host Role Layout - Actions + My Profile Card */
              <Box mb={10}>
                {/* First Row - Actions */}
                <Flex gap="10px" flexWrap="nowrap" w="full" mb="10px">
                  {actions.map((action) => (
                    <Box
                      key={action.actionLabel}
                      bg="white"
                      borderRadius="sm"
                      flex="1"
                      h={{ md: "80px", lg: "90px" }}
                      boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                      cursor="pointer"
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                      }}
                      transition="all 0.2s"
                      onClick={action.onClick}
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      justifyContent="flex-start"
                      pt="13px"
                      pr="30px"
                      pb="13px"
                      pl="30px"
                      gap="20px"
                    >
                      {/* Icon on the left */}
                      <Box
                        w="55px"
                        h="55px"
                        bg={action.iconBg}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        border={`2px solid ${action.iconBorderColor}`}
                        p="6px"
                        flexShrink={0}
                      >
                        <Box transform="scale(0.8)">{action.icon}</Box>
                      </Box>

                      {/* Text on the right */}
                      <Box
                        flex="1"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="flex-start"
                        h="full"
                      >
                        <Text
                          fontSize="16px"
                          fontWeight="600"
                          color="gray.700"
                          textAlign="left"
                        >
                          {action.actionLabel}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </Flex>

                {/* Second Row - My Profile Card for Host */}
                <Flex gap="10px" flexWrap="nowrap" w="full">
                  {/* My Profile Card - 25% width */}
                  <Box
                    bg="white"
                    borderRadius="sm"
                    flex="0 0 25%"
                    h={{ md: "80px", lg: "90px" }}
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    cursor="pointer"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    transition="all 0.2s"
                    onClick={() => router.push("/profile")}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    pt="13px"
                    pr="30px"
                    pb="13px"
                    pl="30px"
                    gap="20px"
                  >
                    {/* Avatar on the left */}
                    <Box
                      w="55px"
                      h="55px"
                      bg="var(--Primary-Dark, #5F24AC)"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid var(--Primary-Dark, #5F24AC)"
                      p="6px"
                      flexShrink={0}
                    >
                      <Avatar.Root w="full" h="full">
                        <Avatar.Fallback
                          name={profileData?.profile.name || "User"}
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="lg"
                          bg="white"
                          color="var(--Primary-Dark, #5F24AC)"
                        />
                        {profileData?.profile?.profileImageUrl && (
                          <Avatar.Image
                            src={profileData.profile.profileImageUrl}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        )}
                      </Avatar.Root>
                    </Box>

                    {/* Text on the right */}
                    <Box
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="flex-start"
                      h="full"
                    >
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.700"
                        textAlign="left"
                      >
                        My Profile
                      </Text>
                    </Box>
                  </Box>
                </Flex>
              </Box>
            ) : (
              /* Other Roles - Original Layout */
              <Flex gap="10px" flexWrap="nowrap" w="full" mb={10}>
                {actions.map((action) => (
                  <Box
                    key={action.actionLabel}
                    bg="white"
                    borderRadius="sm"
                    flex="1"
                    h={{ md: "80px", lg: "90px" }}
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    cursor="pointer"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                    }}
                    transition="all 0.2s"
                    onClick={action.onClick}
                    display="flex"
                    flexDirection="row"
                    alignItems="center"
                    justifyContent="flex-start"
                    pt="13px"
                    pr="30px"
                    pb="13px"
                    pl="30px"
                    gap="20px"
                  >
                    {/* Icon on the left */}
                    <Box
                      w="55px"
                      h="55px"
                      bg={action.iconBg}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border={`2px solid ${action.iconBorderColor}`}
                      p="6px"
                      flexShrink={0}
                    >
                      <Box transform="scale(0.8)">{action.icon}</Box>
                    </Box>

                    {/* Text on the right */}
                    <Box
                      flex="1"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="flex-start"
                      h="full"
                    >
                      <Text
                        fontSize="16px"
                        fontWeight="600"
                        color="gray.700"
                        textAlign="left"
                      >
                        {action.actionLabel}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>

          {/* Logo Section */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            mt={20}
            pointerEvents="none"
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Mobile Layout - Hidden on Tablet/Desktop */}
      <Box display={{ base: "block", md: "none" }}>
        <DashboardHeader />
        <Box
          flex="1"
          // minH="0"
          pt={0}
          pb={{
            base: "calc(env(safe-area-inset-bottom, 0px) + 72px)",
            md: "80px",
          }}
          px={4}
          overflowY="auto"
          overflowX="hidden"
          h='calc(100vh - 140px)'
          // maxHeight={{ base: "calc(100dvh - 64px)", md: "calc(100vh - 64px)" }}
        >
          {/* Section 1: Today's Insights */}
          <Box py={{ base: 2, md: 3 }}>
            {/* Header with Date Selection for Host Role */}
            {effectiveRole === "Host" ? (
              <Flex
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={2}
              >
                <Text fontSize="md" fontWeight="bold" color="#362c62">
                  Insights
                </Text>

                {/* Date Selection Badges */}
                <Flex gap={1} alignItems="center" ml="10px" flexWrap="nowrap">
                  <Badge
                    px={2}
                    py={1}
                    borderRadius="full"
                    cursor="pointer"
                    bg={selectedDateType === "today" ? "#8A37F7" : "#E2E8F0"}
                    color={selectedDateType === "today" ? "white" : "#4A5568"}
                    _hover={{
                      bg: selectedDateType === "today" ? "#7C3AED" : "#CBD5E0",
                    }}
                    onClick={() => handleDateTypeChange("today")}
                    tabIndex={0}
                    aria-label="Select today's date"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleDateTypeChange("today");
                      }
                    }}
                    fontSize="2xs"
                    fontWeight="medium"
                    flexShrink={0}
                    lineHeight="1"
                    display="inline-flex"
                    alignItems="center"
                    minH="24px"
                    minW="60px"
                    justifyContent="center"
                    textAlign="center"
                    verticalAlign="middle"
                  >
                    Today
                  </Badge>

                  <Badge
                    px={2}
                    py={1}
                    borderRadius="full"
                    cursor="pointer"
                    bg={selectedDateType === "tomorrow" ? "#8A37F7" : "#E2E8F0"}
                    color={
                      selectedDateType === "tomorrow" ? "white" : "#4A5568"
                    }
                    _hover={{
                      bg:
                        selectedDateType === "tomorrow" ? "#7C3AED" : "#CBD5E0",
                    }}
                    onClick={() => handleDateTypeChange("tomorrow")}
                    tabIndex={0}
                    aria-label="Select tomorrow's date"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleDateTypeChange("tomorrow");
                      }
                    }}
                    fontSize="2xs"
                    fontWeight="medium"
                    flexShrink={0}
                    lineHeight="1"
                    display="inline-flex"
                    alignItems="center"
                    minH="24px"
                    minW="60px"
                    justifyContent="center"
                    textAlign="center"
                    verticalAlign="middle"
                  >
                    Tomorrow
                  </Badge>

                  {/* Custom Date Badge + inline date picker */}
                  <Box
                    position="relative"
                    display="inline-flex"
                    alignItems="center"
                  >
                    <Badge
                      px={2}
                      py={1}
                      borderRadius="full"
                      cursor="pointer"
                      bg={selectedDateType === "custom" ? "#8A37F7" : "#E2E8F0"}
                      color={
                        selectedDateType === "custom" ? "white" : "#4A5568"
                      }
                      _hover={{
                        bg:
                          selectedDateType === "custom" ? "#7C3AED" : "#CBD5E0",
                      }}
                      onClick={openCustomDatePicker}
                      onTouchEnd={openCustomDatePicker}
                      tabIndex={0}
                      aria-label="Select custom date"
                      fontSize="2xs"
                      fontWeight="medium"
                      lineHeight="1"
                      display="inline-flex"
                      alignItems="center"
                      minH="24px"
                      minW="60px"
                      justifyContent="center"
                      textAlign="center"
                      verticalAlign="middle"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          openCustomDatePicker();
                        }
                      }}
                    >
                      <Flex alignItems="center" gap={1}>
                        <Text
                          fontSize="2xs"
                          lineHeight="1"
                          maxWidth="80px"
                          textAlign="center"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {customDate
                            ? formatDateForDisplay(customDate)
                            : "Custom Date"}
                        </Text>
                        {customDate && (
                          <Box
                            as="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomDate("");
                              setIsCancelClicked(true);
                              // Don't hide the picker - let it stay open
                            }}
                            cursor="pointer"
                            color="currentColor"
                            fontSize="2xs"
                            fontWeight="bold"
                            _hover={{ opacity: 0.8 }}
                            aria-label="Clear selected date"
                            ml={1}
                            lineHeight="1"
                            flexShrink={0}
                          >
                            ✕
                          </Box>
                        )}
                      </Flex>
                    </Badge>

                    {/* Hidden date input for mobile compatibility - positioned below tab */}
                    <Input
                      ref={datePickerRef}
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        handleCustomDateChange(e.target.value);
                      }}
                      position="absolute"
                      top="100%"
                      left="0"
                      opacity={0}
                      pointerEvents="auto"
                      w="1px"
                      h="1px"
                      overflow="hidden"
                      aria-hidden="true"
                      visibility="visible"
                      zIndex="10"
                    />
                  </Box>
                </Flex>
              </Flex>
            ) : (
              <Text fontSize="lg" fontWeight="bold" color="#362c62" my="6px">
                {effectiveRole === "SuperAdmin"
                  ? "Insights"
                  : "Today's Insights"}
              </Text>
            )}

            <Flex
              direction="row"
              className="gap-x-3"
              w="full"
              flexWrap="wrap"
              gap={{ base: 2, md: 2 }}
              overflowX="hidden"
            >
              {insights.map((insight) => (
                <Box
                  key={insight.label}
                  flex={{ base: "1", md: "1" }}
                  minW={{ base: "0", md: "0" }}
                  maxW={{ base: "calc(50% - 4px)", md: "none" }}
                >
                  <ProductCard {...insight} />
                </Box>
              ))}
            </Flex>
          </Box>
          {/* Section 2: Actions */}
          <Box py={{ base: 1, md: 2 }}>
            <Text
              fontSize="lg"
              fontWeight="bold"
              color="#362c62"
              my={{ base: "6px", md: "8px" }}
            >
              Actions
            </Text>
            {/* SuperAdmin Layout - 2 cards at 50% each, 3rd card at 50% on next line */}
            {effectiveRole === "SuperAdmin" ? (
              <Box>
                {/* First row: 2 cards at 50% width each */}
                <Flex direction="row" gap={2} w="full" mb={2}>
                  {mobileActions.slice(0, 2).map((action) => (
                    <Box flex="1" w="50%" minW="0" key={action.actionLabel}>
                      <ActionCard {...action} />
                    </Box>
                  ))}
                </Flex>

                {/* Second row: 3rd card at 50% width */}
                {mobileActions.length > 2 && (
                  <Flex direction="row" gap={2} w="full">
                    <Box
                      flex="1"
                      w="50%"
                      minW="0"
                      key={mobileActions[2].actionLabel}
                    >
                      <ActionCard {...mobileActions[2]} />
                    </Box>
                    <Box flex="1" /> {/* Empty space to maintain 50% width */}
                  </Flex>
                )}
              </Box>
            ) : (
              /* Other Roles - Mobile: 2 cards per row at 50% each, Web: horizontal layout */
              <Box>
                {/* Mobile Layout - 2 cards per row */}
                <Flex
                  direction="column"
                  gap={2}
                  w="full"
                  display={{ base: "flex", md: "none" }}
                >
                  {/* First row: 2 cards at 50% width each */}
                  <Flex direction="row" gap={2} w="full">
                    {mobileActions.slice(0, 2).map((action) => (
                      <Box flex="1" w="50%" minW="0" key={action.actionLabel}>
                        <ActionCard {...action} />
                      </Box>
                    ))}
                  </Flex>

                  {/* Second row: 2 cards at 50% width each */}
                  {mobileActions.length > 2 && (
                    <Flex direction="row" gap={2} w="full">
                      {mobileActions.slice(2, 4).map((action) => (
                        <Box flex="1" w="50%" minW="0" key={action.actionLabel}>
                          <ActionCard {...action} />
                        </Box>
                      ))}
                    </Flex>
                  )}

                  {/* Third row: 5th card at 50% width (for Admin/Security with Report) */}
                  {mobileActions.length > 4 && (
                    <Flex direction="row" gap={2} w="full">
                      <Box
                        flex="1"
                        w="50%"
                        minW="0"
                        key={mobileActions[4].actionLabel}
                      >
                        <ActionCard {...mobileActions[4]} />
                      </Box>
                      <Box flex="1" /> {/* Empty space to maintain 50% width */}
                    </Flex>
                  )}
                </Flex>

                {/* Web Layout - Original horizontal layout */}
                <Flex
                  direction="row"
                  gap={2}
                  w="full"
                  overflowX="visible"
                  pb={0}
                  flexWrap="wrap"
                  display={{ base: "none", md: "flex" }}
                >
                  {mobileActions.map((action) => (
                    <Box flex="1" minW="0" key={action.actionLabel}>
                      <ActionCard {...action} />
                    </Box>
                  ))}
                </Flex>
              </Box>
            )}
          </Box>

          {/* Decorative Logo */}
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={-1}
            pointerEvents="none"
          >
            <Box transform="scale(5)" opacity={0.15}>
              <Logo />
            </Box>
          </Box>
        </Box>
        <FooterMenuNavigation
          role={(jwtRole || userData?.roleName) as UserRole}
        />
      </Box>

      {/* Calendar Container for Web - Positioned outside main layout */}
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        pointerEvents="none"
        zIndex={9999}
        display={{ base: "none", md: "block" }}
      >
        <Input
          ref={datePickerRef}
          type="date"
          value={customDate}
          onChange={(e) => {
            handleCustomDateChange(e.target.value);
          }}
          position="absolute"
          opacity={0}
          pointerEvents="auto"
          w="200px"
          h="40px"
          overflow="hidden"
          aria-hidden="true"
          visibility="visible"
          zIndex="10000"
        />
      </Box>

      {/* Invite Modal for Web */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </Box>
  );
};

export default DashboardPage;
