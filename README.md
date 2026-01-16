# Access Management System

A React-based access management system with Google Sheets as the backend database. This system allows organizations to manage employee access to various applications with role-based permissions and automated workflows.

## Features

- **Role-based Access Control**: Super Admin, App Admin, and Employee roles
- **Google Sheets Integration**: Uses Google Sheets as the primary database
- **Automated Workflows**: Offboarding triggers automatic access revocation requests
- **Real-time Notifications**: Integration with Mattermost for notifications
- **Responsive UI**: Modern React interface with Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Google Apps Script (REST API)
- **Database**: Google Sheets
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Testing**: Vitest + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- Google Account (for Google Sheets API)
- Google Apps Script enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd access-management
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_MATTERMOST_WEBHOOK_URL=https://mattermost.company.com/hooks/xxxxx
VITE_ENVIRONMENT=development
```

4. Start the development server:
```bash
npm run dev
```

### Google Apps Script Setup

1. Create a new Google Apps Script project at [script.google.com](https://script.google.com)
2. Copy the contents of `apps-script.js` into the script editor
3. Create the required Google Sheets with the following structure:

#### Users Sheet
| ID | Name | Email | Role | Status | Join Date | Offboard Date | Invited By | Created At |

#### Applications Sheet
| ID | Name | Category | Description | Admin Emails | Created At | Created By |

#### Access Requests Sheet
| ID | Employee Email | App Name | Type | Status | Request Date | Approved Date | Approved By | Admin Notes | Auto Generated |

#### Access Registry Sheet
| ID | Employee Email | App Name | Granted Date | Granted By | Status | Revoked Date | Revoked By |

#### Notifications Sheet
| ID | Recipient Email | Type | Title | Message | Related Request ID | Is Read | Created At | Sent to Mattermost |

4. Deploy the Apps Script as a web app:
   - Go to Deploy > New deployment
   - Select type "Web app"
   - Execute as "Me", Access as "Anyone"
   - Copy the deployment URL to your `.env` file

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier

# Testing
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── StatusBadge.tsx
│   └── layout/       # Layout components
│       ├── Layout.tsx
│       └── ProtectedRoute.tsx
├── pages/            # Route-level components
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── UsersPage.tsx
│   ├── ApplicationsPage.tsx
│   └── AccessRequestsPage.tsx
├── contexts/         # React contexts
│   └── AuthContext.tsx
├── hooks/            # Custom React hooks (future)
├── lib/              # Utilities and configurations
│   ├── api.ts        # API client
│   ├── constants.ts  # App constants
│   └── utils.ts      # Helper functions
├── types/            # TypeScript type definitions
│   └── index.ts
├── styles/           # Global styles
│   └── index.css
└── App.tsx           # Main app component
```

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/me` - Get current user

### Users
- `GET /users` - Get all users
- `POST /users/invite` - Invite new user
- `POST /users/{id}/offboard` - Offboard user

### Applications
- `GET /applications` - Get all applications
- `POST /applications` - Create application
- `POST /applications/{id}/admins` - Assign admin

### Access Requests
- `GET /access-requests` - Get access requests
- `POST /access-requests` - Create access request
- `POST /access-requests/{id}/approve` - Approve request
- `POST /access-requests/{id}/reject` - Reject request

### Dashboard
- `GET /dashboard` - Get dashboard statistics

## User Roles & Permissions

### Super Admin
- Full access to all features
- Manage users and applications
- Override any decision
- View system-wide statistics

### App Admin
- Manage specific applications assigned to them
- Approve/reject access requests for their apps
- View access history for their apps
- Receive notifications for pending requests

### Employee
- Request access to applications
- View their own request history
- Update pending requests
- Receive approval/rejection notifications

## Development Guidelines

See `AGENTS.md` for detailed development guidelines including:
- Code style conventions
- Component structure patterns
- Error handling approaches
- Testing patterns
- Git workflow

## Contributing

1. Follow the established code style and conventions
2. Write tests for new features
3. Update documentation as needed
4. Ensure TypeScript types are properly defined
5. Test with the Google Apps Script backend

## License

This project is licensed under the MIT License.