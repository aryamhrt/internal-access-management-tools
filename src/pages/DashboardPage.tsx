import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDate } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";

import type {
  DashboardStats,
  AccessRequest,
  Notification,
  User,
  Application,
} from "@/types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<AccessRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  // Helper function to get application name by ID
  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || `Application ${appId}`;
  };

  const isEmployee = user?.role === USER_ROLES.employee;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const isEmployee = user?.role === USER_ROLES.employee;

        // Fetch different data based on user role
        let dashboardData: any = null;

        if (isEmployee && user?.id) {
          // For employees: fetch only their data
          const [
            accessResponse,
            requestsResponse,
            usersResponse,
            appsResponse,
          ] = await Promise.all([
            api.accessRegistry.getAll({ employee_id: user.id }),
            api.accessRequests.getAll({ employee_id: user.id }),
            api.users.getAll(),
            api.applications.getAll(),
          ]);

          if (usersResponse.success) {
            setUsers(usersResponse.data || []);
          }
          if (appsResponse.success) {
            setApplications(appsResponse.data || []);
          }

          // Set employee-specific stats
          const pendingRequests = (requestsResponse.data || []).filter(
            (r) => r.status === "pending",
          );
          const activeAccess = (accessResponse.data || []).filter(
            (a) => a.status === "active",
          );

          setStats({
            totalUsers: 1, // Just themselves
            totalApplications: 0, // Not relevant for employees
            pendingRequests: pendingRequests.length,
            activeAccess: activeAccess.length,
          });

          // Show only their own requests
          setRecentRequests(requestsResponse.data || []);
        } else {
          // For admins: fetch all data
          const [dashboardResponse, usersResponse, appsResponse] =
            await Promise.all([
              api.dashboard.getStats(),
              api.users.getAll(),
              api.applications.getAll(),
            ]);

          if (dashboardResponse.success && dashboardResponse.data) {
            dashboardData = dashboardResponse.data;
            setStats({
              totalUsers: (dashboardData as any).total_users || 0,
              totalApplications: (dashboardData as any).total_applications || 0,
              pendingRequests: (dashboardData as any).pending_requests || 0,
              activeAccess: (dashboardData as any).active_access || 0,
            });
            setRecentRequests((dashboardData as any).recent_requests || []);
            setNotifications((dashboardData as any).notifications || []);
          }

          if (usersResponse.success) {
            setUsers(usersResponse.data || []);
          }
          if (appsResponse.success) {
            setApplications(appsResponse.data || []);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div
          className={`grid gap-6 ${isEmployee ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"}`}
        >
          {isEmployee ? (
            // Employee view: only relevant stats
            <>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      My Pending Requests
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.pendingRequests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      My Active Access
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.activeAccess}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Admin view: all stats
            <>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🖥️</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Applications
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.totalApplications}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.pendingRequests}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Access
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.activeAccess}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Access Requests */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {isEmployee ? "My Access Requests" : "Recent Access Requests"}
          </h2>
          {recentRequests.length > 0 ? (
            <div className="space-y-3">
              {recentRequests.slice(0, 5).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getUserName(request.employee_id)} -{" "}
                      {getApplicationName(request.application_id)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatRelativeDate(request.request_date)}
                    </p>
                  </div>
                  <StatusBadge status={request.status}>
                    {request.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent requests</p>
          )}
        </div>

        {/* Notifications */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Notifications
          </h2>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 bg-blue-50 rounded-md"
                >
                  <p className="text-sm font-medium text-blue-900">
                    {notification.title}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    {formatRelativeDate(notification.created_at)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No notifications</p>
          )}
        </div>
      </div>
    </div>
  );
};
