export type UserRole = 'owner' | 'manager' | 'biller';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  branchName: string;
  phone: string;
  avatar?: string;
  active: boolean;
  totalSales: number;
  billsCount: number;
  joinedDate: string;
  pin?: string;
}

export interface StoreBranch {
  id: string;
  name: string;
  location: string;
  managerId: string;
  managerName: string;
  contactPhone: string;
  taxRate: number; // e.g. 5, 8, 12, 18
  currency: string;
  active: boolean;
  gstin?: string;
  city?: string;
  state?: string;
  upiId?: string;
}

export interface Product {
  id: string;
  name: string;
  nameTamil?: string;
  category: string;
  categoryTamil?: string;
  barcode: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  unit: 'kg' | 'pcs' | 'pack' | 'ltr' | 'box' | 'bunch' | 'dozen';
  imageEmoji: string;
  branchId: string;
  sku: string;
  description?: string;
  isProduce?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
  taxPercent: number;
  customPrice?: number;
  unitWeightKg?: number;
  finalPrice?: number;
}

export type PaymentMode = 'cash' | 'card' | 'upi' | 'wallet';

export interface Bill {
  id: string;
  invoiceNumber: string;
  billerId: string;
  billerName: string;
  branchId: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  subtotal: number;
  taxAmount: number;
  taxPercent: number;
  discountAmount: number;
  discountPercent: number;
  total: number;
  paymentMode: PaymentMode;
  paymentRef?: string;
  timestamp: string;
  status: 'completed' | 'refunded';
  notes?: string;
}

export interface StockRequest {
  id: string;
  branchId: string;
  branchName: string;
  billerId: string;
  billerName: string;
  productId: string;
  productName: string;
  requestedQty: number;
  currentStock: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  managerNote?: string;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  type: 'sale' | 'restock' | 'adjustment' | 'return';
  quantityChange: number;
  staffName: string;
  timestamp: string;
  reason: string;
}

export interface CustomerFeedback {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  rating: number; // 1 - 5
  comments: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  tags: string[];
  timestamp: string;
  branchId: string;
  branchName: string;
  status: 'new' | 'reviewed' | 'followup_needed';
  managerNotes?: string;
}

export interface MonthlyFinancial {
  month: string;
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
}

export interface InvestmentData {
  capitalInvestment: number;
  monthlyRent: number;
  staffSalaries: number;
  electricityUtilities: number;
  marketingExpenses: number;
  otherFixedCosts: number;
  targetProfitMargin: number;
  monthlyStaffSalaries?: number;
  monthlyUtilities?: number;
  monthlyMarketing?: number;
  monthlyMiscellaneous?: number;
  history: MonthlyFinancial[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  roleContext: UserRole;
  actions?: {
    label: string;
    type: 'add_to_cart' | 'navigate' | 'filter' | 'refresh';
    payload?: any;
  }[];
  isSimulated?: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  timestamp: string;
  read: boolean;
  targetRole?: UserRole | 'all';
  productId?: string;
  productName?: string;
  currentStock?: number;
  threshold?: number;
  unit?: string;
  branchId?: string;
  branchName?: string;
  category?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface LowStockAlertEvent {
  product: Product;
  currentStock: number;
  threshold: number;
  isOutOfStock: boolean;
  branchName: string;
  timestamp: string;
}

export interface Base44Config {
  appId: string;
  token?: string;
  environment: 'production' | 'development' | 'demo_mode';
  autoSync: boolean;
  syncProducts: boolean;
  syncBills: boolean;
  syncAlerts: boolean;
  syncFeedback: boolean;
  lastSyncedAt?: string;
  endpointUrl?: string;
}

export interface Base44SyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  itemsPending: number;
  entitiesCount: {
    bills: number;
    products: number;
    lowStockAlerts: number;
    feedback: number;
  };
  lastError: string | null;
}

