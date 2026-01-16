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

  // Form state
  const [createForm, setCreateForm] = useState<AccessRequestFormData>({
    application_id: "",
    justification: "",
  });

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
    if (!confirm("Are you sure you want to approve this request?")) return;

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
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const notes = prompt("Enter rejection notes (optional):");
    if (notes === null) return; // User cancelled

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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Requests</h1>
          <p className="text-gray-600">Manage access requests and approvals</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
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
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">
              {activeTab === "my-requests"
                ? "You have no access requests yet."
                : "No requests found."}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getApplicationName(request.application_id)}
                    </h3>
                    <StatusBadge status={request.status}>
                      {request.status}
                    </StatusBadge>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <span className="font-medium">Requested by:</span>{" "}
                      {getEmployeeName(request.employee_id)}
                    </p>
                    <p>
                      <span className="font-medium">Date:</span>{" "}
                      {formatRelativeDate(request.request_date)}
                    </p>
                    {request.justification && (
                      <p>
                        <span className="font-medium">Justification:</span>{" "}
                        {request.justification}
                      </p>
                    )}
                    {request.admin_notes && (
                      <p>
                        <span className="font-medium">Notes:</span>{" "}
                        {request.admin_notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {request.status === "pending" && canApproveRequests && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApproveRequest(request.id)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {canCreateForOthers ? "Create Access Request" : "Request Access"}
            </h3>

            <div className="space-y-4">
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
                  Application *
                </label>
                <select
                  value={createForm.application_id}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      application_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select application</option>
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name} - {app.category}
                    </option>
                  ))}
                </select>
              </div>

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
