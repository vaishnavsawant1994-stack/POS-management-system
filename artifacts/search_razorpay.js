const fs = require('fs');
const content = fs.readFileSync('c:/Users/HP/OneDrive/Desktop/POS_Inventory/POS/frontend/src/pages/CashierDashboard.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('isProcessingRazorpay') || line.includes('handleRazorpayCheckout') || line.includes('Utensils')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
