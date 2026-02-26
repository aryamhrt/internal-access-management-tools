import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";
import type { User, Application, AccessRequest, AccessRegistry } from "@/types";
import api from "@/lib/api";

interface UserDetailsPageProps {
  userId: string;
  onBack: () => void;
}

export const UserDetailsPage: React.FC<UserDetailsPageProps> = ({
  userId,
  onBack,
}) => {
  const { user: currentUser } = useAuth();
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [userAccesses, setUserAccesses] = useState<AccessRegistry[]>([]);
  const [userRequests, setUserRequests] = useState<AccessRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);
  const [offboardDate, setOffboardDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [offboardError, setOffboardError] = useState<string>("");

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load user details, accesses, requests, and applications in parallel
      const [userResponse, accessesResponse, requestsResponse, appsResponse] =
        await Promise.all([
          api.users.getById(userId),
          api.accessRegistry.getAll({ employee_id: userId }),
          api.accessRequests.getAll({ employee_id: userId }),
          api.applications.getAll(),
        ]);

      if (userResponse.success) {
        setUserDetails(userResponse.data || null);
      }

      if (accessesResponse.success) {
        setUserAccesses(accessesResponse.data || []);
      }

      if (requestsResponse.success) {
        setUserRequests(requestsResponse.data || []);
      }

      if (appsResponse.success) {
        setApplications(appsResponse.data || []);
      }

      if (
        !userResponse.success ||
        !accessesResponse.success ||
        !requestsResponse.success ||
        !appsResponse.success
      ) {
        setError("Failed to load some user details");
      }
    } catch (error) {
      console.error("Error loading user details:", error);
      setError("Failed to load user details");
    } finally {
      setIsLoading(false);
    }
  };

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || "Unknown Application";
  };

  const getApplicationCategory = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.category || "";
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "app_admin":
        return "bg-blue-100 text-blue-800";
      case "employee":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "revoked":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canManageUsers = currentUser
    ? currentUser.role === "super_admin" ||
      Boolean(currentUser.can_manage_users)
    : false;

  const canDeactivateThisUser =
    canManageUsers &&
    userDetails !== null &&
    userDetails.status === "active" &&
    currentUser !== null &&
    currentUser.id !== userDetails.id;

  const openOffboardModal = () => {
    if (!userDetails) return;
    setOffboardError("");
    setOffboardDate(
      (userDetails.offboard_date || new Date().toISOString()).slice(0, 10),
    );
    setShowOffboardModal(true);
  };

  const handleConfirmOffboard = async () => {
    if (!userDetails || isUpdatingStatus) return;
    if (!canDeactivateThisUser) return;

    if (!offboardDate) {
      setOffboardError("Offboard date is required");
      return;
    }

    setIsUpdatingStatus(true);
    setError("");
    setOffboardError("");

    try {
      const res = await api.users.offboard(userDetails.id, offboardDate);
      if (!res.success) {
        setOffboardError(res.error?.message || "Failed to offboard user");
        return;
      }

      setShowOffboardModal(false);
      await loadUserDetails();
    } catch (e) {
      console.error("Error offboarding user:", e);
      setOffboardError("Failed to offboard user");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Users
          </button>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
          </div>
        </div>

        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !userDetails) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Users
          </button>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error || "User not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2 font-medium"
        >
          ← Back to Users
        </button>
        <div className="flex gap-2 items-center">
          {canManageUsers && (
            <button
              onClick={openOffboardModal}
              disabled={!canDeactivateThisUser || isUpdatingStatus}
              className="px-3 py-1 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                currentUser?.id === userDetails.id
                  ? "You cannot deactivate your own account"
                  : userDetails.status !== "active"
                    ? "User is not active"
                    : undefined
              }
            >
              Mark Offboarded
            </button>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
              userDetails.role,
            )}`}
          >
            {USER_ROLES[userDetails.role]}
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
              userDetails.status,
            )}`}
          >
            {USER_STATUSES[userDetails.status]}
          </span>
        </div>
      </div>

      {/* User Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {userDetails.name}
            </h1>
            <p className="text-gray-600 mt-1 text-lg">{userDetails.email}</p>
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">📅</span>
                <span>
                  Joined: {new Date(userDetails.join_date).toLocaleDateString()}
                </span>
              </div>
              {userDetails.offboard_date && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">🚪</span>
                  <span>
                    Offboarded:{" "}
                    {new Date(userDetails.offboard_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {userDetails.invited_by && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">👤</span>
                  <span>Invited by: {userDetails.invited_by}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right ml-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-2">
              <span className="text-2xl font-bold text-blue-600">
                {userAccesses.length}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">
              Active Accesses
            </div>
          </div>
        </div>
      </div>

      {showOffboardModal && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Offboard User
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Set the offboard date and mark this user as offboarded.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900">
                  {userDetails.name}
                </div>
                <div className="text-sm text-gray-600">{userDetails.email}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offboard Date
                </label>
                <input
                  type="date"
                  value={offboardDate}
                  onChange={(e) => setOffboardDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {offboardError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{offboardError}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowOffboardModal(false)}
                disabled={isUpdatingStatus}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOffboard}
                disabled={isUpdatingStatus}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingStatus ? "Updating..." : "Confirm Offboard"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* App Access Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">🔓</span>
              Application Access
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Applications this user currently has access to
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {userAccesses.length > 0 ? (
              userAccesses.map((access) => (
                <div key={access.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {getApplicationName(access.application_id)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {getApplicationCategory(access.application_id)}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <div>
                        Granted:{" "}
                        {new Date(access.granted_date).toLocaleDateString()}
                      </div>
                      {access.granted_by && <div>By: {access.granted_by}</div>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-3">🔓</div>
                <p className="text-gray-500 font-medium">
                  No active application access
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  This user hasn't been granted access to any applications yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Access Requests Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              Access Requests
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              This user's access requests history
            </p>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {userRequests.filter((request) => request.status !== "approved")
              .length > 0 ? (
              userRequests
                .filter((request) => request.status !== "approved")
                .map((request) => (
                  <div key={request.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {getApplicationName(request.application_id)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.type} •{" "}
                          {new Date(request.request_date).toLocaleDateString()}
                        </p>
                        {request.admin_notes && (
                          <p className="text-xs text-gray-600 mt-1">
                            Note: {request.admin_notes}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500 font-medium">
                  No pending access requests
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  All requests have been processed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
