import { AccessToken } from 'livekit-server-sdk';

export async function createLiveKitToken(roomName, userId, userName) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    throw new Error('LiveKit environment variables not configured');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
    ttl: '2h'
  });

  const grant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  };

  at.addGrant(grant);

  return at.toJwt();
}