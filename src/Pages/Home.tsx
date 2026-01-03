import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import LiveChat from '@/Components/stage/LiveChat';
import { CurtainStage } from '@/Components/stage/CurtainStage';
import { JudgeQueuePanel } from '@/Components/admin/JudgeQueuePanel';
import { JudgePanel } from '@/Components/stage/JudgePanel';
import GiftPanel from '@/Components/stage/GiftPanel';
import WelcomeTour from '@/Components/tour/WelcomeTour';
import Layout from '@/Layouts/Layout';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';

type HomeUser = {
    has_completed_tour?: boolean;
    is_judge?: boolean;
    email?: string | null;
    full_name?: string | null;
    coins?: number;
    role?: string | null;
};

type ShowStateRecord = {
    id: string;
    is_live?: boolean;
    performance_end_time?: string | null;
    current_contestant_id?: string | null;
    curtains_open?: boolean;
    viewer_count?: number;
};

type ContestantItem = {
    id: string;
    name?: string;
    status?: string;
    gifts_received?: number;
    votes?: number;
    total_score?: number;
    email?: string;
    total_earnings?: number;
};

type JudgeItem = {
    id: string;
    seat_number: number;
    user_email?: string | null;
    display_name?: string;
};

type GiftItem = {
    id: string;
    name: string;
    icon: React.ReactNode;
    coin_cost: number;
    vote_value: number;
};

export default function Home() {
    const queryClient = useQueryClient();
    const [showTour, setShowTour] = useState(false);
    const [user, setUser] = useState<HomeUser | null>(null);
    const [judgeNoteText, setJudgeNoteText] = useState('');
    const [judgePanelOpen, setJudgePanelOpen] = useState(false);
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
    
    // Queue management
    // Removed unused authUser and queueManager

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser as HomeUser);
                if (!(currentUser as HomeUser).has_completed_tour) {
                    setShowTour(true);
                }
            } catch (e) {
                // Not logged in
            }
        };
        fetchUser();
    }, []);

    // Fetch show state
    const { data: showStates } = useQuery<ShowStateRecord[]>({
        queryKey: ['showState'],
        queryFn: async () => (await supabase.entities.ShowState.list()) as ShowStateRecord[],
        refetchInterval: 3000
    });
    const showState = showStates?.[0];

    // Fetch contestants
    const { data: contestants = [] } = useQuery<ContestantItem[]>({
        queryKey: ['contestants'],
        queryFn: async () => (await supabase.entities.Contestant.list('-total_score')) as ContestantItem[],
        refetchInterval: 5000
    });

    // Fetch judges
    const { data: judges = [] } = useQuery<JudgeItem[]>({
        queryKey: ['judges'],
        queryFn: async () => (await supabase.entities.Judge.list()) as JudgeItem[]
    });

    // Fetch gifts
    const { data: gifts = [] } = useQuery<GiftItem[]>({
        queryKey: ['gifts'],
        queryFn: async () => (await supabase.entities.Gift.list('coin_cost')) as GiftItem[]
    });

    // Fetch chat messages
    const { data: chatMessages = [] } = useQuery<any[]>({
        queryKey: ['chatMessages'],
        queryFn: () => supabase.entities.ChatMessage.list('-created_date', 50),
        refetchInterval: 2000
    });

    const currentContestant = contestants.find((c: ContestantItem) => c.id === showState?.current_contestant_id);
    const isJudge =
        !!user?.is_judge || user?.role === 'judge' || judges.some((j: JudgeItem) => j.user_email === user?.email);

    const availableGifts = useMemo<GiftItem[]>(() => {
        if (gifts && gifts.length > 0) return gifts;
        return [
            { id: 'sparkles', name: 'Sparkles', icon: '✨', coin_cost: 50, vote_value: 5 },
            { id: 'applause', name: 'Applause', icon: '👏', coin_cost: 100, vote_value: 10 },
            { id: 'rose', name: 'Rose Bouquet', icon: '🌹', coin_cost: 250, vote_value: 25 },
            { id: 'hearts', name: 'Hearts', icon: '❤️', coin_cost: 500, vote_value: 50 },
            { id: 'diamond', name: 'Diamond', icon: '💎', coin_cost: 1000, vote_value: 100 },
            { id: 'crown', name: 'Royal Crown', icon: '👑', coin_cost: 2500, vote_value: 300 },
            { id: 'fireworks', name: 'Fireworks', icon: '🎆', coin_cost: 5000, vote_value: 700 },
            { id: 'rocket', name: 'Rocket', icon: '🚀', coin_cost: 10000, vote_value: 1500 },
            { id: 'unicorn', name: 'Unicorn', icon: '🦄', coin_cost: 25000, vote_value: 4000 },
            { id: 'rainbow', name: 'Rainbow', icon: '🌈', coin_cost: 50000, vote_value: 8000 }
        ] as GiftItem[];
    }, [gifts]);

    // Timer effect
    useEffect(() => {
        const endTimeStr = showState?.performance_end_time;
        if (showState?.is_live && endTimeStr) {
            const interval = setInterval(() => {
                // Removed unused endTime and remaining variables
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [showState?.is_live, showState?.performance_end_time]);

    // Mutations
    const sendMessageMutation = useMutation<void, unknown, string>({
        mutationFn: async (message: string) => {
            await supabase.entities.ChatMessage.create({
                user_name: user?.full_name || 'Anonymous',
                user_email: user?.email,
                message,
                type: 'chat'
            });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chatMessages'] })
    });

    const sendGiftMutation = useMutation<void, unknown, GiftItem>({
        mutationFn: async (gift: GiftItem) => {
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
            setUser(updatedUser as HomeUser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contestants'] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        }
    });

    const approveContestantMutation = useMutation<void, unknown, string>({
        mutationFn: async (id: string) => {
            await supabase.entities.Contestant.update(id, { status: 'approved' });
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contestants'] })
    });

    const rejectContestantMutation = useMutation<void, unknown, string>({
        mutationFn: async (id: string) => {
            await supabase.entities.Contestant.update(id, { status: 'rejected' });
        },
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
        }
    });

    const joinJudgeSeatMutation = useMutation<void, unknown, number>({
        mutationFn: async (seatNumber: number) => {
            if (!user?.email) return;

            const existingJudges = await supabase.entities.Judge.filter({ user_email: user.email }) as JudgeItem[];
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
        queryKey: ['judgeNotes', showState?.current_contestant_id],
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
            queryClient.invalidateQueries({ queryKey: ['judgeNotes', showState?.current_contestant_id] });
            queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
        }
    });

    const handleTourComplete = async () => {
        setShowTour(false);
        if (user) {
            await supabase.auth.updateMe({ has_completed_tour: true });
        }
    };


    return (
        <Layout currentPageName="Home">
            <div className="h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
                <WelcomeTour isOpen={showTour} onComplete={handleTourComplete} />

                <div className="h-full flex justify-center px-4 py-6">
                    <div className="w-full max-w-6xl h-full grid grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)] grid-rows-[minmax(0,1.5fr)_minmax(0,1fr)] gap-y-0 gap-x-0">
                        <div className="row-start-1 col-start-1 h-full">
                            <CurtainStage
                                roomType="main_show"
                                onReady={() => {
                                    // Handle ready state
                                    console.log('Contestant is ready for main show');
                                }}
                            />
                        </div>

                        <div className="row-start-1 col-start-2 flex items-stretch">
                            <div className="w-full">
                                <JudgePanel roomType="main_show" />
                            </div>
                        </div>

                        <div className="row-start-2 col-start-1 min-h-0">
                            <LiveChat
                                messages={chatMessages as any}
                                onSendMessage={(msg) => sendMessageMutation.mutate(msg)}
                                currentUser={user}
                            />
                        </div>

                        <div className="row-start-2 col-start-2 mt-4 flex flex-col gap-4 min-h-0 overflow-hidden">
                            <JudgeQueuePanel roomType="main_show" />
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
                                        <h3 className="font-semibold text-white text-sm">Judge Notes</h3>
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

            {/* Judge Panel Overlay */}
            {isJudge && (
                <>
                    {/* Judge Panel Toggle Button */}
                    <div
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setJudgePanelOpen(!judgePanelOpen)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white border-none shadow-lg"
                        >
                            {judgePanelOpen ? 'Close' : 'Open'} Judge Panel
                        </Button>
                    </div>

                    {/* Judge Panel Overlay */}
                    {judgePanelOpen && (
                        <div className="fixed top-20 right-6 w-96 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/20 z-40">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h3 className="font-semibold text-white">Judge Panel</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setJudgePanelOpen(false)}
                                    className="text-white hover:bg-white/10"
                                >
                                    ✕
                                </Button>
                            </div>
                            <div className="p-4 space-y-4">
                                {/* Contestant Queue */}
                                <div className="bg-white/5 rounded-xl p-3">
                                    <h4 className="text-sm font-medium text-white mb-2">Contestant Queue</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {contestants.filter(c => c.status === 'pending').map((contestant) => (
                                            <div key={contestant.id} className="flex items-center justify-between p-2 bg-white/10 rounded">
                                                <span className="text-xs text-white truncate">{contestant.name}</span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => approveContestantMutation.mutate(contestant.id)}
                                                        className="text-green-400 hover:text-green-300 text-xs"
                                                    >
                                                        ✓
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => rejectContestantMutation.mutate(contestant.id)}
                                                        className="text-red-400 hover:text-red-300 text-xs"
                                                    >
                                                        ✗
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Live Contestants */}
                                <div className="bg-white/5 rounded-xl p-3">
                                    <h4 className="text-sm font-medium text-white mb-2">Live Contestants</h4>
                                    <div className="space-y-2">
                                        {contestants.filter(c => c.status === 'approved').map((contestant) => (
                                            <div key={contestant.id} className="flex items-center justify-between p-2 bg-white/10 rounded">
                                                <span className="text-xs text-white truncate">{contestant.name}</span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => bringToStageMutation.mutate(contestant.id)}
                                                    disabled={!!showState?.current_contestant_id}
                                                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs"
                                                >
                                                    Go Live
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Judge Controls */}
                                <div className="bg-white/5 rounded-xl p-3">
                                    <h4 className="text-sm font-medium text-white mb-2">Your Controls</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                            <Button
                                                key={score}
                                                size="sm"
                                                variant="outline"
                                                className="border-white/30 text-white hover:bg-white/20 text-xs"
                                            >
                                                {score}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        className="w-full mt-2 bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Buzz
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Seat Selection Modal */}
            {selectedSeat && isJudge && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 shadow-2xl border border-white/20 w-96">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white text-lg">Choose Your Seat</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSeat(null)}
                                className="text-white hover:bg-white/10"
                            >
                                ✕
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-300">
                                {user?.role === 'admin'
                                    ? `You are about to ${judges.find(j => j.user_email === user.email) ? 'move to' : 'join'} seat ${selectedSeat}. This will start your live broadcast.`
                                    : `You are about to join seat ${selectedSeat}. This will start your live broadcast.`
                                }
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        joinJudgeSeatMutation.mutate(selectedSeat);
                                        setSelectedSeat(null);
                                    }}
                                    disabled={joinJudgeSeatMutation.isPending}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white"
                                >
                                    {joinJudgeSeatMutation.isPending
                                        ? 'Processing...'
                                        : user?.role === 'admin'
                                            ? judges.find(j => j.user_email === user.email)
                                                ? 'Move Seat'
                                                : 'Join Seat'
                                            : 'Join Seat'
                                    }
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedSeat(null)}
                                    className="border-white/30 text-white hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
