import React, { useState } from 'react';
import { FeatureSettings } from '../types';
import { STARTER_FEATURES, DEFAULT_FEATURES } from '../lib/storage';
import { cn } from '../lib/utils';
import { Rocket, Shield, Settings2 } from 'lucide-react';

interface SplashProps {
  onComplete: (companyName: string, features: FeatureSettings) => void;
}

const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [preset, setPreset] = useState<'starter' | 'full' | 'custom'>('starter');

  const handleStart = () => {
    if (!companyName.trim()) return;
    
    let features = DEFAULT_FEATURES;
    if (preset === 'starter') features = STARTER_FEATURES;
    
    onComplete(companyName, features);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50 p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
            <Rocket className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tighter italic uppercase">Nexus P2P</h1>
          <p className="text-slate-500 text-sm mt-2">Intelligent Supply Chain & Inventory</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-2">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Industrial Corp"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-500 uppercase mb-3">Select Setup Preset</label>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setPreset('starter')}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all text-left",
                  preset === 'starter' ? "bg-primary-50 border-primary-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn("p-2 rounded-md", preset === 'starter' ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                  <Rocket size={18} />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", preset === 'starter' ? "text-primary-600" : "text-slate-700")}>MSME Starter Pack</p>
                  <p className="text-[10px] text-slate-500 mt-1">Core inventory, POs, and basic vendor management. Lean and fast.</p>
                </div>
              </button>

              <button
                onClick={() => setPreset('full')}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all text-left",
                  preset === 'full' ? "bg-primary-50 border-primary-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn("p-2 rounded-md", preset === 'full' ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                  <Shield size={18} />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", preset === 'full' ? "text-primary-600" : "text-slate-700")}>Full Compliance Pack</p>
                  <p className="text-[10px] text-slate-500 mt-1">All features enabled. Audit trails, 3-way matching, and auth matrix.</p>
                </div>
              </button>

              <button
                onClick={() => setPreset('custom')}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all text-left",
                  preset === 'custom' ? "bg-primary-50 border-primary-500 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"
                )}
              >
                <div className={cn("p-2 rounded-md", preset === 'custom' ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400")}>
                  <Settings2 size={18} />
                </div>
                <div>
                  <p className={cn("text-sm font-bold", preset === 'custom' ? "text-primary-600" : "text-slate-700")}>Custom Setup</p>
                  <p className="text-[10px] text-slate-500 mt-1">Manually toggle features in settings after launch.</p>
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!companyName.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg shadow-primary-500/20 mt-4 uppercase tracking-widest text-xs"
          >
            Launch Application
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splash;
