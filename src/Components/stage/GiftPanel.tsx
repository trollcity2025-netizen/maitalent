import React, { useState } from 'react';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import { Gift, Coins, Send } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { cn } from "@/lib/utils";

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

type GiftItem = {
    id: string;
    icon: React.ReactNode;
    name: string;
    coin_cost: number;
    vote_value: number;
};

type ContestantInfo = {
    profile_image?: string;
    name?: string;
    talent_type?: string;
};

type GiftPanelProps = {
    gifts: GiftItem[];
    userCoins: number;
    contestant?: ContestantInfo | null;
    onSendGift(gift: GiftItem): void;
    isLoading: boolean;
};

export default function GiftPanel({ gifts, userCoins, contestant, onSendGift, isLoading }: GiftPanelProps) {
    const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleGiftClick = (gift: GiftItem) => {
        if (userCoins >= gift.coin_cost) {
            setSelectedGift(gift);
            setShowConfirm(true);
        }
    };

    const handleConfirmSend = () => {
        if (selectedGift) {
            onSendGift(selectedGift);
            setShowConfirm(false);
            setSelectedGift(null);
        }
    };

    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-pink-400" />
                    <h3 className="font-semibold text-white">Send Gifts</h3>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-full">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-400 font-medium">{userCoins?.toLocaleString() || 0}</span>
                </div>
            </div>

            {/* Contestant Target */}
            {contestant && (
                <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center gap-3">
                    <img
                        src={contestant.profile_image}
                        alt={contestant.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-amber-400"
                    />
                    <div>
                        <p className="text-white font-medium">{contestant.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{contestant.talent_type}</p>
                    </div>
                </div>
            )}

            {/* Gifts Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {gifts?.map((gift) => {
                    const canAfford = userCoins >= gift.coin_cost;
                    return (
                        <motion.button
                            key={gift.id}
                            whileHover={{ scale: canAfford ? 1.05 : 1 }}
                            whileTap={{ scale: canAfford ? 0.95 : 1 }}
                            onClick={() => handleGiftClick(gift)}
                            disabled={!canAfford || !contestant}
                            className={cn(
                                "relative p-3 rounded-xl border-2 transition-all",
                                selectedGift?.id === gift.id
                                    ? "border-pink-500 bg-pink-500/20"
                                    : canAfford
                                        ? "border-white/10 bg-white/5 hover:border-white/30"
                                        : "border-white/5 bg-white/5 opacity-50 cursor-not-allowed"
                            )}
                        >
                            <motion.span 
                                className="text-3xl block mb-1"
                                animate={selectedGift?.id === gift.id ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                            >
                                {gift.icon}
                            </motion.span>
                            <p className="text-xs text-white font-medium truncate">{gift.name}</p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Coins className="w-3 h-3 text-amber-400" />
                                <span className="text-xs text-amber-400">{gift.coin_cost}</span>
                            </div>
                            <div className="text-[10px] text-green-400 mt-0.5">
                                +{gift.vote_value} votes
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Confirm Panel */}
            <AnimatePresence>
                {showConfirm && selectedGift && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{selectedGift.icon}</span>
                                <div>
                                    <p className="text-white font-medium">{selectedGift.name}</p>
                                    <p className="text-xs text-white/70">to {contestant?.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-amber-300 font-bold">{selectedGift.coin_cost} coins</p>
                                <p className="text-xs text-green-300">+{selectedGift.vote_value} votes</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 border-white/30 text-white hover:bg-white/20"
                                onClick={() => {
                                    setShowConfirm(false);
                                    setSelectedGift(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-white text-purple-600 hover:bg-white/90"
                                onClick={handleConfirmSend}
                                disabled={isLoading}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                Send Gift
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
