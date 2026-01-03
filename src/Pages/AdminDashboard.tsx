import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion as motionBase } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Gift,
    LogOut,
    Megaphone,
    Search,
    ShieldAlert,
    Star,
    UserX,
    Users,
    CalendarPlus
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/Components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import Layout from '@/Layouts/Layout';
import { issueGiftCardPayout, type PayoutRequestRow } from '@/lib/payouts';

const motion: any = motionBase;

type AdminUser = {
    id?: string;
    coins?: number;
    total_votes_cast?: number;
    email?: string | null;
    full_name?: string | null;
    role?: string | null;
};

type AdminPayoutRow = PayoutRequestRow & {
    users?: {
        full_name: string | null;
        email: string | null;
    } | null;
};

type WeeklyCompetitionRow = {
    id: string;
    start_date: string;
    end_date: string;
    status: string;
};

type WeeklyWinnerRow = {
    id: string;
    week_id: string;
    user_id: string;
    rank: number;
    reward_amount: number;
    created_at: string;
    users?: {
        full_name: string | null;
        email: string | null;
    } | null;
    weekly_competitions?: {
        start_date: string;
        end_date: string;
        status: string;
    } | null;
};

type ModerationReportRow = {
    id: string;
    created_at: string;
    reporter_user_id: string;
    target_user_id: string;
    reason: string | null;
    status: 'open' | 'resolved' | 'dismissed';
};

type AnnouncementRow = {
    id: string;
    message: string;
    created_at: string;
    created_by: string;
};

type UserSuspensionRow = {
    id: string;
    user_id: string;
    suspended_until: string | null;
    reason: string | null;
    created_by: string | null;
    created_at: string;
};

type AdminUserRow = {
    id: string;
    email?: string | null;
    full_name?: string | null;
    coins?: number | null;
    role?: string | null;
    is_judge?: boolean | null;
};

function formatRelativeTime(iso: string) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    const diffWeek = Math.floor(diffDay / 7);
    if (diffWeek < 4) return `${diffWeek} week${diffWeek === 1 ? '' : 's'} ago`;
    const diffMonth = Math.floor(diffDay / 30);
    if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago`;
    const diffYear = Math.floor(diffDay / 365);
    return `${diffYear} year${diffYear === 1 ? '' : 's'} ago`;
}

async function sendAnnouncement(message: string, adminId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('announcements')
        .insert({
            message,
            created_by: adminId,
            created_at: now
        })
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function suspendUser(
    identifier: string,
    reason: string,
    suspendedUntil: string | null,
    adminId: string
) {
    const trimmed = identifier.trim();
    if (!trimmed) {
        throw new Error('User identifier is required');
    }
    let userId = trimmed;
    if (trimmed.includes('@')) {
        const { data: userLookup, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', trimmed)
            .maybeSingle();
        if (userError) {
            throw userError;
        }
        if (!userLookup) {
            throw new Error('User not found');
        }
        userId = userLookup.id;
    }
    const now = new Date().toISOString();
    const suspensionPayload: Omit<UserSuspensionRow, 'id'> = {
        user_id: userId,
        suspended_until: suspendedUntil,
        reason,
        created_by: adminId,
        created_at: now
    };
    const { data, error } = await supabase
        .from('user_suspensions')
        .insert(suspensionPayload)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function resolveReport(reportId: string, status: 'resolved' | 'dismissed') {
    const { data, error } = await supabase
        .from('moderation_reports')
        .update({ status })
        .eq('id', reportId)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function createWeeklyCompetition(payload: {
    start_date: string;
    end_date: string;
    status: string;
}) {
    const { data, error } = await supabase
        .from('weekly_competitions')
        .insert(payload)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function closeWeeklyCompetition(id: string) {
    const { data, error } = await supabase
        .from('weekly_competitions')
        .update({ status: 'completed' })
        .eq('id', id)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function generateWinnersForCompetition(weekId: string) {
    const { data: contestants, error: contestantsError } = await supabase
        .from('contestants')
        .select('id,user_id,total_score')
        .order('total_score', { ascending: false })
        .limit(3);
    if (contestantsError) {
        throw contestantsError;
    }
    const winners = (contestants || []).map((c: { user_id: string }, index: number) => ({
        week_id: weekId,
        user_id: c.user_id,
        rank: index + 1,
        reward_amount: index === 0 ? 5000 : index === 1 ? 3000 : 2000
    }));
    if (winners.length === 0) {
        return [];
    }
    const { data, error } = await supabase
        .from('weekly_winners')
        .insert(winners)
        .select();
    if (error) {
        throw error;
    }
    return data;
}

export default function AdminDashboard() {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [activeTab, setActiveTab] =
        useState<'overview' | 'payouts' | 'competitions' | 'users' | 'moderation' | 'applications'>('overview');
    const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRow | null>(null);
    const [provider, setProvider] = useState('');
    const [code, setCode] = useState('');
    const [amountInput, setAmountInput] = useState('');
    const [issueError, setIssueError] = useState<string | null>(null);
    const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [announcementError, setAnnouncementError] = useState<string | null>(null);
    const [isSuspendOpen, setIsSuspendOpen] = useState(false);
    const [suspendIdentifier, setSuspendIdentifier] = useState('');
    const [suspendReason, setSuspendReason] = useState('');
    const [suspendUntil, setSuspendUntil] = useState('');
    const [suspendError, setSuspendError] = useState<string | null>(null);
    const [isCreateCompetitionOpen, setIsCreateCompetitionOpen] = useState(false);
    const [newCompetitionStart, setNewCompetitionStart] = useState('');
    const [newCompetitionEnd, setNewCompetitionEnd] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                if (currentUser && currentUser.email === 'trollcity2025@gmail.com') {
                    setUser({ ...currentUser, role: currentUser.role || 'admin' });
                } else {
                    setUser(currentUser);
                }
            } catch {
                supabase.auth.redirectToLogin();
            }
        };
        fetchUser();
    }, []);

    const { data: payoutRequests = [], refetch: refetchPayouts } = useQuery<AdminPayoutRow[]>({
        queryKey: ['adminPayoutRequests'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('payout_requests')
                .select('*, users:user_id(full_name,email)')
                .order('requested_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as AdminPayoutRow[];
        },
        enabled: !!user?.email
    });

    const { data: weeklyCompetitions = [], refetch: refetchCompetitions } = useQuery<
        WeeklyCompetitionRow[]
    >({
        queryKey: ['weeklyCompetitions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('weekly_competitions')
                .select('*')
                .order('start_date', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as WeeklyCompetitionRow[];
        },
        enabled: !!user?.email
    });

    const { data: weeklyWinners = [] } = useQuery<WeeklyWinnerRow[]>({
        queryKey: ['weeklyWinnersAdmin'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('weekly_winners')
                .select(
                    '*, users:user_id(full_name,email), weekly_competitions:week_id(start_date,end_date,status)'
                )
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) {
                throw error;
            }
            return (data || []) as WeeklyWinnerRow[];
        },
        enabled: !!user?.email
    });

    const { data: moderationReports = [], refetch: refetchReports } = useQuery<
        ModerationReportRow[]
    >({
        queryKey: ['moderationReports'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('moderation_reports')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as ModerationReportRow[];
        },
        enabled: !!user?.email
    });

    const { data: announcements = [] } = useQuery<AnnouncementRow[]>({
        queryKey: ['announcements'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) {
                throw error;
            }
            return (data || []) as AnnouncementRow[];
        },
        enabled: !!user?.email
    });

    const { data: userSuspensions = [], refetch: refetchSuspensions } = useQuery<
        UserSuspensionRow[]
    >({
        queryKey: ['userSuspensions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_suspensions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as UserSuspensionRow[];
        },
        enabled: !!user?.email
    });

    const { data: users = [], refetch: refetchUsers } = useQuery<AdminUserRow[]>({
        queryKey: ['adminUsers'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, full_name, coins, role, is_judge')
                .order('created_at', { ascending: false })
                .limit(200);
            if (error) {
                throw error;
            }
            return (data || []) as AdminUserRow[];
        },
        enabled: !!user?.email
    });

    const { data: contestantApplications = [], refetch: refetchContestantApplications } = useQuery<
        any[]
    >({
        queryKey: ['contestantApplications'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contestants')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as any[];
        },
        enabled: !!user?.email
    });

    const { data: judgeApplications = [], refetch: refetchJudgeApplications } = useQuery<
        any[]
    >({
        queryKey: ['judgeApplications'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('judges')
                .select('*')
                .eq('application_status', 'pending')
                .order('created_at', { ascending: false });
            if (error) {
                throw error;
            }
            return (data || []) as any[];
        },
        enabled: !!user?.email
    });

    const issueMutation = useMutation({
        mutationFn: async () => {
            if (!user?.email || !user.id || !selectedPayout) {
                throw new Error('Missing admin or payout information');
            }
            const amountNumber = Number(amountInput);
            if (!provider.trim() || !code.trim() || !amountNumber || amountNumber <= 0) {
                throw new Error('Provider, code, and amount are required');
            }
            const result = await issueGiftCardPayout(
                selectedPayout.id,
                user.id as string,
                provider.trim(),
                code.trim(),
                amountNumber
            );
            if (result.error) {
                throw result.error;
            }
            return result.data;
        },
        onSuccess: () => {
            setIssueError(null);
            setSelectedPayout(null);
            setProvider('');
            setCode('');
            setAmountInput('');
            refetchPayouts();
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to issue gift card';
            setIssueError(message);
        }
    });

    const announcementMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) {
                throw new Error('Missing admin');
            }
            const message = announcementMessage.trim();
            if (!message) {
                throw new Error('Message is required');
            }
            return await sendAnnouncement(message, user.id as string);
        },
        onSuccess: () => {
            setAnnouncementError(null);
            setAnnouncementMessage('');
            setIsAnnouncementOpen(false);
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to send announcement';
            setAnnouncementError(message);
        }
    });

    const suspendMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id) {
                throw new Error('Missing admin');
            }
            const identifier = suspendIdentifier.trim();
            const reason = suspendReason.trim();
            if (!identifier || !reason) {
                throw new Error('User and reason are required');
            }
            const until = suspendUntil ? new Date(suspendUntil).toISOString() : null;
            return await suspendUser(identifier, reason, until, user.id as string);
        },
        onSuccess: () => {
            setSuspendError(null);
            setSuspendIdentifier('');
            setSuspendReason('');
            setSuspendUntil('');
            setIsSuspendOpen(false);
            refetchSuspensions();
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to suspend user';
            setSuspendError(message);
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async (input: { userId: string; changes: Partial<AdminUserRow> }) => {
            const { data, error } = await supabase
                .from('users')
                .update(input.changes)
                .eq('id', input.userId)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            refetchUsers();
        }
    });

    const competitionCreateMutation = useMutation({
        mutationFn: async () => {
            if (!newCompetitionStart || !newCompetitionEnd) {
                throw new Error('Start and end dates are required');
            }
            return await createWeeklyCompetition({
                start_date: newCompetitionStart,
                end_date: newCompetitionEnd,
                status: 'active'
            });
        },
        onSuccess: () => {
            setIsCreateCompetitionOpen(false);
            setNewCompetitionStart('');
            setNewCompetitionEnd('');
            refetchCompetitions();
        }
    });

    const competitionCloseMutation = useMutation({
        mutationFn: async (id: string) => {
            return await closeWeeklyCompetition(id);
        },
        onSuccess: () => {
            refetchCompetitions();
        }
    });

    const competitionWinnersMutation = useMutation({
        mutationFn: async (weekId: string) => {
            return await generateWinnersForCompetition(weekId);
        }
    });

    const reportStatusMutation = useMutation({
        mutationFn: async (input: { id: string; status: 'resolved' | 'dismissed' }) => {
            return await resolveReport(input.id, input.status);
        },
        onSuccess: () => {
            refetchReports();
        }
    });

    const approveContestantMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('contestants')
                .update({ status: 'approved' })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            refetchContestantApplications();
        }
    });

    const rejectContestantMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('contestants')
                .update({ status: 'rejected' })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            refetchContestantApplications();
        }
    });

    const approveJudgeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('judges')
                .update({ application_status: 'approved', is_active: true })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            refetchJudgeApplications();
        }
    });

    const rejectJudgeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data, error } = await supabase
                .from('judges')
                .update({ application_status: 'rejected', is_active: false })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        },
        onSuccess: () => {
            refetchJudgeApplications();
        }
    });

    const [userSearch, setUserSearch] = useState('');

    const unresolvedReportsCount = useMemo(
        () => moderationReports.filter((r) => r.status === 'open').length,
        [moderationReports]
    );

    const activeSuspensionsMap = useMemo(() => {
        const now = new Date();
        const map = new Map<string, UserSuspensionRow>();
        userSuspensions.forEach((s) => {
            if (!s.suspended_until) {
                map.set(s.user_id, s);
                return;
            }
            const until = new Date(s.suspended_until);
            if (until.getTime() > now.getTime()) {
                map.set(s.user_id, s);
            }
        });
        return map;
    }, [userSuspensions]);

    const filteredUsers = useMemo(() => {
        const term = userSearch.trim().toLowerCase();
        if (!term) {
            return users;
        }
        return users.filter((u) => {
            const email = u.email || '';
            const name = u.full_name || '';
            return email.toLowerCase().includes(term) || name.toLowerCase().includes(term);
        });
    }, [users, userSearch]);

    const handleLogout = () => {
        supabase.auth.logout('/');
    };

    if (!user) {
        return (
            <Layout currentPageName="AdminDashboard">
                <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                </div>
            </Layout>
        );
    }

    const statCards = [
        {
            label: 'Coins',
            value: user.coins || 0,
            icon: Gift,
            color: 'text-amber-400'
        },
        {
            label: 'Votes Cast',
            value: user.total_votes_cast || 0,
            icon: Star,
            color: 'text-purple-400'
        },
        {
            label: 'Reports',
            value: unresolvedReportsCount,
            icon: ShieldAlert,
            color: 'text-rose-400'
        }
    ];

    const latestPayouts = payoutRequests.slice(0, 3);

    return (
        <Layout currentPageName="AdminDashboard">
            <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to={createPageUrl('Home')}>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col flex-1">
                            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                            {user.email && (
                                <p className="text-xs text-slate-400 mt-1">{user.email}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-white hover:bg-white/10"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>

                    <Tabs
                        value={activeTab}
                        onValueChange={(value) =>
                            setActiveTab(
                                value as 'overview' | 'payouts' | 'competitions' | 'users' | 'moderation'
                            )
                        }
                        className="space-y-6"
                    >
                        <TabsList className="mb-2 bg-slate-900/60 border border-white/10">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
                            <TabsTrigger value="competitions">Competitions</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="applications">Applications</TabsTrigger>
                            <TabsTrigger value="moderation">Moderation</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {statCards.map((stat, index) => {
                                    const Icon = stat.icon;
                                    return (
                                        <motion.div
                                            key={stat.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-2"
                                        >
                                            <Icon className={`w-6 h-6 ${stat.color}`} />
                                            <div className={`text-2xl font-bold ${stat.color}`}>
                                                {stat.value.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-slate-400">{stat.label}</div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-emerald-400" />
                                        <h3 className="text-lg font-semibold text-white">
                                            Gift Card Payout Requests
                                        </h3>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-white/20 text-xs text-slate-200"
                                        onClick={() => setActiveTab('payouts')}
                                    >
                                        View all
                                    </Button>
                                </div>
                                {latestPayouts.length === 0 ? (
                                    <p className="text-sm text-slate-400">No payout requests yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {latestPayouts.map((payout) => {
                                            const displayName =
                                                payout.users?.full_name ||
                                                payout.users?.email ||
                                                'User';
                                            const isPending = payout.status === 'pending';
                                            const isCompleted =
                                                payout.status === 'issued' ||
                                                payout.status === 'delivered' ||
                                                payout.status === 'redeemed';
                                            return (
                                                <div
                                                    key={payout.id}
                                                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                >
                                                    <div>
                                                        <p className="text-sm text-white font-medium">
                                                            {displayName}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Week {payout.week_id} • Rank{' '}
                                                            {payout.rank_verified ?? '-'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatRelativeTime(payout.requested_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={
                                                                isCompleted
                                                                    ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                                    : payout.status === 'rejected'
                                                                    ? 'text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                                                                    : 'text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                            }
                                                        >
                                                            {payout.status.toUpperCase()}
                                                        </span>
                                                        {isPending ? (
                                                            <Button
                                                                size="sm"
                                                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-xs"
                                                                onClick={() => {
                                                                    setSelectedPayout(payout);
                                                                    setIssueError(null);
                                                                    setProvider(payout.provider || '');
                                                                    setCode(payout.code || '');
                                                                    setAmountInput(
                                                                        payout.amount !== null
                                                                            ? payout.amount.toString()
                                                                            : ''
                                                                    );
                                                                }}
                                                            >
                                                                Issue Gift Card
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Issued
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Gift className="w-5 h-5 text-amber-400" />
                                        <h3 className="text-lg font-semibold text-white">
                                            Weekly Competitions & Winners
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-200 mb-2">
                                                Recent Competitions
                                            </h4>
                                            {weeklyCompetitions.length === 0 ? (
                                                <p className="text-xs text-slate-400">
                                                    No competitions configured yet.
                                                </p>
                                            ) : (
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {weeklyCompetitions.slice(0, 6).map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                        >
                                                            <div>
                                                                <p className="text-sm text-white font-medium">
                                                                    Week {c.id}
                                                                </p>
                                                                <p className="text-xs text-slate-400">
                                                                    {new Date(
                                                                        c.start_date
                                                                    ).toLocaleDateString()}{' '}
                                                                    –{' '}
                                                                    {new Date(
                                                                        c.end_date
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <Badge
                                                                className={
                                                                    c.status === 'active'
                                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                                        : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                                                                }
                                                            >
                                                                {c.status.toUpperCase()}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-200 mb-2">
                                                Recent Winners (Top 3)
                                            </h4>
                                            {weeklyWinners.length === 0 ? (
                                                <p className="text-xs text-slate-400">
                                                    No winners recorded yet.
                                                </p>
                                            ) : (
                                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                                    {weeklyWinners.slice(0, 3).map((w) => {
                                                        const name =
                                                            w.users?.full_name ||
                                                            w.users?.email ||
                                                            'User';
                                                        const comp = w.weekly_competitions;
                                                        return (
                                                            <div
                                                                key={w.id}
                                                                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                            >
                                                                <div>
                                                                    <p className="text-sm text-white font-medium">
                                                                        {name}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400">
                                                                        Week {w.week_id} • Rank #{w.rank}
                                                                    </p>
                                                                    {comp && (
                                                                        <p className="text-[11px] text-slate-500">
                                                                            {new Date(
                                                                                comp.start_date
                                                                            ).toLocaleDateString()}{' '}
                                                                            –{' '}
                                                                            {new Date(
                                                                                comp.end_date
                                                                            ).toLocaleDateString()}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-emerald-400 font-semibold">
                                                                        Reward $
                                                                        {(w.reward_amount / 100).toFixed(2)}
                                                                    </p>
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block mt-1" />
                                                                </div>
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
                                    className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-5 h-5 text-rose-400" />
                                            <h3 className="text-lg font-semibold text-white">
                                                Moderation Tools
                                            </h3>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-white/20 text-xs text-slate-200"
                                            onClick={() => setActiveTab('moderation')}
                                        >
                                            View all
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            className="bg-slate-900/60 border border-white/10 rounded-xl p-3 text-left hover:bg-slate-800/80 transition"
                                            onClick={() => setActiveTab('moderation')}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                                <p className="text-sm font-semibold text-white">
                                                    Manage Reports
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {unresolvedReportsCount} pending reports
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-slate-900/60 border border-white/10 rounded-xl p-3 text-left hover:bg-slate-800/80 transition"
                                            onClick={() => {
                                                setAnnouncementError(null);
                                                setIsAnnouncementOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Megaphone className="w-4 h-4 text-amber-400" />
                                                <p className="text-sm font-semibold text-white">
                                                    Send Announcement
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                Broadcast a system message to all users.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-slate-900/60 border border-white/10 rounded-xl p-3 text-left hover:bg-slate-800/80 transition"
                                            onClick={() => {
                                                setSuspendError(null);
                                                setIsSuspendOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <UserX className="w-4 h-4 text-red-400" />
                                                <p className="text-sm font-semibold text-white">
                                                    Suspend User
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                Search by email or ID and suspend/ban them.
                                            </p>
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-slate-900/60 border border-white/10 rounded-xl p-3 text-left hover:bg-slate-800/80 transition"
                                            onClick={() => {
                                                setIsCreateCompetitionOpen(true);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <CalendarPlus className="w-4 h-4 text-emerald-400" />
                                                <p className="text-sm font-semibold text-white">
                                                    Create Competition
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                Configure a new weekly competition.
                                            </p>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </TabsContent>

                        <TabsContent value="payouts" className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-emerald-400" />
                                        <h3 className="text-lg font-semibold text-white">
                                            Payout Requests
                                        </h3>
                                    </div>
                                </div>
                                {payoutRequests.length === 0 ? (
                                    <p className="text-sm text-slate-400">No payout requests yet.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto">
                                        {payoutRequests.map((payout) => {
                                            const displayName =
                                                payout.users?.full_name ||
                                                payout.users?.email ||
                                                'User';
                                            const isPending = payout.status === 'pending';
                                            const isCompleted =
                                                payout.status === 'issued' ||
                                                payout.status === 'delivered' ||
                                                payout.status === 'redeemed';
                                            return (
                                                <div
                                                    key={payout.id}
                                                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                >
                                                    <div>
                                                        <p className="text-sm text-white font-medium">
                                                            {displayName}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            Week {payout.week_id} • Rank{' '}
                                                            {payout.rank_verified ?? '-'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {formatRelativeTime(payout.requested_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={
                                                                isCompleted
                                                                    ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                                    : payout.status === 'rejected'
                                                                    ? 'text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                                                                    : 'text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                            }
                                                        >
                                                            {payout.status.toUpperCase()}
                                                        </span>
                                                        {isPending ? (
                                                            <Button
                                                                size="sm"
                                                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-xs"
                                                                onClick={() => {
                                                                    setSelectedPayout(payout);
                                                                    setIssueError(null);
                                                                    setProvider(payout.provider || '');
                                                                    setCode(payout.code || '');
                                                                    setAmountInput(
                                                                        payout.amount !== null
                                                                            ? payout.amount.toString()
                                                                            : ''
                                                                    );
                                                                }}
                                                            >
                                                                Issue Gift Card
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-emerald-400 flex items-center gap-1">
                                                                <CheckCircle2 className="w-3 h-3" />
                                                                Issued
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="competitions" className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Gift className="w-5 h-5 text-amber-400" />
                                        <h3 className="text-lg font-semibold text-white">
                                            Weekly Competitions
                                        </h3>
                                    </div>
                                    <Button
                                        size="sm"
                                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 text-xs"
                                        onClick={() => setIsCreateCompetitionOpen(true)}
                                    >
                                        Create Competition
                                    </Button>
                                </div>
                                {weeklyCompetitions.length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No competitions configured yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto">
                                        {weeklyCompetitions.map((c) => (
                                            <div
                                                key={c.id}
                                                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm text-white font-medium">
                                                        Week {c.id}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(c.start_date).toLocaleDateString()}{' '}
                                                        –{' '}
                                                        {new Date(c.end_date).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        Status: {c.status}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {c.status !== 'completed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-white/20 text-xs text-slate-200"
                                                            onClick={() =>
                                                                competitionCloseMutation.mutate(c.id)
                                                            }
                                                        >
                                                            Close
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-xs"
                                                        onClick={() =>
                                                            competitionWinnersMutation.mutate(c.id)
                                                        }
                                                    >
                                                        Generate Winners
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="users" className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-sky-400" />
                                        <h3 className="text-lg font-semibold text-white">Users</h3>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:w-80">
                                        <Search className="w-4 h-4 text-slate-400" />
                                        <Input
                                            placeholder="Search by name or email"
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            className="bg-slate-900/60 border-white/10 text-sm text-white"
                                        />
                                    </div>
                                </div>
                                {filteredUsers.length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No users match this search.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto">
                                        {filteredUsers.map((u) => {
                                            const suspension = activeSuspensionsMap.get(u.id);
                                            return (
                                                <div
                                                    key={u.id}
                                                    className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                >
                                                    <div>
                                                        <p className="text-sm text-white font-medium">
                                                            {u.full_name || 'User'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {u.email}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            Coins: {u.coins ?? 0} • Role:{' '}
                                                            {u.role || 'user'} • Judge:{' '}
                                                            {u.is_judge ? 'Yes' : 'No'}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span
                                                            className={
                                                                suspension
                                                                    ? 'text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40'
                                                                    : 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                            }
                                                        >
                                                            {suspension
                                                                ? 'Suspended'
                                                                : 'Active'}
                                                        </span>
                                                        <div className="flex flex-wrap gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() => {
                                                                    setSuspendError(null);
                                                                    setSuspendIdentifier(
                                                                        u.email || u.id
                                                                    );
                                                                    setIsSuspendOpen(true);
                                                                }}
                                                            >
                                                                {suspension ? 'Update Suspension' : 'Suspend'}
                                                            </Button>
                                                            {suspension && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-white/20 text-xs text-slate-200"
                                                                    onClick={async () => {
                                                                        await supabase
                                                                            .from('user_suspensions')
                                                                            .delete()
                                                                            .eq('user_id', u.id);
                                                                        refetchSuspensions();
                                                                    }}
                                                                >
                                                                    Unsuspend
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() =>
                                                                    updateUserMutation.mutate({
                                                                        userId: u.id,
                                                                        changes: {
                                                                            is_judge: !u.is_judge
                                                                        }
                                                                    })
                                                                }
                                                            >
                                                                {u.is_judge ? 'Remove Judge' : 'Make Judge'}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() =>
                                                                    updateUserMutation.mutate({
                                                                        userId: u.id,
                                                                        changes: {
                                                                            role:
                                                                                u.role === 'admin'
                                                                                    ? 'user'
                                                                                    : 'admin'
                                                                        }
                                                                    })
                                                                }
                                                            >
                                                                {u.role === 'admin'
                                                                    ? 'Remove Admin'
                                                                    : 'Make Admin'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="applications" className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-semibold text-white">Applications</h3>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/40">
                                            Contestants: {contestantApplications.length}
                                        </Badge>
                                        <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                                            Judges: {judgeApplications.length}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Contestant Applications */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-200 mb-2">Contestant Applications</h4>
                                        {contestantApplications.length === 0 ? (
                                            <p className="text-sm text-slate-400">No pending contestant applications.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {contestantApplications.map((app) => (
                                                    <div
                                                        key={app.id}
                                                        className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                    >
                                                        <div>
                                                            <p className="text-sm text-white font-medium">
                                                                {app.name}
                                                            </p>
                                                            <p className="text-xs text-slate-400 capitalize">
                                                                {app.talent_type} • {app.email}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatRelativeTime(app.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() => approveContestantMutation.mutate(app.id)}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() => rejectContestantMutation.mutate(app.id)}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Judge Applications */}
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-semibold text-slate-200 mb-2">Judge Applications</h4>
                                        {judgeApplications.length === 0 ? (
                                            <p className="text-sm text-slate-400">No pending judge applications.</p>
                                        ) : (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {judgeApplications.map((app) => (
                                                    <div
                                                        key={app.id}
                                                        className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2"
                                                    >
                                                        <div>
                                                            <p className="text-sm text-white font-medium">
                                                                {app.display_name}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {app.specialty} • {app.user_email}
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {formatRelativeTime(app.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() => approveJudgeMutation.mutate(app.id)}
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-white/20 text-xs text-slate-200"
                                                                onClick={() => rejectJudgeMutation.mutate(app.id)}
                                                            >
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>

                        <TabsContent value="moderation" className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 text-rose-400" />
                                        <h3 className="text-lg font-semibold text-white">Reports</h3>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {unresolvedReportsCount} open • {moderationReports.length} total
                                    </span>
                                </div>
                                {moderationReports.length === 0 ? (
                                    <p className="text-sm text-slate-400">
                                        No moderation reports yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3 max-h-[320px] overflow-y-auto">
                                        {moderationReports.map((report) => (
                                            <div
                                                key={report.id}
                                                className="flex items-start justify-between rounded-lg border border-white/10 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm text-white font-medium">
                                                        {report.reason || 'No reason provided'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        Reporter: {report.reporter_user_id} • Target:{' '}
                                                        {report.target_user_id}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {formatRelativeTime(report.created_at)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span
                                                        className={
                                                            report.status === 'open'
                                                                ? 'text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                                                : report.status === 'resolved'
                                                                ? 'text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                                : 'text-xs px-2 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-500/40'
                                                        }
                                                    >
                                                        {report.status.toUpperCase()}
                                                    </span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {report.status === 'open' && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-white/20 text-xs text-slate-200"
                                                                    onClick={() =>
                                                                        reportStatusMutation.mutate({
                                                                            id: report.id,
                                                                            status: 'resolved'
                                                                        })
                                                                    }
                                                                >
                                                                    Resolve
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-white/20 text-xs text-slate-200"
                                                                    onClick={() =>
                                                                        reportStatusMutation.mutate({
                                                                            id: report.id,
                                                                            status: 'dismissed'
                                                                        })
                                                                    }
                                                                >
                                                                    Dismiss
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-white/20 text-xs text-slate-200"
                                                                    onClick={() => {
                                                                        setSuspendError(null);
                                                                        setSuspendIdentifier(
                                                                            report.target_user_id
                                                                        );
                                                                        setIsSuspendOpen(true);
                                                                    }}
                                                                >
                                                                    Suspend user
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Megaphone className="w-5 h-5 text-amber-400" />
                                    <h3 className="text-lg font-semibold text-white">
                                        Announcement Tool
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <Textarea
                                        placeholder="Write a system-wide announcement..."
                                        value={announcementMessage}
                                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                                        className="bg-slate-900/60 border-white/10 text-sm text-white"
                                    />
                                    {announcementError && (
                                        <p className="text-xs text-red-400">
                                            {announcementError}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <Button
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                            size="sm"
                                            disabled={announcementMutation.isPending}
                                            onClick={() => announcementMutation.mutate()}
                                        >
                                            {announcementMutation.isPending
                                                ? 'Sending...'
                                                : 'Send Announcement'}
                                        </Button>
                                        <span className="text-[11px] text-slate-500">
                                            Recent:{' '}
                                            {announcements[0]
                                                ? `"${announcements[0].message.slice(0, 40)}"${
                                                      announcements[0].message.length > 40
                                                          ? '...'
                                                          : ''
                                                  }`
                                                : 'No announcements yet.'}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>
                    </Tabs>
                </div>

                <Dialog
                    open={!!selectedPayout}
                    onOpenChange={(open) => {
                        if (!open) {
                            setSelectedPayout(null);
                            setProvider('');
                            setCode('');
                            setAmountInput('');
                            setIssueError(null);
                        }
                    }}
                >
                    <DialogContent className="bg-slate-900 border-white/10 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">Issue Gift Card</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Enter the gift card details to mark this payout as issued and notify the
                                winner.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Input
                                placeholder="Provider (Amazon, Visa, etc.)"
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            <Input
                                placeholder="Gift card code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            <Input
                                type="number"
                                placeholder="Amount in USD"
                                value={amountInput}
                                onChange={(e) => setAmountInput(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            {issueError && <p className="text-xs text-red-400">{issueError}</p>}
                        </div>
                        <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="border-white/20 text-white"
                                onClick={() => {
                                    setSelectedPayout(null);
                                    setProvider('');
                                    setCode('');
                                    setAmountInput('');
                                    setIssueError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
                                disabled={issueMutation.isPending}
                                onClick={() => issueMutation.mutate()}
                            >
                                {issueMutation.isPending ? 'Issuing...' : 'Issue Gift Card'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isAnnouncementOpen}
                    onOpenChange={(open) => {
                        setIsAnnouncementOpen(open);
                        if (!open) {
                            setAnnouncementError(null);
                        }
                    }}
                >
                    <DialogContent className="bg-slate-900 border-white/10 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">Send Announcement</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Broadcast a system message to all users.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Textarea
                                placeholder="Write your announcement..."
                                value={announcementMessage}
                                onChange={(e) => setAnnouncementMessage(e.target.value)}
                                className="bg-slate-800 border-white/10 text-sm text-white"
                            />
                            {announcementError && (
                                <p className="text-xs text-red-400">{announcementError}</p>
                            )}
                        </div>
                        <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="border-white/20 text-white"
                                onClick={() => {
                                    setIsAnnouncementOpen(false);
                                    setAnnouncementError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                disabled={announcementMutation.isPending}
                                onClick={() => announcementMutation.mutate()}
                            >
                                {announcementMutation.isPending ? 'Sending...' : 'Send'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isSuspendOpen}
                    onOpenChange={(open) => {
                        setIsSuspendOpen(open);
                        if (!open) {
                            setSuspendError(null);
                        }
                    }}
                >
                    <DialogContent className="bg-slate-900 border-white/10 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">Suspend User</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Search by email or user ID and apply a suspension.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Input
                                placeholder="User email or ID"
                                value={suspendIdentifier}
                                onChange={(e) => setSuspendIdentifier(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            <Textarea
                                placeholder="Reason for suspension"
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                className="bg-slate-800 border-white/10 text-sm text-white"
                            />
                            <Input
                                type="datetime-local"
                                placeholder="Suspended until (optional)"
                                value={suspendUntil}
                                onChange={(e) => setSuspendUntil(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            {suspendError && (
                                <p className="text-xs text-red-400">{suspendError}</p>
                            )}
                        </div>
                        <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="border-white/20 text-white"
                                onClick={() => {
                                    setIsSuspendOpen(false);
                                    setSuspendError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-90"
                                disabled={suspendMutation.isPending}
                                onClick={() => suspendMutation.mutate()}
                            >
                                {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={isCreateCompetitionOpen}
                    onOpenChange={(open) => {
                        setIsCreateCompetitionOpen(open);
                    }}
                >
                    <DialogContent className="bg-slate-900 border-white/10 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-white">
                                Create Weekly Competition
                            </DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Configure a new weekly competition window.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                            <Input
                                type="date"
                                placeholder="Start date"
                                value={newCompetitionStart}
                                onChange={(e) => setNewCompetitionStart(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                            <Input
                                type="date"
                                placeholder="End date"
                                value={newCompetitionEnd}
                                onChange={(e) => setNewCompetitionEnd(e.target.value)}
                                className="bg-slate-800 border-white/10 text-white"
                            />
                        </div>
                        <DialogFooter className="flex items-center justify-end gap-2">
                            <Button
                                variant="outline"
                                className="border-white/20 text-white"
                                onClick={() => setIsCreateCompetitionOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90"
                                disabled={competitionCreateMutation.isPending}
                                onClick={() => competitionCreateMutation.mutate()}
                            >
                                {competitionCreateMutation.isPending ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
