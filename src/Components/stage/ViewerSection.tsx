import { motion as motionBase } from 'framer-motion';
import { Users } from 'lucide-react';

const motion: any = motionBase;

type ViewerSectionProps = {
    viewerCount?: number;
};

export default function ViewerSection({ viewerCount = 0 }: ViewerSectionProps) {
    const viewers = Array.from({ length: Math.min(viewerCount, 50) }, (_, i) => ({
        id: i,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
    }));

    return (
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                    {viewerCount.toLocaleString()} Watching
                </span>
            </div>

            {/* Viewer Avatars */}
            <div className="flex flex-wrap gap-1">
                {viewers.map((viewer, index) => (
                    <motion.div
                        key={viewer.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                        style={{ backgroundColor: viewer.color }}
                    >
                        {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                    </motion.div>
                ))}
                {viewerCount > 50 && (
                    <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-[10px] text-white">
                        +{viewerCount - 50}
                    </div>
                )}
            </div>
        </div>
    );
}
