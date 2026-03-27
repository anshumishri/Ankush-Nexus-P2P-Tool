import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Eye, MessageSquare, ArrowUpRight } from 'lucide-react';
import { PO, Vendor, FeatureSettings, User } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { cn, formatCurrency, generateId } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface ApprovalsProps {
  pos: PO[];
  setPos: React.Dispatch<React.SetStateAction<PO[]>>;
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  currentUser: User;
  setAuditLogs: React.Dispatch<React.SetStateAction<any[]>>;
}

const Approvals: React.FC<ApprovalsProps> = ({ pos, setPos, vendors, setVendors, currentUser, setAuditLogs }) => {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected'>('Pending');
  const [selectedItem, setSelectedItem] = useState<{ type: 'PO' | 'Vendor', data: any } | null>(null);
  const [comment, setComment] = useState('');

  const pendingPOs = pos.filter(p => p.status === 'Submitted');
  const pendingVendors = vendors.filter(v => v.kycStatus === 'Pending');

  const allPending = [
    ...pendingPOs.map(p => ({ id: p.id, type: 'PO' as const, reference: p.poNumber, date: p.date, amount: p.totalAmount, submittedBy: p.createdBy, data: p })),
    ...pendingVendors.map(v => ({ id: v.id, type: 'Vendor' as const, reference: v.name, date: v.lastReviewDate || new Date().toISOString(), amount: 0, submittedBy: 'System', data: v }))
  ];

  const handleApprove = () => {
    if (!selectedItem) return;
    if (!comment.trim()) {
      toast.warning('Please provide a comment for approval');
      return;
    }

    if (selectedItem.type === 'PO') {
      const updated = pos.map(p => p.id === selectedItem.data.id ? { ...p, status: 'Approved' as const, approvedBy: currentUser.id, notes: comment } : p);
      setPos(updated);
      saveData(STORAGE_KEYS.POS, updated);
      toast.success(`Purchase Order ${selectedItem.data.poNumber} approved`);
    } else {
      const updated = vendors.map(v => v.id === selectedItem.data.id ? { ...v, kycStatus: 'Verified' as const } : v);
      setVendors(updated);
      saveData(STORAGE_KEYS.VENDORS, updated);
      toast.success(`Vendor ${selectedItem.data.name} KYC verified`);
    }

    // Audit Log
    const log = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'Approved',
      entity: selectedItem.type,
      entityId: selectedItem.data.id,
      newValue: `Comment: ${comment}`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setSelectedItem(null);
    setComment('');
  };

  const handleReject = () => {
    if (!selectedItem) return;
    if (!comment.trim()) {
      toast.warning('Please provide a reason for rejection');
      return;
    }

    if (selectedItem.type === 'PO') {
      const updated = pos.map(p => p.id === selectedItem.data.id ? { ...p, status: 'Rejected' as const, notes: comment } : p);
      setPos(updated);
      saveData(STORAGE_KEYS.POS, updated);
      toast.error(`Purchase Order ${selectedItem.data.poNumber} rejected`);
    } else {
      const updated = vendors.map(v => v.id === selectedItem.data.id ? { ...v, kycStatus: 'Rejected' as const } : v);
      setVendors(updated);
      saveData(STORAGE_KEYS.VENDORS, updated);
      toast.error(`Vendor ${selectedItem.data.name} KYC rejected`);
    }

    setSelectedItem(null);
    setComment('');
  };

  const handleEscalate = () => {
    console.log(`[ESCALATION LOG] User ${currentUser.name} escalated ${selectedItem?.type} ${selectedItem?.data.id} to Director.`);
    toast.info('Item escalated to Director/CEO');
    setSelectedItem(null);
  };

  const columns = [
    { header: 'Type', accessor: (item: any) => (
      <span className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
        item.type === 'PO' ? "bg-indigo-500/20 text-indigo-500" : "bg-blue-500/20 text-blue-500"
      )}>
        {item.type}
      </span>
    )},
    { header: 'Reference', accessor: 'reference', sortable: true },
    { header: 'Date', accessor: (item: any) => new Date(item.date).toLocaleDateString() },
    { header: 'Amount', accessor: (item: any) => item.amount > 0 ? formatCurrency(item.amount) : 'N/A' },
    { header: 'Submitted By', accessor: 'submittedBy' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Approval Inbox</h3>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['Pending', 'Approved', 'Rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-bold uppercase rounded transition-all",
                activeTab === tab ? "bg-white text-primary-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {tab} {tab === 'Pending' && allPending.length > 0 && `(${allPending.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table 
          data={allPending} 
          columns={columns} 
          onRowClick={(item) => setSelectedItem(item)}
          actions={(item) => (
            <button onClick={() => setSelectedItem(item)} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors">
              <Eye size={14} />
            </button>
          )}
        />
      </div>

      {/* Approval Modal */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={`Review ${selectedItem?.type}: ${selectedItem?.reference}`} size="lg">
        {selectedItem && (
          <div className="space-y-8">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Submission Details</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Submitted By</p>
                  <p className="text-sm font-bold text-slate-900">{selectedItem.submittedBy}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Date</p>
                  <p className="text-sm font-bold text-slate-900">{new Date(selectedItem.date).toLocaleString()}</p>
                </div>
                {selectedItem.amount > 0 && (
                  <div>
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Total Amount</p>
                    <p className="text-sm font-bold text-primary-600 font-mono">{formatCurrency(selectedItem.amount)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                <MessageSquare size={14} /> Reviewer Comments
              </label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter approval/rejection reason..."
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-900 focus:border-primary-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button 
                onClick={handleEscalate}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors"
              >
                <ArrowUpRight size={14} /> Escalate to Director
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={handleReject}
                  className="flex items-center gap-2 px-6 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded font-bold text-xs hover:bg-rose-600 hover:text-white transition-all uppercase tracking-widest shadow-sm"
                >
                  <XCircle size={14} /> Reject
                </button>
                <button 
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-8 py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 transition-all uppercase tracking-widest shadow-sm"
                >
                  <CheckCircle size={14} /> Approve
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Approvals;
