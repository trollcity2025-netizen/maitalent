import { useState } from 'react';
import { motion as motionBase, AnimatePresence as AnimatePresenceBase } from 'framer-motion';
import {
    Sparkles, Coins, Gift, Trophy, Users,
    ChevronRight, ChevronLeft, X, Zap
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const motion: any = motionBase;
const AnimatePresence: any = AnimatePresenceBase;

const tourSteps = [
    {
        icon: Sparkles,
        title: "Welcome to MAI Talent!",
        description: "Experience the future of talent shows. Watch live performances, support your favorite contestants, and be part of the action!",
        gradient: "from-purple-600 to-pink-600"
    },
    {
        icon: Users,
        title: "Watch Live Performances",
        description: "Contestants showcase their talents live on our virtual stage. The curtains open, the lights shine, and the show begins!",
        gradient: "from-blue-600 to-cyan-600"
    },
    {
        icon: Coins,
        title: "Get Coins to Vote",
        description: "Purchase coins to send gifts to your favorite performers. Each gift adds to their score and helps them win!",
        gradient: "from-amber-500 to-orange-600"
    },
    {
        icon: Gift,
        title: "Send Gifts & Support",
        description: "Choose from various gifts - from applause to diamonds! Each gift shows your support and boosts the contestant's ranking.",
        gradient: "from-pink-500 to-rose-600"
    },
    {
        icon: Trophy,
        title: "Climb the Leaderboard",
        description: "Watch contestants rise through the ranks based on votes, gifts, and judge scores. Your support makes a difference!",
        gradient: "from-emerald-500 to-teal-600"
    }
];

type WelcomeTourProps = {
    onComplete(): void;
    isOpen: boolean;
};

export default function WelcomeTour({ onComplete, isOpen }: WelcomeTourProps) {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const step = tourSteps[currentStep];
    const Icon = step.icon;
    const isLastStep = currentStep === tourSteps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Close Button */}
                    <button
                        onClick={onComplete}
                        className="absolute top-4 right-4 z-10 p-2 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Icon Section */}
                    <div className={`bg-gradient-to-br ${step.gradient} p-8 text-center`}>
                        <motion.div
                            key={currentStep}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="w-24 h-24 mx-auto bg-white/20 backdrop-blur rounded-full flex items-center justify-center"
                        >
                            <Icon className="w-12 h-12 text-white" />
                        </motion.div>
                    </div>

                    {/* Content */}
                    <div className="p-8 text-center">
                        <motion.h2
                            key={`title-${currentStep}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold text-white mb-4"
                        >
                            {step.title}
                        </motion.h2>
                        <motion.p
                            key={`desc-${currentStep}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-slate-400 leading-relaxed"
                        >
                            {step.description}
                        </motion.p>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex justify-center gap-2 pb-4">
                        {tourSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    index === currentStep
                                        ? 'w-6 bg-white'
                                        : 'bg-white/30 hover:bg-white/50'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex gap-3 p-6 pt-2">
                        {currentStep > 0 && (
                            <Button
                                variant="outline"
                                onClick={handlePrev}
                                className="flex-1 border-white/20 text-white hover:bg-white/10"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={handleNext}
                            className={`flex-1 bg-gradient-to-r ${step.gradient} hover:opacity-90`}
                        >
                            {isLastStep ? (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Get Started
                                </>
                            ) : (
                                <>
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Quick Links */}
                    {isLastStep && (
                        <div className="px-6 pb-6">
                            <Link
                                to={createPageUrl('CoinStore')}
                                className="block w-full p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-center text-amber-400 hover:bg-amber-500/30 transition-colors"
                            >
                                <Coins className="w-5 h-5 inline mr-2" />
                                Get Your First Coins - Free 100 Coins!
                            </Link>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
