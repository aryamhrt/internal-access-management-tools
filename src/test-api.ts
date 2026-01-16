import api from "./lib/api";

// Quick test to verify API connection
async function testAPI() {
  try {
    console.log("Testing API connection...");
    const response = await api.dashboard.getStats();
    console.log("✅ API Test Successful:", response);
    return true;
  } catch (error) {
    console.error("❌ API Test Failed:", error);
    return false;
  }
}

// Export for use in browser console
(window as any).testAPI = testAPI;

console.log(
  "API test function loaded. Run testAPI() in browser console to test.",
);
