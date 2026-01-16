# Access Management System - Agent Documentation

## Overview
Sistem manajemen akses aplikasi perusahaan dengan multi-role (Super Admin, App Admin, Employee) dan notifikasi otomatis untuk offboarding.

---

## Development Guidelines for AI Agents

### Tech Stack
- **Frontend**: React with TypeScript, deployed on Vercel/Netlify
- **Backend**: Google Sheets API with Apps Script automation
- **Notifications**: Mattermost webhooks, email via n8n
- **Database**: Google Sheets (Users, Applications, Access Requests, Access Registry, Notifications)
- **Authentication**: Email-based invite system with password setup
- **Authorization**: Role-based access control (RBAC)

### Build & Development Commands

#### Frontend (React/TypeScript)
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

#### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run single test file
npm test -- path/to/test/file.test.ts

# Run tests with coverage
npm run test:coverage
```

#### Google Apps Script (Backend Automation)
```bash
# Deploy to Google Apps Script
npm run deploy:apps-script

# Test Apps Script functions locally
npm run test:apps-script
```

### Code Style Guidelines

#### TypeScript/React Conventions
- **File Extensions**: `.tsx` for components, `.ts` for utilities/types
- **Component Naming**: PascalCase (e.g., `AccessRequestForm.tsx`)
- **Function Naming**: camelCase (e.g., `handleSubmitRequest`)
- **Type Naming**: PascalCase with descriptive names (e.g., `AccessRequest`, `UserRole`)
- **File Naming**: kebab-case for files (e.g., `access-request-form.tsx`)

#### Imports Organization
```typescript
// React imports first
import React, { useState, useEffect } from 'react';

// Third-party libraries
import axios from 'axios';
import { format } from 'date-fns';

// Local imports - absolute paths preferred
import { User } from '@/types/user';
import { apiClient } from '@/lib/api';
import Button from '@/components/ui/button';

// Relative imports only for closely related files
import { validateRequest } from './validation';
```

#### Component Structure
```typescript
interface AccessRequestFormProps {
  userId: string;
  onSubmit: (request: AccessRequest) => void;
}

export function AccessRequestForm({ userId, onSubmit }: AccessRequestFormProps) {
  const [formData, setFormData] = useState<AccessRequest>({
    applicationId: '',
    justification: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      // Success handling
    } catch (error) {
      console.error('Failed to submit request:', error);
      // Error handling
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form JSX */}
    </form>
  );
}
```

#### Error Handling
```typescript
// Async operations with proper error handling
const submitAccessRequest = async (requestData: AccessRequest) => {
  try {
    const response = await apiClient.post('/requests', requestData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    }
    if (error.response?.status === 400) {
      throw new Error('Invalid request data. Please check your input.');
    }
    throw new Error('Failed to submit access request. Please try again.');
  }
};

// Component error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

#### API Integration
```typescript
// API client structure
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### State Management
```typescript
// Custom hooks for business logic
const useAccessRequests = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/requests');
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return { requests, loading, refetch: fetchRequests };
};

// Context for global state
const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Testing Patterns
```typescript
// Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessRequestForm } from './access-request-form';

describe('AccessRequestForm', () => {
  it('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    const user = userEvent.setup();

    render(<AccessRequestForm userId="123" onSubmit={mockOnSubmit} />);

    await user.type(screen.getByLabelText(/justification/i), 'Need access for project work');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        applicationId: '',
        justification: 'Need access for project work',
      });
    });
  });
});

// API testing
import { apiClient } from '@/lib/api';

describe('API Client', () => {
  it('handles successful requests', async () => {
    const mockResponse = { data: { id: 1, name: 'Test App' } };
    jest.spyOn(apiClient, 'get').mockResolvedValue(mockResponse);

    const result = await apiClient.get('/applications');
    expect(result).toEqual(mockResponse);
  });
});
```

### File Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   ├── layout/       # Layout components
│   └── dashboard/    # Dashboard-specific components
├── pages/            # Route-level components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
│   ├── api.ts        # API client setup
│   ├── constants.ts  # App constants
│   └── utils.ts      # Helper functions
├── types/            # TypeScript type definitions
├── contexts/         # React contexts
├── services/         # Business logic services
└── styles/           # Global styles and theme
```

### Environment Variables
```bash
# .env.local
REACT_APP_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
REACT_APP_MATTERMOST_WEBHOOK_URL=https://mattermost.company.com/hooks/xxxxx
REACT_APP_ENVIRONMENT=development

# .env.production
REACT_APP_API_BASE_URL=https://script.google.com/macros/s/PROD_SCRIPT_ID/exec
REACT_APP_MATTERMOST_WEBHOOK_URL=https://mattermost.company.com/hooks/yyyyy
REACT_APP_ENVIRONMENT=production
```

### Security Best Practices
- Never commit sensitive data (API keys, tokens, credentials)
- Use environment variables for all configuration
- Validate all user inputs on both client and server
- Implement proper authentication and authorization
- Use HTTPS in production
- Sanitize data before rendering to prevent XSS

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/access-request-form

# Make changes and commit
git add .
git commit -m "feat: add access request form component

- Add form validation
- Implement API integration
- Add error handling"

# Push and create PR
git push origin feature/access-request-form
```

### Performance Optimization
- Use React.memo for expensive components
- Implement proper loading states
- Use React.lazy for code splitting
- Optimize images and assets
- Implement proper caching strategies
- Use React Query for server state management

---

## Business Logic & System Overview

## Agents & Roles

### 1. Super Admin
**Identitas**: Kamu (pembuat sistem)

**Responsibilities**:
- Invite dan manage users (employees)
- Manage list aplikasi
- Assign app admins ke setiap aplikasi
- View semua aktivitas sistem
- Override decisions jika perlu

**Access**:
- Full access ke semua fitur
- Dashboard overview seluruh sistem
- User management panel
- Application management panel

### 2. App Admin
**Identitas**: User yang di-assign sebagai admin untuk aplikasi tertentu

**Responsibilities**:
- Approve/reject access requests untuk aplikasi mereka
- Revoke akses employee untuk aplikasi mereka
- Menerima notifikasi untuk:
  - Request akses baru ke aplikasi mereka
  - Alert offboard (employee yang sudah offboard tapi masih punya akses)
  - Reminder untuk pending requests yang belum di-follow up
- Update notes/status request

**Access**:
- Dashboard khusus aplikasi yang mereka manage
- List access requests untuk aplikasi mereka
- List employees yang punya akses ke aplikasi mereka
- Tidak bisa manage aplikasi lain

**Contoh**:
- Admin IT manage: Jira, GitHub, Slack
- Admin Sales manage: Salesforce, HubSpot
- Admin Finance manage: SAP, QuickBooks

### 3. Employee
**Identitas**: Pegawai biasa

**Responsibilities**:
- Request akses baru ke aplikasi
- View status request mereka sendiri
- Update request mereka (jika masih pending)

**Access**:
- Dashboard pribadi (request history mereka)
- Form request akses baru
- View status approval
- Tidak bisa approve/reject

## User Journey Flows

### Flow 1: Onboarding Employee Baru
```
1. Super Admin → Invite employee baru via email
2. Employee → Terima invite, set password, login
3. Employee → Request akses ke aplikasi yang dibutuhkan
4. System → Kirim notifikasi ke App Admin terkait
5. App Admin → Review dan approve/reject
6. System → Notifikasi ke employee (approved/rejected)
7. App Admin → (Manual) Grant akses di aplikasi actual
```

### Flow 2: Offboarding Employee
```
1. Super Admin → Update status employee jadi "offboard" + set offboard date
2. System → Auto-create "delete access" requests untuk semua aplikasi employee
3. System → Kirim notifikasi urgent ke semua App Admins terkait
4. App Admin → Review dan konfirmasi revoke akses
5. App Admin → (Manual) Hapus akses di aplikasi actual
6. System → Mark request sebagai "completed"
```

### Flow 3: Alert Offboard Lewat Waktu
```
1. System → Cron job harian cek offboard date
2. System → Jika ada akses yang belum di-revoke > X hari setelah offboard:
   - Kirim notifikasi Mattermost ke App Admin
   - Highlight di dashboard App Admin
   - Escalate ke Super Admin jika > Y hari
```

### Flow 4: Employee Request Akses Baru
```
1. Employee → Submit request via form
2. System → Auto-detect App Admin untuk aplikasi tersebut
3. System → Kirim notifikasi ke App Admin via:
   - In-app notification
   - Mattermost (optional)
4. App Admin → Login, review request
5. App Admin → Approve/reject dengan notes
6. System → Update status + notify employee
```

## Data Model

### Users Table
```
- id: unique identifier
- name: string
- email: string (unique)
- role: enum (super_admin, app_admin, employee)
- status: enum (active, offboard)
- join_date: date
- offboard_date: date (nullable)
- created_at: timestamp
- invited_by: user_id (foreign key)
```

### Applications Table
```
- id: unique identifier
- name: string
- category: string
- description: text
- admin_emails: array[string] (bisa multiple admins)
- created_at: timestamp
- created_by: user_id
```

### Access Requests Table
```
- id: unique identifier
- employee_id: foreign key → users
- application_id: foreign key → applications
- type: enum (new, update, delete)
- status: enum (pending, approved, rejected, completed)
- request_date: timestamp
- approved_date: timestamp (nullable)
- approved_by: user_id (nullable)
- admin_notes: text
- auto_generated: boolean (true untuk offboard auto-requests)
```

### Access Registry Table (Actual Access)
```
- id: unique identifier
- employee_id: foreign key → users
- application_id: foreign key → applications
- granted_date: timestamp
- granted_by: user_id
- status: enum (active, revoked)
- revoked_date: timestamp (nullable)
- revoked_by: user_id (nullable)
```

### Notifications Table
```
- id: unique identifier
- recipient_id: foreign key → users
- type: enum (new_request, offboard_alert, reminder, approval_result)
- title: string
- message: text
- related_request_id: foreign key → access_requests (nullable)
- is_read: boolean
- created_at: timestamp
- sent_to_mattermost: boolean
```

## Notification Rules

### For App Admins
1. **New Request** → Instant notification
2. **Offboard Alert** → Instant + daily reminder jika belum resolved
3. **Overdue Offboard** (> 7 days) → Daily reminder + escalate to Super Admin
4. **Pending Reminder** → Weekly digest untuk semua pending requests

### For Employees
1. **Request Approved** → Instant notification
2. **Request Rejected** → Instant notification + reason

### For Super Admin
1. **Daily Summary** → Semua aktivitas sistem
2. **Overdue Escalation** → Offboard alerts yang belum resolved > 7 hari
3. **Weekly Report** → Stats dan metrics

## Mattermost Integration Points

### Webhook Triggers
```javascript
// 1. New Access Request
POST https://mattermost.company.com/hooks/xxxxx
{
  text: "🔔 New access request for **Jira**",
  username: "Access Management Bot",
  channel: "#it-admin",
  attachments: [{
    color: "#3AA3E3",
    text: "Budi Santoso requested access to Jira\n[View Request](link)"
  }]
}

// 2. Offboard Alert
POST https://mattermost.company.com/hooks/xxxxx
{
  text: "⚠️ URGENT: Offboarded employee still has access",
  username: "Access Management Bot",
  channel: "#it-admin",
  attachments: [{
    color: "#F35A00",
    text: "Ahmad Yani offboarded 3 days ago, still has access to GitHub\n[Revoke Now](link)"
  }]
}

// 3. Overdue Alert (> 7 days)
POST https://mattermost.company.com/hooks/xxxxx
{
  text: "🚨 CRITICAL: Access not revoked after 7 days",
  username: "Access Management Bot",
  channel: "#management",
  attachments: [{
    color: "#D0021B",
    text: "Ahmad Yani offboarded 10 days ago, GitHub access still active\n@admin.it please take action immediately"
  }]
}
```

## Google Sheets Structure

### Sheet 1: Users
```
A: ID | B: Name | C: Email | D: Role | E: Status | F: Join Date | G: Offboard Date | H: Invited By
```

### Sheet 2: Applications
```
A: ID | B: Name | C: Category | D: Description | E: Admin Emails (comma-separated) | F: Created At
```

### Sheet 3: Access Requests
```
A: ID | B: Employee Email | C: App Name | D: Type | E: Status | F: Request Date | G: Approved Date | H: Approved By | I: Admin Notes | J: Auto Generated
```

### Sheet 4: Access Registry
```
A: ID | B: Employee Email | C: App Name | D: Granted Date | E: Granted By | F: Status | G: Revoked Date | H: Revoked By
```

### Sheet 5: Notifications
```
A: ID | B: Recipient Email | C: Type | D: Title | E: Message | F: Related Request ID | G: Is Read | H: Created At | I: Sent to Mattermost
```

## Security Considerations

1. **Authentication**: Email-based invite dengan password setup
2. **Authorization**: Role-based access control (RBAC)
3. **Data Access**: 
   - Employees hanya bisa lihat data mereka sendiri
   - App Admins hanya bisa manage aplikasi mereka
   - Super Admin full access
4. **Audit Trail**: Semua actions di-log (who, what, when)

## Technical Implementation Notes

### Frontend (React)
- Role-based UI rendering
- Real-time notification system
- Dashboard customization per role
- Mobile-responsive design

### Backend (Google Sheets API)
- Read/write via API
- Batch operations untuk performance
- Cache untuk reduce API calls

### Automation (Apps Script / n8n)
- Daily cron untuk offboard checks
- Webhook triggers untuk Mattermost
- Email notifications (fallback)

### Deployment
- Vercel/Netlify untuk frontend
- Google Apps Script untuk backend automation
- Environment variables untuk API keys/webhooks

## Success Metrics

1. **Adoption Rate**: % users yang aktif menggunakan sistem
2. **Response Time**: Rata-rata waktu App Admin respond to requests
3. **Compliance**: % offboard access yang di-revoke dalam 3 hari
4. **Automation**: % requests yang auto-processed vs manual

## Future Enhancements (Post-MVP)

1. **Integration with HR System**: Auto-sync employee data
2. **SSO Integration**: Login dengan company SSO
3. **Mobile App**: iOS/Android native app
4. **Advanced Analytics**: Dashboard metrics & reports
5. **Bulk Operations**: Mass approve/reject, bulk revoke
6. **Custom Workflows**: Configurable approval chains
7. **API**: REST API untuk integrate dengan tools lain
8. **Slack Integration**: Alternative to Mattermost

---

## Quick Start Guide untuk Super Admin

### Initial Setup
1. Deploy aplikasi (Vercel/Netlify)
2. Setup Google Sheets dengan struktur di atas
3. Configure Google Sheets API credentials
4. Setup Mattermost webhooks
5. Invite diri sendiri sebagai Super Admin pertama

### Add First App Admin
1. Login sebagai Super Admin
2. Invite user baru → assign role "app_admin"
3. Create aplikasi (e.g., "Jira")
4. Assign app admin ke aplikasi tersebut
5. Test: App admin bisa login dan lihat dashboard mereka

### Add First Employee
1. Invite employee baru
2. Employee request akses
3. App admin approve
4. System log access granted

### Test Offboarding Flow
1. Update employee status → "offboard"
2. System auto-create delete requests
3. Check App admin dapat notifikasi
4. App admin revoke access
5. Verify alert hilang dari dashboard