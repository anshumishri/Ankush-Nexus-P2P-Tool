import { FeatureSettings, SKU, Vendor, PO, GRN, Invoice, AuditLog, WhistleblowerSubmission, User } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'nexus_p2p_settings',
  FEATURES: 'nexus_p2p_features',
  INVENTORY: 'nexus_p2p_inventory',
  VENDORS: 'nexus_p2p_vendors',
  POS: 'nexus_p2p_pos',
  GRNS: 'nexus_p2p_grns',
  INVOICES: 'nexus_p2p_invoices',
  AUDIT_LOGS: 'nexus_p2p_audit_logs',
  WHISTLEBLOWER: 'nexus_p2p_whistleblower',
  CURRENT_USER: 'nexus_p2p_current_user',
  COMPANY_NAME: 'nexus_p2p_company_name'
};

export const DEFAULT_FEATURES: FeatureSettings = {
  EOQ_PLANNING: true,
  REORDER_LEVELS: true,
  SAFETY_STOCK: true,
  LEAD_TIME_MONITORING: true,
  STOCK_RECONCILIATION: true,
  CYCLE_COUNTS: true,
  PO_DUPLICATE_CHECK: true,
  PURCHASE_AUTH_MATRIX: true,
  MAKER_CHECKER: true,
  COMPETITIVE_QUOTATIONS: true,
  RATE_CONTRACTS: true,
  PERIODIC_PO_REVIEW: true,
  GRN_WORKFLOW: true,
  QUALITY_INSPECTION: true,
  SEGREGATION_OF_DUTIES: true,
  REALTIME_INVENTORY_UPDATE: true,
  THREE_WAY_MATCH: true,
  ABNORMAL_QTY_ALERTS: true,
  VENDOR_ONBOARDING_KYC: true,
  APPROVED_VENDOR_MASTER: true,
  PERIODIC_VENDOR_REVIEW: true,
  VENDOR_ROTATION: true,
  CONFLICT_OF_INTEREST: true,
  AUDIT_TRAIL: true,
  WHISTLEBLOWER: true,
  INTERNAL_AUDIT_CHECKLIST: true,
};

export const STARTER_FEATURES: FeatureSettings = {
  ...Object.keys(DEFAULT_FEATURES).reduce((acc, key) => ({ ...acc, [key]: false }), {} as FeatureSettings),
  REORDER_LEVELS: true,
  GRN_WORKFLOW: true,
  THREE_WAY_MATCH: true,
  APPROVED_VENDOR_MASTER: true,
};

export const loadData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

export const saveData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const seedInitialData = () => {
  if (localStorage.getItem(STORAGE_KEYS.INVENTORY)) return;

  const initialInventory: SKU[] = [
    { id: 'SKU001', name: 'Industrial Motor A1', category: 'Motors', unit: 'Units', currentStock: 45, reorderLevel: 50, maxStock: 200, safetyStock: 10, avgDailyUsage: 5, leadTimeDays: 7, lastUpdated: new Date().toISOString() },
    { id: 'SKU002', name: 'Steel Bolts 10mm', category: 'Fasteners', unit: 'Box', currentStock: 120, reorderLevel: 100, maxStock: 500, safetyStock: 20, avgDailyUsage: 15, leadTimeDays: 3, lastUpdated: new Date().toISOString() },
    { id: 'SKU003', name: 'Hydraulic Fluid', category: 'Consumables', unit: 'Liters', currentStock: 80, reorderLevel: 60, maxStock: 300, safetyStock: 15, avgDailyUsage: 8, leadTimeDays: 5, lastUpdated: new Date().toISOString() },
    { id: 'SKU004', name: 'Pneumatic Valve V2', category: 'Pneumatics', unit: 'Units', currentStock: 12, reorderLevel: 15, maxStock: 50, safetyStock: 5, avgDailyUsage: 2, leadTimeDays: 10, lastUpdated: new Date().toISOString() },
    { id: 'SKU005', name: 'Copper Wiring 2.5mm', category: 'Electrical', unit: 'Rolls', currentStock: 25, reorderLevel: 20, maxStock: 100, safetyStock: 10, avgDailyUsage: 4, leadTimeDays: 4, lastUpdated: new Date().toISOString() },
  ];

  const initialVendors: Vendor[] = [
    { id: 'V001', name: 'Global Tech Solutions', gstin: '27AAAAA0000A1Z5', pan: 'AAAAA0000A', address: '123 Tech Park, MIDC, Mumbai, MH 400001', contact: 'John Doe (+91 9876543210)', bankDetails: 'HDFC Bank - 000123456789', kycStatus: 'Verified', status: 'Active' },
    { id: 'V002', name: 'Reliable Fasteners Ltd', gstin: '27BBBBB0000B1Z5', pan: 'BBBBB0000B', address: '45 Fastener Lane, Bhosari, Pune, MH 411026', contact: 'Jane Smith (+91 9123456789)', bankDetails: 'ICICI Bank - 999888777666', kycStatus: 'Verified', status: 'Active' },
    { id: 'V003', name: 'Apex Industrial Oils', gstin: '27CCCCC0000C1Z5', pan: 'CCCCC0000C', address: 'Plot 88, GIDC, Vapi, GJ 396191', contact: 'Rajesh Kumar (+91 8887776665)', bankDetails: 'SBI - 111222333444', kycStatus: 'Pending', status: 'Active' },
  ];

  const initialPOs: PO[] = [
    {
      id: 'PO001',
      poNumber: 'PO-2024-001',
      vendorId: 'V001',
      items: [
        { skuId: 'SKU001', name: 'Industrial Motor A1', qty: 10, unit: 'Units', rate: 15000, taxPercent: 18, total: 150000 }
      ],
      totalAmount: 150000,
      status: 'Approved',
      date: new Date(Date.now() - 86400000 * 5).toISOString(),
      deliveryDate: new Date(Date.now() + 86400000 * 5).toISOString(),
      shippingAddress: 'Main Warehouse, Mumbai',
      terms: 'Net 30',
      createdBy: 'U001'
    },
    {
      id: 'PO002',
      poNumber: 'PO-2024-002',
      vendorId: 'V002',
      items: [
        { skuId: 'SKU002', name: 'Steel Bolts 10mm', qty: 50, unit: 'Box', rate: 450, taxPercent: 18, total: 22500 }
      ],
      totalAmount: 22500,
      status: 'Submitted',
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      deliveryDate: new Date(Date.now() + 86400000 * 8).toISOString(),
      shippingAddress: 'Main Warehouse, Mumbai',
      terms: 'Net 30',
      createdBy: 'U001'
    }
  ];

  const initialGRNs: GRN[] = [
    {
      id: 'GRN001',
      grnNumber: 'GRN-2024-001',
      poId: 'PO001',
      items: [
        { skuId: 'SKU001', orderedQty: 10, receivedQty: 10, acceptedQty: 10, rejectedQty: 0 }
      ],
      receivedBy: 'Warehouse Team',
      date: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: 'Approved'
    }
  ];

  const initialInvoices: Invoice[] = [
    {
      id: 'INV001',
      invoiceNumber: 'INV-9988',
      poId: 'PO001',
      grnId: 'GRN001',
      items: [
        { skuId: 'SKU001', name: 'Industrial Motor A1', qty: 10, rate: 15000, total: 150000 }
      ],
      totalAmount: 150000,
      matchStatus: 'Match',
      status: 'Paid',
      date: new Date(Date.now() - 86400000 * 1).toISOString(),
      vendorId: 'V001'
    }
  ];

  const initialAuditLogs: AuditLog[] = [
    { id: 'LOG001', timestamp: new Date(Date.now() - 3600000 * 10).toISOString(), userId: 'U001', userName: 'Admin User', action: 'CREATE', entity: 'PO', entityId: 'PO001', newValue: 'Created PO-2024-001' },
    { id: 'LOG002', timestamp: new Date(Date.now() - 3600000 * 8).toISOString(), userId: 'U001', userName: 'Admin User', action: 'APPROVE', entity: 'PO', entityId: 'PO001', newValue: 'Approved PO-2024-001' },
    { id: 'LOG003', timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), userId: 'U001', userName: 'Admin User', action: 'CREATE', entity: 'GRN', entityId: 'GRN001', newValue: 'Received items for PO-2024-001' },
  ];

  saveData(STORAGE_KEYS.INVENTORY, initialInventory);
  saveData(STORAGE_KEYS.VENDORS, initialVendors);
  saveData(STORAGE_KEYS.POS, initialPOs);
  saveData(STORAGE_KEYS.GRNS, initialGRNs);
  saveData(STORAGE_KEYS.INVOICES, initialInvoices);
  saveData(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  saveData(STORAGE_KEYS.FEATURES, DEFAULT_FEATURES);
  saveData(STORAGE_KEYS.COMPANY_NAME, 'Nexus P2P');
};

export { STORAGE_KEYS };
