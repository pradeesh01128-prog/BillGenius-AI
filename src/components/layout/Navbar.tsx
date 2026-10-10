import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';
import { LowStockManagementModal } from '../common/LowStockManagementModal';
import {
  Store,
  Sparkles,
  Bell,
  Sun,
  Moon,
  LogOut,
  UserCheck,
  ShieldCheck,
  Briefcase,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Languages,
  Plus,
  PackagePlus,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  onOpenAIDrawer?: () => void;
  onOpenAIChat?: () => void;
  activeView?: string;
  setActiveView?: (view: string) => void;
  onQuickPOS?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAIChat,
  onOpenAIDrawer,
  activeView: _activeView,
  setActiveView: _setActiveView,
  onQuickPOS: _onQuickPOS,
}) => {
  const {
    currentUser,
    currentBranch,
    allBranches,
    setCurrentBranch,
    loginAsRole,
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    quickRestock,
    requestStock,
    lowStockProducts,
    outOfStockProducts,
    allBranchesLowStockProducts,
    triggerStockAlertSim,
    base44Status,
    base44Config,
    triggerBase44Sync,
  } = useStore();

  const handleOpenAi = onOpenAIDrawer || onOpenAIChat || (() => {});

  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [isStockCenterOpen, setIsStockCenterOpen] = useState(false);

  const safeNotifications = notifications || [];
  const safeBranches = allBranches || [];
  const unreadNotifs = safeNotifications.filter(n => !n.read);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner Mode
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Briefcase className="w-3.5 h-3.5" />
            Manager Mode
          </span>
        );
      case 'biller':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            Biller / POS
          </span>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20 font-bold text-lg tracking-tight">
              BG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  BillGenius<span className="text-teal-600 dark:text-teal-400">.AI</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  TN • ₹ INR
                </span>
                {getRoleBadge(currentUser.role)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                {language === 'ta' ? 'தமிழ்நாடு ஸ்மார்ட் பில்லிங் & பிசினஸ் தளம்' : 'Tamil Nadu Smart Billing & Retail POS'}
              </p>
            </div>
          </div>

          {/* Center: Branch Selector (Owner & Manager) */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser.role === 'owner' || currentUser.role === 'manager' ? (
              <div className="relative">
                <button
                  id="branch-selector-button"
                  onClick={() => setShowBranchDropdown(!showBranchDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <Store className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span className="max-w-[150px] truncate">{currentBranch.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showBranchDropdown && (
                  <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400">
                      Switch Branch
                    </div>
                    {safeBranches.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => {
                          setCurrentBranch(branch);
                          setShowBranchDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 ${
                          currentBranch.id === branch.id
                            ? 'font-semibold text-teal-600 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <p>{branch.name}</p>
                          <p className="text-[10px] text-slate-400">{branch.location.split(',')[0]}</p>
                        </div>
                        {currentBranch.id === branch.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/70">
                <Store className="w-3.5 h-3.5 text-teal-500" />
                <span>{currentBranch?.name || 'Chennai - T. Nagar Flagship'} (Counter #1)</span>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Toggle (English / Tamil) */}
            <button
              id="language-toggle-button"
              type="button"
              onClick={toggleLanguage}
              title="Switch Language / மொழியை மாற்றவும்"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
            >
              <Languages className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{language === 'ta' ? 'தமிழ்' : 'EN'}</span>
            </button>

            {/* AI Assistant Quick Trigger */}
            <button
              id="navbar-ai-assistant-button"
              onClick={handleOpenAi}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white text-xs font-medium shadow-sm hover:opacity-95 transition"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">{language === 'ta' ? 'AI பில்லிங் உதவியாளர்' : 'AI Billing Agent'}</span>
              <span className="sm:hidden">AI</span>
            </button>

            {/* Live Low-Stock Alert Quick Trigger Pill */}
            {lowStockProducts.length > 0 && (
              <button
                id="navbar-stock-alert-pill"
                type="button"
                onClick={() => setIsStockCenterOpen(true)}
                title={`${lowStockProducts.length} items below safety threshold in ${currentBranch.name}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-xs ${
                  outOfStockProducts.length > 0
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {outOfStockProducts.length > 0
                    ? `${outOfStockProducts.length} Depleted`
                    : `${lowStockProducts.length} Low Stock`}
                </span>
                <span className="sm:hidden font-black">{lowStockProducts.length}</span>
              </button>
            )}

            {/* Base44 Cloud Sync Indicator & Quick Trigger */}
            <button
              id="navbar-base44-cloud-button"
              type="button"
              onClick={() => {
                if (_setActiveView) {
                  _setActiveView('base44');
                } else {
                  triggerBase44Sync();
                }
              }}
              title={`Base44 Cloud: ${base44Status.isConnected ? 'Connected' : 'Offline Ready'} (App ID: ${base44Config.appId})`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition shadow-xs"
            >
              <Cloud className="w-3.5 h-3.5 text-teal-500" />
              <span className="hidden sm:inline">Base44</span>
              {base44Status.isSyncing ? (
                <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notifications-button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        Notifications
                      </span>
                      {unreadNotifs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {unreadNotifs.length} new
                        </span>
                      )}
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                    {safeNotifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No notifications yet.</p>
                    ) : (
                      safeNotifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                            notif.read
                              ? 'bg-slate-50/50 dark:bg-slate-800/30 border-transparent opacity-75'
                              : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/50'
                          }`}
                        >
                          {notif.type === 'alert' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          ) : notif.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ) : notif.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              {notif.title}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {notif.message}
                            </p>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                              <span>
                                {new Date(notif.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {notif.threshold !== undefined && (
                                <span className="font-semibold text-slate-500 dark:text-slate-400">
                                  Safety: &le; {notif.threshold} {notif.unit || 'units'}
                                </span>
                              )}
                            </div>

                            {/* Direct Action for Staff on Alert Notification */}
                            {notif.productId && !notif.read && (
                              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
                                {currentUser.role === 'manager' || currentUser.role === 'owner' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      quickRestock(notif.productId!, 15, 'Quick Restock from Notification Alert');
                                      markNotificationRead(notif.id);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs transition"
                                  >
                                    <Plus className="w-2.5 h-2.5" />
                                    <span>+15 Restock</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestStock({
                                        productId: notif.productId!,
                                        requestedQty: 25,
                                        reason: 'Triggered from low-stock notification alert',
                                      });
                                      markNotificationRead(notif.id);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-2xs transition"
                                  >
                                    <PackagePlus className="w-2.5 h-2.5" />
                                    <span>Request Stock</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsStockCenterOpen(true);
                                    setShowNotifs(false);
                                  }}
                                  className="text-[10px] text-teal-600 dark:text-teal-400 font-bold hover:underline"
                                >
                                  Stock Center &rarr;
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              id="theme-toggle-button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                id="user-profile-menu-button"
                onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">{currentUser.role}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleSwitcher && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-50">
                  <div className="pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {currentUser.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                    <div className="mt-1.5">{getRoleBadge(currentUser.role)}</div>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    Fast Role Switch (Demo)
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        loginAsRole('owner');
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                        currentUser.role === 'owner'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Alexander Wright (Owner)</span>
                    </button>

                    <button
                      onClick={() => {
                        loginAsRole('manager');
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                        currentUser.role === 'manager'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      <span>Marcus Vance (Manager)</span>
                    </button>

                    <button
                      onClick={() => {
                        loginAsRole('biller');
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 ${
                        currentUser.role === 'biller'
                          ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-teal-500" />
                      <span>Leo Chen (Cashier/Biller)</span>
                    </button>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => {
                        loginAsRole('biller');
                        setShowRoleSwitcher(false);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Reset / Switch User</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>

    {/* Automated Low-Stock Management Center Modal */}
    <LowStockManagementModal
      isOpen={isStockCenterOpen}
      onClose={() => setIsStockCenterOpen(false)}
    />
  </>
);
};
