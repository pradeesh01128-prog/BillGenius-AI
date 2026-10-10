import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatINR } from '../../utils/currency';
import {
  encodeBase44,
  decodeBase44,
  generateBase44InvoicePayload,
  parseBase44InvoiceToken,
  generateBase44QRDataUrl,
  BASE44_ALPHABET,
} from '../../utils/base44Encoding';
import {
  Cloud,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Key,
  Sliders,
  Database,
  QrCode,
  Bot,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Zap,
  ArrowRight,
  Send,
  Boxes,
  Receipt,
  FileCode2,
} from 'lucide-react';

export const Base44HubView: React.FC = () => {
  const {
    bills,
    products,
    feedbacks,
    lowStockProducts,
    currentBranch,
    language,
    base44Config,
    base44Status,
    updateBase44Config,
    triggerBase44Sync,
    runBase44AgentWorkflow,
  } = useStore();

  const isTa = language === 'ta';
  const [activeTab, setActiveTab] = useState<'sync' | 'agent' | 'qr_tools' | 'settings'>('sync');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Settings form state
  const [appIdInput, setAppIdInput] = useState(base44Config.appId);
  const [tokenInput, setTokenInput] = useState(base44Config.token || '');
  const [envInput, setEnvInput] = useState(base44Config.environment);
  const [autoSyncInput, setAutoSyncInput] = useState(base44Config.autoSync);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Agent state
  const [agentPrompt, setAgentPrompt] = useState(
    'Audit weekly margins, identify critical restock items, and suggest wholesale PO quantities for Chennai & Madurai branches.'
  );
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<any>(null);

  // Base44 QR / Token Validator tool state
  const [selectedBillId, setSelectedBillId] = useState<string>(bills[0]?.id || '');
  const [customTextToEncode, setCustomTextToEncode] = useState('BG-INVOICE-CHENNAI-2026');
  const [encodedResult, setEncodedResult] = useState('');
  const [tokenToVerify, setTokenToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Update initial selected bill
  useEffect(() => {
    if (bills.length > 0 && !selectedBillId) {
      setSelectedBillId(bills[0].id);
    }
  }, [bills, selectedBillId]);

  // Generate QR & encoded token when selected bill or custom text changes
  useEffect(() => {
    const activeBill = bills.find(b => b.id === selectedBillId);
    let payload = '';
    if (activeBill) {
      payload = generateBase44InvoicePayload(activeBill);
    } else {
      payload = `B44*${encodeBase44(customTextToEncode)}*DEMO`;
    }
    setEncodedResult(payload);
    setTokenToVerify(payload);

    generateBase44QRDataUrl(payload).then(url => {
      setQrDataUrl(url);
    });
  }, [selectedBillId, customTextToEncode, bills]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await triggerBase44Sync();
      setSyncMessage(res.message);
    } catch (err: any) {
      setSyncMessage('Sync failed: ' + (err?.message || 'Check connection'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBase44Config({
      appId: appIdInput.trim() || 'billgenius-tamilnadu-pos',
      token: tokenInput.trim(),
      environment: envInput as any,
      autoSync: autoSyncInput,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleRunAgent = async () => {
    setIsAgentRunning(true);
    setAgentResult(null);
    try {
      const res = await runBase44AgentWorkflow(agentPrompt, {
        branchName: currentBranch.name,
        billsCount: bills.length,
      });
      setAgentResult(res);
    } catch (err: any) {
      setAgentResult({
        status: 'error',
        summary: 'Agent invocation encounter: ' + err.message,
        actionItems: [],
      });
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleVerifyToken = () => {
    const res = parseBase44InvoiceToken(tokenToVerify.trim());
    setVerificationResult(res);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const totalBillValue = bills.reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-teal-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-teal-400" />
                @BASE44/SDK INTEGRATION
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {base44Status.isConnected ? 'Cloud Connected' : 'Sync Ready'}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700">
                App ID: {base44Config.appId}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{isTa ? 'Base44 கிளவுட் & சின்க் ஹப்' : 'Base44 Cloud & Sync Hub'}</span>
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              {isTa
                ? 'Base44 பின்தளத்துடன் நிகழ்நேர இருப்பு, இன்வாய்ஸ்கள், தானியங்கி சரக்கு எச்சரிக்கைகள் மற்றும் Base44 QR சரிபார்ப்பு ஒருங்கிணைப்பு.'
                : 'Direct cloud sync for retail entities (bills, products, inventory alerts, feedback) with automated AI Agent dispatches and high-density Base44 QR tokens.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="base44-sync-now-button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/25 transition flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing to Base44...' : 'Sync to Base44 Cloud'}</span>
            </button>
          </div>
        </div>

        {/* Sync status toast inside banner */}
        {syncMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncMessage}</span>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-teal-400" />
              Bills Entity
            </div>
            <div className="text-xl font-bold text-white mt-1">{bills.length}</div>
            <div className="text-[10px] text-teal-400 font-mono mt-0.5">{formatINR(totalBillValue)} tracked</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-emerald-400" />
              Products Entity
            </div>
            <div className="text-xl font-bold text-white mt-1">{products.length}</div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">With Base44 SKUs</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Stock Alerts
            </div>
            <div className="text-xl font-bold text-white mt-1">{lowStockProducts.length}</div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Auto-dispatched</div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur rounded-xl p-3 border border-slate-800">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Last Cloud Sync
            </div>
            <div className="text-xs font-bold text-white mt-1.5 truncate">
              {base44Status.lastSyncedAt
                ? new Date(base44Status.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Just now'}
            </div>
            <div className="text-[10px] text-indigo-300 font-mono mt-0.5">
              {base44Config.autoSync ? 'Auto-sync active' : 'Manual sync'}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('sync')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'sync'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Entity Mirror & Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('agent')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'agent'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Base44 AI Retail Agent</span>
          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-500 text-[10px] font-bold">New</span>
        </button>

        <button
          onClick={() => setActiveTab('qr_tools')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'qr_tools'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Base44 QR & Token Validator</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition ${
            activeTab === 'settings'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Base44 SDK Configuration</span>
        </button>
      </div>

      {/* Tab 1: Entity Mirror & Sync */}
      {activeTab === 'sync' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bills Entity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entity: bills</h3>
                    <p className="text-xs text-slate-400 font-mono">client.entities.bills</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300">
                  {bills.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Stores completed sales transactions, customer phone numbers, GST breakdown, and tamper-proof Base44 alphanumeric tokens.
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
                <div className="text-slate-400 mb-1">// Latest Base44 Entity Schema Sample:</div>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      id: bills[0]?.id || 'bill-sample-1',
                      invoice_number: bills[0]?.invoiceNumber || 'INV-2026-001',
                      branch_name: bills[0]?.branchName || currentBranch.name,
                      total_inr: bills[0]?.total || 1450.0,
                      base44_token: bills[0] ? generateBase44InvoicePayload(bills[0]) : 'B44*INV-001*1450*CHK',
                      status: 'synced_to_base44',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Products Entity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entity: products</h3>
                    <p className="text-xs text-slate-400 font-mono">client.entities.products</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Synchronizes multi-branch inventory, bilingual Tamil/English descriptions, cost margins, and Base44 SKUs.
              </p>
              <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 max-h-36 overflow-y-auto">
                <div className="text-slate-400 mb-1">// Latest Product Entity Schema:</div>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(
                    {
                      id: products[0]?.id || 'prod-sample',
                      sku: products[0]?.sku || 'SKU-RICE-25KG',
                      name: products[0]?.name || 'Ponni Boiled Rice',
                      name_tamil: products[0]?.nameTamil || 'பொன்னி புழுங்கல் அரிசி',
                      selling_price: products[0]?.sellingPrice || 1450,
                      stock: products[0]?.stock || 35,
                      min_alert: products[0]?.minStockAlert || 10,
                      base44_sku: products[0]?.sku ? `B44-${products[0].sku}` : 'B44-PROD-01',
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Low-Stock Alerts Entity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entity: low_stock_alerts</h3>
                    <p className="text-xs text-slate-400 font-mono">client.entities.low_stock_alerts</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                  {lowStockProducts.length} Alert Items
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dispatches urgent low-stock alerts and threshold breaches directly to Base44 webhooks and supplier workflows.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Active threshold triggers: {lowStockProducts.map(p => p.name).slice(0, 3).join(', ') || 'All stock normal'}</span>
              </div>
            </div>

            {/* Customer Feedback Entity */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Entity: customer_feedback</h3>
                    <p className="text-xs text-slate-400 font-mono">client.entities.customer_feedback</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                  {feedbacks.length} Reviews
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Syncs star ratings, sentiment analysis tags, and Tamil customer comments with Base44 CRM tables.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Base44 Realtime Webhooks Enabled</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Base44 AI Retail Agent */}
      {activeTab === 'agent' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Base44 Retail Optimization Agent
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Invoke the Base44 Agent API to analyze product velocity, detect shrinkage risks, and generate purchase recommendations for suppliers.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shrink-0">
              client.agents.createConversation
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Agent Prompt / Directive:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={agentPrompt}
                onChange={e => setAgentPrompt(e.target.value)}
                placeholder="Ask the Base44 retail agent..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="base44-invoke-agent-btn"
                onClick={handleRunAgent}
                disabled={isAgentRunning}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${isAgentRunning ? 'animate-spin' : ''}`} />
                <span>{isAgentRunning ? 'Dispatching Agent...' : 'Run Base44 Agent'}</span>
              </button>
            </div>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 text-[11px] self-center">Quick Directives:</span>
            {[
              'Audit Chennai & Madurai margins and reorder limits',
              'Calculate GST 18% vs 5% tax mix for this week',
              'Draft supplier Purchase Order for 5 lowest stock items',
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => setAgentPrompt(p)}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Agent Output Card */}
          {agentResult && (
            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-5 border border-indigo-200 dark:border-indigo-900/60 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Bot className="w-4 h-4" />
                  Base44 Agent Response ({agentResult.base44AgentId})
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  ✓ Verified by Base44
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {agentResult.summary}
              </p>

              {agentResult.actionItems?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recommended Action Items:
                  </div>
                  {agentResult.actionItems.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Base44 QR & Token Validator */}
      {activeTab === 'qr_tools' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Base44 Compact QR Generator
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Base44 uses a 44-character alphabet ({BASE44_ALPHABET.slice(0, 16)}...) optimized for QR alphanumeric mode with 0 spaces for maximum printer density.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Select Bill to Encode:
              </label>
              <select
                value={selectedBillId}
                onChange={e => setSelectedBillId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
              >
                {bills.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.invoiceNumber} — {b.customerName} ({formatINR(b.total)})
                  </option>
                ))}
              </select>
            </div>

            {/* Base44 Token display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Base44 Generated Payload:
                </label>
                <button
                  onClick={() => handleCopy(encodedResult)}
                  className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-teal-300 font-mono text-xs break-all border border-slate-800">
                {encodedResult}
              </div>
            </div>

            {/* QR Code Graphic */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Base44 QR Code"
                  className="w-28 h-28 rounded-lg bg-white p-1 border border-slate-200 shadow"
                />
              ) : (
                <div className="w-28 h-28 rounded-lg bg-slate-200 animate-pulse" />
              )}
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Base44 High-Density QR
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Encodes invoice ID, amount, branch code, and checksum into compact QR format compatible with all 2D barcode scanners and thermal printers.
                </p>
                <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold">
                  Alphanumeric standard mode (44 chars)
                </div>
              </div>
            </div>
          </div>

          {/* Validator Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Base44 Token Validator & Decoder
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Paste any Base44 receipt barcode or string to verify its cryptographic checksum and bill authenticity.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Token to Verify:
              </label>
              <textarea
                rows={3}
                value={tokenToVerify}
                onChange={e => setTokenToVerify(e.target.value)}
                placeholder="B44*INV-001*..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleVerifyToken}
              className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify & Decode Base44 Token</span>
            </button>

            {verificationResult && (
              <div
                className={`p-4 rounded-xl border ${
                  verificationResult.valid
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      verificationResult.valid
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-700 dark:text-rose-300'
                    } flex items-center gap-1.5`}
                  >
                    {verificationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    {verificationResult.valid ? 'Valid Base44 Invoice Token' : 'Invalid or Tampered Token'}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500">
                    Branch: {verificationResult.branchId}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                  <div>
                    <span className="text-slate-400">Invoice:</span>{' '}
                    <span className="font-mono font-bold">{verificationResult.invoiceNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Total:</span>{' '}
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      {formatINR(verificationResult.total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment:</span>{' '}
                    <span className="font-semibold">{verificationResult.paymentMode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Items Count:</span>{' '}
                    <span className="font-semibold">{verificationResult.itemsCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Base44 SDK Configuration */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Base44 SDK Connection Settings
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure your Base44 App ID, developer tokens, and real-time syncing policies across branches.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Base44 App ID:
              </label>
              <input
                type="text"
                value={appIdInput}
                onChange={e => setAppIdInput(e.target.value)}
                placeholder="billgenius-tamilnadu-pos"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Your unique application identifier from your Base44 dashboard (createClient({`{ appId }`})).
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Base44 Auth Token / Secret (Optional):
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={tokenInput}
                  onChange={e => setTokenInput(e.target.value)}
                  placeholder="b44_sec_••••••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Environment:
                </label>
                <select
                  value={envInput}
                  onChange={e => setEnvInput(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="production">Production (Base44 Cloud)</option>
                  <option value="development">Development Sandbox</option>
                  <option value="demo_mode">Demo / Offline Edge</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-5">
                <input
                  type="checkbox"
                  id="autoSyncCheck"
                  checked={autoSyncInput}
                  onChange={e => setAutoSyncInput(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="autoSyncCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Auto-sync bills & alerts upon POS checkout
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition"
              >
                Save Settings
              </button>

              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved & Base44 SDK re-initialized!
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
