// User types
export type UserRole = "super_admin" | "app_admin" | "employee";

export type UserStatus = "active" | "offboard";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  join_date: string;
  offboard_date?: string;
  created_at: string;
  invited_by?: string;
}

// Application types
export interface Application {
  id: string;
  name: string;
  category: string;
  description: string;
  admin_emails: string[];
  created_at: string;
  created_by: string;
}

// Access Request types
export type RequestType = "new" | "update" | "delete";

export type RequestStatus = "pending" | "approved" | "rejected" | "completed";

export interface AccessRequest {
  id: string;
  employee_id: string;
  application_id: string;
  type: RequestType;
  status: RequestStatus;
  request_date: string;
  approved_date?: string;
  approved_by?: string;
  admin_notes?: string;
  justification?: string;
  auto_generated: boolean;
}

// Access Registry types
export type AccessStatus = "active" | "revoked";

export interface AccessRegistry {
  id: string;
  employee_id: string;
  application_id: string;
  granted_date: string;
  granted_by: string;
  status: AccessStatus;
  revoked_date?: string;
  revoked_by?: string;
}

// Notification types
export type NotificationType =
  | "new_request"
  | "offboard_alert"
  | "reminder"
  | "approval_result";

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_request_id?: string;
  is_read: boolean;
  created_at: string;
  sent_to_mattermost: boolean;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface AccessRequestFormData {
  application_id: string;
  justification: string;
}

export interface InviteUserFormData {
  email: string;
  role: UserRole;
  name: string;
}

export interface CreateApplicationFormData {
  name: string;
  category: string;
  description: string;
  admin_emails: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  timestamp: string;
  request_id: string;
}

// Context types
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

// Dashboard data types
export interface DashboardStats {
  totalUsers: number;
  totalApplications: number;
  pendingRequests: number;
  activeAccess: number;
}

export interface UserWithRequests extends User {
  recentRequests: AccessRequest[];
}

export interface ApplicationWithAdmins extends Application {
  adminUsers: User[];
}
