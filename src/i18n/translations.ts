export type Language = 'en' | 'ur' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ur: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation & Tabs
  'nav.dashboard': {
    en: 'Dashboard',
    ur: 'ڈیش بورڈ',
    ar: 'لوحة التحكم',
  },
  'nav.sales': {
    en: 'Sales & POS',
    ur: 'سیلز اور کاؤنٹر',
    ar: 'المبيعات ونقاط البيع',
  },
  'nav.repairs': {
    en: 'Mobile Repairs',
    ur: 'موبائل ریپئر سروس',
    ar: 'صيانة الجوالات',
  },
  'nav.purchases': {
    en: 'Purchases',
    ur: 'خریداری و بلز',
    ar: 'المشتريات والفواتير',
  },
  'nav.installments': {
    en: 'Installments',
    ur: 'اقساط سنٹر',
    ar: 'نظام الأقساط',
  },
  'nav.inventory': {
    en: 'Inventory / Items',
    ur: 'انوینٹری و اسٹاک',
    ar: 'المخزون والمنتجات',
  },
  'nav.parties': {
    en: 'Parties & Ledgers',
    ur: 'کھاتہ اور پارٹیز',
    ar: 'العملاء والموردين',
  },
  'nav.expenses': {
    en: 'Expenses',
    ur: 'روزمرہ اخراجات',
    ar: 'المصروفات اليومية',
  },
  'nav.imei': {
    en: 'IMEI Management',
    ur: 'آئی ایم ای آئی ٹریکنگ',
    ar: 'إدارة أرقام IMEI',
  },
  'nav.returns': {
    en: 'Sale/Pur Returns',
    ur: 'واپسی مال',
    ar: 'مرتجعات المبيعات والمشتريات',
  },
  'nav.closing': {
    en: 'Daily Closing',
    ur: 'روزانہ کیش کلوزنگ',
    ar: 'الإغلاق اليومي للصندوق',
  },
  'nav.reports': {
    en: 'Reports & P&L',
    ur: 'رپورٹس اور نفع نقصان',
    ar: 'التقارير والأرباح والخسائر',
  },
  'nav.barcode': {
    en: 'Barcode & QR',
    ur: 'بارکوڈ و کیو آر',
    ar: 'الباركود ورمز QR',
  },
  'nav.whatsapp': {
    en: 'WhatsApp Gateway',
    ur: 'واٹس ایپ گیٹ وے',
    ar: 'بوابة الواتساب',
  },
  'nav.thermal': {
    en: 'Thermal Printer',
    ur: 'تھرمل پرنٹر',
    ar: 'الطابعة الحرارية',
  },
  'nav.users': {
    en: 'Users & Security',
    ur: 'اسٹاف اور سیکیورٹی',
    ar: 'المستخدمون والأمان',
  },
  'nav.settings': {
    en: 'Shop Settings',
    ur: 'دکان کی ترتیبات',
    ar: 'إعدادات المتجر',
  },
  'nav.backup': {
    en: 'Backup & Restore',
    ur: 'بیک اپ اور بحالی',
    ar: 'النسخ الاحتياطي والاستعادة',
  },

  // Auth & Multi-User
  'auth.login': {
    en: 'Log In',
    ur: 'لاگ ان کریں',
    ar: 'تسجيل الدخول',
  },
  'auth.logout': {
    en: 'Log Out',
    ur: 'لاگ آؤٹ',
    ar: 'تسجيل الخروج',
  },
  'auth.lock': {
    en: 'Lock Terminal',
    ur: 'ٹرمینل لاک کریں',
    ar: 'قفل الجهاز',
  },
  'auth.switch_user': {
    en: 'Switch User',
    ur: 'صارف تبدیل کریں',
    ar: 'تبديل المستخدم',
  },
  'auth.select_user': {
    en: 'Select Your Account',
    ur: 'اپنا اکاؤنٹ منتخب کریں',
    ar: 'اختر حسابك',
  },
  'auth.enter_pin': {
    en: 'Enter 4-Digit Security PIN',
    ur: '4 ہندسوں کا سیکیورٹی پن درج کریں',
    ar: 'أدخل رمز PIN المكون من 4 أرقام',
  },
  'auth.pin_placeholder': {
    en: 'Security PIN',
    ur: 'سیکیورٹی پن',
    ar: 'رمز PIN',
  },
  'auth.unlock': {
    en: 'Unlock Terminal',
    ur: 'ٹرمینل انلاک کریں',
    ar: 'إلغاء قفل الجهاز',
  },
  'auth.multi_user_notice': {
    en: 'Multi-User Shared PC Terminal',
    ur: 'مشترکہ کمپیوٹر ٹرمینل برائے عملہ',
    ar: 'محطة عمل مشتركة لعدة مستخدمين',
  },
  'auth.terminal_locked': {
    en: 'PC Terminal Locked',
    ur: 'کمپیوٹر ٹرمینل لاک ہے',
    ar: 'محطة العمل مقفلة',
  },
  'auth.enter_pin_to_unlock': {
    en: 'Enter PIN to unlock your active session',
    ur: 'اپنا سیشن جاری رکھنے کے لیے پن درج کریں',
    ar: 'أدخل رمز PIN لإلغاء القفل ومتابعة الجلسة',
  },
  'auth.switch_another_user': {
    en: 'Switch to Another User',
    ur: 'دوسرے صارف کا اکاؤنٹ کھولیں',
    ar: 'التبديل إلى مستخدم آخر',
  },
  'auth.unlock_btn': {
    en: 'Unlock Session',
    ur: 'سیشن انلاک کریں',
    ar: 'إلغاء قفل الجلسة',
  },
  'auth.invalid_pin': {
    en: 'Invalid PIN. Please try again.',
    ur: 'غلط پن درج کیا گیا ہے۔ دوبارہ کوشش کریں۔',
    ar: 'رمز PIN غير صحيح. يرجى المحاولة مرة أخرى.',
  },
  'auth.user_inactive': {
    en: 'This account has been deactivated.',
    ur: 'یہ صارف اکاؤنٹ غیر فعال ہے۔',
    ar: 'هذا الحساب غير مفعل.',
  },
  'auth.quick_demo_pin': {
    en: 'Quick Demo Staff Credentials:',
    ur: 'فوری آزمائشی عملہ پن:',
    ar: 'بيانات اعتماد الموظفين التجريبية:',
  },
  'auth.logged_in_as': {
    en: 'Logged in as',
    ur: 'لاگ ان شدہ بطور',
    ar: 'تم تسجيل الدخول كـ',
  },
  'auth.role': {
    en: 'Role',
    ur: 'عہدہ',
    ar: 'الدور',
  },
  'auth.clear': {
    en: 'Clear',
    ur: 'صاف کریں',
    ar: 'مسح',
  },
  'auth.back': {
    en: 'Back',
    ur: 'پیچھے',
    ar: 'رجوع',
  },

  // Common Actions
  'action.save': {
    en: 'Save',
    ur: 'محفوظ کریں',
    ar: 'حفظ',
  },
  'action.cancel': {
    en: 'Cancel',
    ur: 'منسوخ',
    ar: 'إلغاء',
  },
  'action.delete': {
    en: 'Delete',
    ur: 'حذف کریں',
    ar: 'حذف',
  },
  'action.edit': {
    en: 'Edit',
    ur: 'ترمیم کریں',
    ar: 'تعديل',
  },
  'action.search': {
    en: 'Search...',
    ur: 'تلاش کریں...',
    ar: 'بحث...',
  },
  'action.print': {
    en: 'Print',
    ur: 'پرنٹ کریں',
    ar: 'طباعة',
  },
  'action.share': {
    en: 'Share WhatsApp',
    ur: 'واٹس ایپ پر بھیجیں',
    ar: 'مشاركة عبر واتساب',
  },
  'action.export': {
    en: 'Export CSV',
    ur: 'ایکسپورٹ کریں',
    ar: 'تصدير CSV',
  },
  'action.refresh': {
    en: 'Refresh',
    ur: 'تازہ کریں',
    ar: 'تحديث',
  },
  'action.filter': {
    en: 'Filter',
    ur: 'فلٹر',
    ar: 'تصفية',
  },
  'action.view': {
    en: 'View',
    ur: 'دیکھیں',
    ar: 'عرض',
  },
  'action.close': {
    en: 'Close',
    ur: 'بند کریں',
    ar: 'إغلاق',
  },
  'action.confirm': {
    en: 'Confirm',
    ur: 'تصدیق کریں',
    ar: 'تأكيد',
  },

  // Header & Status
  'header.search_placeholder': {
    en: 'Search IMEI, Phones, Invoices, Customers (⌘K)...',
    ur: 'آئی ایم ای آئی، فون ماڈل، کسٹمر، انوائس تلاش کریں (⌘K)...',
    ar: 'بحث عن IMEI، هواتف، فواتير، عملاء (⌘K)...',
  },
  'header.new_sale': {
    en: 'New Sale (POS)',
    ur: 'نئی فروخت (کاؤنٹر)',
    ar: 'بيع جديد (كاشير)',
  },
  'header.installment_pos': {
    en: 'Installment POS',
    ur: 'اقساط کاؤنٹر',
    ar: 'أقساط جديدة',
  },
  'header.daily_closing': {
    en: 'Daily Closing',
    ur: 'روزانہ کلوزنگ',
    ar: 'الإغلاق اليومي',
  },
  'header.stock_alerts': {
    en: 'Stock Alerts',
    ur: 'اسٹاک الرٹ',
    ar: 'تنبيهات المخزون',
  },
  'header.notifications': {
    en: 'Notifications',
    ur: 'اطلاعات',
    ar: 'الإشعارات',
  },
  'header.language': {
    en: 'Language',
    ur: 'زبان',
    ar: 'اللغة',
  },
  'header.logout': {
    en: 'Log Out',
    ur: 'لاگ آؤٹ',
    ar: 'تسجيل الخروج',
  },
  'header.lock_screen': {
    en: 'Lock Terminal',
    ur: 'ٹرمینل لاک کریں',
    ar: 'قفل الجهاز',
  },
  'header.switch_user': {
    en: 'Switch User',
    ur: 'صارف تبدیل کریں',
    ar: 'تبديل المستخدم',
  },
  'header.switch_account': {
    en: 'Switch Account',
    ur: 'کھاتہ تبدیل کریں',
    ar: 'تبديل الحساب',
  },
  'header.active_terminal': {
    en: 'Shared PC Terminal Active',
    ur: 'مشترکہ کمپیوٹر ٹرمینل فعال',
    ar: 'محطة العمل المشتركة نشطة',
  },
  'header.manage_users': {
    en: 'Manage Users & Permissions',
    ur: 'صارفین اور اجازت نامے',
    ar: 'إدارة المستخدمين والصلاحيات',
  },

  // Dashboard & Metrics
  'dashboard.total_sales': {
    en: 'Total Sales',
    ur: 'کل فروخت',
    ar: 'إجمالي المبيعات',
  },
  'dashboard.total_purchases': {
    en: 'Purchases',
    ur: 'کل خریداری',
    ar: 'إجمالي المشتريات',
  },
  'dashboard.cash_collected': {
    en: 'Cash In Hand',
    ur: 'دستی نقد رقم',
    ar: 'النقد في الصندوق',
  },
  'dashboard.cash_paid': {
    en: 'Cash Paid Out',
    ur: 'ادا کردہ رقم',
    ar: 'النقد المصروف',
  },
  'dashboard.net_profit': {
    en: 'Net Profit',
    ur: 'خالص منافع',
    ar: 'صافي الأرباح',
  },
  'dashboard.stock_valuation': {
    en: 'Stock Valuation',
    ur: 'اسٹاک مالیت',
    ar: 'تقييم المخزون',
  },
  'dashboard.mobile_repairs': {
    en: 'Mobile Repairs',
    ur: 'موبائل ریپئر سروس',
    ar: 'صيانة الجوالات',
  },
  'dashboard.active_jobs': {
    en: 'Active Jobs',
    ur: 'جاری کام',
    ar: 'أعمال قيد التنفيذ',
  },
  'dashboard.receivables': {
    en: 'Outstanding Receivables',
    ur: 'وصول طلب رقم (واجبات)',
    ar: 'الذمم المدينة المستحقة',
  },
  'dashboard.payables': {
    en: 'Outstanding Payables',
    ur: 'ادائیگی طلب رقم (دینداری)',
    ar: 'الذمم الدائنة المستحقة',
  },
  'dashboard.role_admin_view': {
    en: 'Executive Business Overview (Managerial)',
    ur: 'کاروباری سربراہ خلاصہ (مینیجر)',
    ar: 'نظرة عامة تنفيذية للأعمال (إداري)',
  },
  'dashboard.role_cashier_view': {
    en: 'Counter Register & Operations Overview',
    ur: 'کاؤنٹر رجسٹر و روزانہ کارروائی خلاصہ',
    ar: 'لوحة تحكم الكاشير والصندوق',
  },
  'dashboard.role_salesman_view': {
    en: 'Sales Floor & Stock Availability Overview',
    ur: 'سیلز فلور و فون اسٹاک خلاصہ',
    ar: 'لوحة مبيعات الصالة والأجهزة',
  },
  'dashboard.role_accountant_view': {
    en: 'Accounts Ledger & Inflow/Outflow Overview',
    ur: 'اکاؤنٹس و کیش ان فلو خلاصہ',
    ar: 'لوحة الحسابات والتدفقات النقدية',
  },
  'dashboard.role_purchase_view': {
    en: 'Stock Purchasing & Reorder Overview',
    ur: 'خریداری و اسٹاک خلاصہ',
    ar: 'لوحة المشتريات والتوريدات',
  },
  'dashboard.cashier_drawer': {
    en: "Today's Drawer Cash",
    ur: 'آج کی کاؤنٹر نقد وصولی',
    ar: 'نقد الصندوق اليوم',
  },
  'dashboard.cashier_invoices': {
    en: "Counter Invoices",
    ur: 'کاؤنٹر فواتیر / بلز',
    ar: 'فواتير الكاونتر',
  },
  'dashboard.cashier_ready_repairs': {
    en: 'Repairs Ready for Pickup',
    ur: 'حوالگی کے لیے تیار فون',
    ar: 'أجهزة صيانة جاهزة للتسليم',
  },
  'dashboard.cashier_collect_due': {
    en: 'Repair Dues to Collect',
    ur: 'ریپئر بقایا وصولی',
    ar: 'مستحقات صيانة للتحصيل',
  },
  'dashboard.available_stock': {
    en: 'In-Stock Phone Units',
    ur: 'دستیاب فون اسٹاک',
    ar: 'أجهزة متوفرة للبيع',
  },
  'dashboard.privacy_notice': {
    en: 'Confidential profit margins & purchase costs are restricted to managerial staff.',
    ur: 'خالص منافع اور خریداری لاگت صرف مجاز مینیجرز کے لیے مخصوص ہے۔',
    ar: 'هوامش الأرباح وتكاليف الشراء سرية ومخصصة للإدارة فقط.',
  },

  // Repairs Module
  'repair.new_ticket': {
    en: 'New Repair Job',
    ur: 'نیا ریپئر ٹوکن',
    ar: 'طلب صيانة جديد',
  },
  'repair.ticket_no': {
    en: 'Ticket Number',
    ur: 'ٹوکن نمبر',
    ar: 'رقم التذكرة',
  },
  'repair.device': {
    en: 'Device / Brand',
    ur: 'ڈیوائس اور ماڈل',
    ar: 'الجهاز والموديل',
  },
  'repair.customer': {
    en: 'Customer',
    ur: 'گاہک / کسٹمر',
    ar: 'العميل',
  },
  'repair.complaint': {
    en: 'Customer Complaint',
    ur: 'کسٹمر کی شکایت',
    ar: 'شكوى العميل',
  },
  'repair.diagnosis': {
    en: 'Technical Diagnosis',
    ur: 'تکنیکی تشخیص',
    ar: 'التشخيص الفني',
  },
  'repair.technician': {
    en: 'Technician',
    ur: 'ٹیکنیشن',
    ar: 'الفني المسؤول',
  },
  'repair.total_charges': {
    en: 'Total Charges',
    ur: 'کل اخراجات',
    ar: 'إجمالي الرسوم',
  },
  'repair.balance_due': {
    en: 'Balance Due',
    ur: 'بقایا رقم',
    ar: 'المبلغ المتبقي',
  },
  'repair.warranty': {
    en: 'Warranty',
    ur: 'وارنٹی',
    ar: 'الضمان',
  },
  'repair.status': {
    en: 'Status',
    ur: 'حیثیت / اسٹیٹس',
    ar: 'الحالة',
  },
  'repair.track_timeline': {
    en: 'Track Timeline',
    ur: 'مرحلہ وار ٹریکنگ',
    ar: 'تتبع المراحل',
  },

  // Languages display names
  'lang.english': {
    en: 'English',
    ur: 'English (انگریزی)',
    ar: 'English (الإنجليزية)',
  },
  'lang.urdu': {
    en: 'اردو (Urdu)',
    ur: 'اردو',
    ar: 'الأردية (Urdu)',
  },
  'lang.arabic': {
    en: 'العربية (Arabic)',
    ur: 'العربية (عربی)',
    ar: 'العربية',
  },
};
