# Pickleball Booking Platform - Frontend

A comprehensive multi-tenant sports booking platform frontend built with React, Material-UI, and React Query.

## Features

- **Four Distinct User Experiences:**
  - Platform Admin Console (Super Admin)
  - Company Admin Console
  - Branch Manager/Staff Console
  - Customer App (Public + Logged-in)

- **Key Technologies:**
  - React 19
  - Material-UI (MUI) for UI components
  - React Router for navigation
  - React Query (TanStack Query) for server state management
  - React Hook Form + Zod for form validation
  - Axios for API calls
  - JWT-based authentication

## Prerequisites

- Node.js 16+ and npm
- Backend API running on `http://localhost:3000` (or configure via `.env`)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_APP_NAME=Pickleball Booking Platform
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3001](http://localhost:3001) (or next available port).

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Shared components (Loading, Toast, etc.)
│   │   ├── layouts/         # Layout components for each console
│   │   └── routes/           # Route guards
│   ├── contexts/             # React contexts (Auth, etc.)
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page components
│   │   ├── admin/            # Platform Admin pages
│   │   ├── company/          # Company Admin pages
│   │   ├── branch/           # Branch Manager pages
│   │   └── customer/         # Customer pages
│   ├── config/               # Configuration files
│   ├── utils/                # Utility functions
│   ├── App.js                # Main app component with routing
│   └── index.js              # Entry point
├── public/                   # Static assets
├── .env.example              # Environment variables template
└── package.json
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)

## Authentication

The app uses JWT-based authentication with access tokens and refresh tokens:

- Tokens are stored in `localStorage`
- Automatic token refresh on 401 errors
- Role-based route protection
- Automatic redirect to appropriate login page based on route

## API Integration

All API calls are made through the `apiClient` utility which:
- Automatically adds authentication headers
- Handles token refresh
- Provides consistent error handling

API endpoints are defined in `src/config/api.js` and match the backend routes.

## User Roles & Routes

### Platform Admin (`/admin/*`)
- Dashboard
- Company management
- Audit logs
- Profile

### Company Admin (`/company/:companyId/*`)
- Dashboard
- Branch management
- Court management
- Services
- Membership plans
- Campaigns
- Bookings (read-only)
- Payments
- Media manager
- Staff management

### Branch Manager/Staff (`/branch/:companyId/:branchId/*`)
- Dashboard
- Branch profile
- Contacts
- Courts
- Business hours
- Bookings
- Media

### Customer (`/` or `/app/*`)
- Home/Landing page
- Branch discovery
- Booking flow
- My bookings
- Memberships
- Gift cards
- Wallet
- Profile

## Media Handling

Media files are stored in MySQL as LONGBLOB. The frontend:
- Uploads via `multipart/form-data`
- Displays images via `GET /api/media/{id}`
- Supports company logos, branch images, court images, and user avatars

## Development Notes

- The app uses Material-UI's theme system for consistent styling
- React Query handles caching, pagination, and refetching
- Form validation uses React Hook Form with Zod schemas
- Toast notifications for user feedback
- Confirmation dialogs for destructive actions
- Loading states and error boundaries throughout

## Backend Integration

Ensure the backend is running and accessible at the URL specified in `.env`.

The frontend expects the backend API to:
- Return data in format: `{ success: true, data: {...} }`
- Handle errors in format: `{ success: false, message: "...", code: "..." }`
- Support JWT authentication via `Authorization: Bearer <token>` header

## Testing

Test credentials (from backend seed data):
- Platform Admin: `admin@platform.com` / `Admin123!`
- Company Admin: `company@admin.com` / `Company123!`
- Branch Manager: `branch@manager.com` / `Branch123!`
- Customer: `customer1@test.com` / `Customer123!`

## Production Build

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Troubleshooting

- **CORS errors**: Ensure backend CORS is configured to allow your frontend origin
- **401 errors**: Check that tokens are being stored correctly in localStorage
- **API connection**: Verify `REACT_APP_API_URL` in `.env` matches your backend URL

## Next Steps

This is a foundational structure. Additional pages and features can be added following the existing patterns:
1. Create page component in appropriate folder (`pages/admin`, `pages/company`, etc.)
2. Add route in `App.js`
3. Use `useApiQuery` or `useApiMutation` hooks for data fetching
4. Wrap with appropriate layout component
5. Add route protection if needed
