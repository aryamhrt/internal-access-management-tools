import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { UserRole, UserStatus, RequestStatus, AccessStatus } from '@/types';
import { USER_ROLES, USER_STATUSES, REQUEST_STATUSES, ACCESS_STATUSES } from './constants';

/**
 * Format a date string to a human-readable format
 */
export const formatDate = (dateString: string, formatString = 'PPP'): string => {
  try {
    return format(parseISO(dateString), formatString);
  } catch {
    return dateString;
  }
};

/**
 * Format a date string to show relative time (e.g., "2 hours ago")
 */
export const formatRelativeDate = (dateString: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

/**
 * Get display name for user role
 */
export const getRoleDisplayName = (role: UserRole): string => {
  return USER_ROLES[role] || role;
};

/**
 * Get display name for user status
 */
export const getStatusDisplayName = (status: UserStatus): string => {
  return USER_STATUSES[status] || status;
};

/**
 * Get display name for request status
 */
export const getRequestStatusDisplayName = (status: RequestStatus): string => {
  return REQUEST_STATUSES[status] || status;
};

/**
 * Get display name for access status
 */
export const getAccessStatusDisplayName = (status: AccessStatus): string => {
  return ACCESS_STATUSES[status] || status;
};

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate a request ID for API calls
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

/**
 * Capitalize the first letter of a string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    employee: 1,
    app_admin: 2,
    super_admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

/**
 * Check if user can manage application
 */
export const canManageApplication = (userRole: UserRole, appAdminEmails: string[], userEmail: string): boolean => {
  if (userRole === 'super_admin') return true;
  if (userRole === 'app_admin') return appAdminEmails.includes(userEmail);
  return false;
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Get CSS class for status badges
 */
export const getStatusBadgeClass = (status: string): string => {
  const statusClasses: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    revoked: 'bg-red-100 text-red-800',
    offboard: 'bg-gray-100 text-gray-800',
  };

  return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};