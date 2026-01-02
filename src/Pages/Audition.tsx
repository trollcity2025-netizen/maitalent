import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import TheaterStage from '@/Components/stage/TheaterStage';
import JudgeBox from '@/Components/stage/JudgeBox';
import GiftPanel from '@/Components/stage/GiftPanel';
import Layout from '@/Layouts/Layout';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';

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
    const [user, setUser] = useState<AuditionUser | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(120);
    const [judgeScores, setJudgeScores] = useState<Record<number, number>>({});
    const [buzzedJudges, setBuzzedJudges] = useState<Record<number, boolean>>({});
    const [judgeNoteText, setJudgeNoteText] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser);
            } catch (e) {}
        };
        fetchUser();
    }, []);

    const { data: showStates } = useQuery<AuditionShowState[]>({
        queryKey: ['showState'],
        queryFn: () => supabase.entities.ShowState.list(),
        refetchInterval: 3000
    });
    const showState = showStates?.[0];

    const { data: contestants = [] } = useQuery<AuditionContestant[]>({
        queryKey: ['contestants'],
        queryFn: () => supabase.entities.Contestant.list('-total_score'),
        refetchInterval: 5000
    });

    const { data: judges = [] } = useQuery<AuditionJudge[]>({
        queryKey: ['judges'],
        queryFn: () => supabase.entities.Judge.list()
    });

    const { data: gifts = [] } = useQuery<AuditionGift[]>({
        queryKey: ['gifts'],
        queryFn: () => supabase.entities.Gift.list('coin_cost')
    });

    const currentContestant = contestants.find((c) => c.id === showState?.current_contestant_id);
    const isJudge =
        !!user?.is_judge || user?.role === 'judge' || judges.some((j) => j.user_email === user?.email);
    const isSelfOnStage =
        !!currentContestant && !!user?.email && currentContestant.email === user.email;

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
                const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
                setTimeRemaining(remaining);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showState?.is_live, showState?.performance_end_time]);

    const sendGiftMutation = useMutation<void, unknown, AuditionGift>({
        mutationFn: async (gift: AuditionGift) => {
            await supabase.auth.updateMe({
                coins: (user?.coins || 0) - gift.coin_cost
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
                user_name: user?.full_name || 'Anonymous',
                user_email: user?.email,
                message: `to ${currentContestant.name || ''}!`,
                type: 'gift',
                gift_type: gift.icon,
                gift_amount: gift.coin_cost,
                contestant_id: currentContestant.id
            });
            const updatedUser = await supabase.auth.me();
            setUser(updatedUser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contestants'] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        }
    });

    const approveContestantMutation = useMutation<void, unknown, string>({
        mutationFn: async (id: string) =>
            supabase.entities.Contestant.update(id, { status: 'approved' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contestants'] })
    });

    const rejectContestantMutation = useMutation<void, unknown, string>({
        mutationFn: async (id: string) =>
            supabase.entities.Contestant.update(id, { status: 'rejected' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contestants'] })
    });

    const bringToStageMutation = useMutation<void, unknown, string>({
        mutationFn: async (contestantId: string) => {
            const endTime = new Date(Date.now() + 2 * 60 * 1000).toISOString();
            if (!showState) return;
            await supabase.entities.ShowState.update(showState.id, {
                is_live: true,
                current_contestant_id: contestantId,
                curtains_open: true,
                performance_end_time: endTime
            });
            await supabase.entities.Contestant.update(contestantId, { status: 'live' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['showState'] });
            queryClient.invalidateQueries({ queryKey: ['contestants'] });
            setJudgeScores({});
            setBuzzedJudges({});
        }
    });

    const joinJudgeSeatMutation = useMutation<void, unknown, number>({
        mutationFn: async (seatNumber: number) => {
            if (!user?.email) return;

            const existingJudges = await supabase.entities.Judge.filter({ user_email: user.email });
            const existingJudge = existingJudges[0];

            if (existingJudge) {
                await supabase.entities.Judge.update(existingJudge.id, {
                    seat_number: seatNumber,
                    is_active: true
                });
            } else {
                await supabase.entities.Judge.create({
                    user_email: user.email,
                    display_name: user.full_name || 'Judge',
                    seat_number: seatNumber,
                    is_active: true,
                    application_status: 'approved'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['judges'] });
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
                user_name: user.full_name || 'Judge',
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

    const handleJudgeScore = async (judgeId: number, score: number) => {
        setJudgeScores((prev) => ({ ...prev, [judgeId]: score }));
    };

    const handleJudgeBuzz = async (judgeId: number) => {
        setBuzzedJudges((prev) => ({ ...prev, [judgeId]: true }));
    };

    return (
        <Layout currentPageName="Audition">
            <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
                <div className="h-full flex justify-center px-4 py-6">
                    <div className="w-full max-w-6xl h-full grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)] grid-rows-[minmax(0,1.5fr)_minmax(0,1fr)] gap-y-0 gap-x-0">
                        <div className="row-start-1 col-start-1 h-full">
                            <TheaterStage
                                contestant={currentContestant}
                                isLive={showState?.is_live}
                                curtainsOpen={showState?.curtains_open}
                                timeRemaining={timeRemaining}
                                viewerCount={showState?.viewer_count || 0}
                                enableLocalStream={isSelfOnStage}
                            />
                        </div>

                        <div className="row-start-1 col-start-2 flex items-stretch">
                            <div className="w-full grid grid-cols-2 grid-rows-2 gap-3">
                                {[1, 2, 3, 4].map((seatNum) => {
                                    const judge = judges.find((j) => j.seat_number === seatNum);
                                    const isCurrentUserJudge = judge?.user_email === user?.email;
                                    const canJoinSeat = !judge && isJudge;
                                    return (
                                        <JudgeBox
                                            key={seatNum}
                                            judge={judge}
                                            seatNumber={seatNum}
                                            isCurrentUserJudge={isCurrentUserJudge}
                                            currentScore={judgeScores[seatNum]}
                                            hasBuzzed={buzzedJudges[seatNum]}
                                            onScore={(score) => handleJudgeScore(seatNum, score)}
                                            onBuzz={() => handleJudgeBuzz(seatNum)}
                                            onJoinSeat={
                                                canJoinSeat
                                                    ? () => joinJudgeSeatMutation.mutate(seatNum)
                                                    : undefined
                                            }
                                            contestants={contestants}
                                            currentContestantId={showState?.current_contestant_id}
                                            onApproveContestant={(id) =>
                                                approveContestantMutation.mutate(id)
                                            }
                                            onRejectContestant={(id) =>
                                                rejectContestantMutation.mutate(id)
                                            }
                                            onBringContestantToStage={(id) =>
                                                bringToStageMutation.mutate(id)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        <div className="row-start-2 col-start-2 mt-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                            <GiftPanel
                                gifts={availableGifts}
                                userCoins={user?.coins || 0}
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
