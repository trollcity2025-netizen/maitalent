import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useQueueManager } from '../../hooks/useQueueManager';
import { useLiveKit } from '../../hooks/useLiveKit';
import { getLiveKitToken } from '../../lib/api';

interface CurtainStageProps {
  roomType: 'audition' | 'main_show';
  onReady?: () => void;
}

export const CurtainStage: React.FC<CurtainStageProps> = ({ roomType, onReady }) => {
  const { user } = useAuth();
  const { stageState, myQueueEntry, markReady, setCurtainState } = useQueueManager(roomType);
  const { connect, disconnect, localTracks, isConnecting } = useLiveKit();
  const [curtainAnimation, setCurtainAnimation] = useState<'opening' | 'closing' | 'idle'>('idle');
  
  // Cleanup LiveKit connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  const leftCurtainRef = useRef<HTMLDivElement>(null);
  const rightCurtainRef = useRef<HTMLDivElement>(null);

  // Handle curtain animations
  useEffect(() => {
    if (stageState?.curtain_state === 'opening') {
      setCurtainAnimation('opening');
      // Trigger opening animation
      setTimeout(() => {
        setCurtainState('open');
        setCurtainAnimation('idle');
      }, 1000);
    } else if (stageState?.curtain_state === 'closing') {
      setCurtainAnimation('closing');
      // Trigger closing animation
      setTimeout(() => {
        setCurtainState('closed');
        setCurtainAnimation('idle');
      }, 1000);
    }
  }, [stageState?.curtain_state, setCurtainState]);

  const handleReadyClick = async () => {
    if (!myQueueEntry) return;

    try {
      // Request camera and mic permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // Get LiveKit token
      const token = await getLiveKitToken(
        roomType,
        user?.user_metadata?.full_name || user?.email || 'Anonymous'
      );
      
      // Connect to LiveKit
      await connect(token);
      
      // Mark as ready and live
      await markReady(myQueueEntry.id);
      
      onReady?.();
    } catch (error) {
      console.error('Failed to start performance:', error);
    }
  };


  // Check if this user is the active performer
  const isActivePerformer = myQueueEntry?.status === 'live' && 
    stageState?.active_user_id === user?.id;

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-purple-900 via-purple-800 to-black rounded-lg overflow-hidden">
      {/* Stage Overlay */}
      <div className={`absolute inset-0 bg-black transition-opacity duration-500 ${
        stageState?.curtain_state === 'open' ? 'opacity-0' : 'opacity-50'
      } pointer-events-none z-20`} />
      
      {/* Curtains */}
      <div className="absolute inset-0 z-40">
        {/* Left Curtain */}
        <div
          ref={leftCurtainRef}
          className={`absolute left-0 top-0 bottom-0 w-1/2 shadow-2xl transition-transform duration-1000 ${
            stageState?.curtain_state === 'open' ? '-translate-x-full' :
            stageState?.curtain_state === 'closed' ? 'translate-x-0' :
            stageState?.curtain_state === undefined ? 'translate-x-0' :
            curtainAnimation === 'opening' ? '-translate-x-full' :
            curtainAnimation === 'closing' ? 'translate-x-0' :
            'translate-x-0'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.08), rgba(0,0,0,0.25)),
              repeating-linear-gradient(
                to right,
                rgba(255,255,255,0.06), rgba(0,0,0,0.22) 14px,
                rgba(255,255,255,0.08) 28px
              )
            `,
            backgroundBlendMode: "overlay",
            zIndex: 30,
            transitionTimingFunction: "cubic-bezier(.18,.89,.32,1.28)"
          }}
        >
          {/* Velvet base + folds */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, rgba(0,0,0,0.55), rgba(255,255,255,0.06), rgba(0,0,0,0.55)),
                repeating-linear-gradient(
                  to right,
                  rgba(255,255,255,0.05) 0px,
                  rgba(0,0,0,0.2) 14px,
                  rgba(255,255,255,0.05) 28px
                ),
                linear-gradient(to bottom, #5b0000, #8a0000, #3a0000)
              `
            }}
          />
          
          {/* Velvet sheen */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 65%)"
            }}
          />
          
          {/* Bottom weight */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 opacity-40 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
            }}
          />
          
          {/* Texture noise */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Inner shadow for 3D shape */}
          <div className="absolute inset-0 shadow-[inset_-40px_0_60px_rgba(0,0,0,0.55)]" />
          
          {/* Curtain pleats */}
          <div className="absolute inset-0">
            <div className="absolute left-1/4 top-0 bottom-0 w-px bg-red-600/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-600/30" />
            <div className="absolute left-3/4 top-0 bottom-0 w-px bg-red-600/30" />
          </div>
        </div>

        {/* Right Curtain */}
        <div
          ref={rightCurtainRef}
          className={`absolute right-0 top-0 bottom-0 w-1/2 shadow-2xl transition-transform duration-1000 ${
            stageState?.curtain_state === 'open' ? 'translate-x-full' :
            stageState?.curtain_state === 'closed' ? 'translate-x-0' :
            stageState?.curtain_state === undefined ? 'translate-x-0' :
            curtainAnimation === 'opening' ? 'translate-x-full' :
            curtainAnimation === 'closing' ? 'translate-x-0' :
            'translate-x-0'
          }`}
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.08), rgba(0,0,0,0.25)),
              repeating-linear-gradient(
                to right,
                rgba(255,255,255,0.06), rgba(0,0,0,0.22) 14px,
                rgba(255,255,255,0.08) 28px
              )
            `,
            backgroundBlendMode: "overlay",
            zIndex: 30,
            transitionTimingFunction: "cubic-bezier(.18,.89,.32,1.28)"
          }}
        >
          {/* Velvet base + folds */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(to right, rgba(0,0,0,0.55), rgba(255,255,255,0.06), rgba(0,0,0,0.55)),
                repeating-linear-gradient(
                  to right,
                  rgba(255,255,255,0.05) 0px,
                  rgba(0,0,0,0.2) 14px,
                  rgba(255,255,255,0.05) 28px
                ),
                linear-gradient(to bottom, #5b0000, #8a0000, #3a0000)
              `
            }}
          />
          
          {/* Velvet sheen */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4), transparent 65%)"
            }}
          />
          
          {/* Bottom weight */}
          <div
            className="absolute bottom-0 left-0 right-0 h-24 opacity-40 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)"
            }}
          />
          
          {/* Texture noise */}
          <div
            className="absolute inset-0 opacity-[0.08] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Inner shadow for 3D shape (flipped for right curtain) */}
          <div className="absolute inset-0 shadow-[inset_40px_0_60px_rgba(0,0,0,0.55)]" />
          
          {/* Curtain pleats */}
          <div className="absolute inset-0">
            <div className="absolute right-1/4 top-0 bottom-0 w-px bg-red-600/30" />
            <div className="absolute right-1/2 top-0 bottom-0 w-px bg-red-600/30" />
            <div className="absolute right-3/4 top-0 bottom-0 w-px bg-red-600/30" />
          </div>
        </div>
      </div>

      {/* Stage Content Area */}
      <div className="relative z-0 h-full flex flex-col">
        {/* Stage Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <h2 className="text-2xl font-bold text-center">
            {roomType === 'audition' ? 'Audition Stage' : 'Main Show Stage'}
          </h2>
          {stageState?.curtain_state === 'closed' && (
            <p className="text-center text-sm opacity-80 mt-2">
              Waiting for performance to begin...
            </p>
          )}
        </div>

        {/* Video Grid Area */}
        <div className="flex-1 p-4 bg-gradient-to-b from-gray-900 to-black">
          {isActivePerformer ? (
            // Live performance view
            <div className="h-full bg-black rounded-lg border-4 border-purple-500">
              {localTracks.length > 0 ? (
                <div className="h-full grid grid-cols-4 gap-4 p-4">
                  {/* Main performer */}
                  <div className="col-span-3 bg-gray-800 rounded-lg overflow-hidden">
                    {localTracks.find((t: any) => t.kind === 'video') && (
                      <video 
                        className="w-full h-full object-cover"
                        autoPlay 
                        playsInline 
                        muted={false}
                      />
                    )}
                  </div>
                  
                  {/* Judges/Viewers */}
                  <div className="col-span-1 grid grid-cols-2 gap-3">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="w-full h-16 bg-gray-600 rounded animate-pulse" />
                      <p className="text-xs text-gray-300 mt-2 text-center">Judge 1</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="w-full h-16 bg-gray-600 rounded animate-pulse" />
                      <p className="text-xs text-gray-300 mt-2 text-center">Judge 2</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="w-full h-16 bg-gray-600 rounded animate-pulse" />
                      <p className="text-xs text-gray-300 mt-2 text-center">Judge 3</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="w-full h-16 bg-gray-600 rounded animate-pulse" />
                      <p className="text-xs text-gray-300 mt-2 text-center">Judge 4</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-3 col-span-2">
                      <div className="w-full h-16 bg-gray-600 rounded animate-pulse" />
                      <p className="text-xs text-gray-300 mt-2 text-center">Judge 5</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-white">Connecting to LiveKit...</p>
                  </div>
                </div>
              )}
            </div>
          ) : myQueueEntry?.status === 'called_up' ? (
            // Called up - waiting for ready
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white p-8 rounded-xl shadow-2xl">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">You're Up!</h3>
                <p className="mb-6">Click READY to begin your performance</p>
                <button
                  onClick={handleReadyClick}
                  disabled={isConnecting}
                  className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'READY'}
                </button>
              </div>
            </div>
          ) : myQueueEntry?.status === 'queued' ? (
            // Waiting in queue
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-gray-800 text-white p-8 rounded-xl">
                <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Waiting in Queue</h3>
                <p className="mb-4">Position: {myQueueEntry ? myQueueEntry.joined_at : 'N/A'}</p>
                <p className="text-gray-400">Please wait for your turn</p>
              </div>
            </div>
          ) : (
            // Default stage view
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 00-1-1H4a1 1 0 00-1 1v2M7 4h10M7 4v16m10-16v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V4m0 0H7m10 0h-2m-8 0V2a1 1 0 00-1-1H4a1 1 0 00-1 1v2m0 0h2m-2 0l2 2m0 0v16a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2H9a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-bold mb-2">Stage Ready</h3>
                <p className="text-gray-300">Waiting for next performer</p>
              </div>
            </div>
          )}
        </div>

        {/* Stage Footer */}
        <div className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex justify-between items-center">
            <div className="text-sm">
              Status: {stageState?.curtain_state.toUpperCase()}
            </div>
            <div className="text-sm">
              Active: {stageState?.active_user_id ? 'Yes' : 'No'}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-200">
            Debug: Curtain animation: {curtainAnimation} | Curtain state: {stageState?.curtain_state}
          </div>
        </div>
      </div>
    </div>
  );
};