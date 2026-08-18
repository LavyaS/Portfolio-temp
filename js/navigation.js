/* ==========================================================================
   navigation.js — sticky header state, mobile menu, active-link tracking
   ========================================================================== */
(function () {
	'use strict';

	var header = document.getElementById('site-header');
	var toggle = document.getElementById('nav-toggle');
	var menu = document.getElementById('nav-menu');
	var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav-link]'));

	/* ---- Sticky header background on scroll ---- */
	function updateHeaderState() {
		if (!header) return;
		if (window.scrollY > 8) {
			header.classList.add('is-scrolled');
		} else {
			header.classList.remove('is-scrolled');
		}
	}
	updateHeaderState();
	window.addEventListener('scroll', updateHeaderState, { passive: true });

	/* ---- Mobile menu open/close ---- */
	function openMenu() {
		menu.classList.add('is-open');
		toggle.setAttribute('aria-expanded', 'true');
		document.body.classList.add('nav-open');
		var firstLink = menu.querySelector('.nav__link');
		if (firstLink) firstLink.focus({ preventScroll: true });
	}

	function closeMenu(returnFocus) {
		menu.classList.remove('is-open');
		toggle.setAttribute('aria-expanded', 'false');
		document.body.classList.remove('nav-open');
		if (returnFocus) toggle.focus();
	}

	function isMenuOpen() {
		return menu.classList.contains('is-open');
	}

	if (toggle && menu) {
		toggle.addEventListener('click', function () {
			if (isMenuOpen()) {
				closeMenu(false);
			} else {
				openMenu();
			}
		});

		navLinks.forEach(function (link) {
			link.addEventListener('click', function () {
				if (isMenuOpen()) closeMenu(false);
			});
		});

		document.addEventListener('keydown', function (event) {
			if (event.key === 'Escape' && isMenuOpen()) {
				closeMenu(true);
			}
		});

		/* Close the mobile menu automatically if the viewport grows past the breakpoint */
		var mobileQuery = window.matchMedia('(min-width: 900px)');
		function handleBreakpointChange(event) {
			if (event.matches && isMenuOpen()) {
				closeMenu(false);
			}
		}
		if (mobileQuery.addEventListener) {
			mobileQuery.addEventListener('change', handleBreakpointChange);
		}
	}

	/* ---- Active section tracking ---- */
	var sectionIds = navLinks
		.map(function (link) { return link.getAttribute('href'); })
		.filter(function (href) { return href && href.charAt(0) === '#'; });

	var sections = sectionIds
		.map(function (id) { return document.querySelector(id); })
		.filter(Boolean);

	function setActiveLink(id) {
		navLinks.forEach(function (link) {
			var isActive = link.getAttribute('href') === '#' + id;
			link.classList.toggle('is-active', isActive);
			if (isActive) {
				link.setAttribute('aria-current', 'true');
			} else {
				link.removeAttribute('aria-current');
			}
		});
	}

	if ('IntersectionObserver' in window && sections.length) {
		var observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						setActiveLink(entry.target.id);
					}
				});
			},
			{
				rootMargin: '-45% 0px -50% 0px',
				threshold: 0
			}
		);
		sections.forEach(function (section) { observer.observe(section); });
	}
})();
