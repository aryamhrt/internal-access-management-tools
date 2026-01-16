import React, { useState } from "react";

export const DeploymentTest: React.FC = () => {
  const [result, setResult] = useState<string>("");

  const testDeployment = async () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    try {
      setResult("Testing direct request...");

      // Test 1: Direct GET request (should return HTML redirect)
      const directResponse = await fetch(`${baseUrl}?path=dashboard`);
      const directText = await directResponse.text();

      setResult(
        `Direct response status: ${directResponse.status}\nResponse: ${directText.substring(0, 500)}...`,
      );

      // Test 2: Follow redirect manually (should return JSON)
      if (directText.includes("Moved Temporarily")) {
        setResult(
          (prev) => prev + "\n\nFound HTML redirect, extracting URL...",
        );

        const redirectMatch = directText.match(/HREF="([^"]+)">here/);
        setResult(
          (prev) => prev + `\nRegex match: ${JSON.stringify(redirectMatch)}`,
        );

        if (redirectMatch && redirectMatch[1]) {
          const redirectUrl = redirectMatch[1];
          setResult((prev) => prev + `\nFollowing redirect to: ${redirectUrl}`);

          const redirectResponse = await fetch(redirectUrl);
          const redirectText = await redirectResponse.text();

          setResult(
            (prev) =>
              prev +
              `\n\n✅ Success! Redirect response: ${redirectResponse.status}\nResponse: ${redirectText}`,
          );
        } else {
          setResult(
            (prev) => prev + "\n❌ Could not extract redirect URL from HTML",
          );
        }
      } else {
        setResult((prev) => prev + "\n❌ No HTML redirect found in response");
      }
    } catch (error: any) {
      setResult(`❌ Network Error: ${error.message}\n\n${error.stack}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Deployment Test</h2>
      <button
        onClick={testDeployment}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Apps Script Deployment
      </button>
      {result && (
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
          {result}
        </pre>
      )}
    </div>
  );
};
