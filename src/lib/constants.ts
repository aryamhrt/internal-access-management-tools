import type {
  UserRole,
  UserStatus,
  RequestType,
  RequestStatus,
  AccessStatus,
  NotificationType,
} from "@/types";

// User role constants
export const USER_ROLES: Record<UserRole, string> = {
  super_admin: "Super Admin",
  app_admin: "App Admin",
  employee: "Employee",
} as const;

// User status constants
export const USER_STATUSES: Record<UserStatus, string> = {
  active: "Active",
  offboard: "Offboarded",
} as const;

// Request type constants
export const REQUEST_TYPES: Record<RequestType, string> = {
  new: "New Access",
  update: "Update Access",
  delete: "Remove Access",
} as const;

// Request status constants
export const REQUEST_STATUSES: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
} as const;

// Access status constants
export const ACCESS_STATUSES: Record<AccessStatus, string> = {
  active: "Active",
  revoked: "Revoked",
} as const;

// Notification type constants
export const NOTIFICATION_TYPES: Record<NotificationType, string> = {
  new_request: "New Request",
  offboard_alert: "Offboard Alert",
  reminder: "Reminder",
  approval_result: "Approval Result",
} as const;

// API endpoints (relative to base URL)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  USERS: "/users",
  APPLICATIONS: "/applications",
  ACCESS_REQUESTS: "/access-requests",
  ACCESS_REGISTRY: "/access-registry",
  NOTIFICATIONS: "/notifications",
  DASHBOARD: "/dashboard",
} as const;

// Environment variables
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  ALLOWED_DOMAIN: import.meta.env.VITE_ALLOWED_DOMAIN,
  MATTERMOST_WEBHOOK_URL: import.meta.env.VITE_MATTERMOST_WEBHOOK_URL,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || "development",
  BACKEND_TYPE: import.meta.env.VITE_BACKEND_TYPE || "appscript", // "appscript" | "notion"
  NOTION_API_KEY: import.meta.env.VITE_NOTION_API_KEY,
  NOTION_DATABASES: {
    USERS: import.meta.env.VITE_NOTION_USERS_DB,
    APPLICATIONS: import.meta.env.VITE_NOTION_APPLICATIONS_DB,
    ACCESS_REQUESTS: import.meta.env.VITE_NOTION_ACCESS_REQUESTS_DB,
    ACCESS_REGISTRY: import.meta.env.VITE_NOTION_ACCESS_REGISTRY_DB,
    NOTIFICATIONS: import.meta.env.VITE_NOTION_NOTIFICATIONS_DB,
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
} as const;
