import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion as motionBase } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
    Shield, Upload, CheckCircle, Info, Award,
    Star, Users, Sparkles
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
import Layout from '@/Layouts/Layout';

const motion: any = motionBase;

type JudgeUser = {
    email?: string | null;
    full_name?: string | null;
};

export default function JudgeApplication() {
    const navigate = useNavigate();
    const [user, setUser] = useState<JudgeUser | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        display_name: '',
        specialty: '',
        bio: '',
        experience: '',
        twitter: '',
        instagram: '',
        linkedin: ''
    });
    const [avatar, setAvatar] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser);
                if (currentUser.full_name) {
                    setFormData(prev => ({ ...prev, display_name: currentUser.full_name }));
                }

                // Check if already applied
                const existingApp = await supabase.entities.Judge.filter({ user_email: currentUser.email });
                if (existingApp.length > 0) {
                    setSubmitted(true);
                }
            } catch (e) {
                supabase.auth.redirectToLogin();
            }
        };
        fetchUser();
    }, []);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        if (file) {
            setIsUploading(true);
            try {
                const { file_url } = await supabase.integrations.Core.UploadFile({ file });
                setAvatar(file_url);
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
            if (!user?.email) {
                return;
            }
            await supabase.entities.Judge.create({
                user_email: user.email,
                display_name: formData.display_name,
                specialty: formData.specialty,
                bio: formData.bio,
                experience: formData.experience,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.display_name)}&background=random`,
                application_status: 'pending',
                is_active: false,
                social_media: {
                    twitter: formData.twitter,
                    instagram: formData.instagram,
                    linkedin: formData.linkedin
                }
            });
            setSubmitted(true);
        } catch (e) {
            console.error(e);
        }
        setIsSubmitting(false);
    };

    if (submitted) {
        return (
            <Layout currentPageName="JudgeApplication">
            <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/5 backdrop-blur rounded-3xl p-8 md:p-12 text-center max-w-lg border border-white/10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto mb-6"
                    >
                        <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-bold text-white mb-4">Application Submitted!</h2>
                    <p className="text-slate-400 mb-8">
                        Thank you for applying to be a MAI Talent judge! Our admin team will review your 
                        application and get back to you soon.
                    </p>
                    <Button 
                        onClick={() => navigate(createPageUrl('Home'))}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90"
                    >
                        Return to Home
                    </Button>
                </motion.div>
            </div>
            </Layout>
        );
    }

    return (
        <Layout currentPageName="JudgeApplication">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4">
            <div className="container mx-auto max-w-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h1 className="text-4xl font-bold text-white mb-2">Apply to be a Judge</h1>
                    <p className="text-slate-400">Help discover the next generation of talent</p>
                </motion.div>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-6 mb-8"
                >
                    <div className="flex items-start gap-3 mb-4">
                        <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-white font-medium mb-2">Judge Benefits:</p>
                            <ul className="space-y-2 text-sm text-purple-200">
                                <li className="flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Score performances and influence results
                                </li>
                                <li className="flex items-center gap-2">
                                    <Star className="w-4 h-4" />
                                    Get recognition as an industry expert
                                </li>
                                <li className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    Connect with emerging talent
                                </li>
                                <li className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Access exclusive judge features
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Application Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleSubmit}
                    className="bg-white/5 backdrop-blur rounded-2xl p-6 md:p-8 border border-white/10 space-y-6"
                >
                    {/* Profile Picture */}
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <div className={cn(
                                "w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center overflow-hidden",
                                avatar && "p-0"
                            )}>
                                {avatar ? (
                                    <img 
                                        src={avatar} 
                                        alt="Avatar" 
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Shield className="w-12 h-12 text-white" />
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-slate-100 transition-colors">
                                <Upload className="w-5 h-5 text-slate-600" />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        </div>
                        <p className="text-sm text-slate-400">
                            {isUploading ? 'Uploading...' : 'Upload your photo'}
                        </p>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <Label className="text-white">Full Name *</Label>
                        <Input
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            placeholder="Your full name"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                    </div>

                    {/* Specialty */}
                    <div className="space-y-2">
                        <Label className="text-white">Specialty / Expertise *</Label>
                        <Input
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            placeholder="e.g., Vocal Coach, Dance Choreographer, Music Producer"
                            required
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <Label className="text-white">Bio *</Label>
                        <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder="Tell us about yourself and why you'd be a great judge..."
                            required
                            rows={4}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                        <Label className="text-white">Relevant Experience *</Label>
                        <Textarea
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            placeholder="Describe your professional background, achievements, and credentials..."
                            required
                            rows={5}
                            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4">
                        <Label className="text-white">Social Media (Optional)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                value={formData.twitter}
                                onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                                placeholder="Twitter handle"
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            />
                            <Input
                                value={formData.instagram}
                                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                placeholder="Instagram handle"
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            />
                            <Input
                                value={formData.linkedin}
                                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="LinkedIn profile"
                                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={isSubmitting || !formData.display_name || !formData.specialty || !formData.bio || !formData.experience}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 h-12 text-lg"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </Button>
                </motion.form>
            </div>
        </div>
        </Layout>
    );
}
