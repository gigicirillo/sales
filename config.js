// Google Apps Script Web App endpoint for Sales Daily.
window.SALES_APP_CONFIG = {
  GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbzSrMu96NeJENEcXlrsmcR4pDeLwxVmiwks0R7k1_H-vUh3M9TiQpe5ix8IjWAolyfzbQ/exec"
};

const passVoucherScript=document.createElement('script');
passVoucherScript.src='pass-vouchers.js?v=20260828-0010';
document.head.appendChild(passVoucherScript);