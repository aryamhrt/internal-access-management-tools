# Google OAuth Troubleshooting

## Common Issues & Solutions

### 1. "Invalid Client" or "Client not found"

**Symptoms**: Google Sign-In button doesn't appear or shows error
**Cause**: Invalid Client ID or not properly configured
**Solution**:

- Verify Client ID in `.env` file matches Google Cloud Console
- Ensure OAuth consent screen is configured
- Check that APIs are enabled

### 2. "Access blocked: This app's request is invalid"

**Symptoms**: Error message from Google
**Cause**: Authorized domains not configured
**Solution**:

- Add `djoin.id` to authorized domains in OAuth consent screen
- Ensure your app URL is in authorized origins

### 3. "Only @djoin.id email addresses are allowed"

**Symptoms**: Login fails with domain error
**Cause**: User tried to login with non-djoin.id email
**Solution**: Use only @djoin.id Google accounts

### 4. "JWT token decode failed"

**Symptoms**: Backend authentication fails
**Cause**: JWT token format issue or Apps Script error
**Solution**: Check Apps Script logs for detailed error messages

### 5. "redirect_uri_mismatch"

**Symptoms**: OAuth redirect error
**Cause**: Incorrect redirect URIs configured
**Solution**: For GIS, redirect URIs should be empty

## Debugging Steps

### Frontend Debugging

1. Open browser Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify Client ID is loaded: `console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID)`

### Backend Debugging

1. Open Apps Script editor
2. Go to Executions
3. Look for recent executions
4. Check logs for authentication errors

### Test Commands

```bash
# Test if Google Client ID is configured
curl -s "https://oauth2.googleapis.com/tokeninfo?access_token=YOUR_TOKEN" | head -5

# Test JWT decode (replace with actual JWT)
echo "HEADER.PAYLOAD.SIGNATURE" | cut -d"." -f2 | base64 -d
```

## Configuration Checklist

- ✅ Google Cloud Project created
- ✅ Google Identity API enabled
- ✅ OAuth consent screen configured
- ✅ Client ID created (Web application type)
- ✅ Authorized domains: `djoin.id`
- ✅ Authorized origins: your app URLs
- ✅ Test users added to consent screen
- ✅ Client ID in `.env` file matches Google Console
- ✅ Apps Script redeployed with Google auth code

## Emergency Fallback

If Google OAuth is not working, you can temporarily enable traditional email/password login:

```javascript
// In Apps Script handleLogin function
function handleLogin(data) {
  const { email, password } = data;
  const user = authenticateUser(email, password); // Traditional auth

  if (user) {
    const token = generateToken(user);
    return createResponse(true, "Login successful", { user, token });
  } else {
    return createResponse(false, "Invalid credentials", null, 401);
  }
}
```

Then update the frontend to use email/password form instead of Google Sign-In.
