import type React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabaseClient';
import { Sparkles, Home, Star, User, Coins, LogIn, Crown, Trophy, MessageCircle, Shield, Search, X } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';

type LayoutUser = {
    id?: string;
    coins?: number;
    full_name?: string | null;
    role?: string | null;
    email?: string | null;
};

type NavItem = {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    page: string;
    requiresAuth?: boolean;
};

type LayoutProps = {
    children: React.ReactNode;
    currentPageName?: string;
};

type SearchUser = {
    id: string;
    full_name?: string | null;
    email?: string | null;
    profile_picture?: string | null;
    role?: string | null;
    level?: number | null;
    hidden?: boolean | null;
    is_contestant?: boolean | null;
};

export default function Layout({ children, currentPageName }: LayoutProps) {
    const [user, setUser] = useState<LayoutUser | null>(null);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [followedMap, setFollowedMap] = useState<Record<string, boolean>>({});
    const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                if (currentUser && currentUser.email === 'trollcity2025@gmail.com') {
                    setUser({ ...currentUser, role: currentUser.role || 'admin' });
                } else {
                    setUser(currentUser);
                }
            } catch (e) {}
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!isSearchOpen) {
            return;
        }
        const term = searchQuery.trim();
        if (term.length < 3) {
            setSearchResults([]);
            setFollowedMap({});
            return;
        }

        let isCancelled = false;
        setIsSearching(true);

        const timeoutId = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('id, full_name, email, profile_picture, role, level, hidden, is_contestant')
                    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
                    .eq('hidden', false)
                    .neq('role', 'admin')
                    .limit(20);

                if (error) {
                    throw error;
                }
                if (!isCancelled) {
                    const results = (data || []) as SearchUser[];
                    setSearchResults(results);
                }
            } catch (e) {
                if (!isCancelled) {
                    setSearchResults([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [searchQuery, isSearchOpen]);

    useEffect(() => {
        const fetchFollows = async () => {
            if (!user?.email || !user.id) {
                setFollowedMap({});
                return;
            }
            if (searchResults.length === 0) {
                setFollowedMap({});
                return;
            }
            const targetIds = searchResults.map((u) => u.id);
            try {
                const { data, error } = await supabase
                    .from('follows')
                    .select('followed_id')
                    .eq('follower_id', user.id)
                    .in('followed_id', targetIds);
                if (error) {
                    throw error;
                }
                const map: Record<string, boolean> = {};
                (data || []).forEach((row: any) => {
                    if (row.followed_id) {
                        map[row.followed_id as string] = true;
                    }
                });
                setFollowedMap(map);
            } catch (e) {
                setFollowedMap({});
            }
        };

        fetchFollows();
    }, [searchResults, user?.id, user?.email]);

    const handleToggleFollow = async (targetId: string) => {
        if (!user?.id) {
            supabase.auth.redirectToLogin();
            return;
        }
        if (targetId === user.id) {
            return;
        }
        const isFollowing = !!followedMap[targetId];
        setFollowLoadingId(targetId);
        try {
            if (isFollowing) {
                const { data, error } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('followed_id', targetId);
                if (error) {
                    throw error;
                }
                const ids = (data || []).map((row: any) => row.id);
                if (ids.length > 0) {
                    await supabase.from('follows').delete().in('id', ids);
                }
            } else {
                await supabase.from('follows').insert({
                    follower_id: user.id,
                    followed_id: targetId
                });
            }
            setFollowedMap((prev) => ({
                ...prev,
                [targetId]: !isFollowing
            }));
        } catch (e) {
        } finally {
            setFollowLoadingId(null);
        }
    };

    const navItems: NavItem[] = [
        { name: 'Home', icon: Home, page: 'Home' },
        { name: 'Audition', icon: Sparkles, page: 'Audition' },
        { name: 'Leaderboard', icon: Trophy, page: 'Leaderboard' },
        { name: 'Coin Store', icon: Coins, page: 'CoinStore' },
        { name: 'Apply', icon: Star, page: 'Apply' },
        { name: 'Judge Panel', icon: Crown, page: 'JudgeApplication' },
        { name: 'Messages', icon: MessageCircle, page: 'Messages', requiresAuth: true },
        { name: 'Profile', icon: User, page: 'Profile', requiresAuth: true }
    ];

    const handleLogin = () => {
        supabase.auth.redirectToLogin();
    };

    return (
        <>
            <div className="flex h-screen bg-slate-950 overflow-hidden">
                <aside className="w-64 bg-slate-950/80 backdrop-blur-lg border-r border-white/10 flex flex-col">
                    <Link
                        to={createPageUrl('Home')}
                        className="flex items-center gap-2 p-4 border-b border-white/10 group"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
                            MAI Talent
                        </span>
                    </Link>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) => {
                            if (item.requiresAuth && !user) return null;
                            const isActive = currentPageName === item.page;
                            const Icon = item.icon;
                            return (
                                <Link key={item.name} to={createPageUrl(item.page)}>
                                    <div
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.name}</span>
                                    </div>
                                </Link>
                            );
                        })}

                        <button
                            type="button"
                            onClick={() => setIsSearchOpen(true)}
                            className="mt-2 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <Search className="w-5 h-5" />
                            <span>Search</span>
                        </button>

                        {user?.role === 'admin' && (
                            <Link to={createPageUrl('AdminDashboard')}>
                                <div className="mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors">
                                    <Shield className="w-5 h-5" />
                                    <span>Admin</span>
                                </div>
                            </Link>
                        )}
                    </nav>

                    <div className="p-4 border-t border-white/10 space-y-3">
                        {user && (
                            <Link to={createPageUrl('CoinStore')}>
                                <div className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 px-3 py-2 rounded-lg transition-colors cursor-pointer">
                                    <Coins className="w-5 h-5 text-amber-400" />
                                    <span className="text-amber-400 font-medium">
                                        {(user.coins || 0).toLocaleString()}
                                    </span>
                                </div>
                            </Link>
                        )}

                        {user ? (
                            <Link to={createPageUrl('Profile')}>
                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-white hover:bg-white/5 transition-colors">
                                    <User className="w-5 h-5" />
                                    <span className="text-sm">{user.full_name?.split(' ')[0] || 'Profile'}</span>
                                </div>
                            </Link>
                        ) : (
                            <Button
                                onClick={handleLogin}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        )}
                    </div>
                </aside>

                <main className="flex-1 overflow-hidden">{children}</main>
            </div>

            {isSearchOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
                    <div className="w-full max-w-xl bg-slate-900 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users by name or email (min 3 characters)"
                                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-white/10"
                                onClick={() => {
                                    setIsSearchOpen(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                    setFollowedMap({});
                                }}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto p-2">
                            {searchQuery.trim().length < 3 && (
                                <p className="text-xs text-slate-500 px-2 py-4">
                                    Type at least 3 characters to search.
                                </p>
                            )}
                            {searchQuery.trim().length >= 3 && isSearching && (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {searchQuery.trim().length >= 3 && !isSearching && searchResults.length === 0 && (
                                <p className="text-xs text-slate-500 px-2 py-4">No users found.</p>
                            )}
                            {searchResults.map((u) => {
                                const displayName = u.full_name || u.email || 'User';
                                const levelLabel = u.level ?? 1;
                                const isFollowing = !!followedMap[u.id];
                                const isSelf = user?.id && u.id === user.id;
                                return (
                                    <div
                                        key={u.id}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                                    >
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage
                                                src={
                                                    u.profile_picture ||
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        displayName
                                                    )}&background=random&size=96`
                                                }
                                            />
                                            <AvatarFallback className="bg-purple-600 text-white text-xs">
                                                {displayName[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{displayName}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                <span>Level {levelLabel}</span>
                                                {u.role === 'judge' && <span>Judge</span>}
                                                {u.is_contestant && <span>Contestant</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {user && !isSelf && (
                                                <Button
                                                    size="sm"
                                                    variant={isFollowing ? 'outline' : 'default'}
                                                    className={cn(
                                                        'h-8 text-xs px-3',
                                                        isFollowing
                                                            ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                                                            : 'bg-purple-600 hover:bg-purple-700'
                                                    )}
                                                    disabled={followLoadingId === u.id}
                                                    onClick={() => handleToggleFollow(u.id)}
                                                >
                                                    {isFollowing ? 'Following' : 'Follow'}
                                                </Button>
                                            )}
                                            {u.email && (
                                                <Link to={`${createPageUrl('Messages')}?to=${encodeURIComponent(u.email)}`}>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-300 hover:text-white hover:bg-white/10"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
