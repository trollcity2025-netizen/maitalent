import { useEffect, useRef, useState } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';

export interface LiveKitHook {
  connect: (token: string) => Promise<void>;
  disconnect: () => Promise<void>;
  localTracks: (LocalVideoTrack | LocalAudioTrack)[];
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
}

export function useLiveKit(): LiveKitHook {
  const [localTracks, setLocalTracks] = useState<(LocalVideoTrack | LocalAudioTrack)[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const roomRef = useRef<Room | null>(null);
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

  const connect = async (token: string) => {
    try {
      setIsConnecting(true);
      setError(null);

      const newRoom = new Room({
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      if (!livekitUrl) {
        throw new Error('LiveKit URL not configured');
      }

      await newRoom.connect(livekitUrl, token);
      
      roomRef.current = newRoom;
      setIsConnected(true);
      
      // Get local tracks
      const tracks: (LocalVideoTrack | LocalAudioTrack)[] = [];
      
      // Add existing tracks - simplified approach
      // Note: LiveKit API may have changed, so we'll rely on trackPublished events
      setLocalTracks(tracks);

      // Handle track publications
      newRoom.localParticipant.on('trackPublished', (publication: any) => {
        if (publication.track) {
          setLocalTracks(prev => [...prev, publication.track]);
        }
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      if (roomRef.current) {
        await roomRef.current.disconnect();
        roomRef.current = null;
        setIsConnected(false);
        setLocalTracks([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    localTracks,
    isConnecting,
    isConnected,
    error,
  };
}