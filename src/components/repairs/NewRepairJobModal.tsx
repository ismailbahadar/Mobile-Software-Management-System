import React, { useState, useEffect } from 'react';
import { 
  X, Check, Wrench, Smartphone, User, ShieldCheck, CheckSquare, 
  Camera, Plus, Trash2, Printer, Search, DollarSign, Calendar, Eye, EyeOff
} from 'lucide-react';
import { 
  RepairJob, DeviceConditionChecklist, RepairAccessories, 
  ChecklistStatus, RepairPriority, RepairPhoto 
} from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';
import { WhatsAppService } from '../../services/whatsappService';

interface NewRepairJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (repair: RepairJob) => void;
  initialImei?: string;
  initialCustomerId?: string;
}

const CHECKLIST_ITEMS: Array<{ key: keyof DeviceConditionChecklist; label: string }> = [
  { key: 'screen', label: 'Screen / Display' },
  { key: 'touch', label: 'Touch Digitizer' },
  { key: 'camera', label: 'Rear Camera' },
  { key: 'speaker', label: 'Ear / Loud Speaker' },
  { key: 'microphone', label: 'Microphone' },
  { key: 'charging', label: 'Charging Port / USB' },
  { key: 'battery', label: 'Battery Health' },
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'sim', label: 'SIM Card Reader' },
  { key: 'fingerprint', label: 'Fingerprint Sensor' },
  { key: 'faceId', label: 'Face ID / Biometrics' },
  { key: 'buttons', label: 'Power & Volume Buttons' },
  { key: 'vibration', label: 'Vibration Motor' },
  { key: 'flash', label: 'Flashlight' },
  { key: 'network', label: 'Cellular Network Signal' },
  { key: 'body', label: 'Chassis / Body Frame' },
  { key: 'waterDamage', label: 'Liquid / Water Contact' },
  { key: 'backGlass', label: 'Back Glass Cover' },
];

export const NewRepairJobModal: React.FC<NewRepairJobModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  initialImei = '',
  initialCustomerId = '',
}) => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;
  const technicians = db.technicians.filter(t => t.active);

  // Tab within form: 1. Customer & Device, 2. Condition & Checklist, 3. Repair Details & Advance
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerFatherName, setCustomerFatherName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Device State
  const [deviceType, setDeviceType] = useState<'Smartphone' | 'Feature Phone' | 'Tablet' | 'Smartwatch' | 'Other'>('Smartphone');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('');
  const [imei1, setImei1] = useState(initialImei);
  const [imei2, setImei2] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('Black');
  const [storageCapacity, setStorageCapacity] = useState('128GB');
  const [devicePassword, setDevicePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [physicalCondition, setPhysicalCondition] = useState('Normal wear, minor scratches');

  // Warranty Claim Auto-Detection
  const [isWarrantyClaim, setIsWarrantyClaim] = useState(false);
  const [linkedOriginalTicket, setLinkedOriginalTicket] = useState('');

  // Accessories Checklist
  const [accessories, setAccessories] = useState<RepairAccessories>({
    charger: false,
    cable: false,
    box: false,
    sim: false,
    memoryCard: false,
    earphones: false,
    backCover: false,
    other: '',
  });

  // Device Condition Checklist
  const [checklist, setChecklist] = useState<DeviceConditionChecklist>({
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
    other: '',
  });

  // Photos
  const [photos, setPhotos] = useState<RepairPhoto[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('Front view');

  // Repair Complaint & Cost
  const [customerComplaint, setCustomerComplaint] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [visibleDamage, setVisibleDamage] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [priority, setPriority] = useState<RepairPriority>('Normal');
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(settings.repairs?.defaultLaborCharge || 1500);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + (settings.repairs?.defaultEstimatedDays || 2));
    return d.toISOString().split('T')[0];
  });
  const [warrantyDuration, setWarrantyDuration] = useState(settings.repairs?.defaultWarranty || '30 Days');

  // Pre-fill if customer selected
  useEffect(() => {
    if (initialCustomerId) {
      const p = db.parties.find(x => x.id === initialCustomerId);
      if (p) {
        setSelectedCustomerId(p.id);
        setCustomerName(p.name);
        setCustomerFatherName(p.fatherName || '');
        setCustomerPhone(p.mobile);
        setCustomerWhatsApp(p.whatsapp || p.mobile);
        setCustomerCnic(p.cnic || '');
        setCustomerAddress(p.address || '');
      }
    }
  }, [initialCustomerId]);

  // Check IMEI for warranty claims or previous repairs
  useEffect(() => {
    if (imei1 && imei1.trim().length >= 8) {
      const pastRepairs = db.repairs.filter(r => r.imei1 === imei1.trim() || r.imei2 === imei1.trim());
      if (pastRepairs.length > 0) {
        const lastRepair = pastRepairs[0];
        if (lastRepair.warranty?.expiryDate) {
          const nowStr = new Date().toISOString().split('T')[0];
          if (lastRepair.warranty.expiryDate >= nowStr) {
            setIsWarrantyClaim(true);
            setLinkedOriginalTicket(lastRepair.repairNo);
            showToast(`Device found under active warranty till ${lastRepair.warranty.expiryDate}! Ticket ${lastRepair.repairNo}`, 'info');
          }
        }
      }
    }
  }, [imei1]);

  if (!isOpen) return null;

  const handleSelectExistingCustomer = (partyId: string) => {
    const p = db.parties.find(x => x.id === partyId);
    if (p) {
      setSelectedCustomerId(p.id);
      setCustomerName(p.name);
      setCustomerFatherName(p.fatherName || '');
      setCustomerPhone(p.mobile);
      setCustomerWhatsApp(p.whatsapp || p.mobile);
      setCustomerCnic(p.cnic || '');
      setCustomerAddress(p.address || '');
      setCustomerSearch('');
    }
  };

  const handleMarkAllChecklist = (status: ChecklistStatus) => {
    const updated = { ...checklist };
    CHECKLIST_ITEMS.forEach(item => {
      updated[item.key] = status;
    });
    setChecklist(updated);
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) {
      showToast('Enter image URL or take photo', 'error');
      return;
    }
    setPhotos([
      ...photos,
      {
        id: 'photo-' + Date.now(),
        url: newPhotoUrl.trim(),
        caption: newPhotoCaption.trim() || 'Device photo',
        uploadedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
    setNewPhotoUrl('');
    setNewPhotoCaption('Condition photo');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast('Customer Name is required', 'error');
      setActiveStep(1);
      return;
    }
    if (!customerPhone.trim()) {
      showToast('Customer Phone Number is required', 'error');
      setActiveStep(1);
      return;
    }
    if (!model.trim()) {
      showToast('Phone Model is required (e.g. iPhone 14 Pro, Samsung S23)', 'error');
      setActiveStep(1);
      return;
    }
    if (!customerComplaint.trim()) {
      showToast('Customer Complaint is required', 'error');
      setActiveStep(3);
      return;
    }

    const tech = technicians.find(t => t.id === assignedTechnicianId);

    try {
      const newRepair = storage.createRepairJob({
        customerId: selectedCustomerId || undefined,
        customerName: customerName.trim(),
        customerFatherName: customerFatherName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        customerWhatsApp: customerWhatsApp.trim() || customerPhone.trim(),
        customerCnic: customerCnic.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        deviceType,
        brand,
        model: model.trim(),
        imei1: imei1.trim() || undefined,
        imei2: imei2.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        color,
        storage: storageCapacity,
        devicePassword: devicePassword.trim() || undefined,
        physicalCondition: physicalCondition.trim(),
        checklist,
        accessories,
        photos,
        customerComplaint: customerComplaint.trim(),
        problemDescription: problemDescription.trim() || undefined,
        visibleDamage: visibleDamage.trim() || undefined,
        technicianNotes: technicianNotes.trim() || undefined,
        priority,
        assignedTechnicianId: tech?.id,
        assignedTechnicianName: tech?.name,
        laborCharge: Number(estimatedCost) || 1500,
        advancePayment: Number(advancePayment) || 0,
        estimatedCompletionDate,
        warranty: {
          duration: warrantyDuration as any,
          terms: `${warrantyDuration} warranty on replaced parts and technician workmanship. Physical and liquid damage voids warranty.`,
          isWarrantyClaim,
          originalRepairTicketNo: linkedOriginalTicket || undefined,
        },
      });

      showToast(`Repair Job ${newRepair.repairNo} booked successfully!`, 'success');

      // WhatsApp Prompt
      WhatsAppService.sendRepairWhatsApp(newRepair, 'received');

      if (onCreated) onCreated(newRepair);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Error creating repair ticket', 'error');
    }
  };

  const filteredCustomerCandidates = customerSearch.trim()
    ? db.parties.filter(p => 
        p.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        p.mobile.includes(customerSearch) ||
        (p.cnic && p.cnic.includes(customerSearch))
      ).slice(0, 5)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-cyan-950">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>New Mobile Repair Job Intake</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  {settings.repairs?.ticketPrefix || 'REP-2026-'}{settings.repairs?.nextTicketNum || '100X'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Customer receipt, device condition inspection, and repair token
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator bar */}
        <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeStep === 1
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-[10px]">1</span>
              <span>Customer & Device</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeStep === 2
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-[10px]">2</span>
              <span>Condition & Checklist</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeStep === 3
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-black/30 flex items-center justify-center text-[10px]">3</span>
              <span>Complaint & Payment</span>
            </button>
          </div>

          {isWarrantyClaim && (
            <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Warranty Claim Linked ({linkedOriginalTicket})
            </span>
          )}
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          
          {/* STEP 1: Customer & Device Details */}
          {activeStep === 1 && (
            <div className="space-y-5">
              {/* Customer Info Box */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>Customer Information</span>
                  </h3>
                  {/* Quick customer search picker */}
                  <div className="relative w-64">
                    <input
                      type="text"
                      placeholder="Search existing customer..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="w-full pl-7 pr-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 text-xs"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                    {filteredCustomerCandidates.length > 0 && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-700/50">
                        {filteredCustomerCandidates.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectExistingCustomer(p.id)}
                            className="w-full text-left px-3 py-1.5 hover:bg-cyan-600 hover:text-white text-slate-200 flex items-center justify-between"
                          >
                            <span className="font-bold">{p.name}</span>
                            <span className="text-[10px] opacity-80">{p.mobile}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Muhammad Bilal"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Father's Name (Optional)</label>
                    <input
                      type="text"
                      value={customerFatherName}
                      onChange={e => setCustomerFatherName(e.target.value)}
                      placeholder="e.g. Tariq Mehmood"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={e => {
                        setCustomerPhone(e.target.value);
                        if (!customerWhatsApp) setCustomerWhatsApp(e.target.value);
                      }}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={customerWhatsApp}
                      onChange={e => setCustomerWhatsApp(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">CNIC (National ID)</label>
                    <input
                      type="text"
                      value={customerCnic}
                      onChange={e => setCustomerCnic(e.target.value)}
                      placeholder="35201-1234567-1"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">City / Address</label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      placeholder="Gulberg III, Lahore"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Device Info Box */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Device Hardware Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Device Type</label>
                    <select
                      value={deviceType}
                      onChange={e => setDeviceType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    >
                      <option value="Smartphone">Smartphone</option>
                      <option value="Feature Phone">Feature Phone</option>
                      <option value="Tablet">Tablet / iPad</option>
                      <option value="Smartwatch">Smartwatch</option>
                      <option value="Other">Other Electronic Device</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Brand *</label>
                    <select
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                    >
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi / Redmi</option>
                      <option value="Infinix">Infinix</option>
                      <option value="Tecno">Tecno</option>
                      <option value="Vivo">Vivo</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Realme">Realme</option>
                      <option value="Google">Google Pixel</option>
                      <option value="OnePlus">OnePlus</option>
                      <option value="Huawei">Huawei</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 mb-1">Device Model *</label>
                    <input
                      type="text"
                      required
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder="e.g. iPhone 13 Pro Max / Galaxy S23 Ultra"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">IMEI 1 (Primary)</label>
                    <input
                      type="text"
                      value={imei1}
                      onChange={e => setImei1(e.target.value)}
                      placeholder="15 Digits IMEI"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">IMEI 2 (Secondary)</label>
                    <input
                      type="text"
                      value={imei2}
                      onChange={e => setImei2(e.target.value)}
                      placeholder="Optional second IMEI"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={e => setSerialNumber(e.target.value)}
                      placeholder="Serial Number / S/N"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Color & Storage</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        placeholder="Color"
                        className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                      />
                      <input
                        type="text"
                        value={storageCapacity}
                        onChange={e => setStorageCapacity(e.target.value)}
                        placeholder="Storage"
                        className="w-1/2 px-2.5 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Device PIN / Pattern / Passcode</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={devicePassword}
                        onChange={e => setDevicePassword(e.target.value)}
                        placeholder="e.g. 1234 or Pattern 'L'"
                        className="w-full px-3 py-2 pr-8 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 mb-1">Physical Exterior Condition</label>
                    <input
                      type="text"
                      value={physicalCondition}
                      onChange={e => setPhysicalCondition(e.target.value)}
                      placeholder="e.g. Minor scratches, rear glass cracked, dent near charging port"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Accessories Received Box */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>Accessories Received with Device (Printed on Receipt)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {[
                    { key: 'charger', label: 'Charger / Adapter' },
                    { key: 'cable', label: 'USB Cable' },
                    { key: 'box', label: 'Original Box' },
                    { key: 'sim', label: 'SIM Card Inside' },
                    { key: 'memoryCard', label: 'SD Memory Card' },
                    { key: 'earphones', label: 'Earphones' },
                    { key: 'backCover', label: 'Back Cover / Case' },
                  ].map(acc => (
                    <label
                      key={acc.key}
                      className="flex items-center gap-2 p-2 bg-slate-800/60 rounded-lg border border-slate-700/60 cursor-pointer hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(accessories[acc.key as keyof RepairAccessories])}
                        onChange={e =>
                          setAccessories({
                            ...accessories,
                            [acc.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-cyan-600 rounded bg-slate-700 border-slate-600 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="text-slate-200 text-xs font-medium">{acc.label}</span>
                    </label>
                  ))}
                  <div>
                    <input
                      type="text"
                      value={accessories.other || ''}
                      onChange={e => setAccessories({ ...accessories, other: e.target.value })}
                      placeholder="Other accessories..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-md shadow-cyan-950 flex items-center gap-1.5"
                >
                  <span>Next: Condition Checklist & Photos</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Device Condition Checklist & Photos */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Pre-Intake Technical Condition Checklist</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Record all working/non-working parts prior to repair to avoid customer disputes
                    </p>
                  </div>

                  {/* Quick bulk action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMarkAllChecklist('Working')}
                      className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 text-emerald-300 rounded text-[11px] font-semibold"
                    >
                      ✓ All Working
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllChecklist('Not Tested')}
                      className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-semibold"
                    >
                      ? All Not Tested
                    </button>
                  </div>
                </div>

                {/* Grid of checklist items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {CHECKLIST_ITEMS.map(item => {
                    const currentVal = checklist[item.key] || 'Working';
                    return (
                      <div
                        key={item.key}
                        className="p-2.5 bg-slate-800/70 border border-slate-700/70 rounded-lg flex items-center justify-between gap-2"
                      >
                        <span className="font-semibold text-slate-200 text-xs truncate">
                          {item.label}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {(['Working', 'Not Working', 'Damaged', 'Not Tested'] as ChecklistStatus[]).map(st => {
                            const active = currentVal === st;
                            let style = 'text-slate-400 bg-slate-800 hover:text-slate-200';
                            if (active) {
                              if (st === 'Working') style = 'bg-emerald-600 text-white font-bold';
                              else if (st === 'Not Working') style = 'bg-amber-600 text-white font-bold';
                              else if (st === 'Damaged') style = 'bg-rose-600 text-white font-bold';
                              else style = 'bg-slate-600 text-white font-bold';
                            }
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => setChecklist({ ...checklist, [item.key]: st })}
                                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${style}`}
                                title={st}
                              >
                                {st === 'Working' ? 'OK' : st === 'Not Working' ? 'Fail' : st === 'Damaged' ? 'Dmg' : 'N/T'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Photos Attachment */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Device Condition Photos (Front, Screen Crack, Back, IMEI Label)</span>
                </h3>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="Enter image URL or paste photo link..."
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs"
                  />
                  <select
                    value={newPhotoCaption}
                    onChange={e => setNewPhotoCaption(e.target.value)}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-xs"
                  >
                    <option value="Front View">Front View</option>
                    <option value="Rear Glass">Rear Glass</option>
                    <option value="Screen Damage">Screen Damage</option>
                    <option value="Body Frame Dent">Body Frame Dent</option>
                    <option value="IMEI Label">IMEI Label</option>
                    <option value="Disassembly / Internal">Disassembly / Internal</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPhoto}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Photo</span>
                  </button>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {photos.map(p => (
                      <div key={p.id} className="relative group rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
                        <img src={p.url} alt={p.caption} className="w-full h-24 object-cover" />
                        <div className="p-1.5 text-[10px] text-slate-300 font-medium truncate bg-slate-900/90">
                          {p.caption}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter(x => x.id !== p.id))}
                          className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 text-white rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                >
                  ← Back to Device
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold shadow-md shadow-cyan-950 flex items-center gap-1.5"
                >
                  <span>Next: Complaint & Payment</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Customer Complaint, Priority, & Advance Payment */}
          {activeStep === 3 && (
            <div className="space-y-5">
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Wrench className="w-4 h-4 text-cyan-400" />
                  <span>Customer Complaint & Repair Specifications</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Customer Complaint (Primary Issue) *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerComplaint}
                      onChange={e => setCustomerComplaint(e.target.value)}
                      placeholder="e.g. Display broken, touch not responding after fall"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-medium"
                    />
                    {/* Common complaint suggestions */}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(settings.repairs?.commonComplaints || []).slice(0, 4).map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCustomerComplaint(c)}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        >
                          + {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Detailed Problem Description</label>
                      <textarea
                        rows={2}
                        value={problemDescription}
                        onChange={e => setProblemDescription(e.target.value)}
                        placeholder="Additional details provided by customer..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Visible Damage / Scratches</label>
                      <textarea
                        rows={2}
                        value={visibleDamage}
                        onChange={e => setVisibleDamage(e.target.value)}
                        placeholder="Noticeable cracks, frame dents, missing screws..."
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment & Financials */}
              <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
                  <DollarSign className="w-4 h-4 text-cyan-400" />
                  <span>Technician Assignment & Financial Estimate</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Priority Level</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
                    >
                      <option value="Urgent">🔥 Urgent (Same Day / Priority)</option>
                      <option value="High">High Priority</option>
                      <option value="Normal">Normal</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Assign Workbench Technician</label>
                    <select
                      value={assignedTechnicianId}
                      onChange={e => setAssignedTechnicianId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    >
                      <option value="">-- Assign Later / General Pool --</option>
                      {technicians.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.specializations.join(', ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Est. Completion Date</label>
                    <input
                      type="date"
                      value={estimatedCompletionDate}
                      onChange={e => setEstimatedCompletionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Estimated Total Repair Cost (₨)</label>
                    <input
                      type="number"
                      min="0"
                      value={estimatedCost}
                      onChange={e => setEstimatedCost(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-emerald-400 font-semibold mb-1">Advance Payment Received (₨)</label>
                    <input
                      type="number"
                      min="0"
                      value={advancePayment}
                      onChange={e => setAdvancePayment(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 bg-slate-800 border border-emerald-500/50 rounded-lg text-emerald-300 font-mono font-bold text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Service Warranty</label>
                    <select
                      value={warrantyDuration}
                      onChange={e => setWarrantyDuration(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
                    >
                      <option value="No Warranty">No Warranty</option>
                      <option value="7 Days">7 Days Warranty</option>
                      <option value="15 Days">15 Days Warranty</option>
                      <option value="30 Days">30 Days Warranty (Standard)</option>
                      <option value="60 Days">60 Days Warranty</option>
                      <option value="90 Days">90 Days Warranty</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Estimated Balance on Delivery:</span>
                    <span className="ml-2 font-mono font-bold text-slate-200">
                      ₨ {Math.max(0, estimatedCost - advancePayment).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Automatic token generation & WhatsApp receipt trigger
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                >
                  ← Back to Checklist
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold shadow-lg shadow-emerald-950 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Create Repair Job Ticket</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
