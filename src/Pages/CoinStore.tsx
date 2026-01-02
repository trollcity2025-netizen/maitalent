import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { motion as motionBase } from 'framer-motion';
import { 
    Coins, Sparkles, Crown, Gift, Star, 
    Check, ShieldCheck, Zap, ArrowLeft 
} from 'lucide-react';
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from "@/lib/utils";
import Layout from '@/Layouts/Layout';

const motion: any = motionBase;

type CoinUser = {
    coins?: number;
};

type CoinPackageItem = {
    id: string;
    name: string;
    coins: number;
    price: number;
    bonus_coins?: number;
    is_popular?: boolean;
    icon?: string;
};

export default function CoinStore() {
    const [user, setUser] = useState<CoinUser | null>(null);
    const [selectedPackage, setSelectedPackage] = useState<CoinPackageItem | null>(null);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await supabase.auth.me();
                setUser(currentUser as CoinUser);
            } catch (e) {}
        };
        fetchUser();
    }, []);

    // Load PayPal SDK
    useEffect(() => {
        const loadPayPalScript = () => {
            if ((window as any).paypal) {
                setPaypalScriptLoaded(true);
                return;
            }

            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${import.meta.env.VITE_PAYPAL_CLIENT_ID}¤cy=USD`;
            script.onload = () => {
                setPaypalScriptLoaded(true);
            };
            script.onerror = () => {
                console.error('Failed to load PayPal SDK');
            };
            document.body.appendChild(script);
        };

        loadPayPalScript();
    }, []);

    const { data: packages = [] } = useQuery<CoinPackageItem[]>({
        queryKey: ['coinPackages'],
        queryFn: () => supabase.entities.CoinPackage.list('price')
    });

    const availablePackages = useMemo<CoinPackageItem[]>(() => {
        if (packages && packages.length > 0) return packages;
        return [
            { id: 'pkg1', name: '1,000 Coins', coins: 1000, price: 4.49, icon: '💎', is_popular: false },
            { id: 'pkg2', name: '5,000 Coins', coins: 5000, price: 20.99, icon: '✨', is_popular: false },
            { id: 'pkg3', name: '12,000 Coins', coins: 12000, price: 49.99, icon: '🌟', is_popular: true },
            { id: 'pkg4', name: '25,000 Coins', coins: 25000, price: 99.99, icon: '👑', is_popular: false },
            { id: 'pkg5', name: '60,000 Coins', coins: 60000, price: 239.99, icon: '🔥', is_popular: false },
            { id: 'pkg6', name: '120,000 Coins', coins: 120000, price: 459.99, icon: '🚀', is_popular: false }
        ];
    }, [packages]);

    const handlePurchase = async (pkg: CoinPackageItem) => {
        setIsPurchasing(true);
        try {
            // Check if PayPal is loaded
            if (!(window as any).paypal) {
                alert('PayPal is still loading. Please wait a moment and try again.');
                return;
            }

            // Create PayPal order
            const response = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: pkg.price,
                    description: `${pkg.coins} Coins Package`,
                    package_id: pkg.id
                })
            });

            const orderData = await response.json();

            if (orderData.id) {
                // Initialize PayPal buttons
                const paypal = (window as any).paypal;
                
                // Create a container for PayPal buttons if it doesn't exist
                let paypalContainer = document.getElementById('paypal-buttons-container');
                if (!paypalContainer) {
                    paypalContainer = document.createElement('div');
                    paypalContainer.id = 'paypal-buttons-container';
                    paypalContainer.style.marginTop = '20px';
                    // Find the selected package element and append after it
                    const packageElement = document.querySelector(`[data-package-id="${pkg.id}"]`);
                    if (packageElement) {
                        packageElement.appendChild(paypalContainer);
                    }
                }

                // Render PayPal buttons
                paypal.Buttons({
                    createOrder: function() {
                        return orderData.id;
                    },
                    onApprove: async function(data: any) {
                        // Capture the order
                        const captureResponse = await fetch('/api/paypal/capture-order', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                orderID: data.orderID
                            })
                        });

                        const captureData = await captureResponse.json();

                        if (captureData.status === 'COMPLETED') {
                            // Instantly credit the user's account
                            const totalCoins = pkg.coins + (pkg.bonus_coins || 0);
                            const newCoins = (user?.coins || 0) + totalCoins;
                            
                            await supabase.auth.updateMe({ coins: newCoins });
                            
                            // Update local state
                            const updatedUser = await supabase.auth.me();
                            setUser(updatedUser as CoinUser);
                            
                            // Show success message
                            alert(`Payment successful! You've received ${totalCoins.toLocaleString()} coins!`);
                            
                            // Clear selection
                            setSelectedPackage(null);
                            
                            // Remove PayPal buttons container
                            if (paypalContainer && paypalContainer.parentNode) {
                                paypalContainer.parentNode.removeChild(paypalContainer);
                            }
                        } else {
                            throw new Error('Payment capture failed');
                        }
                    },
                    onError: function(err: any) {
                        console.error('PayPal error:', err);
                        alert('Payment failed. Please try again.');
                    }
                }).render('#paypal-buttons-container');

            } else {
                throw new Error('Failed to create PayPal order');
            }
        } catch (e) {
            console.error('Purchase error:', e);
            alert('Purchase failed. Please try again.');
        } finally {
            setIsPurchasing(false);
        }
    };

    const getPackageStyle = (pkg: CoinPackageItem, index: number) => {
        if (pkg.is_popular) {
            return 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-600/20';
        }
        const colors = [
            'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
            'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10',
            'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
            'border-rose-500/50 bg-gradient-to-br from-rose-500/10 to-pink-500/10',
            'border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10'
        ];
        return colors[index % colors.length];
    };

    return (
        <Layout currentPageName="CoinStore">
        <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 overflow-y-auto">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to={createPageUrl('Home')}>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white">Coin Store</h1>
                        <p className="text-slate-400">Get coins to support your favorite contestants</p>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-500/20 px-4 py-2 rounded-full">
                        <Coins className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-bold">{(user?.coins || 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Benefits Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur rounded-2xl p-6 mb-8 border border-white/10"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: Gift, text: "Send gifts to performers" },
                            { icon: Star, text: "Boost contestant scores" },
                            { icon: Crown, text: "Help your favorites win" }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {availablePackages.map((pkg, index) => (
                        <motion.div
                            key={pkg.id}
                            data-package-id={pkg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "relative rounded-2xl border-2 p-6 transition-all cursor-pointer hover:scale-105",
                                getPackageStyle(pkg, index),
                                selectedPackage?.id === pkg.id && "ring-2 ring-amber-400"
                            )}
                            onClick={() => setSelectedPackage(pkg)}
                        >
                            {pkg.is_popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    MOST POPULAR
                                </Badge>
                            )}

                            <div className="text-center mb-4">
                                <span className="text-4xl">{pkg.icon}</span>
                                <h3 className="text-xl font-bold text-white mt-2">{pkg.name}</h3>
                            </div>

                            <div className="text-center mb-4">
                                <div className="flex items-center justify-center gap-2">
                                    <Coins className="w-6 h-6 text-amber-400" />
                                    <span className="text-3xl font-bold text-amber-400">{pkg.coins.toLocaleString()}</span>
                                </div>
                                {(pkg.bonus_coins || 0) > 0 && (
                                    <Badge className="mt-2 bg-green-500/20 text-green-400 border border-green-500/30">
                                        +{(pkg.bonus_coins || 0).toLocaleString()} BONUS
                                    </Badge>
                                )}
                            </div>

                            <div className="text-center mb-4">
                                <span className="text-3xl font-bold text-white">${pkg.price.toFixed(2)}</span>
                                <p className="text-sm text-slate-400">
                                    ${(pkg.price / (pkg.coins + (pkg.bonus_coins || 0)) * 100).toFixed(2)} per 100 coins
                                </p>
                            </div>

                            <Button
                                className={cn(
                                    "w-full",
                                    pkg.is_popular
                                        ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                                        : "bg-white/10 hover:bg-white/20"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePurchase(pkg);
                                }}
                                disabled={isPurchasing}
                            >
                                {isPurchasing ? 'Processing...' : 'Purchase'}
                            </Button>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
                    <div className="flex flex-wrap justify-center gap-8">
                        {[
                            { icon: ShieldCheck, text: "Secure Payment" },
                            { icon: Zap, text: "Instant Delivery" },
                            { icon: Check, text: "Money Back Guarantee" }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-slate-400">
                                <item.icon className="w-5 h-5 text-green-400" />
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </Layout>
    );
}
