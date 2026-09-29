import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export class BarcodeService {
  public static renderBarcodeToCanvas(
    canvasElement: HTMLCanvasElement, 
    value: string, 
    format: 'CODE128' | 'EAN13' = 'CODE128',
    options?: { width?: number; height?: number; displayValue?: boolean }
  ) {
    try {
      JsBarcode(canvasElement, value, {
        format,
        width: options?.width || 1.8,
        height: options?.height || 50,
        displayValue: options?.displayValue ?? true,
        fontSize: 14,
        margin: 6,
        textMargin: 2,
      });
    } catch (e) {
      console.warn('JsBarcode render error:', e);
      // Fallback to Code128 if EAN13 length fails
      if (format === 'EAN13') {
        try {
          JsBarcode(canvasElement, value, {
            format: 'CODE128',
            width: options?.width || 1.8,
            height: options?.height || 50,
            displayValue: options?.displayValue ?? true,
          });
        } catch (err) {
          console.error('Barcode fallback error:', err);
        }
      }
    }
  }

  public static async generateQRCodeDataUrl(value: string): Promise<string> {
    try {
      return await QRCode.toDataURL(value, {
        width: 180,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (e) {
      console.error('QR code generation error:', e);
      return '';
    }
  }
}
