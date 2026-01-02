import { useState, useEffect, useRef } from 'react';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import { Volume2, VolumeX, Users, Clock, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/Components/ui/button";
import { createPageUrl } from '@/utils';
import { Badge } from "@/Components/ui/badge";

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

type TheaterContestant = {
    profile_image?: string;
    name?: string;
    talent_type?: string;
};

type CurtainState = "closed" | "opening" | "open" | "closing";

type TheaterStageProps = {
    contestant?: TheaterContestant | null;
    isLive?: boolean;
    curtainsOpen?: boolean;
    timeRemaining?: number;
    viewerCount: number;
    enableLocalStream?: boolean;
};

export default function TheaterStage({ contestant, isLive, curtainsOpen, timeRemaining, viewerCount, enableLocalStream }: TheaterStageProps) {
    const [isMuted, setIsMuted] = useState(true);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [curtainState, setCurtainState] = useState<CurtainState>("closed");
    const [hasStarted, setHasStarted] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const navigate = useNavigate();
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!enableLocalStream || !hasStarted) {
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
                setStream(null);
            }
            return;
        }

        let cancelled = false;

        const startStream = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (!cancelled) {
                    setStream(mediaStream);
                } else {
                    mediaStream.getTracks().forEach((track) => track.stop());
                }
            } catch (e) {}
        };

        if (!stream) {
            startStream();
        }

        return () => {
            cancelled = true;
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [enableLocalStream, hasStarted]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (enableLocalStream) {
            return;
        }
        if (curtainsOpen) {
            setCurtainState("opening");
            const timeout = setTimeout(() => setCurtainState("open"), 1500);
            return () => clearTimeout(timeout);
        } else {
            setCurtainState("closing");
            const timeout = setTimeout(() => setCurtainState("closed"), 1500);
            return () => clearTimeout(timeout);
        }
    }, [curtainsOpen, enableLocalStream]);

    const isCurtainOpen = curtainState === "opening" || curtainState === "open";

    const handleStartReady = () => {
        if (!enableLocalStream || hasStarted) {
            return;
        }
        setHasStarted(true);
        setCurtainState("opening");
        setTimeout(() => setCurtainState("open"), 1500);
    };

    return (
        <div className="relative w-full h-full overflow-hidden rounded-2xl shadow-2xl">
            {/* Stage Frame */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-900 via-amber-800 to-amber-950 z-0" />
            
            {/* Gold trim */}
            <div className="absolute inset-2 border-4 border-amber-400/30 rounded-xl z-10 pointer-events-none" />
            <div className="absolute inset-4 border border-amber-300/20 rounded-lg z-10 pointer-events-none" />
            
            {/* Stage Lights */}
            <div className="absolute top-0 left-0 right-0 h-8 flex justify-around z-20 pointer-events-none">
                {[...Array(7)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-4 h-4 rounded-full bg-amber-300"
                        animate={{ 
                            opacity: isLive ? [0.5, 1, 0.5] : 0.3,
                            boxShadow: isLive 
                                ? ['0 0 20px #fbbf24', '0 0 40px #fbbf24', '0 0 20px #fbbf24']
                                : '0 0 10px #fbbf24'
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
            
            <motion.div
                className="absolute top-0 bottom-0 left-0 w-1/2 z-30 origin-left"
                style={{
                    background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 30%, #b91c1c 50%, #991b1b 70%, #7f1d1d 100%)',
                    boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.5)',
                }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: isCurtainOpen ? 0 : 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Curtain folds */}
                <div className="absolute inset-0 opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 w-[12.5%]"
                            style={{
                                left: `${i * 12.5}%`,
                                background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%)`,
                            }}
                        />
                    ))}
                </div>
                {/* Gold trim on curtain */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-amber-600 via-amber-500 to-transparent opacity-50" />
                <div className="absolute top-12 right-0 w-8 h-full bg-gradient-to-l from-amber-700/30 to-transparent" />
            </motion.div>
            
            <motion.div
                className="absolute top-0 bottom-0 right-0 w-1/2 z-30 origin-right"
                style={{
                    background: 'linear-gradient(270deg, #7f1d1d 0%, #991b1b 30%, #b91c1c 50%, #991b1b 70%, #7f1d1d 100%)',
                    boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.5)',
                }}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: isCurtainOpen ? 0 : 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            >
                {/* Curtain folds */}
                <div className="absolute inset-0 opacity-30">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-0 bottom-0 w-[12.5%]"
                            style={{
                                left: `${i * 12.5}%`,
                                background: `linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 50%, transparent 100%)`,
                            }}
                        />
                    ))}
                </div>
                {/* Gold trim on curtain */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-amber-600 via-amber-500 to-transparent opacity-50" />
                <div className="absolute top-12 left-0 w-8 h-full bg-gradient-to-r from-amber-700/30 to-transparent" />
            </motion.div>
            
            <div className="absolute inset-8 z-20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />
                <div className="relative w-full h-full">
                    <AnimatePresence mode="wait">
                        {!isLive && !contestant ? (
                            <motion.div
                                key="waiting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center"
                            >
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center border border-white/20">
                                        <Plus className="w-10 h-10 text-white" />
                                    </div>
                                    <Button
                                        className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                        onClick={() => navigate(createPageUrl('Apply'))}
                                    >
                                        Join as Contestant
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-black/80 to-transparent text-center">
                                    <p className="text-sm font-semibold text-white">Contestant</p>
                                </div>
                            </motion.div>
                        ) : contestant ? (
                            <motion.div
                                key="performer"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <div className="relative w-full h-full">
                                    {stream ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img
                                            src={contestant.profile_image || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"}
                                            alt={contestant.name}
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/50" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                                        <h3 className="text-2xl font-bold text-white">{contestant.name}</h3>
                                        <p className="text-amber-400 capitalize">{contestant.talent_type}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <p className="text-slate-500 text-xl">Waiting for next performer...</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {contestant && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full text-xs text-white">
                            <span className={`w-2 h-2 rounded-full ${stream && !isMuted ? "bg-emerald-400" : "bg-red-500"}`} />
                            <span>{stream && !isMuted ? "Mic On" : "Mic Muted"}</span>
                        </div>
                    )}

                    {enableLocalStream && !hasStarted && (
                        <div className="absolute inset-0 flex items-center justify-center z-40">
                            <Button
                                className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                onClick={handleStartReady}
                            >
                                Start / Ready
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-950 to-transparent z-25 pointer-events-none" />
            
            <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-40">
                <div className="flex items-center gap-2">
                    {isLive && (
                        <Badge className="bg-red-600 text-white animate-pulse px-3 py-1">
                            <span className="w-2 h-2 bg-white rounded-full mr-2 inline-block" />
                            LIVE
                        </Badge>
                    )}
                    {viewerCount > 0 && (
                        <Badge className="bg-black/50 backdrop-blur text-white px-3 py-1">
                            <Users className="w-3 h-3 mr-1 inline" />
                            {viewerCount.toLocaleString()}
                        </Badge>
                    )}
                </div>
                
                {isLive && timeRemaining !== undefined && (
                    <Badge className="bg-black/50 backdrop-blur text-white px-3 py-1">
                        <Clock className="w-3 h-3 mr-1 inline" />
                        {formatTime(timeRemaining)}
                    </Badge>
                )}
            </div>
            
            <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-6 right-6 z-40 p-2 bg-black/50 backdrop-blur rounded-full text-white hover:bg-black/70 transition-colors"
            >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
        </div>
    );
}
