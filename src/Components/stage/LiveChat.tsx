import React, { useState, useRef, useEffect } from 'react';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import { Send, Gift, MessageCircle } from 'lucide-react';
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Avatar, AvatarFallback } from "@/Components/ui/avatar";
import { cn } from "@/lib/utils";

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

type ChatMessage = {
    id?: string;
    user_name?: string;
    message: string;
    type?: string;
    gift_type?: string;
};

type LiveChatProps = {
    messages: ChatMessage[];
    onSendMessage(message: string): void;
    currentUser?: unknown;
};

export default function LiveChat({ messages, onSendMessage }: LiveChatProps) {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (newMessage.trim()) {
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
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs">
                                        {msg.user_name?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-medium text-white truncate">
                                            {msg.user_name}
                                        </span>
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
            </div>
        </div>
    );
}
