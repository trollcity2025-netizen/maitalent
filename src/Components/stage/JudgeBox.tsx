import { useState } from 'react';
import { motion as motionBase } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { cn } from "@/lib/utils";
import { createPageUrl } from '@/utils';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import { supabase } from '@/lib/supabaseClient';
import { getLiveKitToken } from '@/lib/api';

const motion: any = motionBase;

type JudgeInfo = {
    id?: string;
    display_name?: string;
    specialty?: string;
    is_active?: boolean;
    avatar?: string;
};


type JudgeBoxProps = {
    judge?: JudgeInfo | null;
    seatNumber: number;
    isCurrentUserJudge: boolean;
    onJoinSeat?(): void;
};

export default function JudgeBox({
    judge,
    seatNumber,
    isCurrentUserJudge,
    onJoinSeat
}: JudgeBoxProps) {
    const navigate = useNavigate();
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isStartingBroadcast, setIsStartingBroadcast] = useState(false);
    const [livekitToken, setLivekitToken] = useState<string | null>(null);
    const [livekitServerUrl, setLivekitServerUrl] = useState<string | null>(null);
    const [broadcastError, setBroadcastError] = useState<string | null>(null);
    const [isExiting, setIsExiting] = useState(false);

    const livekitEnvServerUrl = import.meta.env.VITE_LIVEKIT_SERVER_URL as string | undefined;

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

            // Use Supabase function instead of direct API call
            const token = await getLiveKitToken('main_show', judge?.display_name || `Judge ${seatNumber}`);
            
            const serverUrl = livekitEnvServerUrl;

            if (!token || !serverUrl) {
                throw new Error('Missing LiveKit configuration');
            }

            setLivekitToken(token);
            setLivekitServerUrl(serverUrl);
            setIsBroadcasting(true);
        } catch {
            setBroadcastError('Unable to start broadcast');
        } finally {
            setIsStartingBroadcast(false);
        }
    };

    const handleExitSeat = async () => {
        if (!judge?.id) return;
        
        try {
            setIsExiting(true);
            await supabase.entities.Judge.update(judge.id, {
                seat_number: null,
                is_active: false
            });
            setIsBroadcasting(false);
            setLivekitToken(null);
            setLivekitServerUrl(null);
        } catch (error) {
            console.error('Error exiting seat:', error);
        } finally {
            setIsExiting(false);
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


                    {isCurrentUserJudge && (
                        <div className="space-y-3">
                            {isBroadcasting &&
                                livekitToken &&
                                (livekitServerUrl || livekitEnvServerUrl) && (
                                    <div className="relative rounded-xl overflow-hidden bg-black/60">
                                        {/* Red Curtains for Judge Broadcast */}
                                        <div className="absolute inset-0 z-10">
                                            {/* Left Curtain */}
                                            <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-red-900 to-red-700 shadow-lg">
                                                <div className="absolute inset-0 bg-black opacity-30" />
                                            </div>
                                            {/* Right Curtain */}
                                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-red-900 to-red-700 shadow-lg">
                                                <div className="absolute inset-0 bg-black opacity-30" />
                                            </div>
                                        </div>
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
                            <div className="flex justify-between items-center">
                                {isBroadcasting ? (
                                    <span className="text-xs text-slate-400">Live Broadcast</span>
                                ) : (
                                    <span className="text-xs text-slate-400">Judge Seat</span>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleExitSeat}
                                    disabled={isExiting}
                                    className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                >
                                    <LogOut className="w-3 h-3 mr-1" />
                                    {isExiting ? 'Exiting...' : 'Exit Seat'}
                                </Button>
                            </div>
                        </div>
                    )}

                </>
            )}
        </motion.div>
    );
}
