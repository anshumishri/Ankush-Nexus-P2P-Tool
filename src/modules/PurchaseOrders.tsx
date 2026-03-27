import React, { useState, useMemo } from 'react';
import { Plus, Eye, CheckCircle, XCircle, AlertCircle, FileText, Trash2, Printer, Search, Filter, ShoppingCart } from 'lucide-react';
import { PO, Vendor, SKU, FeatureSettings, User, POItem, AuditLog } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { PrintDocument } from '../components/PrintDocument';
import { cn, generateId, formatCurrency } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface POProps {
  pos: PO[];
  setPos: React.Dispatch<React.SetStateAction<PO[]>>;
  vendors: Vendor[];
  inventory: SKU[];
  features: FeatureSettings;
  currentUser: User;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

const PurchaseOrders: React.FC<POProps> = ({ pos, setPos, vendors, inventory, features, currentUser, auditLogs, setAuditLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPO, setViewingPO] = useState<PO | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPOForPrint, setSelectedPOForPrint] = useState<PO | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lineItems, setLineItems] = useState<POItem[]>([]);

  const addLineItem = () => {
    setLineItems([...lineItems, { skuId: '', name: '', qty: 1, unit: '', rate: 0, taxPercent: 18, total: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'skuId') {
      const sku = inventory.find(s => s.id === value);
      if (sku) {
        item.name = sku.name;
        item.unit = sku.unit;
      }
    }
    
    if (field === 'qty' || field === 'rate' || field === 'taxPercent') {
      const subtotal = item.qty * item.rate;
      item.total = subtotal + (subtotal * (item.taxPercent / 100));
    }
    
    newItems[index] = item;
    setLineItems(newItems);
  };

  const handleCreatePO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const poNumber = formData.get('poNumber') as string;

    // Duplicate Check
    if (features.PO_DUPLICATE_CHECK && pos.some(p => p.poNumber === poNumber)) {
      toast.error('PO Number already exists');
      return;
    }

    const totalAmount = lineItems.reduce((acc, item) => acc + item.total, 0);

    const newPO: PO = {
      id: generateId('PO'),
      poNumber,
      date: new Date().toISOString(),
      vendorId: formData.get('vendorId') as string,
      items: lineItems,
      deliveryDate: formData.get('deliveryDate') as string,
      shippingAddress: formData.get('shippingAddress') as string,
      terms: formData.get('terms') as string,
      status: features.MAKER_CHECKER ? 'Submitted' : 'Approved',
      createdBy: currentUser.id,
      totalAmount,
    };

    const updatedPOs = [...pos, newPO];
    setPos(updatedPOs);
    saveData(STORAGE_KEYS.POS, updatedPOs);
    
    // Audit Log
    const log: AuditLog = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'CREATE',
      entity: 'PO',
      entityId: newPO.id,
      newValue: `PO# ${newPO.poNumber} for ${formatCurrency(totalAmount)}`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setIsModalOpen(false);
    setLineItems([]);
    toast.success(features.MAKER_CHECKER ? 'PO submitted for approval' : 'PO created and approved');
  };

  const handlePrint = (po: PO) => {
    setSelectedPOForPrint(po);
    setIsPrintOpen(true);
  };

  const filteredPOs = useMemo(() => {
    return pos.filter(p => 
      p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendors.find(v => v.id === p.vendorId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pos, searchTerm, vendors]);

  const columns = [
    { 
      header: 'PO Number', 
      accessor: (item: PO) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-primary-600"><ShoppingCart size={14} /></div>
          <span className="font-mono font-bold text-slate-900">{item.poNumber}</span>
        </div>
      ),
      sortable: true 
    },
    { header: 'Date', accessor: (item: PO) => new Date(item.date).toLocaleDateString() },
    { header: 'Vendor', accessor: (item: PO) => vendors.find(v => v.id === item.vendorId)?.name || 'Unknown' },
    { header: 'Amount', accessor: (item: PO) => formatCurrency(item.totalAmount), sortable: true },
    { header: 'Status', accessor: (item: PO) => (
      <span className={cn(
        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
        item.status === 'Approved' && "bg-emerald-100 text-emerald-600",
        item.status === 'Submitted' && "bg-amber-100 text-amber-600",
        item.status === 'Rejected' && "bg-rose-100 text-rose-600",
        item.status === 'Draft' && "bg-slate-100 text-slate-500",
        item.status === 'Closed' && "bg-blue-100 text-blue-600"
      )}>
        {item.status}
      </span>
    )},
    { header: 'Delivery', accessor: (item: PO) => new Date(item.deliveryDate).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Procurement / Purchase Orders</h3>
        <button 
          onClick={() => { setLineItems([]); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          Create New PO
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search POs by number or vendor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-900 focus:border-primary-500 outline-none transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors shadow-sm">
          <Filter size={16} />
          Filter
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <Table 
          data={filteredPOs} 
          columns={columns} 
          onRowClick={(item) => setViewingPO(item)}
          actions={(item) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Printer size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewingPO(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Eye size={14} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create PO Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Purchase Order" size="xl">
        <form onSubmit={handleCreatePO} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">PO Number</label>
              <input name="poNumber" required defaultValue={`PO-${Date.now().toString().slice(-6)}`} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Vendor</label>
              <select name="vendorId" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none">
                <option value="">Select Vendor</option>
                {vendors.filter(v => v.kycStatus === 'Verified').map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Expected Delivery</label>
              <input name="deliveryDate" type="date" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Line Items</h4>
              <button type="button" onClick={addLineItem} className="text-[10px] text-primary-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Add Item
              </button>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-400">Item / SKU</th>
                    <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-400 w-24">Qty</th>
                    <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-400 w-32">Rate</th>
                    <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-400 w-20">Tax%</th>
                    <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-400 w-32">Total</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lineItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <select 
                          value={item.skuId} 
                          onChange={(e) => updateLineItem(idx, 'skuId', e.target.value)}
                          className="w-full bg-transparent border-none text-sm text-slate-900 focus:ring-0 p-0"
                        >
                          <option value="">Select SKU</option>
                          {inventory.map(s => <option key={s.id} value={s.id}>{s.name} ({s.id})</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => updateLineItem(idx, 'qty', Number(e.target.value))}
                          className="w-full bg-transparent border-none text-sm text-slate-900 focus:ring-0 p-0 font-mono"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={item.rate} 
                          onChange={(e) => updateLineItem(idx, 'rate', Number(e.target.value))}
                          className="w-full bg-transparent border-none text-sm text-slate-900 focus:ring-0 p-0 font-mono"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input 
                          type="number" 
                          value={item.taxPercent} 
                          onChange={(e) => updateLineItem(idx, 'taxPercent', Number(e.target.value))}
                          className="w-full bg-transparent border-none text-sm text-slate-900 focus:ring-0 p-0 font-mono"
                        />
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-500 font-mono">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="px-4 py-2">
                        <button type="button" onClick={() => removeLineItem(idx)} className="text-rose-500 hover:text-rose-600">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lineItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-xs italic">No items added</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80">
                    <td colSpan={4} className="px-4 py-3 text-right text-[10px] font-mono uppercase text-slate-500">Grand Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-600 font-mono">
                      {formatCurrency(lineItems.reduce((acc, item) => acc + item.total, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Shipping Address</label>
              <textarea name="shippingAddress" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Terms & Conditions</label>
              <textarea name="terms" rows={3} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors uppercase tracking-widest shadow-sm">
              Submit Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* View PO Modal */}
      <Modal isOpen={!!viewingPO} onClose={() => setViewingPO(null)} title={`Purchase Order: ${viewingPO?.poNumber}`} size="lg">
        {viewingPO && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Vendor</p>
                <p className="text-sm font-bold text-slate-900">{vendors.find(v => v.id === viewingPO.vendorId)?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date(viewingPO.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Status</p>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                  viewingPO.status === 'Approved' && "bg-emerald-100 text-emerald-600",
                  viewingPO.status === 'Submitted' && "bg-amber-100 text-amber-600",
                  viewingPO.status === 'Rejected' && "bg-rose-100 text-rose-600"
                )}>
                  {viewingPO.status}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Item</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Qty</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Rate</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingPO.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">{item.qty} {item.unit}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 font-mono">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/50">
                    <td colSpan={3} className="px-4 py-3 text-right text-[10px] font-mono uppercase text-slate-500">Grand Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-primary-600 font-mono">{formatCurrency(viewingPO.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingPO(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded font-bold text-xs hover:bg-slate-200 transition-colors">Close</button>
              {viewingPO.status === 'Approved' && (
                <button 
                  onClick={() => handlePrint(viewingPO)}
                  className="px-6 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors flex items-center gap-2 uppercase tracking-widest shadow-sm"
                >
                  <Printer size={14} /> Print PO
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Print Preview */}
      {isPrintOpen && selectedPOForPrint && (
        <PrintDocument 
          title="Purchase Order"
          documentNumber={selectedPOForPrint.poNumber}
          date={selectedPOForPrint.date}
          status={selectedPOForPrint.status}
          companyName="Nexus P2P"
          vendor={vendors.find(v => v.id === selectedPOForPrint.vendorId)}
          items={selectedPOForPrint.items.map(item => ({
            skuId: item.skuId,
            name: item.name,
            quantity: item.qty,
            unitPrice: item.rate,
            total: item.total
          }))}
          totalAmount={selectedPOForPrint.totalAmount}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default PurchaseOrders;
