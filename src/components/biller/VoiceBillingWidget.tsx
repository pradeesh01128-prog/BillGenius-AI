import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  parseVoiceBillingTranscript,
  speakVoiceFeedback,
  RecognizedVoiceItem,
} from '../../utils/voiceBillingParser';
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

interface VoiceBillingWidgetProps {
  onItemsRecognized: (items: { productId?: string; name: string; quantity: number }[]) => void;
  onProceedCheckout?: () => void;
  onClearCart?: () => void;
}

export const VoiceBillingWidget: React.FC<VoiceBillingWidgetProps> = ({
  onItemsRecognized,
  onProceedCheckout,
  onClearCart,
}) => {
  const { products, cart, language } = useStore();
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'ta' | 'en'>('ta');
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'info' | 'error'>('info');
  const [isSupported, setIsSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<any>(null);

  // Sync default speech language with app language if changed
  useEffect(() => {
    if (language === 'ta') setSelectedLanguage('ta');
    else setSelectedLanguage('en');
  }, [language]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.lang = selectedLanguage === 'ta' ? 'ta-IN' : 'en-IN';

    rec.onstart = () => {
      setIsListening(true);
      setStatusType('info');
      setStatusMessage(
        selectedLanguage === 'ta'
          ? 'கேட்கிறது... பொருள் மற்றும் எண்ணிக்கையை பேசவும் (எ.கா: "2 பால்", "1 தக்காளி")'
          : 'Listening... Speak product name & quantity (e.g., "2 milk", "1kg tomato")'
      );
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i][0];
        if (event.results[i].isFinal) {
          finalTranscript += item.transcript;
        } else {
          interim += item.transcript;
        }
      }

      const activeText = finalTranscript || interim;
      setTranscript(activeText);

      // If final speech recognized, process immediately
      if (finalTranscript.trim()) {
        handleProcessSpeech(finalTranscript);
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Web Speech API error:', e.error);
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setStatusType('error');
        setStatusMessage(
          selectedLanguage === 'ta'
            ? 'மைக் அனுமதி மறுக்கப்பட்டது. பிரவுசர் செட்டிங்ஸில் மைக்ரோஃபோன் அனுமதியை சரிபார்க்கவும்.'
            : 'Microphone access denied. Please allow microphone permissions in browser.'
        );
      } else if (e.error === 'no-speech') {
        setStatusType('info');
        setStatusMessage(
          selectedLanguage === 'ta'
            ? 'குரல் கேட்கவில்லை. மீண்டும் பேச மைக்கை அழுத்தவும்.'
            : 'No speech detected. Tap mic to try again.'
        );
      } else {
        setStatusType('error');
        setStatusMessage(`Speech error: ${e.error}`);
      }
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch (err) {
        // cleanup safe
      }
    };
  }, [selectedLanguage, products]);

  // Audio animation pulse simulation during active listening
  useEffect(() => {
    let interval: any;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 120);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Process and match voice input
  const handleProcessSpeech = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim()) return;

      // 1. Direct High-Precision Client-Side Parser
      const parseResult = parseVoiceBillingTranscript(
        spokenText,
        products,
        selectedLanguage
      );

      if (parseResult.intent === 'CHECKOUT') {
        setStatusType('success');
        setStatusMessage(parseResult.spokenFeedback);
        speakVoiceFeedback(parseResult.spokenFeedback, selectedLanguage);
        if (onProceedCheckout) {
          onProceedCheckout();
        }
        return;
      }

      if (parseResult.intent === 'CLEAR_CART') {
        setStatusType('success');
        setStatusMessage(parseResult.spokenFeedback);
        speakVoiceFeedback(parseResult.spokenFeedback, selectedLanguage);
        if (onClearCart) {
          onClearCart();
        }
        return;
      }

      if (parseResult.items.length > 0) {
        // Successfully matched items
        onItemsRecognized(
          parseResult.items.map((it: RecognizedVoiceItem) => ({
            productId: it.product.id,
            name: it.product.name,
            quantity: it.quantity,
          }))
        );

        setStatusType('success');
        setStatusMessage(parseResult.spokenFeedback);
        speakVoiceFeedback(parseResult.spokenFeedback, selectedLanguage);
        return;
      }

      // If local match was ambiguous, attempt backend AI enrichment
      try {
        const res = await fetch('/api/ai/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: spokenText,
            language: selectedLanguage,
            catalog: products,
          }),
        });

        const data = await res.json();
        if (data.intent === 'CHECKOUT') {
          setStatusType('success');
          setStatusMessage(data.speechFeedback || 'Proceeding to checkout.');
          speakVoiceFeedback(data.speechFeedback || 'Proceeding to checkout.', selectedLanguage);
          if (onProceedCheckout) onProceedCheckout();
        } else if (data.items && data.items.length > 0) {
          onItemsRecognized(
            data.items.map((it: any) => ({
              productId: it.matchedId,
              name: it.productName,
              quantity: it.quantity || 1,
            }))
          );
          const feedback = data.speechFeedback || `Added ${data.items.length} items to current bill.`;
          setStatusType('success');
          setStatusMessage(feedback);
          speakVoiceFeedback(feedback, selectedLanguage);
        } else {
          setStatusType('info');
          setStatusMessage(
            selectedLanguage === 'ta'
              ? `கேட்கப்பட்டது: "${spokenText}". பொருள் பட்டியலுடன் பொருந்தவில்லை.`
              : `Heard: "${spokenText}". No matching item found.`
          );
        }
      } catch (err) {
        setStatusType('info');
        setStatusMessage(parseResult.spokenFeedback);
      }
    },
    [products, selectedLanguage, onItemsRecognized, onProceedCheckout, onClearCart]
  );

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) {
      // Simulate quick test phrase for demonstration if Web Speech not supported
      handleQuickDemo('2 பாக்கெட் பால் 1 தக்காளி');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      setTranscript('');
      setStatusMessage(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech start error, restarting:', err);
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 150);
        } catch (e) {
          handleQuickDemo('2 பாக்கெட் பால் 1 தக்காளி');
        }
      }
    }
  };

  const handleQuickDemo = (phrase: string) => {
    setTranscript(phrase);
    handleProcessSpeech(phrase);
  };

  const speakCartSummary = () => {
    const total = cart.reduce(
      (acc, it) => acc + (it.customPrice ?? it.product.sellingPrice) * it.quantity,
      0
    );
    const text =
      selectedLanguage === 'ta'
        ? `கார்ட்டில் ${cart.length} பொருட்கள் உள்ளன. வரிக்கு முந்தைய மொத்தத் தொகை ரூபாய் ${Math.round(
            total
          )}.`
        : `Cart contains ${cart.length} items. Total amount is ₹${total.toFixed(2)}.`;
    speakVoiceFeedback(text, selectedLanguage);
    setStatusType('info');
    setStatusMessage(text);
  };

  return (
    <div
      id="voice-billing-widget-card"
      className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-blue-500/10 border border-teal-500/20 backdrop-blur space-y-3 shadow-xs"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-teal-600 text-white'
            }`}
          >
            <Mic className={`w-4 h-4 ${isListening ? 'animate-bounce' : ''}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                {selectedLanguage === 'ta' ? 'குரல் வழி பில்லிங் (Web Speech API)' : 'Voice Billing (Web Speech API)'}
              </span>
              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black bg-teal-500/20 text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                {selectedLanguage === 'ta' ? 'தமிழ் • ta-IN' : 'English • en-IN'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {selectedLanguage === 'ta'
                ? 'பொருட்கள் மற்றும் எண்ணிக்கையை தமிழில் பேசி கார்ட்டில் சேர்க்கவும்'
                : 'Speak item names & quantities in Tamil or English to auto-add'}
            </p>
          </div>
        </div>

        {/* Language Selector & Cart Audio Reader */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedLanguage('ta')}
              className={`px-2 py-1 rounded-lg transition ${
                selectedLanguage === 'ta'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-2 py-1 rounded-lg transition ${
                selectedLanguage === 'en'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              EN
            </button>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={speakCartSummary}
              title="Speak Cart Total (Rupees)"
              className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Mic Button & Quick Action Presets */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <button
          id="toggle-voice-billing-mic-button"
          type="button"
          onClick={toggleListening}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/20'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-500/20'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 animate-spin" />
              <span>
                {selectedLanguage === 'ta' ? 'கேட்கிறது... நிறுத்த தொடவும்' : 'Listening... Tap to Stop'}
              </span>
              {/* Dynamic waveform visualizer dots */}
              <span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>
                {selectedLanguage === 'ta'
                  ? '🎤 தமிழில் பேசி பொருள் சேர்க்க தொடவும்'
                  : '🎤 Tap to Speak & Add Items'}
              </span>
            </>
          )}
        </button>

        {/* Quick Voice Demo Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {selectedLanguage === 'ta' ? (
            <>
              <button
                type="button"
                onClick={() => handleQuickDemo('2 பாக்கெட் பால் 1 கிலோ தக்காளி')}
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:border-teal-500 whitespace-nowrap transition shadow-2xs"
                title="Demo: 2 Milk + 1 Tomato in Tamil"
              >
                "2 பால் + 1 தக்காளி"
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('1 கிலோ சின்ன வெங்காயம்')}
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:border-teal-500 whitespace-nowrap transition shadow-2xs"
                title="Demo: Sambar Onions in Tamil"
              >
                "1 சின்ன வெங்காயம்"
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('3 தேங்காய்')}
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-teal-700 dark:text-teal-300 hover:border-teal-500 whitespace-nowrap transition shadow-2xs"
                title="Demo: Coconut in Tamil"
              >
                "3 தேங்காய்"
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleQuickDemo('Add 2 packets of milk and 1kg tomato')}
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 whitespace-nowrap transition shadow-2xs"
                title="Demo: 2 Milk + 1 Tomato in English"
              >
                "2 Milk + 1 Tomato"
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('Add 1 Ponni rice and 2 coconuts')}
                className="px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-teal-500 whitespace-nowrap transition shadow-2xs"
                title="Demo: Rice + Coconut in English"
              >
                "1 Rice + 2 Coconuts"
              </button>
            </>
          )}

          {/* Quick Voice Checkout intent button */}
          <button
            type="button"
            onClick={() => handleQuickDemo(selectedLanguage === 'ta' ? 'செக்அவுட்' : 'checkout')}
            className="px-2.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 whitespace-nowrap transition shadow-2xs"
            title="Voice checkout command"
          >
            {selectedLanguage === 'ta' ? '⚡ "செக்அவுட்"' : '⚡ "Checkout"'}
          </button>
        </div>
      </div>

      {/* Transcript & Status Banner */}
      {(transcript || statusMessage || isListening) && (
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-teal-100 dark:border-teal-900/50 text-xs space-y-1 animate-fade-in shadow-2xs">
          {transcript && (
            <div className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">
                {selectedLanguage === 'ta' ? 'கேட்டது:' : 'Heard:'}
              </span>
              <span className="italic font-medium text-slate-900 dark:text-white">
                "{transcript}"
              </span>
            </div>
          )}

          {statusMessage && (
            <div
              className={`flex items-center gap-1.5 font-semibold text-[11px] ${
                statusType === 'success'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : statusType === 'error'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-teal-700 dark:text-teal-300'
              }`}
            >
              {statusType === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : statusType === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
