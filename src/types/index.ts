// Domain types for Mobile Shop POS, Inventory, IMEI & Installment Management System

export type Currency = 'PKR' | 'USD' | 'AED' | 'SAR';

export type PaymentMethod = 'Cash' | 'Bank' | 'JazzCash' | 'Easypaisa' | 'Cheque' | 'Other';

export type SaleType = 'Cash' | 'Credit' | 'Wholesale' | 'Installment';

export type SaleStatus = 'Paid' | 'Partial' | 'Credit' | 'Cancelled';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Partially Delivered' | 'Delivered' | 'Cancelled';

export type QuotationStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export type PurchaseStatus = 'Paid' | 'Partial' | 'Credit';

export type POStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export type IMEIStatus = 
  | 'In Stock' 
  | 'Sold' 
  | 'Returned' 
  | 'Warranty' 
  | 'Damaged' 
  | 'Lost' 
  | 'Reserved' 
  | 'Installment Active' 
  | 'Installment Completed';

export type PartyType = 'Customer' | 'Supplier' | 'Wholesale Customer' | 'Installment Customer';

export type InstallmentFrequency = 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Custom';

export type InstallmentScheduleStatus = 'Pending' | 'Paid' | 'Partial' | 'Overdue';

export type InstallmentContractStatus = 'Active' | 'Completed' | 'Defaulted' | 'Cancelled';

export type UserRole = 'Admin' | 'Manager' | 'Cashier' | 'Purchase User' | 'Accountant' | 'Salesman';

export type ExpenseCategory = 
  | 'Rent' 
  | 'Electricity' 
  | 'Internet' 
  | 'Salaries' 
  | 'Transport' 
  | 'Repair' 
  | 'Maintenance' 
  | 'Tea/Food' 
  | 'Advertisement' 
  | 'Other';

export type PTAType = 'PTA Approved' | 'Non-PTA' | 'JV (Patch)' | 'Official Warranty' | 'N/A';

export interface UserPermissions {
  viewSales: boolean;
  createSales: boolean;
  editSales: boolean;
  deleteSales: boolean;
  viewPurchases: boolean;
  createPurchases: boolean;
  viewInventory: boolean;
  manageInventory: boolean;
  viewInstallments: boolean;
  manageInstallments: boolean;
  viewParties: boolean;
  manageParties: boolean;
  viewExpenses: boolean;
  manageExpenses: boolean;
  viewReports: boolean;
  viewProfit: boolean;
  manageSettings: boolean;
  exportData: boolean;
  sendWhatsApp: boolean;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  pin: string;
  permissions: UserPermissions;
  lastLogin?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  code: string;
  barcode: string;
  brand: string;
  model: string;
  category: string;
  subcategory?: string;
  color: string;
  ram?: string;
  storage?: string;
  ptaStatus: PTAType;
  warranty: string;
  supplierId?: string;
  supplierName?: string;
  
  // 3-Tier Selling Prices + Purchase Cost
  purchasePrice: number;
  directPrice: number;       // Direct/Cash price
  installmentPrice: number;  // Price on installment plan
  wholesalePrice: number;    // Price for wholesale buyers

  minStock: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  description: string;
  image?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMEIRecord {
  id: string;
  imei1: string;
  imei2?: string;
  serialNumber?: string;
  itemId: string;
  brand: string;
  model: string;
  color: string;
  storage?: string;
  ptaStatus: PTAType;
  
  // Purchase Trace
  purchaseInvoiceId?: string;
  purchaseInvoiceNo?: string;
  purchaseDate?: string;
  supplierId?: string;
  supplierName?: string;
  purchaseCost: number;
  
  // Sale Trace
  saleInvoiceId?: string;
  saleInvoiceNo?: string;
  saleDate?: string;
  customerId?: string;
  customerName?: string;
  salePrice?: number;
  saleType?: SaleType;

  // Installment Trace
  installmentContractId?: string;
  installmentContractNo?: string;

  status: IMEIStatus;
  notes?: string;
  history: Array<{
    date: string;
    action: string;
    note: string;
    user: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  itemId: string;
  itemName: string;
  brand: string;
  model: string;
  color?: string;
  storage?: string;
  imei1?: string;
  imei2?: string;
  imeiId?: string;
  quantity: number;
  purchaseCost: number;
  unitPrice: number;
  saleType: SaleType;
  discount: number;
  tax: number;
  total: number;
  profit: number; // unitPrice - purchaseCost - discount
}

export interface SaleInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCnic?: string;
  customerAddress?: string;
  saleType: SaleType;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: SaleStatus;
  totalProfit: number;
  salesmanId: string;
  salesmanName: string;
  installmentContractId?: string;
  notes?: string;
  createdAt: string;
}

export interface SaleOrder {
  id: string;
  orderNo: string;
  date: string;
  expectedDeliveryDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  grandTotal: number;
  advancePayment: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  status: QuotationStatus;
  remarks?: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
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
}

export interface PurchaseInvoice {
  id: string;
  invoiceNo: string;
  date: string;
  time: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PurchaseStatus;
  notes?: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  date: string;
  expectedDate: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  grandTotal: number;
  status: POStatus;
  remarks?: string;
  createdAt: string;
}

export interface PaymentIn {
  id: string;
  receiptNo: string;
  date: string;
  time: string;
  customerId: string;
  customerName: string;
  previousBalance: number;
  amountReceived: number;
  newBalance: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
  type: 'Customer Credit' | 'Installment' | 'Advance' | 'Other';
  relatedInvoiceNo?: string;
  relatedContractNo?: string;
  createdAt: string;
}

export interface PaymentOut {
  id: string;
  voucherNo: string;
  date: string;
  time: string;
  supplierId: string;
  supplierName: string;
  previousBalance: number;
  amountPaid: number;
  newBalance: number;
  paymentMethod: PaymentMethod;
  referenceNo?: string;
  remarks?: string;
  relatedPurchaseInvoiceNo?: string;
  createdAt: string;
}

export interface InstallmentScheduleItem {
  id: string;
  installmentNo: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  paidDate?: string;
  status: InstallmentScheduleStatus;
  receiptNo?: string;
  notes?: string;
}

export interface InstallmentContract {
  id: string;
  contractNo: string;
  date: string;
  customerId: string;
  customerName: string;
  customerFatherName?: string;
  customerCnic: string;
  customerPhone: string;
  customerWhatsApp?: string;
  customerAddress: string;

  // Guarantor / Reference info
  guarantorName: string;
  guarantorFatherName?: string;
  guarantorCnic: string;
  guarantorPhone: string;
  guarantorAddress: string;
  guarantorRelation?: string;
  referencePerson?: string;
  referencePhone?: string;

  // Mobile / Item info
  itemId: string;
  itemName: string;
  brand: string;
  model: string;
  color: string;
  storage?: string;
  imeiId: string;
  imei1: string;
  imei2?: string;
  purchaseCost: number;

  // Financial Calculations
  directCashPrice: number;
  totalInstallmentPrice: number; // Total installment price agreed
  downPayment: number;
  remainingBalance: number;
  totalPaid: number;
  numberOfInstallments: number;
  installmentFrequency: InstallmentFrequency;
  installmentAmount: number;
  firstDueDate: string;
  nextDueDate: string;
  durationMonths: number;
  
  expectedProfit: number; // totalInstallmentPrice - purchaseCost
  realizedProfit: number; // proportional to payments

  status: InstallmentContractStatus;
  schedule: InstallmentScheduleItem[];
  payments: Array<{
    id: string;
    receiptNo: string;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    installmentNo: number;
    collectedBy: string;
    notes?: string;
  }>;
  terms: string;
  notes?: string;
  createdAt: string;
}

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  fatherName?: string;
  cnic?: string;
  mobile: string;
  whatsapp?: string;
  address: string;
  city: string;
  email?: string;
  openingBalance: number; // positive = receivable from customer / payable to supplier
  currentBalance: number;
  creditLimit?: number;
  remarks?: string;
  totalSales?: number;
  totalPurchases?: number;
  active: boolean;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  date: string;
  time: string;
  voucherNo: string;
  voucherType: 'Sale' | 'Sale Return' | 'Purchase' | 'Purchase Return' | 'Payment In' | 'Payment Out' | 'Installment' | 'Opening Balance' | 'Repair Job';
  description: string;
  debit: number;   // Amount customer owes or supplier paid back
  credit: number;  // Amount customer paid or we owe supplier
  balance: number; // Running balance
}

export interface Expense {
  id: string;
  expenseNo: string;
  date: string;
  time: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  paidTo?: string;
  referenceNo?: string;
  remarks?: string;
  createdAt: string;
}

export interface SaleReturn {
  id: string;
  returnNo: string;
  saleInvoiceNo: string;
  date: string;
  customerId: string;
  customerName: string;
  itemId: string;
  itemName: string;
  imei1?: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  itemCondition: 'Good (Return to stock)' | 'Damaged' | 'Warranty Claim';
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface PurchaseReturn {
  id: string;
  returnNo: string;
  purchaseInvoiceNo: string;
  date: string;
  supplierId: string;
  supplierName: string;
  itemId: string;
  itemName: string;
  imei1?: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export interface DayClosing {
  id: string;
  closingDate: string;
  closingTime: string;
  openedBy: string;
  closedBy: string;
  openingCash: number;
  cashSales: number;
  paymentsInCash: number;
  installmentCash: number;
  totalCashIn: number;
  
  purchasesCash: number;
  paymentsOutCash: number;
  expensesCash: number;
  refundsCash: number;
  totalCashOut: number;

  expectedCash: number;
  actualCash: number;
  difference: number; // actualCash - expectedCash (negative = shortage, positive = excess)
  notes?: string;
  status: 'Closed' | 'Draft';
  createdAt: string;
}

export interface WhatsAppMessage {
  id: string;
  timestamp: string;
  recipientPhone: string;
  recipientName: string;
  type: 'Invoice' | 'Installment Reminder' | 'Payment Receipt' | 'Quotation' | 'Custom';
  body: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  referenceId?: string;
}

export interface WhatsAppConfig {
  isConnected: boolean;
  phoneNumber?: string;
  accountName?: string;
  status: 'Disconnected' | 'Connecting' | 'Connected';
  provider: 'Direct / QR Gateway' | 'Cloud API';
  cloudApiToken?: string;
  cloudPhoneNumberId?: string;
  templates: {
    saleInvoice: string;
    installmentReminder: string;
    installmentReceipt: string;
    paymentInReceipt: string;
    outstandingBalance: string;
  };
}

export interface ThermalPrinterConfig {
  paperWidth: '58mm' | '80mm';
  fontSize: 'Small' | 'Medium' | 'Large';
  shopHeader: string;
  shopSubHeader: string;
  footerNotes: string;
  showLogo: boolean;
  showBarcode: boolean;
  autoCut: boolean;
  copies: number;
  bottomFeedLines?: number; // Empty blank lines after invoice end to prevent paper cutter from slicing text
}

export interface ShopSettings {
  businessName: string;
  tagline: string;
  logoUrl?: string;
  address: string;
  city: string;
  phone: string;
  whatsappPhone: string;
  email: string;
  ntnStrn?: string;
  currency: Currency;
  currencySymbol: string;
  taxRate: number; // percentage, e.g. 0 or 5 or 18
  invoicePrefix: string;
  nextInvoiceNum: number;
  poPrefix: string;
  nextPoNum: number;
  receiptPrefix: string;
  nextReceiptNum: number;
  installmentContractPrefix: string;
  nextContractNum: number;
  expensePrefix: string;
  nextExpenseNum: number;
  inventoryValuationMethod: 'Average Cost' | 'Last Purchase Cost' | 'FIFO';
  stockAlerts: StockAlertSettings;
  repairs: RepairSettings;
  printer: ThermalPrinterConfig;
  whatsapp: WhatsAppConfig;
}

export interface StockAlertSettings {
  enableStockAlerts: boolean;
  defaultLowStockThreshold: number; // Low quantity threshold defined in inventory settings
  criticalStockThreshold: number; // Critical threshold e.g. 1
  alertOnOutOfStock: boolean;
  notifyInDashboardBanner: boolean;
  notifyInHeaderBell: boolean;
  autoSuggestReorderQty: number;
  categoryThresholds?: Record<string, number>;
  soundAlert?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  type: 'Low Stock' | 'Payment Due' | 'Installment Overdue' | 'Daily Closing' | 'Repair Ready' | 'System';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
  itemId?: string;
  repairId?: string;
  currentStock?: number;
  threshold?: number;
  severity?: 'critical' | 'warning' | 'info';
}

// ==========================================
// REPAIR SERVICES MANAGEMENT TYPES
// ==========================================

export type RepairStatus = 
  | 'Received' 
  | 'Inspection' 
  | 'Diagnosis' 
  | 'Estimate Prepared' 
  | 'Waiting for Customer Approval' 
  | 'Approved' 
  | 'Waiting for Spare Parts' 
  | 'Under Repair' 
  | 'Testing' 
  | 'Ready for Delivery' 
  | 'Delivered' 
  | 'Cancelled' 
  | 'Returned / Unrepairable';

export type RepairPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export type ChecklistStatus = 'Working' | 'Not Working' | 'Damaged' | 'Not Tested';

export interface DeviceConditionChecklist {
  screen: ChecklistStatus;
  touch: ChecklistStatus;
  camera: ChecklistStatus;
  speaker: ChecklistStatus;
  microphone: ChecklistStatus;
  charging: ChecklistStatus;
  battery: ChecklistStatus;
  wifi: ChecklistStatus;
  bluetooth: ChecklistStatus;
  sim: ChecklistStatus;
  fingerprint: ChecklistStatus;
  faceId: ChecklistStatus;
  buttons: ChecklistStatus;
  vibration: ChecklistStatus;
  flash: ChecklistStatus;
  network: ChecklistStatus;
  body: ChecklistStatus;
  waterDamage: ChecklistStatus;
  backGlass: ChecklistStatus;
  other?: string;
}

export interface RepairAccessories {
  charger: boolean;
  cable: boolean;
  box: boolean;
  sim: boolean;
  memoryCard: boolean;
  earphones: boolean;
  backCover: boolean;
  other?: string;
}

export interface RepairPartItem {
  id: string;
  partItemId?: string; // id from inventory item if matched
  partName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  totalSelling: number;
  addedAt: string;
  addedBy: string;
}

export interface RepairStatusHistory {
  id: string;
  status: RepairStatus;
  date: string;
  time: string;
  user: string;
  technicianName?: string;
  remarks?: string;
}

export interface CustomerApproval {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Decide Later';
  date?: string;
  time?: string;
  approvedBy?: string;
  approvalMethod?: 'In-Person' | 'WhatsApp' | 'Phone Call' | 'SMS';
  remarks?: string;
}

export interface RepairDelivery {
  deliveredDate?: string;
  deliveredTime?: string;
  deliveredBy?: string;
  customerSignature?: string;
  staffSignature?: string;
  customerRemarks?: string;
}

export interface RepairWarranty {
  duration: 'No Warranty' | '7 Days' | '15 Days' | '30 Days' | '60 Days' | '90 Days' | 'Custom';
  customDays?: number;
  startDate?: string;
  expiryDate?: string;
  terms?: string;
  isWarrantyClaim?: boolean;
  originalRepairTicketNo?: string;
}

export interface RepairPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  cnic: string;
  address: string;
  specializations: string[];
  commissionRate: number; // e.g. 25%
  salary?: number;
  active: boolean;
  createdAt: string;
}

export interface RepairJob {
  id: string;
  repairNo: string; // e.g. REP-2026-00001
  date: string;
  time: string;
  
  // Customer info
  customerId?: string;
  customerName: string;
  customerFatherName?: string;
  customerPhone: string;
  customerWhatsApp?: string;
  customerCnic?: string;
  customerAddress?: string;

  // Device info
  deviceType: 'Smartphone' | 'Feature Phone' | 'Tablet' | 'Smartwatch' | 'Other';
  brand: string;
  model: string;
  imei1?: string;
  imei2?: string;
  serialNumber?: string;
  color?: string;
  storage?: string;
  devicePassword?: string;
  physicalCondition: string;
  checklist: DeviceConditionChecklist;
  accessories: RepairAccessories;
  photos: RepairPhoto[];

  // Repair info & diagnosis
  customerComplaint: string;
  problemDescription?: string;
  visibleDamage?: string;
  technicianDiagnosis?: string;
  faultFound?: string;
  requiredRepair?: string;
  technicianNotes?: string;
  priority: RepairPriority;
  status: RepairStatus;
  statusHistory: RepairStatusHistory[];
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;

  // Dates
  estimatedCompletionDate?: string;
  completedDate?: string;

  // Parts & Service Charges
  partsUsed: RepairPartItem[];
  partsCost: number;
  partsSellingPrice: number;
  laborCharge: number;
  otherCharges: number;
  discount: number;
  totalCost: number; // partsCost + labor cost
  grandTotal: number; // partsSellingPrice + laborCharge + otherCharges - discount
  advancePayment: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: 'Paid' | 'Partial' | 'Credit';
  repairProfit: number; // grandTotal - totalCost

  // Approval, Delivery, Warranty
  customerApproval: CustomerApproval;
  delivery: RepairDelivery;
  warranty: RepairWarranty;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairPayment {
  id: string;
  repairId: string;
  repairNo: string;
  receiptNo: string;
  date: string;
  time: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  type: 'Advance' | 'Partial' | 'Final / Delivery' | 'Refund';
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface RepairSettings {
  ticketPrefix: string;
  nextTicketNum: number;
  defaultWarranty: 'No Warranty' | '7 Days' | '15 Days' | '30 Days' | '60 Days' | '90 Days';
  defaultLaborCharge: number;
  defaultEstimatedDays: number;
  termsAndConditions: string;
  commonComplaints: string[];
  commonDiagnoses: string[];
  whatsappTemplates: {
    received: string;
    diagnosisCompleted: string;
    waitingForParts: string;
    inProgress: string;
    readyForCollection: string;
    delivered: string;
  };
}
