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
  const [myApps, setMyApps] = useState<
    Array<{
      application: Application;
      accessStatus: "active" | "revoked" | "none";
      requestStatus: AccessRequest["status"] | "none";
    }>
  >([]);

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

  const isEmployee = user?.role === "employee";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const isEmployee = user?.role === "employee";

        // Fetch different data based on user role
        let dashboardData: any = null;

        if (isEmployee && user?.id) {
          // For employees: fetch only their data
          const [accessResponse, requestsResponse, appsResponse] =
            await Promise.all([
              api.accessRegistry.getAll({ employee_id: user.id }),
              api.accessRequests.getAll({ employee_id: user.id }),
              api.applications.getAll(),
            ]);

          setUsers([]);
          setApplications(appsResponse.success ? appsResponse.data || [] : []);

          // Set employee-specific stats
          const pendingRequests = (requestsResponse.data || []).filter(
            (r) => r.status === "pending",
          );
          const activeAccess = (accessResponse.data || []).filter(
            (a) => a.status === "active",
          );

          const relatedAppIds = new Set<string>([
            ...(accessResponse.data || []).map((a) => a.application_id),
            ...(requestsResponse.data || []).map((r) => r.application_id),
          ]);

          setStats({
            totalUsers: 1, // Just themselves
            totalApplications: relatedAppIds.size,
            pendingRequests: pendingRequests.length,
            activeAccess: activeAccess.length,
          });

          // Show only their own requests
          const sortedRequests = [...(requestsResponse.data || [])].sort(
            (a, b) =>
              new Date(b.request_date).getTime() -
              new Date(a.request_date).getTime(),
          );
          setRecentRequests(sortedRequests);
          setNotifications([]);

          // Build My Apps list
          const appsById = new Map<string, Application>(
            (appsResponse.data || []).map((app) => [app.id, app]),
          );

          const accessByAppId = new Map<
            string,
            {
              accessStatus: "active" | "revoked";
              ts: number;
            }
          >();
          for (const entry of accessResponse.data || []) {
            const ts = new Date(
              entry.status === "revoked"
                ? entry.revoked_date || entry.granted_date
                : entry.granted_date,
            ).getTime();

            const prev = accessByAppId.get(entry.application_id);

            // Prefer active over revoked; otherwise keep newest
            if (!prev) {
              accessByAppId.set(entry.application_id, {
                accessStatus: entry.status,
                ts,
              });
              continue;
            }

            if (prev.accessStatus !== "active" && entry.status === "active") {
              accessByAppId.set(entry.application_id, {
                accessStatus: "active",
                ts,
              });
              continue;
            }

            if (prev.accessStatus === entry.status && ts > prev.ts) {
              accessByAppId.set(entry.application_id, {
                accessStatus: entry.status,
                ts,
              });
            }
          }

          const latestRequestByAppId = new Map<string, AccessRequest>();
          for (const req of sortedRequests) {
            if (!latestRequestByAppId.has(req.application_id)) {
              latestRequestByAppId.set(req.application_id, req);
            }
          }

          const relatedApps = Array.from(relatedAppIds)
            .map((appId) => {
              const app = appsById.get(appId);
              if (!app) return null;

              const access = accessByAppId.get(appId);
              const latestReq = latestRequestByAppId.get(appId);

              const accessStatus = access?.accessStatus || "none";
              const requestStatus = latestReq?.status || "none";

              const sortTs = Math.max(
                access?.ts || 0,
                latestReq ? new Date(latestReq.request_date).getTime() : 0,
              );

              return {
                application: app,
                accessStatus,
                requestStatus,
                sortTs,
              };
            })
            .filter(Boolean) as Array<{
            application: Application;
            accessStatus: "active" | "revoked" | "none";
            requestStatus: AccessRequest["status"] | "none";
            sortTs: number;
          }>;

          relatedApps.sort((a, b) => b.sortTs - a.sortTs);
          setMyApps(relatedApps.map(({ sortTs: _sortTs, ...rest }) => rest));
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

          setMyApps([]);
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
        {isEmployee ? (
          <>
            {/* My Apps */}
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    My Apps
                  </h2>
                  <p className="text-sm text-gray-600">
                    Apps you have access to or requested
                  </p>
                </div>
                <a
                  href="/access-requests"
                  className="text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  Request access →
                </a>
              </div>

              {myApps.length > 0 ? (
                <div className="space-y-3">
                  {myApps.slice(0, 8).map((item) => (
                    <div
                      key={item.application.id}
                      className="p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {item.application.name}
                            </div>
                            {item.application.category && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {item.application.category}
                              </span>
                            )}
                          </div>
                          {item.application.description && (
                            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {item.application.description}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.application.admin_emails?.length > 0 ? (
                              item.application.admin_emails
                                .slice(0, 3)
                                .map((email) => (
                                  <span
                                    key={email}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    title={email}
                                  >
                                    {email.split("@")[0]}
                                  </span>
                                ))
                            ) : (
                              <span className="text-xs text-gray-500">
                                No admins
                              </span>
                            )}
                            {item.application.admin_emails?.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{item.application.admin_emails.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusBadge
                            status={
                              item.accessStatus === "active"
                                ? "active"
                                : item.accessStatus === "revoked"
                                  ? "revoked"
                                  : "pending"
                            }
                          >
                            {item.accessStatus === "none"
                              ? "no access"
                              : item.accessStatus}
                          </StatusBadge>

                          {item.requestStatus !== "none" && (
                            <StatusBadge status={item.requestStatus}>
                              {item.requestStatus}
                            </StatusBadge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <p>You don’t have any related apps yet.</p>
                  <p className="mt-1">
                    Start by creating an access request from{" "}
                    <a
                      href="/access-requests"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Access Requests
                    </a>
                    .
                  </p>
                </div>
              )}
            </div>

            {/* My Recent Requests */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                My Recent Requests
              </h2>
              {recentRequests.length > 0 ? (
                <div className="space-y-3">
                  {recentRequests.slice(0, 6).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
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
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
};
