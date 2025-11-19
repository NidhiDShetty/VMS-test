import axios from "axios";
import { BACKEND_PROFILE_URL } from "@/lib/server-urls";

export interface UserData {
  userId: number;
  email: string;
  orgId: number;
  roleId: number;
  roleName: string;
}

// Helper function to check if user is authenticated
export const isUserAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const authDataRaw = localStorage.getItem("authData");
    if (!authDataRaw) return false;

    const parsed = JSON.parse(authDataRaw);
    return !!parsed?.token;
  } catch {
    return false;
  }
};

export const getUserData = async (): Promise<UserData> => {
  // Only run on client side
  if (typeof window === "undefined") {
    throw new Error("getUserData can only be called on the client side");
  }

  const authDataRaw = localStorage.getItem("authData");

  if (!authDataRaw) {
    console.warn("[getUserData] No auth data found in localStorage");
    throw new Error("No auth data found - user may not be logged in");
  }

  let token = "";
  try {
    const parsed = JSON.parse(authDataRaw);
    token = parsed?.token;
  } catch (parseError) {
    console.error("[getUserData] Failed to parse auth data:", parseError);
    throw new Error("Invalid auth data format");
  }

  if (!token) {
    console.warn("[getUserData] No token found in auth data");
    throw new Error("No token found - user may not be logged in");
  }

  // Decode JWT token to get the authoritative role
  let jwtRole = "User";
  try {
    const tokenParts = token.split(".");
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      jwtRole = payload.roleName || "User";
    }
  } catch (e) {
    console.warn("Could not decode JWT token for role");
  }

  try {
    const response = await axios.get(BACKEND_PROFILE_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = response.data;

    // Extract user data from the profile response
    // Use JWT role as it's more authoritative than API response
    return {
      userId: data.userId,
      email: data.profile?.email || data.email,
      orgId: data.orgId,
      roleId: data.profile?.roleId || 1,
      roleName: jwtRole, // Use JWT role from token, not API
    };
  } catch (error) {
    console.warn("API call failed, using JWT token data as fallback");

    // Fallback: Use JWT decoded data
    try {
      const tokenParts = token.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        return {
          userId: payload.userId || 0,
          email: payload.email || "",
          orgId: payload.orgId || 0,
          roleId: payload.roleId || 1,
          roleName: payload.roleName || "User",
        };
      }
    } catch (decodeError) {
      console.error("Failed to decode JWT token:", decodeError);
    }

    throw new Error("Failed to fetch user data");
  }
};
