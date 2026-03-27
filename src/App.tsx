import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Splash from './components/Splash';
import { ToastContainer, toast } from './components/Toast';
import { 
  STORAGE_KEYS, 
  loadData, 
  saveData, 
  seedInitialData, 
  DEFAULT_FEATURES 
} from './lib/storage';
import { 
  FeatureSettings, 
  User, 
  SKU, 
  Vendor, 
  PO, 
  GRN, 
  Invoice, 
  AuditLog 
} from './types';

// Module Components (to be implemented)
import Dashboard from './modules/Dashboard';
import Inventory from './modules/Inventory';
import PurchaseOrders from './modules/PurchaseOrders';
import GRNModule from './modules/GRN';
import Invoices from './modules/Invoices';
import Vendors from './modules/Vendors';
import Approvals from './modules/Approvals';
import Reports from './modules/Reports';
import Audit from './modules/Audit';
import Settings from './modules/Settings';

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [companyName, setCompanyName] = useState('');
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURES);
  const [currentUser, setCurrentUser] = useState<User>({ id: 'U001', name: 'Admin User', role: 'Admin' });
  
  // Data State
  const [inventory, setInventory] = useState<SKU[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pos, setPos] = useState<PO[]>([]);
  const [grns, setGrns] = useState<GRN[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const storedCompanyName = localStorage.getItem(STORAGE_KEYS.COMPANY_NAME);
    if (storedCompanyName) {
      seedInitialData();
      setCompanyName(storedCompanyName);
      setFeatures(loadData(STORAGE_KEYS.FEATURES, DEFAULT_FEATURES));
      setCurrentUser(loadData(STORAGE_KEYS.CURRENT_USER, { id: 'U001', name: 'Admin User', role: 'Admin' }));
      
      setInventory(loadData(STORAGE_KEYS.INVENTORY, []));
      setVendors(loadData(STORAGE_KEYS.VENDORS, []));
      setPos(loadData(STORAGE_KEYS.POS, []));
      setGrns(loadData(STORAGE_KEYS.GRNS, []));
      setInvoices(loadData(STORAGE_KEYS.INVOICES, []));
      setAuditLogs(loadData(STORAGE_KEYS.AUDIT_LOGS, []));
      
      setIsInitialized(true);
    }
  }, []);

  const handleSplashComplete = (name: string, selectedFeatures: FeatureSettings) => {
    seedInitialData();
    setCompanyName(name);
    setFeatures(selectedFeatures);
    saveData(STORAGE_KEYS.COMPANY_NAME, name);
    saveData(STORAGE_KEYS.FEATURES, selectedFeatures);
    
    // Reload data after seeding
    setInventory(loadData(STORAGE_KEYS.INVENTORY, []));
    setVendors(loadData(STORAGE_KEYS.VENDORS, []));
    
    setIsInitialized(true);
    toast.success('System initialized successfully');
  };

  const pendingCounts = {
    pos: pos.filter(p => p.status === 'Submitted' || p.status === 'Under Review').length,
    grn: pos.filter(p => p.status === 'Approved').length, // POs ready for GRN
    invoices: grns.filter(g => g.status === 'Approved').length, // GRNs ready for Invoice
    approvals: pos.filter(p => p.status === 'Submitted').length + 
               vendors.filter(v => v.kycStatus === 'Pending').length
  };

  if (!isInitialized) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  const renderModule = () => {
    const props = { 
      features, 
      currentUser, 
      inventory, setInventory,
      vendors, setVendors,
      pos, setPos,
      grns, setGrns,
      invoices, setInvoices,
      auditLogs, setAuditLogs
    };

    switch (activeModule) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'inventory': return <Inventory {...props} />;
      case 'pos': return <PurchaseOrders {...props} />;
      case 'grn': return <GRNModule {...props} />;
      case 'invoices': return <Invoices {...props} />;
      case 'vendors': return <Vendors {...props} />;
      case 'approvals': return <Approvals {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'audit': return <Audit {...props} />;
      case 'settings': return <Settings {...props} setFeatures={setFeatures} setCompanyName={setCompanyName} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <>
      <Layout 
        activeModule={activeModule} 
        setActiveModule={setActiveModule}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        companyName={companyName}
        pendingCounts={pendingCounts}
      >
        {renderModule()}
      </Layout>
      <ToastContainer />
    </>
  );
}
