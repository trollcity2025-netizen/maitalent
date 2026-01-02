import { useState } from 'react';
import { motion as motionBase } from 'framer-motion';
import { Hand, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { cn } from "@/lib/utils";
import { createPageUrl } from '@/utils';
import {
    Dialog,
    DialogContent
} from "@/Components/ui/dialog";
import ContestantQueue from "@/Components/admin/ContestantQueue";
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const motion: any = motionBase;

type JudgeInfo = {
    display_name?: string;
    specialty?: string;
    is_active?: boolean;
    avatar?: string;
};

type JudgeBoxContestant = {
    id: string;
    name?: string;
    profile_image?: string;
    talent_type?: string;
    status?: string;
};

type JudgeBoxProps = {
    judge?: JudgeInfo | null;
    seatNumber: number;
    isCurrentUserJudge: boolean;
    onScore(score: number): void;
    onBuzz(): void;
    onJoinSeat?(): void;
    currentScore?: number;
    hasBuzzed: boolean;
    contestants?: JudgeBoxContestant[] | null;
    currentContestantId?: string | null;
    onApproveContestant?(id: string): void;
    onRejectContestant?(id: string): void;
    onBringContestantToStage?(id: string): void;
    onOpenControls?(): void;
};

export default function JudgeBox({
    judge,
    seatNumber,
    isCurrentUserJudge,
    onScore,
    onBuzz,
    onJoinSeat,
    currentScore,
    hasBuzzed,
    contestants,
    currentContestantId,
    onApproveContestant,
    onRejectContestant,
    onBringContestantToStage,
    onOpenControls
}: JudgeBoxProps) {
    const navigate = useNavigate();
    const [showControls, setShowControls] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(null);
    const [broadcastError, setBroadcastError] = useState<string | null>(null);

    const livekitEnvServerUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL as string | undefined;
    const livekitTokenEndpoint = import.meta.env.VITE_LIVEKIT_TOKEN_ENDPOINT as string | undefined;

    const seatColors: Record<number, string> = {
        1: 'from-red-600 to-red-800',
        2: 'from-blue-600 to-blue-800',
        3: 'from-purple-600 to-purple-800',
        4: 'from-emerald-600 to-emerald-800'
    };

    const glowColors: Record<number, string> = {
        1: 'shadow-red-500/50',
        2: 'shadow-blue-500/50',
        3: 'shadow-purple-500/50',
        4: 'shadow-emerald-500/50'
    };

    const isEmptySeat = !judge;

    const handleStartBroadcast = async () => {
        if (!onJoinSeat) {
            navigate(createPageUrl('JudgeApplication'));
            return;
        }

        try {
            setBroadcastError(null);
            setIsStartingBroadcast(true);

            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                });
                stream.getTracks().forEach((track) => track.stop());
            }

            await Promise.resolve(onJoinSeat());

            const endpoint = livekitTokenEndpoint || '/api/livekit-token';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomName: `judge-seat-${seatNumber}`,
                    role: 'publisher'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get LiveKit token');
            }

            const data = await response.json() as { token?: string; serverUrl?: string };

            const serverUrl = data.serverUrl || livekitEnvServerUrl;

            if (!data.token || !serverUrl) {
                throw new Error('Missing LiveKit configuration');
            }

            setLivekitToken(data.token);
            setLivekitServerUrl(serverUrl);
            setIsBroadcasting(true);
        } catch {
            setBroadcastError('Unable to start broadcast');
        } finally {
            setIsStartingBroadcast(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: seatNumber * 0.1 }}
            className={cn(
                "relative rounded-2xl p-4 bg-gradient-to-b",
                seatColors[seatNumber],
                "shadow-lg",
                isCurrentUserJudge && `shadow-2xl ${glowColors[seatNumber]}`
            )}
        >
            <div className="absolute top-3 left-4 px-2 py-1 rounded-full bg-black/40 text-xs font-semibold text-white">
                {`J${seatNumber}`}
            </div>

            {isEmptySeat ? (
                onJoinSeat ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <Button
                            variant="outline"
                            className="px-6 border-white/40 text-white bg-white/10 hover:bg-white/20"
                            onClick={handleStartBroadcast}
                            disabled={isStartingBroadcast}
                        >
                            {isStartingBroadcast ? 'Starting…' : 'Go Live'}
                        </Button>
                        {broadcastError && (
                            <p className="text-[11px] text-red-200">
                                {broadcastError}
                            </p>
                        )}
                        {isBroadcasting &&
                            livekitToken &&
                            (livekitServerUrl || livekitEnvServerUrl) && (
                                <div className="w-full mt-3 rounded-xl overflow-hidden bg-black/50">
                                    <LiveKitRoom
                                        serverUrl={
                                            livekitServerUrl ||
                                            livekitEnvServerUrl ||
                                            ''
                                        }
                                        token={livekitToken}
                                        connect
                                        video
                                        audio
                                        onDisconnected={() =>
                                            setIsBroadcasting(false)
                                        }
                                    >
                                        <VideoConference />
                                    </LiveKitRoom>
                                </div>
                            )}
                        <p className="text-xs text-white/80">Judge Broadcast</p>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                        </div>
                        <Button
                            variant="outline"
                            className="px-6 border-white/40 text-white bg-white/10 hover:bg-white/20"
                            onClick={() => {
                                navigate(createPageUrl('JudgeApplication'));
                            }}
                        >
                            Join
                        </Button>
                        <p className="text-xs text-white/80">Guest Judge</p>
                    </div>
                )
            ) : (
                <>
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-12 w-12 border-2 border-white/30">
                            <AvatarImage src={judge?.avatar} />
                            <AvatarFallback className="bg-white/20 text-white">
                                {judge?.display_name?.[0] || `J${seatNumber}`}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">
                                {judge?.display_name || `Judge ${seatNumber}`}
                            </h4>
                            <p className="text-xs text-white/70 truncate">
                                {judge?.specialty || 'Guest Judge'}
                            </p>
                        </div>
                        {judge?.is_active && (
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        )}
                    </div>

                    {currentScore !== undefined && currentScore > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-3 -right-3 bg-amber-400 text-amber-900 rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg"
                        >
                            {currentScore}
                        </motion.div>
                    )}

                    {isCurrentUserJudge && (
                        <div className="space-y-3">
                            {isBroadcasting &&
                                livekitToken &&
                                (livekitServerUrl || livekitEnvServerUrl) && (
                                    <div className="rounded-xl overflow-hidden bg-black/60">
                                        <LiveKitRoom
                                            serverUrl={
                                                livekitServerUrl ||
                                                livekitEnvServerUrl ||
                                                ''
                                            }
                                            token={livekitToken}
                                            connect
                                            video
                                            audio
                                            onDisconnected={() =>
                                                setIsBroadcasting(false)
                                            }
                                        >
                                            <VideoConference />
                                        </LiveKitRoom>
                                    </div>
                                )}
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                                    <button
                                        key={score}
                                        onClick={() => onScore(score)}
                                        className={cn(
                                            "flex-1 py-2 rounded text-sm font-medium transition-all",
                                            currentScore === score
                                                ? "bg-amber-400 text-amber-900"
                                                : "bg-white/20 text-white hover:bg-white/30"
                                        )}
                                    >
                                        {score}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="outline"
                                onClick={onBuzz}
                                disabled={hasBuzzed}
                                className={cn(
                                    "w-full border-2",
                                    hasBuzzed
                                        ? "bg-red-500 border-red-500 text-white"
                                        : "border-white/50 text-white hover:bg-white/20"
                                )}
                            >
                                <Hand className="w-4 h-4 mr-2" />
                                {hasBuzzed ? "BUZZED!" : "Buzz"}
                            </Button>

                            {contestants && (
                                <>
                                    <Button
                                        variant="outline"
                                        className="w-full border-white/60 text-white bg-white/10 hover:bg-white/20"
                                        onClick={onOpenControls}
                                    >
                                        Open Judge Controls
                                    </Button>
                                    <Dialog open={showControls} onOpenChange={setShowControls}>
                                        <DialogContent className="bg-slate-900 border-white/10 p-0 max-w-xl w-full mx-4 rounded-3xl">
                                            <ContestantQueue
                                                contestants={contestants}
                                                onApprove={(id) => onApproveContestant && onApproveContestant(id)}
                                                onReject={(id) => onRejectContestant && onRejectContestant(id)}
                                                onBringToStage={(id) =>
                                                    onBringContestantToStage && onBringContestantToStage(id)
                                                }
                                                isJudge={isCurrentUserJudge}
                                                currentContestantId={currentContestantId}
                                                onClose={() => setShowControls(false)}
                                            />
                                        </DialogContent>
                                    </Dialog>
                                </>
                            )}
                        </div>
                    )}

                    {hasBuzzed && !isCurrentUserJudge && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="mt-3 bg-red-500 text-white text-center py-2 rounded-lg font-bold"
                        >
                            ✋ BUZZED
                        </motion.div>
                    )}
                </>
            )}
        </motion.div>
    );
}
