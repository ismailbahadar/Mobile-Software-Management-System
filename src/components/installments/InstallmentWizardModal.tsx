import React, { useState } from 'react';
import {
  X, Check, ChevronRight, ChevronLeft, Smartphone, User, Shield,
  Calendar, DollarSign, Binary, AlertCircle
} from 'lucide-react';
import { Item, IMEIRecord, Party, InstallmentFrequency } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface InstallmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContractCreated: (contract: any) => void;
}

export const InstallmentWizardModal: React.FC<InstallmentWizardModalProps> = ({
  isOpen,
  onClose,
  onContractCreated,
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerFatherName, setCustomerFatherName] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Step 2: Guarantor
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorFatherName, setGuarantorFatherName] = useState('');
  const [guarantorCnic, setGuarantorCnic] = useState('');
  const [guarantorPhone, setGuarantorPhone] = useState('');
  const [guarantorAddress, setGuarantorAddress] = useState('');
  const [guarantorRelation, setGuarantorRelation] = useState('Govt Employee / Family Relation');
  const [referencePerson, setReferencePerson] = useState('');
  const [referencePhone, setReferencePhone] = useState('');

  // Step 3: Mobile & IMEI
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedImeiId, setSelectedImeiId] = useState<string>('');

  // Step 4: Plan Calculations
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(10000);
  const [numInstallments, setNumInstallments] = useState<number>(6);
  const [frequency, setFrequency] = useState<InstallmentFrequency>('Monthly');
  const [firstDueDate, setFirstDueDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [terms, setTerms] = useState(
    '1. The mobile phone remains the property of the shop until 100% dues are cleared.\n2. In case of 3 unpaid installments, legal action and confiscation will take effect.\n3. Late payment fee Rs. 500 per default week.'
  );

  if (!isOpen) return null;

  const handleSelectCustomer = (p: Party) => {
    setSelectedCustomerId(p.id);
    setCustomerName(p.name);
    setCustomerFatherName(p.fatherName || '');
    setCustomerCnic(p.cnic || '');
    setCustomerMobile(p.mobile);
    setCustomerAddress(p.address || '');
  };

  const selectedItem = db.items.find(i => i.id === selectedItemId);
  const availableImeis = selectedItemId ? storage.getAvailableIMEIsForItem(selectedItemId) : [];
  const selectedImei = db.imeis.find(im => im.id === selectedImeiId);

  const installmentPrice = customPrice > 0 ? customPrice : (selectedItem?.installmentPrice || 0);
  const remainingBalance = Math.max(0, installmentPrice - downPayment);
  const installmentAmount = numInstallments > 0 ? Math.ceil(remainingBalance / numInstallments) : 0;

  const handleSave = () => {
    if (!customerName || !customerMobile || !customerCnic) {
      showToast('Please provide valid customer name, mobile, and CNIC', 'error');
      setStep(1);
      return;
    }
    if (!guarantorName || !guarantorCnic || !guarantorPhone) {
      showToast('Please provide valid guarantor name, CNIC, and phone', 'error');
      setStep(2);
      return;
    }
    if (!selectedItem || !selectedImei) {
      showToast('Please select a mobile phone and valid in-stock IMEI', 'error');
      setStep(3);
      return;
    }

    try {
      const contract = storage.createInstallmentContract({
        customer: selectedCustomerId ? db.parties.find(p => p.id === selectedCustomerId)! : {
          name: customerName,
          fatherName: customerFatherName,
          cnic: customerCnic,
          mobile: customerMobile,
          address: customerAddress,
        },
        guarantor: {
          name: guarantorName,
          fatherName: guarantorFatherName,
          cnic: guarantorCnic,
          phone: guarantorPhone,
          address: guarantorAddress,
          relation: guarantorRelation,
        },
        referencePerson,
        referencePhone,
        item: selectedItem,
        imei: selectedImei,
        installmentPrice,
        downPayment,
        numberOfInstallments: numInstallments,
        installmentFrequency: frequency,
        firstDueDate,
        terms,
      });

      showToast(`Installment contract ${contract.contractNo} generated successfully!`, 'success');
      onContractCreated(contract);
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Error creating contract', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>New Mobile Installment Contract Wizard</span>
            </h2>
            <p className="text-xs text-slate-400">Step-by-step verification, device allocation & schedule setup</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between">
          {[
            { num: 1, label: 'Customer' },
            { num: 2, label: 'Guarantor' },
            { num: 3, label: 'Device & IMEI' },
            { num: 4, label: 'Plan & Terms' },
          ].map(s => (
            <div
              key={s.num}
              onClick={() => setStep(s.num as any)}
              className={`flex items-center gap-2 cursor-pointer transition-all ${
                step === s.num
                  ? 'text-emerald-400 font-bold'
                  : step > s.num
                  ? 'text-emerald-500/70 font-medium'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                  step === s.num
                    ? 'bg-emerald-600 text-white border-emerald-400'
                    : step > s.num
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-600'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="text-xs hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* STEP 1: CUSTOMER */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Customer Information</span>
                </h3>
                {selectedCustomerId && (
                  <button
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerName('');
                      setCustomerMobile('');
                      setCustomerCnic('');
                      setCustomerAddress('');
                    }}
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Clear Selected Customer
                  </button>
                )}
              </div>

              {/* Quick Select Existing Party */}
              {!selectedCustomerId && (
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-medium text-slate-400">Select Existing Party:</span>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                    {db.parties.filter(p => p.type.includes('Customer')).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectCustomer(p)}
                        className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      >
                        {p.name} ({p.mobile})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="e.g. Usman Ali"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Father / Guardian Name</label>
                  <input
                    type="text"
                    value={customerFatherName}
                    onChange={e => setCustomerFatherName(e.target.value)}
                    placeholder="e.g. Bashir Ahmed"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">CNIC Number (13 digits) *</label>
                  <input
                    type="text"
                    value={customerCnic}
                    onChange={e => setCustomerCnic(e.target.value)}
                    placeholder="e.g. 35202-9876543-3"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Mobile / WhatsApp Number *</label>
                  <input
                    type="text"
                    value={customerMobile}
                    onChange={e => setCustomerMobile(e.target.value)}
                    placeholder="e.g. 0321-4567890"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Residential Address *</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Full residential street, house/flat number, city"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: GUARANTOR */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Guarantor & Reference Details (Legal Security)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Guarantor Name (Zamin) *</label>
                  <input
                    type="text"
                    value={guarantorName}
                    onChange={e => setGuarantorName(e.target.value)}
                    placeholder="e.g. Zahid Hussain"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Guarantor S/O (Father Name)</label>
                  <input
                    type="text"
                    value={guarantorFatherName}
                    onChange={e => setGuarantorFatherName(e.target.value)}
                    placeholder="e.g. Hussain Bakhsh"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Guarantor CNIC *</label>
                  <input
                    type="text"
                    value={guarantorCnic}
                    onChange={e => setGuarantorCnic(e.target.value)}
                    placeholder="e.g. 35201-1122334-9"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Guarantor Phone *</label>
                  <input
                    type="text"
                    value={guarantorPhone}
                    onChange={e => setGuarantorPhone(e.target.value)}
                    placeholder="e.g. 0300-8899001"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Guarantor Relation / Job Position</label>
                  <input
                    type="text"
                    value={guarantorRelation}
                    onChange={e => setGuarantorRelation(e.target.value)}
                    placeholder="e.g. Uncle / Govt Officer (Grade 17)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Reference Person & Contact (Optional)</label>
                  <input
                    type="text"
                    value={referencePerson}
                    onChange={e => setReferencePerson(e.target.value)}
                    placeholder="e.g. Mian Asif (0333-1234567)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Guarantor Address *</label>
                  <input
                    type="text"
                    value={guarantorAddress}
                    onChange={e => setGuarantorAddress(e.target.value)}
                    placeholder="Full residential or commercial workplace address"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DEVICE & IMEI */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Select Mobile Product & Specific IMEI</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Select Phone Model *</label>
                  <select
                    value={selectedItemId}
                    onChange={e => {
                      setSelectedItemId(e.target.value);
                      setSelectedImeiId('');
                      const item = db.items.find(i => i.id === e.target.value);
                      if (item) setCustomPrice(item.installmentPrice);
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="">-- Choose Mobile Model --</option>
                    {db.items.filter(i => i.active).map(i => (
                      <option key={i.id} value={i.id}>
                        {i.brand} {i.model} ({i.color}, {i.storage}) — Stock: {i.currentStock}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Select In-Stock IMEI *</label>
                  <select
                    value={selectedImeiId}
                    onChange={e => setSelectedImeiId(e.target.value)}
                    disabled={!selectedItemId}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono disabled:opacity-50"
                  >
                    <option value="">-- Choose Available IMEI --</option>
                    {availableImeis.map(im => (
                      <option key={im.id} value={im.id}>
                        {im.imei1} ({im.color})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3-Tier Prices Display */}
              {selectedItem && (
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2">
                  <span className="text-xs font-bold text-slate-300">
                    3-Tier Pricing for {selectedItem.brand} {selectedItem.model}:
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Direct / Cash Price</span>
                      <span className="font-bold text-slate-200 font-mono">
                        ₨ {selectedItem.directPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-emerald-950/60 rounded-lg border border-emerald-500/40">
                      <span className="text-[10px] text-emerald-400 font-semibold block">Installment Price</span>
                      <span className="font-extrabold text-emerald-300 font-mono text-sm">
                        ₨ {selectedItem.installmentPrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Wholesale Price</span>
                      <span className="font-bold text-slate-200 font-mono">
                        ₨ {selectedItem.wholesalePrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Purchase Cost: <span className="font-mono text-slate-300">₨ {selectedItem.purchasePrice.toLocaleString()}</span> • Expected Profit: <span className="font-mono font-semibold text-emerald-400">₨ {(selectedItem.installmentPrice - selectedItem.purchasePrice).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PLAN & TERMS */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Installment Plan & Payment Schedule</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Agreed Installment Price (₨)</label>
                  <input
                    type="number"
                    value={installmentPrice}
                    onChange={e => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Down Payment (Advance) (₨) *</label>
                  <input
                    type="number"
                    value={downPayment}
                    onChange={e => setDownPayment(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Number of Installments *</label>
                  <input
                    type="number"
                    min="1"
                    max="36"
                    value={numInstallments}
                    onChange={e => setNumInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Frequency</label>
                  <select
                    value={frequency}
                    onChange={e => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-Weekly">Bi-Weekly (14 Days)</option>
                    <option value="Weekly">Weekly (7 Days)</option>
                    <option value="Daily">Daily</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">First Due Date</label>
                  <input
                    type="date"
                    value={firstDueDate}
                    onChange={e => setFirstDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Per Installment Amount</label>
                  <div className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-emerald-400 font-mono font-bold">
                    ₨ {installmentAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Plan Summary Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total Price</span>
                  <span className="font-bold text-slate-200 font-mono">₨ {installmentPrice.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-semibold">Advance Paid</span>
                  <span className="font-bold text-emerald-400 font-mono">₨ {downPayment.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400 block uppercase font-semibold">Remaining</span>
                  <span className="font-bold text-rose-400 font-mono">₨ {remainingBalance.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Each Installment</span>
                  <span className="font-bold text-indigo-300 font-mono">{numInstallments} × ₨ {installmentAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs mb-1">Contract Legal Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={e => setTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((step + 1) as any)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Generate Agreement</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
