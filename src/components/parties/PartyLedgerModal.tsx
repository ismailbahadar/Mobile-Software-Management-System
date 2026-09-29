import React, { useState } from 'react';
import { X, Printer, Share2, Download, FileText, User, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Party, LedgerEntry } from '../../types';
import { storage } from '../../db/storage';
import { ExportService } from '../../services/exportService';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';

interface PartyLedgerModalProps {
  party: Party | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PartyLedgerModal: React.FC<PartyLedgerModalProps> = ({
  party,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;

  if (!isOpen || !party) return null;

  // Generate dynamic statement entries from sales, purchases, payments, installments
  const entries: LedgerEntry[] = [];
  let runningBalance = party.openingBalance || 0;

  if (party.openingBalance > 0) {
    entries.push({
      id: 'led-open',
      partyId: party.id,
      date: party.createdAt,
      time: '09:00 AM',
      voucherNo: 'OPN-BAL',
      voucherType: 'Opening Balance',
      description: 'Opening Account Balance',
      debit: party.type.includes('Customer') ? party.openingBalance : 0,
      credit: party.type === 'Supplier' ? party.openingBalance : 0,
      balance: runningBalance,
    });
  }

  // Sales (if customer)
  const partySales = db.sales.filter(s => s.customerId === party.id);
  partySales.forEach(s => {
    runningBalance += s.grandTotal;
    entries.push({
      id: 'led-s-' + s.id,
      partyId: party.id,
      date: s.date,
      time: s.time,
      voucherNo: s.invoiceNo,
      voucherType: 'Sale',
      description: `Sale Invoice (${s.items.map(i => i.itemName).join(', ')})`,
      debit: s.grandTotal,
      credit: 0,
      balance: runningBalance,
    });

    if (s.paidAmount > 0) {
      runningBalance -= s.paidAmount;
      entries.push({
        id: 'led-spay-' + s.id,
        partyId: party.id,
        date: s.date,
        time: s.time,
        voucherNo: s.invoiceNo + '-PAY',
        voucherType: 'Payment In',
        description: `Cash/Online Payment on bill (${s.paymentMethod})`,
        debit: 0,
        credit: s.paidAmount,
        balance: runningBalance,
      });
    }
  });

  // Payments In
  const partyPaymentsIn = db.paymentsIn.filter(p => p.customerId === party.id && !p.relatedInvoiceNo);
  partyPaymentsIn.forEach(p => {
    runningBalance -= p.amountReceived;
    entries.push({
      id: 'led-pin-' + p.id,
      partyId: party.id,
      date: p.date,
      time: p.time,
      voucherNo: p.receiptNo,
      voucherType: 'Payment In',
      description: p.remarks || 'Customer Payment Receipt',
      debit: 0,
      credit: p.amountReceived,
      balance: runningBalance,
    });
  });

  // Mobile Repairs (if customer) - Section N & O
  const partyRepairs = (db.repairs || []).filter(r => 
    r.customerId === party.id || 
    (party.mobile && r.customerPhone && r.customerPhone.replace(/\D/g, '') === party.mobile.replace(/\D/g, ''))
  );
  partyRepairs.forEach(r => {
    runningBalance += r.grandTotal;
    entries.push({
      id: 'led-rep-' + r.id,
      partyId: party.id,
      date: r.date,
      time: r.time,
      voucherNo: r.repairNo,
      voucherType: 'Repair Job',
      description: `Mobile Repair: ${r.brand} ${r.model} - ${r.customerComplaint}`,
      debit: r.grandTotal,
      credit: 0,
      balance: runningBalance,
    });

    if (r.paidAmount > 0) {
      runningBalance -= r.paidAmount;
      entries.push({
        id: 'led-reppay-' + r.id,
        partyId: party.id,
        date: r.date,
        time: r.time,
        voucherNo: r.repairNo + '-PAY',
        voucherType: 'Payment In',
        description: `Repair Payment Received (${r.paymentStatus})`,
        debit: 0,
        credit: r.paidAmount,
        balance: runningBalance,
      });
    }
  });

  // Purchases (if supplier)
  const partyPurchases = db.purchases.filter(p => p.supplierId === party.id);
  partyPurchases.forEach(p => {
    runningBalance += p.grandTotal;
    entries.push({
      id: 'led-pur-' + p.id,
      partyId: party.id,
      date: p.date,
      time: p.time,
      voucherNo: p.invoiceNo,
      voucherType: 'Purchase',
      description: `Purchase Bill (${p.items.map(i => i.itemName).join(', ')})`,
      debit: 0,
      credit: p.grandTotal,
      balance: runningBalance,
    });

    if (p.paidAmount > 0) {
      runningBalance -= p.paidAmount;
      entries.push({
        id: 'led-purpay-' + p.id,
        partyId: party.id,
        date: p.date,
        time: p.time,
        voucherNo: p.invoiceNo + '-VOU',
        voucherType: 'Payment Out',
        description: `Payment to supplier (${p.paymentMethod})`,
        debit: p.paidAmount,
        credit: 0,
        balance: runningBalance,
      });
    }
  });

  // Payments Out (if supplier)
  const partyPaymentsOut = db.paymentsOut.filter(p => p.supplierId === party.id && !p.relatedPurchaseInvoiceNo);
  partyPaymentsOut.forEach(p => {
    runningBalance -= p.amountPaid;
    entries.push({
      id: 'led-pout-' + p.id,
      partyId: party.id,
      date: p.date,
      time: p.time,
      voucherNo: p.voucherNo,
      voucherType: 'Payment Out',
      description: p.remarks || 'Supplier Payment Voucher',
      debit: p.amountPaid,
      credit: 0,
      balance: runningBalance,
    });
  });

  const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

  const handleExportCSV = () => {
    const rows = entries.map(e => ({
      'Date': e.date,
      'Time': e.time,
      'Voucher #': e.voucherNo,
      'Type': e.voucherType,
      'Description': e.description,
      'Debit (₨)': e.debit,
      'Credit (₨)': e.credit,
      'Running Balance (₨)': e.balance,
    }));
    ExportService.exportToCSV(`ledger_${party.name.replace(/\s+/g, '_')}`, rows);
  };

  const handleWhatsAppLedger = () => {
    const text = `Account Statement - ${settings.businessName}\n\nParty: ${party.name} (${party.type})\nPhone: ${party.mobile}\nTotal Debit: ₨ ${totalDebit.toLocaleString()}\nTotal Credit: ₨ ${totalCredit.toLocaleString()}\nCurrent Outstanding Balance: ₨ ${party.currentBalance.toLocaleString()}\n\nThank you!`;
    const res = WhatsAppService.sendMessage(party.mobile, party.name, 'Custom', text);
    showToast('Ledger summary dispatched!', 'success');
    if (window.confirm('Open WhatsApp Web/App to send statement directly?')) {
      window.open(res.waLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Actions header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" />
              <span>Party Statement / Ledger: {party.name}</span>
            </h2>
            <p className="text-xs text-slate-400">{party.type} • Mobile: {party.mobile} • City: {party.city}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppLedger}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp Ledger</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ledger Sheet */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex justify-center">
          <div
            id="printable-area"
            className="invoice-a4 bg-white text-black p-8 rounded-xl shadow-xl w-full max-w-3xl text-xs space-y-4"
          >
            {/* Header */}
            <div className="text-center border-b pb-3 border-gray-300">
              <h1 className="text-lg font-black uppercase text-gray-950">{settings.businessName}</h1>
              <p className="text-xs font-bold text-gray-700">PARTY ACCOUNT STATEMENT / KHATA</p>
              <p className="text-[11px] text-gray-600">{settings.address} • Ph: {settings.phone}</p>
            </div>

            {/* Party summary box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 border p-3 rounded">
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Party Name</span>
                <span className="font-bold text-black">{party.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Party Type</span>
                <span>{party.type}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Mobile Phone</span>
                <span>{party.mobile}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 block uppercase font-bold">Current Balance</span>
                <span className="font-mono font-bold text-base text-rose-700">
                  ₨ {party.currentBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Ledger Table */}
            <table className="w-full text-left border border-gray-300 text-[11px]">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                  <th className="p-2">Date</th>
                  <th className="p-2">Voucher #</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Debit (+)</th>
                  <th className="p-2 text-right">Credit (-)</th>
                  <th className="p-2 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500">
                      No transaction history recorded yet for this party.
                    </td>
                  </tr>
                ) : (
                  entries.map(e => (
                    <tr key={e.id}>
                      <td className="p-2 whitespace-nowrap">{e.date}</td>
                      <td className="p-2 font-mono font-semibold">{e.voucherNo}</td>
                      <td className="p-2">{e.description}</td>
                      <td className="p-2 text-right font-mono text-emerald-800">
                        {e.debit > 0 ? `₨ ${e.debit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono text-rose-800">
                        {e.credit > 0 ? `₨ ${e.credit.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold">
                        ₨ {e.balance.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-400 font-bold text-xs">
                  <td colSpan={3} className="p-2 text-right">Total:</td>
                  <td className="p-2 text-right font-mono">₨ {totalDebit.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">₨ {totalCredit.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono text-rose-700">₨ {party.currentBalance.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>

            <div className="pt-6 border-t border-gray-300 text-center text-[10px] text-gray-500">
              This statement is generated electronically from Apex Mobile Shop POS & Management System.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
