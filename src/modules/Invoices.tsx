import React, { useState, useMemo } from 'react';
import { Plus, Eye, CheckCircle, AlertTriangle, XCircle, FileText, Printer, Search, Filter } from 'lucide-react';
import { Invoice, PO, GRN, Vendor, FeatureSettings, User, AuditLog } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { PrintDocument } from '../components/PrintDocument';
import { cn, generateId, formatCurrency } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface InvoicesProps {
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  pos: PO[];
  grns: GRN[];
  vendors: Vendor[];
  features: FeatureSettings;
  currentUser: User;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

const Invoices: React.FC<InvoicesProps> = ({ invoices, setInvoices, pos, grns, vendors, features, currentUser, auditLogs, setAuditLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedGRNId, setSelectedGRNId] = useState('');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const po = pos.find(p => p.id === selectedPOId);
    const grn = grns.find(g => g.id === selectedGRNId);
    
    if (!po || !grn) return;

    const invoiceAmount = Number(formData.get('totalAmount'));
    
    // 3-Way Match Logic
    let matchStatus: 'Match' | 'Partial' | 'Mismatch' = 'Match';
    if (invoiceAmount !== po.totalAmount) {
      matchStatus = 'Mismatch';
    }
    
    // Check Qty Match
    const qtyMismatch = grn.items.some(gi => {
      const poItem = po.items.find(pi => pi.skuId === gi.skuId);
      return poItem && gi.acceptedQty !== poItem.qty;
    });
    
    if (qtyMismatch) matchStatus = 'Partial';

    const newInvoice: Invoice = {
      id: generateId('INV'),
      invoiceNumber: formData.get('invoiceNumber') as string,
      vendorId: po.vendorId,
      date: new Date().toISOString(),
      poId: selectedPOId,
      grnId: selectedGRNId,
      items: [],
      totalAmount: invoiceAmount,
      status: 'Pending',
      matchStatus,
    };

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    saveData(STORAGE_KEYS.INVOICES, updatedInvoices);

    // Audit Log
    const log: AuditLog = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'CREATE',
      entity: 'Invoice',
      entityId: newInvoice.id,
      newValue: `INV# ${newInvoice.invoiceNumber} - Match Status: ${matchStatus}`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setIsModalOpen(false);
    toast.success(`Invoice raised with ${matchStatus} status`);
  };

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoiceForPrint(invoice);
    setIsPrintOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => 
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendors.find(v => v.id === i.vendorId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm, vendors]);

  const columns = [
    { 
      header: 'Invoice #', 
      accessor: (item: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-primary-600"><FileText size={14} /></div>
          <span className="font-mono font-bold text-slate-900">{item.invoiceNumber}</span>
        </div>
      ),
      sortable: true 
    },
    { header: 'Vendor', accessor: (item: Invoice) => vendors.find(v => v.id === item.vendorId)?.name || 'Unknown' },
    { header: 'Amount', accessor: (item: Invoice) => formatCurrency(item.totalAmount), sortable: true },
    { header: 'Match Status', accessor: (item: Invoice) => (
      <div className="flex items-center gap-2">
        {item.matchStatus === 'Match' && <CheckCircle size={14} className="text-emerald-500" />}
        {item.matchStatus === 'Partial' && <AlertTriangle size={14} className="text-amber-500" />}
        {item.matchStatus === 'Mismatch' && <XCircle size={14} className="text-rose-500" />}
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          item.matchStatus === 'Match' && "text-emerald-500",
          item.matchStatus === 'Partial' && "text-amber-500",
          item.matchStatus === 'Mismatch' && "text-rose-500"
        )}>
          {item.matchStatus}
        </span>
      </div>
    )},
    { header: 'Status', accessor: (item: Invoice) => (
      <span className={cn(
        "text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest",
        item.status === 'Paid' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
      )}>
        {item.status}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Finance / Invoices & 3-Way Match</h3>
        <button 
          onClick={() => { setSelectedPOId(''); setSelectedGRNId(''); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          Record New Invoice
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search invoices by number or vendor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-primary-600 transition-colors shadow-sm">
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table 
          data={filteredInvoices} 
          columns={columns} 
          onRowClick={(item) => setViewingInvoice(item)}
          actions={(item) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Printer size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewingInvoice(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Eye size={14} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create Invoice Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Vendor Invoice" size="lg">
        <form onSubmit={handleCreateInvoice} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Invoice Number</label>
              <input name="invoiceNumber" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">PO Reference</label>
              <select 
                name="poId" 
                required 
                value={selectedPOId}
                onChange={(e) => setSelectedPOId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none"
              >
                <option value="">Select PO</option>
                {pos.filter(p => p.status === 'Closed' || p.status === 'Approved').map(p => <option key={p.id} value={p.id}>{p.poNumber} ({formatCurrency(p.totalAmount)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">GRN Reference</label>
              <select 
                name="grnId" 
                required 
                value={selectedGRNId}
                onChange={(e) => setSelectedGRNId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none"
              >
                <option value="">Select GRN</option>
                {grns.filter(g => g.poId === selectedPOId).map(g => <option key={g.id} value={g.id}>{g.grnNumber} ({new Date(g.date).toLocaleDateString()})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Invoice Amount (Total)</label>
              <input name="totalAmount" type="number" step="0.01" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
          </div>

          {selectedPOId && selectedGRNId && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">3-Way Match Preview</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">PO Amount</p>
                  <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(pos.find(p => p.id === selectedPOId)?.totalAmount || 0)}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">GRN Status</p>
                  <p className="text-sm font-bold text-emerald-600 uppercase">Accepted</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Match Check</p>
                  <p className="text-sm font-bold text-amber-600 uppercase">Pending</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors uppercase tracking-widest shadow-sm">
              Record & Match Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal isOpen={!!viewingInvoice} onClose={() => setViewingInvoice(null)} title={`Invoice Details: ${viewingInvoice?.invoiceNumber}`} size="lg">
        {viewingInvoice && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Vendor</p>
                <p className="text-sm font-bold text-slate-900">{vendors.find(v => v.id === viewingInvoice.vendorId)?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Amount</p>
                <p className="text-sm font-bold text-slate-900 font-mono">{formatCurrency(viewingInvoice.totalAmount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Match Status</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                  viewingInvoice.matchStatus === 'Match' && "bg-emerald-100 text-emerald-600",
                  viewingInvoice.matchStatus === 'Partial' && "bg-amber-100 text-amber-600",
                  viewingInvoice.matchStatus === 'Mismatch' && "bg-rose-100 text-rose-600"
                )}>
                  {viewingInvoice.matchStatus}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Payment</p>
                <p className="text-sm font-bold text-amber-600 uppercase">{viewingInvoice.status}</p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-6 shadow-sm">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">3-Way Match Audit</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle size={14} /></div>
                    <span className="text-sm text-slate-700">Purchase Order Match (PO# {pos.find(p => p.id === viewingInvoice.poId)?.poNumber})</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{formatCurrency(pos.find(p => p.id === viewingInvoice.poId)?.totalAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><CheckCircle size={14} /></div>
                    <span className="text-sm text-slate-700">Goods Receipt Match (GRN# {grns.find(g => g.id === viewingInvoice.grnId)?.grnNumber})</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Accepted Qty Verified</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      viewingInvoice.matchStatus === 'Match' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                    )}>
                      {viewingInvoice.matchStatus === 'Match' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    </div>
                    <span className="text-sm text-slate-700">Invoice Amount Match</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{formatCurrency(viewingInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingInvoice(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded font-bold text-xs hover:bg-slate-200 transition-colors">Close</button>
              <button 
                onClick={() => handlePrint(viewingInvoice)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 uppercase tracking-widest shadow-sm"
              >
                <Printer size={14} /> Print Preview
              </button>
              <button className="px-6 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors uppercase tracking-widest shadow-sm">Approve for Payment</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Preview */}
      {isPrintOpen && selectedInvoiceForPrint && (
        <PrintDocument 
          title="Vendor Invoice"
          documentNumber={selectedInvoiceForPrint.invoiceNumber}
          date={selectedInvoiceForPrint.date}
          status={selectedInvoiceForPrint.status}
          companyName="Nexus P2P"
          items={[{
            skuId: 'TOTAL',
            name: 'Total Invoice Amount',
            quantity: 1,
            rate: selectedInvoiceForPrint.totalAmount,
            total: selectedInvoiceForPrint.totalAmount
          }]}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default Invoices;
