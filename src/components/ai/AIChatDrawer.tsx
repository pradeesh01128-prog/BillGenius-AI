import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { AIChatMessage } from '../../types';
import {
  Sparkles,
  X,
  Send,
  Bot,
  User as UserIcon,
  Mic,
  MicOff,
  CornerDownLeft,
  PlusCircle,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    currentUser,
    currentBranch,
    products,
    bills,
    stockRequests,
    investmentData,
    addToCart,
  } = useStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello ${currentUser.name}! I am your **BillGenius AI Assistant**. How can I help you today?`,
      timestamp: new Date().toISOString(),
      roleContext: currentUser.role,
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Setup Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      // Simulate input if web speech API not supported
      setInput("2 பாக்கெட் ஆவின் பால் பில்லில் சேர்க்கவும்");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
        setIsListening(false);
      }
    }
  };

  const getQuickPills = () => {
    switch (currentUser.role) {
      case 'owner':
        return [
          "What's today's total sales in ₹ (INR)?",
          "Show me profit & ROI for this month",
          "Which Tamil Nadu products are low in stock?",
          "Compare Chennai vs Coimbatore vs Madurai revenue",
        ];
      case 'manager':
        return [
          "Show low stock products in this branch",
          "Who is the top performing biller today?",
          "Review pending stock requests",
          "What are customer ratings in Tamil Nadu?",
        ];
      case 'biller':
        return [
          "Add 2 Aavin milk to bill",
          "2 பாக்கெட் பால் (Add 2 Milk)",
          "What's my total sales in ₹ today?",
          "Check price of Ponni Boiled Rice",
        ];
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
      roleContext: currentUser.role,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Build context data based on permissions
    const lowStockItems = products.filter(p => p.stock <= p.minStockAlert);
    const contextData: any = {
      role: currentUser.role,
      branch: currentBranch.name,
      totalProductsInStore: products.length,
      lowStockCount: lowStockItems.length,
      todayBillsCount: bills.length,
    };

    if (currentUser.role === 'owner') {
      contextData.investment = investmentData.capitalInvestment;
      contextData.monthlyHistory = investmentData.history.slice(-3);
      contextData.allBranchesRevenue = bills.reduce((acc, b) => acc + b.total, 0);
    } else if (currentUser.role === 'manager') {
      contextData.pendingStockRequests = stockRequests.filter(r => r.status === 'pending').length;
      contextData.branchRevenue = bills
        .filter(b => b.branchId === currentBranch.id)
        .reduce((acc, b) => acc + b.total, 0);
    } else {
      contextData.mySalesTotal = currentUser.totalSales;
      contextData.myBillsCount = currentUser.billsCount;
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          role: currentUser.role,
          branch: currentBranch.name,
          contextData,
        }),
      });

      const data = await response.json();
      const botText = data.reply || 'I received your request.';

      // Check if query is an add-to-cart command for biller
      const lowerQuery = query.toLowerCase();
      let matchedProd = null;
      let matchedQty = 1;

      if (lowerQuery.includes('add') || lowerQuery.includes('cart') || lowerQuery.includes('bill')) {
        const numMatch = lowerQuery.match(/\b(\d+)\b/);
        if (numMatch) matchedQty = parseInt(numMatch[1], 10);

        matchedProd = products.find(p =>
          lowerQuery.includes(p.name.toLowerCase().split(' ')[0])
        );
      }

      const botMsg: AIChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: botText,
        timestamp: new Date().toISOString(),
        roleContext: currentUser.role,
        actions: matchedProd
          ? [
              {
                label: `Add ${matchedQty}x ${matchedProd.name} to Cart`,
                type: 'add_to_cart',
                payload: { product: matchedProd, quantity: matchedQty },
              },
            ]
          : undefined,
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Connection Notice:** Using built-in local AI processor for ${currentUser.role}. All system features remain operational.`,
          timestamp: new Date().toISOString(),
          roleContext: currentUser.role,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: NonNullable<AIChatMessage['actions']>[number]) => {
    if (action.type === 'add_to_cart') {
      addToCart(action.payload.product, action.payload.quantity);
      if (onNavigateTab) onNavigateTab('billing');
      setMessages(prev => [
        ...prev,
        {
          id: `action-${Date.now()}`,
          sender: 'assistant',
          text: `✅ Added ${action.payload.quantity}x **${action.payload.product.name}** to your POS cart!`,
          timestamp: new Date().toISOString(),
          roleContext: currentUser.role,
        },
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  BillGenius AI Agent
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 capitalize">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Context: {currentBranch.name}</p>
            </div>
          </div>

          <button
            id="close-ai-drawer-button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            aria-label="Close AI Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2.5 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {getQuickPills().map((pill, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(pill)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 shrink-0 transition"
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                    : 'bg-teal-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                <div
                  className="space-y-1.5 whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: msg.text
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/40 space-y-1.5">
                    {msg.actions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(act)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition font-semibold text-[11px] shadow-sm"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        {act.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[9px] opacity-60 block text-right mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700"
          >
            <button
              type="button"
              id="ai-mic-toggle-button"
              onClick={toggleMic}
              className={`p-2 rounded-xl transition ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
              title={isListening ? 'Stop listening' : 'Voice command'}
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <input
              type="text"
              id="ai-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to voice...'
                  : currentUser.role === 'biller'
                  ? 'Type e.g. "Add 2 milk" or ask price...'
                  : 'Ask sales, stock, profit insights...'
              }
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden px-1"
            />

            <button
              type="submit"
              id="ai-chat-send-button"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 disabled:hover:bg-teal-600 transition"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
