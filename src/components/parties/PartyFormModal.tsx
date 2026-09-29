import React, { useState, useEffect } from 'react';
import { X, Check, Users, User, Phone, MapPin } from 'lucide-react';
import { Party, PartyType } from '../../types';
import { storage } from '../../db/storage';
import { useToast } from '../common/Toast';

interface PartyFormModalProps {
  party: Party | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (party: Party) => void;
}

export const PartyFormModal: React.FC<PartyFormModalProps> = ({
  party,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [type, setType] = useState<PartyType>('Customer');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [email, setEmail] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [creditLimit, setCreditLimit] = useState<number>(50000);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (party) {
      setType(party.type);
      setName(party.name);
      setFatherName(party.fatherName || '');
      setCnic(party.cnic || '');
      setMobile(party.mobile);
      setWhatsapp(party.whatsapp || party.mobile);
      setAddress(party.address);
      setCity(party.city);
      setEmail(party.email || '');
      setOpeningBalance(party.openingBalance);
      setCreditLimit(party.creditLimit || 0);
      setRemarks(party.remarks || '');
    } else {
      setType('Customer');
      setName('');
      setFatherName('');
      setCnic('');
      setMobile('');
      setWhatsapp('');
      setAddress('');
      setCity('Lahore');
      setEmail('');
      setOpeningBalance(0);
      setCreditLimit(50000);
      setRemarks('');
    }
  }, [party, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) {
      showToast('Name and Mobile phone are required', 'error');
      return;
    }

    const saved = storage.saveParty({
      id: party?.id,
      type,
      name,
      fatherName,
      cnic,
      mobile,
      whatsapp: whatsapp || mobile,
      address,
      city,
      email,
      openingBalance,
      creditLimit,
      remarks,
    });

    showToast(`Party ${saved.name} saved successfully!`, 'success');
    if (onSaved) onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">
              {party ? 'Edit Party Profile' : 'Add Customer / Supplier Party'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Party Type *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {(['Customer', 'Supplier', 'Wholesale Customer', 'Installment Customer'] as PartyType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-1.5 px-2 rounded-lg text-center border font-semibold ${
                    type === t
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {t.replace(' Customer', '')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-400 mb-1">Full Name / Business Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Muhammad Rizwan / Al-Madina Mobiles"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Father / Contact Person</label>
              <input
                type="text"
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="Father name or owner name"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-400 mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="e.g. 0300-1234567"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">CNIC (13 digits)</label>
              <input
                type="text"
                value={cnic}
                onChange={e => setCnic(e.target.value)}
                placeholder="e.g. 35201-1234567-1"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Shop/House address"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-400 mb-1">Opening Balance (₨)</label>
              <input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Credit Limit (₨)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={e => setCreditLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">Remarks / Internal Notes</label>
            <input
              type="text"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Regular wholesale customer, verified documents"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-950"
            >
              <Check className="w-4 h-4" />
              <span>Save Party</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
