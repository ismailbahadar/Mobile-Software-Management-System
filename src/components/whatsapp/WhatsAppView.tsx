import React, { useState, useEffect } from 'react';
import {
  MessageSquare, QrCode, CheckCircle2, AlertCircle, RefreshCw,
  Send, Save, Phone, Clock, FileText, CheckCheck, Power
} from 'lucide-react';
import { storage } from '../../db/storage';
import { WhatsAppService } from '../../services/whatsappService';
import { BarcodeService } from '../../services/barcodeService';
import { useToast } from '../common/Toast';

export const WhatsAppView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;
  const wa = settings.whatsapp;

  const [status, setStatus] = useState(wa.status);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'connection' | 'templates' | 'logs'>('connection');

  // Test Message
  const [testPhone, setTestPhone] = useState('0300-1234567');
  const [testMessage, setTestMessage] = useState('Hello! This is a test message from Apex Mobile POS WhatsApp Gateway.');

  // Templates
  const [templates, setTemplates] = useState({ ...wa.templates });

  useEffect(() => {
    // Generate pairing QR code for scanning
    const pairingPayload = `WAPAIR:APEX-POS-${Date.now()}-TOKEN-${Math.random().toString(36).substr(2, 8)}`;
    BarcodeService.generateQRCodeDataUrl(pairingPayload).then(url => setQrCodeUrl(url));
  }, [status]);

  const handleSimulateScanPair = () => {
    setStatus('Connecting');
    showToast('Pairing with WhatsApp session...', 'info');
    setTimeout(() => {
      setStatus('Connected');
      storage.updateSettings({
        whatsapp: {
          ...wa,
          status: 'Connected',
          isConnected: true,
          accountName: 'Apex Mobile City Official',
          phoneNumber: '+92 300 1234567',
        }
      });
      showToast('WhatsApp connected successfully!', 'success');
    }, 1500);
  };

  const handleDisconnect = () => {
    setStatus('Disconnected');
    storage.updateSettings({
      whatsapp: {
        ...wa,
        status: 'Disconnected',
        isConnected: false,
      }
    });
    showToast('WhatsApp session disconnected', 'info');
  };

  const handleSaveTemplates = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings({
      whatsapp: {
        ...wa,
        templates,
      }
    });
    showToast('WhatsApp message templates updated!', 'success');
  };

  const handleSendTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      showToast('Enter phone number and message', 'error');
      return;
    }

    const res = WhatsAppService.sendMessage(
      testPhone,
      'Test Recipient',
      'Custom',
      testMessage
    );

    showToast('Test message dispatched successfully!', 'success');
    if (window.confirm('Open native WhatsApp to send message directly as well?')) {
      window.open(res.waLink, '_blank');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>Integrated WhatsApp Business Gateway</span>
          </h2>
          <p className="text-xs text-slate-400">
            Send real-time invoices, receipts, and installment overdue reminders directly to customer phones
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
              status === 'Connected'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : status === 'Connecting'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${status === 'Connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span>Status: {status}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('connection')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'connection' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Session Connection & QR
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'templates' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Message Templates
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Dispatched Message Logs ({db.whatsappMessages.length})
        </button>
      </div>

      {/* TAB 1: CONNECTION */}
      {activeTab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in">
          {/* Left: QR Pairing Screen */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col items-center text-center space-y-4">
            <h3 className="font-bold text-sm text-slate-200">Connect WhatsApp Web Session</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Open WhatsApp on your mobile phone &gt; Settings &gt; Linked Devices &gt; Scan this QR code.
            </p>

            <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-700">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-400">Loading QR...</div>
              )}
            </div>

            <div className="flex gap-2">
              {status !== 'Connected' ? (
                <button
                  type="button"
                  onClick={handleSimulateScanPair}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connect / Link Device</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950"
                >
                  <Power className="w-4 h-4" />
                  <span>Disconnect Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Test Message Dispatcher */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Send Test Message</span>
            </h3>

            <form onSubmit={handleSendTest} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Recipient Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="e.g. 0300-1234567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Message Body *</label>
                <textarea
                  rows={4}
                  required
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp Message</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATES */}
      {activeTab === 'templates' && (
        <form onSubmit={handleSaveTemplates} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 animate-in fade-in text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-200">Configurable Notification Templates</h3>
              <p className="text-slate-400 text-xs">
                Use placeholders like <code className="text-emerald-400">{`{customer_name}`}</code>, <code className="text-emerald-400">{`{invoice_no}`}</code>, <code className="text-emerald-400">{`{total}`}</code>, <code className="text-emerald-400">{`{due_date}`}</code>
              </p>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Templates</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Sale Invoice Template</label>
              <textarea
                rows={4}
                value={templates.saleInvoice}
                onChange={e => setTemplates({ ...templates, saleInvoice: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Installment Due Reminder Template</label>
              <textarea
                rows={4}
                value={templates.installmentReminder}
                onChange={e => setTemplates({ ...templates, installmentReminder: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Installment Payment Receipt Template</label>
              <textarea
                rows={4}
                value={templates.installmentReceipt}
                onChange={e => setTemplates({ ...templates, installmentReceipt: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Outstanding Balance Alert Template</label>
              <textarea
                rows={4}
                value={templates.outstandingBalance}
                onChange={e => setTemplates({ ...templates, outstandingBalance: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Section R: Repair Customer Notification Templates */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-cyan-400">
              Mobile Repair Notification Templates (Section R)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repair Received</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.received}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      received: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Diagnosis Completed & Approval</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.diagnosisCompleted}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      diagnosisCompleted: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Waiting for Spare Parts</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.waitingForParts}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      waitingForParts: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repair in Progress</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.inProgress}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      inProgress: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ready for Collection</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.readyForCollection}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      readyForCollection: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Repair Delivered & Warranty</label>
                <textarea
                  rows={4}
                  value={settings.repairs?.whatsappTemplates?.delivered}
                  onChange={e => storage.updateRepairSettings({
                    whatsappTemplates: {
                      ...settings.repairs.whatsappTemplates,
                      delivered: e.target.value,
                    }
                  })}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Message Preview</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {db.whatsappMessages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No WhatsApp messages logged yet.
                    </td>
                  </tr>
                ) : (
                  db.whatsappMessages.map(msg => (
                    <tr key={msg.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-slate-400 font-mono">{msg.timestamp}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">{msg.recipientName}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400">{msg.recipientPhone}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {msg.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 max-w-sm truncate">{msg.body}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{msg.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
