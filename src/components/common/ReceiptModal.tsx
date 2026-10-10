import React, { useState } from 'react';
import { Bill } from '../../types';
import { formatINR } from '../../utils/currency';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import {
  Printer,
  Download,
  Share2,
  Send,
  MessageCircle,
  Mail,
  Check,
  X,
  Star,
  QrCode,
  CheckCircle2,
} from 'lucide-react';

interface ReceiptModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback?: (bill: Bill) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  bill,
  isOpen,
  onClose,
  onOpenFeedback,
}) => {
  const [shareFeedbackSent, setShareFeedbackSent] = useState<string | null>(null);
  const [isThermalOpen, setIsThermalOpen] = useState(false);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const halfTaxRate = (bill.taxPercent || 5.0) / 2;
  const halfTaxAmount = (bill.taxAmount || 0) / 2;

  const generateWhatsAppMessage = () => {
    const itemsList = bill.items
      .map(
        it =>
          `• ${it.product.name} x ${it.quantity} = ${formatINR(
            (it.customPrice ?? it.product.sellingPrice) * it.quantity
          )}`
      )
      .join('%0A');

    const msg = `🧾 *BillGenius AI — Tax Invoice*%0A*Invoice:* ${bill.invoiceNumber}%0A*Store:* ${bill.branchName}%0A*GSTIN:* 33AAAAA1234A1Z5 (Tamil Nadu)%0A*Date:* ${new Date(
      bill.timestamp
    ).toLocaleString()}%0A%0A*Items:*%0A${itemsList}%0A%0A*Subtotal:* ${formatINR(bill.subtotal)}%0A*CGST (${halfTaxRate}%):* ${formatINR(halfTaxAmount)}%0A*SGST (${halfTaxRate}%):* ${formatINR(halfTaxAmount)}%0A*Total Paid:* *${formatINR(bill.total)}* via ${bill.paymentMode.toUpperCase()}%0A%0A*நன்றி! மீண்டும் வருக!*%0A(Thank you for shopping with us!)`;

    const phone = bill.customerPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const url = `https://wa.me/${phone ? cleanPhone : ''}?text=${msg}`;
    window.open(url, '_blank');
    setShareFeedbackSent('WhatsApp share link opened!');
  };

  const handleShareSMS = () => {
    setShareFeedbackSent(`SMS sent to ${bill.customerPhone || 'customer'} with Tamil Nadu e-bill link.`);
  };

  const handleShareEmail = () => {
    setShareFeedbackSent('E-Receipt delivered to customer inbox.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              GST Tax Invoice Generated Successfully
            </h3>
          </div>
          <button
            id="close-receipt-modal-button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 flex justify-center">
          <div
            id="printable-receipt"
            className="w-full max-w-sm bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 font-mono text-xs space-y-4 text-slate-800 dark:text-slate-200"
          >
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
              <h2 className="font-extrabold text-base tracking-tight font-sans text-slate-900 dark:text-white">
                BILLGENIUS SUPERMARKET
              </h2>
              <p className="text-[11px] text-teal-700 dark:text-teal-400 font-sans font-bold">
                {bill.branchName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                GSTIN: 33AAAAA1234A1Z5 • State Code: 33 (TN)
              </p>
              <p className="text-[10px] text-slate-400">Phone / WhatsApp: +91 94440 12345</p>
              <div className="pt-2 text-[10px] text-slate-500 flex justify-between">
                <span>Inv: {bill.invoiceNumber}</span>
                <span>{new Date(bill.timestamp).toLocaleDateString()}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between">
                <span>Cashier: {bill.billerName.split(' ')[0]}</span>
                <span>{new Date(bill.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Customer Details */}
            {bill.customerName && bill.customerName !== 'Walk-in Customer' && (
              <div className="text-[10px] text-slate-500 flex justify-between py-1 border-b border-dashed border-slate-200 dark:border-slate-800">
                <span>Customer: {bill.customerName}</span>
                <span>{bill.customerPhone}</span>
              </div>
            )}

            {/* Items Table */}
            <div className="space-y-2 py-1">
              <div className="flex justify-between font-bold text-[11px] pb-1 border-b border-slate-200 dark:border-slate-800">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              {bill.items.map((item, idx) => {
                const price = item.customPrice ?? item.product.sellingPrice;
                const totalLine = price * item.quantity;
                return (
                  <div key={idx} className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <div className="max-w-[140px] truncate">
                        <span className="font-medium">{item.product.name}</span>
                      </div>
                      <span className="text-slate-500">
                        {item.quantity} {item.product.unit} @ {formatINR(price)}
                      </span>
                      <span className="font-semibold">{formatINR(totalLine)}</span>
                    </div>
                    {item.product.nameTamil && (
                      <p className="text-[9px] text-slate-400 font-sans truncate">
                        {item.product.nameTamil}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Taxable Subtotal:</span>
                <span>{formatINR(bill.subtotal)}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount ({bill.discountPercent}%):</span>
                  <span>-{formatINR(bill.discountAmount)}</span>
                </div>
              )}
              {/* GST split */}
              <div className="flex justify-between text-slate-500">
                <span>CGST ({halfTaxRate}%):</span>
                <span>{formatINR(halfTaxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST - Tamil Nadu ({halfTaxRate}%):</span>
                <span>{formatINR(halfTaxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                <span>TOTAL PAID:</span>
                <span className="text-teal-600 dark:text-teal-400">{formatINR(bill.total)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                <span>Payment Mode:</span>
                <span className="uppercase font-semibold">{bill.paymentMode} ({bill.paymentRef || 'APPROVED'})</span>
              </div>
            </div>

            {/* Barcode & QR Code simulation */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              {/* Barcode bars */}
              <div className="flex justify-center items-center gap-[2px] h-8 py-1">
                {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 3, 1].map((w, i) => (
                  <div
                    key={i}
                    style={{ width: `${w}px` }}
                    className="h-full bg-slate-900 dark:bg-slate-100"
                  />
                ))}
              </div>
              <p className="text-[9px] tracking-widest text-slate-400 font-mono">
                {bill.invoiceNumber}
              </p>
              <div className="space-y-0.5 pt-1">
                <p className="text-xs font-bold font-sans text-teal-700 dark:text-teal-400">
                  *** நன்றி! மீண்டும் வருக! ***
                </p>
                <p className="text-[10px] text-slate-500 font-sans italic">
                  Thank you for your business! Scan to rate your experience.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls & Share Buttons (Hidden during window.print()) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 print:hidden">
          {shareFeedbackSent && (
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-xs text-emerald-600 dark:text-emerald-400 text-center font-medium flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{shareFeedbackSent}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              id="print-thermal-from-receipt-button"
              onClick={() => setIsThermalOpen(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              Thermal Slip
            </button>

            <button
              id="print-invoice-button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              A4 / Print
            </button>

            <button
              id="whatsapp-share-button"
              onClick={generateWhatsAppMessage}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </button>

            <button
              id="sms-share-button"
              onClick={handleShareSMS}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              SMS Bill
            </button>

            <button
              id="email-share-button"
              onClick={handleShareEmail}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 transition flex items-center justify-center gap-1.5"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          {onOpenFeedback && (
            <button
              onClick={() => {
                onClose();
                onOpenFeedback(bill);
              }}
              className="w-full py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Star className="w-3.5 h-3.5" />
              Collect Customer Feedback for this Bill
            </button>
          )}
        </div>
      </div>

      {/* Embedded Thermal Modal */}
      <ThermalReceiptModal
        isOpen={isThermalOpen}
        onClose={() => setIsThermalOpen(false)}
        bill={bill}
      />
    </div>
  );
};
