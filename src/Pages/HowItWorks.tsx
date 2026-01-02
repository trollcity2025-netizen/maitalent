import { motion as motionBase } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import Layout from '@/Layouts/Layout';
import {
    ArrowLeft, Sparkles, Star,
    Gift, Trophy, Coins, Play, CheckCircle, Zap,
    Eye, MessageCircle, Crown
} from 'lucide-react';
import { Button } from "@/Components/ui/button";

const motion: any = motionBase;

const steps = [
    {
        number: "01",
        title: "Apply to Perform",
        description: "Submit your application with your talent details and a preview video. Our judges review all applications to ensure quality performances.",
        icon: Star,
        color: "from-purple-500 to-pink-500"
    },
    {
        number: "02",
        title: "Get Approved",
        description: "Once approved, you'll be added to our performance queue. Judges will bring you to the virtual stage when it's your turn.",
        icon: CheckCircle,
        color: "from-green-500 to-emerald-500"
    },
    {
        number: "03",
        title: "Perform Live",
        description: "When called, you have 2 minutes to showcase your talent on our virtual stage with theatrical curtains and spotlights!",
        icon: Play,
        color: "from-red-500 to-orange-500"
    },
    {
        number: "04",
        title: "Receive Votes & Gifts",
        description: "Viewers send you gifts using coins, and each gift adds to your score. The more support, the higher you climb!",
        icon: Gift,
        color: "from-pink-500 to-rose-500"
    },
    {
        number: "05",
        title: "Win the Crown",
        description: "Combined scores from audience gifts and judge ratings determine the winners. Top performers get featured and win prizes!",
        icon: Trophy,
        color: "from-amber-500 to-yellow-500"
    }
];

const features = [
    {
        icon: Eye,
        title: "Live Streaming",
        description: "Watch performances in real-time with our immersive virtual theater experience."
    },
    {
        icon: MessageCircle,
        title: "Interactive Chat",
        description: "Engage with other viewers and share your excitement during performances."
    },
    {
        icon: Crown,
        title: "Expert Judges",
        description: "Four professional judges score performances and can buzz out or praise acts."
    },
    {
        icon: Coins,
        title: "Coin System",
        description: "Purchase coins to send gifts that directly boost contestant scores."
    }
];

export default function HowItWorks() {
    return (
        <Layout currentPageName="HowItWorks">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to={createPageUrl('Home')}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">How It Works</h1>
                        <p className="text-slate-400">Everything you need to know about MAI Talent</p>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <section className="container mx-auto px-4 py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm">The Future of Talent Shows</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        A New Era of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-pink-500">
                            Entertainment
                        </span>
                    </h2>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        MAI Talent brings the excitement of live talent shows to your screen, 
                        with interactive voting, real-time gifts, and a global audience.
                    </p>
                </motion.div>
            </section>

            {/* Steps */}
            <section className="container mx-auto px-4 py-16">
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-amber-500 hidden md:block" />
                    
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative flex flex-col md:flex-row items-center gap-8 mb-16 ${
                                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                            }`}
                        >
                            {/* Content */}
                            <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                <span className={`text-6xl font-black bg-gradient-to-r ${step.color} bg-clip-text text-transparent opacity-30`}>
                                    {step.number}
                                </span>
                                <h3 className="text-2xl font-bold text-white mt-2 mb-3">{step.title}</h3>
                                <p className="text-slate-400">{step.description}</p>
                            </div>

                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 z-10`}>
                                <step.icon className="w-8 h-8 text-white" />
                            </div>

                            {/* Spacer */}
                            <div className="flex-1 hidden md:block" />
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Grid */}
            <section className="container mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">Platform Features</h2>
                    <p className="text-slate-400">Everything that makes MAI Talent unique</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                            <p className="text-slate-400 text-sm">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur border border-white/10 rounded-3xl p-8 md:p-12 text-center"
                >
                    <Zap className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
                    <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                        Whether you want to showcase your talent or support amazing performers, 
                        MAI Talent has something for everyone.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to={createPageUrl('Apply')}>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-8">
                                <Star className="w-5 h-5 mr-2" />
                                Apply to Perform
                            </Button>
                        </Link>
                        <Link to={createPageUrl('CoinStore')}>
                            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8">
                                <Coins className="w-5 h-5 mr-2" />
                                Get Coins
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </section>
        </div>
        </Layout>
    );
}
