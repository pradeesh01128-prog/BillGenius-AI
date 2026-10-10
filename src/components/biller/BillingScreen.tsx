import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useStore } from '../../context/StoreContext';
import { Product, CartItem, Bill } from '../../types';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { VisionScannerModal } from './VisionScannerModal';
import { VoiceBillingWidget } from './VoiceBillingWidget';
import { ReceiptModal } from '../common/ReceiptModal';
import { ThermalReceiptModal } from '../common/ThermalReceiptModal';
import { FeedbackSubmitModal } from '../common/FeedbackSubmitModal';
import { LowStockAlertBanner } from '../common/LowStockAlertBanner';
import confetti from 'canvas-confetti';
import { formatINR } from '../../utils/currency';
import {
  parseVoiceBillingTranscript,
  speakVoiceFeedback,
} from '../../utils/voiceBillingParser';
import {
  Search,
  ScanLine,
  Camera,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  ShoppingBag,
  Percent,
  User,
  Phone,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  PackagePlus,
  Receipt,
  Check,
  Printer,
  Mic,
  MicOff,
  Volume2,
} from 'lucide-react';

export const BillingScreen: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    updateCartDiscount,
    clearCart,
    createBill,
    currentBranch,
    currentUser,
    requestStock,
    language,
    formatCurrency,
    lowStockProducts,
  } = useStore();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Modals
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState(false);
  const [thermalBill, setThermalBill] = useState<Bill | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isStockReqOpen, setIsStockReqOpen] = useState(false);
  const [stockReqProduct, setStockReqProduct] = useState<Product | null>(null);
  const [stockReqQty, setStockReqQty] = useState(20);
  const [stockReqReason, setStockReqReason] = useState('Shelf empty after rush');

  // Active Bill
  const [lastGeneratedBill, setLastGeneratedBill] = useState<Bill | null>(null);

  // Customer & Payment Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState<Bill['paymentMode']>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);
  const [billNotes, setBillNotes] = useState('');
  const [modalUpiQr, setModalUpiQr] = useState<string>('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [isSearchMicActive, setIsSearchMicActive] = useState<boolean>(false);
  const searchRecognitionRef = useRef<any>(null);

  const isTa = language === 'ta';

  const categoryList = [
    { id: 'All', label: isTa ? 'அனைத்தும்' : 'All' },
    ...(lowStockProducts.length > 0
      ? [{ id: 'LowStock', label: isTa ? `⚠️ குறைவு (${lowStockProducts.length})` : `⚠️ Low Stock (${lowStockProducts.length})` }]
      : []),
    { id: 'Produce', label: isTa ? 'காய்கறி & பழங்கள்' : 'Produce' },
    { id: 'Dairy', label: isTa ? 'பால் & நெய்' : 'Dairy' },
    { id: 'Pantry', label: isTa ? 'அரிசி & பருப்பு' : 'Pantry' },
    { id: 'Beverages', label: isTa ? 'காபி & பானங்கள்' : 'Beverages' },
    { id: 'Snacks', label: isTa ? 'தின்பண்டங்கள்' : 'Snacks' },
    { id: 'Household', label: isTa ? 'வீட்டு உபயோகம்' : 'Household' },
  ];

  const safeProducts = products || [];
  const safeCart = cart || [];

  const filteredProducts = safeProducts.filter(p => {
    const matchesCat =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'LowStock'
        ? p.stock <= p.minStockAlert
        : p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (p.name || '').toLowerCase().includes(q) ||
      (p.nameTamil || '').toLowerCase().includes(q) ||
      (p.barcode || '').includes(q) ||
      (p.sku || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Calculate totals
  const subtotal = safeCart.reduce((acc, it) => {
    const unitPrice = it.customPrice ?? it.product?.sellingPrice ?? 0;
    const lineSub = unitPrice * (it.quantity || 1);
    const lineDisc = (lineSub * (it.discountPercent || 0)) / 100;
    return acc + (lineSub - lineDisc);
  }, 0);

  const discountAmount = (subtotal * overallDiscountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxRate = currentBranch?.taxRate || 5.0;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  const changeDue = Math.max(0, cashTendered - total);

  // Generate dynamic UPI QR Code whenever total or branch changes
  useEffect(() => {
    if (total <= 0) {
      setModalUpiQr('');
      return;
    }
    let isMounted = true;
    const upiId = currentBranch?.upiId || 'billgenius.tn@okhdfcbank';
    const payeeName = encodeURIComponent(currentBranch?.name?.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 25) || 'BillGenius Supermarket');
    const orderRef = encodeURIComponent('ORD-PAYMENT');
    const upiUri = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${total.toFixed(2)}&cu=INR&tn=${orderRef}`;

    QRCode.toDataURL(upiUri, {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => {
        if (isMounted) setModalUpiQr(url);
      })
      .catch(err => console.error('Error generating UPI QR code:', err));

    return () => {
      isMounted = false;
    };
  }, [total, currentBranch?.upiId, currentBranch?.name]);

  // Keyboard shortcut listener (F2: Focus Search, F4: Voice Dictation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.getElementById('billing-product-search-input');
        searchInput?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleSearchVoiceDictation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchMicActive, isTa, products]);

  // Handle Checkout Completion
  const handleFinalCheckout = (openThermal: boolean = false) => {
    if (safeCart.length === 0) return;

    const generated = createBill({
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: safeCart,
      paymentMode,
      discountPercent: overallDiscountPercent,
      notes: billNotes,
    });

    setLastGeneratedBill(generated);
    setIsPaymentOpen(false);

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    // Reset customer fields
    setCustomerName('');
    setCustomerPhone('');
    setOverallDiscountPercent(0);
    setCashTendered(0);
    setBillNotes('');

    // Open Chosen Receipt Format
    if (openThermal) {
      setThermalBill(generated);
      setIsThermalReceiptOpen(true);
    } else {
      setIsReceiptOpen(true);
    }
  };

  const handleVoiceRecognizedItems = (
    items: { productId?: string; name: string; quantity: number }[]
  ) => {
    const addedSummaries: string[] = [];
    items.forEach(item => {
      let target: Product | undefined;
      if (item.productId) {
        target = products.find(p => p.id === item.productId);
      }
      if (!target) {
        const lower = item.name.toLowerCase().trim();
        target = products.find(p => {
          const pName = (p.name || '').toLowerCase();
          const pTamil = (p.nameTamil || '').toLowerCase();
          return (
            (pTamil && (pTamil.includes(lower) || lower.includes(pTamil))) ||
            pName.includes(lower) ||
            lower.includes(pName.split('/')[0].trim().toLowerCase())
          );
        });
      }
      if (target) {
        addToCart(target, item.quantity);
        addedSummaries.push(
          `${item.quantity}x ${target.nameTamil || target.name.split('/')[0].trim()}`
        );
      }
    });

    if (addedSummaries.length > 0) {
      setVoiceNotice(`🎤 Voice Added: ${addedSummaries.join(', ')}`);
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  const handleSearchVoiceDictation = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Demo simulated search in current language
      const sample = isTa ? 'நாட்டு தக்காளி' : 'Country Tomatoes';
      setSearchQuery(sample);
      const parsed = parseVoiceBillingTranscript(sample, products, isTa ? 'ta' : 'en');
      if (parsed.items.length > 0) {
        addToCart(parsed.items[0].product, parsed.items[0].quantity);
        setVoiceNotice(
          `🎤 Voice Added: ${parsed.items[0].quantity}x ${
            parsed.items[0].product.nameTamil || parsed.items[0].product.name.split('/')[0].trim()
          }`
        );
        speakVoiceFeedback(parsed.spokenFeedback, isTa ? 'ta' : 'en');
        setTimeout(() => setVoiceNotice(null), 4000);
      }
      return;
    }

    if (isSearchMicActive) {
      try {
        searchRecognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsSearchMicActive(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = isTa ? 'ta-IN' : 'en-IN';

    rec.onstart = () => {
      setIsSearchMicActive(true);
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript.trim()) {
        setSearchQuery(finalTranscript);
        // Automatically check if speech matches catalog and auto-add
        const parsed = parseVoiceBillingTranscript(finalTranscript, products, isTa ? 'ta' : 'en');
        if (parsed.items.length > 0) {
          parsed.items.forEach(it => {
            addToCart(it.product, it.quantity);
          });
          const summary = parsed.items
            .map(it => `${it.quantity}x ${it.product.nameTamil || it.product.name.split('/')[0].trim()}`)
            .join(', ');
          setVoiceNotice(`🎤 Voice Added: ${summary}`);
          speakVoiceFeedback(parsed.spokenFeedback, isTa ? 'ta' : 'en');
          setTimeout(() => setVoiceNotice(null), 4000);
        }
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Search voice error:', e);
      setIsSearchMicActive(false);
    };

    rec.onend = () => {
      setIsSearchMicActive(false);
    };

    searchRecognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      setIsSearchMicActive(false);
    }
  };

  const handleOpenStockRequest = (prod: Product) => {
    setStockReqProduct(prod);
    setIsStockReqOpen(true);
  };

  const submitStockRequestForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (stockReqProduct) {
      requestStock({
        productId: stockReqProduct.id,
        requestedQty: stockReqQty,
        reason: stockReqReason,
      });
      setIsStockReqOpen(false);
      alert(`Stock request for ${stockReqQty} units of ${stockReqProduct.name} sent to manager!`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Voice Billing Widget & Quick Scan Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <VoiceBillingWidget
            onItemsRecognized={handleVoiceRecognizedItems}
            onProceedCheckout={() => {
              if (cart.length > 0) setIsPaymentOpen(true);
            }}
            onClearCart={clearCart}
          />
        </div>

        {/* Quick Camera & Scanner Launchers */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
          <button
            id="open-barcode-scanner-launcher"
            onClick={() => setIsBarcodeOpen(true)}
            className="flex-1 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs hover:border-teal-500 hover:shadow-md transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition">
                <ScanLine className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Barcode Scanner
                </p>
                <p className="text-[10px] text-slate-400">Scan product bar code</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Scan</span>
          </button>

          <button
            id="open-vision-scanner-launcher"
            onClick={() => setIsVisionOpen(true)}
            className="flex-1 p-3 rounded-2xl bg-gradient-to-r from-teal-600/10 to-emerald-600/10 border border-teal-500/20 shadow-xs hover:border-teal-500 hover:shadow-md transition flex items-center justify-between group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  AI Produce Vision
                </p>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                  Identify fruits/veggies by photo
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">Auto AI</span>
          </button>
        </div>
      </div>

      {/* Automated Low-Stock Alert Banner for Cashiers & Staff */}
      <LowStockAlertBanner role="biller" />

      {/* Main Billing Grid: Catalog (Left) + Cart Summary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Product Catalog Browser */}
        <div className="lg:col-span-7 space-y-3">
          {/* Voice Success / Status Banner */}
          {voiceNotice && (
            <div className="p-3 rounded-2xl bg-teal-600 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-teal-600/20 animate-fade-in">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>{voiceNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search bar & Category tabs */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="billing-product-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  isTa
                    ? "பொருட்கள் தேட தட்டச்சு செய்யவும் அல்லது மைக் பேசவும்..."
                    : "Search products in English / தமிழ் (or tap mic to speak)..."
                }
                className="w-full pl-9 pr-16 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Voice dictation mic in search bar */}
                <button
                  type="button"
                  id="search-bar-mic-button"
                  onClick={handleSearchVoiceDictation}
                  title={
                    isSearchMicActive
                      ? "Listening... Tap to stop"
                      : "Speak product name in Tamil or English to auto-add"
                  }
                  className={`p-1.5 rounded-lg transition-all ${
                    isSearchMicActive
                      ? "bg-rose-600 text-white animate-pulse"
                      : "text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {categoryList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {feedbackNotice && (
            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-700 dark:text-teal-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-600" />
                {feedbackNotice}
              </span>
              <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No products match "{searchQuery}"</p>
              </div>
            ) : (
              filteredProducts.map(product => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock <= product.minStockAlert;
                const inCartItem = cart.find(it => it.product.id === product.id);

                return (
                  <div
                    key={product.id}
                    id={`product-card-${product.id}`}
                    className={`relative p-3 rounded-2xl bg-white dark:bg-slate-900 border transition flex flex-col justify-between group ${
                      inCartItem
                        ? 'border-teal-500 shadow-sm shadow-teal-500/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                          {product.imageEmoji}
                        </div>
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500">
                            {isTa ? 'இருப்பு இல்லை' : 'Out of Stock'}
                          </span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500">
                            {isTa ? `குறைவு (${product.stock})` : `Low (${product.stock})`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {product.stock} {product.unit}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-2 leading-tight line-clamp-2">
                        {product.name}
                      </h4>
                      {product.nameTamil && (
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate mt-0.5">
                          {product.nameTamil}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">{product.category}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {formatINR(product.sellingPrice)}
                      </span>

                      {isOutOfStock ? (
                        <button
                          onClick={() => handleOpenStockRequest(product)}
                          className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-600 text-[10px] font-bold hover:bg-rose-500/20"
                        >
                          Request Stock
                        </button>
                      ) : inCartItem ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateCartQuantity(product.id, inCartItem.quantity - 1)}
                            className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center">
                            {inCartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(product.id, inCartItem.quantity + 1)}
                            className="w-5 h-5 rounded-md bg-teal-600 text-white text-xs font-bold flex items-center justify-center hover:bg-teal-700"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(product, 1)}
                          className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 shadow-xs transition"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Cart & Fast Checkout Summary */}
        <div className="lg:col-span-5 space-y-3 sticky top-20">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Current Bill
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {cart.length} distinct item{cart.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    id="quick-thermal-slip-button"
                    type="button"
                    onClick={() => {
                      setThermalBill(null);
                      setIsThermalReceiptOpen(true);
                    }}
                    title="Print Thermal POS Receipt Slip & UPI QR"
                    className="py-1 px-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Slip</span>
                  </button>
                  <button
                    id="clear-cart-button"
                    onClick={clearCart}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 py-1 px-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <ShoppingBag className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-medium">Cart is currently empty.</p>
                  <p className="text-[11px] text-slate-400">
                    Use barcode scan, AI vision, voice, or click items to bill.
                  </p>
                </div>
              ) : (
                cart.map(item => {
                  const price = item.customPrice ?? item.product.sellingPrice;
                  const itemLineTotal = price * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 max-w-[140px] truncate">
                        <span className="text-base">{item.product.imageEmoji}</span>
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatINR(price)} / {item.product.unit}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Modifiers */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {formatINR(itemLineTotal)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Discount Selector */}
            {cart.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Percent className="w-3 h-3" /> {isTa ? 'தள்ளுபடி சேர்:' : 'Apply Bill Discount:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 5, 10, 15].map(disc => (
                      <button
                        key={disc}
                        type="button"
                        onClick={() => setOverallDiscountPercent(disc)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          overallDiscountPercent === disc
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {disc}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>{isTa ? 'மொத்த தொகை (Subtotal)' : 'Subtotal'}</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>{isTa ? `தள்ளுபடி (${overallDiscountPercent}%)` : `Discount (${overallDiscountPercent}%)`}</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>{isTa ? `வரி (GST ${taxRate}%: CGST 2.5% + SGST 2.5%)` : `GST (${taxRate}%: CGST 2.5% + SGST 2.5%)`}</span>
                <span>{formatINR(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{isTa ? 'செலுத்த வேண்டிய தொகை' : 'Total Due'}</span>
                <span className="text-teal-600 dark:text-teal-400">{formatINR(total)}</span>
              </div>
            </div>

            {/* Checkout & Thermal Slip Action Buttons */}
            <div className="space-y-2">
              <button
                id="proceed-to-payment-button"
                disabled={cart.length === 0}
                onClick={() => setIsPaymentOpen(true)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-teal-500/20 hover:opacity-95 disabled:opacity-40 disabled:hover:opacity-40 transition flex items-center justify-center gap-2"
              >
                <span>{isTa ? 'கட்டணம் செலுத்த செல்லவும்' : 'Proceed to Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {cart.length > 0 && (
                <button
                  id="preview-thermal-slip-button"
                  type="button"
                  onClick={() => {
                    setThermalBill(null);
                    setIsThermalReceiptOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-teal-500/30 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isTa ? 'தெர்மல் ரசீது & UPI QR சீட்டு' : 'Thermal Receipt Slip & UPI QR'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Complete Payment
                </h3>
                <p className="text-xs text-slate-400">
                  Select payment method and finalize customer invoice
                </p>
              </div>
              <button
                id="close-payment-modal-button"
                onClick={() => setIsPaymentOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Grand Total Header */}
              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                    {isTa ? 'செலுத்த வேண்டிய தொகை' : 'AMOUNT PAYABLE'}
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatINR(total)}
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {cart.reduce((acc, it) => acc + it.quantity, 0)} {isTa ? 'பொருட்கள்' : 'Total Units'}
                </span>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  {isTa ? 'பணம் செலுத்தும் முறையைத் தேர்ந்தெடுக்கவும்' : 'Select Payment Method'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: isTa ? 'ரொக்கம் (Cash)' : 'Cash', icon: Banknote },
                    { id: 'card', label: isTa ? 'கார்டு (Card)' : 'Card / POS', icon: CreditCard },
                    { id: 'upi', label: isTa ? 'UPI / QR' : 'UPI / QR', icon: QrCode },
                    { id: 'wallet', label: isTa ? 'வாலட்' : 'Wallet', icon: Wallet },
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = paymentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id as any)}
                        className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/20'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-teal-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-bold">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specific Payment Mode Form Inputs */}
              {paymentMode === 'cash' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {isTa ? 'பெறப்பட்ட ரொக்கம் (Cash Received):' : 'Cash Received:'}
                    </span>
                    <input
                      type="number"
                      id="cash-tendered-input"
                      value={cashTendered || ''}
                      onChange={e => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder={`Min ${formatINR(total)}`}
                      className="w-36 px-3 py-1.5 text-xs text-right rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:outline-hidden"
                    />
                  </div>

                  {/* Indian Rupee Currency Cash Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                    {[100, 200, 500, 1000, 2000].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val)}
                        className="flex-1 py-1 px-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        ₹{val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCashTendered(Math.ceil(total))}
                      className="py-1 px-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200 text-xs font-bold"
                    >
                      {isTa ? 'சரியாக' : 'Exact'}
                    </button>
                  </div>

                  {cashTendered > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-slate-500">{isTa ? 'மீதம் கொடுக்க வேண்டியது (Change):' : 'Change to Return:'}</span>
                      <span
                        className={`font-bold ${
                          changeDue >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {formatINR(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentMode === 'upi' && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-slate-800/60 border border-teal-200 dark:border-teal-800 text-center space-y-3">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 inline-block mx-auto">
                    {modalUpiQr ? (
                      <img
                        src={modalUpiQr}
                        alt="Dynamic Tamil Nadu UPI QR Code"
                        className="w-36 h-36 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center">
                        <QrCode className="w-24 h-24 text-slate-900 animate-pulse" />
                      </div>
                    )}
                    <span className="text-[9px] font-black text-teal-700 tracking-wider block mt-1 uppercase">
                      BHIM UPI • Dynamic QR
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isTa ? 'GPay / PhonePe / Paytm மூலம் ஸ்கேன் செய்து செலுத்தவும்' : 'Scan & Pay via GPay / PhonePe / Paytm / BHIM'}
                    </p>
                    <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                      VPA: {currentBranch?.upiId || 'billgenius.chennai@okhdfcbank'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                      Payable: <strong className="text-slate-900 dark:text-white font-bold">{formatINR(total)}</strong>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-teal-100 dark:border-teal-900/50 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      id="print-upi-counter-slip-button"
                      onClick={() => {
                        setThermalBill(null);
                        setIsThermalReceiptOpen(true);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-xs hover:bg-teal-700 transition flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{isTa ? 'தெர்மல் UPI சீட்டு அச்சிடு' : 'Print Thermal UPI Slip'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Details (Optional) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Customer Info (for Digital WhatsApp/SMS Bill)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="customer-name-input"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Customer Name (optional)"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      id="customer-phone-input"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="Phone / WhatsApp"
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Confirm Checkout Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  id="complete-bill-and-print-thermal-button"
                  onClick={() => handleFinalCheckout(true)}
                  className="py-3 px-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-md hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-teal-400 dark:text-teal-600" />
                  <span>{isTa ? 'முடிவு செய்து தெர்மல் சீட்டு' : 'Confirm & Thermal Slip'}</span>
                </button>

                <button
                  type="button"
                  id="complete-bill-and-print-button"
                  onClick={() => handleFinalCheckout(false)}
                  className="py-3 px-3 rounded-2xl bg-teal-600 text-white font-bold text-xs shadow-lg shadow-teal-500/25 hover:bg-teal-700 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isTa ? 'முழு இன்வாய்ஸ்' : `Confirm & Invoice (${formatINR(total)})`}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        onScanSuccess={(prod, qty) => addToCart(prod, qty)}
      />

      {/* Vision Scanner Modal */}
      <VisionScannerModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        onProductRecognized={(prod, qty, customPrice) => addToCart(prod, qty, customPrice)}
      />

      {/* Standard Receipt Modal */}
      <ReceiptModal
        bill={lastGeneratedBill}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onOpenFeedback={b => {
          setLastGeneratedBill(b);
          setIsFeedbackOpen(true);
        }}
      />

      {/* Thermal POS Receipt & UPI Slip Modal */}
      <ThermalReceiptModal
        isOpen={isThermalReceiptOpen}
        onClose={() => setIsThermalReceiptOpen(false)}
        bill={thermalBill}
        cartItems={cart}
        customerName={customerName}
        customerPhone={customerPhone}
        overallDiscountPercent={overallDiscountPercent}
        cashierName={currentUser?.name}
        onProceedPayment={() => {
          setIsThermalReceiptOpen(false);
          setIsPaymentOpen(true);
        }}
      />

      {/* Feedback Modal */}
      <FeedbackSubmitModal
        bill={lastGeneratedBill}
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Stock Request Modal for Biller */}
      {isStockReqOpen && stockReqProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Request Stock Restock
                </h3>
              </div>
              <button
                onClick={() => setIsStockReqOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitStockRequestForm} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {stockReqProduct.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Current Stock: {stockReqProduct.stock} {stockReqProduct.unit}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Requested Quantity ({stockReqProduct.unit}):
                </label>
                <input
                  type="number"
                  value={stockReqQty}
                  onChange={e => setStockReqQty(parseInt(e.target.value) || 1)}
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Reason for Urgency:
                </label>
                <textarea
                  rows={2}
                  value={stockReqReason}
                  onChange={e => setStockReqReason(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700"
              >
                Send Request to Branch Manager
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
