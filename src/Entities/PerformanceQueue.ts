import { SupabaseClient } from '@supabase/supabase-js';

export type PerformanceQueueStatus = 'queued' | 'called_up' | 'ready' | 'live' | 'removed';

export type PerformanceQueueItem = {
    id: string;
    room_id: string;
    room_type: 'audition' | 'main_show';
    user_id: string;
    stage_name: string;
    status: PerformanceQueueStatus;
    joined_at: string;
    called_at?: string;
    live_at?: string;
};

export class PerformanceQueue {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async joinQueue(roomId: string, roomType: 'audition' | 'main_show', userId: string, stageName: string): Promise<PerformanceQueueItem> {
        const { data, error } = await this.supabase
            .from('performance_queue')
            .insert({
                room_id: roomId,
                room_type: roomType,
                user_id: userId,
                stage_name: stageName,
                status: 'queued'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async leaveQueue(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ status: 'removed' })
            .eq('user_id', userId)
            .eq('room_type', roomType)
            .eq('status', 'queued');

        if (error) throw error;
    }

    async callUp(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ 
                status: 'called_up',
                called_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('room_type', roomType)
            .eq('status', 'queued');

        if (error) throw error;
    }

    async markReady(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ status: 'ready' })
            .eq('user_id', userId)
            .eq('room_type', roomType)
            .eq('status', 'called_up');

        if (error) throw error;
    }

    async startPerformance(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ 
                status: 'live',
                live_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('room_type', roomType)
            .eq('status', 'ready');

        if (error) throw error;
    }

    async endPerformance(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ status: 'removed' })
            .eq('user_id', userId)
            .eq('room_type', roomType)
            .in('status', ['live', 'ready']);

        if (error) throw error;
    }

    async removeUser(userId: string, roomType: 'audition' | 'main_show'): Promise<void> {
        const { error } = await this.supabase
            .from('performance_queue')
            .update({ status: 'removed' })
            .eq('user_id', userId)
            .eq('room_type', roomType);

        if (error) throw error;
    }

    async getQueue(roomType: 'audition' | 'main_show'): Promise<PerformanceQueueItem[]> {
        const { data, error } = await this.supabase
            .from('performance_queue')
            .select('*')
            .eq('room_type', roomType)
            .in('status', ['queued', 'called_up', 'ready'])
            .order('joined_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getActiveUser(roomType: 'audition' | 'main_show'): Promise<PerformanceQueueItem | null> {
        const { data, error } = await this.supabase
            .from('performance_queue')
            .select('*')
            .eq('room_type', roomType)
            .eq('status', 'live')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
    }

    async subscribeToQueue(roomType: 'audition' | 'main_show', callback: (queue: PerformanceQueueItem[]) => void) {
        return this.supabase
            .channel(`public:performance_queue:room_type=eq.${roomType}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'performance_queue',
                    filter: `room_type=eq.${roomType}`
                },
                async () => {
                    const queue = await this.getQueue(roomType);
                    callback(queue);
                }
            )
            .subscribe();
    }

    async subscribeToActiveUser(roomType: 'audition' | 'main_show', callback: (user: PerformanceQueueItem | null) => void) {
        return this.supabase
            .channel(`public:performance_queue:room_type=eq.${roomType}:live`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'performance_queue',
                    filter: `room_type=eq.${roomType}`
                },
                async () => {
                    const activeUser = await this.getActiveUser(roomType);
                    callback(activeUser);
                }
            )
            .subscribe();
    }
}