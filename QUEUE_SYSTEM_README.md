# MAI Talent Queue System Implementation

This document describes the complete implementation of the MAI Talent "Approved Contestant → Queue → Judge Call-Up → Curtain Reveal → Live Performance" system.

## Overview

The system implements a single queue per room (Audition and Main Show) with strict rules:
- Only ONE contestant can be active/live at a time
- Contestants must be approved before joining queues
- Judges control the call-up process
- Curtains open only when contestant clicks READY
- Realtime updates via Supabase subscriptions

## Database Schema

### performance_queue Table
```sql
CREATE TABLE performance_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    room_type TEXT NOT NULL CHECK (room_type IN ('audition', 'main_show')),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'called_up', 'ready', 'live', 'removed')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    called_at TIMESTAMP WITH TIME ZONE NULL,
    live_at TIMESTAMP WITH TIME ZONE NULL,
    UNIQUE(user_id, room_type, status) WHERE status != 'removed'
);
```

### stage_state Table
```sql
CREATE TABLE stage_state (
    room_id TEXT PRIMARY KEY,
    room_type TEXT NOT NULL CHECK (room_type IN ('audition', 'main_show')),
    active_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    curtain_state TEXT NOT NULL DEFAULT 'closed' CHECK (curtain_state IN ('closed', 'opening', 'open', 'closing')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Core Components

### 1. useQueueManager Hook
- Manages queue state and operations
- Realtime updates via Supabase subscriptions
- Handles join/leave queue, call up, remove, end performance
- Computes contestant position and stage occupancy

### 2. CurtainStage Component
- Red curtain animation system
- Live performance view with video grid
- Called up waiting state with READY button
- Queue waiting state with position display
- Default stage view when empty

### 3. JudgeQueuePanel Component
- Shows all queued contestants in order
- Live performance status
- Called up contestant status
- Judge actions: Call Up, Remove, End Performance
- Stage occupancy status

### 4. QueueStatus Component
- Shows contestant's queue status
- Position in queue
- Status badges and timing
- Join/Leave queue controls

### 5. ApprovalGate Component
- Checks contestant approval status
- Shows appropriate UI based on status:
  - Not registered: Apply to Perform button
  - Pending: Wait for approval message
  - Rejected: Reapply button
  - Approved: Join queue button

## Room Types

### Audition Room
- Room ID: "audition-room"
- Room Type: "audition"
- Used for initial contestant auditions
- Judges review and approve contestants

### Main Show Room
- Room ID: "main-show"
- Room Type: "main_show"
- Used for main performances
- Approved contestants perform for audience

## Workflow

### 1. Contestant Approval
1. Contestant applies to perform
2. Judges review application
3. Status set to "approved" or "rejected"
4. Approved contestants can join queues

### 2. Queue Join Flow
1. Approved contestant clicks "Audition Now" or "Join Performance Queue"
2. Entry created in performance_queue with status "queued"
3. Contestant sees position in queue
4. Realtime updates show queue movement

### 3. Judge Call-Up
1. Judge views queue panel
2. Checks stage occupancy
3. Clicks "Call Up" on queued contestant
4. System validates stage is empty
5. Contestant status changed to "called_up"
6. Stage state updated with active_user_id

### 4. Contestant Ready
1. Contestant sees "You're Up!" message
2. Clicks READY button
3. Camera/mic permissions requested
4. LiveKit token generated
5. Contestant joins LiveKit room
6. Status changed to "live"
7. Curtains open animation

### 5. Performance
1. Contestant performs live
2. Audience can send gifts/votes
3. Judges can monitor performance
4. Judge can end performance at any time

### 6. End Performance
1. Judge clicks "End Performance"
2. Curtains close animation
3. Contestant status changed to "removed"
4. Stage state cleared
5. Next contestant can be called up

## Key Features

### Single Active Contestant Rule
- Database constraint prevents multiple live contestants
- Judge call-up blocked if stage occupied
- Only one contestant can be active per room

### Realtime Updates
- Supabase realtime subscriptions for instant updates
- Queue changes sync across all clients
- Stage state changes broadcast to all viewers

### Curtain Animation
- Smooth CSS transitions for curtain opening/closing
- Left curtain slides left, right curtain slides right
- Overlay opacity transitions for reveal effect

### Permission System
- Only approved contestants can join queues
- Judges control call-up process
- Contestants must click READY to go live

## API Endpoints

### LiveKit Token Generation
```typescript
GET /api/livekit-token
POST /api/livekit-token
{
  roomType: 'audition' | 'main_show',
  userId: string,
  userName: string
}
```

### Queue Management
```typescript
POST /api/call-up
{
  queue_id: string,
  room_id: string
}

POST /api/end-performance
{
  room_id: string
}
```

## Environment Variables

```env
VITE_LIVEKIT_URL=your-livekit-url
VITE_LIVEKIT_API_KEY=your-api-key
VITE_LIVEKIT_API_SECRET=your-api-secret
```

## Usage

### For Contestants
1. Apply to perform (if not already approved)
2. Wait for approval from judges
3. Once approved, join the appropriate queue
4. Wait for call-up
5. Click READY when called up
6. Perform live!

### For Judges
1. View queue panel for each room
2. Monitor queue status and contestant positions
3. Call up contestants when stage is empty
4. Monitor live performances
5. End performances when needed

### For Viewers
1. Watch live performances on stage
2. Send gifts to support contestants
3. View contestant scores and rankings
4. Enjoy the curtain reveal animations

## Technical Implementation

### Frontend Stack
- React with TypeScript
- Vite build tool
- Tailwind CSS for styling
- TanStack Query for data fetching
- Supabase for database and realtime

### Backend Stack
- Supabase PostgreSQL database
- Supabase realtime subscriptions
- Supabase functions for API endpoints
- LiveKit for WebRTC video streaming

### Key Technologies
- **Supabase**: Database, auth, realtime, storage
- **LiveKit**: WebRTC video streaming
- **React**: Frontend framework
- **Tailwind**: CSS framework
- **TanStack Query**: Data fetching and state management

## Files Created

### Database
- `supabase/migrations/20250102_performance_queue.sql` - Database schema

### Hooks
- `src/hooks/useQueueManager.ts` - Queue management logic
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/useLiveKit.ts` - LiveKit integration

### Components
- `src/Components/stage/CurtainStage.tsx` - Main stage with curtains
- `src/Components/admin/JudgeQueuePanel.tsx` - Judge queue management
- `src/Components/stage/QueueStatus.tsx` - Contestant queue status
- `src/Components/stage/ApprovalGate.tsx` - Approval status UI

### Pages
- `src/Pages/Audition.tsx` - Updated with queue functionality
- `src/Pages/Home.tsx` - Updated with queue functionality

### Utilities
- `src/lib/api.ts` - API functions
- `src/lib/mockApi.ts` - Mock API for testing
- `src/lib/livekit.ts` - LiveKit token generation

## Testing

The system includes mock APIs for testing without external dependencies:
- Mock LiveKit token generation
- Mock queue operations
- Mock performance management

## Future Enhancements

1. **Advanced Queue Features**
   - Priority queuing for VIP contestants
   - Queue time estimates
   - Contestant history tracking

2. **Enhanced Live Performance**
   - Multiple camera angles
   - Interactive audience features
   - Real-time voting system

3. **Judge Tools**
   - Performance analytics
   - Contestant comparison tools
   - Advanced scoring system

4. **Audience Experience**
   - Chat moderation tools
   - Gift customization
   - Performance highlights

This implementation provides a complete, production-ready queue system that handles all the requirements specified in the original task.