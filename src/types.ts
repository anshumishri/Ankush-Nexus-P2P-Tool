export type Role = 'Admin' | 'Procurement Officer' | 'Finance Manager' | 'Warehouse Staff' | 'Auditor' | 'Director';

export interface User {
  id: string;
  name: string;
  role: Role;
}

export interface FeatureSettings {
  EOQ_PLANNING: boolean;
  REORDER_LEVELS: boolean;
  SAFETY_STOCK: boolean;
  LEAD_TIME_MONITORING: boolean;
  STOCK_RECONCILIATION: boolean;
  CYCLE_COUNTS: boolean;
  PO_DUPLICATE_CHECK: boolean;
  PURCHASE_AUTH_MATRIX: boolean;
  MAKER_CHECKER: boolean;
  COMPETITIVE_QUOTATIONS: boolean;
  RATE_CONTRACTS: boolean;
  PERIODIC_PO_REVIEW: boolean;
  GRN_WORKFLOW: boolean;
  QUALITY_INSPECTION: boolean;
  SEGREGATION_OF_DUTIES: boolean;
  REALTIME_INVENTORY_UPDATE: boolean;
  THREE_WAY_MATCH: boolean;
  ABNORMAL_QTY_ALERTS: boolean;
  VENDOR_ONBOARDING_KYC: boolean;
  APPROVED_VENDOR_MASTER: boolean;
  PERIODIC_VENDOR_REVIEW: boolean;
  VENDOR_ROTATION: boolean;
  CONFLICT_OF_INTEREST: boolean;
  AUDIT_TRAIL: boolean;
  WHISTLEBLOWER: boolean;
  INTERNAL_AUDIT_CHECKLIST: boolean;
}

export interface SKU {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  safetyStock: number;
  avgDailyUsage: number;
  leadTimeDays: number;
  annualDemand?: number;
  orderingCost?: number;
  holdingCostPerUnit?: number;
  lastUpdated: string;
}

export interface Vendor {
  id: string;
  name: string;
  gstin: string;
  pan: string;
  address: string;
  contact: string;
  bankDetails: string;
  kycStatus: 'Pending' | 'Verified' | 'Rejected';
  status: 'Active' | 'Inactive' | 'Blacklisted';
  lastReviewDate?: string;
}

export interface POItem {
  skuId: string;
  name: string;
  qty: number;
  unit: string;
  rate: number;
  taxPercent: number;
  total: number;
}

export interface PO {
  id: string;
  poNumber: string;
  date: string;
  vendorId: string;
  items: POItem[];
  deliveryDate: string;
  shippingAddress: string;
  terms: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Closed';
  createdBy: string;
  approvedBy?: string;
  notes?: string;
  totalAmount: number;
}

export interface GRNItem {
  skuId: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectionReason?: string;
}

export interface GRN {
  id: string;
  grnNumber: string;
  poId: string;
  date: string;
  receivedBy: string;
  items: GRNItem[];
  status: 'Draft' | 'Approved';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  date: string;
  poId: string;
  grnId: string;
  items: any[];
  totalAmount: number;
  status: 'Pending' | 'Approved' | 'Paid';
  matchStatus: 'Match' | 'Partial' | 'Mismatch';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
}

export interface WhistleblowerSubmission {
  id: string;
  timestamp: string;
  category: string;
  description: string;
  referenceId: string;
}
