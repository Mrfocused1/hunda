// Site gate - redirects to coming-soon page unless authenticated
(function () {
    var path = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    // Don't gate the coming-soon page itself
    if (path === '/coming-soon') return;
    // Don't gate admin pages
    if (path.indexOf('/admin') === 0) return;

    var authenticated = sessionStorage.getItem('1hundred_gate_auth') === 'granted';
    if (!authenticated) {
        window.location.replace('/coming-soon');
    }
})();
