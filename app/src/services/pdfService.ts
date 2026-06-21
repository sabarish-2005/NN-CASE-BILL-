import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import { InvoiceTemplate } from '../templates/InvoiceTemplate';
import { Bill, UserSettings } from '../utils';

const INVOICES_DIR = FileSystem.documentDirectory + 'invoices/';

// Ensure directory exists
async function ensureDir() {
  const dirInfo = await FileSystem.getInfoAsync(INVOICES_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(INVOICES_DIR, { intermediates: true });
  }
}

function getPdfPath(billUuid: string) {
  return INVOICES_DIR + billUuid + '.pdf';
}

async function loadBase64Image(uri?: string): Promise<string | undefined> {
  if (!uri) return undefined;
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return undefined;
    return await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  } catch (e) {
    console.warn('Failed to load image for PDF:', e);
    return undefined;
  }
}

export const pdfService = {
  async getCachedPDF(billUuid: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    await ensureDir();
    const path = getPdfPath(billUuid);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
    return null;
  },

  async generateInvoicePDF(bill: Bill, settings: Partial<UserSettings>): Promise<string> {
    const path = getPdfPath(bill.uuid);

    // Read images (Skip file reading on Web/Electron for now)
    let logoBase64, sigBase64;
    if (Platform.OS !== 'web') {
      await ensureDir();
      logoBase64 = await loadBase64Image(settings.logoUri);
      sigBase64 = await loadBase64Image(settings.signatureUri);
    }

    const html = InvoiceTemplate(bill, settings, logoBase64, sigBase64);

    if (Platform.OS === 'web' && (window as any).electronAPI) {
      const res = await (window as any).electronAPI.generatePdf(html);
      if (res.success) return res.uri;
      throw new Error(res.error);
    } else if (Platform.OS === 'web') {
      return html; // Fallback for pure web
    }

    const { uri } = await Print.printToFileAsync({
      html,
      width: 595,
      height: 842
    });

    await FileSystem.moveAsync({
      from: uri,
      to: path
    });

    return path;
  },

  async printInvoice(bill: Bill, settings: Partial<UserSettings>): Promise<void> {
    if (Platform.OS === 'web') return;
    let pdfUri = await this.getCachedPDF(bill.uuid);
    if (!pdfUri) {
      pdfUri = await this.generateInvoicePDF(bill, settings);
    }
    
    await Print.printAsync({ uri: pdfUri });
  },

  async savePDFToDownloads(bill: Bill, settings: Partial<UserSettings>): Promise<void> {
    if (Platform.OS === 'web') return;
    let pdfUri = await this.getCachedPDF(bill.uuid);
    if (!pdfUri) {
      pdfUri = await this.generateInvoicePDF(bill, settings);
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Permission required to save to Downloads');
    }

    const asset = await MediaLibrary.createAssetAsync(pdfUri);
    await MediaLibrary.createAlbumAsync('Download', asset, false);
  },

  async shareViaWhatsApp(bill: Bill, settings: Partial<UserSettings>): Promise<void> {
    if (Platform.OS === 'web') return;
    let pdfUri = await this.getCachedPDF(bill.uuid);
    if (!pdfUri) {
      pdfUri = await this.generateInvoicePDF(bill, settings);
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Sharing is not available on this device');
    }

    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: `Share Invoice - ${bill.billNo}`,
    });
  },

  async openPDF(billUuid: string): Promise<void> {
     if (Platform.OS === 'web') return;
     const path = await this.getCachedPDF(billUuid);
     if (path) {
         await Sharing.shareAsync(path, { mimeType: 'application/pdf' });
     } else {
         throw new Error("PDF not found. Please generate it first.");
     }
  },

  async deleteOldPDFs(keepDays: number = 30): Promise<void> {
    if (Platform.OS === 'web') return;
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(INVOICES_DIR);
    const now = Date.now();
    const cutoff = keepDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const path = INVOICES_DIR + file;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists && info.modificationTime) {
        // modificationTime is in seconds
        const modTimeMs = info.modificationTime * 1000;
        if (now - modTimeMs > cutoff) {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
      }
    }
  },

  async getPDFStorageSize(): Promise<string> {
    if (Platform.OS === 'web') return '0 B';
    await ensureDir();
    const files = await FileSystem.readDirectoryAsync(INVOICES_DIR);
    let totalBytes = 0;
    
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(INVOICES_DIR + file);
      if (info.exists && info.size) {
        totalBytes += info.size;
      }
    }

    if (totalBytes < 1024) return totalBytes + ' B';
    else if (totalBytes < 1024 * 1024) return (totalBytes / 1024).toFixed(1) + ' KB';
    else return (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
};
