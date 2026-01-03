import type React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion as motionBase } from 'framer-motion';
import { ArrowLeft, Upload, MapPin, User, Calendar, Edit2 } from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import { Badge } from "@/Components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Components/ui/tabs";
import Layout from '@/Layouts/Layout';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const motion = motionBase;

type UserProfile = {
    id?: string;
    coins?: number;
    total_votes_cast?: number;
    favorite_contestants?: unknown[] | null;
    profile_picture?: string | null;
    full_name?: string | null;
    email?: string | null;
    is_judge?: boolean;
    role?: string | null;
    level?: number | null;
    lifetime_coin_spend?: number | null;
    location?: string | null;
    bio?: string | null;
    created_at?: string | null;
};

export default function UserSettings() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        full_name: '',
        location: '',
        bio: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser as UserProfile);
                setEditData({
                    full_name: currentUser?.full_name || '',
                    location: currentUser?.location || '',
                    bio: currentUser?.bio || ''
                });
            } catch {
                supabase.auth.redirectToLogin();
            }
        };
        fetchUser();
    }, []);

    const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file) {
            setIsUploading(true);
            try {
                const { file_url } = await supabase.integrations.Core.UploadFile({ file });
                await supabase.auth.updateMe({ profile_picture: file_url });
                const updatedUser = await supabase.auth.me();
                setUser(updatedUser as UserProfile);
            } catch (e) {
                console.error(e);
            }
            setIsUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await supabase.auth.updateMe({
                full_name: editData.full_name.trim(),
                location: editData.location.trim(),
                bio: editData.bio.trim()
            });
            const updatedUser = await supabase.auth.me();
            setUser(updatedUser as UserProfile);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
        }
        setIsSaving(false);
    };

    const computeLevel = (profile: UserProfile | null): number => {
        if (!profile) {
            return 1;
        }
        if (profile.level && profile.level > 0) {
            return profile.level;
        }
        const spend = profile.lifetime_coin_spend || 0;
        if (spend >= 60000) return 5;
        if (spend >= 30000) return 4;
        if (spend >= 15000) return 3;
        if (spend >= 5000) return 2;
        return 1;
    };

    const userLevel = computeLevel(user);

    if (!user) {
        return (
            <Layout currentPageName="Settings">
            <div className="min-h-full bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
            </Layout>
        );
    }

    return (
        <Layout currentPageName="Settings">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link to={createPageUrl('Profile')}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-white flex-1">Settings</h1>
                </div>

                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="mb-2 bg-slate-900/60 border border-white/10">
                        <TabsTrigger value="profile">Profile</TabsTrigger>
                        <TabsTrigger value="account">Account</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 border border-white/10"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                                <div className="relative">
                                    <Avatar className="w-24 h-24 border-4 border-purple-500">
                                        <AvatarImage src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=random&size=96`} />
                                        <AvatarFallback className="bg-purple-600 text-white text-2xl">
                                            {user.full_name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-100 transition-colors">
                                        <Upload className="w-4 h-4 text-slate-600" />
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={handleProfilePictureUpload}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                                <div className="text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                        <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                                        <Badge className="bg-slate-800 text-amber-400 border border-amber-500/40">
                                            Level {userLevel}
                                        </Badge>
                                    </div>
                                    <p className="text-slate-400 flex items-center gap-2 justify-center md:justify-start">
                                        <User className="w-4 h-4" />
                                        {user.email}
                                    </p>
                                    {user.created_at && (
                                        <p className="text-slate-400 flex items-center gap-2 justify-center md:justify-start mt-1">
                                            <Calendar className="w-4 h-4" />
                                            Member since {new Date(user.created_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                        <Input
                                            value={editData.full_name}
                                            onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                                            placeholder="Your full name"
                                            className="bg-slate-900/60 border-white/10 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                        <Input
                                            value={editData.location}
                                            onChange={(e) => setEditData({...editData, location: e.target.value})}
                                            placeholder="Your city, country"
                                            className="bg-slate-900/60 border-white/10 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">About Me</label>
                                        <Textarea
                                            value={editData.bio}
                                            onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                            placeholder="Tell us about yourself"
                                            className="bg-slate-900/60 border-white/10 text-white"
                                            rows={4}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditData({
                                                    full_name: user.full_name || '',
                                                    location: user.location || '',
                                                    bio: user.bio || ''
                                                });
                                            }}
                                            className="border-white/30 text-white hover:bg-white/10"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                        <div className="flex items-center justify-between bg-slate-900/60 border border-white/10 rounded-lg p-3">
                                            <span className="text-white">{user.full_name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setIsEditing(true)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <Edit2 className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">Location</label>
                                        <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 rounded-lg p-3">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <span className="text-white">{user.location || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">About Me</label>
                                        <div className="bg-slate-900/60 border border-white/10 rounded-lg p-3">
                                            <p className="text-slate-300">{user.bio || 'No bio yet. Tell us about yourself!'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            <Link to={createPageUrl('Profile')}>
                                <Button className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                                    View Profile
                                </Button>
                            </Link>
                            <Link to={createPageUrl('CoinStore')}>
                                <Button className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90">
                                    Buy Coins
                                </Button>
                            </Link>
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="account" className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-slate-300">Email</span>
                                    <span className="text-white font-medium">{user.email}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-slate-300">Account Type</span>
                                    <Badge className={
                                        user.is_judge 
                                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' 
                                            : user.role === 'admin'
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
                                            : 'bg-slate-800 text-slate-300 border border-slate-600'
                                    }>
                                        {user.is_judge ? 'Judge' : user.role === 'admin' ? 'Admin' : 'Viewer'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-slate-300">Member Since</span>
                                    <span className="text-white font-medium">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-slate-900/60 rounded-lg">
                                    <span className="text-slate-300">User ID</span>
                                    <span className="text-slate-500 text-sm font-mono">{user.id}</span>
                                </div>
                            </div>
                        </motion.div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
        </Layout>
    );
}