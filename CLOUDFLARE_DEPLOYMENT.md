# 🚀 Deploying Access Management App to Cloudflare Pages

This guide will help you deploy your Access Management application to Cloudflare Pages for a fast, secure, and globally distributed web application.

## 📋 Prerequisites

- ✅ Cloudflare account ([Sign up](https://dash.cloudflare.com/sign-up))
- ✅ Git repository (GitHub, GitLab, or Bitbucket)
- ✅ Node.js 18+ installed locally
- ✅ Access to your backend APIs (Apps Script or Notion)

## 🔧 Build Configuration

### 1. Update `package.json` Scripts

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 2. Configure Vite for Cloudflare Pages

Create or update `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
        },
      },
    },
  },
  server: {
    proxy: {
      // Only needed for local development
      "/api": {
        target: "https://script.google.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
```

### 3. Environment Variables Setup

Create environment files for different environments:

#### `.env.local` (Local development)

```bash
# Backend Configuration
VITE_BACKEND_TYPE=appscript

# Apps Script Backend
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_ALLOWED_DOMAIN=yourdomain.com

# Notion Backend (alternative)
# VITE_BACKEND_TYPE=notion
# VITE_NOTION_API_KEY=your_notion_api_key
# VITE_NOTION_USERS_DB=database_id
# VITE_NOTION_APPLICATIONS_DB=database_id
# VITE_NOTION_ACCESS_REQUESTS_DB=database_id
# VITE_NOTION_ACCESS_REGISTRY_DB=database_id

# Mattermost Integration (optional)
VITE_MATTERMOST_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/webhook-id
```

#### `.env.production` (Production)

```bash
# Use production URLs and secrets
VITE_BACKEND_TYPE=appscript
VITE_API_BASE_URL=https://script.google.com/macros/s/PRODUCTION_SCRIPT_ID/exec
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_ALLOWED_DOMAIN=yourdomain.com
VITE_MATTERMOST_WEBHOOK_URL=https://your-mattermost-instance.com/hooks/webhook-id
```

## 🌐 Cloudflare Pages Setup

### Step 1: Connect Your Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Choose **Connect to Git**
4. Select your Git provider (GitHub/GitLab/Bitbucket)
5. Authorize Cloudflare to access your repository
6. Select your repository

### Step 2: Configure Build Settings

In the **Build settings** section:

#### Build Command

```bash
npm run build
```

#### Build Output Directory

```bash
dist
```

#### Root Directory

```bash
/
```

#### Environment Variables

Add these environment variables (they will override `.env` files):

| Variable Name                 | Value                                                    | Description                   |
| ----------------------------- | -------------------------------------------------------- | ----------------------------- |
| `NODE_VERSION`                | `18`                                                     | Node.js version               |
| `VITE_BACKEND_TYPE`           | `appscript`                                              | or `notion`                   |
| `VITE_API_BASE_URL`           | `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec` | Your Apps Script URL          |
| `VITE_GOOGLE_CLIENT_ID`       | `your_google_client_id`                                  | Google OAuth client ID        |
| `VITE_ALLOWED_DOMAIN`         | `yourdomain.com`                                         | Domain restriction            |
| `VITE_MATTERMOST_WEBHOOK_URL` | `https://mattermost.com/hooks/...`                       | Mattermost webhook (optional) |

### Step 3: Environment Variables for Notion Backend (if using)

If you're using Notion as your backend, add these additional variables:

| Variable Name                    | Value                  | Description                        |
| -------------------------------- | ---------------------- | ---------------------------------- |
| `VITE_BACKEND_TYPE`              | `notion`               | Set to use Notion backend          |
| `VITE_NOTION_API_KEY`            | `ntn_xxxxxxxxxxxxxxxx` | Your Notion API key                |
| `VITE_NOTION_USERS_DB`           | `database_id`          | Notion Users database ID           |
| `VITE_NOTION_APPLICATIONS_DB`    | `database_id`          | Notion Applications database ID    |
| `VITE_NOTION_ACCESS_REQUESTS_DB` | `database_id`          | Notion Access Requests database ID |
| `VITE_NOTION_ACCESS_REGISTRY_DB` | `database_id`          | Notion Access Registry database ID |

## 🚀 Deploy

### Automatic Deployment

1. **Push to Main Branch**: Cloudflare Pages will automatically deploy when you push to your main branch
2. **Monitor Build**: Check the deployment status in Cloudflare Dashboard → Pages → Your Project
3. **View Live Site**: Once deployed, you'll get a `*.pages.dev` URL

### Manual Deployment (Optional)

If you need to trigger a manual deployment:

1. Go to your project in Cloudflare Pages
2. Click **Create deployment**
3. Choose the branch and click **Deploy**

## 🔧 Troubleshooting

### Build Failures

#### Issue: Build fails with TypeScript errors

```bash
# Check TypeScript compilation locally
npm run typecheck

# If issues, check your tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### Issue: Environment variables not working

- ✅ Ensure variables start with `VITE_` prefix
- ✅ Check variable names match exactly
- ✅ Redeploy after adding new variables

#### Issue: CORS errors after deployment

- ✅ Verify your Apps Script is deployed and accessible
- ✅ Check that `VITE_API_BASE_URL` is correct
- ✅ Ensure Apps Script allows cross-origin requests

### Runtime Issues

#### Issue: Authentication not working

- ✅ Verify `VITE_GOOGLE_CLIENT_ID` is correct
- ✅ Check `VITE_ALLOWED_DOMAIN` matches your domain
- ✅ Ensure Google OAuth is configured for your domain

#### Issue: API calls failing

```javascript
// Check browser console for errors
// Common issues:
1. Wrong VITE_API_BASE_URL
2. Apps Script not deployed
3. CORS policy blocking requests
4. Environment variables not set correctly
```

#### Issue: Notion backend not working

- ✅ Verify all `VITE_NOTION_*` variables are set
- ✅ Check Notion API key has correct permissions
- ✅ Ensure database IDs are correct
- ✅ Verify Notion integration is enabled

## 🔒 Security Considerations

### Environment Variables

- ✅ Never commit secrets to Git
- ✅ Use Cloudflare's encrypted environment variables
- ✅ Rotate API keys regularly

### Domain Configuration

```javascript
// In Google Cloud Console, add your pages.dev domain
// to authorized domains for OAuth
Authorized domains: your-project.pages.dev
```

### HTTPS & Security Headers

Cloudflare Pages automatically provides:

- ✅ HTTPS certificates
- ✅ Security headers
- ✅ DDoS protection
- ✅ Global CDN

## 📊 Performance Monitoring

### Cloudflare Analytics

1. Go to Cloudflare Dashboard → Analytics
2. Monitor page views, performance, and errors
3. Set up alerts for downtime

### Build Optimization

```javascript
// Check bundle size
npm run build
npx vite-bundle-analyzer dist

// Optimize if bundle is too large
// Consider code splitting or lazy loading
```

## 🔄 Updates & Maintenance

### Deploying Updates

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# Cloudflare Pages will auto-deploy
```

### Rollbacks

1. Go to Cloudflare Pages → Deployments
2. Find the previous deployment
3. Click **Restore**

## 🌍 Custom Domain (Optional)

### Add Custom Domain

1. Go to Cloudflare Pages → Custom domains
2. Click **Add custom domain**
3. Enter your domain name
4. Follow DNS configuration instructions

### SSL Certificate

- ✅ Cloudflare automatically provisions SSL
- ✅ No additional configuration needed

## 🎯 Success Checklist

- [ ] Repository connected to Cloudflare Pages
- [ ] Build settings configured correctly
- [ ] Environment variables set
- [ ] First deployment successful
- [ ] Authentication working
- [ ] API calls functioning
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Performance monitored

## 📞 Support

If you encounter issues:

1. **Check Cloudflare Pages Documentation**: https://developers.cloudflare.com/pages/
2. **Review Build Logs**: In Cloudflare Dashboard → Pages → Your Project → Builds
3. **Browser Console**: Check for JavaScript errors
4. **Network Tab**: Verify API calls are working

## 🎉 You're Done!

Your Access Management app is now live on Cloudflare Pages with:

- ⚡ Fast global CDN
- 🔒 HTTPS security
- 🚀 Automatic deployments
- 📊 Built-in analytics
- 🛡️ DDoS protection

**Your app URL**: `https://your-project.pages.dev`

Happy deploying! 🎊</content>
<parameter name="filePath">/Users/aryamaharta/Documents/Projects/djoin/utils/access-management/CLOUDFLARE_DEPLOYMENT.md
