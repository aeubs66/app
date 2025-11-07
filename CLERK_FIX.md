# Clerk Error Fix

## Error
```
Clerk: auth() and currentUser() are only supported in App Router (/app directory).
Original error: TypeError: Request constructor: init.headers is a symbol, which cannot be converted to a DOMString.
```

## Solution

The error is typically caused by one of the following:

### 1. Missing Environment Variables
Ensure you have created a `.env.local` file in the `frontend/` directory with:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 2. Middleware Configuration
The middleware has been updated to use the correct Clerk v5 API. If you still see errors, try:

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Verify middleware is in the correct location:**
   - Should be at `frontend/middleware.ts` (root of frontend directory)

### 3. Clerk Version Compatibility
If issues persist, you may need to pin to a specific Clerk version:

```bash
npm install @clerk/nextjs@5.0.0
```

### 4. Alternative: Page-Level Protection
If middleware continues to cause issues, you can protect routes at the page level (already implemented for `/dashboard`):

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  // ... rest of page
}
```

## Current Setup

- ✅ Middleware configured with route protection
- ✅ ClerkProvider in root layout
- ✅ Dashboard page has page-level protection as fallback
- ✅ All routes scaffolded

## Next Steps

1. Create `.env.local` with your Clerk keys
2. Restart the dev server
3. Test authentication flow

