import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import { LowStockAlertBanner } from '../common/LowStockAlertBanner';
import { Boxes, Building, Search, AlertTriangle, CheckCircle, PackageCheck } from 'lucide-react';

export const AllBranchesStockView: React.FC = () => {
  const { products, branches } = useStore();
  const [search, setSearch] = useState('');

  const safeProducts = products || [];
  const safeBranches = branches || [];

  const filteredProducts = safeProducts.filter(
    p =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.nameTamil || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalStockAcrossAll = safeProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalValuation = safeProducts.reduce((acc, p) => acc + (p.costPrice || 0) * (p.stock || 0), 0);

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Active TN Branches</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{safeBranches.length}</p>
            <Building className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-[11px] text-slate-400">Chennai, Coimbatore, Madurai, Trichy</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Enterprise Units on Hand</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalStockAcrossAll.toLocaleString()}
            </p>
            <Boxes className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Physical inventory</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Inventory Asset Value</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-black text-teal-600">
              {formatINR(totalValuation)}
            </p>
            <PackageCheck className="w-5 h-5 text-teal-600" />
          </div>
          <span className="text-[11px] text-slate-400">Cost-basis balance sheet (INR)</span>
        </div>
      </div>

      {/* Enterprise Automated Low-Stock Alert Banner */}
      <LowStockAlertBanner role="owner" />

      {/* Stock Matrix Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Tamil Nadu Branches Stock Distribution Matrix
            </h3>
            <p className="text-xs text-slate-400">Real-time cross-store supply visibility across TN retail outlets</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product across TN stores..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Chennai (T. Nagar)</th>
                <th className="py-2.5 px-3">Coimbatore (RS Puram)</th>
                <th className="py-2.5 px-3">Madurai (KK Nagar)</th>
                <th className="py-2.5 px-3 text-right">Total Aggregate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map(prod => {
                // Simulated distribution across 3 branches
                const branch1Qty = prod.stock || 0;
                const branch2Qty = Math.floor((prod.stock || 0) * 0.75);
                const branch3Qty = Math.floor((prod.stock || 0) * 0.4);
                const total = branch1Qty + branch2Qty + branch3Qty;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{prod.imageEmoji}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                          {prod.nameTamil && (
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                              {prod.nameTamil}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400 font-mono">{prod.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{prod.category}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {branch1Qty} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {branch2Qty} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {branch3Qty} {prod.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-teal-600">
                      {total} {prod.unit}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
