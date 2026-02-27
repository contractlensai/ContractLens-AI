import React, { useEffect, useState } from 'react';
import { authService, User } from '../services/authService';
import { contractService } from '../services/contractService';
import { AuditRecord } from '../types';
import { motion } from 'framer-motion';

interface ProfileProps {
  user: User | null;
  onViewAudit: (audit: any) => void;
  onOpenSettings: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onViewAudit, onOpenSettings }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      contractService.getUserContracts(user.id).then(data => {
        setHistory(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (!user) return null;

  const joinDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    day: 'numeric'
  }) : 'N/A';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-4xl font-black shadow-2xl overflow-hidden border-4 border-white dark:border-slate-800">
          {user.avatar ? (
            <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="uppercase">{user.name?.[0] || user.email[0]}</span>
          )}
        </div>

        <div className="flex-grow text-center md:text-left space-y-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white capitalize mb-1">{user.name || 'Anonymous User'}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{user.email}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Account ID</span>
              <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{user.id.substring(0, 8)}...</span>
            </div>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Member Since</span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{joinDate}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenSettings}
          className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700 h-fit"
        >
          Account Settings
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Audit History</h3>
          <span className="text-xs text-slate-500 font-medium">{history.length} records found</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse"></div>
            ))
          ) : history.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl">
              <p className="text-slate-500">No audits performed yet.</p>
            </div>
          ) : (
            history.map((audit, index) => (
              <motion.div
                key={audit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onViewAudit({
                  ...audit,
                  redFlags: audit.risks || [] // Map supabase risks to redFlags
                })}
                className="group p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 transition-all cursor-pointer shadow-sm overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 -mr-8 -mt-8 rounded-full"></div>

                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${audit.health_score >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                      audit.health_score >= 50 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                    }`}>
                    {audit.health_score}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(audit.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="text-slate-900 dark:text-white font-bold mb-1 truncate pr-4">
                  {audit.contract_type || 'Contract Audit'}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  {audit.summary}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {audit.risks?.length || 0} Risks Found
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
