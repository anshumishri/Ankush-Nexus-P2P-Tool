import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown, Filter, Download } from 'lucide-react';
import { cn } from '../lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
}

export function Table<T extends { id: string }>({ 
  data, 
  columns, 
  searchPlaceholder = "Search...", 
  onRowClick,
  actions
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = data.filter(item => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const exportToCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = sortedData.map(item => {
      return columns.map(c => {
        const val = typeof c.accessor === 'function' ? c.accessor(item) : item[c.accessor];
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    }).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportToCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <Download size={14} />
            Export CSV
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {columns.map((col, idx) => (
                  <th 
                    key={idx}
                    className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-500"
                  >
                    <div className="flex items-center gap-2">
                      {col.header}
                      {col.sortable && typeof col.accessor !== 'function' && (
                        <button onClick={() => handleSort(col.accessor as keyof T)} className="hover:text-primary-600 transition-colors">
                          {sortConfig.key === col.accessor ? (
                            sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                          ) : (
                            <ChevronUp size={12} className="opacity-30" />
                          )}
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                {actions && <th className="px-6 py-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedData.map((item, rowIdx) => (
                <tr 
                  key={item.id} 
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    "hover:bg-slate-50 transition-colors group",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-slate-700 font-medium">
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">
                      {actions(item)}
                    </td>
                  )}
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
