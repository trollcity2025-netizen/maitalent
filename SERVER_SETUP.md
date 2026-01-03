# Supabase Backend Server Setup

This document provides instructions for setting up and configuring the Supabase backend server for the Mai Talent application.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Supabase project with API credentials

## Installation

1. Install server dependencies:
```bash
npm install
```

2. Copy the environment variables template:
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=your_livekit_server_url_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
```

## Environment Variables

### Required Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for server-side operations)
- `PORT`: Server port (default: 3000)

### Optional Variables

- `CORS_ORIGIN`: Allowed origin for CORS requests (default: http://localhost:5173)
- `LIVEKIT_API_KEY`: LiveKit API key for video streaming
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `LIVEKIT_URL`: LiveKit server URL
- `PAYPAL_CLIENT_ID`: PayPal client ID for payments
- `PAYPAL_CLIENT_SECRET`: PayPal client secret

## API Endpoints

### Authentication Required Endpoints

All endpoints marked with `authenticateSupabaseUser` middleware require a valid Supabase JWT token in the Authorization header.

#### User Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

#### Contestant Management
- `GET /api/contestants` - Get all contestants
- `POST /api/contestants` - Create new contestant

#### Queue Management
- `GET /api/queue` - Get performance queue
- `POST /api/queue/move` - Move contestant in queue

#### LiveKit Integration
- `POST /api/livekit-token` - Generate LiveKit token

### Admin Endpoints

Admin endpoints require both authentication and admin role verification.

#### Admin Contestants
- `GET /api/admin/contestants` - Get all contestants with user details

#### Admin Queue Management
- `POST /api/admin/queue/call-up` - Call up contestant for performance
- `POST /api/admin/queue/end-performance` - End current performance

### Public Endpoints

No authentication required.

#### Public Data
- `GET /api/public/leaderboard` - Get top 10 contestants by score
- `GET /api/public/show-state` - Get current show state

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Security Notes

1. **Service Role Key**: The `SUPABASE_SERVICE_KEY` provides full database access. Keep it secure and never expose it to the client-side.

2. **Authentication**: All sensitive endpoints require proper authentication using Supabase JWT tokens.

3. **Admin Access**: Admin endpoints require both authentication and role verification.

4. **CORS**: Configure `CORS_ORIGIN` to restrict which domains can access your API.

## Database Schema

The server expects the following tables to exist in your Supabase database:

- `users` - User accounts
- `contestants` - Contestant profiles
- `performance_queue` - Performance queue management
- `show_states` - Current show state
- `judges` - Judge profiles
- `messages` - Messages system
- `coin_packages` - Coin packages for purchase
- `chat_messages` - Live chat messages
- `championships` - Championship data
- `gifts` - Gift system

## Error Handling

The server includes comprehensive error handling with:
- Request logging
- Structured error responses
- Development vs production error messages
- Authentication error handling

## Monitoring

The server logs all requests with timestamps for monitoring and debugging purposes.

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure all required environment variables are set
2. **Supabase Connection**: Verify your Supabase URL and service key are correct
3. **CORS Errors**: Check your CORS_ORIGIN configuration
4. **Authentication Errors**: Ensure valid JWT tokens are being sent

### Logs

Server logs are output to the console with timestamps for debugging.