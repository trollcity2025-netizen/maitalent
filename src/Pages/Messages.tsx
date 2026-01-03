import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Layout from '@/Layouts/Layout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import {
    MessageCircle, Send, Search, ArrowLeft,
    Check, CheckCheck
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

type MessageUser = {
    email: string;
    full_name?: string | null;
    is_verified?: boolean;
};

type MessageRecord = {
    id: string;
    from_email: string;
    to_email: string;
    from_name?: string | null;
    to_name?: string | null;
    message: string;
    conversation_id?: string | null;
    created_date: string;
    is_read: boolean;
};

type ConversationSummary = {
    conversationId: string;
    email: string;
    name?: string | null;
    is_verified?: boolean;
    lastMessage: MessageRecord;
    unreadCount: number;
};

export default function Messages() {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<MessageUser | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Get 'to' parameter from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const toEmail = urlParams.get('to');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = (await supabase.auth.me()) as MessageUser;
                setUser(currentUser);

                if (toEmail) {
                    const dummyLastMessage: MessageRecord = {
                        id: 'initial',
                        from_email: currentUser.email,
                        to_email: toEmail,
                        from_name: currentUser.full_name,
                        to_name: null,
                        message: '',
                        conversation_id: [currentUser.email, toEmail]
                            .sort()
                            .join('-'),
                        created_date: new Date().toISOString(),
                        is_read: true
                    };
                    setSelectedConversation({
                        email: toEmail,
                        conversationId: [currentUser.email, toEmail]
                            .sort()
                            .join('-'),
                        lastMessage: dummyLastMessage,
                        unreadCount: 0
                    });
                }
            } catch {
                supabase.auth.redirectToLogin();
            }
        };
        fetchUser();
    }, [toEmail]);

    // Fetch all messages for current user
    const { data: allMessages = [] } = useQuery<MessageRecord[]>({
        queryKey: ['messages', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const sent = (await supabase.entities.Message.filter({
                from_email: user.email
            })) as MessageRecord[];
            const received = (await supabase.entities.Message.filter({
                to_email: user.email
            })) as MessageRecord[];
            return [...sent, ...received].sort(
                (a, b) =>
                    new Date(b.created_date).getTime() -
                    new Date(a.created_date).getTime()
            );
        },
        enabled: !!user?.email,
        refetchInterval: 3000
    });

    // Get unique conversations
    const conversations: ConversationSummary[] = React.useMemo(() => {
        if (!user?.email) return [];

        const convMap = new Map<string, ConversationSummary>();
        allMessages.forEach(msg => {
            const otherEmail =
                msg.from_email === user.email ? msg.to_email : msg.from_email;
            const otherName =
                msg.from_email === user.email ? msg.to_name : msg.from_name;
            const convId =
                msg.conversation_id ||
                [user.email, otherEmail].sort().join('-');

            if (!convMap.has(convId)) {
                convMap.set(convId, {
                    conversationId: convId,
                    email: otherEmail,
                    name: otherName,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            const conv = convMap.get(convId)!;
            if (
                new Date(msg.created_date) >
                new Date(conv.lastMessage.created_date)
            ) {
                conv.lastMessage = msg;
            }
            if (!msg.is_read && msg.to_email === user.email) {
                conv.unreadCount++;
            }
        });

        return Array.from(convMap.values()).sort(
            (a, b) =>
                new Date(b.lastMessage.created_date).getTime() -
                new Date(a.lastMessage.created_date).getTime()
        );
    }, [allMessages, user?.email]);

    // Get messages for selected conversation
    const conversationMessages = React.useMemo(() => {
        if (!user || !selectedConversation) return [];
        return allMessages
            .filter(
                msg =>
                    msg.conversation_id ===
                        selectedConversation.conversationId ||
                    (msg.from_email === user.email &&
                        msg.to_email === selectedConversation.email) ||
                    (msg.to_email === user.email &&
                        msg.from_email === selectedConversation.email)
            )
            .sort(
                (a, b) =>
                    new Date(a.created_date).getTime() -
                    new Date(b.created_date).getTime()
            );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allMessages, selectedConversation, user]);

    // Send message mutation
    const sendMessageMutation = useMutation<void, unknown, string>({
        mutationFn: async (messageText: string) => {
            if (!user || !selectedConversation) {
                return;
            }
            const convId = selectedConversation.conversationId;
            await supabase.entities.Message.create({
                from_email: user.email,
                to_email: selectedConversation.email,
                from_name: user.full_name,
                to_name: selectedConversation.name,
                message: messageText,
                conversation_id: convId,
                is_read: false
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
            setNewMessage('');
        }
    });

    // Mark as read
    const markAsReadMutation = useMutation<void, unknown, string[]>({
        mutationFn: async (messageIds: string[]) => {
            for (const id of messageIds) {
                await supabase.entities.Message.update(id, { is_read: true });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages'] });
        }
    });

    useEffect(() => {
        if (selectedConversation && conversationMessages.length > 0 && user?.email) {
            const unreadIds = conversationMessages
                .filter(msg => !msg.is_read && msg.to_email === user.email)
                .map(msg => msg.id);
            if (unreadIds.length > 0 && !markAsReadMutation.isPending) {
                markAsReadMutation.mutate(unreadIds);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedConversation, conversationMessages, user, markAsReadMutation.isPending]);

    const handleSendMessage = () => {
        if (newMessage.trim() && selectedConversation) {
            sendMessageMutation.mutate(newMessage.trim());
        }
    };

    const filteredConversations = conversations.filter(conv => 
        conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout currentPageName="Messages">
        <div className="h-full bg-gradient-to-b from-slate-950 to-slate-900 flex">
            {/* Sidebar - Conversations List */}
            <div className={cn(
                "w-full md:w-80 border-r border-white/10 bg-slate-900/50 flex flex-col",
                selectedConversation && "hidden md:flex"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <MessageCircle className="w-6 h-6" />
                        Messages
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="pl-10 bg-white/5 border-white/10 text-white"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.map((conv) => (
                        <button
                            key={conv.conversationId}
                            onClick={() => setSelectedConversation(conv)}
                            className={cn(
                                "w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5",
                                selectedConversation?.conversationId === conv.conversationId && "bg-white/10"
                            )}
                        >
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(conv.name || 'User')}&background=random`} />
                                <AvatarFallback>
                                    {conv.name?.[0] || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-left">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            to={createPageUrl(`viewer/${conv.email}`)}
                                            className="font-medium text-white truncate hover:text-blue-300 transition-colors"
                                        >
                                            {conv.name}
                                        </Link>
                                        {conv.is_verified && (
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
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        {format(new Date(conv.lastMessage.created_date), 'MMM d')}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 truncate">
                                    {conv.lastMessage.from_email === user?.email && 'You: '}
                                    {conv.lastMessage.message}
                                </p>
                            </div>
                            {conv.unreadCount > 0 && (
                                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
                                    {conv.unreadCount}
                                </div>
                            )}
                        </button>
                    ))}
                    {filteredConversations.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8">
                            <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                            <p>No conversations yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={cn(
                "flex-1 flex flex-col",
                !selectedConversation && "hidden md:flex"
            )}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-white/10 bg-slate-900/50 flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-white"
                                onClick={() => setSelectedConversation(null)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.name || 'User')}&background=random`} />
                                <AvatarFallback>
                                    {selectedConversation.name?.[0] || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Link
                                    to={createPageUrl(`viewer/${selectedConversation.email}`)}
                                    className="font-medium text-white hover:text-blue-300 transition-colors"
                                >
                                    {selectedConversation.name}
                                </Link>
                                <p className="text-xs text-slate-400">{selectedConversation.email}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <AnimatePresence initial={false}>
                                {conversationMessages.map((msg) => {
                                    const isOwn = msg.from_email === user?.email;
                                    return (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={cn(
                                                "flex",
                                                isOwn ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-xs md:max-w-md rounded-2xl px-4 py-2",
                                                isOwn 
                                                    ? "bg-blue-600 text-white" 
                                                    : "bg-white/10 text-white"
                                            )}>
                                                <p className="text-sm">{msg.message}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-xs opacity-70">
                                                        {format(new Date(msg.created_date), 'HH:mm')}
                                                    </span>
                                                    {isOwn && (
                                                        msg.is_read ? 
                                                            <CheckCheck className="w-3 h-3" /> : 
                                                            <Check className="w-3 h-3" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-white/10 bg-slate-900/50">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-white/5 border-white/10 text-white"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p>Select a conversation to start messaging</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        </Layout>
    );
}
