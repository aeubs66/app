# Routes & Guards Demo Plan

## Route Protection Summary

### Public Routes (No Authentication Required)
- `/` - Landing page (ChatGPT-style interface)
- `/pricing` - Pricing page with three plan cards
- `/sign-in` - Clerk sign-in page (handled by Clerk)
- `/sign-up` - Clerk sign-up page (handled by Clerk)
- `/legal/privacy` - Privacy policy page
- `/legal/terms` - Terms of service page

### Protected Routes (Authentication Required)
- `/dashboard` - User dashboard (documents list, plan status, credits)
- `/upload` - PDF upload page
- `/doc/[id]` - Chat interface for a specific document
- `/team/settings` - Team management (invites, seats, billing portal)
- `/account` - Account settings (plan info, manage billing)

## Route Structure

```
app/
├── page.tsx                    # / (landing)
├── pricing/
│   └── page.tsx               # /pricing
├── dashboard/
│   └── page.tsx               # /dashboard (protected)
├── upload/
│   └── page.tsx               # /upload (protected)
├── doc/
│   └── [id]/
│       └── page.tsx          # /doc/:id (protected)
├── team/
│   └── settings/
│       └── page.tsx          # /team/settings (protected)
├── account/
│   └── page.tsx              # /account (protected)
└── legal/
    ├── privacy/
    │   └── page.tsx          # /legal/privacy
    └── terms/
        └── page.tsx          # /legal/terms
```

## Authentication Flow

1. **Unauthenticated users** can access:
   - Landing page (`/`)
   - Pricing page (`/pricing`)
   - Sign in/Sign up pages
   - Legal pages

2. **Authenticated users** are automatically redirected to `/dashboard` if they try to access protected routes while logged in.

3. **Protected routes** use Clerk middleware to verify authentication before rendering.

## Middleware Configuration

The `middleware.ts` file uses Clerk's `createRouteMatcher` to define public routes:
- `/`
- `/pricing`
- `/sign-in(.*)`
- `/sign-up(.*)`
- `/legal(.*)`

All other routes require authentication via `auth.protect()`.

## UI Features

### Navbar
- Shows "Sign in / Get started" for unauthenticated users
- Shows "Dashboard" link and UserButton for authenticated users
- Sticky header with backdrop blur

### Dark Mode
- Forced dark mode via `className="dark"` on `<html>`
- ChatGPT-like aesthetic with:
  - Dark gray background (`bg-gray-900`)
  - Muted borders and accents
  - Emerald green accent color (`emerald-600`)
  - Smooth transitions and hover effects

### Page Layouts
- All pages use consistent dark theme
- Centered content with max-width containers
- Responsive design with Tailwind breakpoints
- Clean, minimal ChatGPT-inspired interface

## Next Steps

1. Install dependencies: `npm install` in `/frontend`
2. Set up Clerk environment variables in `.env`
3. Test route protection by accessing protected routes while logged out
4. Verify Clerk authentication flow works correctly
5. Continue with Phase 2: Backend API integration

