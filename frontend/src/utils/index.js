// ── Number to Words (Indian) ─────────────────────
const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
function _tw(n) {
  if (!n) return ''
  if (n < 20) return ONES[n] + ' '
  let r = ''
  if (n >= 10000000) { r += _tw(Math.floor(n/10000000)) + 'Crore ';   n %= 10000000 }
  if (n >= 100000)   { r += _tw(Math.floor(n/100000))   + 'Lakh ';    n %= 100000   }
  if (n >= 1000)     { r += _tw(Math.floor(n/1000))     + 'Thousand ';n %= 1000     }
  if (n >= 100)      { r += ONES[Math.floor(n/100)]     + ' Hundred ';n %= 100      }
  if (n >= 20)       { r += TENS[Math.floor(n/10)]      + ' ';        n %= 10       }
  if (n > 0)           r += ONES[n] + ' '
  return r
}
export function numberToWords(num) {
  const n = Math.abs(parseFloat(num) || 0)
  const ip = Math.floor(n), dp = Math.round((n - ip) * 100)
  let w = ip === 0 ? 'Zero' : _tw(ip).trim()
  if (dp > 0) w += ' and ' + _tw(dp).trim() + ' Paise'
  return 'Rupees ' + w + ' Only'
}

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import api from '../services/api'

// ── Formatting ───────────────────────────────────
export const fmtCurrency = (n, decimals=2) =>
  parseFloat(n||0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

export const fmtCurrencyShort = (n) =>
  parseFloat(n||0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const fmtDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' })
}

export const fmtDateLong = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
}

export const today = () => new Date().toISOString().split('T')[0]

export const getFY = () => {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth()
  const s = m >= 3 ? y : y - 1
  return `${s}-${(s+1).toString().slice(-2)}`
}

// ── Bill Types ───────────────────────────────────
export const BILL_TYPES = {
  dc:  { label:'Delivery Challan', short:'DC',   prefix:'DC',  color:'#2563eb', bg:'#eff6ff', dark:'#1e3a8a' },
  cb:  { label:'Case Bill',        short:'CASE',  prefix:'CB',  color:'#16a34a', bg:'#f0fdf4', dark:'#14532d' },
  cr:  { label:'Credit Bill',      short:'CR',   prefix:'CR',  color:'#d97706', bg:'#fffbeb', dark:'#78350f' },
  gst: { label:'GST Invoice',      short:'GST',  prefix:'GST', color:'#9333ea', bg:'#f5f3ff', dark:'#4c1d95' },
  jw:  { label:'Job Work Bill',    short:'JW',   prefix:'JW',  color:'#dc2626', bg:'#fff1f2', dark:'#7f1d1d' },
}

export const TRANSPORT = ['By Hand','By Vehicle','By Two Wheeler','By Auto','By Courier','By Lorry','By Train']
export const UNITS = ['Nos','Kg','Meter','Feet','Inch','Bundle','Roll','Set','Ltr','Box','Bag','Hour','Pcs','Dozen']
export const GST_RATES = [0, 5, 12, 18, 28]
export const CATEGORIES = ['Grow Bag','Open Top Cover','Cutting','Labour','Other','General']
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export const CO = {
  name:  'NACHIMUTHU NATRAYAN',
  sub:   'SABARISH JOB WORKS',
  tag:   'Grow Bag & Open Top Cover Cutting',
  owner: 'SABARISH', role: 'Proprietor',
  addr:  '2/206, Bus Stand Near, Selakkarichal, Sulur',
  pin:   '641658', city: 'Coimbatore, Tamil Nadu',
  phone: '9043695759', stateCode: '33', state: 'Tamil Nadu',
}

// ── Bill Calculations ────────────────────────────
export function calcItem(qty, rate) {
  return parseFloat((parseFloat(qty||0) * parseFloat(rate||0)).toFixed(2))
}

export function calcBillTotals(items, billType, globalGstRate=0) {
  const processedItems = (items||[]).map(it => {
    const taxable = calcItem(it.qty, it.rate)
    const gr = billType === 'gst' ? (parseFloat(it.gstRate||0) || globalGstRate) : 0
    const cgst = gr ? parseFloat((taxable * gr / 200).toFixed(2)) : 0
    const sgst = cgst
    const amt  = parseFloat((taxable + cgst + sgst).toFixed(2))
    return { ...it, taxable, cgst, sgst, amt }
  })
  const subtotal  = parseFloat(processedItems.reduce((s,i) => s + i.taxable, 0).toFixed(2))
  const cgstTotal = parseFloat(processedItems.reduce((s,i) => s + i.cgst, 0).toFixed(2))
  const sgstTotal = parseFloat(processedItems.reduce((s,i) => s + i.sgst, 0).toFixed(2))
  const gstTotal  = parseFloat((cgstTotal + sgstTotal).toFixed(2))
  const rawTotal  = parseFloat((subtotal + gstTotal).toFixed(2))
  const roundOff  = parseFloat((Math.round(rawTotal) - rawTotal).toFixed(2))
  const total     = parseFloat((rawTotal + roundOff).toFixed(2))
  return { items: processedItems, subtotal, cgstTotal, sgstTotal, gstTotal, roundOff, total, words: numberToWords(total) }
}

// ── Download helpers ─────────────────────────────
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export async function shareWhatsApp(bill, settings={}) {
  const bt = BILL_TYPES[bill.type] || BILL_TYPES.dc
  try {
    const html = renderBillHTML(bill, settings)
    const wrap = document.createElement('div')
    wrap.style.position = 'fixed'
    wrap.style.left = '-9999px'
    wrap.style.top = '0'
    wrap.innerHTML = html
    document.body.appendChild(wrap)

    const canvas = await html2canvas(wrap, { scale: 2 })
    const imgData = canvas.toDataURL('image/jpeg', 1.0)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgProps = pdf.getImageProperties(imgData)
    const imgWidth = pageWidth
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)

    const blob = pdf.output('blob')
    document.body.removeChild(wrap)

    const form = new FormData()
    form.append('file', blob, `${bill.billNo || 'bill'}.pdf`)
    const res = await api.post('/export/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    const data = res.data || res
    const url = data.url

    const msg = `⚜ *${CO.name}*\n*${CO.sub}*\n📄 ${bt.label} · Bill ${bill.billNo} · ₹${fmtCurrency(bill.total)}\nDownload: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    return
  } catch (e) {
    const msg = `⚜ *${CO.name}*\n*${CO.sub}*\n${'─'.repeat(24)}\n📄 ${bt.label}\n🔢 Bill No: ${bill.billNo}\n📅 Date: ${fmtDate(bill.date)}\n👤 Customer: ${bill.custName||'Walk-in'}\n${'─'.repeat(24)}\n💰 *Total: ₹${fmtCurrency(bill.total)}*\n${bill.words||numberToWords(bill.total)}\n${'─'.repeat(24)}\n📞 ${CO.phone}\n📍 ${CO.addr}, Sulur - ${CO.pin}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }
}

export function printBillDocument(html) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'

  iframe.srcdoc = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${CO.name} - Bill Print</title>
        <style>
          @page { size: A4 portrait; margin: 6mm; }
          html, body { margin: 0; padding: 0; background: #fff; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `

  const cleanup = () => {
    setTimeout(() => iframe.remove(), 1000)
  }

  iframe.addEventListener('load', () => {
    const frameWindow = iframe.contentWindow
    if (!frameWindow) {
      cleanup()
      return
    }
    frameWindow.focus()
    setTimeout(() => {
      frameWindow.print()
      cleanup()
    }, 150)
  }, { once: true })

  document.body.appendChild(iframe)
}

export const uid = () => Math.random().toString(36).slice(2,8) + Date.now().toString(36)
