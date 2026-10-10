import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  Sparkles,
  Barcode,
} from 'lucide-react';

export const ProductCatalogEditor: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, currentBranch } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [nameTamil, setNameTamil] = useState('');
  const [category, setCategory] = useState('Produce');
  const [barcode, setBarcode] = useState('');
  const [sku, setSku] = useState('');
  const [costPrice, setCostPrice] = useState(40);
  const [sellingPrice, setSellingPrice] = useState(60);
  const [stock, setStock] = useState(50);
  const [minStockAlert, setMinStockAlert] = useState(10);
  const [unit, setUnit] = useState<Product['unit']>('pcs');
  const [imageEmoji, setImageEmoji] = useState('📦');
  const [isProduce, setIsProduce] = useState(false);

  const categories = [
    'Produce',
    'Dairy',
    'Bakery',
    'Beverages',
    'Pantry',
    'Snacks',
    'Household',
    'Meat & Seafood',
    'Frozen Foods',
  ];

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setName('');
    setNameTamil('');
    setCategory('Produce');
    const randomCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(randomCode);
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setCostPrice(40);
    setSellingPrice(60);
    setStock(50);
    setMinStockAlert(10);
    setUnit('pcs');
    setImageEmoji('📦');
    setIsProduce(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setNameTamil(prod.nameTamil || '');
    setCategory(prod.category);
    setBarcode(prod.barcode);
    setSku(prod.sku);
    setCostPrice(prod.costPrice);
    setSellingPrice(prod.sellingPrice);
    setStock(prod.stock);
    setMinStockAlert(prod.minStockAlert);
    setUnit(prod.unit);
    setImageEmoji(prod.imageEmoji);
    setIsProduce(!!prod.isProduce);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name,
        nameTamil: nameTamil || undefined,
        category,
        barcode,
        sku,
        costPrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
        imageEmoji,
        isProduce,
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name,
        nameTamil: nameTamil || undefined,
        category,
        barcode,
        sku,
        costPrice,
        sellingPrice,
        stock,
        minStockAlert,
        unit,
        imageEmoji,
        branchId: currentBranch.id,
        isProduce,
      };
      addProduct(newProd);
    }
    setIsModalOpen(false);
  };

  const safeProducts = products || [];

  const filteredProducts = safeProducts.filter(
    p =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Product Master Catalog
            </h3>
            <p className="text-xs text-slate-400">
              Manage items, prices, barcodes, and profit margins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="catalog-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search catalog..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
            />
          </div>

          <button
            id="add-new-product-button"
            onClick={handleOpenAdd}
            className="py-1.5 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs hover:bg-teal-700 transition flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProducts.map(prod => {
          const margin = (((prod.sellingPrice - prod.costPrice) / prod.sellingPrice) * 100).toFixed(0);

          return (
            <div
              key={prod.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
                    {prod.imageEmoji}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    {margin}% Margin
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2 truncate">
                  {prod.name}
                </h4>
                {prod.nameTamil && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate">
                    {prod.nameTamil}
                  </p>
                )}
                <p className="text-[10px] text-slate-400">
                  {prod.category} • SKU: {prod.sku}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Code: {prod.barcode}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">
                    Cost: {formatINR(prod.costPrice)}
                  </span>
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {formatINR(prod.sellingPrice)} / {prod.unit}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    title="Edit Product"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete product ${prod.name}?`)) {
                        deleteProduct(prod.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Product Name (English):
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Ponni Boiled Rice"
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Icon / Emoji:
                  </label>
                  <input
                    type="text"
                    value={imageEmoji}
                    onChange={e => setImageEmoji(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tamil Name / தமிழ் பெயர் (Optional):
                </label>
                <input
                  type="text"
                  value={nameTamil}
                  onChange={e => setNameTamil(e.target.value)}
                  placeholder="e.g. பொன்னி புழுங்கல் அரிசி"
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Measurement Unit:
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value as any)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="pcs">pcs (Piece)</option>
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="liter">liter (Liter)</option>
                    <option value="pack">pack (Packet)</option>
                    <option value="box">box (Box)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Barcode / EAN:
                  </label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    SKU Code:
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Supplier Cost (₹ INR):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={costPrice}
                    onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Selling Price (₹ INR):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sellingPrice}
                    onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Stock ({unit}):
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={e => setStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Min Stock Alert Threshold:
                  </label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProduce}
                  onChange={e => setIsProduce(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Enable AI Vision Produce Recognition (Unlabeled fresh fruit/vegetable)
                </span>
              </label>

              <button
                type="submit"
                id="save-product-catalog-button"
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition"
              >
                {editingProduct ? 'Save Product Changes' : 'Create Product SKU'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
