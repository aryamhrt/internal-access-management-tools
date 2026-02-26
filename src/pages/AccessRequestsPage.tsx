import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatRelativeDate } from "@/lib/utils";
import { hasRole } from "@/lib/utils";

import type {
  AccessRequest,
  AccessRequestFormData,
  User,
  Application,
} from "@/types";

export const AccessRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "my-requests" | "pending-approval" | "all-requests"
  >("my-requests");
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [approvalAction, setApprovalAction] = useState<null | {
    type: "approve" | "reject";
    requestId: string;
  }>(null);
  const isBlockingAction = approvalAction !== null;

  // Form state
  const [createForm, setCreateForm] = useState<AccessRequestFormData>({
    application_id: "",
    justification: "",
  });

  // Searchable application select state
  const [applicationSearch, setApplicationSearch] = useState("");
  const [showApplicationDropdown, setShowApplicationDropdown] = useState(false);

  // For admin creating requests on behalf of others
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload requests when tab changes or user changes
  useEffect(() => {
    if (applications.length > 0) {
      // Only reload if applications are loaded
      loadRequests();
    }
  }, [activeTab, user?.id, applications.length]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load applications (needed for all users)
      await loadApplications();

      // Load users if admin
      if (user?.role && hasRole(user.role, "app_admin")) {
        await loadUsers();
      }

      // Load requests based on user role and active tab
      await loadRequests();
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
      } else {
        console.error("Failed to load applications:", response);
        setApplications([]);
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
      setApplications([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.users.getAll();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        console.error("Failed to load users:", response);
        setUsers([]);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
  };

  const loadRequests = async () => {
    try {
      let filters: any = {};

      if (activeTab === "my-requests") {
        // Show current user's requests
        filters.employee_id = user?.id;
      } else if (activeTab === "pending-approval") {
        // Show requests for applications the user can approve
        filters.status = "pending";
      } else if (activeTab === "all-requests" && user?.role === "super_admin") {
        // Super admin sees all
      }

      const response = await api.accessRequests.getAll(filters);
      if (response.success && response.data) {
        let filteredRequests = response.data;

        // For app_admin users in pending-approval tab, filter by applications they manage
        if (activeTab === "pending-approval" && user?.role === "app_admin") {
          const manageableAppIds = applications
            .filter((app) => app.admin_emails?.includes(user.email))
            .map((app) => app.id);

          filteredRequests = response.data.filter((request) =>
            manageableAppIds.includes(request.application_id),
          );

          console.log(
            `Filtered ${response.data.length} requests to ${filteredRequests.length} for app_admin ${user.email}`,
          );
        }

        setRequests(filteredRequests);
      } else {
        console.error("Failed to load requests:", response);
        setRequests([]);
      }
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  };

  const handleCreateRequest = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const employeeId =
        user?.role && hasRole(user.role, "app_admin") && selectedEmployeeId
          ? selectedEmployeeId
          : user?.id;

      // Validation: Check for duplicate requests
      console.log(
        "Validating request for employee:",
        employeeId,
        "application:",
        createForm.application_id,
      );

      // Check for existing pending requests
      try {
        const pendingRequestsResponse = await api.accessRequests.getAll({
          employee_id: employeeId,
          application_id: createForm.application_id,
          status: "pending",
        });

        if (
          pendingRequestsResponse.success &&
          pendingRequestsResponse.data &&
          pendingRequestsResponse.data.length > 0
        ) {
          alert(
            `A pending request for this application already exists. Please wait for approval or contact your administrator.`,
          );
          setIsCreating(false);
          return;
        }
      } catch (error) {
        console.warn(
          "Could not check pending requests, proceeding with validation:",
          error,
        );
      }

      // Check for existing active registry entries
      try {
        const activeRegistryResponse = await api.accessRegistry.getAll({
          employee_id: employeeId,
          application_id: createForm.application_id,
          status: "active",
        });

        if (
          activeRegistryResponse.success &&
          activeRegistryResponse.data &&
          activeRegistryResponse.data.length > 0
        ) {
          alert(
            `Access to this application is already granted. No need to create a new request.`,
          );
          setIsCreating(false);
          return;
        }
      } catch (error) {
        console.warn(
          "Could not check active registry, proceeding with validation:",
          error,
        );
      }

      const requestData = {
        application_id: createForm.application_id,
        justification: createForm.justification,
        employee_id: employeeId,
      };

      console.log("Sending request data:", requestData);
      try {
        const response = await api.accessRequests.create(requestData);
        console.log("API response:", response);

        if (response.success) {
          setShowCreateForm(false);
          setCreateForm({ application_id: "", justification: "" });
          setSelectedEmployeeId("");

          // Reload requests after successful creation
          loadRequests();
        } else {
          console.error("API returned error:", response.error);
          console.error("Full response:", JSON.stringify(response, null, 2));
          const errorMessage = response.error?.message || "Unknown error";
          alert(`Failed to create request: ${errorMessage}`);
        }
      } catch (networkError) {
        console.error("Network error:", networkError);
        alert("Network error: Failed to connect to server");
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert("Error creating request");
    } finally {
      setIsCreating(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (isBlockingAction) return;
    if (!confirm("Are you sure you want to approve this request?")) return;

    setApprovalAction({ type: "approve", requestId });

    try {
      // First get the request details
      const requestDetails = await api.accessRequests.getById(requestId);
      if (!requestDetails.success || !requestDetails.data) {
        alert("Failed to get request details");
        return;
      }

      const request = requestDetails.data;

      // Approve the request
      const approveResponse = await api.accessRequests.approve(
        requestId,
        undefined,
        user?.id,
      );

      if (approveResponse.success) {
        // Create access registry entry
        const registryResponse = await api.accessRegistry.create({
          employee_id: request.employee_id,
          application_id: request.application_id,
          granted_by: user?.email || user?.id,
        });

        if (registryResponse.success) {
          loadRequests(); // Refresh the list
          alert("Request approved and access granted successfully!");
        } else {
          alert(
            "Request approved but failed to grant access. Please contact administrator.",
          );
        }
      } else {
        alert("Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Error approving request");
    } finally {
      setApprovalAction(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (isBlockingAction) return;
    const notes = prompt("Enter rejection notes (optional):");
    if (notes === null) return; // User cancelled

    setApprovalAction({ type: "reject", requestId });

    try {
      const response = await api.accessRequests.reject(
        requestId,
        notes,
        user?.id,
      );
      if (response.success) {
        loadRequests(); // Refresh the list
      } else {
        alert("Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("Error rejecting request");
    } finally {
      setApprovalAction(null);
    }
  };

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || `Application ${appId}`;
  };

  const getEmployeeName = (employeeId: string) => {
    if (employeeId === user?.id) return "You";
    const employee = users.find((u) => u.id === employeeId);
    return employee?.name || `User ${employeeId}`;
  };

  const canApproveRequests = user?.role
    ? hasRole(user.role, "app_admin")
    : false;
  const canCreateForOthers = user?.role
    ? hasRole(user.role, "app_admin")
    : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {isBlockingAction && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {approvalAction.type === "approve"
                    ? "Approving request..."
                    : "Rejecting request..."}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">
                  Please wait. Do not close or refresh.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-gray-600">Manage access requests and approvals</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
          disabled={isBlockingAction}
        >
          <span>+</span>
          Request Access
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("my-requests")}
            disabled={isBlockingAction}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "my-requests"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            My Requests
          </button>
          {canApproveRequests && (
            <button
              onClick={() => setActiveTab("pending-approval")}
              disabled={isBlockingAction}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending-approval"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Approval
            </button>
          )}
          {user?.role === "super_admin" && (
            <button
              onClick={() => setActiveTab("all-requests")}
              disabled={isBlockingAction}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "all-requests"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Requests
            </button>
          )}
        </nav>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">
            {activeTab === "my-requests"
              ? "You have no access requests yet."
              : "No requests found."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: compact accordion */}
          <div className="space-y-3 md:hidden">
            {requests.map((request) => (
              <details
                key={request.id}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {getApplicationName(request.application_id)}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatRelativeDate(request.request_date)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={request.status}>
                        {request.status}
                      </StatusBadge>

                      {request.status === "pending" && canApproveRequests && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            disabled={isBlockingAction}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleApproveRequest(request.id);
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={isBlockingAction}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRejectRequest(request.id);
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </summary>

                <div className="pt-3 mt-3 border-t border-gray-100 space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-medium">Requested by:</span>{" "}
                    {getEmployeeName(request.employee_id)}
                  </div>
                  {request.justification && (
                    <div>
                      <span className="font-medium">Justification:</span>{" "}
                      <span className="text-gray-600">
                        {request.justification}
                      </span>
                    </div>
                  )}
                  {request.admin_notes && (
                    <div>
                      <span className="font-medium">Notes:</span>{" "}
                      <span className="text-gray-600">
                        {request.admin_notes}
                      </span>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Application
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Justification
                    </th>
                    {(canApproveRequests || activeTab !== "my-requests") && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getApplicationName(request.application_id)}
                        </div>
                        {request.admin_notes && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[24rem]">
                            Note: {request.admin_notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {getEmployeeName(request.employee_id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeDate(request.request_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status}>
                          {request.status}
                        </StatusBadge>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 text-sm text-gray-600">
                        <div
                          className="max-w-[32rem] truncate"
                          title={request.justification || ""}
                        >
                          {request.justification || "-"}
                        </div>
                      </td>
                      {(canApproveRequests || activeTab !== "my-requests") && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === "pending" &&
                          canApproveRequests ? (
                            <div className="inline-flex gap-2">
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={isBlockingAction}
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                disabled={isBlockingAction}
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                Reject
                              </Button>
                            </div>
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
          </div>
        </>
      )}

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {canCreateForOthers ? "Create Access Request" : "Request Access"}
            </h3>

            <div className="space-y-4">
              {/* Searchable Application Select */}
              {(() => {
                const selectedApp = applications.find(
                  (a) => a.id === createForm.application_id,
                );

                const filteredApps = applications.filter((app) => {
                  const q = applicationSearch.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    app.name.toLowerCase().includes(q) ||
                    app.category.toLowerCase().includes(q)
                  );
                });

                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Application *
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        value={
                          showApplicationDropdown
                            ? applicationSearch
                            : selectedApp
                              ? `${selectedApp.name} - ${selectedApp.category}`
                              : applicationSearch
                        }
                        onChange={(e) => {
                          setApplicationSearch(e.target.value);
                          setShowApplicationDropdown(true);
                          // Clear selection when user starts typing a new query
                          setCreateForm({
                            ...createForm,
                            application_id: "",
                          });
                        }}
                        onFocus={() => {
                          setShowApplicationDropdown(true);
                          // If there is a selected app, start search from empty for convenience
                          if (createForm.application_id) {
                            setApplicationSearch("");
                            setCreateForm({
                              ...createForm,
                              application_id: "",
                            });
                          }
                        }}
                        onBlur={() => {
                          // Delay closing to allow click selection
                          window.setTimeout(
                            () => setShowApplicationDropdown(false),
                            150,
                          );
                        }}
                        placeholder="Search application by name or category..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />

                      {showApplicationDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-auto">
                          {filteredApps.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              No applications found
                            </div>
                          ) : (
                            filteredApps.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  setCreateForm({
                                    ...createForm,
                                    application_id: app.id,
                                  });
                                  setApplicationSearch(
                                    `${app.name} - ${app.category}`,
                                  );
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
                );
              })()}
              {canCreateForOthers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request for Employee *
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select employee</option>
                    <option value={user?.id || ""}>
                      Myself ({user?.name})
                    </option>
                    {users
                      .filter((u) => u.id !== user?.id && u.role === "employee")
                      .map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.email})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Justification *
                </label>
                <textarea
                  value={createForm.justification}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      justification: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Why do you need access to this application?"
                  rows={3}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={
                  !createForm.application_id ||
                  !createForm.justification ||
                  (canCreateForOthers && !selectedEmployeeId && !user?.id) ||
                  isCreating
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  "Create Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
