/**
 * ExtPay Content Script
 * Required for onPaid callbacks to work
 * This script runs on extensionpay.com pages
 */

// Import ExtPay to enable onPaid callbacks
// The extpay package will be bundled by WXT
import 'extpay';

export default defineUnlistedScript({
  matches: ['https://extensionpay.com/*'],
  main() {
    console.log('[ExtPay Content Script] Loaded on extensionpay.com');
  }
});

