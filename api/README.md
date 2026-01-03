# LiveKit Token Edge Function

This edge function generates JWT tokens for LiveKit rooms, allowing users to join video sessions securely.

## Deployment

This function is configured as an edge function for Vercel deployment.

### Prerequisites

1. **LiveKit Credentials**: Set the following environment variables in your Vercel project:
   - `LIVEKIT_API_KEY`: Your LiveKit API key
   - `LIVEKIT_API_SECRET`: Your LiveKit API secret

### Deployment Steps

1. **Push to Vercel**: The function will be automatically deployed when you push to your connected Git repository.

2. **Environment Variables**: In your Vercel dashboard:
   - Go to your project settings
   - Navigate to Environment Variables
   - Add `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`

3. **Verify Deployment**: After deployment, the function will be available at:
   ```
   https://your-project.vercel.app/api/livekit-token
   ```

## API Usage

### Request

**POST** `/api/livekit-token`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "roomType": "audition",     // or "main_show"
  "userId": "user-123",       // Unique user identifier
  "userName": "John Doe"      // User's display name
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "roomName": "audition-room",
  "expiresAt": "2024-01-03T02:13:45.355Z"
}
```

**Error (400/500):**
```json
{
  "error": "Missing required parameters: roomType, userId, userName"
}
```

## Room Types

- `audition`: Maps to `audition-room`
- `main_show`: Maps to `main-show`

## Token Configuration

- **TTL**: 2 hours
- **Permissions**: 
  - Room join
  - Publish audio/video
  - Subscribe to streams
  - Publish data

## CORS

The function includes CORS headers to allow cross-origin requests from any domain.