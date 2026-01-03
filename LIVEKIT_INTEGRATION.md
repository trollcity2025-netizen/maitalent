# LiveKit Integration

This document describes the LiveKit integration for the Mai Talent application, including the Supabase Edge Function that generates LiveKit tokens for real-time video communication.

## Overview

The LiveKit integration enables real-time video communication for:
- **Audition Room**: Where contestants perform and judges evaluate
- **Main Show Room**: Where selected contestants perform for the audience

## Architecture

### Supabase Edge Function: `livekit-token`

**Location**: `supabase/functions/livekit-token/index.ts`

**Purpose**: Generates authenticated LiveKit tokens for users to join video rooms.

**Authentication**: 
- Requires valid Supabase JWT token in Authorization header
- Validates user authentication before generating LiveKit tokens

**Input**: 
```json
{
  "roomType": "audition" | "main_show"
}
```

**Output**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "livekitUrl": "wss://your-livekit-server.com"
}
```

### Frontend Integration

**API Client**: `src/lib/api.ts`
- `getLiveKitToken(roomType, userName)`: Fetches token from Supabase function

**React Hook**: `src/hooks/useLiveKitRoom.ts`
- Manages LiveKit room connections
- Handles judge seat assignments
- Provides camera/microphone controls

## Environment Variables

The following environment variables must be set in your Supabase project:

```bash
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
LIVEKIT_URL=wss://your-livekit-server.com

# Supabase Configuration (automatically set)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

### 1. Deploy the Edge Function

```bash
# Using the deployment script
./deploy-livekit-function.sh

# Or manually
supabase functions deploy livekit-token --project-ref your-project-ref
```

### 2. Set Environment Variables

```bash
# Set LiveKit credentials
supabase functions secrets set LIVEKIT_API_KEY=your_api_key
supabase functions secrets set LIVEKIT_API_SECRET=your_api_secret
supabase functions secrets set LIVEKIT_URL=your_livekit_url
```

### 3. Configure CORS

The function includes CORS headers for cross-origin requests. Ensure your frontend domain is allowed in Supabase settings.

## Usage

### Getting a Token

```typescript
import { getLiveKitToken } from '../lib/api';

try {
  const token = await getLiveKitToken('audition', 'Judge Name');
  // Use token to connect to LiveKit room
} catch (error) {
  console.error('Failed to get LiveKit token:', error);
}
```

### Connecting to a Room

```typescript
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';

function JudgePanel() {
  const { connect, disconnect, judges, localJudge, isConnected } = useLiveKitRoom();

  const handleConnect = async () => {
    await connect('audition');
  };

  const handleJoinSeat = async (seatIndex: number) => {
    await joinJudgeSeat(seatIndex);
  };

  // Component render logic...
}
```

## Security

### Authentication Flow
1. User authenticates with Supabase
2. Frontend calls `livekit-token` function with Supabase JWT
3. Function validates JWT and extracts user information
4. Function generates LiveKit token with user identity
5. Frontend uses LiveKit token to connect to video room

### Token Security
- LiveKit tokens are short-lived (1 hour TTL)
- Tokens include user identity and permissions
- Room access is controlled by room name mapping
- Only authenticated users can generate tokens

## Room Types

### Audition Room
- **Room Name**: `audition-room`
- **Purpose**: Contestant auditions and judge evaluations
- **Permissions**: Judges can publish video/audio, contestants can join

### Main Show Room
- **Room Name**: `main-show`
- **Purpose**: Selected contestants perform for audience
- **Permissions**: Full video/audio capabilities for performers and judges

## Error Handling

The function returns appropriate HTTP status codes and error messages:

- `401`: Missing or invalid authentication
- `400`: Missing required parameters
- `500`: Server errors or missing configuration

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Ensure user is logged in and JWT is valid
2. **500 Server Error**: Check that LiveKit environment variables are set
3. **Connection Failed**: Verify LiveKit server URL and credentials

### Debugging

Enable debug logging in your frontend to see token generation and connection attempts:

```typescript
console.log('LiveKit token response:', data);
console.log('Connecting to room:', actualRoomName);
```

## Dependencies

### Server Dependencies
- `@supabase/supabase-js`: Supabase client for authentication
- `livekit-server-sdk`: LiveKit server SDK for token generation
- `std/http`: Deno HTTP server

### Client Dependencies
- `livekit-client`: LiveKit client SDK
- `@supabase/supabase-js`: Supabase client for function calls

## Maintenance

### Monitoring
- Monitor function execution logs in Supabase dashboard
- Track token generation success/failure rates
- Monitor LiveKit connection metrics

### Updates
- Keep LiveKit SDK updated for security and features
- Monitor Supabase function runtime updates
- Test token generation regularly

## Support

For issues with this integration:
1. Check the Supabase function logs
2. Verify LiveKit server status
3. Ensure all environment variables are correctly set
4. Test with the deployment script