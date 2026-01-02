import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion as motionBase } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Trophy, Medal, Crown, Star, Gift, TrendingUp, 
    AlertCircle, Heart, MessageCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { Button } from "@/Components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import { cn } from "@/lib/utils";
import Layout from '@/Layouts/Layout';

const motion: any = motionBase;

type RankedContestant = {
    id: string;
    profile_image?: string;
    name?: string;
    talent_type?: string;
    votes?: number;
    gifts_received?: number;
    follower_count?: number;
    elimination_risk?: boolean;
    total_score?: number;
    email?: string;
    status?: string;
};

export default function Leaderboard() {
    const { data: contestants = [] } = useQuery<RankedContestant[]>({
        queryKey: ['contestants'],
        queryFn: async () => (await supabase.entities.Contestant.list('-total_score')) as RankedContestant[]
    });

    const { data: championships = [] } = useQuery<any[]>({
        queryKey: ['championships'],
        queryFn: async () => (await supabase.entities.Championship.list('-created_date'))
    });

    const activeChampionship = championships.find((c: any) => c.is_active);
    const championshipContestants = activeChampionship 
        ? contestants
            .filter((c: RankedContestant) => activeChampionship.top_12_contestants?.includes(c.id))
            .sort((a: RankedContestant, b: RankedContestant) => (b.total_score || 0) - (a.total_score || 0))
        : [];

    const allContestants = contestants.filter(
        (c: RankedContestant) =>
            c.status === 'approved' ||
            c.status === 'performed' ||
            c.status === 'champion'
    );

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'from-amber-500 to-yellow-400';
            case 2:
                return 'from-slate-400 to-slate-300';
            case 3:
                return 'from-amber-700 to-amber-600';
            default:
                return 'from-slate-700 to-slate-600';
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-6 h-6 text-white" />;
            case 2:
            case 3:
                return <Medal className="w-6 h-6 text-white" />;
            default:
                return <span className="font-bold text-white">{rank}</span>;
        }
    };

    const ContestantCard = ({
        contestant,
        rank,
        isChampionship = false,
    }: {
        contestant: RankedContestant;
        rank: number;
        isChampionship?: boolean;
    }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: rank * 0.05 }}
            className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10"
        >
            {/* Rank */}
            <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                `bg-gradient-to-br ${getRankStyle(rank)}`
            )}>
                {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <Link to={createPageUrl('ContestantProfile') + `?id=${contestant.id}`}>
                <Avatar className="h-16 w-16 border-2 border-white/20 cursor-pointer hover:border-white/40 transition-colors">
                    <AvatarImage src={contestant.profile_image} />
                    <AvatarFallback>{contestant.name?.[0]}</AvatarFallback>
                </Avatar>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <Link to={createPageUrl('ContestantProfile') + `?id=${contestant.id}`}>
                    <h3 className="font-semibold text-white text-lg hover:text-amber-400 transition-colors">
                        {contestant.name}
                    </h3>
                </Link>
                <p className="text-sm text-slate-400 capitalize">{contestant.talent_type}</p>
                <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <TrendingUp className="w-3 h-3" />
                        {contestant.votes || 0} votes
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Gift className="w-3 h-3" />
                        {contestant.gifts_received || 0} gifts
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Heart className="w-3 h-3" />
                        {contestant.follower_count || 0} followers
                    </span>
                </div>
            </div>

            {/* Score & Badges */}
            <div className="text-right">
                <div className="text-2xl font-bold text-amber-400 mb-1">
                    {(contestant.total_score || 0).toLocaleString()}
                </div>
                <div className="flex gap-1 justify-end">
                    {contestant.elimination_risk && isChampionship && (
                        <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            At Risk
                        </Badge>
                    )}
                    {rank <= 3 && (
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs">
                            Top 3
                        </Badge>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <Link to={createPageUrl('Messages') + `?to=${contestant.email}`}>
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <MessageCircle className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </motion.div>
    );

    return (
        <Layout currentPageName="Leaderboard">
        <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 py-8 px-4">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
                    <p className="text-slate-400">See who's leading the competition</p>
                </motion.div>

                {/* Tabs */}
                <div className="space-y-6">
                    <Tabs defaultValue={activeChampionship ? "championship" : "all"}>
                    <TabsList className="bg-white/5 border border-white/10 w-full">
                        {activeChampionship && (
                            <TabsTrigger value="championship" className="flex-1">
                                <Crown className="w-4 h-4 mr-2" />
                                Championship Top 12
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="all" className="flex-1">
                            <Star className="w-4 h-4 mr-2" />
                            All Contestants
                        </TabsTrigger>
                    </TabsList>

                    {/* Championship Tab */}
                    {activeChampionship && (
                        <TabsContent value="championship" className="space-y-6">
                            {/* Championship Banner */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 backdrop-blur rounded-2xl p-6 border border-amber-500/30 text-center"
                            >
                                <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-white mb-2">{activeChampionship.season}</h2>
                                <p className="text-amber-300">Week {activeChampionship.current_week} - Top 12 Competition</p>
                                <p className="text-sm text-amber-200 mt-2">
                                    Shows: Monday, Wednesday, Friday | Voting closes Saturday | Results Sunday
                                </p>
                            </motion.div>

                            {/* Top 3 Podium */}
                            <div className="flex justify-center items-end gap-4 mb-8">
                                {championshipContestants[1] && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-center"
                                    >
                                        <Avatar className="h-20 w-20 mx-auto border-4 border-slate-400 mb-2">
                                            <AvatarImage src={championshipContestants[1].profile_image} />
                                            <AvatarFallback>{championshipContestants[1].name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-white font-semibold text-sm mb-2">{championshipContestants[1].name}</p>
                                        <div className="h-24 w-24 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-xl flex items-center justify-center">
                                            <span className="text-3xl font-bold text-white">2</span>
                                        </div>
                                    </motion.div>
                                )}

                                {championshipContestants[0] && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-center"
                                    >
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                        >
                                            <Crown className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                                        </motion.div>
                                        <Avatar className="h-24 w-24 mx-auto border-4 border-amber-400 mb-2">
                                            <AvatarImage src={championshipContestants[0].profile_image} />
                                            <AvatarFallback>{championshipContestants[0].name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-white font-bold mb-2">{championshipContestants[0].name}</p>
                                        <div className="h-32 w-28 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl flex items-center justify-center">
                                            <Trophy className="w-10 h-10 text-white" />
                                        </div>
                                    </motion.div>
                                )}

                                {championshipContestants[2] && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-center"
                                    >
                                        <Avatar className="h-16 w-16 mx-auto border-4 border-amber-700 mb-2">
                                            <AvatarImage src={championshipContestants[2].profile_image} />
                                            <AvatarFallback>{championshipContestants[2].name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <p className="text-white font-semibold text-sm mb-2">{championshipContestants[2].name}</p>
                                        <div className="h-16 w-20 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-xl flex items-center justify-center">
                                            <span className="text-2xl font-bold text-white">3</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Full Championship List */}
                            <div className="space-y-3">
                                {championshipContestants.map((contestant: RankedContestant, index: number) => (
                                    <ContestantCard 
                                        key={contestant.id} 
                                        contestant={contestant} 
                                        rank={index + 1}
                                        isChampionship={true}
                                    />
                                ))}
                            </div>
                        </TabsContent>
                    )}

                    {/* All Contestants Tab */}
                    <TabsContent value="all" className="space-y-3">
                        {allContestants.map((contestant: RankedContestant, index: number) => (
                            <ContestantCard 
                                key={contestant.id} 
                                contestant={contestant} 
                                rank={index + 1}
                            />
                        ))}
                        {allContestants.length === 0 && (
                            <div className="text-center py-12">
                                <Star className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">No contestants yet</p>
                            </div>
                        )}
                    </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
        </Layout>
    );
}
