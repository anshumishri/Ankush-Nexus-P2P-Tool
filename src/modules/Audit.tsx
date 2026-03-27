import React, { useState } from 'react';
import { ShieldCheck, History, AlertTriangle, UserCheck, MessageSquare, Plus, Eye, CheckCircle } from 'lucide-react';
import { AuditLog, WhistleblowerSubmission, FeatureSettings, User } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { cn, generateId } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData, loadData } from '../lib/storage';

interface AuditProps {
  auditLogs: AuditLog[];
  features: FeatureSettings;
  currentUser: User;
}

const Audit: React.FC<AuditProps> = ({ auditLogs, features, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'Trail' | 'Whistleblower' | 'Checklist'>('Trail');
  const [isWhistleModalOpen, setIsWhistleModalOpen] = useState(false);
  const [submissions, setSubmissions] = useState<WhistleblowerSubmission[]>(loadData(STORAGE_KEYS.WHISTLEBLOWER, []));

  const handleWhistleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSubmission: WhistleblowerSubmission = {
      id: generateId('WS'),
      timestamp: new Date().toISOString(),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      referenceId: `REF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    const updated = [newSubmission, ...submissions];
    setSubmissions(updated);
    saveData(STORAGE_KEYS.WHISTLEBLOWER, updated);
    
    setIsWhistleModalOpen(false);
    toast.success(`Submission received. Reference ID: ${newSubmission.referenceId}`);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.newValue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const auditChecklist = [
    { id: 1, item: 'All POs above ₹1L have Director approval', feature: 'PURCHASE_AUTH_MATRIX' },
    { id: 2, item: 'Maker-Checker enforced for all procurement', feature: 'MAKER_CHECKER' },
    { id: 3, item: '3-Way matching performed for all invoices', feature: 'THREE_WAY_MATCH' },
    { id: 4, item: 'Vendor KYC documents verified', feature: 'VENDOR_ONBOARDING_KYC' },
    { id: 5, item: 'Inventory reconciliation performed monthly', feature: 'STOCK_RECONCILIATION' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Audit & Compliance Control</h3>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['Trail', 'Whistleblower', 'Checklist'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all tracking-widest",
                activeTab === tab ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Trail' && (
        <div className="space-y-4">
          <div className="p-6 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-50 rounded-lg text-primary-600"><History size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">System Audit Trail</h4>
                <p className="text-[10px] text-slate-400 uppercase font-mono">Immutable log of all system transactions</p>
              </div>
            </div>
            <div className="relative w-64">
              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-45" size={16} />
              <input 
                type="text" 
                placeholder="Search audit logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <Table 
              data={filteredLogs} 
              columns={[
                { header: 'Timestamp', accessor: (item: AuditLog) => new Date(item.timestamp).toLocaleString() },
                { header: 'User', accessor: 'userName' as keyof AuditLog },
                { header: 'Action', accessor: (item: AuditLog) => (
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    item.action === 'CREATE' || item.action === 'Onboarded' ? "text-emerald-600" : 
                    item.action === 'UPDATE' || item.action === 'Updated' ? "text-primary-600" : "text-amber-600"
                  )}>
                    {item.action}
                  </span>
                )},
                { header: 'Entity', accessor: 'entity' as keyof AuditLog },
                { header: 'Details', accessor: 'newValue' as keyof AuditLog }
              ]} 
            />
          </div>
        </div>
      )}

      {activeTab === 'Whistleblower' && (
        <div className="space-y-6">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-900 italic uppercase tracking-tighter">Whistleblower Portal</h4>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Report any fraud, conflict of interest, or process violations anonymously. 
              Submissions are visible only to the System Administrator.
            </p>
            <button 
              onClick={() => setIsWhistleModalOpen(true)}
              className="mt-6 px-8 py-3 bg-rose-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20"
            >
              Raise Anonymous Report
            </button>
          </div>

          {currentUser.role === 'Admin' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Recent Submissions (Admin Only)</h4>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table 
                  data={submissions} 
                  columns={[
                    { header: 'Ref ID', accessor: 'referenceId' as keyof WhistleblowerSubmission },
                    { header: 'Timestamp', accessor: (item: WhistleblowerSubmission) => new Date(item.timestamp).toLocaleString() },
                    { header: 'Category', accessor: 'category' as keyof WhistleblowerSubmission },
                    { header: 'Description', accessor: (item: WhistleblowerSubmission) => item.description.substring(0, 50) + '...' }
                  ]} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Checklist' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Compliance Score</p>
              <h4 className="text-4xl font-bold text-emerald-600">85%</h4>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Active Controls</p>
              <h4 className="text-4xl font-bold text-primary-600">{Object.values(features).filter(f => f).length}</h4>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Pending Audits</p>
              <h4 className="text-4xl font-bold text-amber-600">2</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Audit Checkpoint</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Feature Link</th>
                  <th className="px-6 py-4 text-[10px] font-mono uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditChecklist.map(check => (
                  <tr key={check.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">{check.item}</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{check.feature}</td>
                    <td className="px-6 py-4">
                      {features[check.feature as keyof FeatureSettings] ? (
                        <span className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase">
                          <CheckCircle size={14} /> Compliant
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-rose-600 text-[10px] font-bold uppercase">
                          <AlertTriangle size={14} /> Non-Compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Whistleblower Modal */}
      <Modal isOpen={isWhistleModalOpen} onClose={() => setIsWhistleModalOpen(false)} title="Anonymous Report Submission">
        <form onSubmit={handleWhistleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Category</label>
            <select name="category" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none">
              <option value="Fraud">Fraud / Embezzlement</option>
              <option value="Conflict">Conflict of Interest</option>
              <option value="Process">Process Violation</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Description</label>
            <textarea name="description" rows={5} required placeholder="Provide as much detail as possible..." className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-900 focus:border-primary-500 outline-none resize-none" />
          </div>
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
            <p className="text-[10px] text-rose-600 leading-relaxed uppercase font-bold">
              Warning: False reporting is a violation of company policy. Ensure all submissions are truthful and based on evidence.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsWhistleModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-rose-600 text-white rounded font-bold text-xs hover:bg-rose-700 transition-colors uppercase tracking-widest shadow-lg shadow-rose-500/20">
              Submit Anonymously
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Audit;
