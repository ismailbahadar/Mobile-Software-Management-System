import { storage } from '../db/storage';
import { SaleInvoice, InstallmentContract } from '../types';

export class WhatsAppService {
  public static compileTemplate(template: string, vars: Record<string, string | number>): string {
    let result = template;
    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, String(val));
    }
    return result;
  }

  public static getInvoiceMessage(invoice: SaleInvoice): string {
    const settings = storage.getSettings();
    const itemsSummary = invoice.items.map(i => `${i.itemName} (x${i.quantity})`).join(', ');
    
    return this.compileTemplate(settings.whatsapp.templates.saleInvoice, {
      customer_name: invoice.customerName,
      shop_name: settings.businessName,
      shop_phone: settings.phone,
      invoice_no: invoice.invoiceNo,
      date: invoice.date,
      items: itemsSummary,
      total: `₨ ${invoice.grandTotal.toLocaleString()}`,
      paid: `₨ ${invoice.paidAmount.toLocaleString()}`,
      balance: `₨ ${invoice.remainingAmount.toLocaleString()}`,
    });
  }

  public static getInstallmentReminderMessage(contract: InstallmentContract): string {
    const settings = storage.getSettings();
    return this.compileTemplate(settings.whatsapp.templates.installmentReminder, {
      customer_name: contract.customerName,
      shop_name: settings.businessName,
      shop_phone: settings.phone,
      contract_no: contract.contractNo,
      installment_amount: `₨ ${contract.installmentAmount.toLocaleString()}`,
      due_date: contract.nextDueDate,
      balance: `₨ ${contract.remainingBalance.toLocaleString()}`,
    });
  }

  public static getInstallmentReceiptMessage(
    contract: InstallmentContract,
    receiptNo: string,
    paidAmount: number
  ): string {
    const settings = storage.getSettings();
    return this.compileTemplate(settings.whatsapp.templates.installmentReceipt, {
      customer_name: contract.customerName,
      shop_name: settings.businessName,
      shop_phone: settings.phone,
      contract_no: contract.contractNo,
      receipt_no: receiptNo,
      date: new Date().toISOString().split('T')[0],
      paid: `₨ ${paidAmount.toLocaleString()}`,
      balance: `₨ ${contract.remainingBalance.toLocaleString()}`,
      next_due_date: contract.nextDueDate,
    });
  }

  public static cleanPhoneForWhatsApp(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('03')) {
      clean = '92' + clean.slice(1);
    } else if (clean.startsWith('3')) {
      clean = '92' + clean;
    }
    return clean;
  }

  public static getWhatsAppWebLink(phone: string, text: string): string {
    const cleanPhone = this.cleanPhoneForWhatsApp(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  public static sendMessage(
    recipientPhone: string,
    recipientName: string,
    type: 'Invoice' | 'Installment Reminder' | 'Payment Receipt' | 'Quotation' | 'Custom',
    body: string,
    referenceId?: string
  ): { success: boolean; message: string; waLink: string } {
    // Log message inside database
    storage.logWhatsAppMessage({
      recipientPhone,
      recipientName,
      type,
      body,
      referenceId,
    });

    const waLink = this.getWhatsAppWebLink(recipientPhone, body);

    return {
      success: true,
      message: `Message dispatched successfully to ${recipientName} (${recipientPhone})`,
      waLink,
    };
  }

  public static getRepairMessage(
    repair: any,
    type: 'received' | 'diagnosisCompleted' | 'waitingForParts' | 'inProgress' | 'readyForCollection' | 'delivered' | 'estimate'
  ): string {
    const settings = storage.getSettings();
    const repTemplates = settings.repairs?.whatsappTemplates;

    const commonVars: Record<string, string | number> = {
      customer_name: repair.customerName,
      shop_name: settings.businessName,
      shop_phone: settings.phone,
      repair_no: repair.repairNo,
      brand: repair.brand,
      model: repair.model,
      complaint: repair.customerComplaint,
      diagnosis: repair.technicianDiagnosis || repair.faultFound || 'Technical diagnostic inspection completed',
      est_cost: repair.grandTotal || (repair.partsSellingPrice + repair.laborCharge) || 0,
      est_date: repair.estimatedCompletionDate || '1-2 Days',
      total: `₨ ${(repair.grandTotal || 0).toLocaleString()}`,
      paid: `₨ ${(repair.paidAmount || 0).toLocaleString()}`,
      balance: `₨ ${(repair.remainingAmount || 0).toLocaleString()}`,
      warranty: repair.warranty?.duration || '30 Days',
      warranty_expiry: repair.warranty?.expiryDate || 'N/A',
    };

    if (type === 'received') {
      const template = repTemplates?.received || 
        'Dear {customer_name},\n\nYour {brand} {model} has been safely received for repair at {shop_name}.\n\nRepair Ticket: {repair_no}\nComplaint: {complaint}\nEst. Cost: Rs. {est_cost}\nEst. Delivery: {est_date}\n\nTrack your repair anytime using Ticket #{repair_no}.\n{shop_name}';
      return this.compileTemplate(template, commonVars);
    }

    if (type === 'diagnosisCompleted' || type === 'estimate') {
      const template = repTemplates?.diagnosisCompleted ||
        'Dear {customer_name},\n\nTechnical diagnosis is complete for your {brand} {model} (Ticket #{repair_no}).\n\nDiagnosis: {diagnosis}\nTotal Estimate: {total}\n\nPlease reply with YES / APPROVED to start repair work.\n{shop_name}';
      return this.compileTemplate(template, commonVars);
    }

    if (type === 'waitingForParts') {
      const template = repTemplates?.waitingForParts ||
        'Dear {customer_name},\n\nYour repair job {repair_no} ({brand} {model}) is waiting for genuine replacement spare parts. We expect delivery shortly.\n{shop_name}';
      return this.compileTemplate(template, commonVars);
    }

    if (type === 'inProgress') {
      const template = repTemplates?.inProgress ||
        'Dear {customer_name},\n\nRepair work on your {brand} {model} (Ticket #{repair_no}) is now actively in progress on our workbench.\n{shop_name}';
      return this.compileTemplate(template, commonVars);
    }

    if (type === 'readyForCollection') {
      const template = repTemplates?.readyForCollection ||
        'Dear {customer_name},\n\nGreat news! Your {brand} {model} is fully repaired, tested, and READY FOR COLLECTION!\n\nTicket: {repair_no}\nTotal Amount: {total}\nPaid: {paid}\nRemaining Balance: {balance}\nWarranty: {warranty}\n\nKindly visit {shop_name} to collect your device.';
      return this.compileTemplate(template, commonVars);
    }

    if (type === 'delivered') {
      const template = repTemplates?.delivered ||
        'Dear {customer_name},\n\nThank you for collecting your device {brand} {model} (Ticket #{repair_no}).\n\nWarranty: {warranty} (Valid till {warranty_expiry}).\n\nThank you for choosing {shop_name}!';
      return this.compileTemplate(template, commonVars);
    }

    return `Repair Update (${repair.repairNo}): ${repair.brand} ${repair.model} status is currently ${repair.status}. Balance: ₨ ${repair.remainingAmount.toLocaleString()}`;
  }

  public static sendRepairWhatsApp(
    repair: any,
    type: 'received' | 'diagnosisCompleted' | 'waitingForParts' | 'inProgress' | 'readyForCollection' | 'delivered' | 'estimate'
  ): { success: boolean; message: string; waLink: string } {
    const text = this.getRepairMessage(repair, type);
    const phone = repair.customerWhatsApp || repair.customerPhone;
    return this.sendMessage(phone, repair.customerName, 'Custom', text, repair.repairNo);
  }
}
