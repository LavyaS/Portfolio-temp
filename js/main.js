/* ==========================================================================
   main.js — progressive enhancement bootstrap & small site-wide utilities
   ========================================================================== */
(function () {
	'use strict';

	/* Keep the footer year current without hardcoding it */
	var yearEl = document.getElementById('footer-year');
	if (yearEl) {
		yearEl.textContent = String(new Date().getFullYear());
	}

	/* Sticky header height is used by CSS scroll-margin on sections;
	   keep it in sync in case the browser's font settings change its rendered height. */
	function syncHeaderHeight() {
		var header = document.getElementById('site-header');
		if (!header) return;
		var height = header.offsetHeight;
		if (height) {
			document.documentElement.style.setProperty('--header-h', height + 'px');
		}
	}
	syncHeaderHeight();
	window.addEventListener('resize', syncHeaderHeight, { passive: true });
})();
