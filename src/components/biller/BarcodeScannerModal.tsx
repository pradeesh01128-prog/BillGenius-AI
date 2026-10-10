import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  Camera,
  X,
  ScanLine,
  Zap,
  CheckCircle2,
  AlertCircle,
  Keyboard,
  Barcode as BarcodeIcon,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (product: Product, quantity: number) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const { products } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedProduct(null);
      setManualCode('');
      setErrorMsg('');
      setQuantity(1);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error or permission denied:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = (code: string) => {
    setErrorMsg('');
    const trimmed = code.trim();
    if (!trimmed) return;

    const matched = products.find(
      p => p.barcode === trimmed || p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      setScannedProduct(matched);
      // Play brief audio beep
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    } else {
      setErrorMsg(`No product found with barcode "${trimmed}".`);
    }
  };

  const handleConfirmAdd = () => {
    if (scannedProduct) {
      onScanSuccess(scannedProduct, quantity);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <ScanLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Barcode & QR Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point camera at barcode or select from quick list
              </p>
            </div>
          </div>
          <button
            id="close-barcode-scanner-button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View / Simulation */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs text-slate-400">
                  Camera feed standby (or use manual barcode simulator below)
                </p>
              </div>
            )}

            {/* Target Reticle */}
            <div className="absolute inset-8 border-2 border-teal-400/60 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between">
                <div className="w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                <div className="w-4 h-4 border-t-2 border-r-2 border-teal-400" />
              </div>
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-bounce" />
              <div className="flex justify-between">
                <div className="w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                <div className="w-4 h-4 border-b-2 border-r-2 border-teal-400" />
              </div>
            </div>
          </div>

          {/* Quick Barcode Simulator for Testing */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              ⚡ Quick Barcode Test Buttons (One-Click Scan)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.slice(0, 6).map(prod => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleLookup(prod.barcode)}
                  className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    <span>{prod.imageEmoji}</span>
                    <span className="truncate">{prod.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {prod.barcode}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Field */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <BarcodeIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                id="manual-barcode-input"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleLookup(manualCode);
                }}
                placeholder="Type or paste 12-digit barcode..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <button
              id="lookup-barcode-button"
              type="button"
              onClick={() => handleLookup(manualCode)}
              className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition"
            >
              Lookup
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scanned Result Card */}
          {scannedProduct && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-2xl">
                    {scannedProduct.imageEmoji}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                      MATCH FOUND
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {scannedProduct.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      ${scannedProduct.sellingPrice.toFixed(2)} / {scannedProduct.unit} • In Stock: {scannedProduct.stock}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-2 border-t border-teal-200/50 dark:border-teal-800/50">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Quantity ({scannedProduct.unit}):
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-100"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-bold text-xs">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center hover:bg-slate-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                id="add-scanned-product-button"
                onClick={handleConfirmAdd}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add to Cart (${(scannedProduct.sellingPrice * quantity).toFixed(2)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
