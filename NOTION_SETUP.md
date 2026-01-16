# Notion Backend Setup Guide

This guide explains how to set up Notion as the backend for the Access Management System, providing a reliable alternative to Google Apps Script.

## Prerequisites

- A Notion account
- Basic understanding of Notion databases
- Access to modify environment variables

## Step 1: Create Notion Integration

1. Go to [Notion Developers](https://developers.notion.com/)
2. Click **"New Integration"**
3. Fill in the details:
   - **Name**: "Access Management System"
   - **Associated workspace**: Select your workspace
   - **Type**: "Internal integration"
4. Click **"Submit"**
5. **Copy the "Internal Integration Token"** - you'll need this for `VITE_NOTION_API_KEY`

## Step 2: Create Required Databases

You need to create 5 databases in Notion with specific column structures. Each database should be a "Database" page in Notion.

### 2.1 Users Database

Create a new database page titled "Users" and add the following columns:

| Column Name       | Type      | Description                                       | Required |
| ----------------- | --------- | ------------------------------------------------- | -------- |
| **Name**          | Title     | User's full name                                  | ✅       |
| **Email**         | Email     | User's email address                              | ✅       |
| **Role**          | Select    | User role: "super_admin", "app_admin", "employee" | ✅       |
| **Status**        | Select    | Account status: "active", "offboard"              | ✅       |
| **Join Date**     | Date      | When user joined                                  | ✅       |
| **Offboard Date** | Date      | When user was offboarded                          | ❌       |
| **Invited By**    | Rich Text | Who invited this user                             | ❌       |

**Options for Select fields:**

- **Role**: super_admin, app_admin, employee
- **Status**: active, offboard

### 2.2 Applications Database

Create a new database page titled "Applications" and add the following columns:

| Column Name      | Type         | Description                                                 | Required |
| ---------------- | ------------ | ----------------------------------------------------------- | -------- |
| **Name**         | Title        | Application name                                            | ✅       |
| **Category**     | Select       | Application category (e.g., "Development", "HR", "Finance") | ✅       |
| **Description**  | Rich Text    | Detailed description                                        | ✅       |
| **Admin Emails** | Multi-select | Email addresses of app admins                               | ✅       |
| **Created By**   | Rich Text    | Who created this application                                | ❌       |

**Note**: The "Admin Emails" multi-select field should contain the email addresses of users who can approve requests for this application.

### 2.3 Access Requests Database

Create a new database page titled "Access Requests" and add the following columns:

| Column Name        | Type      | Description                                       | Required |
| ------------------ | --------- | ------------------------------------------------- | -------- |
| **Employee ID**    | Rich Text | ID of the requesting user                         | ✅       |
| **Application ID** | Rich Text | ID of the requested application                   | ✅       |
| **Type**           | Select    | Request type: "new", "update", "delete"           | ✅       |
| **Status**         | Select    | Request status: "pending", "approved", "rejected" | ✅       |
| **Request Date**   | Date      | When request was made                             | ✅       |
| **Approved Date**  | Date      | When request was approved                         | ❌       |
| **Approved By**    | Rich Text | User ID who approved                              | ❌       |
| **Admin Notes**    | Rich Text | Approval/rejection notes                          | ❌       |
| **Justification**  | Rich Text | User's reason for request                         | ✅       |
| **Auto Generated** | Checkbox  | Whether request was auto-generated                | ✅       |

**Options for Select fields:**

- **Type**: new, update, delete
- **Status**: pending, approved, rejected

### 2.4 Access Registry Database

Create a new database page titled "Access Registry" and add the following columns:

| Column Name        | Type      | Description                        | Required |
| ------------------ | --------- | ---------------------------------- | -------- |
| **Employee ID**    | Rich Text | ID of the user with access         | ✅       |
| **Application ID** | Rich Text | ID of the application              | ✅       |
| **Granted Date**   | Date      | When access was granted            | ✅       |
| **Granted By**     | Rich Text | User ID who granted access         | ✅       |
| **Status**         | Select    | Access status: "active", "revoked" | ✅       |
| **Revoked Date**   | Date      | When access was revoked            | ❌       |
| **Revoked By**     | Rich Text | User ID who revoked access         | ❌       |

**Options for Select fields:**

- **Status**: active, revoked

### 2.5 Notifications Database (Optional)

Create a new database page titled "Notifications" and add the following columns:

| Column Name            | Type      | Description                   | Required |
| ---------------------- | --------- | ----------------------------- | -------- |
| **Recipient ID**       | Rich Text | ID of the user to notify      | ✅       |
| **Type**               | Select    | Notification type             | ✅       |
| **Title**              | Title     | Notification title            | ✅       |
| **Message**            | Rich Text | Notification content          | ✅       |
| **Related Request ID** | Rich Text | Associated request ID         | ❌       |
| **Is Read**            | Checkbox  | Whether notification was read | ✅       |
| **Sent to Mattermost** | Checkbox  | Whether sent to Mattermost    | ✅       |

**Options for Select fields:**

- **Type**: info, warning, success, error

## Step 3: Share Databases with Integration

For each database you created:

1. Open the database page
2. Click the **"Share"** button (top-right)
3. Click **"Invite"**
4. Search for your integration name ("Access Management System")
5. Select it and ensure it has **"Full access"**
6. Click **"Invite"**

## Step 4: Get Database IDs

For each database:

1. Open the database page
2. Copy the URL from your browser
3. The database ID is the long string between the last `/` and `?`

Example URL: `https://www.notion.so/workspace/12345678-1234-1234-1234-123456789abc?v=...`

- Database ID: `12345678-1234-1234-1234-123456789abc`

## Step 5: Configure Environment Variables

Create or update your `.env` file with the following variables:

```bash
# Backend Configuration
VITE_BACKEND_TYPE=notion

# Notion API Configuration
VITE_NOTION_API_KEY=your_integration_token_here
VITE_NOTION_USERS_DB=your_users_database_id
VITE_NOTION_APPLICATIONS_DB=your_applications_database_id
VITE_NOTION_ACCESS_REQUESTS_DB=your_access_requests_database_id
VITE_NOTION_ACCESS_REGISTRY_DB=your_access_registry_database_id
VITE_NOTION_NOTIFICATIONS_DB=your_notifications_database_id

# CORS Proxy (automatically configured via Vite)
# No additional configuration needed - Vite handles proxying

# Keep existing variables
VITE_API_BASE_URL=...
VITE_GOOGLE_CLIENT_ID=...
# ... etc
```

## Step 6: Add Test User

Before testing, you need to add at least one user to your Users database:

1. Open your Users database in Notion
2. Click **"New"** to add a new entry
3. Fill in the details:
   - **Name**: Your full name (e.g., "John Doe")
   - **Email**: Your Google account email (must match exactly)
   - **Role**: "super_admin" (for full access) or "app_admin"/"employee"
   - **Status**: "active"
   - **Join Date**: Today's date

**Important**: The email must exactly match the email from your Google account.

## Step 7: CORS Handling & API Updates

**✅ Automatically Resolved**: The application uses Vite's development proxy to handle CORS issues and Notion API v2.0 updates.

### Notion API v2.0 Changes

**Important**: The system now uses Notion's updated API:

- **Endpoint**: `/data_sources/{id}/query` (was `/databases/{id}/query`)
- **Version**: `2025-09-03` (was `2022-06-28`)
- **Parent**: `data_source_id` (was `database_id`)

**How it works:**

- Frontend calls `/api/notion/*` endpoints
- Vite proxy intercepts and forwards to `https://api.notion.com/v1/data_sources/*`
- Adds required `Authorization` and updated `Notion-Version` headers
- Returns responses to your frontend

### Test the Setup

1. Ensure your `.env` file has `VITE_BACKEND_TYPE=notion`
2. Run `npm run dev`
3. Open the application at `http://localhost:3000`
4. Try logging in with Google
5. Check browser console for success messages

**Expected console output on successful login:**

```
🔍 Testing database access, Data Source ID: your_db_id
🔑 API Key configured: Yes
✅ Data source access successful, found X total users
First few users in database:
1. your-email@domain.com (Your Name) - active
Filtered users for email your-email@domain.com: 1
Found matching user: {id: "...", name: "Your Name", email: "your-email@domain.com", role: "super_admin", status: "active"}
Authentication successful for user: your-email@domain.com
✅ Login successful, received user data: {id: "...", name: "Your Name", ...}
```

### Troubleshooting API Issues

If you get 400 errors:

1. **Database ID**: Verify it matches your Notion database URL exactly
2. **API Version**: System uses `2025-09-03` automatically
3. **Integration Access**: Ensure "Full access" to your databases
4. **Database Sharing**: Verify integration is added to each database

### Manual API Test

Test the API directly:

```bash
# Replace YOUR_DB_ID and YOUR_API_KEY
curl -X POST 'http://localhost:3000/api/notion/data_sources/YOUR_DB_ID/query' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Notion-Version: 2025-09-03' \
  -H "Content-Type: application/json" \
  --data '{}'
```

## Step 6: Test the Setup

1. Start your development server:

   ```bash
   npm run dev
   ```

2. Try logging in - the system should now use Notion as the backend

3. Check browser console for any errors

## Database Relationships

```
Users (ID) ──┬───→ Access Requests (Employee ID)
             │
             └───→ Access Registry (Employee ID)
             │
             └───→ Applications (Created By)

Applications (ID) ──┬───→ Access Requests (Application ID)
                    │
                    └───→ Access Registry (Application ID)

Users (Email) ────→ Applications (Admin Emails)
```

## Data Types Reference

### User Roles

- **super_admin**: Full system access, can manage everything
- **app_admin**: Can approve requests for assigned applications
- **employee**: Can request access, limited permissions

### Application Categories

- **Development**: Development tools (GitHub, Jira, etc.)
- **HR**: Human Resources systems
- **Finance**: Financial applications
- **Marketing**: Marketing tools
- **Sales**: Sales applications
- **Operations**: Operational tools

### Request Types

- **new**: New access request
- **update**: Modify existing access
- **delete**: Remove access

### Request Status

- **pending**: Awaiting approval
- **approved**: Request approved
- **rejected**: Request denied

### Access Status

- **active**: User has access
- **revoked**: Access has been revoked

## Troubleshooting

### Common Issues

1. **"Notion API error"**
   - Check your `VITE_NOTION_API_KEY` is correct
   - Ensure integration has access to all databases

2. **"Database not found"**
   - Verify database IDs are correct
   - Ensure databases are shared with the integration

3. **Data not saving**
   - Check column names match exactly
   - Ensure column types are correct

4. **Permission errors**
   - Make sure integration has "Full access" to databases
   - Check integration is not deleted or revoked

### Debug Tips

1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test Notion API directly using curl or Postman
4. Ensure database schemas match exactly as specified

## Migration from Apps Script

If you're switching from Apps Script to Notion:

1. Export your data from Google Sheets
2. Import data into Notion databases following the column structure
3. Update environment variables
4. Test all functionality
5. Optionally keep Apps Script as backup

## Performance Notes

- Notion API has rate limits (3 requests/second)
- Database queries are optimized for the required filtering
- Large datasets may require pagination (not implemented yet)
- Real-time updates work better than Apps Script

## Security Considerations

- Keep integration token secure
- Don't commit token to version control
- Regularly rotate integration tokens
- Limit database access to necessary integrations only
- Monitor Notion API usage and costs

---

**Need help?** Check the browser console for detailed error messages and ensure all database IDs and the integration token are configured correctly.
