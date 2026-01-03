import express from 'express';
import { AccessToken } from 'livekit-server-sdk';

const router = express.Router();

// CORS headers for development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Handle preflight requests
router.options('/', (req: any, res: any) => {
  res.status(200).set(corsHeaders).send('ok');
});

// LiveKit token endpoint
router.post('/', async (req: any, res: any) => {
  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).set(corsHeaders).json({
        error: 'Missing authorization header'
      });
    }

    // Parse request body
    const { roomType, userId, userName } = req.body;

    // Validate required parameters
    if (!roomType || !userId || !userName) {
      return res.status(400).set(corsHeaders).json({
        error: 'Missing required parameters: roomType, userId, userName'
      });
    }

    // Validate room type
    const validRoomTypes = ['audition', 'main_show'];
    if (!validRoomTypes.includes(roomType)) {
      return res.status(400).set(corsHeaders).json({
        error: `Invalid roomType: ${roomType}. Must be one of: ${validRoomTypes.join(', ')}`
      });
    }

    // Get LiveKit credentials from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).set(corsHeaders).json({
        error: 'LiveKit credentials not configured on server'
      });
    }

    // Map room type to actual room name
    const roomName = getRoomName(roomType);

    // Create LiveKit token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: userName,
      ttl: '2h'
    });

    at.addGrant({ 
      room: roomName, 
      roomJoin: true, 
      canPublish: true, 
      canSubscribe: true, 
      canPublishData: true 
    });

    const token = at.toJwt();

    // Return success response
    return res.set(corsHeaders).json({
      success: true,
      token,
      roomName,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
    });

  } catch (error) {
    console.error('LiveKit token generation error:', error);
    
    return res.status(500).set(corsHeaders).json({
      error: 'Failed to generate LiveKit token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Map room type to actual room name
 * @param {string} roomType - The type of room (audition or main_show)
 * @returns {string} The actual room name
 */
function getRoomName(roomType: string) {
  switch (roomType) {
    case 'audition':
      return 'audition-room';
    case 'main_show':
      return 'main-show';
    default:
      throw new Error(`Invalid roomType: ${roomType}. Must be 'audition' or 'main_show'`);
  }
}

// Export CORS headers for use in other parts of the application
export { corsHeaders };

export default router;
