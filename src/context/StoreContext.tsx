import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  StoreBranch,
  Product,
  Bill,
  CartItem,
  StockRequest,
  StockLog,
  CustomerFeedback,
  InvestmentData,
  NotificationItem,
  LowStockAlertEvent,
  Base44Config,
  Base44SyncStatus,
} from '../types';
import { base44Service } from '../services/base44Client';
import {
  INITIAL_BRANCHES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_BILLS,
  INITIAL_STOCK_REQUESTS,
  INITIAL_STOCK_LOGS,
  INITIAL_FEEDBACK,
  INITIAL_INVESTMENT_DATA,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import { formatINR, CURRENCY_SYMBOL } from '../utils/currency';
import { playStockAlertSound, playCriticalStockAlertSound } from '../utils/stockAlerts';

interface StoreContextType {
  currentUser: User;
  currentBranch: StoreBranch;
  allBranches: StoreBranch[];
  branches: StoreBranch[];
  users: User[];
  products: Product[];
  bills: Bill[];
  stockRequests: StockRequest[];
  stockLogs: StockLog[];
  feedbacks: CustomerFeedback[];
  customerFeedbacks: CustomerFeedback[];
  investmentData: InvestmentData;
  notifications: NotificationItem[];
  theme: 'dark' | 'light';
  language: 'en' | 'ta';
  currencySymbol: string;
  cart: CartItem[];
  isAiDrawerOpen: boolean;
  setIsAiDrawerOpen: (open: boolean) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: 'en' | 'ta') => void;
  formatCurrency: (amount: number | undefined | null, showDecimals?: boolean) => string;

  // Automated Low-Stock Notification System
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  allBranchesLowStockProducts: Product[];
  activeStockToast: LowStockAlertEvent | null;
  dismissStockToast: () => void;
  soundEnabled: boolean;
  toggleStockSound: () => void;
  updateProductThreshold: (productId: string, newThreshold: number) => void;
  quickRestock: (productId: string, quantity: number, reason?: string) => void;
  dismissProductAlert: (productId: string) => void;
  triggerStockAlertSim: (productId?: string) => void;
  
  // Navigation & Role
  setCurrentUser: (user: User) => void;
  setCurrentBranch: (branch: StoreBranch) => void;
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  toggleTheme: () => void;

  // Cart Operations
  addToCart: (product: Product, quantity?: number, customPrice?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, qty: number) => void;
  updateCartDiscount: (productId: string, discountPercent: number) => void;
  clearCart: () => void;

  // Bill Operations
  createBill: (billData: {
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    paymentMode: Bill['paymentMode'];
    discountPercent?: number;
    notes?: string;
  }) => Bill;

  // Product Operations
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, qtyChange: number, reason: string) => void;
  updateProductStock: (productId: string, qtyChange: number, type?: string, reason?: string) => void;

  // Stock Request Operations
  requestStock: (req: {
    productId: string;
    requestedQty: number;
    reason: string;
  }) => void;
  approveStockRequest: (id: string, note?: string) => void;
  rejectStockRequest: (id: string, note?: string) => void;

  // Feedback Operations
  submitFeedback: (fb: {
    invoiceId: string;
    customerName: string;
    customerPhone: string;
    rating: number;
    comments: string;
    tags?: string[];
  }) => void;
  updateFeedbackStatus: (id: string, status: CustomerFeedback['status'], managerNotes?: string) => void;

  // Investment Operations
  updateInvestmentData: (data: Partial<InvestmentData>) => void;

  // Staff Management
  addStaff: (user: Omit<User, 'id' | 'totalSales' | 'billsCount' | 'joinedDate'>) => void;
  addUser: (user: User) => void;
  updateStaff: (user: User) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  deleteStaff: (id: string) => void;

  // Notification Operations
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Base44 Cloud Integration
  base44Config: Base44Config;
  base44Status: Base44SyncStatus;
  updateBase44Config: (cfg: Partial<Base44Config>) => void;
  triggerBase44Sync: () => Promise<{ success: boolean; syncedCounts: any; message: string }>;
  runBase44AgentWorkflow: (prompt: string, context?: any) => Promise<any>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'bg_ai_tn_user_v3',
  BRANCH: 'bg_ai_tn_branch_v3',
  BRANCHES: 'bg_ai_tn_branches_v3',
  USERS: 'bg_ai_tn_users_v3',
  PRODUCTS: 'bg_ai_tn_products_v3',
  BILLS: 'bg_ai_tn_bills_v3',
  REQUESTS: 'bg_ai_tn_requests_v3',
  LOGS: 'bg_ai_tn_logs_v3',
  FEEDBACK: 'bg_ai_tn_feedback_v3',
  INVESTMENT: 'bg_ai_tn_investment_v3',
  NOTIFS: 'bg_ai_tn_notifs_v3',
  THEME: 'bg_ai_theme',
  LANG: 'bg_ai_tn_lang',
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === 'dark' ? 'dark' : 'light';
  });

  // Language state (English / Tamil)
  const [language, setLanguageState] = useState<'en' | 'ta'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'ta' ? 'ta' : 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANG, language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const toggleLanguage = () => setLanguageState(prev => (prev === 'en' ? 'ta' : 'en'));
  const setLanguage = (lang: 'en' | 'ta') => setLanguageState(lang);
  const formatCurrency = (amount: number | undefined | null, showDecimals: boolean = true) => formatINR(amount, showDecimals);

  // Core Data
  const [allBranches] = useState<StoreBranch[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
  });

  const [currentBranch, setCurrentBranch] = useState<StoreBranch>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANCH);
    return saved ? JSON.parse(saved) : INITIAL_BRANCHES[0];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Default to Owner for full overview
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
    return saved ? JSON.parse(saved) : INITIAL_BILLS;
  });

  const [stockRequests, setStockRequests] = useState<StockRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_REQUESTS;
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_STOCK_LOGS;
  });

  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    return saved ? JSON.parse(saved) : INITIAL_FEEDBACK;
  });

  const [investmentData, setInvestmentData] = useState<InvestmentData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENT);
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENT_DATA;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  // Automated Low-Stock Notification & Audio Chime Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bg_ai_stock_sound_v1');
    return saved !== null ? saved === 'true' : true;
  });

  const [activeStockToast, setActiveStockToast] = useState<LowStockAlertEvent | null>(null);

  const toggleStockSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('bg_ai_stock_sound_v1', String(next));
      return next;
    });
  };

  const dismissStockToast = () => {
    setActiveStockToast(null);
  };

  // Active Cart State (persisted per biller session)
  const [cart, setCart] = useState<CartItem[]>([]);

  // AI Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Base44 Cloud Integration State
  const [base44Config, setBase44Config] = useState<Base44Config>(() => base44Service.getConfig());
  const [base44Status, setBase44Status] = useState<Base44SyncStatus>(() => base44Service.getStatus());

  useEffect(() => {
    const unsubscribe = base44Service.subscribe(status => {
      setBase44Status(status);
    });
    return unsubscribe;
  }, []);

  const updateBase44Config = (cfg: Partial<Base44Config>) => {
    const updated = base44Service.saveConfig(cfg);
    setBase44Config(updated);
  };

  const triggerBase44Sync = async () => {
    return await base44Service.syncAll({
      bills,
      products,
      feedback: feedbacks,
      alertsCount: lowStockProducts.length,
    });
  };

  const runBase44AgentWorkflow = async (prompt: string, context?: any) => {
    const totalRev = bills.reduce((sum, b) => sum + b.total, 0);
    return await base44Service.runBase44AgentWorkflow(prompt, {
      totalRevenue: totalRev,
      lowStockCount: lowStockProducts.length,
      branchName: currentBranch.name,
      ...context,
    });
  };

  // Automated inventory threshold sync to ensure notifications reflect real inventory levels
  useEffect(() => {
    setNotifications(prev => {
      let updated = [...prev];
      let hasChanges = false;

      products.forEach(p => {
        const isCurrentBranch = !p.branchId || p.branchId === currentBranch.id;
        if (!isCurrentBranch) return;

        const isLow = p.stock <= p.minStockAlert;
        const isCritical = p.stock <= 0;
        const existingIdx = updated.findIndex(n => n.productId === p.id && !n.read);

        if (isLow) {
          const expectedTitle = isCritical
            ? `🚨 Out of Stock: ${p.name}`
            : `⚠️ Low Stock Alert: ${p.name}`;
          const expectedMsg = isCritical
            ? `CRITICAL: ${p.name} is depleted (0 ${p.unit}) in ${currentBranch.name}. Immediate restock required.`
            : `Only ${p.stock} ${p.unit} remaining in ${currentBranch.name} (Safety threshold: ${p.minStockAlert} ${p.unit}).`;

          if (existingIdx >= 0) {
            if (updated[existingIdx].currentStock !== p.stock || updated[existingIdx].threshold !== p.minStockAlert) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                title: expectedTitle,
                message: expectedMsg,
                currentStock: p.stock,
                threshold: p.minStockAlert,
                severity: isCritical ? 'critical' : 'warning',
                type: isCritical ? 'alert' : 'warning',
              };
              hasChanges = true;
            }
          } else {
            updated = [
              {
                id: `notif-stock-${p.id}`,
                title: expectedTitle,
                message: expectedMsg,
                type: isCritical ? 'alert' : 'warning',
                timestamp: new Date().toISOString(),
                read: false,
                targetRole: 'all',
                productId: p.id,
                productName: p.name,
                currentStock: p.stock,
                threshold: p.minStockAlert,
                unit: p.unit,
                branchId: p.branchId || currentBranch.id,
                branchName: currentBranch.name,
                category: p.category,
                severity: isCritical ? 'critical' : 'warning',
              },
              ...updated,
            ];
            hasChanges = true;
          }
        } else if (existingIdx >= 0) {
          // Auto-resolve notification when stock is replenished
          updated[existingIdx] = {
            ...updated[existingIdx],
            read: true,
            title: `✓ Restocked: ${p.name}`,
            message: `${p.name} replenished to ${p.stock} ${p.unit} (Above threshold of ${p.minStockAlert} ${p.unit}).`,
            type: 'success',
            currentStock: p.stock,
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updated : prev;
    });
  }, [products, currentBranch.id]);

  // Derived low stock items
  const lowStockProducts = products.filter(
    p => (p.branchId === currentBranch.id || !p.branchId) && p.stock <= p.minStockAlert
  );

  const outOfStockProducts = products.filter(
    p => (p.branchId === currentBranch.id || !p.branchId) && p.stock <= 0
  );

  const allBranchesLowStockProducts = products.filter(
    p => p.stock <= p.minStockAlert
  );

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANCH, JSON.stringify(currentBranch));
  }, [currentBranch]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(stockRequests));
  }, [stockRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(stockLogs));
  }, [stockLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbacks));
  }, [feedbacks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVESTMENT, JSON.stringify(investmentData));
  }, [investmentData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  // Login as role helper
  const loginAsRole = (role: UserRole) => {
    const matchingUser = users.find(u => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
      if (matchingUser.branchId !== 'all') {
        const branch = allBranches.find(b => b.id === matchingUser.branchId);
        if (branch) setCurrentBranch(branch);
      }
    }
  };

  const logout = () => {
    loginAsRole('biller');
  };

  // Cart Handlers
  const addToCart = (product: Product, quantity = 1, customPrice?: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            discountPercent: 0,
            taxPercent: currentBranch.taxRate || 5.0,
            customPrice,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prev =>
        prev.map(item =>
          item.product.id === productId ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const updateCartDiscount = (productId: string, discountPercent: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, discountPercent } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // Create Bill
  const createBill = (billData: {
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    paymentMode: Bill['paymentMode'];
    discountPercent?: number;
    notes?: string;
  }): Bill => {
    const taxRate = currentBranch.taxRate || 5.0;
    const overallDiscount = billData.discountPercent || 0;

    let subtotal = 0;
    billData.items.forEach(item => {
      const unitPrice = item.customPrice ?? item.product.sellingPrice;
      const itemSub = unitPrice * item.quantity;
      const itemDisc = (itemSub * item.discountPercent) / 100;
      subtotal += itemSub - itemDisc;
    });

    const discountAmount = (subtotal * overallDiscount) / 100;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const total = taxableAmount + taxAmount;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(bills.length + 1).padStart(4, '0');
    const invoiceNumber = `INV-TN-${dateStr}-${seq}`;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      invoiceNumber,
      billerId: currentUser.id,
      billerName: currentUser.name,
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      customerName: billData.customerName || 'Walk-in Customer',
      customerPhone: billData.customerPhone || 'N/A',
      items: billData.items,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      taxPercent: taxRate,
      discountAmount: Number(discountAmount.toFixed(2)),
      discountPercent: overallDiscount,
      total: Number(total.toFixed(2)),
      paymentMode: billData.paymentMode,
      paymentRef: billData.paymentMode === 'upi'
        ? `UPI/${currentBranch.upiId ? currentBranch.upiId.split('@')[0].toUpperCase() : 'GPAY'}/${Math.floor(100000000000 + Math.random() * 900000000000)}`
        : `${billData.paymentMode.toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      status: 'completed',
      notes: billData.notes,
    };

    // Auto-deduct inventory and create logs
    const newLogs: StockLog[] = [];
    const triggeredLowStockEvents: LowStockAlertEvent[] = [];

    setProducts(prevProducts =>
      prevProducts.map(p => {
        const soldItem = billData.items.find(it => it.product.id === p.id);
        if (soldItem) {
          const newStock = Math.max(0, p.stock - soldItem.quantity);
          newLogs.push({
            id: `log-${Date.now()}-${p.id}`,
            productId: p.id,
            productName: p.name,
            branchId: currentBranch.id,
            branchName: currentBranch.name,
            type: 'sale',
            quantityChange: -soldItem.quantity,
            staffName: currentUser.name,
            timestamp: new Date().toISOString(),
            reason: `Bill #${invoiceNumber}`,
          });

          // Check if item crossed predefined threshold
          if (newStock <= p.minStockAlert) {
            triggeredLowStockEvents.push({
              product: { ...p, stock: newStock },
              currentStock: newStock,
              threshold: p.minStockAlert,
              isOutOfStock: newStock === 0,
              branchName: currentBranch.name,
              timestamp: new Date().toISOString(),
            });
          }

          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    setStockLogs(prev => [...newLogs, ...prev]);
    setBills(prev => [newBill, ...prev]);

    // Automated Low-Stock Alert & Audio Chime
    if (triggeredLowStockEvents.length > 0) {
      const urgentEvt = triggeredLowStockEvents.find(e => e.isOutOfStock) || triggeredLowStockEvents[0];
      setActiveStockToast(urgentEvt);

      if (soundEnabled) {
        if (urgentEvt.isOutOfStock) {
          playCriticalStockAlertSound();
        } else {
          playStockAlertSound();
        }
      }
    }

    // Update biller stats
    setUsers(prev =>
      prev.map(u =>
        u.id === currentUser.id
          ? {
              ...u,
              totalSales: u.totalSales + newBill.total,
              billsCount: u.billsCount + 1,
            }
          : u
      )
    );

    // Clear cart after checkout
    setCart([]);

    // Auto-sync bill to Base44 Cloud Entities
    base44Service.syncSingleBill(newBill).catch(() => null);

    return newBill;
  };

  // Product actions
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [newProduct, ...prev]);

    // Log restock / initialization
    setStockLogs(prev => [
      {
        id: `log-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        branchId: newProduct.branchId || currentBranch.id,
        branchName: currentBranch.name,
        type: 'restock',
        quantityChange: newProduct.stock,
        staffName: currentUser.name,
        timestamp: new Date().toISOString(),
        reason: 'New Product Added to Catalog',
      },
      ...prev,
    ]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const adjustStock = (productId: string, qtyChange: number, reason: string) => {
    const targetProd = products.find(p => p.id === productId);
    if (!targetProd) return;

    const newStock = Math.max(0, targetProd.stock + qtyChange);
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: newStock } : p))
    );

    setStockLogs(prev => [
      {
        id: `log-${Date.now()}`,
        productId,
        productName: targetProd.name,
        branchId: currentBranch.id,
        branchName: currentBranch.name,
        type: qtyChange > 0 ? 'restock' : 'adjustment',
        quantityChange: qtyChange,
        staffName: currentUser.name,
        timestamp: new Date().toISOString(),
        reason: reason || 'Manual Stock Adjustment',
      },
      ...prev,
    ]);

    // Check if stock reduction caused item to fall below predefined threshold
    if (qtyChange < 0 && newStock <= targetProd.minStockAlert) {
      const isOut = newStock === 0;
      const event: LowStockAlertEvent = {
        product: { ...targetProd, stock: newStock },
        currentStock: newStock,
        threshold: targetProd.minStockAlert,
        isOutOfStock: isOut,
        branchName: currentBranch.name,
        timestamp: new Date().toISOString(),
      };

      setActiveStockToast(event);
      if (soundEnabled) {
        if (isOut) {
          playCriticalStockAlertSound();
        } else {
          playStockAlertSound();
        }
      }
    }
  };

  const quickRestock = (productId: string, quantity: number, reason: string = '1-Click Quick Restock') => {
    adjustStock(productId, quantity, reason);
  };

  const updateProductThreshold = (productId: string, newThreshold: number) => {
    const valid = Math.max(1, Math.round(newThreshold));
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, minStockAlert: valid } : p))
    );
  };

  const dismissProductAlert = (productId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.productId === productId ? { ...n, read: true } : n))
    );
  };

  const triggerStockAlertSim = (productId?: string) => {
    let target = productId ? products.find(p => p.id === productId) : null;
    if (!target) {
      target = products.find(p => (!p.branchId || p.branchId === currentBranch.id) && p.stock <= p.minStockAlert)
        || products.find(p => !p.branchId || p.branchId === currentBranch.id)
        || products[0];
    }
    if (!target) return;

    const simStock = target.stock <= target.minStockAlert ? target.stock : Math.max(0, target.minStockAlert - 2);
    const isOut = simStock === 0;

    const event: LowStockAlertEvent = {
      product: { ...target, stock: simStock },
      currentStock: simStock,
      threshold: target.minStockAlert,
      isOutOfStock: isOut,
      branchName: currentBranch.name,
      timestamp: new Date().toISOString(),
    };

    setActiveStockToast(event);
    if (soundEnabled) {
      if (isOut) {
        playCriticalStockAlertSound();
      } else {
        playStockAlertSound();
      }
    }

    setNotifications(prev => [
      {
        id: `notif-stock-sim-${Date.now()}`,
        title: isOut ? `🚨 Out of Stock: ${target!.name}` : `⚠️ Low Stock Alert: ${target!.name}`,
        message: isOut
          ? `CRITICAL: ${target!.name} is at 0 ${target!.unit} in ${currentBranch.name}. Immediate restock required.`
          : `Only ${simStock} ${target!.unit} remaining in ${currentBranch.name} (Safety threshold: ${target!.minStockAlert} ${target!.unit}).`,
        type: isOut ? 'alert' : 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        targetRole: 'all',
        productId: target!.id,
        productName: target!.name,
        currentStock: simStock,
        threshold: target!.minStockAlert,
        unit: target!.unit,
        branchId: target!.branchId || currentBranch.id,
        branchName: currentBranch.name,
        category: target!.category,
        severity: isOut ? 'critical' : 'warning',
      },
      ...prev,
    ]);
  };

  // Stock Requests
  const requestStock = (req: {
    productId: string;
    requestedQty: number;
    reason: string;
  }) => {
    const prod = products.find(p => p.id === req.productId);
    if (!prod) return;

    const newReq: StockRequest = {
      id: `req-${Date.now()}`,
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      billerId: currentUser.id,
      billerName: currentUser.name,
      productId: req.productId,
      productName: prod.name,
      requestedQty: req.requestedQty,
      currentStock: prod.stock,
      reason: req.reason,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };

    setStockRequests(prev => [newReq, ...prev]);

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `Stock Request: ${prod.name}`,
        message: `${currentUser.name} requested ${req.requestedQty} units for ${currentBranch.name}.`,
        type: 'warning',
        timestamp: new Date().toISOString(),
        read: false,
        targetRole: 'manager',
      },
      ...prev,
    ]);
  };

  const approveStockRequest = (id: string, note?: string) => {
    const targetReq = stockRequests.find(r => r.id === id);
    if (!targetReq) return;

    setStockRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: 'approved', managerNote: note || 'Approved by store manager.' } : r
      )
    );

    // Auto add stock
    adjustStock(targetReq.productId, targetReq.requestedQty, `Stock Request Approved: ${note || ''}`);
  };

  const rejectStockRequest = (id: string, note?: string) => {
    setStockRequests(prev =>
      prev.map(r =>
        r.id === id ? { ...r, status: 'rejected', managerNote: note || 'Rejected by store manager.' } : r
      )
    );
  };

  // Customer Feedback
  const submitFeedback = (fb: {
    invoiceId: string;
    customerName: string;
    customerPhone: string;
    rating: number;
    comments: string;
    tags?: string[];
  }) => {
    const sentiment: CustomerFeedback['sentiment'] =
      fb.rating >= 4 ? 'positive' : fb.rating === 3 ? 'neutral' : 'negative';

    const newFb: CustomerFeedback = {
      id: `fb-${Date.now()}`,
      invoiceId: fb.invoiceId,
      customerName: fb.customerName,
      customerPhone: fb.customerPhone,
      rating: fb.rating,
      comments: fb.comments,
      sentiment,
      tags: fb.tags || ['Verified Purchase'],
      timestamp: new Date().toISOString(),
      branchId: currentBranch.id,
      branchName: currentBranch.name,
      status: fb.rating <= 2 ? 'followup_needed' : 'new',
    };

    setFeedbacks(prev => [newFb, ...prev]);

    if (fb.rating <= 2) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: `Negative Feedback Alert (${fb.rating}★)`,
          message: `Customer ${fb.customerName} left a critical review: "${fb.comments.slice(0, 45)}..."`,
          type: 'alert',
          timestamp: new Date().toISOString(),
          read: false,
          targetRole: 'manager',
        },
        ...prev,
      ]);
    }
  };

  const updateFeedbackStatus = (
    id: string,
    status: CustomerFeedback['status'],
    managerNotes?: string
  ) => {
    setFeedbacks(prev =>
      prev.map(f => (f.id === id ? { ...f, status, managerNotes } : f))
    );
  };

  // Investment
  const updateInvestmentData = (data: Partial<InvestmentData>) => {
    setInvestmentData(prev => ({ ...prev, ...data }));
  };

  // Staff
  const addStaff = (staffData: Omit<User, 'id' | 'totalSales' | 'billsCount' | 'joinedDate'>) => {
    const newStaff: User = {
      ...staffData,
      id: `user-${staffData.role}-${Date.now()}`,
      totalSales: 0,
      billsCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
      avatar:
        staffData.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffData.name)}`,
    };
    setUsers(prev => [...prev, newStaff]);
  };

  const updateStaff = (updated: User) => {
    setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
  };

  const deleteStaff = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addUser = (newUser: User) => {
    setUsers(prev => [...prev, newUser]);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, role: newRole }));
    }
  };

  const updateProductStock = (
    productId: string,
    qtyChange: number,
    type: string = 'restock',
    reason: string = 'Stock update'
  ) => {
    adjustStock(productId, qtyChange, reason);
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        currentBranch,
        allBranches,
        branches: allBranches,
        users,
        products,
        bills,
        stockRequests,
        stockLogs,
        feedbacks,
        customerFeedbacks: feedbacks,
        investmentData,
        notifications,
        theme,
        language,
        currencySymbol: CURRENCY_SYMBOL,
        cart,
        isAiDrawerOpen,
        setIsAiDrawerOpen,
        toggleLanguage,
        setLanguage,
        formatCurrency,
        setCurrentUser,
        setCurrentBranch,
        loginAsRole,
        logout,
        toggleTheme,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        updateCartDiscount,
        clearCart,
        createBill,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        updateProductStock,
        requestStock,
        approveStockRequest,
        rejectStockRequest,
        submitFeedback,
        updateFeedbackStatus,
        updateInvestmentData,
        addStaff,
        addUser,
        updateStaff,
        updateUserRole,
        deleteStaff,
        markNotificationRead,
        clearAllNotifications,
        lowStockProducts,
        outOfStockProducts,
        allBranchesLowStockProducts,
        activeStockToast,
        dismissStockToast,
        soundEnabled,
        toggleStockSound,
        updateProductThreshold,
        quickRestock,
        dismissProductAlert,
        triggerStockAlertSim,
        base44Config,
        base44Status,
        updateBase44Config,
        triggerBase44Sync,
        runBase44AgentWorkflow,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
