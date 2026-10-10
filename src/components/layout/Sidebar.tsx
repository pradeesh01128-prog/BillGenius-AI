import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  Calculator,
  Users,
  Boxes,
  MessageSquareHeart,
  FileSpreadsheet,
  ShoppingCart,
  History,
  FolderTree,
  ClipboardCheck,
  Award,
  Cloud,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const {
    currentUser,
    stockRequests,
    language,
    lowStockProducts,
    outOfStockProducts,
    allBranchesLowStockProducts,
  } = useStore();

  const safeStockRequests = stockRequests || [];
  const pendingRequestsCount = safeStockRequests.filter(r => r.status === 'pending').length;
  const branchAlertCount = lowStockProducts?.length || 0;
  const enterpriseAlertCount = allBranchesLowStockProducts?.length || 0;
  const hasOutOfStock = (outOfStockProducts?.length || 0) > 0;

  const renderNavItems = () => {
    const isTa = language === 'ta';
    switch (currentUser?.role) {
      case 'owner':
        return [
          {
            id: 'analytics',
            label: isTa ? 'விற்பனை அனலிட்டிக்ஸ்' : 'Sales Analytics',
            icon: TrendingUp,
            badge: enterpriseAlertCount > 0 ? `! ${enterpriseAlertCount}` : undefined,
            badgeColor: 'bg-amber-500 text-slate-950 font-black',
          },
          { id: 'profit', label: isTa ? 'லாபம் & ROI கால்குலேட்டர்' : 'Profit & ROI Calculator', icon: Calculator },
          {
            id: 'branches_stock',
            label: isTa ? 'அனைத்து கிளைகள் இருப்பு' : 'All Branches Stock',
            icon: Boxes,
            badge: enterpriseAlertCount > 0 ? enterpriseAlertCount : undefined,
            badgeColor: hasOutOfStock ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950 font-bold',
          },
          { id: 'staff', label: isTa ? 'பணியாளர் மேலாண்மை' : 'Staff Management', icon: Users },
          { id: 'feedback', label: isTa ? 'வாடிக்கையாளர் கருத்து' : 'Customer Feedback', icon: MessageSquareHeart },
          { id: 'reports', label: isTa ? 'அறிக்கைகள் & ஏற்றுமதி' : 'Reports & Export', icon: FileSpreadsheet },
          {
            id: 'base44',
            label: isTa ? 'Base44 கிளவுட் & சின்க்' : 'Base44 Cloud & Sync',
            icon: Cloud,
            badge: 'Live',
            badgeColor: 'bg-teal-500 text-slate-950 font-bold',
          },
          { id: 'billing', label: isTa ? 'பில்லிங் கவுண்டர்' : 'POS Terminal', icon: ShoppingCart },
        ];
      case 'manager':
        return [
          {
            id: 'inventory',
            label: isTa ? 'கிளை சரக்கு இருப்பு' : 'Branch Inventory',
            icon: Boxes,
            badge: branchAlertCount > 0 ? branchAlertCount : undefined,
            badgeColor: hasOutOfStock ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950 font-bold',
          },
          { id: 'catalog', label: isTa ? 'பொருட்கள் பட்டியல்' : 'Product Catalog', icon: FolderTree },
          {
            id: 'approvals',
            label: isTa ? 'இருப்பு ஒப்புதல்கள்' : 'Stock Approvals',
            icon: ClipboardCheck,
            badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
            badgeColor: 'bg-rose-500 text-white',
          },
          { id: 'biller_performance', label: isTa ? 'பில்லர் செயல்திறன்' : 'Biller Performance', icon: Award },
          { id: 'feedback', label: isTa ? 'கிளை கருத்துகள்' : 'Branch Feedback', icon: MessageSquareHeart },
          {
            id: 'base44',
            label: isTa ? 'Base44 கிளவுட் & சின்க்' : 'Base44 Cloud & Sync',
            icon: Cloud,
            badge: 'Live',
            badgeColor: 'bg-teal-500 text-slate-950 font-bold',
          },
          { id: 'billing', label: isTa ? 'பில்லிங் கவுண்டர்' : 'POS Terminal', icon: ShoppingCart },
        ];
      case 'biller':
      default:
        return [
          {
            id: 'billing',
            label: isTa ? 'புதிய பில்லிங் (POS)' : 'New Billing (POS)',
            icon: ShoppingCart,
            badge: hasOutOfStock ? `! Alert` : undefined,
            badgeColor: 'bg-rose-500 text-white',
          },
          { id: 'history', label: isTa ? 'விற்பனை & ரசீதுகள்' : 'My Sales & Receipts', icon: History },
          {
            id: 'base44',
            label: isTa ? 'Base44 QR சரிபார்ப்பு' : 'Base44 QR & Sync',
            icon: Cloud,
          },
        ];
    }
  };

  const navItems = renderNavItems() || [];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-3 md:p-4">
      <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible no-scrollbar pb-1 md:pb-0">
        <div className="hidden md:block text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {currentUser.role.toUpperCase()} WORKSPACE
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition group relative ${
                isActive
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-500'}`} />
              <span className="flex-1 text-left">{item.label}</span>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-white text-teal-700'
                      : (item as any).badgeColor || 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
