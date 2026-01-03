import type React from 'react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { motion as motionBase } from 'framer-motion';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { createPageUrl } from '@/utils';

const motion: any = motionBase;

type AuthMode = 'signin' | 'signup';

export default function Auth() {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialModeParam = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
    const [mode, setMode] = useState<AuthMode>(initialModeParam);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSwitchMode = (next: AuthMode) => {
        setMode(next);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (mode === 'signin') {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (signInError) {
                    setError(signInError.message);
                    setLoading(false);
                    return;
                }
            } else {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName
                        },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }
                
                // Note: Email confirmation should be disabled in Supabase dashboard
                // Settings > Authentication > Email Templates > Disable email confirmation
            }
            navigate(createPageUrl('Home'));
        } catch (e: any) {
            setError(e.message || 'Something went wrong');
        }
        setLoading(false);
    };

    const isSignup = mode === 'signup';

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <button
                    type="button"
                    onClick={() => navigate(createPageUrl('Home'))}
                    className="mb-6 inline-flex items-center text-slate-400 hover:text-white text-sm"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to show
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                {isSignup ? 'Create your account' : 'Welcome back'}
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                Sign {isSignup ? 'up' : 'in'} to join MAI Talent
                            </p>
                        </div>
                        <div className="inline-flex bg-slate-900/80 rounded-full p-1">
                            <button
                                type="button"
                                onClick={() => handleSwitchMode('signin')}
                                className={`px-3 py-1 text-xs rounded-full ${
                                    !isSignup ? 'bg-slate-800 text-white' : 'text-slate-400'
                                }`}
                            >
                                Sign in
                            </button>
                            <button
                                type="button"
                                onClick={() => handleSwitchMode('signup')}
                                className={`px-3 py-1 text-xs rounded-full ${
                                    isSignup ? 'bg-slate-800 text-white' : 'text-slate-400'
                                }`}
                            >
                                Sign up
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/40 rounded-xl px-3 py-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignup && (
                            <div className="space-y-1">
                                <label className="text-xs text-slate-300">Full name</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <Input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Your name"
                                        required
                                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs text-slate-300">Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs text-slate-300">Password</label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    required
                                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        {isSignup && (
                            <div className="text-xs text-slate-400">
                                By signing up, you agree to our terms and will be able to access the platform immediately.
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isSignup ? 'Create account' : 'Sign in'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
