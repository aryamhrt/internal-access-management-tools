// Notion API backend implementation
import { ENV } from "@/lib/constants";
import type {
  User,
  Application,
  AccessRequest,
  AccessRegistry,
  ApiResponse,
  UserRole,
} from "@/types";

class NotionAPI {
  private baseUrl = "https://api.notion.com/v1"; // Always use direct API calls
  private version = "2022-06-28"; // Using stable version

  private async request(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log(`🌐 Notion API Request: ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${ENV.NOTION_API_KEY}`,
        "Notion-Version": this.version,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    console.log(
      `📡 Notion API Response: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Notion API Error Details:`, errorText);
      throw new Error(
        `Notion API error: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    const data = await response.json();
    console.log(`✅ Notion API Success:`, data);
    return data;
  }

  // Format database ID (ensure no hyphens for Notion API)
  private formatDatabaseId(id: string): string {
    return id.replace(/-/g, "");
  }

  async queryDatabase(databaseId: string, filter?: any): Promise<any> {
    const formattedId = this.formatDatabaseId(databaseId);
    const body: any = {};
    if (filter) {
      body.filter = filter;
    }

    console.log(
      `🔍 Querying database: ${databaseId} (formatted: ${formattedId})`,
    );

    return this.request(`/databases/${formattedId}/query`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async createPage(databaseId: string, properties: any): Promise<any> {
    const formattedId = this.formatDatabaseId(databaseId);
    return this.request("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: formattedId },
        properties,
      }),
    });
  }

  async updatePage(pageId: string, properties: any): Promise<any> {
    return this.request(`/pages/${pageId}`, {
      method: "PATCH",
      body: JSON.stringify({ properties }),
    });
  }

  async getPage(pageId: string): Promise<any> {
    return this.request(`/pages/${pageId}`);
  }
}

const notion = new NotionAPI();

// Helper function to decode JWT payload (client-side decoding is safe)
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }

    // Decode the payload (base64url to base64)
    let payload = parts[1];
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding
    while (payload.length % 4) {
      payload += "=";
    }

    // Decode and parse
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch (error: any) {
    console.log("❌ Database query failed:", error);
    console.log("❌ Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      body: error.body,
    });
    throw new Error(`Failed to query users database: ${error}`);
  }
}

// Helper functions to convert Notion data to our format
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

// Helper functions to convert our data to Notion format
function accessRequestToNotion(request: Partial<AccessRequest>): any {
  return {
    "Employee ID": {
      rich_text: [{ text: { content: request.employee_id || "" } }],
    },
    "Application ID": {
      rich_text: [{ text: { content: request.application_id || "" } }],
    },
    Type: { select: { name: request.type || "new" } },
    Status: { select: { name: request.status || "pending" } },
    "Request Date": {
      date: { start: request.request_date || new Date().toISOString() },
    },
    "Approved Date": request.approved_date
      ? { date: { start: request.approved_date } }
      : undefined,
    "Approved By": request.approved_by
      ? { rich_text: [{ text: { content: request.approved_by } }] }
      : undefined,
    "Admin Notes": request.admin_notes
      ? { rich_text: [{ text: { content: request.admin_notes } }] }
      : undefined,
    Justification: {
      rich_text: [{ text: { content: request.justification || "" } }],
    },
    "Auto Generated": { checkbox: request.auto_generated || false },
  };
}

function accessRegistryToNotion(registry: Partial<AccessRegistry>): any {
  return {
    "Employee ID": {
      rich_text: [{ text: { content: registry.employee_id || "" } }],
    },
    "Application ID": {
      rich_text: [{ text: { content: registry.application_id || "" } }],
    },
    "Granted Date": {
      date: { start: registry.granted_date || new Date().toISOString() },
    },
    "Granted By": registry.granted_by
      ? { rich_text: [{ text: { content: registry.granted_by } }] }
      : undefined,
    Status: { select: { name: registry.status || "active" } },
    "Revoked Date": registry.revoked_date
      ? { date: { start: registry.revoked_date } }
      : undefined,
    "Revoked By": registry.revoked_by
      ? { rich_text: [{ text: { content: registry.revoked_by } }] }
      : undefined,
  };
}

// Debug utility for testing Notion connection
export const testNotionConnection = async () => {
  console.log("🧪 Testing Notion Connection...");
  console.log("🔑 API Key:", ENV.NOTION_API_KEY ? "Set (masked)" : "NOT SET");
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

// API implementations
export const notionBackend = {
  auth: {
    googleLogin: async (
      credential: string,
    ): Promise<ApiResponse<{ user: User; token: string }>> => {
      try {
        // Decode JWT to get user info (safe client-side operation)
        const payload = decodeJwtPayload(credential);
        console.log("Decoded Google user:", {
          email: payload.email,
          name: payload.name,
        });

        // Get all users first to debug
        console.log(
          "🔍 Testing database access, Database ID:",
          ENV.NOTION_DATABASES.USERS,
        );
        console.log(
          "🔑 API Key configured:",
          ENV.NOTION_API_KEY ? "Yes" : "No",
        );

        console.log(
          "🔍 Attempting to query database:",
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

        // Show first few users for debugging
        console.log("First few users in database:");
        allUsersResponse.results
          .slice(0, 3)
          .forEach((result: any, index: number) => {
            const user = notionToUser(result);
            console.log(
              `${index + 1}. ${user.email} (${user.name}) - ${user.status}`,
            );
          });

        // Find user by email (case-insensitive manual filter to be safe)
        const users = allUsersResponse.results
          .map(notionToUser)
          .filter(
            (user: User) =>
              user.email.toLowerCase() === payload.email.toLowerCase(),
          );

        console.log(
          "Filtered users for email",
          payload.email,
          ":",
          users.length,
        );

        if (users.length === 0) {
          return {
            success: false,
            error: {
              code: "USER_NOT_FOUND",
              message: `Your email address (${payload.email}) is not found in the user database. Please contact your administrator to be added.`,
            },
            timestamp: new Date().toISOString(),
            request_id: `notion_auth_${Date.now()}`,
          };
        }

        const user = users[0];
        console.log("Found matching user:", {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        });

        // Check if user is active
        if (user.status !== "active") {
          return {
            success: false,
            error: {
              code: "USER_INACTIVE",
              message:
                "Your account is not active. Please contact your administrator.",
            },
            timestamp: new Date().toISOString(),
            request_id: `notion_auth_${Date.now()}`,
          };
        }

        // Return user data
        const token = `notion_${Date.now()}_${user.id}`;
        console.log("Authentication successful for user:", user.email);
        return {
          success: true,
          data: { user, token },
          timestamp: new Date().toISOString(),
          request_id: `notion_auth_success_${user.id}`,
        };
      } catch (error) {
        console.error("Notion Google login error:", error);
        return {
          success: false,
          error: { code: "AUTH_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_auth_error_${Date.now()}`,
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
          request_id: `notion_apps_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_apps_error_${Date.now()}`,
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
          request_id: `notion_app_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_app_error_${id}`,
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
          id: "", // Will be set by Notion
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
          request_id: `notion_app_create_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_app_create_error_${Date.now()}`,
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
        // First get the current application
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
          request_id: `notion_app_update_${data.id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_app_update_error_${data.id}`,
        };
      }
    },

    delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
      try {
        // In Notion, deletion is done by archiving the page
        await notion.updatePage(id, { archived: true });
        return {
          success: true,
          data: { success: true },
          timestamp: new Date().toISOString(),
          request_id: `notion_app_delete_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_app_delete_error_${id}`,
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
          request_id: `notion_users_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_users_error_${Date.now()}`,
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
          request_id: `notion_user_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_user_error_${id}`,
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
          id: "", // Will be set by Notion
          name: data.name,
          email: data.email,
          role: data.role as UserRole,
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
          request_id: `notion_user_create_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_user_create_error_${Date.now()}`,
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
          request_id: `notion_requests_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_requests_error_${Date.now()}`,
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
          request_id: `notion_request_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_request_error_${id}`,
        };
      }
    },

    create: async (data: any): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties = accessRequestToNotion(data);
        const response = await notion.createPage(
          ENV.NOTION_DATABASES.ACCESS_REQUESTS,
          properties,
        );
        const request = notionToAccessRequest(response);
        return {
          success: true,
          data: request,
          timestamp: new Date().toISOString(),
          request_id: `notion_create_request_${response.id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_create_request_error_${Date.now()}`,
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
          request_id: `notion_approve_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_approve_error_${id}`,
        };
      }
    },

    reject: async (
      id: string,
      notes?: string,
      rejectedBy?: string,
    ): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties: any = {
          Status: { select: { name: "rejected" } },
        };

        if (rejectedBy) {
          properties["Approved By"] = {
            rich_text: [{ text: { content: rejectedBy } }],
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
          request_id: `notion_reject_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_reject_error_${id}`,
        };
      }
    },

    revoke: async (
      id: string,
      notes?: string,
      revokedBy?: string,
    ): Promise<ApiResponse<AccessRequest>> => {
      try {
        const properties: any = {
          Status: { select: { name: "revoked" } },
        };

        if (revokedBy) {
          properties["Approved By"] = {
            rich_text: [{ text: { content: revokedBy } }],
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
          request_id: `notion_revoke_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_revoke_error_${id}`,
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
          request_id: `notion_registry_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_registry_error_${Date.now()}`,
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
          request_id: `notion_revoke_registry_${id}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_revoke_registry_error_${id}`,
        };
      }
    },

    create: async (data: {
      employee_id: string;
      application_id: string;
      granted_by?: string;
    }): Promise<ApiResponse<AccessRegistry>> => {
      try {
        const properties = accessRegistryToNotion({
          id: "", // Will be set by Notion
          employee_id: data.employee_id,
          application_id: data.application_id,
          granted_date: new Date().toISOString(),
          granted_by: data.granted_by,
          status: "active",
        });

        const response = await notion.createPage(
          ENV.NOTION_DATABASES.ACCESS_REGISTRY,
          properties,
        );
        const registry = notionToAccessRegistry(response);
        return {
          success: true,
          data: registry,
          timestamp: new Date().toISOString(),
          request_id: `notion_registry_create_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_registry_create_error_${Date.now()}`,
        };
      }
    },
  },

  dashboard: {
    getStats: async (): Promise<ApiResponse<any>> => {
      try {
        // Get stats from all databases
        const [usersRes, appsRes, requestsRes, registryRes] = await Promise.all(
          [
            notion.queryDatabase(ENV.NOTION_DATABASES.USERS),
            notion.queryDatabase(ENV.NOTION_DATABASES.APPLICATIONS),
            notion.queryDatabase(ENV.NOTION_DATABASES.ACCESS_REQUESTS),
            notion.queryDatabase(ENV.NOTION_DATABASES.ACCESS_REGISTRY),
          ],
        );

        const stats = {
          total_users: usersRes.results.length,
          total_applications: appsRes.results.length,
          pending_requests: requestsRes.results.filter(
            (r: any) => r.properties.Status?.select?.name === "pending",
          ).length,
          active_access: registryRes.results.filter(
            (r: any) => r.properties.Status?.select?.name === "active",
          ).length,
          recent_requests: requestsRes.results
            .slice(0, 5)
            .map(notionToAccessRequest),
          notifications: [], // Notion doesn't have notifications yet
        };

        return {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
          request_id: `notion_dashboard_${Date.now()}`,
        };
      } catch (error) {
        return {
          success: false,
          error: { code: "NOTION_ERROR", message: (error as Error).message },
          timestamp: new Date().toISOString(),
          request_id: `notion_dashboard_error_${Date.now()}`,
        };
      }
    },
  },
};
