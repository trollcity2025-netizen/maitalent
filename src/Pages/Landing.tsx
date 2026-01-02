import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/Components/ui/button';

export default function Landing() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
            <header className="px-6 sm:px-10 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
                        <span className="text-lg font-black text-slate-950">M</span>
                    </div>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500">
                        MaiTalent
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <Link to={createPageUrl('Auth')}>
                        <Button
                            variant="ghost"
                            className="text-sm text-slate-200 hover:bg-white/10 px-4"
                        >
                            Sign In
                        </Button>
                    </Link>
                    <Link to={`${createPageUrl('Auth')}?mode=signup`}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-5 text-sm">
                            Sign Up
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
                <section className="w-full max-w-5xl">
                    <div className="text-center mb-10">
                        <p className="text-xs tracking-[0.3em] uppercase text-amber-300/80 mb-3">
                            Join the Ultimate Online Talent Competition
                        </p>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-500 to-purple-500">
                                MaiTalent
                            </span>
                        </h1>
                        <p className="text-slate-200 text-base sm:text-lg max-w-2xl mx-auto">
                            Perform live, vote for your favorites, and earn rewards in a
                            cinematic virtual talent show.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-10">
                        <div className="rounded-3xl bg-gradient-to-br from-red-600/80 via-pink-600/80 to-orange-500/80 p-[1px] shadow-xl shadow-red-900/40">
                            <div className="h-full rounded-3xl bg-gradient-to-b from-red-900/80 via-red-900/60 to-red-950/90 p-5 flex flex-col">
                                <h2 className="text-lg font-bold mb-1">Perform, Compete &amp; Win</h2>
                                <p className="text-sm text-red-100/90 mb-4">
                                    Showcase your talent, compete in weekly contests, and climb the
                                    leaderboard for prizes.
                                </p>
                                <div className="mt-auto rounded-2xl overflow-hidden border border-white/10 bg-black/40 h-28 flex items-center justify-center">
                                    <div className="w-full h-full bg-gradient-to-tr from-red-700/70 via-fuchsia-600/40 to-transparent flex items-end justify-start p-4">
                                        <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20" />
                                        <div className="ml-3">
                                            <p className="text-xs font-semibold text-white">
                                                Live Performance
                                            </p>
                                            <p className="text-[11px] text-red-100/80">
                                                Spotlight, stage, and cheering crowd.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-purple-600/80 via-violet-600/80 to-fuchsia-500/80 p-[1px] shadow-xl shadow-purple-900/40">
                            <div className="h-full rounded-3xl bg-gradient-to-b from-purple-900/80 via-purple-900/60 to-slate-950/90 p-5 flex flex-col">
                                <h2 className="text-lg font-bold mb-1">Vote for Your Favorites</h2>
                                <p className="text-sm text-purple-100/90 mb-4">
                                    Support amazing performers with votes and gifts to push them to
                                    the top.
                                </p>
                                <div className="mt-auto rounded-2xl bg-black/40 border border-white/10 p-3 flex items-center gap-3">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 border-2 border-slate-900" />
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 border-2 border-slate-900" />
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 border-2 border-slate-900" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-white">
                                            Alex • Brenda • John
                                        </p>
                                        <p className="text-[11px] text-purple-100/80">
                                            See who&apos;s trending this week.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-emerald-500/80 via-teal-500/80 to-cyan-400/80 p-[1px] shadow-xl shadow-emerald-900/40">
                            <div className="h-full rounded-3xl bg-gradient-to-b from-emerald-900/80 via-emerald-900/60 to-slate-950/90 p-5 flex flex-col">
                                <h2 className="text-lg font-bold mb-1">Earn Rewards &amp; Gift Cards</h2>
                                <p className="text-sm text-emerald-100/90 mb-4">
                                    Collect coins and redeem them for gift cards and exclusive
                                    rewards.
                                </p>
                                <div className="mt-auto rounded-2xl bg-black/40 border border-white/10 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-7 rounded-md bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-xs font-semibold">
                                            Gift
                                        </div>
                                        <div className="w-10 h-7 rounded-md bg-black flex items-center justify-center text-xs font-semibold">
                                            A
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-8 h-8 rounded-full bg-amber-400 shadow-lg shadow-amber-500/50" />
                                        <div className="w-8 h-8 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 -ml-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <Link to={`${createPageUrl('Auth')}?mode=signup`}>
                            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 px-10 py-6 text-base sm:text-lg rounded-full shadow-lg shadow-pink-500/40">
                                Sign Up for Free
                            </Button>
                        </Link>
                        <p className="mt-3 text-xs text-slate-400">
                            No credit card required. Join in just a few clicks.
                        </p>
                    </div>
                </section>
            </main>
        </div>
    );
}

