# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Google Identity API
   - Google+ API (optional)

## Step 2: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in app information:
   - **App name**: Access Management System
   - **User support email**: your-email@djoin.id
   - **Developer contact information**: your-email@djoin.id

4. Add authorized domains:
   - `djoin.id`

5. Add test users (your djoin.id emails)

## Step 3: Create OAuth 2.0 Client ID

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose application type: **Web application**
4. Add authorized origins:
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `https://your-production-domain.com`
5. Add authorized redirect URIs:
   - Leave empty (not needed for GIS)

## Step 4: Get Your Client ID

After creating the OAuth client, copy the **Client ID** (not Client Secret):

```
871426160424-er26rhqjk9d88jmvt24mubvibfh87961.apps.googleusercontent.com
```

## Step 5: Update Your .env File

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id_here
VITE_ALLOWED_DOMAIN=yourdomain.com
```

## Step 6: Test the Configuration

1. Open your app at `http://localhost:3001`
2. Try to sign in with a @djoin.id Google account
3. Check browser console for any errors

## Important Notes

### Client Secret Not Needed

- **Google Identity Services (GIS)** doesn't require client secrets for frontend authentication
- Client secrets are only needed for server-side OAuth flows
- Your current setup is correct

### Domain Restriction

- Domain restriction (`hd=djoin.id`) is handled automatically by Google
- Additional server-side validation in your Apps Script

### Testing

- Add your test email to the OAuth consent screen test users
- Use incognito mode to test fresh authentication
