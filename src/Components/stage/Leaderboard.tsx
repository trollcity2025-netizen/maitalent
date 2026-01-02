import { motion as motionBase } from 'framer-motion';
import { Trophy, Medal, TrendingUp, Gift, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { cn } from "@/lib/utils";

const motion: any = motionBase;

type LeaderboardContestant = {
    id: string;
    name?: string;
    profile_image?: string;
    talent_type?: string;
    total_score?: number;
    votes?: number;
    gifts_received?: number;
};

type LeaderboardProps = {
    contestants?: LeaderboardContestant[] | null;
};

export default function Leaderboard({ contestants }: LeaderboardProps) {
    const sortedContestants: LeaderboardContestant[] = [...(contestants || [])].sort(
        (a, b) => (b.total_score || 0) - (a.total_score || 0)
    );

    const getRankStyle = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white';
            case 2:
                return 'bg-gradient-to-r from-slate-400 to-slate-300 text-slate-800';
            case 3:
                return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white';
            default:
                return 'bg-slate-700 text-slate-300';
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-5 h-5" />;
            case 2:
            case 3:
                return <Medal className="w-5 h-5" />;
            default:
                return <span className="font-bold">{rank}</span>;
        }
    };

    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-600 to-amber-500 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-white" />
                <h3 className="font-bold text-white text-lg">Leaderboard</h3>
            </div>

            {/* Top 3 Podium */}
            <div className="p-4 flex justify-center items-end gap-2">
                {/* 2nd Place */}
                {sortedContestants[1] && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-center"
                    >
                        <Avatar className="h-14 w-14 mx-auto border-3 border-slate-400 mb-2">
                            <AvatarImage src={sortedContestants[1].profile_image} />
                            <AvatarFallback>{sortedContestants[1].name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-white font-medium truncate w-16">
                            {sortedContestants[1].name}
                        </p>
                        <div className="mt-2 h-16 w-16 bg-gradient-to-t from-slate-500 to-slate-400 rounded-t-lg flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">2</span>
                        </div>
                    </motion.div>
                )}

                {/* 1st Place */}
                {sortedContestants[0] && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <Star className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                        </motion.div>
                        <Avatar className="h-16 w-16 mx-auto border-4 border-amber-400 mb-2">
                            <AvatarImage src={sortedContestants[0].profile_image} />
                            <AvatarFallback>{sortedContestants[0].name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-white font-bold truncate w-20">
                            {sortedContestants[0].name}
                        </p>
                        <div className="mt-2 h-20 w-20 bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-lg flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-white" />
                        </div>
                    </motion.div>
                )}

                {/* 3rd Place */}
                {sortedContestants[2] && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-center"
                    >
                        <Avatar className="h-12 w-12 mx-auto border-3 border-amber-700 mb-2">
                            <AvatarImage src={sortedContestants[2].profile_image} />
                            <AvatarFallback>{sortedContestants[2].name?.[0]}</AvatarFallback>
                        </Avatar>
                        <p className="text-xs text-white font-medium truncate w-14">
                            {sortedContestants[2].name}
                        </p>
                        <div className="mt-2 h-12 w-14 bg-gradient-to-t from-amber-800 to-amber-700 rounded-t-lg flex items-center justify-center">
                            <span className="text-xl font-bold text-white">3</span>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Full List */}
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {sortedContestants.map((contestant, index) => (
                    <motion.div
                        key={contestant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                            getRankStyle(index + 1)
                        )}>
                            {getRankIcon(index + 1)}
                        </div>
                        
                        <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={contestant.profile_image} />
                            <AvatarFallback>{contestant.name?.[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{contestant.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{contestant.talent_type}</p>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                            <p className="text-amber-400 font-bold">{(contestant.total_score || 0).toLocaleString()}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="flex items-center gap-0.5">
                                    <TrendingUp className="w-3 h-3" />
                                    {contestant.votes || 0}
                                </span>
                                <span className="flex items-center gap-0.5">
                                    <Gift className="w-3 h-3" />
                                    {contestant.gifts_received || 0}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
