import { motion as motionBase } from 'framer-motion';
import {
    User, Play, X, Check,
    Music, Wand2, Drama, Sparkles
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";

const motion: any = motionBase;

const talentIcons = {
    singing: Music,
    magic: Wand2,
    dancing: Drama,
    comedy: Drama,
    instrumental: Music,
    acrobatics: Sparkles,
    other: Sparkles
} as const;

type QueueContestant = {
    id: string;
    name?: string;
    profile_image?: string;
    talent_type?: keyof typeof talentIcons | string;
    status?: string;
};

type ContestantQueueProps = {
    contestants?: QueueContestant[] | null;
    onApprove(id: string): void;
    onReject(id: string): void;
    onBringToStage(id: string): void;
    isJudge: boolean;
    currentContestantId?: string | null;
};

export default function ContestantQueue({ 
    contestants, 
    onApprove, 
    onReject, 
    onBringToStage,
    isJudge,
    currentContestantId 
}: ContestantQueueProps) {
    const pendingContestants = contestants?.filter(c => c.status === 'pending') || [];
    const approvedContestants = contestants?.filter(c => c.status === 'approved') || [];
    const liveContestant = contestants?.find(c => c.id === currentContestantId);

    if (!isJudge) return null;

    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-2">
                <User className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">Judge Panel & Queue</h3>
            </div>

            {/* Currently Live */}
            {liveContestant && (
                <div className="p-4 bg-red-500/20 border-b border-red-500/30">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-12 w-12 border-2 border-red-500">
                                <AvatarImage src={liveContestant.profile_image} />
                                <AvatarFallback>{liveContestant.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                        </div>
                        <div>
                            <p className="text-white font-medium">{liveContestant.name}</p>
                            <Badge className="bg-red-500/50 text-white text-xs">
                                LIVE NOW
                            </Badge>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Applications */}
            <div className="p-4 border-b border-white/10">
                <h4 className="text-sm font-medium text-slate-400 mb-3">
                    Waiting Room ({pendingContestants.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {pendingContestants.map((contestant) => {
                        const TalentIcon =
                            talentIcons[
                                (contestant.talent_type || "other") as keyof typeof talentIcons
                            ] || Sparkles;
                        return (
                            <motion.div
                                key={contestant.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={contestant.profile_image} />
                                    <AvatarFallback>{contestant.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                        {contestant.name}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <TalentIcon className="w-3 h-3" />
                                        <span className="capitalize">{contestant.talent_type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onApprove(contestant.id)}
                                        title="Bump up in queue"
                                        className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                    >
                                        <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onReject(contestant.id)}
                                        title="Kick from queue"
                                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                    {pendingContestants.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No pending applications
                        </p>
                    )}
                </div>
            </div>

            {/* Approved Queue */}
            <div className="p-4">
                <h4 className="text-sm font-medium text-slate-400 mb-3">
                    On Deck ({approvedContestants.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {approvedContestants.map((contestant) => {
                        const TalentIcon =
                            talentIcons[
                                (contestant.talent_type || "other") as keyof typeof talentIcons
                            ] || Sparkles;
                        return (
                            <motion.div
                                key={contestant.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl"
                            >
                                <Avatar className="h-10 w-10 border-2 border-green-500">
                                    <AvatarImage src={contestant.profile_image} />
                                    <AvatarFallback>{contestant.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium text-sm truncate">
                                        {contestant.name}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <TalentIcon className="w-3 h-3" />
                                        <span className="capitalize">{contestant.talent_type}</span>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => onBringToStage(contestant.id)}
                                    disabled={liveContestant !== undefined}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                >
                                    <Play className="w-4 h-4 mr-1" />
                                    Go Live
                                </Button>
                            </motion.div>
                        );
                    })}
                    {approvedContestants.length === 0 && (
                        <p className="text-sm text-slate-500 text-center py-4">
                            No approved contestants waiting
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
