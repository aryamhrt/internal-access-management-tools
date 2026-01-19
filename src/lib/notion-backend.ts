// Notion Backend Implementation using Vercel API routes
import { ENV } from "@/lib/constants";
import type {
  User,
  Application,
  AccessRequest,
  AccessRegistry,
  ApiResponse,
} from "@/types";

class NotionAPI {
  async queryDatabase(databaseId: string, filter?: any): Promise<any> {
    const url = `/api/notion/databases/${databaseId}/query`;
    console.log(`🌐 Vercel API Request: POST ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ databaseId, ...(filter || {}) }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vercel API Error:`, errorText);
      throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vercel API Success:`, data);
    return data;
  }

  async createPage(databaseId: string, properties: any): Promise<any> {
    const url = `/api/notion/pages`;
    console.log(`🌐 Vercel API Request: POST ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vercel API Error:`, errorText);
      throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vercel API Success:`, data);
    return data;
  }

  async updatePage(pageId: string, properties: any): Promise<any> {
    const url = `/api/notion/pages/${pageId}`;
    console.log(`🌐 Vercel API Request: PATCH ${url}`);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vercel API Error:`, errorText);
      throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vercel API Success:`, data);
    return data;
  }

  async getPage(pageId: string): Promise<any> {
    const url = `/api/notion/pages?pageId=${pageId}`;
    console.log(`🌐 Vercel API Request: GET ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Vercel API Error:`, errorText);
      throw new Error(`Vercel API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ Vercel API Success:`, data);
    return data;
  }
}

const notion = new NotionAPI();

// Helper functions
function decodeJwtPayload(token: string): any {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    throw new Error("Invalid JWT token");
  }
}

function notionToUser(page: any): User {
  const props = page.properties;
  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || "",
    email: props.Email?.email || "",
    role: props.Role?.select?.name || "employee",
    status: props.Status?.select?.name || "active",
    join_date: props["Join Date"]?.date?.start || "",
    offboard_date: props["Offboard Date"]?.date?.start || undefined,
    created_at: page.created_time,
    invited_by: props["Invited By"]?.rich_text?.[0]?.plain_text || undefined,
  };
}

function notionToApplication(page: any): Application {
  const props = page.properties;
  return {
    id: page.id,
    name: props.Name?.title?.[0]?.plain_text || "",
    category: props.Category?.select?.name || "",
    description: props.Description?.rich_text?.[0]?.plain_text || "",
    admin_emails:
      props["Admin Emails"]?.multi_select?.map((item: any) => item.name) || [],
    created_at: page.created_time,
    created_by: props["Created By"]?.rich_text?.[0]?.plain_text || "",
  };
}

function notionToAccessRequest(page: any): AccessRequest {
  const props = page.properties;
  return {
    id: page.id,
    employee_id: props["Employee ID"]?.rich_text?.[0]?.plain_text || "",
    application_id: props["Application ID"]?.rich_text?.[0]?.plain_text || "",
    type: props.Type?.select?.name || "new",
    status: props.Status?.select?.name || "pending",
    request_date: props["Request Date"]?.date?.start || "",
    approved_date: props["Approved Date"]?.date?.start || undefined,
    approved_by: props["Approved By"]?.rich_text?.[0]?.plain_text || undefined,
    admin_notes: props["Admin Notes"]?.rich_text?.[0]?.plain_text || undefined,
    justification: props.Justification?.rich_text?.[0]?.plain_text || "",
    auto_generated: props["Auto Generated"]?.checkbox || false,
  };
}

function notionToAccessRegistry(page: any): AccessRegistry {
  const props = page.properties;
  return {
    id: page.id,
    employee_id: props["Employee ID"]?.rich_text?.[0]?.plain_text || "",
    application_id: props["Application ID"]?.rich_text?.[0]?.plain_text || "",
    granted_date: props["Granted Date"]?.date?.start || "",
    granted_by: props["Granted By"]?.rich_text?.[0]?.plain_text || "",
    status: props.Status?.select?.name || "active",
    revoked_date: props["Revoked Date"]?.date?.start || undefined,
    revoked_by: props["Revoked By"]?.rich_text?.[0]?.plain_text || undefined,
  };
}

function userToNotion(user: Partial<User>): any {
  return {
    Name: {
      title: [{ text: { content: user.name || "" } }],
    },
    Email: {
      email: user.email || "",
    },
    Role: { select: { name: user.role || "employee" } },
    Status: { select: { name: user.status || "active" } },
    "Join Date": user.join_date
      ? { date: { start: user.join_date } }
      : { date: { start: new Date().toISOString() } },
    "Offboard Date": user.offboard_date
      ? { date: { start: user.offboard_date } }
      : undefined,
    "Invited By": user.invited_by
      ? { rich_text: [{ text: { content: user.invited_by } }] }
      : undefined,
  };
}

function applicationToNotion(app: Application): any {
  return {
    Name: {
      title: [{ text: { content: app.name } }],
    },
    Category: { select: { name: app.category } },
    Description: {
      rich_text: [{ text: { content: app.description || "" } }],
    },
    "Admin Emails": {
      multi_select: (app.admin_emails || []).map((email) => ({ name: email })),
    },
    "Created By": {
      rich_text: [{ text: { content: app.created_by } }],
    },
  };
}

// API implementations
export const notionBackend = {
  auth: {
    googleLogin: async (
      credential: string,
    ): Promise<ApiResponse<{ user: User; token: string }>> => {
      try {
        // Decode JWT to get user info
        const payload = decodeJwtPayload(credential);
        console.log("Decoded Google user:", {
          email: payload.email,
          name: payload.name,
        });

        // Get all users
        console.log(
          "🔍 Testing database access, Database ID:",
          ENV.NOTION_DATABASES.USERS,
        );

        const allUsersResponse = await notion.queryDatabase(
          ENV.NOTION_DATABASES.USERS,
        );
        console.log(
          "✅ Database access successful, found",
          allUsersResponse.results.length,
          "total users",
        );

        // Find user by email
        const userPage = allUsersResponse.results.find((page: any) => {
          const props = page.properties;
          return props.Email?.email === payload.email;
        });

        if (!userPage) {
          console.log("❌ User not found in database");
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: "User not found in database",
            },
            timestamp: new Date().toISOString(),
            request_id: `auth_${Date.now()}`,
          };
        }

        const user = notionToUser(userPage);
        console.log("✅ Authentication successful for user:", user.email);

        return {
          success: true,
          data: { user, token: credential },
          timestamp: new Date().toISOString(),
          request_id: `auth_${Date.now()}`,
        };
      } catch (error: any) {
        console.error("❌ Authentication failed:", error);
        return {
          success: false,
          error: { code: "AUTH_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `auth_error_${Date.now()}`,
        };
      }
    },
  },

  dashboard: {
    getStats: async (): Promise<ApiResponse<any>> => {
      try {
        const [usersRes, appsRes, requestsRes, registryRes] = await Promise.all(
          [
            notion.queryDatabase(ENV.NOTION_DATABASES.USERS),
            notion.queryDatabase(ENV.NOTION_DATABASES.APPLICATIONS),
            notion.queryDatabase(ENV.NOTION_DATABASES.ACCESS_REQUESTS),
            notion.queryDatabase(ENV.NOTION_DATABASES.ACCESS_REGISTRY),
          ],
        );

        return {
          success: true,
          data: {
            total_users: usersRes.results.length,
            total_applications: appsRes.results.length,
            pending_requests: requestsRes.results.filter(
              (r: any) => r.properties.Status?.select?.name === "pending",
            ).length,
            active_access: registryRes.results.filter(
              (r: any) => r.properties.Status?.select?.name === "active",
            ).length,
            recent_requests: requestsRes.results
              .slice(0, 10)
              .map(notionToAccessRequest),
            notifications: [],
          },
          timestamp: new Date().toISOString(),
          request_id: `dashboard_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "DASHBOARD_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `dashboard_error_${Date.now()}`,
        };
      }
    },
  },

  applications: {
    getAll: async (): Promise<ApiResponse<Application[]>> => {
      try {
        const response = await notion.queryDatabase(
          ENV.NOTION_DATABASES.APPLICATIONS,
        );
        const applications = response.results.map(notionToApplication);
        return {
          success: true,
          data: applications,
          timestamp: new Date().toISOString(),
          request_id: `apps_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `apps_error_${Date.now()}`,
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse<Application>> => {
      try {
        const response = await notion.getPage(id);
        const application = notionToApplication(response);
        return {
          success: true,
          data: application,
          timestamp: new Date().toISOString(),
          request_id: `app_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `app_error_${id}`,
        };
      }
    },

    create: async (data: {
      name: string;
      category: string;
      description?: string;
      created_by?: string;
    }): Promise<ApiResponse<Application>> => {
      try {
        const properties = applicationToNotion({
          id: "",
          name: data.name,
          category: data.category,
          description: data.description || "",
          admin_emails: [],
          created_at: new Date().toISOString(),
          created_by: data.created_by || "",
        });

        const response = await notion.createPage(
          ENV.NOTION_DATABASES.APPLICATIONS,
          properties,
        );
        const application = notionToApplication(response);
        return {
          success: true,
          data: application,
          timestamp: new Date().toISOString(),
          request_id: `app_create_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `app_create_error_${Date.now()}`,
        };
      }
    },

    update: async (data: {
      id: string;
      name: string;
      category: string;
      description?: string;
      admin_emails?: string;
    }): Promise<ApiResponse<Application>> => {
      try {
        const currentResponse = await notion.getPage(data.id);
        const currentApp = notionToApplication(currentResponse);

        const properties = applicationToNotion({
          ...currentApp,
          name: data.name,
          category: data.category,
          description: data.description || "",
          admin_emails: data.admin_emails
            ? data.admin_emails.split(",").filter(Boolean)
            : currentApp.admin_emails,
        });

        const response = await notion.updatePage(data.id, properties);
        const application = notionToApplication(response);
        return {
          success: true,
          data: application,
          timestamp: new Date().toISOString(),
          request_id: `app_update_${data.id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `app_update_error_${data.id}`,
        };
      }
    },

    delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        await notion.updatePage(id, { archived: true });
        return {
          success: true,
          data: { success: true },
          timestamp: new Date().toISOString(),
          request_id: `app_delete_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `app_delete_error_${id}`,
        };
      }
    },
  },

  users: {
    getAll: async (): Promise<ApiResponse<User[]>> => {
      try {
        const response = await notion.queryDatabase(ENV.NOTION_DATABASES.USERS);
        const users = response.results.map(notionToUser);
        return {
          success: true,
          data: users,
          timestamp: new Date().toISOString(),
          request_id: `users_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `users_error_${Date.now()}`,
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse<User>> => {
      try {
        const response = await notion.getPage(id);
        const user = notionToUser(response);
        return {
          success: true,
          data: user,
          timestamp: new Date().toISOString(),
          request_id: `user_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `user_error_${id}`,
        };
      }
    },

    create: async (data: {
      name: string;
      email: string;
      role: string;
    }): Promise<ApiResponse<User>> => {
      try {
        const properties = userToNotion({
          id: "",
          name: data.name,
          email: data.email,
          role: data.role as any,
          status: "active",
          join_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        });

        const response = await notion.createPage(
          ENV.NOTION_DATABASES.USERS,
          properties,
        );
        const user = notionToUser(response);
        return {
          success: true,
          data: user,
          timestamp: new Date().toISOString(),
          request_id: `user_create_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `user_create_error_${Date.now()}`,
        };
      }
    },
  },

  accessRequests: {
    getAll: async (filters?: {
      status?: string;
      employee_id?: string;
      application_id?: string;
    }): Promise<ApiResponse<AccessRequest[]>> => {
      try {
        let filterConditions: any[] = [];

        if (filters?.status) {
          filterConditions.push({
            property: "Status",
            select: { equals: filters.status },
          });
        }
        if (filters?.employee_id) {
          filterConditions.push({
            property: "Employee ID",
            rich_text: { equals: filters.employee_id },
          });
        }
        if (filters?.application_id) {
          filterConditions.push({
            property: "Application ID",
            rich_text: { equals: filters.application_id },
          });
        }

        const response = await notion.queryDatabase(
          ENV.NOTION_DATABASES.ACCESS_REQUESTS,
          filterConditions.length > 0 ? { and: filterConditions } : undefined,
        );

        const requests = response.results.map(notionToAccessRequest);
        return {
          success: true,
          data: requests,
          timestamp: new Date().toISOString(),
          request_id: `requests_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `requests_error_${Date.now()}`,
        };
      }
    },

    getById: async (id: string): Promise<ApiResponse<AccessRequest>> => {
      try {
        const response = await notion.getPage(id);
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `request_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `request_error_${id}`,
        };
      }
    },

    create: async (data: any): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties = {
          "Employee ID": {
            rich_text: [{ text: { content: data.employee_id || "" } }],
          },
          "Application ID": {
            rich_text: [{ text: { content: data.application_id || "" } }],
          },
          Type: { select: { name: data.type || "new" } },
          Status: { select: { name: "pending" } },
          "Request Date": {
            date: { start: new Date().toISOString() },
          },
          Justification: {
            rich_text: [{ text: { content: data.justification || "" } }],
          },
          "Auto Generated": { checkbox: false },
        };

        const response = await notion.createPage(
          ENV.NOTION_DATABASES.ACCESS_REQUESTS,
          properties,
        );
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `request_create_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `request_create_error_${Date.now()}`,
        };
      }
    },

    approve: async (
      id: string,
      notes?: string,
      approvedBy?: string,
    ): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties: any = {
          Status: { select: { name: "approved" } },
          "Approved Date": { date: { start: new Date().toISOString() } },
        };

        if (approvedBy) {
          properties["Approved By"] = {
            rich_text: [{ text: { content: approvedBy } }],
          };
        }

        if (notes) {
          properties["Admin Notes"] = {
            rich_text: [{ text: { content: notes } }],
          };
        }

        const response = await notion.updatePage(id, properties);
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `approve_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `approve_error_${id}`,
        };
      }
    },

    reject: async (
      id: string,
      notes?: string,
      _rejectedBy?: string, // Prefix with _ to indicate intentionally unused
    ): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties: any = {
          Status: { select: { name: "rejected" } },
        };

        if (notes) {
          properties["Admin Notes"] = {
            rich_text: [{ text: { content: notes } }],
          };
        }

        const response = await notion.updatePage(id, properties);
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `reject_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `reject_error_${id}`,
        };
      }
    },

    revoke: async (
      id: string,
      notes?: string,
    ): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties: any = {
          Status: { select: { name: "revoked" } },
        };

        if (notes) {
          properties["Admin Notes"] = {
            rich_text: [{ text: { content: notes } }],
          };
        }

        const response = await notion.updatePage(id, properties);
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `revoke_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `revoke_error_${id}`,
        };
      }
    },
  },

  accessRegistry: {
    getAll: async (filters?: {
      employee_id?: string;
      application_id?: string;
      status?: string;
    }): Promise<ApiResponse<AccessRegistry[]>> => {
      try {
        let filterConditions: any[] = [];

        if (filters?.status) {
          filterConditions.push({
            property: "Status",
            select: { equals: filters.status },
          });
        }
        if (filters?.employee_id) {
          filterConditions.push({
            property: "Employee ID",
            rich_text: { equals: filters.employee_id },
          });
        }
        if (filters?.application_id) {
          filterConditions.push({
            property: "Application ID",
            rich_text: { equals: filters.application_id },
          });
        }

        const response = await notion.queryDatabase(
          ENV.NOTION_DATABASES.ACCESS_REGISTRY,
          filterConditions.length > 0 ? { and: filterConditions } : undefined,
        );

        const registry = response.results.map(notionToAccessRegistry);
        return {
          success: true,
          data: registry,
          timestamp: new Date().toISOString(),
          request_id: `registry_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `registry_error_${Date.now()}`,
        };
      }
    },

    revoke: async (
      id: string,
      revokedBy?: string,
    ): Promise<ApiResponse<AccessRegistry>> => {
      try {
        const properties: any = {
          Status: { select: { name: "revoked" } },
          "Revoked Date": { date: { start: new Date().toISOString() } },
        };

        if (revokedBy) {
          properties["Revoked By"] = {
            rich_text: [{ text: { content: revokedBy } }],
          };
        }

        const response = await notion.updatePage(id, properties);
        const registry = notionToAccessRegistry(response);
        return {
          success: true,
          data: registry,
          timestamp: new Date().toISOString(),
          request_id: `revoke_registry_${id}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `revoke_registry_error_${id}`,
        };
      }
    },

    create: async (data: {
      employee_id: string;
      application_id: string;
      granted_by?: string;
    }): Promise<ApiResponse<AccessRegistry>> => {
      try {
        const properties = {
          "Employee ID": {
            rich_text: [{ text: { content: data.employee_id } }],
          },
          "Application ID": {
            rich_text: [{ text: { content: data.application_id } }],
          },
          "Granted Date": {
            date: { start: new Date().toISOString() },
          },
          "Granted By": data.granted_by
            ? { rich_text: [{ text: { content: data.granted_by } }] }
            : undefined,
          Status: { select: { name: "active" } },
        };

        const response = await notion.createPage(
          ENV.NOTION_DATABASES.ACCESS_REGISTRY,
          properties,
        );
        const registry = notionToAccessRegistry(response);
        return {
          success: true,
          data: registry,
          timestamp: new Date().toISOString(),
          request_id: `registry_create_${Date.now()}`,
        };
      } catch (error: any) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: error.message },
          timestamp: new Date().toISOString(),
          request_id: `registry_create_error_${Date.now()}`,
        };
      }
    },
  },
};

// Debug utility for testing Notion connection
export const testNotionConnection = async () => {
  console.log("🧪 Testing Vercel API routes...");
  console.log("🔑 API Key:", ENV.NOTION_API_KEY ? "Set" : "NOT SET");
  console.log("👥 Users DB:", ENV.NOTION_DATABASES.USERS);
  console.log("🏢 Apps DB:", ENV.NOTION_DATABASES.APPLICATIONS);
  console.log("📋 Requests DB:", ENV.NOTION_DATABASES.ACCESS_REQUESTS);
  console.log("📊 Registry DB:", ENV.NOTION_DATABASES.ACCESS_REGISTRY);

  try {
    console.log("🔍 Testing Users database access...");
    const response = await notion.queryDatabase(ENV.NOTION_DATABASES.USERS);
    console.log(
      "✅ Users database accessible, found",
      response.results.length,
      "items",
    );
    return { success: true, data: response };
  } catch (error: any) {
    console.log("❌ Users database access failed:", error);
    return { success: false, error };
  }
};

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).testNotionConnection = testNotionConnection;
}
