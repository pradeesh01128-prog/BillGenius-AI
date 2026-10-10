import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { LowStockAlertBanner } from '../common/LowStockAlertBanner';
import {
  ClipboardCheck,
  CheckCircle,
  XCircle,
  Clock,
  Boxes,
  User,
  ArrowRight,
} from 'lucide-react';

export const StockApprovalsView: React.FC = () => {
  const { stockRequests, approveStockRequest, rejectStockRequest, currentBranch } = useStore();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const safeStockRequests = stockRequests || [];

  const filteredRequests = safeStockRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = safeStockRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Stock Restock Approvals
            </h3>
            <p className="text-xs text-slate-400">
              Review and approve restock requests submitted by counter billers
            </p>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                filter === tab
                  ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab} {tab === 'pending' && pendingCount > 0 && `(${pendingCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Automated Live Low-Stock Alert Banner for Manager */}
      <LowStockAlertBanner role="manager" compact />

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <ClipboardCheck className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-medium">No stock requests found in this view.</p>
          </div>
        ) : (
          filteredRequests.map(req => {
            const isPending = req.status === 'pending';
            return (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {req.productName}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          req.status === 'pending'
                            ? 'bg-amber-500/10 text-amber-600'
                            : req.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Requested: <strong className="text-teal-600">+{req.requestedQty} units</strong> • Reason: "{req.reason}"
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> Requested by {req.billerName}
                      </span>
                      <span>•</span>
                      <span>{new Date(req.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      id={`approve-stock-${req.id}`}
                      onClick={() => approveStockRequest(req.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve & Restock (+{req.requestedQty})
                    </button>
                    <button
                      id={`reject-stock-${req.id}`}
                      onClick={() => rejectStockRequest(req.id)}
                      className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-semibold text-xs hover:bg-rose-100 transition flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
