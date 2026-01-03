# LiveKit Token Edge Function - Supabase Deployment Guide

This guide walks you through deploying the `livekit-token` edge function to Supabase Edge Functions.

## 📁 Files Created

### Core Function
- `api/livekit-token.ts` - The edge function that generates LiveKit JWT tokens (Supabase-compatible)
- `supabase/functions/package.json` - Dependencies for the Supabase function

### Configuration
- `supabase/config.toml` - Supabase project configuration
- `supabase/supabase.toml` - Supabase project settings with API keys

### Scripts
- `deploy-supabase-function.sh` - Automated deployment script for Supabase
- `test-livekit-token.js` - Updated test script for Supabase deployment

## 🚀 Deployment Steps

### 1. Environment Setup

Ensure you have the following installed:
- Node.js (v18 or higher)
- Supabase CLI: `npm install -g @supabase/supabase-cli`
- Git
- Deno extension for VS Code (recommended)

### 2. VS Code Configuration

Install the **Deno** extension by denoland (official) and the project includes:
- `.vscode/settings.json` - Configures Deno for the functions directory
- `supabase/functions/deno.json` - Deno TypeScript compiler options
- `supabase/functions/tsconfig.json` - TypeScript configuration for functions directory
- `supabase/functions/import_map.json` - Import map for cleaner imports

This setup eliminates TypeScript errors and provides proper intellisense for Deno code.

### 2. Configure Supabase Project

1. **Login to Supabase CLI:**
   ```bash
   supabase login
   ```

2. **Link to your project:**
   ```bash
   supabase link --project-ref toguqsixflnbitxxbngi
   ```

### 3. Install Deno Extension (Required)

Install the **Deno** extension by denoland (official) from the VS Code marketplace. This is required for proper TypeScript support and intellisense in the functions directory.

### 3. Set Environment Variables

Set the LiveKit credentials in your Supabase project:
```bash
supabase functions secrets set LIVEKIT_API_KEY=your_livekit_api_key
supabase functions secrets set LIVEKIT_API_SECRET=your_livekit_api_secret
```

### 4. Deploy to Supabase

#### Option A: Using the deployment script
```bash
chmod +x deploy-supabase-function.sh
./deploy-supabase-function.sh
```

#### Option B: Manual deployment
```bash
supabase functions deploy livekit-token
```

### 5. Verify Deployment

After deployment, your function will be available at:
```
https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token
```

## 🧪 Testing the Function

### Using the test script:
```bash
node test-livekit-token.js
```

### Manual testing with curl:
```bash
# Test successful token generation
curl -X POST https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomType": "audition",
    "userId": "test-user-123",
    "userName": "Test User"
  }'

# Test error case
curl -X POST https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 🔧 Function Configuration

### Supported Room Types
- `audition` → `audition-room`
- `main_show` → `main-show`

### Token Settings
- **TTL**: 2 hours
- **Permissions**: Room join, publish, subscribe, data publish

### CORS
The function includes CORS headers to allow cross-origin requests from any domain.

## 🔧 Deno Configuration

### Required Files

The project includes proper Deno configuration:

- **`supabase/functions/deno.json`** - TypeScript compiler options for Deno
- **`supabase/functions/import_map.json`** - Import map for cleaner module imports
- **`.vscode/settings.json`** - VS Code Deno extension configuration
- **`tsconfig.json`** - Updated to exclude `supabase/functions` directory

### Import Map Usage

The function uses clean imports via the import map:
```typescript
import { serve } from "std/http/server.ts";
import { AccessToken } from "livekit-server-sdk";
```

This eliminates "Cannot find module" errors and provides better editor support.

## 📊 API Reference

### Request
```
POST /functions/v1/livekit-token
Content-Type: application/json

{
  "roomType": "audition|main_show",
  "userId": "string",
  "userName": "string"
}
```

### Success Response (200)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "roomName": "audition-room",
  "expiresAt": "2024-01-03T02:14:00.000Z"
}
```

### Error Responses
- **400**: Missing or invalid parameters
- **500**: Server error (usually missing environment variables)

## 🔒 Security Notes

1. **Environment Variables**: Never commit LiveKit credentials to your repository
2. **Token Expiry**: Tokens expire after 2 hours for security
3. **CORS**: Function allows requests from any origin - adjust if needed for your use case

## 🐛 Troubleshooting

### Common Issues

1. **"LiveKit credentials not configured"**
   - Check that `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set in Supabase secrets
   - Verify the secrets are deployed: `supabase functions secrets list`

2. **"Invalid roomType"**
   - Ensure `roomType` is either `"audition"` or `"main_show"`
   - Check for typos in the room type string

3. **Function deployment fails**
   - Ensure you're linked to the correct project: `supabase link --project-ref toguqsixflnbitxxbngi`
   - Check that the function path is correct in `supabase/config.toml`
   - Verify dependencies in `supabase/functions/package.json`

4. **TypeScript errors in editor**
   - Install the Deno extension for VS Code
   - Ensure `.vscode/settings.json` is properly configured
   - Check that `supabase/functions/deno.json` and `import_map.json` exist

5. **Function not found**
   - Verify the deployment was successful: `supabase functions list`
   - Check that the function name matches in `supabase/config.toml`

### Getting Help

- Check Supabase deployment logs: `supabase functions logs livekit-token`
- Test the function locally: `supabase functions serve livekit-token`
- Review the function code in `api/livekit-token.ts`

## 🔄 Updating the Function

To make changes to the edge function:

1. Edit `api/livekit-token.ts`
2. Deploy the updated function: `supabase functions deploy livekit-token`
3. The function will be updated immediately

## 📝 Supabase Project Details

- **Project ID**: toguqsixflnbitxxbngi
- **Function URL**: https://toguqsixflnbitxxbngi.supabase.co/functions/v1/livekit-token
- **Runtime**: Bun
- **Function Path**: `api/livekit-token.ts`

## 🎯 Next Steps

1. **Set up your frontend** to call the Supabase function
2. **Configure your LiveKit client** to use the generated tokens
3. **Monitor function usage** in your Supabase dashboard
4. **Set up alerts** for function errors or high usage