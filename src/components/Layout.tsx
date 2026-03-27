import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  ClipboardCheck, 
  FileText, 
  Users, 
  CheckSquare, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';
import { Role, User } from '../types';
import { STORAGE_KEYS, loadData, saveData } from '../lib/storage';
import { cn } from '../lib/utils';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative",
      active 
        ? "bg-primary-50 text-primary-600 border-r-2 border-primary-600" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    )}
  >
    <Icon size={20} />
    <span>{label}</span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute right-4 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

interface LayoutProps {
  children: React.ReactNode;
  activeModule: string;
  setActiveModule: (module: string) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  companyName: string;
  pendingCounts: Record<string, number>;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeModule, 
  setActiveModule, 
  currentUser, 
  setCurrentUser,
  companyName,
  pendingCounts
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const roles: Role[] = ['Admin', 'Procurement Officer', 'Finance Manager', 'Warehouse Staff', 'Auditor', 'Director'];

  const handleRoleChange = (role: Role) => {
    const newUser = { ...currentUser, role };
    setCurrentUser(newUser);
    saveData(STORAGE_KEYS.CURRENT_USER, newUser);
    window.location.reload(); // Refresh to apply role-based visibility
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'pos', label: 'Purchase Orders', icon: ShoppingCart, badge: pendingCounts.pos },
    { id: 'grn', label: 'Goods Receipt', icon: ClipboardCheck, badge: pendingCounts.grn },
    { id: 'invoices', label: 'Invoices & 3-Way', icon: FileText, badge: pendingCounts.invoices },
    { id: 'vendors', label: 'Vendors', icon: Users },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, badge: pendingCounts.approvals },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit & Compliance', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between border-b border-slate-200">
          {isSidebarOpen ? (
            <h1 className="text-xl font-bold text-primary-600 tracking-tighter uppercase italic">Nexus P2P</h1>
          ) : (
            <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold">N</div>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-slate-600">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">
          {menuItems.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={isSidebarOpen ? item.label : ''}
              active={activeModule === item.id}
              onClick={() => setActiveModule(item.id)}
              badge={item.badge}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className={cn("flex items-center gap-3 mb-4", !isSidebarOpen && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <UserIcon size={16} />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                <select 
                  value={currentUser.role}
                  onChange={(e) => handleRoleChange(e.target.value as Role)}
                  className="text-[10px] bg-transparent text-primary-600 border-none p-0 focus:ring-0 cursor-pointer"
                >
                  {roles.map(r => <option key={r} value={r} className="bg-white text-slate-900">{r}</option>)}
                </select>
              </div>
            )}
          </div>
          <button className={cn("w-full flex items-center gap-3 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded transition-colors", !isSidebarOpen && "justify-center")}>
            <LogOut size={16} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-mono text-slate-500 uppercase tracking-widest">
              {menuItems.find(m => m.id === activeModule)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{companyName}</p>
              <p className="text-[10px] text-slate-400 font-mono">FY 2025-26</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
