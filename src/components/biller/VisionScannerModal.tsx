import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatINR } from '../../utils/currency';
import {
  Sparkles,
  Camera,
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Scale,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface VisionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductRecognized: (product: Product, quantity: number, customPrice?: number) => void;
}

export const VisionScannerModal: React.FC<VisionScannerModalProps> = ({
  isOpen,
  onClose,
  onProductRecognized,
}) => {
  const { products } = useStore();
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [recognizedData, setRecognizedData] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1.0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCapturedImage(null);
      setRecognizedData(null);
      setSelectedProduct(null);
      setQuantity(1.0);
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
      console.warn('Camera access unavailable:', err);
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

  // Capture frame from video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) {
      // Use sample fallback if video not running
      handleAnalyzeSample('🍎', 'Red Delicious Apples');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    }
  };

  const handleAnalyzeSample = (emoji: string, sampleName: string) => {
    const matched = products.find(p => p.name.toLowerCase().includes(sampleName.toLowerCase().split(' ')[0]));
    setCapturedImage(`sample:${emoji}`);
    setAnalyzing(true);

    setTimeout(() => {
      setAnalyzing(false);
      if (matched) {
        setSelectedProduct(matched);
        setRecognizedData({
          productName: matched.name,
          category: matched.category,
          unit: matched.unit,
          suggestedPrice: matched.sellingPrice,
          confidence: 0.96,
          qualityNote: 'Fresh Grade A (Simulated AI Vision)',
          defaultQuantity: matched.unit === 'kg' ? 1.25 : 1,
        });
        setQuantity(matched.unit === 'kg' ? 1.25 : 1);
      } else {
        setRecognizedData({
          productName: sampleName,
          category: 'Produce',
          unit: 'kg',
          suggestedPrice: 2.99,
          confidence: 0.94,
          qualityNote: 'Farm Fresh Item',
          defaultQuantity: 1.0,
        });
      }
    }, 600);
  };

  const analyzeImage = async (base64Img: string) => {
    setAnalyzing(true);
    setRecognizedData(null);
    setSelectedProduct(null);

    try {
      const response = await fetch('/api/ai/recognize-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img,
          existingCatalog: products,
        }),
      });

      const data = await response.json();
      setRecognizedData(data);

      // Match with inventory
      const matched = products.find(
        p =>
          p.id === data.matchedProductId ||
          p.name.toLowerCase().includes((data.productName || '').toLowerCase().split(' ')[0])
      );

      if (matched) {
        setSelectedProduct(matched);
      }
      setQuantity(data.defaultQuantity || 1.0);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (selectedProduct) {
      onProductRecognized(selectedProduct, quantity);
      onClose();
    } else if (recognizedData) {
      // Create on-the-fly produce item if not yet in catalog
      const tempProduct: Product = {
        id: `prod-temp-${Date.now()}`,
        name: recognizedData.productName || 'Fresh Item',
        category: recognizedData.category || 'Produce',
        barcode: `AI-${Date.now().toString().slice(-6)}`,
        costPrice: Number(((recognizedData.suggestedPrice || 2.5) * 0.6).toFixed(2)),
        sellingPrice: recognizedData.suggestedPrice || 2.99,
        stock: 50,
        minStockAlert: 10,
        unit: (recognizedData.unit as any) || 'kg',
        imageEmoji: '🥬',
        branchId: 'branch-1',
        sku: `AI-PROD-${Date.now().toString().slice(-4)}`,
        isProduce: true,
      };
      onProductRecognized(tempProduct, quantity);
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  AI Product Vision Scanner
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly identifies unlabeled fruits, vegetables & produce
              </p>
            </div>
          </div>
          <button
            id="close-vision-scanner-button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          <canvas ref={canvasRef} className="hidden" />

          {/* Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner">
            {capturedImage ? (
              capturedImage.startsWith('data:') ? (
                <img
                  src={capturedImage}
                  alt="Captured produce"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="text-6xl animate-bounce">
                    {capturedImage.replace('sample:', '')}
                  </div>
                  <p className="text-xs text-teal-400 font-semibold">
                    Captured produce frame ready
                  </p>
                </div>
              )
            ) : cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Aim camera at unlabeled fresh item or test with sample buttons below
                </p>
              </div>
            )}

            {/* AI Vision Overlay Effect */}
            <div className="absolute inset-4 border border-teal-500/30 rounded-xl pointer-events-none flex items-center justify-center">
              {analyzing && (
                <div className="flex flex-col items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl backdrop-blur-xs">
                  <Sparkles className="w-6 h-6 text-teal-400 animate-spin" />
                  <span className="text-xs text-white font-medium">
                    Gemini AI Analyzing Produce...
                  </span>
                </div>
              )}
            </div>

            {/* Retake button if captured */}
            {capturedImage && (
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setRecognizedData(null);
                  setSelectedProduct(null);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs flex items-center gap-1.5 backdrop-blur-xs hover:bg-slate-900"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </button>
            )}
          </div>

          {/* Capture Trigger */}
          {!capturedImage && (
            <button
              id="capture-vision-button"
              type="button"
              onClick={handleCaptureSnapshot}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs shadow-lg shadow-teal-500/20 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Capture Photo to Identify
            </button>
          )}

          {/* Preset Test Produce Samples (For quick evaluation without physical camera items) */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              🧅 Tamil Nadu Fresh Produce Samples (One-Click AI Scan)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { emoji: '🧅', name: 'Small Onions', ta: 'சின்ன வெங்காயம்' },
                { emoji: '🍅', name: 'Naatu Thakkali', ta: 'நாட்டு தக்காளி' },
                { emoji: '🥥', name: 'Fresh Coconut', ta: 'தேங்காய்' },
                { emoji: '🍌', name: 'Poovan Bananas', ta: 'வாழைப்பழம்' },
                { emoji: '🥢', name: 'Murungakkai', ta: 'முருங்கைக்காய்' },
              ].map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAnalyzeSample(item.emoji, `${item.name} (${item.ta})`)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition text-center"
                >
                  <span className="text-xl block">{item.emoji}</span>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate mt-1">
                    {item.name}
                  </span>
                  <span className="text-[9px] text-teal-600 dark:text-teal-400 block truncate">
                    {item.ta}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Recognition Result Card */}
          {recognizedData && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-2xl">
                    {selectedProduct?.imageEmoji || '🥗'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">
                        AI IDENTIFIED
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-600">
                        {Math.round((recognizedData.confidence || 0.95) * 100)}% Confidence
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {recognizedData.productName}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {formatINR(recognizedData.suggestedPrice)} / {recognizedData.unit} • {recognizedData.qualityNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Digital Scale / Weight Quantity Selector */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/50 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <Scale className="w-4 h-4 text-teal-500" />
                    <span>Weight / Quantity ({recognizedData.unit}):</span>
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {quantity} {recognizedData.unit}
                  </span>
                </div>

                {recognizedData.unit === 'kg' ? (
                  <div className="flex items-center gap-1.5">
                    {[0.5, 1.0, 1.25, 1.5, 2.0].map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setQuantity(w)}
                        className={`flex-1 py-1 rounded-lg text-xs font-semibold transition ${
                          quantity === w
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {w} kg
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-xs">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              {/* Total Calculation & Add */}
              <button
                id="add-vision-recognized-product-button"
                onClick={handleConfirmAdd}
                className="w-full py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Add to Cart ({formatINR((recognizedData.suggestedPrice || 35.00) * quantity)})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
