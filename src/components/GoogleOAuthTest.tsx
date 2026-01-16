import React, { useEffect } from "react";

export const GoogleOAuthTest: React.FC = () => {
  useEffect(() => {
    // Test if Google Identity Services is loaded
    const checkGoogleLoaded = () => {
      if (window.google && window.google.accounts) {
        console.log("✅ Google Identity Services loaded");
        console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
        console.log("Allowed Domain:", import.meta.env.VITE_ALLOWED_DOMAIN);
      } else {
        console.error("❌ Google Identity Services not loaded");
      }
    };

    // Check immediately
    checkGoogleLoaded();

    // Check again after a delay (in case script loads later)
    setTimeout(checkGoogleLoaded, 2000);
  }, []);

  const testClientId = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("Testing Client ID:", clientId);

    if (!clientId) {
      console.error("❌ VITE_GOOGLE_CLIENT_ID not set");
      return;
    }

    if (!clientId.includes(".apps.googleusercontent.com")) {
      console.error("❌ Invalid Client ID format");
      return;
    }

    console.log("✅ Client ID format looks correct");
  };

  const testDomain = () => {
    const domain = import.meta.env.VITE_ALLOWED_DOMAIN;
    console.log("Testing Allowed Domain:", domain);

    if (!domain) {
      console.error("❌ VITE_ALLOWED_DOMAIN not set");
      return;
    }

    if (domain !== "djoin.id") {
      console.warn("⚠️ Domain is not djoin.id:", domain);
      return;
    }

    console.log("✅ Domain is correctly set to djoin.id");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        Google OAuth Configuration Test
      </h2>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="space-y-1 text-sm">
            <div>
              Client ID:{" "}
              <code className="bg-gray-200 px-1 rounded">
                {import.meta.env.VITE_GOOGLE_CLIENT_ID || "NOT SET"}
              </code>
            </div>
            <div>
              Allowed Domain:{" "}
              <code className="bg-gray-200 px-1 rounded">
                {import.meta.env.VITE_ALLOWED_DOMAIN || "NOT SET"}
              </code>
            </div>
          </div>
        </div>

        <div className="space-x-4">
          <button
            onClick={testClientId}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Client ID
          </button>

          <button
            onClick={testDomain}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Test Domain
          </button>
        </div>

        <div className="bg-blue-50 p-4 rounded">
          <h3 className="font-semibold mb-2">Instructions</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open browser Developer Tools (F12)</li>
            <li>Go to Console tab</li>
            <li>Click the test buttons above</li>
            <li>Check for any error messages</li>
            <li>Verify Client ID format and domain settings</li>
          </ol>
        </div>

        <div className="bg-yellow-50 p-4 rounded">
          <h3 className="font-semibold mb-2">If Tests Fail</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Check Google Cloud Console OAuth configuration</li>
            <li>Ensure Client ID matches exactly</li>
            <li>Verify authorized domains include djoin.id</li>
            <li>Check that OAuth consent screen is published</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
