import React, { useState } from 'react';
import { useLiveKitRoom } from '../../hooks/useLiveKitRoom';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

interface JudgePanelProps {
  roomType: 'audition' | 'main_show';
}

export const JudgePanel: React.FC<JudgePanelProps> = ({ roomType }) => {
  const {
    judges,
    localJudge,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    joinJudgeSeat,
    leaveJudgeSeat,
    getJudgeSeats,
  } = useLiveKitRoom();
  
  const { user } = useAuth();
  const [isJoiningSeat, setIsJoiningSeat] = useState<number | null>(null);
  const [seatError, setSeatError] = useState<string | null>(null);

  // JudgeSeatCard component
  const JudgeSeatCard: React.FC<{
    seat: any;
    isConnecting: boolean;
    isJoiningSeat: boolean;
    onJoinSeat: () => void;
    onLeaveSeat: () => void;
  }> = ({ seat, isConnecting, isJoiningSeat, onJoinSeat, onLeaveSeat }) => {
    const isAvailable = !seat.isTaken;
    const isCurrentUser = seat.isCurrentUser;
    const participantName = seat.participantName || `Judge ${seat.index + 1}`;

    return (
      <div
        className={`relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl p-4 shadow-lg border-2 transition-all duration-300 ${
          isAvailable
            ? 'border-white/20 hover:border-white/40 hover:shadow-xl cursor-pointer'
            : isCurrentUser
            ? 'border-green-400/60 shadow-lg shadow-green-500/20'
            : 'border-red-400/40 opacity-50'
        }`}
        onClick={isAvailable ? onJoinSeat : isCurrentUser ? undefined : undefined}
      >
        {/* Seat Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isAvailable ? 'bg-green-400' : isCurrentUser ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="text-white font-semibold text-sm">
              Seat {seat.index + 1}
            </span>
          </div>
          {isCurrentUser && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
              You
            </span>
          )}
        </div>

        {/* Seat Content */}
        <div className="text-center">
          {isAvailable ? (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl">🎭</span>
              </div>
              <p className="text-white font-medium">Judge Slot Open</p>
              <p className="text-xs text-gray-400">Click to Join as Judge</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onJoinSeat}
                disabled={isConnecting || isJoiningSeat}
                className="w-full mt-2 border-white/40 text-white bg-white/10 hover:bg-white/20"
              >
                {isJoiningSeat ? 'Joining...' : 'Join Seat'}
              </Button>
            </div>
          ) : isCurrentUser ? (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white font-medium">{participantName}</p>
              <p className="text-xs text-green-400">You are Judge #{seat.index + 1}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onLeaveSeat}
                className="w-full mt-2 border-red-400/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                Leave Seat
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white font-medium">{participantName}</p>
              <p className="text-xs text-red-400">Taken</p>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="w-full mt-2 border-gray-400/30 text-gray-400 bg-gray-500/20 cursor-not-allowed"
              >
                Occupied
              </Button>
            </div>
          )}
        </div>

        {/* Hover tooltip */}
        {isAvailable && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors rounded-2xl flex items-center justify-center">
            <span className="text-xs text-white bg-black/80 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
              Click to Join as Judge
            </span>
          </div>
        )}
      </div>
    );
  };

  const handleConnect = async () => {
    try {
      await connect(roomType);
    } catch (err) {
      console.error('Failed to connect to LiveKit:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (err) {
      console.error('Failed to disconnect from LiveKit:', err);
    }
  };

  // Get current seat occupancy
  const judgeSeats = getJudgeSeats();

  const handleJoinSeat = async (seatIndex: number) => {
    if (!user) {
      toast.error('Please log in to join as a judge');
      return;
    }

    try {
      setIsJoiningSeat(seatIndex);
      setSeatError(null);
      
      // Connect to room if not already connected
      if (!isConnected) {
        await connect(roomType);
      }
      
      // Join the specific seat
      await joinJudgeSeat(seatIndex);
      toast.success(`Joined seat ${seatIndex + 1} as judge`);
    } catch (err: any) {
      console.error(`Failed to join seat ${seatIndex}:`, err);
      setSeatError(err.message);
      toast.error(err.message || 'Failed to join seat');
    } finally {
      setIsJoiningSeat(null);
    }
  };

  const handleLeaveSeat = async () => {
    try {
      await leaveJudgeSeat();
      toast.success('Left judge seat');
    } catch (err: any) {
      console.error('Failed to leave seat:', err);
      toast.error('Failed to leave seat');
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 shadow-xl border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-lg">Judge Panel</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-white">
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="border-red-400 text-red-400 hover:bg-red-400 hover:text-white"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
            >
              {isConnecting ? 'Connecting...' : 'Connect to LiveKit'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {seatError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{seatError}</p>
        </div>
      )}

      {/* Judge Seats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {judgeSeats.map((seat) => (
          <JudgeSeatCard
            key={seat.index}
            seat={seat}
            isConnecting={isConnecting}
            isJoiningSeat={isJoiningSeat === seat.index}
            onJoinSeat={() => handleJoinSeat(seat.index)}
            onLeaveSeat={() => handleLeaveSeat()}
          />
        ))}
      </div>

      {/* Connection Status */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        {isConnected ? (
          <div className="flex items-center justify-center space-x-4">
            <span>Room: {roomType === 'audition' ? 'Audition Room' : 'Main Show'}</span>
            <span>•</span>
            <span>Total judges: {judges.length + (localJudge ? 1 : 0)}</span>
          </div>
        ) : (
          <p>Connect to see live judge video streams</p>
        )}
      </div>
    </div>
  );
};