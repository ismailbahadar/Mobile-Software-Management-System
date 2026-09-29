import React, { useState } from 'react';
import {
  DollarSign, ShoppingCart, Truck, CalendarCheck, TrendingUp,
  AlertTriangle, Users, Smartphone, ArrowUpRight, ArrowDownLeft,
  Clock, Share2, Plus, CreditCard, Sliders, MessageSquare, RefreshCw,
  ShoppingBag, Wrench, Shield, ShieldCheck, Lock, CheckCircle2,
  Wallet, Receipt, Sparkles, Building2, BellRing
} from 'lucide-react';
import { storage } from '../../db/storage';
import { MainTab } from '../layout/Sidebar';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';
import { StockAlertBanner } from './StockAlertBanner';
import { InventorySettingsModal } from '../inventory/InventorySettingsModal';
import { ItemThresholdModal } from '../inventory/ItemThresholdModal';
import { Item } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface DashboardViewProps {
  onNavigate: (tab: MainTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { t, direction } = useLanguage();
  const db = storage.getDatabase();

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedThresholdItem, setSelectedThresholdItem] = useState<Item | null>(null);
  const [stockFilterTab, setStockFilterTab] = useState<'all' | 'out' | 'critical' | 'low'>('all');
  const [restockingItemId, setRestockingItemId] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = todayStr.substring(0, 7);

  // Role permissions checking
  const isManagerial = currentUser.role === 'Admin' || currentUser.role === 'Manager' || !!currentUser.permissions?.viewProfit;
  const isCashier = currentUser.role === 'Cashier';
  const isSalesman = currentUser.role === 'Salesman';
  const isAccountant = currentUser.role === 'Accountant';
  const isPurchaseUser = currentUser.role === 'Purchase User';

  // Time filter logic
  const isMatch = (dateStr: string) => {
    if (timeFilter === 'today') return dateStr === todayStr;
    if (timeFilter === 'month') return dateStr.startsWith(currentMonth);
    return true; // 'all'
  };

  const filteredSales = db.sales.filter(s => isMatch(s.date));
  const filteredPurchases = db.purchases.filter(p => isMatch(p.date));
  const filteredExpenses = db.expenses.filter(e => isMatch(e.date));
  const filteredInstallments = db.installments.filter(c => isMatch(c.date));

  // Sales & Cash Metrics
  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalPurchasesAmount = filteredPurchases.reduce((sum, p) => sum + p.grandTotal, 0);

  const cashReceivedFromSales = filteredSales
    .filter(s => s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + s.paidAmount, 0);

  const installmentCashCollected = db.installments
    .flatMap(c => c.payments)
    .filter(p => isMatch(p.date) && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCashReceived = cashReceivedFromSales + installmentCashCollected;

  const cashPaidPurchases = filteredPurchases
    .filter(p => p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.paidAmount, 0);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCashPaid = cashPaidPurchases + totalExpenses;

  // Receivables & Payables
  const totalReceivables = db.parties
    .filter(p => p.type.includes('Customer'))
    .reduce((sum, p) => sum + p.currentBalance, 0);

  const totalPayables = db.parties
    .filter(p => p.type === 'Supplier')
    .reduce((sum, p) => sum + p.currentBalance, 0);

  // Profit Metrics (Restricted to Managerial Staff)
  const grossProfitSales = filteredSales.reduce((sum, s) => sum + s.totalProfit, 0);
  const grossProfitInstallments = filteredInstallments.reduce((sum, c) => sum + c.expectedProfit, 0);
  const totalGrossProfit = grossProfitSales + grossProfitInstallments;
  const netProfit = totalGrossProfit - totalExpenses;

  // Inventory & Counts
  const currentStockValuation = db.items.reduce((sum, i) => sum + (i.currentStock * i.purchasePrice), 0);
  const totalItemsSold = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, it) => iSum + it.quantity, 0);
  }, 0);
  const totalStockUnits = db.items.reduce((sum, i) => sum + i.currentStock, 0);
  const totalInStockPhoneModels = db.items.filter(i => i.currentStock > 0).length;

  // --- ROLE-TAILORED CASHIER / NON-MANAGERIAL METRICS ---
  // Today's cash collected in physical drawer:
  const todayCashSales = db.sales
    .filter(s => s.date === todayStr && s.paymentMethod === 'Cash')
    .reduce((sum, s) => sum + s.paidAmount, 0);

  const todayInstallmentCash = db.installments
    .flatMap(c => c.payments)
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayRepairCash = (db.repairPayments || [])
    .filter(p => p.date === todayStr && p.paymentMethod === 'Cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const todayDrawerCash = todayCashSales + todayInstallmentCash + todayRepairCash;

  // Today's counter invoices count & volume
  const todayInvoices = db.sales.filter(s => s.date === todayStr);
  const todayInvoicesCount = todayInvoices.length;
  const todayInvoicesAmount = todayInvoices.reduce((sum, s) => sum + s.grandTotal, 0);

  // Today's digital/bank payments
  const todayBankPayments = db.sales
    .filter(s => s.date === todayStr && (s.paymentMethod === 'Bank' || s.paymentMethod === 'JazzCash' || s.paymentMethod === 'Easypaisa'))
    .reduce((sum, s) => sum + s.paidAmount, 0);

  // Counter returns/refunds paid out today
  const todayCashReturns = (db.saleReturns || [])
    .filter(r => r.date === todayStr)
    .reduce((sum, r) => sum + r.refundAmount, 0);

  // Repairs ready for delivery (handover to customer & collect balance)
  const readyRepairs = (db.repairs || []).filter(r => r.status === 'Ready for Delivery');
  const readyRepairsCount = readyRepairs.length;
  const readyRepairsBalanceDue = readyRepairs.reduce((sum, r) => sum + r.remainingAmount, 0);

  // Active repairs count
  const activeRepairsCount = (db.repairs || []).filter(
    r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable'
  ).length;

  // Salesman personal metrics
  const mySales = filteredSales.filter(s => 
    s.salesmanId === currentUser.id || 
    (s.salesmanName && s.salesmanName.toLowerCase().includes(currentUser.name.toLowerCase().split(' ')[0]))
  );
  const mySalesCount = mySales.length > 0 ? mySales.length : filteredSales.length;
  const mySalesAmount = mySales.length > 0 ? mySales.reduce((sum, s) => sum + s.grandTotal, 0) : totalSalesAmount;

  // Stock Alerts Engine Stats
  const stockAlertStats = storage.getStockAlertStats();
  const alertSettings = db.settings.stockAlerts;
  const allLowStockItems = stockAlertStats.items;

  // Filtered low stock items for dashboard card
  const displayedLowStockItems = allLowStockItems.filter(item => {
    if (stockFilterTab === 'out') return item.isOut;
    if (stockFilterTab === 'critical') return !item.isOut && item.isCritical;
    if (stockFilterTab === 'low') return !item.isOut && !item.isCritical;
    return true; // 'all'
  });

  // Overdue or Upcoming Installments
  const overdueInstallments = db.installments.filter(c => c.status === 'Active' && c.nextDueDate <= todayStr);

  const handleWhatsAppQuickReminder = (contract: any) => {
    const message = WhatsAppService.getInstallmentReminderMessage(contract);
    const result = WhatsAppService.sendMessage(
      contract.customerPhone,
      contract.customerName,
      'Installment Reminder',
      message,
      contract.contractNo
    );
    showToast(`Installment reminder dispatched to ${contract.customerName}!`, 'success');
    if (window.confirm('Open WhatsApp Web/App as well?')) {
      window.open(result.waLink, '_blank');
    }
  };

  const handleQuickRestock = (item: Item & { threshold: number }) => {
    setRestockingItemId(item.id);
    const reorderQty = alertSettings?.autoSuggestReorderQty || 5;
    try {
      const ok = storage.quickRestockItem(item.id, reorderQty);
      if (ok) {
        showToast(`Stock replenished: +${reorderQty} units of ${item.brand} ${item.model}`, 'success');
      }
    } catch (e: any) {
      showToast(`Restock error: ${e.message}`, 'error');
    } finally {
      setRestockingItemId(null);
    }
  };

  const handleWhatsAppSupplierInquiry = (item: Item) => {
    const supplier = item.supplierId
      ? db.parties.find(p => p.id === item.supplierId)
      : db.parties.find(p => p.type === 'Supplier');
    const supplierPhone = supplier?.mobile || '03001234567';
    const supplierName = supplier?.name || item.supplierName || 'Distributor';
    const suggestedQty = alertSettings?.autoSuggestReorderQty || 5;

    const message = `Assalam-o-Alaikum ${supplierName},\n\nThis is ${db.settings.businessName} (${db.settings.city}).\nWe have reached low stock alert on ${item.brand} ${item.model} (${item.color}, ${item.storage}) with ${item.currentStock} units remaining.\n\nPlease share price quote and stock confirmation for ${suggestedQty} units.\n\nThank you!`;

    const cleanPhone = supplierPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
    showToast(`WhatsApp restock inquiry prepared for ${item.brand} ${item.model}`, 'success');
    window.open(url, '_blank');
  };

  // Helper for dashboard header title based on role
  const getRoleHeaderInfo = () => {
    if (isManagerial) {
      return {
        title: t('dashboard.role_admin_view'),
        badge: `${currentUser.role} • Full Access`,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        subtitle: 'Executive view with real-time financial pulse, cash drawers, net profits & stock valuation'
      };
    }
    if (isCashier) {
      return {
        title: t('dashboard.role_cashier_view'),
        badge: `${currentUser.name} (Cashier)`,
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        subtitle: 'Front-desk register view with cash drawer balance, counter bills, repair collections & stock availability'
      };
    }
    if (isSalesman) {
      return {
        title: t('dashboard.role_salesman_view'),
        badge: `${currentUser.name} (Sales Floor)`,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        subtitle: 'Counter sales performance, customer quotation pipeline, and in-stock phone availability'
      };
    }
    if (isAccountant) {
      return {
        title: t('dashboard.role_accountant_view'),
        badge: `${currentUser.name} (Accountant)`,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        subtitle: 'Cash inflows & outflows, party balances, customer receivables, and daily settlements'
      };
    }
    return {
      title: t('dashboard.role_purchase_view'),
      badge: `${currentUser.name} (${currentUser.role})`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      subtitle: 'Inventory intake, supplier orders, and low-stock reorder management'
    };
  };

  const headerInfo = getRoleHeaderInfo();

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Top Welcome & Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-100 tracking-tight flex flex-wrap items-center gap-2">
            <span>{headerInfo.title}</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${headerInfo.badgeColor}`}>
              {headerInfo.badge}
            </span>
          </h1>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{headerInfo.subtitle}</span>
            {!isManagerial && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/95 font-semibold bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>{t('dashboard.privacy_notice')}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Threshold Configuration Button (Only for managerial / stock managers) */}
          {isManagerial && (
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/20 rounded-xl text-xs font-semibold shadow-sm transition-all"
              title="Configure inventory low stock threshold settings"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Stock Thresholds</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-amber-500/20 text-amber-300">
                ≤{stockAlertStats.defaultThreshold}
              </span>
            </button>
          )}

          {/* Time range switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                timeFilter === 'today' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                timeFilter === 'month' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                timeFilter === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTION BAR FOR COUNTER & CASHIER OPERATIONS */}
      {isCashier && (
        <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 block">
                Cashier Shift Terminal: {currentUser.name}
              </span>
              <span className="text-[11px] text-slate-400">
                Drawer: <strong className="text-emerald-400">₨ {todayDrawerCash.toLocaleString()}</strong> cash on hand today
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('sales')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sale (POS)</span>
            </button>
            <button
              onClick={() => onNavigate('installments')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-950 transition-all active:scale-95"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Installment Payment</span>
            </button>
            <button
              onClick={() => onNavigate('repairs')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Deliver Repair ({readyRepairsCount})</span>
            </button>
            <button
              onClick={() => onNavigate('closing')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Day Closing</span>
            </button>
          </div>
        </div>
      )}

      {/* PROMINENT STOCK ALERT NOTIFICATION BANNER */}
      <StockAlertBanner
        onNavigate={onNavigate}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenItemThresholdModal={(item) => setSelectedThresholdItem(item)}
      />

      {/* PRIMARY ROLE-TAILORED KPI GRID */}
      {isManagerial ? (
        /* MANAGERIAL / EXECUTIVE KPI GRID (Full financial, profit, and valuation data) */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Total Sales */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.total_sales')}</span>
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-slate-100 font-mono">
              ₨ {totalSalesAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {filteredSales.length} invoices generated
            </div>
          </div>

          {/* Total Purchases */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.total_purchases')}</span>
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-extrabold text-slate-100 font-mono">
              ₨ {totalPurchasesAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {filteredPurchases.length} stock intake bills
            </div>
          </div>

          {/* Cash Received */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.cash_collected')}</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              ₨ {totalCashReceived.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-500/80 font-medium">
              Sales + Installments
            </div>
          </div>

          {/* Cash Paid */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.cash_paid')}</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              ₨ {totalCashPaid.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-500/80 font-medium">
              Purchases + Expenses
            </div>
          </div>

          {/* Net Profit (Confidential to Managers) */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
              <span>{t('dashboard.net_profit')}</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">
              ₨ {netProfit.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium">
              Gross: ₨ {totalGrossProfit.toLocaleString()}
            </div>
          </div>

          {/* Stock Valuation (Confidential to Managers) */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.stock_valuation')}</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-extrabold text-amber-400 font-mono">
              ₨ {currentStockValuation.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {totalStockUnits} units @ purchase cost
            </div>
          </div>
        </div>
      ) : isCashier ? (
        /* CASHIER ROLE KPI GRID (Sensitive profits & purchase costs strictly hidden) */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* 1. Today's Drawer Cash */}
          <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
              <span>{t('dashboard.cashier_drawer')}</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">
              ₨ {todayDrawerCash.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium">
              Physical cash received today
            </div>
          </div>

          {/* 2. Counter Invoices Generated */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.cashier_invoices')}</span>
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono">
              {todayInvoicesCount} Bills
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              ₨ {todayInvoicesAmount.toLocaleString()} today's volume
            </div>
          </div>

          {/* 3. Installment Cash Collected */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Installments In</span>
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-extrabold text-indigo-300 font-mono">
              ₨ {todayInstallmentCash.toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-400/80 font-medium">
              Customer monthly dues
            </div>
          </div>

          {/* 4. Cash Returns / Refunds */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.cash_paid')}</span>
              <RefreshCw className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              ₨ {todayCashReturns.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-400/80 font-medium">
              Counter refunds paid out
            </div>
          </div>

          {/* 5. Repairs Ready for Delivery */}
          <div 
            onClick={() => onNavigate('repairs')}
            className="p-3.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl space-y-1 shadow-lg cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.cashier_ready_repairs')}</span>
              <Wrench className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono">
              {readyRepairsCount} Handover
            </div>
            <div className="text-[10px] text-cyan-400 font-medium">
              ₨ {readyRepairsBalanceDue.toLocaleString()} balance to collect
            </div>
          </div>

          {/* 6. Available Stock Units */}
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{t('dashboard.available_stock')}</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-extrabold text-amber-300 font-mono">
              {totalStockUnits} Units
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {totalInStockPhoneModels} models ready to sell
            </div>
          </div>
        </div>
      ) : isSalesman ? (
        /* SALESMAN ROLE KPI GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>My Sales Volume</span>
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              ₨ {mySalesAmount.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {mySalesCount} invoices completed
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Units Sold</span>
              <Smartphone className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold text-cyan-400 font-mono">
              {totalItemsSold} Units
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Smartphones & accessories
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Available Stock</span>
              <Smartphone className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-extrabold text-amber-400 font-mono">
              {totalStockUnits} Units
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {totalInStockPhoneModels} models in store
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Quotations</span>
              <Receipt className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-extrabold text-indigo-400 font-mono">
              {db.quotations.length} Quotes
            </div>
            <div className="text-[10px] text-indigo-400/80 font-medium">
              Customer price estimates
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Installments</span>
              <CalendarCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono">
              {filteredInstallments.length} Plans
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Financed customers
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Repairs Registered</span>
              <Wrench className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono">
              {activeRepairsCount} Jobs
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              In diagnostic & service queue
            </div>
          </div>
        </div>
      ) : (
        /* ACCOUNTANT / GENERAL STAFF KPI GRID */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.cash_collected')}</span>
              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              ₨ {totalCashReceived.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 font-medium">
              Cash inflows
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>{t('dashboard.cash_paid')}</span>
              <ArrowUpRight className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              ₨ {totalCashPaid.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-400/80 font-medium">
              Disbursements & expenses
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Customer Receivables</span>
              <Users className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-lg font-extrabold text-rose-400 font-mono">
              ₨ {totalReceivables.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Outstanding ledgers
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Operating Expenses</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-lg font-extrabold text-amber-400 font-mono">
              ₨ {totalExpenses.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Rent, bills & salaries
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Installment Collections</span>
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-lg font-extrabold text-indigo-300 font-mono">
              ₨ {installmentCashCollected.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Collected installments
            </div>
          </div>

          <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Stock Units In Hand</span>
              <Smartphone className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-extrabold text-blue-300 font-mono">
              {totalStockUnits} Units
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Physical inventory count
            </div>
          </div>
        </div>
      )}

      {/* SECONDARY QUICK METRICS (Tailored to role) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Installment Collection</span>
            <span className="font-extrabold font-mono text-emerald-400 text-sm">
              ₨ {installmentCashCollected.toLocaleString()}
            </span>
          </div>
          <CalendarCheck className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">{t('dashboard.receivables')}</span>
            <span className="font-extrabold font-mono text-rose-400 text-sm">
              ₨ {totalReceivables.toLocaleString()}
            </span>
          </div>
          <Users className="w-5 h-5 text-rose-400" />
        </div>

        {/* Sensitive Payables to suppliers: Hidden from Cashiers & Salesmen */}
        {isManagerial ? (
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('dashboard.payables')}</span>
              <span className="font-extrabold font-mono text-amber-400 text-sm">
                ₨ {totalPayables.toLocaleString()}
              </span>
            </div>
            <Truck className="w-5 h-5 text-amber-400" />
          </div>
        ) : (
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">{t('dashboard.cashier_ready_repairs')}</span>
              <span className="font-extrabold font-mono text-cyan-400 text-sm">
                {readyRepairsCount} Handover (₨ {readyRepairsBalanceDue.toLocaleString()})
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
          </div>
        )}

        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-slate-400 block text-[11px]">Items Sold</span>
            <span className="font-extrabold font-mono text-slate-100 text-sm">
              {totalItemsSold} Units
            </span>
          </div>
          <Smartphone className="w-5 h-5 text-cyan-400" />
        </div>

        <div 
          onClick={() => onNavigate('repairs')}
          className="p-3 bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
        >
          <div>
            <span className="text-slate-400 block text-[11px] group-hover:text-cyan-300">{t('dashboard.mobile_repairs')}</span>
            <span className="font-extrabold font-mono text-cyan-400 text-sm">
              {activeRepairsCount} Active
            </span>
          </div>
          <Wrench className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Two Column Layout: Action Queues & Visual Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Outstanding Installments Recovery Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-100">Installment Due / Recovery Queue</h3>
            </div>
            <button
              onClick={() => onNavigate('installments')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <span>View All ({db.installments.length})</span>
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {overdueInstallments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No overdue installments today. All active customer accounts are up to date!
              </div>
            ) : (
              overdueInstallments.map(c => (
                <div
                  key={c.id}
                  className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex items-center justify-between gap-3 text-xs transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{c.customerName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{c.contractNo}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {c.itemName} • Due: <span className="text-amber-400 font-semibold">{c.nextDueDate}</span>
                    </div>
                    <div className="text-[11px] font-mono mt-0.5">
                      Due: <strong className="text-emerald-400">₨ {c.installmentAmount.toLocaleString()}</strong> | Remaining: <strong className="text-rose-400">₨ {c.remainingBalance.toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleWhatsAppQuickReminder(c)}
                    className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-all shadow-md active:scale-95 shrink-0"
                    title="Send WhatsApp Reminder"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Low Stock Alerts & Fast Reorder */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  <span>Low Stock & Availability Alerts</span>
                  {allLowStockItems.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500/20 text-amber-300">
                      {allLowStockItems.length}
                    </span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isManagerial && (
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="text-xs text-slate-400 hover:text-amber-400 font-semibold flex items-center gap-1"
                  title="Adjust low quantity thresholds defined in inventory settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Thresholds</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                <span>Check Inventory</span>
              </button>
            </div>
          </div>

          {/* Sub-filter tabs */}
          {allLowStockItems.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setStockFilterTab('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  stockFilterTab === 'all'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({allLowStockItems.length})
              </button>
              {stockAlertStats.outOfStockCount > 0 && (
                <button
                  onClick={() => setStockFilterTab('out')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    stockFilterTab === 'out'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Out of Stock ({stockAlertStats.outOfStockCount})</span>
                </button>
              )}
              {stockAlertStats.criticalCount > 0 && (
                <button
                  onClick={() => setStockFilterTab('critical')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1 ${
                    stockFilterTab === 'critical'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Critical ({stockAlertStats.criticalCount})</span>
                </button>
              )}
              {stockAlertStats.warningCount > 0 && (
                <button
                  onClick={() => setStockFilterTab('low')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    stockFilterTab === 'low'
                      ? 'bg-slate-800 text-yellow-300 border border-yellow-500/40'
                      : 'text-slate-400 hover:text-yellow-400'
                  }`}
                >
                  Low Stock ({stockAlertStats.warningCount})
                </button>
              )}
            </div>
          )}

          <div className="space-y-2 overflow-y-auto max-h-72 pr-1">
            {displayedLowStockItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <p>All inventory items are well-stocked above defined thresholds.</p>
                <p className="text-[11px] text-slate-600">
                  Global Alert Threshold: ≤{stockAlertStats.defaultThreshold} units
                </p>
              </div>
            ) : (
              displayedLowStockItems.map(item => {
                const isRestocking = restockingItemId === item.id;
                const reorderQty = alertSettings?.autoSuggestReorderQty || 5;

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      item.isOut
                        ? 'bg-rose-950/20 border-rose-500/40 hover:bg-rose-950/30'
                        : item.isCritical
                        ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          <span>{item.brand} {item.model}</span>
                          {item.isOut ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-rose-500 text-white">
                              0 Stock
                            </span>
                          ) : item.isCritical ? (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-300">
                              Critical
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-yellow-500/10 text-yellow-300">
                              Low
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.color} • {item.ram && `${item.ram}/`}{item.storage} •{' '}
                          {isManagerial ? (
                            <span className="text-slate-300 font-mono">Cost: ₨ {item.purchasePrice.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold font-mono">Retail: ₨ {item.directPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 block">Stock / Threshold</span>
                        <div className="font-mono text-xs font-black">
                          <span className={item.isOut ? 'text-rose-400' : item.isCritical ? 'text-amber-400' : 'text-yellow-300'}>
                            {item.currentStock}
                          </span>
                          <span className="text-slate-500 font-normal"> / {item.threshold} min</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[11px]">
                      {isManagerial ? (
                        <button
                          type="button"
                          onClick={() => setSelectedThresholdItem(item)}
                          className="text-slate-400 hover:text-amber-400 flex items-center gap-1 text-[10px]"
                          title="Adjust alert threshold for this item"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Threshold: {item.threshold}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Min Alert: {item.threshold} units
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        {isManagerial && (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppSupplierInquiry(item)}
                            className="p-1.5 bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 border border-teal-500/30 rounded-lg transition-colors"
                            title="WhatsApp restock inquiry to supplier"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isManagerial ? (
                          <button
                            type="button"
                            disabled={isRestocking}
                            onClick={() => handleQuickRestock(item)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
                            title={`Instantly replenish +${reorderQty} units`}
                          >
                            {isRestocking ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            <span>+{reorderQty} Restock</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onNavigate('sales')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Sell In POS</span>
                          </button>
                        )}

                        {isManagerial && (
                          <button
                            type="button"
                            onClick={() => onNavigate('purchases')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-semibold"
                          >
                            PO Bill
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Selling Mobiles Ranking Table (Cost Hidden from Non-Managerial Staff) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-wrap justify-between items-center bg-slate-950/60 gap-2">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Top Mobile Phone Models & Availability
            </h3>
            <p className="text-[11px] text-slate-500">
              {isManagerial 
                ? 'Full inventory valuation and 3-tier retail/wholesale pricing' 
                : 'Customer retail prices & real-time counter stock availability'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isManagerial && (
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                Customer Price Catalog
              </span>
            )}
            {isManagerial && (
              <span className="text-xs text-emerald-400 font-semibold">
                Cost & 3-Tier Margin Breakdown
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-2.5 px-4">Brand & Model</th>
                <th className="py-2.5 px-4">Specs & PTA</th>
                <th className="py-2.5 px-4 text-center">In Stock</th>
                {/* Cost column only displayed if user has managerial profit clearance */}
                {isManagerial && (
                  <th className="py-2.5 px-4 text-right text-rose-300">Purchase Cost (₨)</th>
                )}
                <th className="py-2.5 px-4 text-right text-emerald-400">Direct / Cash</th>
                <th className="py-2.5 px-4 text-right text-indigo-400">Installment Plan</th>
                <th className="py-2.5 px-4 text-right text-amber-400">Wholesale Price</th>
                {!isManagerial && (
                  <th className="py-2.5 px-4 text-center">Counter Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {db.items.slice(0, 8).map(it => (
                <tr key={it.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-bold text-slate-100">{it.brand} {it.model}</td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {it.color} • {it.storage} ({it.ptaStatus})
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                      it.currentStock <= 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : it.currentStock <= it.reorderLevel
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {it.currentStock} Units
                    </span>
                  </td>
                  {/* Cost column protected */}
                  {isManagerial && (
                    <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                      ₨ {it.purchasePrice.toLocaleString()}
                    </td>
                  )}
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                    ₨ {it.directPrice.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-indigo-300">
                    ₨ {it.installmentPrice.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-300">
                    ₨ {it.wholesalePrice.toLocaleString()}
                  </td>
                  {!isManagerial && (
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onNavigate('sales')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                      >
                        Sell POS
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory Stock Thresholds Settings Modal */}
      {isManagerial && (
        <InventorySettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Individual Item Threshold Modal */}
      {isManagerial && (
        <ItemThresholdModal
          item={selectedThresholdItem}
          isOpen={!!selectedThresholdItem}
          onClose={() => setSelectedThresholdItem(null)}
        />
      )}
    </div>
  );
};
