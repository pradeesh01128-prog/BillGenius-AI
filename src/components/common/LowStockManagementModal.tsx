import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  AlertTriangle,
  X,
  Plus,
  Sliders,
  CheckCircle2,
  PackagePlus,
  RefreshCw,
  Search,
  Check,
  Building,
  History,
  Boxes,
  Volume2,
  VolumeX,
  BellRing,
} from 'lucide-react';

interface LowStockManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: 'all' | 'out' | 'low';
}

export const LowStockManagementModal: React.FC<LowStockManagementModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
}) => {
  const {
    products,
    currentBranch,
    currentUser,
    quickRestock,
    updateProductThreshold,
    requestStock,
    stockLogs,
    language,
    soundEnabled,
    toggleStockSound,
    triggerStockAlertSim,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'all' | 'out' | 'low'>(initialFilter);
  const [search, setSearch] = useState('');
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [thresholdInput, setThresholdInput] = useState<number>(10);
  const [customRestockId, setCustomRestockId] = useState<string | null>(null);
  const [customRestockQty, setCustomRestockQty] = useState<number>(20);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isTa = language === 'ta';
  const isManagerOrOwner = currentUser.role === 'manager' || currentUser.role === 'owner';

  if (!isOpen) return null;

  // Filter items in current branch (or enterprise if owner with 'all')
  const branchProducts = products.filter(
    p => currentUser.role === 'owner' && currentUser.branchId === 'all'
      ? true
      : (!p.branchId || p.branchId === currentBranch.id)
  );

  const outOfStockItems = branchProducts.filter(p => p.stock <= 0);
  const lowStockItems = branchProducts.filter(p => p.stock > 0 && p.stock <= p.minStockAlert);
  const allAlertItems = branchProducts.filter(p => p.stock <= p.minStockAlert);

  const displayedList = (activeTab === 'out'
    ? outOfStockItems
    : activeTab === 'low'
    ? lowStockItems
    : allAlertItems
  ).filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.nameTamil || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyThreshold = (productId: string) => {
    updateProductThreshold(productId, thresholdInput);
    setEditingThresholdId(null);
    setSuccessMessage('Threshold updated successfully!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRestock = (product: Product, qty: number) => {
    quickRestock(product.id, qty, `Restocked via Low-Stock Center (+${qty} ${product.unit})`);
    setCustomRestockId(null);
    setSuccessMessage(`Added +${qty} ${product.unit} to ${product.name}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleBillerRequest = (product: Product) => {
    requestStock({
      productId: product.id,
      requestedQty: Math.max(25, product.minStockAlert * 2),
      reason: `Automated alert request: stock at ${product.stock} ${product.unit}`,
    });
    setSuccessMessage(`Restock request sent to Manager for ${product.name}!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleBulkReplenish = () => {
    let count = 0;
    allAlertItems.forEach(p => {
      const deficit = Math.max(10, (p.minStockAlert * 2) - p.stock);
      quickRestock(p.id, deficit, 'Automated Bulk Restock to 2x Safety Threshold');
      count++;
    });
    setSuccessMessage(`Replenished ${count} critical items to safety thresholds!`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Automated Low-Stock Management Center
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  {allAlertItems.length} Threshold Alerts
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoring inventory safety thresholds for {currentBranch.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleStockSound}
              title={soundEnabled ? 'Alert Audio Chime: Enabled' : 'Alert Audio Chime: Muted'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Test Alert System */}
            <button
              type="button"
              onClick={() => {
                triggerStockAlertSim();
                setSuccessMessage('Automated alert chime and dashboard notification triggered!');
                setTimeout(() => setSuccessMessage(null), 3500);
              }}
              title="Test automated notification chime & dashboard alert"
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold transition flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Alert</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {successMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Controls, Filter Tabs & Search */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>All Alerts</span>
              <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center">
                {allAlertItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('out')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'out'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Out of Stock</span>
              <span className="w-5 h-5 rounded-full bg-rose-500/10 text-rose-600 text-[10px] flex items-center justify-center">
                {outOfStockItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('low')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'low'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Low Stock</span>
              <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] flex items-center justify-center">
                {lowStockItems.length}
              </span>
            </button>
          </div>

          {/* Search & Bulk Action */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search alert items..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {isManagerOrOwner && allAlertItems.length > 0 && (
              <button
                id="bulk-restock-safety-threshold-button"
                onClick={handleBulkReplenish}
                className="py-1.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auto-Replenish All</span>
              </button>
            )}
          </div>
        </div>

        {/* Item List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
          {displayedList.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">
                All Inventory Meets Defined Safety Thresholds!
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No items are currently below their minimum alert levels in {currentBranch.name}.
              </p>
            </div>
          ) : (
            displayedList.map(prod => {
              const isOut = prod.stock <= 0;
              const ratio = Math.min(100, Math.round((prod.stock / (prod.minStockAlert || 1)) * 100));
              const deficit = Math.max(0, prod.minStockAlert - prod.stock);

              return (
                <div
                  key={prod.id}
                  id={`low-stock-card-${prod.id}`}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Product Details */}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {prod.imageEmoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {prod.name}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOut
                              ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          }`}
                        >
                          {isOut ? 'Depleted (0)' : `Low (${ratio}%)`}
                        </span>
                      </div>

                      {prod.nameTamil && (
                        <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                          {prod.nameTamil}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <span>Category: {prod.category}</span>
                        <span>•</span>
                        <span>Rate: {formatINR(prod.sellingPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Stock vs Threshold Meter */}
                  <div className="w-full md:w-56 space-y-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">In Stock:</span>
                      <span className={`font-black text-sm ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                        {prod.stock} {prod.unit}
                      </span>
                    </div>

                    {/* Visual Meter Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOut ? 'w-0' : ratio < 30 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(5, ratio)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Threshold: &le; {prod.minStockAlert} {prod.unit}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-bold">
                        {isOut ? `Deficit: ${prod.minStockAlert}` : `Needs +${deficit}`}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {isManagerOrOwner ? (
                      <>
                        {/* Quick increment buttons */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                          <button
                            title="Add 10 units"
                            onClick={() => handleRestock(prod, 10)}
                            className="px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition"
                          >
                            +10
                          </button>
                          <button
                            title="Add 25 units"
                            onClick={() => handleRestock(prod, 25)}
                            className="px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition"
                          >
                            +25
                          </button>
                          <button
                            title="Add 50 units"
                            onClick={() => handleRestock(prod, 50)}
                            className="px-2 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition"
                          >
                            +50
                          </button>
                        </div>

                        {/* Edit Threshold Button */}
                        {editingThresholdId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={thresholdInput}
                              onChange={e => setThresholdInput(parseInt(e.target.value) || 1)}
                              className="w-14 p-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-teal-500 font-bold text-center"
                            />
                            <button
                              onClick={() => handleApplyThreshold(prod.id)}
                              className="p-1 rounded-lg bg-teal-600 text-white"
                              title="Save threshold"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingThresholdId(null)}
                              className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-500"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingThresholdId(prod.id);
                              setThresholdInput(prod.minStockAlert);
                            }}
                            title="Edit safety threshold alert value"
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      /* Cashier / Biller View */
                      <button
                        onClick={() => handleBillerRequest(prod)}
                        className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                      >
                        <PackagePlus className="w-3.5 h-3.5" />
                        <span>Request Stock</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Automated low-stock engine active • Dispatches real-time alerts upon sales</span>
          </div>

          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
