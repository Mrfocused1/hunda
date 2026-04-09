// Site gate - redirects to coming-soon page unless authenticated
(function () {
    // Don't gate the coming-soon page itself
    if (window.location.pathname === '/coming-soon' || window.location.pathname === '/coming-soon.html') return;
    // Don't gate admin pages
    if (window.location.pathname.startsWith('/admin')) return;

    var authenticated = sessionStorage.getItem('1hundred_gate_auth') === 'granted';
    if (!authenticated) {
        window.location.replace('/coming-soon.html');
    }
})();
