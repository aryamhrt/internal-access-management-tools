import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { USER_ROLES, USER_STATUSES } from "@/lib/constants";
import { hasRole } from "@/lib/utils";
import type { User, UserRole, UserStatus } from "@/types";
import api from "@/lib/api";
import { UserDetailsPage } from "./UserDetailsPage";

export const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [userAccessCounts, setUserAccessCounts] = useState<
    Record<string, number>
  >({});

  // Filter states
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [nameSearch, setNameSearch] = useState("");

  // Add user modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "employee" as UserRole,
  });

  // User details states
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Check permissions
  const canAddUsers =
    user &&
    (hasRole(user.role, "super_admin") || hasRole(user.role, "app_admin"));

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, statusFilter, nameSearch]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Load users and access registry data in parallel for efficiency
      const [usersResponse, registryResponse] = await Promise.all([
        api.users.getAll(),
        api.accessRegistry.getAll({ status: "active" }), // Only count active accesses
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data || []);

        // Build access count map from registry data
        if (registryResponse.success && registryResponse.data) {
          const accessCounts: Record<string, number> = {};
          registryResponse.data.forEach((access) => {
            accessCounts[access.employee_id] =
              (accessCounts[access.employee_id] || 0) + 1;
          });
          setUserAccessCounts(accessCounts);
        }
      } else {
        setError("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Filter by name search
    if (nameSearch.trim()) {
      const searchTerm = nameSearch.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm),
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const response = await api.users.create({
        name: createForm.name,
        email: createForm.email,
        role: createForm.role,
      });

      if (response.success) {
        setShowAddUser(false);
        setCreateForm({ name: "", email: "", role: "employee" });
        loadUsers(); // Refresh the list
        alert("User created successfully!");
      } else {
        alert(
          "Failed to create user: " +
            (response.error?.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
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

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "offboard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Loading users...</p>
        </div>

        <div className="grid gap-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded border border-gray-200 p-4"
            >
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600">Manage system users</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters and Add User Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as UserStatus | "all")
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(USER_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by Name/Email
            </label>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search users..."
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {canAddUsers && (
          <button
            onClick={() => setShowAddUser(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Add User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="bg-white rounded border border-gray-200 p-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {users.length}
          </h3>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {users.filter((u) => u.status === "active").length}
          </h3>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>
        <div className="bg-white rounded border border-gray-200 p-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredUsers.length}
          </h3>
          <p className="text-sm text-gray-600">Filtered Results</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  App Access
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role,
                      )}`}
                    >
                      {USER_ROLES[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                        user.status,
                      )}`}
                    >
                      {USER_STATUSES[user.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 min-w-[2rem]">
                      {userAccessCounts[user.id] || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.join_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 hover:underline"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-500">No users found</p>
            <p className="text-sm text-gray-400 mt-2">
              {users.length === 0
                ? "No users in the system yet"
                : "Try adjusting your filters"}
            </p>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New User
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.entries(USER_ROLES).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!createForm.name || !createForm.email || isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  "Add User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 overflow-y-auto max-h-full">
              <UserDetailsPage
                userId={selectedUserId as string}
                onBack={() => setSelectedUserId(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
