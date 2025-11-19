// export const BASE_URL = "http://localhost:3001/api";
// export const BASE_URL = "http://localhost:1433/api";
// export const BASE_URL = "https://vms-backend-il8t.vercel.app/api"
export const BASE_URL = "https://ealpa.esparsh.in/vmsapi/api";

export const FRONTEND_URL = "/vmsapp";
export const INTERNAL_ROUTES = {
  DASHBOARD: "/dashboard",
  EMPLOYEE_LIST: "/employee-list",
  PROFILE: "/profile",
  COMPANIES_LOG: "/companies-log",
  REPORT: "/report",
  INVITE_VISITOR: "/invite-visitor",
  HOST_VISITOR: "/host-visitor",
  VISITORS_LOG: "/visitors-log",
  CHECK_IN_VISITOR: "/check-in-visitor",
  CHECK_OUT_VISITOR: "/check-out-visitor",
  SCANNER: "/scanner",
  LOGIN: "/",
};

export const SIGN_IN_API = `${BASE_URL}/signin`;
export const FORGOT_PASSWORD_API = `${BASE_URL}/forgot-password`;
export const VERIFY_OTP_API = `${BASE_URL}/verify-otp`;
export const RESET_PASSWORD_API = `${BASE_URL}/reset-password`;
export const INVITE_COMPANY_API = `${BASE_URL}/companyInvitation`;
export const COMPANIES_LOG_API = `${BASE_URL}/companyInvitation`;
export const COMPANY_INVITATION_API = (invId: string | number) =>
  `${BASE_URL}/companyInvitation/${invId}`;
export const BACKEND_PROFILE_URL = `${BASE_URL}/profile`;
export const BACKEND_COMPANY_PROFILE_URL = `${BASE_URL}/companyProfile`;

// Profile Image API endpoints
export const PROFILE_IMAGE_UPLOAD_API = `${BASE_URL}/profile/image`;
export const PROFILE_IMAGE_GET_API = `${BASE_URL}/profile/image`;
export const PROFILE_IMAGE_BLOB_API = `${BASE_URL}/profile/image/blob`;
export const PROFILE_IMAGE_DELETE_API = `${BASE_URL}/profile/image`;

// Visitor Image API endpoints
export const VISITOR_IMAGE_UPLOAD_API = `${BASE_URL}/visitor/image`;
export const VISITOR_IMAGE_GET_API = (filePath: string) =>
  `${BASE_URL}/visitor/image?filePath=${encodeURIComponent(filePath)}`;
export const VISITOR_IMAGE_BLOB_API = (filePath: string) =>
  `${BASE_URL}/visitor/image/blob?filePath=${encodeURIComponent(filePath)}`;
export const VISITOR_IMAGE_DELETE_API = (filePath: string) =>
  `${BASE_URL}/visitor/image?filePath=${encodeURIComponent(filePath)}`;

// Guest Image API endpoints (simpler structure)
export const GUEST_IMAGE_UPLOAD_API = `${BASE_URL}/guests/image`;
export const GUEST_IMAGE_GET_API = (filePath: string) =>
  `${BASE_URL}/guests/image?filePath=${encodeURIComponent(filePath)}`;
export const GUEST_IMAGE_BLOB_API = (filePath: string) =>
  `${BASE_URL}/guests/image/blob?filePath=${encodeURIComponent(filePath)}`;
export const GUEST_IMAGE_DELETE_API = (filePath: string) =>
  `${BASE_URL}/guests/image?filePath=${encodeURIComponent(filePath)}`;

// Employee API endpoints
export const INVITE_EMPLOYEE_API = `${BASE_URL}/employeeInvitation/inviteEmployees`;
export const EMPLOYEES_LOG_API = `${BASE_URL}/employeeInvitation/employeesLog`;
export const DELETE_EMPLOYEE_API = (invId: string | number) =>
  `${BASE_URL}/employeeInvitation/${invId}`;

// Visitor API endpoints
export const VISITOR_CHECK_IN_API = `${BASE_URL}/visitorCheckIn`;
export const VISITOR_SCAN_QR_API = `${BASE_URL}/visitorScanQR`;
export const VISITORS_LOG_API = `${BASE_URL}/visitors`;
export const VISITORS_API = `${BASE_URL}/visitors`;
export const VISITORS_BY_HOST_API = `${BASE_URL}/visitors/host`;
export const VISITOR_API = (id: string | number) =>
  `${BASE_URL}/visitors/${id}`;
export const EMPLOYEES_API = `${BASE_URL}/employees`;
export const VISITOR_REPORT_API = `${BASE_URL}/visitorReport`;
export const VISITOR_REPORT_BY_HOST_API = `${BASE_URL}/visitorReportByHost`;

export const APPROVAL_REQUIREMENT_GET_API = `${BASE_URL}/approverequired/organization-settings`;
// Visitor Assets API endpoints
export const VISITOR_ASSET_IMAGE_UPLOAD_API = (
  visitorId: string | number,
  assetIndex: number
) => `${BASE_URL}/visitors/${visitorId}/assets/${assetIndex}/image`;
export const VISITOR_ASSET_IMAGE_GET_API = (
  visitorId: string | number,
  assetIndex: number
) => `${BASE_URL}/visitors/${visitorId}/assets/${assetIndex}/image`;
export const VISITOR_ASSET_IMAGE_BLOB_API = (
  visitorId: string | number,
  assetIndex: number
) => `${BASE_URL}/visitors/${visitorId}/assets/${assetIndex}/image/blob`;
export const VISITOR_ASSET_IMAGE_DELETE_API = (
  visitorId: string | number,
  assetIndex: number
) => `${BASE_URL}/visitors/${visitorId}/assets/${assetIndex}/image`;

// Guest Photos API endpoints
export const GUEST_PHOTO_UPLOAD_API = (
  visitorId: string | number,
  guestIndex: number
) => `${BASE_URL}/visitors/${visitorId}/guests/${guestIndex}/photo`;
export const GUEST_PHOTO_GET_API = (
  visitorId: string | number,
  guestIndex: number
) => `${BASE_URL}/visitors/${visitorId}/guests/${guestIndex}/photo`;
export const GUEST_PHOTO_BLOB_API = (
  visitorId: string | number,
  guestIndex: number
) => `${BASE_URL}/visitors/${visitorId}/guests/${guestIndex}/photo/blob`;
export const GUEST_PHOTO_DELETE_API = (
  visitorId: string | number,
  guestIndex: number
) => `${BASE_URL}/visitors/${visitorId}/guests/${guestIndex}/photo`;

// General asset image API endpoints (for temporary uploads)
export const ASSET_IMAGE_UPLOAD_API = `${BASE_URL}/assets/image`;
export const ASSET_IMAGE_GET_API = (filePath: string) =>
  `${BASE_URL}/assets/image?filePath=${encodeURIComponent(filePath)}`;
export const ASSET_IMAGE_BLOB_API = (filePath: string) =>
  `${BASE_URL}/assets/image/blob?filePath=${encodeURIComponent(filePath)}`;
export const ASSET_IMAGE_DELETE_API = (filePath: string) =>
  `${BASE_URL}/assets/image?filePath=${encodeURIComponent(filePath)}`;

// General guest photo API endpoints (for temporary uploads)
export const GUEST_PHOTO_UPLOAD_API_GENERAL = `${BASE_URL}/guests/image`;
export const GUEST_PHOTO_GET_API_GENERAL = (filePath: string) =>
  `${BASE_URL}/guests/image?filePath=${encodeURIComponent(filePath)}`;
export const GUEST_PHOTO_BLOB_API_GENERAL = (filePath: string) =>
  `${BASE_URL}/guests/image/blob?filePath=${encodeURIComponent(filePath)}`;
export const GUEST_PHOTO_DELETE_API_GENERAL = (filePath: string) =>
  `${BASE_URL}/guests/image?filePath=${encodeURIComponent(filePath)}`;

// Email Configuration API endpoints
export const EMAIL_CONFIG_API = `${BASE_URL}/email-config`;

// Approval Requirement API endpoints
export const APPROVAL_REQUIREMENT_UPDATE_API = `${BASE_URL}/approverequired/organization-settings`;
