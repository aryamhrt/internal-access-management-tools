# Google OAuth Console Error Solutions

## 🔍 Most Common Console Errors & Fixes

### **Error: `popup_closed_by_user`**

**Cause**: User closed the Google sign-in popup
**Fix**: Click the sign-in button again and complete the flow

### **Error: `idpiframe_initialization_failed`**

**Cause**: Invalid Client ID or Google Identity Services not loaded
**Console**: Check if Client ID is properly set
**Fix**:

```javascript
console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
// Should show: 871426160424-er26rhqjk9d88jmvt24mubvibfh87961.apps.googleusercontent.com
```

### **Error: `invalid_client`**

**Cause**: Client ID not found in Google Cloud Console
**Fix**: Verify Client ID matches exactly in Google Cloud Console

### **Error: `access_denied`**

**Cause**: User denied permission or email domain not allowed
**Fix**: Use only @djoin.id emails or check OAuth consent screen

### **Error: `popup_blocked_by_browser`**

**Cause**: Browser blocked the popup
**Fix**: Allow popups for your site or use redirect mode

### **Error: `Network Error` (when sending to backend)**

**Cause**: Apps Script not responding or CORS issues
**Fix**: Check Apps Script deployment and CORS headers

## 🧪 **Console Debugging Commands**

Run these in browser console (F12 → Console):

```javascript
// Check if Google Identity Services loaded
console.log("Google loaded:", !!window.google);
console.log("GIS loaded:", !!(window.google && window.google.accounts));

// Check your configuration
console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("Domain:", import.meta.env.VITE_ALLOWED_DOMAIN);

// Test JWT decoding (replace YOUR_JWT with actual token)
function decodeJWT(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    console.log("Decoded JWT:", payload);
    return payload;
  } catch (e) {
    console.error("JWT decode failed:", e);
    return null;
  }
}
// Usage: decodeJWT('YOUR_JWT_TOKEN_HERE');
```

## 🔧 **Step-by-Step Debugging**

### **Step 1: Check Basic Setup**

```javascript
// Run in console
console.log("=== Google OAuth Debug ===");
console.log("1. Google loaded:", !!window.google);
console.log("2. Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
console.log("3. Domain:", import.meta.env.VITE_ALLOWED_DOMAIN);
console.log("4. Current URL:", window.location.href);
```

### **Step 2: Test Sign-In Button**

1. Click the "Sign in with Google" button
2. Check console for any errors
3. If popup appears, check what happens when you select an account

### **Step 3: Check JWT Token**

When sign-in succeeds, the console should show:

```
🔐 Google Sign-In Response: {credential: "..."}
✅ Credential received, length: 1234
👤 User info: {email: "user@djoin.id", name: "User Name", domain: "djoin.id"}
```

### **Step 4: Check Backend Communication**

After successful Google sign-in, check for API calls:

- Look for `POST` request to your Apps Script URL
- Check response status and content
- Look for Apps Script execution logs

## 🚨 **If You See These Errors**

### **"Failed to initialize Google Sign-In"**

- Check Client ID format
- Verify Google script loaded (`<script src="https://accounts.google.com/gsi/client">`)

### **"Google Identity Services failed to load"**

- Check internet connection
- Verify no ad blockers blocking Google scripts
- Try in incognito mode

### **"Only @djoin.id email addresses are allowed"**

- User tried to login with wrong domain
- Use only @djoin.id Google accounts

### **"Invalid JWT token" (from backend)**

- JWT format corrupted during transmission
- Check Apps Script logs for decoding errors

## 📞 **Emergency Debug Mode**

If nothing works, I can enable detailed logging:

```javascript
// Add to browser console for maximum debugging
localStorage.setItem("debug", "google-oauth");
location.reload(); // Refresh page
```

**Please share the exact console error message you're seeing, and I'll provide a specific fix!** 🔧
