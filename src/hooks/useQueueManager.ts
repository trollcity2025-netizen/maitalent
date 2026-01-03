import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export type QueueStatus = 'queued' | 'called_up' | 'ready' | 'live' | 'removed';
export type RoomType = 'audition' | 'main_show';

export interface QueueEntry {
  id: string;
  room_id: string;
  room_type: RoomType;
  user_id: string;
  stage_name: string;
  status: QueueStatus;
  joined_at: string;
  called_at: string | null;
  live_at: string | null;
}

export interface StageState {
  room_id: string;
  room_type: RoomType;
  active_user_id: string | null;
  curtain_state: 'closed' | 'opening' | 'open' | 'closing';
  updated_at: string;
}

export interface QueueManager {
  // State
  queueEntries: QueueEntry[];
  stageState: StageState | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  joinQueue: (roomType: RoomType, stageName: string) => Promise<void>;
  leaveQueue: (queueId: string) => Promise<void>;
  callUpContestant: (queueId: string) => Promise<void>;
  removeContestant: (queueId: string) => Promise<void>;
  endPerformance: () => Promise<void>;
  markReady: (queueId: string) => Promise<void>;
  setCurtainState: (state: StageState['curtain_state']) => Promise<void>;
  
  // Computed
  myQueueEntry: QueueEntry | null;
  myPosition: number;
  canCallUp: boolean;
  isStageOccupied: boolean;
}

export function useQueueManager(roomType: RoomType): QueueManager {
  const { user } = useAuth();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [stageState, setStageState] = useState<StageState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const room_id = roomType === 'audition' ? 'audition-room' : 'main-show';

  // Subscribe to realtime updates
  useEffect(() => {
    const queueSubscription = supabase
      .channel(`performance_queue:${roomType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_queue',
          filter: `room_type=eq.${roomType}`
        },
        (payload) => {
          setQueueEntries(prev => {
            const entries = [...prev];
            const queueEntry = payload.new as QueueEntry;
            const oldEntry = payload.old as QueueEntry;
            
            if (payload.eventType === 'INSERT') {
              entries.push(queueEntry);
            } else if (payload.eventType === 'UPDATE') {
              const index = entries.findIndex(q => q.id === queueEntry.id);
              if (index !== -1) entries[index] = queueEntry;
            } else if (payload.eventType === 'DELETE') {
              return entries.filter(q => q.id !== oldEntry?.id);
            }
            
            return entries.sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime());
          });
        }
      )
      .subscribe();

    const stageSubscription = supabase
      .channel(`stage_state:${roomType}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stage_state',
          filter: `room_id=eq.${room_id}`
        },
        (payload) => {
          setStageState(payload.new as StageState);
        }
      )
      .subscribe();

    // Initial load
    loadQueueData();

    return () => {
      supabase.removeChannel(queueSubscription);
      supabase.removeChannel(stageSubscription);
    };
  }, [roomType]);

  const loadQueueData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load queue entries
      const { data: queueData, error: queueError } = await supabase
        .from('performance_queue')
        .select('*')
        .eq('room_type', roomType)
        .order('joined_at', { ascending: true });

      if (queueError) throw queueError;
      setQueueEntries(queueData || []);

      // Load stage state
      const { data: stageData, error: stageError } = await supabase
        .from('stage_state')
        .select('*')
        .eq('room_id', room_id)
        .single();

      if (stageError && stageError.code !== 'PGRST116') throw stageError; // PGRST116 = no rows returned
      setStageState(stageData || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [roomType, room_id]);

  const joinQueue = useCallback(async (stageName: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      // Check if user already has an active queue entry
      const existingEntry = queueEntries.find(q => 
        q.user_id === user.id && q.status !== 'removed'
      );
      
      if (existingEntry) {
        throw new Error('You are already in the queue');
      }

      const { data, error } = await supabase
        .from('performance_queue')
        .insert({
          room_id,
          room_type: roomType,
          user_id: user.id,
          stage_name: stageName,
          status: 'queued'
        })
        .select()
        .single();

      if (error) throw error;
      
      setQueueEntries(prev => [...prev, data].sort((a, b) => 
        new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user, roomType, room_id, queueEntries]);

  const leaveQueue = useCallback(async (queueId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('performance_queue')
        .update({ status: 'removed' })
        .eq('id', queueId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setQueueEntries(prev => prev.map(q => 
        q.id === queueId ? { ...q, status: 'removed' } : q
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [user]);

  const callUpContestant = useCallback(async (queueId: string) => {
    try {
      setError(null);
      
      // Check if stage is occupied
      if (stageState?.active_user_id) {
        throw new Error('Stage currently occupied');
      }

      const { data, error } = await supabase.rpc('call_up_contestant', {
        queue_id: queueId,
        room_id: room_id
      });

      if (error) throw error;
      
      // Update local state
      setQueueEntries(prev => prev.map(q => 
        q.id === queueId 
          ? { ...q, status: 'called_up', called_at: new Date().toISOString() }
          : q
      ));
      
      if (data?.user_id) {
        setStageState(prev => prev ? {
          ...prev,
          active_user_id: data.user_id,
          curtain_state: 'closed'
        } : null);
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [stageState, room_id]);

  const removeContestant = useCallback(async (queueId: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('performance_queue')
        .update({ status: 'removed' })
        .eq('id', queueId);

      if (error) throw error;
      
      setQueueEntries(prev => prev.map(q => 
        q.id === queueId ? { ...q, status: 'removed' } : q
      ));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const endPerformance = useCallback(async () => {
    try {
      setError(null);
      
      const { error } = await supabase.rpc('end_performance', {
        room_id: room_id
      });

      if (error) throw error;
      
      // Update local state
      setStageState(prev => prev ? {
        ...prev,
        active_user_id: null,
        curtain_state: 'closing'
      } : null);
      
      // Mark current live contestant as removed
      const liveContestant = queueEntries.find(q => q.status === 'live');
      if (liveContestant) {
        setQueueEntries(prev => prev.map(q => 
          q.id === liveContestant.id ? { ...q, status: 'removed', live_at: null } : q
        ));
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [room_id, queueEntries]);

  const markReady = useCallback(async (queueId: string) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('performance_queue')
        .update({ 
          status: 'live',
          live_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .select()
        .single();

      if (error) throw error;
      
      setQueueEntries(prev => prev.map(q => 
        q.id === queueId ? { ...q, status: 'live', live_at: data.live_at } : q
      ));
      
      // Update curtain state
      setStageState(prev => prev ? {
        ...prev,
        curtain_state: 'opening'
      } : null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const setCurtainState = useCallback(async (state: StageState['curtain_state']) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('stage_state')
        .update({ curtain_state: state })
        .eq('room_id', room_id);

      if (error) throw error;
      
      setStageState(prev => prev ? { ...prev, curtain_state: state } : null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [room_id]);

  // Computed values
  const myQueueEntry = user ? queueEntries.find(q => q.user_id === user.id && q.status !== 'removed') || null : null;
  const myPosition = myQueueEntry
    ? queueEntries.filter(q => q.status === 'queued').findIndex(q => q.id === myQueueEntry.id) + 1
    : 0;
  const canCallUp = !stageState?.active_user_id;
  const isStageOccupied = !!stageState?.active_user_id;

  return {
    // State
    queueEntries,
    stageState,
    isLoading,
    error,
    
    // Actions
    joinQueue,
    leaveQueue,
    callUpContestant,
    removeContestant,
    endPerformance,
    markReady,
    setCurtainState,
    
    // Computed
    myQueueEntry,
    myPosition,
    canCallUp,
    isStageOccupied
  };
}