import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/utils";
import { hasRole } from "@/lib/utils";

import type { AccessRegistry, User, Application } from "@/types";

export const AccessRegistryPage: React.FC = () => {
  const { user } = useAuth();
  const [registry, setRegistry] = useState<AccessRegistry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "revoked"
  >("all");
  const [filterApplication, setFilterApplication] = useState<string>("all");

  // Searchable application filter
  const [applicationSearch, setApplicationSearch] = useState("");
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);

  // Employee search (name/email)
  const [employeeSearch, setEmployeeSearch] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load applications and users (cached)
      await loadApplications();
      await loadUsers();
      // Load registry
      await loadRegistry();
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await api.applications.getAll();
      if (response.success && response.data) {
        setApplications(response.data);
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    }
  };

  const loadUsers = async () => {
    try {
      if (user?.role === "employee") {
        setUsers([]);
        return;
      }

      const response = await api.users.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const loadRegistry = async () => {
    try {
      const filters: any = {};
      if (filterStatus !== "all") {
        filters.status = filterStatus;
      }

      // Employees should only see their own access registry entries
      if (user?.role === "employee" && user.id) {
        filters.employee_id = user.id;
      }

      const response = await api.accessRegistry.getAll(filters);
      if (response.success && response.data) {
        setRegistry(response.data);
      }
    } catch (error) {
      console.error("Failed to load registry:", error);
    }
  };

  const handleRevokeAccess = async (registryId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this access? This action cannot be undone.",
      )
    )
      return;

    try {
      const response = await api.accessRegistry.revoke(registryId, user?.id);
      if (response.success) {
        loadRegistry();
      } else {
        alert("Failed to revoke access");
      }
    } catch (error) {
      console.error("Error revoking access:", error);
      alert("Error revoking access");
    }
  };

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || `Application ${appId}`;
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || `User ${userId}`;
  };

  const userById = useMemo(() => {
    return new Map(users.map((u) => [u.id, u] as const));
  }, [users]);

  // Determine which applications can be shown/filtered in this view
  const manageableApplications =
    user?.role === "super_admin"
      ? applications
      : user?.role === "app_admin"
        ? applications.filter((app) => app.admin_emails?.includes(user.email))
        : [];

  const visibleApplications = (() => {
    if (user?.role === "super_admin") return applications;
    if (user?.role === "app_admin") return manageableApplications;

    // employee: only show apps present in their registry entries
    const appIds = new Set(registry.map((r) => r.application_id));
    return applications.filter((app) => appIds.has(app.id));
  })();

  const selectedApplication =
    filterApplication === "all"
      ? null
      : visibleApplications.find((app) => app.id === filterApplication) || null;

  const filteredVisibleApplications = useMemo(() => {
    const q = applicationSearch.trim().toLowerCase();
    if (!q) return visibleApplications;

    return visibleApplications.filter((app) => {
      const name = (app.name || "").toLowerCase();
      const category = (app.category || "").toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [applicationSearch, visibleApplications]);

  const filteredRegistry = registry.filter((entry) => {
    // Role-based visibility
    if (user?.role === "employee") {
      if (entry.employee_id !== user.id) return false;
    } else if (user?.role === "app_admin") {
      const canManageApp = manageableApplications.some(
        (app) => app.id === entry.application_id,
      );
      if (!canManageApp) return false;
    }

    // Filter by status
    if (filterStatus !== "all" && entry.status !== filterStatus) return false;

    // Filter by selected application
    if (
      filterApplication !== "all" &&
      entry.application_id !== filterApplication
    )
      return false;

    // Filter by employee name/email (admin only)
    const employeeQ = employeeSearch.trim().toLowerCase();
    if (employeeQ && user?.role !== "employee") {
      const employee = userById.get(entry.employee_id);
      const haystack = `${employee?.name || ""} ${employee?.email || ""}`
        .trim()
        .toLowerCase();

      const tokens = employeeQ.split(/\s+/).filter(Boolean);
      if (tokens.length > 0 && !tokens.every((t) => haystack.includes(t))) {
        return false;
      }
    }

    return true;
  });

  const canRevokeAccess = user?.role ? hasRole(user.role, "app_admin") : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Registry</h1>
          <p className="text-gray-600">Manage granted application access</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Filter by status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as "all" | "active" | "revoked");
              // No need to reload since we're filtering client-side
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Access</option>
            <option value="active">Active Only</option>
            <option value="revoked">Revoked Only</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Filter by application:
          </label>
          <div className="relative">
            <input
              type="text"
              value={
                showApplicationDropdown
                  ? applicationSearch
                  : selectedApplication
                    ? `${selectedApplication.name} - ${selectedApplication.category}`
                    : applicationSearch
              }
              onChange={(e) => {
                setApplicationSearch(e.target.value);
                setShowApplicationDropdown(true);
                if (filterApplication !== "all") {
                  setFilterApplication("all");
                }
              }}
              onFocus={() => {
                setShowApplicationDropdown(true);
              }}
              onBlur={() => {
                window.setTimeout(() => setShowApplicationDropdown(false), 150);
              }}
              placeholder="Search application by name or category..."
              className="w-80 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {showApplicationDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setFilterApplication("all");
                    setApplicationSearch("");
                    setShowApplicationDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">
                    All Applications
                  </div>
                  <div className="text-xs text-gray-500">
                    Clear application filter
                  </div>
                </button>

                {filteredVisibleApplications.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No applications found
                  </div>
                ) : (
                  filteredVisibleApplications.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setFilterApplication(app.id);
                        setApplicationSearch(`${app.name} - ${app.category}`);
                        setShowApplicationDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">
                        {app.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {app.category}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {user?.role !== "employee" && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Search employee:
            </label>
            <input
              type="text"
              value={employeeSearch}
              onChange={(e) => setEmployeeSearch(e.target.value)}
              placeholder="Name or email..."
              className="w-72 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {/* Registry Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {filteredRegistry.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filterStatus === "all"
                ? "No access records found."
                : `No ${filterStatus} access records found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Granted Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Granted By
                  </th>
                  {filterStatus !== "active" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revoked Date
                    </th>
                  )}
                  {filterStatus !== "revoked" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistry.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getApplicationName(entry.application_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getUserName(entry.employee_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={entry.status}>
                        {entry.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeDate(entry.granted_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getUserName(entry.granted_by)}
                    </td>
                    {filterStatus !== "active" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.revoked_date ? (
                          <div>
                            {formatRelativeDate(entry.revoked_date)}
                            {entry.revoked_by && (
                              <div className="text-xs text-gray-400">
                                by {getUserName(entry.revoked_by)}
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    )}
                    {filterStatus !== "revoked" && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {entry.status === "active" && canRevokeAccess ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() =>
                              handleRevokeAccess(entry.id.toString())
                            }
                          >
                            Revoke
                          </Button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Count */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {filteredRegistry.length}{" "}
            {filterStatus === "all" ? "" : filterStatus + " "}access record
            {filteredRegistry.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </div>
  );
};
