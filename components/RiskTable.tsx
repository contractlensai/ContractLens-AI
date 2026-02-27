import React from 'react';
import { RedFlag } from '../types';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const RiskTable: React.FC<{ risks: RedFlag[] }> = ({ risks }) => {
    if (risks.length === 0) {
        return (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500">
                No major red flags detected.
            </div>
        );
    }

    const getSeverityIcon = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high': return <AlertTriangle className="text-red-500" size={18} />;
            case 'medium': return <AlertCircle className="text-yellow-500" size={18} />;
            case 'low': return <Info className="text-blue-500" size={18} />;
            default: return <Info className="text-slate-500" size={18} />;
        }
    };

    const getSeverityClasses = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30';
            case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/30';
            case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30';
            default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-900/30';
        }
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-all">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Risk Type</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Severity</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">Explanation & Fix</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {risks.map((risk, index) => (
                        <motion.tr
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                            <td className="px-6 py-5 align-top">
                                <div className="font-bold text-slate-900 dark:text-white">{risk.risk_type}</div>
                            </td>
                            <td className="px-6 py-5 align-top">
                                <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getSeverityClasses(risk.severity)}`}>
                                    {getSeverityIcon(risk.severity)}
                                    <span>{risk.severity}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5 align-top space-y-4">
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    "{risk.clause_text}"
                                </p>
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                        <span className="font-bold text-blue-500 mr-1 text-[10px] uppercase tracking-wider">Issue:</span> {risk.explanation}
                                    </p>
                                    <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                                        <span className="font-bold text-emerald-500 mr-1 text-[10px] uppercase tracking-wider">Suggested Fix:</span> {risk.suggested_fix}
                                    </p>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
