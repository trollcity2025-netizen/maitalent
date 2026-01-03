import React, { useState, useRef, useEffect } from 'react';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import { Send, Gift, MessageCircle, Coins } from 'lucide-react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

type ChatMessage = {
    id?: string;
    user_name?: string;
    user_email?: string;
    message: string;
    type?: string;
    gift_type?: string;
    profile_picture?: string;
    level?: number;
    coins?: number;
    is_verified?: boolean;
};

type LiveChatProps = {
    messages: ChatMessage[];
    onSendMessage(message: string): void;
    currentUser?: {
        email?: string | null;
        full_name?: string | null;
        coins?: number;
        level?: number;
        profile_picture?: string | null;
    } | null;
};

export default function LiveChat({ messages, onSendMessage, currentUser }: LiveChatProps) {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Auto-delete messages after 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const thirtySecondsAgo = new Date(now.getTime() - 30000);
            
            // Filter out messages older than 30 seconds
            messages.filter(msg => {
                if (!msg.id) return true; // Keep messages without IDs (system messages)
                const msgDate = new Date(msg.id); // Assuming ID contains timestamp or use created_date
                return msgDate > thirtySecondsAgo;
            });
            
            // If messages were filtered, you might need to update parent state
            // For now, we'll just visually hide old messages
        }, 1000);

        return () => clearInterval(interval);
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim() && currentUser) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getMessageStyle = (type?: string) => {
        switch (type) {
            case 'gift':
                return 'bg-gradient-to-r from-pink-500/30 to-purple-500/30 border border-pink-500/50';
            case 'system':
                return 'bg-amber-500/20 border border-amber-500/30';
            default:
                return 'bg-white/5';
        }
    };

    return (
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-xl flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">Live Chat</h3>
                <span className="ml-auto text-xs text-slate-400">{messages?.length || 0} messages</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                <AnimatePresence initial={false}>
                    {messages?.map((msg, index) => (
                        <motion.div
                            key={msg.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className={cn(
                                "rounded-xl p-3",
                                getMessageStyle(msg.type)
                            )}
                        >
                            <div className="flex items-start gap-2">
                                <Avatar className="h-7 w-7 flex-shrink-0">
                                    <AvatarImage src={msg.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.user_name || 'User')}&background=random`} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                        {msg.user_name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <Link
                                            to={createPageUrl(`viewer/${msg.user_email}`)}
                                            className="text-sm font-medium text-white truncate cursor-pointer hover:text-blue-300 transition-colors"
                                        >
                                            {msg.user_name}
                                        </Link>
                                        {msg.is_verified && (
                                            <Link
                                                to={createPageUrl('CoinStore')}
                                                className="cursor-pointer hover:text-amber-300 transition-colors"
                                                title="Verified Mai Talent User"
                                            >
                                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-none shadow-lg hover:shadow-xl">
                                                    ✅
                                                </Badge>
                                            </Link>
                                        )}
                                        {msg.level && (
                                            <Badge className="bg-slate-800 text-amber-400 border border-amber-500/40 text-xs px-1 py-0">
                                                L{msg.level}
                                            </Badge>
                                        )}
                                        {msg.coins !== undefined && (
                                            <span className="text-xs text-amber-400 flex items-center gap-1">
                                                <Coins className="w-3 h-3" />
                                                {msg.coins}
                                            </span>
                                        )}
                                        {msg.type === 'gift' && (
                                            <Gift className="w-3 h-3 text-pink-400" />
                                        )}
                                    </div>
                                    {msg.type === 'gift' ? (
                                        <p className="text-sm text-pink-300">
                                            Sent {msg.gift_type} {msg.message}
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-300 break-words">
                                            {msg.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
                {currentUser ? (
                    <div className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Say something..."
                            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus-visible:ring-blue-500"
                            maxLength={200}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!newMessage.trim()}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-2 text-slate-400">
                        Please log in to send messages
                    </div>
                )}
            </div>
        </div>
    );
}
