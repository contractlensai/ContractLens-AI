import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Activity, Clock } from 'lucide-react';
import { contractService } from '../services/contractService';

interface Stats {
    totalContracts: number;
    totalRisks: number;
    avgHealthScore: number;
    timeSaved: number;
}

export const Dashboard: React.FC<{ userId: string }> = ({ userId }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await contractService.getStats(userId);
                setStats(data);
            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [userId]);

    if (loading) return <div className="h-32 flex items-center justify-center">
        <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
        </div>
    </div>;

    const colorMap: { [key: string]: string } = {
        blue: 'bg-blue-500/10 text-blue-500',
        red: 'bg-red-500/10 text-red-500',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        indigo: 'bg-indigo-500/10 text-indigo-500',
    };

    const cards = [
        {
            label: 'Contracts Analyzed',
            value: stats?.totalContracts || 0,
            icon: FileText,
            color: 'blue'
        },
        {
            label: 'Risks Detected',
            value: stats?.totalRisks || 0,
            icon: AlertTriangle,
            color: 'red'
        },
        {
            label: 'Avg Health Score',
            value: `${stats?.avgHealthScore || 0}%`,
            icon: Activity,
            color: 'emerald'
        },
        {
            label: 'Time Saved',
            value: `${stats?.timeSaved || 0}m`,
            icon: Clock,
            color: 'indigo'
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${colorMap[card.color]} transform group-hover:scale-110 transition-transform`}>
                            <card.icon size={24} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{card.label}</p>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{card.value}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
