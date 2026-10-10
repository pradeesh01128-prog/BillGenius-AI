import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { LowStockManagementModal } from './LowStockManagementModal';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  PackagePlus,
  Plus,
  ArrowRight,
  Sparkles,
  Boxes,
  X,
  CheckCircle2,
  BellRing,
} from 'lucide-react';

interface LowStockAlertBannerProps {
  role?: 'biller' | 'manager' | 'owner';
  compact?: boolean;
}

export const LowStockAlertBanner: React.FC<LowStockAlertBannerProps> = ({
  role,
  compact = false,
}) => {
  const {
    products,
    currentBranch,
    currentUser,
    quickRestock,
    requestStock,
    soundEnabled,
    toggleStockSound,
    language,
    triggerStockAlertSim,
  } = useStore();

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const effectiveRole = role || currentUser.role;
  const isTa = language === 'ta';
  const isManagerOrOwner = effectiveRole === 'manager' || effectiveRole === 'owner';

  // Filter items for current branch
  const branchProducts = products.filter(
    p => effectiveRole === 'owner' && currentUser.branchId === 'all'
      ? true
      : (!p.branchId || p.branchId === currentBranch.id)
  );

  const outOfStockItems = branchProducts.filter(p => p.stock <= 0);
  const lowStockItems = branchProducts.filter(p => p.stock > 0 && p.stock <= p.minStockAlert);
  const totalAlertItems = branchProducts.filter(p => p.stock <= p.minStockAlert);

  if (totalAlertItems.length === 0 || isDismissed) {
    return null;
  }

  const hasCritical = outOfStockItems.length > 0;

  const handleQuickRestock = (product: Product, qty: number) => {
    quickRestock(product.id, qty, `Quick Restock from Dashboard Alert (+${qty})`);
    setActionNotice(`Added +${qty} to ${product.name}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleRequestStock = (product: Product) => {
    requestStock({
      productId: product.id,
      requestedQty: Math.max(20, product.minStockAlert * 2),
      reason: `Automated alert request: stock currently ${product.stock} ${product.unit}`,
    });
    setActionNotice(`Stock request dispatched for ${product.name}!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <>
      <div
        id="automated-low-stock-alert-banner"
        className={`w-full rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
          hasCritical
            ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-100'
            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-amber-950 dark:text-amber-100'
        }`}
      >
        {/* Banner Header Bar */}
        <div className="p-3 sm:px-4 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${
                hasCritical
                  ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                  : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                  {isTa ? 'தானியங்கி இருப்பு எச்சரிக்கை (Automated Stock Alert)' : 'Automated Low-Stock Alert'}
                </span>

                {outOfStockItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                    {outOfStockItems.length} {isTa ? 'தீர்ந்தது' : 'Out of Stock'}
                  </span>
                )}

                {lowStockItems.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    {lowStockItems.length} {isTa ? 'குறைந்த இருப்பு' : 'Below Safety Threshold'}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {currentBranch.name}: {totalAlertItems.map(p => p.name.split('(')[0].trim()).slice(0, 3).join(', ')}
                {totalAlertItems.length > 3 ? ` +${totalAlertItems.length - 3} more` : ''}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio chime toggle */}
            <button
              type="button"
              onClick={toggleStockSound}
              title={soundEnabled ? 'Alert Audio Chime: Enabled' : 'Alert Audio Chime: Muted'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Test Alert Simulation */}
            <button
              type="button"
              onClick={() => {
                triggerStockAlertSim();
                setActionNotice('Simulated live low-stock notification & chime triggered!');
                setTimeout(() => setActionNotice(null), 3500);
              }}
              title="Test automated notification chime & dashboard alert"
              className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition"
            >
              <BellRing className="w-3 h-3 text-amber-500" />
              <span>Test Chime</span>
            </button>

            {/* Manage Center Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-xs font-bold transition shadow-2xs"
            >
              <span>{isManagerOrOwner ? 'Restock Center' : 'View All'}</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            {/* Toggle Expand / Collapse */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition"
              aria-label={isExpanded ? 'Collapse alert details' : 'Expand alert details'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Dismiss banner button */}
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              title="Acknowledge & dismiss banner"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Action Notice */}
        {actionNotice && (
          <div className="px-4 py-1.5 bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionNotice}</span>
            </div>
          </div>
        )}

        {/* Expandable Alert Items Grid */}
        {isExpanded && (
          <div className="p-3 sm:px-4 pt-1 border-t border-black/5 dark:border-white/5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {totalAlertItems.slice(0, 6).map(prod => {
                const isOut = prod.stock <= 0;
                const ratio = Math.min(100, Math.round((prod.stock / (prod.minStockAlert || 1)) * 100));

                return (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="text-xl shrink-0">{prod.imageEmoji}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </p>
                          {prod.nameTamil && (
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                              {prod.nameTamil}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md shrink-0 ${
                          isOut
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isOut ? 'Depleted' : `${prod.stock} ${prod.unit}`}
                      </span>
                    </div>

                    {/* Stock vs Threshold Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOut ? 'w-0' : ratio < 35 ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(4, ratio)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Threshold: &le; {prod.minStockAlert} {prod.unit}</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {isOut ? '0 on hand' : `${prod.stock} left`}
                        </span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                      {isManagerOrOwner ? (
                        <>
                          <span className="text-[10px] font-semibold text-slate-400">Quick Restock:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(prod, 15)}
                              className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 font-extrabold text-[10px] border border-teal-200 dark:border-teal-800"
                            >
                              +15
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickRestock(prod, 30)}
                              className="px-2 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-[10px]"
                            >
                              +30
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRequestStock(prod)}
                          className="w-full py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] transition flex items-center justify-center gap-1"
                        >
                          <PackagePlus className="w-3 h-3" />
                          <span>Request Stock from Manager</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom summary and modal link */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                {totalAlertItems.length > 6
                  ? `Showing 6 of ${totalAlertItems.length} low inventory items.`
                  : `Total ${totalAlertItems.length} items flagged for restock in ${currentBranch.name}.`}
              </span>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>Open Low-Stock Management Center</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Low-Stock Management Modal */}
      <LowStockManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
