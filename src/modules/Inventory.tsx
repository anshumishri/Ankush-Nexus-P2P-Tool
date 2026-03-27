import React, { useState, useMemo } from 'react';
import { Plus, Calculator, History, AlertTriangle, Search, Filter, Package, ArrowRightLeft } from 'lucide-react';
import { SKU, FeatureSettings, User, AuditLog } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { cn, generateId } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface InventoryProps {
  inventory: SKU[];
  setInventory: React.Dispatch<React.SetStateAction<SKU[]>>;
  features: FeatureSettings;
  currentUser: User;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

const Inventory: React.FC<InventoryProps> = ({ inventory, setInventory, features, currentUser, auditLogs, setAuditLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEOQModalOpen, setIsEOQModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingSKU, setEditingSKU] = useState<SKU | null>(null);
  const [selectedSKUForHistory, setSelectedSKUForHistory] = useState<SKU | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingSKU, setAdjustingSKU] = useState<SKU | null>(null);

  const handleSaveSKU = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSKU: SKU = {
      id: editingSKU?.id || generateId('SKU'),
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      unit: formData.get('unit') as string,
      currentStock: Number(formData.get('currentStock')),
      reorderLevel: Number(formData.get('reorderLevel')),
      maxStock: Number(formData.get('maxStock')),
      safetyStock: Number(formData.get('safetyStock')),
      avgDailyUsage: Number(formData.get('avgDailyUsage')),
      leadTimeDays: Number(formData.get('leadTimeDays')),
      lastUpdated: new Date().toISOString(),
    };

    let updatedInventory;
    if (editingSKU) {
      updatedInventory = inventory.map(s => s.id === editingSKU.id ? newSKU : s);
      toast.success('SKU updated successfully');
    } else {
      updatedInventory = [...inventory, newSKU];
      toast.success('New SKU added successfully');
    }

    // Audit Log
    const log: AuditLog = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: editingSKU ? 'UPDATE' : 'CREATE',
      entity: 'SKU',
      entityId: newSKU.id,
      newValue: `${newSKU.name} (Stock: ${newSKU.currentStock})`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setInventory(updatedInventory);
    saveData(STORAGE_KEYS.INVENTORY, updatedInventory);
    setIsModalOpen(false);
    setEditingSKU(null);
  };

  const handleStockAdjustment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustingSKU) return;
    const formData = new FormData(e.currentTarget);
    const type = formData.get('type') as 'ADD' | 'REMOVE';
    const qty = Number(formData.get('qty'));
    const reason = formData.get('reason') as string;

    const newStock = type === 'ADD' ? adjustingSKU.currentStock + qty : adjustingSKU.currentStock - qty;
    
    const updatedInventory = inventory.map(s => s.id === adjustingSKU.id ? { 
      ...s, 
      currentStock: newStock,
      lastUpdated: new Date().toISOString()
    } : s);

    setInventory(updatedInventory);
    saveData(STORAGE_KEYS.INVENTORY, updatedInventory);

    // Audit Log
    const log: AuditLog = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'UPDATE',
      entity: 'SKU',
      entityId: adjustingSKU.id,
      newValue: `Stock Adjustment for ${adjustingSKU.name}: ${type === 'ADD' ? '+' : '-'}${qty} (${reason})`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setIsAdjustmentModalOpen(false);
    setAdjustingSKU(null);
    toast.success('Stock adjusted successfully');
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const columns = [
    { 
      header: 'SKU ID', 
      accessor: (item: SKU) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-primary-600"><Package size={14} /></div>
          <span className="font-mono font-bold text-slate-900">{item.id}</span>
        </div>
      ),
      sortable: true 
    },
    { header: 'Item Name', accessor: 'name' as keyof SKU, sortable: true },
    { header: 'Category', accessor: 'category' as keyof SKU, sortable: true },
    { header: 'Stock Status', accessor: (item: SKU) => (
      <div className="flex flex-col gap-1.5 min-w-[120px]">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="font-bold text-slate-600">{item.currentStock} / {item.maxStock}</span>
          <span>{Math.round((item.currentStock / item.maxStock) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              item.currentStock <= item.safetyStock ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" : 
              item.currentStock <= item.reorderLevel ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.3)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            )}
            style={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
          />
        </div>
      </div>
    )},
    { header: 'Unit', accessor: 'unit' as keyof SKU },
    ...(features.REORDER_LEVELS ? [{ header: 'ROP', accessor: 'reorderLevel' as keyof SKU, sortable: true }] : []),
    ...(features.SAFETY_STOCK ? [{ header: 'Safety', accessor: 'safetyStock' as keyof SKU, sortable: true }] : []),
    { header: 'Last Update', accessor: (item: SKU) => new Date(item.lastUpdated).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Inventory / Master Data</h3>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Healthy</span>
            <div className="w-2 h-2 rounded-full bg-orange-500 ml-2 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Reorder</span>
            <div className="w-2 h-2 rounded-full bg-rose-500 ml-2 animate-pulse" />
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Critical</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {features.EOQ_PLANNING && (
            <button 
              onClick={() => setIsEOQModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-primary-600 transition-all shadow-sm"
            >
              <Calculator size={16} />
              EOQ Calculator
            </button>
          )}
          <button 
            onClick={() => { setEditingSKU(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/10"
          >
            <Plus size={16} />
            Add SKU
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by SKU ID, Name or Category..." 
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
          data={filteredInventory} 
          columns={columns} 
          onRowClick={(item) => { setEditingSKU(item); setIsModalOpen(true); }}
          actions={(item) => (
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); setAdjustingSKU(item); setIsAdjustmentModalOpen(true); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                title="Adjust Stock"
              >
                <ArrowRightLeft size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedSKUForHistory(item); setIsHistoryModalOpen(true); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
                title="View History"
              >
                <History size={14} />
              </button>
            </div>
          )}
        />
      </div>

      {/* SKU Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingSKU ? 'Edit SKU' : 'Add New SKU'}
      >
        <form onSubmit={handleSaveSKU} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Item Name</label>
              <input name="name" defaultValue={editingSKU?.name} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Category</label>
              <input name="category" defaultValue={editingSKU?.category} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Unit</label>
              <input name="unit" defaultValue={editingSKU?.unit} required placeholder="e.g. Units, Kg, Liters" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Current Stock</label>
              <input name="currentStock" type="number" defaultValue={editingSKU?.currentStock} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Max Stock</label>
              <input name="maxStock" type="number" defaultValue={editingSKU?.maxStock} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Reorder Level (ROP)</label>
              <input name="reorderLevel" type="number" defaultValue={editingSKU?.reorderLevel} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Safety Stock</label>
              <input name="safetyStock" type="number" defaultValue={editingSKU?.safetyStock} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Avg Daily Usage</label>
              <input name="avgDailyUsage" type="number" defaultValue={editingSKU?.avgDailyUsage} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Lead Time (Days)</label>
              <input name="leadTimeDays" type="number" defaultValue={editingSKU?.leadTimeDays} required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors shadow-sm">
              {editingSKU ? 'Update SKU' : 'Save SKU'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EOQ Calculator Modal */}
      <Modal isOpen={isEOQModalOpen} onClose={() => setIsEOQModalOpen(false)} title="Economic Order Quantity (EOQ) Calculator">
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs text-slate-500 leading-relaxed">
              EOQ is the ideal order quantity a company should purchase to minimize inventory costs such as holding costs, shortage costs, and order costs.
            </p>
            <p className="text-[10px] font-mono text-primary-600 mt-2 uppercase tracking-widest">Formula: EOQ = √((2 * D * S) / H)</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Annual Demand (D)</label>
              <input id="eoq-d" type="number" placeholder="e.g. 12000" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Ordering Cost per Order (S)</label>
              <input id="eoq-s" type="number" placeholder="e.g. 50" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Holding Cost per Unit per Year (H)</label>
              <input id="eoq-h" type="number" placeholder="e.g. 2" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500" />
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-primary-200 rounded-xl text-center shadow-inner">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Calculated EOQ</p>
            <h4 className="text-4xl font-bold text-primary-600" id="eoq-result">0</h4>
            <p className="text-[10px] text-slate-400 mt-2 uppercase">Units per order</p>
          </div>

          <button 
            onClick={() => {
              const d = Number((document.getElementById('eoq-d') as HTMLInputElement).value);
              const s = Number((document.getElementById('eoq-s') as HTMLInputElement).value);
              const h = Number((document.getElementById('eoq-h') as HTMLInputElement).value);
              if (d && s && h) {
                const result = Math.sqrt((2 * d * s) / h);
                (document.getElementById('eoq-result') as HTMLElement).innerText = Math.round(result).toString();
              }
            }}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition-all text-xs uppercase tracking-widest shadow-sm"
          >
            Calculate
          </button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Stock History: ${selectedSKUForHistory?.name}`} size="lg">
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Date</th>
                  <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">User</th>
                  <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Action</th>
                  <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs
                  .filter(log => log.entity === 'SKU' && log.newValue.includes(selectedSKUForHistory?.name || ''))
                  .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-700">{log.userName}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter",
                          log.action === 'CREATE' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{log.newValue}</td>
                    </tr>
                  ))}
                {auditLogs.filter(log => log.entity === 'SKU' && log.newValue.includes(selectedSKUForHistory?.name || '')).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm italic">No history found for this SKU</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} title={`Stock Adjustment: ${adjustingSKU?.name}`}>
        <form onSubmit={handleStockAdjustment} className="space-y-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-mono text-slate-400 uppercase">Current Stock</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{adjustingSKU?.currentStock} {adjustingSKU?.unit}</p>
            </div>
            <div className="p-3 bg-white rounded-full text-primary-600 shadow-sm">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Adjustment Type</label>
              <select name="type" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500">
                <option value="ADD">Add Stock (+)</option>
                <option value="REMOVE">Remove Stock (-)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Quantity</label>
              <input name="qty" type="number" required min="1" className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Reason for Adjustment</label>
              <textarea name="reason" required className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 outline-none focus:border-primary-500 h-20 resize-none" placeholder="e.g. Damage, Manual Count Correction, Return..."></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-all uppercase tracking-widest shadow-sm">
              Update Stock
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
