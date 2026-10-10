import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { AlertTriangle, X, Plus, PackagePlus, Volume2, VolumeX, CheckCircle } from 'lucide-react';

export const LowStockToast: React.FC = () => {
  const {
    activeStockToast,
    dismissStockToast,
    currentUser,
    currentBranch,
    quickRestock,
    requestStock,
    soundEnabled,
    toggleStockSound,
    language,
  } = useStore();

  const isTa = language === 'ta';

  useEffect(() => {
    if (!activeStockToast) return;
    const timer = setTimeout(() => {
      dismissStockToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeStockToast, dismissStockToast]);

  if (!activeStockToast) return null;

  const { product, currentStock, threshold, isOutOfStock } = activeStockToast;
  const isManagerOrOwner = currentUser.role === 'manager' || currentUser.role === 'owner';

  const handleQuickRestock = (qty: number) => {
    quickRestock(product.id, qty, `Instant Restock from Automated Alert (+${qty})`);
    dismissStockToast();
  };

  const handleBillerRequest = () => {
    requestStock({
      productId: product.id,
      requestedQty: Math.max(20, threshold * 2),
      reason: isOutOfStock
        ? 'Depleted to 0 during rush checkout'
        : `Automatic alert: ${currentStock} left (below threshold ${threshold})`,
    });
    dismissStockToast();
  };

  return (
    <div
      role="alert"
      id="automated-low-stock-toast"
      className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white dark:bg-slate-900 border-2 rounded-2xl shadow-2xl p-4 transition-all duration-300 transform translate-y-0 animate-bounce-subtle flex flex-col gap-2.5 backdrop-blur-xs"
      style={{
        borderColor: isOutOfStock ? '#ef4444' : '#f59e0b',
      }}
    >
      {/* Toast Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isOutOfStock
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                  isOutOfStock
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 text-slate-900 font-extrabold'
                }`}
              >
                {isOutOfStock
                  ? isTa ? 'கையிருப்பு தீர்ந்தது' : 'OUT OF STOCK'
                  : isTa ? 'குறைந்த இருப்பு எச்சரிக்கை' : 'LOW STOCK ALERT'}
              </span>
              <button
                type="button"
                onClick={toggleStockSound}
                title={soundEnabled ? 'Alert Chime: ON' : 'Alert Chime: OFF'}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {soundEnabled ? <Volume2 className="w-3 h-3 text-teal-600" /> : <VolumeX className="w-3 h-3" />}
              </button>
            </div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1 leading-snug">
              {product.name}
            </h4>
            {product.nameTamil && (
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                {product.nameTamil}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={dismissStockToast}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quantity & Threshold Status */}
      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
        <div>
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
            {isTa ? 'தற்போதைய இருப்பு' : 'Current Level'}:
          </span>
          <span
            className={`font-black text-sm ${
              isOutOfStock ? 'text-rose-600' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {currentStock} {product.unit}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
            {isTa ? 'எச்சரிக்கை அளவு' : 'Predefined Alert'}:
          </span>
          <span className="font-bold text-slate-700 dark:text-slate-300">
            &le; {threshold} {product.unit}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-1 flex items-center gap-1.5">
        {isManagerOrOwner ? (
          <>
            <button
              id="toast-quick-restock-10"
              onClick={() => handleQuickRestock(15)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+15 {product.unit}</span>
            </button>
            <button
              id="toast-quick-restock-50"
              onClick={() => handleQuickRestock(30)}
              className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold text-[11px] transition shadow-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+30 {product.unit}</span>
            </button>
          </>
        ) : (
          <button
            id="toast-biller-request-stock"
            onClick={handleBillerRequest}
            className="w-full py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-xs flex items-center justify-center gap-1"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>{isTa ? 'மேலாளரிடம் இருப்பு கேட்கவும்' : 'Request Restock from Manager'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
