import { useEffect, useState, useRef } from 'react';
import { Room, LocalVideoTrack, LocalAudioTrack } from 'livekit-client';
import { supabase } from '../lib/supabaseClient';

export interface JudgeParticipant {
  id: string;
  identity: string;
  name: string;
  isSpeaking: boolean;
  isLocal: boolean;
  videoTrack?: LocalVideoTrack | any;
  audioTrack?: LocalAudioTrack | any;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
}

export interface LiveKitRoomHook {
  room: Room | null;
  judges: JudgeParticipant[];
  localJudge: JudgeParticipant | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: (roomType: 'audition' | 'main_show') => Promise<void | null>;
  disconnect: () => Promise<void>;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  leaveRoom: () => Promise<void>;
  joinJudgeSeat: (seatIndex: number) => Promise<void>;
  leaveJudgeSeat: () => Promise<void>;
  getJudgeSeats: () => JudgeSeat[];
}

export interface JudgeSeat {
  index: number;
  isTaken: boolean;
  participantId: string | null;
  participantName: string | null;
  isCurrentUser: boolean;
}

export function useLiveKitRoom(): LiveKitRoomHook {
  const [room, setRoom] = useState<Room | null>(null);
  const [judges, setJudges] = useState<JudgeParticipant[]>([]);
  const [localJudge, setLocalJudge] = useState<JudgeParticipant | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const roomRef = useRef<Room | null>(null);

  const connect = async (roomType: 'audition' | 'main_show') => {
    try {
      setIsConnecting(true);
      setError(null);

      // Force session check before invoking function
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("=== LIVEKIT TOKEN FETCH DEBUG ===");
      console.log("session exists:", !!sessionData.session);
      console.log("access token start:", sessionData.session?.access_token?.slice(0, 15));
      console.log("user id:", sessionData.session?.user?.id);
      console.log("roomType:", roomType);
      
      if (!sessionData.session?.access_token) {
        console.warn("Skipping LiveKit token fetch (not logged in)");
        return;
      }

      // Get token from backend using Supabase functions.invoke
      const { data, error } = await supabase.functions.invoke("livekit-token", {
        body: {
          roomName: roomType,
          canPublish: true,
          canSubscribe: true,
        }
      });

      if (error) {
        console.error('LiveKit token fetch failed:', error);
        throw new Error(`Failed to get LiveKit token: ${error.message}`);
      }

      if (!data) {
        throw new Error('Invalid response from LiveKit token function - no data');
      }

      // Debug: Log the exact response structure
      console.log('LiveKit token function response:', JSON.stringify(data, null, 2));

      // Use environment variable for LiveKit URL
      const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;

      if (!livekitUrl) {
        console.error("❌ Missing VITE_LIVEKIT_URL in env");
        throw new Error("LiveKit URL not configured");
      }

      if (!data?.token || typeof data.token !== "string") {
        console.log("RAW TOKEN RESPONSE:", data);
        console.error("Bad token response:", data);
        throw new Error("Invalid response format from LiveKit token function");
      }

      // Debug logging to check token format
      console.log("livekitUrl", livekitUrl);
      console.log("tokenStart", data.token?.slice(0, 25));

      const newRoom = new Room({
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      await newRoom.connect(livekitUrl, data.token);
      
      roomRef.current = newRoom;
      setRoom(newRoom);
      setIsConnected(true);
      
      // Set up event listeners
      setupRoomEvents(newRoom);

      // Get local participant
      const localParticipant = newRoom.localParticipant;
      setLocalJudge({
        id: localParticipant.sid,
        identity: localParticipant.identity,
        name: localParticipant.name || 'Local Judge',
        isSpeaking: false,
        isLocal: true,
        isCameraEnabled: localParticipant.isCameraEnabled,
        isMicrophoneEnabled: localParticipant.isMicrophoneEnabled,
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
        setRoom(null);
        setIsConnected(false);
        setJudges([]);
        setLocalJudge(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current || !localJudge) return;
    
    try {
      if (roomRef.current.localParticipant.isCameraEnabled) {
        await roomRef.current.localParticipant.setCameraEnabled(false);
      } else {
        await roomRef.current.localParticipant.setCameraEnabled(true);
      }
      
      setLocalJudge(prev => prev ? {
        ...prev,
        isCameraEnabled: !prev.isCameraEnabled
      } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleMicrophone = async () => {
    if (!roomRef.current || !localJudge) return;
    
    try {
      if (roomRef.current.localParticipant.isMicrophoneEnabled) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      }
      
      setLocalJudge(prev => prev ? {
        ...prev,
        isMicrophoneEnabled: !prev.isMicrophoneEnabled
      } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const leaveRoom = async () => {
    await disconnect();
  };

  const joinJudgeSeat = async (seatIndex: number) => {
    try {
      if (!roomRef.current) {
        throw new Error('Room not connected');
      }

      const localParticipant = roomRef.current.localParticipant;
      
      // Check if seat is already taken
      const currentSeats = getJudgeSeats();
      const seat = currentSeats[seatIndex];
      
      if (seat.isTaken && !seat.isCurrentUser) {
        throw new Error(`Seat ${seatIndex} is already taken`);
      }

      // Request permissions
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

      // Set seat attribute
      await localParticipant.setAttributes({
        judgeSeat: seatIndex.toString(),
        role: 'judge'
      });

      // Enable tracks for judges
      await localParticipant.setMicrophoneEnabled(true);
      await localParticipant.setCameraEnabled(true);

      console.log(`Joined judge seat ${seatIndex} as ${localParticipant.identity}`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const leaveJudgeSeat = async () => {
    try {
      if (!roomRef.current) {
        throw new Error('Room not connected');
      }

      const localParticipant = roomRef.current.localParticipant;
      
      // Clear seat attribute
      await localParticipant.setAttributes({
        judgeSeat: '',
        role: 'spectator'
      });

      // Unpublish tracks
      await localParticipant.setMicrophoneEnabled(false);
      await localParticipant.setCameraEnabled(false);

      console.log(`Left judge seat as ${localParticipant.identity}`);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getJudgeSeats = (): JudgeSeat[] => {
    const seats: JudgeSeat[] = [];
    
    if (!roomRef.current) {
      // Return empty seats if not connected
      for (let i = 0; i < 4; i++) {
        seats.push({
          index: i,
          isTaken: false,
          participantId: null,
          participantName: null,
          isCurrentUser: false
        });
      }
      return seats;
    }

    // Get all participants with seat assignments
    const participants = [roomRef.current.localParticipant, ...roomRef.current.remoteParticipants.values()];
    const seatAssignments = new Map<string, { id: string; name: string }>();

    participants.forEach(participant => {
      const seat = participant.attributes?.judgeSeat;
      if (seat !== undefined && seat !== '') {
        seatAssignments.set(seat, {
          id: participant.sid,
          name: participant.name || participant.identity
        });
      }
    });

    // Build seat status
    for (let i = 0; i < 4; i++) {
      const assignment = seatAssignments.get(i.toString());
      const localParticipant = roomRef.current.localParticipant;
      const isCurrentUser = assignment?.id === localParticipant.sid;

      seats.push({
        index: i,
        isTaken: !!assignment,
        participantId: assignment?.id || null,
        participantName: assignment?.name || null,
        isCurrentUser
      });
    }

    return seats;
  };

  const setupRoomEvents = (newRoom: Room) => {
    // Handle participant connected
    newRoom.on('participantConnected', (participant: any) => {
      updateJudgesList();
      // Listen for attribute changes to detect seat assignments
      participant.on('attributesChanged', () => {
        updateJudgesList();
      });
    });

    // Handle participant disconnected
    newRoom.on('participantDisconnected', (participant: any) => {
      setJudges(prev => prev.filter(j => j.id !== participant.sid));
      updateJudgesList();
    });

    // Handle local participant updates
    newRoom.localParticipant.on('isSpeakingChanged', () => {
      setLocalJudge(prev => prev ? {
        ...prev,
        isSpeaking: newRoom.localParticipant.isSpeaking
      } : null);
    });

    newRoom.localParticipant.on('trackPublished', () => {
      setLocalJudge(prev => prev ? {
        ...prev,
        isCameraEnabled: newRoom.localParticipant.isCameraEnabled,
        isMicrophoneEnabled: newRoom.localParticipant.isMicrophoneEnabled
      } : null);
    });

    newRoom.localParticipant.on('trackUnpublished', () => {
      setLocalJudge(prev => prev ? {
        ...prev,
        isCameraEnabled: newRoom.localParticipant.isCameraEnabled,
        isMicrophoneEnabled: newRoom.localParticipant.isMicrophoneEnabled
      } : null);
    });

    // Handle remote participant updates
    newRoom.on('participantConnected', (participant: any) => {
      participant.on('isSpeakingChanged', () => {
        setJudges(prev => prev.map(j =>
          j.id === participant.sid ? { ...j, isSpeaking: participant.isSpeaking } : j
        ));
      });
      
      // Listen for attribute changes
      participant.on('attributesChanged', () => {
        updateJudgesList();
      });
    });

    // Initial judges list update
    updateJudgesList();
  };

  const updateJudgesList = () => {
    if (!roomRef.current) return;

    const judgeParticipants: JudgeParticipant[] = [];

    // Add remote participants that are judges (have seat assignments)
    roomRef.current.remoteParticipants.forEach((participant: any) => {
      const seat = participant.attributes?.judgeSeat;
      if (seat !== undefined && seat !== '') {
        judgeParticipants.push({
          id: participant.sid,
          identity: participant.identity,
          name: participant.name || participant.identity,
          isSpeaking: participant.isSpeaking,
          isLocal: false,
          isCameraEnabled: participant.isCameraEnabled,
          isMicrophoneEnabled: participant.isMicrophoneEnabled,
        });
      }
    });

    setJudges(judgeParticipants);
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
    room,
    judges,
    localJudge,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    toggleCamera,
    toggleMicrophone,
    leaveRoom,
    joinJudgeSeat,
    leaveJudgeSeat,
    getJudgeSeats,
  };
};