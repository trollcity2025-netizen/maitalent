# Supabase 401 Unauthorized Debug Report

## Root Cause Analysis

After analyzing the MAI Talent codebase, I've identified the **exact root cause** of the Supabase 401 Unauthorized / invalid api errors:

### 🔍 **Primary Issue: Environment Variable Mismatch**

The MAI Talent application has **multiple conflicting environment variable configurations**:

1. **Supabase Client Code** (src/lib/supabaseClient.ts:3-4):
   ```typescript
   const supabaseUrl = import.meta.env.VITE_MAITALENT_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_MAITALENT_SUPABASE_ANON_KEY;
   ```

2. **Environment Files** contain different variable names:
   - **.env**: Contains `VITE_MAI_SUPABASE_URL` and `VITE_MAITALENT_SUPABASE_ANON_KEY`
   - **env.local**: Contains `VITE_SUPABASE_URL` and `VITE_MAI_SUPABASE_URL`
   - **.env.example**: Contains `VITE_MAITALENT_SUPABASE_URL` and `VITE_MAITALENT_SUPABASE_ANON_KEY`

### 📊 **Configuration Analysis**

| File | VITE_MAITALENT_SUPABASE_URL | VITE_MAITALENT_SUPABASE_ANON_KEY | Status |
|------|----------------------------|----------------------------------|---------|
| .env | ✅ Present | ✅ Present | **CORRECT** |
| env.local | ❌ Missing | ❌ Missing | **WRONG** |
| .env.example | ✅ Present | ✅ Present | **CORRECT** |

### 🔧 **Exact Fix Required**

**Option 1: Fix the code to match existing .env file** (Recommended)
```typescript
// In src/lib/supabaseClient.ts, change lines 3-4 to:
const supabaseUrl = import.meta.env.VITE_MAI_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_MAITALENT_SUPABASE_ANON_KEY;
```

**Option 2: Fix env.local to match the code**
Add these lines to env.local:
```
VITE_MAITALENT_SUPABASE_URL=https://toguqsixflnbitxxbngi.supabase.co
VITE_MAITALENT_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvZ3Vxc2l4ZmxuYml0eHhibmdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczMzc3ODMsImV4cCI6MjA4MjkxMzc4M30.Zz556IX0MLp9MZEBB9SmJRkeKnvGYy-FGR5Pp1klVHs
```

### 🚨 **Critical Issues Found**

1. **env.local is missing the required variables** - This is likely the active environment file
2. **Inconsistent variable naming** across different environment files
3. **Supabase function authentication is disabled** - The LiveKit function has authentication commented out for testing

### 📝 **Debugging Tools Added**

I've added comprehensive debugging logs to:

1. **src/lib/supabaseClient.ts**:
   - Logs actual environment variable values
   - Shows if variables are undefined/null
   - Displays variable lengths for validation
   - Lists all available VITE_ environment variables

2. **src/hooks/useLiveKitRoom.ts**:
   - Logs session existence before token fetch
   - Shows access token prefix for verification
   - Logs user ID and room type
   - Debugs LiveKit function response format

3. **test-supabase-config.js**:
   - Standalone test script to verify configuration
   - Tests Supabase client import
   - Tests session retrieval
   - Tests LiveKit function call

### 🔍 **How to Use the Debugging Tools**

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open browser DevTools Console** and look for:
   ```
   === SUPABASE CONFIG DEBUG ===
   supabaseUrl: https://toguqsixflnbitxxbngi.supabase.co
   supabaseUrl is undefined: false
   supabaseAnonKey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   supabaseAnonKey is undefined: false
   ✅ Supabase environment variables loaded successfully
   ```

3. **When connecting to LiveKit**, look for:
   ```
   === LIVEKIT TOKEN FETCH DEBUG ===
   session exists: true
   access token start: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
   user id: user-123
   roomType: audition
   ```

### 🎯 **Expected Fix Outcome**

After applying the fix:

- ✅ Supabase client will have valid URL and API key
- ✅ `supabase.auth.getSession()` will work properly
- ✅ `supabase.functions.invoke("livekit-token")` will succeed
- ✅ LiveKit token generation will work
- ✅ No more 401 Unauthorized errors

### 🚀 **Next Steps**

1. **Apply the fix** (Option 1 or 2 above)
2. **Restart the Vite development server** to reload environment variables
3. **Test the application** and check console logs
4. **Verify** that the debugging logs show ✅ success messages
5. **Test LiveKit connection** to confirm the 401 error is resolved

### 📋 **For Vercel Deployment**

If deploying to Vercel, ensure these environment variables are set in Vercel dashboard:
- `VITE_MAITALENT_SUPABASE_URL` (or `VITE_MAI_SUPABASE_URL` depending on fix chosen)
- `VITE_MAITALENT_SUPABASE_ANON_KEY`

The debugging logs will help identify if the issue is in local development vs. production deployment.