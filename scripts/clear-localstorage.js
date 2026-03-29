// Clear All 1Hundred Data from localStorage
// Run this in browser console (F12) to completely clear all stored data

(function clearAllData() {
    const keysToRemove = [
        '1hundred_products',
        '1hundred_orders',
        '1hundred_customers',
        '1hundred_email_settings',
        '1hundred_email_templates',
        '1hundred_email_activity',
        '1hundred_store_content',
        'cart',
        'orders',
        'addresses'
    ];

    console.log('🔍 Checking localStorage for 1Hundred data...\n');

    let foundData = false;
    keysToRemove.forEach((key) => {
        const data = localStorage.getItem(key);
        if (data) {
            foundData = true;
            const parsed = JSON.parse(data);
            const count = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
            console.log(`❌ Found: ${key} (${count} items)`);
            localStorage.removeItem(key);
            console.log(`✅ Deleted: ${key}\n`);
        }
    });

    if (!foundData) {
        console.log('✅ No 1Hundred data found in localStorage');
    } else {
        console.log('\n🎉 All data cleared successfully!');
        console.log('🔄 Reload the page to see empty states');
    }

    // Show remaining localStorage (non-1hundred)
    const remaining = Object.keys(localStorage).filter((key) => !keysToRemove.includes(key));
    if (remaining.length > 0) {
        console.log('\n📋 Other localStorage keys (not cleared):', remaining);
    }
})();
