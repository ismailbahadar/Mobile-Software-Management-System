import React, { useState } from 'react';
import { Printer, Save, Check, FileText, QrCode } from 'lucide-react';
import { storage } from '../../db/storage';
import { ThermalPrinterConfig } from '../../types';
import { useToast } from '../common/Toast';

export const ThermalPrinterSettingsView: React.FC = () => {
  const { showToast } = useToast();
  const db = storage.getDatabase();
  const settings = db.settings;

  const [config, setConfig] = useState<ThermalPrinterConfig>({ ...settings.printer });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings({ printer: config });
    showToast('Thermal printer preferences saved successfully!', 'success');
  };

  const handleTestPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <span>Thermal POS Printer Configuration (58mm / 80mm)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure POS roll paper size, header, policy footer notes, and auto-cut commands
          </p>
        </div>

        <button
          onClick={handleTestPrint}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950"
        >
          <Printer className="w-4 h-4" />
          <span>Execute Test Print</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl text-xs">
          <h3 className="font-bold text-sm text-slate-200">Hardware & Paper Options</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Thermal Paper Roll Width</label>
              <div className="grid grid-cols-2 gap-2">
                {(['80mm', '58mm'] as const).map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setConfig({ ...config, paperWidth: w })}
                    className={`py-2 text-center rounded-lg border font-bold transition-all ${
                      config.paperWidth === w
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {w} Width
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Font Sizing</label>
              <select
                value={config.fontSize}
                onChange={e => setConfig({ ...config, fontSize: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="Small">Small (Compact font)</option>
                <option value="Medium">Medium (Recommended)</option>
                <option value="Large">Large (High visibility)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Shop Receipt Title Header</label>
            <input
              type="text"
              value={config.shopHeader}
              onChange={e => setConfig({ ...config, shopHeader: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 uppercase font-bold"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Shop Sub-Header / Branches / Contact</label>
            <textarea
              rows={2}
              value={config.shopSubHeader}
              onChange={e => setConfig({ ...config, shopSubHeader: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold">Receipt Footer Warranty & Legal Policy</label>
            <textarea
              rows={3}
              value={config.footerNotes}
              onChange={e => setConfig({ ...config, footerNotes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={config.showBarcode}
                onChange={e => setConfig({ ...config, showBarcode: e.target.checked })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span>Print Barcode at Bottom</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={config.autoCut}
                onChange={e => setConfig({ ...config, autoCut: e.target.checked })}
                className="rounded border-slate-700 text-emerald-600 focus:ring-0"
              />
              <span>Send Auto-Cut Command</span>
            </label>
          </div>

          {/* Bottom Empty Feed Lines to prevent paper cutter from slicing invoice text */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-200 font-bold">Bottom Empty Lines (Paper Cutter Clearance)</label>
                <p className="text-[11px] text-slate-400">
                  Adds empty feed spacer lines after the invoice ends so thermal paper cutter doesn't cut through text, barcode, or footer notes.
                </p>
              </div>
              <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/40">
                {config.bottomFeedLines ?? 5} Lines
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {[3, 4, 5, 6, 8, 10].map(lines => (
                <button
                  key={lines}
                  type="button"
                  onClick={() => setConfig({ ...config, bottomFeedLines: lines })}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    (config.bottomFeedLines ?? 5) === lines
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {lines} Lines
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-950"
            >
              <Save className="w-4 h-4" />
              <span>Save Printer Setup</span>
            </button>
          </div>
        </form>

        {/* Live Thermal Receipt Simulator */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col items-center">
          <h3 className="font-bold text-sm text-slate-200 mb-3">Live Receipt Layout Preview</h3>

          <div
            id="printable-area"
            className={`bg-white text-black p-4 rounded-lg shadow-2xl transition-all ${
              config.paperWidth === '80mm'
                ? 'receipt-80mm w-[300px] text-xs'
                : 'receipt-58mm w-[230px] text-[10px]'
            }`}
          >
            <div className="text-center pb-2 border-b border-gray-300 mb-2">
              <h4 className="font-black text-xs uppercase">{config.shopHeader}</h4>
              <p className="text-[10px] text-gray-700 whitespace-pre-line mt-0.5">{config.shopSubHeader}</p>
            </div>

            <div className="text-[10px] space-y-0.5 mb-2">
              <div className="flex justify-between">
                <span>Inv: <strong className="font-mono">INV-2026-1001</strong></span>
                <span>29/09/2026 04:30 PM</span>
              </div>
              <div className="flex justify-between">
                <span>Customer: Muhammad Rizwan</span>
                <span>Type: Cash</span>
              </div>
            </div>

            <table className="w-full border-t border-b border-gray-300 text-[10px] my-1">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="py-0.5 text-left">Item</th>
                  <th className="py-0.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">
                    Samsung Galaxy A15
                    <div className="text-[9px] font-mono text-gray-600">IMEI: 861234050198235</div>
                  </td>
                  <td className="py-1 text-right font-mono">₨ 52,000</td>
                </tr>
              </tbody>
            </table>

            <div className="text-[10px] space-y-0.5 pt-1">
              <div className="flex justify-between font-bold">
                <span>Total Amount:</span>
                <span className="font-mono">₨ 52,000</span>
              </div>
              <div className="flex justify-between">
                <span>Paid (Cash):</span>
                <span className="font-mono text-emerald-800">₨ 52,000</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="font-mono">₨ 0</span>
              </div>
            </div>

            <div className="text-center pt-2 mt-2 border-t border-dashed border-gray-300">
              {config.showBarcode && (
                <div className="font-mono text-[9px] tracking-widest text-center py-1 bg-gray-100 rounded">
                  * INV-2026-1001 *
                </div>
              )}
              <p className="text-[9px] text-gray-600 whitespace-pre-line mt-1">{config.footerNotes}</p>
            </div>

            {/* Empty feed lines simulation */}
            <div className="invoice-feed-lines mt-2 pt-1 text-center select-none">
              {Array.from({ length: config.bottomFeedLines ?? 5 }).map((_, idx) => (
                <div key={idx} className="h-3.5 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
              ))}
              <div className="border-t border-dashed border-gray-400 my-1 text-[8px] font-mono tracking-widest text-gray-400 flex items-center justify-center gap-1">
                <span>✂</span>
                <span>- - - - - - AUTO CUTTER LINE - - - - - -</span>
              </div>
              <div className="h-2 leading-none text-transparent select-none pointer-events-none">&nbsp;</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
