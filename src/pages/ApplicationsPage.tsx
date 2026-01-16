import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Application {
  id: string;
  name: string;
  category: string;
  description: string;
  admin_emails: string[];
  created_at: string;
  created_by: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  join_date: string;
}

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [showAssignAdmin, setShowAssignAdmin] = useState<Application | null>(
    null,
  );

  // Loading states for operations
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Filter states
  const [adminEmailFilter, setAdminEmailFilter] = useState("");

  // Form states
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  const [assignForm, setAssignForm] = useState({
    application_id: "",
    user_id: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load fresh data from API
      const [appsResponse, usersResponse] = await Promise.all([
        api.applications.getAll(),
        api.users.getAll(),
      ]);

      if (appsResponse.success && usersResponse.success) {
        setApplications(appsResponse.data || []);
        setAllUsers(usersResponse.data || []);
        console.log(
          "Loaded from API:",
          appsResponse.data?.length,
          "apps,",
          usersResponse.data?.length,
          "users",
        );
      } else {
        setError("Failed to load data from API");
      }
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    // Use the combined data load instead of separate call
    await loadInitialData();
  };

  const createApplication = async () => {
    if (isCreating) return; // Prevent multiple submissions

    setIsCreating(true);
    try {
      const result = await api.applications.create({
        name: createForm.name,
        category: createForm.category,
        description: createForm.description,
        created_by: user?.email || "",
      });

      if (result.success) {
        setShowCreateForm(false);
        setCreateForm({ name: "", category: "", description: "" });
        loadApplications(); // Refresh the list
        console.log("Application created successfully");
      } else {
        alert(
          "Failed to create application: " +
            (result.error?.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error creating application:", error);
      alert("Error creating application");
    } finally {
      setIsCreating(false);
    }
  };

  const updateApplication = async () => {
    if (!editingApp || isUpdating) return; // Prevent multiple submissions

    setIsUpdating(true);
    try {
      const result = await api.applications.update({
        id: editingApp.id.toString(),
        name: editForm.name,
        category: editForm.category,
        description: editForm.description,
        admin_emails: (editingApp.admin_emails || []).join(","),
      });

      if (result.success) {
        setEditingApp(null);
        setEditForm({ name: "", category: "", description: "" });
        loadApplications(); // Refresh the list
        console.log("Application updated successfully");
      } else {
        alert(
          "Failed to update application: " +
            (result.error?.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error updating application:", error);
      alert("Error updating application");
    } finally {
      setIsUpdating(false);
    }
  };

  const assignAdminToApplication = async () => {
    if (!showAssignAdmin || !assignForm.user_id || isAssigning) return; // Prevent multiple submissions

    setIsAssigning(true);
    try {
      const selectedUser = allUsers.find((u) => u.id === assignForm.user_id);
      if (!selectedUser) return;

      // Get current admin emails and add the new one if not already present
      const currentAdmins = showAssignAdmin.admin_emails || [];
      const updatedAdmins = currentAdmins.includes(selectedUser.email)
        ? currentAdmins
        : [...currentAdmins, selectedUser.email];

      const result = await api.applications.update({
        id: showAssignAdmin.id.toString(),
        name: showAssignAdmin.name,
        category: showAssignAdmin.category,
        description: showAssignAdmin.description,
        admin_emails: updatedAdmins.join(","),
      });

      if (result.success) {
        setShowAssignAdmin(null);
        setAssignForm({ application_id: "", user_id: "" });
        loadApplications(); // Refresh the list
        console.log("Admin assigned successfully");
      } else {
        alert(
          "Failed to assign admin: " +
            (result.error?.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error assigning admin:", error);
      alert("Error assigning admin");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this application? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const result = await api.applications.delete(appId);

      if (result.success) {
        loadApplications(); // Refresh the list
        console.log("Application deleted successfully");
      } else {
        alert(
          "Failed to delete application: " +
            (result.error?.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error deleting application:", error);
      alert("Error deleting application");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">Loading applications...</p>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All Applications
            </h2>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
          <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
        </div>

        <div className="grid gap-6">
          {/* Loading skeletons */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded border border-gray-200 p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48 mb-2"></div>
                </div>
                <div className="flex gap-1">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-600">View your applications</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            All Applications
          </h2>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-600">
              {
                applications.filter((app) => {
                  if (!adminEmailFilter.trim()) return true;
                  const searchTerm = adminEmailFilter.toLowerCase();
                  return (
                    app.admin_emails?.some((email) =>
                      email.toLowerCase().includes(searchTerm),
                    ) || false
                  );
                }).length
              }{" "}
              of {applications.length} applications
            </p>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Filter by Admin Email:
              </label>
              <input
                type="text"
                value={adminEmailFilter}
                onChange={(e) => setAdminEmailFilter(e.target.value)}
                placeholder="Search admin emails..."
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        {user?.role === "super_admin" && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add Application
          </button>
        )}
      </div>

      <div className="grid gap-6">
        {applications
          .filter((app) => {
            if (!adminEmailFilter.trim()) return true;
            const searchTerm = adminEmailFilter.toLowerCase();
            return (
              app.admin_emails?.some((email) =>
                email.toLowerCase().includes(searchTerm),
              ) || false
            );
          })
          .map((app) => (
            <div
              key={app.id}
              className="bg-white rounded border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {app.name}
                    </h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {app.category}
                    </span>
                  </div>
                  {app.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {app.description}
                    </p>
                  )}
                </div>

                <div className="flex gap-1 ml-4">
                  <button
                    onClick={() => {
                      setEditingApp(app);
                      setEditForm({
                        name: app.name,
                        category: app.category,
                        description: app.description,
                      });
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Edit application"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignAdmin(app);
                      setAssignForm({ application_id: app.id, user_id: "" });
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Assign admin"
                  >
                    👤
                  </button>
                  {user?.role === "super_admin" && (
                    <button
                      onClick={() => handleDeleteApplication(app.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded"
                      title="Delete application"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              {/* Admin emails in compact format */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {app.admin_emails && app.admin_emails.length > 0 ? (
                    app.admin_emails.slice(0, 3).map((email, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {email.split("@")[0]}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No admins</span>
                  )}
                  {app.admin_emails && app.admin_emails.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{app.admin_emails.length - 3} more
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}

        {applications.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No applications found</p>
            <p className="text-sm text-gray-400 mt-2">
              Contact your administrator to add applications
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-3">
        <button
          onClick={() => loadInitialData()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={isLoading}
          title="Refresh data from server"
        >
          {isLoading ? "Loading..." : "🔄 Refresh"}
        </button>
      </div>

      {/* Create Application Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Application
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Jira, Slack, GitHub"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Development">Development</option>
                  <option value="Communication">Communication</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Analytics">Analytics</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the application"
                  rows={3}
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
                onClick={createApplication}
                disabled={
                  !createForm.name || !createForm.category || isCreating
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  "Create Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Application
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select category</option>
                  <option value="Development">Development</option>
                  <option value="Communication">Communication</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Analytics">Analytics</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingApp(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateApplication}
                disabled={!editForm.name || !editForm.category || isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  "Update Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Admin Modal */}
      {showAssignAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Admin to {showAssignAdmin.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User *
                </label>
                <select
                  value={assignForm.user_id}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, user_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a user</option>
                  {allUsers
                    .filter(
                      (user) =>
                        user.role === "app_admin" ||
                        user.role === "super_admin",
                    )
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </select>
              </div>

              {showAssignAdmin.admin_emails &&
                showAssignAdmin.admin_emails.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Admins
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {showAssignAdmin.admin_emails.map((email, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignAdmin(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={assignAdminToApplication}
                disabled={!assignForm.user_id || isAssigning}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning...
                  </>
                ) : (
                  "Assign Admin"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
