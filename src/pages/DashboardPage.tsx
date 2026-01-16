import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatRelativeDate } from "@/lib/utils";

import type {
  DashboardStats,
  AccessRequest,
  Notification,
  User,
} from "@/types";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRequests, setRecentRequests] = useState<AccessRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard data and users in parallel
        const [dashboardResponse, usersResponse] = await Promise.all([
          api.dashboard.getStats(),
          api.users.getAll(),
        ]);

        if (dashboardResponse.success && dashboardResponse.data) {
          setStats({
            totalUsers: (dashboardResponse.data as any).total_users || 0,
            totalApplications:
              (dashboardResponse.data as any).total_applications || 0,
            pendingRequests:
              (dashboardResponse.data as any).pending_requests || 0,
            activeAccess: (dashboardResponse.data as any).active_access || 0,
          });
          setRecentRequests(
            (dashboardResponse.data as any).recent_requests || [],
          );
          setNotifications((dashboardResponse.data as any).notifications || []);
        }

        if (usersResponse.success) {
          setUsers(usersResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
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
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Access Requests */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Access Requests
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
                      {getUserName(request.employee_id)} - Application #
                      {request.application_id}
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
