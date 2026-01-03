# LiveKit Client Parameter Fix

## Changes Made

### 1. Client-Side Updates

**API Client (`src/lib/api.ts`):**
- ✅ Changed `roomType` to `roomName` in function call
- ✅ Added `canPublish: true` parameter
- ✅ Added `canSubscribe: true` parameter

**React Hook (`src/hooks/useLiveKitRoom.ts`):**
- ✅ Changed `roomType` to `roomName` in function call
- ✅ Added `canPublish: true` parameter
- ✅ Added `canSubscribe: true` parameter

### 2. Server-Side Updates

**Function (`supabase/functions/livekit-token/index.ts`):**
- ✅ Changed parameter destructuring from `roomType` to `roomName`
- ✅ Updated error message from "roomType is required" to "roomName is required"
- ✅ Updated function call from `getRoomName(roomType)` to `getRoomName(roomName)`
- ✅ Added support for `canPublish` and `canSubscribe` parameters (though not used in grant)

## Parameter Mapping

### Before:
```typescript
// Client sends:
{
  roomType: "audition" | "main_show"
}

// Function expects:
const { roomType } = await req.json();
```

### After:
```typescript
// Client sends:
{
  roomName: "audition" | "main_show",
  canPublish: true,
  canSubscribe: true
}

// Function expects:
const { roomName, canPublish, canSubscribe } = await req.json();
```

## Benefits

1. **Clearer Parameter Names**: `roomName` is more descriptive than `roomType`
2. **Future Extensibility**: Added `canPublish` and `canSubscribe` parameters for future permission control
3. **Consistency**: Parameter names now match the actual usage in the function

## Next Steps

1. **Deploy the Updated Function:**
   ```bash
   ./deploy-livekit-function.sh
   ```

2. **Test the Integration:**
   - Verify that the function accepts the new parameter names
   - Check that the room mapping still works correctly
   - Confirm that the token generation is successful

## Files Modified

- ✅ `src/lib/api.ts` - Updated client parameter names
- ✅ `src/hooks/useLiveKitRoom.ts` - Updated client parameter names  
- ✅ `supabase/functions/livekit-token/index.ts` - Updated server parameter handling

The LiveKit token function now properly handles the updated client parameters with clearer naming and future extensibility.