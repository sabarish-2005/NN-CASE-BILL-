const ONES = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

function toWords(n) {
  if (!n) return '';
  if (n < 20) return ONES[n] + ' ';
  let r = '';
  if (n >= 10000000) { r += toWords(Math.floor(n/10000000)) + 'Crore '; n %= 10000000; }
  if (n >= 100000)   { r += toWords(Math.floor(n/100000))   + 'Lakh ';  n %= 100000; }
  if (n >= 1000)     { r += toWords(Math.floor(n/1000))     + 'Thousand '; n %= 1000; }
  if (n >= 100)      { r += ONES[Math.floor(n/100)]         + ' Hundred '; n %= 100; }
  if (n >= 20)       { r += TENS[Math.floor(n/10)]          + ' '; n %= 10; }
  if (n > 0)           r += ONES[n] + ' ';
  return r;
}

module.exports = function numberToWords(num) {
  const n = Math.abs(parseFloat(num) || 0);
  const ip = Math.floor(n);
  const dp = Math.round((n - ip) * 100);
  let w = ip === 0 ? 'Zero' : toWords(ip).trim();
  if (dp > 0) w += ' and ' + toWords(dp).trim() + ' Paise';
  return 'Rupees ' + w + ' Only';
};
