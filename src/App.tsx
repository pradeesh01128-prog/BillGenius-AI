import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AIChatDrawer } from './components/ai/AIChatDrawer';
import { LowStockToast } from './components/common/LowStockToast';

// Biller Views
import { BillingScreen } from './components/biller/BillingScreen';
import { BillerHistoryView } from './components/biller/BillerHistoryView';

// Manager Views
import { BranchInventoryView } from './components/manager/BranchInventoryView';
import { ProductCatalogEditor } from './components/manager/ProductCatalogEditor';
import { StockApprovalsView } from './components/manager/StockApprovalsView';
import { BillerLeaderboardView } from './components/manager/BillerLeaderboardView';

// Owner Views
import { SalesAnalyticsDashboard } from './components/owner/SalesAnalyticsDashboard';
import { ProfitCalculatorView } from './components/owner/ProfitCalculatorView';
import { StaffManagementView } from './components/owner/StaffManagementView';
import { CustomerFeedbackView } from './components/owner/CustomerFeedbackView';
import { ReportsExportView } from './components/owner/ReportsExportView';
import { AllBranchesStockView } from './components/owner/AllBranchesStockView';
import { Base44HubView } from './components/base44/Base44HubView';

const MainAppContent: React.FC = () => {
  const { currentUser, isAiDrawerOpen, setIsAiDrawerOpen } = useStore();
  const [activeView, setActiveView] = useState<string>('billing');

  // Reset default view when user role changes
  useEffect(() => {
    switch (currentUser.role) {
      case 'owner':
        setActiveView('analytics');
        break;
      case 'manager':
        setActiveView('inventory');
        break;
      case 'biller':
        setActiveView('billing');
        break;
    }
  }, [currentUser.role]);

  const renderActiveView = () => {
    switch (activeView) {
      // Biller Views
      case 'billing':
        return <BillingScreen />;
      case 'history':
        return <BillerHistoryView />;

      // Manager Views
      case 'inventory':
        return <BranchInventoryView />;
      case 'catalog':
        return <ProductCatalogEditor />;
      case 'approvals':
        return <StockApprovalsView />;
      case 'biller_performance':
        return <BillerLeaderboardView />;

      // Owner Views
      case 'analytics':
        return <SalesAnalyticsDashboard />;
      case 'profit':
        return <ProfitCalculatorView />;
      case 'branches_stock':
        return <AllBranchesStockView />;
      case 'staff':
        return <StaffManagementView />;
      case 'feedback':
        return <CustomerFeedbackView />;
      case 'reports':
        return <ReportsExportView />;
      case 'base44':
        return <Base44HubView />;

      default:
        return <BillingScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        onOpenAIDrawer={() => setIsAiDrawerOpen(true)}
        onOpenAIChat={() => setIsAiDrawerOpen(true)}
        onQuickPOS={() => setActiveView('billing')}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />

        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating AI Drawer */}
      <AIChatDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onNavigateTab={tab => setActiveView(tab)}
      />

      {/* Global Automated Live Low-Stock In-App Alert Toast for all Staff Dashboards */}
      <LowStockToast />
    </div>
  );
};

export function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}

export default App;
