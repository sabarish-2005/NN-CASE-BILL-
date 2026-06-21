import { Linking } from 'react-native';
import { Bill, fmtCurrency, fmtDate } from '../utils';

export const whatsappService = {
  buildWhatsAppMessage(bill: Bill, companyName: string, companyPhone: string): string {
    const typeNames: Record<string, string> = {
      'dc': 'Delivery Challan',
      'cash': 'Cash Bill',
      'credit': 'Credit Bill',
      'gst': 'GST Invoice',
      'job': 'Job Work Bill',
    };
    
    const typeName = typeNames[bill.type] || 'Invoice';
    const custName = bill.custName || 'Customer';

    let msg = `Hello ${custName},\n\nPlease find your ${typeName} attached.\n\n`;
    msg += `Bill No: ${bill.billNo}\n`;
    msg += `Date: ${fmtDate(bill.date)}\n`;
    msg += `Amount: ₹${fmtCurrency(bill.total)}\n\n`;
    
    msg += `Items:\n`;
    for (const it of bill.items) {
      msg += `- ${it.description} x ${it.qty} = ₹${fmtCurrency(it.amount)}\n`;
    }
    
    msg += `\nTotal: ₹${fmtCurrency(bill.total)}\n`;
    msg += `(${bill.words})\n\n`;
    
    msg += `Thank You,\n${companyName}\n${companyPhone}`;

    return msg;
  },

  async openWhatsApp(phone: string, message: string): Promise<void> {
    const encodedMsg = encodeURIComponent(message);
    
    // Clean phone number: remove non-digits
    let cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    
    // If phone has 10 digits, assume India (+91)
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    let url = '';
    if (cleanPhone) {
      // Direct WhatsApp link
      url = `whatsapp://send?phone=${cleanPhone}&text=${encodedMsg}`;
    } else {
      // General WhatsApp link
      url = `whatsapp://send?text=${encodedMsg}`;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback to wa.me
        const fallbackUrl = cleanPhone 
          ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
          : `https://wa.me/?text=${encodedMsg}`;
        await Linking.openURL(fallbackUrl);
      }
    } catch (e) {
      console.warn('Could not open WhatsApp', e);
      throw new Error('Could not open WhatsApp. Make sure it is installed.');
    }
  }
};
