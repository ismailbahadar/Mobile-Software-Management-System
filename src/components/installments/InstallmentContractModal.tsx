import React, { useState } from 'react';
import { X, Printer, Share2, Calendar, User, Shield, CheckCircle2, Phone, CreditCard } from 'lucide-react';
import { InstallmentContract } from '../../types';
import { storage } from '../../db/storage';
import { WhatsAppService } from '../../services/whatsappService';
import { useToast } from '../common/Toast';

interface InstallmentContractModalProps {
  contract: InstallmentContract | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPaymentModal?: (contract: InstallmentContract) => void;
}

export const InstallmentContractModal: React.FC<InstallmentContractModalProps> = ({
  contract,
  isOpen,
  onClose,
  onOpenPaymentModal,
}) => {
  const { showToast } = useToast();
  const settings = storage.getSettings();
  const [waSent, setWaSent] = useState(false);

  if (!isOpen || !contract) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppSend = () => {
    const message = WhatsAppService.getInstallmentReminderMessage(contract);
    const result = WhatsAppService.sendMessage(
      contract.customerPhone,
      contract.customerName,
      'Installment Reminder',
      message,
      contract.contractNo
    );
    setWaSent(true);
    showToast(`Installment details sent to ${contract.customerName} via WhatsApp!`, 'success');
    if (window.confirm('Contract details dispatched! Open WhatsApp Web/App as well?')) {
      window.open(result.waLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Actions bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Contract: {contract.contractNo}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                contract.status === 'Completed'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                {contract.status}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {contract.status === 'Active' && onOpenPaymentModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(contract);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Receive Installment</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-md"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{waSent ? 'Sent' : 'WhatsApp Contract'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Document */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60 flex justify-center">
          <div
            id="printable-area"
            className="invoice-a4 bg-white text-black p-8 rounded-xl shadow-xl w-full max-w-3xl text-xs space-y-4"
          >
            {/* Header */}
            <div className="text-center border-b pb-3 border-gray-300">
              <h1 className="text-xl font-black uppercase tracking-tight text-gray-950">
                {settings.businessName}
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                OFFICIAL MOBILE INSTALLMENT SALE & FINANCING AGREEMENT
              </p>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {settings.address} • Ph: {settings.phone} • WhatsApp: {settings.whatsappPhone}
              </p>
            </div>

            {/* Contract Key Info */}
            <div className="flex justify-between items-center bg-gray-50 border p-2.5 rounded text-xs font-medium">
              <div>
                <span className="font-bold text-gray-700">Agreement No: </span>
                <span className="font-mono font-bold text-black">{contract.contractNo}</span>
              </div>
              <div>
                <span className="font-bold text-gray-700">Agreement Date: </span>
                <span>{contract.date}</span>
              </div>
              <div>
                <span className="font-bold text-gray-700">Plan Duration: </span>
                <span>{contract.numberOfInstallments} Installments ({contract.installmentFrequency})</span>
              </div>
            </div>

            {/* 3 Columns: Customer, Guarantor & Device */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Customer Card */}
              <div className="border border-gray-200 rounded p-2.5 bg-gray-50/50 space-y-1">
                <div className="font-bold text-gray-900 border-b pb-1 text-[11px] uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600" />
                  <span>Customer Details</span>
                </div>
                <div className="text-[11px]">
                  <p><span className="font-semibold">Name:</span> {contract.customerName}</p>
                  {contract.customerFatherName && (
                    <p><span className="font-semibold">S/O:</span> {contract.customerFatherName}</p>
                  )}
                  <p><span className="font-semibold">CNIC:</span> <span className="font-mono">{contract.customerCnic}</span></p>
                  <p><span className="font-semibold">Phone:</span> {contract.customerPhone}</p>
                  <p><span className="font-semibold">Address:</span> {contract.customerAddress}</p>
                </div>
              </div>

              {/* Guarantor Card */}
              <div className="border border-gray-200 rounded p-2.5 bg-gray-50/50 space-y-1">
                <div className="font-bold text-gray-900 border-b pb-1 text-[11px] uppercase flex items-center gap-1">
                  <Shield className="w-3 h-3 text-indigo-600" />
                  <span>Guarantor / Zamin</span>
                </div>
                <div className="text-[11px]">
                  <p><span className="font-semibold">Name:</span> {contract.guarantorName}</p>
                  {contract.guarantorFatherName && (
                    <p><span className="font-semibold">S/O:</span> {contract.guarantorFatherName}</p>
                  )}
                  <p><span className="font-semibold">CNIC:</span> <span className="font-mono">{contract.guarantorCnic}</span></p>
                  <p><span className="font-semibold">Phone:</span> {contract.guarantorPhone}</p>
                  {contract.guarantorRelation && (
                    <p><span className="font-semibold">Relation:</span> {contract.guarantorRelation}</p>
                  )}
                  <p><span className="font-semibold">Address:</span> {contract.guarantorAddress}</p>
                </div>
              </div>

              {/* Device Card */}
              <div className="border border-gray-200 rounded p-2.5 bg-gray-50/50 space-y-1">
                <div className="font-bold text-gray-900 border-b pb-1 text-[11px] uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-teal-600" />
                  <span>Device Information</span>
                </div>
                <div className="text-[11px]">
                  <p className="font-bold text-gray-900">{contract.itemName}</p>
                  <p><span className="font-semibold">Color:</span> {contract.color} {contract.storage ? `• ${contract.storage}` : ''}</p>
                  <p className="font-mono text-[10px] break-all"><span className="font-semibold">IMEI 1:</span> {contract.imei1}</p>
                  {contract.imei2 && (
                    <p className="font-mono text-[10px] break-all"><span className="font-semibold">IMEI 2:</span> {contract.imei2}</p>
                  )}
                  <p className="mt-1 text-[10px] text-gray-600">
                    Direct Cash Price: <span className="font-mono">₨ {contract.directCashPrice.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="border border-gray-300 rounded p-3 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-white rounded border">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Total Inst. Price</div>
                  <div className="text-sm font-extrabold text-gray-950 font-mono">
                    ₨ {contract.totalInstallmentPrice.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Down Payment</div>
                  <div className="text-sm font-extrabold text-emerald-700 font-mono">
                    ₨ {contract.downPayment.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Total Paid</div>
                  <div className="text-sm font-extrabold text-blue-700 font-mono">
                    ₨ {contract.totalPaid.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="text-[10px] text-gray-500 uppercase font-bold">Remaining Balance</div>
                  <div className="text-sm font-extrabold text-rose-700 font-mono">
                    ₨ {contract.remainingBalance.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Installment Schedule Table */}
            <div>
              <h3 className="font-bold text-gray-900 text-xs uppercase mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-700" />
                <span>Installment Payment Schedule</span>
              </h3>
              <table className="w-full text-left border border-gray-300 text-[11px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold">
                    <th className="p-1.5 text-center">#</th>
                    <th className="p-1.5">Due Date</th>
                    <th className="p-1.5 text-right">Amount</th>
                    <th className="p-1.5 text-right">Paid</th>
                    <th className="p-1.5 text-right">Remaining</th>
                    <th className="p-1.5 text-center">Status</th>
                    <th className="p-1.5">Receipt # / Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contract.schedule.map((sch) => (
                    <tr key={sch.id} className={sch.status === 'Paid' ? 'bg-emerald-50/40' : ''}>
                      <td className="p-1.5 text-center font-bold">{sch.installmentNo}</td>
                      <td className="p-1.5 font-medium">{sch.dueDate}</td>
                      <td className="p-1.5 text-right font-mono">₨ {sch.amount.toLocaleString()}</td>
                      <td className="p-1.5 text-right font-mono text-emerald-700">₨ {sch.paidAmount.toLocaleString()}</td>
                      <td className="p-1.5 text-right font-mono text-rose-700">₨ {sch.remainingAmount.toLocaleString()}</td>
                      <td className="p-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          sch.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sch.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {sch.status}
                        </span>
                      </td>
                      <td className="p-1.5 text-[10px] text-gray-600">
                        {sch.receiptNo ? `${sch.receiptNo} (${sch.paidDate})` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Terms and Conditions */}
            <div className="border border-gray-200 rounded p-2 text-[10px] text-gray-700 leading-tight bg-gray-50/30">
              <span className="font-bold text-gray-900 block mb-0.5">TERMS AND CONDITIONS:</span>
              <p className="whitespace-pre-line">{contract.terms}</p>
            </div>

            {/* Signature Boxes */}
            <div className="grid grid-cols-3 gap-6 pt-8 text-center text-[11px]">
              <div>
                <div className="border-t border-gray-400 pt-1 font-bold text-gray-800">
                  Customer Signature & Thumb
                </div>
                <div className="text-[10px] text-gray-500">{contract.customerName}</div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-1 font-bold text-gray-800">
                  Guarantor Signature & Thumb
                </div>
                <div className="text-[10px] text-gray-500">{contract.guarantorName}</div>
              </div>
              <div>
                <div className="border-t border-gray-400 pt-1 font-bold text-gray-800">
                  Shop Representative / Seal
                </div>
                <div className="text-[10px] text-gray-500">{settings.businessName}</div>
              </div>
            </div>

            {/* Empty feed clearance lines */}
            <div className="invoice-feed-lines pt-6 text-center select-none">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-4 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
