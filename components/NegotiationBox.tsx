import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface NegotiationBoxProps {
  text: string;
}

export const NegotiationBox: React.FC<NegotiationBoxProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Negotiation Copilot</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-all shadow-lg active:scale-95"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Script'}</span>
        </button>
      </div>

      <div className="group relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-50"></div>
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm transition-all font-mono text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {text}
        </div>
      </div>
    </div>
  );
};
