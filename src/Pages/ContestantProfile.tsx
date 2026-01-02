import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion as motionBase } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
    Star, Heart, MessageCircle, Ban, Flag, Gift,
    Trophy, ArrowLeft, Check, AlertTriangle,
    Music, Wand2, Drama, Sparkles
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/Components/ui/dialog";
import { Textarea } from "@/Components/ui/textarea";
import { cn } from "@/lib/utils";
import Layout from '@/Layouts/Layout';

const motion: any = motionBase;

const talentIcons = {
    singing: Music,
    magic: Wand2,
    dancing: Drama,
    comedy: Drama,
    instrumental: Music,
    acrobatics: Sparkles,
    other: Sparkles
};

export default function ContestantProfile() {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<any>(null);
    const [reportReason, setReportReason] = useState('');
    const [showReportDialog, setShowReportDialog] = useState(false);
    
    const urlParams = new URLSearchParams(window.location.search);
    const contestantId = urlParams.get('id');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser);
            } catch (e) {}
        };
        fetchUser();
    }, []);

    // Fetch contestant details
    const { data: contestant } = useQuery({
        queryKey: ['contestant', contestantId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('contestants')
                .select('*')
                .eq('id', contestantId)
                .single();
            if (error) throw error;
            return data as any;
        },
        enabled: !!contestantId
    });

    const { data: contestantUser } = useQuery({
        queryKey: ['contestantUser', contestant?.email],
        queryFn: async () => {
            if (!contestant?.email) return null;
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('email', contestant.email)
                .maybeSingle();
            if (error) {
                throw error;
            }
            return data;
        },
        enabled: !!contestant?.email
    });

    const contestantUserId = contestantUser?.id as string | undefined;

    const { data: followRows = [] } = useQuery({
        queryKey: ['follow', user?.id, contestantUserId],
        queryFn: async () => {
            if (!user?.id || !contestantUserId) return [];
            const { data, error } = await supabase
                .from('follows')
                .select('*')
                .eq('follower_id', user.id)
                .eq('followed_id', contestantUserId);
            if (error) {
                throw error;
            }
            return data || [];
        },
        enabled: !!user?.id && !!contestantUserId
    });

    const isFollowing = followRows.length > 0;
    const isBlocked = user?.blocked_users?.includes(contestant?.email);

    const followMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id || !contestantUserId) return;
            if (isFollowing) {
                const { data, error } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('followed_id', contestantUserId);
                if (error) {
                    throw error;
                }
                const ids = (data || []).map((row: any) => row.id);
                if (ids.length > 0) {
                    await supabase.from('follows').delete().in('id', ids);
                }
                const newCount = Math.max(0, (contestant.follower_count || 0) - 1);
                await supabase.entities.Contestant.update(contestant.id, {
                    follower_count: newCount
                });
            } else {
                await supabase
                    .from('follows')
                    .insert({
                        follower_id: user.id,
                        followed_id: contestantUserId
                    });
                const newCount = (contestant.follower_count || 0) + 1;
                await supabase.entities.Contestant.update(contestant.id, {
                    follower_count: newCount
                });
            }
            const updatedUser = await supabase.auth.me();
            setUser(updatedUser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contestant'] });
            queryClient.invalidateQueries({ queryKey: ['follow', user?.id, contestantUserId] });
        }
    });

    const blockMutation = useMutation({
        mutationFn: async () => {
            const blocked = user?.blocked_users || [];
            const newBlocked = isBlocked
                ? blocked.filter((email: string) => email !== contestant.email)
                : [...blocked, contestant.email];
            
            await supabase.auth.updateMe({ blocked_users: newBlocked });
            const updatedUser = await supabase.auth.me();
            setUser(updatedUser);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contestant'] });
        }
    });

    const reportMutation = useMutation({
        mutationFn: async () => {
            const reports = user?.reported_users || [];
            reports.push({
                user_email: contestant.email,
                reason: reportReason,
                date: new Date().toISOString()
            });
            await supabase.auth.updateMe({ reported_users: reports });
            setReportReason('');
            setShowReportDialog(false);
        }
    });

    if (!contestant) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const TalentIcon = talentIcons[(contestant.talent_type || 'other') as keyof typeof talentIcons] || Sparkles;

    return (
        <Layout currentPageName="ContestantProfile">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Back Button */}
                <Link to={createPageUrl('Leaderboard')}>
                    <Button variant="ghost" className="text-white mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Leaderboard
                    </Button>
                </Link>

                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 border border-white/10 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <Avatar className="w-32 h-32 border-4 border-purple-500">
                            <AvatarImage src={contestant.profile_image} />
                            <AvatarFallback className="text-3xl">
                                {contestant.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white mb-2">{contestant.name}</h1>
                            <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                                <TalentIcon className="w-5 h-5 text-purple-400" />
                                <span className="text-slate-300 capitalize">{contestant.talent_type}</span>
                            </div>
                            <p className="text-slate-400 mb-4">{contestant.description}</p>
                            
                            {/* Stats */}
                            <div className="flex gap-4 justify-center md:justify-start text-sm">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-amber-400">{contestant.total_score?.toLocaleString() || 0}</p>
                                    <p className="text-slate-500">Score</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-400">{contestant.votes || 0}</p>
                                    <p className="text-slate-500">Votes</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-pink-400">{contestant.follower_count || 0}</p>
                                    <p className="text-slate-500">Followers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-400">{contestant.gifts_received || 0}</p>
                                    <p className="text-slate-500">Gifts</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {user && (
                        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                            <Button
                                onClick={() => followMutation.mutate()}
                                disabled={followMutation.isPending || isBlocked}
                                className={cn(
                                    isFollowing 
                                        ? "bg-purple-600 hover:bg-purple-700"
                                        : "bg-white/10 hover:bg-white/20"
                                )}
                            >
                                {isFollowing ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Following
                                    </>
                                ) : (
                                    <>
                                        <Heart className="w-4 h-4 mr-2" />
                                        Follow
                                    </>
                                )}
                            </Button>

                            <Link to={createPageUrl('Messages') + `?to=${contestant.email}`}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Message
                                </Button>
                            </Link>

                            <Link to={createPageUrl('Home')}>
                                <Button className="bg-pink-600 hover:bg-pink-700">
                                    <Gift className="w-4 h-4 mr-2" />
                                    Send Gift
                                </Button>
                            </Link>

                            <Button
                                onClick={() => blockMutation.mutate()}
                                disabled={blockMutation.isPending}
                                variant="outline"
                                className="border-white/20 text-white hover:bg-red-500/20"
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                {isBlocked ? 'Unblock' : 'Block'}
                            </Button>

                            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                                <DialogTrigger>
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-orange-500/20">
                                        <Flag className="w-4 h-4 mr-2" />
                                        Report
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/10">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">Report {contestant.name}</DialogTitle>
                                        <DialogDescription className="text-slate-400">
                                            Please provide a reason for reporting this contestant
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        placeholder="Describe the issue..."
                                        className="bg-white/5 border-white/10 text-white"
                                        rows={4}
                                    />
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowReportDialog(false)}
                                            className="border-white/20 text-white"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => reportMutation.mutate()}
                                            disabled={!reportReason.trim() || reportMutation.isPending}
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Submit Report
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    )}
                </motion.div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-amber-400" />
                                Performance Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Status</span>
                                <Badge className={
                                    contestant.status === 'champion' ? 'bg-purple-500/20 text-purple-400' :
                                    contestant.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    'bg-slate-500/20 text-slate-400'
                                }>
                                    {contestant.status}
                                </Badge>
                            </div>
                            {contestant.championship_position && (
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Championship Rank</span>
                                    <span className="text-white font-bold">#{contestant.championship_position}</span>
                                </div>
                            )}
                            {contestant.elimination_risk && (
                                <div className="flex items-center gap-2 p-2 bg-red-500/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                    <span className="text-red-400 text-sm">At risk of elimination</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Weekly Votes</span>
                                <span className="text-white font-bold">{contestant.weekly_votes || 0}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400" />
                                Judge Scores
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contestant.judge_scores && contestant.judge_scores.length > 0 ? (
                                <div className="space-y-2">
                                    {contestant.judge_scores.map((score: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <span className="text-slate-400">Judge {index + 1}</span>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 10 }).map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                                                            i < score.score
                                                                ? "bg-amber-500 text-white"
                                                                : "bg-slate-700 text-slate-500"
                                                        )}
                                                    >
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-center py-4">No judge scores yet</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Video */}
                {contestant.video_url && (
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Audition Video</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
                                <a
                                    href={contestant.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300"
                                >
                                    Watch Video →
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
        </Layout>
    );
}
