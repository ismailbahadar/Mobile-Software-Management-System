import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Barcode as BarcodeIcon, Printer, Download, Search, Check } from 'lucide-react';
import { storage } from '../../db/storage';
import { BarcodeService } from '../../services/barcodeService';

export const BarcodeGeneratorView: React.FC = () => {
  const db = storage.getDatabase();
  const settings = db.settings;

  const [selectedItemId, setSelectedItemId] = useState(db.items[0]?.id || '');
  const [barcodeValue, setBarcodeValue] = useState(db.items[0]?.barcode || '8806091234011');
  const [labelFormat, setLabelFormat] = useState<'CODE128' | 'EAN13' | 'QR'>('CODE128');
  const [labelSize, setLabelSize] = useState<'50x30mm' | '40x25mm' | '38x28mm'>('50x30mm');
  const [copies, setCopies] = useState(12);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const selectedItem = db.items.find(i => i.id === selectedItemId);

  useEffect(() => {
    if (selectedItem) {
      setBarcodeValue(selectedItem.barcode);
    }
  }, [selectedItemId]);

  useEffect(() => {
    if (labelFormat === 'QR') {
      BarcodeService.generateQRCodeDataUrl(barcodeValue).then(url => setQrDataUrl(url));
    } else if (canvasRef.current) {
      BarcodeService.renderBarcodeToCanvas(canvasRef.current, barcodeValue, labelFormat, {
        width: 1.6,
        height: 45,
        displayValue: true,
      });
    }
  }, [barcodeValue, labelFormat]);

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span>Barcode & QR Label Generator</span>
          </h2>
          <p className="text-xs text-slate-400">
            Generate printable thermal adhesive sticker sheets for mobile boxes and retail accessories
          </p>
        </div>

        <button
          onClick={handlePrintLabels}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-950"
        >
          <Printer className="w-4 h-4" />
          <span>Print Label Sheet ({copies} Stickers)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Configuration Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200">Label Configuration</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Select Product</label>
              <select
                value={selectedItemId}
                onChange={e => setSelectedItemId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                {db.items.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.brand} {i.model} ({i.color}) — ₨ {i.directPrice.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Barcode Value / Data</label>
              <input
                type="text"
                value={barcodeValue}
                onChange={e => setBarcodeValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Symbology Format</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['CODE128', 'EAN13', 'QR'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setLabelFormat(fmt)}
                    className={`py-1.5 text-center rounded-lg border font-semibold ${
                      labelFormat === fmt
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Adhesive Sticker Size</label>
              <select
                value={labelSize}
                onChange={e => setLabelSize(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100"
              >
                <option value="50x30mm">50 × 30 mm (Standard Mobile Box Sticker)</option>
                <option value="40x25mm">40 × 25 mm (Compact Sticker)</option>
                <option value="38x28mm">38 × 28 mm (Jewelry / Accessory Tag)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Copies to Print on Sheet</label>
              <input
                type="number"
                min="1"
                max="100"
                value={copies}
                onChange={e => setCopies(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Right: Printable Sheet Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <h3 className="font-bold text-sm text-slate-200">Printable Label Sheet Preview</h3>
            <span className="text-xs text-slate-400">Layout: {labelSize} • {copies} Labels</span>
          </div>

          <div
            id="printable-area"
            className="flex-1 overflow-y-auto p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-wrap gap-3 justify-center"
          >
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="w-[185px] bg-white text-black p-2 rounded border border-gray-300 shadow-sm flex flex-col items-center justify-between text-center select-none"
              >
                <div className="w-full text-center">
                  <div className="font-black text-[10px] uppercase truncate leading-tight tracking-tight">
                    {settings.businessName}
                  </div>
                  <div className="font-bold text-xs truncate mt-0.5">
                    {selectedItem?.brand} {selectedItem?.model}
                  </div>
                  <div className="text-[9px] text-gray-700">
                    {selectedItem?.color} • {selectedItem?.storage}
                  </div>
                </div>

                <div className="my-1 flex items-center justify-center">
                  {labelFormat === 'QR' ? (
                    <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
                  ) : (
                    <canvas ref={idx === 0 ? canvasRef : undefined} className="max-h-11" />
                  )}
                </div>

                <div className="w-full border-t border-gray-300 pt-0.5 flex justify-between items-center text-[10px] font-bold">
                  <span>Price:</span>
                  <span className="font-mono text-xs">₨ {selectedItem?.directPrice.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
