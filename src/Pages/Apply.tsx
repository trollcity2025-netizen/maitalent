import type React from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion as motionBase } from 'framer-motion';
import { 
    Star, Upload, Music, Wand2, Drama, Sparkles, 
    ArrowLeft, Send, CheckCircle, Info
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue
} from "@/Components/ui/select";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import Layout from '@/Layouts/Layout';

const motion: any = motionBase;

type ApplyUser = {
    email?: string | null;
    full_name?: string | null;
};

const talentTypes = [
    { value: 'singing', label: 'Singing', icon: Music },
    { value: 'dancing', label: 'Dancing', icon: Drama },
    { value: 'magic', label: 'Magic', icon: Wand2 },
    { value: 'comedy', label: 'Comedy', icon: Drama },
    { value: 'instrumental', label: 'Instrumental', icon: Music },
    { value: 'acrobatics', label: 'Acrobatics', icon: Sparkles },
    { value: 'other', label: 'Other', icon: Star }
];

export default function Apply() {
    const [user, setUser] = useState<ApplyUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        talent_type: '',
        description: '',
        video_url: ''
    });
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser);
                if (currentUser.full_name) {
                    setFormData(prev => ({ ...prev, name: currentUser.full_name }));
                }
            } catch (e) {
            }
        };
        fetchUser();
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file) {
            setIsUploading(true);
            try {
                const { file_url } = await supabase.integrations.Core.UploadFile({ file });
                setProfileImage(file_url);
            } catch (e) {
                console.error(e);
            }
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await supabase.entities.Contestant.create({
                ...formData,
                email: user?.email,
                profile_image: profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
                status: 'pending',
                votes: 0,
                gifts_received: 0,
                total_score: 0
            });
            setSubmitted(true);
        } catch (e) {
            console.error(e);
        }
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <Layout currentPageName="Apply">
            <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 backdrop-blur rounded-3xl p-8 md:p-12 text-center max-w-lg border border-white/10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-4">Application Submitted!</h2>
                    <p className="text-slate-400 mb-8">
                        Thank you for applying to MAI Talent! Our judges will review your application 
                        and you'll receive an update soon. Good luck!
                    </p>
                    <Link to={createPageUrl('Home')}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                            Return to Home
                        </Button>
                    </Link>
                </motion.div>
            </div>
            </Layout>
        );
    }

    return (
        <Layout currentPageName="Apply">
        <div className="h-full overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to={createPageUrl('Home')}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Apply to Perform</h1>
                        <p className="text-slate-400">Show us what you've got!</p>
                    </div>
                </div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-8 flex items-start gap-3"
                >
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-200">
                        <p className="font-medium mb-1">How it works:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-300">
                            <li>Submit your application with your talent details</li>
                            <li>Our judges will review your submission</li>
                            <li>If approved, you'll be added to the performance queue</li>
                            <li>When called, you'll have 2 minutes to showcase your talent live!</li>
                        </ul>
                    </div>
                </motion.div>

                {/* Application Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 border border-white/10 space-y-6"
                >
                    {/* Profile Image */}
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <div className={cn(
                                "w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden",
                                profileImage && "p-0"
                            )}>
                                {profileImage ? (
                                    <img 
                                        src={profileImage} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Star className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-100 transition-colors">
                                <Upload className="w-5 h-5 text-slate-600" />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-slate-400">
                            {isUploading ? 'Uploading...' : 'Upload your photo'}
                        </p>
                    </div>

                    {/* Stage Name */}
                    <div className="space-y-2">
                        <Label className="text-white">Stage Name *</Label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your performer name"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                    </div>

                    {/* Talent Type */}
                    <div className="space-y-2">
                        <Label className="text-white">Talent Type *</Label>
                        <Select 
                            value={formData.talent_type}
                            onValueChange={(value) => setFormData({ ...formData, talent_type: value })}
                            required
                        >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select your talent category" />
                            </SelectTrigger>
                            <SelectContent>
                                {talentTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                            <type.icon className="w-4 h-4" />
                                            {type.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-white">Describe Your Talent *</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Tell us about your talent and what makes you unique..."
                            required
                            rows={4}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Video URL (Optional) */}
                    <div className="space-y-2">
                        <Label className="text-white">Audition Video URL (Optional)</Label>
                        <Input
                            value={formData.video_url}
                            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                            placeholder="YouTube or other video link"
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                        <p className="text-xs text-slate-400">
                            Adding a video increases your chances of getting approved!
                        </p>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.name || !formData.talent_type || !formData.description}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 h-12 text-lg"
                    >
                        {isSubmitting ? (
                            'Submitting...'
                        ) : (
                            <>
                                <Send className="w-5 h-5 mr-2" />
                                Submit Application
                            </>
                        )}
                    </Button>
                </motion.form>
            </div>
        </div>
        </Layout>
    );
}
