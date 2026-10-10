import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  FileText,
  CheckCircle,
  Table,
  Cloud,
  RefreshCw,
} from 'lucide-react';

export const ReportsExportView: React.FC = () => {
  const { bills, products, branches, triggerBase44Sync, base44Status } = useStore();
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'tax'>('sales');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isSyncingBase44, setIsSyncingBase44] = useState(false);

  const safeBills = bills || [];
  const safeProducts = products || [];
  const safeBranches = branches || [];

  // Helper to trigger CSV download
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportNotice(`Downloaded ${filename} successfully.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportSalesCSV = () => {
    let csv = 'Invoice Number,Date,Branch,Customer Name,Phone,Payment Mode,Subtotal (INR),GST (INR),Total (INR)\n';
    safeBills.forEach(b => {
      csv += `"${b.invoiceNumber}","${b.timestamp}","${b.branchName}","${b.customerName}","${b.customerPhone}","${b.paymentMode}",${b.subtotal},${b.taxAmount},${b.total}\n`;
    });
    downloadCSV(`BillGenius_TN_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportInventoryCSV = () => {
    let csv = 'Product Name,Tamil Name,SKU,Barcode,Category,Cost Price (INR),Selling Price (INR),Stock,Unit,Valuation (INR)\n';
    safeProducts.forEach(p => {
      csv += `"${p.name}","${p.nameTamil || ''}","${p.sku}","${p.barcode}","${p.category}",${p.costPrice},${p.sellingPrice},${p.stock},"${p.unit}",${(p.costPrice * p.stock).toFixed(2)}\n`;
    });
    downloadCSV(`BillGenius_TN_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handleExportTaxCSV = () => {
    let csv = 'Invoice Number,Date,GST Rate %,Taxable Amount (INR),CGST 2.5% (INR),SGST 2.5% (INR),Total GST (INR),State\n';
    safeBills.forEach(b => {
      const taxable = b.subtotal - b.discountAmount;
      const halfTax = (b.taxAmount || 0) / 2;
      csv += `"${b.invoiceNumber}","${b.timestamp}",${b.taxPercent},${taxable.toFixed(2)},${halfTax.toFixed(2)},${halfTax.toFixed(2)},${b.taxAmount.toFixed(2)},"Tamil Nadu (33)"\n`;
    });
    downloadCSV(`BillGenius_TN_GST_Report_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Data Reports & Exports
            </h3>
            <p className="text-xs text-slate-400">
              Download CSV data, Excel spreadsheets, and tax audit logs
            </p>
          </div>
        </div>

        {/* Report type tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
              reportType === 'sales'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Sales Ledger
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
              reportType === 'inventory'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Inventory Valuation
          </button>
          <button
            onClick={() => setReportType('tax')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
              reportType === 'tax'
                ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Tax Filings
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {reportType === 'sales'
              ? 'Sales & Revenue Ledger'
              : reportType === 'inventory'
              ? 'Inventory Asset Valuation'
              : 'Tax & GST Computation'}
          </h4>
          <p className="text-xs text-slate-400">
            Exporting {reportType === 'sales' ? bills.length : products.length} active records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-csv-button"
            onClick={() => {
              if (reportType === 'sales') handleExportSalesCSV();
              else if (reportType === 'inventory') handleExportInventoryCSV();
              else handleExportTaxCSV();
            }}
            className="py-2 px-3.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download .CSV
          </button>

          <button
            id="export-base44-button"
            disabled={isSyncingBase44}
            onClick={async () => {
              setIsSyncingBase44(true);
              try {
                const res = await triggerBase44Sync();
                setExportNotice(res.message);
                setTimeout(() => setExportNotice(null), 4000);
              } catch (e: any) {
                setExportNotice('Sync encounter: ' + e.message);
              } finally {
                setIsSyncingBase44(false);
              }
            }}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold text-xs shadow-md hover:from-teal-600 hover:to-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isSyncingBase44 ? 'Syncing...' : 'Sync to Base44 Cloud'}</span>
          </button>

          <button
            id="print-report-button"
            onClick={handlePrintReport}
            className="py-2 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </button>
        </div>
      </div>

      {/* Preview Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            {reportType === 'sales' && (
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-3">Invoice</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Branch</th>
                <th className="py-2 px-3">Customer</th>
                <th className="py-2 px-3">Mode</th>
                <th className="py-2 px-3 text-right">Subtotal</th>
                <th className="py-2 px-3 text-right">Total</th>
              </tr>
            )}

            {reportType === 'inventory' && (
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-3">Product</th>
                <th className="py-2 px-3">SKU</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3 text-right">Cost Price</th>
                <th className="py-2 px-3 text-right">Selling Price</th>
                <th className="py-2 px-3 text-right">Units</th>
                <th className="py-2 px-3 text-right">Asset Value</th>
              </tr>
            )}

            {reportType === 'tax' && (
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                <th className="py-2 px-3">Invoice</th>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Rate</th>
                <th className="py-2 px-3 text-right">Taxable Sales</th>
                <th className="py-2 px-3 text-right">Tax Collected</th>
              </tr>
            )}
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportType === 'sales' &&
              safeBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold">{b.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(b.timestamp).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3">{b.branchName}</td>
                  <td className="py-2.5 px-3">{b.customerName}</td>
                  <td className="py-2.5 px-3 uppercase text-[10px] font-bold">{b.paymentMode}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(b.subtotal)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-teal-600">{formatINR(b.total)}</td>
                </tr>
              ))}

            {reportType === 'inventory' &&
              safeProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-semibold">
                    <div>{p.name}</div>
                    {p.nameTamil && <div className="text-[10px] text-teal-600 dark:text-teal-400">{p.nameTamil}</div>}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{p.sku}</td>
                  <td className="py-2.5 px-3">{p.category}</td>
                  <td className="py-2.5 px-3 text-right">{formatINR(p.costPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold">{formatINR(p.sellingPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{p.stock} {p.unit}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-teal-600">
                    {formatINR((p.costPrice || 0) * (p.stock || 0))}
                  </td>
                </tr>
              ))}

            {reportType === 'tax' &&
              safeBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold">{b.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{new Date(b.timestamp).toLocaleDateString()}</td>
                  <td className="py-2.5 px-3 font-semibold">{b.taxPercent}% (TN)</td>
                  <td className="py-2.5 px-3 text-right">{formatINR((b.subtotal || 0) - (b.discountAmount || 0))}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-purple-600">{formatINR(b.taxAmount)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
