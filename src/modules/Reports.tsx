import React, { useState, useMemo } from 'react';
import { BarChart3, Download, Filter, FileText, Package, ShoppingCart, ClipboardCheck, Users, ShieldCheck, Search } from 'lucide-react';
import { SKU, PO, GRN, Invoice, Vendor, AuditLog, FeatureSettings } from '../types';
import { Table } from '../components/Table';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from '../components/Toast';

interface ReportsProps {
  inventory: SKU[];
  pos: PO[];
  grns: GRN[];
  invoices: Invoice[];
  vendors: Vendor[];
  auditLogs: AuditLog[];
  features: FeatureSettings;
}

const Reports: React.FC<ReportsProps> = ({ inventory, pos, grns, invoices, vendors, auditLogs, features }) => {
  const [activeReport, setActiveReport] = useState<string>('inventory');
  const [searchTerm, setSearchTerm] = useState('');

  const reportTypes = [
    { id: 'inventory', label: 'Inventory Status', icon: Package, description: 'Current stock levels, ROP, and valuation' },
    { id: 'pos', label: 'PO Summary', icon: ShoppingCart, description: 'Purchase order tracking and status' },
    { id: 'grn', label: 'GRN Report', icon: ClipboardCheck, description: 'Goods receipt and verification history' },
    { id: 'invoices', label: '3-Way Match', icon: FileText, description: 'Invoice matching and payment status' },
    { id: 'vendors', label: 'Vendor Performance', icon: Users, description: 'KYC status and delivery performance' },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, description: 'Full system activity and compliance log' },
  ];

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
      ).join(',')
    ).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`${filename} exported successfully`);
  };

  const currentData = useMemo(() => {
    switch (activeReport) {
      case 'inventory': return inventory;
      case 'pos': return pos;
      case 'grn': return grns;
      case 'invoices': return invoices;
      case 'vendors': return vendors;
      case 'audit': return auditLogs;
      default: return [];
    }
  }, [activeReport, inventory, pos, grns, invoices, vendors, auditLogs]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return currentData;
    return currentData.filter((item: any) => 
      JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [currentData, searchTerm]);

  const renderReport = () => {
    switch (activeReport) {
      case 'inventory':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'SKU ID', accessor: 'id' },
              { header: 'Name', accessor: 'name' },
              { header: 'Stock', accessor: (item: SKU) => `${item.currentStock} ${item.unit}` },
              { header: 'ROP', accessor: 'reorderLevel' as keyof SKU },
              { header: 'Status', accessor: (item: SKU) => (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                  item.currentStock <= item.reorderLevel ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                )}>
                  {item.currentStock <= item.reorderLevel ? 'Reorder' : 'Healthy'}
                </span>
              )}
            ]} 
          />
        );
      case 'pos':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'PO#', accessor: 'poNumber' as keyof PO },
              { header: 'Vendor', accessor: (item: PO) => vendors.find(v => v.id === item.vendorId)?.name || 'Unknown' },
              { header: 'Amount', accessor: (item: PO) => formatCurrency(item.totalAmount) },
              { header: 'Status', accessor: (item: PO) => (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                  item.status === 'Approved' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                )}>
                  {item.status}
                </span>
              )},
              { header: 'Date', accessor: (item: PO) => new Date(item.date).toLocaleDateString() }
            ]} 
          />
        );
      case 'grn':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'GRN#', accessor: 'grnNumber' as keyof GRN },
              { header: 'PO Ref', accessor: (item: GRN) => pos.find(p => p.id === item.poId)?.poNumber || 'Unknown' },
              { header: 'Received By', accessor: 'receivedBy' as keyof GRN },
              { header: 'Date', accessor: (item: GRN) => new Date(item.date).toLocaleDateString() }
            ]} 
          />
        );
      case 'invoices':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'Invoice#', accessor: 'invoiceNumber' as keyof Invoice },
              { header: 'Match Status', accessor: (item: Invoice) => (
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest",
                  item.matchStatus === 'Match' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {item.matchStatus}
                </span>
              )},
              { header: 'Amount', accessor: (item: Invoice) => formatCurrency(item.totalAmount) },
              { header: 'Status', accessor: 'status' as keyof Invoice }
            ]} 
          />
        );
      case 'vendors':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'Vendor', accessor: 'name' as keyof Vendor },
              { header: 'KYC', accessor: 'kycStatus' as keyof Vendor },
              { header: 'Status', accessor: 'status' as keyof Vendor },
              { header: 'Last Review', accessor: (item: Vendor) => item.lastReviewDate ? new Date(item.lastReviewDate).toLocaleDateString() : 'N/A' }
            ]} 
          />
        );
      case 'audit':
        return (
          <Table 
            data={filteredData} 
            columns={[
              { header: 'Timestamp', accessor: (item: AuditLog) => new Date(item.timestamp).toLocaleString() },
              { header: 'User', accessor: 'userName' as keyof AuditLog },
              { header: 'Action', accessor: 'action' as keyof AuditLog },
              { header: 'Entity', accessor: 'entity' as keyof AuditLog },
              { header: 'Details', accessor: 'newValue' as keyof AuditLog }
            ]} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono uppercase tracking-widest text-slate-500">Reports & Analytics Engine</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportToCSV(currentData, activeReport)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-all uppercase tracking-widest shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-3">
          {reportTypes.map(report => (
            <button
              key={report.id}
              onClick={() => { setActiveReport(report.id); setSearchTerm(''); }}
              className={cn(
                "w-full flex flex-col gap-1 p-4 rounded-xl border transition-all text-left group",
                activeReport === report.id 
                  ? "bg-primary-50 border-primary-500 text-primary-600 shadow-sm" 
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <report.icon size={18} className={cn(activeReport === report.id ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="text-xs font-bold uppercase tracking-widest">{report.label}</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-7 leading-tight">{report.description}</p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
              <div>
                <h4 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-1">
                  {reportTypes.find(r => r.id === activeReport)?.label}
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Showing {filteredData.length} records</p>
              </div>
              <div className="w-full md:w-64 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter report data..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-900 focus:border-primary-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              {renderReport()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
