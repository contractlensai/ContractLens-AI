
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HealthScore } from './components/HealthScore';
import { RiskTable } from './components/RiskTable';
import { NegotiationBox } from './components/NegotiationBox';
import { Docs } from './components/Docs';
import { Landing } from './components/Landing';
import { Profile } from './components/Profile';
import { About } from './components/About';
import { Careers } from './components/Careers';
import { Privacy } from './components/Privacy';
import { LoginModal } from './components/LoginModal';
import { AccountSettings } from './components/AccountSettings';
import { Dashboard } from './components/Dashboard';
import { HighlightedContract } from './components/HighlightedContract';
import { analyzeContract } from './services/aiService';
import { authService, User } from './services/authService';
import { contractService } from './services/contractService';
import { ContractAuditResult, LoadingState, AuditRecord } from './types';
import { Shield, ShieldOff } from 'lucide-react';

export type ViewType = 'landing' | 'auditor' | 'docs' | 'profile' | 'about' | 'careers' | 'privacy' | 'settings';
export type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewType>('landing');
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });
  const [showLogin, setShowLogin] = useState(false);
  const [contractText, setContractText] = useState('');
  const [contractTitle, setContractTitle] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [result, setResult] = useState<ContractAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme with HTML class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check for existing session on mount
  useEffect(() => {
    authService.getCurrentUser().then(setUser);

    const { data: authListener } = authService.onAuthStateChange((user) => {
      setUser(user);
      if (user && view === 'landing') setView('auditor');
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setShowLogin(false);
    setView('auditor');
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setView('landing');
    setResult(null);
    setContractText('');
    setContractTitle('');
  };

  const handleAudit = async () => {
    if (!contractText.trim() || !user) return;

    setLoading('analyzing');
    setError(null);
    try {
      const auditResult = await analyzeContract(contractText);

      if (!privacyMode) {
        const title = contractTitle || `Audit ${new Date().toLocaleDateString()}`;
        await contractService.saveAudit(user.id, title, auditResult);
      }

      setResult(auditResult);
      setLoading('idle');
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
      setLoading('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setContractTitle(file.name.replace(/\.[^/.]+$/, ""));
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setContractText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleViewAuditFromHistory = (audit: AuditRecord) => {
    setResult(audit);
    setContractTitle(audit.contractTitle);
    setView('auditor');
  };

  const renderContent = () => {
    const isLoggedIn = !!user;

    // Public pages
    if (view === 'docs') return <Docs />;
    if (view === 'about') return <About />;
    if (view === 'careers') return <Careers />;
    if (view === 'privacy') return <Privacy />;

    // Protected pages logic
    if (!isLoggedIn && (view === 'auditor' || view === 'profile' || view === 'settings')) {
      return <Landing onGetStarted={() => setShowLogin(true)} />;
    }

    switch (view) {
      case 'settings':
        return (
          <AccountSettings
            user={user}
            onUpdateUser={setUser}
            onDeleteAccount={() => handleLogout()}
            onUpgrade={() => { }} // Disabled for hackathon
          />
        );
      case 'profile':
        return (
          <Profile
            user={user}
            onUpgrade={() => { }}
            onViewAudit={handleViewAuditFromHistory}
            onOpenSettings={() => setView('settings')}
          />
        );
      case 'landing':
        return <Landing onGetStarted={() => isLoggedIn ? setView('auditor') : setShowLogin(true)} />;
      case 'auditor':
        return (
          <div className="max-w-7xl mx-auto px-4 py-8 w-full animate-in fade-in duration-500">
            {isLoggedIn && <Dashboard userId={user.id} />}

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Side: Input Area */}
              <div className="flex-1 space-y-6">
                <div className="space-y-2 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Legal <span className="text-blue-500">Auditor</span></h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Paste your contract or upload a document below.</p>
                  </div>

                  <div
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl cursor-pointer transition-all border ${privacyMode
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                      }`}
                  >
                    {privacyMode ? <ShieldOff size={16} /> : <Shield size={16} />}
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {privacyMode ? 'Privacy Mode ON' : 'Privacy Mode OFF'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Contract Title (e.g. Acme Service Agreement)"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                    value={contractTitle}
                    onChange={(e) => setContractTitle(e.target.value)}
                  />

                  <div className="relative">
                    <textarea
                      className="w-full h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-none font-mono text-sm shadow-sm"
                      placeholder="Paste full contract text here..."
                      value={contractText}
                      onChange={(e) => setContractText(e.target.value)}
                    />

                    <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".txt,.md"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Upload Document"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={handleAudit}
                        disabled={loading === 'analyzing' || !contractText}
                        className={`px-8 py-3 rounded-xl font-bold transition-all shadow-xl flex items-center space-x-2 ${loading === 'analyzing'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 active:scale-95'
                          }`}
                      >
                        {loading === 'analyzing' ? (
                          <>
                            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Scanning...</span>
                          </>
                        ) : (
                          <span>Audit Now</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className={`p-4 rounded-xl flex items-start space-x-3 border animate-in slide-in-from-top-2 bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-500`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-grow">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side: Results Area */}
              <div className="flex-1 min-h-[500px]">
                {!result && loading !== 'analyzing' && (
                  <div className="h-full border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center bg-slate-50 dark:bg-slate-900/10 transition-colors">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 dark:text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-slate-900 dark:text-white text-lg font-medium mb-2">Analysis Report</h3>
                    <p className="max-w-xs text-sm">Once the audit is complete, your health score and risk table will appear here. Past audits are saved in your profile.</p>
                  </div>
                )}

                {loading === 'analyzing' && (
                  <div className="h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
                      <div className="absolute inset-0 w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-blue-500/20"></div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Analyzing Legalese...</h3>
                      <p className="text-slate-500 mt-2">Checking 50+ risk parameters using Gemini 1.5 Pro.</p>
                    </div>
                  </div>
                )}

                {result && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <HealthScore score={result.healthScore} />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Risk Highlights</h3>
                      <HighlightedContract text={contractText} risks={result.redFlags} />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Red Flags Detailed</h3>
                      <RiskTable risks={result.redFlags} />
                    </div>

                    <div className="p-5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl relative overflow-hidden group shadow-sm transition-colors">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:w-2 transition-all"></div>
                      <h4 className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-widest mb-2 font-mono">AI Summary</h4>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{result.summary}</p>
                    </div>

                    {result.negotiationEmail && (
                      <NegotiationBox
                        text={result.negotiationEmail}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return <Landing onGetStarted={() => isLoggedIn ? setView('auditor' as any) : setShowLogin(true)} />;
    }
  };

  return (
    <Layout
      activeView={view as any}
      onNavigate={setView as any}
      onLoginClick={() => setShowLogin(true)}
      onLogout={handleLogout}
      isLoggedIn={!!user}
      theme={theme}
      onToggleTheme={toggleTheme}
      user={user}
    >
      {renderContent()}

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </Layout>
  );
};

export default App;
