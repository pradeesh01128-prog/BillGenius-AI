import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import { LowStockAlertBanner } from '../common/LowStockAlertBanner';
import { LowStockManagementModal } from '../common/LowStockManagementModal';
import {
  Boxes,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowUpDown,
  Filter,
  PackageCheck,
  X,
  Sliders,
} from 'lucide-react';

export const BranchInventoryView: React.FC = () => {
  const { products, updateProductStock, quickRestock, currentBranch } = useStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);

  const safeProducts = products || [];

  // Stock-in modal state
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockToAdd, setStockToAdd] = useState(25);
  const [stockInReason, setStockInReason] = useState('Supplier shipment received');

  const categories = ['All', ...new Set(safeProducts.map(p => p.category).filter(Boolean))];

  const filteredProducts = safeProducts.filter(p => {
    const matchesSearch =
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesLowStock = onlyLowStock ? (p.stock || 0) <= (p.minStockAlert || 0) : true;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const lowStockCount = safeProducts.filter(p => (p.stock || 0) <= (p.minStockAlert || 0)).length;
  const totalItemsCount = safeProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalInventoryValuation = safeProducts.reduce(
    (acc, p) => acc + (p.costPrice || 0) * (p.stock || 0),
    0
  );

  const handleOpenStockIn = (prod: Product) => {
    setSelectedProduct(prod);
    setStockToAdd(25);
    setIsStockInOpen(true);
  };

  const handleSaveStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProduct) {
      updateProductStock(selectedProduct.id, stockToAdd, 'restock', stockInReason);
      setIsStockInOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Units in Branch</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalItemsCount.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400">
            Across {products.length} distinct SKUs
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stock Valuation (Cost)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatINR(totalInventoryValuation)}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Branch Assets</span>
        </div>

        <div
          onClick={() => setIsManagementModalOpen(true)}
          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-rose-400 dark:hover:border-rose-700 transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-rose-600 transition">
              Low Stock Warnings
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-1">
            {lowStockCount} Items
          </p>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-[11px] text-rose-500 font-medium">
              Requires restocking soon
            </span>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-600 transition">
              Manage &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Automated Low-Stock Alert Banner */}
      <LowStockAlertBanner role="manager" />

      {/* Main Stock Table & Search */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Branch Inventory: {currentBranch.name}
              </h3>
              <p className="text-xs text-slate-400">Live stock tracking & fast restocking</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="inventory-search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search SKU, name..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                onlyLowStock
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Low Stock Only
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3">SKU / Barcode</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Price</th>
                <th className="py-2.5 px-3 text-right">In Stock</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map(prod => {
                const isOut = prod.stock <= 0;
                const isLow = prod.stock <= prod.minStockAlert;

                return (
                  <tr
                    key={prod.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{prod.imageEmoji}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {prod.name}
                          </p>
                          {prod.nameTamil && (
                            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                              {prod.nameTamil}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-400">Unit: {prod.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      <div>{prod.sku}</div>
                      <div className="text-[10px] text-slate-400">{prod.barcode}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {prod.category}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-500">
                      {formatINR(prod.costPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {formatINR(prod.sellingPrice)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {prod.stock}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400">{prod.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
                          Low (&le; {prod.minStockAlert})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenStockIn(prod)}
                        className="px-2.5 py-1.5 rounded-xl bg-teal-600 text-white font-bold text-[11px] shadow-xs hover:bg-teal-700 transition inline-flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Stock In
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock In Modal */}
      {isStockInOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 flex items-center justify-center">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Stock In / Add Inventory
                  </h3>
                  <p className="text-[11px] text-slate-400">Branch: {currentBranch.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsStockInOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockIn} className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{selectedProduct.imageEmoji}</span>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {selectedProduct.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      SKU: {selectedProduct.sku} • Cost: ${selectedProduct.costPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Current:</span>
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantity to Add ({selectedProduct.unit}):
                </label>
                <input
                  type="number"
                  id="stock-in-quantity-input"
                  min="1"
                  value={stockToAdd}
                  onChange={e => setStockToAdd(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-sm text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-1.5">
                {[10, 25, 50, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setStockToAdd(val)}
                    className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes / Source / Batch:
                </label>
                <input
                  type="text"
                  value={stockInReason}
                  onChange={e => setStockInReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 flex justify-between font-semibold">
                <span>New Total Stock:</span>
                <span className="font-bold">
                  {selectedProduct.stock + stockToAdd} {selectedProduct.unit}
                </span>
              </div>

              <button
                type="submit"
                id="confirm-stock-in-button"
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition"
              >
                Confirm Stock In (+{stockToAdd} {selectedProduct.unit})
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Low-Stock Safety Threshold Management Modal */}
      <LowStockManagementModal
        isOpen={isManagementModalOpen}
        onClose={() => setIsManagementModalOpen(false)}
      />
    </div>
  );
};
