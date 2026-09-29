import React, { useState, useEffect } from 'react';
import { Sidebar, MainTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastProvider } from './components/common/Toast';
import { storage } from './db/storage';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';

// Module Views
import { DashboardView } from './components/dashboard/DashboardView';
import { NewSalePOS } from './components/sales/NewSalePOS';
import { SalesListView } from './components/sales/SalesListView';
import { SaleOrdersView } from './components/sales/SaleOrdersView';
import { QuotationsView } from './components/sales/QuotationsView';
import { PaymentInView } from './components/sales/PaymentInView';

import { PurchasesListView } from './components/purchases/PurchasesListView';
import { PurchaseOrdersView } from './components/purchases/PurchaseOrdersView';
import { PaymentOutView } from './components/purchases/PaymentOutView';

import { InstallmentsListView } from './components/installments/InstallmentsListView';
import { InstallmentRemindersView } from './components/installments/InstallmentRemindersView';

import { RepairsMainView } from './components/repairs/RepairsMainView';

import { InventoryListView } from './components/inventory/InventoryListView';
import { IMEIManagementView } from './components/imei/IMEIManagementView';
import { PartiesListView } from './components/parties/PartiesListView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { ReturnsView } from './components/returns/ReturnsView';
import { DailyClosingView } from './components/reports/DailyClosingView';
import { ProfitLossView } from './components/reports/ProfitLossView';
import { ReportsView } from './components/reports/ReportsView';

import { BarcodeGeneratorView } from './components/barcode/BarcodeGeneratorView';
import { WhatsAppView } from './components/whatsapp/WhatsAppView';
import { ThermalPrinterSettingsView } from './components/thermal/ThermalPrinterSettingsView';
import { UsersAndSecurityView } from './components/users/UsersAndSecurityView';
import { SettingsView } from './components/settings/SettingsView';
import { BackupRestoreView } from './components/settings/BackupRestoreView';

import { ShoppingCart, Truck, CalendarCheck, BarChart3, ShieldAlert } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, isLocked, currentUser } = useAuth();
  const { direction, t } = useLanguage();

  const [currentTab, setCurrentTab] = useState<MainTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setTick] = useState(0);

  // Sub-tabs for multi-view modules
  const [salesSubTab, setSalesSubTab] = useState<'pos' | 'invoices' | 'orders' | 'quotes' | 'payment_in'>('pos');
  const [purchasesSubTab, setPurchasesSubTab] = useState<'bills' | 'orders' | 'payment_out'>('bills');
  const [installmentsSubTab, setInstallmentsSubTab] = useState<'list' | 'reminders'>('list');
  const [reportsSubTab, setReportsSubTab] = useState<'reports' | 'pnl' | 'closing'>('reports');

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Keyboard shortcut: ⌘K or Ctrl+K for search, ⌘L for locking terminal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // If user is not authenticated or terminal is locked, display the multi-user login/lock screen
  if (!isAuthenticated || isLocked) {
    return <LoginView />;
  }

  // Permission checks
  const canAccessSettings = currentUser.role === 'Admin' || currentUser.permissions.manageSettings;
  const canAccessUsers = currentUser.role === 'Admin';
  const canAccessReports = currentUser.role === 'Admin' || currentUser.permissions.viewReports;

  return (
    <div 
      dir={direction}
      className={`flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none ${
        direction === 'rtl' ? 'rtl-layout' : ''
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab === 'closing') {
            setCurrentTab('closing');
          }
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header with prominent Language Toggle (EN, اردو, العربية) and Logout/User controls */}
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSearch={() => setSearchOpen(true)}
          onNavigate={tab => {
            setCurrentTab(tab);
            if (tab === 'sales') setSalesSubTab('pos');
            if (tab === 'installments') setInstallmentsSubTab('list');
          }}
        />

        {/* Sub-navigation bar when in Sales, Purchases, Installments, or Reports */}
        {currentTab === 'sales' && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setSalesSubTab('pos')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'pos' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fast POS Counter
            </button>
            <button
              onClick={() => setSalesSubTab('invoices')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'invoices' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Invoices History
            </button>
            <button
              onClick={() => setSalesSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'orders' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sale Orders (Bookings)
            </button>
            <button
              onClick={() => setSalesSubTab('quotes')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'quotes' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Quotations / Estimates
            </button>
            <button
              onClick={() => setSalesSubTab('payment_in')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                salesSubTab === 'payment_in' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer Payment In
            </button>
          </div>
        )}

        {currentTab === 'purchases' && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setPurchasesSubTab('bills')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                purchasesSubTab === 'bills' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchase Bills
            </button>
            <button
              onClick={() => setPurchasesSubTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                purchasesSubTab === 'orders' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setPurchasesSubTab('payment_out')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                purchasesSubTab === 'payment_out' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Vendor Payment Out
            </button>
          </div>
        )}

        {currentTab === 'installments' && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setInstallmentsSubTab('list')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                installmentsSubTab === 'list' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Installment Plans & Collections
            </button>
            <button
              onClick={() => setInstallmentsSubTab('reminders')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                installmentsSubTab === 'reminders' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Due Reminders & WhatsApp Alerting
            </button>
          </div>
        )}

        {currentTab === 'reports' && (
          <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <button
              onClick={() => setReportsSubTab('reports')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'reports' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sales, Purchases & Stock Reports
            </button>
            <button
              onClick={() => setReportsSubTab('pnl')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'pnl' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Profit & Loss Statement (P&L)
            </button>
            <button
              onClick={() => setReportsSubTab('closing')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                reportsSubTab === 'closing' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily Register Closing History
            </button>
          </div>
        )}

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-slate-950 p-3 sm:p-5">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={tab => {
                setCurrentTab(tab);
                if (tab === 'sales') setSalesSubTab('pos');
                if (tab === 'installments') setInstallmentsSubTab('list');
              }}
            />
          )}

          {currentTab === 'sales' && (
            <>
              {salesSubTab === 'pos' && <NewSalePOS onSaleCompleted={() => setSalesSubTab('invoices')} />}
              {salesSubTab === 'invoices' && <SalesListView />}
              {salesSubTab === 'orders' && <SaleOrdersView />}
              {salesSubTab === 'quotes' && <QuotationsView />}
              {salesSubTab === 'payment_in' && <PaymentInView />}
            </>
          )}

          {currentTab === 'repairs' && <RepairsMainView />}

          {currentTab === 'purchases' && (
            <>
              {purchasesSubTab === 'bills' && <PurchasesListView />}
              {purchasesSubTab === 'orders' && <PurchaseOrdersView />}
              {purchasesSubTab === 'payment_out' && <PaymentOutView />}
            </>
          )}

          {currentTab === 'installments' && (
            <>
              {installmentsSubTab === 'list' && (
                <InstallmentsListView onOpenReminders={() => setInstallmentsSubTab('reminders')} />
              )}
              {installmentsSubTab === 'reminders' && <InstallmentRemindersView />}
            </>
          )}

          {currentTab === 'inventory' && <InventoryListView />}
          {currentTab === 'parties' && <PartiesListView />}
          {currentTab === 'expenses' && <ExpensesView />}
          {currentTab === 'imei' && <IMEIManagementView />}
          {currentTab === 'returns' && <ReturnsView />}
          {currentTab === 'closing' && <DailyClosingView />}

          {currentTab === 'reports' && (
            <>
              {!canAccessReports ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-12 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100">Access Restricted</h3>
                  <p className="text-xs text-slate-400">
                    Your staff account ({currentUser.role}) does not have permission to view Financial & Profit Reports. Please log in as Manager or Admin.
                  </p>
                </div>
              ) : (
                <>
                  {reportsSubTab === 'reports' && <ReportsView />}
                  {reportsSubTab === 'pnl' && <ProfitLossView />}
                  {reportsSubTab === 'closing' && <DailyClosingView />}
                </>
              )}
            </>
          )}

          {currentTab === 'barcode' && <BarcodeGeneratorView />}
          {currentTab === 'whatsapp' && <WhatsAppView />}
          {currentTab === 'thermal' && <ThermalPrinterSettingsView />}
          
          {currentTab === 'users' && (
            <>
              {!canAccessUsers ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-12 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100">Administrator Privileges Required</h3>
                  <p className="text-xs text-slate-400">
                    Only administrators can manage staff user accounts, PINs, and security permissions.
                  </p>
                </div>
              ) : (
                <UsersAndSecurityView />
              )}
            </>
          )}

          {currentTab === 'settings' && (
            <>
              {!canAccessSettings ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto mt-12 space-y-3">
                  <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto" />
                  <h3 className="text-base font-bold text-slate-100">Settings Restricted</h3>
                  <p className="text-xs text-slate-400">
                    Staff role ({currentUser.role}) cannot alter store tax, invoices, and system parameters.
                  </p>
                </div>
              ) : (
                <SettingsView />
              )}
            </>
          )}

          {currentTab === 'backup' && <BackupRestoreView />}
        </main>
      </div>

      {/* Global Search Dialog (⌘K) */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={tab => {
          setCurrentTab(tab);
          setSearchOpen(false);
        }}
      />
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
