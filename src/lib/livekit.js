import { AccessToken } from 'livekit-server-sdk';

/**
 * Generate a LiveKit JWT token for a user to join a room
 * @param {string} roomName - The name of the LiveKit room
 * @param {string} userId - The user's unique identifier
 * @param {string} userName - The user's display name
 * @returns {Promise<string>} A JWT token string
 */
export async function createLiveKitToken(roomName, userId, userName) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit environment variables missing: LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set');
  }

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
  
  return at.toJwt();
}

/**
 * Map room type to actual room name
 * @param {string} roomType - The type of room (audition or main_show)
 * @returns {string} The actual room name
 */
export function getRoomName(roomType) {
  switch (roomType) {
    case 'audition':
      return 'audition-room';
    case 'main_show':
      return 'main-show';
    default:
      throw new Error(`Invalid roomType: ${roomType}. Must be 'audition' or 'main_show'`);
  }
}