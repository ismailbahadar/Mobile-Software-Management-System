import {
  ShopSettings, User, Item, IMEIRecord, Party, SaleInvoice, SaleOrder,
  Quotation, PurchaseInvoice, PurchaseOrder, PaymentIn, PaymentOut,
  InstallmentContract, Expense, SaleReturn, PurchaseReturn, DayClosing,
  AuditLog, WhatsAppMessage, NotificationItem, SaleItem, StockAlertSettings,
  PaymentMethod, RepairJob, Technician, RepairPayment, RepairSettings,
  RepairStatus, CustomerApproval, RepairDelivery, RepairWarranty, RepairPartItem,
  RepairStatusHistory
} from '../types';
import {
  initialSettings, initialUsers, initialItems, initialIMEIs,
  initialParties, initialSales, initialPurchases, initialInstallments,
  initialExpenses, initialAuditLogs, initialWhatsAppMessages,
  initialTechnicians, initialRepairs, initialRepairPayments
} from './initialData';

const STORAGE_KEY = 'apex_mobile_pos_data_v1';

export interface AppDatabase {
  settings: ShopSettings;
  users: User[];
  currentUser: User;
  items: Item[];
  imeis: IMEIRecord[];
  parties: Party[];
  sales: SaleInvoice[];
  saleOrders: SaleOrder[];
  quotations: Quotation[];
  purchases: PurchaseInvoice[];
  purchaseOrders: PurchaseOrder[];
  paymentsIn: PaymentIn[];
  paymentsOut: PaymentOut[];
  installments: InstallmentContract[];
  repairs: RepairJob[];
  technicians: Technician[];
  repairPayments: RepairPayment[];
  expenses: Expense[];
  saleReturns: SaleReturn[];
  purchaseReturns: PurchaseReturn[];
  dayClosings: DayClosing[];
  auditLogs: AuditLog[];
  whatsappMessages: WhatsAppMessage[];
  notifications: NotificationItem[];
}

function loadInitialDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.items && parsed.items.length > 0) {
        if (!parsed.settings.stockAlerts) {
          parsed.settings.stockAlerts = initialSettings.stockAlerts;
        }
        if (!parsed.settings.repairs) {
          parsed.settings.repairs = initialSettings.repairs;
        }
        if (parsed.settings.printer && parsed.settings.printer.bottomFeedLines === undefined) {
          parsed.settings.printer.bottomFeedLines = 5;
        }
        if (!parsed.repairs || parsed.repairs.length === 0) {
          parsed.repairs = initialRepairs;
        }
        if (!parsed.technicians || parsed.technicians.length === 0) {
          parsed.technicians = initialTechnicians;
        }
        if (!parsed.repairPayments) {
          parsed.repairPayments = initialRepairPayments;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading localStorage, loading default seed data:', e);
  }

  const defaultDb: AppDatabase = {
    settings: initialSettings,
    users: initialUsers,
    currentUser: initialUsers[0],
    items: initialItems,
    imeis: initialIMEIs,
    parties: initialParties,
    sales: initialSales,
    saleOrders: [],
    quotations: [],
    purchases: initialPurchases,
    purchaseOrders: [],
    paymentsIn: [
      {
        id: 'rec-1',
        receiptNo: 'REC-2026-805',
        date: '2026-09-14',
        time: '03:30 PM',
        customerId: 'pty-cus-2',
        customerName: 'Usman Ali',
        previousBalance: 48000,
        amountReceived: 8000,
        newBalance: 40000,
        paymentMethod: 'JazzCash',
        referenceNo: 'TRX-0981248712',
        remarks: 'Installment #1 for Contract INST-2026-101',
        type: 'Installment',
        relatedContractNo: 'INST-2026-101',
        createdAt: '2026-09-14 15:30:00'
      },
      {
        id: 'rec-2',
        receiptNo: 'REC-2026-819',
        date: '2026-09-28',
        time: '05:40 PM',
        customerId: 'pty-cus-2',
        customerName: 'Usman Ali',
        previousBalance: 40000,
        amountReceived: 8000,
        newBalance: 32000,
        paymentMethod: 'Cash',
        remarks: 'Installment #2 for Contract INST-2026-101',
        type: 'Installment',
        relatedContractNo: 'INST-2026-101',
        createdAt: '2026-09-28 17:40:00'
      }
    ],
    paymentsOut: [
      {
        id: 'pout-1',
        voucherNo: 'VOU-2026-101',
        date: '2026-09-10',
        time: '11:45 AM',
        supplierId: 'pty-sup-1',
        supplierName: 'Pak Telecom Distributors',
        previousBalance: 120000,
        amountPaid: 50000,
        newBalance: 70000,
        paymentMethod: 'Bank',
        referenceNo: 'MEEZAN-FT-99120',
        remarks: 'Part payment for Samsung supply',
        createdAt: '2026-09-10 11:45:00'
      }
    ],
    installments: initialInstallments,
    repairs: initialRepairs,
    technicians: initialTechnicians,
    repairPayments: initialRepairPayments,
    expenses: initialExpenses,
    saleReturns: [],
    purchaseReturns: [],
    dayClosings: [],
    auditLogs: initialAuditLogs,
    whatsappMessages: initialWhatsAppMessages,
    notifications: [
      {
        id: 'notif-1',
        type: 'Low Stock',
        title: 'Low Stock Alert',
        message: 'Samsung Galaxy S24 Ultra stock is at 3 units (Reorder level: 1).',
        timestamp: '2026-09-28 10:00 AM',
        read: false,
      },
      {
        id: 'notif-2',
        type: 'Installment Overdue',
        title: 'Upcoming Installment Due',
        message: 'Contract INST-2026-101 (Usman Ali) installment #3 due on 15-10-2026.',
        timestamp: '2026-09-29 08:00 AM',
        read: false,
      }
    ],
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
  } catch (e) {
    console.error('Error saving defaultDb to localStorage:', e);
  }

  return defaultDb;
}

class StorageManager {
  private db: AppDatabase;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.db = loadInitialDatabase();
    this.checkStockAlerts();
  }

  public persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.db));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getDatabase(): AppDatabase {
    return this.db;
  }

  public getCurrentUser(): User {
    return this.db.currentUser || this.db.users[0];
  }

  public setCurrentUser(user: User) {
    this.db.currentUser = user;
    this.persist();
  }

  public getSettings(): ShopSettings {
    return this.db.settings;
  }

  public updateSettings(newSettings: Partial<ShopSettings>) {
    this.db.settings = { ...this.db.settings, ...newSettings };
    this.logAudit('UPDATE_SETTINGS', 'Settings', 'settings', 'Updated shop configurations');
    this.checkStockAlerts();
    this.persist();
  }

  // STOCK ALERT EVALUATION ENGINE
  public getItemThreshold(item: Item): number {
    const alertSettings = this.db.settings.stockAlerts;
    if (item.reorderLevel !== undefined && item.reorderLevel > 0) {
      return item.reorderLevel;
    }
    if (alertSettings?.categoryThresholds && alertSettings.categoryThresholds[item.category] !== undefined) {
      return alertSettings.categoryThresholds[item.category];
    }
    return alertSettings?.defaultLowStockThreshold || 3;
  }

  public checkStockAlerts() {
    const alertSettings = this.db.settings.stockAlerts;
    if (!alertSettings || !alertSettings.enableStockAlerts) return;

    const defaultThreshold = alertSettings.defaultLowStockThreshold || 3;
    const criticalThreshold = alertSettings.criticalStockThreshold ?? 1;

    for (const item of this.db.items) {
      if (!item.active) continue;
      const threshold = this.getItemThreshold(item);

      const isLow = item.currentStock <= threshold;
      const isOut = item.currentStock === 0;

      const existingAlertIdx = this.db.notifications.findIndex(
        n => n.type === 'Low Stock' && n.itemId === item.id && !n.read
      );

      if (isLow) {
        const severity: 'critical' | 'warning' = (isOut || item.currentStock <= criticalThreshold) ? 'critical' : 'warning';
        const title = isOut
          ? `Out of Stock: ${item.brand} ${item.model}`
          : `Low Stock Alert: ${item.brand} ${item.model}`;
        const message = isOut
          ? `${item.brand} ${item.model} (${item.color}) is completely out of stock (0 ${item.unit}). Immediate supplier reorder required.`
          : `${item.brand} ${item.model} stock is down to ${item.currentStock} ${item.unit} (Alert threshold: ${threshold}). Reorder suggested: ${alertSettings.autoSuggestReorderQty || 5} units.`;

        if (existingAlertIdx !== -1) {
          this.db.notifications[existingAlertIdx].currentStock = item.currentStock;
          this.db.notifications[existingAlertIdx].severity = severity;
          this.db.notifications[existingAlertIdx].title = title;
          this.db.notifications[existingAlertIdx].message = message;
          this.db.notifications[existingAlertIdx].threshold = threshold;
        } else {
          this.db.notifications.unshift({
            id: 'notif-stock-' + item.id + '-' + Date.now(),
            type: 'Low Stock',
            title,
            message,
            severity,
            itemId: item.id,
            currentStock: item.currentStock,
            threshold,
            timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
            read: false,
            link: 'inventory',
          });
        }
      } else {
        if (existingAlertIdx !== -1) {
          this.db.notifications[existingAlertIdx].read = true;
        }
      }
    }
  }

  public getLowStockItems(): Array<Item & { threshold: number; isOut: boolean; isCritical: boolean }> {
    const alertSettings = this.db.settings.stockAlerts;
    const criticalThreshold = alertSettings?.criticalStockThreshold ?? 1;

    return this.db.items
      .filter(item => {
        if (!item.active) return false;
        const threshold = this.getItemThreshold(item);
        return item.currentStock <= threshold;
      })
      .map(item => {
        const threshold = this.getItemThreshold(item);
        return {
          ...item,
          threshold,
          isOut: item.currentStock === 0,
          isCritical: item.currentStock <= criticalThreshold,
        };
      });
  }

  public getStockAlertStats() {
    const alertSettings = this.db.settings.stockAlerts;
    const isEnabled = alertSettings?.enableStockAlerts ?? true;
    const items = isEnabled ? this.getLowStockItems() : [];
    const outOfStockCount = items.filter(i => i.isOut).length;
    const criticalCount = items.filter(i => !i.isOut && i.isCritical).length;
    const warningCount = items.filter(i => !i.isOut && !i.isCritical).length;
    const defaultReorderQty = alertSettings?.autoSuggestReorderQty || 5;
    const totalRestockCost = items.reduce((sum, i) => sum + (i.purchasePrice * defaultReorderQty), 0);

    return {
      isEnabled,
      totalCount: items.length,
      outOfStockCount,
      criticalCount,
      warningCount,
      items,
      totalRestockCost,
      defaultThreshold: alertSettings?.defaultLowStockThreshold || 3,
      criticalThreshold: alertSettings?.criticalStockThreshold ?? 1,
      notifyInDashboardBanner: alertSettings?.notifyInDashboardBanner ?? true,
      autoSuggestReorderQty: defaultReorderQty,
    };
  }

  public updateStockAlertSettings(newSettings: Partial<StockAlertSettings>) {
    this.db.settings.stockAlerts = {
      ...this.db.settings.stockAlerts,
      ...newSettings,
    };
    this.logAudit('UPDATE_STOCK_ALERT_SETTINGS', 'Settings', 'stockAlerts', 'Updated inventory stock alert thresholds');
    this.checkStockAlerts();
    this.persist();
  }

  public updateItemThreshold(itemId: string, newReorderLevel: number): boolean {
    const item = this.getItemById(itemId);
    if (item) {
      item.reorderLevel = Math.max(0, newReorderLevel);
      this.logAudit('UPDATE_ITEM_THRESHOLD', 'Inventory', itemId, `Updated alert threshold for ${item.brand} ${item.model} to ${newReorderLevel}`);
      this.checkStockAlerts();
      this.persist();
      return true;
    }
    return false;
  }

  public quickRestockItem(itemId: string, quantity: number, paymentMethod: PaymentMethod = 'Cash'): boolean {
    const item = this.getItemById(itemId);
    if (!item) return false;

    const supplierId = item.supplierId || this.db.parties.find(p => p.type === 'Supplier')?.id || 'pty-sup-1';
    const supplier = this.db.parties.find(p => p.id === supplierId) || this.db.parties[0];

    const purchasePrice = item.purchasePrice;
    const grandTotal = purchasePrice * quantity;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const invoiceNo = `PO-RESTOCK-${Date.now().toString().slice(-6)}`;

    // Increment item stock
    item.currentStock += quantity;

    const purchaseInvoice: PurchaseInvoice = {
      id: 'pur-' + Date.now(),
      invoiceNo,
      date: dateStr,
      time: timeStr,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierPhone: supplier.mobile,
      items: [
        {
          id: 'p-item-' + Date.now(),
          itemId: item.id,
          itemName: `${item.brand} ${item.model} (${item.color})`,
          brand: item.brand,
          model: item.model,
          color: item.color,
          storage: item.storage,
          quantity,
          purchasePrice,
          discount: 0,
          tax: 0,
          total: grandTotal,
          imeis: [],
        }
      ],
      subtotal: grandTotal,
      discount: 0,
      tax: 0,
      grandTotal,
      paidAmount: grandTotal,
      remainingAmount: 0,
      paymentMethod,
      paymentStatus: 'Paid',
      notes: `Quick restock from Stock Alert dashboard notification (${quantity} units)`,
      createdAt: now.toISOString(),
    };

    this.db.purchases.unshift(purchaseInvoice);
    this.logAudit('QUICK_RESTOCK', 'Inventory', item.id, `Quick restocked ${quantity} units of ${item.brand} ${item.model} from ${supplier.name}`);
    this.checkStockAlerts();
    this.persist();
    return true;
  }

  public markNotificationRead(id: string) {
    const notif = this.db.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  public markAllNotificationsRead() {
    this.db.notifications.forEach(n => { n.read = true; });
    this.persist();
  }

  public clearNotification(id: string) {
    this.db.notifications = this.db.notifications.filter(n => n.id !== id);
    this.persist();
  }

  // AUDIT LOGGING
  public logAudit(action: string, module: string, recordId: string, details: string, oldValue?: string, newValue?: string) {
    const log: AuditLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleString('en-GB'),
      userId: this.getCurrentUser().id,
      userName: this.getCurrentUser().name,
      action,
      module,
      recordId,
      oldValue,
      newValue,
      details,
    };
    this.db.auditLogs.unshift(log);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 500);
    }
  }

  // ITEMS & INVENTORY
  public getItems(): Item[] {
    return this.db.items;
  }

  public getItemById(id: string): Item | undefined {
    return this.db.items.find(i => i.id === id);
  }

  public saveItem(itemData: Partial<Item>): Item {
    const isEdit = !!itemData.id;
    if (isEdit) {
      const idx = this.db.items.findIndex(i => i.id === itemData.id);
      if (idx !== -1) {
        const updated = {
          ...this.db.items[idx],
          ...itemData,
          updatedAt: new Date().toISOString().split('T')[0],
        } as Item;
        this.db.items[idx] = updated;
        this.logAudit('EDIT_ITEM', 'Inventory', updated.id, `Updated item ${updated.brand} ${updated.model}`);
        this.checkStockAlerts();
        this.persist();
        return updated;
      }
    }

    const newItem: Item = {
      id: 'item-' + Date.now(),
      code: itemData.code || ('ITM-' + Date.now().toString().slice(-4)),
      barcode: itemData.barcode || Math.floor(1000000000000 + Math.random() * 9000000000000).toString(),
      brand: itemData.brand || '',
      model: itemData.model || '',
      category: itemData.category || 'Smart Phones',
      subcategory: itemData.subcategory || '',
      color: itemData.color || 'Standard',
      ram: itemData.ram || '',
      storage: itemData.storage || '',
      ptaStatus: itemData.ptaStatus || 'PTA Approved',
      warranty: itemData.warranty || '1 Year Official',
      supplierId: itemData.supplierId,
      supplierName: itemData.supplierName,
      purchasePrice: Number(itemData.purchasePrice) || 0,
      directPrice: Number(itemData.directPrice) || 0,
      installmentPrice: Number(itemData.installmentPrice) || 0,
      wholesalePrice: Number(itemData.wholesalePrice) || 0,
      minStock: Number(itemData.minStock) || 2,
      currentStock: Number(itemData.currentStock) || 0,
      reorderLevel: Number(itemData.reorderLevel) || 1,
      unit: itemData.unit || 'Pieces',
      description: itemData.description || '',
      active: itemData.active ?? true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.db.items.unshift(newItem);
    this.logAudit('CREATE_ITEM', 'Inventory', newItem.id, `Added new product ${newItem.brand} ${newItem.model}`);
    this.checkStockAlerts();
    this.persist();
    return newItem;
  }

  public deleteItem(id: string): boolean {
    const item = this.getItemById(id);
    if (!item) return false;
    // Check if IMEI or sales exist
    const hasImei = this.db.imeis.some(im => im.itemId === id && im.status === 'In Stock');
    if (hasImei) {
      alert('Cannot delete item that has active stock IMEIs. Adjust or remove IMEI records first.');
      return false;
    }
    this.db.items = this.db.items.filter(i => i.id !== id);
    this.logAudit('DELETE_ITEM', 'Inventory', id, `Deleted item ${item.brand} ${item.model}`);
    this.persist();
    return true;
  }

  // IMEIs
  public getIMEIs(): IMEIRecord[] {
    return this.db.imeis;
  }

  public getAvailableIMEIsForItem(itemId: string): IMEIRecord[] {
    return this.db.imeis.filter(im => im.itemId === itemId && im.status === 'In Stock');
  }

  public getIMEIByNumber(imeiStr: string): IMEIRecord | undefined {
    const clean = imeiStr.trim();
    return this.db.imeis.find(im => im.imei1 === clean || im.imei2 === clean || im.serialNumber === clean);
  }

  public addIMEIRecord(data: Partial<IMEIRecord>): IMEIRecord {
    const exists = this.getIMEIByNumber(data.imei1 || '');
    if (exists) {
      throw new Error(`IMEI ${data.imei1} is already registered in the system (Status: ${exists.status})`);
    }

    const newRecord: IMEIRecord = {
      id: 'imei-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      imei1: data.imei1!.trim(),
      imei2: data.imei2?.trim(),
      serialNumber: data.serialNumber?.trim(),
      itemId: data.itemId!,
      brand: data.brand || '',
      model: data.model || '',
      color: data.color || '',
      storage: data.storage,
      ptaStatus: data.ptaStatus || 'Official Warranty',
      purchaseInvoiceId: data.purchaseInvoiceId,
      purchaseInvoiceNo: data.purchaseInvoiceNo,
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      purchaseCost: data.purchaseCost || 0,
      status: 'In Stock',
      history: [
        {
          date: new Date().toLocaleString('en-GB'),
          action: 'Purchased / Registered',
          note: `Added by ${this.getCurrentUser().name}`,
          user: this.getCurrentUser().name,
        }
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    this.db.imeis.unshift(newRecord);
    // increment stock
    const item = this.getItemById(newRecord.itemId);
    if (item) {
      item.currentStock += 1;
    }
    this.persist();
    return newRecord;
  }

  // SALES POS TRANSACTION
  public createSale(saleData: {
    customer: Party | { name: string; mobile: string; cnic?: string; address?: string };
    items: SaleItem[];
    discount: number;
    tax: number;
    paidAmount: number;
    paymentMethod: any;
    saleType: any;
    notes?: string;
  }): SaleInvoice {
    // 1. Validate items & IMEIs
    for (const item of saleData.items) {
      const dbItem = this.getItemById(item.itemId);
      if (!dbItem) throw new Error(`Product ${item.itemName} not found`);
      if (item.imei1) {
        const imeiRec = this.getIMEIByNumber(item.imei1);
        if (!imeiRec) throw new Error(`IMEI ${item.imei1} is not registered in system`);
        if (imeiRec.status !== 'In Stock') {
          throw new Error(`IMEI ${item.imei1} is already marked as ${imeiRec.status}`);
        }
      } else if (dbItem.currentStock < item.quantity) {
        throw new Error(`Insufficient stock for ${dbItem.brand} ${dbItem.model}. Available: ${dbItem.currentStock}`);
      }
    }

    const subtotal = saleData.items.reduce((sum, it) => sum + it.total, 0);
    const grandTotal = Math.max(0, subtotal - (saleData.discount || 0) + (saleData.tax || 0));
    const paid = Math.min(grandTotal, Math.max(0, saleData.paidAmount || 0));
    const remaining = grandTotal - paid;

    let paymentStatus: 'Paid' | 'Partial' | 'Credit' = 'Paid';
    if (paid === 0) paymentStatus = 'Credit';
    else if (remaining > 0) paymentStatus = 'Partial';

    // 2. Invoice number
    const prefix = this.db.settings.invoicePrefix;
    const invNum = this.db.settings.nextInvoiceNum;
    const invoiceNo = `${prefix}${invNum}`;
    this.db.settings.nextInvoiceNum += 1;

    // 3. Customer handling
    let customerId = 'pty-walk-in';
    let customerName = 'Walk-in Customer';
    let customerPhone = '0300-0000000';
    let customerCnic = '';
    let customerAddress = '';

    if ('id' in saleData.customer && (saleData.customer as any).id) {
      const existing = this.db.parties.find(p => p.id === (saleData.customer as any).id);
      if (existing) {
        customerId = existing.id;
        customerName = existing.name;
        customerPhone = existing.mobile;
        customerCnic = existing.cnic || '';
        customerAddress = existing.address || '';
        // If credit or partial, increase customer's balance
        if (remaining > 0) {
          existing.currentBalance += remaining;
        }
        existing.totalSales = (existing.totalSales || 0) + grandTotal;
      }
    } else {
      customerName = saleData.customer.name || 'Walk-in Customer';
      customerPhone = saleData.customer.mobile || '0300-0000000';
      customerCnic = saleData.customer.cnic || '';
      customerAddress = saleData.customer.address || '';
    }

    // 4. Calculate total profit
    const totalProfit = saleData.items.reduce((sum, it) => sum + (it.profit || 0), 0) - (saleData.discount || 0);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const saleInvoice: SaleInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNo,
      date: dateStr,
      time: timeStr,
      customerId,
      customerName,
      customerPhone,
      customerCnic,
      customerAddress,
      saleType: saleData.saleType,
      items: saleData.items,
      subtotal,
      discount: saleData.discount || 0,
      tax: saleData.tax || 0,
      grandTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentMethod: saleData.paymentMethod,
      paymentStatus,
      totalProfit,
      salesmanId: this.getCurrentUser().id,
      salesmanName: this.getCurrentUser().name,
      notes: saleData.notes,
      createdAt: now.toISOString(),
    };

    // 5. Update stock and IMEIs
    for (const it of saleData.items) {
      const itemObj = this.getItemById(it.itemId);
      if (itemObj) {
        itemObj.currentStock = Math.max(0, itemObj.currentStock - it.quantity);
      }
      if (it.imei1) {
        const imeiRec = this.getIMEIByNumber(it.imei1);
        if (imeiRec) {
          imeiRec.status = saleData.saleType === 'Installment' ? 'Installment Active' : 'Sold';
          imeiRec.saleInvoiceId = saleInvoice.id;
          imeiRec.saleInvoiceNo = invoiceNo;
          imeiRec.saleDate = dateStr;
          imeiRec.customerId = customerId;
          imeiRec.customerName = customerName;
          imeiRec.salePrice = it.unitPrice;
          imeiRec.saleType = saleData.saleType;
          imeiRec.history.push({
            date: now.toLocaleString('en-GB'),
            action: `Sold (${saleData.saleType})`,
            note: `Sold against ${invoiceNo} to ${customerName}`,
            user: this.getCurrentUser().name,
          });
        }
      }
    }

    // 6. Record payment in if paid > 0
    if (paid > 0) {
      const recNo = `${this.db.settings.receiptPrefix}${this.db.settings.nextReceiptNum++}`;
      this.db.paymentsIn.unshift({
        id: 'rec-' + Date.now(),
        receiptNo: recNo,
        date: dateStr,
        time: timeStr,
        customerId,
        customerName,
        previousBalance: 0,
        amountReceived: paid,
        newBalance: remaining,
        paymentMethod: saleData.paymentMethod,
        remarks: `Payment for Sale Invoice ${invoiceNo}`,
        type: 'Customer Credit',
        relatedInvoiceNo: invoiceNo,
        createdAt: now.toISOString(),
      });
    }

    this.db.sales.unshift(saleInvoice);
    this.logAudit('CREATE_SALE', 'Sales', saleInvoice.id, `Created sale invoice ${invoiceNo} (₨ ${grandTotal.toLocaleString()})`);
    this.checkStockAlerts();
    this.persist();
    return saleInvoice;
  }

  // PURCHASES TRANSACTION
  public createPurchase(data: {
    supplier: Party;
    items: Array<{
      itemId: string;
      itemName: string;
      brand: string;
      model: string;
      color?: string;
      storage?: string;
      imeis: Array<{ imei1: string; imei2?: string; serialNumber?: string }>;
      quantity: number;
      purchasePrice: number;
      discount: number;
      tax: number;
      total: number;
    }>;
    discount: number;
    tax: number;
    paidAmount: number;
    paymentMethod: any;
    notes?: string;
  }): PurchaseInvoice {
    const subtotal = data.items.reduce((sum, it) => sum + it.total, 0);
    const grandTotal = Math.max(0, subtotal - (data.discount || 0) + (data.tax || 0));
    const paid = Math.min(grandTotal, Math.max(0, data.paidAmount || 0));
    const remaining = grandTotal - paid;

    let paymentStatus: 'Paid' | 'Partial' | 'Credit' = 'Paid';
    if (paid === 0) paymentStatus = 'Credit';
    else if (remaining > 0) paymentStatus = 'Partial';

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const poPrefix = this.db.settings.poPrefix.replace('PO-', 'PINV-');
    const invoiceNo = `${poPrefix}${this.db.settings.nextPoNum++}`;

    const purchaseInvoice: PurchaseInvoice = {
      id: 'pur-' + Date.now(),
      invoiceNo,
      date: dateStr,
      time: timeStr,
      supplierId: data.supplier.id,
      supplierName: data.supplier.name,
      supplierPhone: data.supplier.mobile,
      items: data.items.map(it => ({
        id: 'pi-' + Math.random().toString(36).substr(2, 6),
        ...it,
      })),
      subtotal,
      discount: data.discount || 0,
      tax: data.tax || 0,
      grandTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentMethod: data.paymentMethod,
      paymentStatus,
      notes: data.notes,
      createdAt: now.toISOString(),
    };

    // Update supplier balance
    const sup = this.db.parties.find(p => p.id === data.supplier.id);
    if (sup) {
      if (remaining > 0) {
        sup.currentBalance += remaining;
      }
      sup.totalPurchases = (sup.totalPurchases || 0) + grandTotal;
    }

    // Update items & IMEIs
    for (const it of data.items) {
      const itemObj = this.getItemById(it.itemId);
      if (itemObj) {
        itemObj.currentStock += it.quantity;
        // update average purchase cost
        itemObj.purchasePrice = it.purchasePrice;
      }

      // Add IMEIs
      for (const im of it.imeis) {
        if (im.imei1 && im.imei1.trim()) {
          const exists = this.getIMEIByNumber(im.imei1.trim());
          if (!exists) {
            this.db.imeis.unshift({
              id: 'imei-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              imei1: im.imei1.trim(),
              imei2: im.imei2?.trim(),
              serialNumber: im.serialNumber?.trim(),
              itemId: it.itemId,
              brand: it.brand,
              model: it.model,
              color: it.color || 'Standard',
              storage: it.storage,
              ptaStatus: itemObj?.ptaStatus || 'Official Warranty',
              purchaseInvoiceId: purchaseInvoice.id,
              purchaseInvoiceNo: invoiceNo,
              purchaseDate: dateStr,
              supplierId: data.supplier.id,
              supplierName: data.supplier.name,
              purchaseCost: it.purchasePrice,
              status: 'In Stock',
              history: [
                {
                  date: now.toLocaleString('en-GB'),
                  action: 'Purchased',
                  note: `Invoice ${invoiceNo} from ${data.supplier.name}`,
                  user: this.getCurrentUser().name,
                }
              ],
              createdAt: dateStr,
              updatedAt: dateStr,
            });
          }
        }
      }
    }

    // Payment Out voucher if paid > 0
    if (paid > 0) {
      const vouNo = `VOU-2026-${Date.now().toString().slice(-4)}`;
      this.db.paymentsOut.unshift({
        id: 'pout-' + Date.now(),
        voucherNo: vouNo,
        date: dateStr,
        time: timeStr,
        supplierId: data.supplier.id,
        supplierName: data.supplier.name,
        previousBalance: 0,
        amountPaid: paid,
        newBalance: remaining,
        paymentMethod: data.paymentMethod,
        remarks: `Payment for Purchase Invoice ${invoiceNo}`,
        relatedPurchaseInvoiceNo: invoiceNo,
        createdAt: now.toISOString(),
      });
    }

    this.db.purchases.unshift(purchaseInvoice);
    this.logAudit('CREATE_PURCHASE', 'Purchases', purchaseInvoice.id, `Created purchase invoice ${invoiceNo} (₨ ${grandTotal.toLocaleString()})`);
    this.checkStockAlerts();
    this.persist();
    return purchaseInvoice;
  }

  // INSTALLMENT MODULE
  public createInstallmentContract(data: {
    customer: Party | { name: string; fatherName?: string; cnic: string; mobile: string; whatsapp?: string; address: string };
    guarantor: {
      name: string;
      fatherName?: string;
      cnic: string;
      phone: string;
      address: string;
      relation?: string;
    };
    referencePerson?: string;
    referencePhone?: string;
    item: Item;
    imei: IMEIRecord;
    installmentPrice: number;
    downPayment: number;
    numberOfInstallments: number;
    installmentFrequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Custom';
    firstDueDate: string;
    terms?: string;
    notes?: string;
  }): InstallmentContract {
    const imeiRec = this.getIMEIByNumber(data.imei.imei1);
    if (!imeiRec || imeiRec.status !== 'In Stock') {
      throw new Error(`Selected IMEI ${data.imei.imei1} is not available in stock`);
    }

    const totalInstallmentPrice = data.installmentPrice;
    const downPayment = Math.max(0, data.downPayment);
    const remainingBalance = Math.max(0, totalInstallmentPrice - downPayment);
    const numberOfInstallments = Math.max(1, data.numberOfInstallments);
    const installmentAmount = Math.ceil(remainingBalance / numberOfInstallments);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Customer
    let customerId = 'pty-cus-' + Date.now();
    let customerName = data.customer.name;
    let customerPhone = data.customer.mobile;
    let customerCnic = data.customer.cnic || '';
    let customerAddress = data.customer.address || '';
    let customerWhatsApp = (data.customer as any).whatsapp || data.customer.mobile;

    if ('id' in data.customer && data.customer.id) {
      const existing = this.db.parties.find(p => p.id === (data.customer as Party).id);
      if (existing) {
        customerId = existing.id;
        customerName = existing.name;
        customerPhone = existing.mobile;
        customerCnic = existing.cnic || '';
        customerAddress = existing.address;
        customerWhatsApp = existing.whatsapp || existing.mobile;
        existing.currentBalance += remainingBalance;
        existing.totalSales = (existing.totalSales || 0) + totalInstallmentPrice;
      }
    } else {
      // Create new customer party record
      const newParty: Party = {
        id: customerId,
        type: 'Installment Customer',
        name: customerName,
        fatherName: data.customer.fatherName,
        cnic: customerCnic,
        mobile: customerPhone,
        whatsapp: customerWhatsApp,
        address: customerAddress,
        city: 'Lahore',
        openingBalance: 0,
        currentBalance: remainingBalance,
        totalSales: totalInstallmentPrice,
        active: true,
        createdAt: dateStr,
      };
      this.db.parties.unshift(newParty);
    }

    // Generate schedule
    const schedule: any[] = [];
    let currentDue = new Date(data.firstDueDate);
    for (let i = 1; i <= numberOfInstallments; i++) {
      schedule.push({
        id: 'sch-' + Date.now() + '-' + i,
        installmentNo: i,
        dueDate: currentDue.toISOString().split('T')[0],
        amount: installmentAmount,
        paidAmount: 0,
        remainingAmount: installmentAmount,
        status: 'Pending',
      });

      // advance date based on frequency
      if (data.installmentFrequency === 'Daily') {
        currentDue.setDate(currentDue.getDate() + 1);
      } else if (data.installmentFrequency === 'Weekly') {
        currentDue.setDate(currentDue.getDate() + 7);
      } else if (data.installmentFrequency === 'Bi-Weekly') {
        currentDue.setDate(currentDue.getDate() + 14);
      } else {
        // Monthly
        currentDue.setMonth(currentDue.getMonth() + 1);
      }
    }

    const contractNo = `${this.db.settings.installmentContractPrefix}${this.db.settings.nextContractNum++}`;

    const payments: any[] = [];
    if (downPayment > 0) {
      const recNo = `${this.db.settings.receiptPrefix}${this.db.settings.nextReceiptNum++}`;
      payments.push({
        id: 'pay-down-' + Date.now(),
        receiptNo: recNo,
        date: dateStr,
        amount: downPayment,
        paymentMethod: 'Cash',
        installmentNo: 0,
        collectedBy: this.getCurrentUser().name,
        notes: 'Initial Down Payment'
      });
      // Payment In record
      this.db.paymentsIn.unshift({
        id: 'rec-down-' + Date.now(),
        receiptNo: recNo,
        date: dateStr,
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        customerId,
        customerName,
        previousBalance: totalInstallmentPrice,
        amountReceived: downPayment,
        newBalance: remainingBalance,
        paymentMethod: 'Cash',
        remarks: `Down payment for Installment Contract ${contractNo}`,
        type: 'Installment',
        relatedContractNo: contractNo,
        createdAt: now.toISOString(),
      });
    }

    const contract: InstallmentContract = {
      id: 'inst-' + Date.now(),
      contractNo,
      date: dateStr,
      customerId,
      customerName,
      customerFatherName: data.customer.fatherName,
      customerCnic,
      customerPhone,
      customerWhatsApp,
      customerAddress,
      guarantorName: data.guarantor.name,
      guarantorFatherName: data.guarantor.fatherName,
      guarantorCnic: data.guarantor.cnic,
      guarantorPhone: data.guarantor.phone,
      guarantorAddress: data.guarantor.address,
      guarantorRelation: data.guarantor.relation,
      referencePerson: data.referencePerson,
      referencePhone: data.referencePhone,
      itemId: data.item.id,
      itemName: `${data.item.brand} ${data.item.model}`,
      brand: data.item.brand,
      model: data.item.model,
      color: data.imei.color || data.item.color,
      storage: data.imei.storage || data.item.storage,
      imeiId: imeiRec.id,
      imei1: imeiRec.imei1,
      imei2: imeiRec.imei2,
      purchaseCost: imeiRec.purchaseCost || data.item.purchasePrice,
      directCashPrice: data.item.directPrice,
      totalInstallmentPrice,
      downPayment,
      remainingBalance,
      totalPaid: downPayment,
      numberOfInstallments,
      installmentFrequency: data.installmentFrequency,
      installmentAmount,
      firstDueDate: data.firstDueDate,
      nextDueDate: schedule[0]?.dueDate || data.firstDueDate,
      durationMonths: numberOfInstallments,
      expectedProfit: totalInstallmentPrice - (imeiRec.purchaseCost || data.item.purchasePrice),
      realizedProfit: Math.round(((downPayment) / totalInstallmentPrice) * (totalInstallmentPrice - (imeiRec.purchaseCost || data.item.purchasePrice))),
      status: 'Active',
      schedule,
      payments,
      terms: data.terms || this.db.settings.printer.footerNotes,
      notes: data.notes,
      createdAt: now.toISOString(),
    };

    // Update IMEI
    imeiRec.status = 'Installment Active';
    imeiRec.installmentContractId = contract.id;
    imeiRec.installmentContractNo = contractNo;
    imeiRec.customerId = customerId;
    imeiRec.customerName = customerName;
    imeiRec.salePrice = totalInstallmentPrice;
    imeiRec.saleType = 'Installment';
    imeiRec.history.push({
      date: now.toLocaleString('en-GB'),
      action: 'Installment Sale Started',
      note: `Contract ${contractNo} signed by ${customerName}. Down payment: ₨ ${downPayment.toLocaleString()}`,
      user: this.getCurrentUser().name,
    });

    // Update item stock
    const it = this.getItemById(data.item.id);
    if (it) {
      it.currentStock = Math.max(0, it.currentStock - 1);
    }

    this.db.installments.unshift(contract);
    this.logAudit('CREATE_INSTALLMENT', 'Installments', contract.id, `Created contract ${contractNo} for ${customerName} (₨ ${totalInstallmentPrice.toLocaleString()})`);
    this.checkStockAlerts();
    this.persist();
    return contract;
  }

  public collectInstallmentPayment(
    contractId: string,
    amount: number,
    paymentMethod: any,
    notes?: string
  ): { receiptNo: string; contract: InstallmentContract } {
    const contract = this.db.installments.find(c => c.id === contractId);
    if (!contract) throw new Error('Contract not found');
    if (contract.status === 'Completed') throw new Error('Contract is already fully paid');

    const paymentAmount = Math.min(contract.remainingBalance, Math.max(0, amount));
    if (paymentAmount <= 0) throw new Error('Invalid payment amount');

    const recNo = `${this.db.settings.receiptPrefix}${this.db.settings.nextReceiptNum++}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    // Allocate payment across schedule
    let remainingToDistribute = paymentAmount;
    let targetInstallmentNo = 1;

    for (const sch of contract.schedule) {
      if (sch.remainingAmount > 0 && remainingToDistribute > 0) {
        targetInstallmentNo = sch.installmentNo;
        const take = Math.min(sch.remainingAmount, remainingToDistribute);
        sch.paidAmount += take;
        sch.remainingAmount -= take;
        remainingToDistribute -= take;
        if (sch.remainingAmount === 0) {
          sch.status = 'Paid';
          sch.paidDate = dateStr;
          sch.receiptNo = recNo;
        } else {
          sch.status = 'Partial';
        }
      }
    }

    contract.totalPaid += paymentAmount;
    contract.remainingBalance -= paymentAmount;

    // Calculate realized profit proportional to total paid
    contract.realizedProfit = Math.round(
      (contract.totalPaid / contract.totalInstallmentPrice) * contract.expectedProfit
    );

    // Update next due date
    const pendingSch = contract.schedule.find(s => s.remainingAmount > 0);
    if (pendingSch) {
      contract.nextDueDate = pendingSch.dueDate;
    } else {
      contract.status = 'Completed';
      // Mark IMEI as Completed
      const imeiRec = this.getIMEIByNumber(contract.imei1);
      if (imeiRec) {
        imeiRec.status = 'Installment Completed';
        imeiRec.history.push({
          date: now.toLocaleString('en-GB'),
          action: 'Installment Completed',
          note: `All dues cleared for contract ${contract.contractNo}. Device handed over completely.`,
          user: this.getCurrentUser().name,
        });
      }
    }

    contract.payments.push({
      id: 'pay-' + Date.now(),
      receiptNo: recNo,
      date: dateStr,
      amount: paymentAmount,
      paymentMethod,
      installmentNo: targetInstallmentNo,
      collectedBy: this.getCurrentUser().name,
      notes,
    });

    // Update customer party balance
    const party = this.db.parties.find(p => p.id === contract.customerId);
    if (party) {
      party.currentBalance = Math.max(0, party.currentBalance - paymentAmount);
    }

    // Payment In record
    this.db.paymentsIn.unshift({
      id: 'rec-' + Date.now(),
      receiptNo: recNo,
      date: dateStr,
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      customerId: contract.customerId,
      customerName: contract.customerName,
      previousBalance: contract.remainingBalance + paymentAmount,
      amountReceived: paymentAmount,
      newBalance: contract.remainingBalance,
      paymentMethod,
      remarks: `Installment payment for contract ${contract.contractNo} (Installment #${targetInstallmentNo})`,
      type: 'Installment',
      relatedContractNo: contract.contractNo,
      createdAt: now.toISOString(),
    });

    this.logAudit('INSTALLMENT_COLLECTION', 'Installments', contract.id, `Collected ₨ ${paymentAmount.toLocaleString()} against contract ${contract.contractNo}`);
    this.persist();
    return { receiptNo: recNo, contract };
  }

  // ==========================================
  // REPAIR SERVICES MODULE METHODS
  // ==========================================

  public deleteTechnician(id: string): boolean {
    if (!this.db.technicians) return false;
    const idx = this.db.technicians.findIndex(t => t.id === id);
    if (idx !== -1) {
      const tech = this.db.technicians[idx];
      this.db.technicians.splice(idx, 1);
      this.logAudit('DELETE_TECHNICIAN', 'Repair', id, `Deleted technician ${tech.name}`);
      this.persist();
      return true;
    }
    return false;
  }

  public deleteRepairJob(id: string): boolean {
    if (!this.db.repairs) return false;
    const idx = this.db.repairs.findIndex(r => r.id === id);
    if (idx !== -1) {
      const rep = this.db.repairs[idx];
      // Restore any inventory parts used if not delivered
      if (rep.status !== 'Delivered') {
        rep.partsUsed.forEach(part => {
          if (part.partItemId) {
            const item = this.getItemById(part.partItemId);
            if (item) item.currentStock += part.quantity;
          }
        });
      }
      this.db.repairs.splice(idx, 1);
      this.logAudit('DELETE_REPAIR', 'Repair', id, `Deleted repair job ${rep.repairNo}`);
      this.persist();
      return true;
    }
    return false;
  }

  public addRepairPhoto(repairId: string, photo: { url: string; caption: string }): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;
    if (!repair.photos) repair.photos = [];
    repair.photos.push({
      id: 'photo-' + Date.now(),
      url: photo.url,
      caption: photo.caption || 'Device photo',
      uploadedAt: new Date().toLocaleString('en-GB'),
    });
    repair.updatedAt = new Date().toISOString();
    this.persist();
    return repair;
  }

  public deleteRepairPhoto(repairId: string, photoId: string): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair || !repair.photos) return repair;
    repair.photos = repair.photos.filter(p => p.id !== photoId);
    repair.updatedAt = new Date().toISOString();
    this.persist();
    return repair;
  }

  public getRepairJobs(): RepairJob[] {
    return this.db.repairs || [];
  }

  public getRepairById(id: string): RepairJob | undefined {
    return (this.db.repairs || []).find(r => r.id === id);
  }

  public getRepairByTicketNo(ticketNo: string): RepairJob | undefined {
    const clean = ticketNo.trim().toLowerCase();
    return (this.db.repairs || []).find(r => r.repairNo.toLowerCase() === clean);
  }

  public getTechnicians(): Technician[] {
    return this.db.technicians || [];
  }

  public saveTechnician(data: Partial<Technician>): Technician {
    if (!this.db.technicians) this.db.technicians = [];
    if (data.id) {
      const idx = this.db.technicians.findIndex(t => t.id === data.id);
      if (idx !== -1) {
        this.db.technicians[idx] = { ...this.db.technicians[idx], ...data } as Technician;
        this.logAudit('EDIT_TECHNICIAN', 'Repair', data.id, `Updated technician ${data.name}`);
        this.persist();
        return this.db.technicians[idx];
      }
    }

    const newTech: Technician = {
      id: 'tech-' + Date.now(),
      name: data.name || 'Technician',
      phone: data.phone || '',
      cnic: data.cnic || '',
      address: data.address || '',
      specializations: data.specializations || ['Hardware', 'Screen Replacement'],
      commissionRate: Number(data.commissionRate) || 25,
      salary: Number(data.salary) || 0,
      active: data.active ?? true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.db.technicians.unshift(newTech);
    this.logAudit('CREATE_TECHNICIAN', 'Repair', newTech.id, `Added technician ${newTech.name}`);
    this.persist();
    return newTech;
  }

  public createRepairJob(data: Partial<RepairJob>): RepairJob {
    if (!this.db.repairs) this.db.repairs = [];
    if (!this.db.repairPayments) this.db.repairPayments = [];

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Generate unique repair ticket number
    const prefix = this.db.settings.repairs?.ticketPrefix || 'REP-2026-';
    const num = this.db.settings.repairs?.nextTicketNum || 1001;
    const repairNo = `${prefix}${num}`;
    if (this.db.settings.repairs) {
      this.db.settings.repairs.nextTicketNum = num + 1;
    }

    // Customer Party linkage
    let customerId = data.customerId;
    if (!customerId && data.customerName) {
      const existing = this.db.parties.find(p => 
        (data.customerPhone && p.mobile.replace(/\D/g, '') === data.customerPhone.replace(/\D/g, '')) ||
        (data.customerName && p.name.toLowerCase() === data.customerName.toLowerCase())
      );
      if (existing) {
        customerId = existing.id;
      } else {
        const newParty = this.saveParty({
          name: data.customerName,
          fatherName: data.customerFatherName,
          mobile: data.customerPhone || '03000000000',
          whatsapp: data.customerWhatsApp || data.customerPhone,
          cnic: data.customerCnic,
          address: data.customerAddress,
          type: 'Customer',
        });
        customerId = newParty.id;
      }
    }

    const advancePayment = Number(data.advancePayment) || 0;
    const laborCharge = data.laborCharge !== undefined ? Number(data.laborCharge) : (this.db.settings.repairs?.defaultLaborCharge || 1500);
    const otherCharges = Number(data.otherCharges) || 0;
    const discount = Number(data.discount) || 0;
    const partsUsed = data.partsUsed || [];
    const partsCost = partsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    const partsSellingPrice = partsUsed.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    const grandTotal = Math.max(0, partsSellingPrice + laborCharge + otherCharges - discount);
    const remainingAmount = Math.max(0, grandTotal - advancePayment);
    const paymentStatus = remainingAmount === 0 && grandTotal > 0 ? 'Paid' : (advancePayment > 0 ? 'Partial' : 'Credit');
    const totalCost = partsCost + Math.round(laborCharge * 0.3); // technician allocation
    const repairProfit = grandTotal - totalCost;

    const initialHistory: RepairStatusHistory = {
      id: 'sh-' + Date.now(),
      status: 'Received',
      date: dateStr,
      time: timeStr,
      user: this.getCurrentUser().name,
      technicianName: data.assignedTechnicianName,
      remarks: 'Device checked in and repair ticket generated.',
    };

    const newRepair: RepairJob = {
      id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      repairNo,
      date: dateStr,
      time: timeStr,
      customerId,
      customerName: data.customerName || 'Walk-in Customer',
      customerFatherName: data.customerFatherName,
      customerPhone: data.customerPhone || '0300-0000000',
      customerWhatsApp: data.customerWhatsApp || data.customerPhone,
      customerCnic: data.customerCnic,
      customerAddress: data.customerAddress,
      deviceType: data.deviceType || 'Smartphone',
      brand: data.brand || 'Other',
      model: data.model || 'Unknown',
      imei1: data.imei1?.trim(),
      imei2: data.imei2?.trim(),
      serialNumber: data.serialNumber?.trim(),
      color: data.color || 'Standard',
      storage: data.storage,
      devicePassword: data.devicePassword,
      physicalCondition: data.physicalCondition || 'Normal wear and tear',
      checklist: data.checklist || {
        screen: 'Working',
        touch: 'Working',
        camera: 'Working',
        speaker: 'Working',
        microphone: 'Working',
        charging: 'Working',
        battery: 'Working',
        wifi: 'Working',
        bluetooth: 'Working',
        sim: 'Working',
        fingerprint: 'Not Tested',
        faceId: 'Not Tested',
        buttons: 'Working',
        vibration: 'Working',
        flash: 'Working',
        network: 'Working',
        body: 'Working',
        waterDamage: 'Working',
        backGlass: 'Working',
      },
      accessories: data.accessories || {
        charger: false,
        cable: false,
        box: false,
        sim: false,
        memoryCard: false,
        earphones: false,
        backCover: false,
      },
      photos: data.photos || [],
      customerComplaint: data.customerComplaint || 'General service inspection',
      problemDescription: data.problemDescription,
      visibleDamage: data.visibleDamage,
      technicianDiagnosis: data.technicianDiagnosis,
      faultFound: data.faultFound,
      requiredRepair: data.requiredRepair,
      technicianNotes: data.technicianNotes,
      priority: data.priority || 'Normal',
      status: 'Received',
      statusHistory: [initialHistory],
      assignedTechnicianId: data.assignedTechnicianId,
      assignedTechnicianName: data.assignedTechnicianName,
      estimatedCompletionDate: data.estimatedCompletionDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      partsUsed,
      partsCost,
      partsSellingPrice,
      laborCharge,
      otherCharges,
      discount,
      totalCost,
      grandTotal,
      advancePayment,
      paidAmount: advancePayment,
      remainingAmount,
      paymentStatus,
      repairProfit,
      customerApproval: data.customerApproval || {
        status: 'Pending',
      },
      delivery: {},
      warranty: data.warranty || {
        duration: this.db.settings.repairs?.defaultWarranty || '30 Days',
        terms: '30 days warranty on replaced parts and service labor. Excludes physical and liquid damage.',
      },
      notes: data.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // If advance payment > 0, record payment
    if (advancePayment > 0) {
      const receiptNo = `REC-REP-${Date.now().toString().slice(-6)}`;
      this.db.repairPayments.unshift({
        id: 'rpay-' + Date.now(),
        repairId: newRepair.id,
        repairNo,
        receiptNo,
        date: dateStr,
        time: timeStr,
        customerName: newRepair.customerName,
        amount: advancePayment,
        paymentMethod: 'Cash',
        type: 'Advance',
        receivedBy: this.getCurrentUser().name,
        notes: `Advance payment for Repair Ticket ${repairNo}`,
        createdAt: now.toISOString(),
      });

      this.db.paymentsIn.unshift({
        id: 'rec-' + Date.now(),
        receiptNo,
        date: dateStr,
        time: timeStr,
        customerId: customerId || 'pty-walk-in',
        customerName: newRepair.customerName,
        previousBalance: grandTotal,
        amountReceived: advancePayment,
        newBalance: remainingAmount,
        paymentMethod: 'Cash',
        remarks: `Advance for Repair Ticket ${repairNo}`,
        type: 'Customer Credit',
        relatedInvoiceNo: repairNo,
        createdAt: now.toISOString(),
      });
    }

    // Log IMEI history trace if IMEI provided
    if (newRepair.imei1) {
      const imeiRec = this.getIMEIByNumber(newRepair.imei1);
      if (imeiRec) {
        imeiRec.history.push({
          date: now.toLocaleString('en-GB'),
          action: 'Received for Repair',
          note: `Ticket ${repairNo}: ${newRepair.customerComplaint}`,
          user: this.getCurrentUser().name,
        });
      }
    }

    this.db.repairs.unshift(newRepair);
    this.logAudit('CREATE_REPAIR', 'Repair', newRepair.id, `Created repair ticket ${repairNo} for ${newRepair.customerName} (${newRepair.brand} ${newRepair.model})`);
    this.persist();
    return newRepair;
  }

  public updateRepairStatus(
    repairId: string,
    status: RepairStatus,
    remarks?: string,
    technicianName?: string
  ): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    repair.status = status;
    repair.updatedAt = now.toISOString();

    if (technicianName) {
      repair.assignedTechnicianName = technicianName;
    }

    repair.statusHistory.unshift({
      id: 'sh-' + Date.now(),
      status,
      date: dateStr,
      time: timeStr,
      user: this.getCurrentUser().name,
      technicianName: technicianName || repair.assignedTechnicianName,
      remarks,
    });

    if (status === 'Ready for Delivery') {
      repair.completedDate = dateStr;
      this.db.notifications.unshift({
        id: 'notif-repair-' + repair.id + '-' + Date.now(),
        type: 'Repair Ready',
        title: `Repair Ready: ${repair.brand} ${repair.model}`,
        message: `Ticket ${repair.repairNo} (${repair.customerName}) is fully tested & ready for collection. Balance: ₨ ${repair.remainingAmount.toLocaleString()}`,
        timestamp: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }),
        read: false,
        link: 'repairs',
        repairId: repair.id,
        severity: 'info',
      });
    }

    this.logAudit('UPDATE_REPAIR_STATUS', 'Repair', repair.id, `Changed status of ${repair.repairNo} to ${status}`);
    this.persist();
    return repair;
  }

  public updateRepairDiagnosis(
    repairId: string,
    data: {
      technicianDiagnosis?: string;
      faultFound?: string;
      requiredRepair?: string;
      laborCharge?: number;
      otherCharges?: number;
      discount?: number;
      estimatedCompletionDate?: string;
      technicianNotes?: string;
      assignedTechnicianId?: string;
      assignedTechnicianName?: string;
      priority?: any;
    }
  ): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    if (data.technicianDiagnosis !== undefined) repair.technicianDiagnosis = data.technicianDiagnosis;
    if (data.faultFound !== undefined) repair.faultFound = data.faultFound;
    if (data.requiredRepair !== undefined) repair.requiredRepair = data.requiredRepair;
    if (data.laborCharge !== undefined) repair.laborCharge = Number(data.laborCharge);
    if (data.otherCharges !== undefined) repair.otherCharges = Number(data.otherCharges);
    if (data.discount !== undefined) repair.discount = Number(data.discount);
    if (data.estimatedCompletionDate !== undefined) repair.estimatedCompletionDate = data.estimatedCompletionDate;
    if (data.technicianNotes !== undefined) repair.technicianNotes = data.technicianNotes;
    if (data.assignedTechnicianId !== undefined) repair.assignedTechnicianId = data.assignedTechnicianId;
    if (data.assignedTechnicianName !== undefined) repair.assignedTechnicianName = data.assignedTechnicianName;
    if (data.priority !== undefined) repair.priority = data.priority;

    // Recalculate totals
    repair.partsCost = repair.partsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    repair.partsSellingPrice = repair.partsUsed.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    repair.grandTotal = Math.max(0, repair.partsSellingPrice + repair.laborCharge + repair.otherCharges - repair.discount);
    repair.remainingAmount = Math.max(0, repair.grandTotal - repair.paidAmount);
    repair.paymentStatus = repair.remainingAmount === 0 && repair.grandTotal > 0 ? 'Paid' : (repair.paidAmount > 0 ? 'Partial' : 'Credit');
    repair.totalCost = repair.partsCost + Math.round(repair.laborCharge * 0.3);
    repair.repairProfit = repair.grandTotal - repair.totalCost;
    repair.updatedAt = new Date().toISOString();

    this.logAudit('UPDATE_DIAGNOSIS', 'Repair', repair.id, `Updated diagnosis and estimate for ${repair.repairNo}`);
    this.persist();
    return repair;
  }

  public addRepairPart(
    repairId: string,
    part: {
      partItemId?: string;
      partName: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
    }
  ): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    const qty = Number(part.quantity) || 1;
    const cost = Number(part.costPrice) || 0;
    const selling = Number(part.sellingPrice) || 0;

    // If partItemId matches inventory, deduct stock automatically
    if (part.partItemId) {
      const invItem = this.getItemById(part.partItemId);
      if (invItem) {
        invItem.currentStock = Math.max(0, invItem.currentStock - qty);
        this.checkStockAlerts();
      }
    }

    const newPart: RepairPartItem = {
      id: 'rpu-' + Date.now(),
      partItemId: part.partItemId,
      partName: part.partName,
      quantity: qty,
      costPrice: cost,
      sellingPrice: selling,
      totalSelling: selling * qty,
      addedAt: new Date().toLocaleString('en-GB'),
      addedBy: this.getCurrentUser().name,
    };

    repair.partsUsed.push(newPart);

    // Recalculate
    repair.partsCost = repair.partsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    repair.partsSellingPrice = repair.partsUsed.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    repair.grandTotal = Math.max(0, repair.partsSellingPrice + repair.laborCharge + repair.otherCharges - repair.discount);
    repair.remainingAmount = Math.max(0, repair.grandTotal - repair.paidAmount);
    repair.paymentStatus = repair.remainingAmount === 0 && repair.grandTotal > 0 ? 'Paid' : (repair.paidAmount > 0 ? 'Partial' : 'Credit');
    repair.totalCost = repair.partsCost + Math.round(repair.laborCharge * 0.3);
    repair.repairProfit = repair.grandTotal - repair.totalCost;
    repair.updatedAt = new Date().toISOString();

    this.logAudit('ADD_REPAIR_PART', 'Repair', repair.id, `Added part ${part.partName} (x${qty}) to ${repair.repairNo}`);
    this.persist();
    return repair;
  }

  public removeRepairPart(repairId: string, partId: string): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    const idx = repair.partsUsed.findIndex(p => p.id === partId);
    if (idx === -1) return repair;

    const removedPart = repair.partsUsed[idx];
    if (removedPart.partItemId) {
      const invItem = this.getItemById(removedPart.partItemId);
      if (invItem) {
        invItem.currentStock += removedPart.quantity;
        this.checkStockAlerts();
      }
    }

    repair.partsUsed.splice(idx, 1);

    // Recalculate
    repair.partsCost = repair.partsUsed.reduce((sum, p) => sum + (p.costPrice * p.quantity), 0);
    repair.partsSellingPrice = repair.partsUsed.reduce((sum, p) => sum + (p.sellingPrice * p.quantity), 0);
    repair.grandTotal = Math.max(0, repair.partsSellingPrice + repair.laborCharge + repair.otherCharges - repair.discount);
    repair.remainingAmount = Math.max(0, repair.grandTotal - repair.paidAmount);
    repair.paymentStatus = repair.remainingAmount === 0 && repair.grandTotal > 0 ? 'Paid' : (repair.paidAmount > 0 ? 'Partial' : 'Credit');
    repair.totalCost = repair.partsCost + Math.round(repair.laborCharge * 0.3);
    repair.repairProfit = repair.grandTotal - repair.totalCost;
    repair.updatedAt = new Date().toISOString();

    this.logAudit('REMOVE_REPAIR_PART', 'Repair', repair.id, `Removed part ${removedPart.partName} from ${repair.repairNo}`);
    this.persist();
    return repair;
  }

  public updateCustomerApproval(repairId: string, approval: CustomerApproval): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    const now = new Date();
    repair.customerApproval = {
      ...approval,
      date: approval.date || now.toISOString().split('T')[0],
      time: approval.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    if (approval.status === 'Approved') {
      this.updateRepairStatus(repair.id, 'Approved', `Approved by customer via ${approval.approvalMethod || 'In-Person'}`);
    } else if (approval.status === 'Rejected') {
      this.updateRepairStatus(repair.id, 'Cancelled', `Customer rejected estimate: ${approval.remarks || 'Too expensive'}`);
    }

    this.persist();
    return repair;
  }

  public addRepairPayment(
    repairId: string,
    amount: number,
    paymentMethod: PaymentMethod = 'Cash',
    notes?: string
  ): { receiptNo: string; payment: RepairPayment; repair: RepairJob } | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    const payAmount = Number(amount) || 0;
    if (payAmount <= 0) return undefined;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const receiptNo = `REC-REP-${Date.now().toString().slice(-6)}`;

    const payment: RepairPayment = {
      id: 'rpay-' + Date.now(),
      repairId: repair.id,
      repairNo: repair.repairNo,
      receiptNo,
      date: dateStr,
      time: timeStr,
      customerName: repair.customerName,
      amount: payAmount,
      paymentMethod,
      type: repair.paidAmount === 0 ? 'Advance' : (repair.remainingAmount <= payAmount ? 'Final / Delivery' : 'Partial'),
      receivedBy: this.getCurrentUser().name,
      notes: notes || `Payment for Repair Ticket ${repair.repairNo}`,
      createdAt: now.toISOString(),
    };

    if (!this.db.repairPayments) this.db.repairPayments = [];
    this.db.repairPayments.unshift(payment);

    // Update repair financial state
    repair.paidAmount += payAmount;
    repair.remainingAmount = Math.max(0, repair.grandTotal - repair.paidAmount);
    repair.paymentStatus = repair.remainingAmount === 0 ? 'Paid' : 'Partial';
    repair.updatedAt = now.toISOString();

    // Daybook / Cashbook integration
    this.db.paymentsIn.unshift({
      id: 'rec-' + Date.now(),
      receiptNo,
      date: dateStr,
      time: timeStr,
      customerId: repair.customerId || 'pty-walk-in',
      customerName: repair.customerName,
      previousBalance: repair.remainingAmount + payAmount,
      amountReceived: payAmount,
      newBalance: repair.remainingAmount,
      paymentMethod,
      remarks: `Repair payment for ${repair.repairNo} (${repair.brand} ${repair.model})`,
      type: 'Customer Credit',
      relatedInvoiceNo: repair.repairNo,
      createdAt: now.toISOString(),
    });

    // Update customer party balance if existing party
    if (repair.customerId) {
      const party = this.db.parties.find(p => p.id === repair.customerId);
      if (party) {
        party.currentBalance = Math.max(0, party.currentBalance - payAmount);
      }
    }

    this.logAudit('REPAIR_PAYMENT', 'Repair', repair.id, `Received payment of ₨ ${payAmount.toLocaleString()} for ${repair.repairNo} (${paymentMethod})`);
    this.persist();
    return { receiptNo, payment, repair };
  }

  public deliverRepair(
    repairId: string,
    deliveryData: {
      deliveredBy: string;
      customerSignature?: string;
      staffSignature?: string;
      customerRemarks?: string;
      paymentAmount?: number;
      paymentMethod?: PaymentMethod;
    }
  ): RepairJob | undefined {
    const repair = this.getRepairById(repairId);
    if (!repair) return undefined;

    // Collect final payment if provided
    if (deliveryData.paymentAmount && deliveryData.paymentAmount > 0) {
      this.addRepairPayment(
        repair.id,
        deliveryData.paymentAmount,
        deliveryData.paymentMethod || 'Cash',
        'Final settlement upon delivery'
      );
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate warranty expiry date
    let warrantyDays = 30;
    if (repair.warranty.duration === '7 Days') warrantyDays = 7;
    else if (repair.warranty.duration === '15 Days') warrantyDays = 15;
    else if (repair.warranty.duration === '30 Days') warrantyDays = 30;
    else if (repair.warranty.duration === '60 Days') warrantyDays = 60;
    else if (repair.warranty.duration === '90 Days') warrantyDays = 90;
    else if (repair.warranty.duration === 'No Warranty') warrantyDays = 0;
    else if (repair.warranty.customDays) warrantyDays = repair.warranty.customDays;

    const expiryDate = new Date(now.getTime() + warrantyDays * 86400000).toISOString().split('T')[0];

    repair.status = 'Delivered';
    repair.completedDate = repair.completedDate || dateStr;
    repair.delivery = {
      deliveredDate: dateStr,
      deliveredTime: timeStr,
      deliveredBy: deliveryData.deliveredBy || this.getCurrentUser().name,
      customerSignature: deliveryData.customerSignature || `${repair.customerName} (Verified at counter)`,
      staffSignature: deliveryData.staffSignature || this.getCurrentUser().name,
      customerRemarks: deliveryData.customerRemarks,
    };
    repair.warranty.startDate = dateStr;
    repair.warranty.expiryDate = expiryDate;
    repair.updatedAt = now.toISOString();

    repair.statusHistory.unshift({
      id: 'sh-' + Date.now(),
      status: 'Delivered',
      date: dateStr,
      time: timeStr,
      user: this.getCurrentUser().name,
      remarks: `Device delivered. Warranty active till ${expiryDate}. ${deliveryData.customerRemarks ? `Customer: ${deliveryData.customerRemarks}` : ''}`,
    });

    // Update IMEI history
    if (repair.imei1) {
      const imeiRec = this.getIMEIByNumber(repair.imei1);
      if (imeiRec) {
        imeiRec.history.push({
          date: now.toLocaleString('en-GB'),
          action: 'Repair Delivered',
          note: `Delivered under ${repair.repairNo}. Parts: ${repair.partsUsed.map(p => p.partName).join(', ') || 'Service only'}. Warranty till ${expiryDate}.`,
          user: this.getCurrentUser().name,
        });
      }
    }

    this.logAudit('DELIVER_REPAIR', 'Repair', repair.id, `Device ${repair.brand} ${repair.model} (Ticket ${repair.repairNo}) delivered to ${repair.customerName}`);
    this.persist();
    return repair;
  }

  public getRepairStats(filter?: {
    timeFilter?: 'today' | 'week' | 'month' | 'all';
    technicianId?: string;
    status?: string;
  }) {
    const repairs = this.getRepairJobs();
    const payments = this.db.repairPayments || [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);

    // Date matching helper
    const isDateMatch = (dStr: string) => {
      if (!filter?.timeFilter || filter.timeFilter === 'all') return true;
      if (filter.timeFilter === 'today') return dStr === todayStr;
      if (filter.timeFilter === 'month') return dStr.startsWith(currentMonth);
      return true;
    };

    const filteredRepairs = repairs.filter(r => {
      if (!isDateMatch(r.date)) return false;
      if (filter?.technicianId && r.assignedTechnicianId !== filter.technicianId) return false;
      if (filter?.status && filter.status !== 'All' && r.status !== filter.status) return false;
      return true;
    });

    const totalJobs = filteredRepairs.length;
    const newCount = filteredRepairs.filter(r => r.status === 'Received').length;
    const diagnosisCount = filteredRepairs.filter(r => r.status === 'Diagnosis' || r.status === 'Inspection').length;
    const waitingApprovalCount = filteredRepairs.filter(r => r.status === 'Waiting for Customer Approval' || r.status === 'Estimate Prepared').length;
    const waitingPartsCount = filteredRepairs.filter(r => r.status === 'Waiting for Spare Parts').length;
    const underRepairCount = filteredRepairs.filter(r => r.status === 'Under Repair' || r.status === 'Approved').length;
    const readyCount = filteredRepairs.filter(r => r.status === 'Ready for Delivery' || r.status === 'Testing').length;
    const deliveredCount = filteredRepairs.filter(r => r.status === 'Delivered').length;
    const cancelledCount = filteredRepairs.filter(r => r.status === 'Cancelled' || r.status === 'Returned / Unrepairable').length;
    
    // Active pending queue (everything not delivered or cancelled)
    const pendingJobs = filteredRepairs.filter(r => r.status !== 'Delivered' && r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable');
    const pendingCount = pendingJobs.length;

    // Overdue repairs
    const overdueJobs = pendingJobs.filter(r => r.estimatedCompletionDate && r.estimatedCompletionDate < todayStr);
    const overdueCount = overdueJobs.length;

    // Warranty repairs
    const warrantyRepairs = filteredRepairs.filter(r => r.warranty?.isWarrantyClaim);
    const warrantyCount = warrantyRepairs.length;

    // Financial calculations
    const todayPayments = payments.filter(p => p.date === todayStr);
    const todayRepairIncome = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalRevenue = filteredRepairs.reduce((sum, r) => sum + r.grandTotal, 0);
    const totalCollected = filteredRepairs.reduce((sum, r) => sum + r.paidAmount, 0);
    const pendingPayments = filteredRepairs
      .filter(r => r.status !== 'Cancelled' && r.status !== 'Returned / Unrepairable')
      .reduce((sum, r) => sum + r.remainingAmount, 0);

    const totalProfit = filteredRepairs
      .filter(r => r.status === 'Delivered')
      .reduce((sum, r) => sum + r.repairProfit, 0);

    return {
      totalJobs,
      newCount,
      pendingCount,
      diagnosisCount,
      waitingApprovalCount,
      waitingPartsCount,
      underRepairCount,
      readyCount,
      deliveredCount,
      cancelledCount,
      overdueCount,
      warrantyCount,
      todayRepairIncome,
      totalRevenue,
      totalCollected,
      pendingPayments,
      totalProfit,
      pendingJobs,
      overdueJobs,
    };
  }

  public updateRepairSettings(settings: Partial<RepairSettings>): void {
    if (!this.db.settings.repairs) {
      this.db.settings.repairs = initialSettings.repairs;
    }
    this.db.settings.repairs = {
      ...this.db.settings.repairs,
      ...settings,
    };
    this.logAudit('UPDATE_REPAIR_SETTINGS', 'Settings', 'repairSettings', 'Updated repair module settings');
    this.persist();
  }

  // EXPENSES
  public addExpense(data: {
    category: any;
    amount: number;
    paymentMethod: any;
    description: string;
    paidTo?: string;
    referenceNo?: string;
    remarks?: string;
  }): Expense {
    const now = new Date();
    const expNo = `${this.db.settings.expensePrefix}${this.db.settings.nextExpenseNum++}`;
    const exp: Expense = {
      id: 'exp-' + Date.now(),
      expenseNo: expNo,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: data.category,
      amount: Number(data.amount) || 0,
      paymentMethod: data.paymentMethod,
      description: data.description,
      paidTo: data.paidTo,
      referenceNo: data.referenceNo,
      remarks: data.remarks,
      createdAt: now.toISOString(),
    };
    this.db.expenses.unshift(exp);
    this.logAudit('ADD_EXPENSE', 'Expenses', exp.id, `Recorded expense ${expNo} - ${exp.category} (₨ ${exp.amount.toLocaleString()})`);
    this.persist();
    return exp;
  }

  public deleteExpense(id: string) {
    const exp = this.db.expenses.find(e => e.id === id);
    if (exp) {
      this.db.expenses = this.db.expenses.filter(e => e.id !== id);
      this.logAudit('DELETE_EXPENSE', 'Expenses', id, `Deleted expense ${exp.expenseNo}`);
      this.persist();
    }
  }

  // PARTIES (CUSTOMERS / SUPPLIERS)
  public saveParty(partyData: Partial<Party>): Party {
    if (partyData.id) {
      const idx = this.db.parties.findIndex(p => p.id === partyData.id);
      if (idx !== -1) {
        this.db.parties[idx] = { ...this.db.parties[idx], ...partyData } as Party;
        this.logAudit('EDIT_PARTY', 'Parties', partyData.id, `Updated party ${partyData.name}`);
        this.persist();
        return this.db.parties[idx];
      }
    }

    const newParty: Party = {
      id: 'pty-' + Date.now(),
      type: partyData.type || 'Customer',
      name: partyData.name || '',
      fatherName: partyData.fatherName,
      cnic: partyData.cnic,
      mobile: partyData.mobile || '',
      whatsapp: partyData.whatsapp || partyData.mobile,
      address: partyData.address || '',
      city: partyData.city || 'Lahore',
      email: partyData.email,
      openingBalance: Number(partyData.openingBalance) || 0,
      currentBalance: Number(partyData.openingBalance) || 0,
      creditLimit: Number(partyData.creditLimit) || 0,
      remarks: partyData.remarks,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.db.parties.unshift(newParty);
    this.logAudit('CREATE_PARTY', 'Parties', newParty.id, `Created ${newParty.type}: ${newParty.name}`);
    this.persist();
    return newParty;
  }

  // DAY CLOSING
  public saveDayClosing(actualCash: number, notes?: string): DayClosing {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Calculate today's cash flows
    const todaySalesCash = this.db.sales
      .filter(s => s.date === dateStr && s.paymentMethod === 'Cash')
      .reduce((sum, s) => sum + s.paidAmount, 0);

    const todayInstallmentsCash = this.db.installments.flatMap(c => c.payments)
      .filter(p => p.date === dateStr && p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.amount, 0);

    const todayPaymentsInCash = this.db.paymentsIn
      .filter(p => p.date === dateStr && p.paymentMethod === 'Cash' && p.type !== 'Installment')
      .reduce((sum, p) => sum + p.amountReceived, 0);

    const totalCashIn = todaySalesCash + todayInstallmentsCash + todayPaymentsInCash;

    const todayPurchasesCash = this.db.purchases
      .filter(p => p.date === dateStr && p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const todayPaymentsOutCash = this.db.paymentsOut
      .filter(p => p.date === dateStr && p.paymentMethod === 'Cash')
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const todayExpensesCash = this.db.expenses
      .filter(e => e.date === dateStr && e.paymentMethod === 'Cash')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCashOut = todayPurchasesCash + todayPaymentsOutCash + todayExpensesCash;

    const lastClosing = this.db.dayClosings[0];
    const openingCash = lastClosing ? lastClosing.actualCash : 50000;

    const expectedCash = openingCash + totalCashIn - totalCashOut;
    const difference = actualCash - expectedCash;

    const closing: DayClosing = {
      id: 'dc-' + Date.now(),
      closingDate: dateStr,
      closingTime: timeStr,
      openedBy: 'Malik Tariq',
      closedBy: this.getCurrentUser().name,
      openingCash,
      cashSales: todaySalesCash,
      paymentsInCash: todayPaymentsInCash,
      installmentCash: todayInstallmentsCash,
      totalCashIn,
      purchasesCash: todayPurchasesCash,
      paymentsOutCash: todayPaymentsOutCash,
      expensesCash: todayExpensesCash,
      refundsCash: 0,
      totalCashOut,
      expectedCash,
      actualCash,
      difference,
      notes,
      status: 'Closed',
      createdAt: now.toISOString(),
    };

    this.db.dayClosings.unshift(closing);
    this.logAudit('DAY_CLOSING', 'Financials', closing.id, `Saved daily closing for ${dateStr}. Diff: ₨ ${difference.toLocaleString()}`);
    this.persist();
    return closing;
  }

  // WHATSAPP LOGGING
  public logWhatsAppMessage(msg: {
    recipientPhone: string;
    recipientName: string;
    type: 'Invoice' | 'Installment Reminder' | 'Payment Receipt' | 'Quotation' | 'Custom';
    body: string;
    referenceId?: string;
  }) {
    const record: WhatsAppMessage = {
      id: 'wa-' + Date.now(),
      timestamp: new Date().toLocaleString('en-GB'),
      recipientPhone: msg.recipientPhone,
      recipientName: msg.recipientName,
      type: msg.type,
      body: msg.body,
      status: 'Delivered',
      referenceId: msg.referenceId,
    };
    this.db.whatsappMessages.unshift(record);
    this.persist();
  }

  // BACKUP & RESTORE
  public exportFullBackup(): string {
    return JSON.stringify(this.db, null, 2);
  }

  public importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.items || !parsed.settings) {
        throw new Error('Invalid backup file schema');
      }
      this.db = parsed;
      this.persist();
      this.logAudit('RESTORE_BACKUP', 'System', 'backup', 'Successfully restored database from backup file');
      return true;
    } catch (e: any) {
      alert('Backup restoration failed: ' + e.message);
      return false;
    }
  }

  public resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    this.db = loadInitialDatabase();
    this.notify();
  }
}

export const storage = new StorageManager();
