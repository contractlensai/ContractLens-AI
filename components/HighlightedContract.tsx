import React from 'react';
import { RedFlag } from '../types';
import { motion } from 'framer-motion';

interface HighlightedContractProps {
    text: string;
    risks: RedFlag[];
}

export const HighlightedContract: React.FC<HighlightedContractProps> = ({ text, risks }) => {
    if (!text) return null;

    // Function to escape regex special characters
    const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toLowerCase()) {
            case 'high':
                return 'bg-red-500/20 border-red-500 text-red-900 dark:text-red-200';
            case 'medium':
                return 'bg-yellow-500/20 border-yellow-500 text-yellow-900 dark:text-yellow-200';
            case 'low':
                return 'bg-blue-500/20 border-blue-500 text-blue-900 dark:text-blue-200';
            default:
                return 'bg-slate-500/20 border-slate-500 text-slate-900 dark:text-slate-200';
        }
    };

    // Sort risks by length descending to avoid partial matches interfering with full matches
    const sortedRisks = [...risks].sort((a, b) => b.clause_text.length - a.clause_text.length);

    // This is a simple implementation. For a more robust one, we might need a more complex replacement logic
    // to avoid overlapping highlights or replacing already replaced HTML tags.

    let highlightedHtml = text;

    // We'll use a placeholder technique to avoid injecting HTML into HTML
    const placeholders: { [key: string]: React.ReactNode } = {};

    // Actually, for React, it's safer to split the text and render parts
    // But since we want to match exact strings, we can use a recursive approach or a flat match and split.

    // Let's use a more React-friendly way:
    const parts: (string | React.ReactNode)[] = [text];

    sortedRisks.forEach((risk, index) => {
        const clause = risk.clause_text;
        if (!clause) return;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (typeof part === 'string') {
                const regex = new RegExp(`(${escapeRegExp(clause)})`, 'gi');
                const subParts = part.split(regex);

                if (subParts.length > 1) {
                    const newSubParts: (string | React.ReactNode)[] = [];
                    subParts.forEach((subPart) => {
                        if (subPart.toLowerCase() === clause.toLowerCase()) {
                            newSubParts.push(
                                <span
                                    key={`${index}-${Math.random()}`}
                                    className={`relative group inline-block border-l-4 px-1 rounded-sm cursor-help transition-all hover:scale-[1.02] ${getSeverityColor(risk.severity)}`}
                                >
                                    {subPart}
                                    <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none">
                                        <p className="font-bold text-blue-400 mb-1">{risk.risk_type}</p>
                                        <p className="opacity-90">{risk.explanation}</p>
                                        <div className="mt-2 pt-2 border-t border-white/10">
                                            <p className="font-semibold text-green-400">Suggested Fix:</p>
                                            <p className="italic opacity-80">{risk.suggested_fix}</p>
                                        </div>
                                    </span>
                                </span>
                            );
                        } else {
                            newSubParts.push(subPart);
                        }
                    });

                    parts.splice(i, 1, ...newSubParts);
                    i += newSubParts.length - 1;
                }
            }
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm font-serif leading-relaxed text-slate-800 dark:text-slate-200 overflow-y-auto max-h-[600px] whitespace-pre-wrap"
        >
            {parts.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
        </motion.div>
    );
};
