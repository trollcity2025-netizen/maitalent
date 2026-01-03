import React from 'react';
import { useQueueManager } from '../../hooks/useQueueManager';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface JudgeQueuePanelProps {
  roomType: 'audition' | 'main_show';
}

export const JudgeQueuePanel: React.FC<JudgeQueuePanelProps> = ({ roomType }) => {
  const { 
    queueEntries, 
    stageState, 
    isLoading, 
    error, 
    callUpContestant, 
    removeContestant, 
    endPerformance,
    isStageOccupied 
  } = useQueueManager(roomType);

  const queuedContestants = queueEntries.filter(q => q.status === 'queued');
  const calledUpContestants = queueEntries.filter(q => q.status === 'called_up');
  const liveContestants = queueEntries.filter(q => q.status === 'live');

  const handleCallUp = async (queueId: string) => {
    try {
      await callUpContestant(queueId);
    } catch (err: any) {
      console.error('Failed to call up contestant:', err);
    }
  };

  const handleRemove = async (queueId: string) => {
    try {
      await removeContestant(queueId);
    } catch (err: any) {
      console.error('Failed to remove contestant:', err);
    }
  };

  const handleEndPerformance = async () => {
    try {
      await endPerformance();
    } catch (err: any) {
      console.error('Failed to end performance:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-red-600">Error loading queue: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          {roomType === 'audition' ? 'Audition Queue' : 'Main Show Queue'}
        </h2>
        <div className="flex items-center space-x-2">
          <Badge className={isStageOccupied ? "bg-red-100 text-red-800 border-red-200" : "bg-green-100 text-green-800 border-green-200"}>
            Stage: {isStageOccupied ? 'Occupied' : 'Available'}
          </Badge>
          {liveContestants.length > 0 && (
            <Button 
              variant="default"
              onClick={handleEndPerformance}
              className="ml-2"
            >
              End Performance
            </Button>
          )}
        </div>
      </div>

      {/* Live Performance Section */}
      {liveContestants.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">Currently Live</h3>
          {liveContestants.map((contestant) => (
            <div key={contestant.id} className="flex items-center justify-between">
              <div>
                <span className="font-medium">{contestant.stage_name}</span>
                <span className="text-sm text-gray-600 ml-2">
                  Live since {formatDistanceToNow(new Date(contestant.live_at!), { addSuffix: true })}
                </span>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">LIVE</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Called Up Section */}
      {calledUpContestants.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Called Up</h3>
          {calledUpContestants.map((contestant) => (
            <div key={contestant.id} className="flex items-center justify-between py-2">
              <div>
                <span className="font-medium">{contestant.stage_name}</span>
                <span className="text-sm text-gray-600 ml-2">
                  Called up {formatDistanceToNow(new Date(contestant.called_at!), { addSuffix: true })}
                </span>
              </div>
              <div className="flex space-x-2">
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">READY</Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRemove(contestant.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Queue Section */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Queue ({queuedContestants.length})</h3>
        {queuedContestants.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No contestants in queue</p>
        ) : (
          <div className="space-y-2">
            {queuedContestants.map((contestant, index) => (
              <div
                key={contestant.id}
                className={`flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 ${
                  index === 0 ? 'ring-2 ring-yellow-300 bg-yellow-50/50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Badge className={`w-8 text-center border-gray-300 ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'border-gray-300'
                  }`}>
                    #{index + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{contestant.stage_name}</div>
                    <div className="text-sm text-gray-600">
                      Waiting {formatDistanceToNow(new Date(contestant.joined_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Badge className={`${
                    index === 0
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200'
                  }`}>
                    {index === 0 ? 'NEXT UP' : 'QUEUED'}
                  </Badge>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleCallUp(contestant.id)}
                    disabled={isStageOccupied}
                    className={index === 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : ''}
                  >
                    Call Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(contestant.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stage State Info */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div>Room: {stageState?.room_id}</div>
          <div>Curtain State: {stageState?.curtain_state.toUpperCase()}</div>
          <div>Active User: {stageState?.active_user_id || 'None'}</div>
        </div>
      </div>
    </div>
  );
};