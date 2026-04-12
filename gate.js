// Site gate — redirects to coming-soon page unless:
//   (a) the admin has toggled coming_soon_enabled OFF in the dashboard, OR
//   (b) the visitor has a valid staff-login token in sessionStorage.
//
// On first load each session, gate.js fetches the toggle value from Supabase
// and caches it in sessionStorage so subsequent navigations are instant.
(function () {
    var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (path === '/coming-soon') return;
    if (path.indexOf('/admin') === 0) return;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

    // --- Check if the coming-soon gate is even enabled ---
    var CACHE_KEY = '_gate_coming_soon';
    var cached = sessionStorage.getItem(CACHE_KEY);

    if (cached === 'off') return; // admin turned the gate off — site is open

    if (cached === null) {
        // First visit this session — fetch the setting from Supabase (non-blocking).
        // Hide the page while we check so there's no flash of content.
        document.documentElement.style.visibility = 'hidden';

        var SUPABASE_URL = 'https://keaxchpeotydepqwjooh.supabase.co';
        var ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlYXhjaHBlb3R5ZGVwcXdqb29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NTQwNDEsImV4cCI6MjA5MTUzMDA0MX0.Uu-s2iUhzXTE3LeSfyA0XSVbQaFHY124AGrrN79BFRg';

        var xhr = new XMLHttpRequest();
        xhr.open('GET', SUPABASE_URL + '/rest/v1/site_settings?key=eq.coming_soon_enabled&select=value', true);
        xhr.setRequestHeader('apikey', ANON_KEY);
        xhr.timeout = 3000;

        xhr.onload = function () {
            try {
                var rows = JSON.parse(xhr.responseText);
                if (rows && rows.length > 0 && rows[0].value === false) {
                    sessionStorage.setItem(CACHE_KEY, 'off');
                    document.documentElement.style.visibility = '';
                    return; // gate is off — let the page through
                }
            } catch (e) { /* parse error — treat as gate ON */ }

            sessionStorage.setItem(CACHE_KEY, 'on');
            checkStaffAuth();
        };

        xhr.onerror = xhr.ontimeout = function () {
            sessionStorage.setItem(CACHE_KEY, 'on');
            checkStaffAuth();
        };

        xhr.send();
        return; // async — the callbacks above handle the rest
    }

    // cached === 'on' — gate is active, check staff auth
    checkStaffAuth();

    function checkStaffAuth() {
        var MAX_AGE = 4 * 60 * 60 * 1000;
        var raw = sessionStorage.getItem('1hundred_gate_auth');
        var authenticated = false;

        if (raw) {
            try {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.t && (Date.now() - parsed.t) < MAX_AGE) {
                    authenticated = true;
                }
            } catch (e) {
                if (raw === 'granted') {
                    sessionStorage.setItem('1hundred_gate_auth', JSON.stringify({ t: Date.now() }));
                    authenticated = true;
                }
            }
        }

        if (authenticated) {
            document.documentElement.style.visibility = '';
        } else {
            window.location.replace('/coming-soon');
        }
    }
})();
