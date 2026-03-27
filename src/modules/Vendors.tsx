import React, { useState } from 'react';
import { Plus, Eye, CheckCircle, XCircle, AlertTriangle, UserCheck, ShieldAlert, History } from 'lucide-react';
import { Vendor, FeatureSettings, User, AuditLog } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { cn, generateId } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface VendorsProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  features: FeatureSettings;
  currentUser: User;
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

const Vendors: React.FC<VendorsProps> = ({ vendors, setVendors, features, currentUser, setAuditLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const handleSaveVendor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newVendor: Vendor = {
      id: editingVendor?.id || generateId('V'),
      name: formData.get('name') as string,
      gstin: formData.get('gstin') as string,
      pan: formData.get('pan') as string,
      address: formData.get('address') as string,
      contact: formData.get('contact') as string,
      bankDetails: formData.get('bankDetails') as string,
      kycStatus: (formData.get('kycStatus') as Vendor['kycStatus']) || 'Pending',
      status: (formData.get('status') as Vendor['status']) || 'Active',
      lastReviewDate: new Date().toISOString(),
    };

    let updatedVendors;
    if (editingVendor) {
      updatedVendors = vendors.map(v => v.id === editingVendor.id ? newVendor : v);
      toast.success('Vendor updated successfully');
    } else {
      updatedVendors = [...vendors, newVendor];
      toast.success('Vendor onboarding initiated');
    }

    setVendors(updatedVendors);
    saveData(STORAGE_KEYS.VENDORS, updatedVendors);
    
    // Audit Log
    const log = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: editingVendor ? 'Updated' : 'Onboarded',
      entity: 'Vendor',
      entityId: newVendor.id,
      newValue: `Vendor: ${newVendor.name} - Status: ${newVendor.status}`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setIsModalOpen(false);
    setEditingVendor(null);
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: 'Vendor ID', accessor: 'id' as keyof Vendor, sortable: true },
    { header: 'Company Name', accessor: 'name' as keyof Vendor, sortable: true },
    { header: 'GSTIN', accessor: 'gstin' as keyof Vendor },
    { header: 'KYC Status', accessor: (item: Vendor) => (
      <div className="flex items-center gap-2">
        {item.kycStatus === 'Verified' && <CheckCircle size={14} className="text-emerald-600" />}
        {item.kycStatus === 'Pending' && <AlertTriangle size={14} className="text-amber-600" />}
        {item.kycStatus === 'Rejected' && <XCircle size={14} className="text-rose-600" />}
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          item.kycStatus === 'Verified' && "text-emerald-600",
          item.kycStatus === 'Pending' && "text-amber-600",
          item.kycStatus === 'Rejected' && "text-rose-600"
        )}>
          {item.kycStatus}
        </span>
      </div>
    )},
    { header: 'Status', accessor: (item: Vendor) => (
      <span className={cn(
        "text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest",
        item.status === 'Active' && "bg-emerald-100 text-emerald-600",
        item.status === 'Inactive' && "bg-slate-100 text-slate-500",
        item.status === 'Blacklisted' && "bg-rose-100 text-rose-600"
      )}>
        {item.status}
      </span>
    )},
    { header: 'Last Review', accessor: (item: Vendor) => item.lastReviewDate ? new Date(item.lastReviewDate).toLocaleDateString() : 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Vendor Master Database</h3>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 rotate-45" size={16} />
            <input 
              type="text" 
              placeholder="Search vendors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => { setEditingVendor(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-all uppercase tracking-widest shadow-sm"
          >
            <Plus size={16} />
            Onboard Vendor
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table 
          data={filteredVendors} 
          columns={columns} 
          onRowClick={(item) => setViewingVendor(item)}
          actions={(item) => (
            <div className="flex items-center justify-end gap-2">
              <button onClick={(e) => { e.stopPropagation(); setEditingVendor(item); setIsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors" title="Edit Vendor"><History size={14} /></button>
              <button onClick={(e) => { e.stopPropagation(); setViewingVendor(item); }} className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors" title="View Profile"><Eye size={14} /></button>
            </div>
          )}
        />
      </div>

      {/* Vendor Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVendor ? 'Edit Vendor' : 'Vendor Onboarding (KYC)'} size="lg">
        <form onSubmit={handleSaveVendor} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Company Name</label>
              <input name="name" required defaultValue={editingVendor?.name} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">GSTIN</label>
              <input name="gstin" required defaultValue={editingVendor?.gstin} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">PAN</label>
              <input name="pan" required defaultValue={editingVendor?.pan} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Registered Address</label>
              <textarea name="address" rows={2} required defaultValue={editingVendor?.address} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Contact Details</label>
              <input name="contact" required defaultValue={editingVendor?.contact} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Bank Details</label>
              <input name="bankDetails" required defaultValue={editingVendor?.bankDetails} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            {currentUser.role === 'Admin' && (
              <>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">KYC Status</label>
                  <select name="kycStatus" defaultValue={editingVendor?.kycStatus || 'Pending'} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none">
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Vendor Status</label>
                  <select name="status" defaultValue={editingVendor?.status || 'Active'} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Blacklisted">Blacklisted</option>
                  </select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors uppercase tracking-widest shadow-sm">
              {editingVendor ? 'Update Vendor' : 'Submit for KYC'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Vendor Modal */}
      <Modal isOpen={!!viewingVendor} onClose={() => setViewingVendor(null)} title={`Vendor Profile: ${viewingVendor?.name}`} size="lg">
        {viewingVendor && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">KYC Status</p>
                <div className="flex items-center gap-2">
                  {viewingVendor.kycStatus === 'Verified' ? <UserCheck className="text-emerald-600" size={18} /> : <ShieldAlert className="text-amber-600" size={18} />}
                  <p className="text-sm font-bold text-slate-900">{viewingVendor.kycStatus}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Vendor Status</p>
                <p className={cn(
                  "text-sm font-bold uppercase",
                  viewingVendor.status === 'Active' ? "text-emerald-600" : "text-rose-600"
                )}>{viewingVendor.status}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">GSTIN</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{viewingVendor.gstin}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Contact Information</h4>
                <div className="space-y-2">
                  <p className="text-xs text-slate-700"><span className="text-slate-400">Contact:</span> {viewingVendor.contact}</p>
                  <p className="text-xs text-slate-700"><span className="text-slate-400">Address:</span> {viewingVendor.address}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Financial Details</h4>
                <div className="space-y-2">
                  <p className="text-xs text-slate-700"><span className="text-slate-400">PAN:</span> {viewingVendor.pan}</p>
                  <p className="text-xs text-slate-700"><span className="text-slate-400">Bank:</span> {viewingVendor.bankDetails}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingVendor(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded font-bold text-xs hover:bg-slate-200 transition-colors">Close</button>
              {currentUser.role === 'Admin' && viewingVendor.kycStatus === 'Pending' && (
                <button 
                  onClick={() => {
                    const updated = vendors.map(v => v.id === viewingVendor.id ? { ...v, kycStatus: 'Verified' as const } : v);
                    setVendors(updated);
                    saveData(STORAGE_KEYS.VENDORS, updated);
                    setViewingVendor(null);
                    toast.success('Vendor KYC verified');
                  }}
                  className="px-6 py-2 bg-emerald-600 text-white rounded font-bold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Verify KYC
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Vendors;
