import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle, XCircle, Eye, ClipboardCheck, Printer, Search, Filter } from 'lucide-react';
import { GRN, PO, SKU, FeatureSettings, User, GRNItem, AuditLog } from '../types';
import { Table } from '../components/Table';
import { Modal } from '../components/Modal';
import { PrintDocument } from '../components/PrintDocument';
import { cn, generateId } from '../lib/utils';
import { toast } from '../components/Toast';
import { STORAGE_KEYS, saveData } from '../lib/storage';

interface GRNProps {
  grns: GRN[];
  setGrns: React.Dispatch<React.SetStateAction<GRN[]>>;
  pos: PO[];
  setPos: React.Dispatch<React.SetStateAction<PO[]>>;
  inventory: SKU[];
  setInventory: React.Dispatch<React.SetStateAction<SKU[]>>;
  features: FeatureSettings;
  currentUser: User;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
}

const GRNModule: React.FC<GRNProps> = ({ grns, setGrns, pos, setPos, inventory, setInventory, features, currentUser, auditLogs, setAuditLogs }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [grnItems, setGrnItems] = useState<GRNItem[]>([]);
  const [viewingGRN, setViewingGRN] = useState<GRN | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedGRNForPrint, setSelectedGRNForPrint] = useState<GRN | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handlePOChange = (poId: string) => {
    setSelectedPOId(poId);
    const po = pos.find(p => p.id === poId);
    if (po) {
      setGrnItems(po.items.map(item => ({
        skuId: item.skuId,
        orderedQty: item.qty,
        receivedQty: item.qty,
        acceptedQty: item.qty,
        rejectedQty: 0,
      })));
    }
  };

  const updateGRNItem = (index: number, field: keyof GRNItem, value: any) => {
    const newItems = [...grnItems];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'receivedQty') {
      item.acceptedQty = Number(value);
      item.rejectedQty = 0;
    }
    
    if (field === 'acceptedQty') {
      item.rejectedQty = item.receivedQty - Number(value);
    }
    
    newItems[index] = item;
    setGrnItems(newItems);
  };

  const handleCreateGRN = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Segregation of Duties Check
    if (features.SEGREGATION_OF_DUTIES) {
      const po = pos.find(p => p.id === selectedPOId);
      if (po && po.createdBy === currentUser.id) {
        toast.error('Segregation of Duties: PO creator cannot create GRN for the same PO');
        return;
      }
    }

    const newGRN: GRN = {
      id: generateId('GRN'),
      grnNumber: formData.get('grnNumber') as string,
      poId: selectedPOId,
      date: new Date().toISOString(),
      receivedBy: currentUser.id,
      items: grnItems,
      status: 'Approved',
    };

    // Update Inventory
    if (features.REALTIME_INVENTORY_UPDATE) {
      const updatedInventory = inventory.map(sku => {
        const grnItem = grnItems.find(gi => gi.skuId === sku.id);
        if (grnItem) {
          return {
            ...sku,
            currentStock: sku.currentStock + grnItem.acceptedQty,
            lastUpdated: new Date().toISOString()
          };
        }
        return sku;
      });
      setInventory(updatedInventory);
      saveData(STORAGE_KEYS.INVENTORY, updatedInventory);
    }

    // Update PO Status
    const updatedPOs = pos.map(p => p.id === selectedPOId ? { ...p, status: 'Closed' as const } : p);
    setPos(updatedPOs);
    saveData(STORAGE_KEYS.POS, updatedPOs);

    const updatedGRNs = [...grns, newGRN];
    setGrns(updatedGRNs);
    saveData(STORAGE_KEYS.GRNS, updatedGRNs);

    // Audit Log
    const log: AuditLog = {
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'CREATE',
      entity: 'GRN',
      entityId: newGRN.id,
      newValue: `GRN# ${newGRN.grnNumber} for PO# ${pos.find(p => p.id === selectedPOId)?.poNumber}`
    };
    setAuditLogs(prev => {
      const updated = [log, ...prev];
      saveData(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });

    setIsModalOpen(false);
    setSelectedPOId('');
    setGrnItems([]);
    toast.success('GRN approved and inventory updated');
  };

  const handlePrint = (grn: GRN) => {
    setSelectedGRNForPrint(grn);
    setIsPrintOpen(true);
  };

  const filteredGRNs = useMemo(() => {
    return grns.filter(g => 
      g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.find(p => p.id === g.poId)?.poNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [grns, searchTerm, pos]);

  const columns = [
    { 
      header: 'GRN Number', 
      accessor: (item: GRN) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-primary-600"><ClipboardCheck size={14} /></div>
          <span className="font-mono font-bold text-slate-900">{item.grnNumber}</span>
        </div>
      ),
      sortable: true 
    },
    { header: 'PO Reference', accessor: (item: GRN) => pos.find(p => p.id === item.poId)?.poNumber || 'Unknown' },
    { header: 'Date', accessor: (item: GRN) => new Date(item.date).toLocaleDateString() },
    { header: 'Received By', accessor: 'receivedBy' as keyof GRN },
    { header: 'Status', accessor: (item: GRN) => (
      <span className="text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest bg-emerald-100 text-emerald-600">
        {item.status}
      </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Inventory / Goods Receipt Note (GRN)</h3>
        <button 
          onClick={() => { setSelectedPOId(''); setGrnItems([]); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary-700 transition-all shadow-sm"
        >
          <Plus size={16} />
          Raise New GRN
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search GRNs by number or PO..." 
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
          data={filteredGRNs} 
          columns={columns} 
          onRowClick={(item) => setViewingGRN(item)}
          actions={(item) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); handlePrint(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Printer size={14} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setViewingGRN(item); }}
                className="p-1.5 text-slate-400 hover:text-primary-600 transition-colors"
              >
                <Eye size={14} />
              </button>
            </div>
          )}
        />
      </div>

      {/* Create GRN Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Raise Goods Receipt Note" size="lg">
        <form onSubmit={handleCreateGRN} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">GRN Number</label>
              <input name="grnNumber" required defaultValue={`GRN-${Date.now().toString().slice(-6)}`} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Against Approved PO</label>
              <select 
                name="poId" 
                required 
                value={selectedPOId}
                onChange={(e) => handlePOChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-900 focus:border-primary-500 outline-none"
              >
                <option value="">Select Approved PO</option>
                {pos.filter(p => p.status === 'Approved').map(p => <option key={p.id} value={p.id}>{p.poNumber} ({p.totalAmount})</option>)}
              </select>
            </div>
          </div>

          {selectedPOId && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500">Line Item Verification</h4>
              <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-500">Item</th>
                      <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-500 w-20">Ordered</th>
                      <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-500 w-24">Received</th>
                      <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-500 w-24">Accepted</th>
                      <th className="px-4 py-2 text-[10px] font-mono uppercase text-slate-500 w-24 text-rose-600">Rejected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {grnItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white transition-colors">
                        <td className="px-4 py-2 text-sm text-slate-900 font-bold">
                          {inventory.find(s => s.id === item.skuId)?.name}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-500 font-mono">{item.orderedQty}</td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={item.receivedQty} 
                            onChange={(e) => updateGRNItem(idx, 'receivedQty', Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded text-sm text-slate-900 focus:border-primary-500 outline-none p-1 font-mono"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="number" 
                            value={item.acceptedQty} 
                            onChange={(e) => updateGRNItem(idx, 'acceptedQty', Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded text-sm text-slate-900 focus:border-primary-500 outline-none p-1 font-mono"
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-rose-600 font-mono font-bold">
                          {item.rejectedQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-8 py-2 bg-primary-600 text-white rounded font-bold text-xs hover:bg-primary-700 transition-colors uppercase tracking-widest shadow-sm">
              Approve & Update Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* View GRN Modal */}
      <Modal isOpen={!!viewingGRN} onClose={() => setViewingGRN(null)} title={`GRN Details: ${viewingGRN?.grnNumber}`} size="lg">
        {viewingGRN && (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-8">
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">PO Reference</p>
                <p className="text-sm font-bold text-slate-900">{pos.find(p => p.id === viewingGRN.poId)?.poNumber}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Received Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date(viewingGRN.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Received By</p>
                <p className="text-sm font-bold text-slate-900">{viewingGRN.receivedBy}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-500">Item</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-500">Ordered</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-500">Accepted</th>
                    <th className="px-4 py-3 text-[10px] font-mono uppercase text-slate-500 text-rose-600">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {viewingGRN.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-slate-900 font-bold">{inventory.find(s => s.id === item.skuId)?.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">{item.orderedQty}</td>
                      <td className="px-4 py-3 text-sm text-emerald-600 font-mono font-bold">{item.acceptedQty}</td>
                      <td className="px-4 py-3 text-sm text-rose-600 font-mono">{item.rejectedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setViewingGRN(null)} className="px-6 py-2 bg-slate-100 text-slate-700 rounded font-bold text-xs hover:bg-slate-200 transition-colors">Close</button>
              <button 
                onClick={() => handlePrint(viewingGRN)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 uppercase tracking-widest shadow-sm"
              >
                <Printer size={14} /> Print GRN
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Print Preview */}
      {isPrintOpen && selectedGRNForPrint && (
        <PrintDocument 
          title="Goods Receipt Note"
          documentNumber={selectedGRNForPrint.grnNumber}
          date={selectedGRNForPrint.date}
          status={selectedGRNForPrint.status}
          companyName="Nexus P2P"
          items={selectedGRNForPrint.items.map(item => ({
            skuId: item.skuId,
            name: inventory.find(s => s.id === item.skuId)?.name,
            quantity: item.orderedQty,
            received: item.receivedQty,
            accepted: item.acceptedQty,
            rejected: item.rejectedQty
          }))}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default GRNModule;
