import React, { useEffect, useState } from 'react';
import { useQueueManager } from '../../hooks/useQueueManager';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { soundManager } from '../../lib/sound';

interface QueueStatusProps {
  roomType: 'audition' | 'main_show';
  onJoinQueue: () => void;
  onLeaveQueue: () => void;
}

const AVG_PERFORMANCE_SECONDS = 120; // 2 minutes

function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min`;
}

function calculateETA(position: number): string {
  const seconds = (position - 1) * AVG_PERFORMANCE_SECONDS;
  return formatETA(seconds);
}

export const QueueStatus: React.FC<QueueStatusProps> = ({ roomType, onJoinQueue, onLeaveQueue }) => {
  const { myQueueEntry, isLoading, error, queueEntries } = useQueueManager(roomType);
  const [showToast, setShowToast] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(soundManager.isEnabled());
  
  // Filter only queued contestants for position calculation
  const queuedContestants = queueEntries.filter(q => q.status === 'queued');
  
  // Calculate position based on queued contestants only
  const actualPosition = myQueueEntry && myQueueEntry.status === 'queued'
    ? queuedContestants.findIndex(q => q.id === myQueueEntry.id) + 1
    : 0;
  
  // Handle called up notification
  useEffect(() => {
    if (myQueueEntry?.status === 'called_up') {
      setShowToast(true);
      
      // Play notification sound and vibrate
      soundManager.playCalledUpSound();
      soundManager.vibrate();
      
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [myQueueEntry?.status]);
  
  const handleNotificationToggle = () => {
    const newEnabled = soundManager.toggleNotifications();
    setNotificationEnabled(newEnabled);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!myQueueEntry) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Not in Queue</h3>
        <p className="text-gray-600 text-sm mb-4">
          Join the queue to audition for the {roomType === 'audition' ? 'Audition' : 'Main Show'} stage.
        </p>
        <Button onClick={onJoinQueue} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white">
          Join Queue
        </Button>
      </div>
    );
  }

  if (myQueueEntry.status === 'queued') {
    const eta = calculateETA(actualPosition);
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">In Queue</h3>
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">#{actualPosition}</Badge>
        </div>
        <p className="text-gray-600 text-sm mb-2">
          You are #{actualPosition} in line
        </p>
        <p className="text-gray-500 text-xs mb-3">
          Estimated wait: ~{eta}
        </p>
        <p className="text-xs text-gray-400 mb-3">
          Average performance time: ~2 minutes
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Joined {formatDistanceToNow(new Date(myQueueEntry.joined_at), { addSuffix: true })}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">Queue length: {queuedContestants.length}</span>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={handleNotificationToggle}
              className="rounded"
            />
            <span>🔔 Enable Call Notifications</span>
          </label>
        </div>
        <Button
          onClick={onLeaveQueue}
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Leave Queue
        </Button>
      </div>
    );
  }

  if (myQueueEntry.status === 'called_up') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-yellow-800">You're Up!</h3>
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">NEXT</Badge>
        </div>
        <p className="text-yellow-700 text-sm mb-3 font-semibold">
          Get ready! You're next in line.
        </p>
        <p className="text-xs text-yellow-600 mb-3">
          Called up {formatDistanceToNow(new Date(myQueueEntry.called_at!), { addSuffix: true })}
        </p>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-yellow-600">Queue length: {queuedContestants.length}</span>
          <label className="flex items-center space-x-2 text-xs">
            <input
              type="checkbox"
              checked={notificationEnabled}
              onChange={handleNotificationToggle}
              className="rounded"
            />
            <span>🔔 Notifications</span>
          </label>
        </div>
        <Button
          onClick={onLeaveQueue}
          variant="outline"
          className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
        >
          Remove from Queue
        </Button>
      </div>
    );
  }

  if (myQueueEntry.status === 'ready' || myQueueEntry.status === 'live') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-green-800">On Stage</h3>
          <Badge className="bg-green-100 text-green-800 border-green-200">
            {myQueueEntry.status === 'ready' ? 'READY' : 'LIVE'}
          </Badge>
        </div>
        <p className="text-green-700 text-sm mb-3">
          You are currently on stage!
        </p>
        {myQueueEntry.status === 'live' && (
          <p className="text-xs text-green-600 mb-3">
            Live since {formatDistanceToNow(new Date(myQueueEntry.live_at!), { addSuffix: true })}
          </p>
        )}
      </div>
    );
  }

  if (myQueueEntry.status === 'removed') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Removed</h3>
        <p className="text-gray-600 text-sm mb-4">
          You have been removed from the queue.
        </p>
        <Button onClick={onJoinQueue} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white">
          Join Queue
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Called Up Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-semibold">YOU'RE UP! Click READY to start.</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Main Queue Status */}
      {(() => {
        if (isLoading) {
          return (
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          );
        }

        if (error) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">Error: {error}</p>
            </div>
          );
        }

        if (!myQueueEntry) {
          return (
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Not in Queue</h3>
              <p className="text-gray-600 text-sm mb-4">
                Join the queue to audition for the {roomType === 'audition' ? 'Audition' : 'Main Show'} stage.
              </p>
              <Button onClick={onJoinQueue} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white">
                Join Queue
              </Button>
            </div>
          );
        }

        if (myQueueEntry.status === 'queued') {
          const eta = calculateETA(actualPosition);
          return (
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">In Queue</h3>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">#{actualPosition}</Badge>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                You are #{actualPosition} in line
              </p>
              <p className="text-gray-500 text-xs mb-3">
                Estimated wait: ~{eta}
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Average performance time: ~2 minutes
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Joined {formatDistanceToNow(new Date(myQueueEntry.joined_at), { addSuffix: true })}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500">Queue length: {queuedContestants.length}</span>
                <label className="flex items-center space-x-2 text-xs">
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={handleNotificationToggle}
                    className="rounded"
                  />
                  <span>🔔 Enable Call Notifications</span>
                </label>
              </div>
              <Button
                onClick={onLeaveQueue}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Leave Queue
              </Button>
            </div>
          );
        }

        if (myQueueEntry.status === 'called_up') {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-yellow-800">You're Up!</h3>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">NEXT</Badge>
              </div>
              <p className="text-yellow-700 text-sm mb-3 font-semibold">
                Get ready! You're next in line.
              </p>
              <p className="text-xs text-yellow-600 mb-3">
                Called up {formatDistanceToNow(new Date(myQueueEntry.called_at!), { addSuffix: true })}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-yellow-600">Queue length: {queuedContestants.length}</span>
                <label className="flex items-center space-x-2 text-xs">
                  <input
                    type="checkbox"
                    checked={notificationEnabled}
                    onChange={handleNotificationToggle}
                    className="rounded"
                  />
                  <span>🔔 Notifications</span>
                </label>
              </div>
              <Button
                onClick={onLeaveQueue}
                variant="outline"
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                Remove from Queue
              </Button>
            </div>
          );
        }

        if (myQueueEntry.status === 'ready' || myQueueEntry.status === 'live') {
          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-green-800">On Stage</h3>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {myQueueEntry.status === 'ready' ? 'READY' : 'LIVE'}
                </Badge>
              </div>
              <p className="text-green-700 text-sm mb-3">
                You are currently on stage!
              </p>
              {myQueueEntry.status === 'live' && (
                <p className="text-xs text-green-600 mb-3">
                  Live since {formatDistanceToNow(new Date(myQueueEntry.live_at!), { addSuffix: true })}
                </p>
              )}
            </div>
          );
        }

        if (myQueueEntry.status === 'removed') {
          return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Removed</h3>
              <p className="text-gray-600 text-sm mb-4">
                You have been removed from the queue.
              </p>
              <Button onClick={onJoinQueue} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white">
                Join Queue
              </Button>
            </div>
          );
        }

        return null;
      })()}
    </>
  );
};