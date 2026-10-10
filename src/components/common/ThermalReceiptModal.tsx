import React, { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../../context/StoreContext';
import { Bill, CartItem, StoreBranch } from '../../types';
import { formatINR } from '../../utils/currency';
import { generateBase44InvoicePayload } from '../../utils/base44Encoding';
import {
  Printer,
  QrCode,
  Download,
  Share2,
  Copy,
  Check,
  X,
  CreditCard,
  MessageCircle,
  ExternalLink,
  Receipt,
  Sparkles,
  Smartphone,
  SlidersHorizontal,
} from 'lucide-react';

export interface ThermalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Pass either an existing Bill OR current cart items
  bill?: Bill | null;
  cartItems?: CartItem[];
  customerName?: string;
  customerPhone?: string;
  overallDiscountPercent?: number;
  cashierName?: string;
  orderNumber?: string;
  onProceedPayment?: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  cartItems,
  customerName: propCustomerName,
  customerPhone: propCustomerPhone,
  overallDiscountPercent = 0,
  cashierName: propCashierName,
  orderNumber: propOrderNumber,
  onProceedPayment,
}) => {
  const { currentBranch, currentUser, language } = useStore();
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedEscPos, setCopiedEscPos] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showRawEscPos, setShowRawEscPos] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Stable draft order ID so it does not recalculate on every render
  const fallbackOrderIdRef = useRef<string>('');
  if (!fallbackOrderIdRef.current) {
    fallbackOrderIdRef.current = `ORD-TN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Refresh reference only when modal closes
  useEffect(() => {
    if (!isOpen) {
      fallbackOrderIdRef.current = `ORD-TN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
      setQrDataUrl('');
    }
  }, [isOpen]);

  const isTa = language === 'ta';

  // Determine items and totals
  const isFinalizedBill = Boolean(bill);
  const items = isFinalizedBill
    ? bill!.items
    : cartItems || [];

  const invoiceNumber = isFinalizedBill
    ? bill!.invoiceNumber
    : propOrderNumber || fallbackOrderIdRef.current;

  const customerName = isFinalizedBill
    ? bill!.customerName
    : propCustomerName || 'Walk-in Customer';

  const customerPhone = isFinalizedBill
    ? bill!.customerPhone
    : propCustomerPhone || '';

  const cashierName = isFinalizedBill
    ? bill!.billerName
    : propCashierName || currentUser?.name || 'Staff Biller';

  const branch: StoreBranch = isFinalizedBill
    ? {
        id: bill!.branchId,
        name: bill!.branchName,
        location: currentBranch?.location || 'Tamil Nadu, India',
        managerId: '',
        managerName: '',
        contactPhone: currentBranch?.contactPhone || '+91 94440 12345',
        taxRate: bill!.taxPercent || 5.0,
        currency: '₹',
        active: true,
        gstin: currentBranch?.gstin || '33AAAAA1234A1Z5',
        city: currentBranch?.city || 'Chennai',
        state: 'Tamil Nadu',
        upiId: currentBranch?.upiId || 'billgenius.tn@okhdfcbank',
      }
    : currentBranch || {
        id: 'branch-1',
        name: 'Chennai - T. Nagar Flagship',
        location: '45 Ranganathan Street, T. Nagar, Chennai, Tamil Nadu 600017',
        managerId: '',
        managerName: '',
        contactPhone: '+91 94440 12345',
        taxRate: 5.0,
        currency: '₹',
        active: true,
        gstin: '33AAAAA1234A1Z5',
        city: 'Chennai',
        state: 'Tamil Nadu',
        upiId: 'billgenius.chennai@okhdfcbank',
      };

  const branchUpiId = branch.upiId || 'billgenius.tn@okhdfcbank';

  // Subtotal & calculation
  const subtotal = isFinalizedBill
    ? bill!.subtotal
    : items.reduce((acc, it) => {
        const price = it.customPrice ?? it.product?.sellingPrice ?? 0;
        const line = price * it.quantity;
        const disc = (line * (it.discountPercent || 0)) / 100;
        return acc + (line - disc);
      }, 0);

  const discountAmount = isFinalizedBill
    ? bill!.discountAmount || 0
    : (subtotal * overallDiscountPercent) / 100;

  const taxableAmount = subtotal - discountAmount;
  const taxRate = isFinalizedBill ? bill!.taxPercent : branch.taxRate || 5.0;
  const taxAmount = isFinalizedBill ? bill!.taxAmount : (taxableAmount * taxRate) / 100;
  const rawTotal = taxableAmount + taxAmount;
  const total = isFinalizedBill ? bill!.total : Math.round(rawTotal * 100) / 100;
  const roundOff = Math.round((Math.round(total) - total) * 100) / 100;
  const finalPayable = Math.round(total);

  const halfTaxRate = taxRate / 2;
  const halfTaxAmount = taxAmount / 2;

  const totalUnits = items.reduce((acc, it) => acc + it.quantity, 0);

  // Derive stable NPCI UPI URI specifications
  const branchName = branch.name || 'BillGenius Supermarket';
  const upiUrl = useMemo(() => {
    const payeeName = encodeURIComponent(branchName.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25) || 'BillGenius Supermarket');
    const transactionNote = encodeURIComponent(`Bill ${invoiceNumber}`);
    const amountStr = Math.max(0, finalPayable).toFixed(2);
    return `upi://pay?pa=${branchUpiId}&pn=${payeeName}&am=${amountStr}&cu=INR&tn=${transactionNote}&mode=02&purpose=00&orgid=189999`;
  }, [branchName, invoiceNumber, finalPayable, branchUpiId]);

  // Generate UPI QR Code Data URL asynchronously without re-render loop
  useEffect(() => {
    if (!isOpen || !upiUrl || finalPayable <= 0) {
      setQrDataUrl('');
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(upiUrl, {
      width: paperWidth === '80mm' ? 180 : 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        if (isMounted) {
          setQrDataUrl(url);
        }
      })
      .catch(err => {
        console.error('Failed to generate UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, upiUrl, paperWidth, finalPayable]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateEscPosText = () => {
    const is80 = paperWidth === '80mm';
    const divider = is80
      ? '------------------------------------------------'
      : '--------------------------------';

    const center = (text: string) => {
      const len = is80 ? 48 : 32;
      const pad = Math.max(0, Math.floor((len - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    let esc = '';
    esc += center('BILLGENIUS SUPERMARKET') + '\n';
    esc += center(branch.name) + '\n';
    esc += center(branch.location.slice(0, is80 ? 48 : 32)) + '\n';
    esc += center(`GSTIN: ${branch.gstin || '33AAAAA1234A1Z5'} (TN-33)`) + '\n';
    esc += center(`Phone: ${branch.contactPhone}`) + '\n';
    esc += divider + '\n';
    esc += center(isFinalizedBill ? '*** TAX INVOICE (GST) ***' : '*** COUNTER ORDER & UPI PRE-BILL ***') + '\n';
    esc += `Order/Inv: ${invoiceNumber}\n`;
    esc += `Date: ${new Date().toLocaleString('en-IN')}\n`;
    esc += `Cashier: ${cashierName.split(' ')[0]} | Terminal 1\n`;
    if (customerName && customerName !== 'Walk-in Customer') {
      esc += `Customer: ${customerName} ${customerPhone ? `(${customerPhone})` : ''}\n`;
    }
    esc += divider + '\n';
    esc += is80
      ? 'ITEM                     QTY x RATE       AMOUNT\n'
      : 'ITEM           QTYxRATE   AMOUNT\n';
    esc += divider + '\n';

    items.forEach(it => {
      const price = it.customPrice ?? it.product?.sellingPrice ?? 0;
      const lineTotal = price * it.quantity;
      const name = it.product?.name?.slice(0, is80 ? 22 : 14) || 'Item';
      const qtyRate = `${it.quantity}${it.product?.unit || 'u'}x${price}`;
      const amt = `${lineTotal.toFixed(2)}`;
      esc += `${name.padEnd(is80 ? 24 : 14)} ${qtyRate.padEnd(is80 ? 14 : 10)} ${amt.padStart(7)}\n`;
      if (it.product?.nameTamil) {
        esc += ` (${it.product.nameTamil})\n`;
      }
    });

    esc += divider + '\n';
    esc += `Total Items: ${items.length} (${totalUnits} Units)\n`;
    esc += `Taxable Subtotal:                INR ${subtotal.toFixed(2)}\n`;
    if (discountAmount > 0) {
      esc += `Discount:                       -INR ${discountAmount.toFixed(2)}\n`;
    }
    esc += `CGST (${halfTaxRate.toFixed(1)}%):                  INR ${halfTaxAmount.toFixed(2)}\n`;
    esc += `SGST - Tamil Nadu (${halfTaxRate.toFixed(1)}%):      INR ${halfTaxAmount.toFixed(2)}\n`;
    if (roundOff !== 0) {
      esc += `Round off:                       INR ${roundOff > 0 ? `+${roundOff}` : roundOff}\n`;
    }
    esc += divider + '\n';
    esc += `NET AMOUNT PAYABLE:              INR ${finalPayable.toFixed(2)}\n`;
    esc += divider + '\n';
    esc += center('[UPI QR CODE - NPCI]') + '\n';
    esc += center(`VPA: ${branchUpiId}`) + '\n';
    esc += center('Scan with GPay / PhonePe / Paytm / BHIM') + '\n';
    esc += center('UPI வழியாக செலுத்த ஸ்கேன் செய்யவும்') + '\n';
    esc += divider + '\n';
    esc += center('*** நன்றி! மீண்டும் வருக! ***') + '\n';
    esc += center('Thank You! Visit Again') + '\n';
    esc += center('--- ✂ Cut Here ✂ ---') + '\n';

    return esc;
  };

  const handleCopyRawEscPos = () => {
    const esc = generateEscPosText();
    navigator.clipboard.writeText(esc);
    setCopiedEscPos(true);
    setTimeout(() => setCopiedEscPos(false), 2500);
  };

  const handleDownloadEscPos = () => {
    const esc = generateEscPosText();
    const blob = new Blob([esc], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thermal-slip-${invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShareWhatsApp = () => {
    const itemsList = items
      .map(
        it =>
          `• ${it.product?.name} x ${it.quantity} = ${formatINR(
            (it.customPrice ?? it.product?.sellingPrice ?? 0) * it.quantity
          )}`
      )
      .join('%0A');

    const msg = `🧾 *BILLGENIUS SUPERMARKET — THERMAL RECEIPT*%0A*Store:* ${branch.name}%0A*GSTIN:* ${branch.gstin || '33AAAAA1234A1Z5'} (Tamil Nadu)%0A*Invoice:* ${invoiceNumber}%0A*Date:* ${new Date().toLocaleString()}%0A%0A*Items:*%0A${itemsList}%0A%0A*Subtotal:* ${formatINR(subtotal)}%0A*CGST (${halfTaxRate}%):* ${formatINR(halfTaxAmount)}%0A*SGST (${halfTaxRate}%):* ${formatINR(halfTaxAmount)}%0A*Grand Total:* *${formatINR(finalPayable)}*%0A%0A📲 *Pay via UPI:*%0A${branchUpiId}%0A%0A*நன்றி! மீண்டும் வருக!* (Thank You!)`;

    const phone = customerPhone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
    const url = `https://wa.me/${phone ? cleanPhone : ''}?text=${msg}`;
    window.open(url, '_blank');
  };

  const handleCopyUpiLink = () => {
    navigator.clipboard.writeText(upiUrl);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Thermal POS Receipt & UPI Slip
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                  Tamil Nadu GST (33)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Optimized for 80mm / 58mm thermal printers with dynamic BHIM UPI QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Size Switcher */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-700/80 p-0.5 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '80mm'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                80mm (Standard)
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  paperWidth === '58mm'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                58mm (Mobile)
              </button>
            </div>

            <button
              id="close-thermal-modal-button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Thermal Paper Preview */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            id="printable-thermal-slip"
            ref={receiptRef}
            style={{
              width: paperWidth === '80mm' ? '330px' : '260px',
              maxWidth: '100%',
            }}
            className={`bg-white text-slate-900 p-5 rounded-2xl shadow-md border border-slate-300 font-mono text-[11px] leading-relaxed transition-all paper-${paperWidth}`}
          >
            {/* Thermal Print Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <h2 className="font-extrabold text-base tracking-tight font-sans text-slate-950 uppercase">
                BILLGENIUS SUPERMARKET
              </h2>
              <p className="text-[11px] font-bold text-slate-800">
                {branch.name}
              </p>
              <p className="text-[10px] text-slate-600 leading-tight">
                {branch.location}
              </p>
              <div className="pt-1 text-[10px] text-slate-700 font-bold space-y-0.5">
                <p>GSTIN: {branch.gstin || '33AAAAA1234A1Z5'} • State: 33 (TN)</p>
                <p>FSSAI Lic No: 12423008000456</p>
                <p>Phone / WhatsApp: {branch.contactPhone}</p>
              </div>

              {/* Order / Slip Type Badge */}
              <div className="pt-2">
                <span className="inline-block px-2 py-0.5 border border-dashed border-slate-700 text-[10px] font-bold uppercase">
                  {isFinalizedBill ? 'GST TAX INVOICE' : 'COUNTER ORDER & UPI SLIP'}
                </span>
              </div>

              {/* Meta lines */}
              <div className="pt-2 text-[10px] text-slate-600 flex justify-between">
                <span>Ref: {invoiceNumber}</span>
                <span>{new Date().toLocaleDateString('en-IN')}</span>
              </div>
              <div className="text-[10px] text-slate-600 flex justify-between">
                <span>Cashier: {cashierName.split(' ')[0]}</span>
                <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {customerName && customerName !== 'Walk-in Customer' && (
                <div className="text-[10px] text-slate-700 flex justify-between pt-0.5 border-t border-dotted border-slate-300">
                  <span className="truncate max-w-[150px]">Customer: {customerName}</span>
                  <span>{customerPhone}</span>
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="py-2 space-y-1.5">
              <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-dashed border-slate-400 uppercase">
                <span className="w-1/2">Item Description</span>
                <span className="text-center w-1/4">Qty x Rate</span>
                <span className="text-right w-1/4">Amount</span>
              </div>

              {items.length === 0 ? (
                <p className="text-center text-slate-400 py-3 italic">No items currently in order.</p>
              ) : (
                items.map((item, idx) => {
                  const price = item.customPrice ?? item.product?.sellingPrice ?? 0;
                  const itemLineTotal = price * item.quantity;
                  const disc = item.discountPercent || 0;

                  return (
                    <div key={idx} className="border-b border-dotted border-slate-200 pb-1 text-[11px]">
                      <div className="flex justify-between items-start">
                        <div className="w-1/2 pr-1">
                          <p className="font-bold text-slate-950 leading-tight">
                            {item.product?.name || 'Retail Item'}
                          </p>
                          {item.product?.nameTamil && (
                            <p className="text-[9px] text-slate-600 font-sans leading-tight">
                              {item.product.nameTamil}
                            </p>
                          )}
                        </div>
                        <div className="w-1/4 text-center text-[10px] text-slate-600">
                          {item.quantity} {item.product?.unit || 'u'} x {price}
                          {disc > 0 && <span className="block text-[9px] text-emerald-700">(-{disc}%)</span>}
                        </div>
                        <div className="w-1/4 text-right font-bold text-slate-950">
                          ₹{itemLineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Financial Totals & Tamil Nadu GST Breakdown */}
            <div className="pt-2 border-t border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Total Items:</span>
                <span>{items.length} items ({totalUnits} units)</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Taxable Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Bill Discount:</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}

              {/* Tamil Nadu GST split */}
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>CGST ({halfTaxRate.toFixed(1)}%):</span>
                <span>{formatINR(halfTaxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 text-[10px]">
                <span>SGST - Tamil Nadu ({halfTaxRate.toFixed(1)}%):</span>
                <span>{formatINR(halfTaxAmount)}</span>
              </div>

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Round off:</span>
                  <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between font-extrabold text-sm pt-1.5 border-t border-slate-900 text-slate-950">
                <span>NET TOTAL DUE:</span>
                <span>{formatINR(finalPayable)}</span>
              </div>
            </div>

            {/* Dynamic UPI Payment QR Code Section */}
            <div className="pt-3 border-t border-dashed border-slate-400 text-center space-y-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-400 inline-block mx-auto">
                <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block mb-1">
                  BHIM UPI • SCAN TO PAY
                </span>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Scan UPI QR to Pay in Tamil Nadu"
                    className="w-36 h-36 mx-auto bg-white p-1 rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-36 h-36 mx-auto bg-white flex items-center justify-center border border-slate-200">
                    <QrCode className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <div className="pt-1 text-[9px] font-mono text-slate-700">
                  <p className="font-bold truncate max-w-[200px]">{branchUpiId}</p>
                  <p className="font-bold text-slate-900 text-[10px] mt-0.5">Amount: {formatINR(finalPayable)}</p>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-800">
                  GPay • PhonePe • Paytm • BHIM • Cred
                </p>
                <p className="text-[9px] text-slate-600 font-sans">
                  {isTa
                    ? 'எந்தவொரு UPI ஆப் மூலமும் ஸ்கேன் செய்து உடனடியாக செலுத்தலாம்'
                    : 'Scan with any UPI App to complete payment instantly'}
                </p>
              </div>

              {/* Barcode Strip */}
              <div className="pt-2">
                <div className="flex justify-center items-center gap-[2px] h-7 py-0.5">
                  {[2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3].map((w, i) => (
                    <div
                      key={i}
                      style={{ width: `${w}px` }}
                      className="h-full bg-slate-900"
                    />
                  ))}
                </div>
                <span className="text-[8px] tracking-widest text-slate-500 font-mono block">
                  *{invoiceNumber}*
                </span>
              </div>

              {/* Base44 Cloud Verification Payload */}
              <div className="pt-1.5 pb-1">
                <div className="flex items-center justify-between text-[8px] font-mono text-slate-600 border border-slate-300 bg-slate-50 px-1.5 py-0.5 rounded">
                  <span className="font-bold">BASE44 SECURE TOKEN:</span>
                  <span className="truncate max-w-[130px] font-bold text-slate-800">
                    {bill ? generateBase44InvoicePayload(bill) : `B44*${invoiceNumber}*${finalPayable}*OK`}
                  </span>
                </div>
              </div>

              {/* Footer Greetings */}
              <div className="pt-2 space-y-0.5 border-t border-dotted border-slate-300">
                <p className="text-xs font-bold font-sans text-slate-950">
                  *** நன்றி! மீண்டும் வருக! ***
                </p>
                <p className="text-[10px] text-slate-600 font-sans italic">
                  Thank You for Shopping with Us!
                </p>
                <p className="text-[8px] text-slate-500 leading-tight">
                  Returns accepted within 3 days with original bill & barcode.
                </p>
                <p className="text-[9px] text-slate-400 font-mono pt-1">
                  --- ✂ Cut Here ✂ ---
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Controls (Hidden during print) */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 print:hidden">
          {/* Quick status bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                UPI VPA:
              </span>
              <code className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold text-[11px]">
                {branchUpiId}
              </code>
              <button
                type="button"
                onClick={handleCopyUpiLink}
                className="text-[11px] text-slate-500 hover:text-teal-600 flex items-center gap-1"
                title="Copy UPI Deep Link"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUpi ? 'Copied Link' : 'Copy UPI'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRawEscPos(!showRawEscPos)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-teal-600 flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{showRawEscPos ? 'Hide ESC/POS Text' : 'View ESC/POS Raw Text'}</span>
              </button>
            </div>
          </div>

          {/* Raw ESC/POS Text Drawer */}
          {showRawEscPos && (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[11px] text-slate-600 dark:text-slate-300">
                  Raw ESC/POS Thermal Commands ({paperWidth})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDownloadEscPos}
                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px] flex items-center gap-1 hover:bg-slate-300 transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Save .txt</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyRawEscPos}
                    className="px-2 py-1 rounded-lg bg-teal-600 text-white font-bold text-[10px] flex items-center gap-1 hover:bg-teal-700 transition"
                  >
                    {copiedEscPos ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedEscPos ? 'Copied' : 'Copy Commands'}</span>
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                Compatible with Bluetooth/USB ESC/POS receipt printers (TVS-E, NGX, Everycom, Epson, Posiflex).
              </p>
            </div>
          )}

          {/* Current Order Quick Checkout Bar (if viewing cart pre-bill) */}
          {onProceedPayment && !isFinalizedBill && items.length > 0 && (
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
              <div className="text-xs">
                <span className="font-bold text-teal-800 dark:text-teal-300">Customer Scanned & Ready?</span>
                <p className="text-[10px] text-teal-600 dark:text-teal-400">Proceed to complete transaction and finalize GST invoice</p>
              </div>
              <button
                type="button"
                id="thermal-proceed-payment-button"
                onClick={onProceedPayment}
                className="py-1.5 px-3 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs hover:bg-teal-700 transition flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Checkout ({formatINR(finalPayable)})</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              id="print-thermal-receipt-button"
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            <button
              id="thermal-whatsapp-share-button"
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <a
              id="open-upi-app-button"
              href={upiUrl}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay via UPI</span>
            </a>

            <button
              id="download-thermal-slip-button"
              type="button"
              onClick={handleDownloadEscPos}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Save .txt</span>
            </button>

            <button
              id="copy-escpos-button"
              type="button"
              onClick={handleCopyRawEscPos}
              className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
            >
              {copiedEscPos ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
