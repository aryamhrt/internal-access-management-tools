import React, { useState } from "react";
import api from "@/lib/api";

export const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult("Starting test...");

    try {
      setResult("Making API call...");
      console.log("Testing API connection...");

      const response = await api.dashboard.getStats();
      console.log("API Response:", response);

      setResult(`✅ Success: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      console.error("API Error:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
      });

      setResult(
        `❌ Error: ${error.message}\n\nStatus: ${error.response?.status}\n\nResponse: ${error.response?.data ? JSON.stringify(error.response.data) : "No response data"}\n\nConfig: ${JSON.stringify(error.config, null, 2)}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setResult(
      "API is temporarily disabled for debugging build issues. Authentication works through Google OAuth.",
    );
    setLoading(false);
  };

  const testDirectFetch = async () => {
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL;
      const testUrl = `${baseUrl}?path=dashboard`;

      console.log("Testing direct fetch to:", testUrl);

      const response = await fetch(testUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow", // Follow redirects
      });

      console.log("Fetch response status:", response.status);
      console.log(
        "Fetch response headers:",
        Object.fromEntries(response.headers.entries()),
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(`Direct Fetch Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      console.error("Direct fetch error:", error);
      setResult(`Direct Fetch Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testManualRedirect = async () => {
    setLoading(true);
    try {
      setResult("Testing manual redirect handling...");

      // Import the helper function locally
      const makeAppsScriptRequestLocal = async (
        endpoint: string,
        options: RequestInit = {},
      ): Promise<any> => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const token = localStorage.getItem("auth_token");

        const url = endpoint.startsWith("?")
          ? `${baseUrl}${endpoint}`
          : `${baseUrl}?path=${endpoint.replace(/^\//, "")}`;

        setResult((prev) => prev + `\nMaking request to: ${url}`);

        // First request - expect HTML redirect
        const firstResponse = await fetch(url, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
        });

        setResult(
          (prev) => prev + `\nFirst response status: ${firstResponse.status}`,
        );

        const htmlText = await firstResponse.text();

        setResult(
          (prev) => prev + `\nHTML response length: ${htmlText.length} chars`,
        );

        if (
          htmlText.includes("Moved Temporarily") &&
          htmlText.includes("here</A>")
        ) {
          setResult(
            (prev) => prev + `\nFound HTML redirect, extracting URL...`,
          );

          // Extract redirect URL
          const redirectMatch = htmlText.match(/HREF="([^"]+)">here/);
          setResult(
            (prev) => prev + `\nRegex match: ${JSON.stringify(redirectMatch)}`,
          );

          if (redirectMatch && redirectMatch[1]) {
            const redirectUrl = redirectMatch[1];
            setResult(
              (prev) => prev + `\nFollowing redirect to: ${redirectUrl}`,
            );

            // Follow redirect to get JSON response
            const redirectResponse = await fetch(redirectUrl, {
              ...options,
              headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
              },
            });

            setResult(
              (prev) =>
                prev + `\nRedirect response status: ${redirectResponse.status}`,
            );

            const data = await redirectResponse.json();
            setResult(
              (prev) =>
                prev + `\n✅ Success! Data: ${JSON.stringify(data, null, 2)}`,
            );
            return data;
          }
        }

        // If no redirect, try to parse as JSON (fallback)
        try {
          const data = JSON.parse(htmlText);
          setResult(
            (prev) =>
              prev +
              `\n✅ Parsed JSON directly: ${JSON.stringify(data, null, 2)}`,
          );
          return data;
        } catch {
          setResult((prev) => prev + `\n❌ Could not parse response`);
          throw new Error(`Invalid response format from ${endpoint}`);
        }
      };

      const response = await makeAppsScriptRequestLocal("dashboard");
      setResult(
        (prev) =>
          prev + `\n\nFinal result: ${JSON.stringify(response, null, 2)}`,
      );
    } catch (error: any) {
      console.error("Manual redirect test error:", error);
      setResult((prev) => prev + `\n❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Connection Test</h2>

      <div className="space-x-4 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Dashboard API (Axios)
        </button>

        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test Login API
        </button>

        <button
          onClick={testDirectFetch}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Direct Fetch
        </button>

        <button
          onClick={testManualRedirect}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          Test Manual Redirect
        </button>
      </div>

      {loading && <p className="text-blue-600">Testing...</p>}

      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Result:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};
