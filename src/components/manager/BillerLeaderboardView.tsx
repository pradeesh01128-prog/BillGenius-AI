import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  Award,
  TrendingUp,
  Receipt,
  Star,
  CheckCircle2,
  Zap,
  Users,
  Trophy,
} from 'lucide-react';

export const BillerLeaderboardView: React.FC = () => {
  const { users, bills, currentBranch } = useStore();

  const safeUsers = users || [];
  const safeBills = bills || [];

  const billers = safeUsers.filter(u => u.role === 'biller');

  // Compute live aggregated metrics per biller
  const billerStats = billers.map(b => {
    const userBills = safeBills.filter(item => item.billerId === b.id);
    const totalSales = userBills.reduce((acc, it) => acc + (it.total || 0), 0);
    const billsCount = userBills.length;
    const avgTicket = billsCount > 0 ? totalSales / billsCount : 0;
    const totalItems = userBills.reduce(
      (acc, it) => acc + (it.items || []).reduce((s, i) => s + (i.quantity || 1), 0),
      0
    );

    return {
      ...b,
      totalSales,
      billsCount,
      avgTicket,
      totalItems,
      rating: 4.8 + (b.id === 'user-biller-1' ? 0.1 : 0.0),
    };
  });

  // Sort by total sales desc
  billerStats.sort((a, b) => b.totalSales - a.totalSales);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Biller & Cashier Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Shift throughput, sales revenue, and service speed metrics
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {billerStats.map((biller, idx) => {
          const isLeader = idx === 0;

          return (
            <div
              key={biller.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition relative overflow-hidden ${
                isLeader
                  ? 'border-amber-400 shadow-md shadow-amber-500/10'
                  : 'border-slate-200 dark:border-slate-800 shadow-xs'
              }`}
            >
              {isLeader && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                  <Trophy className="w-3 h-3" />
                  TOP PERFORMER #1
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-base flex items-center justify-center shadow-md">
                  {biller.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {biller.name}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Terminal {idx + 1}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">{biller.email}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                    {formatINR(biller.totalSales)}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Bills Issued</span>
                  <p className="font-extrabold text-sm text-teal-600 dark:text-teal-400 mt-0.5">
                    {biller.billsCount}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Avg Bill Size</span>
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                    {formatINR(biller.avgTicket)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Speed: ~45 sec / checkout
                </span>
                <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  {biller.rating.toFixed(1)} CSAT
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
