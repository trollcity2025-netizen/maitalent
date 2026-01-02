import type React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion as motionBase } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    ArrowLeft, Coins, Gift, Trophy, Star, 
    Mail, LogOut, Crown, Upload
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { requestGiftCardPayout, type PayoutRequestRow } from '@/lib/payouts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import Layout from '@/Layouts/Layout';

const motion = motionBase;

type UserProfile = {
    id?: string;
    coins?: number;
    total_votes_cast?: number;
    favorite_contestants?: unknown[] | null;
    profile_picture?: string | null;
    full_name?: string | null;
    email?: string | null;
    is_judge?: boolean;
    role?: string | null;
    level?: number | null;
    lifetime_coin_spend?: number | null;
};

type WeeklyWinnerRow = {
    id: string;
    week_id: string;
    rank: number;
    reward_amount: number;
    created_at: string;
};

type TransactionRow = {
    id: string;
    type: string;
    amount_coins: number | null;
    amount_usd: number | null;
    details: string | null;
    related_user_id: string | null;
    week_id: string | null;
    created_at: string;
};

export default function Profile() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [editName, setEditName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [requestingWeekId, setRequestingWeekId] = useState<string | null>(null);
    const [payoutError, setPayoutError] = useState<string | null>(null);
    const [revealedPayoutId, setRevealedPayoutId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser);
                setEditName(currentUser?.full_name || '');
            } catch {
                supabase.auth.redirectToLogin();
            }
        };
        fetchUser();
    }, []);

    const handleProfileSave = async () => {
        if (!user) return;
        const nextName = editName.trim();
        if (!nextName) return;
        setIsSavingProfile(true);
        try {
            await supabase.auth.updateMe({ full_name: nextName });
            const updatedUser = await supabase.auth.me();
            setUser(updatedUser);
        } catch (e) {
            console.error(e);
        }
        setIsSavingProfile(false);
    };

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file) {
            setIsUploading(true);
            try {
                const { file_url } = await supabase.integrations.Core.UploadFile({ file });
                await supabase.auth.updateMe({ profile_picture: file_url });
                const updatedUser = await supabase.auth.me();
                setUser(updatedUser);
            } catch (e) {
                console.error(e);
            }
            setIsUploading(false);
        }
    };

    // Check if user is a contestant
    const { data: myContestant } = useQuery({
        queryKey: ['myContestant', user?.email],
        queryFn: () => supabase.entities.Contestant.filter({ email: user?.email }),
        enabled: !!user?.email
    });
    
    const contestant = myContestant?.[0];

    const { data: payoutRequests = [], refetch: refetchPayouts } = useQuery<PayoutRequestRow[]>({
        queryKey: ['payoutRequests', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('payout_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('requested_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as PayoutRequestRow[];
        },
        enabled: !!user?.id
    });

    const { data: weeklyWinners = [] } = useQuery<WeeklyWinnerRow[]>({
        queryKey: ['weeklyWinners', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('weekly_winners')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as WeeklyWinnerRow[];
        },
        enabled: !!user?.id
    });

    const { data: transactions = [] } = useQuery<TransactionRow[]>({
        queryKey: ['transactions', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as TransactionRow[];
        },
        enabled: !!user?.id
    });

    const payoutRequestsByWeek = useMemo(() => {
        const map = new Map<string, PayoutRequestRow>();
        payoutRequests.forEach((p) => {
            map.set(p.week_id, p);
        });
        return map;
    }, [payoutRequests]);

    const handleRequestPayout = async (weekId: string) => {
        if (!user?.id) return;
        setRequestingWeekId(weekId);
        setPayoutError(null);
        try {
            const result = await requestGiftCardPayout(user.id, weekId);
            if (result.error) {
                setPayoutError(result.error.message);
            } else {
                await refetchPayouts();
            }
        } catch (e) {
            if (e instanceof Error) {
                setPayoutError(e.message);
            } else {
                setPayoutError('Failed to request payout');
            }
        }
        setRequestingWeekId(null);
    };

    const handleLogout = () => {
        supabase.auth.logout('/');
    };

    const computeLevel = (profile: UserProfile | null): number => {
        if (!profile) {
            return 1;
        }
        if (profile.level && profile.level > 0) {
            return profile.level;
        }
        const spend = profile.lifetime_coin_spend || 0;
        if (spend >= 60000) return 5;
        if (spend >= 30000) return 4;
        if (spend >= 15000) return 3;
        if (spend >= 5000) return 2;
        return 1;
    };

    const userLevel = computeLevel(user);

    if (!user) {
        return (
            <Layout currentPageName="Profile">
            <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
            </Layout>
        );
    }

    const stats = [
        { label: 'Coins', value: user.coins || 0, icon: Coins, color: 'text-amber-400' },
        { label: 'Votes Cast', value: user.total_votes_cast || 0, icon: Star, color: 'text-purple-400' },
        { label: 'Favorites', value: user.favorite_contestants?.length || 0, icon: Gift, color: 'text-pink-400' }
    ];

    return (
        <Layout currentPageName="Profile">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link to={createPageUrl('Home')}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex-1">My Profile</h1>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleLogout}
                        className="text-slate-400 hover:text-white hover:bg-white/10"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="mb-2 bg-slate-900/60 border border-white/10">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="transactions">Transaction History</TabsTrigger>
                        <TabsTrigger value="messages">Messages</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 border border-white/10"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                                <div className="relative">
                                    <Avatar className="w-24 h-24 border-4 border-purple-500">
                                        <AvatarImage src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random&size=96`} />
                                        <AvatarFallback className="bg-purple-600 text-white text-2xl">
                                            {user.full_name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-100 transition-colors">
                                        <Upload className="w-4 h-4 text-slate-600" />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleProfilePictureUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                        <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                                        <Badge className="bg-slate-800 text-amber-400 border border-amber-500/40">
                                            Level {userLevel}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 flex items-center gap-2 justify-center md:justify-start">
                                        <Mail className="w-4 h-4" />
                                        {user.email}
                                    </p>
                                    <div className="flex gap-2 mt-3 justify-center md:justify-start">
                                        {user.is_judge && (
                                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                                                <Crown className="w-3 h-3 mr-1" />
                                                Judge
                                            </Badge>
                                        )}
                                        {user.role === 'admin' && (
                                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                                                Admin
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {stats.map((stat, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-white/5 rounded-xl p-4 text-center"
                                    >
                                        <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                                        <p className={`text-2xl font-bold ${stat.color}`}>
                                            {stat.value.toLocaleString()}
                                        </p>
                                        <p className="text-sm text-slate-400">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="mt-6 border-t border-white/10 pt-4">
                                <h3 className="text-sm font-semibold text-white mb-3">Edit Profile</h3>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <Input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Full name"
                                        className="flex-1 bg-slate-900/60 border-white/10 text-white"
                                    />
                                    <Button
                                        className="md:w-auto w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                        onClick={handleProfileSave}
                                        disabled={isSavingProfile}
                                    >
                                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {contestant && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur rounded-2xl p-6 border border-purple-500/30"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-5 h-5 text-purple-400" />
                                    <h3 className="text-lg font-semibold text-white">Contestant Status</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400">Stage Name</p>
                                        <p className="text-white font-medium">{contestant.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Status</p>
                                        <Badge className={
                                            contestant.status === 'approved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                            contestant.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                            contestant.status === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                            'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                                        }>
                                            {contestant.status?.toUpperCase()}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Total Score</p>
                                        <p className="text-amber-400 font-bold">{(contestant.total_score || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Gifts Received</p>
                                        <p className="text-pink-400 font-bold">{contestant.gifts_received || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-400">Gift Balance</p>
                                        <p className="text-emerald-400 font-bold">
                                            ${(((contestant.total_earnings || 0) / 100) || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: contestant ? 0.2 : 0.1 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Weekly Competition Rewards
                                    </h3>
                                    {weeklyWinners.length === 0 ? (
                                        <p className="text-sm text-slate-400">
                                            You are not eligible for payout. Only Top 3 weekly winners can request gift card payouts.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {weeklyWinners.map((winner) => {
                                                const payout = payoutRequestsByWeek.get(winner.week_id);
                                                const hasRequested = !!payout;
                                                const isComplete = payout && (payout.status === 'issued' || payout.status === 'delivered' || payout.status === 'redeemed');
                                                return (
                                                    <div
                                                        key={winner.id}
                                                        className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                    >
                                                        <div>
                                                            <p className="text-sm text-white font-medium">
                                                                Week {winner.week_id} • Rank #{winner.rank}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                Reward ${ (winner.reward_amount / 100).toFixed(2) }
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {hasRequested && (
                                                                <span
                                                                    className={
                                                                        isComplete
                                                                            ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                                            : 'text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                    }
                                                                >
                                                                    {payout?.status.toUpperCase()}
                                                                </span>
                                                            )}
                                                            {!hasRequested && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
                                                                    disabled={requestingWeekId === winner.week_id}
                                                                    onClick={() => handleRequestPayout(winner.week_id)}
                                                                >
                                                                    {requestingWeekId === winner.week_id ? 'Requesting...' : 'Request Payout'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {payoutError && (
                                        <p className="mt-3 text-sm text-red-400">
                                            {payoutError}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">
                                        Withdrawal History
                                    </h3>
                                    {payoutRequests.length === 0 ? (
                                        <p className="text-sm text-slate-400">
                                            No withdrawal requests yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {payoutRequests.map((payout) => {
                                        const amount = payout.amount || 0;
                                        const maskedCode =
                                            payout.code && payout.code.length > 4
                                                ? payout.code.replace(/.(?=.{4})/g, '*')
                                                : payout.code || '';
                                        const isComplete =
                                            payout.status === 'issued' ||
                                            payout.status === 'delivered' ||
                                            payout.status === 'redeemed';
                                        const isRevealed = revealedPayoutId === payout.id;
                                        return (
                                            <div
                                                key={payout.id}
                                                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm text-white font-medium">
                                                        ${amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(payout.requested_at).toLocaleDateString()}
                                                    </p>
                                                    {payout.provider && (
                                                        <p className="text-xs text-slate-500">
                                                            {payout.provider}
                                                        </p>
                                                    )}
                                                    {isComplete && payout.code && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRevealedPayoutId(
                                                                    isRevealed ? null : payout.id
                                                                )
                                                            }
                                                            className="mt-1 text-xs text-emerald-400 hover:text-emerald-300"
                                                        >
                                                            {isRevealed ? payout.code : maskedCode || 'Tap to reveal code'}
                                                        </button>
                                                    )}
                                                </div>
                                                <span
                                                    className={
                                                        isComplete
                                                            ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                            : payout.status === 'rejected'
                                                            ? 'text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                                                            : 'text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                    }
                                                >
                                                    {payout.status.toUpperCase()}
                                                </span>
                                            </div>
                                        );
                                    })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <Link to={createPageUrl('CoinStore')}>
                                <Button className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90">
                                    <Coins className="w-5 h-5 mr-2" />
                                    Buy Coins
                                </Button>
                            </Link>
                            {!contestant && (
                                <Link to={createPageUrl('Apply')}>
                                    <Button className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                                        <Star className="w-5 h-5 mr-2" />
                                        Apply to Perform
                                    </Button>
                                </Link>
                            )}
                            {contestant && (
                                <Link to={createPageUrl('Home')}>
                                    <Button className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                                        <Trophy className="w-5 h-5 mr-2" />
                                        View Leaderboard
                                    </Button>
                                </Link>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="transactions" className="space-y-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
                            {transactions.length === 0 ? (
                                <p className="text-sm text-slate-400">
                                    No transactions yet.
                                </p>
                            ) : (
                                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                                    {transactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                        >
                                            <div>
                                                <p className="text-sm text-white font-medium capitalize">
                                                    {tx.type}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </p>
                                                {tx.details && (
                                                    <p className="text-xs text-slate-500">
                                                        {tx.details}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {tx.amount_coins !== null && (
                                                    <p className="text-sm text-amber-400 font-semibold">
                                                        {tx.amount_coins} coins
                                                    </p>
                                                )}
                                                {tx.amount_usd !== null && (
                                                    <p className="text-sm text-emerald-400 font-semibold">
                                                        ${tx.amount_usd.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="messages">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                        >
                            <h3 className="text-lg font-semibold text-white mb-2">Messages</h3>
                            <p className="text-sm text-slate-400 mb-4">
                                View your inbox and chat with fans and contestants.
                            </p>
                            <Link to={createPageUrl('Messages')}>
                                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                                    Open Messages
                                </Button>
                            </Link>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        </Layout>
    );
}
