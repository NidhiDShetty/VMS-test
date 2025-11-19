import axios from "axios";
import { SIGN_IN_API } from "@/lib/server-urls";

// Convert technical error messages to user-friendly ones
const convertToUserFriendlyMessage = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Handle timeout errors
  if (lowerMessage.includes('timeout') || 
      lowerMessage.includes('failed to cancel request') ||
      lowerMessage.includes('request timed out')) {
    return "Login request timed out, please try again";
  }
  
  // Handle connection errors
  if (lowerMessage.includes('connection') || 
      lowerMessage.includes('network') ||
      lowerMessage.includes('server') ||
      lowerMessage.includes('unable to connect')) {
    return "Unable to connect to server, please try again";
  }
  
  // Handle SQL/database errors
  if (lowerMessage.includes('select') || 
      lowerMessage.includes('from') ||
      lowerMessage.includes('where') ||
      lowerMessage.includes('sql') ||
      lowerMessage.includes('database')) {
    return "Login service temporarily unavailable, please try again";
  }
  
  // Handle authentication errors
  if (lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('invalid token')) {
    return "Authentication failed, please try again";
  }
  
  // Handle server errors
  if (lowerMessage.includes('internal server error') ||
      lowerMessage.includes('500') ||
      lowerMessage.includes('service unavailable')) {
    return "Service temporarily unavailable, please try again";
  }
  
  // Return original message if no specific pattern matches
  return message;
};

export interface LoginPayload {
    email: string;
    password: string;
  }
  
  export interface LoginResponse {
    token: string;
    user: {
      userId: number;
      email: string;
      orgId: number;
      roleId: number;
      roleName: string;
    };
  }
  
  export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const res = await axios.post(SIGN_IN_API, payload, {
        headers: { "Content-Type": "application/json" },
      });
      const data = res.data;
      if (!data.token || !data.user) {
        throw new Error("Incomplete response from server. Please contact support.");
      }
      return data;
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string; error?: string } } }).response === 'object'
      ) {
        const response = (err as { response?: { data?: { message?: string; error?: string } } }).response;
        if (response && (response.data?.message || response.data?.error)) {
          const errorMessage = response.data.message || response.data.error || "Unknown error";
          // Convert technical errors to user-friendly messages
          const userFriendlyMessage = convertToUserFriendlyMessage(errorMessage);
          throw new Error(userFriendlyMessage);
        }
      }
      if (err instanceof Error) {
        const userFriendlyMessage = convertToUserFriendlyMessage(err.message);
        throw new Error(userFriendlyMessage);
      } else {
        throw new Error("An unknown error occurred during login.");
      }
    }
  }
  