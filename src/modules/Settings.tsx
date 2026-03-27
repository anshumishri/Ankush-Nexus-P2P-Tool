import React, { useState } from 'react';
import { Settings2, Shield, Rocket, Save, Download, Upload, Trash2, UserPlus } from 'lucide-react';
import { FeatureSettings, User, Role } from '../types';
import { STORAGE_KEYS, saveData, DEFAULT_FEATURES, STARTER_FEATURES } from '../lib/storage';
import { cn } from '../lib/utils';
import { toast } from '../components/Toast';

interface SettingsProps {
  features: FeatureSettings;
  setFeatures: React.Dispatch<React.SetStateAction<FeatureSettings>>;
  companyName: string;
  setCompanyName: React.Dispatch<React.SetStateAction<string>>;
  currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ features, setFeatures, companyName, setCompanyName, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'Features' | 'Roles' | 'System'>('Features');

  const toggleFeature = (key: keyof FeatureSettings) => {
    const updated = { ...features, [key]: !features[key] };
    setFeatures(updated);
    saveData(STORAGE_KEYS.FEATURES, updated);
    toast.success(`${key.replace(/_/g, ' ')} ${updated[key] ? 'enabled' : 'disabled'}`);
  };

  const applyPreset = (preset: 'starter' | 'full') => {
    const updated = preset === 'starter' ? STARTER_FEATURES : DEFAULT_FEATURES;
    setFeatures(updated);
    saveData(STORAGE_KEYS.FEATURES, updated);
    toast.success(`${preset === 'starter' ? 'MSME Starter' : 'Full Compliance'} preset applied`);
  };

  const handleExportData = () => {
    const allData: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      const val = localStorage.getItem(key);
      if (val) allData[key] = JSON.parse(val);
    });
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nexus_p2p_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('Backup exported successfully');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        Object.entries(data).forEach(([key, val]) => {
          localStorage.setItem(key, JSON.stringify(val));
        });
        toast.success('Data imported successfully. Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">System Settings</h3>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['Features', 'Roles', 'System'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all",
                activeTab === tab ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Features' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => applyPreset('starter')}
              className="flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 transition-all text-left group shadow-sm"
            >
              <div className="p-3 bg-primary-50 rounded-lg text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all">
                <Rocket size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">MSME Starter Pack</h4>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Enable core features only</p>
              </div>
            </button>
            <button 
              onClick={() => applyPreset('full')}
              className="flex items-center gap-4 p-6 bg-white border border-slate-200 rounded-xl hover:border-primary-500 transition-all text-left group shadow-sm"
            >
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <Shield size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Full Compliance Pack</h4>
                <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Enable all enterprise controls</p>
              </div>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Feature Toggles</h4>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto no-scrollbar">
              {Object.entries(features).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{key.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-mono mt-1">Feature ID: {key}</p>
                  </div>
                  <button 
                    onClick={() => toggleFeature(key as keyof FeatureSettings)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-all duration-300",
                      enabled ? "bg-emerald-500" : "bg-slate-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full transition-all duration-300",
                      enabled ? "right-1 bg-white shadow-sm" : "left-1 bg-slate-400"
                    )} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Roles' && (
        <div className="space-y-6">
          <div className="p-8 bg-white border border-slate-200 rounded-xl text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center text-primary-600 mx-auto mb-4">
              <UserPlus size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 italic uppercase tracking-tighter">Role Based Access Control</h4>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Define permissions per role. For this demo, use the role switcher in the sidebar to simulate different users.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Inventory</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Procurement</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Finance</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { role: 'Admin', inv: 'Full', pro: 'Full', fin: 'Full', adm: 'Full' },
                  { role: 'Procurement Officer', inv: 'View', pro: 'Create', fin: 'None', adm: 'None' },
                  { role: 'Finance Manager', inv: 'View', pro: 'Approve', fin: 'Full', adm: 'None' },
                  { role: 'Warehouse Staff', inv: 'Update', pro: 'None', fin: 'None', adm: 'None' },
                  { role: 'Auditor', inv: 'View', pro: 'View', fin: 'View', adm: 'None' },
                ].map(r => (
                  <tr key={r.role} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{r.role}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.inv}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.pro}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.fin}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">{r.adm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'System' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Company Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Company Name</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500" 
                    />
                    <button 
                      onClick={() => { saveData(STORAGE_KEYS.COMPANY_NAME, companyName); toast.success('Company name updated'); }}
                      className="p-2 bg-slate-100 text-slate-500 rounded hover:text-primary-600 transition-colors"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Currency</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500">
                      <option>INR (₹)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">FY Start</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500">
                      <option>April</option>
                      <option>January</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Approval Thresholds</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-600 font-bold">Tier 1: Dept Head</span>
                  <span className="text-xs font-mono text-primary-600 font-bold">&lt; ₹10,000</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-600 font-bold">Tier 2: Finance Mgr</span>
                  <span className="text-xs font-mono text-primary-600 font-bold">₹10k - ₹1L</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-600 font-bold">Tier 3: Director</span>
                  <span className="text-xs font-mono text-primary-600 font-bold">&gt; ₹1,00,000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Data Management</h4>
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleExportData}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-primary-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Download size={18} className="text-primary-600" />
                    <span className="text-xs font-bold text-slate-900">Export Backup (JSON)</span>
                  </div>
                  <Settings2 size={14} className="text-slate-400 group-hover:text-primary-600" />
                </button>
                
                <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-emerald-500 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Upload size={18} className="text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Restore from Backup</span>
                  </div>
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  <Settings2 size={14} className="text-slate-400 group-hover:text-emerald-600" />
                </label>

                <button 
                  onClick={handleReset}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-rose-500 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 size={18} className="text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">Reset All Data</span>
                  </div>
                  <Settings2 size={14} className="text-slate-400 group-hover:text-rose-600" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-4 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">System Info</h4>
              <div className="space-y-2">
                <p className="text-[10px] text-slate-500 uppercase font-mono">Version: 1.0.0-PROD</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Environment: LocalStorage Persistence</p>
                <p className="text-[10px] text-slate-500 uppercase font-mono">Last Backup: Never</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
