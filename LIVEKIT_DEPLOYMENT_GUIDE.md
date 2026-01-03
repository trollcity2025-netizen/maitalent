# LiveKit Token Edge Function Deployment Guide

This guide walks you through deploying the `livekit-token` edge function to Vercel.

## 📁 Files Created

### Core Function
- `api/livekit-token.ts` - The edge function that generates LiveKit JWT tokens
- `api/package.json` - Dependencies for the edge function
- `api/.gitignore` - Git ignore rules for the API directory

### Configuration
- `vercel.json` - Updated to configure the edge function

### Documentation & Scripts
- `api/README.md` - Detailed documentation for the edge function
- `deploy-edge-function.sh` - Automated deployment script
- `test-livekit-token.js` - Test script for the deployed function

## 🚀 Deployment Steps

### 1. Environment Setup

Ensure you have the following installed:
- Node.js (v18 or higher)
- Vercel CLI: `npm install -g vercel`
- Git

### 2. Configure Environment Variables

Before deploying, you need LiveKit credentials:

1. **Get LiveKit credentials** from your LiveKit dashboard
2. **Set environment variables** in your Vercel project:
   ```bash
   vercel env add LIVEKIT_API_KEY production
   vercel env add LIVEKIT_API_SECRET production
   ```

### 3. Deploy to Vercel

#### Option A: Using the deployment script
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

#### Option B: Manual deployment
```bash
vercel --prod
```

### 4. Verify Deployment

After deployment, your function will be available at:
```
https://your-project.vercel.app/api/livekit-token
```

## 🧪 Testing the Function

### Using the test script:
1. Update `test-livekit-token.js` with your deployed URL
2. Run: `node test-livekit-token.js`

### Manual testing with curl:
```bash
# Test successful token generation
curl -X POST https://your-project.vercel.app/api/livekit-token \
  -H "Content-Type: application/json" \
  -d '{
    "roomType": "audition",
    "userId": "test-user-123",
    "userName": "Test User"
  }'

# Test error case
curl -X POST https://your-project.vercel.app/api/livekit-token \
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

## 📊 API Reference

### Request
```
POST /api/livekit-token
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
   - Check that `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are set in Vercel environment variables
   - Verify the variables are deployed to the correct environment (production/staging)

2. **"Invalid roomType"**
   - Ensure `roomType` is either `"audition"` or `"main_show"`
   - Check for typos in the room type string

3. **CORS errors**
   - The function includes CORS headers, but check your frontend configuration
   - Ensure you're making POST requests with proper Content-Type header

4. **Function not found**
   - Verify the deployment was successful
   - Check that `vercel.json` is properly configured
   - Ensure the `api/` directory is in your project root

### Getting Help

- Check Vercel deployment logs: `vercel logs`
- Test the function locally: `vercel dev`
- Review the function code in `api/livekit-token.ts`

## 🔄 Updating the Function

To make changes to the edge function:

1. Edit `api/livekit-token.ts`
2. Commit and push changes to your repository
3. Vercel will automatically deploy the updated function

The function will be redeployed automatically when you push to your connected Git repository.