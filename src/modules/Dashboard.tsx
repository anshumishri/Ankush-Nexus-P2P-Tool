import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  ShoppingCart, 
  ClipboardCheck, 
  FileWarning, 
  Plus,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { SKU, PO, GRN, Invoice, AuditLog } from '../types';
import { formatCurrency } from '../lib/utils';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, icon: Icon, color, trend }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
    <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110", color)} />
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {trend && <p className="text-[10px] text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight size={12} /> {trend}</p>}
      </div>
      <div className={cn("p-3 rounded-lg", color.replace('bg-', 'bg-opacity-10 text-'))}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

import { cn } from '../lib/utils';

interface DashboardProps {
  inventory: SKU[];
  pos: PO[];
  grns: GRN[];
  invoices: Invoice[];
  auditLogs: AuditLog[];
}

const Dashboard: React.FC<DashboardProps> = ({ inventory, pos, grns, invoices, auditLogs }) => {
  const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderLevel);
  const openPOs = pos.filter(p => p.status !== 'Closed' && p.status !== 'Rejected');
  const pendingGRNs = pos.filter(p => p.status === 'Approved');
  const flaggedInvoices = invoices.filter(i => i.matchStatus === 'Mismatch');

  return (
    <div className="space-y-8">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard label="Total SKUs" value={inventory.length} icon={Package} color="bg-blue-600" />
        <KPICard label="Low Stock" value={lowStockItems.length} icon={AlertTriangle} color="bg-orange-500" />
        <KPICard label="Open POs" value={openPOs.length} icon={ShoppingCart} color="bg-indigo-600" />
        <KPICard label="GRN Pending" value={pendingGRNs.length} icon={ClipboardCheck} color="bg-emerald-600" />
        <KPICard label="Flagged Inv" value={flaggedInvoices.length} icon={FileWarning} color="bg-rose-600" />
        <KPICard label="Total Value" value={formatCurrency(inventory.reduce((acc, item) => acc + (item.currentStock * 1000), 0))} icon={Plus} color="bg-slate-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reorder Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Reorder Alerts</h3>
            <button className="text-[10px] text-primary-600 hover:underline">View All</button>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-3 text-[10px] font-mono uppercase text-slate-400">Item</th>
                  <th className="px-6 py-3 text-[10px] font-mono uppercase text-slate-400">Stock</th>
                  <th className="px-6 py-3 text-[10px] font-mono uppercase text-slate-400">ROP</th>
                  <th className="px-6 py-3 text-[10px] font-mono uppercase text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lowStockItems.slice(0, 5).map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-mono">{item.currentStock} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-mono">{item.reorderLevel}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                        item.currentStock <= item.safetyStock ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
                      )}>
                        {item.currentStock <= item.safetyStock ? 'Critical' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm italic">All stock levels healthy</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Recent Activity</h3>
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
            {auditLogs.slice(0, 6).map(log => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                    <Clock size={14} />
                  </div>
                  <div className="w-px h-full bg-slate-100 mt-2" />
                </div>
                <div className="pb-6">
                  <p className="text-xs text-slate-700">
                    <span className="font-bold text-primary-600">{log.userName}</span> {log.action} {log.entity}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-center text-slate-500 text-sm italic py-8">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
