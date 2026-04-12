// Site gate - redirects to coming-soon page unless authenticated.
// Uses a timestamped token so the gate auto-expires after 4 hours.
(function () {
    var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/coming-soon') return;
    if (path.indexOf('/admin') === 0) return;

    var MAX_AGE = 4 * 60 * 60 * 1000; // 4 hours
    var raw = sessionStorage.getItem('1hundred_gate_auth');
    var authenticated = false;

    if (raw) {
        try {
            // New format: { t: timestamp }
            var parsed = JSON.parse(raw);
            if (parsed && parsed.t && (Date.now() - parsed.t) < MAX_AGE) {
                authenticated = true;
            }
        } catch (e) {
            // Legacy format: plain string 'granted' — accept once then upgrade
            if (raw === 'granted') {
                sessionStorage.setItem('1hundred_gate_auth', JSON.stringify({ t: Date.now() }));
                authenticated = true;
            }
        }
    }

    if (!authenticated) {
        window.location.replace('/coming-soon');
    }
})();
