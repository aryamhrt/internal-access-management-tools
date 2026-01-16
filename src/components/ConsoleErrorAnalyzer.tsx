import React, { useState } from "react";

export const ConsoleErrorAnalyzer: React.FC = () => {
  const [errorText, setErrorText] = useState("");
  const [analysis, setAnalysis] = useState("");

  const analyzeError = () => {
    const error = errorText.toLowerCase();
    let solution = "";

    if (error.includes("idpiframe_initialization_failed")) {
      solution = `
🚨 **Invalid Client ID or OAuth Configuration**

**Problem**: Google can't find your OAuth client
**Solutions**:
1. Check Client ID in Google Cloud Console matches .env exactly
2. Ensure OAuth consent screen is published (not draft)
3. Verify Client ID format: xxx.apps.googleusercontent.com
4. Check authorized domains include 'djoin.id'
      `;
    } else if (error.includes("invalid_client")) {
      solution = `
🚨 **Client ID Not Found**

**Problem**: OAuth client doesn't exist or is disabled
**Solutions**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Verify your Client ID exists and is enabled
3. Recreate OAuth client if needed (Web application type)
4. Update .env with correct Client ID
      `;
    } else if (
      error.includes("access_denied") ||
      error.includes("access blocked")
    ) {
      solution = `
🚨 **Access Denied or Domain Blocked**

**Problem**: Email domain not allowed or OAuth scope issues
**Solutions**:
1. Use only @djoin.id Google accounts
2. Check OAuth consent screen authorized domains
3. Ensure your app URLs are in authorized origins
4. Try incognito mode to clear cached permissions
      `;
    } else if (
      error.includes("network error") ||
      error.includes("failed to fetch")
    ) {
      solution = `
🚨 **Network/Backend Error**

**Problem**: Apps Script not responding
**Solutions**:
1. Check Apps Script deployment URL
2. Redeploy Apps Script with CORS headers
3. Check Apps Script execution logs
4. Verify internet connection
      `;
    } else if (
      error.includes("popup_blocked") ||
      error.includes("popup_closed")
    ) {
      solution = `
🚨 **Popup Blocked**

**Problem**: Browser blocking Google sign-in popup
**Solutions**:
1. Allow popups for localhost/your domain
2. Click address bar icon to allow popups
3. Try incognito mode
4. Check browser popup blocker settings
      `;
    } else if (
      error.includes("script load") ||
      error.includes("gis") ||
      error.includes("google")
    ) {
      solution = `
🚨 **Google Identity Services Not Loading**

**Problem**: GIS script not loaded properly
**Solutions**:
1. Check index.html has: <script src="https://accounts.google.com/gsi/client">
2. Disable ad blockers temporarily
3. Check network tab for script loading
4. Try different browser
      `;
    } else if (error.includes("cors") || error.includes("cross-origin")) {
      solution = `
🚨 **CORS Error**

**Problem**: Cross-origin request blocked
**Solutions**:
1. Redeploy Apps Script with CORS headers
2. Check deployment allows 'Anyone' access
3. Verify Apps Script URL is correct
      `;
    } else {
      solution = `
🤔 **Unknown Error**

**Please provide more details:**
- Full error stack trace
- Browser and version
- Steps to reproduce
- Network tab information

**Common debugging:**
1. Check browser console for red errors
2. Open Network tab, try login, check failed requests
3. Test with different browser/incognito mode
4. Verify all environment variables are set
      `;
    }

    setAnalysis(solution);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Console Error Analyzer</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Paste your console error here:
          </label>
          <textarea
            value={errorText}
            onChange={(e) => setErrorText(e.target.value)}
            placeholder="Example: idpiframe_initialization_failed: Invalid client ID..."
            className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={analyzeError}
          disabled={!errorText.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Analyze Error
        </button>

        {analysis && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Analysis & Solution:</h3>
            <div className="prose prose-sm max-w-none whitespace-pre-line">
              {analysis}
            </div>
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Debug Commands:</h3>
          <div className="space-y-2 text-sm">
            <div>
              <code className="bg-white px-2 py-1 rounded">
                console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)
              </code>
            </div>
            <div>
              <code className="bg-white px-2 py-1 rounded">
                console.log('Google loaded:', !!(window as any).google)
              </code>
            </div>
            <div>
              <code className="bg-white px-2 py-1 rounded">
                console.log('GIS loaded:', !!(window as any).google?.accounts)
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
