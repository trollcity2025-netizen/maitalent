import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import GiftPanel from '@/Components/stage/GiftPanel';
import { CurtainStage } from '@/Components/stage/CurtainStage';
import { JudgeQueuePanel } from '@/Components/admin/JudgeQueuePanel';
import { JudgePanel } from '@/Components/stage/JudgePanel';
import Layout from '@/Layouts/Layout';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { useAuth } from '@/hooks/useAuth';

type AuditionUser = {
    has_completed_tour?: boolean;
    is_judge?: boolean;
    email?: string | null;
    full_name?: string | null;
    coins?: number;
    role?: string | null;
};

type AuditionShowState = {
    id: string;
    is_live?: boolean;
    performance_end_time?: string | null;
    current_contestant_id?: string | null;
    curtains_open?: boolean;
    viewer_count?: number;
};

type AuditionContestant = {
    id: string;
    name?: string;
    status?: string;
    gifts_received?: number;
    votes?: number;
    total_score?: number;
    email?: string;
    total_earnings?: number;
};

type AuditionJudge = {
    seat_number: number;
    user_email?: string | null;
    display_name?: string;
};

type AuditionGift = {
    id: string;
    name: string;
    icon: React.ReactNode;
    coin_cost: number;
    vote_value: number;
};

export default function Audition() {
    const queryClient = useQueryClient();
    const [currentUser, setCurrentUser] = useState<AuditionUser | null>(null);
    const [judgeNoteText, setJudgeNoteText] = useState('');
    
    // Queue management
    const { user } = useAuth();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setCurrentUser(currentUser);
            } catch (e) {}
        };
        fetchUser();
    }, []);

    const { data: showStates } = useQuery({
        queryKey: ['showState'],
        queryFn: async () => (await supabase.entities.ShowState.list()) as AuditionShowState[],
        refetchInterval: 3000
    });
    const showState = showStates?.[0];

    const { data: contestants = [] } = useQuery({
        queryKey: ['contestants'],
        queryFn: async () => (await supabase.entities.Contestant.list('-total_score')) as AuditionContestant[],
        refetchInterval: 5000
    });

    const { data: judges = [] } = useQuery({
        queryKey: ['judges'],
        queryFn: async () => (await supabase.entities.Judge.list()) as AuditionJudge[]
    });

    const { data: gifts = [] } = useQuery({
        queryKey: ['gifts'],
        queryFn: async () => (await supabase.entities.Gift.list('coin_cost')) as AuditionGift[]
    });

    const currentContestant = contestants.find((c) => c.id === showState?.current_contestant_id);
    const isJudge =
        !!currentUser?.is_judge || currentUser?.role === 'judge' || judges.some((j) => j.user_email === currentUser?.email);

    const availableGifts = useMemo<AuditionGift[]>(() => {
        if (gifts && gifts.length > 0) return gifts;
        return [
            { id: 'sparkles', name: 'Sparkles', icon: '✨', coin_cost: 50, vote_value: 5 },
            { id: 'applause', name: 'Applause', icon: '👏', coin_cost: 100, vote_value: 10 },
            { id: 'rose', name: 'Rose Bouquet', icon: '🌹', coin_cost: 250, vote_value: 25 },
            { id: 'diamond', name: 'Diamond', icon: '💎', coin_cost: 1000, vote_value: 100 },
            { id: 'crown', name: 'Royal Crown', icon: '👑', coin_cost: 2500, vote_value: 300 },
            { id: 'fireworks', name: 'Fireworks', icon: '🎆', coin_cost: 5000, vote_value: 700 }
        ];
    }, [gifts]);

    useEffect(() => {
        const endTimeStr = showState?.performance_end_time;
        if (showState?.is_live && endTimeStr) {
            const interval = setInterval(() => {
                const endTime = new Date(endTimeStr).getTime();
                // Time remaining logic removed as timeRemaining is unused
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showState?.is_live, showState?.performance_end_time]);

    const sendGiftMutation = useMutation<void, unknown, AuditionGift>({
        mutationFn: async (gift: AuditionGift) => {
            await supabase.auth.updateMe({
                coins: (currentUser?.coins || 0) - gift.coin_cost
            });
            if (!currentContestant) return;
            const nextEarnings = (currentContestant.total_earnings || 0) + gift.coin_cost;
            await supabase.entities.Contestant.update(currentContestant.id, {
                gifts_received: (currentContestant.gifts_received || 0) + 1,
                votes: (currentContestant.votes || 0) + gift.vote_value,
                total_score: (currentContestant.total_score || 0) + gift.vote_value,
                total_earnings: nextEarnings
            });
            await supabase.entities.ChatMessage.create({
                user_name: currentUser?.full_name || 'Anonymous',
                user_email: currentUser?.email,
                message: `to ${currentContestant.name || ''}!`,
                type: 'gift',
                gift_type: gift.icon,
                gift_amount: gift.coin_cost,
                contestant_id: currentContestant.id
            });
            const updatedUser = await supabase.auth.me();
            setCurrentUser(updatedUser as AuditionUser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contestants'] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        }
    });

    const { data: judgeNotes = [] } = useQuery({
        queryKey: ['judgeNotes', showState?.current_contestant_id, 'audition'],
        queryFn: async () => {
            if (!showState?.current_contestant_id) return [];
            const notes = await supabase.entities.ChatMessage.filter({
                type: 'system',
                contestant_id: showState.current_contestant_id
            });
            return notes;
        },
        enabled: !!showState?.current_contestant_id
    });

    const addJudgeNoteMutation = useMutation<void, unknown, string>({
        mutationFn: async (text: string) => {
            if (!user?.email || !showState?.current_contestant_id) return;
            const trimmed = text.trim();
            if (!trimmed) return;
            await supabase.entities.ChatMessage.create({
                user_name: currentUser?.full_name || 'Judge',
                user_email: user.email,
                message: trimmed,
                type: 'system',
                contestant_id: showState.current_contestant_id
            });
        },
        onSuccess: () => {
            setJudgeNoteText('');
            queryClient.invalidateQueries({
                queryKey: ['judgeNotes', showState?.current_contestant_id, 'audition']
            });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        }
    });

    return (
        <Layout currentPageName="Audition">
            <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
                <div className="h-full flex justify-center px-4 py-6">
                    <div className="w-full max-w-6xl h-full grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)] grid-rows-[minmax(0,1.5fr)_minmax(0,1fr)] gap-y-0 gap-x-0">
                        <div className="row-start-1 col-start-1 h-full">
                            <CurtainStage
                                roomType="audition"
                                onReady={() => {
                                    // Handle ready state
                                    console.log('Contestant is ready for audition');
                                }}
                            />
                        </div>

                        <div className="row-start-1 col-start-2 flex items-stretch">
                            <div className="w-full">
                                <JudgePanel roomType="audition" />
                            </div>
                        </div>

                        <div className="row-start-2 col-start-2 mt-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                            <JudgeQueuePanel roomType="audition" />
                            <GiftPanel
                                gifts={availableGifts}
                                userCoins={currentUser?.coins || 0}
                                contestant={currentContestant}
                                onSendGift={(gift) => sendGiftMutation.mutate(gift)}
                                isLoading={sendGiftMutation.isPending}
                            />
                            {isJudge && currentContestant && (
                                <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-white text-sm">
                                            Judge Notes
                                        </h3>
                                        <span className="text-[11px] text-slate-400">
                                            Shared between all judges
                                        </span>
                                    </div>
                                    <div className="space-y-2 max-h-28 overflow-y-auto text-xs">
                                        {judgeNotes.length === 0 && (
                                            <p className="text-slate-500">No notes yet.</p>
                                        )}
                                        {judgeNotes.map((note: any) => (
                                            <div
                                                key={note.id}
                                                className="rounded-lg border border-white/10 px-2 py-1.5"
                                            >
                                                <p className="text-[11px] text-slate-400 font-medium truncate">
                                                    {note.user_name}
                                                </p>
                                                <p className="text-xs text-slate-100 break-words">
                                                    {note.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Textarea
                                            value={judgeNoteText}
                                            onChange={(e) => setJudgeNoteText(e.target.value)}
                                            placeholder="Add a note for other judges..."
                                            className="bg-slate-900/60 border-white/10 text-white text-xs resize-none"
                                            rows={2}
                                        />
                                        <Button
                                            disabled={
                                                !judgeNoteText.trim() || addJudgeNoteMutation.isPending
                                            }
                                            onClick={() => addJudgeNoteMutation.mutate(judgeNoteText)}
                                            className="self-start bg-purple-600 hover:bg-purple-700 text-xs px-3 py-2"
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
