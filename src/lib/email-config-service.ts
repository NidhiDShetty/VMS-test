// Email Configuration Service
import { FRONTEND_URL } from "@/lib/server-urls";
export interface EmailConfigData {
  smtpHost: string;
  smtpPort: string;
  customPort: string;
  isSecure: boolean;
  requireTLS: boolean;
  emailAddress: string;
  password: string;
  fromName: string;
}

export interface EmailConfigResponse {
  success: boolean;
  data?: EmailConfigData;
  error?: string;
  message?: string;
}

export class EmailConfigService {
  // Helper function to get auth token
  private static getAuthToken(): string {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.token || "";
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
    }
    return "";
  }

  // Get organization ID from localStorage
  private static getOrganizationId(): string {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.user?.orgId || "1";
      }
    } catch (error) {
      console.error("Error getting organization ID:", error);
    }
    return "1"; // Default fallback
  }

  // Get email configuration
  static async getEmailConfig(): Promise<EmailConfigResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: "Authentication token not found",
        };
      }

      const response = await fetch(`${FRONTEND_URL}/api/email-config/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching email configuration:", error);
      return {
        success: false,
        error: "Failed to fetch email configuration",
      };
    }
  }

  // Save email configuration (POST for create, PATCH for update)
  static async saveEmailConfig(
    configData: EmailConfigData,
    isUpdate: boolean = false
  ): Promise<EmailConfigResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: "Authentication token not found",
        };
      }

      const orgId = this.getOrganizationId();

      // Include all data in payload, including password for updates
      const payload = {
        ...configData,
        orgId: parseInt(orgId),
      };

      const response = await fetch(`${FRONTEND_URL}/api/email-config/`, {
        method: isUpdate ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error saving email configuration:", error);
      return {
        success: false,
        error: "Failed to save email configuration",
      };
    }
  }

  // Delete email configuration
  static async deleteEmailConfig(): Promise<EmailConfigResponse> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return {
          success: false,
          error: "Authentication token not found",
        };
      }

      const response = await fetch(`${FRONTEND_URL}/api/email-config/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting email configuration:", error);
      return {
        success: false,
        error: "Failed to delete email configuration",
      };
    }
  }
}
