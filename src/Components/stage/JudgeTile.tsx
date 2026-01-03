import React, { useEffect, useState, useRef } from 'react';

interface JudgeTileProps {
  judge: {
    id: string;
    identity: string;
    name: string;
    isSpeaking: boolean;
    isLocal: boolean;
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
  } | null;
  onToggleCamera?: () => void;
  onToggleMicrophone?: () => void;
  onLeaveRoom?: () => void;
}

export const JudgeTile: React.FC<JudgeTileProps> = ({
  judge,
  onToggleCamera,
  onToggleMicrophone,
  onLeaveRoom
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingTimeout, setSpeakingTimeout] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle speaking state with debounce
  useEffect(() => {
    if (judge?.isSpeaking) {
      // Only start speaking after 300ms to prevent false positives
      const timeout = setTimeout(() => {
        setIsSpeaking(true);
      }, 300);
      setSpeakingTimeout(timeout as unknown as number);
    } else {
      // Only stop speaking after 500ms of silence
      if (speakingTimeout) {
        clearTimeout(speakingTimeout);
        setSpeakingTimeout(null);
      }
      const timeout = setTimeout(() => {
        setIsSpeaking(false);
      }, 500);
      setSpeakingTimeout(timeout as unknown as number);
    }

    return () => {
      if (speakingTimeout) {
        clearTimeout(speakingTimeout);
      }
    };
  }, [judge?.isSpeaking]);

  // Render video if camera is enabled and we have a video ref
  useEffect(() => {
    if (judge?.isCameraEnabled && videoRef.current) {
      // In a real implementation, this would attach the video track
      // For now, we'll show a placeholder
    }
  }, [judge?.isCameraEnabled]);

  if (!judge) {
    return (
      <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 shadow-lg border-2 border-white/10 aspect-square flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full mb-4 flex items-center justify-center">
          <span className="text-2xl">🎭</span>
        </div>
        <h4 className="font-semibold text-white mb-1">Judge Slot Open</h4>
        <p className="text-xs text-gray-400">Waiting for a judge to join...</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 ${
      isSpeaking
        ? 'ring-4 ring-pink-500/60 shadow-lg shadow-pink-500/40 animate-pulse'
        : 'border-white/20 hover:border-white/40'
    }`}>
      {/* Video or Avatar Area */}
      <div className="relative aspect-square bg-gradient-to-b from-gray-800 to-gray-900">
        {judge.isCameraEnabled ? (
          // Video element for live stream
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={judge.isLocal}
          />
        ) : (
          // Avatar fallback when camera is off
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">
                {judge.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}

        {/* Overlay for muted state */}
        {!judge.isMicrophoneEnabled && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
              Muted
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-white font-semibold text-sm truncate">
              {judge.name}
            </span>
            {judge.isLocal && (
              <span className="text-xs bg-blue-500 text-white px-1 rounded">You</span>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {/* Microphone Status */}
            <div className={`w-3 h-3 rounded-full ${
              judge.isMicrophoneEnabled 
                ? 'bg-green-400 animate-pulse' 
                : 'bg-red-400'
            }`} />
            
            {/* Camera Status */}
            <div className={`w-3 h-3 rounded-full ${
              judge.isCameraEnabled 
                ? 'bg-green-400' 
                : 'bg-gray-400'
            }`} />
            
            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Controls for local judge */}
      {judge.isLocal && (
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            onClick={onToggleCamera}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            title={judge.isCameraEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {judge.isCameraEnabled ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onToggleMicrophone}
            className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            title={judge.isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {judge.isMicrophoneEnabled ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>
          
          <button
            onClick={onLeaveRoom}
            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            title="Leave room"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};