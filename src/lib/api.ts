// API implementation with backend selection
import { ENV } from "@/lib/constants";
import { notionBackend } from "./notion-backend";
import type {
  User,
  Application,
  AccessRequest,
  AccessRegistry,
  ApiResponse,
} from "@/types";

async function makeAppsScriptRequest(
  endpoint: string,
  options: RequestInit = {},
): Promise<any> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Split endpoint into path and query parameters
  const [path, queryString] = endpoint.split("?");
  const fullQuery = queryString
    ? `path=${path}&${queryString}`
    : `path=${path}`;

  const url = `${baseUrl}?${fullQuery}`;

  console.log("makeAppsScriptRequest - Final URL:", url);

  const firstResponse = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
      ...options.headers,
    },
  });

  const htmlText = await firstResponse.text();

  if (htmlText.includes("Moved Temporarily") && htmlText.includes("here</A>")) {
    const redirectMatch = htmlText.match(/HREF="([^"]+)">here/);
    if (redirectMatch && redirectMatch[1]) {
      const redirectUrl = redirectMatch[1];

      const redirectResponse = await fetch(redirectUrl, {
        ...options,
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
          ...options.headers,
        },
      });
      return redirectResponse.json();
    }
  }

  try {
    return JSON.parse(htmlText);
  } catch {
    throw new Error("Invalid response format");
  }
}

// Select backend based on environment
const api =
  ENV.BACKEND_TYPE === "notion"
    ? notionBackend
    : {
        auth: {
          googleLogin: async (
            credential: string,
          ): Promise<ApiResponse<{ user: User; token: string }>> => {
            const params = `credential=${encodeURIComponent(credential)}`;
            return makeAppsScriptRequest(`auth/google-login?${params}`, {
              method: "POST",
            });
          },
        },
        dashboard: {
          getStats: async (): Promise<ApiResponse<any>> => {
            return makeAppsScriptRequest("dashboard");
          },
        },
        applications: {
          getAll: async (): Promise<ApiResponse<Application[]>> => {
            return makeAppsScriptRequest("applications");
          },
          getById: async (id: string): Promise<ApiResponse<Application>> => {
            return makeAppsScriptRequest(`applications/${id}`);
          },
          create: async (data: {
            name: string;
            category: string;
            description?: string;
            created_by?: string;
          }): Promise<ApiResponse<Application>> => {
            const params = `name=${encodeURIComponent(data.name)}&category=${encodeURIComponent(data.category)}${data.description ? `&description=${encodeURIComponent(data.description)}` : ""}${data.created_by ? `&created_by=${encodeURIComponent(data.created_by)}` : ""}`;
            return makeAppsScriptRequest(`applications?${params}`, {
              method: "POST",
            });
          },
          update: async (data: {
            id: string;
            name: string;
            category: string;
            description?: string;
            admin_emails?: string;
          }): Promise<ApiResponse<Application>> => {
            const params = `id=${encodeURIComponent(data.id)}&name=${encodeURIComponent(data.name)}&category=${encodeURIComponent(data.category)}${data.description ? `&description=${encodeURIComponent(data.description)}` : ""}${data.admin_emails ? `&admin_emails=${encodeURIComponent(data.admin_emails)}` : ""}`;
            return makeAppsScriptRequest(`applications/update?${params}`, {
              method: "POST",
            });
          },
          delete: async (
            id: string,
          ): Promise<ApiResponse<{ success: boolean }>> => {
            const params = `id=${encodeURIComponent(id)}`;
            return makeAppsScriptRequest(`applications/delete?${params}`, {
              method: "POST",
            });
          },
        },
        users: {
          getAll: async (): Promise<ApiResponse<User[]>> => {
            return makeAppsScriptRequest("users");
          },
          getById: async (id: string): Promise<ApiResponse<User>> => {
            return makeAppsScriptRequest(`users/${id}`);
          },
          create: async (data: {
            name: string;
            email: string;
            role: string;
          }): Promise<ApiResponse<User>> => {
            const params = `name=${encodeURIComponent(data.name)}&email=${encodeURIComponent(data.email)}&role=${encodeURIComponent(data.role)}`;
            return makeAppsScriptRequest(`users?${params}`, {
              method: "POST",
            });
          },
        },
        accessRequests: {
          getAll: async (filters?: {
            status?: string;
            employee_id?: string;
            application_id?: string;
          }): Promise<ApiResponse<AccessRequest[]>> => {
            const params = new URLSearchParams();
            if (filters?.status) params.append("status", filters.status);
            if (filters?.employee_id)
              params.append("employee_id", filters.employee_id);
            if (filters?.application_id)
              params.append("application_id", filters.application_id);

            const queryString = params.toString();
            const endpoint = queryString
              ? `access-requests?${queryString}`
              : "access-requests";
            return makeAppsScriptRequest(endpoint);
          },
          getById: async (id: string): Promise<ApiResponse<AccessRequest>> => {
            return makeAppsScriptRequest(`access-requests/${id}`);
          },
          create: async (data: any): Promise<ApiResponse<AccessRequest>> => {
            const employeeId = data.employee_id || "";
            const params = `application_id=${encodeURIComponent(data.application_id)}&justification=${encodeURIComponent(data.justification || "")}&employee_id=${encodeURIComponent(employeeId)}`;
            return makeAppsScriptRequest(`access-requests?${params}`, {
              method: "POST",
            });
          },
          approve: async (
            id: string,
            notes?: string,
            approvedBy?: string,
          ): Promise<ApiResponse<AccessRequest>> => {
            let params = notes ? `notes=${encodeURIComponent(notes)}` : "";
            if (approvedBy) {
              params = params
                ? `${params}&approved_by=${encodeURIComponent(approvedBy)}`
                : `approved_by=${encodeURIComponent(approvedBy)}`;
            }
            const endpoint = params
              ? `access-requests/${id}/approve?${params}`
              : `access-requests/${id}/approve`;
            return makeAppsScriptRequest(endpoint, { method: "POST" });
          },
          reject: async (
            id: string,
            notes?: string,
            rejectedBy?: string,
          ): Promise<ApiResponse<AccessRequest>> => {
            let params = notes ? `notes=${encodeURIComponent(notes)}` : "";
            if (rejectedBy) {
              params = params
                ? `${params}&rejected_by=${encodeURIComponent(rejectedBy)}`
                : `rejected_by=${encodeURIComponent(rejectedBy)}`;
            }
            const endpoint = params
              ? `access-requests/${id}/reject?${params}`
              : `access-requests/${id}/reject`;
            return makeAppsScriptRequest(endpoint, { method: "POST" });
          },
          revoke: async (
            id: string,
            notes?: string,
          ): Promise<ApiResponse<AccessRequest>> => {
            const endpoint = notes
              ? `access-requests/${id}/revoke?notes=${encodeURIComponent(notes)}`
              : `access-requests/${id}/revoke`;
            return makeAppsScriptRequest(endpoint, { method: "POST" });
          },
        },

        accessRegistry: {
          getAll: async (filters?: {
            employee_id?: string;
            application_id?: string;
            status?: string;
          }): Promise<ApiResponse<AccessRegistry[]>> => {
            const params = new URLSearchParams();
            if (filters?.employee_id)
              params.append("employee_id", filters.employee_id);
            if (filters?.application_id)
              params.append("application_id", filters.application_id);
            if (filters?.status) params.append("status", filters.status);

            const queryString = params.toString();
            const endpoint = queryString
              ? `access-registry?${queryString}`
              : "access-registry";
            return makeAppsScriptRequest(endpoint);
          },

          create: async (data: {
            employee_id: string;
            application_id: string;
            granted_by?: string;
          }): Promise<ApiResponse<AccessRegistry>> => {
            const params = `employee_id=${encodeURIComponent(data.employee_id)}&application_id=${encodeURIComponent(data.application_id)}${data.granted_by ? `&granted_by=${encodeURIComponent(data.granted_by)}` : ""}`;
            return makeAppsScriptRequest(`access-registry?${params}`, {
              method: "POST",
            });
          },

          revoke: async (
            id: string,
            revokedBy?: string,
          ): Promise<ApiResponse<AccessRegistry>> => {
            const params = revokedBy
              ? `revoked_by=${encodeURIComponent(revokedBy)}`
              : "";
            const endpoint = params
              ? `access-registry/${id}/revoke?${params}`
              : `access-registry/${id}/revoke`;
            return makeAppsScriptRequest(endpoint, {
              method: "POST",
            });
          },
        },
      };

export default api;
